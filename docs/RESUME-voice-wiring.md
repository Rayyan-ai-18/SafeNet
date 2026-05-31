# RESUME — Luna voice wiring (start a fresh session, point me here)

Read `CLAUDE.md` (repo root) first for project rules. Repo: `D:\SafeNet`, app in
`safenet-sa/`. Everything below is on `main` and deployed.

## State
- **Client wiring DONE** (this session, not yet pushed): `voiceRouter` is wired into
  `useLunaVoice` additively. English -> Deepgram and Zulu -> browser voice are unchanged.
  SA languages route to Toucan ONLY when listed in `APPROVED_TOUCAN_LANGS`
  (`src/lib/voiceRouter.js`), which is currently EMPTY, so nothing is live yet.
- **Toucan Space is NOT actually working.** `/health` returns the 10-language map but
  never touches the model, so it is green even though synthesis fails. `POST /tts`
  returns `500 synthesis failed: OSError` (repeatable, instant). Local samples in
  `voice-lab/samples-toucan/` were generated fine, so the bug is HF-Space-specific.
- **Fix shipped to `voice-service/` (needs redeploy to the HF Space):** Dockerfile now
  routes numba/matplotlib/torch/HF caches to writable dirs (likely OSError cause: those
  libs writing next to read-only site-packages as UID 1000), and `app.py` now logs the
  full traceback + returns the real error message instead of just the type.
  Redeploy the Space, hit `/tts`, and read the now-unmasked error if it still fails.
- `src/lib/voiceRouter.js` = client router, flag-gated by `VITE_TOUCAN_TTS_URL`.
- Honest voice copy is live (English + Zulu spoken today; 11 for text/understanding).
  Fabricated traction (50 schools / testimonials) already removed.
- `voice-lab/samples-toucan/*.wav` = generated samples for per-language sign-off.

## Next steps (the actual remaining task)
1. **Confirm env:** `VITE_TOUCAN_TTS_URL = https://rayyankhan18-safenet-luna-voice.hf.space`
   is set in Vercel (web app), then redeploy. (First `/tts` call is slow ~1-2 min,
   it downloads the model once, then fast. TTS only works in prod, not local dev.)
2. **Wire it (carefully, additively):** in `src/hooks/useLunaVoice.js`, route TTS via
   `voiceRouter.speak(text, lang)`:
   - English -> Deepgram (`/api/luna-tts`) EXACTLY as today (do not regress this).
   - The 9 SA languages -> Toucan service via voiceRouter.
   - Ndebele (`nbl`) -> text alert (no voice model).
   Keep the existing en/zu flow working if the flag/service is absent.
3. **Test end-to-end on the deployed site** (verify before claiming).
4. **Enable only languages signed off by ear** (listen to `voice-lab/samples-toucan/`).

## Guardrails (from CLAUDE.md)
Don't redesign the UI; no em dashes on the website; secrets server-side only;
`src/lib/linkRisk.js` and `extension/linkRisk.js` stay in sync; never push to
`main` without asking. Toucan weights are Apache-2.0 (commercial OK).

## Bigger roadmap
`docs/LUNA_ROADMAP.md` — Track 3 (11-language threat *detection* model) and
Track 4 (native on-device guardian app) are the core engineering program.

## Cost note
Keep sessions short + scoped. The `ecc` plugin was disabled (it bloated context).
Other enabled plugins: claude-mem, superpowers, marketing-skills, finance-skills.
