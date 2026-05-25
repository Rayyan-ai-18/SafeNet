## Project Overview — SafeNet / Luna-AI Workspace

**One-line summary:** This repository contains multiple related projects: Luna-AI (security scanner + backend + browser extension + frontend), SafeNet SA (React/Vite dashboard app), a UI/UX skill toolkit, and supporting assets, configs, and deployment manifests.

---

### High-level summary
- **Purpose:** Security tooling and demo applications. The main deliverables are a vulnerability scanner (`Luna-AI`), a browser extension, and a production-ready React frontend (`safenet-sa`).
- **Primary languages & runtimes:** JavaScript/TypeScript (frontend), Python (Flask backend), HTML/CSS, and JSON config files.
- **Build tools & platforms:** Node (Vite), TailwindCSS, Vercel deployment configs, pip/Flask for backend, Playwright for scanning, Supabase (Postgres) for persistence.

---

### Top-level folders (what they contain)
- **Luna-AI/** — Core product: scanner backend, UI, browser extension, and API helpers.
  - README & docs: [Luna-AI/README.md](Luna-AI/README.md)
  - Backend (Flask): [Luna-AI/backend/app.py](Luna-AI/backend/app.py)
  - Backend dependencies: [Luna-AI/backend/requirements.txt](Luna-AI/backend/requirements.txt)
  - Browser extension: [Luna-AI/extension/manifest.json](Luna-AI/extension/manifest.json)
  - Frontend assets and scripts: `index.html`, `script.js`, `styles.css` under `Luna-AI/`
  - Serverless/API helpers: `Luna-AI/api/` (JS endpoints for product workflows)

- **safenet-sa/** — React + Vite application (dashboard and marketing pages)
  - Package: [safenet-sa/package.json](safenet-sa/package.json)
  - Vite config: [safenet-sa/vite.config.js](safenet-sa/vite.config.js)
  - Tailwind config: [safenet-sa/tailwind.config.js](safenet-sa/tailwind.config.js)
  - App entry: [safenet-sa/src/main.jsx](safenet-sa/src/main.jsx) and [safenet-sa/src/App.jsx](safenet-sa/src/App.jsx)
  - Pages: `safenet-sa/src/pages/` — `Landing.jsx`, `Auth.jsx`, `Dashboard.jsx`, `Child.jsx`, `Alerts.jsx`, `Location.jsx`, `Settings.jsx`
  - Styles: [safenet-sa/src/styles/globals.css](safenet-sa/src/styles/globals.css), [safenet-sa/src/styles/animations.css](safenet-sa/src/styles/animations.css)
  - Components: `safenet-sa/src/components/` (dashboard, layout, ui, etc.)

- **ui-ux-pro-max-skill/** — Design skill and CLI tooling
  - Skill metadata and docs: `ui-ux-pro-max-skill/README.md`, `skill.json`, CLI under `ui-ux-pro-max-skill/cli/`

- **.agents/** — Agent/skill definitions used by local tooling and internal agents.
- **supabase/** — Database schema: [supabase/schema.sql](supabase/schema.sql)
- **icons/** — Shared icon assets.

---

### Luna-AI — detailed

#### Backend
- Entry: [Luna-AI/backend/app.py](Luna-AI/backend/app.py)
  - Provides a Flask API with endpoints:
    - `GET /` status
    - `POST /scan` — orchestrates three phases: `detect` (ScanEngine), `protect` (ProtectionChecker), `prevent` (PreventionFixer)
  - Saves scan results to Supabase when credentials are present (reads `.env` and `.env.local` in backend folder).
- Dependencies: [Luna-AI/backend/requirements.txt](Luna-AI/backend/requirements.txt) — includes `flask`, `flask-cors`, `playwright`, `supabase`, `requests`, `beautifulsoup4`, `python-dotenv`.

#### Scanner & submodules
- `Luna-AI/detect/` — Playwright-driven scanning logic (DOM rendering, active tests for XSS/SQLi etc.).
- `Luna-AI/protect/` — header and security checks (CSP, HSTS, TLS checks).
- `Luna-AI/prevent/` — remediation/fixer generator producing recommended code changes.

#### Browser extension
- Manifest and scripts: [Luna-AI/extension/manifest.json](Luna-AI/extension/manifest.json) (MV3, `background.js`, `content.js`, `luna-bridge.js`, `popup.html`)

#### Frontend & API helpers
- Root-level UI files and `Luna-AI/api/` endpoints used for webhooks/serverless features.
- `Luna-AI/README.md` documents architecture and developer quick start: [Luna-AI/README.md](Luna-AI/README.md)

---

### SafeNet SA — detailed

#### Purpose
- A React/Vite dashboard and marketing front-end with maps, alerts, family/child views, and interactive UI.

#### Key files
- Package & deps: [safenet-sa/package.json](safenet-sa/package.json)
- Entrypoints: [safenet-sa/src/main.jsx](safenet-sa/src/main.jsx), [safenet-sa/src/App.jsx](safenet-sa/src/App.jsx)
- Pages: `safenet-sa/src/pages/` (lazy-loaded in App.jsx)
- Context & hooks: `safenet-sa/src/context/AppContext.jsx`, `safenet-sa/src/hooks/` (auth, alerts, child, family, location, luna)
- Libraries wrappers: `safenet-sa/src/lib/firebase.js`, `safenet-sa/src/lib/gsap.js`, `safenet-sa/src/lib/lenis.js`, `safenet-sa/src/lib/luna-api.js`

#### How it runs (developer)
1. Install deps and run Vite dev server in `safenet-sa`:

```bash
cd safenet-sa
npm install
npm run dev
```

2. Build for production:

```bash
npm run build
npm run preview
```

---

### Other notable pieces
- `supabase/schema.sql` — database schema for scans and related tables: [supabase/schema.sql](supabase/schema.sql)
- `vercel.json` — present in some projects for deployment configuration (e.g., `Luna-AI`, `safenet-sa`).
- `scripts/` utilities like `Luna-AI/generate-assets.js` and `extension/generate-icons.js` help automate asset generation.

---

### Detected frameworks & third-party tools
- Frontend: React (v18), Vite, TailwindCSS, Framer Motion, GSAP, Lenis, Recharts, React-Leaflet/Leaflet.
- Backend: Flask (Luna-AI), Playwright for scanning.
- Data & auth: Supabase (Postgres), Firebase integrations in `safenet-sa`.
- Deployment: Vercel (configs present), Node/npm for frontend tooling, Python/pip for backend.

---

### Quick-start commands (local development)

Luna-AI backend (requires Python 3.10+ and environment variables):

```bash
cd Luna-AI/backend
pip install -r requirements.txt
python app.py
```

SafeNet SA frontend (Node 18+ recommended):

```bash
cd safenet-sa
npm install
npm run dev
```

---

### Security & env notes
- `Luna-AI/backend/app.py` expects Supabase credentials via `.env` or `.env.local`.
- Keep service keys and API tokens out of version control. Playwright and browser automation can require additional OS-level dependencies (Chromium) when installed via `playwright`.

---

### Useful file links
- Project README: [Luna-AI/README.md](Luna-AI/README.md)
- Luna backend: [Luna-AI/backend/app.py](Luna-AI/backend/app.py)
- Luna backend deps: [Luna-AI/backend/requirements.txt](Luna-AI/backend/requirements.txt)
- Extension manifest: [Luna-AI/extension/manifest.json](Luna-AI/extension/manifest.json)
- SafeNet package.json: [safenet-sa/package.json](safenet-sa/package.json)
- SafeNet app entry: [safenet-sa/src/main.jsx](safenet-sa/src/main.jsx)
- DB schema: [supabase/schema.sql](supabase/schema.sql)

---

If you want follow-ups I can:
- expand this into a full file tree listing (every path),
- add a `CONTRIBUTING.md` with expected env variables and start scripts, or
- generate run scripts and environment templates for local dev.

Pick one and I'll prepare it next.
