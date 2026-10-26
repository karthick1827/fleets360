---
status: In Review
title: Auth module and session guard (Stories 3.2, 1.3, 1.4, 2.3)
type: feature
created: 2026-10-26
story_id: 3.2
epic_id: 3
jira_key: FLEETS-15
tier: Tier 1 (Self-Contained)
---

# Story 3.2: Auth module and session guard (Stories 3.2, 1.3, 1.4, 2.3)

## Description

**Problem:** Hub and domain routes were reachable without a session; Login navigated to `/home` without establishing auth per AD-2/AD-3.

**Approach:** Add `src/auth/` session + login stub and router guards; Login calls auth module instead of bare `navigate`.

## Acceptance Criteria

- [x] `src/auth/session.js` — session TTL helpers
- [x] `src/auth/loginUser.js` — stub login + uniform errors
- [x] `src/auth/RequireAuth.jsx` / `GuestOnly.jsx` — route guards
- [x] `src/App.jsx` — apply guards
- [x] `src/pages/Login.jsx` — wire auth + messaging

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-10-26: Story 3.2 imported from JIRA board ticket FLEETS-15 (Status: In Review).
