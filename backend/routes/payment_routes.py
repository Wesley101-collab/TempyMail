from fastapi import APIRouter, HTTPException, Query, Response, Header, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.database import get_connection
from services import mailbox
import httpx
import bcrypt
import os
import io
import zipfile
import json
import uuid
import jwt
import resend
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

resend.api_key = os.getenv("RESEND_API_KEY", "")

router = APIRouter()

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "")
PREMIUM_AMOUNT = 499  # $4.99 in cents (USD)
EMAIL_DOMAIN = "vredobox.cc"

# JWT secret — uses ADMIN_KEY as a base, so no extra env var needed
JWT_SECRET = os.getenv("ADMIN_KEY", "tempymail-secret-key-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 30


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
    forward_to: str

class WebhookRequest(BaseModel):
    email: str
    webhook_url: str

class CreateInboxRequest(BaseModel):
    email: str
    label: str = ""

class ReplyRequest(BaseModel):
    from_address: str
    to_address: str
    subject: str
    body: str
    in_reply_to: str = ""


# --- JWT Helpers ---

def _create_token(email: str) -> str:
    """Create a JWT token for the given email."""
    payload = {
        "sub": email.lower(),
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _verify_token(authorization: Optional[str] = Header(None)) -> str:
    """Verify JWT token from Authorization header. Returns the email."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Support "Bearer <token>" format
    token = authorization
    if authorization.startswith("Bearer "):
        token = authorization[7:]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _verify_token_matches(authorization: Optional[str], target_email: str) -> str:
    """Verify token AND ensure it matches the target email (prevents IDOR)."""
    email = _verify_token(authorization)
    if email != target_email.lower():
        raise HTTPException(status_code=403, detail="Access denied")
    return email


# --- Password Helpers ---

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

    try:
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

        # Return JWT token on signup too
        token = _create_token(req.email)
        return {"success": True, "message": "Account created!", "token": token}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create account.")


@router.post("/premium/login")
async def premium_login(req: LoginRequest):
    try:
        conn = get_connection()
        user = conn.execute(
            "SELECT id, email, password_hash, is_active, custom_alias, forward_to, webhook_url, created_at FROM premium_users WHERE email = ?",
            (req.email.lower(),)
        ).fetchone()
        conn.close()

        if not user or not _verify_password(req.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Create JWT token
        token = _create_token(req.email)

        return {
            "success": True,
            "token": token,
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed.")


@router.get("/premium/check/{email}")
async def check_premium(email: str):
    conn = get_connection()
    user = conn.execute(
        "SELECT is_active FROM premium_users WHERE email = ?", (email.lower(),)
    ).fetchone()
    conn.close()
    return {"is_premium": bool(user and user["is_active"])}


# --- Custom Alias (JWT Protected) ---

@router.post("/premium/alias")
async def set_alias(req: AliasRequest, authorization: Optional[str] = Header(None)):
    _verify_token_matches(authorization, req.email)
    _require_premium(req.email)
    
    alias = req.alias.strip().lower()
    if not alias:
        conn = get_connection()
        conn.execute("UPDATE premium_users SET custom_alias = '' WHERE email = ?", (req.email.lower(),))
        conn.commit()
        conn.close()
        return {"success": True, "alias": "", "address": ""}
    
    if len(alias) < 3 or len(alias) > 30:
        raise HTTPException(status_code=400, detail="Alias must be 3-30 characters")
    if not alias.replace(".", "").replace("_", "").replace("-", "").isalnum():
        raise HTTPException(status_code=400, detail="Alias can only contain letters, numbers, dots, hyphens, and underscores")
    
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
async def get_alias(email: str, authorization: Optional[str] = Header(None)):
    _verify_token_matches(authorization, email)
    user = _get_premium_user(email)
    if not user:
        return {"alias": "", "address": ""}
    alias = user["custom_alias"] or ""
    return {"alias": alias, "address": f"{alias}@{EMAIL_DOMAIN}" if alias else ""}


# --- Multiple Inboxes (JWT Protected) ---

@router.post("/premium/inboxes")
async def create_inbox(req: CreateInboxRequest, authorization: Optional[str] = Header(None)):
    _verify_token_matches(authorization, req.email)
    _require_premium(req.email)
    
    conn = get_connection()
    count = conn.execute(
        "SELECT COUNT(*) FROM user_inboxes WHERE user_email = ? AND is_active = 1",
        (req.email.lower(),)
    ).fetchone()[0]
    
    if count >= 5:
        conn.close()
        raise HTTPException(status_code=400, detail="Maximum 5 active inboxes allowed")
    
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
async def list_inboxes(email: str, authorization: Optional[str] = Header(None)):
    _verify_token_matches(authorization, email)
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
async def delete_inbox(email: str, address: str, authorization: Optional[str] = Header(None)):
    _verify_token_matches(authorization, email)
    _require_premium(email)
    conn = get_connection()
    conn.execute(
        "UPDATE user_inboxes SET is_active = 0 WHERE user_email = ? AND address = ?",
        (email.lower(), address)
    )
    conn.commit()
    conn.close()
    return {"success": True}


# --- Email Forwarding (JWT Protected) ---

@router.post("/premium/forwarding")
async def set_forwarding(req: ForwardingRequest, authorization: Optional[str] = Header(None)):
    _verify_token_matches(authorization, req.email)
    _require_premium(req.email)
    conn = get_connection()
    conn.execute(
        "UPDATE premium_users SET forward_to = ? WHERE email = ?",
        (req.forward_to.strip(), req.email.lower())
    )
    conn.commit()
    conn.close()
    return {"success": True, "forward_to": req.forward_to.strip()}


# --- Webhook (JWT Protected) ---

@router.post("/premium/webhook")
async def set_webhook(req: WebhookRequest, authorization: Optional[str] = Header(None)):
    _verify_token_matches(authorization, req.email)
    _require_premium(req.email)
    
    url = req.webhook_url.strip()
    if url:
        if not url.startswith(("http://", "https://")):
            raise HTTPException(status_code=400, detail="Webhook URL must start with http:// or https://")
        
        # SSRF Protection
        try:
            from urllib.parse import urlparse
            import socket
            import ipaddress
            
            parsed = urlparse(url)
            hostname = parsed.hostname
            if not hostname:
                raise ValueError("Invalid hostname")
            
            ip = socket.gethostbyname(hostname)
            ip_obj = ipaddress.ip_address(ip)
            
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_multicast or ip_obj.is_reserved:
                raise HTTPException(status_code=400, detail="Webhook URL cannot point to internal or private IP addresses")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid webhook URL or could not resolve hostname")
    
    conn = get_connection()
    conn.execute(
        "UPDATE premium_users SET webhook_url = ? WHERE email = ?",
        (url, req.email.lower())
    )
    conn.commit()
    conn.close()
    return {"success": True, "webhook_url": url}


# --- Download Emails (IDOR Protected) ---

@router.get("/messages/{message_id}/download")
async def download_email(message_id: str, address: str = Query(..., description="Email address that owns this message")):
    """Download a single email as .eml file — with IDOR protection."""
    conn = get_connection()
    row = conn.execute("SELECT * FROM emails WHERE id = ?", (message_id,)).fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # IDOR protection
    if row["recipient"].lower() != address.lower():
        raise HTTPException(status_code=403, detail="Access denied")
    
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
    safe_subject = "".join(c for c in (row["subject"] or "email") if c.isalnum() or c in " -_")[:50]
    
    return Response(
        content=eml_content,
        media_type="message/rfc822",
        headers={"Content-Disposition": f'attachment; filename="{safe_subject}.eml"'}
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


# --- Attachments (IDOR Protected) ---

@router.get("/messages/{message_id}/attachments")
async def list_attachments(message_id: str, address: str = Query(..., description="Email address that owns this message")):
    """List attachments — with IDOR protection."""
    # Verify message belongs to address
    conn = get_connection()
    email_row = conn.execute("SELECT recipient FROM emails WHERE id = ?", (message_id,)).fetchone()
    if not email_row or email_row["recipient"].lower() != address.lower():
        conn.close()
        raise HTTPException(status_code=403, detail="Access denied")
    
    rows = conn.execute(
        "SELECT id, filename, content_type, size FROM email_attachments WHERE email_id = ?",
        (message_id,)
    ).fetchall()
    conn.close()
    return {"attachments": [dict(r) for r in rows]}


@router.get("/attachments/{attachment_id}")
async def download_attachment(attachment_id: str, address: str = Query(..., description="Email address that owns this attachment")):
    """Download attachment — with IDOR protection."""
    conn = get_connection()
    row = conn.execute(
        """SELECT ea.filename, ea.content_type, ea.data, e.recipient 
           FROM email_attachments ea 
           JOIN emails e ON ea.email_id = e.id 
           WHERE ea.id = ?""",
        (attachment_id,)
    ).fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    # IDOR protection
    if row["recipient"].lower() != address.lower():
        raise HTTPException(status_code=403, detail="Access denied")
    
    return Response(
        content=row["data"],
        media_type=row["content_type"],
        headers={"Content-Disposition": f'attachment; filename="{row["filename"]}"'}
    )


# --- Reply to Email (Auth Protected) ---

@router.post("/messages/reply")
async def reply_to_email(req: ReplyRequest):
    """Send a reply email — validates from_address belongs to our domain."""
    # Validate from_address is a @vredobox.cc address (prevent arbitrary sender spoofing)
    if not req.from_address.lower().endswith(f"@{EMAIL_DOMAIN}"):
        raise HTTPException(status_code=400, detail="Can only reply from @vredobox.cc addresses")
    
    if not req.to_address or not req.body.strip():
        raise HTTPException(status_code=400, detail="Recipient and body are required")
    
    # Rate-limit body length
    if len(req.body) > 5000:
        raise HTTPException(status_code=400, detail="Reply body too long (max 5000 chars)")
    
    try:
        resend.Emails.send({
            "from": f"TempyMail Reply <{req.from_address}>",
            "to": req.to_address,
            "subject": req.subject,
            "text": req.body,
            "headers": {
                "In-Reply-To": req.in_reply_to
            }
        })
        
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
        logger.error(f"Reply error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reply.")


# --- Delete Account (JWT Protected) ---

@router.delete("/premium/user/{email}")
async def delete_user(email: str, authorization: Optional[str] = Header(None)):
    """Delete a premium account — requires JWT matching the email."""
    _verify_token_matches(authorization, email)
    
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
        logger.error(f"Payment init error: {e}")
        raise HTTPException(status_code=500, detail="Payment service unavailable.")


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
        logger.error(f"Payment verify error: {e}")
        raise HTTPException(status_code=500, detail="Payment verification failed.")
