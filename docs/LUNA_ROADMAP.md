# Luna Guardian Roadmap — voice + detection in all 11 SA languages

Mission: in the online world, Luna is the guardian. She must **detect, protect,
and prevent** harm to South African children, and **speak and understand** all
11 official languages. This doc sequences the four tracks to get there and draws
the honest line between what the **PWA/website** can do and what needs the
**native app**.

## The hard platform line (read first)
- A **PWA/website is sandboxed**: it cannot read other apps (WhatsApp, TikTok)
  or capture the device screen. It can never be the real on-device monitor.
- **Real monitoring** = native Android app (AccessibilityService for text,
  MediaProjection for screen, on-device Luna model) + the Family Shield
  browser extension on desktop. This is permissioned, on-device, POPIA-safe,
  which is exactly why it is protection, not surveillance.
- The **website/PWA** is the world-class showcase + parent dashboard + the
  investor demo. "Luna takes over the screen" in the PWA is a **scripted
  simulation** of the real capability, honest as a demo, never faked as live.

## Track 1 — Investor "Luna in action" demo (PWA, ship first)
Goal: after add-to-home-screen it feels like a real app; a guided, cinematic,
real-time-feel simulation of Luna catching a threat in a chosen SA language,
narrating, and "taking over". Built within the existing design system + GSAP.
- Enhance `src/pages/Demo.jsx`: language picker (11), scripted incoming threat
  (cyberbullying/grooming/scam) in that language, Luna detects, explains, acts.
- Clear "Demonstration" framing. Deepgram voice for EN; Toucan/sample audio for
  others once Track 2 lands.
- Acceptance: runs in installed PWA, no console errors, responsive, on-brand.

## Track 2 — Toucan voice microservice (real voice for 10/11)
Goal: Luna actually speaks 10 languages (Ndebele = text until recorded).
1. **Service**: container wrapping `ToucanTTSInterface`, `POST /tts {text,lang}`
   → audio. Not Vercel serverless (too heavy); a small always-on worker/box.
2. **Cache**: alert phrasings are finite; synthesize once, store audio
   (Supabase Storage/CDN). COGS stays near zero.
3. **Router** in `useLunaVoice`: `en`→Deepgram (unchanged), 9→Toucan, `nbl`→text.
   Extend `detectLanguage()` from en/zu to all 11.
4. **Quality gate**: ship a language's voice only after human sign-off of its
   sample (samples already generated in `voice-lab/samples-toucan/`).
License: Toucan is Apache-2.0 (commercial-safe). Deepgram stays for EN quality.

## Track 3 — Detection in all 11 languages (the moat)
Goal: Luna detects cyberbullying, grooming, phishing, adult content across all
11 languages, on-device. Today `src/lib/linkRisk.js` is a link/scam heuristic
(SA-brand-aware); text-threat detection is the core Luna-AI model work.
- Phase A: multilingual keyword/slang lexicons per language (fast, on-device,
  ships in the extension + app heuristic; mirror `linkRisk.js` twin rule).
- Phase B: small on-device multilingual classifier for grooming/bullying
  patterns (the real model), trained with Childline SA guidance.
- Privacy: on-device only; message content never leaves the device (POPIA).

## Track 4 — Native guardian app (the real monitor)
Goal: the actual on-device guardian.
- Android app (Capacitor or native): AccessibilityService reads notification/
  message text for Luna to scan; optional MediaProjection for screen events;
  runs the Track-3 model on-device; talks via Track-2 voices.
- Parental consent + POPIA flows; cannot-be-uninstalled (device admin).
- The PWA dashboard (this repo) is the parent's control surface for it.

## Sequence & dependencies
1. **Track 1 (demo)** now — fastest, fundraising impact, PWA-only.
2. **Track 2 (Toucan service)** — unblocks real voice; demo can use its audio.
3. **Track 3 (detection)** — the moat; longest; starts in parallel as research.
4. **Track 4 (native app)** — the real product; depends on Track 3 model.

PWA showcase is near investor-grade today. Tracks 3 + 4 are the company's core
engineering program toward the billion-rand goal.
