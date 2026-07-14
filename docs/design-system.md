# Design System — RapidResQ Naija

Source of truth: `src/styles.css` (tokens) + `rapidresq-design-system/` (exported JSON/CSS).

## Principles
1. **Calm authority.** Trust > excitement. Green primary, red only for emergencies.
2. **One-hand, high-stress UX.** Big targets, high contrast, short copy.
3. **Semantic tokens only.** Components never reference raw hex.

## Palette (semantic)
| Token | Light | Purpose |
| --- | --- | --- |
| `--primary` | Naija green `oklch(0.55 0.15 155)` | Primary actions, brand |
| `--emergency` | Alert red `oklch(0.58 0.24 27)` | SOS button, active alerts |
| `--warning` | Amber `oklch(0.75 0.17 75)` | Escalations, pending |
| `--success` | Green `oklch(0.65 0.17 150)` | Resolved, safe |
| `--info` | Blue `oklch(0.60 0.15 240)` | Informational |
| `--background` / `--foreground` | neutral | Page surfaces |
| `--muted` / `--muted-foreground` | neutral-2 | Secondary text |

Dark mode: mirror in `.dark` block. Always define both.

## Typography
- **Display / UI:** Inter or Manrope (system fallback).
- **Numeric (ETA, count):** tabular-nums.
- Scale: `text-xs 12 / sm 14 / base 16 / lg 18 / xl 20 / 2xl 24 / 3xl 30 / 4xl 36 / 5xl 48`.
- Line-height 1.4 body, 1.15 display.

## Spacing & radius
- Spacing scale: Tailwind default (4px base).
- Radius: `sm 6 / md 10 / lg 14 / xl 20`; SOS + pills use `rounded-full`.
- SOS button min 88×88 px (56 mobile min).

## Elevation
- `shadow-sm` cards, `shadow-md` popovers, `shadow-lg` sheets.
- Emergency glow: `ring-4 ring-emergency/40` (only on active SOS).

## Motion
- 150ms ease-out default; 250ms for sheets.
- Never animate anything on the SOS press path — instant feedback.

## Components (map to shadcn)
- `Button` variants: `primary | secondary | ghost | destructive | emergency`.
- `StatusPill` — pending/accepted/en_route/on_scene/resolved.
- `SosButton` — special, full-round, haptic + ripple.
- `IncidentCard`, `ResponderMap`, `AgencyBadge`.

## Accessibility
- WCAG AA min contrast (AAA on SOS).
- Focus ring `ring-2 ring-ring ring-offset-2`.
- Every interactive element has `aria-label` if icon-only.
