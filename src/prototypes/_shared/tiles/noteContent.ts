// ─── Note tile content schema ─────────────────────────────────────────────
//
// A note tile is a single rich-text document made of block-level elements.
// Each block can contain inline nodes (text runs with optional formatting).
// This schema is designed to support editing later (similar to Slate/ProseMirror).
//
// TEXT STYLE RULES (from Figma Liveboard-Styling, node 8739:359642)
// ┌────────────────┬───────┬────────┬──────────────────┬────────────────────┐
// │ Style          │ Size  │ Weight │ Color            │ Line-height        │
// ├────────────────┼───────┼────────┼──────────────────┼────────────────────┤
// │ title          │ 16px  │ 600    │ #1D232F          │ 24px / -0.4px ls   │
// │ heading        │ 14px  │ 600    │ #1D232F          │ 20px               │
// │ body           │ 14px  │ 375    │ #4A515E          │ 20px               │
// │ inline bold    │ —     │ 600    │ (inherits)       │ —                  │
// │ inline italic  │ —     │ —      │ (inherits)       │ —                  │
// │ inline color   │ —     │ —      │ custom override  │ —                  │
// │ link           │ 14px  │ 375    │ #2770EF          │ 20px / underline   │
// └────────────────┴───────┴────────┴──────────────────┴────────────────────┘

// ─── Inline nodes ─────────────────────────────────────────────────────────

export interface TextNode {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  /** Any CSS color string, e.g. '#049160' */
  color?: string;
}

export interface LinkNode {
  type: 'link';
  text: string;
  href: string;
}

export type InlineNode = TextNode | LinkNode;

// ─── Block nodes ──────────────────────────────────────────────────────────

export interface TitleBlock    { type: 'title';          children: InlineNode[] }
export interface HeadingBlock  { type: 'heading';        children: InlineNode[] }
export interface BodyBlock{ type: 'body';      children: InlineNode[] }
export interface BulletBlock   { type: 'bullet-list';    items: InlineNode[][] }
export interface NumberedBlock { type: 'numbered-list';  items: InlineNode[][] }
export interface ImageBlock    { type: 'image';          src: string; alt?: string }
export interface TableBlock    { type: 'table';          headers: string[]; rows: string[][] }
export interface DividerBlock  { type: 'divider' }

export type NoteBlock =
  | TitleBlock
  | HeadingBlock
  | BodyBlock
  | BulletBlock
  | NumberedBlock
  | ImageBlock
  | TableBlock
  | DividerBlock;

/** The full content of a note tile — an ordered list of blocks */
export type NoteContent = NoteBlock[];

// ─── Helper ───────────────────────────────────────────────────────────────

const t = (text: string, opts?: Omit<TextNode, 'type' | 'text'>): TextNode =>
  ({ type: 'text', text, ...opts });
const link = (text: string, href: string): LinkNode => ({ type: 'link', text, href });

// ─── Sample variations ────────────────────────────────────────────────────

/** Weekly update with inline colored number + bullet list — matches Figma example */
export const NOTE_WEEKLY_UPDATE: NoteContent = [
  { type: 'title', children: [t('Weekly update')] },
  {
    type: 'body',
    children: [
      t('Bookings increased by '),
      t('30%', { color: '#049160' }),
      t(' in 1 week'),
    ],
  },
  { type: 'body', children: [t('Major contributing deals —')] },
  {
    type: 'bullet-list',
    items: [
      [t('Acme Inc.')],
      [t('Globex')],
      [t('VCP')],
    ],
  },
];

/** Key metrics — numbers highlighted inline */
export const NOTE_KEY_METRICS: NoteContent = [
  { type: 'title', children: [t('Q3 key metrics')] },
  {
    type: 'body',
    children: [
      t('Revenue hit '),
      t('$4.2M', { bold: true }),
      t(', up '),
      t('18%', { color: '#049160' }),
      t(' YoY. Churn dropped to '),
      t('2.1%', { color: '#049160' }),
      t(', the lowest this year.'),
    ],
  },
  { type: 'divider' },
  { type: 'heading', children: [t('Watch areas')] },
  {
    type: 'bullet-list',
    items: [
      [t('APAC pipeline is '), t('12% behind', { color: '#D94F3D' }), t(' target')],
      [t('Support tickets up '), t('22%', { color: '#D94F3D' }), t(' in EU region')],
    ],
  },
];

/** Team announcement with body text, divider, and a link */
export const NOTE_ANNOUNCEMENT: NoteContent = [
  { type: 'title', children: [t('Team announcement')] },
  {
    type: 'body',
    children: [t('We are migrating to the new data pipeline on Nov 15. All dashboards will be refreshed automatically.')],
  },
  {
    type: 'body',
    children: [t('No action needed from your side. Reach out to the data team if you notice any discrepancies after the cutover.')],
  },
  { type: 'divider' },
  {
    type: 'body',
    children: [
      t('Questions? Check the '),
      link('migration FAQ', 'https://thoughtspot.com'),
      t(' or ping '),
      t('#data-eng', { bold: true }),
      t(' on Slack.'),
    ],
  },
];

/** Q3 recap with a table */
export const NOTE_Q3_RECAP: NoteContent = [
  { type: 'title', children: [t('Q3 regional recap')] },
  {
    type: 'body',
    children: [t('Performance summary across all regions for Q3 FY2025.')],
  },
  {
    type: 'table',
    headers: ['Region', 'Revenue', 'vs Q2'],
    rows: [
      ['North America', '$1.8M', '+14%'],
      ['Europe',        '$1.1M',  '+9%'],
      ['Asia Pacific',  '$0.7M', '+22%'],
      ['Latin America', '$0.3M',  '+6%'],
    ],
  },
];

/** Quick note — no title, plain body text */
export const NOTE_QUICK: NoteContent = [
  {
    type: 'body',
    children: [t('Follow up with APAC team on the pipeline gap before the next board review. Ask for updated projections by EOW.')],
  },
  {
    type: 'numbered-list',
    items: [
      [t('Review deal list with regional leads')],
      [t('Update forecast model')],
      [t('Send summary to leadership')],
    ],
  },
];

/** All named variations for use in the prototype */
export const NOTE_VARIATIONS = {
  'weekly-update':  NOTE_WEEKLY_UPDATE,
  'key-metrics':    NOTE_KEY_METRICS,
  'announcement':   NOTE_ANNOUNCEMENT,
  'q3-recap':       NOTE_Q3_RECAP,
  'quick-note':     NOTE_QUICK,
} as const;

export type NoteVariant = keyof typeof NOTE_VARIATIONS;
