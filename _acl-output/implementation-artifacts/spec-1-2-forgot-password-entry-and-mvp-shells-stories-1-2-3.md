---
status: In Review
title: Forgot password entry and MVP shells (Stories 1.2, 3.3, 1.1 validation)
type: feature
created: 2026-10-26
story_id: 1.2
epic_id: 1
jira_key: FLEETS-8
tier: Tier 1 (Self-Contained)
---

# Story 1.2: Forgot password entry and MVP shells (Stories 1.2, 3.3, 1.1 validation)

## Description

**Problem:** Forgot password was a generic placeholder; domain routes lacked descriptive shells; Login skipped browser validation feedback on empty submit.

**Approach:** Dedicated Forgot Password page with auth-layer stub; domain copy in App route table; `checkValidity` on Login form.

## Acceptance Criteria

- [x] `src/auth/requestPasswordReset.js` — stub
- [x] `src/pages/ForgotPassword.jsx` — page + back link
- [x] `src/App.jsx` — wire route and domain descriptions
- [x] `src/pages/Login.jsx` — validation feedback

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-10-26: Story 1.2 imported from JIRA board ticket FLEETS-8 (Status: In Review).
