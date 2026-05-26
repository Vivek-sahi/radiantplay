/**
 * System Color Tokens
 *
 * Mode-aware semantic tokens organized into 3 groups:
 *   - background (15 tokens): surfaces, fills, overlays
 *   - content (15 tokens): text, icons, links
 *   - border (12 tokens): outlines, dividers, strokes
 *
 * Light and dark modes are derived from the same tonal palettes
 * using Material Color Utilities tone mappings.
 *
 * SCSS map names: $rd-sys-color-map, $rd-sys-color-map-dark
 */

export const systemColors = {
  light: {
    // Background (15 original + 9 accents = 24)
    'background-base': '#FFFFFF',
    'background-raised': '#FFFFFF',
    'background-sunken': '#F6F8FA',
    'background-subtle': '#EAEDF2',
    'background-inset': '#C0C6CF',
    'background-brand': '#2770EF',
    'background-overlay': '#1F2632CC',          // was rgba(29,35,47,0.5) — Phase 2 fix
    'background-base-inverse': '#1D232F',       // Matches production --ts-var-liveboard-edit-bar-background (Gray/90). Phase 2 had #323946 but production never aligned.
    'background-raised-inverse': '#323946',
    'background-success': '#E0F8EF',
    'background-warning': '#FFF8E5',
    'background-failure': '#FFEBEC',
    'background-information': '#DEE8FA',
    'background-ghost-hover': 'rgba(192, 198, 207, 0.12)',
    'background-ghost-highlight': '#71A1F41F', // was #DEE8FA — Phase 2 fix (12% translucent)
    'background-on-base': '#F6F8FA',
    'background-active': '#FFFFFF',
    'background-accent-green': '#E0F8EF',
    'background-accent-yellow': '#FFF8E5',
    'background-accent-red': '#FFEBEC',
    'background-accent-blue': '#DEE8FA',
    'background-accent-gray': '#F6F8FA',
    'background-accent-purple-subtle': '#F0EBFF',
    'background-accent-purple-bold': '#8C62F5',

    // Content (15 original + 6 accents = 21)
    'content-primary': '#1D232F',
    'content-secondary': '#777E8B',
    'content-tertiary': '#C0C6CF',              // was #A5ACB9 — Phase 2 fix (Gray/40)
    'content-alternate': '#FFFFFF',
    'content-brand': '#2770EF',
    'content-primary-inverse': '#FFFFFF',
    'content-alternate-inverse': '#1D232F',
    'content-brand-inverse': '#71A1F4',
    'content-success': '#06BF7F',
    'content-warning': '#FCC838',
    'content-failure': '#E22B3D',
    'content-information': '#2770EF',
    'content-link': '#2770EF',
    'content-link-inverse': '#FFFFFF',
    'content-link-inverse-hover': '#EAEDF2',
    'content-accent-yellow': '#FCC838',
    'content-accent-red': '#E22B3D',
    'content-accent-blue': '#2770EF',
    'content-accent-gray': '#777E8B',
    'content-accent-green': '#06BF7F',
    'content-accent-purple': '#8C62F5',

    // Border (12 original + 7 accents = 19)
    'border-default': '#C0C6CF',
    'border-hover': '#A5ACB9',                  // was #777E8B — Phase 2 fix (Gray/50)
    'border-divider': '#EAEDF2',
    'border-brand': '#2770EF',
    'border-warning': '#FCC838',
    'border-failure': '#E22B3D',
    'border-default-inverse': '#4A515E',
    'border-hover-inverse': '#777E8B',
    'border-divider-inverse': '#4A515E',
    'border-brand-inverse': '#71A1F4',
    'border-focus': '#71A1F4',                  // was #2770EF — Phase 2 fix (Blue/50)
    'border-gap': '#FFFFFF',
    'border-subtle-hover': '#DBDFE7',
    'border-accent-green': '#06BF7F',
    'border-accent-yellow': '#FCC838',
    'border-accent-red': '#E22B3D',
    'border-accent-blue': '#2770EF',
    'border-accent-gray': '#777E8B',
    'border-accent-purple': '#8C62F5',
  },

  dark: {
    // Background — Phase 6 will properly remap to neutral Dark Gray scale
    'background-base': '#1D232F',
    'background-raised': '#323946',
    'background-sunken': '#323946',
    'background-subtle': '#4A515E',
    'background-inset': '#777E8B',
    'background-brand': '#2770EF',
    'background-overlay': 'rgba(0, 0, 0, 0.6)',
    'background-base-inverse': '#FFFFFF',
    'background-raised-inverse': '#F6F8FA',
    'background-success': 'rgba(6, 191, 127, 0.2)',
    'background-warning': 'rgba(252, 200, 56, 0.2)',
    'background-failure': 'rgba(226, 43, 61, 0.2)',
    'background-information': 'rgba(39, 112, 239, 0.2)',
    'background-ghost-hover': 'rgba(119, 126, 139, 0.24)',
    'background-ghost-highlight': 'rgba(39, 112, 239, 0.3)',
    // New (Phase 2 keys, Phase-6-pending values)
    'background-on-base': '#323946',
    'background-active': '#323946',
    'background-accent-green': 'rgba(6, 191, 127, 0.2)',
    'background-accent-yellow': 'rgba(252, 200, 56, 0.2)',
    'background-accent-red': 'rgba(226, 43, 61, 0.2)',
    'background-accent-blue': 'rgba(39, 112, 239, 0.2)',
    'background-accent-gray': '#323946',
    'background-accent-purple-subtle': 'rgba(140, 98, 245, 0.2)',
    'background-accent-purple-bold': '#8C62F5',

    // Content
    'content-primary': '#FFFFFF',
    'content-secondary': '#A5ACB9',
    'content-tertiary': '#777E8B',
    'content-alternate': '#1D232F',
    'content-brand': '#71A1F4',
    'content-primary-inverse': '#1D232F',
    'content-alternate-inverse': '#FFFFFF',
    'content-brand-inverse': '#2770EF',
    'content-success': '#06BF7F',
    'content-warning': '#FCC838',
    'content-failure': '#F47E89',
    'content-information': '#71A1F4',
    'content-link': '#71A1F4',
    'content-link-inverse': '#1D232F',
    'content-link-inverse-hover': '#4A515E',
    // New (Phase 2 keys, Phase-6-pending values)
    'content-accent-yellow': '#FCC838',
    'content-accent-red': '#F47E89',
    'content-accent-blue': '#71A1F4',
    'content-accent-gray': '#A5ACB9',
    'content-accent-green': '#06BF7F',
    'content-accent-purple': '#8C62F5',

    // Border
    'border-default': '#777E8B',
    'border-hover': '#A5ACB9',
    'border-divider': '#4A515E',
    'border-brand': '#71A1F4',
    'border-warning': '#FCC838',
    'border-failure': '#F47E89',
    'border-default-inverse': '#C0C6CF',
    'border-hover-inverse': '#A5ACB9',
    'border-divider-inverse': '#DBDFE7',
    'border-brand-inverse': '#2770EF',
    'border-focus': '#71A1F4',
    'border-gap': '#1D232F',
    // New (Phase 2 keys, Phase-6-pending values)
    'border-subtle-hover': '#4A515E',
    'border-accent-green': '#06BF7F',
    'border-accent-yellow': '#FCC838',
    'border-accent-red': '#F47E89',
    'border-accent-blue': '#71A1F4',
    'border-accent-gray': '#777E8B',
    'border-accent-purple': '#8C62F5',
  },
} as const;

export type SystemColors = typeof systemColors;
export type SystemColorKey = keyof typeof systemColors.light;
