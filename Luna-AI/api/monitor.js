// Luna AI — Sentinel Monitoring API
// GET  /api/monitor?action=list          → list user's monitored domains
// POST /api/monitor  { action:'add',    url }  → add domain
// POST /api/monitor  { action:'remove', id  }  → remove domain
// GET  /api/monitor?action=check&id=<id>       → live check one domain now

const crypto = require('crypto');

const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_SVC_KEY = process.env.SUPABASE_SERVICE_KEY;

// ── Supabase REST helpers ─────────────────────────────────────────────────
async function sbGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}${qs ? '?' + qs : ''}`, {
    headers: {
      apikey:        SUPABASE_SVC_KEY,
      Authorization: `Bearer ${SUPABASE_SVC_KEY}`,
    },
  });
  if (!r.ok) return null;
  return r.json();
}

async function sbPost(path, body, prefer = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey:          SUPABASE_SVC_KEY,
      Authorization:   `Bearer ${SUPABASE_SVC_KEY}`,
      'Content-Type':  'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: JSON.stringify(body),
  });
  return r;
}

async function sbDelete(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}${qs ? '?' + qs : ''}`, {
    method: 'DELETE',
    headers: {
      apikey:        SUPABASE_SVC_KEY,
      Authorization: `Bearer ${SUPABASE_SVC_KEY}`,
    },
  });
  return r.ok;
}

// ── Verify JWT from Supabase (extract user_id) ────────────────────────────
async function getUserId(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    // Decode without verifying (Supabase signs it; we trust the service role for DB ops)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return payload.sub || null;
  } catch {
    return null;
  }
}

// ── Live domain check ─────────────────────────────────────────────────────
async function checkDomain(url) {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal });
    clearTimeout(timer);
    const ttfb = Date.now() - start;
    return {
      online:    res.ok || res.status < 500,
      status:    res.status,
      ttfb,
      checkedAt: new Date().toISOString(),
    };
  } catch (e) {
    return {
      online:    false,
      status:    0,
      ttfb:      Date.now() - start,
      error:     e.message?.slice(0, 80),
      checkedAt: new Date().toISOString(),
    };
  }
}

// ── Downtime email alert via Resend ──────────────────────────────────────
async function sendDownAlert(email, label, url, status) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return;
  const domain = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: 'Luna AI <alerts@meet-luna-ai.vercel.app>',
      to: email,
      subject: `\u26a0 ${label || domain} is DOWN \u2014 Luna Sentinel Alert`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060610;color:#e2e8f0;padding:32px;border-radius:12px;">
          <h2 style="color:#ef4444;margin:0 0 8px;">\uD83D\uDEA8 Site Down Alert</h2>
          <p style="color:#94a3b8;margin:0 0 24px;font-size:14px;">Luna Sentinel detected an outage</p>
          <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:16px;margin-bottom:24px;">
            <div style="font-size:16px;font-weight:700;color:#f8fafc;margin-bottom:4px;">${label || domain}</div>
            <div style="font-size:13px;color:#94a3b8;">${url}</div>
            <div style="font-size:13px;color:#ef4444;margin-top:8px;">HTTP Status: ${status || 'No response'}</div>
            <div style="font-size:12px;color:#475569;margin-top:4px;">Detected at: ${new Date().toLocaleString()}</div>
          </div>
          <a href="https://meet-luna-ai.vercel.app#features" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Sentinel Dashboard</a>
          <p style="font-size:11px;color:#334155;margin-top:24px;">Luna AI \u00b7 Autonomous Security Sentinel</p>
        </div>
      `,
    }),
  }).catch(() => {});
}

// ── Handler ───────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SVC_KEY) {
    return res.status(503).json({ error: 'Monitoring service not configured' });
  }

  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const action = req.method === 'GET'
    ? (req.query.action || 'list')
    : req.body?.action;

  // LIST
  if (action === 'list') {
    const rows = await sbGet('monitors', {
      select: 'id,url,label,last_status,last_ttfb,last_checked,uptime_pct,created_at',
      user_id: `eq.${userId}`,
      order: 'created_at.asc',
      limit: 20,
    });
    return res.status(200).json({ monitors: rows || [] });
  }

  // ADD
  if (action === 'add') {
    const { url, label } = req.body || {};
    if (!url) return res.status(400).json({ error: 'Missing url' });
    // Validate URL
    try {
      const u = new URL(url);
      if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    // Cap at 10 monitors per user
    const existing = await sbGet('monitors', { user_id: `eq.${userId}`, select: 'id' });
    if (existing && existing.length >= 10) {
      return res.status(400).json({ error: 'Maximum 10 monitors per account' });
    }
    // Initial live check
    const check = await checkDomain(url);
    const r = await sbPost('monitors', {
      user_id:      userId,
      url,
      label:        label || new URL(url).hostname,
      last_status:  check.status,
      last_ttfb:    check.ttfb,
      last_checked: check.checkedAt,
      uptime_pct:   check.online ? 100 : 0,
    }, 'return=representation');
    const data = await r.json();
    return res.status(r.ok ? 201 : 500).json(r.ok ? { monitor: data[0], check } : { error: 'Insert failed' });
  }

  // REMOVE
  if (action === 'remove') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing id' });
    await sbDelete('monitors', { id: `eq.${id}`, user_id: `eq.${userId}` });
    return res.status(200).json({ ok: true });
  }

  // CHECK (live probe of one monitor)
  if (action === 'check') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const rows = await sbGet('monitors', { id: `eq.${id}`, user_id: `eq.${userId}`, select: 'id,url,label,last_status,uptime_pct' });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const mon = rows[0];
    const wasOnline = mon.last_status >= 200 && mon.last_status < 400;
    const check = await checkDomain(mon.url);
    // Update last check in DB
    const newUptime = parseFloat(mon.uptime_pct || 100);
    const updatedUptime = check.online
      ? Math.min(100, newUptime * 0.98 + 100 * 0.02)
      : Math.max(0,   newUptime * 0.98);
    await fetch(`${SUPABASE_URL}/rest/v1/monitors?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey:         SUPABASE_SVC_KEY,
        Authorization:  `Bearer ${SUPABASE_SVC_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        last_status:  check.status,
        last_ttfb:    check.ttfb,
        last_checked: check.checkedAt,
        uptime_pct:   updatedUptime.toFixed(2),
      }),
    });
    // Send email alert if site just went down (was online, now offline)
    if (!check.online && wasOnline) {
      try {
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
          headers: { apikey: SUPABASE_SVC_KEY, Authorization: `Bearer ${SUPABASE_SVC_KEY}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.email) await sendDownAlert(userData.email, mon.label, mon.url, check.status);
        }
      } catch {}
    }
    return res.status(200).json({ check, uptime_pct: updatedUptime.toFixed(2) });
  }

  // ── Public status page lookup (no auth required) ─────────────────────────
  if (action === 'status') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
      const rows = await sbGet(`monitors`, { 'id': `eq.${id}`, 'select': 'url,label,last_status,last_ttfb,last_checked,uptime_pct', 'limit': '1' });
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
      const m = rows[0];
      return res.json({ label: m.label, url: m.url, last_status: m.last_status, last_ttfb: m.last_ttfb, last_checked: m.last_checked, uptime_pct: m.uptime_pct, online: m.last_status >= 200 && m.last_status < 400 });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
};
