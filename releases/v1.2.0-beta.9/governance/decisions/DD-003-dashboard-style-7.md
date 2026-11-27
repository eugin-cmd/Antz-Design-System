---
id: DD-003
title: Dashboard pieces from Antz Home style 7
status: accepted
date: 2026-11-23
owner: System Owner
---

# DD-003 · Dashboard pieces from Antz Home style 7

## Context
The System Owner asked to adopt every style from Antz Home style 7 (home, menus, edit board, Command Centre, tablet and mobile, Hospital overview, patients and incoming) that the system did not yet have.

## Adopted
Photo hero with side scrim and glass stats, compact photo card with glass chips, dashboard widgets (sky, teal, ink, mint and glow fills), bar charts, inset stat tiles, a figure split, small period pills, an edit-board mode with remove badges, quick-add tiles, photo tiles in a scrolling strip, icon tabs, a week strip and day agenda, a module grid, a module-home card in the side nav, a greeting with weather, and a score strip with a label.

## Adapted, and why
- **Status tiles are flat, not gradients.** Style 7 shows Critical, Emergencies and Prescriptions due on coral and amber gradients. Our rule is that gradients never carry status (ANTZ-GRD-02), so the tiles use the status colours, which pass AA in all four modes.
- **The score strip does not move by itself.** An endlessly scrolling ticker fails WCAG 2.2.2 (Pause, Stop, Hide) and exceeds the 500ms motion ceiling. It scrolls when people swipe or use the keyboard instead.
- **Dark mode is designed for every piece.** Style 7 is light only. Text on the mint widget always uses the ink made for light fills; the warm figure on the ink widget is checked for contrast.
- **Hover zooms became a lift** (`--motion-lift`), because the system has no scale token.

## Already in the system (not duplicated)
Date badge, list rows, segmented controls with counts, status chips, tables, dock and bottom navigation, menus and tooltips, the tag in glass (`.tag--glass`), module tiles, the aurora and glow gradients.
