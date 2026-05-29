// On-device scam/phishing heuristic — the brain of the SafeNet Family Shield.
// This is a classic-script port of safenet-sa/src/lib/linkRisk.js so the same
// logic can run in the service worker, the content script, and the popup with no
// bundler. Pure functions, zero network: every check is free and works offline,
// and nothing the user browses ever leaves their device.
//
// Keep this in sync with src/lib/linkRisk.js (the website's /scan tool).
(function (root) {
  'use strict';

  const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly', 'shorturl.at', 'rb.gy'];
  const SUSPICIOUS_TLDS = ['.zip', '.mov', '.xyz', '.top', '.tk', '.gq', '.ml', '.cf', '.ga', '.work', '.click', '.country', '.kim', '.loan', '.review'];
  const SA_BRANDS = ['sassa', 'sars', 'absa', 'fnb', 'capitec', 'nedbank', 'standardbank', 'tymebank', 'discovery', 'vodacom', 'mtn', 'telkom', 'eskom', 'postoffice', 'takealot'];
  const URGENCY = ['urgent', 'verify now', 'account suspended', 'click here', 'claim your', 'you have won', 'congratulations', 'limited time', 'act now', 'final notice', 'reactivate', 'confirm your', 'r350', 'grant approved', 'unclaimed', 'otp', 'pin'];
  const URL_RE = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi;
  const IP_RE = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i;

  function extractUrls(input) {
    input = input || '';
    const matches = input.match(URL_RE) || [];
    return [...new Set(matches.map((m) => m.trim().replace(/[.,)]+$/, '')))];
  }

  function hostnameOf(url) {
    try {
      const u = new URL(url.startsWith('http') ? url : `http://${url}`);
      return u.hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  // Returns { score 0-100, verdict, signals[], hasUrl, urls[] }
  function assessLink(input) {
    const text = (input || '').trim();
    const lower = text.toLowerCase();
    const urls = extractUrls(text);
    const signals = [];
    let score = 0;

    const add = (points, label) => { score += points; signals.push({ points, label }); };

    if (IP_RE.test(text)) add(35, 'Link uses a raw IP address instead of a real domain name');

    for (const url of urls) {
      const host = hostnameOf(url);
      if (!host) continue;
      if (host.includes('xn--')) add(30, 'Domain uses punycode, a common way to fake a trusted brand');
      if (SHORTENERS.some((s) => host === s || host.endsWith(`.${s}`))) add(20, 'Link is hidden behind a URL shortener');
      if (SUSPICIOUS_TLDS.some((tld) => host.endsWith(tld))) add(20, `Uncommon, high-risk domain ending (${SUSPICIOUS_TLDS.find((t) => host.endsWith(t))})`);
      if ((host.match(/-/g) || []).length >= 3) add(12, 'Domain has an unusual number of hyphens');
      if (host.split('.').length >= 5) add(12, 'Excessive subdomains, often used to disguise the real destination');
      for (const brand of SA_BRANDS) {
        if (host.includes(brand)) {
          const isOfficialish = host.endsWith(`${brand}.co.za`) || host.endsWith(`${brand}.com`) || host.endsWith(`${brand}.gov.za`);
          if (!isOfficialish) add(28, `Pretends to be ${brand.toUpperCase()} but the domain is not official`);
        } else if (lower.includes(brand)) {
          add(10, `Message mentions ${brand.toUpperCase()}, verify it is genuinely from them`);
        }
      }
    }

    const urgencyHits = URGENCY.filter((p) => lower.includes(p));
    if (urgencyHits.length) add(Math.min(30, urgencyHits.length * 12), `Pressure / scam wording: "${urgencyHits.slice(0, 2).join('", "')}"`);

    if (urls.length === 0 && text.length > 0 && !urgencyHits.length) {
      signals.push({ points: 0, label: 'No links found, graded on message wording only' });
    }

    score = Math.min(100, score);
    const verdict = score >= 60 ? 'dangerous' : score >= 25 ? 'suspicious' : 'safe';
    return { score, verdict, signals, hasUrl: urls.length > 0, urls };
  }

  root.SafeNetRisk = { assessLink, extractUrls };
})(typeof self !== 'undefined' ? self : this);
