/**
 * Reference (Primitive) Color Tokens
 *
 * Mode-agnostic base values forming the foundation of the color system.
 * Generated from Material Color Utilities tonal palettes via the Dynamic Theme Generator.
 *
 * Scale: 00 (lightest/white) to 100 (darkest/black)
 * Each color family has 12 stops matching the design system scale.
 *
 * SCSS map name: $rd-ref-color-map
 */

export const referenceColors = {
  gray: {
    '00': '#FFFFFF',
    '10': '#F6F8FA',
    '20': '#EAEDF2',
    '30': '#DBDFE7',
    '40': '#C0C6CF',
    '50': '#A5ACB9',
    '60': '#777E8B',
    '70': '#4A515E',
    '80': '#323946',
    '85': '#272D38',
    '90': '#1D232F',
    '100': '#000000',
  },

  brand: {
    '00': '#FFFFFF',
    '10': '#EBF2FD',
    '20': '#DEE8FA',
    '30': '#CEDCF5',
    '40': '#ABC7F9',
    '50': '#71A1F4',
    '60': '#2770EF',
    '70': '#2359B6',
    '80': '#163772',
    '85': '#0C2B59',
    '90': '#082559',
    '100': '#001740',
  },

  red: {
    '00': '#FFFFFF',
    '10': '#FFF0F0',
    '20': '#FFEBEC',
    '30': '#FCD4D7',
    '40': '#F9B3B9',
    '50': '#F47E89',
    '60': '#E22B3D',
    '70': '#B6313E',
    '80': '#721F27',
    '85': '#55171D',
    '90': '#3D090E',
    '100': '#1F0003',
  },

  purple: {
    '00': '#FFFFFF',
    '10': '#F7F5FF',
    '20': '#F0EBFF',
    '30': '#E3D9FC',
    '40': '#D1C0FB',
    '50': '#B094F8',
    '60': '#8C62F5',
    '70': '#6A4ABA',
    '80': '#422E75',
    '85': '#331F62',
    '90': '#210F4F',
    '100': '#0E0033',
  },

  blue: {
    '00': '#FFFFFF',
    '10': '#F2F7FF',
    '20': '#DEE8FA',
    '30': '#CEDCF5',
    '40': '#ABC7F9',
    '50': '#71A1F4',
    '60': '#2770EF',
    '70': '#2359B6',
    '80': '#163772',
    '85': '#0C2B59',
    '90': '#082559',
    '100': '#001740',
  },

  teal: {
    '00': '#FFFFFF',
    '10': '#EDFDFF',
    '20': '#E1F7FA',
    '30': '#C9F0F5',
    '40': '#B5ECF2',
    '50': '#82DFE9',
    '60': '#48D1E0',
    '70': '#369FAA',
    '80': '#22636B',
    '85': '#175157',
    '90': '#0C3F45',
    '100': '#002D33',
  },

  yellow: {
    '00': '#FFFFFF',
    '10': '#FFFBF0',
    '20': '#FFF8E5',
    '30': '#FCF1D1',
    '40': '#FDE9AF',
    '50': '#FCD977',
    '60': '#FCC838',
    '70': '#BF982A',
    '80': '#785F1A',
    '85': '#634E12',
    '90': '#4F3D09',
    '100': '#2E2200',
  },

  green: {
    '00': '#FFFFFF',
    '10': '#EDFFF9',
    '20': '#E0F8EF',
    '30': '#C7F2E3',
    '40': '#9BE5CB',
    '50': '#56D3A8',
    '60': '#06BF7F',
    '70': '#049160',
    '80': '#025B3C',
    '85': '#014B31',
    '90': '#003B26',
    '100': '#001F14',
  },

  orange: {
    '00': '#FFFFFF',
    '10': '#FFF5F0',
    '20': '#FFEEE5',
    '30': '#FFDDCC',
    '40': '#FFCCB3',
    '50': '#FFA97E',
    '60': '#FF8142',
    '70': '#C26232',
    '80': '#7A3D1F',
    '85': '#602E16',
    '90': '#471F0B',
    '100': '#331100',
  },

  /**
   * Dark Gray — neutral (non-blue-tinted) scale used by dark mode surfaces.
   * Foundation for Phase 6 dark mode remap; not yet referenced in light mode.
   */
  darkGray: {
    '00': '#131416',
    '05': '#1A1B1E',
    '10': '#212326',
    '15': '#282A2E',
    '20': '#303136',
    '30': '#43474B',
    '40': '#585E64',
    '50': '#73767D',
    '60': '#8C9196',
    '70': '#AAADB1',
    '80': '#C4C6CA',
    '90': '#DFE0E2',
  },

  /**
   * Alpha variants — translucent values used for overlays, ghost states,
   * and translucent highlights. Referenced by system tokens.
   */
  alpha: {
    'gray-70a': '#1F2632CC',      // 80%
    'gray-60a': '#20293A99',      // 60%
    'gray-40a': '#16223A42',      // 26%
    'gray-10a': '#C0C6CF1F',      // 12%
    'blue-10a': '#71A1F41F',      // 12%
    'dark-gray-30a': '#00030ABA', // 73%
  },

  black: '#000000',
  white: '#FFFFFF',
} as const;

export type ReferenceColors = typeof referenceColors;
