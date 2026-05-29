// Plan → feature/limit map. This is the unit-economics control point: free-tier
// caps keep Luna (our main COGS) cheap, and paid tiers unlock capacity. Billing
// (telco micro-billing / Paystack) writes the active plan onto the family row;
// the UI gates features through `can()` / `limit()`.

export const PLANS = {
  free: {
    label: 'Free',
    maxChildren: 1,
    lunaScansPerDay: 20,        // hard cap protects COGS on the loss-leader tier
    voiceAlerts: false,
    languages: 2,                // EN + one SA language
    weeklyDigest: false,
    schoolShield: false,
  },
  guardian: {
    label: 'Guardian',
    maxChildren: 4,
    lunaScansPerDay: 500,
    voiceAlerts: true,
    languages: 11,
    weeklyDigest: true,
    schoolShield: false,
  },
  sentinel: {
    label: 'Sentinel',
    maxChildren: Infinity,
    lunaScansPerDay: Infinity,
    voiceAlerts: true,
    languages: 11,
    weeklyDigest: true,
    schoolShield: true,
  },
}

// Billing cycles we support. 'weekly' exists for SA prepaid/airtime micro-billing.
export const BILLING_CYCLES = ['weekly', 'monthly', 'annual']
export const BILLING_PROVIDERS = ['telco', 'paystack', 'manual']

export function planOf(family) {
  const key = (family?.plan || 'free').toLowerCase()
  return PLANS[key] ? key : 'free'
}

export function can(feature, family) {
  return Boolean(PLANS[planOf(family)]?.[feature])
}

export function limit(feature, family) {
  return PLANS[planOf(family)]?.[feature]
}

// True when a metered action is still under the plan's daily cap.
export function withinDailyScanCap(family, usedToday = 0) {
  return usedToday < limit('lunaScansPerDay', family)
}
