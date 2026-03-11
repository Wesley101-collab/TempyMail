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
    """Parse a number's message page to extract received SMS."""
    soup = BeautifulSoup(html, "html.parser")
    messages = []
    
    # Look for message rows in the table
    table = soup.find("table")
    if not table:
        # Try alternate structure — some pages use div-based layouts
        msg_divs = soup.find_all("div", class_=re.compile(r"message|sms|row"))
        for div in msg_divs:
            text = div.get_text(separator=" ", strip=True)
            if len(text) > 10:
                messages.append({
                    "sender": "Unknown",
                    "text": text[:500],
                    "time": ""
                })
        return messages[:50]
    
    rows = table.find_all("tr")
    for row in rows[1:]:  # Skip header
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
