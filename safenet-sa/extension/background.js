// SafeNet SA — Family Shield, background service worker.
// Local-first: every page is graded on-device by the SafeNetRisk heuristic
// (importScripts below). No network call, no data leaves the device — which is
// both a privacy promise to SA families and what keeps the free tier at R0 COGS.
importScripts('linkRisk.js');

const SITE = 'https://safenet-sa.co.za';
const DANGER_THRESHOLD = 60; // matches the 'dangerous' verdict cutoff

// ── Brand-coloured orb badge ────────────────────────────────────────────────
const ICON_COLORS = {
  safe:       { center: [134, 239, 172], edge: [15, 123, 77]  }, // SafeNet green
  suspicious: { center: [253, 224, 71],  edge: [202, 138, 4]  }, // amber
  dangerous:  { center: [252, 165, 165], edge: [220, 38, 38]  }, // red
  unknown:    { center: [148, 163, 184], edge: [71, 85, 105]  }, // gray
};

function makeIconImageData(size, verdict) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cx = size / 2, cy = size / 2, r = size / 2 - 1;
  const { center, edge } = ICON_COLORS[verdict] || ICON_COLORS.unknown;

  const grad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.05, cx, cy, r);
  grad.addColorStop(0, `rgb(${center.join(',')})`);
  grad.addColorStop(1, `rgb(${edge.join(',')})`);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();

  const hl = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx - r * 0.2, cy - r * 0.2, r * 0.4);
  hl.addColorStop(0, 'rgba(255,255,255,0.45)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = hl; ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}

function setBadge(tabId, verdict) {
  try {
    chrome.action.setIcon({
      tabId,
      imageData: { 16: makeIconImageData(16, verdict), 48: makeIconImageData(48, verdict), 128: makeIconImageData(128, verdict) },
    });
  } catch { /* tab may have closed */ }
}

// ── Daily "links checked" counter (powers the popup stat) ────────────────────
async function bumpCounter() {
  const today = new Date().toISOString().slice(0, 10);
  const { shieldStats = {} } = await chrome.storage.local.get(['shieldStats']);
  if (shieldStats.day !== today) { shieldStats.day = today; shieldStats.checked = 0; shieldStats.blocked = 0; }
  shieldStats.checked += 1;
  await chrome.storage.local.set({ shieldStats });
  return shieldStats;
}

async function bumpBlocked() {
  const { shieldStats = { day: new Date().toISOString().slice(0, 10), checked: 0, blocked: 0 } } =
    await chrome.storage.local.get(['shieldStats']);
  shieldStats.blocked = (shieldStats.blocked || 0) + 1;
  await chrome.storage.local.set({ shieldStats });
}

// ── Assess a page URL on-device ──────────────────────────────────────────────
async function handleNavigation(tabId, url) {
  if (!url || !url.startsWith('http')) { setBadge(tabId, 'unknown'); return; }

  const { autoScan = true } = await chrome.storage.sync.get(['autoScan']);
  if (!autoScan) { setBadge(tabId, 'unknown'); return; }

  const result = SafeNetRisk.assessLink(url);
  result.url = url;
  result.ts = Date.now();

  setBadge(tabId, result.verdict);
  await chrome.storage.session.set({ [`scan_${tabId}`]: result });
  await bumpCounter();

  if (result.score >= DANGER_THRESHOLD) {
    await bumpBlocked();
    const { notifications = true } = await chrome.storage.sync.get(['notifications']);
    const top = result.signals.find((s) => s.points > 0);
    let domain = url; try { domain = new URL(url).hostname; } catch { /* keep url */ }
    if (notifications) {
      chrome.notifications.create(`safenet_warn_${tabId}`, {
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: '🛡 SafeNet: Dangerous link detected',
        message: `${domain} · ${top ? top.label : `Risk ${result.score}/100`}`,
        priority: 2,
      });
    }
    // Tell the content script to show the on-page warning banner.
    chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_WARNING', verdict: result.verdict, score: result.score, topFinding: top ? top.label : null,
    }).catch(() => {});
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) handleNavigation(tabId, tab.url);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const stored = await chrome.storage.session.get([`scan_${tabId}`]);
  const r = stored[`scan_${tabId}`];
  if (r) setBadge(tabId, r.verdict);
});

// ── Messages from popup / content script ─────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_SCAN_RESULT') {
    const tabId = msg.tabId != null && msg.tabId >= 0 ? msg.tabId : sender.tab?.id;
    chrome.storage.session.get([`scan_${tabId}`]).then((stored) => {
      sendResponse({ result: stored[`scan_${tabId}`] || null });
    });
    return true;
  }

  if (msg.type === 'RESCAN') {
    chrome.storage.session.remove([`scan_${msg.tabId}`]);
    handleNavigation(msg.tabId, msg.url);
    sendResponse({ ok: true });
    return true;
  }

  // A content script found a risky link inside the page (e.g. in a message).
  if (msg.type === 'REPORT_LINK' && sender.tab?.id != null) {
    if (msg.score >= DANGER_THRESHOLD) bumpBlocked();
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'OPEN_SCANNER') {
    chrome.tabs.create({ url: `${SITE}/scan${msg.q ? `?q=${encodeURIComponent(msg.q)}` : ''}` });
    sendResponse({ ok: true });
    return true;
  }
});
