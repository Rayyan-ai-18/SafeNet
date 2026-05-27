import React from 'react'
import { Link } from 'react-router-dom'
import LegalLayout from '../components/layout/LegalLayout'

const H2 = ({ children }) => <h2 className="font-display text-heading-sm text-safenet-text pt-4">{children}</h2>

export default function Popia() {
  return (
    <LegalLayout
      title="POPIA Compliance"
      description="How SafeNet SA is built to comply with South Africa's Protection of Personal Information Act."
      canonicalPath="/popia"
      updated="May 2026"
    >
      <p>
        South Africa's Protection of Personal Information Act (POPIA) sets out how personal information
        must be handled. SafeNet SA was designed to meet these requirements by architecture, not as an
        afterthought - especially because we work with children's data, which deserves the highest care.
      </p>

      <H2>Processing limitation &amp; minimality</H2>
      <p>
        We collect only what is needed to keep a child safe: account identifiers, child profiles, and
        threat-alert metadata. Message content is analysed <strong>on the device</strong> and never
        leaves it, which removes an entire category of privacy risk. Learn how this works on our{' '}
        <Link to="/how-it-works" className="text-safenet-primary font-medium hover:underline">how it works</Link> page.
      </p>

      <H2>Purpose specification</H2>
      <p>
        Personal information is processed for one purpose: detecting online threats to a child and alerting
        their parent. We do not use it for advertising, profiling, or AI model training.
      </p>

      <H2>Consent and the data subject</H2>
      <p>
        A parent or guardian sets up SafeNet and provides consent on behalf of their child during sign-up.
        Parents can review, correct or delete information at any time - see our{' '}
        <Link to="/privacy" className="text-safenet-primary font-medium hover:underline">Privacy Policy</Link>.
      </p>

      <H2>Security safeguards</H2>
      <p>
        We apply reasonable technical and organisational measures to protect personal information, keep
        server-side secrets out of the browser, and limit access to alert metadata only.
      </p>

      <H2>Your rights and the Regulator</H2>
      <p>
        You may exercise your POPIA rights through our{' '}
        <Link to="/#contact" className="text-safenet-primary font-medium hover:underline">contact section</Link>. You may
        also lodge a complaint with the{' '}
        <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" className="text-safenet-primary font-medium hover:underline">Information Regulator of South Africa</a>{' '}
        or read the full Act at the official{' '}
        <a href="https://popia.co.za" target="_blank" rel="noopener noreferrer" className="text-safenet-primary font-medium hover:underline">POPIA resource</a>.
      </p>
    </LegalLayout>
  )
}
