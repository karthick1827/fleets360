---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T07:12:15.284Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Canonical route table (Story 3.1)
type: feature
created: 2026-09-16
story_key: 3-1-canonical-route-table
baseline_commit: NO_VCS
context:
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Applications need unambiguous URL mappings for guest and authenticated screens adhering to AD-1 invariants.

**Approach:** Configure central route table in `src/App.jsx` with routes for `/login`, `/forgot-password`, `/home`, `/profile`, `/devices`, `/sites`, `/users`, and root redirect `/` to `/login`.

## Boundaries & Constraints

**Always:** Follow kebab-case naming for URL paths. Group protected routes under auth guards.

**Never:** Allow undefined routes to show blank screens without fallback routing.

</frozen-after-approval>

## Code Map

- `src/App.jsx` — central route table definition
- `src/main.jsx` — React Router browser router container

## Tasks & Acceptance

**Execution:**
- [x] Configure routes for `/login`, `/forgot-password`, `/home`, `/profile`, `/devices`, `/sites`, `/users`
- [x] Configure `/` to redirect to `/login`
- [x] Maintain separation between guest and authenticated layouts

## Acceptance Criteria

- [x] Given the app boots, when I visit `/`, then I am redirected to `/login`
- [x] Given canonical routes exist, when visited, then routes match `/login`, `/home`, `/forgot-password`, `/profile`, `/devices`, `/sites`, `/users` as documented in AD-1

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-09-16: Story 3.1 implemented and verified
