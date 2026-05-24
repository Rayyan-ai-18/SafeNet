// Luna TTS — Deepgram Aura with SSML for natural prosody
// Handles [laugh] [chuckle] [giggle] [sigh] [cough] tags from the LLM
// and adds <break> pauses at sentence boundaries for human-like rhythm.

const DEFAULT_VOICE = 'aura-asteria-en';

function buildSsml(rawText) {
  // ── Step 1: protect emotion tags with XML-safe placeholders ──────────────
  let text = rawText
    .replace(/\[laugh\]/gi, '___LAUGH___')
    .replace(/\[chuckle\]/gi, '___CHUCKLE___')
    .replace(/\[giggle\]/gi, '___GIGGLE___')
    .replace(/\[sigh\]/gi, '___SIGH___')
    .replace(/\[cough\]/gi, '___COUGH___')
    .replace(/\[.*?\]/g, ''); // strip any unknown tags

  // ── Step 2: XML-escape plain text so the SSML is valid ───────────────────
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // ── Step 3: expand placeholders into spoken SSML ─────────────────────────
  text = text
    .replace(/___LAUGH___/g, '<break time="200ms"/>Ha!<break time="300ms"/> ')
    .replace(/___CHUCKLE___/g, '<break time="100ms"/>Heh.<break time="200ms"/> ')
    .replace(/___GIGGLE___/g, '<break time="100ms"/>Hehe!<break time="250ms"/> ')
    .replace(/___SIGH___/g, '<break time="500ms"/>Hmm.<break time="300ms"/> ')
    .replace(/___COUGH___/g, '<break time="300ms"/>Well.<break time="200ms"/> ');

  // ── Step 4: add natural pauses at punctuation boundaries ─────────────────
  // [^>] prevents matching after an SSML closing tag
  text = text
    .replace(/([^>])\.\s+([A-Z])/g, '$1.<break time="450ms"/> $2')
    .replace(/([^>])!\s+([A-Z])/g, '$1!<break time="350ms"/> $2')
    .replace(/([^>])\?\s+([A-Z])/g, '$1?<break time="400ms"/> $2')
    .replace(/([^>]),\s+/g, '$1,<break time="130ms"/> ');

  return `<speak>${text}</speak>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voice } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });

  const dgKey = process.env.DEEPGRAM_API_KEY;
  if (!dgKey) return res.status(500).json({ error: 'TTS unavailable — DEEPGRAM_API_KEY not set' });

  const selectedVoice = voice || DEFAULT_VOICE;
  const ssml = buildSsml(text);

  // ── Try SSML first for natural pauses and emotion sounds ─────────────────
  try {
    const dgRes = await fetch(`https://api.deepgram.com/v1/speak?model=${selectedVoice}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${dgKey}`,
        'Content-Type': 'application/ssml+xml',
      },
      body: ssml,
    });

    if (dgRes.ok) {
      const audioBuffer = await dgRes.arrayBuffer();
      return res.status(200).json({
        audio: Buffer.from(audioBuffer).toString('base64'),
        format: 'mp3',
      });
    }

    // SSML rejected — fall through to plain-text retry
    console.warn('Deepgram SSML failed:', dgRes.status, '— retrying as plain text');
  } catch (e) {
    console.warn('Deepgram SSML error:', e.message, '— retrying as plain text');
  }

  // ── Plain-text fallback (strips all tags) ────────────────────────────────
  try {
    const plainText = text.replace(/\[.*?\]/g, '').trim();
    const dgRes = await fetch(`https://api.deepgram.com/v1/speak?model=${selectedVoice}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${dgKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: plainText }),
    });

    if (!dgRes.ok) throw new Error(`Deepgram plain-text failed: ${dgRes.status}`);

    const audioBuffer = await dgRes.arrayBuffer();
    return res.status(200).json({
      audio: Buffer.from(audioBuffer).toString('base64'),
      format: 'mp3',
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
