from fastapi import APIRouter, Header, HTTPException, Request
from services.database import get_connection
from typing import Optional
import os
import hmac
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

ADMIN_KEY = os.getenv("ADMIN_KEY", "")


def verify_admin(x_admin_key: Optional[str] = Header(None)):
    """Verify admin key using timing-safe comparison to prevent timing attacks."""
    if not x_admin_key or not ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if not hmac.compare_digest(x_admin_key, ADMIN_KEY):
        raise HTTPException(status_code=403, detail="Unauthorized")


@router.get("/admin/stats")
async def get_stats(request: Request, x_admin_key: Optional[str] = Header(None)):
    """Get aggregate analytics stats. Rate limited to 10/min."""
    verify_admin(x_admin_key)
    
    try:
        conn = get_connection()
        
        total_emails = conn.execute("SELECT COUNT(*) as count FROM emails").fetchone()["count"]
        emails_today = conn.execute(
            "SELECT COUNT(*) as count FROM emails WHERE DATE(created_at) = DATE('now')"
        ).fetchone()["count"]
        total_accounts = conn.execute(
            "SELECT COUNT(*) as count FROM analytics WHERE event = 'account_created'"
        ).fetchone()["count"]
        accounts_today = conn.execute(
            "SELECT COUNT(*) as count FROM analytics WHERE event = 'account_created' AND DATE(created_at) = DATE('now')"
        ).fetchone()["count"]
        premium_users = conn.execute(
            "SELECT COUNT(*) as count FROM premium_users"
        ).fetchone()["count"]
        
        unique_visitors_rows = conn.execute(
            "SELECT value FROM analytics WHERE event = 'account_created' AND value LIKE '%|%'"
        ).fetchall()
        
        unique_ips = set()
        for r in unique_visitors_rows:
            val = r["value"]
            if "|" in val:
                ip = val.split("|")[1]
                if ip and ip.strip():
                    unique_ips.add(ip.strip())
        
        unique_web_visitors = len(unique_ips)
        
        unique_recipients = conn.execute(
            "SELECT COUNT(DISTINCT recipient) as count FROM emails"
        ).fetchone()["count"]
        
        hourly_data = conn.execute("""
            SELECT strftime('%Y-%m-%d %H:00', created_at) as hour, COUNT(*) as count
            FROM emails
            WHERE created_at >= datetime('now', '-24 hours')
            GROUP BY hour
            ORDER BY hour
        """).fetchall()
        
        hourly_chart = [{"hour": row["hour"], "count": row["count"]} for row in hourly_data]
        
        conn.close()
        
        return {
            "totalEmails": total_emails,
            "emailsToday": emails_today,
            "totalAccounts": total_accounts,
            "accountsToday": accounts_today,
            "premiumUsers": premium_users,
            "uniqueWebVisitors": max(unique_web_visitors, 1),
            "uniqueRecipients": unique_recipients,
            "hourlyChart": hourly_chart
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to load stats.")


@router.get("/admin/recent")
async def get_recent_emails(request: Request, x_admin_key: Optional[str] = Header(None)):
    """Get the 50 most recent emails."""
    verify_admin(x_admin_key)
    
    try:
        conn = get_connection()
        rows = conn.execute(
            "SELECT id, recipient, sender, subject, created_at FROM emails ORDER BY created_at DESC LIMIT 50"
        ).fetchall()
        conn.close()
        
        return {
            "emails": [
                {
                    "id": row["id"],
                    "recipient": row["recipient"],
                    "sender": row["sender"],
                    "subject": row["subject"],
                    "createdAt": row["created_at"]
                }
                for row in rows
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin recent error: {e}")
        raise HTTPException(status_code=500, detail="Failed to load recent emails.")


@router.get("/admin/premium-users")
async def get_premium_users(request: Request, x_admin_key: Optional[str] = Header(None)):
    """Get list of all premium users."""
    verify_admin(x_admin_key)
    
    try:
        conn = get_connection()
        rows = conn.execute(
            "SELECT email, created_at FROM premium_users ORDER BY created_at DESC"
        ).fetchall()
        conn.close()
        
        return {
            "users": [
                {
                    "email": row["email"],
                    "joinedAt": row["created_at"]
                }
                for row in rows
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin premium users error: {e}")
        raise HTTPException(status_code=500, detail="Failed to load users.")


@router.get("/admin/ip-visitors")
async def get_ip_visitors(request: Request, x_admin_key: Optional[str] = Header(None)):
    """Get list of unique visitor IPs with timestamps."""
    verify_admin(x_admin_key)
    
    try:
        conn = get_connection()
        rows = conn.execute(
            "SELECT value, created_at FROM analytics WHERE event = 'account_created' AND value LIKE '%|%' ORDER BY created_at DESC"
        ).fetchall()
        conn.close()
        
        seen = set()
        visitors = []
        for row in rows:
            val = row["value"]
            if "|" in val:
                parts = val.split("|", 1)
                ip = parts[1].strip()
                if ip and ip not in seen:
                    seen.add(ip)
                    visitors.append({
                        "ip": ip,
                        "firstSeen": row["created_at"]
                    })
        
        return {"visitors": visitors}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin visitors error: {e}")
        raise HTTPException(status_code=500, detail="Failed to load visitors.")
