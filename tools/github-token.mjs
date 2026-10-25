/**
 * Resolve GitHub token: on Vercel/serverless prefer platform env (automatic live sync).
 * Locally, optional client header token is tried first.
 */
export function resolveGithubAccessToken({ headers = {}, queryToken = '', bodyToken = '' } = {}) {
  const envTok = (
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_PAT ||
    ''
  ).trim();

  const rawHeaderAuth = headers.authorization || headers.Authorization || '';
  const rawCustomToken = headers['x-github-token'] || headers['X-GitHub-Token'] || '';
  const clientTok = (
    rawCustomToken ||
    String(rawHeaderAuth).replace(/^Bearer\s+/i, '').replace(/^token\s+/i, '') ||
    queryToken ||
    bodyToken ||
    ''
  ).trim();

  const isServerless = Boolean(
    process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME,
  );
  if (isServerless) return envTok || clientTok;
  return clientTok || envTok;
}
