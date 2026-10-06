/**
 * Component Color Tokens
 *
 * Per-component tokens for button, chip, toggle and segmented control.
 * Mode-aware with separate light and dark maps.
 *
 * SCSS map names: $rd-comp-color-map, $rd-comp-color-map-dark
 */

export const rdComponentColors = {
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
    'button-overlay': '#20293A99',

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
    'button-primary-default': '#2770EF',
    'button-primary-hover': '#71A1F4',
    'button-primary-pressed': '#ABC7F9',
    'button-primary-on-color-default': '#1D232F',
    'button-primary-on-color-hover': 'rgba(39, 112, 239, 0.3)',
    'button-primary-on-color-pressed': 'rgba(39, 112, 239, 0.4)',
    'button-secondary-default': '#4A515E',
    'button-secondary-hover': '#323946',
    'button-secondary-pressed': 'rgba(39, 112, 239, 0.3)',
    'button-tertiary-hover': 'rgba(119, 126, 139, 0.24)',
    'button-tertiary-pressed': 'rgba(119, 126, 139, 0.36)',
    'button-overlay': '#EAEDF299',

    // Chip - Loading (1)
    'chip-loading-default': '#323946',

    // Chip - Attribute / blue (5 + border)
    'chip-attribute-default': 'rgba(39, 112, 239, 0.2)',
    'chip-attribute-hover': 'rgba(39, 112, 239, 0.3)',
    'chip-attribute-pressed': 'rgba(39, 112, 239, 0.4)',
    'chip-attribute-icon': '#71A1F4',
    'chip-attribute-active-border': '#71A1F4',

    // Chip - Measure / green (5)
    'chip-measure-default': 'rgba(6, 191, 127, 0.2)',
    'chip-measure-hover': 'rgba(6, 191, 127, 0.3)',
    'chip-measure-pressed': 'rgba(6, 191, 127, 0.4)',
    'chip-measure-icon': '#56D3A8',
    'chip-measure-active-border': '#56D3A8',

    // Chip - Filter / gray (5)
    'chip-filter-default': '#4A515E',
    'chip-filter-hover': '#323946',
    'chip-filter-pressed': '#777E8B',
    'chip-filter-icon': '#A5ACB9',
    'chip-filter-active-border': '#777E8B',

    // Chip - Date / purple (5)
    'chip-date-default': 'rgba(140, 98, 245, 0.2)',
    'chip-date-hover': 'rgba(140, 98, 245, 0.3)',
    'chip-date-pressed': 'rgba(140, 98, 245, 0.4)',
    'chip-date-icon': '#B094F8',
    'chip-date-active-border': '#B094F8',

    // Chip - Input / gray with selection (6)
    'chip-input-default': '#323946',
    'chip-input-hover': '#4A515E',
    'chip-input-pressed': '#777E8B',
    'chip-input-selected-default': '#A5ACB9',
    'chip-input-selected-hover': '#C0C6CF',
    'chip-input-selected-pressed': '#DBDFE7',

    // Chip - Error / red (3)
    'chip-error-default': 'rgba(226, 43, 61, 0.2)',
    'chip-error-hover': 'rgba(226, 43, 61, 0.3)',
    'chip-error-active-border': '#777E8B',

    // Toggle (5)
    'toggle-track-off': '#777E8B',
    'toggle-track-on': '#2770EF',
    'toggle-thumb-off': '#A5ACB9',
    'toggle-thumb-on': '#FFFFFF',
    'toggle-thumb-outline-off': '#4A515E',

    // Segmented control (1)
    'segmented-control-content-active': '#DFE0E2',
  },
} as const;

export type RdComponentColors = typeof rdComponentColors;
export type RdComponentColorKey = keyof typeof rdComponentColors.light;
