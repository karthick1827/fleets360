---
status: In Review
title: Authenticated layout and app navbar
type: feature
created: 2026-10-26
story_id: 4.1
epic_id: 4
jira_key: FLEETS-17
tier: Tier 1 (Self-Contained)
---

# Story 4.1: Authenticated layout and app navbar

## Description

**Problem:** Protected pages had no shared chrome for account actions.

**Approach:** Render `AppNavbar` inside `AuthenticatedLayout` above `<Outlet />`; guest routes stay outside this layout.

## Acceptance Criteria

- [x] `AuthenticatedLayout` renders navbar + main outlet
- [x] Protected routes nested under layout in `App.jsx`
- [x] Guest routes exclude layout

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-10-26: Story 4.1 imported from JIRA board ticket FLEETS-17 (Status: In Review).
