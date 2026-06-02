import React from 'react'
import { motion } from 'framer-motion'
import { Mail, TrendingUp, MapPin, ArrowRight } from 'lucide-react'

// TODO: confirm these inboxes exist (or swap for your real addresses).
const GENERAL_EMAIL = 'hello@safenet-sa.co.za'
const INVESTOR_EMAIL = 'invest@safenet-sa.co.za'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function ContactSection() {
  return (
    <section id="contact" className="bg-safenet-surface py-16 lg:py-20 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center mb-10"
        >
          <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.2em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full mb-4">
            Get in touch
          </span>
          <h2 className="font-display text-display-sm text-safenet-text max-w-xl mx-auto">
            Let's keep SA children safe together
          </h2>
          <p className="text-base text-safenet-text-2 max-w-lg mx-auto mt-3">
            Whether you're a parent, a school, or an investor, we'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General contact */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-7 flex flex-col"
          >
            <span className="inline-flex w-12 h-12 rounded-xl bg-safenet-primary-light items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-safenet-primary" />
            </span>
            <h3 className="font-display text-heading-sm text-safenet-text mb-1">General &amp; partnerships</h3>
            <p className="text-sm text-safenet-text-2 leading-relaxed mb-5 flex-1">
              Questions, school partnerships, press, or support? Reach the team directly.
            </p>
            <a
              href={`mailto:${GENERAL_EMAIL}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-btn bg-safenet-primary text-white text-sm font-medium hover:bg-safenet-primary-dark transition-colors"
            >
              <Mail className="w-4 h-4" />
              {GENERAL_EMAIL}
            </a>
          </motion.div>

          {/* Investor contact */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            className="bg-safenet-text rounded-card-lg shadow-safenet-lg border border-safenet-text p-7 flex flex-col text-white"
          >
            <span className="inline-flex w-12 h-12 rounded-xl bg-white/10 items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-safenet-primary-light" />
            </span>
            <h3 className="font-display text-heading-sm mb-1">For investors</h3>
            <p className="text-sm text-white/70 leading-relaxed mb-5 flex-1">
              We're building tools that keep South African children safer online. Request our
              deck and pilot data, or set up an intro call.
            </p>
            <a
              href={`mailto:${INVESTOR_EMAIL}?subject=Investor%20enquiry%20-%20SafeNet%20SA`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-btn bg-white text-safenet-text text-sm font-medium hover:bg-white/90 transition-colors"
            >
              {INVESTOR_EMAIL}
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="flex items-center justify-center gap-2 mt-6 text-sm text-safenet-text-3"
        >
          <MapPin className="w-4 h-4" />
          Built in South Africa, for South African families.
        </motion.div>
      </div>
    </section>
  )
}
