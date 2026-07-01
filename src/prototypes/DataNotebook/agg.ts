// Client-side aggregation for derived display cells (chart, single value, pivot).
import type { DataFrame, CellColumn } from './types';

export type Agg = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

function reduceAgg(values: number[], agg: Agg): number {
  if (agg === 'count') return values.length;
  if (values.length === 0) return 0;
  switch (agg) {
    case 'sum': return values.reduce((a, b) => a + b, 0);
    case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min': return Math.min(...values);
    case 'max': return Math.max(...values);
    default: return values.reduce((a, b) => a + b, 0);
  }
}

// Aggregate a single measure over the whole dataframe.
export function aggValue(records: DataFrame, column: string, agg: Agg): number {
  if (agg === 'count') return records.length;
  const vals = records.map(r => num(r[column])).filter((v): v is number => v !== null);
  return reduceAgg(vals, agg);
}

// Group records by x (and optional series) and aggregate y.
export interface ChartData {
  categories: string[];
  series: { name: string; data: number[] }[];
}

export function aggregateForChart(records: DataFrame, x: string, y: string, agg: Agg, series?: string): ChartData {
  const cats: string[] = [];
  const catIndex = new Map<string, number>();
  const seriesNames: string[] = [];
  const seriesIndex = new Map<string, number>();
  // buckets[seriesIdx][catIdx] = number[]
  const buckets: number[][][] = [];

  const ensureCat = (k: string) => {
    if (!catIndex.has(k)) { catIndex.set(k, cats.length); cats.push(k); }
    return catIndex.get(k)!;
  };
  const ensureSeries = (k: string) => {
    if (!seriesIndex.has(k)) { seriesIndex.set(k, seriesNames.length); seriesNames.push(k); buckets.push([]); }
    return seriesIndex.get(k)!;
  };

  for (const r of records) {
    const ck = String(r[x] ?? 'null');
    const sk = series ? String(r[series] ?? 'null') : (y || 'value');
    const ci = ensureCat(ck);
    const si = ensureSeries(sk);
    if (!buckets[si][ci]) buckets[si][ci] = [];
    if (agg === 'count') buckets[si][ci].push(1);
    else {
      const v = num(r[y]);
      if (v !== null) buckets[si][ci].push(v);
    }
  }

  const out: ChartData = { categories: cats, series: [] };
  for (let si = 0; si < seriesNames.length; si++) {
    const data = cats.map((_, ci) => {
      const vals = buckets[si][ci] ?? [];
      return Math.round(reduceAgg(vals, agg) * 100) / 100;
    });
    out.series.push({ name: seriesNames[si], data });
  }
  return out;
}

// Group-by pivot → { columns, rows }.
export function pivotTable(
  records: DataFrame,
  groupBy: string[],
  values: { column: string; agg: Agg }[],
): { columns: CellColumn[]; rows: DataFrame } {
  const groups = new Map<string, { keyVals: Record<string, unknown>; rows: DataFrame }>();
  for (const r of records) {
    const key = groupBy.map(g => String(r[g] ?? 'null')).join('␟');
    if (!groups.has(key)) {
      const keyVals: Record<string, unknown> = {};
      groupBy.forEach(g => { keyVals[g] = r[g]; });
      groups.set(key, { keyVals, rows: [] });
    }
    groups.get(key)!.rows.push(r);
  }
  const valLabel = (v: { column: string; agg: Agg }) => `${v.agg}_${v.column}`;
  const rows: DataFrame = [];
  for (const { keyVals, rows: grp } of groups.values()) {
    const row: Record<string, unknown> = { ...keyVals };
    for (const v of values) {
      const n = aggValue(grp, v.column, v.agg);
      row[valLabel(v)] = Math.round(n * 100) / 100;
    }
    rows.push(row);
  }
  const columns: CellColumn[] = [
    ...groupBy.map(g => ({ name: g, type: 'group' })),
    ...values.map(v => ({ name: valLabel(v), type: v.agg })),
  ];
  return { columns, rows };
}
