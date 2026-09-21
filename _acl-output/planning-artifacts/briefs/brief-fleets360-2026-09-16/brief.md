---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T09:28:17.717Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: "Product Brief: Fleet 360"
project_type: greenfield
created: "2026-09-16"
updated: "2026-09-16"
---

# Product Brief: Fleet 360

## Executive Summary

Fleet 360 is a web product for people who need a single place to see and control operational assets spread across locations. The Figma Login and Landing screens (Fleet-360_BK, Web canvas) define the first two beats of that experience: a credentialed gate, then a hub that names the work as **Devices**, **Sites**, and **Users**.

The landing promise is explicit: *complete visibility into your data, total control over your insights*, delivered as secure, real-time analytics. Login is not a marketing page; it is a controlled entry with email/password, password recovery, and legal acceptance, **Powered by ACL Digital**.

This brief exists to lock *what* those two screens are selling before PRD and UX work expand into the rest of the file (device cards, dashboards). The repo today is a React + Vite starter named `fleets360`; the product definition comes from design, not from implemented features.

## The Problem

Operators of distributed equipment cannot treat “the building,” “the box,” and “who is allowed to touch it” as one system. They hop between vendor portals, spreadsheets, and tribal knowledge. Landing copy attacks that split: devices need unified control and live insight; sites need hierarchy and instant oversight; users need roles *per site* with granular access.

Without a gated, shared web hub, the cost is delayed response, inconsistent access, and no single picture of what is running where. [ASSUMPTION] The pain is strongest for facility or fleet operators of HVAC/RTU-class equipment at named sites (inferred from later frames in the same Figma file, not from Login/Landing copy itself).

## The Solution

A **1366×768 web** application:

1. **Login** — Email and password, Forgot Password, Login, and agreement to Terms and Privacy. Brand lockup plus ACL Digital attribution. Industrial plant imagery signals operations, not consumer SaaS.
2. **Landing (post-welcome hub)** — “Welcome to Fleet 360” plus the visibility/control promise. Three equal entry cards:
   - **Devices** — unified control and real-time insights; CTA *Get Started*
   - **Sites** — site oversight and visual hierarchy; CTA *Learn More*
   - **Users** — assign roles per site with granular access; CTA *Learn More*

The product is the hub those cards open into, not the cards alone.

## What Makes This Different

Honest from these two screens: the differentiator is **one authenticated surface for devices, sites, and users**, with site-scoped roles called out on the Users card. That is an execution and information-architecture bet, not a claimed technical moat.

Do not treat leftover **TotalView / Early Access** layers in the file as live brand. Current visible brand is **Fleet 360** + **ACL Digital**. Nearby Rheem innovation copy sits off these frames; it is not part of this brief unless product confirms a customer-specific skin.

## Who This Serves

- **Primary:** Site or fleet operators who need to find devices, understand site structure, and act without waiting on a specialist. Success: they sign in and reach Devices, Sites, or Users in one hop.
- **Secondary:** Admins who grant access. Success: they can assign roles per site from the Users path.
- **Buyer / sponsor:** [ASSUMPTION] Operations or digital leadership at an industrial/OEM or facilities organization (ACL Digital as builder; end customer not named on these screens).

## Success Criteria

- Authenticated users reach the Landing hub after valid credentials; invalid credentials fail closed. [ASSUMPTION] email/password is sufficient for v1 (no SSO shown).
- Landing makes Devices, Sites, and Users equally discoverable; each CTA routes to that domain.
- Legal: Login cannot complete without the stated Terms and Privacy notice being present.
- [ASSUMPTION] Time-to-first-hub under 30 seconds for a returning user; password reset is reachable without a support ticket.

## Scope

**In (from Login + Landing)**

- Web login: email, password, forgot password, primary Login, Terms & Privacy, ACL Digital lockup
- Authenticated landing hub: Fleet 360 welcome, value line, Devices / Sites / Users cards and CTAs
- Navigation contract: Get Started (Devices) vs Learn More (Sites, Users) as designed

**Out (unless a later brief/PRD expands)**

- Dashboards, device cards, RTU telemetry, set points, maps, Excel export (present elsewhere in Figma)
- Mobile/native, self-serve signup, SSO/MFA (not on these frames)
- Reinstating TotalView “Early Access” branding

## Vision

If the hub works, Fleet 360 becomes the default control plane for a customer’s sites: every device sits in a place, every person has a role there, and insight is live rather than exported. Login and Landing are the front door to that plane, not the product’s ceiling.

## Feature addition: Authenticated app navbar with profile menu (2026-09-16)

### Problem

After sign-in, operators move between `/home`, `/devices`, `/sites`, and `/users` without a consistent chrome for account actions. There is no visible way to adjust preferences (e.g. theme), open profile-related settings, or sign out without clearing session manually.

### Scope (in)

- A **navbar** shown on all **authenticated** routes (Landing hub and domain placeholder shells), not on Login or Forgot Password.
- **Profile dropdown** (avatar or user affordance) with three working actions:
  - **Profile settings** — navigates to a dedicated settings view or modal where the operator can see/edit basic profile preferences (MVP: view signed-in identity and placeholder for future fields).
  - **Theme** — toggles light/dark (or system) theme using existing design tokens; preference persists across refresh within AD-3 storage rules (no secrets in localStorage).
  - **Sign out** — clears Session per `src/auth/` and redirects to `/login`.
- Keyboard-accessible menu (open, navigate items, dismiss); focus management for the dropdown.
- Visual treatment aligned with Fleet 360 tokens (`fleet-tokens.css`) and hub aesthetic.

### Scope (out)

- Full profile CRUD against a live user API (deferred until backend exists).
- SSO, MFA, or org-level theme policies.
- Navbar links to every future module beyond current AD-1 routes.

### Success criteria

- Authenticated users see the navbar on protected pages; unauthenticated users never do.
- Each dropdown item performs its stated action without errors.
- Sign out returns the user to Login and blocks return to protected routes until re-authentication.
- Theme change is visible immediately and survives page reload for the same browser profile.
