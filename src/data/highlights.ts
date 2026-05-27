/**
 * Curated highlights — cherry-picked across releases. Newest first within each group.
 *
 * Visibility rule: items from the last 60 days, OR the most recent 6 items
 * if fewer than 6 fall inside that window. Maintainer prunes the bottom of
 * each group occasionally if entries get stale before the window drops them.
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
  // ── Sample prototypes & contexts ───────────────────────────────────────────
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

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

export function getVisibleHighlights(now: number = Date.now()): Highlight[] {
  const recent = HIGHLIGHTS.filter((h) => now - new Date(h.date).getTime() <= SIXTY_DAYS_MS);
  if (recent.length >= 6) return recent;
  return HIGHLIGHTS.slice(0, Math.max(6, recent.length));
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
