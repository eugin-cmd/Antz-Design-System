# Antz Design System

The governed design system for every Antz product: web dashboard, tablet and phone apps, and the designers' prototypes. It is the successor to ANTZ Design System Foundation v0.2 and keeps that system's class names, so existing prototypes upgrade by changing one stylesheet link.

**Version:** see [`VERSION`](VERSION) · **Changes:** [`CHANGELOG.md`](CHANGELOG.md) · **Guide:** [`HOW-IT-WORKS.md`](HOW-IT-WORKS.md) · **For AI tools:** [`AGENTS.md`](AGENTS.md)

- **One source of truth.** Every value is a token in [`tokens/src`](tokens/src), in the open DTCG 2025.10 format. Primary green **#37BD69** (pinned), secondary teal **#00D9C7**, tertiary navy **#1F415B**.
- **Every platform from the same source.** Designer CSS, an MUI theme for Next.js, a React Native theme, Figma variables and a resolved JSON for anything else.
- **Themes.** Light, dark, high contrast (light and dark) and compact density. Components never change between them.
- **Guardrails that run.** A contrast gate (256 checks in 4 modes), 16 automatic rules for any prototype or product, a self-test that proves they work, and a pre-commit hook.
- **Two tiers.** The repository root is Development. `releases/vX.Y.Z/` are Published: frozen, checksummed and tagged. Products pin a release.
- **Docs and a theme tester.** Instructional docs for every foundation, component and pattern, and a tester that shows any screen in every mode and device size.

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
<link rel="stylesheet" href="antz-design-system/releases/v1.0.0-beta.1/tokens.css">
<link rel="stylesheet" href="antz-design-system/releases/v1.0.0-beta.1/components.css">
<script src="antz-design-system/releases/v1.0.0-beta.1/components.js" defer></script>  <!-- optional: motion for tabs and the animal card (from 1.1) -->
```

In the dashboard (MUI): `createTheme(antzThemeOptions({ mode, contrast }))` from `dist/mui/antz-mui-theme.js`.
In React Native: `antzTheme.colors[scheme]` from `dist/react-native/antz-theme.ts`.

## Commands (Node 18+, no dependencies)

| Command | What it does |
| --- | --- |
| `node tools/build.mjs` | Validates tokens, runs the contrast gate, writes every output. Fails on any error. |
| `node tools/check.mjs [path]` | Guardrail check of this repo, or of any prototype or product folder. `--report` never fails; `--json` for CI. |
| `node tools/test.mjs` | Proves every automatic guardrail fires and a clean file passes. |
| `node tools/docs.mjs` | Renders `docs-src/` pages and refreshes the nav, header, pager and footer on every page. |
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
| `themes/` | Brand themes imported from the Previewer (Foundation feature) | Via the importer |

## Status and known limits (1.0.0-beta.1)

- Designer CSS, tokens, themes, guardrails, docs, tester and release tooling are complete for this beta.
- React and React Native **component packages** are not built yet. Developers get themes and tokens; component contracts come next (see the proposal roadmap).
- The Antz web and React Native repositories and the Figma files were not available, so the MUI and React Native themes are untested against the real apps.
- `components.css` still carries 71 legacy Foundation literals, covered by exception `EXC-001` until 31 March 2027.
- The brand theme importer from Foundation v0.2 (`tools/import_theme.py`, `assets/theme-import.js`) was carried over unchanged and has not been re-validated against the new token names.
- Owners in `governance/` are roles; names still need to be assigned.
