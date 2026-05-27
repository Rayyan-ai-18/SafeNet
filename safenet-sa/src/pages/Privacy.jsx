import React from 'react'
import { Link } from 'react-router-dom'
import LegalLayout from '../components/layout/LegalLayout'

const H2 = ({ children }) => <h2 className="font-display text-heading-sm text-safenet-text pt-4">{children}</h2>

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="How SafeNet SA collects, uses and protects personal information - privacy-first and POPIA-aligned."
      canonicalPath="/privacy"
      updated="May 2026"
    >
      <p>
        SafeNet SA ("we", "us") builds child digital-safety software for South African families.
        Protecting children also means protecting their privacy, so SafeNet is designed to collect as
        little personal information as possible and to keep sensitive content on the child's device.
      </p>

      <H2>Our core privacy principle</H2>
      <p>
        Message analysis runs <strong>on the child's device</strong>. The content of WhatsApp and other
        messages is never transmitted to our servers and is never stored by us. Parents receive only
        threat alerts - a category and a timestamp - never the underlying chat content. You can read more
        about this on our <Link to="/how-it-works" className="text-safenet-primary font-medium hover:underline">how it works</Link> page.
      </p>

      <H2>Information we process</H2>
      <p>
        To provide the service we may process: an account identifier (such as a mobile number), the
        children profiles a parent sets up, threat-alert metadata (category, time, app), and basic
        device and usage diagnostics. We do not sell personal information, and we do not use children's
        message content for advertising or model training.
      </p>

      <H2>Your rights under POPIA</H2>
      <p>
        Under the Protection of Personal Information Act, you may request access to, correction of, or
        deletion of personal information we hold. You can also object to certain processing. To exercise
        these rights, contact us via the <Link to="/#contact" className="text-safenet-primary font-medium hover:underline">contact section</Link> on
        our homepage. For more on the law, see the official{' '}
        <a href="https://popia.co.za" target="_blank" rel="noopener noreferrer" className="text-safenet-primary font-medium hover:underline">POPIA resource</a>{' '}
        and the{' '}
        <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" className="text-safenet-primary font-medium hover:underline">Information Regulator of South Africa</a>.
      </p>

      <H2>Data retention &amp; security</H2>
      <p>
        We retain account and alert metadata only for as long as your account is active or as required by
        law, and we apply reasonable technical and organisational safeguards to protect it. If you close
        your account, associated personal information is deleted or anonymised.
      </p>

      <H2>Children</H2>
      <p>
        SafeNet is operated by a parent or guardian on behalf of their child, with consent captured during
        sign-up. We treat children's information with extra care and minimise what is collected.
      </p>

      <p>
        Questions about this policy? Reach us through the{' '}
        <Link to="/#contact" className="text-safenet-primary font-medium hover:underline">contact section</Link> or review our{' '}
        <Link to="/terms" className="text-safenet-primary font-medium hover:underline">Terms of Service</Link> and{' '}
        <Link to="/popia" className="text-safenet-primary font-medium hover:underline">POPIA commitment</Link>.
      </p>
    </LegalLayout>
  )
}
