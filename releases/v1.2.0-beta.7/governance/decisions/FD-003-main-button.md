---
id: FD-003
title: Main button is #37BD69 with a #00210C label
date: 2026-11-22
status: accepted
class: foundational
owner: System Owner
affects: [button, fab, icon-btn--solid, MUI containedPrimary, React Native primary action]
versions: { introduced: 1.0.0-beta.1 }
amends: [Antz Library v2 D1]
---

## Context
D1 made every main button Primary green #37BD69 with a white label. White on #37BD69 is 2.43:1 and fails WCAG AA at every text size.

## Decision
Option A: keep the brand fill, change the label to #00210C (7.07:1). Hover and pressed use 8% and 12% ink state layers (#33B162, #30AA5E), which still pass. The button looks the same in light and dark themes. In high contrast the fill moves to tone 30 with a white label.

## Alternative considered
Option B: #006D35 fill with a white label (6.48:1). Rejected because the brand colour would leave every main action.

## Reconsidered (2026-11-24)
The System Owner reviewed white labels on main buttons again: #37BD69 with white (2.43:1, fails), #008944 (4.50:1), a new #007B3C (5.39:1) and #006D35 (6.48:1). A #008944 version was built and checked, then withdrawn before release. Decision: keep FD-003, the brand fill with the #00210C label, so the brand colour stays on every main action.
