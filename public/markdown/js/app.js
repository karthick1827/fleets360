async function init() {
  try {
    const cached = localStorage.getItem('acl_adlc_project_markdown_files');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        const sanitized = parsed.filter((f) => !isChildFile(f.filename, f.folderPath));
        localStorage.setItem('acl_adlc_project_markdown_files', JSON.stringify(sanitized));
      }
    }
    const savedActive = localStorage.getItem('acl_active_file_id');
    if (savedActive && (savedActive.toLowerCase().includes('memlog') || savedActive.startsWith('.'))) {
      localStorage.removeItem('acl_active_file_id');
      activeFileId = null;
    }
  } catch (e) {}

  try {
    const savedSort = localStorage.getItem('acl_file_tree_sort');
    if (savedSort && document.getElementById('sortSelect')) {
      document.getElementById('sortSelect').value = savedSort;
    }
  } catch (e) {}
  updateDrawerFrameworkVersion();
  updateWorkflowModeUI();
  fetch('/api/git-details?t=' + Date.now(), typeof gitDetailsRequestInit === 'function' ? gitDetailsRequestInit() : {})
    .then((r) => r.json())
    .then((d) => {
      if (typeof hydrateGithubRepoFromGitDetails === 'function') hydrateGithubRepoFromGitDetails(d);
      window.__ACL_GIT_CONNECTED__ = Boolean(d && d.repoConnected === true && !d.repoDeleted);
      if (typeof updateNavUserControlCentre === 'function') updateNavUserControlCentre(d);
      if (!window.__ACL_GIT_CONNECTED__) {
        setSyncStatus('Link this Vercel project to GitHub for automatic live sync', 'yellow');
      }
    })
    .catch(() => {});
  const hydrated =
    typeof window.hydrateFilesFromLocalStorage === 'function' && window.hydrateFilesFromLocalStorage();

  if (typeof window.dedupeSessionFilesByFilename === 'function' && Array.isArray(files) && files.length > 0) {
    files = window.dedupeSessionFilesByFilename(files);
    try {
      localStorage.setItem('acl_adlc_project_markdown_files', JSON.stringify(files));
    } catch (e) {}
  }

  const synced = await syncFromLiveDisk(true);

  if ((!synced || hydrated) && files.length === 0) {
    if (!hydrated) {
      try {
        const cached = localStorage.getItem('acl_adlc_project_markdown_files');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            files = parsed
              .filter((f) => !isChildFile(f.filename, f.folderPath))
              .map((f) => ({
                ...f,
                status: f.status === 'Accepted' || f.status === 'approved' ? 'Approved' : f.status || 'In Review',
              }));
          }
        }
      } catch (e) {}
    }

    if (files.length === 0 && Array.isArray(window.__ACL_EMBEDDED_FILES__) && window.__ACL_EMBEDDED_FILES__.length > 0) {
      files = window.__ACL_EMBEDDED_FILES__
        .filter((f) => !isChildFile(f.filename, f.folderPath))
        .map((f) => ({
          ...f,
          status: f.status === 'Accepted' || f.status === 'approved' ? 'Approved' : f.status || 'In Review',
        }));
    }

    if (files.length > 0) {
      if (!activeFileId || !files.some((f) => f.id === activeFileId && !isChildFile(f.filename, f.folderPath))) {
        activeFileId = getInitialActiveFileId(files);
      }
      renderFileTree();
    } else {
      renderFileTree();
      loadEmptyState();
    }
  } else if (hydrated && files.length > 0) {
    renderFileTree();
  }

  // Open Summarized Dashboard by default when visiting /markdown.html; #working-tree etc. deep-link to a view
  const hashView = (window.location.hash || '').slice(1);
  const deepLinkViews = ['working-tree', 'dashboard-scrum', 'dashboard-developer', 'studio'];
  switchAppView(deepLinkViews.includes(hashView) ? hashView : 'dashboard-summarized');

  if (typeof window.reconcileSessionWithRemoteSpecs === 'function') {
    window.reconcileSessionWithRemoteSpecs().catch(() => {});
  }

  // Universal live auto-sync: automatically syncs when any agent (Claude Code, AGY, Gemini, Copilot, Cursor, etc.)
  // generates or updates markdown files in _acl-output/ without needing manual browser refresh
  const liveSyncMs = /vercel\.app$/i.test(window.location.hostname) ? 60_000 : 4_000;
  setInterval(() => {
    if (document.visibilityState === 'visible') syncFromLiveDisk(true);
  }, liveSyncMs);

  window.addEventListener('focus', () => {
    syncFromLiveDisk(true);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncFromLiveDisk(true);
  });

  const syncIndicator = document.getElementById('syncStatus');
  if (syncIndicator) {
    syncIndicator.style.cursor = 'pointer';
    syncIndicator.title = 'Click to refresh from GitHub now';
    syncIndicator.addEventListener('click', () => {
      if (typeof window.forceGitHubLiveSync === 'function') {
        window.forceGitHubLiveSync();
      } else {
        syncFromLiveDisk(false);
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', init);
