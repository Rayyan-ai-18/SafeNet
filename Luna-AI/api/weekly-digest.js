const {
  assertConfigured,
  getAuthUser,
  isAuthorizedCron,
  sbGet,
  sbUpsert,
  sendEmail,
} = require('./_ops');

async function summarizeScans(scans, firstName) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error('Missing env vars: GROQ_API_KEY');

  const promptPayload = scans.slice(0, 20).map((scan) => ({
    url: scan.url,
    type: scan.type,
    verdict: scan.verdict,
    score: scan.score,
    created_at: scan.created_at,
  }));

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 220,
      messages: [
        {
          role: 'system',
          content: 'You write concise weekly cybersecurity digests for end users. Be specific, practical, and non-alarmist. Keep it to one short paragraph plus 3 plain-text action lines separated by newlines. No markdown bullets.',
        },
        {
          role: 'user',
          content: `Write a weekly digest for ${firstName}. Summarize risk patterns from these Luna scans and give practical advice.\n\n${JSON.stringify(promptPayload, null, 2)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Groq summary failed: ${res.status} ${detail}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || 'Your weekly Luna digest is ready.';
}

function getFirstName(user) {
  const metaName = user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || '';
  const raw = metaName || user.email?.split('@')[0] || 'there';
  return raw.split(/[\s._-]+/).filter(Boolean)[0].replace(/^./, (m) => m.toUpperCase());
}

function buildDigestHtml(firstName, summary, stats) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#060610;color:#e2e8f0;padding:32px;border-radius:16px;">
      <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#60a5fa;margin-bottom:12px;">Luna Weekly Digest</div>
      <h1 style="font-size:28px;line-height:1.15;margin:0 0 12px;color:#f8fafc;">Your security week, ${firstName}</h1>
      <p style="font-size:14px;line-height:1.7;color:#cbd5e1;white-space:pre-line;">${summary}</p>
      <div style="display:flex;gap:12px;margin:24px 0;flex-wrap:wrap;">
        <div style="flex:1;min-width:120px;padding:14px;border-radius:12px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.18);">
          <div style="font-size:12px;color:#93c5fd;">Total scans</div>
          <div style="font-size:24px;font-weight:700;color:#fff;">${stats.total}</div>
        </div>
        <div style="flex:1;min-width:120px;padding:14px;border-radius:12px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.18);">
          <div style="font-size:12px;color:#fcd34d;">Suspicious+</div>
          <div style="font-size:24px;font-weight:700;color:#fff;">${stats.risky}</div>
        </div>
        <div style="flex:1;min-width:120px;padding:14px;border-radius:12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.18);">
          <div style="font-size:12px;color:#86efac;">Safe</div>
          <div style="font-size:24px;font-weight:700;color:#fff;">${stats.safe}</div>
        </div>
      </div>
      <a href="https://meet-luna-ai.vercel.app#features" style="display:inline-block;background:#3b82f6;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Open Luna</a>
    </div>
  `;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    assertConfigured(['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'RESEND_API_KEY', 'GROQ_API_KEY', 'CRON_SECRET']);

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const scans = await sbGet('scans', {
      select: 'user_id,url,score,verdict,type,created_at',
      created_at: `gte.${since}`,
      order: 'created_at.desc',
      limit: 1000,
    });

    if (!scans.length) {
      return res.status(200).json({ ok: true, sent: 0, users: 0 });
    }

    const profiles = await sbGet('profiles', {
      select: 'id,weekly_digest_enabled,last_digest_sent_at',
      limit: 1000,
    });
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    const grouped = new Map();
    for (const scan of scans) {
      const profile = profileMap.get(scan.user_id);
      if (profile?.weekly_digest_enabled === false) continue;
      const lastSent = profile?.last_digest_sent_at ? new Date(profile.last_digest_sent_at).getTime() : 0;
      if (lastSent >= new Date(since).getTime()) continue;
      if (!grouped.has(scan.user_id)) grouped.set(scan.user_id, []);
      grouped.get(scan.user_id).push(scan);
    }

    let sent = 0;

    for (const [userId, userScans] of grouped.entries()) {
      try {
        const user = await getAuthUser(userId);
        if (!user.email) continue;

        const firstName = getFirstName(user);
        const summary = await summarizeScans(userScans, firstName);
        const stats = {
          total: userScans.length,
          risky: userScans.filter((scan) => scan.score > 25).length,
          safe: userScans.filter((scan) => scan.score <= 25).length,
        };

        await sendEmail({
          to: user.email,
          subject: 'Your Luna weekly digest',
          html: buildDigestHtml(firstName, summary, stats),
          text: summary,
        });

        await sbUpsert('profiles', {
          id: userId,
          last_digest_sent_at: new Date().toISOString(),
        });
        sent += 1;
      } catch { }
    }

    return res.status(200).json({ ok: true, sent, users: grouped.size });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
