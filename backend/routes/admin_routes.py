from fastapi import APIRouter, Header, HTTPException
from services.database import get_connection
from typing import Optional
import os

router = APIRouter()

ADMIN_KEY = os.getenv("ADMIN_KEY", "")


def verify_admin(x_admin_key: Optional[str] = Header(None)):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")


@router.get("/admin/stats")
async def get_stats(x_admin_key: Optional[str] = Header(None)):
    """Get aggregate analytics stats."""
    verify_admin(x_admin_key)
    
    conn = get_connection()
    
    # Total emails received
    total_emails = conn.execute("SELECT COUNT(*) as count FROM emails").fetchone()["count"]
    
    # Emails received today
    emails_today = conn.execute(
        "SELECT COUNT(*) as count FROM emails WHERE DATE(created_at) = DATE('now')"
    ).fetchone()["count"]
    
    # Total accounts generated
    total_accounts = conn.execute(
        "SELECT COUNT(*) as count FROM analytics WHERE event = 'account_created'"
    ).fetchone()["count"]
    
    # Accounts generated today
    accounts_today = conn.execute(
        "SELECT COUNT(*) as count FROM analytics WHERE event = 'account_created' AND DATE(created_at) = DATE('now')"
    ).fetchone()["count"]
    
    # Premium Users
    premium_users = conn.execute(
        "SELECT COUNT(*) as count FROM premium_users"
    ).fetchone()["count"]
    
    # Unique Web Visitors (count distinct IP addresses from analytics value where formatted as email|IP)
    # We parse the IP out of the 'value' column (which is "email|IP")
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
    
    # Unique recipients (distinct mailboxes that received mail)
    unique_recipients = conn.execute(
        "SELECT COUNT(DISTINCT recipient) as count FROM emails"
    ).fetchone()["count"]
    
    # Emails per hour (last 24h) for chart
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
        "uniqueWebVisitors": max(unique_web_visitors, 1), # At least 1 for the admin
        "uniqueRecipients": unique_recipients,
        "hourlyChart": hourly_chart
    }


@router.get("/admin/recent")
async def get_recent_emails(x_admin_key: Optional[str] = Header(None)):
    """Get the 50 most recent emails."""
    verify_admin(x_admin_key)
    
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
