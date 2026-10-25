import { gunzipSync } from 'node:zlib';
import { githubJsonHeaders, isGithubRateLimited } from './github-api.mjs';

/** One GitHub REST call: download branch tarball and extract markdown under _acl-output. */
export async function fetchAclMarkdownViaTarball({ owner, repo, branch, token }) {
  const headers = {
    ...githubJsonHeaders(token),
    Accept: 'application/vnd.github+json',
  };
  const url = `https://api.github.com/repos/${owner}/${repo}/tarball/${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers, redirect: 'follow' });
  const bodyText = res.ok ? '' : await res.text().catch(() => '');
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      rateLimited: isGithubRateLimited(res.status, bodyText),
      error: bodyText.slice(0, 400),
    };
  }

  const gz = Buffer.from(await res.arrayBuffer());
  let tar;
  try {
    tar = gunzipSync(gz);
  } catch (e) {
    return { ok: false, status: 500, error: 'Failed to decompress GitHub tarball: ' + e.message };
  }

  const entries = extractTarFiles(tar);
  const markdown = [];
  for (const entry of entries) {
    const norm = entry.name.replace(/\\/g, '/');
    const aclIdx = norm.indexOf('_acl-output/');
    if (aclIdx < 0) continue;
    if (!norm.endsWith('.md')) continue;
    const relPath = norm.slice(aclIdx + '_acl-output/'.length);
    if (!relPath || relPath.includes('..')) continue;
    markdown.push({
      relPath,
      content: entry.data.toString('utf8'),
    });
  }

  return { ok: true, files: markdown };
}

function extractTarFiles(tarBuffer) {
  const out = [];
  let offset = 0;
  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);
    offset += 512;
    const nameRaw = header.subarray(0, 100).toString('utf8').replace(/\0/g, '').trim();
    if (!nameRaw) break;
    const sizeOct = header.subarray(124, 136).toString('utf8').replace(/\0/g, '').trim();
    const size = Number.parseInt(sizeOct, 8) || 0;
    const typeFlag = header[156];
    const isDir = typeFlag === 53 || nameRaw.endsWith('/'); // '5'

    if (size > 0) {
      const data = tarBuffer.subarray(offset, offset + size);
      offset += size;
      offset = Math.ceil(offset / 512) * 512;
      if (!isDir) out.push({ name: nameRaw.replace(/\/$/, ''), data });
    } else if (!isDir && size === 0) {
      out.push({ name: nameRaw.replace(/\/$/, ''), data: Buffer.alloc(0) });
    }
  }
  return out;
}

export function tarballEntryToMetadata(content, relPath, parseMarkdownMetadata) {
  const fullPath = relPath.replace(/\\/g, '/');
  const parsed = parseMarkdownMetadata(content, fullPath);
  parsed.githubSha = undefined;
  return parsed;
}
