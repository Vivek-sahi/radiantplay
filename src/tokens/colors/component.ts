/**
 * Component Color Tokens
 *
 * Per-component tokens for button, chip, toggle, progress, charts and segmented control.
 * Mode-aware with separate light and dark maps.
 *
 * SCSS map names: $rd-comp-color-map, $rd-comp-color-map-dark
 */

const baseComponentColors = {
  light: {
    // Button (12)
    'button-primary-default': '#2770EF',
    'button-primary-hover': '#2359B6',
    'button-primary-pressed': '#163772',
    'button-primary-on-color-default': '#FFFFFF',
    'button-primary-on-color-hover': '#DEE8FA',
    'button-primary-on-color-pressed': '#CEDCF5',
    'button-secondary-default': '#EAEDF2',
    'button-secondary-hover': '#DBDFE7',
    'button-secondary-pressed': '#C0C6CF',
    'button-tertiary-hover': 'rgba(192, 198, 207, 0.12)',
    'button-tertiary-pressed': '#71A1F41F',
    'button-bg-overlay': '#20293A99',

    // Chip - Loading (1)
    'chip-loading-default': '#F6F8FA',

    // Chip - Attribute / blue (5 + border)
    'chip-attribute-default': '#DEE8FA',
    'chip-attribute-hover': '#CEDCF5',
    'chip-attribute-pressed': '#ABC7F9',
    'chip-attribute-icon': '#2770EF',
    'chip-attribute-active-border': '#CEDCF5',

    // Chip - Measure / green (5)
    'chip-measure-default': '#E0F8EF',
    'chip-measure-hover': '#C7F2E3',
    'chip-measure-pressed': '#9BE5CB',
    'chip-measure-icon': '#06BF7F',
    'chip-measure-active-border': '#C7F2E3',

    // Chip - Filter / gray (5)
    'chip-filter-default': '#EAEDF2',
    'chip-filter-hover': '#DBDFE7',
    'chip-filter-pressed': '#C0C6CF',
    'chip-filter-icon': '#777E8B',
    'chip-filter-active-border': '#DBDFE7',

    // Chip - Date / purple (5)
    'chip-date-default': '#F0EBFF',
    'chip-date-hover': '#E3D9FC',
    'chip-date-pressed': '#D1C0FB',
    'chip-date-icon': '#8C62F5',
    'chip-date-active-border': '#E3D9FC',

    // Chip - Input / gray with selection (6)
    'chip-input-default': '#FFFFFF',
    'chip-input-hover': '#F6F8FA',
    'chip-input-pressed': '#EAEDF2',
    'chip-input-selected-default': '#4A515E',
    'chip-input-selected-hover': '#323946',
    'chip-input-selected-pressed': '#1D232F',

    // Chip - Error / red (3)
    'chip-error-default': '#FFEBEC',
    'chip-error-hover': '#FCD4D7',
    'chip-error-active-border': '#DBDFE7',

    // Progress / circular, purple (3)
    'progress-track-active': '#F0EBFF',
    'progress-track-empty': '#EAEDF2',
    'progress-indicator-default': '#8C62F5',

    // Charts (13). Names and dark values from the product; light values are proposed
    'chart-surface': '#FFFFFF',
    'chart-border': 'transparent',
    'chart-gridline': '#F6F8FA',
    'chart-axis-line': '#EAEDF2',
    'chart-axis-label': '#777E8B',
    'chart-label': '#1D232F',
    'chart-tooltip-surface': '#323946',
    'chart-tooltip-text': '#FFFFFF',
    'chart-tooltip-shadow': '0 0 4px #19233114, 0 12px 24px #1923311f',
    'chart-control-surface': '#EAEDF2',
    'chart-table-striped-row': '#F6F8FA',
    'chart-data-label-halo': '#FFFFFF',
    'chart-scrollbar-track': '#F6F8FA',

    // Toggle (5)
    'toggle-track-off': '#C0C6CF',
    'toggle-track-on': '#CEDCF5',
    'toggle-thumb-off': '#FFFFFF',
    'toggle-thumb-on': '#2770EF',
    'toggle-thumb-outline-off': '#DBDFE7',

    // Segmented control (1)
    'segmented-control-content-active': '#2770EF',
  },

  dark: {
    // Button (12)
    'button-primary-default': '#71A1F4',
    'button-primary-hover': '#ABC7F9',
    'button-primary-pressed': '#CEDCF5',
    'button-primary-on-color-default': '#1F2024',
    'button-primary-on-color-hover': '#2D2F34',
    'button-primary-on-color-pressed': '#46494E',
    'button-secondary-default': '#34363C',
    'button-secondary-hover': '#46494E',
    'button-secondary-pressed': '#5D636A',
    'button-tertiary-hover': '#C0C6CF1F',
    'button-tertiary-pressed': '#71A1F41F',
    'button-bg-overlay': '#EAEDF299',

    // Chip - Loading (1)
    'chip-loading-default': '#26282C',

    // Chip - Attribute / blue (5 + border)
    'chip-attribute-default': '#082559',
    'chip-attribute-hover': '#163772',
    'chip-attribute-pressed': '#2359B6',
    'chip-attribute-icon': '#71A1F4',
    'chip-attribute-active-border': '#163772',

    // Chip - Measure / green (5)
    'chip-measure-default': '#003B26',
    'chip-measure-hover': '#025B3C',
    'chip-measure-pressed': '#049160',
    'chip-measure-icon': '#56D3A8',
    'chip-measure-active-border': '#025B3C',

    // Chip - Filter / gray (5)
    'chip-filter-default': '#34363C',
    'chip-filter-hover': '#46494E',
    'chip-filter-pressed': '#5D636A',
    'chip-filter-icon': '#9A9EA2',
    'chip-filter-active-border': '#46494E',

    // Chip - Date / purple (5)
    'chip-date-default': '#210F4F',
    'chip-date-hover': '#422E75',
    'chip-date-pressed': '#6A4ABA',
    'chip-date-icon': '#B094F8',
    'chip-date-active-border': '#422E75',

    // Chip - Input / gray with selection (6)
    'chip-input-default': '#1F2024',
    'chip-input-hover': '#2D2F34',
    'chip-input-pressed': '#34363C',
    'chip-input-selected-default': '#AFB2B6',
    'chip-input-selected-hover': '#C7C9CC',
    'chip-input-selected-pressed': '#DFE0E2',

    // Chip - Error / red (3)
    'chip-error-default': '#3D090E',
    'chip-error-hover': '#721F27',
    'chip-error-active-border': '#B6313E',

    // Progress / circular, purple (3)
    'progress-track-active': '#210F4F',
    'progress-track-empty': '#1D232F',
    'progress-indicator-default': '#B094F8',

    // Charts (13)
    'chart-surface': '#1F2024',
    'chart-border': 'transparent',
    'chart-gridline': '#34363C',
    'chart-axis-line': '#5D636A',
    'chart-axis-label': '#AFB2B6',
    'chart-label': '#DFE0E2',
    'chart-tooltip-surface': '#DFE0E2',
    'chart-tooltip-text': '#1F2024',
    'chart-tooltip-shadow': '0 0 6px rgba(0,0,0,0.16), 0 12px 28px rgba(0,0,0,0.32)',
    'chart-control-surface': '#34363C',
    'chart-table-striped-row': '#34363C',
    'chart-data-label-halo': '#1F2024',
    'chart-scrollbar-track': '#18191B',

    // Toggle (5)
    'toggle-track-off': '#5D636A',
    'toggle-track-on': '#163772',
    'toggle-thumb-off': '#C7C9CC',
    'toggle-thumb-on': '#CEDCF5',
    'toggle-thumb-outline-off': '#C7C9CC',

    // Segmented control (1)
    'segmented-control-content-active': '#DFE0E2',
  },
} as const;

/**
 * Older names kept as aliases of the product's (Scaligent) names.
 * Aliases resolve to the same value in each mode.
 */
export const componentNameAliases = {
  'button-overlay': 'button-bg-overlay',
} as const satisfies Record<string, keyof typeof baseComponentColors.light>;

type WithAliases<M> = M & { readonly [K in keyof typeof componentNameAliases]: string };

function withAliases<M extends Record<keyof typeof baseComponentColors.light, string>>(mode: M): WithAliases<M> {
  const aliases = Object.fromEntries(
    Object.entries(componentNameAliases).map(([alias, source]) => [alias, mode[source]]),
  );
  return { ...mode, ...aliases } as WithAliases<M>;
}

export const rdComponentColors = {
  light: withAliases(baseComponentColors.light),
  dark: withAliases(baseComponentColors.dark),
} as const;

export type RdComponentColors = typeof rdComponentColors;
export type RdComponentColorKey = keyof typeof rdComponentColors.light;

/**
 * CSS variable for a component token, for inline styles in TSX:
 * compVar('chip-filter-default') → 'var(--rd-comp-color-chip-filter-default)'.
 * Follows the theme. Use it instead of rdComponentColors.light[...], which is always light.
 */
export const compVar = (key: RdComponentColorKey): string => `var(--rd-comp-color-${key})`;
