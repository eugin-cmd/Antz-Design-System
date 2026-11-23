---
component: Navigation drawer
status: beta
owners: { design: Design System Maintainers, web: Web platform lead, native: Native platform lead }
version: 1.2.0-beta.1
---

# Navigation drawer

## Purpose
The product's main menu. Opens from the hamburger at the left of the top bar. A **rail** of modules sits beside the chosen module's **menu**. Each module has a **tone** (decision DD-002), which tints the panel and the active tab, so people know where they are. Source: the Kitchen and Diet web app.

## Forms
- **Floating (recommended):** `.navdrawer--floating`. It sits 16px in from the left, top and bottom with a 24px radius, slides in on `--ease-move` over `--duration-slower` (an elastic settle), and slides out on `--ease-exit`.
- **Attached:** no modifier. It sits flush to the screen edge and slides in without overshoot, so it never pulls away from the edge.

## Parts
| Part | Element | Required? |
|---|---|---|
| Drawer | `aside.navdrawer` with `data-tone` | Required |
| Rail | `.navdrawer__rail`, holding `.navdrawer__top` (the hamburger that retracts the drawer, `data-navdrawer-close`) and `.navdrawer__tabs` (`role="tablist"`, vertical) | Required |
| Module tab | `button.navdrawer__tab` (`role="tab"`, `aria-controls`, `data-tone`), icon over label | Required, one per module |
| Head | `.navdrawer__head`: menu search and close button | Search optional; close required for the overlay |
| Menu | `.navdrawer__menu` (`role="tabpanel"`), one per module | Required |
| Group heading | `.navdrawer__group` | Optional |
| Item | `a.navdrawer__item`, icon and label; `aria-current="page"` on the current page | Required |
| Foot | `.navdrawer__foot`: zoo switcher, user, notifications | Optional |
| Backdrop | `.drawer-backdrop[data-navdrawer-backdrop]` | Required for the overlay |

## States and behaviour
- **Open/close:** the trigger has `data-navdrawer-open="<id>"` and `aria-expanded`. Close with the close button, the backdrop, or Escape; focus returns to the trigger. It slides in over `--duration-slow` and out over `--duration-fast`.
- **Module switch:** click or Up/Down/Home/End on the rail. The menu swaps, and the drawer's tone fades over `--duration-slower`.
- **Active tab:** the white rail parts around it (rounded inner corners), and the tab opens into the panel with `--gradient-tone-tab`.
- Reduced motion makes all of this instant.

## Tokens
`--color-module-<tone>-{a,b,ta,tb,ink}`; `--color-tone-*` (current tone); `--gradient-tone-panel`, `--gradient-tone-tab`; `--size-drawer-nav` (384px), `--size-rail` (96px), `--size-rail-tab` (64px).

## Accessibility
The ink is 4.5:1 or more on its tints in every mode, checked by the build. The current page is marked with `aria-current`. The rail is a vertical tablist. Every item is 48px tall.

## Platform notes
- **Web:** markup and classes from the docs page, plus `components.js`.
- **MUI:** a `Drawer` (anchor left) wrapping the same parts. Use the theme's module tones; don't style it per component.
- **React Native:** a modal drawer with the same parts; tones come from `antzTheme.colors.<scheme>.module*`.

## Related
Module band (`.module-band`), launcher (`.tile-module--round`), the work drawer (the right side, for add and edit), DD-002.
