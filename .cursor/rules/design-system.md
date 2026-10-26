---
description: Component creation standards for the shared Radiant design system including forwardRef patterns, TypeScript interfaces, CSS Modules with camelCase, accessibility requirements, and Icon validation. Use when creating or modifying components in src/components/. Do NOT use for prototype-local components (those follow simpler patterns).
globs: ["src/components/**/*.tsx", "src/components/**/*.ts", "src/components/**/*.css"]
---

# Radiant Design System - Component Creation Rules

You are building components for the **Radiant Design System** (ThoughtSpot's component library). Follow these rules strictly when creating or modifying components.

## File Structure

Every component MUST follow this folder structure:

```
src/components/ComponentName/
├── ComponentName.tsx        # Main component file
├── ComponentName.module.css # CSS Module styles
└── index.ts                 # Exports
```

## Component Architecture

### TypeScript Requirements

```tsx
// 1. Imports - React first, then internal, then styles
import React, { forwardRef, useState, useCallback } from 'react';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import styles from './ComponentName.module.css';

// 2. Type exports - Define and export all types
export type ComponentVariant = 'primary' | 'secondary';
export type ComponentSize = 'small' | 'basic' | 'large';

// 3. Props interface - Extend HTML element props when applicable
export interface ComponentNameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** JSDoc comment for each prop */
  variant?: ComponentVariant;
  /** Size of the component */
  size?: ComponentSize;
  /** Required props have no default */
  children: React.ReactNode;
}

// 4. Use forwardRef for all interactive components
export const ComponentName = forwardRef<HTMLDivElement, ComponentNameProps>(({
  variant = 'primary',
  size = 'basic',
  children,
  className,
  ...props
}, ref) => {
  // Component logic
});

ComponentName.displayName = 'ComponentName';
export default ComponentName;
```

### Export Pattern (index.ts)

```typescript
export { ComponentName, default } from './ComponentName';
export type { 
  ComponentNameProps, 
  ComponentVariant, 
  ComponentSize 
} from './ComponentName';
```

## Design Tokens - MANDATORY

**NEVER hard-code colors, spacing, typography, or other visual values.**

### In CSS Modules - Use CSS Variables

```css
/* CORRECT */
.component {
  color: var(--color-text-default);
  background-color: var(--color-brand-blue-60);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  transition: background-color var(--duration-fast) var(--easing-standard);
}

/* WRONG - Never do this */
.component {
  color: #1D232F;
  padding: 12px 16px;
  border-radius: 6px;
}
```

### In TypeScript - Import from tokens

```typescript
import { statusColors, textColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

// Inline only for values computed at runtime; static styles go in the CSS Module
style={{ backgroundColor: statusColors.success.background }}
```

### Token Categories

| Category | CSS Variable Pattern | Import Path |
|----------|---------------------|-------------|
| Colors | `var(--color-*)` | `tokens/colors` |
| Spacing | `var(--spacing-*)` | `tokens/spacing` |
| Typography | `var(--font-*)`, `var(--line-height-*)` | `tokens/typography` |
| Radius | `var(--radius-*)` | `tokens/radius` |
| Shadows | `var(--shadow-*)` | `tokens/shadows` |
| Animation | `var(--duration-*)`, `var(--easing-*)` | `tokens/animation` |

## CSS Module Conventions

### Class Naming

```css
/* Use camelCase for multi-word classes */
.iconLeading { }
.fullWidth { }
.sectionContent { }

/* Use variant/size names directly as classes */
.primary { }
.secondary { }
.small { }
.basic { }
.large { }

/* State classes */
.active { }
.disabled { }
.hover { } /* Only if needed for JS-controlled states */
```

### Building Class Names in Components

```tsx
const componentClasses = [
  styles.component,
  styles[variant],
  styles[size],
  isActive && styles.active,
  disabled && styles.disabled,
  fullWidth && styles.fullWidth,
  className, // Always include passed className last
].filter(Boolean).join(' ');
```

## Accessibility Requirements

1. **Interactive elements** must have focus styles:
   ```css
   .button:focus-visible {
     outline: 2px solid var(--color-brand-blue-60);
     outline-offset: 2px;
   }
   ```

2. **Use semantic HTML elements** (`button`, `input`, `a`, etc.)

3. **Add ARIA labels** for icon-only buttons:
   ```tsx
   <button aria-label="Close dialog">
     <Icon name="cross" />
   </button>
   ```

4. **Use role="alert"** for notification components

5. **Support keyboard navigation** for custom interactive elements

## Icon Integration

```tsx
// Import Icon component and types
import { Icon, isValidIconName } from '../icons';
import type { IconName, IconSize } from '../icons';

// Support both icon names and ReactNode
icon?: React.ReactNode | IconName;

// Render with validation
const renderIcon = () => {
  if (typeof icon === 'string' && isValidIconName(icon)) {
    return <Icon name={icon as IconName} size={iconSize} />;
  }
  return icon; // ReactNode fallback
};
```

## Documentation (JSDoc)

Every component MUST have:

```tsx
/**
 * ComponentName
 * 
 * Brief description of what this component does.
 * 
 * **Variants:**
 * - `primary` - Description
 * - `secondary` - Description
 * 
 * **Sizes:**
 * - `small` - Xpx height
 * - `basic` - Xpx height (default)
 * 
 * @example
 * ```tsx
 * <ComponentName variant="primary" size="basic">
 *   Content
 * </ComponentName>
 * ```
 */
```

## Content Guidelines

All user-facing text in components MUST follow ThoughtSpot content guidelines.
See: @content-guidelines.md for quick reference
See: [docs/content-guidelines-detailed.md](docs/content-guidelines-detailed.md) for full rules

Key rules:
- **Sentence case** for all UI text
- **Imperative verbs** for buttons (Save, Delete, Export)
- **1-2 words max** for button labels
- **No periods** in labels or buttons
- **Active voice** always

## Quick Reference: Component Sizes

| Size | Height | Font Size | Use Case |
|------|--------|-----------|----------|
| small | 24px | 12px | Compact UIs, tables |
| basic | 32px | 14px | Default, most cases |
| large | 32px+ | 14px | Prominent actions |

## Reference Components

Study these components for patterns:
- **Button**: [src/components/Button/Button.tsx](src/components/Button/Button.tsx) - forwardRef, variants, icon support
- **Alert**: [src/components/Alert/Alert.tsx](src/components/Alert/Alert.tsx) - status colors, token usage, accessibility
