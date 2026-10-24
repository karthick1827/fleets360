---
jira_key: EW-106
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T07:12:15.284Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Landing hero and hub layout (Story 2.1)
type: feature
created: 2026-09-16
story_key: 2-1-landing-hero-and-hub-layout
baseline_commit: NO_VCS
context:
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Authenticated operators need a centralized hub after sign-in that introduces the system and presents direct access to operational domains.

**Approach:** Build `/home` Landing hub matching Figma frame `227:3884` with welcome hero and three cards: Devices, Sites, and Users.

## Boundaries & Constraints

**Always:** Use exported 48×48 SVGs for cards (`icon-devices.svg`, `icon-sites.svg`, `icon-users.svg`). Follow typography rules (Inter for welcome, Roboto for body).

**Never:** Use redrawn or placeholder icons that deviate from Figma specifications.

</frozen-after-approval>

## Code Map

- `src/pages/Landing.jsx` — landing view, hero greeting, hub cards
- `src/pages/Landing.css` — slate band, 3-column grid, responsive card stacking
- `src/assets/fleet360/` — color logo and domain icons

## Tasks & Acceptance

**Execution:**
- [x] Render Landing hero with color Fleet 360 logo and welcome copy
- [x] Display slate hub band with Devices, Sites, and Users cards
- [x] Cards contain icon, title, description, and pill CTA

## Acceptance Criteria

- [x] Given I am authenticated on `/home`, when the page renders, then I see color Fleet 360 logo, "Welcome to Fleet 360", body copy, and three cards (Devices, Sites, Users)
- [x] Given viewing the hub band, when inspected, then hub icons load from `src/assets/fleet360/icon-*.svg`
- [x] Given viewport width under 900px, when rendered, then hub cards stack cleanly into a single column

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-09-16: Story 2.1 implemented and verified
