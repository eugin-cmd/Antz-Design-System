---
id: DD-006
title: Role homes, every module home, record lists and quick add, from Antz Home style 7 (part 3)
status: proposed
date: 2026-11-25
owner: System Owner
approver: System Owner (Eugin Robinson)
---

# DD-006 · Role homes, module homes, record lists and quick add

## Context
The System Owner asked that every module home, dialog, side sheet, toast and UI element of Antz Home style 7 in full
access (antz-home-style-2.vercel.app/style-7?access=full) be built into the screens and the component library,
within the guardrails. DD-003 and DD-005 covered the first two parts.

## Adopted
- **Role homes:** the home adapts to access: one module gets a dedicated home (panel hero with a period switch and
  figures, widgets, lists, a 12-month column chart, a split "Add to" button); several modules get a board; the
  medical board adds the Hospital split card and the Focus hub. A quick dock floats Quick actions and chat.
- **Module homes for every module that has one in the reference:** Collections, Animals, Housing, Mortality, Necropsy,
  Fetal death, Eggs, Tags, Medical, Hospital, Administer, Pharmacy, Lab, Approvals, Reports, Security, Focus hub,
  Announcements, Users and Help desk. Diet, Audit, Compliance and Communication have no page in the reference.
- **Heroes:** the band hero (dark band with rings, a live overline, one big figure and a slot for a glass button, a
  came-in/went-out split or an avatar stack) in petrol, navy, ink, maroon and deep tones; the banner hero (photo, big
  title, glass figures); the panel hero; the hero strip.
- **Lists:** record lists (list head, toolbar with counted tabs, rows that fold to lines, priority tags, pagination),
  attention rows with one action, ranks with photos or subtitles, count-downs, reactions, review rows with a route.
- **Other pieces:** class cards, a date scroller, a range bar, a section head with pickers, trend deltas, the butter
  widget fill, side-sheet forms (New tag, Report fetal death with a scan button, New folder), the tabbed quick-add
  dialog (Note, Request, Announcement), and a toast for actions that only exist in the mobile app.
- **Tokens (863, 712 contrast checks):** `--gradient-butter` with `--color-butter-text|caption|figure`, `--gradient-band-ink`,
  `--gradient-class-card`. The sky gradient now runs sky 40 to 30 (its old sky 60 and 50 corner gave white text 3.2 to 4.5:1 on phone-width widgets); every stop is gated.
- **Four new primitive colour families** (measured against the reference: 125 colours, 56 already matched, the rest
  near misses or new): **Lagoon** (cyan-teal, key #00ABAB), **Vivid mint** (key #86F09A), **Wine** (red-based
  crimson, key #7A1A2C) and **Bronze** (deep amber, key #7A5300). Each is a full tone ramp (0 to 100, tone = CIELAB
  L*, the key's hue, the most chroma sRGB allows). On them: `--gradient-mint` and `--gradient-teal` (now vivid mint and
  lagoon), `--gradient-band-lagoon` (the default band hero), `--gradient-band-wine`, `--gradient-band-bronze`, and
  `--gradient-peach` tuned to the reference. Identity only: they never carry status.
- **Not adopted:** #52F990 (the retired lime, rule COL-03) and the Vantara logo's gold. Near misses (navy, sky,
  butter) stay on our existing steps: within a barely visible difference, or darker on purpose to keep white text AA.
- **Every gradient is built from primitives.** The older glow, aurora, scrim, feather and rings tokens had colours typed in.
  They now use primitives with `color-mix(… transparent)` for see-through: sage 5 (scrims), wash mint (glow), vivid mint key,
  coral border and one new tone, `--lagoon-mist` #8CDEEE (aurora); in dark, the night washes they already matched exactly.
  Only black, white and transparent stay as keywords for masks. The build now fails on any colour literal in a gradient.
- **Animal record cards** (Animals > Recently added): a variant of `.animal-card`, the grid `.animal-cards`, one size token `--size-thumb` (56px) and the screen Animals · recently added.
- **Table styles** (Animals lists): record table, with status, with a row action, compact figures with totals, selectable and sortable, striped with a sticky head. The reference's Restore chip became a button; status stays in the status pill.
- **Pharmacy app** (antz-pharmacy-web): the pinned wide table, the Record detail page (detail head, facts, tabbed tables, the dispense side sheet), two new screens and `--gradient-band-green`. Only Overview, Requests (and its detail) and Dispense have pages in the reference; the other side-panel items are placeholders there.
- **Behaviour (components.js):** dialog tabs, `data-toast`, plus DD-005's popovers, dialogs and pickers.

## Adapted, and why
- **Identity fills never carry status.** The reference puts "Critical", "Blocked", "Overdue doses", "Pending tests",
  "Rejected" and "Egg discard" on coral, red or maroon fills. Here those are plain widgets with a status pill; butter,
  peach and maroon only mark identity (Lab, Favourites, Eggs hatched). Band hero tones follow the module, not the news.
- **Priority tags use status colours** (Urgent: danger, High: warning; IPD and External are neutral information).
- **Every form field has a real label**, every icon-only control a name, and quick add says how many required fields
  are left. Dialogs keep focus inside.
- **Phones:** the module side panel becomes a strip, record rows fold to lines, the quick dock gives way to the tab bar.
- **No Vantara name or logo;** screens show Antz.

## Consequences
- 33 new pages: 23 screens and 10 component pages, filed under Components, Stat cards and Pattern components.
- The generator `tools/style7.py` builds the screens and component pages from one set of markup helpers.
