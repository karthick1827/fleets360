/**
 * Browser / serverless workspace helpers for Atlassian sync (no local _acl-output on Vercel).
 */
import path from 'node:path';

export function isServerlessRuntime() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export function splitAtlassianPayload(customConfig = {}) {
  const {
    workspaceFiles,
    clientMapping,
    githubOwner,
    githubRepo,
    githubBranch,
    githubToken,
    ...configFields
  } = customConfig;
  const files = Array.isArray(workspaceFiles) ? workspaceFiles : [];
  return {
    workspaceFiles: files,
    clientMapping: clientMapping && typeof clientMapping === 'object' ? clientMapping : null,
    configFields,
    useWorkspace: files.length > 0,
    githubOwner,
    githubRepo,
    githubBranch,
    githubToken,
  };
}

export function workspaceRelativePath(folderPath, filename) {
  const folder = (folderPath || 'root').replace(/\\/g, '/');
  const name = filename || 'document.md';
  if (folder === 'root' || folder === '.' || folder === '') return name;
  if (folder.startsWith('_acl-output/')) return `${folder}/${name}`;
  return `_acl-output/${folder}/${name}`;
}

export function queueClientMarkdown(pullResults, relativePath, content) {
  if (!pullResults) return;
  if (!pullResults.clientFiles) pullResults.clientFiles = [];
  let rel = String(relativePath || 'document.md').replace(/\\/g, '/');
  if (!rel.startsWith('_acl-output/')) rel = `_acl-output/${rel.replace(/^\/?/, '')}`;
  pullResults.clientFiles.push({ relativePath: rel, content, action: 'write' });
}

export function parseEpicsFromContent(raw, results) {
  const sections = raw.split(/^##\s+/m);
  for (const section of sections) {
    const lines = section.trim().split(/\r?\n/);
    const heading = lines[0] || '';
    const match = heading.match(/Epic\s+(\d+)[:\s-]+(.+)/i);
    if (match) {
      const epicNum = match[1];
      const epicTitle = match[2].trim();
      const descLines = lines
        .slice(1)
        .filter((l) => !l.startsWith('###') && !l.startsWith('---'))
        .slice(0, 6)
        .join(' ')
        .trim();
      results.epics.push({
        epicNum,
        title: `Epic ${epicNum}: ${epicTitle}`,
        summary: epicTitle,
        description: descLines || `Epic ${epicNum} delivery unit for ${epicTitle}`,
      });
    }
  }
}

export function parseStoryFromContent(raw, filename, filePath, results) {
  let title = '';
  let storyId = '';
  let epicId = '';
  let status = 'Approved';
  let jiraKey = '';

  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    const fm = fmMatch[1];
    const titleM = fm.match(/title:\s*["']?([^"'\r\n]+)["']?/i);
    if (titleM) title = titleM[1].trim();
    const idM = fm.match(/story_id:\s*["']?([^"'\r\n]+)["']?/i);
    if (idM) storyId = idM[1].trim();
    const epicM = fm.match(/epic_id:\s*["']?([^"'\r\n]+)["']?/i);
    if (epicM) epicId = epicM[1].trim();
    const statusM = fm.match(/status:\s*["']?([^"'\r\n]+)["']?/i);
    if (statusM) status = statusM[1].trim();
    const jiraM = fm.match(/jira_key:\s*["']?([^"'\r\n]+)["']?/i);
    if (jiraM) jiraKey = jiraM[1].trim();
  }

  if (!storyId) {
    const nameMatch = filename.match(/(?:story|spec)-(\d+)[-_](\d+)/i);
    if (nameMatch) {
      storyId = `${nameMatch[1]}.${nameMatch[2]}`;
      epicId = nameMatch[1];
    } else {
      storyId = filename.replace(/\.md$/i, '');
    }
  }

  if (!title) {
    const firstHeading = raw.match(/^#\s+([^\r\n]+)/m);
    title = firstHeading ? firstHeading[1].trim() : filename.replace(/\.md$/i, '');
  }

  const criteria = [];
  const seen = new Set();
  let targetSection = '';
  const acSectionMatch = raw.match(/##\s+Acceptance Criteria[\s\S]*?(?=\n##\s+|$)/i);
  if (acSectionMatch) targetSection = acSectionMatch[0];
  else {
    const taskSectionMatch = raw.match(/##\s+Tasks & Acceptance[\s\S]*?(?=\n##\s+|$)/i);
    if (taskSectionMatch) targetSection = taskSectionMatch[0];
  }
  if (targetSection) {
    for (const line of targetSection.split(/\r?\n/)) {
      const acMatch = line.trim().match(/^-\s*\[([ xX])\]\s*(.+)/);
      if (acMatch) {
        const text = acMatch[2].trim();
        const norm = text.toLowerCase();
        if (!seen.has(norm)) {
          seen.add(norm);
          criteria.push({ checked: acMatch[1].toLowerCase() === 'x', text });
        }
      }
    }
  }

  let userStory = '';
  const usMatch = raw.match(/(As a[\s\S]*?So that[^\r\n]+)/i);
  if (usMatch) userStory = usMatch[1].replaceAll('\r', '').trim();
  else {
    const descMatch = raw.match(/##\s+(?:Description|User Story|Overview & User Story|Overview|Intent)[\s\S]*?(?=\n##\s+|$)/i);
    if (descMatch) {
      userStory = descMatch[0]
        .replace(/^##\s+[^\r\n]+\r?\n/, '')
        .replaceAll(/<\/?frozen-after-approval[^>]*>/gi, '')
        .trim();
    }
  }

  results.stories.push({
    filename,
    filePath: filePath.replaceAll('\\', '/'),
    rawContent: raw,
    storyId,
    epicId: epicId || (storyId.includes('.') ? storyId.split('.')[0] : '1'),
    title,
    status,
    jiraKey,
    userStory,
    criteria,
    criteriaCount: criteria.length,
  });
}

/** One JIRA ticket per story id — implementation spec/story markdown only. */
export function filterJiraStorySpecs(stories) {
  const byId = new Map();
  for (const s of stories || []) {
    const fn = (s.filename || '').toLowerCase();
    if (!fn.startsWith('spec-') && !fn.startsWith('story-')) continue;
    const id = String(s.storyId || '').trim();
    if (!id) continue;
    const prev = byId.get(id);
    if (!prev || (s.rawContent || '').length > (prev.rawContent || '').length) {
      byId.set(id, s);
    }
  }
  return Array.from(byId.values()).sort((a, b) =>
    String(a.storyId).localeCompare(String(b.storyId), undefined, { numeric: true }),
  );
}

export function discoverStoriesAndEpicsFromWorkspace(workspaceFiles) {
  const results = { epics: [], stories: [] };
  for (const f of workspaceFiles) {
    if (!f || !f.filename || !String(f.filename).endsWith('.md')) continue;
    const filename = f.filename;
    const lower = filename.toLowerCase();
    const rel = workspaceRelativePath(f.folderPath, filename);
    const content = f.content || '';
    if (lower === 'epics.md') parseEpicsFromContent(content, results);
    else if (lower.startsWith('story-') || lower.startsWith('spec-')) {
      parseStoryFromContent(content, filename, rel, results);
    }
  }
  if (results.epics.length === 0 && results.stories.length > 0) {
    const epicMap = new Map();
    for (const s of results.stories) {
      const epicNum = s.epicId || s.storyId.split('.')[0] || '1';
      if (!epicMap.has(epicNum)) {
        epicMap.set(epicNum, {
          epicNum,
          title: `Epic ${epicNum}: Core Functionality`,
          summary: `Implementation Scope for Epic ${epicNum}`,
          description: `Generated from story breakdown in _acl-output/`,
          storyCount: 0,
        });
      }
      epicMap.get(epicNum).storyCount++;
    }
    results.epics = Array.from(epicMap.values());
  }
  return results;
}

const DOC_MAP = [
  { pattern: /^brief\.md$/i, type: 'Phase 1 · Product Brief', defaultTitle: 'Product Brief' },
  { pattern: /^prd\.md$/i, type: 'Phase 2 · PRD', defaultTitle: 'Product Requirements Document (PRD)' },
  { pattern: /^architecture(?:-spine)?\.md$/i, type: 'Phase 3A · Architecture Spine', defaultTitle: 'Architecture Spine' },
  { pattern: /^epics\.md$/i, type: 'Phase 3B · Epics & Stories', defaultTitle: 'Epics & User Stories Breakdown' },
  { pattern: /^design\.md$/i, type: 'Phase 2 · UX Design Spec', defaultTitle: 'UI/UX Visual Design Specification' },
  { pattern: /^experience\.md$/i, type: 'Phase 2 · User Experience', defaultTitle: 'User Experience & Interaction Spec' },
  { pattern: /^project-context\.md$/i, type: 'Project Context', defaultTitle: 'Project Context' },
];

/** Canonical phase docs only — no duplicate brief/prd paths. */
export function filterConfluencePhaseDeliverables(deliverables) {
  const bySlot = new Map();
  for (const d of deliverables || []) {
    const name = (d.filename || '').toLowerCase();
    const target = DOC_MAP.find((t) => t.pattern.test(name));
    if (!target && !d.confluencePageId) continue;
    const slot = target ? target.defaultTitle : name;
    const prev = bySlot.get(slot);
    if (!prev || (d.content || '').length > (prev.content || '').length) {
      bySlot.set(slot, d);
    }
  }
  return Array.from(bySlot.values());
}

const EXCLUDED_CHILD_NAMES = new Set([
  'skill.md',
  'agents.md',
  'readme.md',
  'changelog.md',
  'claude.md',
  'contributing.md',
  'security.md',
  'addendum.md',
  'sources.md',
  'review-triage.md',
  'patch-plan.md',
  'research.md',
  'test-summary.md',
  'sprint-status.md',
  'memlog.md',
  '.memlog.md',
]);

export function discoverDeliverablesFromWorkspace(workspaceFiles, mapping = {}) {
  const deliverables = [];
  for (const f of workspaceFiles) {
    if (!f || !f.filename || !String(f.filename).endsWith('.md')) continue;
    const entName = f.filename;
    const lower = entName.toLowerCase();
    if (entName.startsWith('.') || EXCLUDED_CHILD_NAMES.has(lower) || lower.includes('memlog')) continue;
    if (lower.startsWith('story-') || lower.startsWith('spec-')) continue;

    const full = workspaceRelativePath(f.folderPath, entName);
    if (full.includes('/imports/') || full.includes('/tests/')) continue;

    const target = DOC_MAP.find((t) => t.pattern.test(entName));
    const isMapped = Boolean(mapping.confluence && mapping.confluence[entName]);
    const isPlanningDir =
      full.includes('planning-artifacts') ||
      full.includes('1-analysis') ||
      full.includes('2-plan-workflows') ||
      full.includes('3-solutioning');

    if (!target && !isMapped && !isPlanningDir) continue;

    const content = f.content || '';
    let title = target ? target.defaultTitle : entName.replace(/\.md$/i, '').replaceAll(/[-_]+/g, ' ');
    let status = 'Approved';
    let confluencePageId = (mapping.confluence && mapping.confluence[entName]) || '';
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fmMatch) {
      const fm = fmMatch[1];
      const titleM = fm.match(/title:\s*["']?([^"'\r\n]+)["']?/i);
      if (titleM && !titleM[1].startsWith('fontFamily')) title = titleM[1].trim();
      const statusM = fm.match(/status:\s*["']?([^"'\r\n]+)["']?/i);
      if (statusM) status = statusM[1].trim();
      const cpM = fm.match(/confluence_page_id:\s*["']?([^"'\r\n]+)["']?/i);
      if (cpM) confluencePageId = cpM[1].trim();
    }

    deliverables.push({
      filename: entName,
      fullPath: full,
      relPath: full,
      type: target ? target.type : 'Planning Artifact',
      title,
      status,
      confluencePageId,
      sizeBytes: content.length,
      content,
      rawContent: content,
    });
  }
  return deliverables;
}
