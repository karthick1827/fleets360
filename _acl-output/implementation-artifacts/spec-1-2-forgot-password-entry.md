---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T07:12:15.284Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Forgot password entry and MVP shells (Stories 1.2, 3.3, 1.1 validation)
type: feature
created: 2026-09-16
story_key: 1-2-forgot-password-entry
baseline_commit: NO_VCS
context:
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Forgot password was a generic placeholder; domain routes lacked descriptive shells; Login skipped browser validation feedback on empty submit.

**Approach:** Dedicated Forgot Password page with auth-layer stub; domain copy in App route table; `checkValidity` on Login form.

## Boundaries & Constraints

**Always:** Recovery logic in `src/auth/`; guest-only `/forgot-password`; generic success copy (no account enumeration).

**Ask First:** Real reset API contract.

**Never:** Email-specific failure messages that leak account existence.

</frozen-after-approval>

## Code Map

- `src/pages/ForgotPassword.jsx` + `.css` — FR-3 UI
- `src/auth/requestPasswordReset.js` — stub reset request
- `src/App.jsx` — route + domain shell copy
- `src/pages/Login.jsx` — HTML5 validation on submit

## Tasks & Acceptance

**Execution:**
- [x] `src/auth/requestPasswordReset.js` — stub
- [x] `src/pages/ForgotPassword.jsx` — page + back link
- [x] `src/App.jsx` — wire route and domain descriptions
- [x] `src/pages/Login.jsx` — validation feedback

**Acceptance Criteria:**
- Given `/login`, when Forgot Password is activated, then `/forgot-password` explains next steps
- Given authenticated user on `/devices`, when page loads, then title, description, back link appear

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-09-16: Post-approval polish — legal URL config (`src/config/legal.js`), hub stacks below 900px; sprint stories 1.1–3.3 marked done.

## Suggested Review Order

**Forgot password flow**

- Guest recovery page delegates to auth stub, not inline fetch.
  [`ForgotPassword.jsx:27`](../../../src/pages/ForgotPassword.jsx#L27)

**Domain shells**

- Route table supplies per-module copy for placeholder shells.
  [`App.jsx:8`](../../../src/App.jsx#L8)

**Login compliance**

- Legal link resolves via env-backed URL for FR-4.
  [`legal.js:2`](../../../src/config/legal.js#L2)

**Responsive hub**

- Cards stack in a column under 900px per UX spine.
  [`Landing.css:137`](../../../src/pages/Landing.css#L137)
