// Universal Serverless Function: api/atlassian.js
// Handles all Atlassian JIRA & Confluence integration endpoints on Vercel, Netlify, and local Node.js
import path from 'node:path';
import * as atlassianMod from '../tools/atlassian-service.mjs';

function readJsonBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req, res) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-GitHub-Token',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    return res.end('');
  }

  const projectRoot = process.cwd();
  const url = new URL(req.url, 'http://localhost');

  // Resolve action from pathname or query param
  let action = url.searchParams.get('action') || '';
  if (!action) {
    const parts = url.pathname.split('/').filter(Boolean);
    // e.g. ['api', 'atlassian', 'config'] -> action = 'config'
    if (parts.length >= 2 && parts[0] === 'api' && parts[1] === 'atlassian') {
      action = parts.slice(2).join('/');
    } else if (parts.length >= 1 && parts[parts.length - 1] !== 'atlassian') {
      action = parts[parts.length - 1];
    }
  }

  function reply(statusCode, payload) {
    if (!res.headersSent) {
      res.writeHead(statusCode, corsHeaders);
    }
    res.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
  }

  try {
    if (action === 'config') {
      if (req.method === 'GET') {
        const cfg = atlassianMod.getAtlassianConfig(projectRoot);
        return reply(200, cfg);
      }
      if (req.method === 'POST') {
        const payload = await readJsonBody(req);
        try {
          const saved = await atlassianMod.saveAtlassianConfig(projectRoot, payload);
          return reply(200, { success: true, config: saved });
        } catch (err) {
          return reply(400, { success: false, error: err.message });
        }
      }
    }

    if (action === 'discover' && req.method === 'GET') {
      const stories = atlassianMod.discoverStoriesAndEpics(projectRoot);
      const deliverables = atlassianMod.discoverDeliverables(projectRoot);
      const history = atlassianMod.getSyncHistory(projectRoot);
      return reply(200, {
        stories: stories.stories || [],
        epics: stories.epics || [],
        deliverables,
        history,
      });
    }

    if (action === 'sync-jira' && req.method === 'POST') {
      const payload = await readJsonBody(req);
      const result = await atlassianMod.syncToJira(projectRoot, payload);
      return reply(result.success ? 200 : 400, result);
    }

    if (action === 'pull-jira' && req.method === 'POST') {
      const payload = await readJsonBody(req);
      const result = await atlassianMod.pullFromJira(projectRoot, payload);
      return reply(result.success ? 200 : 400, result);
    }

    if (action === 'sync-confluence' && req.method === 'POST') {
      const payload = await readJsonBody(req);
      const result = await atlassianMod.syncToConfluence(projectRoot, payload);
      return reply(result.success ? 200 : 400, result);
    }

    if (action === 'pull-confluence' && req.method === 'POST') {
      const payload = await readJsonBody(req);
      const result = await atlassianMod.pullFromConfluence(projectRoot, payload);
      return reply(result.success ? 200 : 400, result);
    }

    if (action === 'sync-history' && req.method === 'GET') {
      const history = atlassianMod.getSyncHistory(projectRoot);
      return reply(200, history);
    }

    return reply(404, { success: false, error: `Atlassian endpoint '/api/atlassian/${action}' not found` });
  } catch (err) {
    return reply(500, { success: false, error: err.message });
  }
}
