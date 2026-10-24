---
jira_key: EW-108
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T07:12:15.284Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Session expiry handling on hub (Story 2.3)
type: feature
created: 2026-09-16
story_key: 2-3-session-expiry-handling-on-hub
baseline_commit: NO_VCS
context:
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** If an operator's session expires while they are idle or refreshing the hub, the application must safely terminate the session and redirect to Login.

**Approach:** Verify session TTL in `RequireAuth` and `session.js`; redirect expired sessions to `/login` with an informational notice.

## Boundaries & Constraints

**Always:** Clear stale session artifacts on expiry detection. Provide clean redirect without error popups.

**Never:** Allow protected data to remain cached in DOM on session expiry.

</frozen-after-approval>

## Code Map

- `src/auth/session.js` — validates session expiration against TTL
- `src/auth/RequireAuth.jsx` — catches expired session and redirects
- `src/pages/Login.jsx` — displays optional expired session flash message

## Tasks & Acceptance

**Execution:**
- [x] Check TTL on route transitions and page refresh
- [x] Clear expired session record
- [x] Redirect to `/login` with clean user messaging

## Acceptance Criteria

- [x] Given my Session has expired, when I load or refresh `/home`, then I am redirected to `/login`
- [x] Given an expired session redirect, when landing on `/login`, then session state is fully cleared

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-09-16: Story 2.3 implemented and verified
