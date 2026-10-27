/**
 * UI styles (Vivek, 26 Oct): a theme generator inside the prototype, like the versions. A style
 * overrides Radiant's own CSS variables (colours, fonts, radii, spacing, type sizes) while v5 is
 * open, so every Radiant component restyles, menus and dialogs included. "Radiant" = no overrides.
 * The presets come from ~/agentdb-data-store/theme-lab.html; "Precision instrument" is the chosen
 * art direction. Components that paint colours from JS tokens (AppSidebar, Tabs' active colour)
 * don't follow; noted for the token layer.
 */

export interface UiStyle {
  id: string;
  name: string;
  /** Concept, for the panel. */
  idea?: string;
  dark: boolean;
  c: { frame: string; surface: string; ink: string; accent: string; signal: string; good: string };
  /** Interface and code fonts (Google Fonts). */
  fu: string;
  fm: string;
  /** Corner radius of a control, px. */
  radius: number;
  /** Spacing base, px (Radiant is 4). */
  spacing: number;
  density: 'compact' | 'regular' | 'comfortable';
  border: 'none' | 'hair' | 'solid';
}

export const RADIANT_ID = 'radiant';

export const UI_STYLES: UiStyle[] = [
  { id: RADIANT_ID, name: 'Radiant', idea: 'The design system as it ships today', dark: false,
    c: { frame: '#f6f8fa', surface: '#ffffff', ink: '#1d232f', accent: '#2770ef', signal: '#8c62f5', good: '#06bf7f' },
    fu: 'Plain', fm: 'SF Mono', radius: 6, spacing: 4, density: 'comfortable', border: 'solid' },
  { id: 'instrument', name: 'Precision instrument', idea: 'A precise machine with a live intelligence inside', dark: false,
    c: { frame: '#fafafa', surface: '#ffffff', ink: '#18181b', accent: '#18181b', signal: '#6e56f7', good: '#16a34a' },
    fu: 'Inter', fm: 'Geist Mono', radius: 6, spacing: 4, density: 'regular', border: 'hair' },
  { id: 'instrument-dark', name: 'Precision instrument, dark', idea: 'The same instrument at night', dark: true,
    c: { frame: '#0c0c0e', surface: '#141416', ink: '#ececef', accent: '#ececef', signal: '#8b7bff', good: '#4ade80' },
    fu: 'Inter', fm: 'Geist Mono', radius: 6, spacing: 4, density: 'regular', border: 'hair' },
  { id: 'cyberpunk', name: 'Cyberpunk', idea: "A hacker's rig in a rain-soaked megacity", dark: true,
    c: { frame: '#07070d', surface: '#0e0e18', ink: '#e8e6ff', accent: '#ff2bd6', signal: '#00e5ff', good: '#39ff88' },
    fu: 'Rajdhani', fm: 'JetBrains Mono', radius: 0, spacing: 4, density: 'compact', border: 'solid' },
  { id: 'deco', name: 'Art deco', idea: 'The control room of a 1920s ocean liner', dark: true,
    c: { frame: '#0d1321', surface: '#141c2e', ink: '#f3e9d2', accent: '#d4af37', signal: '#e9c46a', good: '#8ab17d' },
    fu: 'Josefin Sans', fm: 'IBM Plex Mono', radius: 0, spacing: 5, density: 'regular', border: 'solid' },
  { id: 'nouveau', name: 'Art nouveau', idea: 'A botanical library where data grows', dark: false,
    c: { frame: '#f3ece0', surface: '#fbf7ef', ink: '#2f2a24', accent: '#7a8b5a', signal: '#b5651d', good: '#5f7f3f' },
    fu: 'Source Serif 4', fm: 'IBM Plex Mono', radius: 14, spacing: 5, density: 'comfortable', border: 'hair' },
  { id: 'solarpunk', name: 'Nature punk', idea: 'A greenhouse lab powered by sunlight', dark: false,
    c: { frame: '#eef3ea', surface: '#fbfdf8', ink: '#1d2b1f', accent: '#2f7d4f', signal: '#e3a21a', good: '#2f7d4f' },
    fu: 'DM Sans', fm: 'JetBrains Mono', radius: 16, spacing: 5, density: 'comfortable', border: 'hair' },
  { id: 'swiss', name: 'Swiss / Bauhaus', idea: 'A railway timetable for your data', dark: false,
    c: { frame: '#f2f2ee', surface: '#ffffff', ink: '#111111', accent: '#e2231a', signal: '#1a4fe2', good: '#111111' },
    fu: 'Inter Tight', fm: 'Space Mono', radius: 0, spacing: 4, density: 'regular', border: 'solid' },
  { id: 'terminal', name: 'Terminal brutalist', idea: 'A 1980s mainframe that never went away', dark: true,
    c: { frame: '#050805', surface: '#0a0f0a', ink: '#b7f7b0', accent: '#39ff14', signal: '#ffb000', good: '#39ff14' },
    fu: 'IBM Plex Mono', fm: 'IBM Plex Mono', radius: 0, spacing: 3, density: 'compact', border: 'solid' },
  { id: 'paper', name: 'Calm paper', idea: "A thoughtful colleague's notebook", dark: false,
    c: { frame: '#f5f1ea', surface: '#fdfbf7', ink: '#29261f', accent: '#c96442', signal: '#c96442', good: '#4c7a4a' },
    fu: 'Inter', fm: 'IBM Plex Mono', radius: 10, spacing: 5, density: 'comfortable', border: 'hair' },
];

export const FONTS_UI = ['Plain', 'Inter', 'Inter Tight', 'Geist', 'IBM Plex Sans', 'Space Grotesk', 'DM Sans', 'Rajdhani', 'Josefin Sans', 'Source Serif 4', 'IBM Plex Mono'];
export const FONTS_MONO = ['SF Mono', 'Geist Mono', 'JetBrains Mono', 'IBM Plex Mono', 'Space Mono'];
/** Fonts the browser already has; everything else loads from Google Fonts. */
const LOCAL_FONTS = ['Plain', 'SF Mono'];

const hex = (h: string) => [0, 2, 4].map((i) => parseInt(h.replace('#', '').substr(i, 2), 16));
const rgba = (h: string, a: number) => `rgb(${hex(h).join(' ')} / ${a})`;
const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

const SIZES = {
  compact: { xs: 11, sm: 12, md: 14, lh: { xs: 15, sm: 16, md: 20 } },
  regular: { xs: 12, sm: 13, md: 15, lh: { xs: 16, sm: 18, md: 22 } },
  comfortable: { xs: 12, sm: 14, md: 16, lh: { xs: 16, sm: 20, md: 24 } },
};
const SPACING_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24];

/** The Radiant variables a style sets. Six colours generate the rest. */
export const styleVars = (s: UiStyle): Record<string, string> => {
  const { c } = s;
  const line = s.border === 'none' ? 'transparent' : s.border === 'solid' ? mix(c.ink, c.surface, s.dark ? 0.72 : 0.78) : rgba(c.ink, s.dark ? 0.16 : 0.12);
  const divider = s.border === 'none' ? 'transparent' : rgba(c.ink, s.dark ? 0.1 : 0.07);
  const z = SIZES[s.density];
  const vars: Record<string, string> = {
    '--rd-sys-color-background-base': c.surface,
    '--rd-sys-color-background-raised': c.surface,
    '--rd-sys-color-background-surface': c.surface,
    '--rd-sys-color-background-sunken': c.frame,
    '--rd-sys-color-background-subtle': mix(c.surface, c.ink, s.dark ? 0.1 : 0.06),
    '--rd-sys-color-background-ghost-hover': rgba(c.ink, 0.05),
    '--rd-sys-color-background-ghost-highlight': rgba(c.accent, 0.12),
    '--rd-sys-color-background-active': rgba(c.ink, 0.08),
    '--rd-sys-color-background-brand': c.accent,
    '--rd-sys-color-content-primary': c.ink,
    '--rd-sys-color-content-secondary': mix(c.ink, c.surface, 0.42),
    '--rd-sys-color-content-tertiary': mix(c.ink, c.surface, 0.62),
    '--rd-sys-color-content-brand': c.accent,
    '--rd-sys-color-content-link': c.accent,
    '--rd-sys-color-content-success': c.good,
    '--rd-sys-color-content-primary-inverse': c.surface,
    '--rd-sys-color-border-default': line,
    '--rd-sys-color-border-divider': divider,
    '--rd-sys-color-border-hover': rgba(c.ink, 0.3),
    '--rd-sys-color-border-subtle-hover': rgba(c.ink, 0.2),
    '--rd-sys-color-border-brand': c.accent,
    '--rd-sys-color-border-focus': c.accent,
    '--font-family-primary': `"${s.fu}", -apple-system, BlinkMacSystemFont, sans-serif`,
    '--font-family-mono': `"${s.fm}", ui-monospace, Menlo, monospace`,
    '--font-size-xs': `${z.xs}px`,
    '--font-size-sm': `${z.sm}px`,
    '--font-size-md': `${z.md}px`,
    '--line-height-xs': `${z.lh.xs}px`,
    '--line-height-sm': `${z.lh.sm}px`,
    '--line-height-md': `${z.lh.md}px`,
    '--radius-xs': `${Math.round(s.radius * 0.33)}px`,
    '--radius-sm': `${Math.round(s.radius * 0.66)}px`,
    '--radius-md': `${s.radius}px`,
    '--radius-lg': `${Math.round(s.radius * 1.33)}px`,
    '--radius-xl': `${s.radius * 2}px`,
    // AgentDB's own: the colour of things that are alive (the agent working).
    '--v6-signal': c.signal,
  };
  for (const n of SPACING_STEPS) vars[`--spacing-${n}`] = `${n * s.spacing}px`;
  return vars;
};

/** Apply to the page root, so portals (menus, dialogs) follow too. Returns an undo. */
export const applyStyle = (s: UiStyle): (() => void) => {
  const root = document.documentElement;
  if (s.id === RADIANT_ID) return () => undefined;
  const vars = styleVars(s);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.style.colorScheme = s.dark ? 'dark' : 'light';
  const fonts = [s.fu, s.fm].filter((f) => !LOCAL_FONTS.includes(f));
  const id = 'v5-ui-style-fonts';
  document.getElementById(id)?.remove();
  if (fonts.length) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${fonts.map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600`).join('&')}&display=swap`;
    document.head.appendChild(link);
  }
  return () => {
    for (const k of Object.keys(vars)) root.style.removeProperty(k);
    root.style.colorScheme = '';
  };
};

const KEY = 'agentdb-v5-ui-style';
export const loadStyle = (): UiStyle => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as UiStyle | null;
    if (saved?.c) return saved;
  } catch {
    /* no saved style */
  }
  // Precision instrument is v5's default style (Vivek, 27 Oct); Radiant stays one pick away.
  return UI_STYLES.find((u) => u.id === 'instrument') ?? UI_STYLES[0];
};
export const saveStyle = (s: UiStyle) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
};
