#!/usr/bin/env python3
"""
Cleanup script: removes expired emails from the database.
Run via cron every 10 minutes:
    */10 * * * * /var/www/TempyMail/backend/venv/bin/python /var/www/TempyMail/backend/cleanup_emails.py
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "emails.db")


def cleanup():
    conn = sqlite3.connect(DB_PATH)
    now = datetime.utcnow().isoformat()
    
    # Delete expired attachments first (foreign key)
    conn.execute("""
        DELETE FROM email_attachments WHERE email_id IN (
            SELECT id FROM emails WHERE expires_at IS NOT NULL AND expires_at < ?
        )
    """, (now,))
    
    # Delete expired emails
    cursor = conn.execute(
        "DELETE FROM emails WHERE expires_at IS NOT NULL AND expires_at < ?", (now,)
    )
    deleted = cursor.rowcount
    
    conn.commit()
    conn.close()
    
    if deleted > 0:
        with open("/tmp/tempymail_cleanup.log", "a") as f:
            f.write(f"{now} Cleaned up {deleted} expired emails\n")


if __name__ == "__main__":
    cleanup()
