# Changelog

All notable changes to the Antz Design System. Versions follow semantic versioning: patch for fixes, minor for additions, major for anything renamed, removed or changed in meaning. Every version listed here is published under `releases/` and tagged in Git.

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
