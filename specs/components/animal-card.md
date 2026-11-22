---
component: Animal card
status: beta
owners: { design: Design System Maintainers, web: Web platform lead, native: Native platform lead }
version: 1.1.0-beta.1 (planned)
---

# Animal card

## Purpose
Shows one animal. **Compact** for lists and grids; **expanded** for a closer look with the latest alert and record counts. One markup, two states (`data-state="compact" | "expanded"`). Use a table instead when people compare many animals by the same columns.

## Parts: required and optional

| Part | Element | Required? | If left out |
|---|---|---|---|
| Sex tag | `.sex-tag` | **Required** | — |
| AAID | `.animal-card__id` | **Required** (it is the animal's identity) | — |
| Name | first fact in `.animal-card__facts` | **Required** | — |
| Photo | `img` in `.animal-card__media` | Optional | The paw mark appears on a tint; the photo scrim is dropped and the AAID over it turns dark |
| Media block | `.animal-card__media` | Optional | The card becomes text-only, one column, in both states |
| CITES badge | `.animal-card__badge` | Optional | The tag row closes up |
| Show more / less button | `.animal-card__toggle` | Optional | The card stays in the state it is given (use this for a card that is always compact or always expanded) |
| Other facts | `dt`/`dd` pairs | Optional, up to 5 (3 shown when compact; mark extra ones `.ac-x`) | Rows close up |
| Age and weight pills | `.animal-card__pills` | Optional; either or both | The row closes up |
| Latest alert | `.animal-card__alert` | Optional; one line only | Nothing shown |
| Record counts | `.ac-count` in the footer | Optional, up to 4 | Remaining counts stay left-aligned |
| Footer | `.animal-card__foot` | Optional | No gap is left |

**Adding** a new part, a fifth count, a second alert line or a new colour is not a removal: it needs an RFC (Minor change), so every team gets the same card.

## States
Compact, expanded, mortality (`.animal-card--mortality`: danger tag, red date line shown in both states, red outline, muted photo). Hover lifts the card; the photo zooms slightly.

## Motion
Expand and collapse animate the real card on `--ease-elastic` over `--duration-slower` (photo and card resize with a small overshoot; text fades in from 40%). Requires `components.js`; without it the state still switches. Instant under reduced motion.

## Accessibility
The toggle is a `button` with `aria-expanded` and a label ("Show more" / "Show less"). Photos need alt text naming the animal. Icon-only counts carry screen-reader text ("3 treatments"). Text over a photo always sits on the scrim or a media chip. Touch targets reach 44px on coarse pointers.

## Platform notes
- **Web (prototypes):** the markup on the Animal card page plus `components.js`.
- **Web (dashboard):** a React component with the same parts and props; the same tokens via the MUI theme.
- **React Native:** the same parts; motion with Reanimated using `antzTheme.motion.easing.elastic` and `duration.slower`.

## Contract (shared)
```ts
interface AnimalCardProps {
  state?: 'compact' | 'expanded';          // default 'compact'
  toggleable?: boolean;                     // default true: shows the show more / less button
  sex: 'M' | 'F' | 'UD' | 'ID' | 'G';
  aaid: string;                             // required
  name: string;                             // required
  photo?: { src: string; alt: string };
  cites?: 'I' | 'II' | 'III';
  facts?: { label: string; value: string; expandedOnly?: boolean }[];   // max 5
  age?: string; weight?: string;
  alert?: string;                           // one line
  counts?: { treatments?: number; labTests?: number; vaccinations?: number; medicines?: number };
  mortality?: { date: string };
  href?: string;                            // View details
}
```

## Related
Rules ANTZ-COL-02, ANTZ-COL-04, ANTZ-A11Y-02, ANTZ-A11Y-03, ANTZ-MOT-02; decision DD-001 (washes) does not apply to this card.
