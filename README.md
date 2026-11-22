# Design System Foundation

The foundation layer of the ANTZ design system: tokens, general components and documentation. Vanilla HTML/CSS, with no build step.

## What's here

| File | What it is |
| --- | --- |
| `tokens.css` | Primitives (raw palette, type, space, radii, motion) and semantic tokens, with light and dark themes. |
| `components.css` | Every general component, using tokens only: buttons, fields, selection controls, chips, badges, status, avatars, icon tiles, cards, rows, alerts, toasts, tooltips, menus, dialogs, progress, table, skeleton and empty state, app bar, side nav and dock. Then the components from the Figma file (see below). |
| `index.html` | The docs site's welcome page. |
| `pages/` | One page per topic: getting started, foundations (including colour guardrails), components, pattern components, stat cards, screens, content and resources. Each has a banner, Overview / Usage / Code tabs and next / previous links. |
| `assets/site.css`, `assets/site.js` | The docs site's own chrome, demos and icon sprite. Not part of the system. |
| `colors.json` | Every colour token, light and dark, in the W3C design-tokens (DTCG) format. [Download it](colors.json). |
| `tools/colors.py` | Builds `colors.json`, checks it against `tokens.css`, and works out the contrast table in Colour guardrails. No dependencies. |
| `tools/import_theme.py` | Imports a theme exported from the Design System Previewer as a brand next to ANTZ. No dependencies. |
| `assets/theme-import.js` | The same importer in JavaScript (an ES module, no dependencies), used by the site's Import theme page. Gives byte-identical output; see "Two importers" below. |
| `tools/test_import_parity.mjs` | Runs both importers on every example and theme (plus generated and broken inputs) and diffs the CSS, `index.json`, the source copy and the report. `node tools/test_import_parity.mjs` |
| `themes/` | Imported brands: `<slug>.css` (token overrides), `<slug>.antz-theme.json` (the source) and `index.json` (the list the brand switcher reads). Written by the importer; don't edit by hand. |

Run it locally:

```sh
cd "design-system-foundation" && python3 -m http.server 8092 --bind 127.0.0.1
# then open http://localhost:8092/
```

## The docs site

Static HTML, no build step. The layout follows the Backpack docs pattern (top bar with search, grouped left navigation, page banners, in-page tabs, "On this page", next and previous links) in the ANTZ look.

- **Navigation:** the nav is written into every page, so links work without JavaScript. Search in the top bar filters it; press `/` to jump there. Below 1024px the nav opens as a drawer.
- **Tabs:** Overview holds the live demos, Usage the do's and don'ts, Code the classes and markup. Link to a tab with `#usage` or `#code`, or to a section by its id.
- **Screens:** each screen has its own page with Mobile (390 × 844), Tablet portrait (820 × 1180), Tablet landscape (1180 × 820), Desktop (1440 × 900) and All sizes. Every frame renders the same template, so one edit changes all four.
- **Adding a page:** copy a page in `pages/`, change its banner and panels, and add it to the nav block and the pager links. Old single-page links such as `index.html#buttons` redirect to the new page.
- Stylesheet and script URLs carry `?v=` so a browser can't pair a cached old stylesheet with new pages. Bump it when you change them.

## Using it

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="design-system-foundation/tokens.css">
<link rel="stylesheet" href="design-system-foundation/components.css">
```

- Use only semantic tokens in your own CSS: `--color-surface`, `--color-text-muted`, `--space-4`, `--radius-lg`, `--shadow-sm`, `--duration-base`, `--ease-standard`. Primitives such as `--green-700` exist only to build those.
- Theme: dark follows the OS (`prefers-color-scheme`). Force a theme with `<html data-theme="light">` or `data-theme="dark"`.
- Accent hues are a categorical set for avatars, icon tiles and chart series: `--hue-{green|teal|sky|coral|amber|violet|navy}`, each with `-soft` (fill) and `-ink` (text). Example: `<span class="tile-icon" style="--c: var(--hue-coral)">`.
- Icons are a 24px outline sprite, inserted by `assets/site.js` (`<svg class="icon"><use href="#i-bell"/></svg>`). Copy the `<symbol>`s you need. Lucide matches the drawing style if you need more.
- Breakpoints: mobile under 600px, tablet 600 to 1023px, desktop 1024px and up (`--bp-tablet`, `--bp-desktop`; `--bp-wide` 1280px). CSS variables can't go in media queries, so use the numbers. App layouts use container queries instead: put them in `.shell-host` and the tab bar becomes a side rail from 600px (a full rail from 1024px), `.split` puts main and aside side by side from 1024px (stacked in tablet portrait; `--even` goes two columns from 600px), and `.card-grid` goes to 2, then 3 to 4 columns as the container grows.
- Motion: cards lift and press, rise into view with a stagger, count their figures up once and crossfade them on period changes; the status rail grows in. Every duration and distance is a token (`--duration-enter`, `--duration-count`, `--stagger`, `--motion-lift`, `--motion-press`, `--motion-rise`), and `prefers-reduced-motion` sets them to zero.
- Brands: a theme imported from the Previewer applies with `<html data-brand="<slug>">` plus `themes/<slug>.css` (which also loads its Google Fonts). See "Importing a theme" below.
- Colour: `colors.json` mirrors the tokens. After changing a colour token, run `python3 tools/colors.py build`, then `check`, then `html` to refresh the contrast table.

## Importing a theme

A theme built in the Design System Previewer can be added to this site as a brand. It sits next to ANTZ: ANTZ stays the default and does not change, and the top bar gets a brand menu (from 600px wide) that lists every imported brand.

1. **Export** the theme from the Previewer. You get `<slug>.antz-theme.json`.
2. **Import** it from this folder:
   ```sh
   python3 tools/import_theme.py path/to/<slug>.antz-theme.json --dry-run   # report only
   python3 tools/import_theme.py path/to/<slug>.antz-theme.json             # write themes/
   ```
3. **Check the report.** It lists the tokens set from the theme's parts, the tokens worked out from them (hover, pressed, soft, borders, focus, disabled, shadows, feature gradients) and says that every other token inherits ANTZ. It then gives WCAG ratios for text on the board, text on cards, text on the accent, secondary text and links, in light and dark, and warns about any approved pair that falls below AA. Warnings don't block the import.
4. **Look at it:** run the local server above and open `http://localhost:8092/?brand=<slug>`, or pick it in the brand menu. Colour, Contrast, Typography and Colour guardrails show the brand's own values.
5. **Redeploy:** `vercel --prod` from this folder.

Importing the same slug again replaces that brand. To take one out: `python3 tools/import_theme.py --remove <slug>`, then redeploy. The slugs `antz`, `light`, `dark` and `auto` are reserved.

How the Previewer's parts map to tokens is the table at the top of `tools/import_theme.py`. Parts with no equivalent here (status bar, app bar, heading colour, icons, module tiles, photos, badges) are reported and skipped. A theme built on one of the Previewer's presets (with no parts set) is read from its Material 3 roles instead. Fonts: the most common family across display, headline and title becomes `--font-heading`, the body and label family becomes `--font-body`; only the weights the theme uses are loaded.

### From the site: the Import theme page

`pages/import-theme.html` (Resources > Import theme, the brand menu's "Import theme…" entry, or the card on the home page) does the same import in the browser:

1. **Drop, pick or paste** the `.antz-theme.json`. It is checked with specific messages (bad JSON, wrong format or version, slug, colour, font).
2. **Check the preview:** name and slug, key colours light and dark (and where each came from: a part, worked out, or ANTZ), a live sample card in both modes, the fonts, token counts, the contrast of the key pairs with AA chips, the parts not used, warnings (for example "No accent set") and the full report, which is the same text the CLI prints.
3. **Apply to this site** stores the generated CSS and manifest entry in this browser (`localStorage` key `antz-ds-local-themes`) and switches to it. Every page's head script loads it as an inline `<style id="brand-css">` before first paint, and the brand menu shows it as "Name · this browser". If the site already has that slug, the browser copy wins here and the menu says "(overrides site)". Re-importing the same slug replaces it; "Themes in this browser" lists them with Use and Remove. **This only changes your browser.**
4. **Save into site files** (Chrome or Edge): pick the `design-system-foundation` folder. The page checks it holds `tokens.css` and `themes/`, re-runs the import against that folder's own `tokens.css` and `themes/index.json`, and writes `themes/<slug>.css`, `themes/<slug>.antz-theme.json` and `themes/index.json` exactly as `python3 tools/import_theme.py` would. Then redeploy with `vercel --prod`. The browser copy is dropped as soon as the site serves the saved file (straight away when the page is served from that folder, otherwise after the redeploy). Where the browser can't write to a folder, **Download files** gives the three files plus the `python3 tools/import_theme.py` command, which is the surer route because it reads your folder's own `index.json`.

### Two importers

The importer exists twice, `tools/import_theme.py` (the CLI, Python only) and `assets/theme-import.js` (the site page, also runs in node). They were kept as two full implementations rather than making the Python call node, so the CLI keeps working on machines without node and the site needs no build step. The price is that **any change to the mapping, the derivation rules, the CSS layout, the manifest or the report must be made in both files**, then checked with:

```sh
node tools/test_import_parity.mjs          # about 10 s; --quick skips the 60 generated themes
```

It runs both on every `*.antz-theme.json` in `../theme-exports/examples/` and `themes/`, 60 generated themes (presets, odd JSON numbers, duplicate keys, font ties) and 15 inputs that must be refused, and compares the report, the three written files byte for byte (imports run in sequence, so appending to and replacing entries in `index.json` are covered) and the error messages. The JS mirrors the Python details that show in the output: key order, ints versus floats in JSON, round-half-even and `%.2f`.

## Sections from the Figma file

Four groups of pages come from the local Figma file `Antz Design System.fig`, from its pages "Foundational Components (atoms)", "Pattern components (molecules)", "Stats cards" and "screens". They were redesigned onto these tokens rather than copied: Figma's nine colour "types" map to the accent, the status colours and the accent hues, and photos are replaced by tinted placeholders.

- **Foundation components:** only what was missing. Button tones (`.btn--tint`, `.btn--line`, `.btn--info`, `.btn--warning`, `.btn--gradient`), icon-button tones, `.fab`, field icons and the floating label (`.input-group`, `.field--float`, `.field__help`), the pill search bar (`.search--pill`), option groups (`.fieldset`), pill and person chips, line and figure tabs (`.segmented--line`, `.segmented--stat`) and the bottom navigation (`.tabbar`). A table at the top of the section maps every Figma component to its class.
- **Pattern components:** mobile top bar and action bar, post card, attachments (drop zone and file tiles), priority picker, lists, date picker, animal card with sex tags, and a ring progress.
- **Stat cards:** stat figures, key insights, the insights summary, the site card and the day, week and month switch.
- **Screens:** six screens (Home, Housing, Choose people, Add task, New request, Set a date), each laid out for mobile, tablet portrait, tablet landscape and desktop, built only from the components above.

Status accents sit inside the box, never on its outer edge: a 4px rounded rail beside the text block (`.rail`, applied automatically by `.row--alert`, `.post--important` and `.animal--mortality`; colour via `--rail-color` or `.rail--success|warning|info`). Every page has its Do / Don't blocks on the Usage tab (`.dd`), some with a small "wrong" example.

Tones take a `--c` custom property set to an `-ink` token, for example `style="--c: var(--hue-teal-ink)"`, so text on tints passes AA in both themes. 26 icons were added to the sprite in the same outline style.

## Where the values came from

- **Look:** ANTZ Home Style 6 (`antz-home-style-2.vercel.app/style-6`, read 9 Nov 2026). Its CSS is inline in the page. The fonts (Inter 300–700, Google Fonts), the palette (lime #52F990, lime-ink #006D35, deep #00512A, board #DDEFE4 / #EAF5EE, ink #0E1512, coral #FA6140, teal #00ABAB, sky #00AFD6, navy #1F415B, charcoal #26252F), the type sizes, radii, shadows (`--sh`), easing (`cubic-bezier(.2,.7,.2,1)`), gradients and breakpoints were all taken from that CSS.
- **Structure:** modelled on Shopify Polaris (foundations → tokens → components → patterns → content), GitHub Primer (functional colour tokens with light and dark from one set of names), Atlassian (surface and elevation tokens, guidance per component) and GOV.UK (plain words, do/don't, accessible by default). All four are on alexpate/awesome-design-systems.

## Derived (not on Style 6)

- **Dark theme:** all of it.
- **Text colours that pass AA:** muted text #5F6B67, because Style 6's #7A8684 is only 3.8:1. Also coral-700 #C2401F for danger text and buttons, amber-800 #8A5A00 for warning text, sky-800 #006E85 for info text, and teal-700 #007A7A.
- **Input border:** #879590, which reaches 3:1. Style 6 uses a fainter #DCE6E1 border on a filled field.
- **Focus ring:** sky-700 #0089A8. Style 6's ring uses sky-500, which is 2.6:1 on white.
- **Also new:** status colour sets and the accent hues (violet-600 and navy-100 are new).

## Open questions

1. **Side nav:** light (Style 6) or deep green? Both are built.
2. **Blue and teal feature cards:** white text on them fails AA for small text. Keep them for big figures only, or drop them?
3. **Colours from Material 3:** Style 6 says its colours come from MD3_Antz, and there is also an `antzdesignsystem` skill with M3 role tokens. Should these tokens be mapped onto those M3 roles?
4. **Brand colours per organisation:** themes from the Previewer can now be imported as brands (see "Importing a theme"). Still open: should products ship a brand this way, and which tokens may a brand change?
