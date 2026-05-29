// Paystack webhook — the source of truth for activating a paid plan. Paystack
// calls this server-to-server after a successful charge. We verify the HMAC
// signature against the raw body, then upgrade the family using the service-role
// client. Never trust the client to set its own plan.

import crypto from 'node:crypto'
import { adminClient, isConfigured } from './_supabase.js'

const SECRET = process.env.PAYSTACK_SECRET_KEY

// Disable Vercel's body parser so we can verify the signature over raw bytes.
export const config = { api: { bodyParser: false } }

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

const CYCLE_DAYS = { weekly: 7, monthly: 30, annual: 365 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!SECRET || !isConfigured()) return res.status(503).end()

  let raw
  try { raw = await readRaw(req) } catch { return res.status(400).end() }

  const expected = crypto.createHmac('sha512', SECRET).update(raw).digest('hex')
  const signature = req.headers['x-paystack-signature']
  if (!signature || signature !== expected) return res.status(401).end()

  let event
  try { event = JSON.parse(raw.toString('utf8')) } catch { return res.status(400).end() }

  if (event?.event !== 'charge.success') return res.status(200).json({ ignored: true })

  const meta = event.data?.metadata || {}
  const { family_id: familyId, plan, cycle = 'monthly' } = meta
  if (!familyId || !plan) return res.status(200).json({ ignored: true })

  const renews = new Date(Date.now() + (CYCLE_DAYS[cycle] || 30) * 86_400_000).toISOString()

  try {
    const admin = adminClient()
    await admin.from('families').update({
      plan, billing_cycle: cycle, billing_provider: 'paystack', plan_renews_at: renews,
    }).eq('id', familyId)

    await admin.from('payments').insert({
      family_id: familyId,
      provider: 'paystack',
      reference: event.data?.reference || null,
      amount: (event.data?.amount ?? 0) / 100,
      currency: event.data?.currency || 'ZAR',
      plan, cycle, status: 'success',
    })
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
