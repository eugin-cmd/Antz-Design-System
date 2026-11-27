# Antz Design System

The governed design system for every Antz product: web dashboard, tablet and phone apps, and the designers' prototypes. It is the successor to ANTZ Design System Foundation v0.2 and keeps that system's class names, so existing prototypes upgrade by changing one stylesheet link.

**Version:** see [`VERSION`](VERSION) · **Changes:** [`CHANGELOG.md`](CHANGELOG.md) · **Guide:** [`HOW-IT-WORKS.md`](HOW-IT-WORKS.md) · **For AI tools:** [`AGENTS.md`](AGENTS.md)

- **One source of truth.** Every value is a token in [`tokens/src`](tokens/src), in the open DTCG 2025.10 format. Primary green **#37BD69** (pinned), secondary teal **#00D9C7**, tertiary navy **#1F415B**.
- **Every platform from the same source.** Designer CSS, an MUI theme for Next.js, a React Native theme, Figma variables and a resolved JSON for anything else.
- **Themes.** Light, dark, high contrast (light and dark) and compact density. Components never change between them.
- **Guardrails that run.** A contrast gate (724 checks in 4 modes), 26 governance rules (16 of them checked automatically) for any prototype or product, a self-test that proves they work, and a pre-commit hook.
- **Two tiers.** The repository root is Development. `releases/vX.Y.Z/` are Published: frozen, checksummed and tagged. Products pin a release.
- **Docs and a theme tester.** Instructional docs for every foundation, component and pattern, and a tester that shows any screen in every mode and device size.

## For teams starting now

1. Clone the repository into your project folder, so the paths below work as written: `git clone https://github.com/eugin-cmd/Antz-Design-System.git antz-design-system`. Cloned somewhere else, adjust the `antz-design-system/` part of each path. The current release is **v1.2.0-beta.7**, on `main`.
2. Link the pinned release, never the working copy (see the snippets below). Upgrading later means changing the version in the path; rolling back means changing it back.
3. If you will change the system itself, turn on the pre-commit hook once: `git config core.hooksPath tools/hooks`.
4. Check your own prototype or product folder with `node tools/check.mjs path/to/folder --report` and fix what it lists.
5. Need a new colour, size, component or variant? Propose it (see the Governance page); don't add it locally.
6. Questions, proposals and exceptions go to the System Owner, Eugin Robinson.

## The Antz Design System agent (Claude Code)

Designers and developers use the system through a Claude Code plugin, **Antz Design System**, with three commands:
`/systemdesigner` (build from the system only), `/systemauditor` (read-only compliance audit) and `/openvisualguide`.
Install it once in your product repository, pinned to the release you build against:

```
/plugin marketplace add eugin-cmd/Antz-Design-System#v1.2.0-beta.8
/plugin install antz-design-system@antz
```

Full guide: [`docs/agent-onboarding.md`](docs/agent-onboarding.md). The plugin lives in [`agent/`](agent); its
version is the system's version.

## Quick start

```sh
cd antz-design-system
python3 -m http.server 8092 --bind 127.0.0.1
# docs:          http://127.0.0.1:8092/
# theme tester:  http://127.0.0.1:8092/tester.html
```

In a prototype (designers):

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="antz-design-system/releases/v1.2.0-beta.7/tokens.css">
<link rel="stylesheet" href="antz-design-system/releases/v1.2.0-beta.7/components.css">
<script src="antz-design-system/releases/v1.2.0-beta.7/components.js" defer></script>  <!-- optional: motion for tabs and the animal card -->
```

In the apps, use the pinned release's copy, never the working copy at the repository root. Copy the file into the app repository (note the version in the commit), or add the design system as a git submodule checked out at the release tag:

- Dashboard (MUI): `releases/v1.2.0-beta.7/dist/mui/antz-mui-theme.js`, then `createTheme(antzThemeOptions({ mode, contrast }))`.
- React Native: install the release from GitHub, `npm install github:eugin-cmd/Antz-Design-System#v1.2.0-beta.7`, then `import { antzTheme } from '@antz/design-system/react-native'`. Shadows, gradients and status colours are included; see the Developers page for recipes.

## Commands (Node 18+, no dependencies)

| Command | What it does |
| --- | --- |
| `node tools/build.mjs` | Validates tokens, runs the contrast gate, writes every output. Fails on any error. |
| `node tools/check.mjs [path]` | Guardrail check of this repo, or of any prototype or product folder. `--report` never fails; `--json` for CI. |
| `node tools/test.mjs` | Proves every automatic guardrail fires and a clean file passes. |
| `node tools/docs.mjs` | Renders `docs-src/` pages and refreshes the nav, header, pager and footer on every page. |
| `node tools/audit.mjs` | Rendered audit in Chrome: every colour token in all 36 OS and page setting combinations; every text element on every page in four modes (suspects re-measured on real pixels); reduced motion; links, JavaScript errors and tap targets. Needs Chrome and Node 22. About 10 minutes. Run before every release. |
| `node tools/release.mjs` | Publishes the version in `VERSION` to `releases/` (gated, frozen, tagged). `--verify`, `--list`. |

The pre-commit hook (`tools/hooks/pre-commit`, enabled with `git config core.hooksPath tools/hooks`) runs the build, check and release verification on every commit.

## What's where

| Path | Contents | Edit? |
| --- | --- | --- |
| `tokens/src/` | Token source (primitive, base, themes) | Yes, through the change process |
| `components.css` | Component styles (tokens only) | Yes |
| `components.js` | Optional behaviour: sliding tab indicator, animal card expand (no dependencies) | Yes |
| `governance/` | Rule register, exceptions, decisions, RFCs | Yes, through the change process |
| `specs/` | Component specification template and specs | Yes |
| `docs-src/`, `pages/_nav.json` | New docs pages and the navigation | Yes |
| `pages/`, `index.html`, `assets/` | Docs site | Pages: yes; nav and chrome: via `tools/docs.mjs` |
| `tester.html`, `tester-frame.html` | Theme tester | Yes |
| `tokens.css`, `colors.json`, `dist/` | Generated outputs | **No** (generated) |
| `releases/` | Published versions | **Never** (immutable) |
| `tools/` | Build, check, test, docs, release | Yes |
| `agent/`, `.claude-plugin/` | The Claude Code plugin (skills and helper) and its catalog | Yes, through the change process |
| `themes/` | Brand themes imported from the Previewer (Foundation feature) | Via the importer |

## Status and known limits (1.2.0-beta.7)

- Designer CSS, tokens, themes, guardrails, docs, tester and release tooling are complete for this beta.
- React and React Native **component packages** are not built yet. Developers get themes and tokens. React Native components are planned for a later release.
- The Antz web and React Native repositories and the Figma files were not available, so the MUI and React Native themes are untested against the real apps.
- `components.css` still carries 68 legacy literals from Foundation v0.2 (the earlier design system), covered by exception `EXC-001` until 31 March 2027.
- The brand theme importer from Foundation v0.2 (`tools/import_theme.py`, `assets/theme-import.js`) was carried over unchanged and has not been re-validated against the new token names.
- The System Owner is Eugin Robinson. The other owners in `governance/` are roles; names still need to be assigned.
- Ten component icons have no ANTZ Rounded equivalent yet and keep their earlier drawings; the icon team's drafts are still awaiting approval.
- The team site is unlisted, not private: search engines are told to stay away, but anyone with the link can open it.

## Words you'll see

- **DD-, FD-, TD-** numbers: decision records in `governance/decisions/` (design, foundational and technical decisions). Each says what was decided and why.
- **RFC:** a written proposal for a change (`governance/rfc/TEMPLATE.md`).
- **EXC-** numbers: exceptions in `governance/exceptions.json`, approved and time-limited.
- **DTCG:** the open design-token file format that `tokens/src` uses.
- **Foundation v0.2:** the design system this one replaced.
