// Transcode the precomputed Luna chip audio from WAV to MP3 to shrink the repo
// and speed first-load (speech at 24kHz mono compresses ~10x with no audible
// loss). Updates public/luna-answers.json paths and removes the .wav originals.
//
// Needs a static ffmpeg, installed without polluting package.json:
//   npm install --no-save ffmpeg-static
//   node scripts/compress-luna-audio.mjs
// Idempotent: files already converted (no matching .wav) are simply skipped.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC = path.resolve(__dirname, '..', 'public')
const AUDIO_DIR = path.join(PUBLIC, 'luna-audio')
const MANIFEST = path.join(PUBLIC, 'luna-answers.json')

let ffmpeg
try {
  ffmpeg = require('ffmpeg-static')
} catch {
  console.error('ffmpeg-static not found. Run:  npm install --no-save ffmpeg-static')
  process.exit(1)
}

function walkWavs(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkWavs(p))
    else if (entry.name.endsWith('.wav')) out.push(p)
  }
  return out
}

const wavs = fs.existsSync(AUDIO_DIR) ? walkWavs(AUDIO_DIR) : []
let converted = 0
for (const wav of wavs) {
  const mp3 = wav.replace(/\.wav$/, '.mp3')
  // Mono 24kHz speech at 64k VBR-ish: tiny and clean.
  execFileSync(ffmpeg, ['-y', '-i', wav, '-ac', '1', '-ar', '24000', '-codec:a', 'libmp3lame', '-b:a', '64k', mp3], { stdio: 'ignore' })
  fs.rmSync(wav)
  converted++
  console.log(`mp3  ${path.relative(PUBLIC, mp3).replace(/\\/g, '/')}`)
}

// Repoint any .wav audio paths in the manifest to .mp3.
if (fs.existsSync(MANIFEST)) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  for (const lang of Object.keys(manifest)) {
    for (const id of Object.keys(manifest[lang])) {
      const a = manifest[lang][id]?.audio
      if (a && a.endsWith('.wav')) manifest[lang][id].audio = a.replace(/\.wav$/, '.mp3')
    }
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))
}

console.log(`\nDone. converted=${converted} wav files to mp3. Manifest updated.`)
