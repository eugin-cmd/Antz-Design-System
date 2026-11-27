# ANTZ Design Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Ship the Antz Design System agent as a Claude Code plugin (`antz-design-system`) with /systemdesigner,
/systemauditor and /openvisualguide, governance files, brand history, developer-code checks, and a PDF guide.
**Spec:** `docs/superpowers/specs/2026-11-27-design-agent-design.md`

## Global Constraints
- Extend, never duplicate: one checker (`tools/check.mjs`), one helper (`antz.mjs`), one design-system skill.
- Published releases are immutable; nothing is released or deployed without "release"/"push".
- Gate before every commit: `node tools/build.mjs --check && node tools/check.mjs && node tools/test.mjs`.
- Skills are read-only towards the design system; the auditor is read-only towards products.
- Plain language in skills, docs and reports; reports name the design-system version.

## Review Focus
1. A product file with theme references (`theme.palette…`, `antzTheme.colors…`) must not be flagged.
2. MUI shorthand spacing (`p: 2`) and RN numbers (`padding: 12`) behave as documented.
3. Plugin install from GitHub in a clean config finds all three skills.
4. The auditor never edits the audited files.
5. Old copies of `skills/antz-design-system` keep working.

### Task 1: Checker reads JS style objects; deprecations (tools/check.mjs, governance/, tools/fixtures/, tools/test.mjs)
- [ ] Fixtures `bad-mui.tsx`, `bad-rn.tsx` (RED in test.mjs), `good-mui.tsx`, `good-rn.tsx`.
- [ ] `jsObjectChunks()` + `checkJsDecl()` mapping camelCase keys to the CSS rules; `governance/deprecations.json`; rule ANTZ-DEP-01 (warning); RFC-001.
- [ ] GREEN; gates; commit.
### Task 2: Plugin skeleton (.claude-plugin/marketplace.json, agent/…, build.mjs, release.mjs)
- [ ] Move `skills/antz-design-system/scripts` → `agent/scripts`; `agent/.claude-plugin/plugin.json` (version from build); keep `skills/antz-design-system` as pointer. Test: test.mjs checks plugin.json version = VERSION and the marketplace lists the plugin.
### Task 3: /systemdesigner (agent/skills/systemdesigner/SKILL.md, references, evals; antz.mjs info shows version and drift)
### Task 4: /systemauditor (antz.mjs audit: static + rendered; agent/skills/systemauditor/SKILL.md; evals)
### Task 5: /openvisualguide
### Task 6: Governance (.github/CODEOWNERS, .github/rulesets/*.json, governance/README.md process, Governance page)
### Task 7: Brand history page (docs-src via tools, from releases)
### Task 8: Docs and onboarding (README, docs/agent-onboarding.md, Get started section); clean-folder install test
### Task 9: PDF guide; final whole-branch review; preview
