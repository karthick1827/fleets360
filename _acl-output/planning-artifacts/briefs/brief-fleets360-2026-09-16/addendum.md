---
title: "Product Brief Addendum: Fleet 360"
created: "2026-09-16"
---

# Addendum — source extracts and parked detail

## Source frames

| Screen | File | Node | Size |
| --- | --- | --- | --- |
| Login | `FE12zdGPJ4ROng1HfhL55c` (Fleet-360_BK) | `1228:11322` | 1366×768 |
| Landing | same | `227:3884` | 1366×768 |
| Parent canvas | Web (`104:7811`) | | |

Figma URL: https://www.figma.com/design/FE12zdGPJ4ROng1HfhL55c/Fleet-360_BK--1-?node-id=104-7811

## Login — visible contract

- Fields: Email (“Enter Email”), Password (“Enter Password”), Forgot Password?, primary button (Login)
- Footer legal: “By clicking login, you hereby agree to our Terms and Conditions & Privacy Notice”
- “Powered by” ACL Digital
- Hidden/legacy layers in the same frame: TotalView logo, “Early Access”, “Remember Me” (hidden)
- Visual: dark operations photography (industrial plant / cooling towers)

## Landing — visible contract

Hero: “Welcome to / Fleet 360”  
Body: “Complete visibility into your data, total control over your insights. Empowering secure, real-time analytics with precision and speed.”

| Card | Copy | CTA (from screenshot) |
| --- | --- | --- |
| Devices | Manage devices effortlessly with unified control and real-time insights. | Get Started |
| Sites | Manage sites with seamless oversight and instant control with visual hierarchy | Learn More |
| Users | Assigns roles per site with granular access controls for easy user management. | Learn More |

## Context from the same file (not in brief scope)

Later Web frames show **Manage Devices** cards: RTU IDs (e.g. RTU F202401367), location strings, HVAC mode, set point, heating/cooling hours. Use in PRD/architecture as domain evidence, not as v1 scope of this brief.

Off-canvas text: “For 100 years, Rheem has been a leader in product innovation.” Treat as possible customer/OEM skin, unconfirmed.

## Repo note

`fleets360` is a React 19 + Vite 8 starter (`package.json` 0.0.0). No login/landing implementation in source at brief time. Implementation starts from greenfield UI against this design.

## Open questions for PRD

1. Email/password only, or enterprise SSO after Login?
2. Is Landing the first screen after auth, or is there a default Dashboard skip?
3. Devices “Get Started” vs Sites/Users “Learn More” — intentional funnel or incomplete CTA labels?
4. Who is the contracted customer vs ACL Digital platform brand?
5. Confirm HVAC/RTU as the first vertical vs generic “devices.”
