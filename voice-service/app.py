"""
SafeNet Luna voice service — Toucan TTS for South African languages.

A small always-on inference service (NOT Vercel serverless; Toucan is too heavy).
Wraps IMS Toucan to synthesize speech for the SA languages it covers (10 of 11;
Southern Ndebele has no model, callers fall back to text). English stays on
Deepgram in the web app; this service serves the other 9 plus English if needed.

Run (dev):
    cd voice-service
    uv venv && uv pip install -r requirements.txt
    # IMS-Toucan must be importable (clone it, or set TOUCAN_REPO to its path)
    uvicorn app:app --host 0.0.0.0 --port 8080

Deploy: containerize with the Dockerfile; put it behind the web app via the
VITE_TOUCAN_TTS_URL env var. Cache responses (see /tts notes) to keep COGS low.

License note: Toucan model weights are Apache-2.0 (commercial-safe).
"""
import io
import os
import sys
import wave
import hashlib
import traceback
from functools import lru_cache

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

# Allow importing IMS-Toucan from a sibling clone or an env-configured path.
TOUCAN_REPO = os.environ.get("TOUCAN_REPO", os.path.join(os.path.dirname(__file__), "..", "voice-lab", "IMS-Toucan"))
if os.path.isdir(TOUCAN_REPO):
    sys.path.insert(0, TOUCAN_REPO)

# SA languages Toucan covers -> ISO 639-3. Ndebele (nbl) intentionally absent.
SA_TO_ISO = {
    "en": "eng", "zu": "zul", "xh": "xho", "af": "afr", "st": "sot",
    "tn": "tsn", "nso": "nso", "ve": "ven", "ts": "tso", "ss": "ssw",
}

app = FastAPI(title="SafeNet Luna Voice (Toucan)", version="0.1.0")
_tts = None  # lazy singleton


def get_tts():
    global _tts
    if _tts is None:
        from InferenceInterfaces.ToucanTTSInterface import ToucanTTSInterface
        device = os.environ.get("TOUCAN_DEVICE", "cpu")
        _tts = ToucanTTSInterface(device=device)
    return _tts


class TTSRequest(BaseModel):
    text: str
    lang: str = "en"  # SA locale code (en, zu, xh, af, st, tn, nso, ve, ts, ss)


@app.get("/health")
def health():
    return {"ok": True, "languages": sorted(SA_TO_ISO.keys())}


@app.post("/tts")
def tts(req: TTSRequest):
    """Synthesize speech. Returns audio/wav. Ndebele (nbl) is unsupported by
    design, callers should fall back to a text alert for it."""
    if not req.text or len(req.text) > 600:
        raise HTTPException(400, "text must be 1-600 chars")
    iso = SA_TO_ISO.get(req.lang)
    if not iso:
        raise HTTPException(422, f"language '{req.lang}' has no Toucan voice (Ndebele uses text)")
    try:
        wav_bytes = _synth_cached(req.text, iso)
    except Exception as e:  # pragma: no cover
        # Log the full traceback to stderr (visible in the HF Space "Logs" tab)
        # and surface a short reason so failures are diagnosable, not opaque.
        traceback.print_exc()
        raise HTTPException(500, f"synthesis failed: {type(e).__name__}: {e}")
    return Response(content=wav_bytes, media_type="audio/wav",
                    headers={"Cache-Control": "public, max-age=31536000"})


@lru_cache(maxsize=512)
def _synth_cached(text: str, iso: str) -> bytes:
    """In-process cache. In production also cache the bytes in Supabase
    Storage/CDN keyed by sha1(text+iso) so restarts and multiple instances
    reuse audio, alert phrasings are finite, so compute happens ~once."""
    import tempfile
    tts = get_tts()
    tts.set_language(iso)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        path = tmp.name
    try:
        tts.read_to_file([text], path, silent=True)
        with open(path, "rb") as fh:
            return fh.read()
    finally:
        try:
            os.remove(path)
        except OSError:
            pass


def cache_key(text: str, iso: str) -> str:
    return hashlib.sha1(f"{iso}:{text}".encode("utf-8")).hexdigest()
