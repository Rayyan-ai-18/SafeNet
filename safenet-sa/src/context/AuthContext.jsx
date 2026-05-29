import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { isSupabaseConfigured, getSupabaseClient, ensureFamilyForUser } from '../lib/db'

const AuthContext = createContext(null)

// Auth is env-gated. When Supabase is configured we run real phone-OTP auth and
// expose the live session. When it isn't (the demo/showcase build), every method
// is a no-op that reports `configured: false`, so the marketing site and the demo
// dashboard keep working with zero backend.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    let unsub = () => {}
    let cancelled = false
    getSupabaseClient().then((supabase) => {
      if (!supabase || cancelled) { setLoading(false); return }
      supabase.auth.getSession().then(({ data }) => {
        if (!cancelled) { setUser(data?.session?.user ?? null); setLoading(false) }
      })
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })
      unsub = () => sub?.subscription?.unsubscribe?.()
    })
    return () => { cancelled = true; unsub() }
  }, [])

  // Send a one-time PIN to a +27 number. `phone` is local digits (e.g. "821234567").
  const sendOtp = useCallback(async (phone) => {
    if (!isSupabaseConfigured) return { configured: false }
    const supabase = await getSupabaseClient()
    const { error } = await supabase.auth.signInWithOtp({ phone: `+27${phone}` })
    return { configured: true, ok: !error, error: error?.message }
  }, [])

  const verifyOtp = useCallback(async (phone, token) => {
    if (!isSupabaseConfigured) return { configured: false }
    const supabase = await getSupabaseClient()
    const { data, error } = await supabase.auth.verifyOtp({ phone: `+27${phone}`, token, type: 'sms' })
    if (error) return { configured: true, ok: false, error: error.message }
    if (data?.user) await ensureFamilyForUser(data.user)
    return { configured: true, ok: true }
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return
    const supabase = await getSupabaseClient()
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  const value = { user, loading, configured: isSupabaseConfigured, sendOtp, verifyOtp, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
