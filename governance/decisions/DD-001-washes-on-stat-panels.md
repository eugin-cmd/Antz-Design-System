---
id: DD-001
title: The four washes may back stat panels, chosen by meaning
date: 2026-11-22
status: accepted
class: minor
owner: Design System Maintainers
affects: [stat-row--boxed, gradient-wash-*, rule ANTZ-GRD-02]
versions: { introduced: 1.1.0-beta.1 (planned) }
amends: [ANTZ-GRD-02 "one wash per screen"]
---

## Context
Stat panels (a boxed row of figures) looked flat on dashboards. The System Owner asked to use the four washes as their backgrounds.

## Decision
- Add `.stat-row--wash-primary | -celebrate | -calm | -illustrative`. Labels switch to `--color-text-secondary` on a wash (the muted grey is under 4.5:1 on three of the four).
- Choose the wash by meaning and keep it per topic: primary = general summaries, celebrate = good news only, calm = operational and neutral figures, illustrative = onboarding and featured panels.
- At most two different washes visible on one screen. Mortality, alerts and overdue figures never sit on celebrate.
- The token build checks brand figures (3:1, large) and text and secondary labels (4.5:1) on all six wash stops in all four modes (72 checks).

## Alternatives considered
Rotating washes freely for variety: rejected, because the colour would carry no meaning and some pairings (deaths on a festive wash) are inappropriate.
