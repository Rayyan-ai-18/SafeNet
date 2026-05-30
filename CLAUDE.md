# SafeNet SA — Claude Code Project Guide

SafeNet SA is a digital child-safety platform for South African families: on-device
scam/phishing/grooming detection (the "Luna" AI guardian), WhatsApp-aware, 11 official
SA languages, POPIA-compliant by architecture. Mission: keep children safe. Building
toward a multibillion-rand company; think product + unit economics, not just code.

## Repo layout (monorepo)

Git root is `D:\SafeNet`. The shippable web app lives in **`safenet-sa/`** — almost all
work happens there.

- `safenet-sa/` — React + Vite SPA (the website + PWA). **Run all npm/build commands from here.**
- `safenet-sa/extension/` — separate Chrome MV3 browser extension (Family Shield).
- `safenet-sa/api/` — Vercel serverless functions (billing webhooks, secrets live here).
- `safenet-sa/supabase/` — DB schema.
- `Luna-AI/` — separate sibling product (the Luna AI service). Not the website.
- `PROJECT_OVERVIEW.md` — high-level context.

## Commands (run inside `safenet-sa/`)

```bash
npm run build      # vite build — ALWAYS run after changes to confirm it compiles
npm run dev        # vite dev server (port 3000)
npm run preview    # serve the production build
```

There is no test suite or linter configured. "Verify" = `npm run build` passes + check
the running preview. A preview server "safenet-dev" (port 3000) is usually already running.

## Stack

React 18 + Vite 5 SPA · React Router v6 (lazy routes in `src/App.jsx`) · Tailwind (custom
`safenet-*` tokens) · framer-motion + GSAP + Lenis (motion) · Leaflet/react-leaflet (maps) ·
Supabase (auth + DB, lazy-loaded) · i18next (11 languages) · recharts · qrcode.react ·
lucide-react (icons). PWA: `public/manifest.webmanifest` + `public/sw.js` (SW registers in
prod only). Deployed on **Vercel** (`safe-net-murex.vercel.app`); custom domain
`safenet-sa.co.za` not yet connected.

## Architecture

- **Contexts:** `src/context/AuthContext.jsx` (Supabase auth) and `src/context/AppContext.jsx`
  (children/zones/alerts/family state).
- **Demo-data fallback:** `AppContext` + `src/lib/db.js` return bundled demo data unless
  Supabase is configured AND a parent is signed in. Builds/demos must never break when env
  is absent — preserve this pattern.
- **Pages** (`src/pages/`): Landing, Auth, Dashboard (Overview), Children, Child, Alerts,
  Location, Settings, Luna, Demo, LinkScanner, GetApp (`/app`), HowItWorks, Privacy, Terms, Popia.
- **Dashboard pages** wrap content in `src/components/layout/DashboardShell.jsx` (sidebar +
  top bar). Marketing pages use `Nav` + `Footer`.
- **SEO:** every page renders `<SEO .../>` (`src/components/seo/SEO.jsx`).
- **On-device risk engine:** `src/lib/linkRisk.js` — zero-network heuristic, SA-brand-aware
  (SASSA/SARS/banks). Ported into the extension too (see hard rules).

## HARD RULES (do not violate)

1. **Do NOT redesign the UI.** The existing design system is the prized asset. Build *within*
   it using the Tailwind `safenet-*` tokens (below). Microinteractions / polish OK; new visual
   languages, restyling, or component rewrites are NOT.
2. **No em dashes (—) anywhere on the website** (`src/`, `public/`, `index.html`). Use commas,
   colons, or periods. This includes HTML entities (`&mdash;`). Backend/`api/`/schema/docs are exempt.
3. **Secrets stay server-side.** Only public keys may use the `VITE_` prefix (e.g.
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` are the public anon key — fine). Service-role
   keys, provider secret keys, and webhooks live in `api/` env only — never `VITE_`, never bundled.
4. **Keep `linkRisk.js` in sync.** `src/lib/linkRisk.js` and `extension/linkRisk.js` are twins —
   any change to one must be mirrored in the other.
5. **Git:** never commit or push unless the user explicitly says so. The repo's default branch is
   `main` and **pushing to `main` auto-deploys to Vercel production** — treat a push as a deploy.
   If asked to commit on `main`, that's fine here, but confirm before pushing.
6. **POPIA / child safety:** message analysis is on-device; message content never leaves the
   device or gets stored. Don't add features that exfiltrate or persist message content.

## Design tokens (use these, don't hardcode hex)

- **Colors:** `safenet-primary` `#0F7B4D` (brand green), `primary-light` `#DCFCE7`,
  `primary-dark` `#064E30`, `accent` `#F59E0B`, `danger` `#DC2626`, text `text`/`text-2`/`text-3`,
  surfaces `bg`/`surface`/`surface-2`, `border`/`border-strong`. (Full set in `tailwind.config.js`.)
- **Fonts:** `font-display` (Newsreader serif) for headings, `font-body` (DM Sans) for body,
  `font-mono` (IBM Plex Mono). Type scale: `text-display`/`display-lg/md/sm`, `heading-lg/md/sm`.
- **Radius:** `rounded-btn` `rounded-card` `rounded-card-lg` `rounded-hero`.
- **Shadow:** `shadow-safenet-sm/md/lg/xl`.

## Motion & a11y conventions

- Animate transform/opacity only; 150–300ms; ease-out on enter. Respect
  `prefers-reduced-motion` (disable/reduce). Use `font-variant-numeric: tabular-nums` for
  numbers/scores. Visible `focus-visible` rings; press-scale (~0.97) for tappable elements.
- Touch targets ≥ 44px. GSAP ScrollTrigger is the tool for scroll/parallax (official skill available).

## Deploy notes & gotchas

- Vercel: `buildCommand: vite build`, output `dist/`, SPA rewrite `/((?!api/).*) -> /index.html`.
- `/app` is the PWA install page. QR encodes the live origin (falls back to the Vercel URL on
  localhost). PWA install needs PNG icons (192/512/maskable in `public/icons/`) — regenerate via
  `node scripts/generate-pwa-icons.cjs`. iPhone install = Safari "Add to Home Screen" only (Apple
  rule); Android = one-tap WebApk. There is no downloadable APK/IPA (it's a PWA).
- `index.html` carries a crawlable SEO text fallback inside `#root`, hidden from JS users via a
  `.js` class so they see a branded loader instead. Keep both behaviors if you touch it.
- Windows: scripts run under `"type": "module"`, so standalone Node scripts must be `.cjs`.
  Beware stray reserved-name files (a `nul`/`nul-file` has appeared before).

## Working style

Think like the CTO + founder: weigh product impact and unit economics, not just the code.
When something can't be done (e.g. iOS one-tap install), say so plainly rather than faking it.
Prefer the official/built-in skills already installed (GSAP, ui-ux-pro-max, /code-review,
/security-review, /verify) over ad-hoc approaches.
