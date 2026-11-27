---
id: DD-009
title: Tag module: tag chips, the tag strip, the add tag flow and the Tags screens
status: proposed
date: 2026-11-27
owner: System Owner
approver: System Owner (Eugin Robinson)
---

# DD-009 · Tag module

## Context
The Tag module is designed and developed but not yet in the app. The System Owner asked to bring it into the system
so it ships on system parts, with this direction: chip colours strictly from our tokens, chip shapes from the
prototype, everything else in our style, and every screen, component and pattern built the way the current system
builds them. System decisions were delegated ("You decide what is best for our System").
Source: the Tags Module web prototype (private reference, outside the repository; never committed or deployed).
Design: `docs/superpowers/specs/2026-11-27-tag-module-design.md`. Visual reference: the tag chip PDF approved on
27 November 2026. The Figma (mobile) file is still to come; phone layouts will be checked against it.

## Already in the system (reused)
Floating side sheets and their split foot; the sheet hero and the stat switch (`segmented--stat`); list rows for facts;
the activity timeline; the priority picker; toggle rows; filter panels; outlined rows with checkboxes (Choose people);
the record list head and panel; the period picker; the system dialog; removable filter chips; module pages and the
photo hero.

## Adopted (all opt-in; existing markup is unchanged unless noted)
- **Tag chip** `tag-chip` (new component page *Tag chips*): public is a pill, private (`tag-chip--private`) is a tag
  shape with a point. Priority `tag-chip--normal | --high | --critical` with its mark `!`, `!!`, `!!!` always shown;
  no priority is neutral. Parts: `__mark`, `__label` (truncates), `__by` (initials of whoever added a private tag that
  is not yours), `__remove`, `__lock` (shown only in Windows high contrast, where the point is dropped).
- **Tag strip** `tag-strip` and `tag-strip__more`: the latest four tags in a record hero, then "+N".
- **Patterns** (new page *Tags*): add a tag, tag info (Info and Entities), tag history, new tag, category, filter,
  and the confirm and custom range dialogs. Small helpers: `drawer__actions` (icon buttons in a sheet head),
  `tag-groups`, `tag-group`, `tag-tabs` (record tabs that scroll sideways); a sheet hero takes a glass switch.
- **Screens:** **Tags** (the hub, replacing the placeholder Tags home), **Tags · public** (categories) and
  **Animal · tags** (an animal record on its Tags tab).
- **React Native:** `roles.tagChip` (none, normal, high, critical) in every scheme.

## Decided under the System Owner's delegation
1. **One priority scale.** Tags use the priority picker's scale: Normal `!`, High `!!`, Critical `!!!`. The app's
   Low, Moderate and High map to Normal, High and Critical. **App team: rename the levels.**
2. **High is amber.** Tag chips use `caution` for High, not `warning`: `warning-bg` (#FFEBE5) and `danger-bg`
   (#FFEDEC) are almost the same pink, so High and Critical would look alike. The **priority picker's High now uses
   `caution` too** (its docs already said "high is amber"), so the scale looks the same everywhere. The record-list
   priority tag (Urgent, High, External, IPD) is a separate set and is unchanged.
3. **No priority is neutral**, not teal, so no colour means two things.
4. **Initials, not a bar**, for private tags someone else added. The prototype's 4px bar repeated the priority colour.
5. **Fix to an existing component:** a long side sheet's parts no longer shrink (`.drawer__body > * { flex-shrink: 0 }`);
   the sheet scrolls instead. Found while building the tag history sheet.

6. **Critical, not Emergency** (System Owner, 27 November 2026, after the Figma review): the scale is Normal, High,
   Critical in the priority picker and tag chips. `priority__opt--critical` is documented; `priority__opt--emergency`
   stays as an alias because beta.6 shipped it.
7. **Mobile app** (System Owner, 27 November 2026): the Figma file is the native app. Phone-only *Mobile app · Tags*
   screens follow its flows on system parts, with an opt-in bottom sheet (`drawer--bottom`).

## Not adopted, and why
The prototype's colours (#AFEFEB, #FFF09F, #FFD3D3 and the bar colours: off-token), the Low/Moderate/High names,
the priority bar on others' tags, green buttons with white labels (FD-003), uppercase buttons, two different
segmented styles and the dark navy fill, the chip lift on hover, Material and iconify icons (ANTZ Rounded instead),
the client logo as a photo placeholder (licensed photos instead), the chat button, and the prototype's permission
switcher (permissions are a usage note: people without tag permissions don't see New tag, Edit or Delete).

## Follow-ups
- Compare the phone layouts with the Figma (mobile) file when it arrives.
- App team: rename priority levels; build the chip from `tag-chip` or `roles.tagChip` (React Native).
