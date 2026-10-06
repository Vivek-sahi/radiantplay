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
    'button-overlay': '#EAEDF299',

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

export type RdComponentColors = typeof rdComponentColors;
export type RdComponentColorKey = keyof typeof rdComponentColors.light;
