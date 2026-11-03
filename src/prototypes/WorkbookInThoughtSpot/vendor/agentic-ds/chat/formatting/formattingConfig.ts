// Response-formatting playground — presets, control schema, and CSS-var mapping.
//
// Ported from the standalone `markdown-rendering-simulator.html` + `markdown-rendering-spec.md`
// (AgentSpot markdown rendering study). Differences from the original:
//
//  1. Colours resolve to RADIANT tokens rather than AgentSpot's raw hex palette, so the
//     playground stays token-based and themes with the rest of the app.
//  2. The table section switches between the four variants built on the "Table markdown"
//     page (lines / cells / grid / zebra) instead of the original's flat-vs-card flags.
//  3. Blockquote controls are dropped — blockquotes render plain.

export type ControlType = 'number' | 'switch' | 'segment' | 'token' | 'choice';

export interface ControlItem {
  key: string;
  label: string;
  type?: ControlType;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: [string, string][];
  choices?: [string, string][];
  /** Only enabled while state[key] === value — e.g. ['tableVariant', 'grid']. */
  onlyWhen?: [string, string];
}

export interface ControlGroup {
  legend: string;
  items: ControlItem[];
}

export type FormattingState = Record<string, string | number | boolean>;

// ── Colour tokens ─────────────────────────────────────────────────────────────
// The dropdown values below are Radiant content tokens (the spec's roles mapped
// onto Radiant's palette).

export const TOKEN_VARS: Record<string, string> = {
  primary: '--rd-sys-color-content-primary',
  secondary: '--rd-sys-color-content-secondary',
  tertiary: '--rd-sys-color-content-tertiary',
  brand: '--rd-sys-color-content-brand',
  success: '--rd-sys-color-content-success',
};

export const COLOR_OPTS: [string, string][] = [
  ['primary', 'Content primary'],
  ['secondary', 'Content secondary'],
  ['tertiary', 'Content tertiary'],
  ['brand', 'Content brand'],
  ['success', 'Content success'],
];

export const BG_TOKENS: Record<string, string> = {
  onBase: 'var(--rd-sys-color-background-on-base)',
  subtle: 'var(--rd-sys-color-background-subtle)',
  sunken: 'var(--rd-sys-color-background-sunken)',
  none: 'transparent',
};

export const BG_OPTS: [string, string][] = [
  ['onBase', 'Background on base'],
  ['subtle', 'Background subtle'],
  ['sunken', 'Background sunken'],
  ['none', 'None'],
];

// Table variants built on the "Table markdown" page.
export const TABLE_VARIANT_OPTS: [string, string][] = [
  ['lines', 'Lines'],
  ['cells', 'Cells'],
  ['grid', 'Grid'],
  ['zebra', 'Zebra'],
];

export const MARKER_GLYPHS: Record<string, string> = {
  disc: '"•"',
  circle: '"◦"',
  square: '"▪"',
  dash: '"–"',
  arrow: '"›"',
  none: '""',
};

const COLOR_DEFAULTS = {
  bodyColor: 'primary',
  h1Color: 'primary',
  h2Color: 'primary',
  h3Color: 'primary',
  linkColor: 'primary',
  markerColor: 'tertiary',
  bqColor: 'primary',
  boldColor: 'primary',
  italicColor: 'primary',
  codeColor: 'primary',
  codeBlockColor: 'primary',
};

// ── Response grid ─────────────────────────────────────────────────────────────
// Fixed to our own response grid (see ResponseGridView):
//
//   │ 24 │        content column — max 800px        │ 24 │
//        │ 16 │   text column — max 768px   │ 16 │
//
// The user message and prompt bar span the full 800px column; the response text is
// inset by the 16px inner padding. These are layout constants, not tunables, so
// CONTENT_MAX has no control — it stays in state so it still appears in Export.

export const CONTENT_MAX = 800;
export const PAGE_PAD = 24;
export const INNER_PAD = 16;

// ── Table column floors ───────────────────────────────────────────────────────
// Markdown can't express column widths, so the floor is derived from the longest
// cell in each column: short numeric columns get a tight floor, prose columns a
// roomier one. Below the sum of a table's floors, the table scrolls.
export const COLUMN_FLOORS: [maxChars: number, floorPx: number][] = [
  [6, 72],
  [12, 96],
  [24, 132],
];
export const PROSE_FLOOR = 168;

export const columnFloor = (longestCell: number) =>
  COLUMN_FLOORS.find(([maxChars]) => longestCell <= maxChars)?.[1] ?? PROSE_FLOOR;

// ── Baseline ──────────────────────────────────────────────────────────────────
// The current proposal — the tuned spec this playground landed on. This is the
// landing state, and the one Reset returns to.

export const BASELINE: FormattingState & { _label: string } = {
  _label: 'Proposal',
  maxWidth: CONTENT_MAX,
  gap: 12,
  // The block gap already separates the answer from the message.
  userGap: 0,
  bodySize: 16,
  bodyLH: 1.5,
  bodyWeight: 400,
  boldSize: 16,
  boldWeight: 600,
  linkWeight: 400,
  codeWeight: 400,
  pMt: 0,
  pMb: 0,
  h1Size: 20, h1W: 600, h1Mt: 12, h1Mb: -4, h1Ls: -0.005, h1LH: 1.4,
  h2Size: 18, h2W: 600, h2Mt: 12, h2Mb: -4, h2Ls: -0.004, h2LH: 1.45,
  // h3 values drive h3 through h6 — no distinction between those levels.
  h3Size: 16, h3W: 600, h3Mt: 8, h3Mb: -4, h3Ls: -0.002, h3LH: 1.5,
  listIndent: 26, ulMt: 0, ulMb: 12, liMb: 4, liLh: 1.5,
  // A nested ul/ol sits inside its parent item, so it gets no trailing margin.
  nestedUlMb: 0,
  markerStyle: 'disc', markerGap: 16, markerSize: 20,
  codeInline: 13, codeBlock: 13, codeBlockBg: 'onBase', codeBlockWeight: 400, codeBlockLH: 1.5,
  codeBlockMt: 4, codeBlockMb: 12,
  codeBgColor: 'onBase',
  // Blockquotes render plain (no bar, fill, or italic) — not tunable.
  bqSize: 16, bqPadX: 0, bqPadY: 0, bqItalic: false, bqBorder: false, bqFill: false,
  hrMy: 12,
  // House rule: a heading after a list, table or divider gets no top margin.
  headingAfterBlockMt: 0,
  // Table style is FROZEN — grid, with vertical rules and row hover. The other
  // variants remain implemented (see MarkdownPreview.module.css) and can be brought
  // back by restoring the Table style controls to SCHEMA below; the zebra keys are
  // kept here as archived values, not read while the variant is 'grid'.
  tableVariant: 'grid', tableVerticalLines: true, rowHover: true,
  zebraVerticalLines: true, zebraHorizontalLines: true, zebraHeader: 'darker',
  // Margins stay tunable — they're response rhythm, not table styling.
  tableMt: 4, tableMb: 12,
  showMeasure: false,
  ...COLOR_DEFAULTS,
  linkColor: 'brand',
  markerColor: 'primary',
};

/**
 * The frozen table spec, as MarkdownTable's own props.
 *
 * Same decision as BASELINE's three table keys, in the shape the standalone
 * component takes — spread it rather than restating the values, so the two
 * cannot drift apart. The variants that lost (lines, cells, zebra, and the
 * zebra header shade) are archived, not removed: still implemented, still
 * reachable by passing `variant`, just no longer offered.
 */
export const FINAL_TABLE = {
  variant: BASELINE.tableVariant as 'grid',
  verticalLines: BASELINE.tableVerticalLines as boolean,
  rowHover: BASELINE.rowHover as boolean,
};

// ── Control schema ────────────────────────────────────────────────────────────

export const SCHEMA: ControlGroup[] = [
  { legend: 'Layout', items: [
    { key: 'gap', label: 'Block gap', min: 0, max: 40, step: 1, unit: 'px' },
    { key: 'userGap', label: 'User message → answer gap', min: 0, max: 64, step: 1, unit: 'px' },
    { key: 'showMeasure', type: 'switch', label: 'Measure block gaps' },
  ]},
  { legend: 'Body text', items: [
    { key: 'bodySize', label: 'Font size', min: 10, max: 22, step: 0.5, unit: 'px' },
    { key: 'bodyLH', label: 'Line height', min: 1, max: 2.2, step: 0.05, unit: '' },
    { key: 'bodyWeight', label: 'Weight', min: 300, max: 700, step: 100, unit: '' },
    { key: 'pMt', label: 'Paragraph margin-top', min: -10, max: 40, step: 1, unit: 'px' },
    { key: 'pMb', label: 'Paragraph margin-bottom', min: -10, max: 40, step: 1, unit: 'px' },
    { key: 'bodyColor', type: 'token', label: 'Body colour' },
  ]},
  { legend: 'Inline emphasis', items: [
    { key: 'boldSize', label: 'Bold size', min: 10, max: 22, step: 0.5, unit: 'px' },
    { key: 'boldWeight', label: 'Bold weight', min: 300, max: 700, step: 100, unit: '' },
    { key: 'boldColor', type: 'token', label: 'Bold colour' },
    { key: 'italicColor', type: 'token', label: 'Italic colour' },
  ]},
  { legend: 'Heading 1', items: [
    { key: 'h1Size', label: 'Size', min: 12, max: 48, step: 1, unit: 'px' },
    { key: 'h1W', label: 'Weight', min: 300, max: 700, step: 100, unit: '' },
    { key: 'h1Mt', label: 'Margin-top', min: -20, max: 60, step: 1, unit: 'px' },
    { key: 'h1Mb', label: 'Margin-bottom', min: -20, max: 40, step: 1, unit: 'px' },
    { key: 'h1LH', label: 'Line height', min: 1, max: 2, step: 0.05, unit: '' },
    { key: 'h1Ls', label: 'Letter-spacing', min: -0.05, max: 0.05, step: 0.001, unit: 'em' },
    { key: 'h1Color', type: 'token', label: 'Colour' },
  ]},
  { legend: 'Heading 2', items: [
    { key: 'h2Size', label: 'Size', min: 12, max: 40, step: 1, unit: 'px' },
    { key: 'h2W', label: 'Weight', min: 300, max: 700, step: 100, unit: '' },
    { key: 'h2Mt', label: 'Margin-top', min: -20, max: 60, step: 1, unit: 'px' },
    { key: 'h2Mb', label: 'Margin-bottom', min: -20, max: 40, step: 1, unit: 'px' },
    { key: 'h2LH', label: 'Line height', min: 1, max: 2, step: 0.05, unit: '' },
    { key: 'h2Ls', label: 'Letter-spacing', min: -0.05, max: 0.05, step: 0.001, unit: 'em' },
    { key: 'h2Color', type: 'token', label: 'Colour' },
  ]},
  { legend: 'Heading 3–6', items: [
    { key: 'h3Size', label: 'Size', min: 12, max: 32, step: 1, unit: 'px' },
    { key: 'h3W', label: 'Weight', min: 300, max: 700, step: 100, unit: '' },
    { key: 'h3Mt', label: 'Margin-top', min: -20, max: 60, step: 1, unit: 'px' },
    { key: 'h3Mb', label: 'Margin-bottom', min: -20, max: 40, step: 1, unit: 'px' },
    { key: 'h3LH', label: 'Line height', min: 1, max: 2, step: 0.05, unit: '' },
    { key: 'h3Ls', label: 'Letter-spacing', min: -0.05, max: 0.05, step: 0.001, unit: 'em' },
    { key: 'h3Color', type: 'token', label: 'Colour' },
  ]},
  { legend: 'Heading rules', items: [
    { key: 'headingAfterBlockMt', label: 'Top margin after list, table or divider', min: -20, max: 60, step: 1, unit: 'px' },
  ]},
  { legend: 'Links', items: [
    { key: 'linkColor', type: 'token', label: 'Link colour' },
    { key: 'linkWeight', label: 'Link weight', min: 300, max: 700, step: 100, unit: '' },
  ]},
  { legend: 'Lists & bullets', items: [
    { key: 'markerStyle', type: 'choice', label: 'Bullet glyph', choices: [['disc', '• Disc'], ['circle', '◦ Circle'], ['square', '▪ Square'], ['dash', '– Dash'], ['arrow', '› Arrow'], ['none', 'None']] },
    { key: 'markerColor', type: 'token', label: 'Bullet colour' },
    { key: 'markerSize', label: 'Bullet size', min: 6, max: 40, step: 1, unit: 'px' },
    { key: 'markerGap', label: 'Bullet → text gap', min: 2, max: 40, step: 1, unit: 'px' },
    { key: 'listIndent', label: 'Indent (text start)', min: 0, max: 60, step: 1, unit: 'px' },
    { key: 'ulMt', label: 'List margin-top', min: -10, max: 40, step: 1, unit: 'px' },
    { key: 'ulMb', label: 'List margin-bottom', min: -10, max: 40, step: 1, unit: 'px' },
    { key: 'nestedUlMb', label: 'Nested list margin-bottom', min: -10, max: 40, step: 1, unit: 'px' },
    { key: 'liMb', label: 'Item gap', min: 0, max: 24, step: 1, unit: 'px' },
    { key: 'liLh', label: 'Item line height', min: 1, max: 2.2, step: 0.05, unit: '' },
  ]},
  { legend: 'Divider', items: [
    { key: 'hrMy', label: 'Margin Y', min: 0, max: 64, step: 1, unit: 'px' },
  ]},
  // Table style is frozen, so only its block margins remain tunable. The archived
  // style controls are kept here, commented out, so restoring the exploration is a
  // matter of uncommenting rather than rewriting:
  //
  //   { key: 'tableVariant', type: 'choice', label: 'Style', choices: TABLE_VARIANT_OPTS },
  //   { key: 'tableVerticalLines', type: 'switch', label: 'Vertical lines', onlyWhen: ['tableVariant', 'grid'] },
  //   { key: 'rowHover', type: 'switch', label: 'Row hover', onlyWhen: ['tableVariant', 'grid'] },
  //   { key: 'zebraVerticalLines', type: 'switch', label: 'Vertical lines (zebra)', onlyWhen: ['tableVariant', 'zebra'] },
  //   { key: 'zebraHorizontalLines', type: 'switch', label: 'Horizontal lines (zebra)', onlyWhen: ['tableVariant', 'zebra'] },
  //   { key: 'zebraHeader', type: 'segment', label: 'Header', onlyWhen: ['tableVariant', 'zebra'], options: [['darker', 'Darker'], ['lighter', 'Lighter']] },
  { legend: 'Table', items: [
    { key: 'tableMt', label: 'Margin-top', min: 0, max: 64, step: 1, unit: 'px' },
    { key: 'tableMb', label: 'Margin-bottom', min: 0, max: 64, step: 1, unit: 'px' },
  ]},
  { legend: 'Code', items: [
    { key: 'codeBlock', label: 'Code block size', min: 8, max: 18, step: 0.5, unit: 'px' },
    { key: 'codeBlockLH', label: 'Code block line height', min: 1, max: 2.2, step: 0.05, unit: '' },
    { key: 'codeBlockWeight', label: 'Code block weight', min: 300, max: 700, step: 100, unit: '' },
    { key: 'codeBlockColor', type: 'token', label: 'Code block colour' },
    { key: 'codeBlockBg', type: 'choice', label: 'Code block background', choices: BG_OPTS },
    { key: 'codeBlockMt', label: 'Margin-top', min: -10, max: 64, step: 1, unit: 'px' },
    { key: 'codeBlockMb', label: 'Margin-bottom', min: -10, max: 64, step: 1, unit: 'px' },
  ]},
  { legend: 'Inline code', items: [
    { key: 'codeInline', label: 'Font size', min: 8, max: 18, step: 0.5, unit: 'px' },
    { key: 'codeWeight', label: 'Weight', min: 300, max: 700, step: 100, unit: '' },
    { key: 'codeColor', type: 'token', label: 'Text colour' },
    { key: 'codeBgColor', type: 'choice', label: 'Background', choices: BG_OPTS },
  ]},
];

// ── CSS variable mapping ──────────────────────────────────────────────────────

export const VARMAP: Record<string, [string, string]> = {
  gap: ['--gap', 'px'], maxWidth: ['--maxw', 'px'], userGap: ['--user-gap', 'px'],
  bodySize: ['--body-size', 'px'], bodyLH: ['--body-lh', ''], bodyWeight: ['--body-weight', ''],
  boldSize: ['--bold-size', 'px'], boldWeight: ['--bold-weight', ''], linkWeight: ['--link-weight', ''], codeWeight: ['--code-weight', ''],
  pMt: ['--p-mt', 'px'], pMb: ['--p-mb', 'px'],
  h1Size: ['--h1-size', 'px'], h1W: ['--h1-w', ''], h1Mt: ['--h1-mt', 'px'], h1Mb: ['--h1-mb', 'px'], h1Ls: ['--h1-ls', ''], h1LH: ['--h1-lh', ''],
  h2Size: ['--h2-size', 'px'], h2W: ['--h2-w', ''], h2Mt: ['--h2-mt', 'px'], h2Mb: ['--h2-mb', 'px'], h2Ls: ['--h2-ls', ''], h2LH: ['--h2-lh', ''],
  h3Size: ['--h3-size', 'px'], h3W: ['--h3-w', ''], h3Mt: ['--h3-mt', 'px'], h3Mb: ['--h3-mb', 'px'], h3Ls: ['--h3-ls', ''], h3LH: ['--h3-lh', ''],
  listIndent: ['--list-indent', 'px'], ulMt: ['--ul-mt', 'px'], ulMb: ['--ul-mb', 'px'],
  nestedUlMb: ['--nested-ul-mb', 'px'], liMb: ['--li-mb', 'px'], liLh: ['--li-lh', ''],
  markerGap: ['--marker-gap', 'px'], markerSize: ['--marker-size', 'px'],
  codeInline: ['--code-inline', 'px'], codeBlock: ['--code-block', 'px'], codeBlockWeight: ['--codeblock-weight', ''], codeBlockLH: ['--codeblock-lh', ''],
  codeBlockMt: ['--code-mt', 'px'], codeBlockMb: ['--code-mb', 'px'],
  bqSize: ['--bq-size', 'px'], bqPadX: ['--bq-padx', 'px'], bqPadY: ['--bq-pady', 'px'],
  hrMy: ['--hr-my', 'px'], headingAfterBlockMt: ['--h-after-block-mt', 'px'],
  tableMt: ['--table-mt', 'px'], tableMb: ['--table-mb', 'px'],
};

export const COLOR_VARMAP: Record<string, string> = {
  bodyColor: '--body-color',
  h1Color: '--h1-color',
  h2Color: '--h2-color',
  h3Color: '--h3-color',
  linkColor: '--link-color',
  markerColor: '--marker-color',
  bqColor: '--bq-color',
  boldColor: '--bold-color',
  italicColor: '--italic-color',
  codeColor: '--code-color',
  codeBlockColor: '--codeblock-color',
};
