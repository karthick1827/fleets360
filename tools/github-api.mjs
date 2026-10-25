export function githubAuthHeaderValue(token) {
  if (!token) return '';
  if (token.startsWith('Bearer ') || token.startsWith('token ')) return token;
  if (token.startsWith('ghp_') || token.startsWith('github_pat_')) return `token ${token}`;
  return `Bearer ${token}`;
}

export function githubJsonHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'ACL-ADLC-Markdown-Studio',
  };
  if (token) headers.Authorization = githubAuthHeaderValue(token);
  return headers;
}

export function isGithubRateLimited(status, bodyText) {
  const body = String(bodyText || '');
  return status === 429 || (status === 403 && /rate limit/i.test(body));
}

export function githubRateLimitUserMessage() {
  return {
    error: 'GitHub API rate limit exceeded.',
    hint:
      'Too many sync requests (live poll + saves). Wait 5–10 minutes, close extra Studio tabs, then try Save again.',
    code: 'github_rate_limit',
  };
}
