// ─────────────────────────────────────────────────────────────────────────────
// "Ask Spotter" — turn a plain-English question into a REAL answer computed off the
// published model's dataframe. No LLM: keyword intent → measure + dimension + filter,
// then real aggregation (so every number is genuine and the query is shown for trust).
// ─────────────────────────────────────────────────────────────────────────────
import type { DataFrame } from './types';
import { aggregateForChart, aggValue, type Agg } from './agg';

export interface SpotterAnswer {
  interpretation: string;             // "Average customer health by region"
  sql: string;                        // the query it ran (the trust/lineage line)
  headline?: { label: string; value: string };
  chart?: { categories: string[]; values: number[]; label: string; format: Fmt };
  table?: { columns: string[]; rows: DataFrame };
  note?: string;
}

type Fmt = 'percent' | 'currency' | 'number';

const find = (cols: string[], re: RegExp) => cols.find(c => re.test(c));
const fmt = (n: number, f: Fmt) => !Number.isFinite(n) ? '—'
  : f === 'percent' ? `${Math.round(n * 100)}%`
  : f === 'currency' ? (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`)
  : Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 2 });

interface Measure { col: string; agg: Agg; label: string; format: Fmt }

function pickMeasure(q: string, cols: string[]): Measure {
  const scoreCol = find(cols, /health.*score|_score$|^health$/i) ?? find(cols, /score|health/i);
  if (/\b(count|how many|number of|list|which|show me)\b/i.test(q) && !/health|score|arr|nps|sentiment/i.test(q))
    return { col: cols[0], agg: 'count', label: 'Accounts', format: 'number' };
  if (/\b(arr|revenue|acv|value)\b/i.test(q)) { const c = find(cols, /arr|revenue|acv/i); if (c) return { col: c, agg: 'sum', label: `Total ${c}`, format: 'currency' }; }
  if (/\bnps\b/i.test(q)) { const c = find(cols, /nps/i); if (c) return { col: c, agg: 'avg', label: `Avg ${c}`, format: 'number' }; }
  if (/sentiment/i.test(q)) { const c = find(cols, /sentiment_score|sentiment/i); if (c) return { col: c, agg: 'avg', label: `Avg ${c}`, format: 'number' }; }
  if (scoreCol) return { col: scoreCol, agg: 'avg', label: `Avg ${scoreCol}`, format: 'percent' };
  return { col: cols[0], agg: 'count', label: 'Accounts', format: 'number' };
}

function pickDimension(q: string, cols: string[]): string | undefined {
  if (/\bregion\b/i.test(q)) return find(cols, /^region$|csm_region/i);
  if (/\btier\b/i.test(q)) return find(cols, /tier/i);
  if (/\b(csm|owner|manager)\b/i.test(q)) return find(cols, /csm_name|csm/i);
  if (/\bindustry\b/i.test(q)) return find(cols, /industry/i);
  if (/sentiment\b/i.test(q)) return find(cols, /^sentiment$/i);
  return undefined;
}

// returns [filteredRecords, sqlWhere, note]
function applyFilter(q: string, records: DataFrame, cols: string[]): [DataFrame, string, string | undefined] {
  const scoreCol = find(cols, /health.*score|_score$|^health$/i);
  if (/\b(at risk|at-risk|unhealthy|low health|churn|risky)\b/i.test(q) && scoreCol)
    return [records.filter(r => Number(r[scoreCol]) < 0.6), `WHERE ${scoreCol} < 0.6`, 'at-risk = health below 0.6'];
  const tierCol = find(cols, /tier/i);
  if (/enterprise/i.test(q) && tierCol) return [records.filter(r => String(r[tierCol]) === 'Enterprise'), `WHERE ${tierCol} = 'Enterprise'`, undefined];
  for (const reg of ['EMEA', 'APAC', 'NA']) {
    const regCol = find(cols, /^region$/i);
    if (new RegExp(`\\b${reg}\\b`).test(q) && regCol) return [records.filter(r => String(r[regCol]) === reg), `WHERE ${regCol} = '${reg}'`, undefined];
  }
  return [records, '', undefined];
}

export function resolveSpotter(question: string, model: string, records: DataFrame, cols: string[]): SpotterAnswer {
  const m = pickMeasure(question, cols);
  const dim = pickDimension(question, cols);
  const [rows, where, filterNote] = applyFilter(question, records, cols);
  const aggSql = m.agg === 'count' ? 'COUNT(*)' : `${m.agg.toUpperCase()}(${m.col})`;
  const wantsList = /\b(which|list|show me|what are)\b/i.test(question);

  // List intent → a ranked table
  if (wantsList) {
    const scoreCol = find(cols, /health.*score|_score$|^health$/i) ?? m.col;
    const keep = cols.filter(c => /account_id|account_name|name|csm_name|region|tier|arr/i.test(c) || c === scoreCol).slice(0, 6);
    const sorted = [...rows].sort((a, b) => Number(a[scoreCol]) - Number(b[scoreCol])).slice(0, 12);
    return {
      interpretation: `${rows.length} ${filterNote ? 'at-risk ' : ''}accounts${dim ? '' : ''}, lowest ${scoreCol} first`,
      sql: `SELECT ${keep.join(', ')}\nFROM ${model}\n${where}\nORDER BY ${scoreCol} ASC`,
      table: { columns: keep, rows: sorted.map(r => Object.fromEntries(keep.map(k => [k, r[k]]))) },
      note: filterNote,
    };
  }

  // Dimension → grouped bar chart
  if (dim) {
    const cd = aggregateForChart(rows, dim, m.col, m.agg);
    const pairs = cd.categories.map((c, i) => ({ c, v: cd.series[0]?.data[i] ?? 0 })).sort((a, b) => b.v - a.v);
    return {
      interpretation: `${m.label} by ${dim}${filterNote ? ` (${filterNote})` : ''}`,
      sql: `SELECT ${dim}, ${m.agg === 'count' ? 'COUNT(*)' : `ROUND(${aggSql}, 2)`} AS ${m.agg}_${m.col}\nFROM ${model}\n${where}\nGROUP BY ${dim}\nORDER BY 2 DESC`,
      chart: { categories: pairs.map(p => p.c), values: pairs.map(p => p.v), label: m.label, format: m.format },
      note: filterNote,
    };
  }

  // Otherwise → a single headline number
  const val = aggValue(rows, m.col, m.agg);
  return {
    interpretation: `${m.label}${filterNote ? ` (${filterNote})` : ''}`,
    sql: `SELECT ${m.agg === 'count' ? 'COUNT(*)' : `ROUND(${aggSql}, 2)`}\nFROM ${model}\n${where}`,
    headline: { label: `${m.label}${filterNote ? ` · ${filterNote}` : ''}`, value: fmt(val, m.format) },
    note: filterNote,
  };
}

// Suggested questions tailored to the model's columns.
export function sampleQuestions(cols: string[]): string[] {
  const qs: string[] = [];
  if (find(cols, /health|score/i) && find(cols, /^region$/i)) qs.push('Average health by region');
  if (find(cols, /health|score/i)) qs.push('Which accounts are at risk?');
  if (find(cols, /arr/i) && find(cols, /tier/i)) qs.push('Total ARR by tier');
  if (find(cols, /nps/i) && find(cols, /csm_name/i)) qs.push('Average NPS by CSM');
  if (find(cols, /health|score/i) && find(cols, /tier/i)) qs.push('Average health by tier');
  return qs.slice(0, 4);
}

export { fmt as formatSpotter };
