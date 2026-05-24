
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language = 'javascript' } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Service preview unavailable' });
  }

  const SYSTEM_PROMPT = `You are the Luna AI Code Guardian. Your job is to review code snippets for security vulnerabilities.
Focus on:
1. Secrets/Credentials leakage (API keys, hardcoded passwords)
2. SQL Injection patterns
3. Cross-Site Scripting (XSS)
4. Insecure Cryptography
5. Broken Access Control

Provide a concise, professional report in Markdown format.
Use emojis for severity (🔴 High, 🟡 Medium, 🟢 Low).
If no issues are found, congratulate the developer.`;

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
          { role: 'user', content: `Review this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`` }
        ],
        temperature: 0.3, // Lower temperature for more factual security review
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      return res.status(groqRes.status).json({ error: err });
    }

    const data = await groqRes.json();
    const review = data.choices?.[0]?.message?.content ?? '';
    return res.status(200).json({ review });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
