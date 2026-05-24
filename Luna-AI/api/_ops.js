const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SVC_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

function assertConfigured(keys) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
}

function isAuthorizedCron(req) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  return !!secret && auth === `Bearer ${secret}`;
}

async function sbGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}${qs ? `?${qs}` : ''}`, {
    headers: {
      apikey: SUPABASE_SVC_KEY,
      Authorization: `Bearer ${SUPABASE_SVC_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase GET failed: ${res.status}`);
  return res.json();
}

async function sbPatch(path, params = {}, body = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}${qs ? `?${qs}` : ''}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SVC_KEY,
      Authorization: `Bearer ${SUPABASE_SVC_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase PATCH failed: ${res.status}`);
  return res;
}

async function sbUpsert(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SVC_KEY,
      Authorization: `Bearer ${SUPABASE_SVC_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase UPSERT failed: ${res.status}`);
  return res.json();
}

async function getAuthUser(userId) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    headers: {
      apikey: SUPABASE_SVC_KEY,
      Authorization: `Bearer ${SUPABASE_SVC_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Auth user lookup failed: ${res.status}`);
  return res.json();
}

async function sendEmail({ to, subject, html, text }) {
  if (!RESEND_API_KEY) throw new Error('Missing env vars: RESEND_API_KEY');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Luna AI <alerts@meet-luna-ai.vercel.app>',
      to,
      subject,
      html,
      text: text || subject,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend failed: ${res.status} ${detail}`);
  }
  return res.json().catch(() => ({}));
}

async function checkDomain(url) {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal });
    clearTimeout(timer);
    return {
      online: res.ok || res.status < 500,
      status: res.status,
      ttfb: Date.now() - start,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      online: false,
      status: 0,
      ttfb: Date.now() - start,
      error: error.message?.slice(0, 80),
      checkedAt: new Date().toISOString(),
    };
  }
}

module.exports = {
  assertConfigured,
  checkDomain,
  getAuthUser,
  isAuthorizedCron,
  sbGet,
  sbPatch,
  sbUpsert,
  sendEmail,
};
