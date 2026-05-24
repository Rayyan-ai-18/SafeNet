
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  if (!text || text.length < 10) {
    return res.status(400).json({ error: 'Please provide a longer message to analyze.' });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Analysis engine unavailable' });
  }

  const SYSTEM_PROMPT = `You are the Luna AI Phishing Specialist. Analyze the following message (Email, SMS, or DM) for phishing indicators.
Check for:
1. Sense of urgency or threats.
2. Suspicious links or mismatched URLs.
3. Impersonation of brands (banks, tech, gov).
4. Requests for sensitive info (OTP, passwords, cards).

Provide a Risk Score (0-100) and a brief verdict.
Format:
Score: [Number]
Verdict: [Safe/Suspicious/High Risk]
Reasoning: [1-2 sentences]`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this message:\n\n"${text}"` }
        ],
        max_tokens: 150,
      }),
    });

    if (!groqRes.ok) throw new Error('AI analysis failed');

    const data = await groqRes.json();
    const result = data.choices?.[0]?.message?.content ?? '';
    
    // Simple parsing
    const scoreMatch = result.match(/Score:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    const verdictMatch = result.match(/Verdict:\s*(\w+\s?\w*)/i);
    const verdict = verdictMatch ? verdictMatch[1] : 'Suspicious';

    return res.status(200).json({ score, verdict, detail: result });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
