---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T07:12:15.284Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Domain placeholder shells (Story 3.3)
type: feature
created: 2026-09-16
story_key: 3-3-domain-placeholder-shells
baseline_commit: NO_VCS
context:
  - ../../../_acl-output/planning-artifacts/epics.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Hub card CTAs for Devices, Sites, and Users must not lead to 404 dead-ends before Phase 2 domain modules are built.

**Approach:** Implement `Placeholder.jsx` domain shells that render the module title, explanatory description, and a link back to `/home`.

## Boundaries & Constraints

**Always:** Provide title, one-line description, and back link to `/home` for all domain shells.

**Never:** Dead-end user flows with empty pages or unstyled default 404s.

</frozen-after-approval>

## Code Map

- `src/pages/Placeholder.jsx` — shared shell component for domain placeholders
- `src/pages/Placeholder.css` — styling for placeholder shell
- `src/App.jsx` — wires placeholder shells to `/devices`, `/sites`, and `/users` routes

## Tasks & Acceptance

**Execution:**
- [x] Create reusable domain placeholder component
- [x] Configure routes for Devices, Sites, and Users to render placeholder
- [x] Ensure return link takes operator safely back to `/home`

## Acceptance Criteria

- [x] Given I am authenticated, when I open `/devices`, `/sites`, or `/users`, then I see a titled shell with one-line description and link back to `/home`
- [x] Given I am on a placeholder shell, when I click Back to Hub, then I navigate to `/home` with session intact

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-09-16: Story 3.3 implemented and verified
