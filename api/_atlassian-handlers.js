// Shared Atlassian API handlers (not a Vercel route — leading underscore is ignored by /api deploy)
import * as atlassianMod from '../tools/atlassian-service.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-GitHub-Token',
  'Content-Type': 'application/json',
};

function readJsonBody(req) {
  return new Promise((resolve) => {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === 'string') {
        try {
          return resolve(JSON.parse(req.body || '{}'));
        } catch {
          return resolve({});
        }
      }
      if (typeof Buffer !== 'undefined' && Buffer.isBuffer(req.body)) {
        try {
          return resolve(JSON.parse(req.body.toString('utf8') || '{}'));
        } catch {
          return resolve({});
        }
      }
      if (typeof req.body === 'object') {
        return resolve(req.body);
      }
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

function atlassianActionReply(res, result, err) {
  if (err) {
    return reply(res, 400, { success: false, error: err.message || String(err) });
  }
  if (result && result.success === false) {
    return reply(res, 400, result);
  }
  return reply(res, 200, { success: true, ...result });
}

export async function handleSyncJira(req, res) {
  if (req.method === 'OPTIONS') return reply(res, 200, '');
  const projectRoot = process.cwd();
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method Not Allowed' });
  const payload = await readJsonBody(req);
  try {
    const result = await atlassianMod.syncToJira(projectRoot, payload);
    return atlassianActionReply(res, result);
  } catch (err) {
    return atlassianActionReply(res, null, err);
  }
}

export async function handlePullJira(req, res) {
  if (req.method === 'OPTIONS') return reply(res, 200, '');
  const projectRoot = process.cwd();
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method Not Allowed' });
  const payload = await readJsonBody(req);
  try {
    const result = await atlassianMod.pullFromJira(projectRoot, payload);
    return atlassianActionReply(res, result);
  } catch (err) {
    return atlassianActionReply(res, null, err);
  }
}

export async function handleSyncConfluence(req, res) {
  if (req.method === 'OPTIONS') return reply(res, 200, '');
  const projectRoot = process.cwd();
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method Not Allowed' });
  const payload = await readJsonBody(req);
  try {
    const result = await atlassianMod.syncToConfluence(projectRoot, payload);
    return atlassianActionReply(res, result);
  } catch (err) {
    return atlassianActionReply(res, null, err);
  }
}

export async function handlePullConfluence(req, res) {
  if (req.method === 'OPTIONS') return reply(res, 200, '');
  const projectRoot = process.cwd();
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method Not Allowed' });
  const payload = await readJsonBody(req);
  try {
    const result = await atlassianMod.pullFromConfluence(projectRoot, payload);
    return atlassianActionReply(res, result);
  } catch (err) {
    return atlassianActionReply(res, null, err);
  }
}

export async function handleSyncHistory(req, res) {
  if (req.method === 'OPTIONS') return reply(res, 200, '');
  const projectRoot = process.cwd();
  if (req.method !== 'GET') return reply(res, 405, { error: 'Method Not Allowed' });
  const history = atlassianMod.getSyncHistory(projectRoot);
  return reply(res, 200, history);
}
