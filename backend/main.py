from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.email_routes import router as email_router
from routes.admin_routes import router as admin_router

app = FastAPI(title="TempyMail API", description="Self-hosted disposable email service")

# Allow CORS for local frontend development and production deployed instances
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(email_router, prefix="/api", tags=["Email"])
app.include_router(admin_router, prefix="/api", tags=["Admin"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "TempyMail Backend is running."}
