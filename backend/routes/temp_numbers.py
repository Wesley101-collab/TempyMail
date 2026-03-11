"""
Temp Number Aggregation — scrapes receive-smss.com for free public phone numbers and their messages.
Results are cached in memory with a 5-minute TTL to avoid hammering the source.
"""

from fastapi import APIRouter, HTTPException
import httpx
import time
import re
from bs4 import BeautifulSoup

router = APIRouter()

# --- In-memory cache ---
_cache = {}
CACHE_TTL = 300  # 5 minutes

SOURCE_BASE = "https://receive-smss.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

# Country code → flag emoji
COUNTRY_FLAGS = {
    "united states": "🇺🇸", "canada": "🇨🇦", "united kingdom": "🇬🇧",
    "germany": "🇩🇪", "france": "🇫🇷", "netherlands": "🇳🇱",
    "spain": "🇪🇸", "italy": "🇮🇹", "sweden": "🇸🇪",
    "denmark": "🇩🇰", "norway": "🇳🇴", "finland": "🇫🇮",
    "belgium": "🇧🇪", "austria": "🇦🇹", "switzerland": "🇨🇭",
    "portugal": "🇵🇹", "poland": "🇵🇱", "czech republic": "🇨🇿",
    "romania": "🇷🇴", "hungary": "🇭🇺", "nigeria": "🇳🇬",
    "india": "🇮🇳", "indonesia": "🇮🇩", "brazil": "🇧🇷",
    "mexico": "🇲🇽", "australia": "🇦🇺", "russia": "🇷🇺",
    "ukraine": "🇺🇦", "colombia": "🇨🇴", "philippines": "🇵🇭",
    "thailand": "🇹🇭", "south africa": "🇿🇦", "kenya": "🇰🇪",
    "israel": "🇮🇱", "hong kong": "🇭🇰", "singapore": "🇸🇬",
    "malaysia": "🇲🇾", "new zealand": "🇳🇿", "ireland": "🇮🇪",
    "estonia": "🇪🇪", "latvia": "🇱🇻", "lithuania": "🇱🇹",
    "croatia": "🇭🇷", "slovakia": "🇸🇰", "moldova": "🇲🇩",
}


def _get_cached(key):
    if key in _cache:
        data, ts = _cache[key]
        if time.time() - ts < CACHE_TTL:
            return data
    return None


def _set_cached(key, data):
    _cache[key] = (data, time.time())


def _parse_numbers_page(html: str):
    """Parse the main page to extract phone numbers with their countries."""
    soup = BeautifulSoup(html, "html.parser")
    numbers = []
    
    # receive-smss.com lists numbers as links like /sms/12812166971/
    links = soup.find_all("a", href=re.compile(r"/sms/\d+/"))
    
    seen = set()
    for link in links:
        href = link.get("href", "")
        match = re.search(r"/sms/(\d+)/", href)
        if not match:
            continue
        
        raw_number = match.group(1)
        if raw_number in seen:
            continue
        seen.add(raw_number)
        
        # Get the link text which contains the number and country
        text = link.get_text(separator="\n", strip=True)
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        
        country = "Unknown"
        display_number = f"+{raw_number}"
        
        for line in lines:
            if line.startswith("+"):
                display_number = line
            elif not line.startswith("+") and line.lower() != "open" and len(line) > 2:
                country = line
        
        flag = COUNTRY_FLAGS.get(country.lower(), "🌍")
        
        numbers.append({
            "number": raw_number,
            "display": display_number,
            "country": country,
            "flag": flag,
        })
    
    return numbers


def _parse_messages_page(html: str):
    """Parse a number's message page to extract received SMS.
    
    receive-smss.com uses a div-based grid layout with Message/Sender/Time columns.
    Each message block is a rounded box containing a .row with 3 columns.
    """
    soup = BeautifulSoup(html, "html.parser")
    messages = []
    
    # Strategy 1: Find div blocks containing "Message", "Sender", "Time" labels
    # Each message is in a container div with a grey background + row layout
    all_rows = soup.find_all("div", class_=re.compile(r"row"))
    
    for row in all_rows:
        cols = row.find_all("div", recursive=False)
        if len(cols) < 2:
            # Also try col-based classes
            cols = row.find_all("div", class_=re.compile(r"col"))
        
        if len(cols) < 2:
            continue
        
        # Extract text from each column, skip label text like "Message", "Sender", "Time"
        col_texts = []
        for col in cols:
            # Get all text, remove known labels
            text = col.get_text(separator="\n", strip=True)
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            # Filter out label-only lines
            filtered = [l for l in lines if l.lower() not in ("message", "sender", "time", "from")]
            col_texts.append("\n".join(filtered))
        
        # We need at least message text and sender
        if len(col_texts) >= 2 and any(len(t) > 3 for t in col_texts):
            # Determine which column is which based on content/position
            # Typical order: Sender | Message | Time  OR  Message | Sender | Time
            msg_text = ""
            sender = "Unknown"
            time_str = ""
            
            if len(col_texts) >= 3:
                # 3-column layout: could be [Sender, Message, Time] or [Message, Sender, Time]
                # Heuristic: longest text is likely the message
                lengths = [(len(t), i) for i, t in enumerate(col_texts)]
                lengths.sort(reverse=True)
                msg_idx = lengths[0][1]
                msg_text = col_texts[msg_idx]
                
                remaining = [i for i in range(len(col_texts)) if i != msg_idx]
                # Shortest remaining is likely the time
                if len(col_texts[remaining[0]]) <= len(col_texts[remaining[1]]):
                    time_str = col_texts[remaining[0]]
                    sender = col_texts[remaining[1]]
                else:
                    time_str = col_texts[remaining[1]]
                    sender = col_texts[remaining[0]]
            elif len(col_texts) == 2:
                msg_text = col_texts[0] if len(col_texts[0]) > len(col_texts[1]) else col_texts[1]
                sender = col_texts[1] if len(col_texts[0]) > len(col_texts[1]) else col_texts[0]
            
            # Validate: skip if message text looks like navigation/header content
            skip_words = ["update messages", "give me another", "skip the signup", "chrome extension",
                         "receive sms", "how to", "registration free", "advantages", "worldwide"]
            if any(sw in msg_text.lower() for sw in skip_words):
                continue
            if len(msg_text) < 3 or len(msg_text) > 500:
                continue
            # Skip if sender looks like a time
            if "ago" in sender.lower():
                sender, time_str = time_str, sender
                if not sender:
                    sender = "Unknown"
            
            messages.append({
                "sender": sender[:100] or "Unknown",
                "text": msg_text[:500],
                "time": time_str[:50]
            })
    
    if messages:
        return messages[:50]
    
    # Strategy 2: Table-based fallback
    table = soup.find("table")
    if table:
        rows = table.find_all("tr")
        for row in rows[1:]:
            cells = row.find_all("td")
            if len(cells) >= 3:
                sender = cells[0].get_text(strip=True)
                msg_text = cells[1].get_text(strip=True)
                time_str = cells[2].get_text(strip=True)
                if msg_text:
                    messages.append({
                        "sender": sender or "Unknown",
                        "text": msg_text[:500],
                        "time": time_str
                    })
    
    # Strategy 3: Look for any repeated pattern with "ago" (time indicator)
    if not messages:
        ago_elements = soup.find_all(string=re.compile(r"\d+\s+(minute|hour|day|second)s?\s+ago"))
        for el in ago_elements:
            parent = el.find_parent("div")
            if parent:
                container = parent.find_parent("div")
                if container:
                    full_text = container.get_text(separator=" | ", strip=True)
                    parts = [p.strip() for p in full_text.split("|") if p.strip()]
                    parts = [p for p in parts if p.lower() not in ("message", "sender", "time")]
                    if len(parts) >= 2:
                        messages.append({
                            "sender": parts[0][:100] if not "ago" in parts[0] else "Unknown",
                            "text": next((p for p in parts if len(p) > 10 and "ago" not in p), parts[0])[:500],
                            "time": next((p for p in parts if "ago" in p.lower()), "")[:50]
                        })
    
    return messages[:50]


@router.get("/temp-numbers/list")
async def list_temp_numbers():
    """Get list of available temporary phone numbers."""
    cached = _get_cached("numbers_list")
    if cached:
        return {"numbers": cached, "cached": True}
    
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(SOURCE_BASE + "/", headers=HEADERS)
            resp.raise_for_status()
        
        numbers = _parse_numbers_page(resp.text)
        if numbers:
            _set_cached("numbers_list", numbers)
        
        return {"numbers": numbers, "cached": False}
    except Exception as e:
        # Return cached data even if expired
        if "numbers_list" in _cache:
            return {"numbers": _cache["numbers_list"][0], "cached": True}
        raise HTTPException(status_code=502, detail=f"Failed to fetch numbers: {str(e)}")


@router.get("/temp-numbers/messages/{number}")
async def get_number_messages(number: str):
    """Get recent SMS messages for a specific temp number."""
    # Validate number (digits only)
    if not number.isdigit():
        raise HTTPException(status_code=400, detail="Invalid number format")
    
    cache_key = f"messages_{number}"
    cached = _get_cached(cache_key)
    if cached:
        return {"messages": cached, "cached": True}
    
    try:
        url = f"{SOURCE_BASE}/sms/{number}/"
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers=HEADERS)
            resp.raise_for_status()
        
        messages = _parse_messages_page(resp.text)
        _set_cached(cache_key, messages)
        
        return {"messages": messages, "cached": False}
    except Exception as e:
        if cache_key in _cache:
            return {"messages": _cache[cache_key][0], "cached": True}
        raise HTTPException(status_code=502, detail=f"Failed to fetch messages: {str(e)}")
