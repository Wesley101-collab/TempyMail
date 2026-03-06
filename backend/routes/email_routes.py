from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
from services import mailbox
from services.database import get_connection
import httpx
import os
from typing import Optional

class SummarizeRequest(BaseModel):
    text: str

class AccountRequest(BaseModel):
    recaptcha_token: Optional[str] = None

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

FREE_DAILY_LIMIT = 3
RECAPTCHA_SECRET = os.getenv("RECAPTCHA_SECRET_KEY", "")


async def verify_recaptcha(token: str) -> bool:
    """Verify a reCAPTCHA v3 token. Returns True if human, False if bot."""
    if not token or not RECAPTCHA_SECRET:
        return True  # Allow if no token or key (dev mode)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": RECAPTCHA_SECRET, "response": token},
        )
        result = resp.json()
        # v3 returns a score: >= 0.5 is likely human
        return result.get("success", False) and result.get("score", 0) >= 0.5


def _count_accounts_today(ip: str) -> int:
    """Count how many accounts were created today from this IP or in total."""
    conn = get_connection()
    cursor = conn.execute(
        "SELECT COUNT(*) FROM analytics WHERE event = 'account_created' AND DATE(created_at) = DATE('now')"
    )
    count = cursor.fetchone()[0]
    conn.close()
    return count


# --- Email Routes ---

@router.post("/accounts")
async def create_account(request: Request, body: AccountRequest = None):
    """Generates a new random email address on vredobox.cc."""
    try:
        # Verify reCAPTCHA token if provided
        recaptcha_token = (body.recaptcha_token if body else None) or ""
        is_human = await verify_recaptcha(recaptcha_token)
        if not is_human:
            raise HTTPException(status_code=403, detail="Bot detected. Please try again.")

        # Extract IP, preferring Cloudflare header (fallback to standard headers)
        client_ip = request.headers.get("cf-connecting-ip")
        if not client_ip:
            fwd = request.headers.get("x-forwarded-for")
            if fwd:
                client_ip = fwd.split(",")[0].strip()
        if not client_ip:
            client_ip = request.headers.get("x-real-ip")
        if not client_ip and request.client:
            client_ip = request.client.host
            
        client_ip = (client_ip or "unknown").strip()
        
        # Check daily limit (free tier = 3/day per browser, enforced loosely)
        count = _count_accounts_today("")
        # We track globally for now; per-user tracking needs cookies/IP
        data = mailbox.generate_address(ip_address=client_ip)
        data["remaining_today"] = max(0, FREE_DAILY_LIMIT - (count + 1))
        data["daily_limit"] = FREE_DAILY_LIMIT
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages")
async def get_messages(address: str = Query(..., description="Email address to fetch messages for")):
    """Fetches messages for a given email address from the local database."""
    try:
        return mailbox.get_messages(address)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages/{message_id}")
async def get_message(message_id: str):
    """Fetches a single message by ID."""
    try:
        msg = mailbox.get_message(message_id)
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        return msg
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/messages/{message_id}")
async def delete_message(message_id: str):
    """Deletes a message by ID."""
    try:
        success = mailbox.delete_message(message_id)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
async def summarize_email(req: SummarizeRequest):
    """Summarizes email text using Groq AI (Llama 3)."""
    if not req.text or len(req.text.strip()) < 50:
        return {"summary": "Text is too short to summarize."}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a concise email summarizer. Summarize the email in 2-3 sentences. Focus on the key points, action items, and important details. Be clear and direct."
                        },
                        {
                            "role": "user",
                            "content": f"Summarize this email:\n\n{req.text[:3000]}"
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 200,
                },
            )
            
            if response.status_code != 200:
                return {"summary": "AI service temporarily unavailable. Please try again."}
            
            data = response.json()
            summary = data["choices"][0]["message"]["content"]
            return {"summary": summary}
            
    except Exception as e:
        return {"summary": f"Could not generate summary: {str(e)}"}
