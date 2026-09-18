// Deterministic synthetic row values for the preview panel — this model has no
// real row-level data anywhere (init-dme.js only tracks table/column structure),
// so values are generated from column-name heuristics, keyed by row index so the
// same column always renders the same value across re-renders.

export interface PreviewColumn {
  col: string;
  table: string;
}

const REGIONS = ['APAC', 'NA', 'EMEA', 'LATAM'];
const STATUSES = ['Active', 'Pending', 'Closed', 'Churned'];
const TIERS = ['Enterprise', 'Mid-Market', 'SMB'];
const NAMES = ['Acme Corp', 'Globex Inc', 'Initech LLC', 'Umbrella Co', 'Stark Industries', 'Wayne Enterprises', 'Hooli', 'Soylent Corp'];

function seededValue(seed: number, options: string[]): string {
  return options[seed % options.length];
}

function valueForColumn(col: string, rowIndex: number, table: string): string | number {
  const name = col.toLowerCase();
  const seed = rowIndex + [...col].reduce((s, c) => s + c.charCodeAt(0), 0);

  if (name.endsWith('_id') || name === 'id') {
    const prefix = table.replace(/^(dim_|fact_)/, '').slice(0, 4).toUpperCase();
    return `${prefix}-${String(rowIndex + 1).padStart(4, '0')}`;
  }
  if (name.includes('date') || name.includes('_at')) {
    const month = (seed % 12) + 1;
    const day = (seed % 27) + 1;
    return `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  if (name.includes('region')) return seededValue(seed, REGIONS);
  if (name.includes('status')) return seededValue(seed, STATUSES);
  if (name.includes('tier')) return seededValue(seed, TIERS);
  if (name.includes('name') && !name.includes('column')) return seededValue(seed, NAMES);
  if (name.includes('amount') || name.includes('revenue') || name.includes('arr') || name.includes('price') || name.includes('sales') || name.includes('value') || name.includes('total')) {
    return (((seed * 3721) % 480000) + 5000);
  }
  if (name.includes('count') || name.includes('qty') || name.includes('quantity')) {
    return (seed % 50) + 1;
  }
  return `${col} ${rowIndex + 1}`;
}

export function generateMockRows(columns: PreviewColumn[], count: number): Record<string, string | number>[] {
  return Array.from({ length: count }, (_, rowIndex) => {
    const row: Record<string, string | number> = {};
    columns.forEach(c => { row[c.col] = valueForColumn(c.col, rowIndex, c.table); });
    return row;
  });
}

export interface NlQueryResult {
  groupBy: string;
  metric: string;
  agg: 'sum' | 'count' | 'average';
  data: { group: string; value: number }[];
}

export function isNumericColumn(col: string): boolean {
  const name = col.toLowerCase();
  return name.includes('amount') || name.includes('revenue') || name.includes('arr') || name.includes('price')
    || name.includes('sales') || name.includes('count') || name.includes('qty') || name.includes('quantity')
    || name.includes('value') || name.includes('total');
}

/** Builds a query result directly from the checked columns (the query bar's
 * tokens) — no free-text parsing. The first non-numeric column is the group,
 * the first numeric column is the metric (summed); with no numeric column,
 * falls back to a row count per group. */
export function buildQueryFromColumns(
  columns: PreviewColumn[],
  rows: Record<string, string | number>[]
): NlQueryResult | null {
  if (columns.length === 0) return null;
  const groupCol = columns.find(c => !isNumericColumn(c.col));
  const metricCol = columns.find(c => isNumericColumn(c.col));
  if (!groupCol) return null;

  const agg: NlQueryResult['agg'] = metricCol ? 'sum' : 'count';
  const buckets = new Map<string, number>();
  rows.forEach(row => {
    const key = String(row[groupCol.col] ?? '—');
    const value = metricCol ? (Number(row[metricCol.col]) || 0) : 1;
    buckets.set(key, (buckets.get(key) ?? 0) + value);
  });

  const data = Array.from(buckets.entries())
    .map(([group, value]) => ({ group, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  return { groupBy: groupCol.col, metric: metricCol?.col ?? 'Count', agg, data };
}
