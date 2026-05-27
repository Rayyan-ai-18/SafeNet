// English neural voice for Luna - proxies to the deployed Luna-AI Deepgram TTS
// (same natural "aura" voice as meet-luna-ai). Server-side call avoids CORS and
// reuses Luna-AI's DEEPGRAM_API_KEY, so no extra key is needed here.
// isiZulu is handled by the browser voice on the client.

const UPSTREAM = process.env.LUNA_TTS_UPSTREAM || 'https://meet-luna-ai.vercel.app/api/tts'

const VOICES = { F: 'aura-asteria-en', M: 'aura-orion-en' }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, gender = 'F' } = req.body || {}
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const voice = VOICES[gender === 'M' ? 'M' : 'F']

  try {
    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    })

    if (!upstream.ok) {
      const err = await upstream.text().catch(() => 'TTS error')
      return res.status(upstream.status).json({ error: err })
    }

    const data = await upstream.json()
    return res.status(200).json({ audio: data.audio, format: data.format || 'mp3' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
