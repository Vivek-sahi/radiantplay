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
Reference Tokens (primitives) → System Tokens (semantic) → Component Tokens
     ↓                              ↓                          ↓
  referenceColors              systemColors              rdComponentColors
  (mode-agnostic)           (mode-aware light/dark)    (per-component colors)
```

---

## Color Tokens

### Import Path
```typescript
import { systemColors, referenceColors, rdComponentColors } from '../../tokens/colors';
```

### System Colors (preferred for most uses)

Mode-aware tokens organized into 3 groups:

| Group | Example Token | Light Value | Usage |
|-------|--------------|-------------|-------|
| **background-base** | `systemColors.light['background-base']` | `#FFFFFF` | Page/card surfaces |
| **background-sunken** | `systemColors.light['background-sunken']` | `#F6F8FA` | Page background |
| **background-subtle** | `systemColors.light['background-subtle']` | `#EAEDF2` | Muted fills |
| **background-brand** | `systemColors.light['background-brand']` | `#2770EF` | Primary brand bg |
| **content-primary** | `systemColors.light['content-primary']` | `#1D232F` | Default text |
| **content-secondary** | `systemColors.light['content-secondary']` | `#777E8B` | Secondary text |
| **content-tertiary** | `systemColors.light['content-tertiary']` | `#A5ACB9` | Disabled/placeholder |
| **content-brand** | `systemColors.light['content-brand']` | `#2770EF` | Brand text/links |
| **content-success** | `systemColors.light['content-success']` | `#06BF7F` | Success text |
| **content-failure** | `systemColors.light['content-failure']` | `#E22B3D` | Error text |
| **border-default** | `systemColors.light['border-default']` | `#C0C6CF` | Default borders |
| **border-divider** | `systemColors.light['border-divider']` | `#EAEDF2` | Dividers |
| **border-focus** | `systemColors.light['border-focus']` | `#2770EF` | Focus rings |

### Reference Colors (primitives)

Mode-agnostic tonal scales for custom styling:

```typescript
referenceColors.gray['90']    // #1D232F
referenceColors.brand['60']   // #2770EF
referenceColors.red['60']     // #E22B3D
referenceColors.purple['60']  // #8C62F5
referenceColors.black          // #000000
referenceColors.white          // #FFFFFF
```

### Component Colors

Per-component tokens:
```typescript
rdComponentColors.light['button-primary-default']   // #2770EF
rdComponentColors.light['button-primary-hover']      // #2359B6
rdComponentColors.light['toggle-track-on']           // #2770EF
rdComponentColors.light['chip-attribute-default']    // #DEE8FA
```

### Status Colors

```typescript
// Success
backgroundColor: systemColors.light['background-success']   // #E0F8EF
color: systemColors.light['content-success']                 // #06BF7F

// Warning
backgroundColor: systemColors.light['background-warning']    // #FFF8E5
color: systemColors.light['content-warning']                 // #FCC838

// Error
backgroundColor: systemColors.light['background-failure']    // #FFEBEC
color: systemColors.light['content-failure']                 // #E22B3D

// Info
backgroundColor: systemColors.light['background-information'] // #DEE8FA
color: systemColors.light['content-information']              // #2770EF
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

style={{ ...v2TextStyles.pageTitle }}    // 24px, semibold
style={{ ...v2TextStyles.modalTitle }}   // 20px, medium
style={{ ...v2TextStyles.sectionLabel }} // 18px, medium
style={{ ...v2TextStyles.contentLabel }} // 16px, medium
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

### Use TypeScript Imports in Inline Styles

```typescript
import { systemColors, referenceColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

const styles = {
  container: {
    backgroundColor: systemColors.light['background-sunken'],
    padding: `${spacing.F}px`,
    borderRadius: '6px',
  },
};
```

### When to Use Each

| Scenario | Use |
|----------|-----|
| CSS Module files | CSS Variables (`var(--rd-sys-color-...)`) |
| Inline styles in prototypes | TypeScript imports (`systemColors.light[...]`) |
| Dynamic/conditional values | TypeScript imports |
| Theme-aware styling | CSS Variables (automatically switch with theme) |

---

## Common Token Combinations

### Card Container
```typescript
const cardStyle = {
  backgroundColor: systemColors.light['background-base'],
  border: `1px solid ${systemColors.light['border-divider']}`,
  borderRadius: '8px',
  padding: `${spacing.F}px`,
};
```

### Page Layout
```typescript
const pageStyle = {
  backgroundColor: systemColors.light['background-sunken'],
  padding: `${spacing.F}px ${spacing.H}px`,
  minHeight: '100vh',
};
```

### Form Field Label
```typescript
const labelStyle = {
  ...v2TextStyles.contentLabelSubhead,
  color: systemColors.light['content-primary'],
  marginBottom: `${spacing.B}px`,
};
```

### Status Badge
```typescript
const successBadge = {
  backgroundColor: systemColors.light['background-success'],
  color: systemColors.light['content-success'],
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

// GOOD — use systemColors or referenceColors
import { systemColors, referenceColors } from '../../tokens/colors';
{
  color: systemColors.light['content-primary'],
  backgroundColor: systemColors.light['background-sunken'],
  border: `1px solid ${systemColors.light['border-divider']}`,
  fill: systemColors.light['content-brand'],
  stroke: systemColors.light['content-failure'],
}
```

**No exceptions for "obvious" whites or blacks.** `#FFFFFF` → `systemColors.light['background-base']` or `referenceColors.white`. `#000000` → `referenceColors.black`.

### 2. Deprecated token imports

```typescript
// BAD — deprecated, removed
import { brandColors } from '../../tokens/colors/brand';
{
  color: brandColors.gray[90],
  backgroundColor: brandColors.gray[10],
}

// GOOD
import { systemColors } from '../../tokens/colors';
{
  color: systemColors.light['content-primary'],
  backgroundColor: systemColors.light['background-sunken'],
}
```

### 3. Hardcoded font family strings

```typescript
// BAD — never hardcode font stacks
{
  fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, sans-serif',
  fontFamily: 'Arial, sans-serif',
}

// GOOD — import the token
import { fontFamily } from '../../tokens/typography';
{
  fontFamily: fontFamily.primary,   // full "Plain" stack
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
