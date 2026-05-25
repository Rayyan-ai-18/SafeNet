import React, { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider } from './context/AppContext'

const Landing = lazy(() => import('./pages/Landing'))
const Auth = lazy(() => import('./pages/Auth'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Child = lazy(() => import('./pages/Child'))
const Alerts = lazy(() => import('./pages/Alerts'))
const Location = lazy(() => import('./pages/Location'))
const Settings = lazy(() => import('./pages/Settings'))
const Luna = lazy(() => import('./pages/Luna'))
const Demo = lazy(() => import('./pages/Demo'))
const HowItWorks = lazy(() => import('./pages/HowItWorks'))

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
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-3 border-safenet-primary/20 border-t-safenet-primary animate-spin" />
        <p className="text-sm text-safenet-text-3 font-body">Loading SafeNet SA…</p>
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <AppProvider>
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
            <Route path="/auth" element={<PageWrapper><Auth /></PageWrapper>} />
            <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
            <Route path="/child/:childId" element={<PageWrapper><Child /></PageWrapper>} />
            <Route path="/alerts" element={<PageWrapper><Alerts /></PageWrapper>} />
            <Route path="/location" element={<PageWrapper><Location /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
            <Route path="/luna" element={<PageWrapper><Luna /></PageWrapper>} />
            <Route path="/demo" element={<PageWrapper><Demo /></PageWrapper>} />
            <Route path="/how-it-works" element={<PageWrapper><HowItWorks /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </AppProvider>
  )
}
