---
id: DD-005
title: Module homes and the widget board, from Antz Home style 7 (part 2)
status: accepted
date: 2026-11-24
owner: System Owner
approver: System Owner (Eugin Robinson)
---

# DD-005 · Module homes and the widget board

## Context
The System Owner asked that the app's main home (mobile, tablet, web) and every module home follow Antz Home style 7:
widgets people can add, remove and restyle from a gallery, and module homes like Housing, Eggs, Mortality and Animals
(antz-home-style-2.vercel.app). DD-003 already adopted the first part (hero, widgets, bars, quick add). This adds the rest.

## Adopted
- **Home as a widget board:** board bar (Menu, site picker, add widget, edit board with Undo changes and Done), the
  photo hero, widgets in two columns, and the side column (quick add, Today, announcements, observation notes).
- **Widget gallery** (Add widgets): categories, search, "Default view", a preview of each widget with "On board",
  then step 2: choose a style and a size.
- **All modules** dialog: categories, the A to Z list, and the chosen module's screens with counts and its main action.
- **Menu** dropdown with its filter panel (show, category, sort; Clear all and Show), the site picker, the account menu.
- **Module home:** module bar (back, module switcher, breadcrumb, site and period pickers), the module side panel
  (module home, pages with counts, main action; folds to icons; a scrolling strip on phones), a hero, widgets, and
  lists (recent items with photo and sex tag, ranks with bars, activity timeline, donut with legend, 14-day trend).
- **New fills:** peach (`--gradient-peach`, with `--color-peach-text|caption|figure`), maroon (`--gradient-maroon`),
  and navy widgets; widget pills; glass stats with meters; a photo-and-band hero strip.
- **New sizes:** `--size-popover`, `--size-popover-lg`, `--size-dialog-wide`, `--size-donut`.
- **Behaviour** (components.js): popovers, dialogs, pickers, single-choice chips, remove and undo on the board, the
  two-step gallery, the modules dialog and the folding side panel. Escape and outside click close; focus returns.

## Adapted, and why
- **Peach and maroon are identity, never status.** The reference uses coral fills for things like "Under treatment"
  and "Necropsy pending". Status still uses the status colours (ANTZ-GRD-02); peach marks a module's figure.
- **Pills and figures keep AA in all four modes.** The peach fill stays light in dark mode, so its text tokens don't
  change; pills on light fills carry their own tint; the rendered audit checks every screen.
- **Overdue counts use the danger text colour**, not a coral fill.
- **Review against the rules (24 Nov 2026):** widgets that carry bad news (missing or escaped, under treatment, to be
  discarded, necropsy pending, fetal death) are plain widgets with a status-coloured pill, not peach; peach is used
  for a neutral module figure (eggs hatched). Observation notes sit on a plain card, not the celebrate wash, because
  they can carry an alert. Dialogs keep focus inside while open. Screens use classes, not inline layout styles.
- **Product names and logos** in the reference (Vantara) are not used; screens show Antz.

## Screens
Home, Animals, Housing, Eggs and Mortality, each at mobile, tablet portrait, tablet landscape and desktop
(pages/screen-*.html). Other module homes follow the Housing pattern.
