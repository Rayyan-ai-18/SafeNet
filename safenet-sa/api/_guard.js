// Shared protection for the public /api/luna-* endpoints.
// Files prefixed with "_" are NOT routed by Vercel - this is a helper module.
//
// Provides:
//  - same-origin check (blocks other sites embedding/abusing our keys)
//  - best-effort in-memory rate limiting per IP (per warm instance)
//  - request body size cap
//
// NOTE: in-memory limiting resets per cold start and isn't shared across
// instances. For production-grade limits, back this with Upstash Redis
// (set UPSTASH_REDIS_REST_URL/TOKEN) - see rateLimit() below.

const WINDOW_MS = 60_000
const MAX_REQUESTS = 30 // per IP per window
const buckets = new Map() // ip -> { count, reset }

function getIp(req) {
  const xff = req.headers['x-forwarded-for']
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim()
  return req.headers['x-real-ip'] || 'unknown'
}

function hostFrom(value) {
  if (!value) return null
  try {
    return new URL(value).host
  } catch {
    return null
  }
}

// Reject cross-origin requests. Same-origin browser fetches send an Origin or
// Referer whose host matches our own host. Requests from other websites won't.
function isSameOrigin(req) {
  const self = req.headers.host
  if (!self) return true // can't determine - don't block
  const origin = hostFrom(req.headers.origin)
  const referer = hostFrom(req.headers.referer)
  // If neither header is present (e.g. server-to-server), allow - rate limit still applies.
  if (!origin && !referer) return true
  if (origin && origin === self) return true
  if (referer && referer === self) return true
  return false
}

function rateLimit(ip) {
  const now = Date.now()
  const entry = buckets.get(ip)
  if (!entry || now > entry.reset) {
    buckets.set(ip, { count: 1, reset: now + WINDOW_MS })
    return true
  }
  entry.count += 1
  // opportunistic cleanup
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k)
  }
  return entry.count <= MAX_REQUESTS
}

// Returns true if the request may proceed; otherwise writes an error and returns false.
export function guard(req, res, { maxBodyBytes = 200_000 } = {}) {
  if (!isSameOrigin(req)) {
    res.status(403).json({ error: 'Forbidden' })
    return false
  }

  const len = Number(req.headers['content-length'] || 0)
  if (len && len > maxBodyBytes) {
    res.status(413).json({ error: 'Payload too large' })
    return false
  }

  if (!rateLimit(getIp(req))) {
    res.setHeader('Retry-After', '60')
    res.status(429).json({ error: 'Too many requests. Please slow down.' })
    return false
  }

  return true
}
