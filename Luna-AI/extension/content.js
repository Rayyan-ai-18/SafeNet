// Luna AI Extension — Content Script
// Runs on every page. Injects a minimal warning banner for high-risk sites.

(function () {
  'use strict';

  let bannerInjected = false;

  function injectBanner(verdict, score, topFinding) {
    if (bannerInjected) return;
    bannerInjected = true;

    const banner = document.createElement('div');
    banner.id = 'luna-sentinel-banner';

    const isDangerous = verdict === 'dangerous';

    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 2147483647;
        background: ${isDangerous ? '#ef4444' : '#f59e0b'};
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px;
        padding: 10px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.3);
      ">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">${isDangerous ? '🚨' : '⚠️'}</span>
          <div>
            <strong>Luna AI: ${isDangerous ? 'Dangerous Site' : 'Suspicious Site'}</strong>
            <span style="margin-left:8px;opacity:0.85;font-size:12px;">
              Risk score: ${score}/100${topFinding ? ' · ' + topFinding : ''}
            </span>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;">
          <button id="luna-banner-scan" style="
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.4);
            color: #fff;
            padding: 4px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
          ">Full Scan</button>
          <button id="luna-banner-close" style="
            background: transparent;
            border: none;
            color: #fff;
            font-size: 18px;
            cursor: pointer;
            line-height: 1;
            padding: 0 4px;
          ">×</button>
        </div>
      </div>
    `;

    document.body.prepend(banner);

    document.getElementById('luna-banner-close').addEventListener('click', () => {
      banner.remove();
    });

    document.getElementById('luna-banner-scan').addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'OPEN_LUNA',
        url: window.location.href,
      });
    });
  }

  // Listen for scan results from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SHOW_WARNING' && (msg.verdict === 'dangerous' || msg.verdict === 'suspicious')) {
      injectBanner(msg.verdict, msg.score, msg.topFinding);
    }
  });

  // On load, ask background for current tab's result
  chrome.runtime.sendMessage({ type: 'GET_SCAN_RESULT', tabId: -1 }, (response) => {
    if (chrome.runtime.lastError) return;
    const result = response?.result;
    if (result && result.score >= 60) {
      const top = result.findings?.find(f => f.status === 'vulnerable');
      injectBanner(result.verdict, result.score, top?.detail || null);
    }
  });
})();
