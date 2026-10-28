/**
 * Curated highlights — cherry-picked across releases. Newest first within each group.
 *
 * Visibility rule: the first 6 items in this list show, so keep the current
 * six at the top. Older items stay below as a record.
 *
 * Groups:
 *   - 'prototypes'  — new sample prototypes and contexts designers can build with
 *   - 'enhancements' — platform / tooling improvements to Radiant Play itself
 */
export type HighlightGroup = 'prototypes' | 'enhancements';

export interface Highlight {
  title: string;
  description: string;
  version: string; // links back to the matching versionHistory entry
  date: string; // ISO date for the time-based window
  group: HighlightGroup;
}

export const HIGHLIGHT_GROUPS: { id: HighlightGroup; label: string }[] = [
  { id: 'prototypes', label: 'Sample prototypes & contexts' },
  { id: 'enhancements', label: 'Radiant Play enhancements' },
];

export const HIGHLIGHTS: Highlight[] = [
  // ── 26.10.4q ────────────────────────────────────────────────────────────────
  {
    title: 'Groups in the gallery',
    description: 'Sort prototypes into groups, switch to a list view, and move, rename or archive them right in the gallery while npm run dev runs. It suggests groups for prototypes that look like one project.',
    version: '26.10.4g',
    date: '2026-10-27',
    group: 'enhancements',
  },
  {
    title: 'Usage rules from Figma in the docs',
    description: 'Component pages show Figma\'s Do and Don\'t rules, and Claude follows them when it builds. Table, Menu, Select and more match Radiant 3.0 under look: radiant-3.',
    version: '26.10.4j',
    date: '2026-10-28',
    group: 'enhancements',
  },
  {
    title: 'Share your work with /rp-contribute',
    description: 'Asks what you are sharing, works out where each piece belongs, and opens PRs against staging or a teammate\'s branch.',
    version: '26.10.4i',
    date: '2026-10-27',
    group: 'enhancements',
  },
  // ── v26.10 big updates ─────────────────────────────────────────────────────
  {
    title: 'Dark mode, everywhere',
    description: 'Every page, component and prototype works in light and dark. Press Ctrl+D.',
    version: '26.10.1a',
    date: '2026-10-09',
    group: 'enhancements',
  },
  {
    title: 'New type: Geist',
    description: "Geist and Geist Mono replace the old fonts, with Figma's weights.",
    version: '26.10.1a',
    date: '2026-10-09',
    group: 'enhancements',
  },
  {
    title: 'Components updated to Radiant 3.0',
    description: 'Figma colours, new variants and 17 new components, including Toggle, Toast, Stepper and PageHeader.',
    version: '26.10.3b',
    date: '2026-10-13',
    group: 'enhancements',
  },
  {
    title: 'A new look for Radiant Play',
    description: 'One frame for the playground and the design system, with a new logo and a Help menu.',
    version: '26.10.3g',
    date: '2026-10-14',
    group: 'enhancements',
  },
  {
    title: 'Design system updates',
    description: '400 tokens from Figma, the Spotter DS and Radiance guides, and On this page navigation.',
    version: '26.10.3b',
    date: '2026-10-13',
    group: 'enhancements',
  },
  {
    title: 'And more',
    description: "Radiance, ThoughtSpot's AI identity. /rp- skills in Claude. Guides for the Claude desktop app. Coolify deploys and the project canvas.",
    version: '26.10.3h',
    date: '2026-10-14',
    group: 'enhancements',
  },

  // ── Sample prototypes & contexts ───────────────────────────────────────────
  {
    title: 'Spotter Refresh blocks in the shared Spotter DS',
    description: "Devanshi's Reasoning timeline, UserMessage bubble, PromptBar composer and ToolIcon now live in src/spotter/chat/. ReasoningBlock and UserBubble stay as adapters, so existing prototypes pick up the new look without changes. Front door on /radiant/spotter.",
    version: '26.9.1a',
    date: '2026-09-03',
    group: 'prototypes',
  },
  {
    title: 'Spotter prototype',
    description: 'AnalystLandingPage, AnalystListPage, and the right-pane state machine landed. Prompt bar rebuilt with a mode toggle, hideable data-model picker, and a new PromptSuggestionsPanel. 12 IA polish corrections across analyst selection, recency-sorted chats, panel restructure, and chat naming. The Liveboard template SpotterViz side panel was also rebuilt to match the Figma design.',
    version: '26.5.4a',
    date: '2026-05-26',
    group: 'prototypes',
  },
  {
    title: 'Liveboard with Styling panel',
    description: 'Per-tile density, color theme, corner style, spacing, and highlight overrides via a right-side drawer. Shared tile CSS variables added to AnswerTile, NoteTile, GroupTile. The two integration bugs from the original PR (missing AnswerTileProps.highlighted and EditToolbar onToggleStyling wiring) are fixed.',
    version: '26.5.4a',
    date: '2026-05-26',
    group: 'prototypes',
  },
  {
    title: 'AdminUI 2.0 prototype',
    description: 'Application Settings screen added to the shared sample registry. Cluster settings, administration toggles, downloads and schedules, version control, AI settings.',
    version: '26.5.4a',
    date: '2026-05-26',
    group: 'prototypes',
  },
  {
    title: 'Add Muze charts on demand',
    description: 'New opt-in guide for adding Muze (private packagecloud library) to a prototype. Includes auth setup, install steps, chart-shape cheatsheet (single column, dual, trellis, stacked), and resize-aware tile mounting. Default install stays friction-free for designers who don\'t use Muze.',
    version: '26.5.2',
    date: '2026-05-07',
    group: 'prototypes',
  },
  {
    title: 'Data model editor + SpotterModel interface',
    description: 'New Data Model Editor prototype with retail schema preset, draggable table cards, column tree, and join connectors. SpotterModel AI agent panel suggests tables, joins, columns, and formulas with confidence badges, reasoning blocks, and version-history restore. Shared _datamodel module ready to drop into other prototypes.',
    version: '26.5.0',
    date: '2026-04-30',
    group: 'prototypes',
  },

  // ── Radiant Play enhancements ──────────────────────────────────────────────
  {
    title: 'Playground archive section + sidebar nav',
    description: 'Gallery has a light left sidebar with Prototypes and Archived sections. Per-card 3-dot menu archives or restores any prototype in your session. Save-to-code modal generates a Claude-ready prompt to commit the layout permanently. MiniSpotters and AdminLang now appear as archived by default.',
    version: '26.5.4a',
    date: '2026-05-26',
    group: 'enhancements',
  },
  {
    title: 'Project status dashboard',
    description: 'A local HTML dashboard with overview, branches, forks/upstream, worktrees, and docs/plans tabs. Run /project-status; zero LLM token cost.',
    version: '26.4.4c',
    date: '2026-04-28',
    group: 'enhancements',
  },
  {
    title: 'Token system — Figma 3.0 alignment',
    description: 'Phases 1–5 of 8 shipped: primitive colors, light semantic colors, typography, shadows, layout. Dark mode (Phase 6) is next.',
    version: '26.4.4c',
    date: '2026-04-28',
    group: 'enhancements',
  },
  {
    title: 'Changelog highlights',
    description: 'Curated highlights at the top of this page surface major work across recent releases — like the section you are reading.',
    version: '26.4.4c',
    date: '2026-04-28',
    group: 'enhancements',
  },
];

// `now` is kept so existing callers still compile; the list order decides what shows.
export function getVisibleHighlights(_now: number = Date.now()): Highlight[] {
  return HIGHLIGHTS.slice(0, 6);
}

/**
 * Returns visible highlights grouped by their `group` field, preserving the
 * order defined in HIGHLIGHT_GROUPS. Empty groups are omitted.
 */
export function getGroupedVisibleHighlights(
  now: number = Date.now()
): { id: HighlightGroup; label: string; items: Highlight[] }[] {
  const visible = getVisibleHighlights(now);
  return HIGHLIGHT_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    items: visible.filter((h) => h.group === g.id),
  })).filter((g) => g.items.length > 0);
}
