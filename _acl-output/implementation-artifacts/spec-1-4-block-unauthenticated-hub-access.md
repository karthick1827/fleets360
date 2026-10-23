---
jira_key: EW-27
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T07:12:15.284Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Block unauthenticated hub access (Story 1.4)
type: feature
created: 2026-09-16
story_key: 1-4-block-unauthenticated-hub-access
baseline_commit: NO_VCS
context:
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Protected routes must not be accessible to unauthenticated guests or expired sessions.

**Approach:** Implement `RequireAuth` route guard in React Router to intercept unauthorized navigation and redirect to `/login`.

## Boundaries & Constraints

**Always:** Guard all protected routes (`/home`, `/profile`, `/devices`, `/sites`, `/users`). Preserve sessions across browser refresh.

**Never:** Allow protected content to flash before redirect.

</frozen-after-approval>

## Code Map

- `src/auth/RequireAuth.jsx` — checks `hasValidSession()` and redirects unauthenticated users
- `src/auth/session.js` — validates session expiration and validity
- `src/App.jsx` — nests protected routes inside `RequireAuth`

## Tasks & Acceptance

**Execution:**
- [x] Protect `/home`, `/profile`, `/devices`, `/sites`, `/users` behind `RequireAuth`
- [x] Unauthenticated visits redirect to `/login`
- [x] Session maintained on page reload

## Acceptance Criteria

- [x] Given I have no Session, when I visit `/home`, `/profile`, `/devices`, `/sites`, or `/users`, then I am redirected to `/login`
- [x] Given I have a valid Session, when I refresh `/home`, then I remain on Landing and am not sent to Login

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-09-16: Story 1.4 implemented and verified
