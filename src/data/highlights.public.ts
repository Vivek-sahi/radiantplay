/**
 * Curated highlights — PUBLIC build.
 *
 * Swapped in for src/data/highlights.ts by scripts/public-strip.sh at export time.
 * Keep the exported API identical to highlights.ts — only the HIGHLIGHTS data differs.
 *
 * Groups:
 *   - 'prototypes'  — sample prototypes and contexts you can build with
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
  {
    title: 'Radiant Play is open source',
    description: 'The Radiant design system, layout primitives, design tokens, and a starter set of sample prototypes are now public. Fork it, build prototypes with realistic data, and explore the component library.',
    version: '1.0.0',
    date: '2026-05-27',
    group: 'enhancements',
  },
  {
    title: 'Sample prototypes to build from',
    description: 'A starter set of sample prototypes shows how to compose Radiant components with layout primitives and mock data.',
    version: '1.0.0',
    date: '2026-05-27',
    group: 'prototypes',
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
