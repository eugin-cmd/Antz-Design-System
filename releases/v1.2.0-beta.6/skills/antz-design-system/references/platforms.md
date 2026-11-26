# Using the system on each platform

Read the section for the platform you are working on.

## HTML/CSS prototypes (designers)

- Link the pinned release in `<head>`: run `node <skill-dir>/scripts/antz.mjs starter`. The paths point at `releases/vX.Y.Z/`, never the repository root.
- Build with the documented classes from `component <name>`. Icons in the docs use an SVG sprite (`<use href="#i-name"/>`); copy the icons a page needs, or use the same names if the project already has the sprite.
- Light and dark follow the OS; `<html data-theme="light|dark">` forces one. High contrast is `data-contrast="high"` and compact density `data-density="compact"` on the same element.
- Your own CSS: layout only, values only from tokens. A local custom property is fine when it is defined from tokens in the same file (`--card-gap: var(--space-4)`).
- `components.js` is optional; it adds the sliding tab indicator and the animal card expand motion.

## Next.js + MUI (web dashboard)

- Theme: `createTheme(antzThemeOptions({ mode, contrast }))` from `releases/vX.Y.Z/dist/mui/antz-mui-theme.js`. MUI components then pick up Antz colours, type, shape and motion. Don't override them per component.
- `sx` props and styled components follow the same rules as CSS: theme values or `var(--…)` tokens only (with `tokens.css` loaded), no hex, no off-scale numbers. The MUI theme does not set a spacing scale, so load `tokens.css` and use `var(--space-*)` for spacing rather than `theme.spacing()` numbers.
- Antz-specific components (animal card, stat panel, status chips, work drawer) are React wrappers around the documented markup and classes, following the contract in `releases/vX.Y.Z/specs/components/*.md` where one exists. If a spec is missing, build to the docs page and note it for the maintainers.
- Run `check` on `src/`. It reads CSS, HTML and CSS-in-JS strings. It does not yet read `sx` objects, so review those by hand against the token list.

## React Native (phone and tablet apps)

- Theme: `antzTheme` from `releases/vX.Y.Z/dist/react-native/antz-theme.ts`: `antzTheme.colors.light | dark | lightHighContrast | darkHighContrast`, `space`, `radius`, `fontSize`, `fontWeight`, `motion.duration`, `motion.easing`.
- Pick the scheme from `useColorScheme()`; set durations to 0 when `AccessibilityInfo.isReduceMotionEnabled()`.
- Motion: Reanimated with `Easing.bezier(...antzTheme.motion.easing.elastic)` for selection indicators and the card expand.
- The same component anatomy and rules apply; StyleSheet values come only from `antzTheme`. Washes use a linear-gradient library with the wash stop colours from the theme.
- Touch targets: 44pt (iOS) / 48dp (Android).
- `check` does not read StyleSheet objects yet; review them by hand against the theme.
