import React, { useMemo, useState } from 'react';
import { Horizontal, Select, Table, Tooltip, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { QueryRecord, StoreTable } from '../types';
import { formatMs, QUERIES, QUERY_STATS } from '../data';
import { PageHeader, Panel, StatTile, StatusPill } from './primitives';
import styles from './pages.module.css';

const STATUS_FILTER = [
  { id: 'all', label: 'All statuses' },
  { id: 'Completed', label: 'Completed' },
  { id: 'In progress', label: 'In progress' },
  { id: 'Failed', label: 'Failed' },
];

const PILL: Record<QueryRecord['status'], 'success' | 'info' | 'failure'> = {
  Completed: 'success',
  'In progress': 'info',
  Failed: 'failure',
};

/**
 * The whole of V1 observability (7 Oct): what the database records about each query —
 * who sent it, the SQL, the tables it touched, how long it took, and whether it finished.
 */
export const QueriesPage: React.FC<{ tables: StoreTable[] }> = ({ tables }) => {
  const [table, setTable] = useState('all');
  const [status, setStatus] = useState('all');

  const tableOptions = useMemo(() => {
    const known = tables.map((t) => t.name);
    const seen = new Set([...known, ...QUERIES.flatMap((q) => q.tables)]);
    return [{ id: 'all', label: 'All tables' }, ...[...seen].sort().map((n) => ({ id: n, label: n }))];
  }, [tables]);

  const rows = useMemo(
    () => QUERIES.filter((q) => (table === 'all' || q.tables.includes(table)) && (status === 'all' || q.status === status)),
    [table, status],
  );

  return (
    <Vertical gap={spacing.F}>
      <PageHeader title="Queries" />

      <div className={styles.tiles}>
        <StatTile label="Completed" value={QUERY_STATS.completed24h} note="Last 24 hours" tone="success" />
        <StatTile label="In progress" value={String(QUERY_STATS.inProgress)} note="Right now" tone="info" />
        <StatTile label="Failed" value={QUERY_STATS.failed24h} note="Last 24 hours" tone="failure" />
      </div>

      <Panel title="Recent queries" flush>
        <Horizontal gap={spacing.C} className={styles.filters}>
          <Select size="basic" options={tableOptions} value={table} onChange={(v) => setTable(v)} />
          <Select size="basic" options={STATUS_FILTER} value={status} onChange={(v) => setStatus(v)} />
        </Horizontal>
        <Table
          compact
          rowKey="id"
          data={rows as unknown as Record<string, unknown>[]}
          emptyMessage="No queries match these filters"
          columns={[
            { key: 'time', label: 'Time', width: '96px', render: (v) => <span className={styles.num}>{String(v)}</span> },
            { key: 'summary', label: 'Query', render: (v) => <code className={styles.mono}>{String(v)}</code> },
            {
              key: 'tables',
              label: 'Tables',
              render: (v) => (
                <Vertical gap={0}>
                  {(v as string[]).map((n) => (
                    <Typography key={n} variant="footnote" color="base" noMargin>
                      {n}
                    </Typography>
                  ))}
                </Vertical>
              ),
            },
            {
              key: 'durationMs',
              label: 'Duration',
              align: 'right',
              render: (v, r) => ((r as unknown as QueryRecord).status === 'In progress' ? '—' : formatMs(v as number)),
            },
            {
              key: 'status',
              label: 'Status',
              render: (_v, r) => {
                const q = r as unknown as QueryRecord;
                const pill = (
                  <span>
                    <StatusPill kind={PILL[q.status]} label={q.status} />
                  </span>
                );
                return q.note ? <Tooltip content={q.note}>{pill}</Tooltip> : pill;
              },
            },
          ]}
        />
      </Panel>
    </Vertical>
  );
};
