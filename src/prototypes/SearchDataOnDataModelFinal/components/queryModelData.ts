// Query tab's model-driven data (2026-09-29, Komal: "The Query tab should talk
// to the model the user is building" — column list, typed search, formulas
// and parameters, answers from sample data for the chosen columns).
//
// Kept separate from previewMockData.ts on purpose: that file feeds the
// Spreadsheet preview, whose look ("NEW_-0001", "col 12") must not change.
// Query needs different sample data — few distinct values per label column
// so grouping produces a real answer, and plausible numbers to total.
//
// The model carries no column types (init-dme.js only lists names), so a
// column is a number, a date or a label by its name — Komal's choice of
// "infer from names" over adding types to the schema.

export type QueryColumnType = 'measure' | 'attribute' | 'date';

export interface QueryModelColumn {
  /** Qualified "table.column" — also the label, the same naming the Spreadsheet uses. */
  key: string;
  label: string;
  table: string;
  col: string;
  type: QueryColumnType;
}

export interface QueryModelInput {
  tables: { name: string }[];
  joins: { leftTable: string; rightTable: string }[];
  dataSourceTables: { name: string; columns: string[] }[];
  modelColumns: { table: string; columns: string[] }[];
  formulas: { name: string; expression: string }[];
  parameters: { name: string; value: string }[];
}

type Row = Record<string, string | number>;

// ─── Column types ────────────────────────────────────────────────────────────

const MEASURE_WORDS = [
  'amount', 'price', 'cost', 'quantity', 'qty', 'count', 'value', 'total', 'score', 'points',
  'rating', 'margin', 'discount', 'tax', 'revenue', 'weight', 'length', 'width', 'height',
  'footage', 'days', 'level', 'rate', 'pct', 'percent', 'size', 'months', 'on_hand', 'nps',
];
const DATE_PARTS = new Set(['day', 'month', 'quarter', 'year', 'week_of_year']);

export function inferColumnType(col: string): QueryColumnType {
  const n = col.toLowerCase();
  if (n === 'id' || n.endsWith('_id')) return 'attribute';
  if (n.startsWith('is_') || n.startsWith('opt_in') || n.endsWith('_flag') || n.includes('bracket')) return 'attribute';
  if (n.includes('date') || n.endsWith('_at') || DATE_PARTS.has(n)) return 'date';
  if (MEASURE_WORDS.some(w => n.includes(w))) return 'measure';
  return 'attribute';
}

/** Averaged rather than summed — a total of ratings or percentages means nothing. */
function averagedMeasure(col: string): boolean {
  const n = col.toLowerCase();
  return ['rating', 'score', 'pct', 'percent', 'rate', 'price', 'nps'].some(w => n.includes(w));
}

// ─── Which columns are in the model ──────────────────────────────────────────

function isConnected(tables: string[], joins: QueryModelInput['joins']): boolean {
  if (tables.length <= 1) return true;
  const adj = new Map<string, string[]>();
  tables.forEach(t => adj.set(t, []));
  joins.forEach(j => {
    adj.get(j.leftTable)?.push(j.rightTable);
    adj.get(j.rightTable)?.push(j.leftTable);
  });
  const seen = new Set<string>([tables[0]]);
  const stack = [tables[0]];
  while (stack.length) {
    const t = stack.pop()!;
    for (const n of adj.get(t) ?? []) if (!seen.has(n)) { seen.add(n); stack.push(n); }
  }
  return tables.every(t => seen.has(t));
}

/** Same readiness rule the Spreadsheet uses for its model view. */
export function queryModelStatus(m: QueryModelInput): 'no-tables' | 'not-joined' | 'ready' {
  if (m.tables.length === 0) return 'no-tables';
  if (!isConnected(m.tables.map(t => t.name), m.joins)) return 'not-joined';
  return 'ready';
}

/** Columns added to the model, from tables that take part in the model —
 * with 2+ tables only joined tables contribute (the Spreadsheet's rule). */
export function buildQueryModelColumns(m: QueryModelInput): QueryModelColumn[] {
  const tableNames = m.tables.map(t => t.name);
  const joined = new Set(m.joins.flatMap(j => [j.leftTable, j.rightTable]));
  const contributing = tableNames.length <= 1 ? tableNames : tableNames.filter(t => joined.has(t));
  const out: QueryModelColumn[] = [];
  contributing.forEach(t => {
    const source = m.dataSourceTables.find(s => s.name === t);
    const added = new Set(m.modelColumns.find(mc => mc.table === t)?.columns ?? []);
    (source?.columns ?? []).filter(c => added.has(c)).forEach(c => {
      out.push({ key: `${t}.${c}`, label: `${t}.${c}`, table: t, col: c, type: inferColumnType(c) });
    });
  });
  return out;
}

// ─── Sample values ───────────────────────────────────────────────────────────

const POOLS: Array<[string[], string[]]> = [
  [['region'], ['North America', 'EMEA', 'APAC', 'LATAM']],
  [['country'], ['United States', 'United Kingdom', 'Germany', 'India', 'Brazil', 'Japan']],
  [['state'], ['California', 'Texas', 'New York', 'Florida', 'Washington', 'Illinois']],
  [['city'], ['San Francisco', 'Austin', 'New York', 'Miami', 'Seattle', 'Chicago']],
  [['channel'], ['Online', 'In-store', 'Mobile app', 'Partner']],
  [['sub_category'], ['Smartphones', 'Laptops', 'Sofas', 'Chairs', 'Running shoes', 'Cookware']],
  [['category'], ['Electronics', 'Furniture', 'Apparel', 'Home & kitchen']],
  [['segment'], ['Enterprise', 'Mid-market', 'SMB', 'Consumer']],
  [['tier'], ['Gold', 'Silver', 'Bronze', 'Platinum']],
  [['status'], ['Active', 'Pending', 'Closed', 'Cancelled']],
  [['stage'], ['Prospecting', 'Qualified', 'Proposal', 'Negotiation', 'Closed won', 'Closed lost']],
  [['gender'], ['Female', 'Male', 'Non-binary']],
  [['payment'], ['Credit card', 'Debit card', 'Cash', 'Wallet']],
  [['carrier'], ['UPS', 'FedEx', 'DHL', 'USPS']],
  [['method'], ['Standard', 'Express', 'Next day', 'Pickup']],
  [['brand'], ['Northwind', 'Contoso', 'Fabrikam', 'Tailspin', 'Litware']],
  [['color'], ['Black', 'White', 'Blue', 'Red', 'Grey']],
  [['material'], ['Cotton', 'Leather', 'Steel', 'Oak', 'Plastic']],
  [['currency'], ['USD', 'EUR', 'GBP', 'INR']],
  [['language'], ['English', 'Spanish', 'German', 'Hindi']],
  [['zone', 'timezone'], ['PST', 'EST', 'GMT', 'IST']],
  [['occupation'], ['Engineer', 'Teacher', 'Designer', 'Nurse', 'Manager']],
  [['education'], ['High school', 'Bachelor’s', 'Master’s', 'Doctorate']],
  [['marital'], ['Single', 'Married', 'Divorced']],
  [['income', 'bracket'], ['Under 50k', '50k–100k', '100k–150k', 'Over 150k']],
  [['source', 'referral'], ['Search', 'Social', 'Referral', 'Email', 'Events']],
  [['reason'], ['Damaged', 'Wrong size', 'Changed mind', 'Late delivery']],
  [['product_name'], ['Galaxy S24', 'ThinkPad X1', 'Aeron chair', 'Air Zoom', 'Dutch oven', 'Oak sofa']],
  [['store_name'], ['Downtown', 'Airport', 'Mall of the West', 'Harbor Point', 'Uptown']],
  [['supplier_name'], ['Acme Supply', 'Globex', 'Initech', 'Umbrella Co']],
  [['method_name'], ['Standard', 'Express', 'Next day', 'Pickup']],
  [['first_name'], ['Ava', 'Liam', 'Noah', 'Mia', 'Zara', 'Arjun']],
  [['last_name'], ['Patel', 'Garcia', 'Nguyen', 'Smith', 'Kim', 'Okafor']],
  [['name'], ['Acme Corp', 'Globex', 'Initech', 'Umbrella Co', 'Stark Industries', 'Hooli']],
  [['comment'], ['Great product', 'Arrived late', 'Would buy again', 'Too expensive']],
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pick<T>(seed: number, options: T[]): T { return options[seed % options.length]; }

export function sampleValue(table: string, col: string, row: number): string | number {
  const n = col.toLowerCase();
  const seed = hash(`${table}.${col}#${row}`);
  const type = inferColumnType(col);

  if (n === 'id' || n.endsWith('_id')) {
    const prefix = n.replace(/_id$/, '').replace(/^id$/, table.replace(/^(dim_|fact_)/, '')).slice(0, 4).toUpperCase();
    // Entities repeat across rows (many sales per customer), so ids do too.
    return `${prefix}-${String((seed % 40) + 1).padStart(3, '0')}`;
  }
  if (n.startsWith('is_') || n.startsWith('opt_in') || n.endsWith('_flag') || n.endsWith('_available')) return pick(seed, ['Yes', 'No']);
  if (n.includes('email')) return `user${(seed % 90) + 10}@example.com`;
  if (n.includes('phone')) return `+1 555 ${String(seed % 10000).padStart(4, '0')}`;
  if (n.includes('postal') || n.includes('zip')) return String(10000 + (seed % 89999));
  if (n.includes('sku') || n.includes('barcode') || n.includes('promo')) return `${n.slice(0, 3).toUpperCase()}-${seed % 9000 + 1000}`;

  if (type === 'date') {
    if (n === 'year') return pick(seed, [2024, 2025]);
    if (n === 'quarter') return pick(seed, ['Q1', 'Q2', 'Q3', 'Q4']);
    if (n === 'month') return pick(seed, MONTHS);
    if (n === 'week_of_year') return (seed % 52) + 1;
    if (n === 'day') return (seed % 28) + 1;
    const month = (seed % 12) + 1, day = (seed % 28) + 1, year = 2024 + (seed % 2);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  if (type === 'measure') {
    const r = (seed % 10000) / 10000;
    const round2 = (v: number) => Math.round(v * 100) / 100;
    if (n.includes('credit')) return Math.round(550 + r * 300);
    if (n.includes('rating')) return round2(1 + r * 4);
    if (n.includes('score') || n.includes('nps')) return Math.round(r * 100);
    if (n.includes('pct') || n.includes('percent') || n.includes('margin_pct') || n.includes('rate')) return round2(r * 40);
    if (n.includes('discount')) return round2(r * 0.3);
    if (n.includes('points')) return Math.round(r * 5000);
    if (n.includes('days')) return Math.round(1 + r * 13);
    if (n.includes('months')) return Math.round(6 + r * 30);
    if (n.includes('qty') || n.includes('quantity') || n.includes('count') || n.includes('on_hand') || n.includes('level') || n.includes('size')) return Math.round(1 + r * 49);
    if (n.includes('weight') || n.includes('length') || n.includes('width') || n.includes('height')) return round2(1 + r * 99);
    if (n.includes('footage')) return Math.round(2000 + r * 18000);
    if (n.includes('lifetime') || n.includes('deal') || n.includes('arr')) return round2(1000 + r * 99000);
    return round2(10 + r * 2490); // amounts, prices, costs, values, taxes
  }

  for (const [words, values] of POOLS) {
    if (words.some(w => n.includes(w))) return pick(seed, values);
  }
  // Unknown label column: a handful of values, so grouping by it still works.
  return `${col.replace(/_/g, ' ')} ${String.fromCharCode(65 + (seed % 6))}`;
}

export const QUERY_SAMPLE_ROWS = 120;

export function generateQueryRows(cols: QueryModelColumn[], count = QUERY_SAMPLE_ROWS): Row[] {
  return Array.from({ length: count }, (_, i) => {
    const row: Row = {};
    cols.forEach(c => { row[c.key] = sampleValue(c.table, c.col, i); });
    return row;
  });
}

// ─── Formulas ────────────────────────────────────────────────────────────────
// Model formulas are aggregate expressions ("SUM(t.a) / COUNT(DISTINCT t.b)").
// Each aggregate call is worked out over a group's rows, then the remaining
// arithmetic is evaluated by a tiny parser — no eval. Anything it can't read
// comes out blank rather than as a made-up number.

const REF = /([A-Za-z_][\w]*\.[A-Za-z_][\w]*)/;

function refValue(rows: Row[], ref: string, rowIndexOffset = 0): number[] {
  const [table, col] = ref.split('.');
  return rows.map((r, i) => {
    const v = r[ref] ?? sampleValue(table, col, Number(r.__row ?? i + rowIndexOffset));
    return typeof v === 'number' ? v : Number.NaN;
  });
}

function aggregateCall(fn: string, arg: string, rows: Row[]): number {
  const distinct = /^DISTINCT\s+/i.test(arg);
  const ref = arg.replace(/^DISTINCT\s+/i, '').trim();
  const F = fn.toUpperCase();
  if (F === 'COUNT') {
    if (!REF.test(ref)) return rows.length;
    const [table, col] = ref.split('.');
    const vals = rows.map((r, i) => String(r[ref] ?? sampleValue(table, col, Number(r.__row ?? i))));
    return distinct ? new Set(vals).size : vals.length;
  }
  const nums = refValue(rows, ref).filter(v => !Number.isNaN(v));
  if (!nums.length) return Number.NaN;
  if (F === 'SUM') return nums.reduce((a, b) => a + b, 0);
  if (F === 'AVG' || F === 'AVERAGE') return nums.reduce((a, b) => a + b, 0) / nums.length;
  if (F === 'MIN') return Math.min(...nums);
  if (F === 'MAX') return Math.max(...nums);
  return Number.NaN;
}

// Recursive-descent arithmetic: numbers, + - * /, parentheses.
function evalArithmetic(src: string): number {
  let i = 0;
  const peek = () => src[i];
  const skip = () => { while (src[i] === ' ') i++; };
  const num = (): number => {
    skip();
    if (peek() === '(') { i++; const v = expr(); skip(); if (peek() === ')') i++; return v; }
    if (peek() === '-') { i++; return -num(); }
    const m = /^\d+(\.\d+)?/.exec(src.slice(i));
    if (!m) throw new Error('bad');
    i += m[0].length;
    return Number(m[0]);
  };
  const term = (): number => {
    let v = num();
    for (;;) { skip(); const c = peek(); if (c !== '*' && c !== '/') return v; i++; const r = num(); v = c === '*' ? v * r : v / r; }
  };
  const expr = (): number => {
    let v = term();
    for (;;) { skip(); const c = peek(); if (c !== '+' && c !== '-') return v; i++; const r = term(); v = c === '+' ? v + r : v - r; }
  };
  const v = expr();
  skip();
  if (i < src.length) throw new Error('bad');
  return v;
}

export function evaluateFormula(expression: string, rows: Row[]): number | null {
  try {
    let src = expression.replace(/\b(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\s*\(([^()]*)\)/gi, (_, fn: string, arg: string) => {
      const v = aggregateCall(fn, arg.trim(), rows);
      return Number.isNaN(v) ? 'NaN' : `(${v})`;
    });
    // A bare column reference outside an aggregate is summed.
    src = src.replace(new RegExp(REF.source, 'g'), ref => `(${aggregateCall('SUM', ref, rows)})`);
    if (/NaN/.test(src)) return null;
    const v = evalArithmetic(src.trim());
    return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
  } catch {
    return null;
  }
}

// ─── Answers ─────────────────────────────────────────────────────────────────

export interface ModelAnswerQuery {
  metrics: string[];   // column keys or formula names
  groupBy: string[];   // column keys
  sorts: { col: string; dir: 'asc' | 'desc' }[];
}

/** Groups the sample rows by the chosen label/date columns and totals the
 * chosen measures and formulas per group — what a search answer shows. No
 * measure: the distinct combinations. No label: a single totals row. */
export function buildModelAnswer(
  q: ModelAnswerQuery,
  rows: Row[],
  formulas: { name: string; expression: string }[],
): Array<Record<string, string | number | null> & { label: string }> {
  const formulaByName = new Map(formulas.map(f => [f.name, f.expression]));
  const withIndex: Row[] = rows.map((r, i) => ({ ...r, __row: i }));
  const groups = new Map<string, Row[]>();
  withIndex.forEach(r => {
    const key = q.groupBy.length ? q.groupBy.map(d => String(r[d] ?? '—')).join(' / ') : 'Total';
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(r);
  });

  let out = [...groups.entries()].map(([label, gRows]) => {
    const rec: Record<string, string | number | null> & { label: string } = { label };
    q.groupBy.forEach(d => { rec[d] = gRows[0][d] ?? '—'; });
    q.metrics.forEach(m => {
      const expr = formulaByName.get(m);
      if (expr !== undefined) { rec[m] = evaluateFormula(expr, gRows); return; }
      const col = m.split('.').pop() ?? m;
      const vals = gRows.map(r => Number(r[m])).filter(v => !Number.isNaN(v));
      const sum = vals.reduce((a, b) => a + b, 0);
      rec[m] = vals.length ? Math.round((averagedMeasure(col) ? sum / vals.length : sum) * 100) / 100 : null;
    });
    return rec;
  });

  if (q.sorts.length) {
    for (const s of q.sorts) {
      out.sort((a, b) => {
        const av = a[s.col], bv = b[s.col];
        const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return s.dir === 'desc' ? -cmp : cmp;
      });
    }
  } else if (q.groupBy.length) {
    // Label order for readability (dates read chronologically as strings).
    out = out.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }
  return out;
}
