// Speech-to-text for Luna - proxies to the deployed Luna-AI Groq Whisper
// endpoint (same as meet-luna-ai). Server-side call avoids CORS and reuses
// Luna-AI's GROQ_API_KEY, so no extra key is needed here.
// Accepts { audio: base64Wav } and returns { text }.

const UPSTREAM = process.env.LUNA_STT_UPSTREAM || 'https://meet-luna-ai.vercel.app/api/transcribe'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { audio } = req.body || {}
  if (!audio || typeof audio !== 'string') {
    return res.status(400).json({ error: 'Invalid request' })
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio }),
    })

    if (!upstream.ok) {
      const err = await upstream.text().catch(() => 'STT error')
      return res.status(upstream.status).json({ error: err })
    }

    const data = await upstream.json()
    return res.status(200).json({ text: data.text || '' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
