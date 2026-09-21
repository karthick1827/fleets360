---
status: Approved
title: Theme preference (Story 4.4)
type: feature
created: 2026-09-16
story_key: 4-4-theme-preference
baseline_commit: NO_VCS
context:
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** No user-controlled light/dark preference across authenticated pages.

**Approach:** `src/theme/theme.js` persists `fleet360.theme` (`light` | `dark` | `system`); apply via `data-theme` on `documentElement`.

## Boundaries & Constraints

**Always:** Theme preference only in `localStorage`; session/auth stays in `sessionStorage` per AD-3.

**Never:** Store passwords or tokens in `localStorage`.

</frozen-after-approval>

## Code Map

- `src/theme/theme.js` — get/set/cycle/apply/init
- `src/styles/fleet-tokens.css` — `:root[data-theme='dark']` overrides
- `src/main.jsx` — `initTheme()` on boot
- `src/components/ProfileMenu.jsx` — cycle from menu
- `src/pages/ProfileSettings.jsx` — explicit theme buttons

## Tasks & Acceptance

**Execution:**
- [x] Theme module with `fleet360.theme` key
- [x] Dark token overrides in CSS
- [x] Menu cycle + profile page buttons
- [x] Boot-time apply in `main.jsx`

**Acceptance Criteria:**
- Given authenticated, when theme changed from menu or profile, then UI updates via tokens immediately
- Given theme set, when page reload, then same preference applied from localStorage
- Given sign-in, when session stored, then no auth secret in localStorage

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-09-16: Story 4.4 implemented and verified
