import React, { useMemo, useState } from 'react';
import { Button, Horizontal, Modal, ModalFooter, ProgressBar, Select, Table, Tooltip, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { QueryRecord, StoreTable } from '../types';
import { formatMs, QUERY_STATS } from '../data';
import { canStopQueries, useRole, useVariant } from '../variant';
import { CodeBlock, KeyValue, PageHeader, Panel, StatTile, StatusPill } from './primitives';
import styles from './pages.module.css';

const STATUS_FILTER = [
  { id: 'all', label: 'All statuses' },
  { id: 'Completed', label: 'Completed' },
  { id: 'In progress', label: 'In progress' },
  { id: 'Failed', label: 'Failed' },
];

const PILL: Record<QueryRecord['status'], 'success' | 'info' | 'failure' | 'warning'> = {
  Completed: 'success',
  'In progress': 'info',
  Failed: 'failure',
  Stopped: 'warning',
};

/**
 * The whole of V1 observability (7 Oct): what the database records about each query —
 * the SQL, the tables it touched, how long it took, and whether it finished.
 * v2 (PM plan items 12, 13): start and end, bytes read, a stop action, and a profile per query.
 */
export const QueriesPage: React.FC<{ tables: StoreTable[]; queries: QueryRecord[]; onStop: (id: string) => void }> = ({
  tables,
  queries,
  onStop,
}) => {
  const [table, setTable] = useState('all');
  const [status, setStatus] = useState('all');
  const [open, setOpen] = useState<QueryRecord | null>(null);
  const variant = useVariant();
  const role = useRole();
  const v2 = variant === 'v2';
  const canStop = canStopQueries(variant, role);

  const tableOptions = useMemo(() => {
    const known = tables.map((t) => t.name);
    const seen = new Set([...known, ...queries.flatMap((q) => q.tables)]);
    return [{ id: 'all', label: 'All tables' }, ...[...seen].sort().map((n) => ({ id: n, label: n }))];
  }, [tables, queries]);

  const statusOptions = v2 ? [...STATUS_FILTER, { id: 'Stopped', label: 'Stopped' }] : STATUS_FILTER;

  const rows = useMemo(
    () => queries.filter((q) => (table === 'all' || q.tables.includes(table)) && (status === 'all' || q.status === status)),
    [queries, table, status],
  );
  const inProgress = queries.filter((q) => q.status === 'In progress').length;

  const statusCell = (q: QueryRecord) => {
    const pill = (
      <span>
        <StatusPill kind={PILL[q.status]} label={q.status} />
      </span>
    );
    return q.note ? <Tooltip content={q.note}>{pill}</Tooltip> : pill;
  };

  const columns = [
    { key: 'time', label: v2 ? 'Started' : 'Time', width: '96px', render: (v: unknown) => <span className={styles.num}>{String(v)}</span> },
    ...(v2 ? [{ key: 'endedAt', label: 'Ended', width: '96px', render: (v: unknown) => <span className={styles.num}>{v ? String(v) : '—'}</span> }] : []),
    { key: 'summary', label: 'Query', render: (v: unknown) => <code className={styles.mono}>{String(v)}</code> },
    {
      key: 'tables',
      label: 'Tables',
      render: (v: unknown) => (
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
      align: 'right' as const,
      render: (v: unknown, r: Record<string, unknown>) => ((r as unknown as QueryRecord).status === 'In progress' ? '—' : formatMs(v as number)),
    },
    ...(v2 ? [{ key: 'bytesRead', label: 'Bytes read', align: 'right' as const, render: (v: unknown) => (v ? String(v) : '—') }] : []),
    { key: 'status', label: 'Status', render: (_v: unknown, r: Record<string, unknown>) => statusCell(r as unknown as QueryRecord) },
    ...(canStop
      ? [
          {
            key: 'id',
            label: '',
            width: '96px',
            render: (_v: unknown, r: Record<string, unknown>) => {
              const q = r as unknown as QueryRecord;
              return q.status === 'In progress' ? (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStop(q.id);
                  }}
                >
                  Stop
                </Button>
              ) : null;
            },
          },
        ]
      : []),
  ];

  return (
    <Vertical gap={spacing.F}>
      <PageHeader title="Queries" />

      <div className={styles.tiles}>
        <StatTile label="Completed" value={QUERY_STATS.completed24h} note="Last 24 hours" tone="success" />
        <StatTile label="In progress" value={String(inProgress)} note="Right now" tone="info" />
        <StatTile label="Failed" value={QUERY_STATS.failed24h} note="Last 24 hours" tone="failure" />
      </div>

      <Panel title="Recent queries" flush>
        <Horizontal gap={spacing.C} className={styles.filters}>
          <Select size="basic" options={tableOptions} value={table} onChange={(v) => setTable(v)} />
          <Select size="basic" options={statusOptions} value={status} onChange={(v) => setStatus(v)} />
        </Horizontal>
        <Table
          compact
          hoverable={v2}
          onRowClick={v2 ? (r) => setOpen(r as unknown as QueryRecord) : undefined}
          rowKey="id"
          data={rows as unknown as Record<string, unknown>[]}
          emptyMessage="No queries match these filters"
          columns={columns}
        />
      </Panel>

      {v2 && open && (
        <QueryProfile
          q={queries.find((x) => x.id === open.id) ?? open}
          canStop={canStop}
          onStop={() => onStop(open.id)}
          onClose={() => setOpen(null)}
        />
      )}
    </Vertical>
  );
};

/** PM plan item 12: surface the engine's own query profile — where the time went. */
const QueryProfile: React.FC<{ q: QueryRecord; canStop: boolean; onStop: () => void; onClose: () => void }> = ({ q, canStop, onStop, onClose }) => {
  const total = q.profile?.reduce((s, p) => s + p.ms, 0) ?? q.durationMs;
  const running = q.status === 'In progress';
  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Query"
      size="large"
      footer={
        <ModalFooter
          secondaryAction={running && canStop ? <Button variant="secondary" onClick={onStop}>Stop query</Button> : undefined}
          primaryAction={<Button variant="primary" onClick={onClose}>Close</Button>}
        />
      }
    >
      <Vertical gap={spacing.E}>
        <div className={styles.factGrid}>
          <KeyValue label="Status">
            <Horizontal gap={spacing.B}>
              <StatusPill kind={PILL[q.status]} label={q.status} />
              {q.note && (
                <Typography variant="footnote" color="gray-light" noMargin>
                  {q.note}
                </Typography>
              )}
            </Horizontal>
          </KeyValue>
          <KeyValue label="Run by">{q.who}</KeyValue>
          <KeyValue label="Started">{q.time}</KeyValue>
          <KeyValue label="Ended">{q.endedAt ?? '—'}</KeyValue>
          <KeyValue label="Duration">{running ? `${formatMs(total)} so far` : formatMs(q.durationMs)}</KeyValue>
          <KeyValue label="Bytes read">{q.bytesRead ?? '—'}</KeyValue>
          <KeyValue label="Rows returned">{q.resultRows === undefined ? '—' : q.resultRows.toLocaleString()}</KeyValue>
          <KeyValue label="Tables">{q.tables.join(', ')}</KeyValue>
        </div>

        <CodeBlock>{q.summary}</CodeBlock>

        {q.profile && q.profile.length > 0 && (
          <Vertical gap={spacing.B}>
            <Typography variant="content-label" color="base" noMargin>
              Where the time went
            </Typography>
            {q.profile.map((p) => (
              <Horizontal key={p.phase} gap={spacing.C} align="center">
                <Typography variant="body-normal" color="gray-light" noMargin className={styles.phaseLabel}>
                  {p.phase}
                </Typography>
                <div className={styles.grow}>
                  <ProgressBar value={p.ms} max={total} size="small" />
                </div>
                <Typography variant="body-normal" color="base" noMargin className={styles.phaseMs}>
                  {formatMs(p.ms)}
                </Typography>
              </Horizontal>
            ))}
          </Vertical>
        )}
      </Vertical>
    </Modal>
  );
};
