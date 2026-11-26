---
id: DD-008
title: Housing site overview: browse panel, enclosure card, figures panel and the enclosure sheet (Antz Home style 2)
status: proposed
date: 2026-11-26
owner: System Owner
approver: System Owner (Eugin Robinson)
---

# DD-008 · Housing site overview and browse panel

## Context
The System Owner asked to add, from the Antz Home style 2 Housing page
(antz-home-style-2.vercel.app/housing-sites?from=style-7#overview) and the Site overview it opens, **only the
components and patterns the libraries did not already have**, plus the screens. Same rules as DD-007.
Design: `docs/superpowers/specs/2026-11-26-housing-site-overview-design.md`.

## Already in the system (reused)
Widget fills (peach, mint, plain) with pills, selectable rows (`row is-selected`), `btn--tint`, `avatar-stack`,
`contact`, people rows, the activity timeline, `site-card` (the Sites and Sections grids), `glass-stats`, the floating
side sheet with its split foot, and the DD-007 side panel and module bar options.
`record-hero__stats` (the divided glass figures inside a record hero) is close to the new figures panel; see the open
question below.

## Adopted (all opt-in; existing markup is unchanged)
- **Browse panel** `browse` (new pattern page *Browse panel*): sections with a photo or tile and a count, the chosen
  one outlined, beside the chosen section's title and figures, person in charge, search, enclosure cards and a foot
  (how many are shown, View all). The panes stack below 840px.
- **Enclosure card** `card--enclosure`, a variant of the card: name and chevron, species photos (`avatar-stack`), the
  animals and species counts, and a caution status pill when something needs doing. The whole card is a link.
- **Figures panel** `figures` (and `figures--glass` on photos): two to four figures divided in one panel; a figure
  can be a name ("Ravi / Keeper").
- **Compact contact** `contact--pill` and `contact--glass`: the person with call and chat; each button names them.
- **Hero options** (Timelines and charts page): `hero-photo--foot` with `hero-photo__foot` (a meta item and a link)
  and `hero-photo__stats--spread`; `hero-photo--site` with `hero-photo__back`, `hero-photo__overline`,
  `hero-photo__meta` and a glass figures panel.
- **Side panel options** (Module bar page): `-` as a group heading draws `modnav__divider`; `action=None` leaves out
  the main action. Dividers hide on phones and in the tablet strip.
- **Enclosure sheet** (Side sheets page): a composition of existing parts, with the figures panel, the status pill and
  animal rows carrying the animal card details (photo with sex tag, AAID, name, scientific name), and the split foot
  (Move animals, Add animal as the green main button). In a sheet body, a status pill keeps its own width.
- **Screens:** new **Housing · site** (Site overview); **Housing** gets the foot-bar hero.
- **Photo:** a sarus crane (Wikimedia Commons, CC BY-SA 4.0), credited with its licence link.

## Not adopted, and why
- The painted zoo illustration: not licensed; heroes use our licensed banner photos.
- Dark-green buttons with white labels and the client logo (DD-007, FD-003).
- The "Aggressive" chip as a status: shown as a plain glass tag; it is a site trait, not a state.
- Narrow four-across widgets keep their documented behaviour (the open arrow moves under a long title).

## Open question for the System Owner
`figures--glass` repeats most of `record-hero__stats` (a rounded panel, value over label, a divider between cells,
bright values on glass). What is new is the **light** form, use **outside** a record hero, and names as values that
truncate. Choose one: (a) keep both and note the overlap; (b) make `record-hero__stats` an alias of
`figures figures--glass` in the next minor release; (c) fold them into one by RFC. Until then both stay as they are.

