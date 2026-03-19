from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from routes.email_routes import router as email_router
from routes.admin_routes import router as admin_router
from routes.payment_routes import router as payment_router

# Rate limiter: uses client IP from X-Forwarded-For / CF-Connecting-IP
def get_client_ip(request: Request) -> str:
    """Extract real client IP, preferring Cloudflare/proxy headers."""
    ip = request.headers.get("cf-connecting-ip")
    if not ip:
        fwd = request.headers.get("x-forwarded-for")
        if fwd:
            ip = fwd.split(",")[0].strip()
    if not ip:
        ip = request.headers.get("x-real-ip")
    if not ip and request.client:
        ip = request.client.host
    return ip or "unknown"

limiter = Limiter(key_func=get_client_ip)

app = FastAPI(title="TempyMail API", description="Self-hosted disposable email service")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - restricted to production domain only
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tempymail.site",
        "https://www.tempymail.site",
        "http://localhost:5173",  # Local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(email_router, prefix="/api", tags=["Email"])
app.include_router(admin_router, prefix="/api", tags=["Admin"])
app.include_router(payment_router, prefix="/api", tags=["Payment"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "TempyMail Backend is running."}
