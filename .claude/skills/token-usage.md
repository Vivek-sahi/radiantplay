---
name: token-usage
description: Design token reference for colors, spacing, typography. 3-layer hierarchy, CSS variables, and anti-patterns. Load when writing styles or reviewing token usage.
globs:
  - "src/**/*.css"
  - "src/**/*.module.css"
  - "src/tokens/**/*"
  - "src/prototypes/**/*.tsx"
---

# Radiant Design Token Usage Guide

**NEVER hard-code colors, spacing, typography, or other visual values.** Always use design tokens.

## Token Hierarchy (3-Layer Architecture)

```
Reference Tokens (primitives) → System Tokens (semantic)    → Component Tokens
     ↓                              ↓                             ↓
  fixed palette values         --rd-sys-color-*              --rd-comp-color-*
  (data only, not for UI)      sysVar('...') in TSX          compVar('...') in TSX
                               (follow the theme)            (follow the theme)
```

## Dark mode

Radiant Play has a light and a dark theme. Light is the default. Setting `data-theme="dark"` on `<html>` flips every `--rd-sys-color-*` and `--rd-comp-color-*` variable, so UI code must read colours through those variables:

- **CSS Modules:** `var(--rd-sys-color-content-primary)`, `var(--rd-comp-color-button-primary-default)`, `var(--rd-sys-color-shadow-menu)`.
- **Inline styles in TSX:** `sysVar('content-primary')`, `compVar('chip-filter-default')`, `shadowVar('surface' | 'menu' | 'modal')`, all from `@tokens/colors`. Each returns the matching `var(...)` string.
- **Tints:** `color-mix(in srgb, var(--rd-sys-color-content-brand) 12%, transparent)`, not a hex with alpha.

`systemColors.light[...]`, `rdComponentColors.light[...]` and `referenceColors.*` hold fixed values. They stay light in dark mode, so never use them for UI. They exist as token data for docs pages, swatches and canvas charts (charts read colours through `useChartTheme()` from `src/prototypes/_shared/tiles/chartTheme`).

Check dark mode with the ThemeSwitch or Ctrl+D. Run `npm run scan:dark -- src/prototypes/<Name>` or `/radiant-check` to report dark readiness.

---

## Color Tokens

### Import Path
```typescript
import { sysVar, compVar, shadowVar } from '../../tokens/colors';
```

### System Colors (preferred for most uses)

Mode-aware tokens organized into 3 groups:

| Group | Example Token | Light Value | Usage |
|-------|--------------|-------------|-------|
| **background-base** | `sysVar('background-base')` | `#FFFFFF` | Page/card surfaces |
| **background-sunken** | `sysVar('background-sunken')` | `#F6F8FA` | Page background |
| **background-secondary-action** | `sysVar('background-secondary-action')` | `#EAEDF2` | Muted fills (older alias `background-subtle`) |
| **background-on-base** | `sysVar('background-on-base')` | `#F6F8FA` | Fills that sit on a base surface |
| **background-brand** | `sysVar('background-brand')` | `#2770EF` | Primary brand bg |
| **content-primary** | `sysVar('content-primary')` | `#1D232F` | Default text |
| **content-secondary** | `sysVar('content-secondary')` | `#777E8B` | Secondary text |
| **content-tertiary** | `sysVar('content-tertiary')` | `#A5ACB9` | Disabled/placeholder |
| **content-brand** | `sysVar('content-brand')` | `#2770EF` | Brand text/links |
| **content-success** | `sysVar('content-success')` | `#06BF7F` | Success text |
| **content-failure** | `sysVar('content-failure')` | `#E22B3D` | Error text |
| **border-bold** | `sysVar('border-bold')` | `#C0C6CF` | Default borders (older alias `border-default`) |
| **border-subtle** | `sysVar('border-subtle')` | `#EAEDF2` | Dividers (older alias `border-divider`) |
| **border-focus** | `sysVar('border-focus')` | `#2770EF` | Focus rings |

### Reference Colors (primitives)

Fixed tonal scales (`gray`, `brand`, `red`, `purple`, `black`, `white` and so on). System tokens are built from them. They do not change with the theme, so they are token data, not UI colours. Don't use `referenceColors.*` in prototype or component styles; pick the system or component token that names the role instead.

### Component Colors

Per-component tokens:
```typescript
compVar('button-primary-default')   // #2770EF
compVar('button-primary-hover')      // #2359B6
compVar('toggle-track-on')           // #2770EF
compVar('chip-attribute-default')    // #DEE8FA
```

### Status Colors

```typescript
// Success
backgroundColor: sysVar('background-success')   // #E0F8EF
color: sysVar('content-success')                 // #06BF7F

// Warning
backgroundColor: sysVar('background-warning')    // #FFF8E5
color: sysVar('content-warning')                 // #FCC838

// Error
backgroundColor: sysVar('background-failure')    // #FFEBEC
color: sysVar('content-failure')                 // #E22B3D

// Info
backgroundColor: sysVar('background-information') // #DEE8FA
color: sysVar('content-information')              // #2770EF
```

---

## Spacing Tokens

### Import Path
```typescript
import { spacing, componentSpacing } from '../../tokens/spacing';
```

### Named Spacing Scale (A-N)

| Token | Value | Use Case |
|-------|-------|----------|
| `spacing.A` | 4px | Tight gaps, icon margins |
| `spacing.B` | 8px | Default gap, chip padding |
| `spacing.C` | 12px | Button padding, input padding |
| `spacing.D` | 16px | Card gap, section spacing |
| `spacing.E` | 20px | Modal header padding |
| `spacing.F` | 24px | Card padding, page margins |
| `spacing.G` | 28px | Large gaps |
| `spacing.H` | 32px | Section separators |
| `spacing.I` | 40px | Large section gaps |
| `spacing.J` | 48px | Page section spacing |
| `spacing.K` | 56px | Large page gaps |
| `spacing.L` | 64px | Major section dividers |
| `spacing.M` | 80px | Hero spacing |
| `spacing.N` | 96px | Page-level margins |

### Semantic Spacing Aliases

```typescript
spacing.xs   // 8px  - tight
spacing.sm   // 12px - small
spacing.md   // 16px - medium (default)
spacing.lg   // 24px - large
spacing.xl   // 32px - extra large
```

### Component-Specific Spacing

```typescript
import { componentSpacing } from '../../tokens/spacing';

componentSpacing.button.medium.paddingX  // 16px
componentSpacing.modal.padding           // 24px
componentSpacing.form.fieldGap           // 20px
componentSpacing.page.paddingX           // 24px
```

---

## Typography Tokens

### Import Path
```typescript
import { fontFamily, fontSize, fontWeight, lineHeight, v2TextStyles } from '../../tokens/typography';
```

### V2 Text Styles (Recommended)

```typescript
import { v2TextStyles } from '../../tokens/typography';

style={{ ...v2TextStyles.pageTitle }}    // 24px, emphasis (550)
style={{ ...v2TextStyles.modalTitle }}   // 20px, emphasis (550)
style={{ ...v2TextStyles.sectionLabel }} // 18px, emphasis (550)
style={{ ...v2TextStyles.contentLabel }} // 16px, emphasis (550)
style={{ ...v2TextStyles.bodyNormal }}   // 14px, regular
style={{ ...v2TextStyles.footnote }}     // 12px, regular
style={{ ...v2TextStyles.overline }}     // 12px, uppercase
```

---

## CSS Variables vs TypeScript Imports

### Use CSS Variables in CSS Modules

```css
/* ComponentName.module.css */
.container {
  color: var(--rd-sys-color-content-primary);
  background-color: var(--rd-sys-color-background-base);
  border: 1px solid var(--rd-sys-color-border-divider);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
}

.button {
  background-color: var(--rd-comp-color-button-primary-default);
  color: var(--rd-comp-color-button-primary-on-color-default);
}
```

### Use sysVar / compVar / shadowVar in Inline Styles

```typescript
import { sysVar, shadowVar } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

const styles = {
  container: {
    backgroundColor: sysVar('background-sunken'),
    padding: `${spacing.F}px`,
    borderRadius: '6px',
    boxShadow: shadowVar('menu'),
  },
};
```

### When to Use Each

| Scenario | Use |
|----------|-----|
| CSS Module files | CSS Variables (`var(--rd-sys-color-...)`) |
| Inline styles in prototypes | `sysVar('...')`, `compVar('...')`, `shadowVar('...')` |
| Dynamic/conditional values | `sysVar('...')` / `compVar('...')` |
| Tints and translucent fills | `color-mix(in srgb, var(--rd-sys-color-...) 12%, transparent)` |
| Canvas charts | `useChartTheme()` (reads the live theme) |
| Docs pages and swatches that show token values | `systemColors` / `rdComponentColors` / `referenceColors` as data |

---

## Common Token Combinations

### Card Container
```typescript
const cardStyle = {
  backgroundColor: sysVar('background-base'),
  border: `1px solid ${sysVar('border-divider')}`,
  borderRadius: '8px',
  padding: `${spacing.F}px`,
};
```

### Page Layout
```typescript
const pageStyle = {
  backgroundColor: sysVar('background-sunken'),
  padding: `${spacing.F}px ${spacing.H}px`,
  minHeight: '100vh',
};
```

### Form Field Label
```typescript
const labelStyle = {
  ...v2TextStyles.contentLabelSubhead,
  color: sysVar('content-primary'),
  marginBottom: `${spacing.B}px`,
};
```

### Status Badge
```typescript
const successBadge = {
  backgroundColor: sysVar('background-success'),
  color: sysVar('content-success'),
  padding: `${spacing.A}px ${spacing.B}px`,
  borderRadius: '4px',
};
```

---

## Anti-Patterns (NEVER DO)

### 1. Hardcoded hex colors — ALWAYS forbidden

```typescript
// BAD — any raw hex or rgba value
{
  color: '#1D232F',
  backgroundColor: '#F6F8FA',
  border: '1px solid #EAEDF2',
  fill: '#2770EF',
  stroke: '#E22B3D',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
}

// GOOD: theme-aware system tokens
import { sysVar, shadowVar } from '../../tokens/colors';
{
  color: sysVar('content-primary'),
  backgroundColor: sysVar('background-sunken'),
  border: `1px solid ${sysVar('border-divider')}`,
  fill: sysVar('content-brand'),
  stroke: sysVar('content-failure'),
  boxShadow: shadowVar('menu'),
}
```

**No exceptions for "obvious" whites or blacks.** `#FFFFFF` on a surface → `sysVar('background-base')`. `#FFFFFF` text or icons on a brand or status fill → `sysVar('content-inverse')`. `#000000` text → `sysVar('content-primary')`. Never use `referenceColors.white` or `referenceColors.black` for UI: they stay fixed when the theme flips.

### 2. Deprecated token imports

```typescript
// BAD — deprecated, removed
import { brandColors } from '../../tokens/colors/brand';
{
  color: brandColors.gray[90],
  backgroundColor: brandColors.gray[10],
}

// GOOD
import { sysVar } from '../../tokens/colors';
{
  color: sysVar('content-primary'),
  backgroundColor: sysVar('background-sunken'),
}
```

### 3. Hardcoded font family strings

```typescript
// BAD — never hardcode font stacks
{
  fontFamily: '"Geist", -apple-system, BlinkMacSystemFont, sans-serif',
  fontFamily: 'Arial, sans-serif',
}

// GOOD — import the token
import { fontFamily } from '../../tokens/typography';
{
  fontFamily: fontFamily.primary,   // full "Geist" stack
  fontFamily: fontFamily.mono,      // monospace stack
}
```

### 4. Magic spacing values not from the scale

```typescript
// BAD — magic pixel numbers
{
  padding: '17px 12px',
  gap: 7,
  marginTop: 44,
}

// GOOD — nearest spacing token
import { spacing } from '../../tokens/spacing';
{
  padding: `${spacing.E}px ${spacing.D}px`,  // 20px 16px
  gap: spacing.B,                             // 8px
  marginTop: spacing.J,                       // 48px
}
```

The spacing scale: A=4, B=8, C=12, D=16, E=20, F=24, G=28, H=32, I=40, J=48, K=56, L=64, M=80, N=96.
