// Luna AI Extension — Popup Script

const LUNA_URL = 'https://meet-luna-ai.vercel.app';

const mainContent = document.getElementById('main-content');
const statusText  = document.getElementById('status-text');
const lunaOrb     = document.getElementById('luna-orb');

// ── Render states ─────────────────────────────────────────────────────────

function renderScanning(url) {
  lunaOrb.classList.add('scanning');
  statusText.textContent = 'Scanning…';
  mainContent.innerHTML = `
    <div class="verdict-card scanning" style="margin:14px 14px 0;">
      <div class="verdict-top">
        <span class="verdict-icon">🔍</span>
        <span class="verdict-label">Scanning</span>
        <span class="score-pill">—</span>
      </div>
      <div class="verdict-url">${truncateUrl(url)}</div>
    </div>
    <div class="scanning-msg">
      <span>🛡</span>
      Luna is checking this site…
    </div>
    <div class="actions">
      <button class="btn btn-primary" id="btn-open-luna">Open Luna</button>
    </div>
  `;
  document.getElementById('btn-open-luna')?.addEventListener('click', openLuna);
}

function renderUnknown(url) {
  lunaOrb.classList.remove('scanning');
  statusText.textContent = 'Ready';
  mainContent.innerHTML = `
    <div class="verdict-card unknown" style="margin:14px 14px 0;">
      <div class="verdict-top">
        <span class="verdict-icon">🔒</span>
        <span class="verdict-label">Not Scanned</span>
        <span class="score-pill">—</span>
      </div>
      <div class="verdict-url">${truncateUrl(url || 'No active page')}</div>
    </div>
    <div class="actions">
      <button class="btn btn-primary" id="btn-scan-now">Scan This Page</button>
      <button class="btn btn-secondary" id="btn-open-luna">Open Luna</button>
    </div>
  `;
  document.getElementById('btn-scan-now')?.addEventListener('click', rescanPage);
  document.getElementById('btn-open-luna')?.addEventListener('click', openLuna);
}

function renderResult(result) {
  lunaOrb.classList.remove('scanning');
  const { verdict, score, findings, url } = result;

  const icons = { safe: '✅', suspicious: '⚠️', dangerous: '🚨', unknown: '🔒' };
  const labels = { safe: 'Safe', suspicious: 'Suspicious', dangerous: 'Dangerous', unknown: 'Unknown' };

  statusText.textContent = labels[verdict] || 'Checked';

  const topFindings = (findings || [])
    .filter(f => f.status !== 'scanning')
    .slice(0, 4);

  const findingsHtml = topFindings.map(f => `
    <div class="finding-row">
      <span class="finding-dot ${f.status === 'vulnerable' ? 'vulnerable' : 'safe'}"></span>
      <span class="finding-name">${escHtml(f.name || '')}</span>
      <span class="finding-detail">${escHtml(f.detail || '')}</span>
    </div>
  `).join('');

  mainContent.innerHTML = `
    <div class="verdict-card ${verdict}" style="margin:14px 14px 0;">
      <div class="verdict-top">
        <span class="verdict-icon">${icons[verdict] || '🔒'}</span>
        <span class="verdict-label">${labels[verdict] || 'Unknown'}</span>
        <span class="score-pill">Score: ${score}/100</span>
      </div>
      <div class="verdict-url">${truncateUrl(url)}</div>
    </div>
    ${topFindings.length ? `<div class="findings">${findingsHtml}</div>` : ''}
    <div class="actions" style="flex-wrap:wrap;gap:6px;">
      <button class="btn btn-primary" id="btn-full-scan" style="flex:2;">Full Report</button>
      <button class="btn btn-secondary" id="btn-rescan" style="flex:1;">Rescan</button>
    </div>
    <div style="padding:0 14px 12px;">
      <a id="btn-luna-site" href="https://meet-luna-ai.vercel.app" target="_blank" style="
        display:block;text-align:center;font-size:11px;color:#475569;text-decoration:none;
        padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.05);
        transition:color 0.2s;
      " onmouseover="this.style.color='#a78bfa'" onmouseout="this.style.color='#475569'">
        Open Luna AI →
      </a>
    </div>
  `;

  document.getElementById('btn-full-scan')?.addEventListener('click', openLuna);
  document.getElementById('btn-rescan')?.addEventListener('click', rescanPage);
}

// ── Actions ───────────────────────────────────────────────────────────────

let currentTabId  = null;
let currentTabUrl = null;

async function openLuna() {
  const url = currentTabUrl || '';
  chrome.runtime.sendMessage({ type: 'OPEN_LUNA', url });
  window.close();
}

async function rescanPage() {
  if (!currentTabId || !currentTabUrl) return;
  renderScanning(currentTabUrl);
  chrome.runtime.sendMessage({
    type: 'RESCAN',
    tabId: currentTabId,
    url: currentTabUrl,
  });
  // Poll for result
  pollForResult(currentTabId);
}

function pollForResult(tabId, attempts = 0) {
  if (attempts > 30) return; // max 30s
  setTimeout(() => {
    chrome.runtime.sendMessage({ type: 'GET_SCAN_RESULT', tabId }, (res) => {
      if (chrome.runtime.lastError) return;
      if (res?.result && res.result.findings?.some(f => f.status !== 'scanning')) {
        renderResult(res.result);
      } else {
        pollForResult(tabId, attempts + 1);
      }
    });
  }, 1000);
}

// ── Settings ──────────────────────────────────────────────────────────────

async function loadSettings() {
  const { autoScan = true, notifications = true, sensitivity = 60 } =
    await chrome.storage.sync.get(['autoScan', 'notifications', 'sensitivity']);

  document.getElementById('toggle-autoscan').checked  = autoScan;
  document.getElementById('toggle-notifs').checked    = notifications;
  document.getElementById('select-sensitivity').value = String(sensitivity);
}

function bindSettings() {
  document.getElementById('toggle-autoscan').addEventListener('change', e => {
    chrome.storage.sync.set({ autoScan: e.target.checked });
  });
  document.getElementById('toggle-notifs').addEventListener('change', e => {
    chrome.storage.sync.set({ notifications: e.target.checked });
  });
  document.getElementById('select-sensitivity').addEventListener('change', e => {
    chrome.storage.sync.set({ sensitivity: parseInt(e.target.value, 10) });
  });
  document.getElementById('settings-toggle').addEventListener('click', () => {
    document.getElementById('settings-panel').classList.toggle('open');
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────

function truncateUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    const display = u.hostname + (u.pathname !== '/' ? u.pathname : '');
    return display.length > 40 ? display.slice(0, 40) + '…' : display;
  } catch {
    return url.slice(0, 40);
  }
}

function escHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ── Init ──────────────────────────────────────────────────────────────────

async function init() {
  bindSettings();
  await loadSettings();

  // Get current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) { renderUnknown(''); return; }

  currentTabId  = tab.id;
  currentTabUrl = tab.url;

  if (!currentTabUrl || !currentTabUrl.startsWith('http')) {
    renderUnknown(currentTabUrl);
    return;
  }

  // Check if already scanning
  // Ask background for cached result
  chrome.runtime.sendMessage({ type: 'GET_SCAN_RESULT', tabId: tab.id }, (res) => {
    if (chrome.runtime.lastError) {
      renderUnknown(currentTabUrl);
      return;
    }
    const result = res?.result;
    if (!result) {
      // No result yet — trigger scan and poll
      renderScanning(currentTabUrl);
      chrome.runtime.sendMessage({ type: 'RESCAN', tabId: tab.id, url: currentTabUrl });
      pollForResult(tab.id);
    } else {
      renderResult(result);
    }
  });

  // Show autopilot section
  document.getElementById('autopilot-section').style.display = 'block';

  document.getElementById('btn-scan-all-tabs')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-scan-all-tabs');
    const status = document.getElementById('all-tabs-status');
    btn.disabled = true;
    btn.textContent = 'Scanning tabs…';
    status.style.display = 'block';
    status.textContent = 'Getting open tabs…';

    const tabs = await chrome.tabs.query({ currentWindow: true });
    const httpTabs = tabs.filter(t => t.url?.startsWith('http') && !t.url.includes('meet-luna-ai.vercel.app'));

    if (httpTabs.length === 0) {
      status.textContent = 'No scannable tabs found.';
      btn.disabled = false;
      btn.textContent = '⚡ Scan All Open Tabs';
      return;
    }

    // Open Luna Autopilot with all URLs pre-filled
    const urls = httpTabs.map(t => t.url).join('\n');
    const encoded = encodeURIComponent(urls);
    chrome.tabs.create({
      url: `https://meet-luna-ai.vercel.app?autopilot=${encoded}`
    });
    window.close();
  });
}

init();
