---
id: TD-001
title: Token source, build and platform outputs
date: 2026-11-22
status: accepted
class: foundational
owner: Platform leads
versions: { introduced: 1.0.0-beta.1 }
---

## Decision
- Tokens are stored in **DTCG 2025.10** JSON in `tokens/src`: primitive, base (type, space, shape, motion, layout) and theme layers (light, dark, high contrast light and dark, compact). Semantic colours must reference primitives.
- A **zero-dependency Node build** (`tools/build.mjs`) validates, runs the contrast gate and writes designer CSS, MUI theme options, a React Native theme, Tokens Studio sets for Figma and resolved JSON.
- Designers keep **plain HTML/CSS with no build step**, matching how prototypes are made today. The CSS keeps Foundation v0.2's custom-property and class names.
- The web dashboard gets an **MUI theme**, not a parallel component library. React Native gets its own theme. One specification, two implementations.

## Alternatives considered
Style Dictionary (adopt later if output needs grow; it reads the same DTCG source); a monorepo with product apps (revisit after the product repositories are audited); react-native-web for shared components (rejected: would fight the MUI dashboard).
