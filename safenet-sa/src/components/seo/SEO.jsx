import React from 'react'
import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://safenet-sa.co.za'
const DEFAULT_OG_IMAGE = '/og-image.png'
const DEFAULT_TITLE = 'SafeNet SA - Digital Safety for South African Families'
const DEFAULT_DESC =
  'The only digital safety platform built for South African families. Monitors WhatsApp. Speaks isiZulu. POPIA compliant. Ready in 5 minutes.'

const LANGUAGES = ['en-ZA', 'zu', 'af', 'xh', 'st', 'tn', 'nso', 've', 'ts', 'ss', 'nr']

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  canonicalPath = '/',
  ogImage = DEFAULT_OG_IMAGE,
  jsonLd,
}) {
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const ogImageUrl = `${SITE_URL}${ogImage}`

  return (
    <Helmet>
      {/* Title */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang / Alternate language links */}
      {LANGUAGES.map((lang) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={canonicalUrl} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="SafeNet SA" />
      <meta property="og:locale" content="en_ZA" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
      <meta name="twitter:image:alt" content={title} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  )
}
