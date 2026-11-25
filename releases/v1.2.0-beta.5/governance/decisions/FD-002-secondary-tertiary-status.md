---
id: FD-002
title: Secondary teal, tertiary navy; status colours are status only
date: 2026-11-22
status: accepted
class: foundational
owner: System Owner
affects: [color.secondary.*, color.tertiary.*, color.success|warning|caution|danger|info.*, hue.*]
versions: { introduced: 1.0.0-beta.1 }
---

## Decision
- **Secondary: teal, key #00D9C7.** It absorbs #00D6C9 (dashboard) and #00ABAB / #00AEA4 (Style 6/7, Foundation) into one generated family. Use: supporting accents, avatars, highlights.
- **Tertiary: navy, key #1F415B.** The deep anchor: feature cards (`.card--navy`), structure, selected navigation. Already the dashboard's table text, Style 7's feature fill and the colour library's tertiary.
- **Status:** warning = coral #FA6140, caution = amber #E4B819, danger = red #E93353, info = sky #00AFD6, success = olive green (key #81B52E, hue 130). The brand green never means a status (rule ANTZ-COL-04).
- Product code uses semantic names (`--color-warning-*`, `--color-tertiary-*`), never Material "tertiary" directly, because the dashboard used "Tertiary" for coral.

## Why
Green, teal and navy are the combination the colour library was generated from, so dark and high-contrast versions already exist and pass AA. Separating success from the brand keeps status meaningful next to brand surfaces.
