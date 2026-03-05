import random
import string
import uuid
from services.database import get_connection

EMAIL_DOMAIN = "vredobox.cc"

ADJECTIVES = ["swift", "silent", "clever", "brave", "happy", "lucky", "stellar", "bright", "cool", "smart", "wild", "calm", "gentle", "fancy", "sneaky", "bold", "keen", "quick", "sharp", "vivid"]
NOUNS = ["fox", "bear", "wolf", "eagle", "tiger", "lion", "panda", "koala", "hawk", "owl", "frog", "duck", "swan", "crane", "cat", "lynx", "dove", "moth", "wren", "kite"]
NAMES = ["alex", "jordan", "taylor", "morgan", "casey", "riley", "sam", "jamie", "drew", "avery", "blake", "cameron", "devon", "elliot", "quinn", "john", "jane", "michael", "sarah", "david", "emily"]


def generate_address(ip_address: str = "") -> dict:
    """Generate a random email address on our domain."""
    pattern = random.choice(["adj_noun", "name_num", "name_name"])
    if pattern == "adj_noun":
        base = f"{random.choice(ADJECTIVES)}{random.choice(NOUNS)}"
    elif pattern == "name_num":
        base = f"{random.choice(NAMES)}{random.randint(10, 999)}"
    else:
        base = f"{random.choice(NAMES)}{random.choice(NAMES)}"
    
    suffix = str(random.randint(10, 99))
    address = f"{base}{suffix}@{EMAIL_DOMAIN}"
    account_id = str(uuid.uuid4())[:8]
    
    # Log the account creation and IP for analytics
    analytics_val = f"{address}|{ip_address}" if ip_address else address
    
    conn = get_connection()
    conn.execute("INSERT INTO analytics (event, value) VALUES (?, ?)", ("account_created", analytics_val))
    conn.commit()
    conn.close()
    
    return {
        "id": account_id,
        "address": address
    }


def get_messages(address: str) -> dict:
    """Fetch all messages for a given email address."""
    conn = get_connection()
    cursor = conn.execute(
        "SELECT id, recipient, sender, sender_name, subject, text_body, has_attachments, created_at FROM emails WHERE LOWER(recipient) = LOWER(?) ORDER BY created_at DESC",
        (address,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    messages = []
    for row in rows:
        messages.append({
            "id": row["id"],
            "from": {"address": row["sender"], "name": row["sender_name"]},
            "to": [{"address": row["recipient"]}],
            "subject": row["subject"],
            "intro": row["text_body"][:100] if row["text_body"] else "",
            "hasAttachments": bool(row["has_attachments"]),
            "createdAt": row["created_at"],
            "seen": False
        })
    
    return {
        "totalItems": len(messages),
        "messages": messages
    }


def get_message(message_id: str) -> dict:
    """Fetch a single message by its ID."""
    conn = get_connection()
    cursor = conn.execute(
        "SELECT * FROM emails WHERE id = ?",
        (message_id,)
    )
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return None
    
    # Fetch replies
    cursor = conn.execute(
        "SELECT id, from_address, to_address, subject, body, created_at FROM sent_emails WHERE in_reply_to = ? ORDER BY created_at ASC",
        (message_id,)
    )
    reply_rows = cursor.fetchall()
    conn.close()
    
    replies = []
    for r in reply_rows:
        replies.append({
            "id": r["id"],
            "from": {"address": r["from_address"], "name": "Me"},
            "to": [{"address": r["to_address"]}],
            "subject": r["subject"],
            "text": r["body"],
            "createdAt": r["created_at"]
        })
    
    return {
        "id": row["id"],
        "from": {"address": row["sender"], "name": row["sender_name"]},
        "to": [{"address": row["recipient"]}],
        "subject": row["subject"],
        "text": row["text_body"],
        "html": [row["html_body"]] if row["html_body"] else [],
        "hasAttachments": bool(row["has_attachments"]),
        "createdAt": row["created_at"],
        "seen": True,
        "replies": replies
    }


def delete_message(message_id: str) -> bool:
    """Delete a message by ID."""
    conn = get_connection()
    cursor = conn.execute("DELETE FROM emails WHERE id = ?", (message_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted
