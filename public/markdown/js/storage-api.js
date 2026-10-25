function normalizeStudioFolderPath(folderPath) {
  const fp = String(folderPath || 'root')
    .replace(/\\/g, '/')
    .replace(/^(_acl-output|_acl_output|acl-output)\/?/i, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
  if (!fp || fp === 'root' || fp === '.') return 'root';
  if (fp === '4-implementation' || fp.endsWith('/4-implementation')) {
    return fp.replace(/\/?4-implementation\/?$/i, 'implementation-artifacts') || 'implementation-artifacts';
  }
  return fp;
}

function specFileScore(f) {
  const fn = (f.filename || '').toLowerCase();
  const fp = normalizeStudioFolderPath(f.folderPath).toLowerCase();
  let score = (f.content || '').length;
  if (fp.includes('implementation-artifacts')) score += 1_000_000;
  if (fp.includes('4-implementation')) score -= 500_000;
  if (fn.startsWith('spec-') || fn.startsWith('story-')) score += 100;
  return score;
}

/** Collapse duplicate spec/story filenames (legacy 4-implementation vs implementation-artifacts). */
function dedupeSessionFilesByFilename(fileList) {
  const byName = new Map();
  for (const f of fileList || []) {
    const key = (f.filename || '').toLowerCase();
    if (!key) continue;
    const normalized = {
      ...f,
      folderPath: normalizeStudioFolderPath(f.folderPath),
    };
    const prev = byName.get(key);
    if (!prev || specFileScore(normalized) > specFileScore(prev)) {
      byName.set(key, normalized);
    }
  }
  return Array.from(byName.values());
}

function fileStorageKey(f) {
  const folder = normalizeStudioFolderPath(f.folderPath);
  return `${folder}::${(f.filename || '').toLowerCase()}`;
}

function parseStatusFromMarkdown(content) {
  if (!content) return 'In Review';
  const m = String(content).match(/^---[\s\S]*?\nstatus:\s*([^\r\n]+)/im);
  if (!m) return 'In Review';
  const raw = m[1].trim().replace(/^['"]|['"]$/g, '');
  if (/approved|accept/i.test(raw)) return 'Approved';
  if (/reject/i.test(raw)) return 'Rejected';
  return 'In Review';
}

const ACL_SESSION_SYNC_GUARD_KEY = 'acl_session_sync_guard';

function isSessionSyncGuarded() {
  try {
    return Boolean(localStorage.getItem(ACL_SESSION_SYNC_GUARD_KEY));
  } catch {
    return false;
  }
}

function armSessionSyncGuard() {
  try {
    localStorage.setItem(ACL_SESSION_SYNC_GUARD_KEY, String(Date.now()));
  } catch (e) {}
}

function clearSessionSyncGuard() {
  try {
    localStorage.removeItem(ACL_SESSION_SYNC_GUARD_KEY);
  } catch (e) {}
}

function mergeRemoteWithLocalSession(localFiles, remoteFiles) {
  const remoteMap = new Map((remoteFiles || []).map((f) => [fileStorageKey(f), f]));
  const merged = [];
  const seen = new Set();
  const guardActive = isSessionSyncGuarded();

  for (const lf of localFiles || []) {
    const key = fileStorageKey(lf);
    const rf = remoteMap.get(key);
    seen.add(key);
    if (!rf) {
      merged.push(lf);
      continue;
    }
    const sessionOwned = Boolean(lf.sessionRevision || lf.sessionFromAtlassian);
    const localLen = (lf.content || '').length;
    const remoteLen = (rf.content || '').length;
    const localEffectivelyEmpty = localLen < 80 && remoteLen > localLen + 40;
    if (guardActive || sessionOwned) {
      merged.push({
        ...rf,
        ...lf,
        folderPath: normalizeStudioFolderPath(lf.folderPath || rf.folderPath),
        content: localEffectivelyEmpty ? rf.content : lf.content,
        status: localEffectivelyEmpty
          ? parseStatusFromMarkdown(rf.content)
          : lf.status || parseStatusFromMarkdown(lf.content),
        updatedAt: lf.updatedAt || rf.updatedAt,
        sessionRevision: lf.sessionRevision,
        sessionFromAtlassian: lf.sessionFromAtlassian,
      });
      continue;
    }
    const localTs = Date.parse(lf.updatedAt || 0) || Number(lf.sessionRevision || 0) || 0;
    const remoteTs = Date.parse(rf.updatedAt || 0) || 0;
    const localNewer = localTs > remoteTs + 500;
    const contentDiffers = (lf.content || '') !== (rf.content || '');
    const keepLocalContent = localNewer || (contentDiffers && localTs >= remoteTs);
    if (keepLocalContent) {
      merged.push({
        ...rf,
        content: lf.content,
        status: lf.status || parseStatusFromMarkdown(lf.content),
        updatedAt: lf.updatedAt || rf.updatedAt,
        sessionRevision: lf.sessionRevision,
      });
    } else {
      merged.push({
        ...rf,
        status: parseStatusFromMarkdown(rf.content) || rf.status,
      });
    }
  }

  for (const rf of remoteFiles || []) {
    const key = fileStorageKey(rf);
    if (!seen.has(key)) {
      merged.push({
        ...rf,
        status: parseStatusFromMarkdown(rf.content) || rf.status,
      });
    }
  }
  return merged;
}

function flushActiveEditorToSession() {
  if (typeof getActiveFile !== 'function') return false;
  const file = getActiveFile();
  if (!file) return false;
  const textarea = document.getElementById('markdownTextarea');
  if (!textarea) return false;
  const val = textarea.value;
  if (val === file.content) return false;
  file.content = val;
  file.status =
    document.getElementById('statusSelect')?.value === 'Accepted'
      ? 'Approved'
      : document.getElementById('statusSelect')?.value || file.status;
  file.updatedAt = new Date().toISOString();
  file.sessionRevision = Date.now();
  try {
    localStorage.setItem('acl_adlc_project_markdown_files', JSON.stringify(files));
  } catch (e) {}
  return true;
}

function hydrateFilesFromLocalStorage() {
  try {
    const raw = localStorage.getItem('acl_adlc_project_markdown_files');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return false;
    files = dedupeSessionFilesByFilename(
      parsed
        .filter((f) => !isChildFile(f.filename, f.folderPath))
        .map((f) => ({
          ...f,
          folderPath: normalizeStudioFolderPath(f.folderPath),
          status:
            f.status === 'Accepted' || f.status === 'approved' || f.status === 'Approved'
              ? 'Approved'
              : f.status || 'In Review',
        })),
    );
    const savedActive = localStorage.getItem('acl_active_file_id');
    if (savedActive && files.some((f) => f.id === savedActive)) {
      activeFileId = savedActive;
    } else if (!activeFileId || !files.some((f) => f.id === activeFileId)) {
      activeFileId = getInitialActiveFileId(files);
    }
    return true;
  } catch {
    return false;
  }
}

async function syncFromLiveDisk(quiet = false) {
  if (isSyncing || isSaving || Date.now() - lastSaveTime < 3500) return false;
  flushActiveEditorToSession();
  if (isSessionSyncGuarded()) {
    try {
      localStorage.setItem('acl_adlc_project_markdown_files', JSON.stringify(files));
    } catch (e) {}
    if (!quiet) {
      setSyncStatus(
        'Studio session kept (Jira/Confluence edits). Push to JIRA/Confluence or Save to persist; clear guard via Save to GitHub.',
        'yellow',
      );
    }
    return false;
  }
  isSyncing = true;
  try {
    const cloudToken = (localStorage.getItem('acl_github_token') || '').trim();
    const cloudOwner = (localStorage.getItem('acl_github_owner') || '').trim();
    const cloudRepo = (localStorage.getItem('acl_github_repo') || '').trim();
    const cloudBranch = (localStorage.getItem('acl_github_branch') || '').trim();

    const headers = { 'Cache-Control': 'no-store' };
    if (cloudToken) {
      headers['Authorization'] = 'Bearer ' + cloudToken;
      headers['X-GitHub-Token'] = cloudToken;
    }

    let queryUrl = '/api/list-markdown-files?t=' + Date.now();
    if (cloudOwner) queryUrl += '&owner=' + encodeURIComponent(cloudOwner);
    if (cloudRepo) queryUrl += '&repo=' + encodeURIComponent(cloudRepo);
    if (cloudBranch) queryUrl += '&branch=' + encodeURIComponent(cloudBranch);

    let res = await fetch(queryUrl, { headers, cache: 'no-store' });
    if (!res.ok) {
      try {
        const fallbackUrl = 'http://localhost:3333' + queryUrl;
        const fbRes = await fetch(fallbackUrl, { headers, cache: 'no-store' });
        if (fbRes.ok) {
          res = fbRes;
          window.__ACL_LIVE_ENDPOINT__ = 'http://localhost:3333';
        }
      } catch (fbErr) {}
    }
    if (res.ok) {
      const data = await res.json();
      if (data && (data.frameworkVersion || data.version)) {
        updateDrawerFrameworkVersion(data.frameworkVersion || data.version);
      }
      if (data && data.activeTier) {
        window.__serverActiveTier = String(data.activeTier);
      }
      if (data && Array.isArray(data.files)) {
        // The working-tree tracker is filtered out of the document list below, so read it first.
        const trackerChanged = captureWorkingTreeTracker(data.files);
        if (trackerChanged && activeAppView === 'working-tree') renderWorkingTree();
        let filteredFiles = data.files.filter((f) => !isChildFile(f.filename, f.folderPath));

        // Deduplicate files: prefer canonical numbered phase directories over root/duplicate paths
        // EXCEPTION: project-context.md MUST always prefer root over nested directories!
        const seenMap = new Map();
        for (const f of filteredFiles) {
          const key = f.filename.toLowerCase();
          if (!seenMap.has(key)) {
            seenMap.set(key, f);
          } else {
            const existing = seenMap.get(key);
            if (key === 'project-context.md') {
              if (f.folderPath === 'root' || !f.folderPath.includes('0-context')) {
                seenMap.set(key, f);
              }
            } else if (key.startsWith('spec-') || key.startsWith('story-')) {
              const exFp = (existing.folderPath || '').toLowerCase();
              const cFp = (f.folderPath || '').toLowerCase();
              if (cFp.includes('implementation-artifacts')) seenMap.set(key, f);
              else if (!exFp.includes('implementation-artifacts')) seenMap.set(key, f);
            } else if (existing.folderPath === 'root' || (!existing.folderPath.match(/[0-4]-/) && f.folderPath.match(/[0-4]-/))) {
              seenMap.set(key, f);
            }
          }
        }
        filteredFiles = dedupeSessionFilesByFilename(Array.from(seenMap.values()));

        if (filteredFiles.length === 0) {
          files = [];
          try {
            localStorage.setItem('acl_adlc_project_markdown_files', JSON.stringify([]));
          } catch (e) {}
          renderFileTree();
          loadEmptyState();
          setSyncStatus('Synced with VS code and Github (0 files in _acl-output)', 'green');
          return true;
        }

        const normIncoming = filteredFiles.map((f) => ({
          ...f,
          status: f.status === 'Accepted' || f.status === 'approved' || f.status === 'Approved' ? 'Approved' : f.status || 'In Review',
        }));

        const prevFingerprint = JSON.stringify(
          files.map((f) => ({
            id: f.id,
            filename: f.filename,
            folderPath: f.folderPath,
            content: f.content,
            status: f.status,
            tier: f.tier,
          })),
        );
        const nextFingerprint = JSON.stringify(
          normIncoming.map((f) => ({
            id: f.id,
            filename: f.filename,
            folderPath: f.folderPath,
            content: f.content,
            status: f.status,
            tier: f.tier,
          })),
        );
        const hasChanged = prevFingerprint !== nextFingerprint;

        if (hasChanged || files.length === 0) {
          const prevActiveFile = files.find((f) => f.id === activeFileId);
          files =
            files.length > 0 ? mergeRemoteWithLocalSession(files, normIncoming) : normIncoming;
          try {
            localStorage.setItem('acl_adlc_project_markdown_files', JSON.stringify(files));
          } catch (e) {}
          if (!activeFileId || !files.some((f) => f.id === activeFileId && !isChildFile(f.filename, f.folderPath))) {
            activeFileId = getInitialActiveFileId(files);
          }
          renderFileTree();
          const currentActiveFile = files.find((f) => f.id === activeFileId);
          const activeContentChanged = !prevActiveFile || (currentActiveFile && prevActiveFile.content !== currentActiveFile.content);
          const activeAfterMerge = files.find((f) => f.id === activeFileId);
          const skipReloadActive =
            activeAfterMerge &&
            (activeAfterMerge.sessionRevision || activeAfterMerge.sessionFromAtlassian || isSessionSyncGuarded());
          if (activeFileId && !isDirty && activeContentChanged && !skipReloadActive) {
            loadFile(activeFileId);
          }
          if (activeAppView === 'dashboard' || activeAppView === 'dashboard-summarized') {
            renderDeliveryDashboard();
          } else if (activeAppView === 'dashboard-scrum') {
            renderScrumMasterDashboard();
          } else if (activeAppView === 'dashboard-developer') {
            renderDeveloperDashboard();
          } else if (activeAppView === 'working-tree') {
            renderWorkingTree();
          }
        }
        if (data && data.source === 'github') {
          setSyncStatus(`Synced live with GitHub (${data.repo || 'origin'})`, 'green');
        } else {
          const isGitConnected = Boolean(window.__ACL_GIT_CONNECTED__);
          if (isGitConnected) {
            setSyncStatus('Synced with IDE and GitHub', 'green');
          } else {
            setSyncStatus('Synced with IDE (Not synced with GitHub)', 'yellow');
          }
        }
        evaluateProceedButton();
        return true;
      }
    }
  } catch (e) {
  } finally {
    isSyncing = false;
  }
  evaluateProceedButton();
  return false;
}

let activeWorkflowMode = localStorage.getItem('acl_workflow_mode') || 'greenfield';

function persistFilesToBrowserSession() {
  try {
    localStorage.setItem('acl_adlc_project_markdown_files', JSON.stringify(files));
  } catch (e) {}
}

async function saveCurrentFile() {
  const file = getActiveFile();
  if (!file) return;

  file.folderPath = normalizeStudioFolderPath(file.folderPath);

  const textarea = document.getElementById('markdownTextarea');
  const status = document.getElementById('statusSelect').value;
  const nowIso = new Date().toISOString();

  const rawContent = textarea ? textarea.value : file.content || '';
  const mergedContent = updateDocumentStatusFrontmatter(rawContent, status, nowIso);
  if (textarea) textarea.value = mergedContent;

  file.content = mergedContent;
  file.status = status === 'Accepted' ? 'Approved' : status;
  file.updatedAt = nowIso;
  file.sessionRevision = Date.now();
  armSessionSyncGuard();

  renderPreview();
  persistFilesToBrowserSession();

  const cloudToken = (localStorage.getItem('acl_github_token') || '').trim();
  await ensureGitHubCloudDefaults();
  const cloudOwner = (localStorage.getItem('acl_github_owner') || '').trim();
  const cloudRepo = (localStorage.getItem('acl_github_repo') || '').trim();
  const cloudBranch = (localStorage.getItem('acl_github_branch') || '').trim();

  let resData = { success: true, mode: 'browser-session', gitPushed: false };
  isSaving = true;
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (cloudToken) {
      headers['Authorization'] = 'Bearer ' + cloudToken;
      headers['X-GitHub-Token'] = cloudToken;
    }

    const bodyPayload = {
      folderPath: file.folderPath,
      filename: file.filename,
      content: file.content,
      status: file.status,
      autoPush: false,
      githubToken: cloudToken || undefined,
      githubOwner: cloudOwner || undefined,
      githubRepo: cloudRepo || undefined,
      githubBranch: cloudBranch || undefined,
    };

    const saveEndpoint = (window.__ACL_LIVE_ENDPOINT__ || '') + '/api/save-markdown';
    const resp = await fetch(saveEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(bodyPayload),
    });
    resData = await resp.json().catch(() => ({}));

    if (resp.ok && resData.success !== false) {
      lastSaveTime = Date.now();
      const pushed =
        resData.gitPushed === true || resData.mode === 'github' || Boolean(resData.commitSha);
      if (pushed) {
        clearSessionSyncGuard();
        setSyncStatus('Saved to IDE & pushed to GitHub', 'green');
      } else if (cloudToken && resData.mode === 'github') {
        setSyncStatus('Saved to IDE (GitHub push pending)', 'yellow');
      } else {
        setSyncStatus('Saved in Markdown Studio (browser session)', 'green');
      }
    } else if (resp.status === 404) {
      lastSaveTime = Date.now();
      setSyncStatus('Saved in Markdown Studio (save API not deployed yet)', 'yellow');
      resData = { success: true, gitPushed: false, mode: 'browser-session' };
    } else if (cloudToken) {
      const errorMsg = resData.error || resData.message || `Server error (${resp.status})`;
      showToast(`GitHub save failed: ${errorMsg}`, 'error');
      setSyncStatus(`GitHub save failed: ${errorMsg}`, 'red');
      return false;
    } else {
      lastSaveTime = Date.now();
      setSyncStatus('Saved in Markdown Studio (browser session)', 'green');
      resData = { success: true, gitPushed: false, mode: 'browser-session' };
    }
  } catch (e) {
    lastSaveTime = Date.now();
    setSyncStatus('Saved in Markdown Studio (offline / browser session)', 'yellow');
    resData = { success: true, gitPushed: false, mode: 'browser-session' };
  } finally {
    isSaving = false;
  }

  isDirty = false;
  persistFilesToBrowserSession();

  const syncSuffix = resData && resData.gitPushed ? ' (Synced to GitHub)' : ' (updated in Studio)';
  if (status === 'Approved' || status === 'Accepted') {
    showToast(`Approved '${file.filename}'!${syncSuffix}`, 'success');
  } else if (status === 'Rejected') {
    showToast(`Rejected '${file.filename}'${syncSuffix}`, 'error');
  } else {
    showToast(`Saved '${file.filename}' [${status}]${syncSuffix}`, 'info');
  }
  renderFileTree();
  evaluateProceedButton();
  if (activeAppView === 'dashboard' || activeAppView === 'dashboard-summarized' || activeAppView === 'dashboard-scrum') {
    if (typeof renderDeliveryDashboard === 'function') renderDeliveryDashboard();
    if (typeof renderScrumMasterDashboard === 'function' && activeAppView === 'dashboard-scrum') renderScrumMasterDashboard();
  }
  if (typeof updateGmailButtonState === 'function') {
    updateGmailButtonState();
  }
  return true;
}

function updateDocumentStatusFrontmatter(content, newStatus, nowIso = new Date().toISOString()) {
  let cleanStatus = (newStatus || 'In Review').trim();
  if (cleanStatus.toLowerCase() === 'accepted') cleanStatus = 'Approved';
  const gateSig = 'ACL-STUDIO-APPROVAL-' + cleanStatus.toUpperCase().replace(/\s+/g, '-');
  const managedKeys = ['status', 'reviewed_by', 'review_timestamp', 'review_source', 'gate_signature'];

  if (content.startsWith('---')) {
    const parts = content.split('---');
    if (parts.length >= 3) {
      const fmRaw = parts[1];
      const body = parts.slice(2).join('---');

      const fmLines = fmRaw.split(/\r?\n/).filter((line) => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        return !managedKeys.some((key) => new RegExp('^' + key + '\\s*:', 'i').test(trimmed));
      });

      const newFmLines = [
        'status: ' + cleanStatus,
        'reviewed_by: Manager (via Markdown Studio)',
        'review_timestamp: ' + nowIso,
        'gate_signature: ' + gateSig,
        ...fmLines,
      ];

      return '---\n' + newFmLines.join('\n') + '\n---' + (body.startsWith('\n') ? body : '\n' + body);
    }
  }

  const contentLines = content.split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    return !managedKeys.some((key) => new RegExp('^' + key + '\\s*:', 'i').test(trimmed));
  });

  const cleanBody = contentLines.join('\n').trimStart();

  return (
    '---\nstatus: ' +
    cleanStatus +
    '\nreviewed_by: Manager (via Markdown Studio)\nreview_timestamp: ' +
    nowIso +
    '\ngate_signature: ' +
    gateSig +
    '\n---\n\n' +
    cleanBody
  );
}

function refreshActiveFileStatusPill(status) {
  const file = getActiveFile();
  if (!file) return;
  const normStatus = status === 'Accepted' || status === 'approved' ? 'Approved' : status;
  const root = document.getElementById('fileTreeRoot');
  if (!root) return;
  const activeItem = root.querySelector(`.file-item[data-file-id="${file.id}"]`);
  if (!activeItem) return;
  const pill = activeItem.querySelector('.status-pill');
  if (!pill) return;
  pill.className = `status-pill ${normStatus.toLowerCase().replace(/\s+/g, '-')}`;
  pill.innerHTML = `<span class="dot"></span>${normStatus}`;
}

function clientFilesToGitHubEntries(clientFiles) {
  const normPath = (rel) => String(rel || '').replace(/\\/g, '/').replace(/^_acl-output\/?/, '');
  const out = [];
  for (const item of clientFiles || []) {
    if (!item || typeof item.content !== 'string') continue;
    const rel = normPath(item.relativePath);
    const parts = rel.split('/').filter(Boolean);
    const filename = parts.pop() || 'document.md';
    const folderPath = normalizeStudioFolderPath(parts.length ? parts.join('/') : 'root');
    out.push({
      folderPath,
      filename,
      content: item.content,
      status: parseStatusFromMarkdown(item.content),
    });
  }
  return out;
}

function studioFilesToGitHubEntries(fileList) {
  const out = [];
  for (const f of fileList || []) {
    if (!f || !f.filename || typeof f.content !== 'string') continue;
    out.push({
      folderPath: normalizeStudioFolderPath(f.folderPath || 'root'),
      filename: f.filename,
      content: f.content,
      status: f.status || parseStatusFromMarkdown(f.content),
    });
  }
  return out;
}

async function ensureGitHubCloudDefaults() {
  const owner = (localStorage.getItem('acl_github_owner') || '').trim();
  const repo = (localStorage.getItem('acl_github_repo') || '').trim();
  if (owner && repo) return;
  try {
    const res = await fetch('/api/git-details', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const origin = data.remoteOrigin || '';
    const m = origin.match(/github\.com[/:]([^/]+)\/([^/.]+)/i);
    if (m) {
      if (!owner) localStorage.setItem('acl_github_owner', m[1]);
      if (!repo) localStorage.setItem('acl_github_repo', m[2].replace(/\.git$/i, ''));
    }
  } catch (e) {}
}

/**
 * Commit one or more markdown files to GitHub via /api/save-markdown (requires Cloud Sync token).
 */
async function commitMarkdownEntriesToGitHub(entries) {
  const list = (entries || []).filter((e) => e && e.filename && typeof e.content === 'string');
  if (list.length === 0) {
    return { success: true, skipped: true, pushed: [], failed: [], reason: 'No files to commit.' };
  }

  const cloudToken = (localStorage.getItem('acl_github_token') || '').trim();
  const cloudOwner = (localStorage.getItem('acl_github_owner') || '').trim();
  const cloudRepo = (localStorage.getItem('acl_github_repo') || '').trim();
  const cloudBranch = (localStorage.getItem('acl_github_branch') || '').trim() || 'main';

  if (!cloudToken) {
    return {
      success: false,
      skipped: true,
      pushed: [],
      failed: [],
      reason: 'Add a GitHub personal access token in User Control (Cloud Sync).',
    };
  }

  await ensureGitHubCloudDefaults();
  const resolvedOwner = (localStorage.getItem('acl_github_owner') || '').trim();
  const resolvedRepo = (localStorage.getItem('acl_github_repo') || '').trim();
  const resolvedBranch = (localStorage.getItem('acl_github_branch') || '').trim() || 'main';

  const pushed = [];
  const failed = [];
  const saveEndpoint = (window.__ACL_LIVE_ENDPOINT__ || '') + '/api/save-markdown';

  for (const entry of list) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + cloudToken,
        'X-GitHub-Token': cloudToken,
      };
      const bodyPayload = {
        folderPath: entry.folderPath,
        filename: entry.filename,
        content: entry.content,
        status: entry.status,
        githubToken: cloudToken,
        githubOwner: resolvedOwner || cloudOwner || undefined,
        githubRepo: resolvedRepo || cloudRepo || undefined,
        githubBranch: resolvedBranch || cloudBranch || undefined,
      };
      const resp = await fetch(saveEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });
      const data = await resp.json().catch(() => ({}));
      const committed =
        resp.ok &&
        data.success !== false &&
        (data.gitPushed === true || data.mode === 'github' || Boolean(data.commitSha));
      if (committed) {
        pushed.push({ filename: entry.filename, path: data.path, commitSha: data.commitSha });
      } else {
        failed.push({
          filename: entry.filename,
          error: data.error || data.message || data.warning || `HTTP ${resp.status}`,
        });
      }
    } catch (err) {
      failed.push({ filename: entry.filename, error: err.message || String(err) });
    }
  }

  const success = failed.length === 0 && pushed.length > 0;
  if (success) {
    clearSessionSyncGuard();
  }

  return {
    success,
    skipped: false,
    pushed,
    failed,
    repo: resolvedOwner && resolvedRepo ? `${resolvedOwner}/${resolvedRepo}` : 'linked repository',
    branch: resolvedBranch,
  };
}

async function reconcileSessionWithRemoteSpecs() {
  const cloudToken = (localStorage.getItem('acl_github_token') || '').trim();
  if (!cloudToken) return false;
  await ensureGitHubCloudDefaults();
  const headers = {
    'Cache-Control': 'no-store',
    Authorization: 'Bearer ' + cloudToken,
    'X-GitHub-Token': cloudToken,
  };
  const owner = (localStorage.getItem('acl_github_owner') || '').trim();
  const repo = (localStorage.getItem('acl_github_repo') || '').trim();
  const branch = (localStorage.getItem('acl_github_branch') || '').trim();
  let queryUrl = '/api/list-markdown-files?t=' + Date.now();
  if (owner) queryUrl += '&owner=' + encodeURIComponent(owner);
  if (repo) queryUrl += '&repo=' + encodeURIComponent(repo);
  if (branch) queryUrl += '&branch=' + encodeURIComponent(branch);
  try {
    const res = await fetch((window.__ACL_LIVE_ENDPOINT__ || '') + queryUrl, { headers, cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data || !Array.isArray(data.files)) return false;
    const remoteSpecs = dedupeSessionFilesByFilename(
      data.files.filter((f) => {
        const fn = (f.filename || '').toLowerCase();
        return fn.startsWith('spec-') || fn.startsWith('story-');
      }),
    );
    if (remoteSpecs.length === 0) return false;
    let changed = false;
    for (const rf of remoteSpecs) {
      const folderPath = normalizeStudioFolderPath(rf.folderPath);
      const idx = files.findIndex(
        (f) => (f.filename || '').toLowerCase() === (rf.filename || '').toLowerCase(),
      );
      const remoteLen = (rf.content || '').length;
      if (idx < 0) {
        files.push({
          ...rf,
          folderPath,
          status: parseStatusFromMarkdown(rf.content),
        });
        changed = true;
        continue;
      }
      const localLen = (files[idx].content || '').length;
      if (remoteLen > localLen + 40) {
        files[idx].content = rf.content;
        files[idx].folderPath = folderPath;
        files[idx].status = parseStatusFromMarkdown(rf.content);
        changed = true;
      }
    }
    if (changed) {
      files = dedupeSessionFilesByFilename(files);
      persistFilesToBrowserSession();
      renderFileTree();
      if (activeAppView === 'dashboard' || activeAppView === 'dashboard-summarized') {
        renderDeliveryDashboard();
      } else if (activeAppView === 'dashboard-scrum') {
        renderScrumMasterDashboard();
      } else if (activeAppView === 'dashboard-developer') {
        renderDeveloperDashboard();
      }
    }
    return changed;
  } catch (e) {
    return false;
  }
}

async function onStatusChange(newStatus) {
  const file = getActiveFile();
  if (!file) return;

  const prevStatus = file.status;
  const nowIso = new Date().toISOString();
  file.status = newStatus === 'Accepted' ? 'Approved' : newStatus;
  file.updatedAt = nowIso;
  file.sessionRevision = Date.now();
  armSessionSyncGuard();

  const currentContent = document.getElementById('markdownTextarea').value || '';
  const updatedContent = updateDocumentStatusFrontmatter(currentContent, newStatus, nowIso);

  document.getElementById('markdownTextarea').value = updatedContent;
  file.content = updatedContent;
  persistFilesToBrowserSession();
  refreshActiveFileStatusPill(newStatus);
  renderFileTree();

  const ok = await saveCurrentFile();
  if (ok === false) {
    file.status = prevStatus;
    const sel = document.getElementById('statusSelect');
    if (sel) {
      sel.value = prevStatus === 'Accepted' || prevStatus === 'approved' ? 'Approved' : prevStatus;
    }
    renderFileTree();
    return;
  }
  refreshActiveFileStatusPill(file.status);
}

if (typeof window !== 'undefined') {
  window.parseStatusFromMarkdown = parseStatusFromMarkdown;
  window.saveCurrentFile = saveCurrentFile;
  window.flushActiveEditorToSession = flushActiveEditorToSession;
  window.persistFilesToBrowserSession = persistFilesToBrowserSession;
  window.armSessionSyncGuard = armSessionSyncGuard;
  window.clearSessionSyncGuard = clearSessionSyncGuard;
  window.hydrateFilesFromLocalStorage = hydrateFilesFromLocalStorage;
  window.isSessionSyncGuarded = isSessionSyncGuarded;
  window.clientFilesToGitHubEntries = clientFilesToGitHubEntries;
  window.studioFilesToGitHubEntries = studioFilesToGitHubEntries;
  window.commitMarkdownEntriesToGitHub = commitMarkdownEntriesToGitHub;
  window.reconcileSessionWithRemoteSpecs = reconcileSessionWithRemoteSpecs;
  window.dedupeSessionFilesByFilename = dedupeSessionFilesByFilename;
  window.normalizeStudioFolderPath = normalizeStudioFolderPath;
  window.onStatusChange = onStatusChange;
  window.syncFromLiveDisk = syncFromLiveDisk;
  window.refreshTree = async function (quiet = false) {
    return await syncFromLiveDisk(quiet);
  };
}
