// Server-side Supabase helpers for the billing endpoints. Files prefixed with
// "_" are NOT routed by Vercel. The service-role client bypasses RLS, so it must
// ONLY ever be used in trusted server code — never shipped to the browser.

import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export function isConfigured() {
  return Boolean(URL && SERVICE_ROLE)
}

// Admin client — bypasses RLS. Use for trusted writes after payment verification.
export function adminClient() {
  return createClient(URL, SERVICE_ROLE, { auth: { persistSession: false } })
}

// Resolve a signed-in user from their access token (sent by the browser).
// Returns { user, familyId, email } or null.
export async function userFromToken(token) {
  if (!URL || !ANON || !token) return null
  const client = createClient(URL, ANON, { auth: { persistSession: false } })
  const { data, error } = await client.auth.getUser(token)
  if (error || !data?.user) return null
  const admin = adminClient()
  const { data: parent } = await admin
    .from('parents').select('family_id').eq('id', data.user.id).single()
  return { user: data.user, familyId: parent?.family_id || null, email: data.user.email }
}
