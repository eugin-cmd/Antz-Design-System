# How the Antz Design System works

A practical guide for designers, developers and maintainers. The same guide, with live examples, is in the docs at `pages/how-it-works.html`.

## 1. The idea in one paragraph

Every design decision (a colour, a size, a curve, a gradient) is written once, as a token in `tokens/src`. A build turns those tokens into what each team needs: CSS for designers, an MUI theme for the web dashboard, a theme for the React Native apps and variables for Figma. Guardrails check every change automatically. Only work that passes becomes a **published version**: a frozen copy under `releases/` that products pin. Improvements carry on in the working copy without touching any product until that product chooses to upgrade.

```
 tokens/src (DTCG)  ──► node tools/build.mjs ──► tokens.css            designers' prototypes
 governance/rules       (validate + contrast)    dist/mui              Next.js dashboard
 components.css                                  dist/react-native     phone and tablet apps
                                                 dist/figma            Figma variables
            │                                    dist/tokens           anything else
            ▼
   Development (repo root)  ──gates──►  node tools/release.mjs  ──►  Published: releases/vX.Y.Z/
```

## 2. The two tiers

| | Development (evolution) | Published (stable) |
| --- | --- | --- |
| Where | The repository root | `releases/vX.Y.Z/` |
| What | Work in progress: new tokens, themes, motion, components, docs | Approved, validated copies of the whole system |
| Changes | Any time, through commits that pass the gates | Never. Every file is checksummed; `release --verify` fails on any edit |
| Used by products | No | Yes: products pin one version |

The promotion path: **Develop → Review → Validate → Approve → Release → Published.**

| Stage | What has to be true |
| --- | --- |
| Develop | Work in the repo; RFC opened for anything beyond a fix |
| Review | Design, technical and accessibility review by the right people |
| Validate | `build.mjs`, `check.mjs` and `test.mjs` all pass (the pre-commit hook enforces this) |
| Approve | By change class: Patch (code owner), Minor (maintainer + platform lead), Major (council), Foundational (System Owner) |
| Release | `CHANGELOG.md` has the section, `VERSION` is bumped, `node tools/release.mjs` succeeds |
| Published | The version is in `releases/index.json`, tagged in Git, listed in the docs |

## 3. Designers

You keep working in one web codebase for web, tablet and mobile prototypes.

1. **Link a pinned release**, never the working copy:
   ```html
   <link rel="stylesheet" href="antz-design-system/releases/v1.1.0-beta.1/tokens.css">
   <link rel="stylesheet" href="antz-design-system/releases/v1.1.0-beta.1/components.css">
   ```
2. **Use classes first:** `.btn--primary`, `.card`, `.status--caution`, `.wash--primary`, `.drawer`, `.tile-module`. Every component page in the docs shows the markup.
3. **Write your own CSS with tokens only:** `var(--color-…)`, `var(--space-…)`, `var(--text-…)`, `var(--radius-…)`, `var(--shadow-…)`, `var(--duration-…)`, `var(--ease-…)`, `var(--gradient-…)`.
4. **Check before you share:** `node antz-design-system/tools/check.mjs path/to/prototype`. It names the rule and line for every break.
5. **Explore in the theme tester** (`tester.html`), not in a prototype: light, dark, high contrast, compact, right to left, every device size, the four washes.
6. **Need something the system doesn't have?** Write an RFC. If a module truly has to differ, request an exception: it is recorded and expires.

### Colour in one minute

- **#37BD69** is the brand fill: main buttons, active pills, selection. On light surfaces it is **never text, a thin line or a small icon** (2.43:1 on white). The label on it is `--color-text-on-accent` (#00210C, 7.07:1).
- Brand-coloured **text and outlines**: `--color-accent-text` (#006D35). **Thin indicators** (tab underline, progress, switch, checkbox): `--color-accent-indicator` (#008944).
- **Secondary** teal and **tertiary** navy support the brand: navy for deep feature cards and structure.
- **Status** has its own colours: success (olive green), warning (coral), caution (amber), danger (red), info (sky). The brand green never means a status.

### The four gradients

| Wash | Token | Use it for |
| --- | --- | --- |
| 1 · Mint to rose | `--gradient-wash-primary` / `.wash--primary` | Hero and welcome bands, dashboard header, onboarding, sign-in |
| 2 · Butter to rose | `--gradient-wash-celebrate` | Announcements, featured cards, milestones |
| 3 · Butter to aqua | `--gradient-wash-calm` | Info panels, tips, empty states, onboarding steps |
| 4 · Sky to pink | `--gradient-wash-illustrative` | Illustrations, docs and marketing, empty-state art |

One wash per screen, on large areas only. Never on buttons, data marks or status. Dark theme swaps them for deep counterparts automatically.

### Motion in one minute

Calm, purposeful, alive. Colour changes 150ms; lifts and hovers 200ms; entrances 250 to 420ms with `--ease-out`; exits 150ms with `--ease-exit`; confirmations use `--ease-spring`. Nothing runs longer than 500ms. Everything drops to zero under reduced motion. Ready-made: `.anim-rise`, `.anim-fade`, `.anim-pop`, `.collapse`, button lift and press, drawer and dialog entrances.

## 4. Developers

| Platform | File | Use |
| --- | --- | --- |
| Next.js dashboard (MUI) | `dist/mui/antz-mui-theme.js` | `createTheme(antzThemeOptions({ mode, contrast }))` |
| React Native | `dist/react-native/antz-theme.ts` | `antzTheme.colors[scheme]`, `antzTheme.space`, `antzTheme.motion` |
| Any web page | `tokens.css`, `components.css` | CSS variables and classes |
| Figma | `dist/figma/antz.tokens-studio.json` | Import with Tokens Studio (W3C DTCG format) |
| Anything else | `dist/tokens/antz.tokens.json` | All tokens resolved for every mode |

Run the guardrails in product repos: start with `--report`, then make the check blocking in CI module by module.

## 5. Changing the system (maintainers)

1. Open an RFC (`governance/rfc/TEMPLATE.md`) unless it is a fix.
2. Edit the source: `tokens/src/**`, `components.css`, `docs-src/` + `pages/_nav.json`, `specs/`.
3. `node tools/build.mjs` (fails on invalid tokens or any contrast failure).
4. `node tools/check.mjs` and `node tools/test.mjs`.
5. `node tools/docs.mjs` if docs changed.
6. Commit. The pre-commit hook re-runs the gates and refuses stale generated files.
7. To publish: add `## <version>` to `CHANGELOG.md`, bump `VERSION`, commit, run `node tools/release.mjs`.

**Version numbers:** Patch for fixes, Minor for additions, Major for anything renamed, removed or changed in meaning. Pre-releases use `-beta.N` and `-rc.N`.

## 6. Going back

- **One product:** point its link back to the earlier `releases/vX.Y.Z/`. Nothing else changes.
- **Browse an old version:** open `releases/vX.Y.Z/index.html`, or pick it on the Versions page.
- **Compare versions:** `git diff v1.0.0-beta.1 v1.1.0-beta.1 -- tokens/src components.css`.
- **Restore all source:** `git checkout v1.0.0-beta.1`.

## 7. Exceptions

When a standard truly doesn't fit, add an entry to `governance/exceptions.json` (id, rules, files, reason, owner, approver, expiry). The check honours it until it expires, then fails. If three or more modules need the same exception, it becomes an RFC. An exception never quietly becomes the standard.

## 8. AI assistants

Point any assistant at `AGENTS.md`. It must not invent tokens, duplicate components or edit generated or published files, and it must flag missing pieces as proposals. The same checks catch it if it does anyway. Nothing in the system depends on a particular AI vendor.

## 9. Keeping up with trends

Trends are tried in Labs (the theme tester and branches), proposed by RFC, and adopted only if they help usability, fit the brand, pass accessibility and show measurable value. A major version is how the whole system moves forward; older versions stay available, and products upgrade when they are ready.
