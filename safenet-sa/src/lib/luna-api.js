const LUNA_BASE = import.meta.env.VITE_LUNA_BASE_URL || 'https://meet-luna-ai.vercel.app'

async function callLuna(endpoint, options = {}) {
  try {
    const url = `${LUNA_BASE}${endpoint}`
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error')
      throw new Error(err)
    }
    return res
  } catch (error) {
    console.warn('Luna API error:', error.message)
    throw error
  }
}

export async function scanUrl(url) {
  try {
    const endpoint = import.meta.env.VITE_LUNA_PHISHING_URL_ENDPOINT || '/api/scan'
    const res = await callLuna(`${endpoint}?url=${encodeURIComponent(url)}&type=phishing`, {
      headers: { Accept: 'text/event-stream' },
    })
    // SSE response — parse events
    const text = await res.text()
    const events = text.split('\n\n').filter(Boolean)
    const findings = events
      .filter(e => e.startsWith('event: finding'))
      .map(e => {
        const dataLine = e.split('\n').find(l => l.startsWith('data: '))
        return dataLine ? JSON.parse(dataLine.replace('data: ', '')) : null
      })
      .filter(Boolean)
    const vulnerable = findings.filter(f => f.status === 'vulnerable')
    return {
      safe: vulnerable.length === 0,
      totalChecks: findings.length,
      vulnerabilities: vulnerable,
      findings,
    }
  } catch {
    return { safe: true, totalChecks: 0, vulnerabilities: [], findings: [], error: 'Luna is temporarily unavailable' }
  }
}

export async function analyseText(text, language = 'en') {
  try {
    const endpoint = import.meta.env.VITE_LUNA_TEXT_ANALYSIS_ENDPOINT || '/api/phish-text'
    const res = await callLuna(endpoint, {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
    const data = await res.json()
    return {
      threat: (data.score || 0) > 50,
      score: data.score || 0,
      verdict: data.verdict || 'Unknown',
      explanation: data.detail || 'Analysis complete',
    }
  } catch {
    return { threat: false, score: 0, verdict: 'Unavailable', explanation: 'Luna is temporarily unavailable' }
  }
}

export async function chat(message, language = 'en', context = '') {
  try {
    const endpoint = import.meta.env.VITE_LUNA_CHAT_ENDPOINT || '/api/chat'
    const res = await callLuna(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
        sentiment: 'casual',
        scanContext: context,
        persona: 'friendly',
      }),
    })
    const data = await res.json()
    return { response: data.reply || '' }
  } catch {
    return { response: "Luna is temporarily unavailable. Please try again in a moment." }
  }
}

export async function generateVoice(text, voice = 'aura-asteria-en') {
  try {
    const endpoint = import.meta.env.VITE_LUNA_VOICE_ENDPOINT || '/api/tts'
    const res = await callLuna(endpoint, {
      method: 'POST',
      body: JSON.stringify({ text, voice }),
    })
    const data = await res.json()
    return { audio: data.audio, format: data.format || 'mp3' }
  } catch {
    return { audio: null, format: 'mp3', error: 'Voice generation unavailable' }
  }
}

export default { scanUrl, analyseText, chat, generateVoice }
