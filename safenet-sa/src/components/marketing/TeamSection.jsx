import React from 'react'
import { motion } from 'framer-motion'
import { Linkedin } from 'lucide-react'

// TODO: Replace these placeholders with real founder details before showing investors.
// Add a `photo` (URL in /public) to show a headshot instead of initials.
const team = [
  {
    name: '[Founder name]',
    role: 'Founder & CEO',
    bio: 'Add a one-line bio: background, why you started SafeNet SA, relevant expertise.',
    initials: 'SA',
    linkedin: '',
  },
  {
    name: '[Co-founder name]',
    role: 'Co-Founder & CTO',
    bio: 'Add a one-line bio: technical background, what they build and own.',
    initials: 'SA',
    linkedin: '',
  },
  {
    name: '[Advisor name]',
    role: 'Advisor',
    bio: 'Add a one-line bio: domain expertise (child safety, education, policy, etc.).',
    initials: 'SA',
    linkedin: '',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] } }),
}

export default function TeamSection() {
  return (
    <section id="team" className="bg-white py-16 lg:py-20 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center mb-10"
        >
          <span className="inline-block text-xs font-semibold text-safenet-primary tracking-[0.2em] uppercase bg-safenet-primary-light px-4 py-1.5 rounded-full mb-4">
            Team
          </span>
          <h2 className="font-display text-display-sm text-safenet-text max-w-xl mx-auto">
            The people building SafeNet SA
          </h2>
          <p className="text-base text-safenet-text-2 max-w-lg mx-auto mt-3">
            South Africans building safety infrastructure for South African families.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member, i) => (
            <motion.div
              key={member.role}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              className="bg-white rounded-card-lg shadow-safenet-md border border-safenet-border p-6 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-safenet-primary-light text-safenet-primary flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {member.initials}
              </div>
              <h3 className="font-display text-heading-sm text-safenet-text">{member.name}</h3>
              <p className="text-sm font-medium text-safenet-primary mb-2">{member.role}</p>
              <p className="text-sm text-safenet-text-2 leading-relaxed">{member.bio}</p>
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-safenet-text-3 hover:text-safenet-primary transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  LinkedIn
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
