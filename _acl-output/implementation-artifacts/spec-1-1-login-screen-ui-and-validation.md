---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T07:12:15.284Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Login screen UI and validation (Story 1.1)
type: feature
created: 2026-09-16
story_key: 1-1-login-screen-ui-and-validation
baseline_commit: NO_VCS
context:
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Operators need an authenticated entry point matching Figma visual identity with responsive desktop layout and client-side form validation.

**Approach:** Implement `/login` page with Figma-exported assets, HTML5 and accessible input validation, password masking, legal acceptance, and ACL Digital branding.

## Boundaries & Constraints

**Always:** Use committed SVG/PNG assets in `src/assets/fleet360/`. Preserve 1366×768 desktop viewport compliance without vertical scrollbar.

**Never:** Store plain text passwords or tokens in browser storage during login.

</frozen-after-approval>

## Code Map

- `src/pages/Login.jsx` — login form layout, state, error handling, validation
- `src/pages/Login.css` — split-screen styling, hero gradient, responsive rules
- `src/assets/fleet360/` — login wordmark, ACL digital logo, login-hero photography

## Tasks & Acceptance

**Execution:**
- [x] Login screen with labeled email & password fields
- [x] Input validation blocking empty submission and invalid email formats
- [x] Password masked input with keyboard accessibility
- [x] Terms & Privacy agreement copy and links
- [x] ACL Digital "Powered by" branding footer

## Acceptance Criteria

- [x] Given I am on `/login` at 1366×768 viewport, when the page loads, then I see Fleet 360 logo, email/password fields with labels, Login button, legal copy, and ACL "Powered by" footer
- [x] Given I focus the form, when I tab through controls, then focus order is email → password → Forgot Password → Login → legal links
- [x] Given invalid or empty inputs, when submitting, then browser validation stops submission and shows actionable feedback

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-09-16: Story 1.1 implemented and verified
