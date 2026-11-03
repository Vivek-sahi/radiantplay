import { DARK, LIGHT, PALETTES } from './theme.gen';
import type { Mode } from './types';

export type PaletteName = keyof typeof PALETTES;

// Pill accents and popover surfaces (foundations §6 and §8); Radiant reference values.
const EXTRA = {
  light: {
    'pill-neutral-bg': '#eaedf2', 'pill-neutral-dot': '#777e8b', 'pill-green-bg': '#e0f8ef', 'pill-green-dot': '#06bf7f',
    'pill-amber-bg': '#fff8e5', 'pill-amber-dot': '#fcc838', 'pill-blue-bg': '#dee8fa', 'pill-blue-dot': '#2770ef',
    'pill-purple-bg': '#f0ebff', 'pill-purple-dot': '#8c62f5',
    'pop-bg': '#ffffff', 'pop-line': '#eaedf2', 'pop-shadow': '0 0 4px rgba(25,35,49,.08), 0 12px 24px rgba(25,35,49,.12)',
    'hint-bg': '#1d232f', 'hint-text': '#ffffff', 'eb-on-primary': '#ffffff',
    'h-bg': '#ffffff', 'h-page': '#f6f8fa', 'h-line': '#eaedf2', 'h-text': '#1d232f', 'h-muted': '#4a515e', 'h-icon': '#777e8b',
    'h-chip': '#eaedf2', 'h-primary': '#2770ef', 'h-ptext': '#ffffff', 'h-tok': '#e9f1fd',
  },
  dark: {
    'pill-neutral-bg': '#34363c', 'pill-neutral-dot': '#9c9ea5', 'pill-green-bg': '#003b26', 'pill-green-dot': '#56d3a8',
    'pill-amber-bg': '#4f3d09', 'pill-amber-dot': '#fcd977', 'pill-blue-bg': '#082559', 'pill-blue-dot': '#71a1f4',
    'pill-purple-bg': '#422e75', 'pill-purple-dot': '#b094f8',
    'pop-bg': '#2f3137', 'pop-line': '#34363c', 'pop-shadow': '0 0 6px rgba(0,0,0,.16), 0 14px 28px rgba(0,0,0,.32)',
    'hint-bg': '#dfe0e2', 'hint-text': '#1f2024', 'eb-on-primary': '#1d232f',
    'h-bg': '#1f2024', 'h-page': '#18191b', 'h-line': '#34363c', 'h-text': '#dfe0e2', 'h-muted': '#afb2b6', 'h-icon': '#9c9ea5',
    'h-chip': '#34363c', 'h-primary': '#71a1f4', 'h-ptext': '#1d232f', 'h-tok': '#2c3545',
  },
};

/** Every colour the grid uses, as CSS variables: Radiant defaults < palette < customer variables (HLD §5.6). */
export function themeVars(mode: Mode, palette: PaletteName, customer: Record<string, string> = {}) {
  const base: Record<string, string> = { ...(mode === 'dark' ? DARK : LIGHT) };
  if (palette !== 'default') {
    const p = PALETTES[palette][mode];
    Object.assign(base, {
      'header-background': p.header, 'column-letter-background': p.header, 'row-number-background': p.header,
      'status-bar-background': p.header, 'stripe-background': p.stripe,
    });
  }
  Object.assign(base, customer);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(base)) out[`--kg-${k}`] = v;
  for (const [k, v] of Object.entries(EXTRA[mode])) out[`--${k}`] = v;
  return out;
}

/** A sample TSE customer theme: what `--ts-var-spreadsheet-*` variables would set. */
export const CUSTOMER_THEME: Record<string, string> = {
  'selection-color': '#0f766e', 'selection-background': '#e6f4f2', 'badge-active-color': '#0f766e', 'loader-color': '#0f766e',
  'header-selected-background': '#d9efec', 'header-selected-color': '#0b5550', 'header-background': '#f4f7f6',
  'column-letter-background': '#f4f7f6', 'row-number-background': '#f4f7f6',
};
