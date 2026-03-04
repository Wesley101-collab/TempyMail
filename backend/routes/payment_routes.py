from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.database import get_connection
import httpx
import bcrypt
import os

router = APIRouter()

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "")

PREMIUM_AMOUNT = 499  # $4.99 in cents (USD)


class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class PaymentInitRequest(BaseModel):
    email: str


def _hash_password(password: str) -> str:
    """Hash a password with bcrypt (automatic salt)."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(password: str, hashed: str) -> bool:
    """Verify a password against a bcrypt hash."""
    return bcrypt.checkpw(password.encode(), hashed.encode())


# --- Auth Routes ---

@router.post("/premium/signup")
async def premium_signup(req: SignupRequest):
    """Register a new premium user."""
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
    """Log in a premium user."""
    conn = get_connection()
    user = conn.execute(
        "SELECT id, email, password_hash, is_active, created_at FROM premium_users WHERE email = ?",
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
            "created_at": user["created_at"],
        }
    }


@router.get("/premium/check/{email}")
async def check_premium(email: str):
    """Check if a user has premium status."""
    conn = get_connection()
    user = conn.execute(
        "SELECT is_active FROM premium_users WHERE email = ?",
        (email.lower(),)
    ).fetchone()
    conn.close()

    return {"is_premium": bool(user and user["is_active"])}


# --- Payment Routes ---

@router.post("/payment/initialize")
async def initialize_payment(req: PaymentInitRequest):
    """Initialize a Paystack payment for premium subscription."""
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
                    "amount": PREMIUM_AMOUNT * 100,  # Paystack uses kobo/cents
                    "currency": "USD",
                    "callback_url": "https://tempymail.site/?payment=success",
                    "metadata": {
                        "plan": "premium",
                        "product": "TempyMail Premium",
                    },
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
    """Verify a Paystack payment and activate premium."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.paystack.co/transaction/verify/{reference}",
                headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
            )
            data = response.json()
            if data.get("status") and data["data"]["status"] == "success":
                email = data["data"]["customer"]["email"]
                # Activate premium for this user
                conn = get_connection()
                conn.execute(
                    "UPDATE premium_users SET is_active = 1, payment_ref = ? WHERE email = ?",
                    (reference, email.lower())
                )
                conn.commit()
                conn.close()
                return {
                    "success": True,
                    "amount": data["data"]["amount"] / 100,
                    "email": email,
                }
            return {"success": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
