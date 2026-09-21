---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T07:09:42.913Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Auth module and session guard (Stories 3.2, 1.3, 1.4, 2.3)
type: feature
created: 2026-09-16
story_key: 3-2-auth-module-and-session-guard
baseline_commit: pending
context:
  - ../../../_acl-output/planning-artifacts/architecture/architecture-fleets360-2026-09-16/ARCHITECTURE-SPINE.md
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Hub and domain routes were reachable without a session; Login navigated to `/home` without establishing auth per AD-2/AD-3.

**Approach:** Add `src/auth/` session + login stub and router guards; Login calls auth module instead of bare `navigate`.

## Boundaries & Constraints

**Always:** No passwords in URLs/logs; generic credential error on Login (AD-7); guards on `/home`, `/devices`, `/sites`, `/users`; dev session flag in `sessionStorage` only until httpOnly API exists.

**Ask First:** Real auth API base URL and cookie contract.

**Never:** Long-lived tokens in `localStorage`; fetch/token logic inside `Login.jsx` beyond calling `loginUser`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid login | Valid email + password | Session established; redirect to `/home` or `from` | N/A |
| Invalid login | Bad email or empty password | Stay on Login; generic error | Single message |
| No session | Visit `/home` | Redirect to `/login` | N/A |
| Expired session | `exp` past TTL on refresh | Redirect to `/login` with expiry message | Clear session |
| Authenticated guest | Visit `/login` | Redirect to `/home` | N/A |

</frozen-after-approval>

## Code Map

- `src/App.jsx` — wrap protected routes with `RequireAuth`, login with `GuestOnly`
- `src/pages/Login.jsx` — call `loginUser`, show errors and session-expired flash
- `src/auth/session.js` — sessionStorage expiry record (dev stub)
- `src/auth/loginUser.js` — dev stub login; `VITE_AUTH_STUB=false` blocks until API wired
- `src/api/authClient.js` — `VITE_AUTH_API_URL` placeholder for production

## Tasks & Acceptance

**Execution:**
- [x] `src/auth/session.js` — session TTL helpers
- [x] `src/auth/loginUser.js` — stub login + uniform errors
- [x] `src/auth/RequireAuth.jsx` / `GuestOnly.jsx` — route guards
- [x] `src/App.jsx` — apply guards
- [x] `src/pages/Login.jsx` — wire auth + messaging

**Acceptance Criteria:**
- Given no session, when visiting `/home`, then redirect to `/login`
- Given valid dev credentials, when submitting Login, then land on `/home` with session
- Given expired session, when refreshing `/home`, then redirect to `/login` with expiry notice

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log
