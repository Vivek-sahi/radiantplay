/**
 * Shadow Tokens
 *
 * Elevation and shadow values for depth and hierarchy.
 */

/**
 * Shadow Primitives — Figma 3.0 semantic levels (Phase 4).
 *
 * Replaces the generic 6-step xs–2xl scale with 3 semantic levels matched
 * to the components that use them. Light mode uses colored ink tints
 * (#192331); dark mode uses pure black so elevated surfaces stay readable
 * on dark canvases.
 *
 * Mapping:
 *   surface  → Card, Tooltip, Nav  (subtle, near-flat elevation)
 *   menu     → Dropdown, Popover   (mid elevation, longer drop)
 *   modal    → Modal, Dialog       (highest elevation, deepest drop)
 */
export const shadowPrimitives = {
  light: {
    surface: '0 0 4px #1923311a, 0 2px 4px #1923310a',
    menu: '0 0 4px #19233114, 0 12px 24px #1923311f',
    modal: '0 0 4px #1923311a, 0 24px 32px #19233129',
  },
  dark: {
    surface: '0 0 4px rgba(0,0,0,0.24), 0 2px 8px rgba(0,0,0,0.2)',
    menu: '0 0 6px rgba(0,0,0,0.16), 0 12px 28px rgba(0,0,0,0.32)',
    modal: '0 0 4px rgba(0,0,0,0.4), 0 24px 32px rgba(0,0,0,0.6)',
  },
} as const;

export const shadows = {
  // Base shadow scale
  none: 'none',
  
  xs: '0px 1px 2px rgba(29, 35, 47, 0.05)',
  
  sm: '0px 1px 3px rgba(29, 35, 47, 0.1), 0px 1px 2px rgba(29, 35, 47, 0.06)',
  
  md: '0px 4px 6px -1px rgba(29, 35, 47, 0.1), 0px 2px 4px -1px rgba(29, 35, 47, 0.06)',
  
  lg: '0px 10px 15px -3px rgba(29, 35, 47, 0.1), 0px 4px 6px -2px rgba(29, 35, 47, 0.05)',
  
  xl: '0px 20px 25px -5px rgba(29, 35, 47, 0.1), 0px 10px 10px -5px rgba(29, 35, 47, 0.04)',
  
  '2xl': '0px 25px 50px -12px rgba(29, 35, 47, 0.25)',

  // Inner shadow
  inner: 'inset 0px 2px 4px rgba(29, 35, 47, 0.06)',

  // Focus ring shadow
  focusRing: '0 0 0 3px rgba(39, 112, 239, 0.4)',
  focusRingError: '0 0 0 3px rgba(226, 43, 61, 0.4)',
  focusRingSuccess: '0 0 0 3px rgba(6, 191, 127, 0.4)',
} as const;

// Semantic shadow mapping
export const elevation = {
  // Elevation levels
  level0: shadows.none,      // Flat, no elevation
  level1: shadows.xs,        // Subtle elevation (cards on page)
  level2: shadows.sm,        // Low elevation (raised cards)
  level3: shadows.md,        // Medium elevation (dropdowns)
  level4: shadows.lg,        // High elevation (modals, popovers)
  level5: shadows.xl,        // Highest elevation (dialogs)
} as const;

// Component-specific shadows (Phase 4: remapped to 3 semantic primitives)
export const componentShadows = {
  // Cards
  card: {
    default: shadowPrimitives.light.surface,
    hover: shadowPrimitives.light.surface,
    raised: shadowPrimitives.light.menu,
  },

  // Dropdowns & Popovers
  dropdown: shadowPrimitives.light.menu,
  popover: shadowPrimitives.light.menu,
  tooltip: shadowPrimitives.light.surface,

  // Modals & Dialogs
  modal: shadowPrimitives.light.modal,
  dialog: shadowPrimitives.light.modal,

  // Navigation
  nav: {
    header: shadowPrimitives.light.surface,
    sidebar: shadowPrimitives.light.surface,
  },

  // Buttons (on hover/active) — keep legacy values, no Figma 3.0 spec for these
  button: {
    hover: shadows.xs,
    active: shadows.inner,
  },

  // Input focus
  input: {
    focus: shadows.focusRing,
    focusError: shadows.focusRingError,
  },
} as const;

// Type exports
export type Shadow = keyof typeof shadows;
export type Elevation = keyof typeof elevation;
export type ComponentShadows = typeof componentShadows;
export type ShadowPrimitive = keyof typeof shadowPrimitives.light;

