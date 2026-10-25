// Universal Serverless Function: list-markdown-files.js
// Works seamlessly across Vercel, Netlify, AWS Lambda, Firebase Functions, and local Node.js
import fs from 'node:fs';
import path from 'node:path';
import { resolveGithubAccessToken } from '../tools/github-token.mjs';
import { githubJsonHeaders, isGithubRateLimited, githubRateLimitUserMessage } from '../tools/github-api.mjs';
import {
  githubListCacheKey,
  getFreshGithubListPayload,
  getStaleGithubListPayload,
  setGithubListCacheEntry,
  GITHUB_LIST_CACHE_TTL_MS,
} from '../tools/github-list-cache.mjs';

function sessionFileKey(folderPath, filename) {
  const fp = folderPath === 'root' || !folderPath ? '' : String(folderPath).replace(/^\/+/, '');
  return fp ? `${fp}/${filename}` : filename;
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Math.min(limit, items.length, 8);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

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
  // Test deliverables under _acl-output/**/tests/ are listed: the Studio shows them under Validate & Release.
  return EXCLUDED_FILENAMES.has(lower);
}

function parseMarkdownMetadata(content, fullPath, statTime = null) {
  let status = 'In Review';
  const match = content.match(/status:\s*([^\r\n]+)/i);
  if (match && match[1]) {
    const raw = match[1].trim().toLowerCase();
    if (raw.includes('approved') || raw.includes('accept')) status = 'Approved';
    else if (raw.includes('reject')) status = 'Rejected';
    else status = 'In Review';
  }

  let projectType = null;
  const typeMatch = content.match(/project_type:\s*([^\r\n]+)/i);
  if (typeMatch && typeMatch[1]) {
    projectType = typeMatch[1].trim().toLowerCase().replaceAll(/['"]/g, '');
  }

  let tier = null;
  const tierMatch = content.match(/tier:\s*([^\r\n]+)/i);
  if (tierMatch && tierMatch[1]) {
    const rawTier = tierMatch[1].trim().toLowerCase();
    if (rawTier.includes('1') || rawTier.includes('spec') || rawTier.includes('self-contained')) {
      tier = '1';
    } else if (rawTier.includes('2') || rawTier.includes('major') || rawTier.includes('enterprise') || rawTier.includes('architecture')) {
      tier = '2';
    }
  }
  // working-tree.md is the delivery tracker; it names other deliverables, so skip the content heuristic for it.
  const isTracker = path.basename(fullPath).toLowerCase() === 'working-tree.md';
  if (!tier && !isTracker && (/epics\.md/i.test(content) || /architecture-spine/i.test(content))) {
    tier = '2';
  }

  const folderPath = path.dirname(fullPath).replaceAll('\\', '/');
  const filename = path.basename(fullPath);

  return {
    id: fullPath.replaceAll(/[^a-zA-Z0-9_-]/g, '_'),
    folderPath: folderPath === '.' ? 'root' : folderPath,
    filename: filename,
    fullPath: fullPath,
    status: status,
    projectType: projectType,
    tier: tier,
    createdAt: statTime || new Date().toISOString(),
    updatedAt: statTime || new Date().toISOString(),
    content: content,
  };
}

function compareStoriesAndFiles(a, b) {
  if (!a || !b) return 0;
  const folderA = a.folderPath || '';
  const folderB = b.folderPath || '';
  if (folderA !== folderB) {
    return folderA.localeCompare(folderB, undefined, { numeric: true, sensitivity: 'base' });
  }
  const nameA = a.filename || '';
  const nameB = b.filename || '';
  const matchA = nameA.match(/story[_-](\d+)[-.](\d+)/i);
  const matchB = nameB.match(/story[_-](\d+)[-.](\d+)/i);
  if (matchA && matchB) {
    const epicA = parseInt(matchA[1], 10);
    const epicB = parseInt(matchB[1], 10);
    if (epicA !== epicB) return epicA - epicB;
    const storyA = parseInt(matchA[2], 10);
    const storyB = parseInt(matchB[2], 10);
    if (storyA !== storyB) return storyA - storyB;
  }
  const specA = nameA.match(/spec[_-](\d+)/i);
  const specB = nameB.match(/spec[_-](\d+)/i);
  if (specA && specB) {
    const numA = parseInt(specA[1], 10);
    const numB = parseInt(specB[1], 10);
    if (numA !== numB) return numA - numB;
  }
  return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
}

async function universalHandler(arg1, arg2) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-GitHub-Token',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Content-Type': 'application/json',
  };

  // Detect runtime: Node stream response (Vercel / Express) vs Lambda event/context (Netlify / AWS)
  const isStream = Boolean(arg2 && typeof arg2.writeHead === 'function');

  function reply(statusCode, payload) {
    const bodyStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    if (isStream) {
      arg2.writeHead(statusCode, corsHeaders);
      arg2.end(bodyStr);
      return;
    }
    return {
      statusCode,
      headers: corsHeaders,
      body: bodyStr,
    };
  }

  const httpMethod = (isStream ? arg1.method : arg1 && arg1.httpMethod) || 'GET';
  if (httpMethod === 'OPTIONS') {
    return reply(200, '');
  }

  try {
    let qParams = {};
    let rawHeaders = {};

    if (isStream) {
      const req = arg1;
      rawHeaders = req.headers || {};
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        qParams = Object.fromEntries(urlObj.searchParams.entries());
      } catch {
        qParams = {};
      }
    } else {
      const event = arg1 || {};
      rawHeaders = event.headers || {};
      qParams = event.queryStringParameters || {};
    }

    const qOwner = qParams.owner;
    const qRepo = qParams.repo;
    const qBranch = qParams.branch;
    const qToken = qParams.token;

    const rawHeaderAuth = rawHeaders['authorization'] || rawHeaders['Authorization'] || '';
    const rawCustomToken = rawHeaders['x-github-token'] || rawHeaders['X-GitHub-Token'] || '';

    const token = resolveGithubAccessToken({
      headers: rawHeaders,
      queryToken: qToken,
    });

    let owner = (qOwner || process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER || '').trim();
    let repo = (qRepo || process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG || '').trim();
    const branch = (
      qBranch ||
      process.env.GITHUB_BRANCH ||
      process.env.VERCEL_GIT_COMMIT_REF ||
      process.env.BRANCH ||
      process.env.HEAD ||
      'main'
    ).trim();

    // Auto-detect owner and repo from Netlify REPOSITORY_URL or package.json
    if (!owner || !repo) {
      const netlifyRepoUrl = process.env.REPOSITORY_URL || '';
      if (netlifyRepoUrl) {
        const match = netlifyRepoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        if (match) {
          if (!owner) owner = match[1];
          if (!repo) repo = match[2].replace(/\.git$/, '');
        }
      }
    }

    let frameworkVersion = '6.11.46';
    if (!owner || !repo) {
      try {
        const pkgPath = path.join(process.cwd(), 'package.json');
        if (fs.existsSync(pkgPath)) {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          if (pkg.version) frameworkVersion = pkg.version;
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
        // Ignore package read error
      }
    }

    // 1. Fetch from GitHub API if owner and repo are known
    if (owner && repo) {
      try {
        const isServerless = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME);
        if (isServerless && !token) {
          return reply(503, {
            success: false,
            files: [],
            source: 'github-config-required',
            error: 'Live GitHub sync is not configured on the server.',
            hint:
              'Add GITHUB_TOKEN (repo or contents:read) to Vercel Project → Settings → Environment Variables, then redeploy.',
            repo: `${owner}/${repo}`,
            branch,
          });
        }

        const cacheKey = githubListCacheKey(owner, repo, branch, token);
        const fresh = getFreshGithubListPayload(cacheKey, GITHUB_LIST_CACHE_TTL_MS);
        if (fresh) {
          return reply(200, { ...fresh, fromCache: true });
        }

        const headers = githubJsonHeaders(token);
        const stalePayload = getStaleGithubListPayload(cacheKey);

        const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
        const treeRes = await fetch(treeUrl, { headers });

        if (!treeRes.ok) {
          const errBody = await treeRes.text().catch(() => '');
          if (isGithubRateLimited(treeRes.status, errBody) && stalePayload) {
            return reply(200, {
              ...stalePayload,
              fromCache: true,
              stale: true,
              warning: githubRateLimitUserMessage().hint,
            });
          }
          let hint = token
            ? 'Check GITHUB_TOKEN has repo or contents:read scope for this repository.'
            : 'Set GITHUB_TOKEN in Vercel environment variables.';
          if (isGithubRateLimited(treeRes.status, errBody)) {
            const rl = githubRateLimitUserMessage();
            hint = rl.hint;
          }
          if (isServerless) {
            const statusCode = isGithubRateLimited(treeRes.status, errBody) ? 429 : treeRes.status === 404 ? 404 : 403;
            return reply(statusCode, {
              success: false,
              files: stalePayload?.files || [],
              source: 'github-error',
              error: isGithubRateLimited(treeRes.status, errBody)
                ? githubRateLimitUserMessage().error
                : `GitHub tree API failed (${treeRes.status})`,
              detail: errBody.slice(0, 280),
              hint,
              repo: `${owner}/${repo}`,
              branch,
            });
          }
        }

        if (treeRes.ok) {
          const treeJson = await treeRes.json();
          const treeItems = treeJson.tree || [];

          const aclMdItems = treeItems.filter((item) => {
            if (item.type !== 'blob') return false;
            if (!item.path.startsWith('_acl-output') && !item.path.startsWith('acl-output')) return false;
            if (!item.path.endsWith('.md')) return false;
            return !isExcludedFile(path.basename(item.path));
          });

          const prevByKey = new Map();
          if (stalePayload?.files) {
            for (const f of stalePayload.files) {
              prevByKey.set(sessionFileKey(f.folderPath, f.filename), f);
            }
          }

          const files = await mapPool(aclMdItems, 3, async (item) => {
            const relPath = item.path.replace(/^(_acl-output|_acl_output|acl-output)\/?/i, '');
            const meta = parseMarkdownMetadata('', relPath);
            const key = sessionFileKey(meta.folderPath, meta.filename);
            const prev = prevByKey.get(key);
            if (prev && item.sha && prev.githubSha === item.sha && prev.content) {
              return { ...prev, githubSha: item.sha };
            }
            const blobRes = await fetch(item.url, { headers });
            if (!blobRes.ok) {
              if (prev?.content) return { ...prev, githubSha: item.sha || prev.githubSha };
              return null;
            }
            const blobJson = await blobRes.json();
            const content = Buffer.from(blobJson.content, 'base64').toString('utf8');
            const parsed = parseMarkdownMetadata(content, relPath);
            parsed.githubSha = item.sha || blobJson.sha;
            return parsed;
          });

          const validFiles = files.filter(Boolean);

          // Deduplicate project-context.md (prefer root over nested)
          const seenMap = new Map();
          for (const f of validFiles) {
            const key = f.filename.toLowerCase();
            if (!seenMap.has(key)) {
              seenMap.set(key, f);
            } else {
              const existing = seenMap.get(key);
              if (key === 'project-context.md') {
                if (f.folderPath === 'root' || !f.folderPath.includes('0-context')) {
                  seenMap.set(key, f);
                }
              } else if (key.startsWith('spec-') || key.startsWith('story-')) {
                const exFp = (existing.folderPath || '').toLowerCase();
                const cFp = (f.folderPath || '').toLowerCase();
                if (cFp.includes('implementation-artifacts')) seenMap.set(key, f);
                else if (!exFp.includes('implementation-artifacts')) seenMap.set(key, f);
              } else if (existing.folderPath === 'root' || (!existing.folderPath.match(/[0-4]-/) && f.folderPath.match(/[0-4]-/))) {
                seenMap.set(key, f);
              }
            }
          }
          const deduplicated = Array.from(seenMap.values());
          deduplicated.sort(compareStoriesAndFiles);

          let activeTier = deduplicated.some(
            (f) =>
              (f.filename || '').toLowerCase().includes('epics.md') || (f.filename || '').toLowerCase().includes('spine') || f.tier === '2',
          )
            ? '2'
            : deduplicated.find((f) => f.tier)?.tier || '1';

          const responsePayload = {
            success: true,
            files: deduplicated,
            activeTier: activeTier,
            frameworkVersion: frameworkVersion,
            version: frameworkVersion,
            source: 'github',
            repo: `${owner}/${repo}`,
            branch: branch,
            cachedAt: new Date().toISOString(),
          };

          setGithubListCacheEntry(cacheKey, responsePayload);
          return reply(200, responsePayload);
        }
      } catch {
        // Fall back to local disk if GitHub call fails
      }
    }

    // 2. Fallback: Scan local disk if running locally or if disk files exist
    const diskList = [];
    const scanDir = path.join(process.cwd(), '_acl-output');
    if (fs.existsSync(scanDir)) {
      function scan(dir, relPrefix) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name.toLowerCase().includes('memlog')) {
              continue;
            }
            scan(full, rel);
          } else if (entry.isFile() && entry.name.endsWith('.md') && !isExcludedFile(entry.name)) {
            const content = fs.readFileSync(full, 'utf8');
            const stat = fs.statSync(full);
            diskList.push(parseMarkdownMetadata(content, rel, stat.mtime.toISOString()));
          }
        }
      }
      scan(scanDir, '');
    }

    const seenDisk = new Map();
    for (const f of diskList) {
      const key = f.filename.toLowerCase();
      if (!seenDisk.has(key)) {
        seenDisk.set(key, f);
      } else {
        const existing = seenDisk.get(key);
        if (key === 'project-context.md') {
          if (f.folderPath === 'root' || !f.folderPath.includes('0-context')) {
            seenDisk.set(key, f);
          }
        } else if (existing.folderPath === 'root' || (!existing.folderPath.match(/[0-4]-/) && f.folderPath.match(/[0-4]-/))) {
          seenDisk.set(key, f);
        }
      }
    }
    const finalDiskList = Array.from(seenDisk.values());
    finalDiskList.sort(compareStoriesAndFiles);

    let diskActiveTier = finalDiskList.some(
      (f) => (f.filename || '').toLowerCase().includes('epics.md') || (f.filename || '').toLowerCase().includes('spine') || f.tier === '2',
    )
      ? '2'
      : finalDiskList.find((f) => f.tier)?.tier || '1';

    if (!fs.existsSync(scanDir) && (!owner || !repo)) {
      return reply(400, {
        success: false,
        files: [],
        error: 'No GitHub repository specified.',
        hint: 'Link the Vercel project to GitHub or set GITHUB_OWNER and GITHUB_REPO in environment variables.',
      });
    }

    const diskPayload = {
      success: true,
      files: finalDiskList,
      activeTier: diskActiveTier,
      frameworkVersion: frameworkVersion,
      version: frameworkVersion,
      source: 'local-disk',
    };

    return reply(200, diskPayload);
  } catch (err) {
    return reply(500, {
      success: false,
      files: [],
      error: err.message,
    });
  }
}

export default universalHandler;
export { universalHandler as handler };
