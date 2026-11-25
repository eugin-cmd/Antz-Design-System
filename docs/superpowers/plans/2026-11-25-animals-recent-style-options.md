# Animals · recently added style options — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring every element of the Antz Home style 2 "Recently added" page into the system as opt-in options on existing components, and rebuild the "Animals · recently added" screen with them.

**Architecture:** New looks are modifier classes in `components.css` (tokens only) plus opt-in keyword parameters on the generator helpers in `tools/style7.py` (default = today's markup, so no other screen changes). Docs pages show each option through `docs-src/*.html` or `put_section` blocks; `node tools/docs.mjs` regenerates `pages/`.

**Tech Stack:** CSS custom properties (DTCG tokens → `tokens.css`), Python 3 generator (`tools/style7.py`), Node 22 tools (`build`, `check`, `test`, `docs`, `audit`), headless Chrome for render checks, Pillow for images.

**Spec:** `docs/superpowers/specs/2026-11-25-animals-recent-style-options-design.md` (approved 25 November 2026).

## Global Constraints

- Tokens only: `var(--color-*|--hue-*|--space-*|--text-*|--weight-*|--radius-*|--shadow-*|--duration-*|--ease-*|--size-*)`. No raw hex/px/rem, no new tokens. Missing value → stop and write a proposal.
- No second versions of components. Every new look is a modifier (`.block--variant`) or a helper parameter that defaults off.
- Excluded: dark-green filled buttons with white labels; the Vantara logo. Main button stays `.btn--primary` (#37BD69, #00210C label); current page number stays `--color-accent`.
- Sex tag colours stay: M sky, F coral, UD amber, ID teal.
- Top bar and side panel options are used **only** by `AN_RECENT`. All other `module_page`/`mod` callers produce byte-identical markup.
- Icons only from ANTZ Rounded (DD-004). No panel-collapse icon exists: keep `I("menu")`; file the icon-team request in DD-007.
- Photos: free licensed (Unsplash or Pexels licence), credited in `assets/img/CREDITS.md`. Never copy the reference app's images.
- Never edit `tokens.css`, `colors.json`, `dist/`, `releases/`, `governance/rules.json`, `governance/exceptions.json`.
- Every colour pair passes WCAG AA in light, dark, high-contrast light and dark: 4.5:1 text, 3:1 non-text.
- Gates after every task: `node tools/build.mjs --check && node tools/check.mjs <changed files> && node tools/test.mjs`. Regenerate with `python3 tools/style7.py && node tools/docs.mjs`.

## Review Focus

1. **Other screens unchanged.** Every screen except `screen-animals-recent.html` must regenerate with identical markup. Test: Task 2 Step 1 snapshot, re-checked in Task 6.
2. **Dark and high-contrast modes.** The unread dot, the soft home tile, the accent count and the vivid switch tile must still meet contrast with `data-theme="dark"` and `data-contrast="more"`. Test: the render check in Task 7.
3. **Phone frame (390).** No sideways scroll; one card per row; the side panel is the existing strip. Test: Task 7 asserts `scrollWidth <= clientWidth` in the mobile frame.
4. **Missing photo.** A record without a photo shows the paw placeholder, with the sex tag still on the corner. Test: Task 3 render check includes Indian rock python (no photo).
5. **Long names.** A name longer than the card ("Raja · Sumatran orangutan") cuts off with "…" and has its full text in `title`. Test: Task 3.

---

### Task 1: Species photos

**Files:**
- Create: `assets/img/species/{black-kite,sloth-bear,hill-myna,indian-leopard,sumatran-orangutan,asiatic-lion,bonnet-macaque,rose-ringed-parakeet,gaur,chital}.webp`
- Create: `assets/img/species/portrait.webp` (top-bar avatar, a person, licensed the same way)
- Modify: `assets/img/CREDITS.md` (new section "Species photos")

**Interfaces:**
- Produces: files at `assets/img/species/<slug>.webp`, square, 112×112 (2× `--size-thumb` 56px), WebP quality 80. Later tasks reference them as `species/<slug>.webp` relative to `IMG`.

- [ ] **Step 1:** For each of the 10 species plus one portrait, find a photo on Unsplash or Pexels under its own licence. Record the page URL and the photographer. Download the originals to the scratchpad, not the repo.
- [ ] **Step 2:** Crop to a centred square on the animal's head or body, resize to 112×112 and save as WebP q80 with Pillow (`Image.save(path, 'WEBP', quality=80)`).
- [ ] **Step 3:** Add a "Species photos" section to `CREDITS.md`: a list of `file: photographer (Unsplash|Pexels), page URL`, with the licence line used for the banners.
- [ ] **Step 4: Verify.** Run `python3 -c "from PIL import Image;import glob;[print(f,Image.open(f).size) for f in sorted(glob.glob('assets/img/species/*.webp'))]"`. Expected: 11 files, each `(112, 112)`. Every filename appears in `CREDITS.md`.
- [ ] **Step 5: Commit** `assets/img/species assets/img/CREDITS.md`: "Species photos for record cards (licensed, credited)".

### Task 2: Opt-in parameters on the shared helpers (no visual change yet)

**Files:**
- Modify: `tools/style7.py` (`modbar` l.125, `modnav` l.132, `module_page` l.149, `module_switch` l.116)

**Interfaces:**
- Produces:
  - `module_switch(current, tone=None)`: `tone='vivid'` uses `tile(ic, <hue without "-ink">, True)` for the trigger's tile.
  - `modbar(current, site_label, site_icon='pin', period=False, crumbs=True, bell_dot=False, avatar_img=None, switch_tone=None)`
  - `modnav(current, sections, action, active=None, soft=False)`: `soft=True` adds class `modnav--soft`.
  - `module_page(..., period=False, bar=None, nav=None, strip=False)`: `bar` and `nav` are dicts of extra kwargs passed to `modbar`/`modnav`; `strip=True` adds `modhome--strip` to the `.modhome` div.
  - `avatar_photo(src, name) -> str`: `<span class="avatar"><img src="{IMG}{src}" alt="{name}"></span>`.

- [ ] **Step 1: Snapshot.** Before editing, run `python3 tools/style7.py && node tools/docs.mjs`, then copy every `pages/screen-*.html` to a scratchpad folder `before/`.
- [ ] **Step 2:** Add the parameters. With defaults the output must be unchanged. `bell_dot=True` renders the bell as `<button class="icon-btn icon-btn--dot" ... aria-label="Notifications, 3 new">`. `crumbs=False` drops the `<nav class="crumbs">`. `avatar_img` swaps `avatar("AR","amber")` for `avatar_photo(avatar_img, "Your account")`.
- [ ] **Step 3: Verify no change.** Regenerate, then `diff -r before/ <(pages/screen-*.html)` per file. Expected: no differences except the `?v=` asset hashes.
- [ ] **Step 4: Commit** `tools/style7.py`: "style7: opt-in top bar, side panel and layout options (defaults unchanged)".

### Task 3: Record cards with photos (Animal card page and screen data)

**Files:**
- Modify: `tools/style7.py` (`animal_rec` l.827, `RECENT` l.835)
- Modify: `components.css` (`.animal-card--record .sex-tag` l.1961 only if the ring needs adjusting)

**Interfaces:**
- Consumes: Task 1 images.
- Produces: `RECENT` holds the reference's 14 animals in its order: Mouna · Black kite (F, Today), Sloth bear (UD, Today), Indian rock python (ID, Yesterday), Hill myna (F, Yesterday), Indian leopard (M, 2 days ago), Raja · Sumatran orangutan (M, 2 days ago), Indian peafowl (F, 3 days ago), Asiatic lion (UD, 3 days ago), Bonnet macaque (ID, 4 days ago), Rose-ringed parakeet (F, 4 days ago), Kaveri · Bengal tiger (M, 5 days ago), Gaur (M, 5 days ago), Mahseer (F, 6 days ago), Chital (UD, 6 days ago). Take AAIDs, scientific names, enclosures, zones and sites from the reference text (scratchpad `ref/text-1440.txt`). Photos as `species/<slug>.webp` for the 10 in Task 1; python, peafowl, tiger and mahseer have none (`None`).
- `animal_rec` puts `title="{name}"` on `.animal-card__name`.

- [ ] **Step 1: Write the check.** Create scratchpad `check_cards.py`. It reads `pages/animal-card.html` and `pages/screen-animals-recent.html` and asserts:
  - `'species/black-kite.webp'` appears;
  - `'title="Raja · Sumatran orangutan"'` appears;
  - the Indian rock python card contains `#i-paw` and `sex-tag--id`;
  - every `sex-tag` class still maps M→none, F→`--f`, UD→`--ud`, ID→`--id`.
- [ ] **Step 2:** Run `python3 check_cards.py`. Expected: FAIL (no species images yet).
- [ ] **Step 3:** Update `RECENT` and `animal_rec` as above, then regenerate.
- [ ] **Step 4:** Run `python3 check_cards.py`. Expected: PASS. Screenshot the Animal card page's record section and compare it with the reference cards. Touch the sex-tag CSS only if its ring or size visibly differs, and then only with tokens. Compare two more things the same way:
  - the "Today" time chip (spec #4): add an option only if it still differs after mapping to tokens;
  - the footer icons (spec #14: enclosure `home`, zone, site `pin`): change the zone icon only if ANTZ Rounded has a closer one in the UI sprite.
- [ ] **Step 5:** Gates. Commit: "Record cards: species photos, full name on hover, reference animals".

### Task 4: Side panel options — soft overview tile and accent count

**Files:**
- Modify: `components.css` (after `.modnav .btn--primary`, l.1414)
- Modify: `docs-src/module-bar.html` (new demo "Soft side panel" beside the existing one)

**Interfaces:**
- Produces CSS:
  - `.modnav--soft .sidenav__home { box-shadow: none; }`, with the tinted fill kept;
  - `.modnav--soft .modnav__item[aria-current="page"] > small { color: var(--color-accent-text); font-weight: var(--weight-semibold); }`.

- [ ] **Step 1:** Add a demo to `docs-src/module-bar.html` that shows `modnav(...)` markup twice, the default and with `modnav--soft`. Copy the markup from the generated `AN_RECENT` nav, adding the class to the second.
- [ ] **Step 2:** Add the two CSS rules. Regenerate.
- [ ] **Step 3: Verify.** In Chrome, the soft demo's `.sidenav__home` has computed `box-shadow: none`, and the active `small` colour equals the resolved `--color-accent-text`. Run the gates.
- [ ] **Step 4: Commit:** "Side panel: soft option (no outline on the overview tile, brand count on the active page)".

### Task 5: Top bar options — unread dot, photo avatar, vivid switch tile, no breadcrumbs

**Files:**
- Modify: `components.css` (near `.icon-btn` rules, and `.module-switch` l.1386)
- Modify: `pages/top-bar.html` (hand-written: add a "Top bar options" demo block)

**Interfaces:**
- Produces CSS: `.icon-btn--dot { position: relative; }` and `.icon-btn--dot::after`, a dot of `var(--space-2)` with `border-radius: var(--radius-full)`, `background: var(--color-danger-solid)` and a `var(--border-width-strong)` ring in `var(--color-surface)`, top-end corner.
- Vivid switch tile: no CSS. It is `tile(ic, 'sky', True)` (white icon on `--hue-sky`).

- [ ] **Step 1:** Check vivid contrast. White on `--hue-sky` must be ≥3:1 (non-text icon) in all four modes. Compute it from `tokens.css` (`--sky-50` #00829F light, `--sky-80` dark). If any mode fails, `switch_tone='vivid'` falls back to the soft tile (`tile(ic, hue)`) and DD-007 records why.
- [ ] **Step 2:** Add the dot CSS. Add the demo to `pages/top-bar.html`: the default bar, then a bar with the dot, the photo avatar (`species/portrait.webp`) and no breadcrumbs.
- [ ] **Step 3: Verify.** In the docs page, `.icon-btn--dot::after` has a computed background equal to the resolved `--color-danger-solid`. The button keeps its `aria-label` with the count. `check.mjs pages/top-bar.html` passes (A11Y-02, A11Y-03 alt on the avatar).
- [ ] **Step 4: Commit:** "Top bar: unread dot and photo avatar options".

### Task 6: Tablet page strip, tinted content panel, sort menu; rebuild the screen

**Files:**
- Modify: `components.css` (`.modhome` block l.1424–1427; popover icons)
- Modify: `tools/style7.py` (`AN_RECENT` l.852)
- Modify: `docs-src/popovers-and-pickers.html` (sort menu demo), `docs-src/module-homes.html` (strip and tint note)
- Modify: `assets/site.js` sprite and `icons/antz-rounded/replacements.json` (sort icons), via `tools/icons.mjs`

**Interfaces:**
- Produces CSS:
  - `@container shell (max-width: 839.98px) { .modhome--strip … }`: the same rules as the existing `599.98px` block (modnav as a horizontal strip, body stacked), applied up to the `--bp-tablet-landscape` breakpoint.
  - `.modhome__main` tint: keep the existing fill. If it doesn't read as tinted against `--color-bg`, add `.modhome--tinted .modhome__main { background: var(--color-surface-sunken); }` and give the inner `.list-panel` `var(--color-surface)`.
- UI icons `i-sort-newest`, `i-sort-oldest`, `i-sort-az`, mapped to ANTZ Rounded `sort_newest_first`, `sort_oldest_first`, `sort_a_to_z`. If `icons.mjs` only redraws existing symbols, add the three symbols to the sprite in `assets/site.js` and the mapping, then run `node tools/icons.mjs`.
- `AN_RECENT` calls `module_page(..., bar={'crumbs': False, 'bell_dot': True, 'avatar_img': 'species/portrait.webp', 'switch_tone': 'vivid'}, nav={'soft': True}, strip=True)`. Its sort button becomes `pick('sort-pick', 'Newest first', 'sort-newest', [('Newest first',None),('Oldest first',None),('Species A–Z',None),('AAID',None)], site=False, cls='')`.

- [ ] **Step 1:** Extend scratchpad `check_cards.py`:
  - `screen-animals-recent.html` contains `modhome--strip`, `modnav--soft`, `icon-btn--dot`, `id="sort-pick"` and the four sort labels, and no `class="crumbs`;
  - every other `pages/screen-*.html` equals the Task 2 `before/` copy, ignoring `?v=` hashes.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement the CSS, the icons and the `AN_RECENT` call. Add the sort-menu demo to Popovers and pickers and the strip note to Module homes. Regenerate.
- [ ] **Step 4:** Run the check. Expected: PASS. Run the gates.
- [ ] **Step 5: Commit:** "Animals · recently added: tablet strip, sort menu, soft panel, unread dot (DD-007 options)".

### Task 7: Render checks, DD-007, changelog

**Files:**
- Create: `governance/decisions/DD-007-animals-recent-style-options.md` (status: proposed; DD-006 front-matter format)
- Modify: `CHANGELOG.md` (Unreleased)

- [ ] **Step 1: Render check (scratchpad CDP script).** Open `screen-animals-recent.html` and switch frames (Mobile, Tablet portrait, Desktop). Assert:
  - mobile: `.shell` has `scrollWidth <= clientWidth`, and cards are in one column;
  - tablet portrait: `.modnav` has `flex-direction: row`, and the cards are in two columns;
  - desktop: the side panel is beside the list, in three columns.

  Repeat with `data-theme="dark"`. Screenshot each and compare by eye with the reference captures (`ref/page-1440.png`, `ref/page-820.png`).
- [ ] **Step 2:** Run `node tools/audit.mjs` (Chrome). Expected: clean. Fix any finding with tokens.
- [ ] **Step 3:** Write DD-007:
  - context: the reference URL;
  - decision: the spec's inventory table, with what was added and where;
  - exclusions and the System Owner's decisions;
  - accessibility notes: dot contrast, the vivid tile result from Task 5, the `title` on clamped names;
  - the icon-team request for a panel-collapse icon;
  - affected classes.
- [ ] **Step 4:** Add the changelog entry under Unreleased: one bullet per option and the screen rebuild.
- [ ] **Step 5:** Full gates: `node tools/build.mjs --check && node tools/check.mjs && node tools/test.mjs`. Commit: "DD-007 (proposed): Animals recently added style options".
