import { Column, Database, DbObject, ObjectKind, Role } from './types';
import { formatRows, KIND_LABEL, sampleValue } from './data';
import { parseSql } from '../tableSchema';

/**
 * The prototype's stand-in for AgentDB: reads a statement and answers from the sample data.
 * Nothing runs anywhere. Moved out of the SQL page (26 Oct) so every query tab shares it.
 */

export const LIMIT = 1000;

export type SqlResult =
  | { kind: 'rows'; columns: string[]; rows: Record<string, string>[]; meta: string }
  | { kind: 'message'; ok: boolean; text: string; line?: number; created?: { id: string; database: string; name: string } };

export interface SqlContext {
  /** The database picked in the catalog. Null = all databases: names resolve across them. */
  database: string | null;
  databases: Database[];
  objects: DbObject[];
  role: Role;
  me: string;
  limit: boolean;
  onCreateObject: (o: DbObject) => void;
  onAddColumn: (id: string, col: Column) => void;
  onDropObject: (id: string) => void;
  onTruncate: (id: string) => void;
}

export const executeSql = (input: string, ctx: SqlContext): SqlResult => {
  const { database, databases, objects, role, me } = ctx;
  const s = input.trim().replace(/;\s*$/, '');
  const fail = (text: string): SqlResult => ({ kind: 'message', ok: false, text });
  const ok = (text: string): SqlResult => ({ kind: 'message', ok: true, text });
  const rowsResult = (columns: string[], rows: Record<string, string>[], meta: string): SqlResult => ({ kind: 'rows', columns, rows, meta });

  // A bare name resolves in the catalog's database; with all databases, in whichever one has it.
  let ambiguous = '';
  const find = (ref: string): DbObject | undefined => {
    ambiguous = '';
    const parts = ref.replace(/`/g, '').split('.');
    const name = parts.pop()!.toLowerCase();
    const db = parts.pop()?.toLowerCase() ?? database;
    if (db) return objects.find((o) => o.database === db && o.name === name);
    const hits = objects.filter((o) => o.name === name);
    if (hits.length > 1) ambiguous = `${name} is in ${hits.length} databases. Write ${hits[0].database}.${name}.`;
    return hits.length === 1 ? hits[0] : undefined;
  };
  const where = database ?? 'any database';
  const missing = (ref: string, what = 'table') => fail(ambiguous || `No ${what} called ${ref} in ${where}.`);
  const qualify = (ref: string): [string | null, string] => {
    const parts = ref.replace(/`/g, '').split('.');
    const name = parts.pop()!.toLowerCase();
    return [parts.pop()?.toLowerCase() ?? database, name];
  };
  const readFor = (o: DbObject) => (o.sizeGB >= 10 ? '1.2 GB read' : o.sizeGB >= 1 ? '410 MB read' : '12 MB read');

  if (!s) return fail('Nothing to run.');
  const isRead = /^(select|with|show|describe|desc|explain)\b/i.test(s);
  if (role === 'Viewer' && !isRead) return fail('Refused: Viewers can read only.');

  if (/^create\s+table\b/i.test(s)) {
    const p = parseSql(s);
    if (!p.tableName) return fail('Could not read the table name.');
    if (p.errors.length) return fail(p.errors.join('. ') + '.');
    const db = p.database ?? database;
    if (!db) return fail(`Pick a database in the catalog, or write it in the name: ${databases[0]?.id ?? 'db'}.${p.tableName}.`);
    if (!databases.some((d) => d.id === db)) return fail(`No database called ${db}.`);
    if (objects.some((o) => o.database === db && o.name === p.tableName)) return fail(`${p.tableName} already exists in ${db}.`);
    if (!p.columns.length) return fail('Add at least one column.');
    const id = `o_${Date.now()}`;
    ctx.onCreateObject({
      id, database: db, name: p.tableName, kind: 'table',
      columns: p.columns.map((c) => ({ name: c.name, type: c.type })),
      rows: 0, sizeGB: 0, lastUpdated: '—', createdBy: me, createdOn: 'Today',
    });
    // A new table's next job is getting data into it: the result offers the way there (Vivek, 20 Oct).
    return { kind: 'message', ok: true, text: `Table ${p.tableName} created in ${db}.`, created: { id, database: db, name: p.tableName } };
  }

  if (/^create\s+(materialized\s+)?view\b/i.test(s)) {
    const m = s.match(/^create\s+(materialized\s+)?view\s+(?:if\s+not\s+exists\s+)?([`\w.]+)[\s\S]*?\bas\s+(select[\s\S]*)$/i);
    if (!m) return fail('Could not read the view.');
    const kind: ObjectKind = m[1] ? 'materialized view' : 'view';
    const def = m[3].trim();
    const fromRef = def.match(/\bfrom\s+([`\w.]+)/i)?.[1];
    const base = fromRef ? find(fromRef) : undefined;
    if (!base) return missing(fromRef ?? '?');
    const [dbRef, name] = qualify(m[2]);
    const db = dbRef ?? base.database;
    if (objects.some((o) => o.database === db && o.name === name)) return fail(`${name} already exists in ${db}.`);
    const list = def.match(/^select\s+([\s\S]*?)\s+from\b/i)?.[1]?.trim() ?? '*';
    const columns: Column[] =
      list === '*'
        ? base.columns
        : list.split(',').map((part) => {
            const alias = part.match(/\bas\s+`?(\w+)`?\s*$/i)?.[1];
            const bare = part.trim().match(/^`?(\w+)`?$/)?.[1];
            const colName = (alias ?? bare ?? part.trim().replace(/\W+/g, '_')).toLowerCase();
            const baseCol = base.columns.find((c) => c.name === bare);
            return { name: colName, type: baseCol?.type ?? (/\b(sum|avg)\s*\(/i.test(part) ? 'Decimal' : /\bcount\s*\(/i.test(part) ? 'Whole number' : 'Text') };
          });
    ctx.onCreateObject({
      id: `o_${Date.now()}`, database: db, name, kind, columns,
      rows: kind === 'view' ? 0 : Math.round(base.rows / 10), sizeGB: kind === 'view' ? 0 : Math.round((base.sizeGB / 20) * 10) / 10,
      lastUpdated: kind === 'view' ? '—' : 'Just now', createdBy: me, createdOn: 'Today',
      definition: def, refresh: kind === 'materialized view' ? 'Every hour' : undefined,
    });
    return ok(`${KIND_LABEL[kind]} ${name} created in ${db}.`);
  }

  if (/^alter\s+table\b/i.test(s)) {
    const m = s.match(/^alter\s+table\s+([`\w.]+)\s+add\s+(?:column\s+)?`?(\w+)`?\s+([A-Za-z]+(?:\s*\([^)]*\))?)/i);
    if (!m) return fail('Only ADD COLUMN is supported.');
    const o = find(m[1]);
    if (!o) return missing(m[1]);
    if (o.kind !== 'table') return fail(`${o.name} is a ${KIND_LABEL[o.kind].toLowerCase()}.`);
    if (o.columns.some((c) => c.name === m[2].toLowerCase())) return fail(`${o.name} already has a column ${m[2]}.`);
    const parsed = parseSql(`CREATE TABLE x (${m[2]} ${m[3]})`);
    if (!parsed.columns.length) return fail(`Type ${m[3]} isn't supported yet.`);
    ctx.onAddColumn(o.id, { name: m[2].toLowerCase(), type: parsed.columns[0].type });
    return ok(`Column ${m[2]} added to ${o.name}.`);
  }

  if (/^drop\s+(table|view|materialized\s+view)\b/i.test(s)) {
    const m = s.match(/^drop\s+(?:table|view|materialized\s+view)\s+(?:if\s+exists\s+)?([`\w.]+)/i);
    const o = m ? find(m[1]) : undefined;
    if (!o) return missing(m?.[1] ?? '?', 'object');
    ctx.onDropObject(o.id);
    return ok(`${KIND_LABEL[o.kind]} ${o.name} deleted.`);
  }

  if (/^truncate\s+table\b/i.test(s)) {
    const m = s.match(/^truncate\s+table\s+([`\w.]+)/i);
    const o = m ? find(m[1]) : undefined;
    if (!o) return missing(m?.[1] ?? '?');
    if (o.kind !== 'table') return fail(`${o.name} is a ${KIND_LABEL[o.kind].toLowerCase()}.`);
    ctx.onTruncate(o.id);
    return ok(`${o.name} emptied.`);
  }

  if (/^insert\b/i.test(s)) {
    const m = s.match(/^insert\s+(?:into|overwrite\s+table)\s+([`\w.]+)/i);
    const o = m ? find(m[1]) : undefined;
    if (!o) return missing(m?.[1] ?? '?');
    return ok(`Rows written to ${o.name}.`);
  }

  if (/^show\s+tables\b/i.test(s)) {
    const inDb = objects.filter((o) => !database || o.database === database);
    return rowsResult(
      ['name', 'kind'],
      inDb.map((o) => ({ _i: o.id, name: o.name, kind: KIND_LABEL[o.kind] })),
      `${inDb.length} ${inDb.length === 1 ? 'object' : 'objects'} in ${where} · 4 ms`,
    );
  }

  if (/^(describe|desc)\s+/i.test(s)) {
    const m = s.match(/^(?:describe|desc)\s+([`\w.]+)/i);
    const o = m ? find(m[1]) : undefined;
    if (!o) return missing(m?.[1] ?? '?');
    return rowsResult(['column', 'type'], o.columns.map((c) => ({ _i: c.name, column: c.name, type: c.type })), `${o.columns.length} columns · 3 ms`);
  }

  if (/^(select|with)\b/i.test(s)) {
    const fromRef = s.match(/\bfrom\s+([`\w.]+)/i)?.[1];
    if (!fromRef) return fail('Add a FROM clause with a table name.');
    const o = find(fromRef);
    if (!o) return missing(fromRef);
    const cols = o.columns.map((c) => c.name);
    if (o.kind === 'table' && o.rows === 0) return rowsResult(cols, [], '0 rows · 8 ms · nothing loaded yet');
    if (/count\(\*\)/i.test(s) && !/\bgroup\s+by\b/i.test(s)) {
      return rowsResult(['count'], [{ _i: '0', count: (o.rows || 1_300_000).toLocaleString() }], `1 row · 95 ms · ${readFor(o)}`);
    }
    if (/\bgroup\s+by\b/i.test(s)) {
      const col = o.columns.find((c) => c.type === 'Text') ?? o.columns[0];
      const rows = Array.from({ length: 4 }, (_, i) => ({
        _i: String(i),
        [col.name]: sampleValue(col.type, col.name, i),
        count: Math.floor((o.rows || 1_300_000) / (4 + i * 1.5)).toLocaleString(),
      }));
      return rowsResult([col.name, 'count'], rows, `4 rows · 240 ms · ${readFor(o)}`);
    }
    const asked = Number(s.match(/\blimit\s+(\d+)/i)?.[1] ?? NaN);
    const rows = Array.from({ length: Math.min(50, o.rows || 50, asked || 50) }, (_, i) =>
      Object.fromEntries([['_i', String(i)], ...o.columns.map((c) => [c.name, sampleValue(c.type, c.name, i)])]),
    );
    const total = o.rows || 1_300_000;
    const cap = asked || (ctx.limit ? LIMIT : Infinity);
    return rowsResult(
      cols,
      rows,
      total > cap ? `Showing ${cap.toLocaleString()} of ${formatRows(total)} rows · 180 ms · ${readFor(o)}` : `${formatRows(total)} rows · 60 ms · ${readFor(o)}`,
    );
  }

  const first = s.split(/\s+/)[0];
  return fail(`Could not read a statement starting with "${first}".`);
};

/** Statements in a script, with where each starts, so a run can name the failing line. */
export const splitStatements = (sql: string): { text: string; start: number; end: number }[] => {
  const out: { text: string; start: number; end: number }[] = [];
  let start = 0;
  for (let i = 0; i <= sql.length; i++) {
    if (i === sql.length || sql[i] === ';') {
      const text = sql.slice(start, i);
      if (text.trim()) out.push({ text, start: start + (text.length - text.trimStart().length), end: i });
      start = i + 1;
    }
  }
  return out;
};

export const lineAt = (sql: string, offset: number) => sql.slice(0, offset).split('\n').length;

const KEYWORDS = ['select', 'from', 'where', 'group by', 'order by', 'having', 'limit', 'join', 'left join', 'inner join', 'on', 'and', 'or', 'as', 'create table', 'alter table', 'drop table', 'insert into', 'values', 'distinct', 'count', 'sum', 'avg', 'min', 'max', 'duplicate key', 'unique key', 'partition by', 'distributed by', 'buckets'];
const BREAK_BEFORE = /\s+(from|where|group by|order by|having|limit|left join|inner join|join)\b/gi;

/** Format SQL (editor ⋯ / toolbar): keywords in capitals, one clause per line. A stand-in, not a parser. */
export const formatSql = (sql: string): string =>
  splitStatements(sql)
    .map(({ text }) => {
      let t = text.trim().replace(/\s+/g, ' ');
      for (const k of KEYWORDS) t = t.replace(new RegExp(`\\b${k.replace(' ', '\\s+')}\\b`, 'gi'), k.toUpperCase());
      return t.replace(BREAK_BEFORE, (_m, k: string) => `\n${k.toUpperCase()}`) + ';';
    })
    .join('\n\n');

/** Keywords in capitals or small letters (Format ▾). Words inside quotes are left alone. */
export const keywordCase = (sql: string, upper: boolean): string =>
  sql.split(/('(?:[^']|'')*')/).map((part, i) => (i % 2 ? part : KEYWORDS.reduce((t, k) => t.replace(new RegExp(`\\b${k.replace(' ', '\\s+')}\\b`, 'gi'), (m) => (upper ? m.toUpperCase() : m.toLowerCase())), part))).join('');
