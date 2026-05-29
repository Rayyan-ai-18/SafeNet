// Supabase client — the single source of truth for SafeNet SA, shared with the
// Luna-AI product. Inert until env is set (mirrors firebase.js / analytics.js),
// so dev, demo and builds never break when credentials are absent.
import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(URL && ANON)

export const supabase = isSupabaseConfigured
  ? createClient(URL, ANON, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

export default supabase
