---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T06:43:37.634Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
name: Fleet 360
description: Web login and landing hub — Figma Fleet-360_BK Web canvas (nodes 1228:11322, 227:3884).
created: "2026-09-16"
updated: "2026-09-16"
colors:
  primary: '#E50026'
  navy: '#264072'
  neutral-dark: '#1E2A2C'
  neutral-30: '#515D6D'
  input-border: '#AFC3BC'
  white: '#FFFFFF'
typography:
  body:
    fontFamily: 'Roboto'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '24px'
  label:
    fontFamily: 'Roboto'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '20px'
  welcome:
    fontFamily: 'Inter'
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '24px'
  hero-title:
    fontFamily: 'Roboto'
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '24px'
  card-title:
    fontFamily: 'Roboto'
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '28px'
rounded:
  sm: 6px
  pill: 100px
spacing:
  login-panel-width: 327px
  card-icon-gap: 24px
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.white}'
    radius: '{rounded.sm}'
    height: 48px
  button-pill:
    background: '{colors.primary}'
    foreground: '{colors.white}'
    radius: '{rounded.pill}'
  input:
    border: '{colors.input-border}'
    radius: '{rounded.sm}'
    height: 48px
---

## Brand & Style

Fleet 360 is an operations web product: industrial credibility on Login (hero photography + deep blue gradient), clarity and approachability on Landing (color wordmark + neutral body on white, hub on slate panel). ACL Digital appears only as “Powered by” on Login.

Source: [Figma Fleet-360_BK](https://www.figma.com/design/FE12zdGPJ4ROng1HfhL55c/Fleet-360_BK--1-?node-id=104-7811).

## Colors

- **Primary red** `{colors.primary}` — Login CTA, hub card pills.
- **Navy** `{colors.navy}` — Landing welcome headline.
- **Neutral dark** `{colors.neutral-dark}` — Body copy on white.
- **Neutral 30** `{colors.neutral-30}` — Landing hub band background.
- **Login gradient** — `linear-gradient(-90deg, …)` over hero image (see `fleet-tokens.css`).

## Typography

Roboto for UI and hub; Inter for “Welcome to” line. No decorative fonts.

## Layout & Spacing

- **Viewport reference:** 1366×768 (desktop-first).
- **Login:** Left column form `{spacing.login-panel-width}`; full-bleed hero + gradient right.
- **Landing:** Hero row (logo + copy); fixed-height hub band 272px with three 282px card columns.

## Components

Exported assets live in `src/assets/fleet360/` (see `imports/figma-asset-manifest.md`). Use SVG logos and icons from Figma export; do not redraw.

## Do's and Don'ts

- **Do** use committed Figma exports for logos and 48×48 hub icons.
- **Do** keep CTA labels from design (“Manage Devices”, not generic “Get Started” on implemented build).
- **Don't** ship TotalView / Early Access legacy layers from hidden Figma groups.
