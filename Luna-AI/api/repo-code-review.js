// Luna AI - Public GitHub repository code review

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { repoUrl } = req.body || {};
  const repo = parseGitHubRepo(repoUrl);
  if (!repo) return res.status(400).json({ error: 'Invalid GitHub repository URL' });

  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(500).json({ error: 'Service preview unavailable' });

  try {
    const repoMeta = await collectRepoFiles(repo);
    if (!repoMeta.files.length) {
      return res.status(400).json({ error: 'No supported code files found in that repo' });
    }

    const review = await reviewRepository(repoMeta, key);
    return res.status(200).json({
      review,
      repo: {
        fullName: repoMeta.fullName,
        defaultBranch: repoMeta.defaultBranch,
        files: repoMeta.files.map(file => file.path),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'GitHub repo code review failed' });
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

async function collectRepoFiles({ owner, repo }) {
  const repoMetaRes = await githubFetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!repoMetaRes.ok) {
    throw new Error(repoMetaRes.status === 404 ? 'GitHub repository not found or not public' : 'Could not read GitHub repository metadata');
  }
  const repoMeta = await repoMetaRes.json();
  const branch = repoMeta.default_branch;
  const treeRes = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  if (!treeRes.ok) throw new Error('Could not read repository tree');
  const tree = await treeRes.json();

  const candidates = (tree.tree || [])
    .filter(node => node.type === 'blob')
    .filter(node => isSupportedFile(node.path))
    .slice(0, 20);

  const files = [];
  for (const file of candidates) {
    const raw = await fetchRepoFile(owner, repo, branch, file.path);
    if (!raw) continue;
    const trimmed = raw.length > 20000 ? raw.slice(0, 20000) : raw;
    files.push({ path: file.path, content: trimmed });
    if (files.length >= 12) break;
  }

  return {
    fullName: repoMeta.full_name,
    defaultBranch: branch,
    files,
  };
}

function isSupportedFile(path) {
  const lower = path.toLowerCase();
  if (lower.includes('node_modules/') || lower.includes('dist/') || lower.includes('build/')) return false;
  return /\.(js|jsx|ts|tsx|py|go|rb|java|php|cs|rs|swift|kt)$/.test(lower);
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

async function reviewRepository(repoMeta, key) {
  const content = repoMeta.files.map(file => {
    return `File: ${file.path}\n\n${file.content}`;
  }).join('\n\n---\n\n');

  const systemPrompt = `You are the Luna AI Code Guardian. Review repository code samples for security vulnerabilities.
Focus on:
1. Secrets/Credentials leakage
2. SQL Injection patterns
3. Cross-Site Scripting (XSS)
4. Insecure Cryptography
5. Broken Access Control

Provide a concise, professional report in Markdown format.
Use emojis for severity (🔴 High, 🟡 Medium, 🟢 Low).
If no issues are found, congratulate the developer.`;

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Review these repository files:\n\n${content}` },
      ],
      temperature: 0.3,
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    throw new Error(err);
  }

  const data = await groqRes.json();
  return data.choices?.[0]?.message?.content ?? '';
}
