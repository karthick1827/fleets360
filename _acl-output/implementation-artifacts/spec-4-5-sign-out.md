---
status: Approved
title: Sign out (Story 4.5)
type: feature
created: 2026-09-16
story_key: 4-5-sign-out
baseline_commit: NO_VCS
context:
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** No explicit sign-out from the authenticated shell.

**Approach:** `signOut()` in `src/auth/` clears session; menu navigates to `/login` with `replace: true`.

## Boundaries & Constraints

**Always:** Sign out logic in auth module; guards continue to block protected routes.

**Never:** Leave session record in `sessionStorage` after sign out.

</frozen-after-approval>

## Code Map

- `src/auth/signOut.js` — calls `clearSession('logout')`
- `src/auth/session.js` — `clearSession`, `hasValidSession`
- `src/components/ProfileMenu.jsx` — `handleSignOut`
- `src/auth/RequireAuth.jsx` — redirect when session missing

## Tasks & Acceptance

**Execution:**
- [x] `signOut()` exported from auth layer
- [x] Profile menu sign out clears session and routes to login
- [x] No confirmation dialog for MVP

**Acceptance Criteria:**
- Given authenticated, when Sign out chosen, then session cleared and land on `/login`
- Given signed out, when visiting protected URLs, then redirect to `/login`
- Given open menu, when Sign out activated, then single action (no extra confirm)

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-09-16: Story 4.5 implemented and verified
