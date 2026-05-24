import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  Product: ['Features', 'How it works', 'Pricing', 'For Schools', 'FAQ'],
  Company: ['About', 'Blog', 'Careers', 'Press', 'Partners'],
  Legal: ['Privacy Policy', 'Terms of Service', 'POPIA Compliance', 'Cookie Policy'],
  Support: ['Help Center', 'Contact Us', 'Status', 'Community'],
}

export default function Footer() {
  return (
    <footer className="bg-white border-t border-safenet-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-safenet-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-lg text-safenet-text">SafeNet SA</span>
            </Link>
            <p className="text-sm text-safenet-text-3 leading-relaxed mb-4 max-w-[200px]">
              Digital safety infrastructure for South African families. Born here. Built here.
            </p>
            <div className="flex items-center gap-2 text-xs text-safenet-text-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-safenet-primary-light text-safenet-primary rounded-md font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-safenet-primary pulse-dot" />
                All systems safe
              </span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold text-safenet-text uppercase tracking-wider mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-safenet-text-2 hover:text-safenet-primary transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-safenet-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-safenet-text-3">
            <span>&copy; {new Date().getFullYear()} SafeNet SA. All rights reserved.</span>
            <span className="hidden sm:inline">·</span>
            <span>POPIA compliant</span>
          </div>
          <div className="flex items-center gap-4">
            <select
              className="text-sm bg-safenet-surface border border-safenet-border rounded-input px-3 py-1.5 text-safenet-text-2 focus:outline-none focus:ring-2 focus:ring-safenet-primary/40"
              defaultValue="en"
            >
              <option value="en">English</option>
              <option value="af">Afrikaans</option>
              <option value="zu">isiZulu</option>
              <option value="xh">isiXhosa</option>
              <option value="st">Sesotho</option>
              <option value="tn">Setswana</option>
              <option value="nso">Sepedi</option>
              <option value="ve">Tshivenḓa</option>
              <option value="ts">Xitsonga</option>
              <option value="ss">siSwati</option>
              <option value="nr">isiNdebele</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  )
}
