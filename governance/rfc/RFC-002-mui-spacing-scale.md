---
id: RFC-002
title: MUI spacing scale (antzSpacing) and on-scale MUI spacing numbers
author: System Owner
date: 2026-11-27
class: minor
status: accepted
---

## The need
The Antz MUI theme set no spacing, so the guardrail check flagged every MUI spacing number (`p: 2`), the most common
pattern in existing MUI code, even when it equals an Antz step (16px = `--space-4`).

## What exists today
Space tokens `--space-0` … `--space-16` (a 2px/4px scale); the MUI theme with colours, type, shape and motion only.

## Proposal
Keep MUI's 8px unit (MUI's own components rely on it), set `spacing: 8` explicitly, and export `antzSpacing`, generated
from the space tokens: the factors that land on an Antz step (`0.25` → `--space-0-5`, `1.5` → `--space-3`, `2` →
`--space-4`, …). The check accepts those factors in `sx` and flags any other number with the nearest step.

## Alternatives considered
A 4px unit so `p: 4` = `--space-4`: halves the spacing inside MUI components (Grid, Stack, CardContent). A spacing
function returning `var(--space-*)`: breaks MUI internals that parse spacing as numbers (Grid offsets).

## Accessibility
None.

## Impact
Fewer findings in MUI code; on-scale numbers pass. Not breaking.

## Decision
Accepted by the System Owner, 27 November 2026. Target: 1.2.0-beta.9.
