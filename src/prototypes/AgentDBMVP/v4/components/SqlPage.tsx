import React, { useEffect, useRef, useState } from 'react';
import { Button, Horizontal, Icon, Select, Table, TextArea, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Column, Database, DbObject, ObjectKind, RecentRun, Role } from '../types';
import { formatGB, formatRows, KIND_LABEL, sampleValue } from '../data';
import { parseSql } from '../../tableSchema';
import { PageHeader } from '../../components/primitives';
import styles from '../v4.module.css';

const LIMIT = 1000;

type Result =
  | { kind: 'rows'; columns: string[]; rows: Record<string, string>[]; meta: string }
  | { kind: 'message'; ok: boolean; text: string };

/**
 * SQL: one editor for everything (Harviish, 14 Oct). Create and change tables, views and
 * materialised views; read with select; the output table below. The backend refuses what a
 * role may not run, and the console shows the refusal. Opens empty; starter statements later.
 * Two zones, editor and result, no box, no recent runs (Vivek, 19 Oct): the Queries page already
 * lists every statement anyone ran. No catalog tree (Vivek, 19 Oct): beside the editor it read as a second Data page and made the
 * page look like it was for querying only. The editor takes the full width; Data is where you browse.
 */
export const SqlPage: React.FC<{
  databases: Database[];
  objects: DbObject[];
  role: Role;
  me: string;
  prefill: { database: string; sql: string } | null;
  onConsumePrefill: () => void;
  recentRuns: RecentRun[];
  onRecordRun: (run: RecentRun) => void;
  onCreateObject: (o: DbObject) => void;
  onAddColumn: (id: string, col: Column) => void;
  onDropObject: (id: string) => void;
  onTruncate: (id: string) => void;
}> = ({ databases, objects, role, me, prefill, onConsumePrefill, onRecordRun, onCreateObject, onAddColumn, onDropObject, onTruncate }) => {
  const [database, setDatabase] = useState(prefill?.database ?? databases[0]?.id ?? '');
  const [sql, setSql] = useState(prefill?.sql ?? '');
  const [result, setResult] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (prefill) {
      setDatabase(prefill.database);
      setSql(prefill.sql);
      setResult(null);
      onConsumePrefill();
    }
  }, [prefill, onConsumePrefill]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const inDb = objects.filter((o) => o.database === database);
  const find = (ref: string): DbObject | undefined => {
    const parts = ref.replace(/`/g, '').split('.');
    const name = parts.pop()!.toLowerCase();
    const db = parts.pop()?.toLowerCase() ?? database;
    return objects.find((o) => o.database === db && o.name === name);
  };
  const qualify = (ref: string): [string, string] => {
    const parts = ref.replace(/`/g, '').split('.');
    const name = parts.pop()!.toLowerCase();
    return [parts.pop()?.toLowerCase() ?? database, name];
  };
  const readFor = (o: DbObject) => (o.sizeGB >= 10 ? '1.2 GB read' : o.sizeGB >= 1 ? '410 MB read' : '12 MB read');
  const fail = (text: string): Result => ({ kind: 'message', ok: false, text });
  const ok = (text: string): Result => ({ kind: 'message', ok: true, text });
  const rowsResult = (columns: string[], rows: Record<string, string>[], meta: string): Result => ({ kind: 'rows', columns, rows, meta });

  const execute = (input: string): Result => {
    const s = input.trim().replace(/;\s*$/, '');
    if (!s) return fail('Nothing to run.');
    const isRead = /^(select|with|show|describe|desc|explain)\b/i.test(s);
    if (role === 'Viewer' && !isRead) return fail('Refused: Viewers can read only.');

    if (/^create\s+table\b/i.test(s)) {
      const p = parseSql(s);
      if (!p.tableName) return fail('Could not read the table name.');
      if (p.errors.length) return fail(p.errors.join('. ') + '.');
      const db = p.database ?? database;
      if (!databases.some((d) => d.id === db)) return fail(`No database called ${db}.`);
      if (objects.some((o) => o.database === db && o.name === p.tableName)) return fail(`${p.tableName} already exists in ${db}.`);
      if (!p.columns.length) return fail('Add at least one column.');
      onCreateObject({
        id: `o_${Date.now()}`, database: db, name: p.tableName, kind: 'table',
        columns: p.columns.map((c) => ({ name: c.name, type: c.type })),
        rows: 0, sizeGB: 0, lastUpdated: '—', createdBy: me, createdOn: 'Today',
      });
      return ok(`Table ${p.tableName} created in ${db}.`);
    }

    if (/^create\s+(materialized\s+)?view\b/i.test(s)) {
      const m = s.match(/^create\s+(materialized\s+)?view\s+(?:if\s+not\s+exists\s+)?([`\w.]+)[\s\S]*?\bas\s+(select[\s\S]*)$/i);
      if (!m) return fail('Could not read the view.');
      const kind: ObjectKind = m[1] ? 'materialized view' : 'view';
      const [db, name] = qualify(m[2]);
      const def = m[3].trim();
      const fromRef = def.match(/\bfrom\s+([`\w.]+)/i)?.[1];
      const base = fromRef ? find(fromRef) : undefined;
      if (!base) return fail(`No table called ${fromRef ?? '?'} in ${db}.`);
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
      onCreateObject({
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
      if (!o) return fail(`No table called ${m[1]} in ${database}.`);
      if (o.kind !== 'table') return fail(`${o.name} is a ${KIND_LABEL[o.kind].toLowerCase()}.`);
      if (o.columns.some((c) => c.name === m[2].toLowerCase())) return fail(`${o.name} already has a column ${m[2]}.`);
      const parsed = parseSql(`CREATE TABLE x (${m[2]} ${m[3]})`);
      if (!parsed.columns.length) return fail(`Type ${m[3]} isn't supported yet.`);
      onAddColumn(o.id, { name: m[2].toLowerCase(), type: parsed.columns[0].type });
      return ok(`Column ${m[2]} added to ${o.name}.`);
    }

    if (/^drop\s+(table|view|materialized\s+view)\b/i.test(s)) {
      const m = s.match(/^drop\s+(?:table|view|materialized\s+view)\s+(?:if\s+exists\s+)?([`\w.]+)/i);
      const o = m ? find(m[1]) : undefined;
      if (!o) return fail(`No object called ${m?.[1] ?? '?'} in ${database}.`);
      onDropObject(o.id);
      return ok(`${KIND_LABEL[o.kind]} ${o.name} deleted.`);
    }

    if (/^truncate\s+table\b/i.test(s)) {
      const m = s.match(/^truncate\s+table\s+([`\w.]+)/i);
      const o = m ? find(m[1]) : undefined;
      if (!o) return fail(`No table called ${m?.[1] ?? '?'} in ${database}.`);
      if (o.kind !== 'table') return fail(`${o.name} is a ${KIND_LABEL[o.kind].toLowerCase()}.`);
      onTruncate(o.id);
      return ok(`${o.name} emptied.`);
    }

    if (/^insert\b/i.test(s)) {
      const m = s.match(/^insert\s+(?:into|overwrite\s+table)\s+([`\w.]+)/i);
      const o = m ? find(m[1]) : undefined;
      if (!o) return fail(`No table called ${m?.[1] ?? '?'} in ${database}.`);
      return ok(`Rows written to ${o.name}.`);
    }

    if (/^show\s+tables\b/i.test(s)) {
      return rowsResult(
        ['name', 'kind'],
        inDb.map((o) => ({ _i: o.id, name: o.name, kind: KIND_LABEL[o.kind] })),
        `${inDb.length} ${inDb.length === 1 ? 'object' : 'objects'} in ${database} · 4 ms`,
      );
    }

    if (/^(describe|desc)\s+/i.test(s)) {
      const m = s.match(/^(?:describe|desc)\s+([`\w.]+)/i);
      const o = m ? find(m[1]) : undefined;
      if (!o) return fail(`No table called ${m?.[1] ?? '?'} in ${database}.`);
      return rowsResult(['column', 'type'], o.columns.map((c) => ({ _i: c.name, column: c.name, type: c.type })), `${o.columns.length} columns · 3 ms`);
    }

    if (/^(select|with)\b/i.test(s)) {
      const fromRef = s.match(/\bfrom\s+([`\w.]+)/i)?.[1];
      if (!fromRef) return fail('Add a FROM clause with a table name.');
      const o = find(fromRef);
      if (!o) return fail(`No table called ${fromRef} in ${database}.`);
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
      const rows = Array.from({ length: Math.min(50, o.rows || 50) }, (_, i) =>
        Object.fromEntries([['_i', String(i)], ...o.columns.map((c) => [c.name, sampleValue(c.type, c.name, i)])]),
      );
      const total = o.rows || 1_300_000;
      return rowsResult(
        cols,
        rows,
        total > LIMIT ? `Showing ${LIMIT.toLocaleString()} of ${formatRows(total)} rows · 180 ms · ${readFor(o)}` : `${formatRows(total)} rows · 60 ms`,
      );
    }

    const first = s.split(/\s+/)[0];
    return fail(`Could not read a statement starting with "${first}".`);
  };

  const run = () => {
    if (!sql.trim() || running) return;
    setRunning(true);
    setResult(null);
    timer.current = window.setTimeout(() => {
      const r = execute(sql);
      setResult(r);
      setRunning(false);
      onRecordRun({
        id: `r_${Date.now()}`,
        sql,
        time: new Date().toTimeString().slice(0, 8),
        ok: r.kind === 'rows' || r.ok,
        summary: r.kind === 'rows' ? r.meta : r.text,
      });
    }, 700);
  };
  const stop = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setRunning(false);
    setResult({ kind: 'message', ok: false, text: 'Stopped.' });
  };

  const dbOptions = databases.map((d) => ({ id: d.id, label: d.name }));

  return (
    <Vertical gap={spacing.F} className={styles.page}>
      <PageHeader title="SQL" />

      {/* The editor zone: where to run, the statement, and the run controls. */}
      <Vertical gap={spacing.C}>
        <div className={styles.toolbar}>
          <div className={styles.runIn}>
            <Select size="small" options={dbOptions} value={database} onChange={(v) => setDatabase(v)} fullWidth aria-label="Run in database" />
          </div>
          <Horizontal gap={spacing.B} align="center">
            <Button
              variant="tertiary"
              onClick={() => {
                setSql('');
                setResult(null);
              }}
              disabled={running || !sql}
            >
              Clear
            </Button>
            {running ? (
              <Button variant="secondary" icon="pause" onClick={stop}>
                Stop
              </Button>
            ) : (
              <Button variant="primary" icon="play" onClick={run} disabled={!sql.trim()} title="Cmd+Enter">
                Run
              </Button>
            )}
          </Horizontal>
        </div>
        <TextArea
          label="SQL"
          showLabel={false}
          rows={14}
          resize="vertical"
          value={sql}
          placeholder="Write a statement and run it."
          onChange={(e) => {
            setSql(e.target.value);
            setResult(null);
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run();
          }}
          className={styles.editor}
        />
      </Vertical>

      {/* The results zone, below a full-width divider, with its own header. */}
      <Vertical gap={spacing.D} className={styles.resultsZone}>
        <Horizontal justify="space-between" align="center" gap={spacing.D}>
          <Typography variant="content-label" color="base" noMargin>
            Result
          </Typography>
          {!running && result?.kind === 'rows' && (
            <Typography variant="footnote" color="gray-light" noMargin>
              {result.meta}
            </Typography>
          )}
        </Horizontal>
        {running && (
          <Typography variant="body-normal" color="gray-light" noMargin>
            Running…
          </Typography>
        )}
        {!running && !result && (
          <Typography variant="body-normal" color="gray-light" noMargin>
            Run a statement to see its result here.
          </Typography>
        )}
        {!running && result?.kind === 'message' && (
          <div className={styles.message}>
            <Icon name={result.ok ? 'checkmark-circle' : 'exclamation-point-circle'} size="s" aria-hidden />
            <Typography variant="body-normal" color={result.ok ? 'base' : 'failure'} noMargin>
              {result.text}
            </Typography>
          </div>
        )}
        {!running && result?.kind === 'rows' && result.rows.length > 0 && (
          <div className={styles.scroll}>
            <Table compact rowKey="_i" data={result.rows} columns={result.columns.map((c) => ({ key: c, label: c }))} />
          </div>
        )}
      </Vertical>
    </Vertical>
  );
};

export const formatSize = formatGB;
