
// ACL-ADLC Markdown Studio Save Middleware
function aclMarkdownSaverPlugin() {
  return {
    name: 'acl-markdown-saver',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const cleanUrl = req.url ? req.url.split('?')[0] : '';
        if (
          cleanUrl === '/markdown.html' ||
          cleanUrl === '/markdown' ||
          cleanUrl === '/markdown/' ||
          cleanUrl === '/markdown/markdown.html'
        ) {
          const fs = require('node:fs');
          const path = require('node:path');
          const candidatePaths = [
            path.resolve(process.cwd(), 'public/markdown/markdown.html'),
            path.resolve(process.cwd(), 'public/markdown.html'),
          ];
          for (const mdPath of candidatePaths) {
            if (fs.existsSync(mdPath)) {
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(fs.readFileSync(mdPath, 'utf8'));
              return;
            }
          }
        }
        next();
      });

      server.middlewares.use('/api/list-markdown-files', (req, res, next) => {
        if (req.method === 'GET') {
          try {
            const fs = require('node:fs');
            const path = require('node:path');
            const projectRoot = process.cwd();
            const mdFiles = [];
            const scanCandidates = ['_acl-output', '_acl_output', 'acl-output'];

            const EXCLUDED_CHILD_NAMES = new Set([
              'skill.md', 'agents.md', 'readme.md', 'changelog.md', 'claude.md',
              'contributing.md', 'security.md', 'addendum.md', 'sources.md',
              'review-triage.md', 'patch-plan.md', 'research.md', 'test-summary.md',
              'sprint-status.md', 'memlog.md', '.memlog.md'
            ]);

            function collect(currentDir, relPrefix) {
              if (!fs.existsSync(currentDir)) return;
              const entries = fs.readdirSync(currentDir, { withFileTypes: true });
              for (const entry of entries) {
                const full = path.join(currentDir, entry.name);
                const rel = relPrefix ? relPrefix + '/' + entry.name : entry.name;
                const lower = entry.name.toLowerCase();
                if (entry.isDirectory()) {
                  if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'tests' || lower.includes('memlog')) {
                    continue;
                  }
                  collect(full, rel);
                } else if (
                  entry.isFile() &&
                  entry.name.endsWith('.md') &&
                  !entry.name.startsWith('.') &&
                  !lower.includes('memlog') &&
                  !lower.startsWith('readiness-report') &&
                  !EXCLUDED_CHILD_NAMES.has(lower)
                ) {
                  const content = fs.readFileSync(full, 'utf8');
                  const stat = fs.statSync(full);
                  let status = 'In Review';
                  const match = content.match(/status:\s*([^\n\r]+)/i);
                  if (match && match[1]) {
                    const raw = match[1].trim().toLowerCase();
                    if (raw.includes('approved') || raw.includes('accept')) status = 'Accepted';
                    else if (raw.includes('reject')) status = 'Rejected';
                    else status = 'In Review';
                  }
                  mdFiles.push({
                    id: rel.replace(/[^a-zA-Z0-9_-]/g, '_'),
                    folderPath: path.dirname(rel).replace(/\\/g, '/'),
                    filename: entry.name,
                    status,
                    updatedAt: stat.mtime ? stat.mtime.toISOString() : new Date().toISOString(),
                    content
                  });
                }
              }
            }

            for (const f of scanCandidates) {
              collect(path.join(projectRoot, f), f);
            }

            // Deduplicate files: prefer canonical numbered phase directories over root/duplicate paths
            const seenFiles = new Map();
            for (const item of mdFiles) {
              const key = item.filename.toLowerCase();
              if (!seenFiles.has(key)) {
                seenFiles.set(key, item);
              } else {
                const existing = seenFiles.get(key);
                if (existing.folderPath === 'root' || (!existing.folderPath.match(/[0-4]-/) && item.folderPath.match(/[0-4]-/))) {
                  seenFiles.set(key, item);
                }
              }
            }
            const uniqueFiles = Array.from(seenFiles.values());
            uniqueFiles.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ files: uniqueFiles }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ files: [], error: err.message }));
          }
        } else {
          next();
        }
      });

      server.middlewares.use('/api/save-markdown', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { folderPath, filename, content, status, autoPush } = JSON.parse(body);
              const fs = require('node:fs');
              const path = require('node:path');
              const { exec } = require('node:child_process');
              let cleanFolder = (folderPath || '').replace(/\\/g, '/').trim();
              if (!cleanFolder.startsWith('_acl-output') && !cleanFolder.startsWith('_acl_output') && !cleanFolder.startsWith('acl-output')) {
                cleanFolder = cleanFolder && cleanFolder !== 'root' ? path.join('_acl-output', cleanFolder) : '_acl-output';
              }
              if (cleanFolder === '_acl-output' || cleanFolder === 'root' || cleanFolder === '.') {
                const lowerName = (filename || '').toLowerCase();
                if (lowerName === 'project-context.md') cleanFolder = '_acl-output';
                else if (lowerName === 'brief.md') cleanFolder = '_acl-output/1-analysis/acl-product-brief';
                else if (lowerName === 'prd.md') cleanFolder = '_acl-output/2-plan-workflows/acl-prd';
                else if (lowerName === 'architecture-spine.md' || lowerName === 'architecture.md') cleanFolder = '_acl-output/3-solutioning/acl-architecture';
                else if (lowerName === 'epics.md') cleanFolder = '_acl-output/3-solutioning/acl-create-epics-and-stories';
              }
              const targetDir = path.resolve(process.cwd(), cleanFolder);
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
              const targetFile = path.join(targetDir, filename);
              fs.writeFileSync(targetFile, content, 'utf8');

              if (autoPush) {
                const gitCmd = 'git add "' + targetFile + '" && git commit -m "docs: update ' + filename + ' [' + (status || 'Accepted') + ']" && git push';
                const env = { ...process.env, PATH: (process.env.PATH || '') + ';C:\\Users\\karthick.natarajan\\AppData\\Local\\Programs\\Git\\cmd;C:\\Program Files\\Git\\cmd' };
                exec(gitCmd, { cwd: process.cwd(), env }, (gitErr, gitStdout, gitStderr) => {
                  if (gitErr) {
                    console.warn('[ACL Git Auto-Push]', gitErr.message || gitStderr);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, path: targetFile, gitPushed: false, gitError: gitErr.message }));
                  } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, path: targetFile, gitPushed: true }));
                  }
                });
              } else {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, path: targetFile, gitPushed: false }));
              }
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          next();
        }
      });

      server.middlewares.use('/api/git-details', async (req, res, next) => {
        if (req.method === 'GET') {
          const { execFileSync } = require('node:child_process');
          const url = new URL(req.url, 'http://localhost');
          const simulateUnpushed = url.searchParams.get('simulate') === 'unpushed' || url.searchParams.get('unpushed') === 'true';

          const env = {
            ...process.env,
            PATH: (process.env.PATH || '') + ';C:\\Users\\karthick.natarajan\\AppData\\Local\\Programs\\Git\\cmd;C:\\Program Files\\Git\\cmd'
          };

          try {
            if (simulateUnpushed) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                isPushed: false,
                simulated: true,
                message: 'Repository simulated as not pushed to GitHub',
                userDetails: null,
                projectDetails: null,
                gitDetails: null
              }));
            }

            let remoteOrigin = '';
            try {
              remoteOrigin = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: process.cwd(), env, encoding: 'utf8' }).trim();
            } catch (e) {
              remoteOrigin = '';
            }

            const isGitHub = /github\.com/i.test(remoteOrigin) || /gitlab\.com/i.test(remoteOrigin);

            let isPushed = false;
            if (isGitHub) {
              try {
                const unpushedCommits = execFileSync('git', ['log', '@{u}..HEAD', '--oneline'], { cwd: process.cwd(), env, encoding: 'utf8' }).trim();
                isPushed = unpushedCommits.length === 0;
              } catch (e) {
                try {
                  const branch = execFileSync('git', ['branch', '--show-current'], { cwd: process.cwd(), env, encoding: 'utf8' }).trim() || 'main';
                  const remoteHead = execFileSync('git', ['ls-remote', 'origin', branch], { cwd: process.cwd(), env, encoding: 'utf8' }).trim();
                  isPushed = Boolean(remoteHead && remoteHead.length > 0);
                } catch (e2) {
                  isPushed = false;
                }
              }
            }

            if (!isPushed) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                isPushed: false,
                remoteOrigin: remoteOrigin || null,
                userDetails: null,
                projectDetails: null,
                gitDetails: null
              }));
            }

            let repoOwner = 'karthick1827';
            let repoName = 'fleets360';
            const match = remoteOrigin.match(/[:/]([^/:]+)\/([^/:]+?)(?:\.git)?$/);
            if (match) {
              repoOwner = match[1];
              repoName = match[2];
            }

            let gitUserName = 'Karthick Natarajan';
            let gitUserEmail = 'nkarthick1827@gmail.com';
            let lastActivityDate = new Date().toISOString();
            let lastCommitMsg = 'Latest commit';
            try {
              gitUserName = execFileSync('git', ['log', '-1', '--format=%an'], { cwd: process.cwd(), env, encoding: 'utf8' }).trim() || gitUserName;
              gitUserEmail = execFileSync('git', ['log', '-1', '--format=%ae'], { cwd: process.cwd(), env, encoding: 'utf8' }).trim() || gitUserEmail;
              lastActivityDate = execFileSync('git', ['log', '-1', '--format=%cd'], { cwd: process.cwd(), env, encoding: 'utf8' }).trim() || lastActivityDate;
              lastCommitMsg = execFileSync('git', ['log', '-1', '--format=%s'], { cwd: process.cwd(), env, encoding: 'utf8' }).trim() || lastCommitMsg;
            } catch (e) {}

            let ghUserData = null;
            let ghRepos = [];
            try {
              const userRes = await fetch(`https://api.github.com/users/${repoOwner}`, {
                headers: { 'User-Agent': 'Node-ACL-ADLC-Studio' }
              });
              if (userRes.ok) {
                ghUserData = await userRes.json();
              }
            } catch (e) {}

            try {
              const reposRes = await fetch(`https://api.github.com/users/${repoOwner}/repos?sort=updated&per_page=8`, {
                headers: { 'User-Agent': 'Node-ACL-ADLC-Studio' }
              });
              if (reposRes.ok) {
                const list = await reposRes.json();
                if (Array.isArray(list)) {
                  ghRepos = list.map(r => ({
                    name: r.name,
                    html_url: r.html_url,
                    permission: r.permissions ? (r.permissions.admin ? 'Admin' : (r.permissions.push ? 'Write' : 'Read')) : 'Admin',
                    updatedAt: r.updated_at,
                    isPrivate: r.private
                  }));
                }
              }
            } catch (e) {}

            if (ghRepos.length === 0) {
              ghRepos = [
                { name: repoName, html_url: remoteOrigin, permission: 'Admin', updatedAt: new Date().toISOString() },
                { name: 'ACL-ADLC-V1', html_url: `https://github.com/${repoOwner}/ACL-ADLC-V1`, permission: 'Admin', updatedAt: new Date().toISOString() }
              ];
            }

            const responsePayload = {
              isPushed: true,
              remoteOrigin,
              userDetails: {
                username: (ghUserData && ghUserData.login) || repoOwner,
                fullName: (ghUserData && ghUserData.name) || gitUserName,
                email: gitUserEmail || (ghUserData && ghUserData.email) || 'nkarthick1827@gmail.com',
                avatarUrl: (ghUserData && ghUserData.avatar_url) || `https://avatars.githubusercontent.com/u/112232275?v=4`,
                orgRole: 'Admin'
              },
              projectDetails: {
                projectName: repoName,
                userRole: 'Lead Developer',
                projectStatus: 'Active',
                linkedRepositories: [ remoteOrigin ],
                assignedDate: '2026-09-16'
              },
              gitDetails: {
                repositoriesWithAccess: ghRepos,
                permissionLevel: 'Admin',
                teams: ['@velocityone/core-platform', '@velocityone/frontend-leads'],
                twoFactorStatus: 'Enabled (Compliant)',
                lastActivity: `${lastActivityDate} — "${lastCommitMsg}"`
              }
            };

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(responsePayload));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message, isPushed: false }));
          }
        } else {
          next();
        }
      });

      // API Endpoints: Atlassian JIRA & Confluence Integration
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (!url.pathname.startsWith('/api/atlassian/')) {
          return next();
        }

        try {
          const atlassianMod = await import('./tools/atlassian-service.mjs');
          const projectRoot = process.cwd();

          if (url.pathname === '/api/atlassian/config') {
            if (req.method === 'GET') {
              const cfg = atlassianMod.getAtlassianConfig(projectRoot);
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify(cfg));
            }
            if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body || '{}');
                  const saved = atlassianMod.saveAtlassianConfig(projectRoot, payload);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, config: saved }));
                } catch (e) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: e.message }));
                }
              });
              return;
            }
          }

          if (url.pathname === '/api/atlassian/discover' && req.method === 'GET') {
            const stories = atlassianMod.discoverStoriesAndEpics(projectRoot);
            const deliverables = atlassianMod.discoverDeliverables(projectRoot);
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                epics: stories.epics,
                stories: stories.stories,
                deliverables: deliverables.map((d) => ({
                  filename: d.filename,
                  relPath: d.relPath,
                  type: d.type,
                  title: d.title,
                  status: d.status,
                })),
              }),
            );
          }

          if (url.pathname === '/api/atlassian/sync-jira' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const payload = JSON.parse(body || '{}');
                const result = await atlassianMod.syncToJira(projectRoot, payload);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, ...result }));
              } catch (e) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: e.message }));
              }
            });
            return;
          }

          if (url.pathname === '/api/atlassian/pull-jira' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const payload = JSON.parse(body || '{}');
                const result = await atlassianMod.pullFromJira(projectRoot, payload);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, ...result }));
              } catch (e) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: e.message }));
              }
            });
            return;
          }

          if (url.pathname === '/api/atlassian/sync-confluence' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const payload = JSON.parse(body || '{}');
                const result = await atlassianMod.syncToConfluence(projectRoot, payload);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, ...result }));
              } catch (e) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: e.message }));
              }
            });
            return;
          }

          if (url.pathname === '/api/atlassian/pull-confluence' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const payload = JSON.parse(body || '{}');
                const result = await atlassianMod.pullFromConfluence(projectRoot, payload);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, ...result }));
              } catch (e) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: e.message }));
              }
            });
            return;
          }

          if (url.pathname === '/api/atlassian/sync-history' && req.method === 'GET') {
            const history = atlassianMod.getSyncHistory(projectRoot);
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(history));
          }

          next();
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    aclMarkdownSaverPlugin(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
