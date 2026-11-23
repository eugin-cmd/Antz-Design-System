---
component: Button
status: beta
owners: { design: Design System Maintainers, web: Web platform lead, native: Native platform lead }
version: 1.0.0-beta.1
---

# Button

## Purpose
Starts an action. One **primary** button per header, drawer or dialog (rule ANTZ-COL-05). Use a link for navigation, and an icon button for compact toolbars.

## Anatomy
1. Container: `--size-control-md` high (42px; 36px compact), `--radius-control`.
2. Label: `--text-md`, `--weight-semibold`, sentence case.
3. Optional leading icon: 18px, `currentColor`.
4. Focus ring: `--color-focus`, 2px, offset 2px, with `--color-focus-glow`.

## Variants
| Variant | Class | Fill / label | Use |
| --- | --- | --- | --- |
| Primary | `.btn--primary` | `--color-accent` (#37BD69) / `--color-text-on-accent` (#00210C) | The one main action |
| Secondary | `.btn--secondary` | `--color-accent-soft` / `--color-accent-text` | Second action |
| Outlined | `.btn--outline-brand`, `.btn--outline` | Transparent or surface / brand text or text | Neutral second action, Export |
| Text | `.btn--text` | none / `--color-accent-text` | Low-emphasis actions |
| Tertiary | `.btn--tertiary` | `--color-tertiary-solid` (navy) / on-solid | Deep, structural actions on light pages |
| Danger | `.btn--danger` | `--color-danger-solid` / on-solid | Delete, reject (confirm first) |
| Caution, info, warning | `.btn--caution`, `.btn--info`, `.btn--warning` | status solid / on-solid | Rare; status-specific actions |
| Sizes | `.btn--sm`, `.btn--lg`, `.btn--block`, `.btn--pill` | | |

## Properties (shared contract)
```ts
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'tertiary' | 'danger';
interface ButtonProps {
  variant?: ButtonVariant;        // default 'secondary'
  size?: 'sm' | 'md' | 'lg';      // default 'md'
  icon?: AntzIconName;            // leading icon
  loading?: boolean;              // keeps width, shows spinner, aria-busy
  disabled?: boolean;
  fullWidth?: boolean;
  onPress(): void;
  children: string;               // the label (required, even with an icon)
}
```

## States
| State | Behaviour |
| --- | --- |
| Hover (pointer) | Fill moves to the hover token; primary lifts 1px with `--shadow-accent` (`--duration-base`, `--ease-standard`) |
| Pressed | Scale `--motion-press` (0.98) for `--duration-instant` |
| Focus | Focus ring + glow; never removed |
| Disabled | `--color-disabled-bg` / `--color-text-disabled`; no lift |
| Loading | Label hidden, spinner in label colour, `aria-busy="true"` |

## Theme behaviour
The primary button is identical in light and dark (#37BD69 + #00210C). High contrast: fill tone 30 with white (light), tone 90 with ink (dark). Compact: 36px high.

## Responsive behaviour
Same component at every size. In the mobile bottom action bar, buttons stretch to equal widths. On touch screens the minimum target is 44px.

## Accessibility
Native `<button>` (web) / `Pressable` with `accessibilityRole="button"` (native). Visible label always; icon-only actions use the icon button with `aria-label`. Contrast: primary label 7.07:1; hover 6.22:1; pressed 5.75:1.

## Platform differences
- **Web (prototypes):** `.btn .btn--primary`.
- **Web (dashboard, MUI):** `<Button variant="contained" color="primary">`; the generated theme sets the label colour and hover.
- **React Native:** `backgroundColor: c.accent`, `color: c.textOnAccent`, `borderRadius: radius.control`, `minHeight: size['touch-min']`.

## Usage
Do: one primary per surface; verbs ("Save record"); put the primary action last (right) in footers. Don't: two primary buttons side by side; white text on #37BD69; gradients on buttons; custom heights.

## Testing
Each variant × light/dark/high contrast × comfortable/compact in the theme tester's component kit; axe; keyboard (Tab, Enter, Space).

## Related
ANTZ-COL-02, ANTZ-COL-05, ANTZ-A11Y-01; FD-001, FD-003; Library v2 D1, D2, WCTL-02.
