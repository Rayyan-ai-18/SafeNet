// Luna AI Extension - Background Service Worker
// Handles tab scanning, badge updates, and notifications

const LUNA_API = 'https://meet-luna-ai.vercel.app/api/scan';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const AUTO_SCAN_THRESHOLD = 60; // score >= 60 triggers warning

// In-memory scan cache: url → { score, verdict, findings, ts }
const scanCache = new Map();

// Tabs being scanned (to avoid duplicate calls)
const scanning = new Set();

// ── Icon color helper ─────────────────────────────────────────────────────

const ICON_COLORS = {
  safe:       { center: [134, 239, 172], edge: [22, 163, 74]  }, // green
  suspicious: { center: [253, 224, 71],  edge: [202, 138, 4]  }, // yellow
  dangerous:  { center: [252, 165, 165], edge: [220, 38, 38]  }, // red
  scanning:   { center: [167, 139, 250], edge: [109, 40, 217] }, // purple
  unknown:    { center: [148, 163, 184], edge: [71, 85, 105]  }, // gray
};

function makeIconImageData(size, verdict) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cx = size / 2, cy = size / 2, r = size / 2 - 1;

  const { center, edge } = ICON_COLORS[verdict] || ICON_COLORS.unknown;

  // Radial gradient orb
  const grad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.05, cx, cy, r);
  grad.addColorStop(0, `rgb(${center.join(',')})`);
  grad.addColorStop(1, `rgb(${edge.join(',')})`);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle white highlight
  const highlight = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx - r * 0.2, cy - r * 0.2, r * 0.4);
  highlight.addColorStop(0, 'rgba(255,255,255,0.45)');
  highlight.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = highlight;
  ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}

async function setBadge(tabId, verdict) {
  const imageData = {
    16:  makeIconImageData(16,  verdict),
    48:  makeIconImageData(48,  verdict),
    128: makeIconImageData(128, verdict),
  };
  chrome.action.setIcon({ tabId, imageData });
  chrome.action.setBadgeText({ tabId, text: '' }); // clear any text
}

// ── Score → verdict ───────────────────────────────────────────────────────

function scoreToVerdict(score) {
  if (score >= 75) return 'dangerous';
  if (score >= 40) return 'suspicious';
  return 'safe';
}

// ── Scan a URL via Luna API (non-SSE quick scan) ──────────────────────────

async function quickScan(url) {
  // Check cache first
  const cached = scanCache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached;
  }

  // Run phishing scan modules via SSE and collect findings
  return new Promise((resolve) => {
    const findings = [];
    let score = 0;
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 20000);

    const apiUrl = `${LUNA_API}?url=${encodeURIComponent(url)}&type=phishing`;

    fetch(apiUrl, {
      headers: { 'Accept': 'text/event-stream' }
    }).then(res => {
      if (!res.ok) {
        clearTimeout(timeout);
        settled = true;
        resolve(null);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function pump() {
        reader.read().then(({ done, value }) => {
          if (done) {
            clearTimeout(timeout);
            if (!settled) {
              settled = true;
              // Calculate score: each vulnerable finding = 15pts
              const vulnCount = findings.filter(f => f.status === 'vulnerable').length;
              score = Math.min(100, vulnCount * 15);
              const result = {
                url,
                score,
                verdict: scoreToVerdict(score),
                findings,
                ts: Date.now(),
              };
              scanCache.set(url, result);
              resolve(result);
            }
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.slice(5).trim());
                if (data.status && data.status !== 'scanning') {
                  findings.push(data);
                }
              } catch {}
            }
            if (line.startsWith('event: complete')) {
              clearTimeout(timeout);
              if (!settled) {
                settled = true;
                const vulnCount = findings.filter(f => f.status === 'vulnerable').length;
                score = Math.min(100, vulnCount * 15);
                const result = {
                  url,
                  score,
                  verdict: scoreToVerdict(score),
                  findings,
                  ts: Date.now(),
                };
                scanCache.set(url, result);
                resolve(result);
              }
              return;
            }
          }

          pump();
        }).catch(() => {
          clearTimeout(timeout);
          if (!settled) { settled = true; resolve(null); }
        });
      }

      pump();
    }).catch(() => {
      clearTimeout(timeout);
      if (!settled) { settled = true; resolve(null); }
    });
  });
}

// ── Handle tab navigation ─────────────────────────────────────────────────

async function handleNavigation(tabId, url) {
  // Skip non-http pages
  if (!url || !url.startsWith('http')) {
    setBadge(tabId, 'unknown');
    return;
  }

  // Skip Luna itself - restore purple
  if (url.includes('meet-luna-ai.vercel.app')) {
    setBadge(tabId, 'scanning'); // purple
    return;
  }

  // Get user settings
  const { autoScan = true, sensitivity = 60 } =
    await chrome.storage.sync.get(['autoScan', 'sensitivity']);

  if (!autoScan) {
    setBadge(tabId, 'unknown');
    return;
  }

  if (scanning.has(tabId)) return;
  scanning.add(tabId);
  setBadge(tabId, 'scanning');

  try {
    const result = await quickScan(url);
    scanning.delete(tabId);

    if (!result) {
      setBadge(tabId, 'unknown');
      return;
    }

    setBadge(tabId, result.verdict);

    // Store result so popup can read it
    await chrome.storage.session.set({ [`scan_${tabId}`]: result });

    // Notify if score exceeds threshold
    const threshold = sensitivity || AUTO_SCAN_THRESHOLD;
    if (result.score >= threshold) {
      const topFinding = result.findings.find(f => f.status === 'vulnerable');

      // Browser notification
      chrome.notifications.create(`luna_warn_${tabId}`, {
        type:    'basic',
        iconUrl: 'icons/icon-48.png',
        title:   result.verdict === 'dangerous'
                   ? '⚠ Luna: Dangerous Site Detected'
                   : '⚠ Luna: Suspicious Site',
        message: topFinding
                   ? topFinding.detail
                   : `Risk score: ${result.score}/100`,
      });

      // ── Proactive Luna voice interrupt ────────────────────────────────
      // If the Luna website is open in any tab, send it the threat so
      // Luna speaks unprompted without the user having to say anything
      const { notifications = true } = await chrome.storage.sync.get(['notifications']);
      if (notifications) {
        const lunaTabs = await chrome.tabs.query({ url: 'https://meet-luna-ai.vercel.app/*' });
        const vulns = result.findings
          .filter(f => f.status === 'vulnerable')
          .map(f => f.detail)
          .slice(0, 2);
        const domain = (() => { try { return new URL(result.url).hostname; } catch { return result.url; } })();

        for (const lunaTab of lunaTabs) {
          chrome.tabs.sendMessage(lunaTab.id, {
            type:    'LUNA_PROACTIVE_ALERT',
            score:   result.score,
            verdict: result.verdict,
            domain,
            vulns,
          }).catch(() => {}); // ignore if content script not ready
        }
      }
    }
  } catch {
    scanning.delete(tabId);
    setBadge(tabId, 'unknown');
  }
}

// ── Tab event listeners ───────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    handleNavigation(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (tab?.url) {
    // Check if we already have a cached result for this tab
    const stored = await chrome.storage.session.get([`scan_${tabId}`]);
    if (stored[`scan_${tabId}`]) {
      const r = stored[`scan_${tabId}`];
      setBadge(tabId, r.verdict);
    }
  }
});

// ── Message handler (from popup / content) ───────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_SCAN_RESULT') {
    const tabId = msg.tabId;
    chrome.storage.session.get([`scan_${tabId}`]).then(stored => {
      sendResponse({ result: stored[`scan_${tabId}`] || null });
    });
    return true; // async
  }

  if (msg.type === 'RESCAN') {
    const { tabId, url } = msg;
    scanCache.delete(url);
    chrome.storage.session.remove([`scan_${tabId}`]);
    handleNavigation(tabId, url);
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'OPEN_LUNA') {
    chrome.tabs.create({ url: `https://meet-luna-ai.vercel.app?url=${encodeURIComponent(msg.url)}` });
    sendResponse({ ok: true });
    return true;
  }
});
