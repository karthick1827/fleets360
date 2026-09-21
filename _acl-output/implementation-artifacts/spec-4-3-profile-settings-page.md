---
status: Approved
title: Profile settings page (Story 4.3)
type: feature
created: 2026-09-16
story_key: 4-3-profile-settings-page
baseline_commit: NO_VCS
context:
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Operators cannot confirm which account is signed in.

**Approach:** Protected `/profile` page reads identity from `getSessionIdentity()`; MVP read-only.

## Boundaries & Constraints

**Always:** Route behind `RequireAuth`; email from session record set at login.

**Never:** Password fields on profile page in MVP.

</frozen-after-approval>

## Code Map

- `src/pages/ProfileSettings.jsx` + `.css` — identity display + theme section
- `src/App.jsx` — `/profile` route inside authenticated group
- `src/auth/session.js` — `establishSession({ email })`, `getSessionIdentity()`
- `src/auth/loginUser.js` — passes email into session on stub login

## Tasks & Acceptance

**Execution:**
- [x] `/profile` route registered under auth layout
- [x] Page shows email from session
- [x] `RequireAuth` redirects unauthenticated visitors to `/login`

**Acceptance Criteria:**
- Given Profile settings from menu, when navigation completes, then URL is `/profile` with session
- Given on `/profile`, when page renders, then signed-in email shown (no password fields)
- Given no session, when visiting `/profile`, then redirect to `/login`

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-09-16: Story 4.3 implemented and verified
