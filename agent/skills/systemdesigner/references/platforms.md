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
- `sx` props and styled components follow the same rules as CSS: theme values or `var(--…)` tokens only (with `tokens.css` loaded), no hex, no off-scale numbers. **Spacing:** the theme keeps MUI's 8px unit, and `antzSpacing` (exported with the theme) lists the factors that land on an Antz space step: `p: 2` = 16px = `--space-4`, `p: 1.5` = `--space-3`, `gap: 1` = `--space-2`. Use only those factors (or `var(--space-*)`); `p: 3.5` (28px) is off the scale.
- Antz-specific components (animal card, stat panel, status chips, work drawer) are React wrappers around the documented markup and classes, following the contract in `releases/vX.Y.Z/specs/components/*.md` where one exists. If a spec is missing, build to the docs page and note it for the maintainers.
- Run `check` on `src/`. It reads CSS, HTML, CSS-in-JS strings and the literal values in `sx={{…}}`, `style={{…}}` (including style arrays) and `styled(…)` (from 1.2.0-beta.8). Values from the theme or `var(--…)` pass; MUI spacing numbers pass when they are on the Antz scale (from 1.2.0-beta.9; earlier checkers flag every MUI spacing number) and are flagged with the nearest Antz step otherwise. Literal pixel values in `style`/`styled` objects are flagged: use the tokens.

## React Native (phone and tablet apps)

- Install the pinned release: `npm install github:eugin-cmd/Antz-Design-System#vX.Y.Z`, then `import { antzTheme } from '@antz/design-system/react-native'`. It ships as JavaScript with TypeScript types, so an unknown token fails to compile.
- Colours per scheme: `antzTheme.colors.light | dark | lightHighContrast | darkHighContrast`; pick it from `useColorScheme()` (and the high-contrast setting). Space, radius, fontSize, fontWeight, fontFamily, lineHeight, letterSpacing, shadow (iOS props plus Android elevation), gradient (for `expo-linear-gradient`; `gradientWebOnly` lists the ones without a native form) and motion come from the same object.
- Ready-made colour pairs: `antzTheme.roles.<scheme>.status | priority | sex | tagChip` (`tagChip`: none, normal, high, critical). Use them for pills and tags instead of picking colours.
- Motion: Reanimated with `Easing.bezier(...antzTheme.motion.easing.elastic)` for selection indicators and the card expand; durations 0 when `AccessibilityInfo.isReduceMotionEnabled()`.
- The same component anatomy and rules apply as on the web (see the component pages and the Developers page recipes); there is no ready-made React Native component package yet, so build each component from its spec and the theme. Never apply web CSS to React Native.
- Touch targets: 44pt (iOS) / 48dp (Android).
- Run `check` on your source (from 1.2.0-beta.8 it reads `StyleSheet.create({…})` and inline `style={…}` objects): literal colours, font sizes, weights, families, spacing, radii and elevation are flagged with the `antzTheme` value to use.
