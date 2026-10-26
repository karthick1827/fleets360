---
status: In Review
title: Landing hero and hub layout
type: feature
created: 2026-10-26
story_id: 2.1
epic_id: 2
jira_key: FLEETS-11
tier: Tier 1 (Self-Contained)
---

# Story 2.1: Landing hero and hub layout

## Description

**Problem:** Authenticated operators need a centralized hub after sign-in that introduces the system and presents direct access to operational domains.

**Approach:** Build `/home` Landing hub matching Figma frame `227:3884` with welcome hero and three cards: Devices, Sites, and Users.

## Acceptance Criteria

- [x] Given I am authenticated on `/home`, when the page renders, then I see color Fleet 360 logo, "Welcome to Fleet 360", body copy, and three cards (Devices, Sites, Users)
- [x] Given viewing the hub band, when inspected, then hub icons load from `src/assets/fleet360/icon-*.svg`
- [x] Given viewport width under 900px, when rendered, then hub cards stack cleanly into a single column

## Verification

**Commands:**
- `npm run build` — expected: success

## Spec Change Log

- 2026-10-26: Story 2.1 imported from JIRA board ticket FLEETS-11 (Status: In Review).
