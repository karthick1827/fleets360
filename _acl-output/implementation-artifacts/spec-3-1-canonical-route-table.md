---
status: In Review
title: Canonical route table
type: feature
created: 2026-10-26
story_id: 3.1
epic_id: 3
jira_key: FLEETS-14
tier: Tier 1 (Self-Contained)
---

# Story 3.1: Canonical route table

## Description

**Problem:** Applications need unambiguous URL mappings for guest and authenticated screens adhering to AD-1 invariants.

**Approach:** Configure central route table in `src/App.jsx` with routes for `/login`, `/forgot-password`, `/home`, `/profile`, `/devices`, `/sites`, `/users`, and root redirect `/` to `/login`.

## Acceptance Criteria

- [x] Given the app boots, when I visit `/`, then I am redirected to `/login`
- [x] Given canonical routes exist, when visited, then routes match `/login`, `/home`, `/forgot-password`, `/profile`, `/devices`, `/sites`, `/users` as documented in AD-1

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-10-26: Story 3.1 imported from JIRA board ticket FLEETS-14 (Status: In Review).
