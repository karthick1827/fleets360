---
status: Approved
title: Profile menu UI and accessibility (Story 4.2)
type: feature
created: 2026-09-16
story_key: 4-2-profile-menu
baseline_commit: NO_VCS
context:
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** No entry point for settings, theme, or sign out from the hub.

**Approach:** `ProfileMenu` in navbar with disclosure pattern; keyboard support per NFR-6.

## Boundaries & Constraints

**Always:** Menu actions delegate to router, `theme.js`, or `signOut()` — no inline session storage.

**Never:** Hover-only activation.

</frozen-after-approval>

## Code Map

- `src/components/ProfileMenu.jsx` + `.css` — menu UI and handlers
- `src/components/AppNavbar.jsx` — hosts `ProfileMenu`

## Tasks & Acceptance

**Execution:**
- [x] Profile trigger with `aria-haspopup`, `aria-expanded`
- [x] Menu items: Profile settings, Theme, Sign out
- [x] Escape and outside click close menu; focus returns to trigger
- [x] Arrow Up/Down between menu items

**Acceptance Criteria:**
- Given authenticated, when profile control activated, then three menu items appear
- Given open menu, when Escape or outside click, then menu closes and focus on trigger
- Given open menu, when keyboard navigation, then each item reachable and activatable

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-09-16: Story 4.2 implemented and verified
