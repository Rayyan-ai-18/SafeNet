// Luna voice router: picks the right TTS engine per language.
//
//   English (en)  -> Deepgram Aura via /api/luna-tts   (today's high-quality voice)
//   9 SA langs    -> Toucan voice service (VITE_TOUCAN_TTS_URL)   [Track 2]
//   Ndebele (nbl) -> no voice anywhere; caller shows a text alert
//
// ADDITIVE + FLAG-GATED: if VITE_TOUCAN_TTS_URL is unset, only English speaks
// (via Deepgram) and the rest report { spoken: false } so callers fall back to
// text/browser. Wiring this into useLunaVoice is a deliberate follow-up once
// the service is deployed and each language's quality is signed off.

const TOUCAN_URL = import.meta.env.VITE_TOUCAN_TTS_URL || ''

// Languages the Toucan service can voice (Ndebele 'nbl' excluded by design).
export const TOUCAN_LANGS = ['zu', 'xh', 'af', 'st', 'tn', 'nso', 've', 'ts', 'ss']

function playAudio(src) {
  return new Promise((resolve) => {
    try {
      const audio = new Audio(src)
      audio.onended = () => resolve(true)
      audio.onerror = () => resolve(false)
      audio.play().catch(() => resolve(false))
    } catch {
      resolve(false)
    }
  })
}

// English via the existing Deepgram proxy (returns { audio: base64, format }).
async function speakEnglish(text, gender = 'F') {
  try {
    const res = await fetch('/api/luna-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, gender }),
    })
    if (!res.ok) return { spoken: false, reason: 'deepgram-error' }
    const data = await res.json()
    if (!data.audio) return { spoken: false, reason: 'no-audio' }
    const ok = await playAudio(`data:audio/${data.format || 'mp3'};base64,${data.audio}`)
    return { spoken: ok, engine: 'deepgram' }
  } catch {
    return { spoken: false, reason: 'network' }
  }
}

// The 9 SA languages via the Toucan service (returns audio/wav).
async function speakToucan(text, lang) {
  if (!TOUCAN_URL) return { spoken: false, reason: 'service-not-configured' }
  try {
    const res = await fetch(`${TOUCAN_URL.replace(/\/$/, '')}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
    })
    if (!res.ok) return { spoken: false, reason: `toucan-${res.status}` }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const ok = await playAudio(url)
    URL.revokeObjectURL(url)
    return { spoken: ok, engine: 'toucan' }
  } catch {
    return { spoken: false, reason: 'network' }
  }
}

/**
 * Speak `text` in `lang` (app locale code). Resolves to
 * { spoken: boolean, engine?, reason? }. When spoken is false the caller
 * should show the in-language text alert instead.
 */
export async function speak(text, lang = 'en', { gender = 'F' } = {}) {
  if (!text) return { spoken: false, reason: 'empty' }
  if (lang === 'en') return speakEnglish(text, gender)
  if (lang === 'nbl' || lang === 'nr') return { spoken: false, reason: 'text-only' } // no Ndebele voice yet
  if (TOUCAN_LANGS.includes(lang)) return speakToucan(text, lang)
  return { spoken: false, reason: 'unsupported-lang' }
}

// Whether a language can currently be voiced (for UI hints).
export function canSpeak(lang) {
  if (lang === 'en') return true
  return Boolean(TOUCAN_URL) && TOUCAN_LANGS.includes(lang)
}
