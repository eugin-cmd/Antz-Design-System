---
name: antz-design-system
description: Build and change Antz user interfaces only from the Antz Design System — its approved tokens, components, patterns and guardrails — for HTML/CSS prototypes, the Next.js + MUI web dashboard and the React Native apps. Use this skill whenever someone works on any Antz screen, page, component, prototype, mockup or style, even if they don't mention the design system: building a new screen, restyling or "making it pop", picking colours, spacing, fonts, icons or motion, adding a card, table, drawer, dialog, form or stat panel, converting a design to code, reviewing UI code, or asking "what component should I use". Also use it when a request would introduce a new colour, size, font or one-off component, so it can be redirected to an approved option or a proposal.
---

# Antz Design System

Antz products share one governed design system. Your job with this skill is to build what the person asks for **out of that system**: its tokens, its components and its patterns, checked by its guardrails. You are not designing a new visual language. When the system already has an answer, use it; when it doesn't, say so and write a proposal instead of improvising.

This matters because many teams build Antz products in parallel. Every invented colour, size or one-off card is a fork: it drifts from the other teams, misses dark and high-contrast modes, skips the contrast checks and has to be found and removed later. Staying inside the system is what makes the products look like one product.

## The helper script

Everything you need comes from a pinned release through `scripts/antz.mjs` (Node 18+, no installs). It finds a local clone of the repository (an `antz-design-system` folder in the project or a parent) and otherwise reads the team site, so it works in any project.

```sh
node <skill-dir>/scripts/antz.mjs info                 # source and version in use
node <skill-dir>/scripts/antz.mjs components           # every component, pattern and screen
node <skill-dir>/scripts/antz.mjs component <name>     # classes, do/don't, copyable markup
node <skill-dir>/scripts/antz.mjs tokens <words>       # approved tokens, e.g. "tokens text secondary"
node <skill-dir>/scripts/antz.mjs classes <word>       # component classes without a docs page, e.g. "classes drawer"
node <skill-dir>/scripts/antz.mjs icons [--sprite]     # the approved icon set (and the sprite to paste)
node <skill-dir>/scripts/antz.mjs rules                # the 26 governance rules
node <skill-dir>/scripts/antz.mjs starter              # <head> links for a prototype
node <skill-dir>/scripts/antz.mjs check <paths>        # the guardrail check (exit 1 = findings)
```

Look things up rather than relying on memory: names and values change between releases, and the script always answers for the version the project uses. If the project pins a version, pass `--version x.y.z` (or set `ANTZ_DS_VERSION`).

## Workflow

1. **Orient.** Run `info`. Work out the platform (HTML/CSS prototype, Next.js + MUI, React Native; see `references/platforms.md`) and which pinned release the project links. If the project links the repository root instead of `releases/vX.Y.Z/`, point that out and fix it.
2. **Find the components first.** Run `components`, then `component <name>` for each candidate. A few components (the work drawer, for one) are styled in `components.css` without their own docs page; `classes <word>` finds them, so check it before concluding something is missing. Prefer an existing component or pattern, with its documented variants, over building anything. Screens pages (`screen-*`) show how components are composed into whole layouts; follow them.
3. **Use tokens for every value.** Colour, spacing, type size, weight, font, radius, shadow, duration, easing and gradient all come from tokens. Search with `tokens <words>` and use the semantic ones (`--color-*`, `--space-*`, `--text-*`, …); primitive tokens such as `--green-40` are for the system itself, not for products.
4. **Build.** Compose the documented markup and classes. Write your own CSS only for layout glue (grid, flex, placement) and only with tokens. Keep the system's accessibility: labelled icon buttons, alt text, visible focus, 44px touch targets. Icons come only from the system set (`icons`); in an HTML prototype paste the sprite once per page with `icons --sprite`. If you hide a drawer or panel with the `hidden` attribute, add `[hidden] { display: none }` for it, since component classes set their own `display`.
5. **Check, then fix until clean.** Run `check` on every file you created or changed. Fix each finding by switching to the right token or component; never by silencing it. Re-run until it passes. If a finding seems wrong, explain why to the person rather than working around it.
6. **Report.** Say which components and tokens you used, what the check returned, and list anything that needs a proposal.

## The rules that come up most

Run `rules` for the full register. These are the ones people most often trip over:

- **Brand green #37BD69 is a fill**, never text or a thin line on light surfaces: `--color-accent` with `--color-text-on-accent` on it. Brand text is `--color-accent-text`; thin indicators `--color-accent-indicator`; focus `--color-focus`.
- **Green never means status.** Success, warning, caution, danger and info have their own tokens. This doesn't mean avoiding status colour: a rising trend, a pass or a completed task uses the success tokens; a fall, failure or overdue item uses danger or warning. Pair the colour with an arrow, icon or word so it isn't the only signal.
- **One main (filled brand) action** per header, drawer or dialog. **Add and edit happen in the right work drawer** (`.drawer`, 562px), not in new modals or pages.
- **Gradient washes** (`--gradient-wash-primary|celebrate|calm|illustrative`) are for large soft backgrounds and stat panels only, chosen by meaning, at most two per screen; never on buttons, data, status or small text. Mortality, alerts and overdue figures never sit on the celebrate wash.
- **Motion** uses `--duration-*` and `--ease-*` (under 500ms; reduced motion is automatic). Anything that moves or arrives (lifts, presses, hovers, menus, dialogs, toasts, sheets, rises, indicators) uses `--ease-move`, the elastic settle. Colour and opacity changes use `--ease-standard`, exits `--ease-exit`. Data bars, loops and edge-attached panels never overshoot.
- **Icons (DD-004):** interface icons are the component icons (`#i-name`, ANTZ Rounded, 2px), filled only for a selected state. Animated line icons (`icons/antz-rounded/primary-line/`) are for module navigation, empty states, onboarding and confirmations at 48 to 72px; they play once (replay with `data-icon-replay`), one in view at a time, never in dense controls; use `static/` where motion adds nothing. Missing an icon? Ask the icon team, never borrow from another set.
- **No second versions** of existing components: confirm dialog, toast, filter drawer, table, drawer, card.

## When a request goes outside the system

People will ask for things the system doesn't have: "make the header purple", "use 13px text", "add a glowing card", "a new kind of chart". Handle it in this order:

1. **Offer the closest approved option** and show it: the token, variant or pattern that meets the underlying need. Most requests ("make it pop", "more contrast", "feel celebratory") are met by an existing variant, wash, weight or emphasis.
2. **If nothing fits, don't build it locally.** Not as a one-off, not as a "temporary" value, not in an inline style. A local fork is exactly what the system exists to prevent, and the check will flag it anyway.
3. **Write a proposal** using `references/proposal.md`: the need, what you checked, the proposed token or component, alternatives, accessibility. Save it in the project (for example `proposals/RFC-short-name.md`) and tell the person to send it to the System Owner. Use an approved stand-in in the meantime and mark it in a comment, e.g. `/* Antz proposal pending: RFC-header-accent */`.

Be warm and plain about this. The person isn't doing anything wrong by asking; you're helping them get what they need in a way every team can share.

## Things you never do

- Edit the design system itself from a product project: `releases/`, `tokens.css`, `colors.json`, `dist/`, `governance/` are read-only. Changes to the system go through its repository and review.
- Add or edit guardrail exceptions, or bypass hooks (`--no-verify`). Exceptions need a human approver.
- Copy the system's CSS into a project and modify it. Link the pinned release.
- Use the retired brand values #52F990, #38BD69, #36BC69.

## If you can't reach the system

If neither a local clone nor the site is reachable, say so. Don't fall back to remembered values or guess class names. Ask the person to clone the repository (`git clone https://github.com/eugin-cmd/Antz-Design-System.git antz-design-system`) or to check their connection.
