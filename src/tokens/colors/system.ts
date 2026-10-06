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
 *
 * Figma Radiant 3.0 names that differ from ours are added as aliases
 * (see figmaNameAliases below), so either name works. Nothing is renamed.
 */

const baseSystemColors = {
  light: {
    // Background (15 original + 9 accents = 24)
    'background-base': '#FFFFFF',
    'background-raised': '#FFFFFF',
    'background-sunken': '#F6F8FA',
    'background-subtle': '#EAEDF2',
    'background-inset': '#C0C6CF',
    'background-brand': '#2770EF',
    'background-overlay': '#1F2632CC',          // was rgba(29,35,47,0.5) — Phase 2 fix
    'background-base-inverse': '#323946',       // Gray/80, Figma Background/Inverse. Was #1D232F to match the production Liveboard edit bar (c7d04ac0); Figma is the source of truth
    'background-raised-inverse': '#323946',
    'background-success': '#E0F8EF',
    'background-warning': '#FFF8E5',
    'background-failure': '#FFEBEC',
    'background-information': '#DEE8FA',
    'background-ghost-hover': 'rgba(192, 198, 207, 0.12)',
    'background-ghost-highlight': '#71A1F41F', // was #DEE8FA — Phase 2 fix (12% translucent)
    'background-on-base': '#F6F8FA',
    'background-secondary-hover': '#DBDFE7',     // Gray/30, hover on background-secondary-action
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
    // Dark values from Figma Radiant 3.0 Theme collection, Dark mode (synced 2026-10-06).
    // Tokens Figma doesn't have (content-alternate, *-inverse, links, inset) keep their older values.
    // Background
    'background-base': '#1F2024',
    'background-raised': '#2D2F34',
    'background-sunken': '#18191B',
    'background-subtle': '#34363C',
    'background-inset': '#777E8B',
    'background-brand': '#71A1F4',
    'background-overlay': '#00030ABA',
    'background-base-inverse': '#DFE0E2',
    'background-raised-inverse': '#F6F8FA',
    'background-success': '#003B26',
    'background-warning': '#4F3D09',
    'background-failure': '#3D090E',
    'background-information': '#082559',
    'background-ghost-hover': '#C0C6CF1F',
    'background-ghost-highlight': '#71A1F41F',
    'background-on-base': '#26282C',
    'background-secondary-hover': '#46494E',     // Dark Gray/30
    'background-active': '#5D636A',
    'background-accent-green': '#003B26',
    'background-accent-yellow': '#4F3D09',
    'background-accent-red': '#3D090E',
    'background-accent-blue': '#082559',
    'background-accent-gray': '#2D2F34',
    'background-accent-purple-subtle': '#422E75',
    'background-accent-purple-bold': '#B094F8',

    // Content
    'content-primary': '#DFE0E2',
    'content-secondary': '#9A9EA2',
    'content-tertiary': '#5D636A',
    'content-alternate': '#1D232F',
    'content-brand': '#71A1F4',
    'content-primary-inverse': '#1F2024',
    'content-alternate-inverse': '#FFFFFF',
    'content-brand-inverse': '#2770EF',
    'content-success': '#56D3A8',
    'content-warning': '#FCD977',
    'content-failure': '#F47E89',
    'content-information': '#71A1F4',
    'content-link': '#71A1F4',
    'content-link-inverse': '#1D232F',
    'content-link-inverse-hover': '#4A515E',
    'content-accent-yellow': '#FCD977',
    'content-accent-red': '#F47E89',
    'content-accent-blue': '#71A1F4',
    'content-accent-gray': '#5D636A',
    'content-accent-green': '#56D3A8',
    'content-accent-purple': '#B094F8',

    // Border
    'border-default': '#5D636A',
    'border-hover': '#7A7D85',
    'border-divider': '#34363C',
    'border-brand': '#71A1F4',
    'border-warning': '#FCD977',
    'border-failure': '#F47E89',
    'border-default-inverse': '#C0C6CF',
    'border-hover-inverse': '#A5ACB9',
    'border-divider-inverse': '#DBDFE7',
    'border-brand-inverse': '#2770EF',
    'border-focus': '#2770EF',
    'border-gap': '#1F2024',
    'border-subtle-hover': '#46494E',
    'border-accent-green': '#56D3A8',
    'border-accent-yellow': '#FCD977',
    'border-accent-red': '#F47E89',
    'border-accent-blue': '#71A1F4',
    'border-accent-gray': '#5D636A',
    'border-accent-purple': '#B094F8',
  },
} as const;

/**
 * Figma Radiant 3.0 token name → our existing token it equals.
 * Aliases resolve to the same value in each mode.
 */
export const figmaNameAliases = {
  'background-inverse': 'background-base-inverse',
  'background-secondary-action': 'background-subtle',
  'content-inverse': 'content-primary-inverse',
  'border-subtle': 'border-divider',
  'border-bold': 'border-default',
  'border-bold-hover': 'border-hover',
} as const satisfies Record<string, keyof typeof baseSystemColors.light>;

type WithFigmaAliases<M> = M & { readonly [K in keyof typeof figmaNameAliases]: string };

function withFigmaAliases<M extends Record<keyof typeof baseSystemColors.light, string>>(
  mode: M,
): WithFigmaAliases<M> {
  const aliases = Object.fromEntries(
    Object.entries(figmaNameAliases).map(([alias, source]) => [alias, mode[source]]),
  );
  return { ...mode, ...aliases } as WithFigmaAliases<M>;
}

export const systemColors = {
  light: withFigmaAliases(baseSystemColors.light),
  dark: withFigmaAliases(baseSystemColors.dark),
} as const;

export type SystemColors = typeof systemColors;
export type SystemColorKey = keyof typeof systemColors.light;
