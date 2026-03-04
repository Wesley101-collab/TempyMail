import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "emails.db")

def get_connection():
    """Get a SQLite connection with row_factory for dict-like access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")  # Better concurrent read performance
    return conn

def init_db():
    """Initialize the database schema."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS emails (
            id TEXT PRIMARY KEY,
            recipient TEXT NOT NULL,
            sender TEXT NOT NULL,
            sender_name TEXT DEFAULT '',
            subject TEXT DEFAULT '',
            text_body TEXT DEFAULT '',
            html_body TEXT DEFAULT '',
            has_attachments INTEGER DEFAULT 0,
            expires_at DATETIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_recipient ON emails(recipient)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON emails(created_at)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_expires_at ON emails(expires_at)")
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event TEXT NOT NULL,
            value TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS premium_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            payment_ref TEXT DEFAULT '',
            custom_alias TEXT DEFAULT '',
            forward_to TEXT DEFAULT '',
            webhook_url TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS email_attachments (
            id TEXT PRIMARY KEY,
            email_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            content_type TEXT DEFAULT 'application/octet-stream',
            size INTEGER DEFAULT 0,
            data BLOB,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_attachment_email ON email_attachments(email_id)")
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sent_emails (
            id TEXT PRIMARY KEY,
            from_address TEXT NOT NULL,
            to_address TEXT NOT NULL,
            subject TEXT DEFAULT '',
            body TEXT DEFAULT '',
            in_reply_to TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (in_reply_to) REFERENCES emails(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_inboxes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            address TEXT NOT NULL UNIQUE,
            label TEXT DEFAULT '',
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_email) REFERENCES premium_users(email)
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_inboxes ON user_inboxes(user_email)")
    
    # ---- Schema migrations for existing databases ----
    # Add new columns to existing tables if they don't exist
    _safe_add_column(cursor, "emails", "expires_at", "DATETIME DEFAULT NULL")
    _safe_add_column(cursor, "premium_users", "custom_alias", "TEXT DEFAULT ''")
    _safe_add_column(cursor, "premium_users", "forward_to", "TEXT DEFAULT ''")
    _safe_add_column(cursor, "premium_users", "webhook_url", "TEXT DEFAULT ''")
    
    conn.commit()
    conn.close()


def _safe_add_column(cursor, table, column, col_type):
    """Add a column to a table if it doesn't already exist."""
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
    except sqlite3.OperationalError:
        pass  # Column already exists


# Auto-initialize on import
init_db()
