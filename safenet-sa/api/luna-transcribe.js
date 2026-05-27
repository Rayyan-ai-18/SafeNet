// isiZulu speech-to-text for Luna via Vulavula (Lelapa AI).
// Set VULAVULA_API_KEY in the Vercel project env. SERVER-SIDE ONLY.
// Receives { audio: base64, mimeType, language } and returns { text }.
// English uses the browser's own recognition; this is used for isiZulu.

const TRANSCRIBE_URL =
  process.env.VULAVULA_TRANSCRIBE_URL ||
  'https://vulavula-services.lelapa.ai/api/v2alpha/transcribe/sync/file'

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { audio, mimeType = 'audio/webm', language = 'zu' } = req.body || {}
  if (!audio || typeof audio !== 'string') {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const key = process.env.VULAVULA_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'Transcription not configured' })
  }

  const langCode = language === 'zu' ? 'zul' : 'eng'
  const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'

  try {
    const bytes = Buffer.from(audio, 'base64')
    const form = new FormData()
    form.append('file', new Blob([bytes], { type: mimeType }), `audio.${ext}`)

    const url = `${TRANSCRIBE_URL}?lang_code=${langCode}`
    const vulaRes = await fetch(url, {
      method: 'POST',
      headers: { 'X-CLIENT-TOKEN': key },
      body: form,
    })

    if (!vulaRes.ok) {
      const err = await vulaRes.text().catch(() => 'Transcription error')
      return res.status(vulaRes.status).json({ error: err })
    }

    const data = await vulaRes.json()
    return res.status(200).json({ text: data.transcription_text || '' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
