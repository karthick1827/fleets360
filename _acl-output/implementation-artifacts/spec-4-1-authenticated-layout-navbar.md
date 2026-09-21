---
status: Approved
title: Authenticated layout and app navbar (Story 4.1)
type: feature
created: 2026-09-16
story_key: 4-1-authenticated-layout-navbar
baseline_commit: NO_VCS
context:
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Proble:** Protected pages had no shared chrome for account actions.

**Approach:** Render `AppNavbar` inside `AuthenticatedLayout` above `<Outlet />`; guest routes stay outside this layout.

## Boundaries & Constraints

**Always:** Navbar only under `RequireAuth` + `AuthenticatedLayout`. Sticky top bar using fleet tokens.

**Never:** Import navbar from `Login` or `ForgotPassword`.

</frozen-after-approval>

## Code Map

- `src/layouts/AuthenticatedLayout.jsx` — shell + outlet
- `src/layouts/AuthenticatedLayout.css` — flex column layout
- `src/components/AppNavbar.jsx` + `.css` — brand link to `/home`
- `src/App.jsx` — protected route group wraps layout

## Tasks & Acceptance

**Execution:**
- [x] `AuthenticatedLayout` renders navbar + main outlet
- [x] Protected routes nested under layout in `App.jsx`
- [x] Guest routes exclude layout

**Acceptance Criteria:**
- Given authenticated on `/home`, `/devices`, `/sites`, or `/users`, when page loads, then navbar appears above content
- Given `/login` or `/forgot-password`, when page loads, then navbar is absent
- Given navigation between protected routes, when routing, then navbar persists (layout not remounted)

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-09-16: Story 4.1 implemented and verified
