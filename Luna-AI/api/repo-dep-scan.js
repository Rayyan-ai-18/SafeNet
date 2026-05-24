// Luna AI - Public GitHub repository dependency scanner

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { repoUrl } = req.body || {};
  const repo = parseGitHubRepo(repoUrl);
  if (!repo) return res.status(400).json({ error: 'Invalid GitHub repository URL' });

  try {
    const repoMeta = await collectRepoDependencies(repo);
    if (!repoMeta.dependencies.length) {
      return res.status(400).json({ error: 'No supported dependency manifests found in that public repo' });
    }

    const parsed = repoMeta.dependencies
      .map(parseDep)
      .filter(dep => dep.name && dep.ecosystem)
      .slice(0, 40);
    if (!parsed.length) return res.status(400).json({ error: 'No valid dependencies found in repository manifests' });

    const osvData = await queryOSV(parsed);
    const findings = buildFindings(parsed, osvData);

    return res.status(200).json({
      findings,
      repo: {
        fullName: repoMeta.fullName,
        defaultBranch: repoMeta.defaultBranch,
        manifests: repoMeta.manifests,
        dependencyCount: parsed.length,
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'GitHub repo audit failed' });
  }
};

function parseGitHubRepo(input) {
  try {
    const url = new URL(input);
    if (url.hostname !== 'github.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') };
  } catch {
    return null;
  }
}

function parseDep(dep) {
  const ecosystem = dep?.ecosystem || null;
  const raw = String(dep?.value || '').trim().replace(/^["']|["']$/g, '').replace(/,$/, '').trim();
  if (!raw || raw.startsWith('#')) return { name: null, version: null, ecosystem };

  const atIdx = raw.lastIndexOf('@');
  if (atIdx > 0) {
    return { name: raw.slice(0, atIdx), version: sanitizeVersion(raw.slice(atIdx + 1)), ecosystem };
  }

  const colonIdx = raw.indexOf(':');
  if (colonIdx > 0) {
    return { name: raw.slice(0, colonIdx).trim(), version: sanitizeVersion(raw.slice(colonIdx + 1)), ecosystem };
  }

  if (/[<>=]/.test(raw) && /\s/.test(raw)) {
    const parts = raw.split(/\s+/);
    return { name: parts[0], version: sanitizeVersion(parts.slice(1).join(' ')), ecosystem };
  }

  const comparatorMatch = raw.match(/^([A-Za-z0-9._-]+)(==|>=|<=|>|<|~=|!=)(.+)$/);
  if (comparatorMatch) {
    return {
      name: comparatorMatch[1],
      version: sanitizeVersion(comparatorMatch[3]),
      ecosystem,
    };
  }

  return { name: raw, version: null, ecosystem };
}

function sanitizeVersion(value) {
  return String(value || '').trim().replace(/^[\^~<>=!"' ]+|["' ,]+$/g, '') || null;
}

function scoreToBand(score) {
  const n = parseFloat(score);
  if (n >= 9.0) return 'CRITICAL';
  if (n >= 7.0) return 'HIGH';
  if (n >= 4.0) return 'MEDIUM';
  return 'LOW';
}

function buildFindings(parsed, osvData) {
  return parsed.map((dep, i) => {
    const vulns = osvData?.results?.[i]?.vulns || [];
    if (vulns.length === 0) {
      return { name: dep.version ? `${dep.name}@${dep.version}` : dep.name, isVulnerable: false, severity: 'SAFE' };
    }

    const severityRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    let topVuln = vulns[0];
    for (const vuln of vulns) {
      const sev = vuln.database_specific?.severity || vuln.severity?.[0]?.score || '';
      const cur = topVuln.database_specific?.severity || topVuln.severity?.[0]?.score || '';
      if ((severityRank[sev] || 0) > (severityRank[cur] || 0)) topVuln = vuln;
    }

    const severity = topVuln.database_specific?.severity
      || (topVuln.severity?.[0]?.type === 'CVSS_V3' ? scoreToBand(topVuln.severity[0].score) : 'MEDIUM');
    const cve = topVuln.aliases?.find(alias => alias.startsWith('CVE-')) || topVuln.id;
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
}

async function queryOSV(queries) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch('https://api.osv.dev/v1/querybatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        queries: queries.map(({ name, version, ecosystem }) => ({
          package: { name, ecosystem },
          ...(version ? { version } : {}),
        })),
      }),
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('OSV lookup failed');
    return await res.json();
  } catch (error) {
    clearTimeout(timer);
    throw new Error(error.message || 'OSV lookup failed');
  }
}

async function collectRepoDependencies({ owner, repo }) {
  const repoMetaRes = await githubFetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!repoMetaRes.ok) {
    throw new Error(repoMetaRes.status === 404 ? 'GitHub repository not found or not public' : 'Could not read GitHub repository metadata');
  }
  const repoMeta = await repoMetaRes.json();
  const branch = repoMeta.default_branch;
  const manifests = [];
  const dependencies = [];

  const packageJson = await fetchRepoFile(owner, repo, branch, 'package.json');
  if (packageJson) {
    manifests.push('package.json');
    extractPackageJsonDeps(packageJson).forEach(dep => dependencies.push(dep));
  }

  const packageLock = await fetchRepoFile(owner, repo, branch, 'package-lock.json');
  if (packageLock) {
    manifests.push('package-lock.json');
    extractPackageLockDeps(packageLock).forEach(dep => dependencies.push(dep));
  }

  const requirementsTxt = await fetchRepoFile(owner, repo, branch, 'requirements.txt');
  if (requirementsTxt) {
    manifests.push('requirements.txt');
    extractRequirementsDeps(requirementsTxt).forEach(dep => dependencies.push(dep));
  }

  return {
    fullName: repoMeta.full_name,
    defaultBranch: branch,
    manifests,
    dependencies: dedupeDeps(dependencies),
  };
}

async function githubFetch(url) {
  return fetch(url, {
    headers: {
      'User-Agent': 'Luna-AI-Repo-Scanner',
      'Accept': 'application/vnd.github+json',
    }
  });
}

async function fetchRepoFile(owner, repo, branch, path) {
  const res = await githubFetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`);
  if (!res.ok) return null;
  return res.text();
}

function extractPackageJsonDeps(text) {
  try {
    const data = JSON.parse(text);
    const sections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
    return sections.flatMap(section =>
      Object.entries(data[section] || {}).map(([name, version]) => ({
        ecosystem: 'npm',
        value: `${name}@${sanitizeVersion(version) || ''}`.replace(/@$/, ''),
      }))
    );
  } catch {
    return [];
  }
}

function extractPackageLockDeps(text) {
  try {
    const data = JSON.parse(text);
    return Object.entries(data.packages || {})
      .filter(([name, info]) => name.startsWith('node_modules/') && info?.version)
      .slice(0, 80)
      .map(([name, info]) => ({
        ecosystem: 'npm',
        value: `${name.replace(/^node_modules\//, '')}@${info.version}`,
      }));
  } catch {
    return [];
  }
}

function extractRequirementsDeps(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && !line.startsWith('-r') && !line.startsWith('--'))
    .map(line => line.split(';')[0].trim())
    .map(line => line.replace(/==/g, '@'))
    .map(line => line.replace(/\s+/g, ''))
    .slice(0, 80)
    .map(value => ({ ecosystem: 'PyPI', value }));
}

function dedupeDeps(deps) {
  const seen = new Set();
  return deps.filter(dep => {
    const key = `${dep.ecosystem || ''}:${String(dep.value || '').toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
