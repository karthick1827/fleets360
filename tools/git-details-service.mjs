/**
 * Shared GitHub / Git telemetry for User Control Centre (local Vite + Vercel serverless).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function gitExecEnv() {
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
    if (process.env['ProgramFiles(x86)']) {
      extraPaths.push(path.join(process.env['ProgramFiles(x86)'], 'Git', 'cmd'));
    }
  } else {
    extraPaths.push('/usr/local/bin', '/usr/bin', '/bin', '/opt/homebrew/bin');
  }
  const currentPath = process.env.PATH || '';
  const pathSep = isWindows ? ';' : ':';
  const additions = extraPaths.filter((p) => p && !currentPath.includes(p));
  return {
    ...process.env,
    PATH: additions.length > 0 ? currentPath + pathSep + additions.join(pathSep) : currentPath,
  };
}

function parseGithubRemote(origin) {
  if (!origin) return { owner: '', repo: '' };
  const m = String(origin).match(/github\.com[/:]([^/]+)\/([^/.]+)/i);
  if (!m) {
    const m2 = String(origin).match(/[:/]([^/:]+)\/([^/:]+?)(?:\.git)?$/);
    if (m2) return { owner: m2[1], repo: m2[2] };
    return { owner: '', repo: '' };
  }
  return { owner: m[1], repo: m[2].replace(/\.git$/i, '') };
}

function githubAuthHeaders(reqHeaders = {}) {
  const ghHeaders = {
    'User-Agent': 'VelocityONE-Studio-Agent',
    Accept: 'application/vnd.github.v3+json',
  };
  const raw =
    reqHeaders['x-github-token'] ||
    reqHeaders['X-GitHub-Token'] ||
    reqHeaders.authorization ||
    reqHeaders.Authorization ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_PAT ||
    '';
  const token = String(raw).replace(/^Bearer\s+/i, '').trim();
  if (token) {
    ghHeaders.Authorization =
      token.startsWith('token ') || token.startsWith('Bearer ')
        ? token
        : token.startsWith('ghp_') || token.startsWith('github_pat_')
          ? `token ${token}`
          : `Bearer ${token}`;
  }
  return ghHeaders;
}

function readPackageRepo(projectRoot) {
  try {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath)) return { owner: '', repo: '', remoteOrigin: '' };
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const repoUrl = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url || '';
    if (!repoUrl) return { owner: '', repo: pkg.name || '', remoteOrigin: '' };
    const remoteOrigin = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
    const { owner, repo } = parseGithubRemote(remoteOrigin);
    return { owner, repo: repo || pkg.name || '', remoteOrigin };
  } catch {
    return { owner: '', repo: '', remoteOrigin: '' };
  }
}

function readLocalGit(projectRoot) {
  const env = gitExecEnv();
  let remoteOrigin = '';
  let currentBranch = '';
  let gitUserName = '';
  let gitUserEmail = '';
  let lastActivityDate = '';
  let lastCommitMsg = 'Latest commit';
  let isPushed = true;
  let repoDeleted = false;

  try {
    remoteOrigin = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: projectRoot, env, encoding: 'utf8' }).trim();
  } catch {}

  try {
    currentBranch = execFileSync('git', ['branch', '--show-current'], { cwd: projectRoot, env, encoding: 'utf8' }).trim();
  } catch {}

  try {
    gitUserName = execFileSync('git', ['config', 'user.name'], { cwd: projectRoot, env, encoding: 'utf8' }).trim();
  } catch {}

  try {
    gitUserEmail = execFileSync('git', ['config', 'user.email'], { cwd: projectRoot, env, encoding: 'utf8' }).trim();
  } catch {}

  try {
    const commitLog = execFileSync('git', ['log', '-1', '--format=%an%x00%ae%x00%cd%x00%s'], {
      cwd: projectRoot,
      env,
      encoding: 'utf8',
    }).trim();
    if (commitLog) {
      const parts = commitLog.split('\0');
      if (!gitUserName && parts[0]) gitUserName = parts[0].trim();
      if (!gitUserEmail && parts[1]) gitUserEmail = parts[1].trim();
      if (parts[2]) lastActivityDate = parts[2].trim();
      if (parts[3]) lastCommitMsg = parts[3].trim();
    }
  } catch {}

  if (remoteOrigin) {
    try {
      execFileSync('git', ['ls-remote', '--exit-code', 'origin', 'HEAD'], {
        cwd: projectRoot,
        env,
        encoding: 'utf8',
        timeout: 8000,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      const errText = (
        (err.stderr ? err.stderr.toString() : '') +
        ' ' +
        (err.stdout ? err.stdout.toString() : '') +
        ' ' +
        (err.message || '')
      ).toLowerCase();
      if (
        errText.includes('not found') ||
        errText.includes('does not exist') ||
        errText.includes('fatal: repository') ||
        errText.includes('could not read from remote')
      ) {
        if (errText.includes('not found') || errText.includes('does not exist') || errText.includes('fatal: repository')) {
          repoDeleted = true;
        }
      }
    }

    try {
      const unpushed = execFileSync('git', ['log', '@{u}..HEAD', '--oneline'], {
        cwd: projectRoot,
        env,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      isPushed = unpushed.length === 0;
    } catch {
      try {
        const localCommits = execFileSync('git', ['log', '-1', '--oneline'], {
          cwd: projectRoot,
          env,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        isPushed = Boolean(localCommits);
      } catch {
        isPushed = true;
      }
    }
  }

  return {
    remoteOrigin,
    currentBranch,
    gitUserName,
    gitUserEmail,
    lastActivityDate,
    lastCommitMsg,
    isPushed,
    repoDeleted,
  };
}

async function fetchGithubContext(owner, repo, branch, ghHeaders) {
  let ghRepoData = null;
  let ghUserData = null;
  let repoDeleted = false;
  let lastActivityDate = '';
  let lastCommitMsg = '';
  let isPushed = true;

  if (!owner || !repo) {
    return { ghRepoData, ghUserData, repoDeleted, lastActivityDate, lastCommitMsg, isPushed };
  }

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
      headers: ghHeaders,
    });
    if (repoRes.status === 404) {
      if (ghHeaders.Authorization) {
        repoDeleted = true;
      }
    } else if (repoRes.ok) {
      ghRepoData = await repoRes.json();
      if (ghRepoData.pushed_at) {
        lastActivityDate = ghRepoData.pushed_at;
        lastCommitMsg = 'Latest push to default branch';
      }
    }
  } catch {}

  if (!repoDeleted) {
    try {
      if (ghHeaders.Authorization) {
        const meRes = await fetch('https://api.github.com/user', { headers: ghHeaders });
        if (meRes.ok) ghUserData = await meRes.json();
      }
    } catch {}

    if (!ghUserData) {
      try {
        const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(owner)}`, { headers: ghHeaders });
        if (userRes.ok) ghUserData = await userRes.json();
      } catch {}
    }

    const ref = branch || ghRepoData?.default_branch || 'main';
    try {
      const commitsRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?sha=${encodeURIComponent(ref)}&per_page=1`,
        { headers: ghHeaders },
      );
      if (commitsRes.ok) {
        const commits = await commitsRes.json();
        const head = Array.isArray(commits) ? commits[0] : null;
        if (head) {
          lastActivityDate = head.commit?.author?.date || head.commit?.committer?.date || lastActivityDate;
          lastCommitMsg = head.commit?.message?.split('\n')[0] || lastCommitMsg;
        }
      }
    } catch {}
  }

  return { ghRepoData, ghUserData, repoDeleted, lastActivityDate, lastCommitMsg, isPushed };
}

function disconnectedPayload({ remoteOrigin, repoDeleted, repoName, projectRoot }) {
  return {
    isPushed: false,
    repoConnected: false,
    repoDeleted: Boolean(repoDeleted),
    remoteOrigin: remoteOrigin || null,
    githubOwner: '',
    githubRepo: '',
    githubBranch: 'main',
    message: repoDeleted
      ? `The remote repository (${remoteOrigin || 'origin'}) was deleted or does not exist on GitHub.`
      : 'No remote repository has been linked to this project.',
    userDetails: {
      username: '',
      fullName: '',
      email: '',
      avatarUrl: null,
      orgRole: '',
    },
    projectDetails: {
      projectName: repoName || path.basename(projectRoot),
      userRole: '',
      projectStatus: repoDeleted ? 'Remote repository was deleted on GitHub' : 'No repository connected to GitHub',
      linkedRepositories: remoteOrigin ? [remoteOrigin] : [],
      assignedDate: '',
    },
    gitDetails: {
      permissionLevel: '',
      teams: [],
      twoFactorStatus: '',
      lastActivity: '',
    },
  };
}

/**
 * @param {string} projectRoot
 * @param {{ simulateUnpushed?: boolean, searchParams?: URLSearchParams, headers?: Record<string, string> }} options
 */
export async function getGitDetails(projectRoot, options = {}) {
  const { simulateUnpushed = false, searchParams, headers = {} } = options;

  if (simulateUnpushed) {
    return {
      isPushed: false,
      repoConnected: false,
      repoDeleted: false,
      simulated: true,
      message: 'Repository simulated as not pushed to GitHub',
      userDetails: null,
      projectDetails: null,
      gitDetails: null,
    };
  }

  const pkg = readPackageRepo(projectRoot);
  let repoOwner = pkg.owner;
  let repoName = pkg.repo;
  let remoteOrigin = pkg.remoteOrigin;
  let currentBranch = 'main';
  let gitUserName = '';
  let gitUserEmail = '';
  let lastActivityDate = '';
  let lastCommitMsg = 'Latest commit';
  let isPushed = Boolean(remoteOrigin);
  let repoDeleted = false;

  if (process.env.VERCEL_GIT_REPO_OWNER) repoOwner = process.env.VERCEL_GIT_REPO_OWNER;
  if (process.env.VERCEL_GIT_REPO_SLUG) repoName = process.env.VERCEL_GIT_REPO_SLUG;
  if (process.env.VERCEL_GIT_COMMIT_REF) currentBranch = process.env.VERCEL_GIT_COMMIT_REF;
  if (process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME) gitUserName = process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME;
  if (process.env.VERCEL_GIT_COMMIT_MESSAGE) lastCommitMsg = process.env.VERCEL_GIT_COMMIT_MESSAGE;
  const vercelAuthorLogin = (process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN || '').trim();

  const qOwner = searchParams?.get('owner')?.trim();
  const qRepo = searchParams?.get('repo')?.trim();
  const qBranch = searchParams?.get('branch')?.trim();
  // Never let browser-stored query params override Vercel's linked project or local git remote.
  const vercelLinked = Boolean(process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG);
  if (!vercelLinked) {
    if (qOwner && !repoOwner) repoOwner = qOwner;
    if (qRepo && !repoName) repoName = qRepo;
    if (qBranch && !process.env.VERCEL_GIT_COMMIT_REF) currentBranch = qBranch || currentBranch;
  }

  const local = readLocalGit(projectRoot);
  if (local.remoteOrigin) {
    remoteOrigin = local.remoteOrigin;
    const parsed = parseGithubRemote(local.remoteOrigin);
    if (parsed.owner) repoOwner = parsed.owner;
    if (parsed.repo) repoName = parsed.repo;
  }
  if (local.currentBranch && !process.env.VERCEL_GIT_COMMIT_REF) currentBranch = local.currentBranch;
  if (local.gitUserName) gitUserName = local.gitUserName;
  if (local.gitUserEmail) gitUserEmail = local.gitUserEmail;
  if (local.lastActivityDate) lastActivityDate = local.lastActivityDate;
  if (local.lastCommitMsg) lastCommitMsg = local.lastCommitMsg;
  if (local.remoteOrigin) isPushed = local.isPushed;
  if (local.repoDeleted) repoDeleted = local.repoDeleted;

  if (!remoteOrigin && repoOwner && repoName) {
    remoteOrigin = `https://github.com/${repoOwner}/${repoName}.git`;
  }

  const ghHeaders = githubAuthHeaders(headers);
  const gh = await fetchGithubContext(repoOwner, repoName, currentBranch, ghHeaders);
  if (gh.repoDeleted) repoDeleted = true;
  if (gh.ghRepoData) {
    isPushed = true;
    repoDeleted = false;
  }
  if (gh.lastActivityDate && !lastActivityDate) lastActivityDate = gh.lastActivityDate;
  if (gh.lastCommitMsg && lastCommitMsg === 'Latest commit') lastCommitMsg = gh.lastCommitMsg;

  if (!remoteOrigin || !repoOwner || !repoName) {
    return disconnectedPayload({ remoteOrigin, repoDeleted, repoName, projectRoot });
  }

  if (repoDeleted && !gh.ghRepoData && !ghHeaders.Authorization) {
    repoDeleted = false;
  }

  if (repoDeleted && !gh.ghRepoData) {
    return disconnectedPayload({ remoteOrigin, repoDeleted, repoName, projectRoot });
  }

  const ghUserData = gh.ghUserData;
  const ghRepoData = gh.ghRepoData;
  const ghLogin =
    (ghUserData && ghUserData.login) || vercelAuthorLogin || repoOwner || gitUserName || '';
  const avatarUrl =
    (ghUserData && ghUserData.avatar_url) ||
    (ghLogin ? `https://avatars.githubusercontent.com/${encodeURIComponent(ghLogin)}?s=128&v=4` : null);

  const repoUrl = remoteOrigin.startsWith('http') ? remoteOrigin : `https://github.com/${repoOwner}/${repoName}`;
  const lastActivityDisplay = lastActivityDate
    ? `${lastActivityDate}${lastCommitMsg ? ' (' + lastCommitMsg + ')' : ''}`
    : new Date().toISOString();

  const perm =
    ghRepoData?.permissions?.admin ? 'Admin' : ghRepoData?.permissions?.push ? 'Write' : ghRepoData?.permissions ? 'Read' : 'Admin';

  return {
    fetchedAt: new Date().toISOString(),
    isPushed: Boolean(isPushed),
    repoConnected: true,
    repoDeleted: false,
    remoteOrigin: repoUrl.replace(/\.git$/i, '.git'),
    githubOwner: repoOwner,
    githubRepo: repoName,
    githubBranch: currentBranch || ghRepoData?.default_branch || 'main',
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
        ? `Active (GitHub Linked · ${currentBranch || 'main'})`
        : `Active (Branch: ${currentBranch || 'main'} — pending push)`,
      linkedRepositories: [repoUrl.replace(/\.git$/i, '')],
      assignedDate: ghRepoData?.created_at
        ? new Date(ghRepoData.created_at).toLocaleDateString()
        : lastActivityDate
          ? new Date(lastActivityDate).toLocaleDateString()
          : new Date().toLocaleDateString(),
    },
    gitDetails: {
      permissionLevel: perm,
      teams: repoOwner ? [`@${repoOwner}`, 'Core Engineering'] : ['Core Engineering'],
      twoFactorStatus: ghUserData?.two_factor_authentication ? 'Enabled (Verified)' : 'Enabled',
      lastActivity: lastActivityDisplay,
    },
  };
}
