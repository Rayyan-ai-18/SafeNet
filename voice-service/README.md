# Luna Voice Service (Toucan TTS)

Always-on inference service that gives Luna a voice in the South African
languages Toucan covers (10 of 11; **Southern Ndebele has no model**, the web
app falls back to a text alert for it). English stays on Deepgram in the web
app; this service covers the other 9 (and English if you want one engine).

Why a separate service: Toucan (diffusion-ish VITS + speaker embedding) is far
too heavy for Vercel serverless. It runs on a small always-on box (CPU works;
GPU is faster).

## Endpoints
- `GET /health` -> `{ ok, languages }`
- `POST /tts` `{ "text": "...", "lang": "zu" }` -> `audio/wav`
  - `lang` is the app locale code: `en zu xh af st tn nso ve ts ss`
  - `nbl` (Ndebele) is intentionally unsupported (422); caller shows text.

## Run locally
```bash
cd voice-service
uv venv && uv pip install -r requirements.txt
# Toucan must be importable: clone it or point TOUCAN_REPO at a checkout
#   git clone -b MassiveScaleToucan https://github.com/DigitalPhonetics/IMS-Toucan
uvicorn app:app --host 0.0.0.0 --port 8080
```

## Deploy
```bash
docker build -t luna-voice .
docker run -p 8080:8080 luna-voice    # add --gpus all + a CUDA base for GPU
```
Host it (Fly.io / Render / a small VM), then set in the web app:
```
VITE_TOUCAN_TTS_URL=https://your-voice-service.example.com
```
`src/lib/voiceRouter.js` reads that flag. If unset, the app keeps today's
behavior (Deepgram for English, browser voice for Zulu).

## Cost control (do before production)
Alert phrasings are a finite set. Cache synthesized audio in Supabase
Storage/CDN keyed by `sha1(lang:text)` (`cache_key` in `app.py`), so each phrase
is synthesized ~once and served from cache thereafter. Keeps COGS near zero.

## Quality gate
Generate a sample per language (see `voice-lab/`), have a native speaker sign
off, and only enable that language in `voiceRouter.js` once approved.

## License
Toucan model weights: Apache-2.0 (commercial use OK). Deepgram (English) is
separately licensed via your existing key.
