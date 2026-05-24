const {
  assertConfigured,
  checkDomain,
  getAuthUser,
  isAuthorizedCron,
  sbGet,
  sbPatch,
  sendEmail,
} = require('./_ops');

function buildDownAlertHtml(label, url, status) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060610;color:#e2e8f0;padding:32px;border-radius:12px;">
      <h2 style="color:#ef4444;margin:0 0 8px;">Site Down Alert</h2>
      <p style="color:#94a3b8;margin:0 0 24px;font-size:14px;">Luna Sentinel detected an outage during an automated sweep.</p>
      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="font-size:16px;font-weight:700;color:#f8fafc;margin-bottom:4px;">${label}</div>
        <div style="font-size:13px;color:#94a3b8;">${url}</div>
        <div style="font-size:13px;color:#ef4444;margin-top:8px;">HTTP Status: ${status || 'No response'}</div>
        <div style="font-size:12px;color:#475569;margin-top:4px;">Detected at: ${new Date().toLocaleString()}</div>
      </div>
      <a href="https://meet-luna-ai.vercel.app#features" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Open Sentinel Dashboard</a>
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
    assertConfigured(['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'RESEND_API_KEY', 'CRON_SECRET']);

    const monitors = await sbGet('monitors', {
      select: 'id,user_id,url,label,last_status,uptime_pct',
      order: 'created_at.asc',
      limit: 500,
    });

    let checked = 0;
    let alertsSent = 0;

    for (const mon of monitors) {
      checked += 1;
      const wasOnline = mon.last_status >= 200 && mon.last_status < 400;
      const check = await checkDomain(mon.url);
      const currentUptime = parseFloat(mon.uptime_pct || 100);
      const updatedUptime = check.online
        ? Math.min(100, currentUptime * 0.98 + 100 * 0.02)
        : Math.max(0, currentUptime * 0.98);

      await sbPatch('monitors', { id: `eq.${mon.id}` }, {
        last_status: check.status,
        last_ttfb: check.ttfb,
        last_checked: check.checkedAt,
        uptime_pct: updatedUptime.toFixed(2),
      });

      if (!check.online && wasOnline) {
        try {
          const user = await getAuthUser(mon.user_id);
          if (user.email) {
            await sendEmail({
              to: user.email,
              subject: `Luna Sentinel Alert: ${mon.label || mon.url} is down`,
              html: buildDownAlertHtml(mon.label || mon.url, mon.url, check.status),
            });
            alertsSent += 1;
          }
        } catch { }
      }
    }

    return res.status(200).json({ ok: true, checked, alertsSent });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
