---
status: Approved
reviewed_by: Manager (via Markdown Studio)
review_timestamp: 2026-09-16T09:33:27.900Z
gate_signature: ACL-STUDIO-APPROVAL-APPROVED
title: Fleet 360
created: "2026-09-16"
updated: "2026-09-16"
sources:
  - _acl-output/planning-artifacts/briefs/brief-fleets360-2026-09-16/brief.md
  - _acl-output/planning-artifacts/briefs/brief-fleets360-2026-09-16/addendum.md
design:
  figma_file: FE12zdGPJ4ROng1HfhL55c
  login_node: "1228:11322"
  landing_node: "227:3884"
---

updated new

# PRD: Fleet 360
*Working title — Fleet 360 (web). MVP slice: authenticated entry and post-login hub per approved product brief.*

## 0. Document Purpose

This PRD is for product, engineering, UX, and QA implementing the **first shippable web slice** of Fleet 360: **Login**, **Landing hub**, and **authenticated app chrome** (navbar with profile menu). It builds on the approved product brief and addendum (Figma Fleet-360_BK, Web canvas). Vocabulary is fixed in §3 Glossary. Functional requirements use global IDs (FR-1…). Assumptions are tagged inline and listed in §9.

Downstream UX (`acl-ux`) should treat Figma nodes `1228:11322` (Login) and `227:3884` (Landing) as the visual source of truth for Login/Landing. Navbar and profile menu may extend hub tokens when no dedicated Figma node is named in the brief. Architecture and epics must not expand scope into device cards, dashboards, or telemetry unless this PRD is updated.

## 1. Vision

Fleet 360 is a web control surface for organizations that operate equipment across many physical **Sites**. Operators need one place to sign in, see what the product offers, and enter the **Devices**, **Sites**, or **Users** areas without juggling separate tools.

The MVP delivers the **front door**: credential-based **Login**, then an authenticated **Landing hub** that states the product promise—complete visibility into data and control over insights—and routes users into the three domains. **Powered by ACL Digital** appears on Login as platform attribution; customer-facing brand is **Fleet 360**.

Implementation target is a **desktop-first web** experience at **1366×768** (per design), in the existing `fleets360` React + Vite codebase, which is currently a starter with no auth or hub UI.

## 2. Target User

### 2.1 Jobs To Be Done

- **Sign in securely** so only authorized people reach operational data and actions.
- **Understand what Fleet 360 offers** immediately after auth (visibility, control, real-time analytics positioning).
- **Choose where to work**—devices, sites, or user access—without hunting in a menu.
- **Recover access** when credentials are forgotten, without filing a support ticket for the common case. `[ASSUMPTION: self-service reset flow exists backend-side or is stubbed with clear messaging in MVP.]`
- **Admins (secondary):** eventually assign **roles per Site** via the Users path; MVP only requires routing to that area, not full RBAC UI.

### 2.2 Non-Users (v1)

- Anonymous visitors (no public marketing site in scope).
- Mobile-native users (responsive behavior may follow design tokens later; MVP validates desktop layout).
- End customers configuring SSO IdP (SSO not in v1 UI). `[ASSUMPTION]`

### 2.3 Key User Journeys

- **UJ-1. Marcus signs in before his morning walkthrough.**
  - **Persona + context:** Marcus, site operations lead, uses a desktop browser at the facility office.
  - **Entry state:** Unauthenticated; bookmarked Login URL.
  - **Path:** Opens Login → enters email and password → reads Terms/Privacy notice → taps Login → lands on Landing hub.
  - **Climax:** Landing shows “Welcome to Fleet 360” and three domain cards; Marcus knows where to go next.
  - **Resolution:** Marcus clicks **Get Started** on Devices (primary funnel) or **Learn More** on Sites/Users.
  - **Edge case:** Wrong password → inline error, remain on Login, no partial session.

- **UJ-2. Priya returns after a week away.**
  - **Persona + context:** Priya, regional admin, forgot password.
  - **Entry state:** Unauthenticated on Login.
  - **Path:** Clicks **Forgot Password?** → completes reset flow `[ASSUMPTION: email link or stub screen with success path defined in implementation]`.
  - **Climax:** Can set or confirm new credentials and reach Landing.
  - **Resolution:** Same as UJ-1 on Landing.

- **UJ-3. James orients a new teammate (hub only).**
  - **Persona + context:** James, team lead, already authenticated.
  - **Entry state:** Lands on Landing after login.
  - **Path:** Reads value proposition copy → scans Devices / Sites / Users cards and CTAs.
  - **Climax:** James uses **Learn More** on Users to explain access model (“roles per site”).
  - **Resolution:** Navigates to placeholder or future Users module route; MVP may show “coming soon” only if explicitly agreed—default is route stub with brief copy, not dead link.

- **UJ-4. Marcus ends his shift and hands off the workstation.**
  - **Persona + context:** Marcus, site operations lead, shared office desktop.
  - **Entry state:** Authenticated on `/devices` after visiting the hub.
  - **Path:** Opens profile menu in the app navbar → chooses **Sign out** → confirms redirect to **Login**.
  - **Climax:** Protected routes are unreachable until Marcus signs in again.
  - **Resolution:** Next operator sees Login, not Marcus’s session.
  - **Alternate path:** Marcus opens profile menu → **Theme** toggles light/dark → preference persists after refresh; or **Profile settings** shows signed-in identity (email/display label) with room for future editable fields.

## 3. Glossary

- **Fleet 360** — Customer-facing product name on Landing and Login context.
- **ACL Digital** — Platform builder; “Powered by” attribution on Login.
- **Login** — Unauthenticated screen for email/password sign-in and legal notice.
- **Landing hub** — First authenticated screen after successful Login; welcome hero plus three domain cards.
- **Site** — A physical or logical location that groups **Devices** and scoped **Users** / roles.
- **Device** — Operational asset managed in the Devices domain (e.g. HVAC/RTU in later Figma frames; not implemented in this MVP).
- **User (domain)** — People and access management, including roles **per Site**.
- **Operator** — Primary persona using Login and Landing to reach daily work.
- **Session** — Authenticated browser state after successful Login until logout or expiry.
- **App navbar** — Persistent top chrome on authenticated routes; hosts product identity and account affordances.
- **Profile menu** — Dropdown from the navbar profile control; entries for profile settings, theme, and sign out.

## 4. Features

### 4.1 Authentication (Login)

**Description:** Presents Fleet 360 entry with email and password fields, primary Login action, Forgot Password link, and mandatory legal copy. Visual treatment includes industrial operations imagery and ACL Digital footer. Realizes UJ-1, UJ-2. Hidden Figma layers (TotalView, Early Access, Remember Me) are **not** shipped unless product reopens them.

**Functional Requirements:**

#### FR-1: Email and password capture

An **Operator** can enter email and password on **Login** with labeled fields matching design (“Enter Email”, “Enter Password”).

**Consequences (testable):**
- Empty required fields block submit and show validation feedback.
- Email field rejects obviously invalid formats before submit.
- Password field masks input.

#### FR-2: Authenticate and establish session

An **Operator** with valid credentials can submit **Login** and receive an authenticated **Session**, then be navigated to the **Landing hub**.

**Consequences (testable):**
- Invalid credentials return a generic failure message without revealing which field failed.
- Successful login does not expose password in URL, logs, or client storage in plain text.
- Unauthenticated users cannot access **Landing hub** routes (redirect to **Login**).

#### FR-3: Forgot password entry point

An **Operator** can open **Forgot Password?** from **Login** and enter a recovery flow.

**Consequences (testable):**
- Link is keyboard-focusable and visible on desktop layout.
- Recovery flow acknowledges submission (e.g. “check your email”) or documents MVP stub behavior in release notes.

#### FR-4: Legal notice on Login

**Login** displays copy that login implies agreement to **Terms and Conditions** and **Privacy Notice**, with links or placeholders to those documents.

**Consequences (testable):**
- Notice is visible without scrolling on 1366×768 for the primary form layout.
- Terms and Privacy targets resolve (URL or internal route); broken links fail QA.

**Feature-specific NFRs:**
- Accessibility: form labels associated with inputs; focus order email → password → actions.
- Security: HTTPS in deployed environments; `[ASSUMPTION]` rate limiting on auth API handled server-side.

### 4.2 Post-login hub (Landing)

**Description:** After **Session** is established, shows hero “Welcome to” / “Fleet 360”, value proposition about visibility, control, and secure real-time analytics, and three cards: **Devices**, **Sites**, **Users** with designed CTAs. Realizes UJ-1, UJ-3.

**Functional Requirements:**

#### FR-5: Landing content fidelity

An authenticated **Operator** sees **Landing hub** copy and structure aligned with Figma `227:3884` (hero, body text, three cards with titles and descriptions).

**Consequences (testable):**
- Devices card includes CTA label **Get Started**.
- Sites and Users cards include CTA label **Learn More**.
- Fleet 360 wordmark/hero treatment matches design within reasonable implementation tolerance.

#### FR-6: Domain navigation from cards

An **Operator** can activate each card’s CTA and navigate to a defined route for that domain.

**Consequences (testable):**
- Devices **Get Started** navigates to `/devices` or equivalent registered route.
- Sites **Learn More** navigates to `/sites` (or equivalent).
- Users **Learn More** navigates to `/users` (or equivalent).
- Browser back from child route returns to **Landing hub** without destroying **Session** unless logout occurred.

#### FR-7: Session persistence on Landing

An authenticated **Operator** refreshing **Landing hub** remains authenticated.

**Consequences (testable):**
- Refresh does not send user to **Login** while **Session** is valid.
- Expired **Session** redirects to **Login** with optional message.

**Notes:** `[NOTE FOR PM]` Clarify whether child routes are empty shells, marketing sub-pages, or blocked until Phase 2—default for MVP: routable shells with title + one-line description.

### 4.3 Platform chrome and branding

**Description:** Consistent Fleet 360 + ACL Digital presentation on Login; Fleet 360 emphasis on Landing.

#### FR-8: ACL Digital attribution

**Login** shows “Powered by” ACL Digital per design (`logo_acl_login`).

**Consequences (testable):**
- Attribution visible on Login at 1366×768.
- Not required to duplicate on Landing unless design specifies.

### 4.4 Authenticated app chrome (navbar and profile menu)

**Description:** After **Session** is established, operators see a consistent **App navbar** on protected routes (`/home`, `/devices`, `/sites`, `/users`, and profile settings). **Login** and **Forgot Password** do not show the navbar. A **Profile menu** exposes account actions without leaving the current task context. Realizes UJ-4.

**Functional Requirements:**

#### FR-9: Navbar on protected routes

An authenticated **Operator** sees the **App navbar** on every protected route in the MVP route table.

**Consequences (testable):**
- Navbar is absent on `/login` and `/forgot-password`.
- Navbar is present on `/home`, `/devices`, `/sites`, `/users`, and the profile settings route defined in architecture.
- Navbar does not render for unauthenticated visitors (session guard unchanged).

#### FR-10: Profile menu actions

An authenticated **Operator** can open the **Profile menu** from the navbar and choose **Profile settings**, **Theme**, or **Sign out**.

**Consequences (testable):**
- Menu opens and closes via pointer and keyboard; focus returns sensibly on dismiss.
- Menu items are labeled consistently (“Profile settings”, “Theme”, “Sign out” or equivalent approved copy).
- Activating an item performs the action associated with that item (FR-11, FR-12, FR-13).

#### FR-11: Profile settings entry

An **Operator** who chooses **Profile settings** reaches a dedicated **Profile settings** view (page or modal) showing at least the signed-in identity (e.g. email from session).

**Consequences (testable):**
- View is reachable only when authenticated; unauthenticated access redirects to **Login**.
- No password or long-lived secret is shown or stored in client-visible storage on this screen.
- Editable profile fields beyond identity display are optional for MVP; if not implemented, UI states that extended profile editing is coming later.

#### FR-12: Theme preference

An **Operator** can change application **Theme** (light and dark; system preference optional) from the **Profile menu** or from **Profile settings**.

**Consequences (testable):**
- Theme applies immediately across authenticated pages using shared design tokens.
- Theme preference persists across page reload in the same browser profile without storing credentials.
- Theme control does not break Login/Landing visual acceptance for routes that use hub tokens.

#### FR-13: Sign out

An **Operator** can **Sign out** from the **Profile menu**, ending the **Session** and returning to **Login**.

**Consequences (testable):**
- After sign out, visiting `/home`, `/devices`, `/sites`, or `/users` redirects to **Login**.
- Sign out clears client session state per architecture (no stale “authenticated” UI).
- Sign out is reachable in one action from the open profile menu (no nested confirmation required unless security review mandates it).

**Feature-specific NFRs:**
- Accessibility: profile control is keyboard operable; menu supports arrow-key navigation and Escape to close; visible focus indicators.
- Security: sign out must invalidate client session; no auth tokens left in plain localStorage (NFR-3 alignment).

## 5. Non-Goals (Explicit)

- Dashboards, device detail cards, RTU telemetry, set points, maps, Excel export (present later in Figma).
- Self-serve registration / sign-up.
- SSO, MFA, or social login in v1 UI.
- TotalView / “Early Access” legacy branding.
- Customer-specific OEM skins (e.g. Rheem copy off-canvas) without separate PRD.
- Native mobile apps.
- Full profile CRUD against a live user directory API.
- Org-wide enforced theme policies or per-site branding skins.

## 6. MVP Scope

### 6.1 In Scope

- **Login** UI and client-side validation; integration with auth API or agreed stub for demo.
- **Landing hub** UI and navigation to three domain routes.
- Session guard for authenticated routes.
- Forgot Password entry (full or stubbed backend).
- Terms & Privacy links.
- Figma-aligned desktop layout for Login and Landing.
- **App navbar** on authenticated routes with **Profile menu** (FR-9–FR-13).
- **Profile settings** identity view; **Theme** toggle with persistence; **Sign out**.

### 6.2 Out of Scope for MVP

- Full Devices/Sites/Users feature modules — routes may be placeholders (reason: brief scope).
- Real-time analytics data pipelines (reason: promise is positioning copy only on Landing).
- Role assignment UI (reason: Users card routes ahead of RBAC implementation).
- SSO (reason: not in design frames). `[NOTE FOR PM]` Revisit when enterprise pilot named.

## 7. Success Metrics

**Primary**

- **SM-1:** ≥95% of successful logins reach **Landing hub** within one navigation step. Validates FR-2.
- **SM-2:** 100% of QA cases show three domain cards with correct CTA labels. Validates FR-5.

**Secondary**

- **SM-3:** Median time from Login submit to interactive Landing ≤30s on staging. `[ASSUMPTION]` Validates FR-2, FR-5.
- **SM-4:** Forgot Password path reachable in ≤2 clicks from Login. Validates FR-3.
- **SM-5:** 100% of QA authenticated-route cases show navbar with working profile menu. Validates FR-9, FR-10.
- **SM-6:** Sign out from profile menu blocks protected routes in 100% of QA cases. Validates FR-13.

**Counter-metrics (do not optimize)**

- **SM-C1:** Login success rate without fraud checks weakened—do not bypass lockout or CAPTCHA policies to inflate SM-1.

## 8. Open Questions

1. Auth backend: existing IdP/API vs. temporary mock for UI-only sprint?
2. Post-login default: always **Landing hub**, or redirect power users to Dashboard when that exists?
3. **Get Started** vs **Learn More**—product intent for funnel vs. label parity?
4. Contracted end customer branding vs. ACL Digital-only shell?
5. HVAC/RTU as first vertical for copy in placeholder routes?
6. Canonical path for **Profile settings** (`/profile`, `/settings/profile`, or modal-only)—confirm in architecture spine.
7. Theme modes: light/dark only vs. include **system** preference in MVP.

## 9. Assumptions Index

- Email/password sufficient for v1; no SSO (§2.2, FR-2).
- Primary users are facility/fleet operators; HVAC/RTU inferred from later Figma, not Login/Landing copy (brief).
- Forgot password can be stubbed with clear UX if backend not ready (FR-3).
- Child domain routes may be shells until Phase 2 (FR-6 note).
- Desktop 1366×768 is the acceptance viewport (brief).
- Session expiry behavior follows standard token/session TTL `[ASSUMPTION: define TTL in architecture]`.
- Navbar/profile UI extends hub design tokens when Figma does not specify a frame (brief addendum 2026-09-16).
- Theme preference may use non-secret browser storage; credentials remain out of localStorage (FR-12, NFR-3).
- Profile settings MVP is read-only identity unless backend profile API exists (FR-11).
