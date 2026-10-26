---
status: In Review
title: Authenticate and redirect
type: feature
created: 2026-10-26
story_id: 1.3
epic_id: 1
jira_key: FLEETS-9
tier: Tier 1 (Self-Contained)
---

# Story 1.3: Authenticate and redirect

## Description

**Problem:** Operator credentials must be authenticated securely and lead to the post-login hub without leaking account existence on error.

**Approach:** Connect Login form to auth module stub (`loginUser`), establish session on success, navigate to `/home`, and display single uniform error message on failure.

## Acceptance Criteria

- [x] Given valid credentials, when I submit Login, then a Session is established per AD-3 and I am navigated to `/home`
- [x] Given invalid credentials, when I submit Login, then a single generic error is displayed without account enumeration

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-10-26: Story 1.3 imported from JIRA board ticket FLEETS-9 (Status: In Review).
