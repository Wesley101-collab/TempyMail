from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.database import get_connection
from services import mailbox
import httpx
import bcrypt
import os
import io
import zipfile
import smtplib
import json
import uuid
import resend
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

resend.api_key = os.getenv("RESEND_API_KEY", "")

router = APIRouter()

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "")
PREMIUM_AMOUNT = 499  # $4.99 in cents (USD)
EMAIL_DOMAIN = "vredobox.cc"


# --- Pydantic Models ---

class SignupRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class PaymentInitRequest(BaseModel):
    email: str

class AliasRequest(BaseModel):
    email: str
    alias: str

class ForwardingRequest(BaseModel):
    email: str
    forward_to: str  # empty string to disable

class WebhookRequest(BaseModel):
    email: str
    webhook_url: str  # empty string to disable

class CreateInboxRequest(BaseModel):
    email: str
    label: str = ""

class ReplyRequest(BaseModel):
    from_address: str
    to_address: str
    subject: str
    body: str
    in_reply_to: str = ""


# --- Helpers ---

def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def _get_premium_user(email: str):
    conn = get_connection()
    user = conn.execute(
        "SELECT * FROM premium_users WHERE email = ?", (email.lower(),)
    ).fetchone()
    conn.close()
    return user

def _require_premium(email: str):
    user = _get_premium_user(email)
    if not user or not user["is_active"]:
        raise HTTPException(status_code=403, detail="Premium subscription required")
    return user


# --- Auth Routes ---

@router.post("/premium/signup")
async def premium_signup(req: SignupRequest):
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    conn = get_connection()
    existing = conn.execute("SELECT id FROM premium_users WHERE email = ?", (req.email.lower(),)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="Account already exists. Please log in.")

    conn.execute(
        "INSERT INTO premium_users (email, password_hash) VALUES (?, ?)",
        (req.email.lower(), _hash_password(req.password))
    )
    conn.commit()
    conn.close()
    return {"success": True, "message": "Account created! Complete payment to activate premium."}


@router.post("/premium/login")
async def premium_login(req: LoginRequest):
    conn = get_connection()
    user = conn.execute(
        "SELECT id, email, password_hash, is_active, custom_alias, forward_to, webhook_url, created_at FROM premium_users WHERE email = ?",
        (req.email.lower(),)
    ).fetchone()
    conn.close()

    if not user or not _verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "is_premium": bool(user["is_active"]),
            "custom_alias": user["custom_alias"] or "",
            "forward_to": user["forward_to"] or "",
            "webhook_url": user["webhook_url"] or "",
            "created_at": user["created_at"],
        }
    }


@router.get("/premium/check/{email}")
async def check_premium(email: str):
    conn = get_connection()
    user = conn.execute(
        "SELECT is_active FROM premium_users WHERE email = ?", (email.lower(),)
    ).fetchone()
    conn.close()
    return {"is_premium": bool(user and user["is_active"])}


# --- Custom Alias ---

@router.post("/premium/alias")
async def set_alias(req: AliasRequest):
    _require_premium(req.email)
    
    alias = req.alias.strip().lower()
    if not alias:
        # Clear alias
        conn = get_connection()
        conn.execute("UPDATE premium_users SET custom_alias = '' WHERE email = ?", (req.email.lower(),))
        conn.commit()
        conn.close()
        return {"success": True, "alias": "", "address": ""}
    
    # Validate alias
    if len(alias) < 3 or len(alias) > 30:
        raise HTTPException(status_code=400, detail="Alias must be 3-30 characters")
    if not alias.replace(".", "").replace("_", "").replace("-", "").isalnum():
        raise HTTPException(status_code=400, detail="Alias can only contain letters, numbers, dots, hyphens, and underscores")
    
    # Check uniqueness
    conn = get_connection()
    existing = conn.execute(
        "SELECT id FROM premium_users WHERE custom_alias = ? AND email != ?",
        (alias, req.email.lower())
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="This alias is already taken")
    
    conn.execute("UPDATE premium_users SET custom_alias = ? WHERE email = ?", (alias, req.email.lower()))
    conn.commit()
    conn.close()
    
    return {"success": True, "alias": alias, "address": f"{alias}@{EMAIL_DOMAIN}"}


@router.get("/premium/alias/{email}")
async def get_alias(email: str):
    user = _get_premium_user(email)
    if not user:
        return {"alias": "", "address": ""}
    alias = user["custom_alias"] or ""
    return {"alias": alias, "address": f"{alias}@{EMAIL_DOMAIN}" if alias else ""}


# --- Multiple Inboxes ---

@router.post("/premium/inboxes")
async def create_inbox(req: CreateInboxRequest):
    _require_premium(req.email)
    
    conn = get_connection()
    count = conn.execute(
        "SELECT COUNT(*) FROM user_inboxes WHERE user_email = ? AND is_active = 1",
        (req.email.lower(),)
    ).fetchone()[0]
    
    if count >= 5:
        conn.close()
        raise HTTPException(status_code=400, detail="Maximum 5 active inboxes allowed")
    
    # Generate address
    data = mailbox.generate_address()
    address = data["address"]
    
    conn.execute(
        "INSERT INTO user_inboxes (user_email, address, label) VALUES (?, ?, ?)",
        (req.email.lower(), address, req.label or address.split("@")[0])
    )
    conn.commit()
    conn.close()
    
    return {"success": True, "address": address, "label": req.label or address.split("@")[0]}


@router.get("/premium/inboxes/{email}")
async def list_inboxes(email: str):
    user = _get_premium_user(email)
    if not user:
        return {"inboxes": []}
    
    conn = get_connection()
    rows = conn.execute(
        "SELECT address, label, created_at FROM user_inboxes WHERE user_email = ? AND is_active = 1 ORDER BY created_at DESC",
        (email.lower(),)
    ).fetchall()
    conn.close()
    
    return {"inboxes": [{"address": r["address"], "label": r["label"], "created_at": r["created_at"]} for r in rows]}


@router.delete("/premium/inboxes/{email}/{address}")
async def delete_inbox(email: str, address: str):
    _require_premium(email)
    conn = get_connection()
    conn.execute(
        "UPDATE user_inboxes SET is_active = 0 WHERE user_email = ? AND address = ?",
        (email.lower(), address)
    )
    conn.commit()
    conn.close()
    return {"success": True}


# --- Email Forwarding ---

@router.post("/premium/forwarding")
async def set_forwarding(req: ForwardingRequest):
    _require_premium(req.email)
    conn = get_connection()
    conn.execute(
        "UPDATE premium_users SET forward_to = ? WHERE email = ?",
        (req.forward_to.strip(), req.email.lower())
    )
    conn.commit()
    conn.close()
    return {"success": True, "forward_to": req.forward_to.strip()}


# --- Webhook ---

@router.post("/premium/webhook")
async def set_webhook(req: WebhookRequest):
    _require_premium(req.email)
    
    url = req.webhook_url.strip()
    if url and not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Webhook URL must start with http:// or https://")
    
    conn = get_connection()
    conn.execute(
        "UPDATE premium_users SET webhook_url = ? WHERE email = ?",
        (url, req.email.lower())
    )
    conn.commit()
    conn.close()
    return {"success": True, "webhook_url": url}


# --- Download Emails ---

@router.get("/messages/{message_id}/download")
async def download_email(message_id: str):
    """Download a single email as .eml file."""
    conn = get_connection()
    row = conn.execute("SELECT * FROM emails WHERE id = ?", (message_id,)).fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Build .eml content
    msg = MIMEMultipart()
    msg["From"] = f"{row['sender_name']} <{row['sender']}>" if row["sender_name"] else row["sender"]
    msg["To"] = row["recipient"]
    msg["Subject"] = row["subject"]
    msg["Date"] = row["created_at"]
    
    if row["html_body"]:
        msg.attach(MIMEText(row["html_body"], "html"))
    if row["text_body"]:
        msg.attach(MIMEText(row["text_body"], "plain"))
    
    eml_content = msg.as_string()
    
    return Response(
        content=eml_content,
        media_type="message/rfc822",
        headers={"Content-Disposition": f'attachment; filename="{row["subject"][:50] or "email"}.eml"'}
    )


@router.get("/messages/download")
async def download_inbox(address: str = Query(...)):
    """Download all emails for an address as a .zip file."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM emails WHERE LOWER(recipient) = LOWER(?) ORDER BY created_at DESC",
        (address,)
    ).fetchall()
    conn.close()
    
    if not rows:
        raise HTTPException(status_code=404, detail="No messages found")
    
    # Create zip in memory
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for i, row in enumerate(rows):
            msg = MIMEMultipart()
            msg["From"] = f"{row['sender_name']} <{row['sender']}>" if row["sender_name"] else row["sender"]
            msg["To"] = row["recipient"]
            msg["Subject"] = row["subject"]
            msg["Date"] = row["created_at"]
            if row["html_body"]:
                msg.attach(MIMEText(row["html_body"], "html"))
            if row["text_body"]:
                msg.attach(MIMEText(row["text_body"], "plain"))
            
            safe_subject = "".join(c for c in (row["subject"] or "email") if c.isalnum() or c in " -_")[:40]
            zf.writestr(f"{i+1:03d}_{safe_subject}.eml", msg.as_string())
    
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="inbox_{address.split("@")[0]}.zip"'}
    )


# --- Attachments ---

@router.get("/messages/{message_id}/attachments")
async def list_attachments(message_id: str):
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, filename, content_type, size FROM email_attachments WHERE email_id = ?",
        (message_id,)
    ).fetchall()
    conn.close()
    return {"attachments": [dict(r) for r in rows]}


@router.get("/attachments/{attachment_id}")
async def download_attachment(attachment_id: str):
    conn = get_connection()
    row = conn.execute(
        "SELECT filename, content_type, data FROM email_attachments WHERE id = ?",
        (attachment_id,)
    ).fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    return Response(
        content=row["data"],
        media_type=row["content_type"],
        headers={"Content-Disposition": f'attachment; filename="{row["filename"]}"'}
    )


# --- Reply to Email ---

@router.post("/messages/reply")
async def reply_to_email(req: ReplyRequest):
    """Send a reply email via the local Postfix server."""
    try:
        # Send via Resend
        resend.Emails.send({
            "from": f"TempyMail Reply <{req.from_address}>",
            "to": req.to_address,
            "subject": req.subject,
            "text": req.body,
            "headers": {
                "In-Reply-To": req.in_reply_to
            }
        })
        
        # Store sent email
        reply_id = str(uuid.uuid4())
        conn = get_connection()
        conn.execute(
            "INSERT INTO sent_emails (id, from_address, to_address, subject, body, in_reply_to) VALUES (?, ?, ?, ?, ?, ?)",
            (reply_id, req.from_address, req.to_address, req.subject, req.body, req.in_reply_to)
        )
        conn.commit()
        conn.close()
        
        return {"success": True, "message_id": reply_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send: {str(e)}")


# --- Delete Account ---

@router.delete("/premium/user/{email}")
async def delete_user(email: str):
    conn = get_connection()
    conn.execute("DELETE FROM premium_users WHERE email = ?", (email.lower(),))
    conn.execute("DELETE FROM user_inboxes WHERE user_email = ?", (email.lower(),))
    conn.commit()
    conn.close()
    return {"success": True}


# --- Payment Routes ---

@router.post("/payment/initialize")
async def initialize_payment(req: PaymentInitRequest):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.paystack.co/transaction/initialize",
                headers={
                    "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "email": req.email,
                    "amount": PREMIUM_AMOUNT * 100,
                    "currency": "USD",
                    "callback_url": "https://tempymail.site/?payment=success",
                    "metadata": {"plan": "premium", "product": "TempyMail Premium"},
                },
            )
            data = response.json()
            if data.get("status"):
                return {
                    "authorization_url": data["data"]["authorization_url"],
                    "reference": data["data"]["reference"],
                }
            raise HTTPException(status_code=400, detail="Payment initialization failed")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payment/verify/{reference}")
async def verify_payment(reference: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.paystack.co/transaction/verify/{reference}",
                headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
            )
            data = response.json()
            if data.get("status") and data["data"]["status"] == "success":
                email = data["data"]["customer"]["email"]
                conn = get_connection()
                conn.execute(
                    "UPDATE premium_users SET is_active = 1, payment_ref = ? WHERE email = ?",
                    (reference, email.lower())
                )
                conn.commit()
                conn.close()
                return {"success": True, "amount": data["data"]["amount"] / 100, "email": email}
            return {"success": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
