---
title: "PRD Addendum: Fleet 360"
created: "2026-09-16"
---

# PRD Addendum — implementation and design references

## Figma traceability

| Artifact | fileKey | nodeId |
| --- | --- | --- |
| Login | `FE12zdGPJ4ROng1HfhL55c` | `1228:11322` |
| Landing | `FE12zdGPJ4ROng1HfhL55c` | `227:3884` |
| Web canvas | same | `104:7811` |

Design URL: https://www.figma.com/design/FE12zdGPJ4ROng1HfhL55c/Fleet-360_BK--1-?node-id=104-7811

Use Figma MCP (`get_design_context`) when implementing; adapt to React 19 + Vite project structure.

## Suggested route map (non-binding)

| Route | MVP behavior |
| --- | --- |
| `/login` | FR-1–FR-4 |
| `/` or `/home` | Landing hub (FR-5–FR-7), protected |
| `/devices` | Shell; CTA from Devices card |
| `/sites` | Shell; CTA from Sites card |
| `/users` | Shell; CTA from Users card |
| `/forgot-password` | FR-3 |
| `/profile` or `/settings` (TBD) | Profile settings shell (FR-11); confirm in architecture |

Exact paths to be confirmed in architecture spine.

## Navbar and profile menu (HOW — not FRs)

- Mount chrome via authenticated layout wrapper (e.g. `AuthenticatedLayout`), not on Login/Forgot Password routes.
- Profile menu: use accessible disclosure pattern (button + menu); avoid hover-only activation.
- Theme: persist non-secret key (e.g. `fleet360-theme`) in `localStorage` or `sessionStorage`; apply `data-theme` or class on `document.documentElement` aligned with `fleet-tokens.css`.
- Sign out: call existing `src/auth/` session clear + navigate to `/login`.
- Profile settings MVP: display email/label from session stub or API client; no password fields on this screen.

## Technical notes (HOW — not FRs)

- Repo: `fleets360`, React 19, Vite 8, oxlint; greenfield UI.
- Auth: store tokens per security review (httpOnly cookie vs. memory); no passwords in localStorage.
- Markdown Studio / ACL save middleware already in `vite.config.js` for `_acl-output` workflows.

## Deferred domain evidence (Phase 2+)

From same Figma file: Manage Devices cards (RTU IDs, set point, heating/cooling hours, location strings). Inform glossary and future PRD slices; excluded from FR numbering in this document.

## Brief open questions carried forward

See `prd.md` §8 — resolve before `acl-architecture` if SSO or Dashboard redirect affects spine.
