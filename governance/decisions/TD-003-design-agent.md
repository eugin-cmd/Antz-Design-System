---
id: TD-003
title: The Antz Design System agent is a Claude Code plugin published from this repository
status: proposed
date: 2026-11-27
owner: System Owner
approver: System Owner (Eugin Robinson)
---

# TD-003 · The Antz Design System agent

## Context
A colleague's implementation guide asked for three Claude Code skills (/systemdesigner, /systemauditor,
/openvisualguide), owner-only governance, a brand version history and version-aware agents. The System Owner approved
the assessment and plan (`docs/superpowers/specs/2026-11-27-design-agent-design.md`) with two changes: the plugin is
named *Antz Design System*, and web and React Native developers are served properly (the checker reads their code).

## Decision
- **Distribution:** a Claude Code plugin, `antz-design-system`, in `agent/`, listed by the marketplace `antz`
  (`.claude-plugin/marketplace.json`). Teams install it in their own product repositories, pinned to a release tag;
  project-only skills (`.claude/skills/` in this repository) were rejected because teams don't work here.
- **Version:** the plugin's version is the system's (`VERSION`, written by `tools/build.mjs`). The helper defaults to
  it, reports drift from a clone's working copy, and names the version in every report.
- **/systemdesigner** is the existing design-system skill, renamed and extended (not a second skill).
  `skills/antz-design-system` remains only as a pointer.
- **/systemauditor** is read-only: the release's own checker for code, plus rendered checks in Chrome through the
  engine shared with `tools/audit.mjs` (`agent/scripts/browser.mjs`). It states what ran and what could not, and never
  calls code compliant when its checker couldn't read it.
- **/openvisualguide** opens the official site only.
- **The checker reads developer code** (MUI `sx`/`style`, `styled`, React Native `StyleSheet`) and warns about
  deprecated names (RFC-001, rule ANTZ-DEP-01).
- **Governance** is enforced by GitHub, not by instructions: `.github/CODEOWNERS` and the importable rulesets in
  `.github/rulesets/`; the process is in `governance/README.md`. Agents never approve, release or deploy on their own.
- **Brand history** is generated from the frozen releases (Governance › Brand history); nothing is reconstructed.

## Not done here
A shared React Native component package (separate decision, needs the app repository). Switching on the GitHub
rulesets (the System Owner's clicks). A logged-in, end-to-end session test on a team member's machine.
