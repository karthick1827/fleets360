---
status: In Review
title: Login screen UI and validation
type: feature
created: 2026-10-26
story_id: 1.1
epic_id: 1
jira_key: FLEETS-7
tier: Tier 1 (Self-Contained)
---

# Story 1.1: Login screen UI and validation

## Description

**Problem:** Operators need an authenticated entry point matching Figma visual identity with responsive desktop layout and client-side form validation.

**Approach:** Implement `/login` page with Figma-exported assets, HTML5 and accessible input validation, password masking, legal acceptance, and ACL Digital branding.

## Acceptance Criteria

- [x] Given I am on `/login` at 1366×768 viewport, when the page loads, then I see Fleet 360 logo, email/password fields with labels, Login button, legal copy, and ACL "Powered by" footer
- [x] Given I focus the form, when I tab through controls, then focus order is email → password → Forgot Password → Login → legal links
- [x] Given invalid or empty inputs, when submitting, then browser validation stops submission and shows actionable feedback

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-10-26: Story 1.1 imported from JIRA board ticket FLEETS-7 (Status: In Review).
