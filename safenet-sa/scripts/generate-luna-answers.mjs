// Precompute Luna's suggested-question answers (text + audio) so the chips are
// instant and free at runtime instead of paying live LLM + CPU-TTS latency.
//
// For every language x suggested question it:
//   1. asks the deployed chat endpoint for Luna's reply (frozen once), then
//   2. synthesises that reply to audio:
//        English  -> /api/luna-tts (Deepgram, mp3)
//        9 SA     -> {TOUCAN}/tts (wav)
//        isiNdebele (nr) -> no audio (text only)
//   3. writes public/luna-audio/<lang>/<id>.<ext> and accumulates
//      public/luna-answers.json  ->  { [lang]: { [id]: { text, audio } } }
//
// Run ONCE (it hits the live Space, ~25-30 min) AFTER the shorter-reply chat
// change is deployed, then commit public/luna-audio/ + public/luna-answers.json.
//   node scripts/generate-luna-answers.mjs
// Idempotent: re-running skips entries that already have text + their audio file.
//
// QA: the frozen replies are LLM-generated; spot-check the non-en/zu ones with a
// native speaker (same gate as the chip questions themselves).

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { LUNA_SUGGESTIONS, getSuggestion } from '../src/data/lunaSuggestions.js'
import { LUNA_LANGUAGES } from '../src/lib/lunaLanguages.js'

const require = createRequire(import.meta.url)

// Transcode a WAV buffer to MP3 if a static ffmpeg is available
// (`npm install --no-save ffmpeg-static`), else return null to keep the WAV.
let _ffmpeg
function ffmpegBin() {
  if (_ffmpeg !== undefined) return _ffmpeg
  try { _ffmpeg = require('ffmpeg-static') } catch { _ffmpeg = null }
  return _ffmpeg
}
function toMp3(wavBuf, tag) {
  const bin = ffmpegBin()
  if (!bin) return null
  const inF = path.join(os.tmpdir(), `luna-${tag}.wav`)
  const outF = path.join(os.tmpdir(), `luna-${tag}.mp3`)
  try {
    fs.writeFileSync(inF, wavBuf)
    execFileSync(bin, ['-y', '-i', inF, '-ac', '1', '-ar', '24000', '-codec:a', 'libmp3lame', '-b:a', '64k', outF], { stdio: 'ignore' })
    return fs.readFileSync(outF)
  } catch { return null } finally {
    try { fs.rmSync(inF) } catch { /* noop */ }
    try { fs.rmSync(outF) } catch { /* noop */ }
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC = path.resolve(__dirname, '..', 'public')
const AUDIO_DIR = path.join(PUBLIC, 'luna-audio')
const MANIFEST = path.join(PUBLIC, 'luna-answers.json')

const API = (process.env.LUNA_API_BASE || 'https://safe-net-murex.vercel.app').replace(/\/$/, '')
const TOUCAN = (process.env.VITE_TOUCAN_TTS_URL || 'https://rayyankhan18-safenet-luna-voice.hf.space').replace(/\/$/, '')

async function postJson(url, body, ms = 200000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    return res
  } finally {
    clearTimeout(t)
  }
}

async function chat(message, lang) {
  const res = await postJson(`${API}/api/luna-chat`, { message, language: lang, history: [] })
  if (!res.ok) throw new Error(`chat ${res.status}`)
  const data = await res.json()
  const reply = (data.reply || '').trim()
  if (!reply) throw new Error('empty reply')
  return reply
}

// Returns { buf, ext } or null (no audio for this language).
async function synth(reply, lang) {
  if (lang === 'en') {
    const res = await postJson(`${API}/api/luna-tts`, { text: reply, gender: 'F' })
    if (!res.ok) throw new Error(`tts ${res.status}`)
    const { audio, format } = await res.json()
    if (!audio) throw new Error('no audio')
    return { buf: Buffer.from(audio, 'base64'), ext: format === 'wav' ? 'wav' : 'mp3' }
  }
  if (lang === 'nr' || lang === 'nbl') return null // isiNdebele: text only
  const res = await postJson(`${TOUCAN}/tts`, { text: reply, lang })
  if (!res.ok) throw new Error(`toucan ${res.status}`)
  const wav = Buffer.from(await res.arrayBuffer())
  const mp3 = toMp3(wav, lang)
  return mp3 ? { buf: mp3, ext: 'mp3' } : { buf: wav, ext: 'wav' }
}

function loadManifest() {
  try { return JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) } catch { return {} }
}

function audioExists(url) {
  if (!url) return true // null audio (nr) counts as "done"
  return fs.existsSync(path.join(PUBLIC, url.replace(/^\//, '')))
}

async function main() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true })
  const manifest = loadManifest()
  let done = 0, skipped = 0, failed = 0

  for (const lang of LUNA_LANGUAGES) {
    manifest[lang.code] = manifest[lang.code] || {}
    fs.mkdirSync(path.join(AUDIO_DIR, lang.code), { recursive: true })

    for (const q of LUNA_SUGGESTIONS) {
      const existing = manifest[lang.code][q.id]
      if (existing && existing.text && audioExists(existing.audio)) { skipped++; continue }

      const questionText = getSuggestion(q, lang.code)
      try {
        const reply = await chat(questionText, lang.code)
        const out = await synth(reply, lang.code)
        let audioUrl = null
        if (out) {
          const file = path.join(AUDIO_DIR, lang.code, `${q.id}.${out.ext}`)
          fs.writeFileSync(file, out.buf)
          audioUrl = `/luna-audio/${lang.code}/${q.id}.${out.ext}`
        }
        manifest[lang.code][q.id] = { text: reply, audio: audioUrl }
        fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2)) // incremental save
        done++
        console.log(`ok   ${lang.code}/${q.id}  ${audioUrl || '(text only)'}`)
      } catch (e) {
        failed++
        console.warn(`FAIL ${lang.code}/${q.id}: ${e.message}`)
      }
    }
  }
  console.log(`\nDone. generated=${done} skipped=${skipped} failed=${failed}`)
  console.log(`Manifest: ${MANIFEST}`)
  if (failed) console.log('Re-run to retry the failed entries (idempotent).')
}

main().catch((e) => { console.error(e); process.exit(1) })
