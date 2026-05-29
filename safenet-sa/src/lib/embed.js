// True when the app is rendered inside the on-site phone preview (iframe with
// ?embed=1) or any cross-origin iframe. Used to hide marketing chrome so a page
// looks like a native app screen in the preview.
export function isEmbedded() {
  if (typeof window === 'undefined') return false
  try {
    if (new URLSearchParams(window.location.search).get('embed') === '1') return true
    return window.self !== window.top
  } catch {
    return true // cross-origin framing throws — treat as embedded
  }
}
