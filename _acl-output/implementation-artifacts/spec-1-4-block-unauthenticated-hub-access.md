---
status: In Review
title: Block unauthenticated hub access
type: feature
created: 2026-10-26
story_id: 1.4
epic_id: 1
jira_key: FLEETS-10
tier: Tier 1 (Self-Contained)
---

# Story 1.4: Block unauthenticated hub access

## Description

**Problem:** Protected routes must not be accessible to unauthenticated guests or expired sessions.

**Approach:** Implement `RequireAuth` route guard in React Router to intercept unauthorized navigation and redirect to `/login`.

## Acceptance Criteria

- [x] Given I have no Session, when I visit `/home`, `/profile`, `/devices`, `/sites`, or `/users`, then I am redirected to `/login`
- [x] Given I have a valid Session, when I refresh `/home`, then I remain on Landing and am not sent to Login

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-10-26: Story 1.4 imported from JIRA board ticket FLEETS-10 (Status: In Review).
