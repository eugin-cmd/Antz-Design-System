# Housing site overview and browse panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (chosen: native). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add the unique pieces of the Housing page (enclosure card, browse panel, compact contact, figures panel, hero options, side panel options) and a "Housing · site" screen with the enclosure side sheet.

**Architecture:** New classes in `components.css` (tokens only); new helpers and a new docs page and screen in `tools/style7.py`; the hand-written `pages/screen-housing.html` hero gets the foot bar. `python3 tools/style7.py && node tools/docs.mjs` regenerates.

**Tech Stack:** CSS tokens, Python generator, Node gates, headless Chrome checks (scratch scripts in the plan workspace).

**Spec:** `docs/superpowers/specs/2026-11-26-housing-site-overview-design.md`

## Global Constraints
- Tokens only; no new tokens; no raw colours, sizes or timings (rules ANTZ-COL-01, SPC-01, TYP-01, SHP-01, MOT-01).
- Every new look is opt-in: existing markup and every other screen regenerate byte-identical (except `?v=` hashes and nav).
- AA in light, dark, high-contrast light and dark (4.5:1 text, 3:1 icons and indicators). Never remove focus outlines.
- Icon-only buttons have `aria-label` naming the person ("Call Ravi Kumar"); images have `alt`.
- Main action is `btn--primary`; one per sheet or panel. No dark-green white-label buttons, no client logo.
- Photos: licensed (Commons CC0/BY/BY-SA), credited with licence links in `assets/img/CREDITS.md`.
- Gates: `node tools/build.mjs --check && node tools/check.mjs && node tools/test.mjs`.

## Review Focus
1. Other screens unchanged (snapshot compare, as in DD-007).
2. Browse panel at phone and tablet widths: panes stack, no sideways scroll, enclosure grid 1–2 columns.
3. Dark and high-contrast: figures panel dividers and text, status pill on the card, glass contact on the photo.
4. Long names (enclosure, section, person) truncate inside cards and rows, not overflow.
5. Keyboard: card and section rows are links/buttons with visible focus; sheet opens from an enclosure card and closes with Escape.

---

### Task 1: Components — figures panel, compact contact, enclosure card, browse panel
**Files:** `components.css` (new block "Browse panel (DD-008)" after the record-card block); `tools/style7.py` (helpers before `# ═══ Screens`).
**Produces (helpers):** `figures(items, glass=False) -> str` (items: `[(value, label)]`); `contact_pill(name, glass=False) -> str`;
`enclosure_card(name, imgs, animals, species, flag=None) -> str` (imgs: species webp names; flag: caution text);
`browse(sections, active, title, meta, keeper, cards, shown, total) -> str`.
**CSS classes:** `.figures`, `.figures--glass`, `.contact--pill`, `.contact--glass`, `.card--enclosure`, `.card--enclosure .avatar-stack`, `.browse`, `.browse__list`, `.browse__main`, `.browse__head`, `.browse__grid`, `.browse__foot`; container query `@container shell (max-width: 839.98px)` stacks `.browse`.
- [ ] Step 1: failing render test on the new docs page (`#bp-demo`): figures has ≥3 items with a divider between each (border or box-shadow on items 2..n); every `.card--enclosure` is an `a` with an `.avatar-stack` of `img[alt]`; flagged cards contain `.status--caution`; `.contact--pill` buttons have aria-labels containing the person's name; contrast of figure labels ≥4.5 in light and dark.
- [ ] Step 2: run → FAIL (no page).
- [ ] Step 3: implement CSS + helpers + a new docs page `browse-panel` via `write_doc` (Pattern components, after Record detail) with demos: figures (light and glass), contact pill (light and glass), enclosure cards (with and without flag), browse panel.
- [ ] Step 4: regenerate, run test light + dark → PASS; gates; commit "Browse panel, enclosure card, figures panel, compact contact (DD-008)".

### Task 2: Hero options and side panel options
**Files:** `components.css` (hero block l.~1166, modnav block); `tools/style7.py` (`modnav`: `action=None` → no button; a section label `'-'` → `<hr class="modnav__divider">`; Timelines and charts doc adds a "Hero options" demo).
**CSS classes:** `.hero-photo__back`, `.hero-photo__overline`, `.hero-photo__foot`, `.hero-photo__stats--spread`, `.hero-photo--site` (text left, `figures--glass` right), `.modnav__divider`.
- [ ] Step 1: failing tests: helper test (modnav without action has no `btn--primary`; `'-'` section renders `modnav__divider`; defaults unchanged); render test on Timelines page `#tc-hero-options`: foot bar spans the hero width, link inside is focusable, spread stats use `justify-content: space-between`, back chip text contrast ≥4.5 on its glass in light.
- [ ] Step 2: run → FAIL. Step 3: implement. Step 4: PASS + snapshot no-change + gates; commit "Hero foot bar, site hero, side panel dividers and no-action option (DD-008)".

### Task 3: Housing · site screen with the enclosure sheet; Housing hero foot bar
**Files:** `tools/style7.py` (`HO_SITE_NAV`, `HOUSING_SITE = module_page('Housing', 'Adirampattinam', …, action=None, bar=…, nav={'soft': True}, strip=True, tinted=True)`; `screen_page('housing-site', 'Housing · site', …)`; `add_link('Screens', 'screen-housing-site.html', 'Housing · site', 'screen-housing.html')`; `with_sheet` for the enclosure sheet opened by `data-drawer-open` on "Aviary 10"; `enclosure_sheet(sid, inline=False)` helper, also shown inline on the Side sheets page via `put_section('docs-src/side-sheets.html', '<!--enclosure-sheet-->', '<!--/enclosure-sheet-->', …, '<div class="doc" id="sheets-usage">')`); `pages/screen-housing.html` (hero: overline, foot bar "8 clusters" + "View all sites", spread stats); `assets/img/species/sarus-crane.webp` (+ credit).
- [ ] Step 1: failing checks: screen file exists with `.browse`, 12 `.card--enclosure`, `hero-photo--site`, `modnav__divider`, no `btn--primary` in the modnav, a sheet `#sheet-enclosure` with `.figures`, 8 animal rows each with sex tag + `alt`, foot with `btn--outline` and one `btn--primary`; Housing page contains `hero-photo__foot`; `pages/side-sheets.html` contains the enclosure sheet section with its animal rows; render: all frames no sideways scroll; sheet opens on click and Escape closes it.
- [ ] Step 2: FAIL. Step 3: implement (sarus crane photo from Commons, 112×112 WebP, credited). Step 4: PASS light + dark, other screens unchanged, gates; commit "Housing · site screen with the enclosure sheet; Housing hero foot bar (DD-008)".

### Task 4: Audit, DD-008, changelog
- [ ] `node tools/audit.mjs` clean except findings already present before this plan (compare with the DD-007 audit: one known on pharmacy-dispense-detail).
- [ ] `governance/decisions/DD-008-housing-site-overview.md` (proposed, DD-007 format); CHANGELOG Unreleased entry.
- [ ] Gates; commit "DD-008 (proposed): Housing site overview".
