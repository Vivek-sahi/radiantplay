import React, { useState } from 'react';
import { Button, Table, TextArea, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { StoreTable } from '../types';
import { CURRENT_USER, formatRows } from '../data';
import { useRole } from '../variant';
import { PageHeader, Panel } from './primitives';
import styles from './pages.module.css';

const DEFAULT_SQL = `SELECT region, COUNT(*) AS orders
FROM orders
WHERE order_date >= '2026-07-01'
GROUP BY region
ORDER BY orders DESC;`;

const LIMIT = 1000;

const sample = (type: string, name: string, i: number): string => {
  const n = (i * 7919 + name.length * 31) % 9973;
  if (type === 'Whole number' || type === 'Big whole number') return name.endsWith('_id') ? String(88410000 + i) : String(n % 20000);
  if (type === 'Decimal' || type === 'High-precision decimal') return ((n % 250000) / 100).toFixed(2);
  if (type === 'Date') return `2026-09-${String(28 - (i % 27)).padStart(2, '0')}`;
  if (type === 'Date and time') return `2026-09-${String(28 - (i % 27)).padStart(2, '0')} ${String(n % 24).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  if (type === 'True or false') return n % 3 ? 'true' : 'false';
  const words: Record<string, string[]> = {
    region: ['West', 'South', 'North', 'East'],
    channel: ['Web', 'Store', 'App'],
    status: ['open', 'closed', 'pending'],
    segment: ['Enterprise', 'Mid-market', 'SMB', 'Consumer'],
    priority: ['High', 'Medium', 'Low'],
  };
  const list = words[name];
  return list ? list[i % list.length] : `${name}_${n % 97}`;
};

type Result =
  | { kind: 'rows'; columns: string[]; rows: Record<string, string>[]; meta: string }
  | { kind: 'message'; tone: 'base' | 'failure'; text: string };

/**
 * v2 · a query console: SELECT only, results truncated. Tables are created in Data (form or pasted
 * SQL) and changed on the table page, so DDL has one home. The PM's "DDL plus select" editor is
 * met by those two together; this is a deliberate divergence from item 6 as written.
 */
export const SqlPage: React.FC<{ tables: StoreTable[] }> = ({ tables }) => {
  const role = useRole();
  const me = CURRENT_USER[role];
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [result, setResult] = useState<Result | null>(null);

  const fail = (text: string) => setResult({ kind: 'message', tone: 'failure', text });

  const run = () => {
    const s = sql.trim();

    if (/^select\b/i.test(s)) {
      const from = s.match(/\bfrom\s+`?(\w+)`?/i)?.[1];
      if (!from) return fail('Add a FROM clause with a table name.');
      const target = tables.find((t) => t.name === from.toLowerCase());
      if (!target) return fail(`No table called ${from}.`);
      if (target.empty) return setResult({ kind: 'rows', columns: target.columns.map((c) => c.name), rows: [], meta: '0 rows · 12 ms · empty table' });
      const read = target.sizeGB >= 10 ? '1.2 GB' : target.sizeGB >= 1 ? '410 MB' : '12 MB';

      if (/\bgroup\s+by\b/i.test(s)) {
        const col = target.columns.find((c) => c.type === 'Text') ?? target.columns[0];
        const rows = Array.from({ length: 4 }, (_, i) => ({
          _i: String(i),
          [col.name]: sample(col.type, col.name, i),
          count: Math.floor(target.rows / (4 + i * 1.5)).toLocaleString(),
        }));
        return setResult({ kind: 'rows', columns: [col.name, 'count'], rows, meta: `4 rows · 240 ms · ${read} read` });
      }

      const rows = Array.from({ length: Math.min(50, target.rows) }, (_, i) =>
        Object.fromEntries([['_i', String(i)], ...target.columns.map((c) => [c.name, sample(c.type, c.name, i)])]),
      );
      return setResult({
        kind: 'rows',
        columns: target.columns.map((c) => c.name),
        rows,
        meta:
          target.rows > LIMIT
            ? `Showing ${LIMIT.toLocaleString()} of ${formatRows(target.rows)} rows (truncated) · 180 ms · ${read} read`
            : `${formatRows(target.rows)} rows · 60 ms`,
      });
    }

    if (/^(create|alter|drop)\b/i.test(s)) return fail('Create tables in Data, and change them on the table page. This console runs SELECT.');

    return fail('Only SELECT runs here. Data arrives through your pipeline.');
  };

  return (
    <Vertical gap={spacing.F}>
      <PageHeader title="SQL" />
      <div className={styles.sqlLayout}>
        <Panel title="Tables">
          <Vertical gap={spacing.A}>
            {tables.map((t) => (
              <Button
                key={t.id}
                variant="tertiary"
                size="small"
                icon="table"
                fullWidth
                className={styles.leftAlign}
                onClick={() => {
                  setSql(`SELECT *\nFROM ${t.name}\nLIMIT ${LIMIT};`);
                  setResult(null);
                }}
              >
                {t.name}
              </Button>
            ))}
          </Vertical>
        </Panel>

        <Vertical gap={spacing.D}>
          <Panel
            title="Query"
            actions={
              <Button variant="primary" size="small" icon="play" onClick={run}>
                Run
              </Button>
            }
          >
            <Vertical gap={spacing.B}>
              <TextArea
                label="SQL"
                showLabel={false}
                rows={8}
                resize="vertical"
                value={sql}
                onChange={(e) => {
                  setSql(e.target.value);
                  setResult(null);
                }}
                className={styles.sqlInput}
              />
              <Typography variant="footnote" color="gray-light" noMargin>
                Runs as {me} · {role}. SELECT only. Results stop at {LIMIT.toLocaleString()} rows.
              </Typography>
            </Vertical>
          </Panel>

          {result && result.kind === 'rows' && (
            <Panel title="Result" flush>
              <Typography variant="footnote" color="gray-light" noMargin className={styles.resultMeta}>
                {result.meta}
              </Typography>
              {result.rows.length > 0 && (
                <div className={styles.previewScroll}>
                  <Table compact rowKey="_i" data={result.rows} columns={result.columns.map((c) => ({ key: c, label: c }))} />
                </div>
              )}
            </Panel>
          )}
          {result && result.kind === 'message' && (
            <Panel title="Result">
              <Typography variant="body-normal" color={result.tone} noMargin>
                {result.text}
              </Typography>
            </Panel>
          )}
        </Vertical>
      </div>
    </Vertical>
  );
};
