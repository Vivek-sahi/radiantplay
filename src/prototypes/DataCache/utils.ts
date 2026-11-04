/**
 * Data Cache — formatting, allowance and savings helpers
 */

import type { DataModel, EstimateInputs, Frequency, Org, Plan, Schedule, Weekday, WindowMonths } from './types';

/** 256 → "256 MB"; 35020 → "34.2 GB" */
export function formatSizeMB(mb: number): string {
  if (mb <= 0) return '0 MB';
  if (mb < 1024) return `${Math.round(mb)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export function formatGB(gb: number): string {
  return Number.isInteger(gb) ? `${gb} GB` : `${gb.toFixed(1)} GB`;
}

/** 1_500_000 → "1.5 Million"; 84_200 → "84,200" */
export function formatRowsShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Million`;
  return n.toLocaleString('en-US');
}

/** 120983 → "120,983" */
export function formatRowsFull(n: number): string {
  return n.toLocaleString('en-US');
}

/** 38_300_000 → "38.3M"; 63_900 → "63.9K"; 900 → "900" */
export function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const FREQ_LABEL: Record<Frequency, string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export function frequencyLabel(f: Frequency): string {
  return FREQ_LABEL[f];
}

/** { daily, 9, 0 } → "9:00 AM" */
export function timeLabel(hour: number, minute: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${period}`;
}

/** { daily, 9, 0 } → "Daily, 9:00 AM" */
export function scheduleLabel(s: Schedule): string {
  return `${FREQ_LABEL[s.frequency]}, ${timeLabel(s.hour, s.minute)}`;
}

export function windowMonthsLabel(m: WindowMonths): string {
  return `Last ${m} months`;
}

const WEEKDAY_FULL: Record<Weekday, string> = {
  M: 'Mon', T: 'Tue', W: 'Wed', Th: 'Thu', F: 'Fri', Sa: 'Sat', S: 'Sun',
};

/** Secondary line under the refresh frequency: weekends / weekdays / month-days. */
export function scheduleDetail(s: Schedule): string | null {
  if (s.frequency === 'weekly') {
    const days = (s.weekdays ?? []).map((d) => WEEKDAY_FULL[d]);
    return days.length ? `On ${days.join(', ')}` : null;
  }
  if (s.frequency === 'monthly') {
    return s.monthDays ? `On day ${s.monthDays}` : null;
  }
  return s.excludeWeekends ? 'Excluding weekends' : null;
}

// ── Cacheability / cache state ───────────────────────────────────────────────
export const isCacheable = (m: DataModel): boolean => !(m.cacheability && !m.cacheability.cacheable);
export const isCacheEnabled = (m: DataModel): boolean => !!m.cache; // config exists (includes 'purged')

// ── The PLG maths (from the reference prototype, 2 Nov) ───────────────────────
// Every constant is a placeholder until the real formula lands; they are kept
// in one place so a change is one edit.
/** $ per warehouse compute hour, the saving estimate's unit price (5 Nov: replaces $ per query). */
export const RATE_PER_HOUR = 3;
export const RATE_PER_QUERY = 0.05; // $ per warehouse query, the saving estimate's unit price
export const HIT_CEILING = 0.8; // up to 80% of queries on a cached model use cached data
/** Per-model bar: at the ceiling and $0.05 a query, this many queries in 30 d saves $1,000 a year. */
export const MODEL_BAR_QUERIES = 2055;
const CACHE_FACTOR = 1; // cache query hours per warehouse query hour absorbed (worst case, 1:1)
const REFRESH_HOURS = 0; // fixed refresh cost per model per month

/** Warehouse query time this model consumed in 30 d, in hours. */
export const warehouseHours = (m: DataModel): number =>
  m.usage ? Math.round((m.usage.warehouseQueries30d * m.usage.avgQuerySeconds) / 3600) : 0;

/** Query hours a month caching this model would take from the free allowance. */
export const cacheHours = (m: DataModel): number => Math.round(warehouseHours(m) * CACHE_FACTOR + REFRESH_HOURS);

/** Yearly saving at the ceiling for a model with `queries30d` warehouse queries a month. */
export const savingPerYear = (queries30d: number): number => (queries30d * 365) / 30 * HIT_CEILING * RATE_PER_QUERY;

/** Yearly saving at the ceiling for a model with `hours30d` warehouse compute hours a month (5 Nov). */
export const savingPerYearHours = (hours30d: number): number => hours30d * RATE_PER_HOUR * 12 * HIT_CEILING;

/** 381479 → "$381k"; 1_250_000 → "$1.3M"; 2500 → "$2.5k"; 640 → "$640" */
export const usd = (n: number): string =>
  '$' +
  (n >= 1e6
    ? `${(n / 1e6).toFixed(1)}M`
    : n >= 10_000
      ? `${Math.round(n / 1000)}k`
      : n >= 1000
        ? `${(n / 1000).toFixed(1)}k`
        : String(Math.round(n)));

/** The saving as a range: 60% to 80% of queries from cache. */
export const usdRange = (atCeiling: number): string => `${usd(atCeiling * 0.75)} to ${usd(atCeiling)}`;

/** Rounds to 3 significant figures for headline counts: 675,606 → 676,000 */
export const roundSig = (n: number): number => Number(n.toPrecision(3));

/** Hours already committed by the cached models (what the free allowance has left). */
export const hoursUsed = (models: DataModel[]): number =>
  models.filter((m) => m.cache && m.cache.status !== 'purged').reduce((t, m) => t + cacheHours(m), 0);

/** Compressed size of everything cached, in GB. */
export const gbUsed = (models: DataModel[]): number =>
  models.reduce((t, m) => t + (m.cache && m.cache.status !== 'purged' ? m.cache.cacheSizeMB : 0), 0) / 1024;

export const allowancePct = (used: number, free: number): number => Math.min(100, Math.round((used / Math.max(1, free)) * 100));

/** How much of the org the free hours cover, if every cacheable model were cached. */
export function coverage(cacheableHours: number, cacheableModels: number, plan: Plan): { pct: number; modelsFit: number } {
  const pct = cacheableHours <= 0 ? 100 : Math.min(100, Math.round((plan.freeHours / cacheableHours) * 100));
  const modelsFit = pct === 100 ? cacheableModels : Math.round((cacheableModels * pct) / 100);
  return { pct, modelsFit };
}

// ── The calculator (a model's Caching tab) ────────────────────────────────────
/** Starting inputs: the model's own last-30-day usage at the default ceiling and rate. */
export const defaultEstimate = (m: DataModel): EstimateInputs => ({
  queriesPerMonth: m.usage?.warehouseQueries30d ?? 0,
  avgQuerySeconds: m.usage?.avgQuerySeconds ?? 3,
  hitPct: Math.round(HIT_CEILING * 100),
  ratePerQuery: RATE_PER_QUERY,
  hoursPerMonth: warehouseHours(m),
  ratePerHour: RATE_PER_HOUR,
});

export interface Estimate {
  stillReaching: number; // warehouse queries a month with caching
  warehouseHours: number; // warehouse query time a month today
  cacheHours: number; // query hours a month to cache this model
  savingPerYear: number; // at the given hit rate and rate per query
  withinFree: boolean; // the query hours fit in the plan's free hours
}

export function computeEstimate(e: EstimateInputs, plan: Plan): Estimate {
  const hit = Math.min(100, Math.max(0, e.hitPct)) / 100;
  const warehouseHrs = Math.round(e.hoursPerMonth);
  const cacheHrs = Math.round(warehouseHrs * CACHE_FACTOR + REFRESH_HOURS);
  return {
    stillReaching: Math.round((e.queriesPerMonth * (1 - hit)) / 10) * 10,
    warehouseHours: warehouseHrs,
    cacheHours: cacheHrs,
    // Their formula (5 Nov): compute hours × $ per hour × 12 × share served from cache.
    savingPerYear: e.hoursPerMonth * e.ratePerHour * 12 * hit,
    withinFree: cacheHrs <= plan.freeHours,
  };
}

// ── v2 page helpers ───────────────────────────────────────────────────────────
/** What a cached model has saved so far, as a yearly run rate from its analytics. */
export const savedSoFarPerYear = (m: DataModel): number | null =>
  m.cache?.analytics ? m.cache.analytics.cachedQueries * RATE_PER_QUERY * 12 : null;

/** Warehouse query time the cache has absorbed, in hours, from the cached models' analytics. */
export const queryTimeAvoidedHours = (models: DataModel[]): number =>
  Math.round(
    models.reduce((t, m) => t + (m.cache?.analytics?.cachedQueries ?? 0) * (m.usage?.avgQuerySeconds ?? 0), 0) / 3600,
  );

/** Does this one model fit in what the free hours have left? (v2: per row, not cumulative.) */
export const fitsFreeHours = (m: DataModel, used: number, plan: Plan): boolean => cacheHours(m) <= plan.freeHours - used;

/**
 * The PM's coverage maths (Data Cache Hook, 2 Nov): how much of the org's cacheable
 * models the plan's query hours cover, org-wide. Cache hours 1:1 with warehouse hours.
 */
export function planCoverage(org: Org, plan: Plan): { pct: number; fit: number; total: number } {
  const all = Math.round((org.cacheableHours30d * CACHE_FACTOR + org.cacheableModels * REFRESH_HOURS) / 10) * 10;
  const pct = all > 0 ? Math.min(100, Math.round((plan.freeHours / all) * 100)) : 100;
  const fit = pct === 100 ? org.cacheableModels : Math.round((org.cacheableModels * pct) / 100);
  return { pct, fit, total: org.cacheableModels };
}

/** The saving as one figure for every calculator (Vivek, 4 Nov): "$84k–$111k/yr". */
export const usdRangeYr = (atCeiling: number): string => `${usdRange(atCeiling).replace(' to ', '–')}/yr`;

/** The line under the figure, live from the inputs, the same on the Caching tab and the Data Cache page. */
export const estimateBasis = (e: EstimateInputs): string =>
  `At $${Number.isInteger(e.ratePerHour) ? e.ratePerHour : e.ratePerHour.toFixed(2)} per warehouse compute hour, ${e.hitPct}% served from Data Cache`;
