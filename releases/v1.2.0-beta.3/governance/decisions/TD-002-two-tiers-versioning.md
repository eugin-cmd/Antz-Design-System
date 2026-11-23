---
id: TD-002
title: Two tiers, immutable releases, local Git
date: 2026-11-22
status: accepted
class: foundational
owner: Design System Maintainers
versions: { introduced: 1.0.0-beta.1 }
---

## Decision
- **Development** is the repository root. **Published** is `releases/vX.Y.Z/`, created only by `tools/release.mjs` after the gates pass.
- Every published file has a SHA-256 in `MANIFEST.json`; the manifest's own hash is in `releases/index.json`. `release --verify` runs on every commit and fails on any change.
- Git history and annotated tags (`vX.Y.Z`) give line-level history and full restores. The repository is local; nothing is pushed.
- Products pin a release path and upgrade deliberately. Rollback = pointing back at an earlier release.

## Later
When the repository moves to the organisation's Git host: protected main branch, CODEOWNERS approvals per change class, CI running the same commands, and packages published to a private registry with the same versions.
