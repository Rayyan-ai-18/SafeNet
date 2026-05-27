import React from 'react'
import { Link } from 'react-router-dom'
import LegalLayout from '../components/layout/LegalLayout'

const H2 = ({ children }) => <h2 className="font-display text-heading-sm text-safenet-text pt-4">{children}</h2>

export default function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="The terms that govern your use of SafeNet SA's child digital-safety platform."
      canonicalPath="/terms"
      updated="May 2026"
    >
      <p>
        These terms govern your use of SafeNet SA. By creating an account or using the service, you agree
        to them. If you are using SafeNet on behalf of a child, you confirm that you are their parent or
        legal guardian and consent to the monitoring features described on our{' '}
        <Link to="/how-it-works" className="text-safenet-primary font-medium hover:underline">how it works</Link> page.
      </p>

      <H2>What SafeNet provides</H2>
      <p>
        SafeNet uses the Luna AI assistant to detect cyberbullying, grooming, scams and harmful links on a
        child's device, and to alert the parent. Detection is probabilistic: while we work hard to be
        accurate across South African languages, no safety tool can catch every threat, and SafeNet does
        not replace adult supervision and open conversation with your child.
      </p>

      <H2>Acceptable use</H2>
      <p>
        You agree to use SafeNet only to protect children in your legal care, and not to monitor adults or
        third parties without lawful basis. You may not attempt to abuse, reverse engineer, overload, or
        disrupt the service or its APIs.
      </p>

      <H2>Plans and billing</H2>
      <p>
        SafeNet offers a free tier plus paid Guardian and Sentinel plans. Pricing is shown on our{' '}
        <Link to="/#pricing" className="text-safenet-primary font-medium hover:underline">pricing section</Link>. Paid plans
        renew until cancelled; you can cancel at any time and retain access until the end of the billing period.
      </p>

      <H2>Privacy</H2>
      <p>
        Your use of SafeNet is also governed by our{' '}
        <Link to="/privacy" className="text-safenet-primary font-medium hover:underline">Privacy Policy</Link> and our{' '}
        <Link to="/popia" className="text-safenet-primary font-medium hover:underline">POPIA commitment</Link>. Message
        content stays on the child's device and is never stored by us.
      </p>

      <H2>Liability</H2>
      <p>
        SafeNet is provided "as is". To the maximum extent permitted by South African law, we are not
        liable for indirect or consequential loss arising from use of, or inability to use, the service.
        Nothing in these terms limits rights you have under the{' '}
        <a href="https://www.gov.za/documents/consumer-protection-act" target="_blank" rel="noopener noreferrer" className="text-safenet-primary font-medium hover:underline">Consumer Protection Act</a>.
      </p>

      <H2>Contact</H2>
      <p>
        Questions about these terms? Reach the team via the{' '}
        <Link to="/#contact" className="text-safenet-primary font-medium hover:underline">contact section</Link> on our homepage.
      </p>
    </LegalLayout>
  )
}
