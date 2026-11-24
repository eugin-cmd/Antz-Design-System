---
id: DD-004
title: Icon system - which icons, where
status: accepted
accepted: 2026-11-24 (System Owner)
date: 2026-11-24
owner: System Owner
approver: System Owner (Eugin Robinson)
---

# DD-004 · Icon system: which icons, where

## Context
The system now holds four kinds of icon, drawn in different ways:

| Family | Where it lives | Drawing | Status |
| --- | --- | --- | --- |
| Component icons (`#i-name`) | `assets/site.js` sprite, used by every component | 79 icons: 44 drawn from ANTZ Rounded, 35 older outline icons | in use |
| ANTZ Rounded, line and filled | `icons/antz-rounded/line`, `filled` (from the ANTZ icon builder) | 207 + 207, 24px grid, 2px strokes | draft |
| Primary tile icons | `icons/antz-rounded/primary` (from the ANTZ icon builder) | 30 animated tile badges | draft |
| ANTZ Line animated | `icons/antz-rounded/primary-line` (tools/primary-line.mjs) | 118 outline icons, 48px grid, 1.5px strokes, one accent | proposal |

Several concepts exist in two or three drawings, the families render at different stroke weights, and nothing says
which to use where. Screens built today could mix them.

## Proposal

1. **Interface icons are ANTZ Rounded.** Controls, navigation, buttons, inputs, lists, tables and status use the
   component icons (`#i-name`), which are ANTZ Rounded line drawings wherever one exists. Filled is for the selected
   or active state of the same icon. No new icons from other sets: a missing icon is requested from the icon team.
   The 35 older outline icons, and the 10 with no true equivalent yet (check, help, home, shield, scan, trend,
   utensils, chef hat, dashboard, heart), move to ANTZ Rounded as the icon team draws them.
2. **Animated line icons are for moments, not controls.** Use them for module navigation (launcher, navigation
   drawer), empty states, onboarding and confirmations, at 48 to 72px. Never inside dense controls, lists, tables or
   form fields, and no more than one playing in view at a time.
3. **Animation plays once.** An animated icon plays once (2.8s) and rests on its final frame; it may replay on hover,
   keyboard focus or tap (`data-icon-replay`). Nothing loops, which meets WCAG 2.2.2 without a pause control. Where
   motion adds nothing, use the still version (`primary-line/static/`). Reduced motion shows the final frame.
4. **One module-navigation style per product.** Primary tile icons and animated line icons both serve module
   navigation. A product uses one of them, not both; the icon team recommends which becomes the default.
5. **One weight per size.** Interface icons render at the weight they are drawn: 2px on the 24px grid
   (`--icon-stroke` is 2, changed from 1.8 when this was accepted: a small, visible change to every component icon).
   Animated line icons are 1.5px on the 48px grid and are only shown at 48 to 72px.
6. **The icon team owns the drawings.** New icons and changes are drawn and checked in the ANTZ icon builder against
   its guardrails; the design system imports them (`icons/antz-rounded/SOURCE.md`). The animated line set moves into
   the builder so every icon has one source, one checker and one approval.
7. **Drafts are for prototypes.** Draft and proposal icons may be used in prototypes. Shipped products use approved
   icons, or a draft the icon team has signed off for that use.

## Consequences
- Designers and developers have one answer for "which icon": ANTZ Rounded for interface, animated line for moments.
- `--icon-stroke` 1.8 → 2 changed every component icon slightly; applied with this decision.
- The skill and `AGENTS.md` carry the rules.
- Open with the icon team (Roshni): a pushpin (`i-pushpin` is provisional, drawn for the module menu on 24 Nov 2026), the 10 missing component icons, approving the drafts, adopting the animated
  line set in the builder, and the default module-navigation style.
