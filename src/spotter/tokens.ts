/**
 * Spotter-local tokens.
 *
 * Only define tokens here when no Radiant equivalent covers the need.
 * Prefer importing from `@tokens/colors` directly when possible.
 */

import { sysVar } from '../tokens/colors';

/**
 * Soft radial glow behind the welcome prompt. Derived from the brand color at
 * low alpha through color-mix, so it follows the theme. Radiant's system
 * tokens are opaque, so this lives in Spotter.
 */
export const spotterGlow = {
  from: `color-mix(in srgb, ${sysVar('content-brand')} 8%, transparent)`,
  to: `color-mix(in srgb, ${sysVar('content-brand')} 0%, transparent)`,
} as const;

/**
 * Chart-token backgrounds for answer card tokens (column / keyword / filter).
 * Aliases over Radiant system tokens — Spotter components reference these
 * names instead of reaching into the system palette directly.
 */
export const spotterChartBg = {
  measure: sysVar('background-success'),
  keyword: sysVar('background-information'),
  filter: sysVar('background-subtle'),
} as const;

export type SpotterChartTokenKind = keyof typeof spotterChartBg;

/**
 * Layout constants shared across Spotter chat surfaces. These are
 * exposed as plain numbers so consumers can use them in inline styles,
 * CSS modules (via `--spotter-chat-max-width` / `--spotter-text-max-width`),
 * or computations.
 */
export const spotterLayout = {
  /**
   * Max width of the right-pane content container — wraps the chat
   * thread and the sticky prompt. Matches the 2026-05-19 IA spec.
   */
  chatMaxWidth: 936,

  /**
   * Max width of the text content inside the container. Narrower than
   * the container so paragraphs stay readable while charts / tables can
   * fill the full 936px when needed.
   */
  textMaxWidth: 844,
} as const;

