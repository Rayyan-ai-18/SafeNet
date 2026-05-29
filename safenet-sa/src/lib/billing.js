// Frontend billing helper. Kicks off a Paystack checkout for a plan + cycle.
// The PRICE matrix is the single source of truth for what we charge, in ZAR rands.
// Weekly exists for SA prepaid/airtime-style budgets (small, frequent top-ups).
// All real money movement is verified server-side (see api/paystack-*).

import { getSupabaseClient, isSupabaseConfigured } from './db'

export const PRICING = {
  guardian: { weekly: 25, monthly: 89, annual: 890 },
  sentinel: { weekly: 39, monthly: 149, annual: 1490 },
}

export function priceFor(plan, cycle) {
  return PRICING[plan]?.[cycle] ?? null
}

// Starts a hosted Paystack checkout. Returns { ok, url } or { ok:false, reason }.
// reason 'not_configured' → caller should fall back to the demo "thanks" path.
export async function startCheckout({ plan, cycle = 'monthly', email }) {
  if (!isSupabaseConfigured) return { ok: false, reason: 'not_configured' }
  const amount = priceFor(plan, cycle)
  if (!amount) return { ok: false, reason: 'bad_plan' }

  // Attach the user's access token so the server can trust who is paying.
  let token = null
  let userEmail = email
  try {
    const supabase = await getSupabaseClient()
    const { data } = await supabase.auth.getSession()
    token = data?.session?.access_token || null
    userEmail = userEmail || data?.session?.user?.email || null
  } catch { /* unauthenticated */ }

  if (!token) return { ok: false, reason: 'not_signed_in' }

  try {
    const res = await fetch('/api/paystack-initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan, cycle, email: userEmail }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.authorization_url) {
      return { ok: false, reason: json.error || 'init_failed' }
    }
    return { ok: true, url: json.authorization_url }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
