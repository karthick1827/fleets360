---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T07:12:15.284Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Authenticate and redirect (Story 1.3)
type: feature
created: 2026-09-16
story_key: 1-3-authenticate-and-redirect
baseline_commit: NO_VCS
context:
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Operator credentials must be authenticated securely and lead to the post-login hub without leaking account existence on error.

**Approach:** Connect Login form to auth module stub (`loginUser`), establish session on success, navigate to `/home`, and display single uniform error message on failure.

## Boundaries & Constraints

**Always:** Generic error messages for bad credentials (AD-7); establish session records via `src/auth/session.js`.

**Never:** Field-specific credential errors or passwords in URLs/logs/unencrypted storage.

</frozen-after-approval>

## Code Map

- `src/pages/Login.jsx` — invokes `loginUser` on valid form submit
- `src/auth/loginUser.js` — handles credential validation and session establishment
- `src/auth/session.js` — session storage with TTL management

## Tasks & Acceptance

**Execution:**
- [x] Wire `loginUser` to submit handler
- [x] Establish session and redirect to `/home` on successful authentication
- [x] Generic error handling for invalid credentials

## Acceptance Criteria

- [x] Given valid credentials, when I submit Login, then a Session is established per AD-3 and I am navigated to `/home`
- [x] Given invalid credentials, when I submit Login, then a single generic error is displayed without account enumeration

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-09-16: Story 1.3 implemented and verified
