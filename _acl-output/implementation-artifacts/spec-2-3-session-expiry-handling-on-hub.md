---
status: In Review
title: Session expiry handling on hub
type: feature
created: 2026-10-26
story_id: 2.3
epic_id: 2
jira_key: FLEETS-13
tier: Tier 1 (Self-Contained)
---

# Story 2.3: Session expiry handling on hub

## Description

**Problem:** If an operator's session expires while they are idle or refreshing the hub, the application must safely terminate the session and redirect to Login.

**Approach:** Verify session TTL in `RequireAuth` and `session.js`; redirect expired sessions to `/login` with an informational notice.

## Acceptance Criteria

- [x] Given my Session has expired, when I load or refresh `/home`, then I am redirected to `/login`
- [x] Given an expired session redirect, when landing on `/login`, then session state is fully cleared

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-10-26: Story 2.3 imported from JIRA board ticket FLEETS-13 (Status: In Review).
