---
id: DD-007
title: Animals · recently added, every element as a style option (Antz Home style 2)
status: proposed
date: 2026-11-25
owner: System Owner
approver: System Owner (Eugin Robinson)
---

# DD-007 · Animals · recently added: style options

## Context
The System Owner asked that every element of the Antz Home style 2 page **Animals · Recently added**
(antz-home-style-2.vercel.app/animals-list?from=style-7#recent) come into the system: the page in the Screens
library, and each element as an option on the component or pattern it belongs to. The aim is as many style options
as possible for designers and developers, inside the guardrails. The page already existed as a screen (DD-006);
this decision adds what that version lacked, **as options next to the current styles, never as replacements**.
Design: `docs/superpowers/specs/2026-11-25-animals-recent-style-options-design.md`.

## Adopted (all opt-in; existing markup is unchanged)
- **Record cards** (Animal card page): species photos with the sex tag on the corner, the paw placeholder when there
  is no photo, the full name on hover (`title`) when it is cut off with "…", and the reference's 14 animals.
- **Soft side panel** `modnav--soft` (Module bar page): the overview tile keeps its tint without the outline; the
  active page's count turns brand text (`--color-accent-text`, AA on the active row in light and dark).
- **Module bar options** (Module bar page): no breadcrumb; the existing **unread dot** `icon-btn__dot` (as in the app
  bar; the count stays in the `aria-label`); a **photo avatar**; a **brighter switcher tile** (the
  module's hue instead of its ink; white icon 4.47:1 on light sky).
- **Tinted panel** `modhome--tinted`: the main column on `--color-bg-canvas` so a white list panel stands off it.
- **Tablet strip** `modhome--strip`: from 600 to 840px the side panel becomes rows above the list (overview tile first,
  then the pages with counts). Phones already show a strip.
- **Sort menu** (Popovers and pickers page): a picker on the sort button with Newest first, Oldest first, Species A–Z
  and AAID; each order has its icon, and choosing one swaps the trigger's icon (`data-icon`, `data-pick-icon`). New UI icons `i-sort-newest`, `i-sort-oldest`, `i-sort-az`, drawn from ANTZ Rounded (`sort_newest_first`,
  `sort_oldest_first`, `sort_a_to_z`).
- **Screen:** Animals · recently added uses every option. Its generator helpers (`modbar`, `modnav`, `module_page`)
  take the options as parameters that default off, so the other module screens are byte-for-byte unchanged.
- **Photos:** 10 species photos and one avatar sample in `assets/img/species/`, from Wikimedia Commons (CC0, CC BY,
  CC BY-SA), credited in `assets/img/CREDITS.md`.

## Not adopted, and why
- **Dark-green filled buttons with white labels** (Add animal, the current page number): FD-003 keeps #37BD69 with a
  #00210C label. Excluded by the System Owner.
- **The Vantara client logo:** the top bar is unchanged. Excluded by the System Owner.
- **The reference's sex-tag colours** (F coral, M teal, UD and ID sky; white on #FA6140 is about 3:1, on #00C2B0
  about 2.3:1): the system's colours stay everywhere (M sky, F coral, UD amber, ID teal), by the System Owner's decision.
- **The panel-collapse icon:** ANTZ Rounded has none; the menu icon stays. **Request to the icon team:** a
  "side panel collapse / expand" pair (DD-004).
- **The reference's phone layout:** it overflows (a 508px page on a 390px screen); ours keeps one card per row with no
  sideways scroll.
- Off-scale values (11.5px text, 14px padding, 22px radius, 10px tag text) map to the nearest tokens; no token added.

## Consequences
- The other module screens and their pages are unchanged, so two Animals pages (overview and recently added) differ
  in their bar and panel. Accepted by the System Owner.
- **Found, not changed here:** in dark and high-contrast dark, every solid icon tile (`tile-icon--solid`) puts a
  white icon on a light hue (for example 1.71:1 on light sky). It predates this decision and affects all modules; it
  needs its own fix (a dark icon on solid tiles in dark modes).
