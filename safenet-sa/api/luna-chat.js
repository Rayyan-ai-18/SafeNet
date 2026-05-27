// Serverless chat endpoint for SafeNet SA's Luna voice guardian.
// Keeps the Groq API key server-side (set GROQ_API_KEY in Vercel env).
// Replies in the language the parent is speaking (English or isiZulu).

const LUNA_SYSTEM_PROMPT = `You are Luna, the AI guardian of SafeNet SA - South Africa's child digital safety platform. You are warm, caring, and maternal - like a trusted family friend. You help parents understand: how SafeNet works, what cyberbullying looks like in SA, what grooming and honey trap tactics look like, how SafeNet protects their child, and what to do when they receive an alert. Keep all responses to 2-3 sentences maximum - your response will be spoken aloud. No bullet points, no markdown, no jargon. Always end with warmth or an offer to help further. Message content is never stored or transmitted - always reassure parents of this when relevant.`

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, history = [], language = 'en' } = req.body || {}
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const key = process.env.GROQ_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'Service unavailable' })
  }

  const languageDirective = language === 'zu'
    ? 'The parent is speaking isiZulu. Reply ENTIRELY in natural, conversational isiZulu.'
    : 'The parent is speaking English. Reply in English.'

  const priorTurns = Array.isArray(history)
    ? history.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text ?? m.content ?? '',
      }))
    : []

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: LUNA_SYSTEM_PROMPT },
          { role: 'system', content: languageDirective },
          ...priorTurns,
          { role: 'user', content: message },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    if (!groqRes.ok) {
      const err = await groqRes.text()
      return res.status(groqRes.status).json({ error: err })
    }

    const data = await groqRes.json()
    const reply = data.choices?.[0]?.message?.content ?? ''
    return res.status(200).json({ reply })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
