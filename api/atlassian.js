// Universal Serverless Function: api/atlassian.js
// Handles all Atlassian JIRA & Confluence integration endpoints on Vercel, Netlify, and local Node.js
import path from 'node:path';
import * as atlassianMod from '../tools/atlassian-service.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-GitHub-Token',
  'Content-Type': 'application/json',
};

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

function reply(res, statusCode, payload) {
  if (!res.headersSent) {
    res.writeHead(statusCode, corsHeaders);
  }
  res.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
}

export async function handleConfig(req, res) {
  if (req.method === 'OPTIONS') return reply(res, 200, '');
  const projectRoot = process.cwd();
  if (req.method === 'GET') {
    const cfg = atlassianMod.getAtlassianConfig(projectRoot);
    return reply(res, 200, cfg);
  }
  if (req.method === 'POST') {
    const payload = await readJsonBody(req);
    try {
      const saved = await atlassianMod.saveAtlassianConfig(projectRoot, payload);
      return reply(res, 200, { success: true, config: saved });
    } catch (err) {
      return reply(res, 400, { success: false, error: err.message });
    }
  }
  return reply(res, 405, { error: 'Method Not Allowed' });
}

export async function handleDiscover(req, res) {
  if (req.method === 'OPTIONS') return reply(res, 200, '');
  const projectRoot = process.cwd();
  if (req.method !== 'GET') return reply(res, 405, { error: 'Method Not Allowed' });
  const stories = atlassianMod.discoverStoriesAndEpics(projectRoot);
  const deliverables = atlassianMod.discoverDeliverables(projectRoot);
  const history = atlassianMod.getSyncHistory(projectRoot);
  return reply(res, 200, {
    stories: stories.stories || [],
    epics: stories.epics || [],
    deliverables,
    history,
  });
}

export async function handleSyncJira(req, res) {
  if (req.method === 'OPTIONS') return reply(res, 200, '');
  const projectRoot = process.cwd();
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method Not Allowed' });
  const payload = await readJsonBody(req);
  const result = await atlassianMod.syncToJira(projectRoot, payload);
  return reply(res, result.success ? 200 : 400, result);
}

export async function handlePullJira(req, res) {
  if (req.method === 'OPTIONS') return reply(res, 200, '');
  const projectRoot = process.cwd();
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method Not Allowed' });
  const payload = await readJsonBody(req);
  const result = await atlassianMod.pullFromJira(projectRoot, payload);
  return reply(res, result.success ? 200 : 400, result);
}

export async function handleSyncConfluence(req, res) {
  if (req.method === 'OPTIONS') return reply(res, 200, '');
  const projectRoot = process.cwd();
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method Not Allowed' });
  const payload = await readJsonBody(req);
  const result = await atlassianMod.syncToConfluence(projectRoot, payload);
  return reply(res, result.success ? 200 : 400, result);
}

export async function handlePullConfluence(req, res) {
  if (req.method === 'OPTIONS') return reply(res, 200, '');
  const projectRoot = process.cwd();
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method Not Allowed' });
  const payload = await readJsonBody(req);
  const result = await atlassianMod.pullFromConfluence(projectRoot, payload);
  return reply(res, result.success ? 200 : 400, result);
}

export async function handleSyncHistory(req, res) {
  if (req.method === 'OPTIONS') return reply(res, 200, '');
  const projectRoot = process.cwd();
  if (req.method !== 'GET') return reply(res, 405, { error: 'Method Not Allowed' });
  const history = atlassianMod.getSyncHistory(projectRoot);
  return reply(res, 200, history);
}

// Unified router fallback
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return reply(res, 200, '');
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname.replace(/\.js$/, '');
  const action = url.searchParams.get('action') || pathname.split('/').filter(Boolean).pop();

  if (action === 'config') return handleConfig(req, res);
  if (action === 'discover') return handleDiscover(req, res);
  if (action === 'sync-jira') return handleSyncJira(req, res);
  if (action === 'pull-jira') return handlePullJira(req, res);
  if (action === 'sync-confluence') return handleSyncConfluence(req, res);
  if (action === 'pull-confluence') return handlePullConfluence(req, res);
  if (action === 'sync-history') return handleSyncHistory(req, res);

  return reply(res, 404, { success: false, error: `Atlassian endpoint '${pathname}' not found` });
}
