import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShieldCheck, ShieldAlert, ShieldX, Loader2, Link as LinkIcon, ArrowRight, Lock, Share2, Check } from 'lucide-react'
import SEO from '../components/seo/SEO'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import Button from '../components/ui/Button'
import { assessLink } from '../lib/linkRisk'
import { scanUrl, analyseText } from '../lib/luna-api'
import { captureLead, logScan } from '../lib/db'
import { track } from '../lib/analytics'

const t = {
  en: {
    eyebrow: 'Free tool · No sign-up',
    title: 'Is this link safe?',
    subtitle: 'Paste any link or suspicious WhatsApp message. Luna checks it for phishing, scams and SASSA / bank impersonation — in seconds, in your language.',
    placeholder: 'Paste a link or message here…  e.g. "SASSA: your R350 grant is ready, verify at http://sassa-verify.tk"',
    scan: 'Check it',
    scanning: 'Luna is checking…',
    again: 'Check another',
    safe: 'Looks safe',
    suspicious: 'Be careful',
    dangerous: 'Do not click',
    safeBody: 'No strong threat signals found. Still, never share passwords or OTPs, even on safe-looking sites.',
    suspiciousBody: 'This has warning signs of a scam. Do not enter personal details or money until you confirm it is genuine.',
    dangerousBody: 'This shows clear signs of phishing or a scam. Do not click, do not reply, and do not share any details.',
    signals: 'What Luna noticed',
    confidence: 'Threat score',
    protect: 'Protect your whole family',
    protectSub: 'SafeNet SA checks every link your child receives, automatically — across WhatsApp and the web.',
    disclaimer: 'This is a guidance tool, not a guarantee. When in doubt, contact the company directly using a number you already trust.',
    share: 'Warn your family on WhatsApp',
    notifyLabel: 'Get a free safety tip each week',
    notifyPlaceholder: 'Email or cellphone number',
    notifyCta: 'Send me tips',
    notifyDone: "You're on the list — stay safe out there.",
    shareText: "I just checked a link with SafeNet SA's free safety scanner. Check yours here:",
  },
  zu: {
    eyebrow: 'Ithuluzi lamahhala · Akudingeki ukubhalisa',
    title: 'Ingabe le link iphephile?',
    subtitle: 'Namathisela noma iyiphi i-link noma umlayezo we-WhatsApp osolisayo. ULuna uyahlola ukukhwabanisa, ukuqola nokuzenzisa kweSASSA / kwebhange.',
    placeholder: 'Namathisela i-link noma umlayezo lapha…',
    scan: 'Hlola',
    scanning: 'ULuna uyahlola…',
    again: 'Hlola omunye',
    safe: 'Kubukeka kuphephile',
    suspicious: 'Qaphela',
    dangerous: 'Ungachofozi',
    safeBody: 'Azitholakalanga izimpawu ezinkulu zengozi. Noma kunjalo, ungalokothi wabelane ngamaphasiwedi noma ama-OTP.',
    suspiciousBody: 'Lokhu kunezimpawu zokuqola. Ungafaki imininingwane yakho kuze kuqinisekiswe ukuthi kuqotho.',
    dangerousBody: 'Lokhu kukhombisa izimpawu ezicacile zokukhwabanisa. Ungachofozi, ungaphenduli, ungabeli ngalutho.',
    signals: 'Lokho uLuna akubonile',
    confidence: 'Izinga lengozi',
    protect: 'Vikela umndeni wakho wonke',
    protectSub: 'I-SafeNet SA ihlola yonke i-link engane yakho eyitholayo, ngokuzenzakalelayo.',
    disclaimer: 'Leli ithuluzi lokweluleka, hhayi isiqinisekiso. Uma ungaqiniseki, xhumana nenkampani ngqo.',
    share: 'Xwayisa umndeni wakho ku-WhatsApp',
    notifyLabel: 'Thola iseluleko sokuphepha mahhala masonto onke',
    notifyPlaceholder: 'I-imeyili noma inombolo yeselula',
    notifyCta: 'Ngithumele amathiphu',
    notifyDone: 'Usohlwini manje — hlala uphephile.',
    shareText: 'Ngisanda kuhlola i-link nge-SafeNet SA. Hlola eyakho lapha:',
  },
}

const verdictStyles = {
  safe: { Icon: ShieldCheck, ring: 'border-safenet-primary', bg: 'bg-safenet-primary-light', text: 'text-safenet-primary', bar: 'bg-safenet-primary' },
  suspicious: { Icon: ShieldAlert, ring: 'border-safenet-accent', bg: 'bg-safenet-accent-light', text: 'text-safenet-accent', bar: 'bg-safenet-accent' },
  dangerous: { Icon: ShieldX, ring: 'border-safenet-danger', bg: 'bg-red-50', text: 'text-safenet-danger', bar: 'bg-safenet-danger' },
}

export default function LinkScanner() {
  const [lang] = useState(() => localStorage.getItem('safenet_lang') || 'en')
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('idle') // idle | scanning | done
  const [result, setResult] = useState(null)
  const [contact, setContact] = useState('')
  const [leadDone, setLeadDone] = useState(false)
  const resultRef = useRef(null)
  const L = t[lang] || t.en

  const submitLead = async (e) => {
    e.preventDefault()
    if (!contact.trim()) return
    setLeadDone(true)
    track('lead_capture', { channel: 'link_scanner' })
    captureLead({ contact: contact.trim(), channel: 'link_scanner', meta: { verdict: result?.verdict } })
  }

  const shareToWhatsApp = () => {
    track('scan_share', { channel: 'whatsapp', verdict: result?.verdict })
    const url = `${window.location.origin}/scan`
    const msg = encodeURIComponent(`${L.shareText} ${url}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener')
  }

  const runScan = async () => {
    const value = input.trim()
    if (!value || status === 'scanning') return
    setStatus('scanning')
    setResult(null)
    track('link_scan_started', { hasUrl: /https?:\/\//i.test(value) })

    // Instant local verdict so the user always gets an answer.
    const local = assessLink(value)
    let { score, verdict, signals } = local

    // Enrich with Luna's live engine when reachable (graceful, non-blocking on failure).
    try {
      if (local.hasUrl) {
        const live = await scanUrl(local.urls[0])
        if (!live.error && live.vulnerabilities?.length) {
          score = Math.min(100, score + 25)
          signals = [...signals, { points: 25, label: `Luna live scan flagged ${live.vulnerabilities.length} issue(s)` }]
        }
      } else {
        const live = await analyseText(value, lang)
        if (!live.error && live.score > score) {
          score = live.score
          if (live.explanation) signals = [...signals, { points: 0, label: live.explanation }]
        }
      }
    } catch { /* fall back to local verdict */ }

    score = Math.min(100, Math.round(score))
    verdict = score >= 60 ? 'dangerous' : score >= 25 ? 'suspicious' : 'safe'
    const final = { score, verdict, signals }
    setResult(final)
    setStatus('done')
    track('link_scan_result', { verdict, score })
    logScan({ verdict, score, hasUrl: local.hasUrl })
  }

  useEffect(() => {
    if (status === 'done' && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [status])

  const style = result ? verdictStyles[result.verdict] : null

  return (
    <>
      <SEO
        title="Free Link Safety Checker — Is This Link Safe? | SafeNet SA"
        description="Paste any link or WhatsApp message and check it for phishing, scams and SASSA / bank impersonation in seconds. Free, no sign-up, built for South African families."
        canonicalPath="/scan"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'SafeNet SA Link Safety Checker',
          applicationCategory: 'SecurityApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'ZAR' },
        }}
      />
      <div className="min-h-screen bg-[#F4F6F5]">
        <Nav />
        <main className="pt-28 pb-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.15em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full mb-5">
              {L.eyebrow}
            </span>
            <h1 className="font-display text-display-sm sm:text-display-md text-safenet-text mb-4">{L.title}</h1>
            <p className="text-base text-safenet-text-2 max-w-xl mx-auto mb-8">{L.subtitle}</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-5 sm:p-6">
              <div className="relative">
                <LinkIcon className="absolute left-4 top-4 w-5 h-5 text-safenet-text-3" />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runScan() }}
                  rows={3}
                  placeholder={L.placeholder}
                  className="w-full resize-none rounded-card-lg border border-safenet-border bg-safenet-surface/50 pl-12 pr-4 py-3.5 text-sm text-safenet-text placeholder:text-safenet-text-3 focus:outline-none focus:ring-2 focus:ring-safenet-primary/40 focus:border-safenet-primary transition"
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-safenet-text-3">
                  <Lock className="w-3.5 h-3.5" /> Checked privately
                </span>
                <Button onClick={status === 'done' ? () => { setInput(''); setStatus('idle'); setResult(null); setContact(''); setLeadDone(false) } : runScan} disabled={status === 'scanning' || (!input.trim() && status !== 'done')} magnetic>
                  {status === 'scanning' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {status === 'scanning' ? L.scanning : status === 'done' ? L.again : L.scan}
                  {status === 'idle' && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  key={result.verdict}
                  ref={resultRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                  className={`mt-5 bg-white rounded-card-lg shadow-safenet-md border-2 ${style.ring} overflow-hidden`}
                >
                  <div className={`${style.bg} px-5 sm:px-6 py-5 flex items-center gap-4`}>
                    <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-safenet-sm`}>
                      <style.Icon className={`w-6 h-6 ${style.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className={`font-display text-heading-sm ${style.text}`}>{L[result.verdict]}</h2>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-safenet-text-3 uppercase tracking-wider">{L.confidence}</span>
                        <div className="flex-1 max-w-[160px] h-1.5 bg-white/70 rounded-full overflow-hidden">
                          <motion.div className={`h-full ${style.bar}`} initial={{ width: 0 }} animate={{ width: `${result.score}%` }} transition={{ duration: 0.6 }} />
                        </div>
                        <span className={`text-xs font-bold ${style.text}`}>{result.score}/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 py-5">
                    <p className="text-sm text-safenet-text-2 mb-4">{L[`${result.verdict}Body`]}</p>
                    {result.signals.length > 0 && (
                      <>
                        <div className="text-[11px] font-semibold text-safenet-text-3 uppercase tracking-wider mb-2">{L.signals}</div>
                        <ul className="space-y-2 mb-2">
                          {result.signals.map((s, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-safenet-text-2">
                              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.points >= 20 ? 'bg-safenet-danger' : s.points > 0 ? 'bg-safenet-accent' : 'bg-safenet-text-3'}`} />
                              {s.label}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  {/* Viral loop: warn family on WhatsApp */}
                  <div className="px-5 sm:px-6 pb-5">
                    <button
                      onClick={shareToWhatsApp}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-btn bg-[#25D366] text-white font-medium py-2.5 text-sm hover:brightness-95 transition"
                    >
                      <Share2 className="w-4 h-4" /> {L.share}
                    </button>
                  </div>

                  <div className="border-t border-safenet-border bg-safenet-surface/40 px-5 sm:px-6 py-5">
                    <div className="flex items-start gap-4 flex-col sm:flex-row sm:items-center">
                      <div className="flex-1">
                        <div className="font-display text-heading-sm text-safenet-text">{L.protect}</div>
                        <p className="text-sm text-safenet-text-2 mt-1">{L.protectSub}</p>
                      </div>
                      <Link to="/auth" onClick={() => track('cta_click', { cta: 'protect_family', location: 'link_scanner' })}>
                        <Button variant="primary" className="whitespace-nowrap">{L.protect} <ArrowRight className="w-4 h-4" /></Button>
                      </Link>
                    </div>

                    {/* Lead capture (weekly safety tips) */}
                    <div className="mt-5 pt-5 border-t border-safenet-border/70">
                      {leadDone ? (
                        <p className="inline-flex items-center gap-2 text-sm text-safenet-primary font-medium">
                          <Check className="w-4 h-4" /> {L.notifyDone}
                        </p>
                      ) : (
                        <form onSubmit={submitLead}>
                          <label className="block text-sm font-medium text-safenet-text mb-2">{L.notifyLabel}</label>
                          <div className="flex gap-2">
                            <input
                              value={contact}
                              onChange={(e) => setContact(e.target.value)}
                              placeholder={L.notifyPlaceholder}
                              className="flex-1 rounded-btn border border-safenet-border bg-white px-3.5 py-2.5 text-sm text-safenet-text placeholder:text-safenet-text-3 focus:outline-none focus:ring-2 focus:ring-safenet-primary/40 focus:border-safenet-primary"
                            />
                            <Button type="submit" variant="secondary" className="whitespace-nowrap">{L.notifyCta}</Button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-xs text-safenet-text-3 text-center mt-6 max-w-lg mx-auto">{L.disclaimer}</p>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
