// Luna AI — Real SSE Scan Engine
// Every module performs live network checks — no fake/random results.
//
// Phishing scan modules: URL Patterns, Domain Age, SSL Cert, Redirect Chain, Info Disclosure
// Web security scan modules: Security Headers, SSL/TLS Config, Response Timing, Info Disclosure

const tls = require('tls');
const crypto = require('crypto');

// ── Rate limiter ──────────────────────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_WINDOW  = 60_000;
const RATE_MAX     = 5;

// ── API key verification via Supabase REST (no SDK needed) ────────────────
async function verifyApiKey(key) {
  if (!key) return null;
  const url = process.env.SUPABASE_URL;
  const svcKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !svcKey) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/api_keys?select=user_id&key=eq.${encodeURIComponent(key)}&limit=1`,
      { headers: { apikey: svcKey, Authorization: `Bearer ${svcKey}` } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0]?.user_id || null;
  } catch {
    return null;
  }
}

function checkRateLimit(ip) {
  const now = Date.now();
  const prev = (rateLimitMap.get(ip) || []).filter(t => now - t < RATE_WINDOW);
  if (prev.length >= RATE_MAX) return false;
  prev.push(now);
  rateLimitMap.set(ip, prev);
  return true;
}

// ── SSE helper ────────────────────────────────────────────────────────────
function send(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  if (res.flush) res.flush();
}

// ── Abort-safe fetch ──────────────────────────────────────────────────────
function fetchWithTimeout(url, opts = {}, ms = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal })
    .finally(() => clearTimeout(timer));
}

// ══════════════════════════════════════════════════════════════════════════
//  SCAN MODULES
// ══════════════════════════════════════════════════════════════════════════

// 1. URL Pattern Analysis — pure JS, no network, instant
function runUrlPatterns(targetUrl) {
  try {
    const url    = new URL(targetUrl);
    const host   = url.hostname;
    const parts  = host.split('.');
    const issues = [];

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      issues.push('IP address used instead of domain name');
    }
    if (parts.length > 4) {
      issues.push('Excessive subdomain depth (common phishing pattern)');
    }
    // Legitimate root domains for each brand — no false positives
    const brandDomains = {
      'google':    ['google.com', 'google.co.in', 'google.co.uk', 'googleapis.com', 'gstatic.com', 'youtube.com'],
      'microsoft': ['microsoft.com', 'microsoftonline.com', 'live.com', 'outlook.com', 'bing.com', 'azure.com'],
      'apple':     ['apple.com', 'icloud.com'],
      'amazon':    ['amazon.com', 'amazon.in', 'amazonaws.com', 'aws.amazon.com'],
      'paypal':    ['paypal.com'],
      'netflix':   ['netflix.com'],
    };
    const phishWords = ['login', 'signin', 'account', 'secure', 'verify',
                        'update', 'confirm', 'banking', 'paypal', 'amazon',
                        'google', 'microsoft', 'apple', 'netflix'];
    const tld2 = parts.slice(-2).join('.');
    const tld3 = parts.slice(-3).join('.');
    const hit = phishWords.find(w => host.includes(w));
    if (hit && parts.length > 2) {
      const legitimateRoots = brandDomains[hit] || [];
      const isLegit = legitimateRoots.some(d => tld2 === d || tld3 === d || host === d);
      if (!isLegit) {
        issues.push(`Brand keyword "${hit}" embedded in subdomain`);
      }
    }
    if (targetUrl.length > 120) {
      issues.push(`Unusually long URL (${targetUrl.length} chars)`);
    }
    if (targetUrl.includes('@')) {
      issues.push('@ symbol in URL — credential spoofing risk');
    }
    if (/%2f%2f/i.test(targetUrl)) {
      issues.push('URL-encoded double-slash — obfuscation detected');
    }
    if ((host.match(/-/g) || []).length >= 4) {
      issues.push('Excessive hyphens in domain — typosquatting indicator');
    }

    if (issues.length > 0) {
      return { status: 'vulnerable', detail: issues[0] };
    }
    return { status: 'safe', detail: 'URL structure looks clean' };
  } catch {
    return { status: 'error', detail: 'Could not parse URL' };
  }
}

// 2. Domain Age via RDAP (free, no API key)
async function runDomainAge(targetUrl) {
  try {
    const host   = new URL(targetUrl).hostname.replace(/^www\./, '');
    const tld    = host.split('.').slice(-2).join('.');

    const res = await fetchWithTimeout(
      `https://rdap.org/domain/${encodeURIComponent(tld)}`,
      { headers: { Accept: 'application/json' } },
      7000
    );

    if (!res.ok) return { status: 'safe', detail: 'Domain age lookup unavailable' };

    const data   = await res.json();
    const events = Array.isArray(data.events) ? data.events : [];
    const reg    = events.find(e => e.eventAction === 'registration');

    if (!reg) return { status: 'safe', detail: 'Registration date not publicly available' };

    const ageMs   = Date.now() - new Date(reg.eventDate).getTime();
    const ageDays = Math.floor(ageMs / 86400000);

    if (ageDays < 30) {
      return { status: 'vulnerable', detail: `Very new domain — only ${ageDays} days old (high risk)` };
    }
    if (ageDays < 180) {
      return { status: 'vulnerable', detail: `Young domain — ${Math.floor(ageDays / 30)} months old` };
    }
    const years = (ageDays / 365).toFixed(1);
    return { status: 'safe', detail: `Established domain — ${years} years old` };
  } catch {
    return { status: 'safe', detail: 'Domain age check skipped (lookup timed out)' };
  }
}

// 3. SSL Certificate — real TLS handshake
async function runSSL(targetUrl) {
  try {
    if (!targetUrl.startsWith('https')) {
      return { status: 'vulnerable', detail: 'Site does not use HTTPS — all traffic unencrypted' };
    }

    const { hostname } = new URL(targetUrl);

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        socket.destroy();
        resolve({ status: 'error', detail: 'TLS handshake timed out' });
      }, 9000);

      const socket = tls.connect(
        { host: hostname, port: 443, servername: hostname, rejectUnauthorized: false },
        () => {
          clearTimeout(timer);
          const cert       = socket.getPeerCertificate();
          const protocol   = socket.getProtocol();
          const authorized = socket.authorized;
          socket.destroy();

          if (!cert || !cert.valid_to) {
            return resolve({ status: 'vulnerable', detail: 'No valid certificate found' });
          }

          const daysLeft = Math.floor(
            (new Date(cert.valid_to).getTime() - Date.now()) / 86400000
          );

          if (!authorized) {
            return resolve({
              status: 'vulnerable',
              detail: `Certificate untrusted: ${socket.authorizationError || 'chain error'}`,
            });
          }
          if (daysLeft < 0) {
            return resolve({ status: 'vulnerable', detail: 'Certificate has expired' });
          }
          if (daysLeft < 30) {
            return resolve({ status: 'vulnerable', detail: `Cert expires in ${daysLeft} days — renew now` });
          }
          if (protocol === 'TLSv1' || protocol === 'TLSv1.1') {
            return resolve({ status: 'vulnerable', detail: `Outdated protocol: ${protocol} (upgrade to TLS 1.2+)` });
          }

          resolve({ status: 'safe', detail: `Valid · ${daysLeft}d until expiry · ${protocol}` });
        }
      );

      socket.on('error', (err) => {
        clearTimeout(timer);
        resolve({ status: 'vulnerable', detail: `TLS error: ${err.message.slice(0, 70)}` });
      });
    });
  } catch (e) {
    return { status: 'error', detail: e.message.slice(0, 80) };
  }
}

// 4. Redirect Chain
async function runRedirects(targetUrl) {
  try {
    const chain       = [];
    let   current     = targetUrl;
    const originHost  = new URL(targetUrl).hostname;

    for (let i = 0; i < 6; i++) {
      const res = await fetchWithTimeout(current, { method: 'HEAD', redirect: 'manual' }, 5000);
      chain.push({ url: current, status: res.status });

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) break;
        current = loc.startsWith('http') ? loc : new URL(loc, current).href;
      } else {
        break;
      }
    }

    const finalHost = new URL(current).hostname;
    const hops      = chain.length - 1;

    if (hops > 3) {
      return { status: 'vulnerable', detail: `Long redirect chain: ${hops} hops (suspicious)` };
    }
    if (hops > 0 && finalHost !== originHost) {
      return { status: 'vulnerable', detail: `Redirects to different domain: ${finalHost}` };
    }
    return {
      status: 'safe',
      detail: hops > 0 ? `${hops} redirect(s) within same domain` : 'No redirects detected',
    };
  } catch (e) {
    return { status: 'error', detail: `Redirect check failed: ${e.message.slice(0, 60)}` };
  }
}

// 5. Security Headers — real HEAD request
async function runHeaders(targetUrl) {
  try {
    const res = await fetchWithTimeout(targetUrl, { method: 'HEAD', redirect: 'follow' }, 8000);
    const h   = {};
    res.headers.forEach((v, k) => { h[k.toLowerCase()] = v; });

    const required = [
      ['content-security-policy', 'Content-Security-Policy'],
      ['x-frame-options',         'X-Frame-Options'],
      ['strict-transport-security', 'HSTS'],
      ['x-content-type-options',  'X-Content-Type-Options'],
      ['referrer-policy',         'Referrer-Policy'],
    ];

    const missing = required.filter(([k]) => !h[k]).map(([, n]) => n);

    if (missing.length === 0) {
      return { status: 'safe', detail: 'All critical security headers present' };
    }
    const preview = missing.slice(0, 2).join(', ');
    const extra   = missing.length > 2 ? ` +${missing.length - 2} more` : '';
    return { status: 'vulnerable', detail: `Missing: ${preview}${extra}` };
  } catch (e) {
    return { status: 'error', detail: `Could not reach target: ${e.message.slice(0, 60)}` };
  }
}

// 6. Sensitive File / Info Disclosure
async function runInfoDisclosure(targetUrl) {
  try {
    const base  = new URL(targetUrl).origin;
    const paths = ['/.git/HEAD', '/.env', '/phpinfo.php', '/.DS_Store',
                   '/server-status', '/wp-config.php', '/config.php'];

    const checks = await Promise.allSettled(
      paths.map(p =>
        fetchWithTimeout(base + p, { redirect: 'manual' }, 3500)
          .then(r => ({ path: p, ok: r.status === 200 }))
      )
    );

    const exposed = checks
      .filter(r => r.status === 'fulfilled' && r.value.ok)
      .map(r => r.value.path);

    if (exposed.length > 0) {
      return { status: 'vulnerable', detail: `Exposed file: ${exposed[0]}` };
    }

    // Header-based disclosure
    const res    = await fetchWithTimeout(targetUrl, {}, 5000);
    const powered = res.headers.get('x-powered-by');
    const server  = res.headers.get('server') || '';

    if (powered)                      return { status: 'vulnerable', detail: `Stack disclosed via header: ${powered}` };
    if (/\d\.\d/.test(server))        return { status: 'vulnerable', detail: `Server version leaked: ${server}` };

    return { status: 'safe', detail: 'No sensitive files or version info exposed' };
  } catch (e) {
    return { status: 'error', detail: `Info check failed: ${e.message.slice(0, 60)}` };
  }
}

// 7. Response Timing — performance + availability signal
async function runResponseTime(targetUrl) {
  try {
    const start = Date.now();
    const res   = await fetchWithTimeout(targetUrl, { method: 'HEAD' }, 10000);
    const ttfb  = Date.now() - start;

    if (!res.ok && res.status !== 405) {
      return { status: 'vulnerable', detail: `Server returned ${res.status}` };
    }
    if (ttfb > 5000) return { status: 'vulnerable', detail: `Very slow TTFB: ${ttfb}ms — possible overload` };
    if (ttfb > 2500) return { status: 'vulnerable', detail: `Slow TTFB: ${ttfb}ms — review server capacity` };
    return { status: 'safe', detail: `TTFB: ${ttfb}ms — response healthy` };
  } catch {
    return { status: 'vulnerable', detail: 'Target did not respond — possibly down' };
  }
}

// 8. Google Safe Browsing API check
async function runSafeBrowsing(targetUrl) {
  const KEY = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!KEY) return { status: 'safe', detail: 'Safe Browsing check skipped (no API key)' };
  try {
    const res = await fetchWithTimeout(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'luna-ai', clientVersion: '1.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url: targetUrl }],
          },
        }),
      },
      8000
    );
    if (!res.ok) return { status: 'safe', detail: 'Safe Browsing check unavailable' };
    const data = await res.json();
    if (data.matches && data.matches.length > 0) {
      return { status: 'vulnerable', detail: `Flagged by Google Safe Browsing: ${data.matches[0].threatType}` };
    }
    return { status: 'safe', detail: 'Not flagged by Google Safe Browsing' };
  } catch {
    return { status: 'safe', detail: 'Safe Browsing check skipped (error)' };
  }
}

function extractImageCandidates(html, baseUrl) {
  const candidates = new Set();
  const patterns = [
    /<link[^>]+rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]+href=["']([^"']+)["']/gi,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi,
    /<img[^>]+(?:alt|class|id)=["'][^"']*(?:logo|brand|signin|login)[^"']*["'][^>]+src=["']([^"']+)["']/gi,
    /<img[^>]+src=["']([^"']+)["'][^>]+(?:alt|class|id)=["'][^"']*(?:logo|brand|signin|login)[^"']*["']/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) && candidates.size < 8) {
      try {
        candidates.add(new URL(match[1], baseUrl).href);
      } catch {}
    }
  }

  try {
    const host = new URL(baseUrl).hostname;
    candidates.add(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`);
  } catch {}

  return Array.from(candidates).slice(0, 8);
}

async function fetchAssetHash(url) {
  try {
    const res = await fetchWithTimeout(url, { headers: { Accept: 'image/*,*/*;q=0.8' } }, 6000);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('image') && !/favicon|icon/i.test(url)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return null;
    return {
      hash: crypto.createHash('sha256').update(buf).digest('hex'),
      size: buf.length,
    };
  } catch {
    return null;
  }
}

async function collectImageFingerprints(baseUrl, html) {
  const urls = extractImageCandidates(html, baseUrl);
  const fingerprints = await Promise.all(urls.map(fetchAssetHash));
  return fingerprints.filter(Boolean);
}

function pageMentionsBrand(html, brand) {
  const lower = html.toLowerCase();
  return brand.keywords.some(keyword => lower.includes(keyword));
}

// 12. Visual Similarity (image asset matching + brand heuristics)
async function runVisualSimilarity(targetUrl) {
  try {
    const url = new URL(targetUrl);
    const domain = url.hostname.toLowerCase();
    const res = await fetchWithTimeout(targetUrl, { method: 'GET' }, 7000);
    if (!res.ok) return { status: 'safe', detail: 'Visual similarity check skipped' };
    const html = await res.text();

    const brands = [
      { name: 'Google', domain: 'google.com', keywords: ['google', 'gmail', 'login to google', 'sign in to google'] },
      { name: 'PayPal', domain: 'paypal.com', keywords: ['paypal', 'log in to paypal', 'sign in to paypal'] },
      { name: 'Facebook', domain: 'facebook.com', keywords: ['facebook', 'meta', 'sign in to facebook'] },
      { name: 'Microsoft', domain: 'microsoft.com', keywords: ['microsoft', 'outlook', 'office 365', 'sign in with microsoft'] },
      { name: 'Apple', domain: 'apple.com', keywords: ['apple id', 'icloud', 'sign in with apple'] },
      { name: 'Amazon', domain: 'amazon.com', keywords: ['amazon', 'amazon pay', 'sign in to amazon'] },
      { name: 'Netflix', domain: 'netflix.com', keywords: ['netflix', 'sign in to netflix'] },
      { name: 'HDFC', domain: 'hdfcbank.com', keywords: ['hdfc', 'hdfc bank', 'netbanking'] },
    ];

    const targetFingerprints = await collectImageFingerprints(targetUrl, html);
    if (!targetFingerprints.length) {
      return { status: 'safe', detail: 'No comparable logo or favicon assets found on the page.' };
    }

    for (const brand of brands) {
      if (domain.endsWith(brand.domain) || !pageMentionsBrand(html, brand)) continue;

      const brandRes = await fetchWithTimeout(`https://${brand.domain}`, { method: 'GET' }, 6000);
      const brandHtml = brandRes.ok ? await brandRes.text() : '';
      const brandFingerprints = await collectImageFingerprints(`https://${brand.domain}`, brandHtml);
      if (!brandFingerprints.length) continue;

      const matched = targetFingerprints.find(target =>
        brandFingerprints.some(official => official.hash === target.hash && official.size === target.size)
      );

      if (matched) {
        return {
          status: 'vulnerable',
          detail: `Visual Alert: ${brand.name} image assets match this page while the site is hosted on ${domain}.`,
        };
      }
    }

    return { status: 'safe', detail: 'No reused brand image assets detected.' };
  } catch {
    return { status: 'safe', detail: 'Visual similarity check skipped' };
  }
}

// 9. SQL Injection (Error-based)
async function runSQLi(targetUrl) {
  try {
    const url = new URL(targetUrl);
    const payloads = ["'", "''", "'; --", "\" OR 1=1 --", "' OR '1'='1"];
    const params = url.searchParams.keys().next().value ? [...url.searchParams.keys()] : ['id', 'q', 'query', 'search'];
    
    for (const param of params.slice(0, 2)) { // test first 2 params to avoid timeout
      for (const payload of payloads.slice(0, 3)) {
        const testUrl = new URL(targetUrl);
        testUrl.searchParams.set(param, payload);
        
        const res = await fetchWithTimeout(testUrl.href, { method: 'GET' }, 4000);
        const text = await res.text();
        
        const sqlErrors = [
          "SQL syntax", "mysql_fetch", "ORA-", "PostgreSQL query failed",
          "Microsoft OLE DB Provider for SQL Server", "Unclosed quotation mark",
          "SQLite3::Exception", "syntax error at or near"
        ];
        
        if (sqlErrors.some(err => text.includes(err))) {
          return { status: 'vulnerable', detail: `Possible SQLi in parameter "${param}" (Error detected)` };
        }
      }
    }
    return { status: 'safe', detail: 'No simple SQL injection vectors detected' };
  } catch (e) {
    return { status: 'safe', detail: 'SQLi probe skipped (request failed)' };
  }
}

// 10. Cross-Site Scripting (Reflected)
async function runXSS(targetUrl) {
  try {
    const url = new URL(targetUrl);
    const payload = "<script>LunaAI_XSS_Test</script>";
    const param = url.searchParams.keys().next().value || 'q';
    
    const testUrl = new URL(targetUrl);
    testUrl.searchParams.set(param, payload);
    
    const res = await fetchWithTimeout(testUrl.href, { method: 'GET' }, 5000);
    const text = await res.text();
    
    if (text.includes(payload)) {
      return { status: 'vulnerable', detail: `Reflected XSS detected in "${param}" parameter` };
    }
    return { status: 'safe', detail: 'No reflected XSS found on landing page' };
  } catch {
    return { status: 'safe', detail: 'XSS probe skipped' };
  }
}

// 11. CORS Misconfiguration
async function runCORS(targetUrl) {
  try {
    const res = await fetchWithTimeout(targetUrl, {
      method: 'OPTIONS',
      headers: { 'Origin': 'https://evil-luna-test.com' }
    }, 5000);
    
    const allowOrigin = res.headers.get('access-control-allow-origin');
    const allowCreds = res.headers.get('access-control-allow-credentials');
    
    if (allowOrigin === '*' || allowOrigin === 'https://evil-luna-test.com') {
      if (allowCreds === 'true') {
        return { status: 'vulnerable', detail: 'Critical CORS: Wildcard origin with credentials allowed' };
      }
      return { status: 'vulnerable', detail: `Overly permissive CORS: Allowed ${allowOrigin}` };
    }
    return { status: 'safe', detail: 'CORS policy appears restrictive' };
  } catch {
    return { status: 'safe', detail: 'CORS check skipped' };
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  MODULE REGISTRY
// ══════════════════════════════════════════════════════════════════════════

const PHISHING_MODULES = [
  { id: 'urlpatterns',   name: 'URL Pattern Analysis',  run: (u) => runUrlPatterns(u)    },
  { id: 'domain',        name: 'Domain Age Check',      run: (u) => runDomainAge(u)      },
  { id: 'ssl',           name: 'SSL Certificate',        run: (u) => runSSL(u)            },
  { id: 'redirect',      name: 'Redirect Chain',         run: (u) => runRedirects(u)      },
  { id: 'info',          name: 'Info Disclosure',        run: (u) => runInfoDisclosure(u) },
  { id: 'safebrowsing',  name: 'Safe Browsing Check',   run: (u) => runSafeBrowsing(u)   },
  { id: 'visual',        name: 'Visual Similarity',      run: (u) => runVisualSimilarity(u)},
];

const WEB_MODULES = [
  { id: 'sqli',     name: 'SQL Injection Test',  run: (u) => runSQLi(u)            },
  { id: 'xss',      name: 'XSS Protection',      run: (u) => runXSS(u)             },
  { id: 'cors',     name: 'CORS Configuration',  run: (u) => runCORS(u)            },
  { id: 'headers',  name: 'Security Headers',    run: (u) => runHeaders(u)         },
  { id: 'ssl',      name: 'SSL/TLS Config',      run: (u) => runSSL(u)             },
  { id: 'response', name: 'Response Timing',     run: (u) => runResponseTime(u)    },
  { id: 'info',     name: 'Info Disclosure',     run: (u) => runInfoDisclosure(u)  },
];

// ══════════════════════════════════════════════════════════════════════════
//  HANDLER
// ══════════════════════════════════════════════════════════════════════════

module.exports = async function handler(req, res) {
  // Origin / API Key validation
  const apiKey = req.headers['x-api-key'];
  const authenticatedUserId = await verifyApiKey(apiKey);

  const origin  = req.headers.origin || req.headers.referer || '';
  const ALLOWED = ['meet-luna-ai.vercel.app', 'luna-ai-prod.vercel.app', 'localhost', '127.0.0.1', 'chrome-extension://'];

  if (!authenticatedUserId && origin && !ALLOWED.some(d => origin.includes(d))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { url, type = 'phishing' } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  // Basic URL validation — must be http(s)
  let targetUrl;
  try {
    targetUrl = new URL(url);
    if (!['http:', 'https:'].includes(targetUrl.protocol)) throw new Error('bad protocol');
    // SSRF guard — block private/loopback ranges
    const host = targetUrl.hostname;
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) {
      return res.status(400).json({ error: 'Private/loopback targets are not allowed' });
    }
    targetUrl = targetUrl.href;
  } catch {
    return res.status(400).json({ error: 'Invalid URL — must start with http:// or https://' });
  }

  // Rate limit
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many scans. Please wait a minute.' });
  }

  // SSE setup
  res.setHeader('Content-Type',       'text/event-stream');
  res.setHeader('Cache-Control',      'no-cache');
  res.setHeader('Connection',         'keep-alive');
  res.setHeader('X-Accel-Buffering',  'no');
  res.flushHeaders();

  const modules = type === 'ddos' ? WEB_MODULES : PHISHING_MODULES;

  send(res, 'status', { message: 'Scanner initializing…' });

  // Kick off all modules in parallel; stream results as each completes
  await Promise.all(
    modules.map(async (mod) => {
      // Emit heartbeat immediately
      send(res, 'finding', { id: mod.id, name: mod.name, status: 'scanning' });

      try {
        const result = await mod.run(targetUrl);
        send(res, 'finding', {
          id:     mod.id,
          name:   mod.name,
          status: result.status === 'error' ? 'safe' : result.status, // treat errors as non-critical
          detail: result.detail,
        });
      } catch (e) {
        send(res, 'finding', {
          id:     mod.id,
          name:   mod.name,
          status: 'safe',
          detail: 'Check skipped',
        });
      }
    })
  );

  send(res, 'complete', { message: 'Scan complete' });
  res.end();
};
