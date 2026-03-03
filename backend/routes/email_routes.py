from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from services import mailbox
import re
import math
from collections import Counter

class SummarizeRequest(BaseModel):
    text: str

router = APIRouter()


# --- Local Extractive Summarizer ---
def _split_sentences(text: str) -> list[str]:
    """Split text into sentences."""
    text = re.sub(r'\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|inc|ltd)\.',
                  lambda m: m.group().replace('.', '<DOT>'), text, flags=re.IGNORECASE)
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.replace('<DOT>', '.').strip() for s in sentences if len(s.strip()) > 10]


def _summarize_text(text: str, num_sentences: int = 3) -> str:
    sentences = _split_sentences(text)
    if len(sentences) <= num_sentences:
        return text.strip()

    stop_words = {
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
        'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
        'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each',
        'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some',
        'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very',
        'just', 'because', 'if', 'when', 'where', 'how', 'what', 'which',
        'who', 'whom', 'this', 'that', 'these', 'those', 'it', 'its',
        'he', 'she', 'they', 'we', 'you', 'i', 'me', 'him', 'her', 'us',
        'them', 'my', 'your', 'his', 'our', 'their', 'up', 'out', 'about',
    }

    words = re.findall(r'[a-zA-Z]+', text.lower())
    word_freq = Counter(w for w in words if w not in stop_words and len(w) > 2)

    if not word_freq:
        return sentences[0]

    max_freq = max(word_freq.values())
    word_freq = {w: f / max_freq for w, f in word_freq.items()}

    scored = []
    for idx, sentence in enumerate(sentences):
        sent_words = re.findall(r'[a-zA-Z]+', sentence.lower())
        if not sent_words:
            scored.append((idx, 0))
            continue
        score = sum(word_freq.get(w, 0) for w in sent_words) / (math.log(len(sent_words) + 1) + 1)
        if idx == 0:
            score *= 1.2
        scored.append((idx, score))

    top = sorted(scored, key=lambda x: x[1], reverse=True)[:num_sentences]
    top_indices = sorted([idx for idx, _ in top])
    summary = ' '.join(sentences[i] for i in top_indices)
    return summary


# --- Email Routes ---

@router.post("/accounts")
async def create_account():
    """Generates a new random email address on vredobox.cc."""
    try:
        data = mailbox.generate_address()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages")
async def get_messages(address: str = Query(..., description="Email address to fetch messages for")):
    """Fetches messages for a given email address from the local database."""
    try:
        return mailbox.get_messages(address)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages/{message_id}")
async def get_message(message_id: str):
    """Fetches a single message by ID."""
    try:
        msg = mailbox.get_message(message_id)
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        return msg
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/messages/{message_id}")
async def delete_message(message_id: str):
    """Deletes a message by ID."""
    try:
        success = mailbox.delete_message(message_id)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
async def summarize_email(req: SummarizeRequest):
    """Summarizes email text using local extractive summarization."""
    if not req.text or len(req.text.strip()) < 50:
        return {"summary": "Text is too short to summarize."}

    try:
        clean_text = re.sub(r'<[^>]+>', ' ', req.text)
        clean_text = re.sub(r'https?://\S+', '', clean_text)
        clean_text = re.sub(r'\[https?://[^\]]*\]', '', clean_text)
        clean_text = re.sub(r'\[.*?\]', '', clean_text)
        clean_text = re.sub(r'\S+@\S+\.\S+', '', clean_text)
        clean_text = re.sub(r'[\[\]]', '', clean_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()

        summary = _summarize_text(clean_text, num_sentences=3)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary error: {str(e)}")
