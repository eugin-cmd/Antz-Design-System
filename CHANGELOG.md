# Changelog

All notable changes to the Antz Design System. Versions follow semantic versioning: patch for fixes, minor for additions, major for anything renamed, removed or changed in meaning. Every version listed here is published under `releases/` and tagged in Git.

## Unreleased

### MUI spacing scale (RFC-002)
- The Antz MUI theme sets `spacing: 8` and exports **`antzSpacing`**: the MUI spacing factors that land on an Antz space step (`p: 2` = 16px = `--space-4`, `p: 1.5` = `--space-3`, `gap: 1` = `--space-2`). Generated from the space tokens.
- The guardrail check now **accepts** those factors in `sx` and flags only off-scale numbers (for example `p: 3.5`, 28px), naming the nearest Antz step.
- Fix: the MUI theme's usage comment imported from `@antz/design-tokens/mui`; the package is `@antz/design-system/mui`.

### Docs: screen preview
- **Open larger** on every screen frame (all four device sizes) and every Mobile app frame opens the screen in a full-window preview: switch device, Fit, 100% or 150%, light or dark, Esc or ✕ to close. The screen stays live (tabs, sheets, dialogs); keyboard focus stays inside and returns to the button.
- Fix: the Mobile app · Tags New tag screen showed its Create tag bar inside the form; it is at the foot of the screen now, and an empty roles list no longer draws an empty box.

## 1.2.0-beta.8 (27 November 2026)

The **Antz Design System agent** (TD-003, accepted): a Claude Code plugin that every team installs once, pinned to this release. **/systemdesigner** builds only from the system, **/systemauditor** audits a product read-only (code and rendered screens), **/openvisualguide** opens this guide. The checker now reads web (MUI) and React Native code and warns about deprecated names. Governance files for GitHub, and a Brand history page. DD-009 (the Tag module, shipped in beta.7) is accepted. 866 tokens, 724 contrast checks.

Install the agent in a product repository: `/plugin marketplace add eugin-cmd/Antz-Design-System#v1.2.0-beta.8`, then `/plugin install antz-design-system@antz` (guide: `docs/agent-onboarding.md`). Upgrade the CSS, themes and React Native package by changing `v1.2.0-beta.7` to `v1.2.0-beta.8`; nothing is removed or renamed. Existing products may see new check findings in their MUI and React Native code (literal values that never came from the system).

### The Antz Design System agent (TD-003, accepted)
- **Claude Code plugin** *Antz Design System* (`antz-design-system`, in `agent/`; catalog `antz`). Install once per product repository, pinned to the release tag: `/plugin marketplace add eugin-cmd/Antz-Design-System#vX.Y.Z`, then `/plugin install antz-design-system@antz`. The plugin's version is the system's.
- **/systemdesigner** (the design-system skill, renamed): builds only from the system, reports the version, parts used, deviations, checks and deprecated names.
- **/systemauditor** (new, read-only): code checks plus rendered checks in Chrome (contrast in four modes, tap targets, names, alt text, focus, JavaScript errors), graded Critical, Major, Minor and Accessibility with the rule and the fix for each finding, and what could not be checked.
- **/openvisualguide** (new): opens the official visual guide.
- **The checker reads developer code:** MUI `sx` and `style` objects, `styled(…)({…})` and React Native `StyleSheet`; React Native findings name the `antzTheme` value. **Deprecated names** are warned about with their replacement (`governance/deprecations.json`, rule ANTZ-DEP-01, RFC-001).
- **Governance:** `.github/CODEOWNERS`, importable GitHub rulesets for `main` and the release tags, and "Who can change the official system" (Governance page and `governance/README.md`).
- **Brand history** page (Governance): every release's brand, read from its frozen files.
- **Onboarding:** `docs/agent-onboarding.md`, README and Get started. `skills/antz-design-system` now points to the plugin.

## 1.2.0-beta.7 (27 November 2026)

The Tag module (DD-009, proposed), on the web and in the mobile app. Tag chips keep the prototype's shapes (a pill for public tags, a tag shape for private ones) and take every colour from tokens, on one priority scale: Normal, High and Critical, each with its mark. New pages: Tag chips, Tags (patterns), the Tags, Tags · public and Animal · tags screens, and Mobile app · Tags from the Global Tagging Module design. Also an opt-in bottom sheet for phones, the system Animal card in tag lists, and React Native tag chip roles. 866 tokens, 724 contrast checks.

Upgrade by changing `v1.2.0-beta.6` to `v1.2.0-beta.7`. Nothing is removed. The priority picker now says **Critical** (was Emergency) and its High is amber; `priority__opt--emergency` still works as an alias of `priority__opt--critical`.

### Tag module (DD-009, proposed)
- **Tag chip** (new component page *Tag chips*): a pill for public tags and a tag shape with a point for private ones. Priority uses the priority picker's scale, Normal `!` (info), High `!!` (caution, amber) and Critical `!!!` (danger), and always shows its mark, so it never depends on colour alone. No priority is neutral. Private tags someone else added show their initials; chips can be removable, new or static, and long names truncate.
- **Tags patterns** (new page *Tags*): the tag strip in a record hero (latest four and +N), add a tag (search, pick or create, priority, schedule, visible to all), tag info (Info and Entities), tag history, and the new tag, category and filter sheets, plus the confirm and custom range dialogs.
- **Screens:** Tags (the hub; replaces the placeholder Tags home), Tags · public and Animal · tags.
- **Priority picker:** High is now amber (`caution`), as its docs describe, so it matches tag chips.
- **Priority names:** Normal, High and **Critical** (was Emergency), in the priority picker and tag chips; same colours and marks. `priority__opt--critical` is the class now; `priority__opt--emergency` still works.
- **React Native:** `roles.tagChip` (none, normal, high, critical) in every scheme.
- **Mobile app · Tags** (new Screens page): the Tags flows of the mobile app from the Global Tagging Module design, as phone frames on system parts.
- **Bottom sheet** (`drawer--bottom`, opt-in): on phones a floating sheet rises from the bottom and sizes to its content.
- **Fix:** a long side sheet no longer squashes its search and lists; it scrolls.
- App team: rename the priority levels Low, Moderate and High to Normal, High and Critical.

## 1.2.0-beta.6 (26 November 2026)

The release for teams to start on. React Native gets an installable, typed theme with shadows, gradients and colour roles, plus recipes. DD-006, DD-007 and DD-008 are accepted: the record-card style options, the Housing site overview and browse panel, and the Pharmacy pinned table with its edge shadow. Also responsive fixes, priority tag padding, and an onboarding review of every getting-started doc. 866 tokens, 724 contrast checks.

### React Native
- **Install a pinned release from GitHub:** `npm install github:eugin-cmd/Antz-Design-System#vX.Y.Z`, then `import { antzTheme } from '@antz/design-system/react-native'`. A generated `package.json` also exposes the MUI theme, the tokens JSON and the CSS.
- **The theme ships as JavaScript with TypeScript types** (`antz-theme.js` and `antz-theme.d.ts`), so an unknown token fails to compile. `antz-theme.ts` stays for existing users.
- **New in the theme:**
  - shadows as iOS shadow props plus Android elevation, per scheme;
  - gradients for `expo-linear-gradient` (colours, stop positions, start and end), with the radial and layered ones listed in `gradientWebOnly`;
  - line heights and letter spacing;
  - colour roles for the status pill, priority tag and sex tag in every scheme.
- **Fix:** the `move` easing curve was exported as the text `"{ease.elastic}"`. It is now the curve's numbers, and the build fails if an unresolved reference reaches the theme.
- The Developers page has the install command, one theme hook and recipes (button, status pill, priority and sex tags, card shadow, gradient, type, motion).

### Onboarding and docs (final review)
- Apps take themes from the pinned release (copy, git submodule or the GitHub install), never the working copy. The docs now say where to clone, and how designers pin the skill: install it from `releases/vX.Y.Z/skills/` and set `ANTZ_DS_VERSION` in `.claude/settings.json`.
- **Going back** is one method everywhere: `tools/rollback.mjs` for the source, `tools/deploy.mjs --rollback` for the site.
- **Facts corrected:**
  - 724 contrast checks; 68 legacy literals;
  - 26 rules, 16 of them checked automatically;
  - the System Owner is named;
  - the site is described as unlisted, not private.
- Help, proposals and exceptions go to the System Owner. A "Words you'll see" section explains DD, FD, TD, RFC, EXC, DTCG and Foundation v0.2.
- **EXC-001:** the reason now says the legacy literals move to tokens before the exception expires on 31 March 2027, with the System Owner's approval.
- **Audit:** it waits for web fonts and two paint frames before each capture, and every browser command has a 30-second limit, so a page Chrome never answers fails the run instead of hanging it.

### Priority tags
- **Padding:** tags now have padding all round (2px by 8px) and never stretch to fill a column; the Record lists demo shows them in a row.
- **Record lists:** Urgent was showing grey text, because the rule for a row's second line also caught the tag. That rule now applies only to direct children. Urgent shows its warning icon in every list.

### Housing: site overview and browse panel (DD-008, accepted)
Only the pieces the libraries did not already have, from the Antz Home style 2 Housing page and the Site overview it opens.
- **Browse panel** (new pattern page): sections beside the chosen section's enclosures, with figures, the person in charge, a search and View all.
- **Enclosure card** (`card--enclosure`): name, species photos, counts and a status pill.
- **Figures panel** (`figures`, `figures--glass`) and **compact contact** (`contact--pill`, `contact--glass`). `record-hero__stats` is now an alias of `figures figures--glass`: existing record heroes keep working, with the shared glass, outline and divider and their hero-sized figures.
- **Heroes:** a foot bar with spread figures (`hero-photo--foot`), and the site hero with a back chip, overline, person in charge and glass figures (`hero-photo--site`).
- **Side panel:** groups divided by a line (`modnav__divider`) and an option without the main action.
- **Enclosure sheet** on the Side sheets page: figures, status and animal rows with the animal card details.
- **Screens:** new Housing · site; the Housing hero gets the foot bar. A sarus crane photo (credited).

### Animals · recently added: style options (DD-007, accepted)
Every element of the Antz Home style 2 "Recently added" page, as options next to the current styles. Nothing changes for existing markup; the other module screens are unchanged.
- **Record cards:** species photos (credited), the paw when there is none, the full name on hover when it is cut off, and the reference's 14 animals.
- **Side panel:** `modnav--soft`, with the overview tile without its outline and the active page's count in brand text.
- **Module bar:** the existing unread dot (`icon-btn__dot`), a photo avatar, a brighter switcher tile and a version without the breadcrumb.
- **Layout:** `modhome--tinted` sets the main column on the canvas tint behind a white list panel; `modhome--strip` turns the side panel into rows above the list on tablets.
- **Sort menu:** a picker with Newest first, Oldest first, Species A–Z and AAID, whose trigger icon follows the chosen order; new UI icons `i-sort-newest`, `i-sort-oldest`, `i-sort-az` from ANTZ Rounded.
- **Screen:** Animals · recently added uses all of them.
- **Not adopted:** dark-green buttons with white labels (FD-003), the client logo, the reference's sex-tag colours (they fail contrast, and the system's stay), and a panel-collapse icon (requested from the icon team).

### Tables
- **Pinned column shadow:** once a wide table scrolls, the pinned first column casts a soft shadow on the columns sliding under it, as in the Pharmacy app, instead of a hairline. New elevation token `--shadow-edge` (light and dark). The pinned table uses separate borders so the cells can cast it. 866 tokens.

### Fixes
- **Split button:** the menu trigger sits inside `.pop-anchor` so its menu can open, which the split styles missed. It now joins the main action with square inner corners and the divider, instead of showing as a separate rounded button.
- **Module switcher:** the grid has three columns instead of four, so long names such as "Announcements" fit on one line at full size instead of spilling past their tile. Anything longer wraps inside the tile. The module you are in now sits on a warm cream tile (`--hue-amber-soft`, with rounder corners) instead of the grey used for hover.
- **Search in popovers (module switcher on every module home):**
  - opened with a mouse or touch, the search field stays at rest (filled, no ring) instead of jumping to its focus style; opened from the keyboard, focus still moves in so people can type straight away;
  - it keeps its height (`--size-control-md`) instead of shrinking when the list below is long;
  - on focus it keeps its fill and a 2px ring, without the outer glow that crowded the popover edge.

### Governance
- **DD-007 and DD-008 accepted** by the System Owner (26 November 2026): Animals · recently added style options, and the Housing site overview.
- **DD-006 accepted** by the System Owner (25 November 2026): role homes, every module home, record lists, quick add, the Pharmacy app pieces and the four colour families.

## 1.2.0-beta.5 (25 November 2026)

Adds role homes and a home for every module (DD-006, from Antz Home style 7 and the Pharmacy app): 29 new screens, new component pages (Record lists, Popovers and pickers, Side sheet forms, Lists and charts, Timelines and charts, Role homes, Quick add, Module homes, Widget board, Module bar, Record detail), seven new table styles, animal record cards, four new colour families (Lagoon, Vivid mint, Wine, Bronze) with every gradient built from primitives, and the tools to go back: a rollback command, a deploy tool with snapshots and previews. 865 tokens, 724 contrast checks. DD-006 is still proposed.

### Pharmacy app (antz-pharmacy-web): pinned table, record detail, dispense sheet
- **Table:** a new style, wide with a pinned first column (`table--pinned`). The record ID stays put while the other columns scroll under it, with a hairline at its edge once scrolled. Cells: priority tag, pending with progress, status with a note, people, long waits.
- **New component page, Record detail:**
  - the detail head and the facts card;
  - tabbed tables (`data-tabs`): requested medicines with tags, a note and shipped progress, and shipments with vehicle and driver;
  - the dispense side sheet: green hero with figures, contacts with call and chat, the animal or "No animal linked", the medicines, Print slip and Dispense again.
- **Screens:** Pharmacy · requests (now the pinned wide table), Pharmacy · request detail (new), Pharmacy · dispense (rows open the sheet), Pharmacy · dispense detail (new). The Pharmacy side panel shows the Reports sub-pages.
- **Token:** `--gradient-band-green` (green 20 to 35, with a soft glow), gated against white text. 865 tokens, 724 contrast checks.
- **Fixes:**
  - side sheets inside phone and tablet frames now size to the frame, not the browser window;
  - a sheet shown already open (`drawer--shown`) does not slide in;
  - tabs with panels work outside dialogs too.
- **Audit:** it now finishes script animations before measuring, and confirms a contrast failure with a second capture, so a capture taken before the page repaints is no longer reported.

### Table styles (from Antz Home style 7, Animals lists)
- **Six new table styles** on the Table page, all built on `.table`:
  - **record table**: a photo with the sex tag, ID, name and scientific name, two-line cells, a date and a chevron; the whole row opens the record;
  - **with status**: a status pill column;
  - **with a row action**: a real Restore button, not a chip;
  - **compact figures**: right-aligned tabular numbers and a totals row;
  - **selectable and sortable**: row checkboxes, select all, a bulk bar with the count, and sortable headings;
  - **striped with a sticky head**: for long logs.
- Optional columns (`table__opt`) step back under 600px. Sorting and selection live in components.js.
- The basic table is unchanged.

### Animal record cards (from Antz Home style 7, Animals > Recently added)
- **Record card:** a variant of the animal card (`animal-card--record`), not a second animal card: the photo or a paw with a solid sex tag on its corner, the AAID, name and scientific name, a time pill, and the enclosure, zone and site under a hairline. `.animal-cards` fits three, two or one to the space. On the Animal card page.
- **Screen:** Animals · recently added, with the module side panel, search, filters, sort, the card grid and pagination.
- **Token:** `--size-thumb` (56px), the record thumbnail. 864 tokens.
- Sex tags keep our colours (male sky, female coral, undetermined amber, indeterminate teal) rather than the reference's.

### Component pages: every variant the screens use is now demoed
- **Module homes:** band hero in wine and bronze, the bright glass button, a falling trend delta.
- **Widget board:** the four-column board, the board menu's filter panel with its foot, the account menu with its flat access summary, the centred quick actions dock.
- **Record lists:** people rows with round photos and presence.
- **Module bar:** the whole module home layout (`modhome`): bar, side panel and main column together.
- **Dashboard widgets:** the wide photo tile and the two-by-two tile grid.
- **Layout and breakpoints:** split columns (`split`, `split--aside`, `split--even`, `split__col`). Fixed the Don't list, which still named the old Style 6 breakpoints.

### Going back: rollback, deploy and snapshots
- **`tools/rollback.mjs`:** restores any published version's source as a new commit. It shows what would change first, runs the gates and undoes itself if one fails. `git revert HEAD` undoes the rollback. Releases, the changelog and the decision log are kept.
- **`tools/deploy.mjs`:** deploys only committed work, with the deploy settings, `robots.txt` and noindex header now kept in the repository (`deploy/`) instead of a temporary folder. It checks the site is still private after every deploy.
- **Snapshots:** every deploy is labelled with its commit and kept at its own address. `--list` shows them, `--rollback <id>` puts one back live in seconds, and `--preview <name>` shares unreleased work without going live.
- Documented on the Versions page and in HOW-IT-WORKS.md (section 6). Fixed the compare example, which compared beta 4 with itself.

### Screens and components: role homes and every module home (DD-006, proposed)
- **Role homes:** Home with one module (Pharmacy), three modules (Animals, Eggs, Collections) and seven modules (Medical and care).
- **Module homes:** Collections, Necropsy, Fetal death, Tags, Medical, Administer, Lab, Approvals, Reports, Security, Focus hub, Users, Help desk, Pharmacy, Hospital and Announcements, plus list pages for Pharmacy requests and dispense, and Hospital patients and incoming.
- **Component pages:** Record lists, Popovers and pickers, Side sheet forms (Components); Lists and charts, Timelines and charts (Stat cards); Role homes, Widget board, Module bar and side panel, Module homes, Quick add (Pattern components). The DD-005 pieces that were only in screens now have gallery pages too.
- **New components:** band hero, banner hero, panel hero, class cards, date scroller, range bar, section head, record lists, priority tags, pagination, attention rows, column chart, thumbnails, split card, split button, quick dock, review rows with routes, deltas, side-sheet forms, quick add dialog, in-app toast (`data-toast`).
- **Tokens:** `--gradient-butter`, `--color-butter-text|caption|figure`, `--gradient-band-ink`, `--gradient-class-card`; the sky gradient runs sky 40 to 30 so white text keeps 4.5:1 at every width. Every gradient now builds its colours from primitives (new `--lagoon-mist`), and the build fails on a colour literal in a gradient. 863 tokens, 712 contrast checks.
- **Rules:** identity fills (butter, peach, maroon) never carry status; bad news is a plain widget with a status pill.
- **Four new colour families (primitives):** Lagoon (#00ABAB), Vivid mint (#86F09A), Wine (#7A1A2C) and Bronze (#7A5300), each a full tone ramp. Mint and teal fills now use vivid mint and lagoon; band heroes add lagoon (default), wine and bronze; peach tuned to the reference.  Shown on the Colour page.

### Screens and components: module homes (DD-005)
- **Home is a widget board** like Antz Home style 7: board bar (Menu, site picker, add, edit with Undo changes and Done), photo hero, widgets in two columns, quick add, Today, announcements and observation notes. **Add widgets** gallery (categories, search, Default view, On board, then style and size), **All modules** dialog, **Menu** with its filter panel, site picker and account menu. Mobile, tablet and desktop.
- **Module homes** for Animals, Housing, Eggs and Mortality: module bar (back, module switcher, breadcrumb, site and period pickers), module side panel (folds; a strip on phones), hero, widgets and lists.
- **New components:** `.board`, `.board-bar`, `.modbar`, `.module-switch`, `.crumbs`, `.pick`, `.modnav`, `.modhome`, `.hero-strip`, `.glass-stats`, `.meter`, `.list-card`, `.item`, `.rank`, `.activity`, `.donut`, `.legend`, `.trend`, `.dots`, `.notes`, `.popover`, `.picker`, `.filter-panel`, `.dialog--wide`, `.gallery`, `.widget-styles`, `.modules-dialog`, `.menu-btn`, `.round-btn`, `.task-row`; widget fills `--peach`, `--maroon`, `--navy`, `.widget__pill`, `.widget--hero`.
- **New tokens (761):** `--gradient-peach`, `--gradient-maroon`, `--color-peach-text|caption|figure`, `--size-popover`, `--size-popover-lg`, `--size-dialog-wide`, `--size-donut`; 616 contrast checks.
- **Menu panel like style 7:** a head with search and filter tools and a soft divider, then large module tiles (`.module-tile`, four across) under "My order"; search and the filter panel open in place (`data-toggle`). The module switcher keeps its compact grid (`.popover--switch`).
- **Pin modules in the menu:** on hover or keyboard focus a module tile turns white and lifts, and a pin appears; pinned modules keep a green pin (`.module-tile__pin`, aria-pressed, Pin or Unpin). On touch screens the pin always shows. The pushpin icon (`i-pushpin`) is provisional until the icon team draws one (DD-004).
- **Rules review:** bad-news widgets are plain widgets with a status pill (peach is identity only); observation notes are off the celebrate wash; dialogs trap focus; screen markup uses small classes (`.widget__tiles--grid`, `.card--soft`, `.photo-tile--wide`, `.dock--center`, `.menu__item--accent`, `.gallery__default--flat`) instead of inline styles; popovers position themselves.
- **components.js:** popovers, dialogs, pickers, single-choice chips, remove and undo on the board, the two-step gallery, the modules dialog, the folding side panel. Screen previews now suffix id references too, so each device frame works on its own.

### Docs site
- **Home hero:** the photos sit under a 55% black overlay (was 50% deep green), and a holographic iridescent sheen drifts slowly in the bottom-right corner, feathering off towards the left. It stays clear of the text column: the intro holds 6.2:1 on the brightest photo at every point of the drift (6.3:1 without the sheen). The hero's pause button stops it, it is still under reduced motion, and hidden in high contrast. New tokens `--gradient-iridescent` (from the colour scales) and `--gradient-feather-corner` (a mask), 752 tokens.
- **Page banners on dark gradients:** each page's title and tabs sit on one of four dark feature gradients with light text, kept per section: deep green for Getting started and Resources; navy for Foundations, Stat cards and Governance; petrol for Components and Screens; green for Patterns and Content. One continuous gradient runs across the banner and the tabs (no seam). (Tried the soft washes first: too little contrast with the page.)
- **Sidebar on every page:** since the sidebar became a navigation drawer, `tools/docs.mjs` no longer refreshed it on the 51 hand-written pages (its class is now `site-nav navdrawer …`), so those pages lacked the newer links (Colour scales, ANTZ Rounded icons) and showed v1.2.0-beta.3. Fixed, and the tool now fails if any page's sidebar is not regenerated. The docs pages inside the frozen v1.2.0-beta.4 copy keep the old sidebar; its tokens, components and scripts are unaffected.

## 1.2.0-beta.4 (24 November 2026)

Adds the icon system: the ANTZ Rounded set (207 line and filled icons, 30 Primary tiles) with 44 component icons redrawn, 118 animated line icons that play once, and DD-004 on which icons to use where (`--icon-stroke` is now 2). Also adds the colour scales (110 tokens), the floating navigation drawer with its sliding tab, and the redesigned docs sidebar. Upgrade by changing `v1.2.0-beta.3` to `v1.2.0-beta.4`; nothing removed or renamed. Icons render slightly bolder (2px).

### Icons: ANTZ Rounded
- **ANTZ Rounded icon set** imported from the ANTZ Icon Library and Builder (github.com/roshni-draws/icon-library-ads, commit 263fcaf) into `icons/antz-rounded/`: 207 icons in line and filled, 30 animated Primary icons (SVG plus Lottie per colour scheme), the index and style specs. All are **drafts**. The retired #36BC69 in the Primary icons is corrected to #37BD69. The builder app stays in its own repository (`SOURCE.md` has the update steps).
- **Sprite** `icons/antz-rounded/sprite.svg`: `#antz-<name>` (line) and `#antz-<name>-filled`, generated by `node tools/icons.mjs`; the self-test fails if it is out of date.
- **Component icons redrawn:** 44 of the 79 component icons (`#i-*`) now use their ANTZ Rounded equivalent, with no markup change (map in `replacements.json`). 10 with no true equivalent keep their drawing (check, help, home, shield, scan, trend, utensils, chef hat, dashboard, heart).
- **Docs:** new Foundations page, ANTZ Rounded icons, laid out like the ANTZ icon builder's library: Line, Filled and Primary views with counts; search by name, label or old file; module and status filters; icon size; tiles grouped by module. Selecting an icon opens a floating side sheet with a large preview (line or filled, grid and keylines), copy sprite id, name or SVG, status, Material reference, the old mobile files it replaces and notes. Primary view: filled or stroke, play, pause or reduced motion, tiles or wall, per row, group by module, and a tile colour picker built on the colour scales with live contrast. Also the replacement map. Releases now include `icons/`.

- **ANTZ Line animated (proposal):** an outline style for the Primary icons after Flaticon's lineal-colour animated icons (style reference only; original drawings). Slim 1.5px strokes on a 48px grid, shown at 72px; ink `--color-text`; one accent detail in a `--scale-primary-600` to `--scale-secondary-600` gradient (3:1 or more on light and dark); the outline draws on and the accent settles with the elastic ease; final frame under reduced motion. All 30 module icons, 28 interface icons with micro-animations (search, refresh, download, upload, success, delete, favourite, calendar, send, lock, visibility, location, alert, star, camera, add, filter, sort, edit, share, copy, print, log out, link, attach, microphone, folder, bookmark) and 12 animal care icons (vaccine, pill, vital signs, temperature, weight, water, weather, birds, fish, transport, scan tag, map), plus four sets of 12: animals, health and lab, facilities and maintenance, and data, reports and time (118 icons in all). Where elements overlap, the front one knocks out what is behind it with a 1.5px gap (a mask, so it works on any background); generated by `tools/primary-line.mjs`, shown by default in the Primary view with a switch to the Tile icons.

### Icons: play once, and which icons to use
- **Animated line icons play once** (2.8s) and rest on their final frame, instead of looping, so they meet WCAG 2.2.2 without a pause control. `data-icon-replay` (new in `components.js`) replays an icon on hover, keyboard focus or tap; `AntzIcons.replay(el)` from script. Every icon also has a still version in `primary-line/static/`.
- **DD-004 (accepted): icon system.** ANTZ Rounded for interface icons, animated line icons for moments (module navigation, empty states, onboarding, confirmations), one module-navigation style per product, one weight per size: **`--icon-stroke` is now 2** (was 1.8), so every component icon renders at its drawn weight, the icon team owns the drawings, drafts are for prototypes. Shown on the icons page as "Which icons to use" and on Governance.

### Foundations: colour scales
- **Colour scales from the ANTZ Design Library (Figma):** 10 families (primary, secondary, tertiary, error, neutral, neutral variant, success, warning, caution, info), 11 steps each, 50 to 950, as 110 primitive tokens `--scale-<family>-<step>` (750 tokens). Exported to CSS, Figma, MUI (`palette.antz.scale`) and React Native (`antzTheme.scale`). Primary 500 is the pinned brand #37BD69; Figma shows the retired #36BC69 there. Added at the System Owner's request, 2026-11-24.
- **Docs:** new Foundations page, Colour scales. The build generates its swatch grid from the tokens, with the label colour that passes AA on each step. **Theme tester:** a Colour scales tab; select a swatch to copy its variable.

### Components
- **Navigation drawer: sliding tab.** Switching modules, the selected rail tab travels to the new one on the elastic settle (`--ease-elastic`, `--duration-slower`), corners and all, like every other tab indicator. `components.js` adds the moving pieces; without it the drawer keeps the static look. Instant under reduced motion.
- **Floating navigation drawer** (`.navdrawer--floating`): set in from the left, top and bottom with a 24px radius. It slides in with the elastic settle (`--ease-move`, `--duration-slower`) and retracts quickly on `--ease-exit`. A hamburger at the top of the rail (`.navdrawer__top`) retracts it from the corner that opened it. The ✕, Escape and the backdrop still work. Tabs go in a `.navdrawer__tabs` group so the hamburger isn't announced as a tab; the older markup still works.
- **Fix:** closing a drawer or side sheet now waits for the short exit animation, not the longer entrance (it lingered before hiding).

### Fixes
- **Navigation drawer:** the selected rail tab's left corners are now true curves on every tone. The panel gradient no longer shows through outside the radius, which made a corner look square. New token `--gradient-tone-tab-corners` (640 tokens).
- **Docs sidebar:** stays in place while the page scrolls (a later `inset-block` was resetting its top), and sits above the sticky page tabs so its shadow is no longer cut off behind them. The white page-tab bar now runs full width behind it too, like the banners.

### Docs site
- **Home hero photos:** the drawn coat patterns are replaced by ten close-up animal photos from `reference/banner images`: tiger, zebra, leopard, giraffe, elephant skin, blue and red macaw feathers, iridescent plumage, tiger coat and fur. Portrait and square photos are cropped to an 8:3 landscape, and all are compressed to WebP (about 3.4 MB in all, each loaded just before its turn). They sit under a 50% deep-green overlay with the same slow crossfade, about every 7 seconds. A soft dark fade behind the text keeps every slide at AA (headline at least 4.4:1, intro at least 5.4:1). The pause button, still image under reduced motion and plain hero in high contrast are unchanged. Photo credits are in `assets/img/CREDITS.md`.
- **Sidebar is now the floating navigation drawer:** sections are the rail (each with its module tone), pages the menu, with page search in the drawer head. On desktop it floats with rounded corners, set in from the left, top and bottom, and slides in on load with the elastic settle. The top-bar hamburger retracts it (exit animation, the page widens) and restores it. Below 1024px it opens over the page from the hamburger, under the top bar. It loads open on every page. The home hero and page banners run full width behind it, and their text starts where the panel ends, plus the page padding.

## 1.2.0-beta.3 (23 November 2026)

Adds the rendered audit (`tools/audit.mjs`), with what it found fixed: 24px touch targets, blue and teal card text, and a deeper blue gradient. Also adds the home hero animal coats. Upgrade by changing `v1.2.0-beta.2` to `v1.2.0-beta.3`; nothing removed or renamed.

### Tools
- **Rendered audit** (`tools/audit.mjs`, needs Chrome and Node 22, no packages): checks what the browser actually shows. That covers every colour token in all 36 combinations of OS and page settings, every text element on every page in four modes (suspects re-measured on real pixels), reduced motion, links, JavaScript errors and tap targets. Deliberate "don't" examples opt out with `data-audit-ignore`. Now a release step.

### Docs site
- **Home hero animal coats:** tiger, zebra, leopard and giraffe patterns, drawn as original artwork by `tools/patterns.py`, crossfade slowly behind the headline, about every 7 seconds. They are tone-on-tone in the hero green and quieter behind the text. A pause button is included (WCAG 2.2.2); the pattern is still under reduced motion and hidden in high contrast.
- **Audit tool:** serves the site over a local HTTP server, so it sees what visitors see. Under `file://` the browser ignores CSS masks.

### Fixes (found by the audit tool)
- **Blue and teal card meta text** is full white (85% fell to 4.2:1 on the blue).
- **Blue gradient:** deeper under text again, so titles on the sky widget clear 4.5:1.
- **Touch targets reach 24px:** the field help button (20px, 18px in stat labels), chip remove buttons (22px), link buttons such as "View all" (20px tall), the toast "Undo" (19px) and the navigation drawer search field (22px).

## 1.2.0-beta.2 (23 November 2026)

Accessibility and correctness fixes from a full rendered audit (every page in four modes, all 36 theme and contrast combinations, reduced motion, links, tap targets). Upgrade by changing `v1.2.0-beta.1` to `v1.2.0-beta.2`; nothing removed or renamed. Teams on 1.2.0-beta.1 should upgrade: two fixes make text readable again for people using high contrast.

### Fixes
- **Main button in dark high contrast:** the label was white on the light green fill (#7BFCA0), about 1.3:1. Light high contrast sets the label to white for its deep green fill. Dark high contrast changed the fill but not the label, so the browser kept the white. Dark high contrast now sets the label to #00210C (about 15:1).
- **Forced dark plus OS "increase contrast":** with the OS asking for more contrast and the page forced to dark, the page got light high-contrast values: secondary text #0E1512 on the dark background, light-mode accents and borders (20 tokens). A missing CSS rule now applies dark high contrast in that case. Every token now resolves correctly in all 36 combinations of OS colour scheme, OS contrast, page theme and page contrast, verified in the browser.
- **Glow and aurora in dark mode:** `--gradient-glow` and `--gradient-aurora` had no dark values, so light text vanished over their light blobs (glow card, Natality widget, aurora card). Both now have dark versions.
- **Blue gradient:** the area under text is deeper (`--gradient-blue` adds sky 40 and 35 stops). The bright corner stays.
- **Vivid widgets (sky, teal):** small text is full white and inset tiles are darker. 86% white over a light glass tile fell to 3.3:1, against our own "never small white text on blue or teal" rule.
- **Mint widget in high contrast:** text switched to white on pale mint. It now uses the constant dark ink `--color-text-on-bright`.
- **Selected icon tab in dark mode:** white on light green. It now uses the brand fill and its label (`--color-accent` with `--color-text-on-accent`).
- **Aurora card meta text:** secondary text instead of muted (4.45:1 before).
- **Spinner and reduced motion:** the spinner had a fixed 0.7s duration and kept turning under reduced motion. It now uses `--duration-spin`, which drops to 0.
- **Touch targets:** "View details" on the animal card and the docs footer links reach 24px.
- **Docs and tester:** the device buttons in the theme tester have accessible names, and site search has a full keyboard focus ring.
- **Contrast gate matches the browser:** the build now re-declares, for dark high contrast, every token that light high contrast sets. It also fails if the CSS cascade could differ from the mode the gate checks. Before, the gate checked a model without the light high-contrast step, which is why this passed. Only this one token was affected.

## 1.2.0-beta.1 (23 November 2026)

Additive: no token or class removed or renamed (94 tokens added). Upgrade by changing `v1.1.0-beta.1` to `v1.2.0-beta.1` in your links. Visual refinements: elastic motion on movement, thinner selected and drop-zone outlines, softer light washes (from 1.1), the record hero on the deep gradient.

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

### Dashboard pieces (from Antz Home style 7, DD-003)
- **Photo hero** (`.hero-photo`): a photograph under a side scrim (`--gradient-scrim-side`) with a glass tag, title and figures in glass icon squares (`.glass-icon`). A compact version with glass chips (`.glass-chip`) leads module homes.
- **Widgets** (`.widget`, fills `--sky`, `--teal`, `--ink`, `--mint`, `--glow`): head, big figure, and a bar chart (`.bars`), inset stat tiles (`.widget__tiles`) or a split (`.widget__split`). Small period pills (`.segmented--xs`). Edit mode (`.is-editing`) shows remove badges, toggled with `data-board-edit` in `components.js`.
- **Status tiles** (`.status-tile--danger|warning|caution|success`): counts that need action, on flat status colours.
- **Quick add** (`.quick-add`), **photo tiles** in a scrolling strip (`.photo-strip`, `.photo-tile`), **icon tabs** (`.icon-tabs`), **week strip and agenda** (`.week-strip`, `.agenda`), **module grid** (`.module-grid`), **module home** card in the side nav (`.sidenav__home`), **greeting** with weather (`.greeting`), and a **score strip** (`.ticker`, `.score-label`).
- Tokens: glass, glass line and bar colours for media (`--color-media-glass|glass-line|bar`), `--color-figure-warm`, `--gradient-scrim-side`, `--gradient-fade-end` (mask), and sizes for the hero, photo tile, bar, bar height, day, quick-add icon, module item and glass blur. 8 new contrast checks.
- New docs page: Dashboard widgets (Stat cards).

### Refinements
- **Motion gallery** (new docs page, Foundations): every motion in one place, with live demos of 31 motions in five groups plus the seven easing curves drawn and animated. Each demo lists its duration and easing tokens and has a Replay button. Controls: Replay all, Slow motion ×4, and a Reduced motion preview.
- **Fix: `hidden` always hides.** Components that set their own `display` (dialog backdrop, menu and others) could stay visible with the `hidden` attribute. A base rule now makes `hidden` win everywhere.
- **Thinner selected outlines:** selected list rows (`.row.is-selected`, checked rows) and selected choice cards (`.choice`) now have a 0.5px outline on high-density screens (token `--border-width-hairline`) and 1px on standard screens. Before, rows were 1.5px and choice cards 2px. Selection is still shown by the green tint and the checkbox or radio, and the outline colour keeps its 3:1 contrast. Keyboard focus keeps its own thicker ring.
- **Drop zone outline:** the dashed outline of `.dropzone` now has exact 4px dashes and 4px gaps. Browsers choose their own dash lengths for `border: dashed`, so it is drawn as a mask (new tokens `--mask-dash-outline` and `--mask-dash-outline-hairline`) cut from the border colour. It is a 0.5px hairline on high-density screens and 1px on standard screens, where a half pixel can't be drawn. Colour, contrast, dark mode and hover come from the same tokens as before.

- **Elastic motion everywhere it fits:** a new token `--ease-move` (the elastic curve) now drives 26 movements: button lift and press, card, row, tile and photo hovers, the switch knob, priority and animal-card controls, tooltips, menus, dialogs, toasts, floating side sheets, rise-in, accordions and the focus ring. Colour and opacity changes, exits, data bars, loops and edge-attached drawers deliberately keep their easing (no overshoot). Change `--ease-move` to tone it down everywhere at once.

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
