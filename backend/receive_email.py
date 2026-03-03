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
from email import policy
from email.parser import BytesParser
from datetime import datetime

# Database path (same as services/database.py)
DB_PATH = os.path.join(os.path.dirname(__file__), "emails.db")

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
    
    # Parse recipient (may contain multiple, we want just the @vredobox.cc one)
    recipient_address = recipient
    if "<" in recipient and ">" in recipient:
        recipient_address = recipient.split("<")[1].strip().rstrip(">")
    
    # Handle multiple recipients (take the first one matching our domain)
    if "," in recipient_address:
        for addr in recipient_address.split(","):
            addr = addr.strip()
            if "vredobox.cc" in addr.lower():
                recipient_address = addr
                break
    
    # Extract body
    text_body = ""
    html_body = ""
    has_attachments = 0
    
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = str(part.get("Content-Disposition", ""))
            
            if "attachment" in disposition:
                has_attachments = 1
                continue
            
            if content_type == "text/plain" and not text_body:
                text_body = part.get_content()
            elif content_type == "text/html" and not html_body:
                html_body = part.get_content()
    else:
        content_type = msg.get_content_type()
        if content_type == "text/plain":
            text_body = msg.get_content()
        elif content_type == "text/html":
            html_body = msg.get_content()
    
    # Store in database
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        INSERT INTO emails (id, recipient, sender, sender_name, subject, text_body, html_body, has_attachments, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        message_id,
        recipient_address.strip().lower(),
        sender_address.strip(),
        sender_name,
        subject,
        text_body,
        html_body,
        has_attachments,
        datetime.utcnow().isoformat()
    ))
    
    # Log analytics
    conn.execute("INSERT INTO analytics (event, value) VALUES (?, ?)", ("email_received", recipient_address.strip().lower()))
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    raw = sys.stdin.buffer.read()
    try:
        store_email(raw)
    except Exception as e:
        # Log errors to a file so Postfix doesn't lose them
        with open("/tmp/tempymail_receive_error.log", "a") as f:
            f.write(f"{datetime.utcnow().isoformat()} ERROR: {str(e)}\n")
        sys.exit(0)  # Exit 0 so Postfix doesn't bounce the email
