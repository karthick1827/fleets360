---
status: In Review
title: Domain placeholder shells
type: feature
created: 2026-10-26
story_id: 3.3
epic_id: 3
jira_key: FLEETS-16
tier: Tier 1 (Self-Contained)
---

# Story 3.3: Domain placeholder shells

## Description

**Problem:** Hub card CTAs for Devices, Sites, and Users must not lead to 404 dead-ends before Phase 2 domain modules are built.

**Approach:** Implement `Placeholder.jsx` domain shells that render the module title, explanatory description, and a link back to `/home`.

## Acceptance Criteria

- [x] Given I am authenticated, when I open `/devices`, `/sites`, or `/users`, then I see a titled shell with one-line description and link back to `/home`
- [x] Given I am on a placeholder shell, when I click Back to Hub, then I navigate to `/home` with session intact

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-10-26: Story 3.3 imported from JIRA board ticket FLEETS-16 (Status: In Review).
