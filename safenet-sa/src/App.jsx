import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import { trackPageview } from './lib/analytics'

const Landing = lazy(() => import('./pages/Landing'))
const Auth = lazy(() => import('./pages/Auth'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Children = lazy(() => import('./pages/Children'))
const Child = lazy(() => import('./pages/Child'))
const Alerts = lazy(() => import('./pages/Alerts'))
const Location = lazy(() => import('./pages/Location'))
const Settings = lazy(() => import('./pages/Settings'))
const Luna = lazy(() => import('./pages/Luna'))
const Demo = lazy(() => import('./pages/Demo'))
const LinkScanner = lazy(() => import('./pages/LinkScanner'))
const GetApp = lazy(() => import('./pages/GetApp'))
const HowItWorks = lazy(() => import('./pages/HowItWorks'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const Popia = lazy(() => import('./pages/Popia'))

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-safenet-bg">
      <div className="flex flex-col items-center gap-5">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="motion-safe:animate-[safenet-pulse_1.4s_ease-in-out_infinite]"
        >
          <path d="M24 4L6 12V22C6 34 14 40 24 44C34 40 42 34 42 22V12L24 4Z" fill="#0F7B4D" opacity="0.15" />
          <path d="M24 4L6 12V22C6 34 14 40 24 44C34 40 42 34 42 22V12L24 4Z" stroke="#0F7B4D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 24L22 28L30 20" stroke="#0F7B4D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-sm text-safenet-text-3 font-body">Loading SafeNet SA…</p>
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()

  // Capture a pageview on every route change (SPA navigation)
  useEffect(() => {
    trackPageview(location.pathname)
  }, [location.pathname])

  return (
    <AuthProvider>
    <AppProvider>
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
            <Route path="/auth" element={<PageWrapper><Auth /></PageWrapper>} />
            <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
            <Route path="/children" element={<PageWrapper><Children /></PageWrapper>} />
            <Route path="/child/:childId" element={<PageWrapper><Child /></PageWrapper>} />
            <Route path="/alerts" element={<PageWrapper><Alerts /></PageWrapper>} />
            <Route path="/location" element={<PageWrapper><Location /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
            <Route path="/luna" element={<PageWrapper><Luna /></PageWrapper>} />
            <Route path="/demo" element={<PageWrapper><Demo /></PageWrapper>} />
            <Route path="/scan" element={<PageWrapper><LinkScanner /></PageWrapper>} />
            <Route path="/app" element={<PageWrapper><GetApp /></PageWrapper>} />
            <Route path="/how-it-works" element={<PageWrapper><HowItWorks /></PageWrapper>} />
            <Route path="/privacy" element={<PageWrapper><Privacy /></PageWrapper>} />
            <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
            <Route path="/popia" element={<PageWrapper><Popia /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </AppProvider>
    </AuthProvider>
  )
}
