// Analytics + experiment layer (PostHog).
// Inert until VITE_POSTHOG_KEY is set, so it never breaks dev or builds.
// Set VITE_POSTHOG_KEY (and optionally VITE_POSTHOG_HOST) in the Vercel env.
import posthog from 'posthog-js'

const KEY = import.meta.env.VITE_POSTHOG_KEY
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

let enabled = false

export function initAnalytics() {
  if (enabled || !KEY) return
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: false, // we capture manually on route change
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
  })
  enabled = true
}

// Fire a conversion / funnel event. No-op when analytics isn't configured.
export function track(event, props = {}) {
  if (!enabled) return
  try { posthog.capture(event, props) } catch { /* noop */ }
}

export function trackPageview(path) {
  if (!enabled) return
  try { posthog.capture('$pageview', { $current_url: window.location.href, path }) } catch { /* noop */ }
}

export function identify(id, props = {}) {
  if (!enabled) return
  try { posthog.identify(id, props) } catch { /* noop */ }
}

// A/B test helper: returns the active variant for a PostHog feature flag,
// or `fallback` when analytics/flag isn't available.
export function getVariant(flagKey, fallback = 'control') {
  if (!enabled) return fallback
  try {
    const v = posthog.getFeatureFlag(flagKey)
    return v == null ? fallback : v
  } catch {
    return fallback
  }
}

export default { initAnalytics, track, trackPageview, identify, getVariant }
