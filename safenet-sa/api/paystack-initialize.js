// Creates a Paystack transaction for an authenticated parent and returns the
// hosted checkout URL. The secret key stays server-side; the amount is computed
// here (never trusted from the client) so the price can't be tampered with.

import { guard } from './_guard.js'
import { userFromToken, isConfigured } from './_supabase.js'

// ZAR rands — must mirror src/lib/billing.js PRICING.
const PRICING = {
  guardian: { weekly: 25, monthly: 89, annual: 890 },
  sentinel: { weekly: 39, monthly: 149, annual: 1490 },
}

const SECRET = process.env.PAYSTACK_SECRET_KEY

function originOf(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0]
  return `${proto}://${req.headers.host}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!guard(req, res, { maxBodyBytes: 10_000 })) return
  if (!SECRET || !isConfigured()) return res.status(503).json({ error: 'Billing not configured' })

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const auth = await userFromToken(token)
  if (!auth || !auth.familyId) return res.status(401).json({ error: 'Not authenticated' })

  const { plan, cycle = 'monthly', email } = req.body || {}
  const amount = PRICING[plan]?.[cycle]
  const billingEmail = email || auth.email
  if (!amount) return res.status(400).json({ error: 'Invalid plan or cycle' })
  if (!billingEmail) return res.status(400).json({ error: 'Email required for receipt' })

  try {
    const upstream = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: billingEmail,
        amount: amount * 100, // Paystack expects the minor unit (cents)
        currency: 'ZAR',
        callback_url: `${originOf(req)}/dashboard?billing=success`,
        metadata: { family_id: auth.familyId, plan, cycle },
      }),
    })
    const json = await upstream.json()
    if (!upstream.ok || !json.status) {
      return res.status(502).json({ error: json.message || 'Paystack init failed' })
    }
    return res.status(200).json({ authorization_url: json.data.authorization_url, reference: json.data.reference })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
