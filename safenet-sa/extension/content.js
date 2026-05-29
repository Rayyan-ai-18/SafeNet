// SafeNet SA — Family Shield, content script.
// Runs on every page (after linkRisk.js). Two jobs, both on-device:
//   1) Grade the links inside the page (e.g. a pasted WhatsApp scam) and flag
//      dangerous ones so a parent or child sees the risk before clicking.
//   2) Show a top banner when the page itself is graded dangerous/suspicious.
(function () {
  'use strict';

  let bannerInjected = false;

  function injectBanner(verdict, score, topFinding) {
    if (bannerInjected || !document.body) return;
    bannerInjected = true;
    const isDangerous = verdict === 'dangerous';
    const bg = isDangerous ? '#dc2626' : '#d97706';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const banner = document.createElement('div');
    banner.id = 'safenet-shield-banner';
    banner.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:2147483647;background:${bg};color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 2px 12px rgba(0,0,0,0.3);transform:translateY(${reduceMotion ? '0' : '-100%'});transition:transform 280ms cubic-bezier(0.22,1,0.36,1);`;
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">${isDangerous ? '🛡' : '⚠️'}</span>
        <div>
          <strong>SafeNet SA: ${isDangerous ? 'Dangerous page' : 'Suspicious page'}</strong>
          <span style="margin-left:8px;opacity:0.9;font-size:12px;">Risk ${score}/100${topFinding ? ' · ' + topFinding : ''}</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button id="safenet-banner-check" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.45);color:#fff;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">Check on SafeNet</button>
        <button id="safenet-banner-close" style="background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1;padding:0 4px;">×</button>
      </div>`;
    document.body.prepend(banner);
    // Slide down on the next frame so the transition actually plays.
    if (!reduceMotion) requestAnimationFrame(() => { banner.style.transform = 'translateY(0)'; });

    const dismiss = () => {
      if (reduceMotion) { banner.remove(); return; }
      banner.style.transform = 'translateY(-100%)';
      banner.addEventListener('transitionend', () => banner.remove(), { once: true });
    };
    document.getElementById('safenet-banner-close').addEventListener('click', dismiss);
    document.getElementById('safenet-banner-check').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_SCANNER', q: location.href });
    });
  }

  // Outline the most dangerous links found in the page so the risk is visible
  // before a click. Only flags 'dangerous' to avoid noise.
  function flagPageLinks() {
    if (!window.SafeNetRisk) return;
    const anchors = Array.from(document.querySelectorAll('a[href^="http"]')).slice(0, 400);
    let worst = null;
    for (const a of anchors) {
      if (a.dataset.safenetChecked) continue;
      a.dataset.safenetChecked = '1';
      const res = window.SafeNetRisk.assessLink(a.href);
      if (res.verdict === 'dangerous') {
        a.style.outline = '2px solid #dc2626';
        a.style.outlineOffset = '1px';
        a.title = `⚠ SafeNet flagged this link as dangerous (risk ${res.score}/100)`;
        if (!worst || res.score > worst.score) worst = res;
      }
    }
    if (worst) {
      chrome.runtime.sendMessage({ type: 'REPORT_LINK', score: worst.score, url: worst.urls[0] }).catch(() => {});
    }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SHOW_WARNING' && (msg.verdict === 'dangerous' || msg.verdict === 'suspicious')) {
      injectBanner(msg.verdict, msg.score, msg.topFinding);
    }
  });

  // On load: ask the worker for this tab's verdict, and scan in-page links.
  chrome.runtime.sendMessage({ type: 'GET_SCAN_RESULT', tabId: -1 }, (response) => {
    if (chrome.runtime.lastError) return;
    const r = response && response.result;
    if (r && r.score >= 60) {
      const top = r.signals && r.signals.find((s) => s.points > 0);
      injectBanner(r.verdict, r.score, top ? top.label : null);
    }
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') flagPageLinks();
  else window.addEventListener('DOMContentLoaded', flagPageLinks);
})();
