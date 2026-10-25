/** In-memory list cache (per serverless instance). Reduces repeated full-tree + blob fetches. */
const githubListCache = new Map();

export const GITHUB_LIST_CACHE_TTL_MS = 300_000;

export function githubListCacheKey(owner, repo, branch, token) {
  return `${owner}/${repo}@${branch}::${token ? 'auth' : 'anon'}`;
}

export function getGithubListCacheEntry(key) {
  return githubListCache.get(key);
}

export function setGithubListCacheEntry(key, payload) {
  githubListCache.set(key, { at: Date.now(), payload });
}

export function getFreshGithubListPayload(key, ttlMs = GITHUB_LIST_CACHE_TTL_MS) {
  const cached = githubListCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.at >= ttlMs) return null;
  return cached.payload;
}

export function getStaleGithubListPayload(key) {
  const cached = githubListCache.get(key);
  return cached ? cached.payload : null;
}

export function invalidateGithubListCache(owner, repo, branch) {
  const prefix = `${owner}/${repo}@${branch}::`;
  for (const key of githubListCache.keys()) {
    if (key.startsWith(prefix)) githubListCache.delete(key);
  }
}
