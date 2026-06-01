// Serverless chat endpoint for SafeNet SA's Luna voice guardian.
// Uses OpenRouter, key kept server-side (set OPENROUTER_API_KEY in Vercel env).
// Replies in the parent's chosen language (any of the 11 official SA languages).
import { guard } from './_guard.js'

// App locale code -> language name given to the model. Mirrors
// src/lib/lunaLanguages.js (keep in sync if languages change).
const LANGUAGE_NAMES = {
  en: 'English',
  af: 'Afrikaans',
  zu: 'isiZulu (Zulu)',
  xh: 'isiXhosa (Xhosa)',
  st: 'Sesotho (Southern Sotho)',
  tn: 'Setswana (Tswana)',
  nso: 'Sepedi (Northern Sotho)',
  ve: 'Tshivenda (Venda)',
  ts: 'Xitsonga (Tsonga)',
  ss: 'siSwati (Swati)',
  nr: 'isiNdebele (Southern Ndebele)',
}

const LUNA_SYSTEM_PROMPT = `You are Luna, the AI guardian of SafeNet SA - South Africa's child digital safety platform. You are warm, caring, and maternal - like a trusted family friend. You help parents understand: how SafeNet works, what cyberbullying looks like in SA, what grooming and honey trap tactics look like, how SafeNet protects their child, and what to do when they receive an alert. Keep all responses to 2-3 sentences maximum - your response will be spoken aloud. No bullet points, no markdown, no jargon. Always end with warmth or an offer to help further. Message content is never stored or transmitted - always reassure parents of this when relevant.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!guard(req, res, { maxBodyBytes: 20_000 })) return

  const { message, history = [], language = 'en' } = req.body || {}
  if (!message || typeof message !== 'string' || message.length > 2000) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'Service unavailable' })
  }

  const languageName = LANGUAGE_NAMES[language] || LANGUAGE_NAMES.en
  const languageDirective = language === 'en'
    ? 'The parent is speaking English. Reply in English.'
    : `The parent has chosen ${languageName}. Reply ENTIRELY in natural, conversational ${languageName}. Do not mix in English.`

  const priorTurns = Array.isArray(history)
    ? history.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text ?? m.content ?? '',
      }))
    : []

  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct'

  try {
    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://safe-net-murex.vercel.app',
        'X-Title': 'SafeNet SA Luna',
      },
      body: JSON.stringify({
        model,
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

    if (!orRes.ok) {
      const err = await orRes.text()
      return res.status(orRes.status).json({ error: err })
    }

    const data = await orRes.json()
    const reply = data.choices?.[0]?.message?.content ?? ''
    return res.status(200).json({ reply })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
