from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os

router = APIRouter()

# Paystack keys — use test keys for now, switch to live keys when ready
PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "sk_test_xxxxx")
PAYSTACK_PUBLIC_KEY = os.getenv("PAYSTACK_PUBLIC_KEY", "pk_test_xxxxx")

PREMIUM_AMOUNT = 499900  # ₦4,999 in kobo (approx $4.99)


class PaymentInitRequest(BaseModel):
    email: str


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
                    "amount": PREMIUM_AMOUNT,
                    "currency": "NGN",
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
    """Verify a Paystack payment."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.paystack.co/transaction/verify/{reference}",
                headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
            )
            data = response.json()
            if data.get("status") and data["data"]["status"] == "success":
                return {
                    "success": True,
                    "amount": data["data"]["amount"] / 100,
                    "email": data["data"]["customer"]["email"],
                }
            return {"success": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payment/public-key")
async def get_public_key():
    """Return the Paystack public key for frontend integration."""
    return {"public_key": PAYSTACK_PUBLIC_KEY}
