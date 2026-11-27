# Tag module: tag chips, tag strip, add tag flow and the Tags screens (DD-009)

Date: 27 November 2026 · Status: approach approved by the System Owner in conversation ("Ok go ahead") ·
Decision record: DD-009 (proposed) · Target release: v1.2.0-beta.7, cut only when the System Owner says "release"
(this work stops at a preview deploy; VERSION, CHANGELOG release entry and the frozen copy are not part of it)

## Intent and why
The Tag module is designed and developed but not yet in the app. The System Owner wants it in the design system now,
so it ships on system parts instead of its own styles, and so designers (who build in Claude Code) and developers
get the tag chip, its rules and the screens from the library.

The System Owner's direction, verbatim in substance:
- "chip colours to strictly follow our tokens"
- "shapes to follow the prototype"
- "style can be from our system"
- every screen, component and pattern "based on how they are in our current system"
- system decisions are delegated: "You decide what is best for our System"

Source: the web prototype `Antz Design System/reference/Tags Module Prototype.html` (outside the repo, private; never
committed, released or deployed). The Figma file (mobile) comes later; see Open items.

## Goals
1. A **tag chip** component that keeps the prototype's two shapes and takes every colour from tokens.
2. The **tag strip** (the latest tags in a record hero), the **add tag flow** and the **tag info sheet** as patterns.
3. The **Tags screens** in all four device sizes, on system parts.
4. DD-009 (proposed) with what was reused, what is new and what was not adopted, for System Owner approval.

## Non-goals
- No new colour tokens, no new colour family, no category colours.
- No changes to frozen releases. No change to the priority picker's look or names.
- No live data or behaviour beyond what the docs site already does (open and close sheets, tabs, toasts).
- Permissions (add_tag, delete_tag) are not a visual component; they are a usage note (which buttons a person sees).

## Anti-goals (a failure even if it "works")
- A chip whose priority is shown by colour alone.
- A second priority scale, or teal meaning both "Low" and "no priority".
- Hard-coded hex in components.css, or green buttons with white labels (FD-003).
- Public and private told apart only by a shape that disappears in Windows high contrast or for screen readers.

## Constraints
Tokens only (guardrails, `tools/check.mjs`); AA in light, dark and both high contrasts (`tools/build.mjs` gate and
`tools/audit.mjs`); ANTZ Rounded icons; sentence case; one main action per view; 24px tap targets; reduced motion;
opt-in classes (existing markup unchanged); licensed photos only.

## Approaches considered
1. **Chip on system tokens, prototype shapes (chosen).** Priority uses the existing priority scale's status tokens
   plus its marks; public is a pill, private a tag shape. Fits every rule and keeps the prototype's look.
2. Copy the prototype colours (teal, yellow, pink) as new tokens. Rejected: adds a colour family, and teal would mean
   both Low and "no priority".
3. Category colours as identity fills with priority as a separate tag beside the chip. Rejected: two coloured things
   per tag, wider chips, and the prototype gives every category the same colour anyway.

## Decisions (System Owner delegated these; each is my call, recorded in DD-009)

### Priority scale
The system already has one priority scale (priority picker, and the Quick add rule "Don't invent a new priority
scale"): **Normal** `!` (info), **High** `!!`, **Emergency** `!!!` (danger). Tags use it. High is amber (`caution`), as
the priority picker's own docs describe it; see the next section.
The app's levels map one to one: Low → Normal, Moderate → High, High → Emergency. DD-009 tells the app team to rename.
The prototype's priority control (three pills) becomes the **priority picker** (`.priority`), unchanged.

### Tag chip `tag-chip`
Shapes (from the prototype):
- **Public**: a pill (`--radius-full`).
- **Private**: a tag shape, square-ish left end (`--radius-xs`) and a point on the right (about 12px deep at the
  chip's height), drawn with `clip-path` so the fill comes from the same background token.

Colours (tokens only; text/background pairs that already pass the contrast gate):
- no priority: `--color-neutral-bg` / `--color-neutral-text`
- Normal: `--color-info-bg` / `--color-info-text`
- High: `--color-caution-bg` / `--color-caution-text` (not `warning`: `warning-bg` #FFEBE5 and `danger-bg` #FFEDEC are
  almost the same pink, so High and Emergency chips would look alike; caution is clearly amber and matches the
  prototype's yellow). The priority picker's High uses `warning` today; DD-009 aligns it to `caution` so there is one
  scale (its docs already say "high is amber"). The record-list priority tag (Urgent, High, External, IPD) is a
  separate set and is not changed.
- Emergency: `--color-danger-bg` / `--color-danger-text`

Never colour alone: a chip with a priority starts with its mark (`!`, `!!`, `!!!`, bold, `aria-hidden`), and carries
visually hidden text, e.g. "Emergency priority". Private chips also carry visually hidden "Private tag".

Variants and parts:
- `tag-chip--private` (shape), `tag-chip--normal | --high | --emergency` (priority; none = neutral).
- **Added by someone else** (private only): their initials in a small round avatar at the start of the chip
  (`tag-chip__by`, neutral surface and text tokens), with "Added by Kavya Rao" as its accessible name/title. This
  replaces the prototype's 4px priority-coloured bar, which repeated the priority and said nothing about who.
- **Removable**: a trailing × icon button (`tag-chip__remove`, label "Remove Quarantine"), 24px target.
- **New**: the existing badge beside the chip (not inside it).
- **Clickable** chips are `<button>`s (open the tag); **static** chips are `<span>`s (history, previews).
- Size: height `--size-control-sm`, `--text-sm`, `--weight-medium`; gap `--space-1`; chips wrap in `.chips`.
- Hover (clickable): a 1px inset ring in the chip's own text colour; focus: the system focus ring.
  No lift animation (the prototype's translateY); motion stays on the system's tokens if any is added.
- Forced colours (Windows high contrast): backgrounds become system colours, so the chip gets a 1px `CanvasText`
  border. A clip-path also clips that border at the point, so the private shape can lose its outline there.
  Builder's choice: keep the clipped shape and draw its outline another way, or show a small lock icon (`i-lock`)
  in private chips under `forced-colors: active`. Requirement: public and private stay distinguishable.

### Tag strip `tag-strip`
In a record hero (on the photo or band): the tag icon, the **latest four** tags as chips, then a "+N" glass button
("+5", label "Show all 9 tags") that opens the Tags tab. Chips on photos sit on their own token backgrounds (they are
opaque), so contrast does not depend on the photo. Wraps to two lines on phones; still four chips at most.

### Add tag flow (side sheet, pattern)
Uses the floating side sheet (`drawer--floating`) and existing fields:
1. Head: "Add public tag" / "Add private tag". Search (`.search`). Results as clickable chips under "Choose a tag".
   When the search has no exact match: a create row ("Create 'Limping left' as a private tag"). For public tags,
   creating hands off to the **New tag** sheet (below); for private tags the new chip is selected with a "New" badge.
2. Selected tag: the chip, removable. **Priority**: the priority picker. **Schedule**: a toggle row
   ("Schedule and duration"), then a choice of "Set a deadline" / "A time period" (chips, `role="radio"`) and one or
   two date fields. **Visible to all** (private only): toggle row, "Off means only you can see it on this animal".
3. Foot: Cancel (outline) and **Add tag** (`btn--primary`), disabled until a tag is chosen.
Edit uses the same sheet titled "Edit public tag" / "Edit private tag", with Remove and Info as icon buttons in the
head, and Save in the foot.

### New tag and categories (side sheet forms, existing)
Replace the placeholder `SHEET_TAG` with the real fields: tag name (required, 50 characters), used on (entity types,
chips `role="checkbox"`, required), category (select, with "New category" as a link), description, roles to notify
(a row "Choose roles" with the count, opening the **Choose people** screen pattern for roles: search, rows with
checkboxes, a selected count and a foot button "Done (3)"; the chosen roles then show as rows with a remove button).
Category sheet: name only, Create / Save. Delete category and delete tag use the existing confirm dialog with the
prototype's words ("Tags in this category will be moved to General").

### Tag info sheet (composition)
`sheet-hero` with the tag name, Edit and Delete (or Remove, when opened from a record) icon buttons, and a
`segmented--stat` switch: **Info** and **Entities** (with the count). Info: `detail-facts`-style rows (category,
deadline, type with the visibility toggle for your own private tags, added by, added on, added to, roles notified as
a row with a chevron) and the description card. Entities: search, a filter (entity type) and record rows: animals with
the animal card details (photo with sex tag, AAID, local ID, names, enclosure), species with sex counts (the sex tag
roles), places as site rows.

### Tag history (pattern on the existing activity timeline)
Grouped by day; each entry: time, a static chip (its priority at the time) and "Private tag added by Anil Rathod".
Opened from a history icon button in the Tags tab toolbar, in a side sheet headed by the record's card.

## Screens (generated in `tools/style7.py`, four device sizes each)
1. **Tags** (replaces the placeholder Tags module home): side panel "Tags hub" and "Public tags" with counts, main
   action "New tag" (Public tags only; hidden without add permission, noted in usage). Main: page head "My tags hub",
   toolbar (search, date range, filter), Public / Private `segmented`, entity type `segmented--line`
   (All, Animals, Species, Sites, Sections, Enclosures), then chips grouped by category with `section-head` dividers.
   The New tag sheet opens from the main action.
2. **Tags · public**: `segmented` Tags / Categories. Tags: category `segmented--line`, toolbar, "Tags (14)" and chips.
   Categories: search and category cards (tile icon, name, "4 tags · 5 entities", chevron) that open the category sheet
   (two figures: Linked tags, Linked entities; created by, added on; the tag chips; Edit and Delete in a split foot).
3. **Animal · tags**: an animal record (Sheru, Bengal tiger) with a photo hero carrying the **tag strip**, record
   tabs (`segmented--line`, scrolling: Overview … Tags … Training) on Tags, then "Tags (9)", a `segmented` Public (6) /
   Private (3) with counts, toolbar (search, date range, filter, history icon button), and the chips. Private shows
   "My tags" and "Tags by others" groups divided by a line. Main action: "Add public tag" / "Add private tag".
   Sheets reachable on this screen: add tag (step 2 shown with priority and schedule), tag info, tag history.
Species, site, section and enclosure records reuse the same tab; not separate screens (usage note).

## Toolbar parts (all existing, no new component)
- **Date range**: the existing `pick` preset menu with the calendar icon (as the Medical home's "Last 7 days"):
  All time, Today, Yesterday, Last 7 days, Last 30 days, Last 6 months, Custom range. Custom range opens a small
  dialog with two existing date fields (Start, End) and Apply, disabled until End is on or after Start. The prototype's
  range-under-the-label ("Up to 27 Nov 2026") becomes the label alone ("All time"); the chosen custom range shows as a
  removable filter chip.
- **Filter**: the existing filter side sheet (`.filter-panel` groups: Tag category, Created by with people rows,
  My tags yes/no) with Clear all and Apply filter in a split foot; applied filters show as removable chips with a count
  on the Filter button.

## Placement in the docs
- **Tag chips**: a new component page *Tag chips* (Components group, after Chips and tabs): every variant, in a
  matrix (public/private × none/normal/high/emergency), on light and on a photo, plus removable, by others, new.
- **Tag strip, add tag flow, tag info sheet, tag history**: a new pattern page *Tags* (Pattern components).
- Chips and tabs page: a "See also: Tag chips" line. Priority picker page: "Used by tags" line.
- Screens: Tags, Tags · public, Animal · tags in the Screens nav.
- Theme tester: the new screens are available like every other screen (automatic).
- React Native: `roles.tagChip` (none, normal, high, emergency: bg/text) in the RN theme, generated like the priority
  tag roles. TypeScript types follow.

## Words (sentence case, our voice)
"Add public tag", "Add private tag", "New tag", "New category", "Tags hub", "Public tags", "Private tags", "My tags",
"Tags by others", "Visible to all", "Schedule and duration", "Set a deadline", "A time period", "Roles to notify",
"Tag history", "No tags yet". Prototype UPPERCASE buttons and "Upto - 27 Nov 2026" become sentence case and
"Up to 27 Nov 2026".

## Not adopted (goes in DD-009)
Prototype colours (#AFEFEB, #FFF09F, #FFD3D3 and bar colours), the Low/Moderate/High names, the priority bar for
others' tags, white-label green buttons (FD-003), uppercase buttons, two different segmented styles (one system
`segmented`), the dark navy segmented fill, the chip lift on hover, Material/iconify icons (ANTZ Rounded instead),
the client logo as animal photo placeholder (licensed photos instead), the chat button.

## Verification
`node tools/build.mjs --check`, `node tools/check.mjs`, `node tools/test.mjs`, `python3 tools/style7.py`,
`node tools/docs.mjs`, the full `node tools/audit.mjs` (contrast of every chip in four modes, tap targets, links),
screenshots of the chip matrix and the three screens in all four device sizes, light and dark, and in forced colours.
Then a preview deploy (`node tools/deploy.mjs --preview dd-009`) for the System Owner. Nothing goes live until approved.

## Open items
- **Figma (mobile)**: compare when the link arrives; adjust the phone layouts of the three screens and the sheets.
  If it arrives before the screens are built, build the phone layouts from it.
- Forced-colours treatment of the private shape: builder's choice between the two options above.

## Left to the builder
Exact CSS for the clip-path point and padding so the label clears the point; how the "+N" button is drawn (glass
button vs glass tag); demo content (names, dates) as long as it is realistic and in our voice; which existing helper
renders each sheet; how many chips to show per demo.

## Addendum, 27 November 2026: the mobile app (Figma "Global Tagging Module", Tag User Journey)
Source: Figma file Global Tagging Module, section "Tag User Journey - 20 August 2026" (about 40 phone frames in 8
flows). The System Owner chose, when asked:
1. **It is the native mobile app.** Add phone-only **Mobile app · Tags** screens that follow the Figma flows, built
   from system parts. The web screens stay as they are.
2. **Opt-in bottom sheet.** New option `drawer--bottom`: under 600px (viewport or shell container) the floating sheet
   rises from the bottom, takes the full width minus the gutter, sizes to its content up to 85% of the height, and
   has a grab handle. Above 600px it is the usual side sheet. Other modules can adopt it later.
3. **Priority names: Normal, High, Critical.** "Emergency" becomes "Critical" in the priority picker and tag chips
   (same colours and marks). `priority__opt--critical` is the documented class; `priority__opt--emergency` stays as an
   alias because beta.6 shipped it. The tag chip (unreleased) renames `tag-chip--emergency` to `tag-chip--critical`, and
   React Native `roles.tagChip.emergency` to `critical`. The Figma's Low/Moderate/High in its add sheets map to
   Normal/High/Critical.

### Mobile app screens (one docs page, phone frames grouped by flow)
- **My tags hub**: app bar (back, title), search with a filter button, line tabs Public tags / Private tags, entity
  type filter chips (Animal, Species, Enclosure, Section, Site; one at a time), chips grouped by category, `fab`.
- **Tag entities**: sheet-hero header with the stat switch (49 Entities / Info), line tabs All / Animals / Species,
  search and filter, animal record cards; and the **Info** view (facts, roles notified, description).
- **Public tags (master)**: segmented Tags / Categories; category line tabs with counts; search; chips; `fab`.
  Categories as outlined rows with a chevron. **Create new tag** as a full page form (name, category with New category,
  entity type opening the **Select entity** bottom sheet with Select all and Done, description, roles to notify,
  Create tag).
- **Animal · tags**: photo hero (back and more as glass buttons, name, scientific name, facts, tag strip with +N),
  record tabs Tags / Medical / Enclosures, search, filter, history, line tabs Public / Private, chips; private shows
  My tags and Tags by others; empty state when there are none; `fab` to add.
- **Bottom sheets**: Add tag (choose, then priority and "Visible to all" in the same sheet, as the Figma note asks),
  no-permission notice (caution alert) for public tags, Tag details (public and private, with Edit and Remove; the
  private one has the visibility switch), Edit tag (name for private, priority, schedule), Roles notified, All tags
  (+N: Public / Private tabs). Remove asks in the system dialog.
- **Tag history**: the existing history, full page.

### Not adopted from the Figma (and why)
- Sheet headers tinted with the priority colour (status colour as a fill): the chip in the header carries priority.
- Teal / yellow / pink chip fills and the coloured bar on others' tags: tag chip tokens and initials instead.
- The speed-dial (Add tag / Home / +) under the FAB: one `fab` opens Add tag; Home belongs to app navigation.
- White labels on green buttons (FD-003), placeholder tiger photos with "C 1" badges (licensed photos, sex tag).
