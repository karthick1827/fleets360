---
jira_key: EW-107
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T07:12:15.284Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Hub card navigation (Story 2.2)
type: feature
created: 2026-09-16
story_key: 2-2-hub-card-navigation
baseline_commit: NO_VCS
context:
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Operators need to navigate from the hub cards to their respective domain management modules.

**Approach:** Wire hub card pill buttons to navigate to `/devices`, `/sites`, and `/users`, preserving session on forward and back navigation.

## Boundaries & Constraints

**Always:** Use canonical routes defined in AD-1. Maintain session across route transitions.

**Never:** Hard-code anchor tags that cause full browser page reloads.

</frozen-after-approval>

## Code Map

- `src/pages/Landing.jsx` — card click handlers and CTA routing
- `src/App.jsx` — route registration for domain paths

## Tasks & Acceptance

**Execution:**
- [x] Wire Manage Devices CTA to `/devices`
- [x] Wire Manage Sites CTA to `/sites`
- [x] Wire Manage Users CTA to `/users`
- [x] Ensure browser Back button preserves session state

## Acceptance Criteria

- [x] Given I am on `/home`, when I click Manage Devices / Manage Sites / Manage Users, then I navigate to `/devices`, `/sites`, or `/users` respectively
- [x] Given I navigate from `/home` to a domain shell, when I click browser Back, then I return to `/home` with session intact

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-09-16: Story 2.2 implemented and verified
