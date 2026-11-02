// Universal Serverless Function: api/git-details.js
import { getGitDetails } from '../tools/git-details-service.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-GitHub-Token',
  'Content-Type': 'application/json',
};

export default async function handler(req, res) {
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

    const payload = await getGitDetails(projectRoot, {
      simulateUnpushed,
      searchParams: url.searchParams,
      headers: req.headers || {},
    });

    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(payload));
  } catch (err) {
    res.writeHead(500, corsHeaders);
    res.end(JSON.stringify({ error: err.message, repoConnected: false }));
  }
}
