import React, { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Smartphone, Download, Share, Plus, RefreshCw, Wifi, Check } from 'lucide-react'
import SEO from '../components/seo/SEO'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import Button from '../components/ui/Button'
import { track } from '../lib/analytics'

// Live public deploy. The QR must point at a host a phone can actually reach,
// never a dev/localhost origin. Swap to the custom domain once it's connected.
const SITE = 'https://safe-net-murex.vercel.app'

// Routes the visitor can tap through inside the live phone preview.
const PREVIEW_ROUTES = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/alerts', label: 'Alerts' },
  { path: '/location', label: 'Location' },
  { path: '/scan', label: 'Scan' },
]

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export default function GetApp() {
  const [installUrl, setInstallUrl] = useState(`${SITE}/app`)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [ios, setIos] = useState(false)
  const [previewPath, setPreviewPath] = useState('/dashboard')
  const [reloadKey, setReloadKey] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const iframeRef = useRef(null)

  useEffect(() => {
    const origin = window.location.origin
    const isLocal = /localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/.test(origin)
    // Real public deploy: use its own origin. Local dev: fall back to the
    // canonical site so the on-screen QR is always scannable from a phone.
    setInstallUrl(`${isLocal ? SITE : origin}/app`)
    setIos(isIOS())
    // The QR + "point your camera at the code" pitch only makes sense on a
    // desktop screen. A visitor who scanned the code is already on their phone,
    // so we show them the install action directly instead of another QR.
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)

    const onPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    const onInstalled = () => { setInstalled(true); track('pwa_installed') }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      mq.removeEventListener('change', sync)
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = async () => {
    track('pwa_install_click')
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    track('pwa_install_choice', { outcome })
    if (outcome === 'accepted') setInstalled(true)
    setDeferredPrompt(null)
  }

  return (
    <>
      <SEO
        title="Get the SafeNet SA App: Install on Android & iPhone"
        description="Install SafeNet SA on your phone in seconds, no app store needed. Scan the QR code or tap install. Try the real app live right here in your browser."
        canonicalPath="/app"
      />
      <div className="min-h-screen bg-[#F4F6F5]">
        <Nav />
        <main className="pt-28 pb-20 px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.15em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full mb-5">
              One app · Android &amp; iPhone
            </span>
            <h1 className="font-display text-display-sm sm:text-display-md text-safenet-text mb-4">
              SafeNet, in your pocket
            </h1>
            <p className="text-base text-safenet-text-2 max-w-xl mx-auto">
              This isn't a video or a mockup. It's the real SafeNet app running below. Tap through it,
              then install it on your phone in seconds. No app store, no waiting.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            {/* Live interactive phone preview (real app in an iframe) */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-4 flex-wrap justify-center">
                {PREVIEW_ROUTES.map((r) => (
                  <button
                    key={r.path}
                    onClick={() => { setPreviewPath(r.path); track('app_preview_nav', { route: r.path }) }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      previewPath === r.path
                        ? 'bg-safenet-primary text-white shadow-safenet-sm'
                        : 'bg-white border border-safenet-border text-safenet-text-2 hover:text-safenet-text'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
                <button
                  onClick={() => setReloadKey((k) => k + 1)}
                  title="Reload preview"
                  className="px-2.5 py-1.5 rounded-full bg-white border border-safenet-border text-safenet-text-2 hover:text-safenet-text"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Phone frame */}
              <div className="relative" style={{ width: 300, height: 620 }}>
                <div
                  className="absolute inset-0 bg-[#F0F2F1] rounded-[46px]"
                  style={{ boxShadow: '0 0 0 2px #D1D5DB, 0 24px 70px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.8)' }}
                >
                  <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[120px] h-[32px] bg-[#1A1A1A] rounded-[20px] z-20" />
                  <div className="absolute top-[12px] left-[12px] right-[12px] bottom-[12px] bg-white rounded-[36px] overflow-hidden">
                    <iframe
                      key={`${previewPath}-${reloadKey}`}
                      ref={iframeRef}
                      src={`${previewPath}?embed=1`}
                      title="SafeNet SA live app preview"
                      className="w-full h-full border-0"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-safenet-text-3 mt-4 text-center max-w-[280px]">
                Live demo data. The installed app uses your family's real data, secured per POPIA.
              </p>
            </div>

            {/* Install panel */}
            <div className="space-y-6">
              <div className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-6">
                <h2 className="font-display text-heading-md text-safenet-text mb-1">
                  {isMobile ? 'Add SafeNet to your home screen' : 'Install on your phone'}
                </h2>
                <p className="text-sm text-safenet-text-2 mb-6">
                  {isMobile
                    ? "You're on your phone, one tap and SafeNet lives on your home screen, just like an app store app but it installs instantly."
                    : 'Point your phone camera at the code, and it opens SafeNet, ready to add to your home screen.'}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="hidden lg:block p-3 bg-white rounded-card-lg border border-safenet-border shadow-safenet-sm">
                    <QRCodeSVG value={installUrl} size={148} fgColor="#0F2A1E" bgColor="#FFFFFF" level="M" />
                  </div>
                  <div className="flex-1 w-full">
                    {installed ? (
                      <div className="inline-flex items-center gap-2 text-safenet-primary font-medium">
                        <Check className="w-5 h-5" /> Installed. Check your home screen.
                      </div>
                    ) : deferredPrompt ? (
                      <Button variant="primary" className="w-full" onClick={handleInstall} magnetic>
                        <Download className="w-4 h-4" /> Install SafeNet
                      </Button>
                    ) : (
                      <div className="text-sm text-safenet-text-2">
                        <p className="font-medium text-safenet-text mb-2">On this device:</p>
                        {ios ? (
                          <ol className="space-y-1.5">
                            <li className="flex items-center gap-2"><Share className="w-4 h-4 text-safenet-primary" /> Tap the Share button</li>
                            <li className="flex items-center gap-2"><Plus className="w-4 h-4 text-safenet-primary" /> Choose "Add to Home Screen"</li>
                          </ol>
                        ) : (
                          <p>Open your browser menu and choose <span className="font-medium text-safenet-text">"Install app"</span> or <span className="font-medium text-safenet-text">"Add to Home screen"</span>.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { Icon: Smartphone, label: 'Android & iPhone' },
                  { Icon: Wifi, label: 'Works offline' },
                  { Icon: RefreshCw, label: 'Always up to date' },
                ].map(({ Icon, label }) => (
                  <div key={label} className="bg-white rounded-card-lg border border-safenet-border p-4 text-center">
                    <Icon className="w-5 h-5 text-safenet-primary mx-auto mb-2" />
                    <span className="text-xs text-safenet-text-2 font-medium">{label}</span>
                  </div>
                ))}
              </div>

              <div className="bg-safenet-primary-light rounded-card-lg p-5 text-sm text-safenet-text-2">
                <span className="font-medium text-safenet-text">Why no app store?</span> SafeNet installs straight from the
                web, so updates are instant and there's nothing to wait for. One codebase, one secure backend, the same
                app on every phone.
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
