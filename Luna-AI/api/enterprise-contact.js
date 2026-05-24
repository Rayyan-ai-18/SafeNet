// Handles email alerts, enterprise contact form, and team dashboard actions
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SVC = process.env.SUPABASE_SERVICE_KEY;

async function getUserId(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return payload.sub || null;
  } catch { return null; }
}

async function sb(method, path, body) {
  const opts = {
    method,
    headers: {
      apikey: SUPABASE_SVC,
      Authorization: `Bearer ${SUPABASE_SVC}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : '',
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts);
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) {
    return {
      error: data?.message || data?.error || data?.hint || `Supabase request failed (${r.status})`,
      status: r.status,
      details: data,
    };
  }
  return data;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = req.body || {};
  const action = req.method === 'GET' ? req.query.action : body.action;

  // ── Team actions (require auth) ───────────────────────────────────────
  const teamActions = ['get-team', 'team-scans', 'create-team', 'invite-member', 'remove-member'];
  if (teamActions.includes(action)) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const userId = await getUserId(token);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (action === 'get-team') {
      const teams = await sb('GET', `teams?owner_id=eq.${userId}&select=id,name,created_at&limit=1`);
      if (teams?.error) return res.status(500).json({ error: teams.error });
      if (!teams || teams.length === 0) return res.json({ team: null, members: [] });
      const team = teams[0];
      const members = await sb('GET', `team_members?team_id=eq.${team.id}&select=id,email,role,joined_at&order=joined_at.asc`);
      if (members?.error) return res.status(500).json({ error: members.error });
      return res.json({ team, members });
    }

    if (action === 'team-scans') {
      const teams = await sb('GET', `teams?owner_id=eq.${userId}&select=id&limit=1`);
      if (teams?.error) return res.status(500).json({ error: teams.error });
      if (!teams || teams.length === 0) return res.json({ scans: [] });
      const teamId = teams[0].id;
      const members = await sb('GET', `team_members?team_id=eq.${teamId}&select=user_id,email`);
      if (members?.error) return res.status(500).json({ error: members.error });
      const memberIds = members.map(m => m.user_id);
      if (memberIds.length === 0) return res.json({ scans: [] });
      const userFilter = `user_id=in.(${memberIds.join(',')})`;
      const scans = await sb('GET', `scans?${userFilter}&select=id,url,score,verdict,type,created_at,user_id&order=created_at.desc&limit=50`);
      if (scans?.error) return res.status(500).json({ error: scans.error });
      const emailMap = Object.fromEntries(members.map(m => [m.user_id, m.email]));
      const enriched = scans.map(s => ({ ...s, member_email: emailMap[s.user_id] || 'Unknown' }));
      return res.json({ scans: enriched });
    }

    if (action === 'create-team') {
      const { name } = body;
      if (!name?.trim()) return res.status(400).json({ error: 'Team name required' });
      const existing = await sb('GET', `teams?owner_id=eq.${userId}&select=id&limit=1`);
      if (existing?.error) return res.status(500).json({ error: existing.error });
      if (existing && existing.length > 0) return res.status(400).json({ error: 'You already have a team' });
      const teams = await sb('POST', 'teams', { name: name.trim(), owner_id: userId });
      if (teams?.error) return res.status(500).json({ error: teams.error });
      if (!teams || !teams[0]) return res.status(500).json({ error: 'Team creation returned no data' });
      return res.json({ team: teams[0] });
    }

    if (action === 'invite-member') {
      const { email } = body;
      if (!email?.trim()) return res.status(400).json({ error: 'Email required' });
      const teams = await sb('GET', `teams?owner_id=eq.${userId}&select=id&limit=1`);
      if (teams?.error) return res.status(500).json({ error: teams.error });
      if (!teams || teams.length === 0) return res.status(400).json({ error: 'Create a team first' });
      const teamId = teams[0].id;
      const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email.trim())}`, {
        headers: { apikey: SUPABASE_SVC, Authorization: `Bearer ${SUPABASE_SVC}` }
      });
      if (!usersRes.ok) return res.status(500).json({ error: 'Could not look up user' });
      const usersData = await usersRes.json();
      const targetUser = usersData.users?.[0];
      if (!targetUser) return res.status(404).json({ error: 'No Luna account found for that email' });
      const result = await sb('POST', 'team_members', {
        team_id: teamId,
        user_id: targetUser.id,
        email: email.trim(),
        role: 'member',
      });
      if (result?.error) return res.status(500).json({ error: result.error });
      if (!result || !result[0]) return res.status(500).json({ error: 'Failed to add member (may already be a member)' });
      return res.json({ member: result[0] });
    }

    if (action === 'remove-member') {
      const { memberId } = body;
      if (!memberId) return res.status(400).json({ error: 'memberId required' });
      const teams = await sb('GET', `teams?owner_id=eq.${userId}&select=id&limit=1`);
      if (teams?.error) return res.status(500).json({ error: teams.error });
      if (!teams || teams.length === 0) return res.status(403).json({ error: 'Forbidden' });
      await fetch(`${SUPABASE_URL}/rest/v1/team_members?id=eq.${memberId}`, {
        method: 'DELETE',
        headers: { apikey: SUPABASE_SVC, Authorization: `Bearer ${SUPABASE_SVC}` }
      });
      return res.json({ ok: true });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return res.status(500).json({ error: 'Email service not configured' });

  // ── Alert mode (called from scan results) ──────────────────────────────
  if (body.action === 'alert') {
    const { email, subject, text, html } = body;
    if (!email || !subject) return res.status(400).json({ error: 'Missing email or subject' });
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'Luna AI <alerts@meet-luna-ai.vercel.app>',
          to: email,
          subject,
          text: text || subject,
          html: html || text || subject,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || 'Failed to send');
      return res.status(200).json({ success: true, id: d.id });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── Enterprise contact form ────────────────────────────────────────────
  const { name, email, company, size, message } = body;
  if (!name || !email || !company) {
    return res.status(400).json({ error: 'Name, email and company are required' });
  }

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company}`,
    `Team size: ${size || 'Not specified'}`,
    `Message:\n${message || 'No message provided'}`,
  ].join('\n');

  const html = `
    <h2 style="color:#1e40af">New Fortress Prime Enquiry</h2>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:8px;color:#64748b;width:120px">Name</td><td style="padding:8px;font-weight:600">${name}</td></tr>
      <tr><td style="padding:8px;color:#64748b">Email</td><td style="padding:8px">${email}</td></tr>
      <tr><td style="padding:8px;color:#64748b">Company</td><td style="padding:8px">${company}</td></tr>
      <tr><td style="padding:8px;color:#64748b">Team Size</td><td style="padding:8px">${size || '\u2014'}</td></tr>
      <tr><td style="padding:8px;color:#64748b;vertical-align:top">Message</td><td style="padding:8px;white-space:pre-wrap">${message || '\u2014'}</td></tr>
    </table>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'Luna AI <alerts@meet-luna-ai.vercel.app>',
        to: 'hello@luna-ai.dev',
        reply_to: email,
        subject: `Enterprise enquiry from ${company} (${name})`,
        text,
        html,
      }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.message || 'Email delivery failed');
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
