// SafeNet SA — Family Shield popup. Shows the on-device verdict for the active
// tab, lets a parent paste any link/message to check locally, and toggles
// auto-protection. All grading uses the shared SafeNetRisk heuristic.

const SITE = 'https://safenet-sa.co.za';

const ORB_COLORS = {
  safe:       ['#86EFAC', '#0F7B4D'],
  suspicious: ['#FDE047', '#CA8A04'],
  dangerous:  ['#FCA5A5', '#DC2626'],
  unknown:    ['#94A3B8', '#475569'],
};
const VERDICT_LABEL = {
  safe: 'Looks safe', suspicious: 'Be careful', dangerous: 'Dangerous', unknown: 'Not checked',
};

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function paintOrb(el, verdict) {
  const [c, e] = ORB_COLORS[verdict] || ORB_COLORS.unknown;
  el.style.background = `radial-gradient(circle at 35% 30%, ${c}, ${e})`;
  // Drive the CSS pulse ring with the verdict's own colour so a dangerous
  // page literally pulses red. Retrigger the animation on each repaint.
  el.style.setProperty('--orb-glow', `${e}59`); // ~35% alpha
  el.setAttribute('aria-label', `Safety status: ${VERDICT_LABEL[verdict] || 'unknown'}`);
  if (!REDUCED_MOTION) {
    el.classList.remove('pulse');
    void el.offsetWidth; // reflow so the animation restarts
    el.classList.add('pulse');
  }
}

// Brief count-up so the daily stats feel alive without being distracting.
function countUp(el, to) {
  const target = Number(to) || 0;
  if (REDUCED_MOTION || target === 0) { el.textContent = String(target); return; }
  const start = performance.now();
  const dur = Math.min(700, 200 + target * 40);
  (function step(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    el.textContent = String(Math.round(eased * target));
    if (t < 1) requestAnimationFrame(step);
  })(start);
}

function renderSignals(container, signals) {
  container.innerHTML = '';
  const items = (signals || []).filter((s) => s.points > 0).slice(0, 4);
  if (!items.length) {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = '<span class="dot"></span><span>No risk signals detected on this page.</span>';
    container.appendChild(div);
    return;
  }
  items.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.style.animationDelay = `${120 + i * 45}ms`; // gentle cascade
    div.innerHTML = '<span class="dot"></span><span></span>';
    div.querySelector('span:last-child').textContent = s.label;
    container.appendChild(div);
  });
}

function showVerdict(result, host) {
  paintOrb(document.getElementById('orb'), result.verdict);
  document.getElementById('verdict-label').textContent = VERDICT_LABEL[result.verdict] || '—';
  document.getElementById('verdict-host').textContent = host || '';
  document.getElementById('score-pill').textContent = `${result.score}/100`;
  renderSignals(document.getElementById('signals'), result.signals);
}

async function init() {
  // Active tab + its stored verdict
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let host = '';
  try { host = new URL(tab.url).hostname; } catch { /* chrome:// etc */ }

  if (tab && tab.url && tab.url.startsWith('http')) {
    const stored = await chrome.storage.session.get([`scan_${tab.id}`]);
    const result = stored[`scan_${tab.id}`] || SafeNetRisk.assessLink(tab.url);
    showVerdict(result, host);
  } else {
    showVerdict({ verdict: 'unknown', score: 0, signals: [] }, host || 'This page can’t be checked');
  }

  // Daily stats
  const { shieldStats = {} } = await chrome.storage.local.get(['shieldStats']);
  const today = new Date().toISOString().slice(0, 10);
  countUp(document.getElementById('stat-checked'), shieldStats.day === today ? (shieldStats.checked || 0) : 0);
  countUp(document.getElementById('stat-blocked'), shieldStats.day === today ? (shieldStats.blocked || 0) : 0);

  // Auto-protect toggle
  const { autoScan = true } = await chrome.storage.sync.get(['autoScan']);
  const toggle = document.getElementById('autoscan');
  toggle.checked = autoScan;
  toggle.addEventListener('change', () => chrome.storage.sync.set({ autoScan: toggle.checked }));

  // Manual paste-to-check (runs the local heuristic, no network)
  const pasteResult = document.getElementById('paste-result');
  document.getElementById('check-btn').addEventListener('click', () => {
    const input = document.getElementById('paste').value.trim();
    if (!input) { pasteResult.innerHTML = ''; return; }
    const res = SafeNetRisk.assessLink(input);
    const [, edge] = ORB_COLORS[res.verdict];
    const top = res.signals.find((s) => s.points > 0);
    pasteResult.innerHTML = `
      <div style="margin-top:8px;padding:10px;border-radius:8px;background:var(--surface);border-left:3px solid ${edge};">
        <div style="font-weight:700;font-size:13px;color:${edge};">${VERDICT_LABEL[res.verdict]} · ${res.score}/100</div>
        <div style="font-size:12px;color:var(--text-2);margin-top:3px;"></div>
      </div>`;
    pasteResult.querySelector('div div:last-child').textContent = top ? top.label : 'No strong risk signals found.';
  });

  const openScanner = () => {
    const q = document.getElementById('paste').value.trim();
    chrome.tabs.create({ url: `${SITE}/scan${q ? `?q=${encodeURIComponent(q)}` : ''}` });
  };
  const scannerLink = document.getElementById('open-scanner');
  scannerLink.addEventListener('click', openScanner);
  scannerLink.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openScanner(); }
  });
}

init();
