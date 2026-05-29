import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import 'leaflet/dist/leaflet.css'
import './styles/globals.css'
import './styles/animations.css'
import './lib/lenis'
import './lib/gsap'
import './i18n'
import { initAnalytics } from './lib/analytics'

initAnalytics()

// Register the PWA service worker in production so SafeNet is installable
// (Add to Home Screen) on Android + iOS and opens offline.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* non-fatal */ })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)
