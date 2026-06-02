# SafeNet SA, system overview (for building the app)

A practical map of what SafeNet is, what actually works today, how the pieces are
wired, and the end-to-end flows. Written as a reference for building the native
on-device app next.

## 1. What SafeNet is

A digital child-safety platform for South African families. Core promise:
on-device detection of scams/phishing/grooming/cyberbullying, WhatsApp-aware,
across the 11 official SA languages, POPIA-compliant by architecture (message
content never leaves the device or gets stored). The AI guardian is "Luna".

It is **not** a generic parental-control reskin. The moat is SA-specific:
local-language threat understanding, SA brand-aware link scanning (SASSA/SARS/
banks), and on-device privacy.

## 2. The three runtimes (how the system is split)

SafeNet is one product split across three deployable units, each with a clear
job and interface:

1. **Web app / PWA** (`safenet-sa/`) — React SPA: the marketing site, the parent
   dashboard, the Luna voice page, the link scanner. Deployed on Vercel. This is
   where almost everything user-facing lives today.
2. **Serverless API** (`safenet-sa/api/`) — Vercel functions. Thin, secret-holding
   proxies to third-party AI services (chat, STT, TTS) and billing webhooks. The
   browser never holds provider secret keys; it calls these.
3. **Voice inference service** (`voice-service/`) — a standalone FastAPI + Toucan
   TTS box on a free Hugging Face Space. Too heavy for serverless, so it runs
   always-on and is reached over HTTP. Synthesizes the 9 SA-language voices.

Plus two siblings: a **Chrome MV3 extension** (`safenet-sa/extension/`, "Family
Shield") that reuses the link-risk engine, and **`Luna-AI/`** (a separate Luna
service product, not the website).

The clean separation matters for the native app: the **client** (today the SPA,
tomorrow the phone app) owns capture + UX; the **serverless layer** owns secrets
+ provider fan-out; the **inference service** owns heavy models. You can keep that
same 3-tier shape on mobile.

## 3. Tech stack (web app)

React 18 + Vite 5 SPA · React Router v6 (lazy routes in `src/App.jsx`) ·
Tailwind with custom `safenet-*` design tokens · framer-motion + GSAP + Lenis for
motion · Leaflet/react-leaflet for maps · Supabase (auth + Postgres, lazy-loaded) ·
i18next (11 languages, `src/i18n/`) · recharts · qrcode.react · lucide-react icons.
PWA via `public/manifest.webmanifest` + `public/sw.js` (service worker registers
in prod only). Hosted on Vercel; pushing `main` auto-deploys production.

## 4. State + data: the demo-data fallback (important)

Two React contexts hold app state:
- `src/context/AuthContext.jsx` — Supabase auth (sign in/out, session).
- `src/context/AppContext.jsx` — family domain state: children, zones, alerts.

`AppContext` + `src/lib/db.js` return **bundled demo data** unless BOTH (a)
Supabase is configured via env AND (b) a parent is signed in. This is deliberate:
the build, marketing pages, and investor demos must never break when there is no
backend. Any data feature must preserve this "works with no backend" behavior.

So today: the dashboard, children, alerts, location map all render against demo
data out of the box; they switch to real Supabase data only for a signed-in
parent with env configured.

## 5. Pages and layout

- Marketing pages use `Nav` + `Footer`. Dashboard pages wrap content in
  `src/components/layout/DashboardShell.jsx` (sidebar + top bar).
- Every page renders `<SEO .../>` (`src/components/seo/SEO.jsx`).
- Pages (`src/pages/`): Landing, Auth, Dashboard (overview), Children, Child,
  Alerts, Location, Settings, Luna, Demo, LinkScanner, GetApp (`/app`),
  HowItWorks, Privacy, Terms, Popia.
- `index.html` carries a crawlable SEO text fallback inside `#root`, hidden from
  JS users (a `.js` class swaps it for a branded loader). Keep both behaviors.

## 6. What actually works today (real vs aspirational)

REAL and live:
- The full marketing site + SEO + PWA install flow (`/app`, QR to the live origin).
- **Luna voice conversation** (the `/luna` page): real STT, real LLM chat, real
  TTS, 11-language picker. See flow in section 8.
- **On-device link risk scanning** (`/link-scanner` + the extension): real,
  zero-network heuristic engine.
- Billing endpoints (Paystack initialize + webhook) exist server-side.
- The dashboard UI (overview, children, alerts, location map, settings) renders
  fully, on demo data by default and real Supabase data when signed in.

ASPIRATIONAL / not built yet (this is the roadmap, not shipped):
- The actual **on-device phone agent** that monitors WhatsApp/TikTok/Instagram
  messages on a child's Android device. The website describes this; the agent
  itself is the native-app program (roadmap Track 4).
- The **11-language threat *detection* model** (classifying grooming/bullying/
  scams in each language) is roadmap Track 3. Today's "understanding" is the
  link-risk heuristic + the LLM's general capability, not a trained SA-threat
  classifier.
- iPhone one-tap install does not exist (Apple rule): iOS is "Add to Home Screen"
  in Safari only; Android gets a one-tap WebAPK. There is no downloadable APK/IPA;
  it is a PWA.

Be honest about that line when building: the website is the storefront +
working Luna + working link scanner; the on-device guardian is the next build.

## 7. The on-device risk engine (`src/lib/linkRisk.js`)

A zero-network heuristic that scores a URL's risk using SA-aware rules (fake
SASSA/SARS/bank domains, lookalikes, suspicious TLDs, shorteners, etc.). It runs
entirely client-side, so no link ever leaves the device. It is **twinned**:
`src/lib/linkRisk.js` and `extension/linkRisk.js` must stay byte-for-byte in sync,
any change to one is mirrored to the other. For the native app, this is the
reference implementation to port to the device.

## 8. Luna voice pipeline (the most wired-up subsystem)

This is the conversational guardian. All orchestration lives in
`src/hooks/useLunaVoice.js`; the UI is `src/pages/Luna.jsx`.

### Components
- **VAD (capture):** Silero VAD loaded from CDN (`@ricky0123/vad-web` +
  onnxruntime-web). Detects speech start/end from the mic, hands back a Float32
  PCM chunk. Works cross-browser incl. Safari/iOS (with an audio-unlock dance on
  first user gesture).
- **STT (speech to text):** routed by language.
  - English -> `POST /api/luna-stt` -> proxies to a Groq Whisper endpoint.
  - isiZulu -> `POST /api/luna-transcribe` -> Vulavula (Lelapa AI) SA-language STT.
  - The other 9 languages have **no reliable STT**, so mic input is en/zu only.
- **Chat (the brain):** `POST /api/luna-chat` -> OpenRouter (default model
  `meta-llama/llama-3.3-70b-instruct`). System prompt makes Luna a warm SA child-
  safety guardian, 2-3 sentence spoken-style replies. A per-language directive
  ("reply entirely in <language>") makes her answer in the chosen language. Maps
  all 11 locale codes -> language names (`LANGUAGE_NAMES` in `api/luna-chat.js`).
- **TTS (voice out):** `src/lib/voiceRouter.js` picks the engine by language:
  - English -> Deepgram Aura via `POST /api/luna-tts` (high-quality).
  - 9 SA languages -> the Toucan voice service at `VITE_TOUCAN_TTS_URL`
    (`POST /tts {text, lang}` -> `audio/wav`). Flag-gated + an approval list
    (`APPROVED_TOUCAN_LANGS`) so only signed-off languages go live.
  - isiNdebele (`nr`) -> no model anywhere, text-only reply.
  - All audio plays through one managed `<audio>` element so the avatar mouth
    pulse + iOS unlock keep working; any TTS failure falls back to the browser
    voice (or text).

### Language config (single source of truth)
`src/lib/lunaLanguages.js` lists all 11 with `{ code, native, chatName,
canVoice, canMic }`. `canMic` is true only for en/zu; `canVoice` is false only for
nr. The picker on `/luna` reads this: it hides the mic for non-STT languages
(showing "type or tap a question" instead), and renders suggested-question chips
in the selected language (`src/data/lunaSuggestions.js`, en/zu human-checked, the
other 9 AI-drafted pending native review).

### Conversation flow (one turn)
```
user taps mic (or a suggested chip / types)
  -> [mic] VAD detects speech end -> Float32 PCM
  -> STT: /api/luna-stt (en) or /api/luna-transcribe (zu) -> text
     [chip/typed] -> text directly, language = the picked language
  -> chat: /api/luna-chat (message + history + language) -> reply text
  -> TTS: voiceRouter.speak(reply, lang)
        en  -> /api/luna-tts (Deepgram)
        9 SA -> {VITE_TOUCAN_TTS_URL}/tts (Toucan)
        nr  -> text only
  -> play audio through managed element, pulse avatar; fall back to
     browser voice on failure
  -> append both turns to conversation history; return to listening/idle
```

### The Toucan voice service (`voice-service/`)
FastAPI wrapping IMS-Toucan (MassiveScaleToucan). `GET /health` returns the
language map; `POST /tts {text, lang}` returns `audio/wav`. Runs on a free HF
Docker Space (CPU). Hard-won deploy lessons baked into the Dockerfile:
- `libportaudio2` is required (IMS-Toucan imports `sounddevice` even for file-only
  synthesis).
- Library caches (numba/matplotlib/torch/HF) must point at writable dirs because
  the Space runs as a non-root UID with read-only site-packages.
- Models (`ToucanTTS.pt`, `Vocoder.pt`, speechbrain ECAPA) must be **pre-baked at
  build time**; downloading at first request trips a 10s Hub read-timeout on the
  free tier and a non-cached file becomes a hard 500. `HF_HUB_DOWNLOAD_TIMEOUT=60`
  also helps. Apache-2.0 weights (commercial OK).

## 9. Security / privacy model (POPIA by architecture)

- Message analysis is **on-device**; content is never transmitted or persisted.
  Parents receive only threat alerts (category + severity), never chat content.
- Only public keys may use the `VITE_` prefix (Supabase URL + anon key). All
  secrets (service-role keys, provider keys, webhooks) live in `api/` env only,
  never bundled. Provider calls are proxied through serverless functions so keys
  stay server-side.
- Carry this forward on mobile: do detection on-device, send only alert metadata.

## 10. Deploy + ops

- Push to `main` -> Vercel builds (`vite build`, output `dist/`) and deploys
  production. SPA rewrite `/((?!api/).*) -> /index.html`. Live:
  `safe-net-murex.vercel.app` (custom domain `safenet-sa.co.za` not yet wired).
- The voice service deploys separately by pushing `voice-service/` to its HF
  Space (separate repo); a Vercel deploy does not touch it.
- `VITE_TOUCAN_TTS_URL` (public) points the web app at the voice service.
- No test suite/linter; "verify" = `npm run build` passes + check the preview.
- Windows: standalone Node scripts must be `.cjs` (`"type": "module"`).

## 11. Building the native app: what to reuse

- **Risk engine:** port `linkRisk.js` directly, it is dependency-free heuristics.
- **3-tier shape:** keep client / serverless-secrets / heavy-inference separation.
- **Luna pipeline:** the same VAD -> STT -> chat -> TTS chain applies; on-device
  you can swap CDN VAD for a native VAD and consider on-device STT/TTS later.
- **Language matrix:** `lunaLanguages.js` (canMic/canVoice per language) is the
  capability map to respect on mobile too.
- **The real engineering program** is roadmap Track 3 (11-language threat
  *detection* model) and Track 4 (on-device guardian). See `docs/LUNA_ROADMAP.md`.
