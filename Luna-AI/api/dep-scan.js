// Luna AI - Real Dependency CVE Scanner
// Queries OSV.dev (free, no API key needed) for known vulnerabilities.
// Accepts: { dependencies: ["lodash@4.17.15", "axios@1.0.0", ...] }

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { dependencies } = req.body;
  if (!dependencies || !Array.isArray(dependencies) || dependencies.length === 0) {
    return res.status(400).json({ error: 'Invalid dependency list' });
  }

  // Clamp to 30 packages to avoid timeout
  const deps = dependencies.slice(0, 30);

  // Parse "name@version" - also handle "name": "version" style lines pasted raw
  function parseDep(str) {
    str = str.trim().replace(/^["']|["']$/g, '').replace(/,$/, '').trim();
    const atIdx = str.lastIndexOf('@');
    if (atIdx > 0) {
      return { name: str.slice(0, atIdx), version: str.slice(atIdx + 1).replace(/^[\^~>=<]+/, '') };
    }
    const colonIdx = str.indexOf(':');
    if (colonIdx > 0) {
      return { name: str.slice(0, colonIdx).trim(), version: str.slice(colonIdx + 1).trim().replace(/^[\^~>=<"' ]+|["' ]+$/g, '') };
    }
    return { name: str, version: null };
  }

  // Query OSV.dev batch API
  async function queryOSV(queries) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch('https://api.osv.dev/v1/querybatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          queries: queries.map(({ name, version }) => ({
            package: { name, ecosystem: 'npm' },
            ...(version ? { version } : {}),
          })),
        }),
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      clearTimeout(timer);
      return null;
    }
  }

  const parsed = deps.map(parseDep);
  const osvData = await queryOSV(parsed);

  const results = parsed.map((dep, i) => {
    const vulns = osvData?.results?.[i]?.vulns || [];
    if (vulns.length === 0) {
      return { name: dep.version ? `${dep.name}@${dep.version}` : dep.name, isVulnerable: false };
    }

    // Pick the highest severity finding
    const severityRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    let topVuln = vulns[0];
    for (const v of vulns) {
      const sev = v.database_specific?.severity || v.severity?.[0]?.score || '';
      const cur = topVuln.database_specific?.severity || topVuln.severity?.[0]?.score || '';
      if ((severityRank[sev] || 0) > (severityRank[cur] || 0)) topVuln = v;
    }

    const severity = topVuln.database_specific?.severity
      || (topVuln.severity?.[0]?.type === 'CVSS_V3' ? scoreToBand(topVuln.severity[0].score) : 'Medium');

    const cve = topVuln.aliases?.find(a => a.startsWith('CVE-')) || topVuln.id;
    const detail = topVuln.summary || topVuln.details?.slice(0, 100) || 'Vulnerability found';

    return {
      name: dep.version ? `${dep.name}@${dep.version}` : dep.name,
      isVulnerable: true,
      cve,
      severity,
      detail: detail.slice(0, 120),
      totalVulns: vulns.length,
    };
  });

  return res.status(200).json({ findings: results });
};

function scoreToBand(score) {
  const n = parseFloat(score);
  if (n >= 9.0) return 'CRITICAL';
  if (n >= 7.0) return 'HIGH';
  if (n >= 4.0) return 'MEDIUM';
  return 'LOW';
}
