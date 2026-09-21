---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T06:43:42.386Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Fleet 360 Experience
created: "2026-09-16"
updated: "2026-09-16"
sources:
  - _acl-output/planning-artifacts/prds/prd-fleets360-2026-09-16/prd.md
design_ref: DESIGN.md
---

# Fleet 360 — Login & Landing Experience

## Foundation

- **Form factor:** Desktop web (1366×768 reference), React 19 + Vite, CSS modules per page.
- **Visual identity:** `{design_ref}` tokens — primary `{colors.primary}`, hub background `{colors.neutral-30}`.

## Information Architecture

| Route | Screen | Figma node |
| --- | --- | --- |
| `/login` | Login | `1228:11322` |
| `/home` | Landing hub | `227:3884` |
| `/forgot-password` | Password recovery (shell) | — |
| `/devices`, `/sites`, `/users` | Domain shells | — |

## Voice and Tone

- **Login:** Direct, compliant (“By clicking login…”). White on blue; confident operations product.
- **Landing:** Aspirational but concrete — visibility, control, real-time analytics.

## Component Patterns

- **Text fields:** Label above, 48px height, `{components.input}` border.
- **Primary button:** Full-width on Login; pill on hub cards.
- **Hub card:** 48px icon + title + description + pill CTA.

## State Patterns

- **Login validation:** Block submit if email/password empty; show native validation.
- **Auth (MVP):** Successful submit navigates to `/home` (stub session).
- **Errors:** Invalid credentials — inline message (future FR-2).

## Interaction Primitives

- Forgot Password → `/forgot-password`.
- Hub CTAs → respective module routes.
- Legal links → placeholder anchors until legal URLs exist.

## Accessibility Floor

- Visible labels on all inputs; focusable links and buttons.
- Icon images on hub use `alt=""` with descriptive adjacent text.
- Target contrast: white on `{colors.neutral-30}` and `{colors.primary}` per design.

## Key Flows

**UJ-1 Marcus signs in** — `/login` → submit → `/home` with three cards visible.

**UJ-3 James orients teammate** — `/home` → read copy → **Manage Users** → `/users` shell.

## Responsive & Platform

- Hub stacks cards below 900px width; Login panel stays left-weighted with full-bleed background.
