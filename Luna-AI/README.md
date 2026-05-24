# 🔵 Luna AI: Detect. Protect. Prevent.

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://meet-luna-ai.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Status: Phase 0](https://img.shields.io/badge/Status-Phase%200%20(MVP)-success?style=flat-square)](ROADMAP.md)

**Luna AI** is a professional-grade cybersecurity platform designed for developers and SMBs. We replace complex, jargon-heavy security tools with a fast, real-time, and AI-powered scanning engine that identifies your vulnerabilities and gives you the exact code to fix them.

---

## 🚀 The Mission
To make enterprise-grade cybersecurity accessible, automatic, and understandable for every organization—regardless of team size or expertise.

---

## ✨ Core Features

### 🔍 1. Real-Time Vulnerability Scanner (DETECT)
Stop waiting for batch reports. Luna provides a live streaming view of your security posture.
- **SQL Injection:** Active testing for error-based, boolean, and time-based SQLi.
- **Cross-Site Scripting (XSS):** Detection of reflected, stored, and DOM-based vectors.
- **Security Header Audit:** Real-time analysis of CSP, HSTS, X-Frame-Options, and more.
- **SSL/TLS Inspector:** Verification of certificates, protocols (TLS 1.3), and expiry tracking.

### 🛡️ 2. AI-Assisted Protection (PROTECT)
Luna doesn't just find problems; she helps you solve them.
- **AI Fix Suggestions:** Deep integration with Claude AI to generate copy-paste code fixes for vulnerabilities.
- **Security Visualization:** Cinematic, dark-mode dashboard showing your "Attack Surface" and "Risk Score."

### 🚧 3. Infrastructure Hardening (PREVENT)
- **CI/CD Integration:** Automated scans on every Pull Request to prevent "vulnerable" code from ever reaching production.
- **24/7 Monitoring:** Continuous uptime and DNS monitor to detect hijacking or DDoS anomalies.

---

## 🛠️ The Tech Stack

- **Frontend:** React + TypeScript (Vite), TailwindCSS, Framer Motion.
- **Backend:** FastAPI (Python 3.12) with `asyncio` for parallel module execution.
- **Scan Engine:** Playwright (Headless Chromium) for full DOM/JS rendering.
- **Streaming:** Redis Streams + Server-Sent Events (SSE) for <3s "Time to First Finding."
- **AI Intelligence:** Anthropic Claude API for cybersecurity explanations and fix logic.
- **Database:** Supabase (PostgreSQL) + Row Level Security (RLS).

---

## 📦 Quick Start (Development)

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq / Anthropic API Key (for Luna's brain)

### 1. Clone the repository
```bash
git clone https://github.com/Rayyankhan18/Luna-AI.git
cd Luna-AI
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🗺️ Roadmap (V1.0)

- [x] **Phase 0:** Core Scanner (SQLi, XSS, Headers, SSL) + Real-time UI.
- [x] **Phase 1:** Phishing Detection Engine + Visual Similarity Matching.
- [x] **Phase 2:** AI Code Guardian + GitHub Repo Auto-Scanning.
- [x] **Phase 3:** Infrastructure Monitoring + Uptime Dashboard.
- [ ] **Phase 4:** Mobile App (React Native) for real-time threat alerts.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ✉️ Contact
Created by **Rayyan**. 
For partnerships or enterprise access: [hello@luna-ai.dev](mailto:hello@luna-ai.dev)
[meet-luna-ai.vercel.app](https://meet-luna-ai.vercel.app)
