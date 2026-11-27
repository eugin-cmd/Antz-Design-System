# ANTZ Design Agent: assessment and plan (Prompt 01)

Date: 27 November 2026 · Status: **for System Owner approval** · Source: *ANTZ Design Agent, Claude Code implementation
guide* (11 pages, 9 prompts), prepared by a colleague. Decision record to come: TD-003 (proposed).

## 1. Architecture today (what is really in the repository)
- **Source of truth:** DTCG tokens in `tokens/src/` → `tools/build.mjs` writes `tokens.css`, `colors.json` and `dist/`
  (MUI, React Native, Figma), and runs the 724-check contrast gate. `components.css` and `components.js` hold the
  components; `docs-src/` and `tools/style7.py` generate the visual guide (`pages/`, 113 pages).
- **Governance:** `AGENTS.md`, `CLAUDE.md`, `governance/rules.json` (26 rules, 16 automated), decision records
  (`governance/decisions/`), exceptions with expiry (`governance/exceptions.json`), and a pre-commit hook that runs
  the gates. The System Owner approves above-Patch changes.
- **Releases:** `tools/release.mjs` freezes `releases/vX.Y.Z/` with checksums, tags Git and updates
  `releases/index.json` (8 releases, latest 1.2.0-beta.7). `tools/rollback.mjs` and `tools/deploy.mjs --rollback`
  go back. The site deploys only committed work and checks it stays unlisted.
- **Agent today:** the skill `skills/antz-design-system/` with `scripts/antz.mjs` (`info`, `components`,
  `component`, `tokens`, `classes`, `icons`, `rules`, `starter`, `check`), references (platforms, proposal) and three
  evals. It reads a **pinned release** (local clone or the site) via `--version` or `ANTZ_DS_VERSION`. It is copied
  into every release (`releases/vX/skills/`). Teams install it by copying the folder into their project.
- **GitHub:** the repository is **public**; the owner pushes straight to `main`; no branch protection or rulesets yet;
  no CODEOWNERS.

## 2. Reuse
| Guide asks for | Reused as is | 
|---|---|
| /systemdesigner | The existing skill and `antz.mjs` (lookups, starter, check, proposals). |
| /systemauditor | `check.mjs` rules (static), the contrast engine in `tools/audit.mjs` (rendered), `rules.json`. |
| Versioning (Prompt 08) | `VERSION`, `releases/index.json`, pinning, `release.mjs`, `rollback.mjs`, the Versions page. |
| Version history (Prompt 03) | Frozen releases, `CHANGELOG.md`, FD decision records, retired brand values. |
| Governance (Prompt 02) | Rules, decision records, exceptions, the pre-commit hook. |

## 3. Missing
1. **Distribution to other repositories.** Skills in `.claude/skills/` only load when Claude Code runs inside this
   repository; teams work in their own product repositories. → a **Claude Code plugin** (`antz-design-system`) published from this repo.
2. **/systemauditor** for *another team's product*: static check of HTML/CSS/JSX/RN files, and a rendered audit of a
   URL or local file (contrast in four modes, tap targets, focus, labels), with a graded, evidence-based report.
3. **/openvisualguide.**
4. **Deprecations** registry and detection (e.g. `priority__opt--emergency`, retired greens), and the version in
   every report; a warning when the working copy differs from the pinned release.
5. **Brand version history** page.
6. **CODEOWNERS, rulesets and the documented approval process.**

## 4. Proposed structure (added to the current repository; nothing replaced)
```
.claude-plugin/marketplace.json        catalog "antz": one plugin, "antz-design-system"
agent/                                  the plugin (copied into every release)
  .claude-plugin/plugin.json            version = VERSION (written by build.mjs)
  skills/systemdesigner/                the current antz-design-system skill, renamed and extended
  skills/systemauditor/                 new
  skills/openvisualguide/               new
  scripts/antz.mjs                      shared helper (moved from skills/antz-design-system/scripts)
skills/antz-design-system/              kept as a short pointer to /systemdesigner (old installs keep working)
governance/deprecations.json            deprecated tokens and classes, with replacements
docs-src/brand-history.html             Brand history page (from releases, FD records, retired values)
.github/CODEOWNERS, .github/rulesets/   CODEOWNERS and importable ruleset JSON
docs/agent-onboarding.md                installation and use for teams
```
**Commands** (plugin skills): `/systemdesigner`, `/systemauditor`, `/openvisualguide` work as typed when no other
command has the same name; the full names are `/antz-design-system:systemdesigner` and so on. The plugin is named `antz-design-system` (plugin names are lowercase with hyphens); where a display name or description is shown it reads "Antz Design System" (System Owner, 27 November 2026). Claude also picks the right skill from
plain requests.

**Install for a team** (in their product repository, once):
`/plugin marketplace add eugin-cmd/Antz-Design-System#v1.2.0-beta.8` then `/plugin install antz-design-system@antz`.
Committing the marketplace in the product's `.claude/settings.json` offers it to everyone on that project after they
accept the folder's trust prompt. Pinning the tag pins the agent and the design system together; updating is changing
the tag.

## 5. Plan (in the guide's phases; each step tested and committed, then reviewed)
**Phase 1: governance and history**
1. `.github/CODEOWNERS` (owner on tokens, components, governance, skills, agent, releases, tools, docs-src, brand
   assets), `.github/rulesets/main.json` and `tags.json` (import in GitHub), and an approval-process section on the
   Governance page: who proposes, approves, publishes; how teams request; emergency fixes (a Patch with a decision
   record afterwards).
2. Brand history page: each release's brand primary, label colour, typeface, logo and gradients read from its frozen
   `tokens.css`; changes between releases highlighted; retired values listed with their FD record; history before
   v1.0.0-beta.1 marked "not recorded".
3. `governance/deprecations.json` and a `check` rule that flags deprecated names, with the replacement.

**Phase 2: the agent**
4. Plugin skeleton and marketplace; `antz.mjs` moves into `agent/scripts`; `build.mjs` writes the plugin version;
   `release.mjs` includes `agent/` and `.claude-plugin/`.
5. **/systemdesigner**: the current skill, plus the release number in every report, deprecation warnings and a
   "working copy differs from release" notice; existing evals kept, plus one for a mobile bottom sheet.
6. **/systemauditor**: `antz.mjs audit <files|url>`. Static pass (all automated rules, deprecations, icon set);
   rendered pass in Chrome for a URL or HTML file (contrast in four modes, tap targets, focus visible, labels), reusing
   the audit engine. Report A–E as in the guide, each finding with file or screen, location, rule id, expected and
   fix; states which checks ran and which could not; read-only. Evals: a clean screen, a planted-violation screen.
7. **/openvisualguide**: opens the official URL in Chrome on macOS, Windows or Linux; otherwise prints it.

**Phase 3: adoption**
8. README and `docs/agent-onboarding.md`; Getting started page section; tested in a clean folder (fresh Claude Code
   config, install from GitHub, all three skills found and working).
9. Integration check (Prompt 09), all gates and the full audit; release **1.2.0-beta.8** only on "release".

## 6. Limits and risks
- **AI cannot be stopped by instructions alone.** GitHub settings do the enforcing. Anyone with only read access
  (everyone but you on a public repo) can already only propose through a fork and pull request. You, as owner, can
  still push; Claude acting with your credentials pushes only when you say "push". A ruleset that forces even you
  through a pull request would need a second approver or a bypass for you.
- **GitHub settings are yours to switch on** (rulesets, tag protection); I prepare the files and the exact clicks.
- **Auditing React or React Native code** is partial from the code alone; a full audit needs the screen running at a
  URL. Reports say which checks ran.
- **Plugin trust:** each person accepts the plugin and the folder trust prompt once; private forks need git
  credentials.
- **Names:** the short commands can collide with another plugin's; the full `/antz-design-system:…` names always work.
- **Old installs:** teams who copied `antz-design-system` keep working; it points to `/systemdesigner`.
