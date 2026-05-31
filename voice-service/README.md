---
title: SafeNet Luna Voice
emoji: 🛡️
colorFrom: green
colorTo: blue
sdk: docker
app_port: 8080
pinned: false
license: apache-2.0
short_description: Toucan TTS voice for SafeNet Luna (SA languages)
---

# Luna Voice Service (Toucan TTS)

> The YAML block above is the Hugging Face Space config (Docker SDK, port 8080).
> Push this whole folder to a HF Space to deploy free. See "Deploy free on
> Hugging Face Spaces" below.

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

## Deploy free on Hugging Face Spaces (recommended for pilot/demo)
Free CPU tier (16GB RAM). Sleeps after ~48h idle (cold start ~1-2 min), fine
for a pilot/investor demo, not production-grade always-on.

1. Create a free account at huggingface.co.
2. **New** -> **Space**. Name it e.g. `safenet-luna-voice`. **SDK = Docker**
   (blank template). Hardware: **CPU basic (free)**. Visibility: Public.
3. Upload this folder's files to the Space (drag-and-drop in the Space's
   **Files** tab, or `git push` to the Space repo):
   `README.md`, `Dockerfile`, `app.py`, `requirements.txt`.
   (The YAML at the top of this README is the Space config, sdk: docker,
   app_port: 8080.)
4. The Space builds automatically (~10-20 min first time; it bakes in the
   Toucan model). When it shows **Running**, your endpoint is:
   `https://<your-username>-safenet-luna-voice.hf.space`
5. Test it: open `https://<...>.hf.space/health` -> should return the language
   list. Or `POST /tts {"text":"Sawubona","lang":"zu"}`.
6. Put that base URL in the web app env (Vercel project settings):
   `VITE_TOUCAN_TTS_URL=https://<your-username>-safenet-luna-voice.hf.space`
   then redeploy the web app. Tell me when it's live and I'll wire
   `voiceRouter.speak()` into Luna and enable the languages you approve.

Note: the first deploy may need a small tweak (build time / permissions),
share the Space build log if it fails and I'll fix it.

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
