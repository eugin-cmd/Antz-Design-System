# Changelog

All notable changes to the Antz Design System. Versions follow semantic versioning: patch for fixes, minor for additions, major for anything renamed, removed or changed in meaning. Every version listed here is published under `releases/` and tagged in Git.

## Unreleased

### Components (from the Kitchen and Diet web app, DD-002)
- **Navigation drawer** (`.navdrawer`): the hamburger-opened main menu, with a module rail (icon over label) beside the module's menu (search, group headings, items, and a foot with zoo switcher and user). The white rail parts around the active module, so its tab opens into the panel. The panel and tab take the module's tone and fade between tones when the module changes. `components.js` adds open/close, Escape, backdrop, focus return and arrow keys.
- **Module tones**: seven tones (`--color-module-<tone>-{a,b,ta,tb,ink}`), each with a suggested module. `data-tone` on any element sets the current tone (`--color-tone-*`), and three tone gradients follow it (`--gradient-tone-panel`, `-tab`, `-band`). The build emits these on `[data-tone]`.
- **Module band** (`.module-band`): the soft strip behind a module page header.
- **Launcher**: round module tiles (`.tile-module--round`, `--launch-green|amber|sky|slate|coral`, `--plain`) with labels (`.launcher`). Five new launch gradients keep white icons at 3:1.
- **Display headline gradient** (`.t-gradient`, `--gradient-text-brand`): large text only, with a fallback in high contrast and forced colours.
- **Entity header** (`.entity-head`) on the new petrol gradient: picture, name, scientific name, key figures and quiet actions.
- **Side nav group headings** (`.sidenav__group`).
- **Side sheets** (new docs page): the work drawer now has a **floating** variant (`.drawer--floating`). It is inset from the top, right and bottom edges with large rounded corners, so it reads like a dialog sliding in. It has a meta line over a large title, a section heading (`.drawer__section`) and an evenly split footer (`.drawer__foot--split`). For details and forms. `components.js` opens and closes sheets (`data-drawer-open`, `data-drawer-close`, `data-drawer-backdrop`, Escape, focus return).
- **Record hero** (`.record-hero`): the lead card of a detail sheet, on the green gradient. Key figures sit in an inset strip, and the responsible person has quick actions (`.icon-btn--on-strong`).
- **Party card** (`.party`, `--tint`, `--plain`): a person or animal on a record, with a label, name and call or message actions.
- **Outlined row** (`.row--outlined`) with a labelled quantity (`.row__qty`).
- **Tokens instead of literals:** `--color-text-on-strong-secondary` (86% white) and `--color-text-on-strong-muted` (78% white) replace opacity and colour-mix text in the new headers. `--size-launcher-item` and `--size-entity-text` replace two layout numbers. The record hero moves to `--gradient-deep`, so its secondary text passes AA (5.25:1) across the whole card; on `--gradient-green` it fell to 3.7:1 in the lightest corner.
- 11 new icons: utensils, chef-hat, package, truck, bar-chart, settings, book-open, history, receipt, globe, dashboard.
- Size tokens: `--size-drawer-nav`, `--size-rail`, `--size-rail-tab`, `--size-launcher`. 154 new contrast checks (588 in total), all passing.

### Tools
- **Antz Design System skill** (`skills/antz-design-system/`): an Agent Skill that makes AI assistants build Antz UI only from the system. Its helper (`scripts/antz.mjs`, no dependencies) reads a pinned release from a local clone or the team site and lists components, classes, tokens, icons and rules. It also runs the guardrail check from any project. Requests outside the system get an approved alternative or a proposal. Includes tests (`evals/`) and a team guide (`skills/README.md`). Releases now include `skills/`.

### Governance
- **System Owner named:** Eugin Robinson is the Antz Design Governance owner, from 22 November 2026. Recorded in `governance/README.md`, the Governance page and as the approver of exception EXC-001. Other roles are still to be assigned.

## 1.1.0-beta.1 (22 November 2026)

Additive: no token or class removed or renamed. Prototypes upgrade by changing `v1.0.0-beta.1` to `v1.1.0-beta.1` in their links and, for motion, adding `components.js`.

### Components
- **Animal card, compact and expanded** (`.animal-card`, `data-state="compact|expanded"`): photo-led card with sex tag, CITES appendix, AAID, facts, age and weight pills; expanded adds the photo header with AAID over a scrim, the latest alert, section and site, and a footer of treatment, lab, vaccination and medicine counts with View details. One markup. Expanding and collapsing animate the real card on `--ease-elastic` over `--duration-slower` (about 9% overshoot, then settle, matching the tabs): the photo resizes (staying framed, never stretched), the card's height follows so neighbouring cards glide, and the text, AAID, pills and footer fade in once the photo is under way. No snapshot cross-fades, so no ghosting; works the same in every browser; instant under reduced motion.
- **Stat panels on a wash** (`.stat-row--wash-primary|celebrate|calm|illustrative`, DD-001): the four washes as backgrounds for boxed figures, chosen by meaning; labels move to secondary text. 72 new contrast checks (figures and labels on every wash stop, four modes). Applied to the existing Key insights card (docs and the Home screen) and the Stat figures panel, which now sit on the Primary wash.
- **Fluid tabs**: tabs and segmented controls (line, pill, block, figure tabs, the docs' page tabs and theme switch) get one indicator that glides to the selected item and settles with a gentle elastic overshoot (about 10%, one bounce, no wobble) on the new `--ease-elastic` token over `--duration-slower`, resizing to the label. Instant under reduced motion; without the script the per-item highlight stays. The docs' page-tab underline now uses `--color-accent-indicator` (was the brand fill).
- **`components.js`** (new, optional, no dependencies): behaviour for the sliding tab indicator and the animal card expand. Load it after `components.css`.
- **Animal card optional parts**: only the sex tag, AAID and name are required; leaving out the photo shows the paw mark (scrim dropped, overlay text turns dark), no media block gives a one-column text card, no footer leaves no gap. Spec: `specs/components/animal-card.md`.
- **Softer washes in light mode**: the four gradient washes are half as strong in the light themes (each reference stop blended 50% with white, new primitives `wash.soft-mint|rose|butter|aqua|sky|pink`). Dark themes keep their current stops. Token names are unchanged, so every wash, stat panel and hero updates on its own; all contrast checks pass, with more margin than before. The original reference stops stay in the palette.
- New icons: maximize, minimize, scale, treatment, test tube, syringe, medicine.
- New tokens: `--color-media-chip`, `--color-media-text` for chips and text over photos; `--ease-elastic` (cubic-bezier(.34, 1.56, .64, 1)) for selection indicators, also in the React Native theme.

## 1.0.0-beta.1

First release of the Antz Design System, the successor to ANTZ Design System Foundation v0.2. Class names are unchanged, so prototypes upgrade by changing their stylesheet links.

### Foundations
- **Brand primary #37BD69** (FD-001), pinned in the token source. On light surfaces it is a fill; brand text uses tone 40 (#006D35), thin indicators tone 50 (#008944), focus tone 40. Lime #52F990 is retired.
- **Secondary teal #00D9C7 and tertiary navy #1F415B** (FD-002). Coral, amber, red and sky are status only. Success has its own olive-green family, so the brand never means a status.
- **Main button**: #37BD69 fill with a #00210C label, 7.07:1 (FD-003, amends Library v2 D1).
- Tonal palettes (tones 0 to 100) generated from the Antz key colours; Antz core neutrals and the green board kept.
- Type scale aligned with the dashboard: 16, 18, 20, 24, 36 and 48px steps replace 15, 17, 19, 22, 38 and 46px. Noto Sans fallbacks for Arabic, Devanagari and CJK.
- **Gradients**: the four reference washes as tokens (`--gradient-wash-primary`, `-celebrate`, `-calm`, `-illustrative`), five module gradients, feature gradients re-anchored on the palettes, a photo scrim. Ad hoc gradients are not allowed.
- **Motion**: exit and symmetric easing added; button lift and press, drawer and dialog entrances, `.anim-*` utilities, `.collapse`. Everything stops under reduced motion.

### Themes
- Light and dark (designed separately), high contrast for both (`data-contrast="high"` or `prefers-contrast: more`), compact density (`data-density="compact"`).

### Components
- Brand-safe indicators for checkbox, radio, switch, progress, tabs, choice cards, rows, calendar and ring.
- New: `.status--caution`, `.alert--caution`, `.status--secondary`, `.status--tertiary`, `.btn--secondary-solid`, `.btn--tertiary`, `.btn--text`, `.btn--caution`, `.btn--outline-brand`, `.wash--*`, `.hero-band`, `.card--navy`, `.tile-module`, `.drawer` (work drawer), touch targets of at least 44px on coarse pointers.
- Focus: inputs and search use the focus colour with a soft glow.

### Platforms
- Generated outputs: designer CSS (`tokens.css`), MUI theme options (`dist/mui`), React Native theme (`dist/react-native`), Tokens Studio sets for Figma (`dist/figma`), resolved DTCG JSON (`dist/tokens`), `colors.json`.

### Governance and tooling
- DTCG 2025.10 token source with validation (raw values, references, collisions, pinned brand).
- Contrast gate: 256 checks across light, dark and both high-contrast modes, all passing.
- Rule register (26 rules, 16 automatic) and guardrail check for any prototype or product; self-test with fixtures; exception register with expiry (EXC-001 covers legacy literals in `components.css` until 31 March 2027).
- Two tiers: immutable, checksummed releases (`tools/release.mjs`), Git tags, pre-commit gate.
- Docs: new pages for How it works, Themes and modes, Gradients, Guardrails, Roles and exceptions, Versions and Developer outputs; nav and chrome managed by `tools/docs.mjs`; high-contrast toggle.
- Theme tester (`tester.html`): any screen in every mode and device, compare light and dark or all four modes, right to left, washes, live contrast audit, token inspector, share links.
- `AGENTS.md` for AI assistants, with `CLAUDE.md` as a short adapter.

### Known limits
- React and React Native component packages are not built yet.
- The MUI and React Native themes are untested against the real Antz apps (their repositories were not available).
- The Foundation brand importer has not been re-validated against the new token names.
