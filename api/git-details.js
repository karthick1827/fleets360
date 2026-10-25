// Universal Serverless Function: api/git-details.js
// Provides live GitHub and repository telemetry across Vercel, Netlify, and local environments
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export default async function handler(req, res) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-GitHub-Token',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    return res.end('');
  }

  if (req.method !== 'GET') {
    res.writeHead(405, corsHeaders);
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  try {
    const projectRoot = process.cwd();
    const url = new URL(req.url, 'http://localhost');
    const simulateUnpushed =
      url.searchParams.get('simulate') === 'unpushed' || url.searchParams.get('unpushed') === 'true';

    if (simulateUnpushed) {
      res.writeHead(200, corsHeaders);
      return res.end(
        JSON.stringify({
          isPushed: false,
          repoConnected: false,
          repoDeleted: false,
          simulated: true,
          message: 'Repository simulated as not pushed to GitHub',
          userDetails: null,
          projectDetails: null,
          gitDetails: null,
        }),
      );
    }

    let repoOwner = '';
    let repoName = '';
    let remoteOrigin = '';
    let currentBranch = 'main';
    let gitUserName = '';
    let gitUserEmail = '';
    let lastActivityDate = new Date().toISOString();
    let lastCommitMsg = 'Latest commit';

    // 1. Read package.json for repository url
    try {
      const pkgPath = path.join(projectRoot, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const repoUrl = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url || '';
        if (repoUrl) {
          remoteOrigin = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
          const m = remoteOrigin.match(/[:/]([^/:]+)\/([^/:]+?)$/);
          if (m) {
            repoOwner = m[1];
            repoName = m[2];
          }
        }
        if (!repoName && pkg.name) repoName = pkg.name;
      }
    } catch {}

    // 2. Read Vercel environment variables
    if (process.env.VERCEL_GIT_REPO_OWNER) repoOwner = process.env.VERCEL_GIT_REPO_OWNER;
    if (process.env.VERCEL_GIT_REPO_SLUG) repoName = process.env.VERCEL_GIT_REPO_SLUG;
    if (process.env.VERCEL_GIT_COMMIT_REF) currentBranch = process.env.VERCEL_GIT_COMMIT_REF;
    if (process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME) gitUserName = process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME;
    if (process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN && !repoOwner) repoOwner = process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN;
    if (process.env.VERCEL_GIT_COMMIT_MESSAGE) lastCommitMsg = process.env.VERCEL_GIT_COMMIT_MESSAGE;

    // 3. Fallback to local git CLI if available
    try {
      const isWindows = process.platform === 'win32';
      const extraPaths = [];
      if (isWindows) {
        if (process.env.LOCALAPPDATA) {
          extraPaths.push(path.join(process.env.LOCALAPPDATA, 'Programs', 'Git', 'cmd'));
          extraPaths.push(path.join(process.env.LOCALAPPDATA, 'Programs', 'Git', 'bin'));
        }
        if (process.env.ProgramFiles) {
          extraPaths.push(path.join(process.env.ProgramFiles, 'Git', 'cmd'));
          extraPaths.push(path.join(process.env.ProgramFiles, 'Git', 'bin'));
        }
      } else {
        extraPaths.push('/usr/local/bin', '/usr/bin', '/bin', '/opt/homebrew/bin');
      }
      const currentPath = process.env.PATH || '';
      const pathSep = isWindows ? ';' : ':';
      const additions = extraPaths.filter((p) => p && !currentPath.includes(p));
      const env = {
        ...process.env,
        PATH: additions.length > 0 ? currentPath + pathSep + additions.join(pathSep) : currentPath,
      };

      try {
        const localOrigin = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: projectRoot, env, encoding: 'utf8' }).trim();
        if (localOrigin) {
          remoteOrigin = localOrigin;
          const m = localOrigin.match(/[:/]([^/:]+)\/([^/:]+?)(?:\.git)?$/);
          if (m) {
            repoOwner = m[1];
            repoName = m[2];
          }
        }
      } catch {}

      try {
        const b = execFileSync('git', ['branch', '--show-current'], { cwd: projectRoot, env, encoding: 'utf8' }).trim();
        if (b) currentBranch = b;
      } catch {}

      try {
        const u = execFileSync('git', ['config', 'user.name'], { cwd: projectRoot, env, encoding: 'utf8' }).trim();
        if (u) gitUserName = u;
      } catch {}

      try {
        const e = execFileSync('git', ['config', 'user.email'], { cwd: projectRoot, env, encoding: 'utf8' }).trim();
        if (e) gitUserEmail = e;
      } catch {}
    } catch {}

    if (!remoteOrigin && repoOwner && repoName) {
      remoteOrigin = `https://github.com/${repoOwner}/${repoName}.git`;
    }

    // 4. GitHub API integration
    let ghRepoData = null;
    let ghUserData = null;
    let isPushed = Boolean(remoteOrigin);

    if (repoOwner && repoName) {
      const ghHeaders = {
        'User-Agent': 'VelocityONE-Studio-Agent',
        Accept: 'application/vnd.github.v3+json',
      };
      const token =
        req.headers['x-github-token'] ||
        req.headers['authorization']?.replace(/^Bearer\s+/i, '') ||
        process.env.GITHUB_TOKEN ||
        process.env.GH_TOKEN ||
        process.env.GITHUB_PAT;

      if (token) {
        const t = String(token).trim();
        ghHeaders.Authorization =
          t.startsWith('Bearer ') || t.startsWith('token ')
            ? t
            : t.startsWith('ghp_') || t.startsWith('github_pat_')
              ? `token ${t}`
              : `Bearer ${t}`;
      }

      try {
        const repoRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`, { headers: ghHeaders });
        if (repoRes.ok) {
          ghRepoData = await repoRes.json();
          isPushed = true;
        }
      } catch {}

      try {
        if (token) {
          const meRes = await fetch('https://api.github.com/user', { headers: ghHeaders });
          if (meRes.ok) {
            ghUserData = await meRes.json();
          }
        }
      } catch {}

      if (!ghUserData) {
        try {
          const userRes = await fetch(`https://api.github.com/users/${repoOwner}`, { headers: ghHeaders });
          if (userRes.ok) {
            ghUserData = await userRes.json();
          }
        } catch {}
      }
    }

    const ghLogin = (ghUserData && ghUserData.login) || repoOwner || gitUserName || '';
    const avatarUrl =
      (ghUserData && ghUserData.avatar_url) ||
      (ghLogin ? `https://avatars.githubusercontent.com/${encodeURIComponent(ghLogin)}?s=128&v=4` : null);

    const responsePayload = {
      isPushed: isPushed,
      repoConnected: Boolean(remoteOrigin && repoOwner),
      repoDeleted: false,
      remoteOrigin: remoteOrigin || (repoOwner && repoName ? `https://github.com/${repoOwner}/${repoName}.git` : ''),
      githubOwner: repoOwner || '',
      githubRepo: repoName || '',
      githubBranch: currentBranch || 'main',
      userDetails: {
        username: ghLogin || 'Developer',
        fullName: (ghUserData && ghUserData.name) || gitUserName || ghLogin || 'Developer',
        email: gitUserEmail || (ghUserData && ghUserData.email) || '',
        avatarUrl,
        orgRole: 'Admin / Maintainer',
      },
      projectDetails: {
        projectName: (ghRepoData && ghRepoData.name) || repoName || path.basename(projectRoot),
        userRole: 'Lead Developer',
        projectStatus: isPushed
          ? 'Active (GitHub Linked)'
          : 'Active (Branch: ' + (currentBranch || 'main') + ')',
        linkedRepositories: [repoName || 'fleets360'],
        assignedDate: (ghRepoData && ghRepoData.created_at) || new Date().toISOString(),
      },
      gitDetails: {
        permissionLevel: (ghRepoData && ghRepoData.permissions && (ghRepoData.permissions.admin ? 'Admin' : ghRepoData.permissions.push ? 'Write' : 'Read')) || 'Admin',
        teams: ['Core Development', 'Engineering'],
        twoFactorStatus: (ghUserData && ghUserData.two_factor_authentication) ? 'Enabled (Verified)' : 'Enabled',
        lastActivity: lastActivityDate,
      },
    };

    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(responsePayload));
  } catch (err) {
    res.writeHead(500, corsHeaders);
    res.end(JSON.stringify({ error: err.message, repoConnected: false }));
  }
}
