# Instructions for AI coding assistants

These rules apply to any AI assistant (Claude Code, Copilot, Cursor, Codex or any other) working in this repository or building Antz UI from it. Human contributors follow the same rules. The full rule register is `governance/rules.json`; the guide is `HOW-IT-WORKS.md`.

## Always

1. Use only approved tokens: `var(--color-*)`, `--hue-*`, `--space-*`, `--text-*`, `--weight-*`, `--radius-*`, `--shadow-*`, `--duration-*`, `--ease-*`, `--gradient-*`, `--font-body|heading|mono`. The list is `dist/tokens/token-index.json`.
2. Use existing classes from `components.css` before writing CSS. Search the docs (`pages/`) first.
3. The brand primary is **#37BD69**. On light surfaces it is a **fill only** (`--color-accent`) with `--color-text-on-accent` on it. Brand text uses `--color-accent-text`; thin indicators use `--color-accent-indicator`; focus uses `--color-focus`.
4. Status uses status tokens (`success`, `warning`, `caution`, `danger`, `info`), never the brand green.
5. One main (filled brand) action per header, drawer or dialog. Add and edit happen in the right work drawer (`.drawer`, 562px).
6. Every icon-only button has `aria-label`. Every image has `alt`. Never remove focus outlines.
7. Run `node tools/check.mjs <changed files>` and fix every finding before you finish. When you change tokens, run `node tools/build.mjs` and `node tools/test.mjs`.
8. Products and prototypes link a pinned release: `releases/vX.Y.Z/tokens.css`, never the repository root.

## Never

- Invent a token, colour, size, font, weight, radius, shadow, duration, easing or gradient. If one is missing, **stop and write a proposal** (what, why, where) instead.
- Create a second version of an existing component (confirm dialog, toast, filter drawer, table, drawer).
- Edit generated files: `tokens.css`, `colors.json`, anything in `dist/`. Change `tokens/src` and rebuild.
- Edit anything in `releases/`. Published versions are immutable; `release --verify` will fail.
- Change `governance/`, the brand colour, the typeface or a principle without an approved RFC.
- Use the retired values #52F990, #38BD69 or #36BC69.
- Add an exception to `governance/exceptions.json` on your own. Exceptions need a human approver.
- Bypass the pre-commit hook (`--no-verify`).

## When you are unsure

Say so, and propose. A clearly labelled proposal is always better than a silent workaround.
