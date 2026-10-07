# Phase 6 colour mapping

Shared reference for migrating prototypes to theme tokens. Use the same token for the same old colour everywhere, so prototypes stay consistent with each other.

In CSS use `var(--rd-sys-color-<token>)`. In TSX inline styles use `sysVar('<token>')` (or `compVar`, `shadowVar`) from `@tokens/colors`.

## Neutrals (Tailwind-style greys used by NewUIAdmin2 and others)

| Old | Used as | Token |
|---|---|---|
| `#FFFFFF`, `#FFF`, `white` | page or card surface | `background-base` (raised surfaces such as menus and popovers: `background-raised`) |
| `#FFFFFF` | text or icon on a coloured fill | `content-inverse` |
| `#111827`, `#0F172A`, `#1F2937`, `#1D232F` | text | `content-primary` |
| `#374151` | text | `content-primary` |
| `#4B5563`, `#6B7280`, `#777E8B` | text, icons | `content-secondary` |
| `#9CA3AF`, `#A5ACB9` | placeholder, muted icons, disabled text | `content-tertiary` |
| `#D1D5DB`, `#C0C6CF` | strong borders, input borders | `border-bold` |
| `#E5E7EB`, `#E9EAEC`, `#EAEDF2` | borders, dividers | `border-subtle` |
| `#E5E7EB`, `#E9EAEC`, `#EAEDF2` | fills (chips, pills, secondary buttons) | `background-secondary-action` |
| `#F3F4F6` | hover fills, subtle fills | `background-secondary-action` (hover on it: `background-secondary-hover`) |
| `#F9FAFB`, `#FAFAFA`, `#F6F8FA` | page background, table header, wells | `background-sunken` |
| translucent black hover tints | hover | `background-ghost-hover` |
| black overlays behind modals | overlay | `background-overlay` |

## Status and accent colours

| Old | Token |
|---|---|
| `#EF4444`, `#DC2626`, `#B91C1C`, `#991B1B`, `#E61D2B`, `#E22B3D` (text, icons, borders) | `content-failure` / `border-failure` |
| `#FEF2F2`, `#FEE2E2`, `#FECACA` (fills) | `background-failure` |
| `#22C55E`, `#16A34A`, `#166534`, `#06BF7F` (text, icons) | `content-success` |
| `#DCFCE7`, `#E0F8EF` (fills) | `background-success` |
| `#F59E0B`, `#F97316`, `#FCC838` (text, icons) | `content-warning` |
| `#FDE68A`, `#FEF3C7`, `#FFF8E5` (fills) | `background-warning` |
| `#3B82F6`, `#2563EB`, `#007DC1`, `#2770EF` (links, selected, primary text) | `content-brand` |
| same blues as a solid fill | `background-brand` |
| `#EFF6FF`, `#DBEAFE`, `#DEE8FA` (selected or info fills) | `background-information` |
| `#8B5CF6`, `#7C3AED`, `#8C62F5` | `content-accent-purple` (fills: `background-accent-purple-subtle`) |

## Shadows

Any `box-shadow`: pick by elevation. `shadowVar('surface')` for cards, `shadowVar('menu')` for dropdowns and popovers, `shadowVar('modal')` for dialogs.

## Leave as literals (with a short comment)

- Brand colours of third-party products and logos (Google, Slack and so on), and user-picked colours. These are data.
- Chart series colours passed to ECharts. Use `useChartTheme()` from `src/prototypes/_shared/tiles/chartTheme` instead of `chartColors` / `chartUi`.
- Colours inside SVG files under `public/` or imported assets.

## Rules

- Never read `systemColors.light[...]`, `rdComponentColors.light[...]` or `referenceColors.*` for UI. They stay light in dark mode.
- For colour maths (alpha suffixes, `hexToRgba`), use `color-mix(in srgb, var(--x) N%, transparent)`.
- Hover handlers that set `e.currentTarget.style.*` must use variables too.
- Check the result with `node scripts/radiant-check/scan.mjs src/prototypes/<Name> --details`. Done means zero findings, or each remaining one is data and commented.
