---
name: systemprototype
description: 'The Antz Design System prototype sandbox for designers. Start a prototype, add screens, preview every screen in phone, tablet and desktop frames, check it, and share it as a Vercel link, all built only from the Antz Design System. Use it whenever a designer wants to prototype, mock up, try an idea, build a flow or a few screens, preview them on devices, or share a clickable prototype, even if they don''t say "prototype": "start a Pharmacy prototype", "add a requests screen", "show it on a phone", "share it with my manager".'
---

# /systemprototype · Antz Design System

A prototype is a plain folder the designer owns: `index.html` (the preview of every screen in four device frames),
`screens.json` (the list) and `screens/*.html`, each linked to the pinned Antz release. You build the screens with the
**/systemdesigner** rules (system parts only, tokens only, check until clean); this skill is the workflow around them.

The helper is the plugin's `antz.mjs`: run it as `node <skill-dir>/../../scripts/antz.mjs …`.

## The workflow (one plain request per step)

1. **Start.** "Start a Pharmacy prototype":
   ```sh
   node <skill-dir>/../../scripts/antz.mjs new pharmacy-prototype "Pharmacy"
   ```
   It creates the folder in the current directory (ask where if unsure), pinned to the plugin's release, with a first
   screen, `screens/home.html`, and the icon set inside each screen.
2. **Add screens.** "Add the requests screen for phone and tablet":
   ```sh
   node <skill-dir>/../../scripts/antz.mjs screen pharmacy-prototype requests "Requests" --devices mobile,tablet-p
   ```
   Devices: `mobile`, `tablet-p`, `tablet-l`, `desktop` (default: all four). Then **build the screen** inside
   `<main class="proto-page">` exactly as /systemdesigner would: look components up (`components`, `component`),
   use tokens, keep the page's own CSS to layout glue, run `check` on the folder and fix until it passes. Prefer the
   system's screen templates (`screen-*` pages) for whole layouts and the Animal card for animals on phones.
3. **Preview.** "Preview it":
   ```sh
   node <skill-dir>/../../scripts/antz.mjs preview pharmacy-prototype --open
   ```
   It serves the folder locally (default http://127.0.0.1:4710/) and opens it: every screen in its device frames,
   one scale for all, with Open larger (device, Fit / 100% / 150%), light, dark and high contrast. **It keeps running:
   start it in the background**, give the designer the address, and stop it when they are done.
4. **Check.** "Check it": run **/systemauditor** on the folder with the running preview, for example
   `audit pharmacy-prototype --url http://127.0.0.1:4710/screens/requests.html`. Offer to fix what it finds.
5. **Share** (only when the designer asks): "Share it". First say where it goes: a **Vercel preview link** in their
   Vercel account (only people on their Vercel team can open preview links, depending on settings).
   ```sh
   node <skill-dir>/../../scripts/antz.mjs share pharmacy-prototype
   ```
   It prints the link. If the computer isn't signed in to Vercel it says how (`npx vercel login`) and shares nothing.
   If the **register-link** skill is installed, offer to add the link to the Design Links hub. `--prod` makes the
   project's main link; use it only when the designer asks for a permanent link.

## Rules

- Everything in a prototype follows the Antz Design System; a missing part becomes a proposal, never a one-off.
- Never share without being asked, and never into an account the designer didn't choose.
- The prototype is pinned to a release. To move to a newer one, change the version in the links of each screen and
  `index.html` (or start a new prototype), then check again.
- Never edit the design system itself from a prototype.
