---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T09:56:13.452Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
  - step-02-design-epics-navbar-2026-09-16
  - step-03-create-stories-navbar-2026-09-16
  - step-04-final-validation-navbar-2026-09-16
inputDocuments:
  - _acl-output/planning-artifacts/prds/prd-fleets360-2026-09-16/prd.md
  - _acl-output/planning-artifacts/prds/prd-fleets360-2026-09-16/addendum.md
  - _acl-output/planning-artifacts/architecture/architecture-fleets360-2026-09-16/ARCHITECTURE-SPINE.md
  - _acl-output/planning-artifacts/ux-designs/ux-fleets360-2026-09-16/DESIGN.md
  - _acl-output/planning-artifacts/ux-designs/ux-fleets360-2026-09-16/EXPERIENCE.md
  - _acl-output/planning-artifacts/ux-designs/ux-fleets360-2026-09-16/imports/figma-asset-manifest.md
  - _acl-output/planning-artifacts/briefs/brief-fleets360-2026-09-16/brief.md
created: "2026-09-16"
updated: "2026-09-16"
---

# fleets360 - Epic Breakdown

## Overview

This document decomposes Fleet 360 **Login + Landing MVP** (PRD FR-1–FR-8) and **authenticated app chrome** (FR-9–FR-13), UX spines, and architecture AD-1–AD-11 into implementable epics and stories. Epics 1–3 and **Epic 4** (navbar, profile menu, theme, sign out) are implemented in the repo.

## Requirements Inventory

### Functional Requirements

FR-1: Operator can enter email and password on Login with labeled fields (“Enter Email”, “Enter Password”); empty/invalid email blocked; password masked.
FR-2: Valid credentials establish a Session and navigate to Landing; invalid credentials show generic error; unauthenticated users cannot reach protected routes; no password in URL/logs/plain storage.
FR-3: Forgot Password link from Login opens recovery flow with keyboard focus and visible desktop layout; submission acknowledged or stub documented.
FR-4: Login shows Terms & Privacy notice visible at 1366×768 without scroll; links resolve.
FR-5: Authenticated Landing matches Figma `227:3884` hero, body, three cards (titles, descriptions, CTAs per design export).
FR-6: Card CTAs navigate to `/devices`, `/sites`, `/users`; browser back preserves session.
FR-7: Refresh on Landing keeps valid session; expired session redirects to Login.
FR-8: Login shows “Powered by” ACL Digital attribution at 1366×768.
FR-9: Authenticated App navbar on protected routes; absent on Login and Forgot Password.
FR-10: Profile menu from navbar with Profile settings, Theme, and Sign out (keyboard accessible).
FR-11: Profile settings view at `/profile` shows signed-in identity (MVP read-only).
FR-12: Theme preference (light / dark / system) applies immediately and persists without storing credentials.
FR-13: Sign out clears Session and redirects to Login; protected routes blocked afterward.

### NonFunctional Requirements

NFR-1 (SM-1 / security): HTTPS in deployed environments; auth API rate limiting assumed server-side.
NFR-2 (accessibility): Login labels associated with inputs; focus order email → password → actions; hub icons decorative with adjacent text.
NFR-3 (AD-3): No passwords or long-lived tokens in localStorage; prefer httpOnly session cookie when API exists.
NFR-4 (AD-6): Shared design tokens in `fleet-tokens.css`; avoid one-off hex outside tokens.
NFR-5 (AD-7): Auth failures use uniform `{ code, message }` at client boundary; user-safe Login messaging.
NFR-6 (chrome a11y): Profile control and menu support keyboard operation (open, navigate, Escape dismiss, visible focus).

### Additional Requirements

- AD-1: Canonical routes `/login`, `/home`, `/profile`, `/devices`, `/sites`, `/users`, `/forgot-password`; `/` → `/login`.
- AD-2: Session gate on `/home`, `/profile`, and domain routes; redirect to `/login` when missing/expired.
- AD-8: `AuthenticatedLayout` renders navbar + `<Outlet />`; guest routes exclude chrome.
- AD-9: Theme key `fleet360.theme` in `localStorage` (`light` | `dark` | `system`).
- AD-10: `ProfileMenu` component; profile settings page at `/profile`.
- AD-11: `signOut()` in `src/auth/` clears session; navigate to `/login` with replace.
- AD-4: Auth/API logic in `src/auth/` and `src/api/`, not inside page components.
- AD-5: Visual assets only from `src/assets/fleet360/` per Figma manifest.
- Stack: React 19, Vite 8, react-router-dom 7.x (ratified in spine).
- Static deploy: `vite build` → `dist/`; auth API hosted separately when introduced.

### UX Design Requirements

UX-DR1: Implement Login visual per Figma `1228:11322` using committed hero, logos, gradient, and form styling tokens.
UX-DR2: Implement Landing per Figma `227:3884` — color wordmark, welcome typography (Inter + Roboto), slate hub band `#515D6D`.
UX-DR3: Hub uses exported 48×48 SVGs for Devices, Sites, Users (no redrawn icons).
UX-DR4: Primary buttons use `--fleet-primary` (#E50026); inputs use `--fleet-input-border`.
UX-DR5: Desktop reference 1366×768; hub cards stack below 900px width (EXPERIENCE responsive note).
UX-DR6: Microcopy matches EXPERIENCE.md (legal line, card descriptions, CTA labels from design export).

### FR Coverage Map

| FR | Epic | Story |
| --- | --- | --- |
| FR-1 | 1 | 1.1 |
| FR-2 | 1 | 1.3, 1.4 |
| FR-3 | 1 | 1.2 |
| FR-4 | 1 | 1.1 |
| FR-8 | 1 | 1.1 |
| FR-5 | 2 | 2.1 |
| FR-6 | 2 | 2.2 |
| FR-7 | 1, 2 | 1.4, 2.3 |
| NFR-3, AD-2 | 3 | 3.1, 3.2 |
| AD-4 | 3 | 3.2, 3.3 |
| UX-DR1–6 | 1, 2 | 1.1, 2.1 |
| FR-9 | 4 | 4.1 |
| FR-10 | 4 | 4.2 |
| FR-11 | 4 | 4.3 |
| FR-12 | 4 | 4.4 |
| FR-13 | 4 | 4.5 |
| AD-8–AD-11 | 4 | 4.1–4.5 |
| NFR-6 | 4 | 4.2 |

## Epic List

1. **Epic 1: Secure operator entry** — Operator can sign in, recover access, and meet legal/branding requirements on Login.
2. **Epic 2: Landing hub orientation** — Authenticated operator sees Fleet 360 value prop and enters Devices, Sites, or Users.
3. **Epic 3: Protected navigation shell** — Session guard and domain route shells follow architecture spine.
4. **Epic 4: Authenticated app chrome** — Navbar and profile menu for settings, theme, and sign out on all protected routes.

---

## Epic 1: Secure operator entry

Operators can authenticate through a Figma-faithful Login screen with validation, legal notice, ACL branding, and a path to password recovery.

### Story 1.1: Login screen UI and validation (FR-1, FR-4, FR-8, UX-DR1, UX-DR4)

As an **Operator**,
I want a Login screen that matches the approved design with working form validation,
So that I can enter credentials confidently and understand legal terms before signing in.

**Acceptance Criteria:**

**Given** I am on `/login` at 1366×768 viewport  
**When** the page loads  
**Then** I see Fleet 360 logo, email/password fields with labels, Login button, legal copy, and ACL “Powered by” footer using assets from `src/assets/fleet360/`  
**And** empty submit shows validation feedback and invalid email format is rejected before submit  

**Given** I focus the form  
**When** I tab through controls  
**Then** focus order is email → password → Forgot Password → Login → legal links  

### Story 1.2: Forgot password entry (FR-3)

As an **Operator**,
I want to open Forgot Password from Login,
So that I can start recovering access without contacting support.

**Acceptance Criteria:**

**Given** I am on `/login`  
**When** I activate “Forgot Password?”  
**Then** I navigate to `/forgot-password`  
**And** the page explains next steps (email sent or MVP stub message per product decision)  

### Story 1.3: Authenticate and redirect (FR-2)

As an **Operator**,
I want successful login to take me to the Landing hub,
So that I can choose where to work next.

**Acceptance Criteria:**

**Given** valid credentials (API or approved dev stub behind feature flag)  
**When** I submit Login  
**Then** a Session is established per AD-3 and I am navigated to `/home`  
**And** invalid credentials show one generic error with no field-specific leak  

### Story 1.4: Block unauthenticated hub access (FR-2, FR-7, AD-2)

As the **system**,
I want protected routes to require a Session,
So that operators cannot view the hub without signing in.

**Acceptance Criteria:**

**Given** I have no Session  
**When** I visit `/home`, `/profile`, `/devices`, `/sites`, or `/users`  
**Then** I am redirected to `/login`  

**Given** I have a valid Session  
**When** I refresh `/home`  
**Then** I remain on Landing and am not sent to Login  

---

## Epic 2: Landing hub orientation

Authenticated operators see the Fleet 360 welcome experience and can navigate to each domain area.

### Story 2.1: Landing hero and hub layout (FR-5, UX-DR2, UX-DR3, UX-DR6)

As an **Operator**,
I want the Landing hub to match the approved Figma layout and copy,
So that I understand product value and available areas.

**Acceptance Criteria:**

**Given** I am authenticated on `/home`  
**When** the page renders  
**Then** I see color Fleet 360 logo, “Welcome to Fleet 360”, body copy, and three cards (Devices, Sites, Users) with descriptions and pill CTAs per design export  
**And** hub icons load from `src/assets/fleet360/icon-*.svg`  

### Story 2.2: Hub card navigation (FR-6)

As an **Operator**,
I want each hub card CTA to open the correct domain route,
So that I can start work in Devices, Sites, or Users.

**Acceptance Criteria:**

**Given** I am on `/home`  
**When** I click Manage Devices / Manage Sites / Manage Users  
**Then** I navigate to `/devices`, `/sites`, or `/users` respectively  
**And** browser Back returns me to `/home` with Session intact  

### Story 2.3: Session expiry handling on hub (FR-7)

As an **Operator**,
I want clear behavior when my session expires,
So that I am not left on a broken hub screen.

**Acceptance Criteria:**

**Given** my Session has expired  
**When** I load or refresh `/home`  
**Then** I am redirected to `/login` with an optional message  

---

## Epic 3: Protected navigation shell

Application routing and placeholders follow the architecture spine and keep auth logic out of pages.

### Story 3.1: Canonical route table (AD-1)

As a **developer**,
I want a single route map in the app shell,
So that URLs match the architecture spine and PRD.

**Acceptance Criteria:**

**Given** the app boots  
**When** I visit `/`  
**Then** I am redirected to `/login`  
**And** routes exist for `/login`, `/home`, `/forgot-password`, `/profile`, `/devices`, `/sites`, `/users` as documented in AD-1  

### Story 3.2: Auth module and session guard (AD-2, AD-3, AD-4, NFR-3)

As a **developer**,
I want session checks in `src/auth/` (and API client in `src/api/` when wired),
So that pages stay presentation-only and tokens are stored safely.

**Acceptance Criteria:**

**Given** `src/auth/` exists with guard helper used by router  
**When** protected routes render  
**Then** Login page does not import fetch logic for token storage in localStorage  
**And** production path documents httpOnly cookie integration point  

### Story 3.3: Domain placeholder shells

As an **Operator**,
I want each domain route to show a minimal shell with title and back link,
So that hub CTAs never dead-end before Phase 2 modules.

**Acceptance Criteria:**

**Given** I am authenticated  
**When** I open `/devices`, `/sites`, or `/users`  
**Then** I see a titled shell with one-line description and link back to `/home`  

---

## Epic 4: Authenticated app chrome

Operators see consistent top navigation on protected pages and can manage account preferences or end their session from a profile menu.

### Story 4.1: Authenticated layout and app navbar (FR-9, AD-8)

As an **Operator**,
I want a navbar on every authenticated screen,
So that I always have access to account actions while working in the hub or domain shells.

**Acceptance Criteria:**

- [x] **Given** I am authenticated on `/home`, `/devices`, `/sites`, or `/users` **When** the page loads **Then** I see the app navbar above the page content.
- [x] **Given** I am on `/login` or `/forgot-password` **When** the page loads **Then** the app navbar is not shown.
- [x] **Given** `AuthenticatedLayout` wraps protected routes **When** I navigate between protected routes **Then** the navbar persists without full-page remount flicker.

### Story 4.2: Profile menu UI and accessibility (FR-10, AD-10, NFR-6)

As an **Operator**,
I want a profile menu in the navbar,
So that I can reach settings, theme, and sign out without hunting for controls.

**Acceptance Criteria:**

- [x] **Given** I am authenticated **When** I activate the profile control **Then** a menu opens with **Profile settings**, **Theme**, and **Sign out**.
- [x] **Given** the menu is open **When** I press Escape or activate outside **Then** the menu closes and focus returns to the profile control.
- [x] **Given** the menu is open **When** I use keyboard navigation **Then** I can reach each menu item and activate it.

### Story 4.3: Profile settings page (FR-11, AD-10)

As an **Operator**,
I want a profile settings screen,
So that I can confirm which account I am signed in as.

**Acceptance Criteria:**

- [x] **Given** I choose **Profile settings** from the menu **When** navigation completes **Then** I am on `/profile` behind the session guard.
- [x] **Given** I am on `/profile` **When** the page renders **Then** I see my signed-in email or display label from the session (no password fields).
- [x] **Given** I have no Session **When** I visit `/profile` **Then** I am redirected to `/login`.

### Story 4.4: Theme preference (FR-12, AD-9, AD-6)

As an **Operator**,
I want to change the application theme,
So that the UI matches my lighting preference and stays consistent across pages.

**Acceptance Criteria:**

- [x] **Given** I am authenticated **When** I use **Theme** from the profile menu (or on `/profile`) **Then** the theme updates immediately on authenticated pages using `fleet-tokens.css`.
- [x] **Given** I set a theme **When** I reload the browser **Then** the same theme is applied (`fleet360.theme` in `localStorage`).
- [x] **Given** I sign in **When** credentials are stored **Then** no password or long-lived auth token is written to `localStorage` (AD-3).

### Story 4.5: Sign out (FR-13, AD-11)

As an **Operator**,
I want to sign out from the profile menu,
So that the next person using this workstation cannot access my session.

**Acceptance Criteria:**

- [x] **Given** I am authenticated **When** I choose **Sign out** **Then** my Session is cleared via `src/auth/` and I land on `/login`.
- [x] **Given** I signed out **When** I visit `/home`, `/profile`, `/devices`, `/sites`, or `/users` **Then** I am redirected to `/login`.
- [x] **Given** the profile menu is open **When** I activate **Sign out** **Then** no extra confirmation step is required for MVP.

---

## Validation Summary (Step 4)

- **FR coverage:** FR-1 through FR-13 mapped to stories; no orphan FRs.
- **NFR / AD coverage:** AD-1–AD-11 addressed via Epics 1–4; SSO and real Devices module deferred per spine.
- **Dependencies:** Epic 4 builds on Epic 3 (`AuthenticatedLayout`, session guard). Stories 4.1–4.5 implemented in `src/layouts/`, `src/components/`, `src/pages/ProfileSettings.jsx`, `src/theme/`, `src/auth/signOut.js`.
- **Delivery:** Epics 1–4 acceptance criteria satisfied in repo; re-validate on regression before release.
