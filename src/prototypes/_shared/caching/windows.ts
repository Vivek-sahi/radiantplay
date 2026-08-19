/**
 * Cache time windows — **one list, shared by every caching surface.**
 *
 * Two prototypes ask the user how much history to cache, and they used to disagree about the
 * vocabulary. Near Store shipped **months only** (`1 · 3 · 6 · 13`, nothing under a week),
 * because its cache is a cost optimisation over years of warehouse data. Data Studio's canvas
 * needs **hours and days**, because there the cache blocks a join and the first one has to be
 * fast.
 *
 * Those are the same question — *how much history?* — asked with different urgency, so this is
 * one control with two defaults rather than two lists. It lives in `_shared` because a list
 * defined twice is a list that drifts, and the whole point of consolidating the two prototypes
 * is that a window set on the canvas reads identically on the model's Caching tab.
 *
 * Decided 2026-08-12. See `DataStudioV2/2026-08-12-caching-flow-spec.md` §9.
 */

/** `'full'` is a first-class value, not the absence of a window — some tables cache whole. */
export type CacheWindow = '24h' | '3d' | '7d' | '1mo' | '3mo' | '6mo' | '13mo' | 'full';

/** Selectable windows, shortest first. `'full'` is offered separately as "All history". */
export const WINDOW_OPTIONS: CacheWindow[] = ['24h', '3d', '7d', '1mo', '3mo', '6mo', '13mo'];

export const WINDOW_LABEL: Record<CacheWindow, string> = {
  '24h': 'Last 24 hours',
  '3d': 'Last 3 days',
  '7d': 'Last 7 days',
  '1mo': 'Last 1 month',
  '3mo': 'Last 3 months',
  '6mo': 'Last 6 months',
  '13mo': 'Last 13 months',
  full: 'All history',
};

/** Short form for badges, where "Last 24 hours" is too long to sit on a card. */
export const WINDOW_SHORT: Record<CacheWindow, string> = {
  '24h': '24h', '3d': '3d', '7d': '7d', '1mo': '1mo', '3mo': '3mo', '6mo': '6mo', '13mo': '13mo',
  full: 'full',
};

/** Hours per window, for size and duration estimates. `full` has no bound. */
export const WINDOW_HOURS: Record<CacheWindow, number> = {
  '24h': 24, '3d': 72, '7d': 168, '1mo': 730, '3mo': 2190, '6mo': 4380, '13mo': 9490,
  full: Infinity,
};

/**
 * One list, two defaults — the difference is what each surface is for.
 *
 * At a join the **smallest** window wins: the job is to unblock the join, not to make someone
 * commit to a data scope before they know what they are building.
 *
 * On a model's Caching tab **All history** wins: there the cache is an optimisation over a model
 * that already works, so windowing is a deliberate per-table opt-in. That was Near Store's
 * decision and nothing about the canvas changes it.
 */
export const DEFAULT_JOIN_WINDOW: CacheWindow = '24h';
export const DEFAULT_MODEL_WINDOW: CacheWindow = 'full';

/** Fraction of a table a window keeps, given how much history the table spans. */
export const windowFraction = (window: CacheWindow, spanHours: number): number =>
  window === 'full' ? 1 : Math.min(1, WINDOW_HOURS[window] / spanHours);
