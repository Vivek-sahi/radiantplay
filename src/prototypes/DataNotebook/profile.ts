// ─────────────────────────────────────────────────────────────────────────────
// Auto-EDA — instant profiling for the Profile cell. Pure client-side over the
// dataframe records (works on any seeded table, SQL/Python output, or CSV).
// ─────────────────────────────────────────────────────────────────────────────
import type { DataFrame } from './types';

export type ColKind = 'number' | 'string' | 'boolean' | 'date' | 'empty';

export interface Bin { label: string; count: number }

export interface ColumnProfile {
  name: string;
  kind: ColKind;
  count: number;       // non-null
  nulls: number;
  nullPct: number;
  distinct: number;
  min?: number; max?: number; mean?: number;
  bins: Bin[];         // histogram (numeric) or top categories (string/bool)
  moreNote?: string;   // "+N more" for high-cardinality categoricals
}

const isBlank = (v: unknown) => v === null || v === undefined || v === '';
const isNum = (v: unknown) => !isBlank(v) && Number.isFinite(typeof v === 'number' ? v : Number(v));

function detectKind(values: unknown[]): ColKind {
  const nn = values.filter(v => !isBlank(v));
  if (nn.length === 0) return 'empty';
  const sample = nn.slice(0, 300);
  let nums = 0, bools = 0, dates = 0;
  for (const v of sample) {
    if (typeof v === 'boolean') bools++;
    else if (isNum(v)) nums++;
    else if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) dates++;
  }
  const n = sample.length;
  if (bools / n > 0.8) return 'boolean';
  if (nums / n > 0.8) return 'number';
  if (dates / n > 0.8) return 'date';
  return 'string';
}

export function profileColumn(records: DataFrame, name: string): ColumnProfile {
  const values = records.map(r => r[name]);
  const nulls = values.filter(isBlank).length;
  const nonNull = values.filter(v => !isBlank(v));
  const kind = detectKind(values);
  const distinct = new Set(nonNull.map(v => String(v))).size;
  const p: ColumnProfile = {
    name, kind, count: nonNull.length, nulls,
    nullPct: values.length ? nulls / values.length : 0, distinct, bins: [],
  };

  if (kind === 'number') {
    const nums = nonNull.map(v => Number(v)).filter(Number.isFinite);
    if (nums.length) {
      const min = Math.min(...nums), max = Math.max(...nums);
      p.min = min; p.max = max; p.mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const B = 12, span = (max - min) || 1, counts = new Array(B).fill(0);
      for (const x of nums) { let i = Math.floor(((x - min) / span) * B); if (i >= B) i = B - 1; if (i < 0) i = 0; counts[i]++; }
      p.bins = counts.map(c => ({ label: '', count: c }));
    }
  } else if (kind === 'boolean') {
    const t = nonNull.filter(v => v === true || v === 'true').length;
    p.bins = [{ label: 'true', count: t }, { label: 'false', count: nonNull.length - t }];
  } else {
    const m = new Map<string, number>();
    for (const v of nonNull) { const k = String(v); m.set(k, (m.get(k) || 0) + 1); }
    const top = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    p.bins = top.map(([label, count]) => ({ label, count }));
    if (m.size > 8) p.moreNote = `+${m.size - 8} more`;
  }
  return p;
}

export function profileTable(records: DataFrame, columns: string[]): ColumnProfile[] {
  return columns.map(c => profileColumn(records, c));
}

// Pearson correlation matrix across numeric columns (pairwise-complete).
export function correlation(records: DataFrame, cols: string[]): { cols: string[]; matrix: number[][] } {
  const data = cols.map(c => records.map(r => Number(r[c])));
  const pearson = (a: number[], b: number[]) => {
    const xs: number[] = [], ys: number[] = [];
    for (let i = 0; i < a.length; i++) if (Number.isFinite(a[i]) && Number.isFinite(b[i])) { xs.push(a[i]); ys.push(b[i]); }
    const m = xs.length; if (m < 2) return 0;
    const mx = xs.reduce((s, v) => s + v, 0) / m, my = ys.reduce((s, v) => s + v, 0) / m;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < m; i++) { num += (xs[i] - mx) * (ys[i] - my); dx += (xs[i] - mx) ** 2; dy += (ys[i] - my) ** 2; }
    const den = Math.sqrt(dx * dy);
    return den ? num / den : 0;
  };
  const n = cols.length, matrix: number[][] = [];
  for (let i = 0; i < n; i++) { matrix[i] = []; for (let j = 0; j < n; j++) matrix[i][j] = i === j ? 1 : Math.round(pearson(data[i], data[j]) * 100) / 100; }
  return { cols, matrix };
}
