---
description: Mandatory compliance checklist for every prototype file. Catches hardcoded colors, raw HTML, wrong fonts, magic spacing values, and accessibility issues. Runs automatically on all prototype code.
globs: ["src/prototypes/**/*.tsx", "src/components/**/*.tsx"]
alwaysApply: true
---

# Compliance Checklist

Run these checks on every `.tsx` file you create or modify. Do NOT declare done until all pass.

## Colors — no hardcoded values

- No `#` hex values (outside SVG path data)
- No `rgb()` / `rgba()` / `hsl()`
- No deprecated `import { brandColors }`
- Use `var(--rd-sys-color-*)` in CSS and `sysVar()` / `compVar()` / `shadowVar()` in inline styles
- No `systemColors.light[...]`, `rdComponentColors.light[...]` or `referenceColors.*` in UI code: they stay light in dark mode

## Fonts — no hardcoded families

- No hardcoded stacks: `fontFamily: '"Geist", -apple-system, ...'`, the old Plain font stack, or `'Arial, sans-serif'`
- Use `fontFamily.primary` from `../../tokens/typography`, or `var(--font-family-primary)` in CSS
- No hardcoded weights (`600`, `375`). Use `var(--font-weight-emphasis)` (550) for headings and labels, `var(--font-weight-regular)` (400) for body

## HTML — no raw elements with Radiant equivalents

| Raw element | Use instead |
|-------------|-------------|
| `<button>` | `Button` (exception: non-standard overlay triggers for Popover/Tooltip only — document with comment) |
| `<input>` | `TextInput` or `SearchInput` |
| `<table>` | `Table` |
| `<select>` | `Select` or `Dropdown` |

## Spacing — no magic pixel values

- No values outside the spacing scale (e.g. `17px`, `gap: 7`)
- Use `spacing.A` through `spacing.N` from `../../tokens/spacing`

## Layout — no inline flex/grid

- No `display: 'flex'` or `display: 'grid'` inline — use `Horizontal`, `Vertical`, `View`, `Grid`
- Full-page layouts use `AppShell` (not hand-rolled header + sidebar)

## Responsive — no fixed column counts

- Grids use `repeat(auto-fill, minmax(Xpx, 1fr))`
- Data tables wrapped with `overflowX: 'auto'`

## Accessibility

- Interactive elements are keyboard-reachable
- Images have `alt` text
- Form inputs have labels or `aria-label`
- Icon-only buttons have `aria-label`
- Color is not the sole state indicator
