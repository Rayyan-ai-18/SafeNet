// Data-access layer. When Supabase is configured AND a parent is signed in, reads
// live data; otherwise returns null so callers fall back to the bundled demo data.
// The Supabase client (~200kB) is loaded lazily and ONLY when env is present, so
// demo/marketing builds never ship it on the critical path.

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
export const isSupabaseConfigured = Boolean(URL && ANON)

let _clientPromise = null
async function getClient() {
  if (!isSupabaseConfigured) return null
  if (!_clientPromise) _clientPromise = import('./supabase').then((m) => m.supabase)
  return _clientPromise
}

// Public accessor — AuthContext needs the live client to subscribe to auth state.
// Returns null when Supabase isn't configured (demo/showcase build).
export async function getSupabaseClient() {
  return getClient()
}

// First sign-in bootstrap: make sure the signed-in user has a parent row and a
// family. Idempotent — safe to call on every successful verification.
export async function ensureFamilyForUser(user, { fullName } = {}) {
  const supabase = await getClient()
  if (!supabase || !user) return null
  try {
    const { data: existing } = await supabase
      .from('parents').select('family_id').eq('id', user.id).single()
    if (existing?.family_id) return existing.family_id

    const { data: fam, error: famErr } = await supabase
      .from('families').insert({ name: fullName || null, plan: 'free' }).select('id').single()
    if (famErr || !fam) return null

    await supabase.from('parents').insert({
      id: user.id, family_id: fam.id, full_name: fullName || null, role: 'owner',
    })
    return fam.id
  } catch {
    return null
  }
}

// Persist POPIA consent records for the signed-in parent. Best-effort.
export async function saveConsents(items) {
  const supabase = await getClient()
  if (!supabase) return { ok: false, skipped: true }
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false }
    const familyId = await currentFamilyId(supabase)
    const rows = items.map((purpose) => ({
      parent_id: user.id, family_id: familyId, purpose, granted: true,
    }))
    const { error } = await supabase.from('consents').insert(rows)
    return { ok: !error }
  } catch {
    return { ok: false }
  }
}

async function currentFamilyId(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('parents').select('family_id').eq('id', user.id).single()
  return data?.family_id || null
}

// Returns the live snapshot, or null to signal "use demo data".
export async function loadFamilySnapshot() {
  const supabase = await getClient()
  if (!supabase) return null
  try {
    const familyId = await currentFamilyId(supabase)
    if (!familyId) return null
    const [children, zones, alerts, family] = await Promise.all([
      supabase.from('children').select('*').eq('family_id', familyId),
      supabase.from('zones').select('*').eq('family_id', familyId),
      supabase.from('alerts').select('*').eq('family_id', familyId).order('created_at', { ascending: false }),
      supabase.from('families').select('plan, billing_cycle, billing_provider').eq('id', familyId).single(),
    ])
    return {
      familyId,
      children: children.data || [],
      zones: zones.data || [],
      alerts: alerts.data || [],
      family: family.data || { plan: 'free' },
    }
  } catch {
    return null
  }
}

// Fire-and-forget lead capture for the public Link Scanner (growth funnel).
export async function captureLead({ contact, channel = 'link_scanner', meta = {} }) {
  const supabase = await getClient()
  if (!supabase || !contact) return { ok: false, skipped: true }
  try {
    const { error } = await supabase.from('leads').insert({ contact, channel, meta })
    return { ok: !error }
  } catch {
    return { ok: false }
  }
}

// Anonymous scan telemetry — powers the live "scans today" counter and lets us
// measure free-tier COGS. Best-effort; never throws.
export async function logScan({ verdict, score, hasUrl }) {
  const supabase = await getClient()
  if (!supabase) return
  try {
    await supabase.from('scan_logs').insert({ verdict, score, has_url: hasUrl })
  } catch { /* noop */ }
}
