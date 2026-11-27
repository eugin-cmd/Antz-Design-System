---
id: RFC-001
title: The checker reads developer code, and flags deprecated names
author: System Owner (with the design agent work)
date: 2026-11-27
class: minor
status: accepted
---

## The need
Web (Next.js + MUI) and React Native developers write styles as JS objects (`sx`, `style`, `StyleSheet.create`).
The checker read only CSS, HTML and CSS-in-JS strings, so an invented colour or font size in a developer's code went
unnoticed. Names kept only as aliases (`priority__opt--emergency`, `record-hero__stats`) had no warning either.

## What exists today
`tools/check.mjs` with rules ANTZ-COL/TOK/TYP/SPC/SHP/ELV/MOT/GRD/A11Y. No JS object parsing; no deprecation list.

## Proposal
1. Read literal values in MUI `sx={{…}}`, `style={{…}}` (also inside a style array), `styled(…)({…})`,
   `makeStyles`/`createStyles` and React Native `StyleSheet.create({…})`, and run them through the existing rules.
   Expressions (theme.…, antzTheme.…, variables) pass. MUI spacing numbers (`p: 3`) are reported with their pixel
   value. React Native findings name the matching `antzTheme` value.
2. `governance/deprecations.json` and a new rule **ANTZ-DEP-01** (severity *warning*): deprecated names are reported
   with their replacement and never fail the check.

## Alternatives considered
A full TypeScript parser: more exact, but adds dependencies; the checker stays dependency-free. Failing on deprecations:
rejected, because aliases are promised to keep working until a major release.

## Accessibility
No change to any token or component.

## Impact
New findings appear in product code that uses literal values; nothing in the system's own files changes. Not breaking.

## Decision
Accepted by the System Owner as part of the design agent plan, 27 November 2026. Target: 1.2.0-beta.8.
