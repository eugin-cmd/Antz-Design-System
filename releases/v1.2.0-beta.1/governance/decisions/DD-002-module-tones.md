---
id: DD-002
title: Module tones for navigation, module bands and launcher tiles
status: accepted
date: 2026-11-23
owner: System Owner
---

# DD-002 · Module tones

## Context
The Kitchen and Diet web app (kitchen-diet-web) gives each product module its own soft tint. The tint shows in the hamburger navigation drawer, the active rail tab, the strip behind page headers and the round launcher tiles. The System Owner asked for these elements and styles to be added to the system.

## Decision
- **Seven module tones** (green, amber, navy, slate, violet, rose and coral), each a tint pair, an active-tab pair and an ink, built only from existing primitives. Light uses the tints and softened wash stops. Dark uses night surfaces and night washes.
- **Suggested assignment:** Diet green, Kitchen amber, Inventory navy, Invoices and Procurement slate, MIS violet, Security rose, Admin coral. A product can reassign them, but keeps one tone per module everywhere.
- **Current tone:** set with `data-tone`. The tone gradients (`--gradient-tone-panel`, `-tab`, `-band`) re-resolve on any `[data-tone]` element; the build emits them there.
- **Five launch gradients** for round module tiles, each keeping a white icon at 3:1 or more. The reference site's gold and coral tiles were darkened to meet this.
- **A display headline gradient** (large text only) and a **petrol** feature gradient for entity headers.

## Guardrails
- Tones are **identity only**: never status, data or emphasis. Rose is not danger.
- The build checks every ink on its tints, and body and secondary text on every tint, in all four modes: 154 new checks.
- Tone changes fade over `--duration-slower` (500ms, the motion ceiling); the reference used 600ms.

## Consequences
New components: the navigation drawer, the module band, the launcher (a round variant of `.tile-module`), the entity header and side-nav group headings. 11 new icons. No token or class removed or renamed.
