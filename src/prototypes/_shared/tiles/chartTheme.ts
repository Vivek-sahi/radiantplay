/**
 * Chart theme: series colours and chart UI colours for the current theme.
 *
 * ECharts draws to a canvas, so CSS variables don't reach it. Charts read
 * literal colours from useChartTheme() instead, and re-render when the theme
 * changes. UI colours come from the chart component tokens (--rd-comp-color-chart-*).
 * Dark series colours come from the product's palette remap, ported below.
 */

import { useMemo } from 'react';
import { useIsDarkMode } from '@/context/ThemeContext';
import { rdComponentColors } from '@tokens/colors';
import { chartColors } from './chartPalette';

// ---------------------------------------------------------------------------
// Dark palette remap, ported from the product
// (radiant-react/src/color/oklch-palette.ts and dark-mode-color-utils.ts).
// Keep the numbers as they are so our charts match the product's.
// ---------------------------------------------------------------------------

const srgbToLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c: number): number => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToOklch(hex: string): [number, number, number] {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`hexToOklch: expected "#RRGGBB", got "${hex}"`);
  const r = srgbToLinear(parseInt(hex.slice(1, 3), 16) / 255);
  const g = srgbToLinear(parseInt(hex.slice(3, 5), 16) / 255);
  const b = srgbToLinear(parseInt(hex.slice(5, 7), 16) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.sqrt(A * A + B * B), Math.atan2(B, A)];
}

function oklchToHex(L: number, C: number, H: number): string {
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return '#' + rgb.map((c) => Math.round(Math.min(1, Math.max(0, linearToSrgb(c))) * 255).toString(16).padStart(2, '0')).join('');
}

/** Lightness band for a series colour on a dark surface. */
function darkModeLightness(L: number): number {
  if (L < 0.3) return 0.78;
  if (L < 0.65) return 0.8;
  return 0.82;
}

/**
 * Lifts each colour into a lightness band that reads on a dark surface,
 * keeping hue and chroma so series stay distinct. Accepts "#RRGGBB" and
 * rgb()/rgba(); anything else passes through unchanged.
 */
export const generateDarkModePalette = (lightColors: string[]): string[] =>
  lightColors.map((color) => {
    try {
      if (color.startsWith('#')) {
        const [L, C, H] = hexToOklch(color);
        return oklchToHex(darkModeLightness(L), C, H);
      }
      const parts = color.match(/^rgba?\(([^)]+)\)$/)?.[1].split(',') ?? [];
      if (parts.length === 3 || parts.length === 4) {
        const hex = '#' + parts.slice(0, 3).map((p) => parseInt(p, 10).toString(16).padStart(2, '0')).join('');
        const [L, C, H] = hexToOklch(hex);
        const dark = oklchToHex(darkModeLightness(L), C, H);
        const alpha = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
        return `rgba(${parseInt(dark.slice(1, 3), 16)}, ${parseInt(dark.slice(3, 5), 16)}, ${parseInt(dark.slice(5, 7), 16)}, ${alpha})`;
      }
      return color;
    } catch {
      return color;
    }
  });

/** The series palette for dark mode, derived once from chartColors. */
export const chartColorsDark: string[] = generateDarkModePalette(chartColors);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface ChartTheme {
  isDark: boolean;
  /** Series colours, in order. Assign with colors[i % colors.length] */
  colors: string[];
  /** Map any light series colour to its dark-mode equivalent (identity in light) */
  seriesColor: (lightColor: string) => string;
  ui: {
    surface: string;
    gridLine: string;
    axis: string;
    labelColor: string;
    valueColor: string;
    tooltipSurface: string;
    tooltipText: string;
    controlSurface: string;
    stripedRow: string;
    dataLabelHalo: string;
    scrollbarTrack: string;
  };
}

/**
 * Colours for an ECharts option in the current theme. Use it in place of
 * chartColors and chartUi, and set `backgroundColor: 'transparent'` on the
 * option so the tile surface shows through.
 */
export function useChartTheme(): ChartTheme {
  const isDark = useIsDarkMode();
  return useMemo(() => {
    const t = rdComponentColors[isDark ? 'dark' : 'light'];
    return {
      isDark,
      colors: isDark ? chartColorsDark : chartColors,
      seriesColor: (lightColor: string) => (isDark ? generateDarkModePalette([lightColor])[0] : lightColor),
      ui: {
        surface: t['chart-surface'],
        gridLine: t['chart-gridline'],
        axis: t['chart-axis-line'],
        labelColor: t['chart-axis-label'],
        valueColor: t['chart-label'],
        tooltipSurface: t['chart-tooltip-surface'],
        tooltipText: t['chart-tooltip-text'],
        controlSurface: t['chart-control-surface'],
        stripedRow: t['chart-table-striped-row'],
        dataLabelHalo: t['chart-data-label-halo'],
        scrollbarTrack: t['chart-scrollbar-track'],
      },
    };
  }, [isDark]);
}
