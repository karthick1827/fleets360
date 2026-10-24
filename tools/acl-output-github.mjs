/**
 * Load _acl-output markdown blobs from GitHub (used when Vercel has no local tree).
 */
import fs from 'node:fs';
import path from 'node:path';

const EXCLUDED_FILENAMES = new Set([
  'skill.md',
  'agents.md',
  'readme.md',
  'changelog.md',
  'claude.md',
  'contributing.md',
  'security.md',
  'addendum.md',
  'sources.md',
  'review-triage.md',
  'patch-plan.md',
  'research.md',
  'sprint-status.md',
  'sprint-status.yaml',
  'sprint-status.yml',
  'memlog.md',
  '.memlog.md',
]);

function isExcludedFile(filename) {
  if (!filename) return true;
  const lower = filename.toLowerCase();
  if (lower.startsWith('.')) return true;
  if (lower.includes('memlog')) return true;
  if (lower.startsWith('readiness-report')) return true;
  return EXCLUDED_FILENAMES.has(lower);
}

function parseStatus(content) {
  const match = content.match(/status:\s*([^\r\n]+)/i);
  if (!match || !match[1]) return 'In Review';
  const raw = match[1].trim().toLowerCase();
  if (raw.includes('approved') || raw.includes('accept')) return 'Approved';
  if (raw.includes('reject')) return 'Rejected';
  return 'In Review';
}

/**
 * @returns {Promise<Array<{ filename: string, folderPath: string, content: string, status: string }>>}
 */
export async function loadAclOutputMarkdownFromGitHub({ owner, repo, branch = 'main', token = '' }) {
  const o = String(owner || '').trim();
  const r = String(repo || '').trim();
  const b = String(branch || 'main').trim();
  if (!o || !r) return [];

  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'fleets360-atlassian-sync',
  };
  const tok = String(token || '').trim();
  if (tok) {
    headers.Authorization =
      tok.startsWith('Bearer ') || tok.startsWith('token ') ? tok : tok.startsWith('ghp_') ? `token ${tok}` : `Bearer ${tok}`;
  }

  const treeUrl = `https://api.github.com/repos/${encodeURIComponent(o)}/${encodeURIComponent(r)}/git/trees/${encodeURIComponent(b)}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers });
  if (!treeRes.ok) return [];

  const treeJson = await treeRes.json();
  const treeItems = treeJson.tree || [];
  const aclMdItems = treeItems.filter((item) => {
    if (item.type !== 'blob') return false;
    if (!item.path.startsWith('_acl-output') && !item.path.startsWith('acl-output')) return false;
    if (!item.path.endsWith('.md')) return false;
    return !isExcludedFile(item.path.split('/').pop());
  });

  const out = [];
  for (const item of aclMdItems) {
    try {
      const blobRes = await fetch(item.url, { headers });
      if (!blobRes.ok) continue;
      const blobJson = await blobRes.json();
      const content = Buffer.from(blobJson.content, 'base64').toString('utf8');
      const relPath = item.path.replace(/^(_acl-output|_acl_output|acl-output)\/?/i, '');
      const parts = relPath.split('/');
      const filename = parts.pop() || 'document.md';
      const folderPath = parts.length ? parts.join('/') : 'root';
      out.push({
        filename,
        folderPath,
        content,
        status: parseStatus(content),
      });
    } catch {
      // skip blob
    }
  }
  return out;
}

export function githubContextFromRequest(req, payload = {}) {
  const headers = req?.headers || {};
  const rawHeaderAuth = headers.authorization || headers.Authorization || '';
  const rawCustomToken = headers['x-github-token'] || headers['X-GitHub-Token'] || '';
  const token = (
    payload.githubToken ||
    rawCustomToken ||
    rawHeaderAuth.replace(/^Bearer\s+/i, '').replace(/^token\s+/i, '') ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_PAT ||
    ''
  ).trim();

  let owner = (payload.githubOwner || process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER || '').trim();
  let repo = (payload.githubRepo || process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG || '').trim();
  const branch = (
    payload.githubBranch ||
    process.env.GITHUB_BRANCH ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    'main'
  ).trim();

  if (!owner || !repo) {
    try {
      const pkgPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const repoUrl = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
        if (repoUrl) {
          const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
          if (match) {
            if (!owner) owner = match[1];
            if (!repo) repo = match[2].replace(/\.git$/, '');
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return { owner, repo, branch, token };
}
