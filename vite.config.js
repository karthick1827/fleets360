
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
