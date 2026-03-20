#!/usr/bin/env python3
"""
Postfix pipe script: receives raw email from stdin and stores it in SQLite.

Postfix Configuration (in /etc/postfix/main.cf):
    virtual_alias_maps = regexp:/etc/postfix/virtual
    
In /etc/postfix/virtual:
    /.*@vredobox\.cc/   catchall@localhost

In /etc/aliases:
    catchall: "| /var/www/TempyMail/backend/venv/bin/python /var/www/TempyMail/backend/receive_email.py"

Then run: sudo newaliases && sudo systemctl reload postfix
"""

import sys
import email
import uuid
import sqlite3
import os
import smtplib
import json
import base64
from email import policy
from email.parser import BytesParser
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from urllib import request as urllib_request

# Database path (same as services/database.py)
DB_PATH = os.path.join(os.path.dirname(__file__), "emails.db")

# Premium inbox lifetime (7 days), free (1 hour)
PREMIUM_LIFETIME_HOURS = 168  # 7 days
FREE_LIFETIME_HOURS = 1


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def is_premium_address(conn, address):
    """Check if an email address belongs to a premium user (via alias or registered inbox)."""
    address_lower = address.lower()
    
    # Check custom aliases
    local_part = address_lower.split("@")[0] if "@" in address_lower else ""
    alias_user = conn.execute(
        "SELECT email, forward_to, webhook_url FROM premium_users WHERE custom_alias = ? AND is_active = 1",
        (local_part,)
    ).fetchone()
    if alias_user:
        return alias_user
    
    # Check registered inboxes
    inbox = conn.execute(
        "SELECT user_email FROM user_inboxes WHERE address = ? AND is_active = 1",
        (address_lower,)
    ).fetchone()
    if inbox:
        premium_user = conn.execute(
            "SELECT email, forward_to, webhook_url FROM premium_users WHERE email = ? AND is_active = 1",
            (inbox["user_email"],)
        ).fetchone()
        return premium_user
    
    return None


def forward_email(forward_to, sender, subject, text_body, html_body):
    """Forward email to user's real address via local Postfix."""
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"TempyMail Forwarding <noreply@vredobox.cc>"
        msg["To"] = forward_to
        msg["Subject"] = f"[Fwd] {subject}"
        
        if text_body:
            msg.attach(MIMEText(f"--- Forwarded from TempyMail ---\nFrom: {sender}\n\n{text_body}", "plain"))
        if html_body:
            msg.attach(MIMEText(html_body, "html"))
        
        with smtplib.SMTP("localhost", 25) as smtp:
            smtp.send_message(msg)
    except Exception as e:
        log_error(f"Forwarding failed to {forward_to}: {e}")


def fire_webhook(webhook_url, email_data):
    """Send webhook notification about new email."""
    try:
        payload = json.dumps({
            "event": "new_email",
            "data": {
                "id": email_data["id"],
                "from": email_data["sender"],
                "to": email_data["recipient"],
                "subject": email_data["subject"],
                "preview": email_data["text_body"][:200] if email_data["text_body"] else "",
                "received_at": email_data["created_at"],
            }
        }).encode("utf-8")
        
        req = urllib_request.Request(
            webhook_url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        urllib_request.urlopen(req, timeout=5)
    except Exception as e:
        log_error(f"Webhook failed to {webhook_url}: {e}")


def log_error(message):
    with open("/tmp/tempymail_receive_error.log", "a") as f:
        f.write(f"{datetime.utcnow().isoformat()} ERROR: {message}\n")


def store_email(raw_bytes: bytes):
    """Parse a raw email and store it in the database."""
    msg = BytesParser(policy=policy.default).parsebytes(raw_bytes)
    
    # Extract fields
    sender = msg.get("From", "unknown@unknown.com")
    recipient = msg.get("To", "")
    subject = msg.get("Subject", "(No Subject)")
    message_id = str(uuid.uuid4())
    
    # Parse sender name vs address
    sender_name = ""
    sender_address = sender
    if "<" in sender and ">" in sender:
        parts = sender.split("<")
        sender_name = parts[0].strip().strip('"')
        sender_address = parts[1].strip().rstrip(">")
    
    # Parse recipient
    recipient_address = recipient
    if "<" in recipient and ">" in recipient:
        recipient_address = recipient.split("<")[1].strip().rstrip(">")
    
    if "," in recipient_address:
        for addr in recipient_address.split(","):
            addr = addr.strip()
            if "vredobox.cc" in addr.lower():
                recipient_address = addr
                break
    
    recipient_address = recipient_address.strip().lower()
    
    # Extract body and attachments
    text_body = ""
    html_body = ""
    has_attachments = 0
    attachments = []
    
    total_attachment_size = 0
    MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_TOTAL_SIZE = 30 * 1024 * 1024       # 30MB
    
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = str(part.get("Content-Disposition", ""))
            
            if "attachment" in disposition or (content_type not in ("text/plain", "text/html", "multipart/alternative", "multipart/mixed", "multipart/related") and "attachment" not in disposition and part.get_filename()):
                has_attachments = 1
                raw_filename = part.get_filename() or f"attachment_{len(attachments)+1}"
                safe_base = os.path.basename(raw_filename)
                import re
                filename = re.sub(r'[\\/*?:"<>|\r\n]', "", safe_base)
                if not filename:
                    filename = f"attachment_{len(attachments)+1}"
                try:
                    data = part.get_payload(decode=True)
                    if data:
                        att_size = len(data)
                        if att_size > MAX_ATTACHMENT_SIZE:
                            continue  # Skip individual large attachments
                        if total_attachment_size + att_size > MAX_TOTAL_SIZE:
                            continue  # Skip if exceeding total email size
                        
                        total_attachment_size += att_size
                        attachments.append({
                            "id": str(uuid.uuid4()),
                            "filename": filename,
                            "content_type": content_type,
                            "size": att_size,
                            "data": data
                        })
                except Exception:
                    pass
                continue
            
            if content_type == "text/plain" and not text_body:
                try:
                    text_body = part.get_content()
                except Exception:
                    text_body = str(part.get_payload(decode=True) or "", "utf-8", errors="replace")
            elif content_type == "text/html" and not html_body:
                try:
                    html_body = part.get_content()
                except Exception:
                    html_body = str(part.get_payload(decode=True) or "", "utf-8", errors="replace")
    else:
        content_type = msg.get_content_type()
        if content_type == "text/plain":
            text_body = msg.get_content()
        elif content_type == "text/html":
            html_body = msg.get_content()
    
    # Determine expiry based on premium status
    conn = get_connection()
    premium_user = is_premium_address(conn, recipient_address)
    
    if premium_user:
        expires_at = (datetime.utcnow() + timedelta(hours=PREMIUM_LIFETIME_HOURS)).isoformat()
    else:
        expires_at = (datetime.utcnow() + timedelta(hours=FREE_LIFETIME_HOURS)).isoformat()
    
    created_at = datetime.utcnow().isoformat()
    
    # Store in database
    conn.execute("""
        INSERT INTO emails (id, recipient, sender, sender_name, subject, text_body, html_body, has_attachments, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        message_id,
        recipient_address,
        sender_address.strip(),
        sender_name,
        subject,
        text_body,
        html_body,
        has_attachments,
        expires_at,
        created_at
    ))
    
    # Store attachments
    for att in attachments:
        conn.execute("""
            INSERT INTO email_attachments (id, email_id, filename, content_type, size, data)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (att["id"], message_id, att["filename"], att["content_type"], att["size"], att["data"]))
    
    # Log analytics
    conn.execute("INSERT INTO analytics (event, value) VALUES (?, ?)", ("email_received", recipient_address))
    
    conn.commit()
    
    # Post-storage actions for premium users
    if premium_user:
        # Email forwarding
        forward_to = premium_user["forward_to"]
        if forward_to:
            forward_email(forward_to, sender_address, subject, text_body, html_body)
        
        # Webhook notification
        webhook_url = premium_user["webhook_url"]
        if webhook_url:
            fire_webhook(webhook_url, {
                "id": message_id,
                "sender": sender_address,
                "recipient": recipient_address,
                "subject": subject,
                "text_body": text_body,
                "created_at": created_at
            })
    
    conn.close()


if __name__ == "__main__":
    raw = sys.stdin.buffer.read()
    try:
        store_email(raw)
    except Exception as e:
        log_error(str(e))
        sys.exit(0)  # Exit 0 so Postfix doesn't bounce the email
