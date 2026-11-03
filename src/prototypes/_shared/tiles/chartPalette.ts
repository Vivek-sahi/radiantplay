/**
 * Chart Color Palette
 *
 * Source: ThoughtSpot Charts Design Enhancements — Final Palette
 * Rearranged for better chart output (blue → amber → cyan → salmon → purple → red → grey → green)
 *
 * Usage: assign colors sequentially from chartColors[] for each data series.
 * These are the light series colours. In a component, useChartTheme().colors
 * gives the right set for the current theme.
 */

export const chartPalette = {
  blue:   '#004B9B',
  amber:  '#FFA600',
  cyan:   '#369FAA',
  salmon: '#EB7D57',
  purple: '#7D51F0',
  red:    '#D3341D',
  grey:   '#555555',
  green:  '#006A13',
} as const;

/** Ordered array for sequential series assignment */
export const chartColors: string[] = [
  chartPalette.blue,
  chartPalette.amber,
  chartPalette.cyan,
  chartPalette.salmon,
  chartPalette.purple,
  chartPalette.red,
  chartPalette.grey,
  chartPalette.green,
];

/**
 * Chart UI colors, light mode only. These never change with the theme.
 * New charts should call useChartTheme() from './chartTheme' instead, which
 * returns series and UI colours for the current theme. Kept for importers
 * that are light-only (NewUIAdmin2).
 *
 * content-primary:   #1D232F  (axis values, data labels)
 * content-secondary: #777E8B  (axis labels, tick text, legends)
 * border-divider:    #EAEDF2  (axis lines, grid lines)
 * background-sunken: #F6F8FA  (chart background, alternating rows)
 */
export const chartUi = {
  axis:        '#EAEDF2', // --rd-sys-color-border-divider
  gridLine:    '#F6F8FA', // --rd-sys-color-background-sunken
  labelColor:  '#777E8B', // --rd-sys-color-content-secondary
  valueColor:  '#1D232F', // --rd-sys-color-content-primary
} as const;

/**
 * Radiant chart font — use for all SVG text elements.
 * Matches fontFamily.primary from @tokens/typography.
 */
export const chartFont = 'var(--font-family-primary)';

/**
 * Chart font sizes — from Radiant fontSize tokens (xs = 12, sm = 14).
 * Use chartFontSize.label for axis/tick text, .value for data labels.
 */
export const chartFontSize = {
  tick:   10, // axis tick labels
  label:  11, // legend, category labels
  value:  11, // data value annotations
  kpi:    32, // KPI primary number
  kpiSub: 10, // KPI secondary text
} as const;
