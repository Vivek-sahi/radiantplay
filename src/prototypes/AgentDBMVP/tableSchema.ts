// Create-table logic: plain-English types <-> SQL, parsing pasted SQL, generating the final statement.
// Ruled 28 Sep: SQL mode is equivalent to the form (structure only). Row behaviour is a separate,
// required step with no default — and if pasted SQL already states it, we read it and pre-fill.

// PRD Req 2: types come from a fixed list of 9, not every Doris type.
export const PLAIN_TYPES = [
  { id: 'Text', sql: 'VARCHAR(255)' },
  { id: 'Long text', sql: 'STRING' },
  { id: 'Whole number', sql: 'INT' },
  { id: 'Big whole number', sql: 'BIGINT' },
  { id: 'Decimal', sql: 'DECIMAL(18,2)' },
  { id: 'High-precision decimal', sql: 'DECIMAL(38,10)' },
  { id: 'Date', sql: 'DATE' },
  { id: 'Date and time', sql: 'DATETIME' },
  { id: 'True or false', sql: 'BOOLEAN' },
] as const;

export type PlainType = (typeof PLAIN_TYPES)[number]['id'];

/** PRD Req 3: a type can only change in the direction that lets the column hold more. */
export const WIDENS_TO: Partial<Record<PlainType, { to: PlainType; label: string }>> = {
  Text: { to: 'Long text', label: 'Allow longer text' },
  'Whole number': { to: 'Big whole number', label: 'Allow bigger numbers' },
  Decimal: { to: 'High-precision decimal', label: 'Allow more decimal places' },
};

export const isDateType = (t: string) => t === 'Date' || t === 'Date and time';

export interface DraftColumn {
  name: string;
  type: PlainType;
}

export type RowMode = 'replace' | 'add';

const toSql = (t: PlainType) => PLAIN_TYPES.find((p) => p.id === t)!.sql;

/** Map a SQL type (as a user might type it) to the nearest plain type. */
const toPlain = (sqlType: string): PlainType | null => {
  const t = sqlType.toUpperCase();
  if (/^(VARCHAR|CHAR)/.test(t)) return 'Text';
  if (/^(STRING|TEXT)/.test(t)) return 'Long text';
  if (/^(BIGINT|LARGEINT)/.test(t)) return 'Big whole number';
  if (/^(INT|INTEGER|SMALLINT|TINYINT)/.test(t)) return 'Whole number';
  const dec = t.match(/^(?:DECIMAL|NUMERIC)\s*\(\s*(\d+)/);
  if (dec) return Number(dec[1]) > 18 ? 'High-precision decimal' : 'Decimal';
  if (/^(DECIMAL|NUMERIC|DOUBLE|FLOAT)/.test(t)) return 'Decimal';
  if (/^DATETIME|^TIMESTAMP/.test(t)) return 'Date and time';
  if (/^DATE/.test(t)) return 'Date';
  if (/^(BOOLEAN|BOOL)/.test(t)) return 'True or false';
  return null;
};

export const columnsToSql = (cols: DraftColumn[]): string =>
  cols.filter((c) => c.name.trim()).map((c) => `${c.name.trim()} ${toSql(c.type)}`).join(',\n');

/** Split on commas that aren't inside parentheses, e.g. keep DECIMAL(12,2) together. */
const splitTopLevel = (s: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
};

export interface ParseResult {
  columns: DraftColumn[];
  errors: string[];
  /** Database and table name, if the SQL was a full CREATE TABLE */
  database?: string;
  tableName?: string;
  /** Row behaviour stated in the SQL, if any — pre-fills step 2 */
  rowMode?: RowMode;
  keyColumns?: string[];
  /** The clause we read the row behaviour from, shown to the user */
  keyClause?: string;
  /** Date column the SQL splits the table by (PARTITION BY RANGE on a date column) — pre-fills step 2 */
  splitBy?: string;
  /** Other table settings we found and will not use (AgentDB sets them) */
  ignored: string[];
}

export const parseSql = (input: string): ParseResult => {
  const res: ParseResult = { columns: [], errors: [], ignored: [] };
  let body = input.trim().replace(/;\s*$/, '');
  let tail = '';

  const create = body.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`\w.]+)\s*\(/i);
  if (create) {
    const qualified = create[1].replace(/`/g, '').split('.');
    res.tableName = qualified.pop()?.toLowerCase();
    res.database = qualified.pop()?.toLowerCase();
    // Find the parenthesis that closes the column list.
    const start = create[0].length;
    let depth = 1;
    let i = start;
    for (; i < body.length && depth > 0; i++) {
      if (body[i] === '(') depth++;
      if (body[i] === ')') depth--;
    }
    tail = body.slice(i);
    body = body.slice(start, i - 1);
  }

  for (const part of splitTopLevel(body)) {
    const pk = part.match(/^PRIMARY\s+KEY\s*\(([^)]*)\)/i);
    if (pk) {
      res.rowMode = 'replace';
      res.keyColumns = pk[1].split(',').map((s) => s.trim().replace(/`/g, ''));
      res.keyClause = part;
      continue;
    }
    if (/^(INDEX|KEY|CONSTRAINT)\b/i.test(part)) {
      res.ignored.push(part.split(/\s+/).slice(0, 2).join(' '));
      continue;
    }
    const m = part.match(/^`?(\w+)`?\s+([A-Za-z]+(?:\s*\([^)]*\))?)/);
    if (!m) {
      res.errors.push(`Couldn't read "${part.slice(0, 40)}"`);
      continue;
    }
    const plain = toPlain(m[2]);
    if (!plain) {
      res.errors.push(`${m[1]}: type ${m[2]} isn't supported yet`);
      continue;
    }
    res.columns.push({ name: m[1], type: plain });
  }

  const key = tail.match(/\b(UNIQUE|DUPLICATE|AGGREGATE)\s+KEY\s*\(([^)]*)\)/i);
  if (key) {
    const kind = key[1].toUpperCase();
    if (kind === 'AGGREGATE') {
      res.errors.push('Tables that store running totals (AGGREGATE KEY) aren’t supported yet');
    } else {
      res.rowMode = kind === 'UNIQUE' ? 'replace' : 'add';
      res.keyColumns = kind === 'UNIQUE' ? key[2].split(',').map((s) => s.trim().replace(/`/g, '')) : [];
      res.keyClause = key[0];
    }
  }
  if (/DISTRIBUTED\s+BY/i.test(tail)) res.ignored.push('DISTRIBUTED BY');
  const part = tail.match(/PARTITION\s+BY\s+RANGE\s*\(\s*(?:date_trunc\s*\(\s*)?`?(\w+)`?/i);
  if (part && res.columns.some((c) => c.name === part[1] && isDateType(c.type))) res.splitBy = part[1];
  else if (/PARTITION\s+BY/i.test(tail)) res.ignored.push('PARTITION BY');
  if (/PROPERTIES/i.test(tail)) res.ignored.push('PROPERTIES');

  if (!res.columns.length && !res.errors.length) res.errors.push('Add at least one column');
  return res;
};

/** The statement AgentDB will run: structure from step 1 + row behaviour from step 2. */
export const buildCreateSql = (
  database: string,
  name: string,
  cols: DraftColumn[],
  mode: RowMode,
  keys: string[],
  splitBy: string | null = null,
): { sql: string; reordered: string[] } => {
  const clean = cols.filter((c) => c.name.trim());
  // Doris needs the identifying columns first, in order. Move them if they aren't.
  const keyCols = mode === 'replace' ? keys.map((k) => clean.find((c) => c.name === k)!).filter(Boolean) : [];
  const ordered = mode === 'replace' ? [...keyCols, ...clean.filter((c) => !keys.includes(c.name))] : clean;
  const reordered = keyCols
    .filter((k, i) => clean.indexOf(k) !== i)
    .map((k) => k.name);
  const keyClause =
    mode === 'replace' ? `UNIQUE KEY (${keys.join(', ')})` : `DUPLICATE KEY (${ordered[0]?.name ?? ''})`;
  const dist = mode === 'replace' ? keys[0] : ordered[0]?.name;
  const partition = splitBy ? `\nAUTO PARTITION BY RANGE (date_trunc(${splitBy}, 'month')) ()` : '';
  const sql = `CREATE TABLE ${database}.${name} (\n${ordered
    .map((c) => `  ${c.name} ${toSql(c.type)}`)
    .join(',\n')}\n)\n${keyClause}${partition}\nDISTRIBUTED BY HASH(${dist}) BUCKETS AUTO;`;
  return { sql, reordered };
};
