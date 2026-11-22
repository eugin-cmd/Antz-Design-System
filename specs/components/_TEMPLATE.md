---
component: <Name>
status: experimental | beta | stable | deprecated
owners: { design: <role>, web: <role>, native: <role> }
version: <introduced in>
---

# <Name>

## Purpose
What it is for, and when **not** to use it (name the alternative).

## Anatomy
Numbered parts and their tokens.

## Variants and sizes
Each variant, when to use it, and its tokens. Adding a variant is a Minor change.

## Properties (shared contract)
```ts
interface <Name>Props {
  // shared by web and native
}
```

## States
Default, hover, focus, pressed, selected, disabled, loading, error, empty: which apply, and the tokens for each.

## Theme behaviour
Light, dark, high contrast, compact.

## Responsive behaviour
Phone, tablet portrait, tablet landscape, desktop.

## Accessibility
Keyboard, screen reader (role, name, state), touch target, contrast, motion.

## Platform differences
Web (classes, MUI mapping) and React Native.

## Usage
Do and don't, with examples.

## Testing
Unit, interaction, visual (each variant × theme × density), accessibility.

## Related
Rules (ANTZ-…), decisions (FD/DD/TD-…), patterns.
