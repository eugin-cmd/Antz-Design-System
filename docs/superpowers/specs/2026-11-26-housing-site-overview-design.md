# Housing: site overview and browse panel (DD-008)

Date: 26 November 2026 · Status: approved by the System Owner in conversation · Decision record: DD-008 (proposed)

## Intent
Add the **unique** pieces of the Antz Home style 2 Housing page
(`https://antz-home-style-2.vercel.app/housing-sites?from=style-7#overview`, including the Site overview it opens) to
the component and pattern libraries, and the Site overview as a screen. Only what the libraries do not already have.
Same rules as DD-007: tokens only, opt-in options next to current styles, AA in all four modes, ANTZ Rounded icons,
licensed photos; no dark-green white-label buttons, no client logo.

## Already in the system (reuse, do not add)
Widget fills (peach, mint, navy, plain) with pills; selectable rows (`.row.is-selected`); `btn--tint`; `avatar-stack`;
`contact`; people rows; activity timeline; `site-card`; `glass-stats`; modnav, `modhome--strip`, modbar options.

## Add
1. **Enclosure card** `card--enclosure` (variant of `.card`): name + chevron, species photo stack, figure line
   ("**100** animals · 1 species"), optional status pill (caution: "Inspection due", "1 under treatment"). Whole card is a link.
2. **Browse panel** `.browse`: list pane (title + count, selectable section rows with photo or tile and a count,
   `btn--tint` "View all") beside a main pane (title + figures, compact contact, search, a grid of enclosure cards,
   foot with "Showing 12 of 52" and a `btn--tint` "View all"). Stacks below 840px.
3. **Compact contact** `contact--pill` (light) and `contact--glass` (on photos): person icon + name, call and chat icon buttons.
4. **Figures panel** `.figures` (new): two to four figures in one rounded panel with dividers between them
   (value over label; a value may be a name, e.g. "Ravi / Keeper"). `figures--glass` on photos.
5. **Hero options** on `hero-photo`: `hero-photo__back` (glass back chip), an overline, a contact and a tag slot,
   a `figures--glass` panel on the right, and `hero-photo__foot` (a translucent foot bar: a
   meta item and a link) with `hero-photo__stats--spread` (figures spread across the width).
6. **Side panel** options: `modnav__divider` (groups separated by a line, no heading) and no main action (`action=None`).

7. **Enclosure side sheet** (composition, no new component): the floating drawer with "Site › Section" meta and the
   enclosure name, a `.figures` panel (Animals, Species, Keeper), the status pill, "Animals here · 8 of 100", animal
   rows (photo with sex tag, AAID, name, scientific name, chevron), and the split foot: "Move animals" (outline) and
   "Add animal" (`btn--primary`, our green; not the reference's dark green). Opens from an enclosure card.

## Screens
- New **Housing · site** (Site overview, Adirampattinam): site hero, four widgets, browse panel, people in charge,
  recent activity; long side panel with dividers. Generated in `tools/style7.py`.
- **Housing** (hand-written `pages/screen-housing.html`): hero gets the foot bar ("8 clusters" … "View all sites") and spread figures.

## Placement
Enclosure card, browse panel, compact contact and figures panel: a new pattern page **Browse panel** (Pattern components).
The **enclosure sheet** goes on the **Side sheets** component page (System Owner's request), as a generated section
between markers in the hand-written `docs-src/side-sheets.html`: a sheet whose rows carry the animal card details.
Hero options: **Timelines and charts** (where the heroes are). Side panel options: **Module bar and side panel**.

## Not adopted
The painted zoo illustration (not licensed; heroes use our licensed banner photos), the "Aggressive" chip meaning
(shown as a plain info tag, not a status), and everything excluded in DD-007.
