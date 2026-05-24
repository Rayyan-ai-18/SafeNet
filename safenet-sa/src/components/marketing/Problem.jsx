import React, { useRef, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { gsap, ScrollTrigger } from '../../lib/gsap'

const comparisonRows = [
  { feature: 'WhatsApp SA language monitoring', global: false, safenet: true },
  { feature: 'Under R150 per month', global: false, safenet: true },
  { feature: 'POPIA compliant on-device processing', global: false, safenet: true },
  { feature: 'Cannot be factory reset bypassed', global: false, safenet: true },
  { feature: 'Born and hosted in SA', global: false, safenet: true },
  { feature: 'ISP billing integration', global: false, safenet: true },
]

export default function Problem() {
  const sectionRef = useRef(null)
  const titleRef = useRef(null)
  const bodyRef = useRef(null)
  const tableRef = useRef(null)
  const rowsRef = useRef([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const section = sectionRef.current

      gsap.fromTo(titleRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' },
        }
      )

      gsap.fromTo(bodyRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.6, delay: 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' },
        }
      )

      gsap.fromTo(tableRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' },
        }
      )

      gsap.fromTo(rowsRef.current,
        { opacity: 0, x: -15 },
        {
          opacity: 1, x: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out',
          scrollTrigger: { trigger: tableRef.current, start: 'top 80%', toggleActions: 'play none none none' },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left: Title */}
          <div ref={titleRef} className="lg:w-[45%]">
            <h2 className="font-display text-display-md text-safenet-primary leading-[1.15]">
              Every global<br />
              safety tool was<br />
              built for them.<br />
              Not for you.
            </h2>
          </div>

          {/* Right: Body + Table */}
          <div className="lg:w-[55%] space-y-8">
            <div ref={bodyRef} className="space-y-5">
              <p className="text-lg text-safenet-text-2 leading-relaxed">
                Your child lives on WhatsApp. Not iMessage. Not Snapchat.
                WhatsApp — where the real threats in South Africa happen every day.
                According to{' '}
                <a
                  href="https://businesstech.co.za/news/internet/758979/cybercrime-in-sa-phishing-attacks-now-targeting-whatsapp-users/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-safenet-primary underline decoration-safenet-primary/30 hover:decoration-safenet-primary transition-all"
                >
                  BusinessTech
                </a>, phishing attacks targeting WhatsApp users in South Africa have surged, with criminals exploiting messaging apps to steal personal data.
              </p>
              <p className="text-lg text-safenet-text-2 leading-relaxed">
                Bark costs R260 a month and does not monitor WhatsApp.
                Qustodio does not speak Afrikaans.
                Google Family Link can be bypassed in 30 seconds.
              </p>
              <p className="text-lg text-safenet-text font-semibold">
                SafeNet SA was built for Soweto, Stellenbosch, Polokwane,
                and every family in between.
              </p>
              <p className="text-sm text-safenet-text-3 leading-relaxed">
                <a
                  href="https://www.childlinesa.org.za/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-safenet-primary underline decoration-safenet-primary/30 hover:decoration-safenet-primary transition-all"
                >
                  Childline South Africa
                </a>{' '}
                reports that online grooming and cyberbullying cases have risen significantly, making digital safety tools essential for modern parenting.
              </p>
              <p className="text-sm text-safenet-text-3 leading-relaxed">
                According to{' '}
                <a
                  href="https://www.unicef.org/southafrica/press-releases/children-increasingly-targeted-online-south-africa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-safenet-primary underline decoration-safenet-primary/30 hover:decoration-safenet-primary transition-all"
                >
                  UNICEF South Africa
                </a>, children in SA are increasingly targeted online, with 1 in 3 children having been exposed to harmful content. Early intervention and digital monitoring are critical.
              </p>
              <p className="text-sm text-safenet-text-3 leading-relaxed">
                The{' '}
                <a
                  href="https://www.saps.gov.za/resource_centre/publications/cybercrime_report.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-safenet-primary underline decoration-safenet-primary/30 hover:decoration-safenet-primary transition-all"
                >
                  South African Police Service
                </a>{' '}
                has reported a significant rise in cybercrimes targeting minors, including online extortion and grooming through social media platforms like WhatsApp.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="flex justify-center mt-6">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 text-sm font-medium text-safenet-primary hover:text-safenet-primary-dark transition-colors group"
              >
                See our affordable plans — starting at free
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>
            <div ref={tableRef} className="bg-white border border-safenet-border rounded-card-lg shadow-safenet-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-safenet-surface border-b border-safenet-border">
                    <th className="text-left px-5 py-3.5 font-semibold text-safenet-text">Feature</th>
                    <th className="text-center px-4 py-3.5 font-medium text-safenet-text-3">Global tools</th>
                    <th className="text-center px-4 py-3.5 font-semibold text-safenet-primary">SafeNet SA</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr
                      key={row.feature}
                      ref={el => rowsRef.current[i] = el}
                      className="border-b border-safenet-border last:border-0"
                    >
                      <td className="px-5 py-3.5 text-safenet-text">{row.feature}</td>
                      <td className="text-center px-4 py-3.5">
                        {row.global ? (
                          <Check className="w-4 h-4 text-safenet-primary mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-safenet-text-3 mx-auto" />
                        )}
                      </td>
                      <td className="text-center px-4 py-3.5">
                        {row.safenet ? (
                          <Check className="w-4 h-4 text-safenet-primary mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-safenet-text-3 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
