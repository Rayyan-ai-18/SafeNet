module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { audio: base64Audio } = req.body;
  if (!base64Audio) {
    return res.status(400).json({ error: 'Missing audio data' });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Service unavailable' });
  }

  try {
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'json');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}` },
      body: formData,
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      return res.status(groqRes.status).json({ error: err });
    }

    const data = await groqRes.json();
    return res.status(200).json({ text: data.text || '' });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
