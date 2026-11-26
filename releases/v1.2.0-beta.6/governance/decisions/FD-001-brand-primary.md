---
id: FD-001
title: Brand primary is #37BD69
date: 2026-11-22
status: accepted
class: foundational
owner: System Owner
affects: [color.primitive green.*, color.accent.*, color.brand.primary, button, tabs, switch, checkbox, progress]
versions: { introduced: 1.0.0-beta.1 }
supersedes: [lime #52F990 as a brand colour (Foundation v0.2, Home Style 6/7)]
---

## Context
Antz used several greens: #37BD69 in the dashboard code, the colour library seed and the onboarding guide; lime #52F990 in Foundation v0.2 and Home Style 6/7; and near-duplicates #36BC69 and #38BD69. #37BD69 measures 2.43:1 on white, so it fails as text, thin lines and small icons on light surfaces.

## Decision
- #37BD69 is the Antz brand primary, pinned as `green.brand` in `tokens/src/primitive/color.json`. The build fails if it changes.
- On light surfaces it is a **fill** (`--color-accent`) with `--color-text-on-accent` (#00210C, 7.07:1) on it.
- Brand-coloured text and outlines use tone 40 #006D35 (6.48:1). Thin indicators use tone 50 #008944 (4.5:1). Focus uses tone 40.
- In dark theme #37BD69 stays the fill (7.61:1 on the page); brand text uses tone 80 #5EDF86.
- Lime #52F990, #36BC69 and #38BD69 are retired (rule ANTZ-COL-03).

## Alternatives considered
Lime as primary (fails as a fill with white; off-brand for the product); #006D35 as the main fill (passes with white, but hides the brand colour).

## Consequences
Main buttons change from white labels to dark labels (FD-003). Components use indicator tokens for thin elements.
