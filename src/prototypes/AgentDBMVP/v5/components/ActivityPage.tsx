import React, { useMemo, useState } from 'react';
import { Button, Horizontal, Modal, ModalFooter, NoData, ProgressBar, SegmentedControl, Select, Table, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { QueryRecord } from '../../types';
import { DbObject, LoadRecord, Role } from '../types';
import { formatMs, formatRows, logTime } from '../data';
import { KeyValue, PageHeader, StatusPill } from '../../components/primitives';
import { Metric } from './Metric';
import { CodeBlock, CopyField } from './CopyField';
import { COL } from '../layout';
import styles from '../v5.module.css';

type Kind = 'read' | 'write' | 'load';
type Status = 'Completed' | 'In progress' | 'Failed' | 'Stopped';

/** One row of the log. Every query is one of three types: a read, a write (create, change, insert), or a load. */
interface Row {
  id: string;
  kind: Kind;
  time: string;
  sort: number;
  user: string;
  text: string;
  tables: string[];
  durationMs: number;
  size: string;
  status: Status;
  error?: string;
  query?: QueryRecord;
  load?: LoadRecord;
}

const PILL: Record<Status, 'success' | 'info' | 'failure' | 'warning'> = {
  Completed: 'success',
  'In progress': 'info',
  Failed: 'failure',
  Stopped: 'warning',
};

/** Queries carry a clock time (today); loads carry "Today, 10:39" or "Yesterday, 09:14". One sort key for both. */
const sortKey = (time: string): number => {
  const day = time.startsWith('Yesterday') ? 0 : 1;
  const hm = time.match(/(\d{2}):(\d{2})/);
  return day * 10_000 + (hm ? Number(hm[1]) * 60 + Number(hm[2]) : 0);
};

/** A Doris-shaped query ID, deterministic per record, for the detail view and Cancel. */
const queryId = (id: string): string => {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hex = h.toString(16).padStart(8, '0');
  return `${hex}-4b2e-9c1d-${hex.slice(0, 4)}a7f3e2d1`;
};

/**
 * Queries (Vivek, 14 Oct: one page called Queries, every type in one list): everything the
 * database ran, newest first. Status before type (principle 1): status is the second column and
 * the first filter, because the two jobs here are finding the failed one and stopping the
 * runaway one. Cancel on a running query, by its ID.
 */
export const ActivityPage: React.FC<{
  queries: QueryRecord[];
  loads: LoadRecord[];
  objects: DbObject[];
  role: Role;
  queries24h: string;
  onStop: (id: string) => void;
  onOpenSql: (database: string, sql: string) => void;
}> = ({ queries, loads, objects, role, queries24h, onStop, onOpenSql }) => {
  const [kind, setKind] = useState('all');
  const [table, setTable] = useState('all');
  const [user, setUser] = useState('all');
  const [status, setStatus] = useState('all');
  const [open, setOpen] = useState<Row | null>(null);
  const canStop = role !== 'Viewer';

  const rows: Row[] = useMemo(() => {
    const q: Row[] = queries.map((x) => ({
      id: x.id,
      kind: /^(select|with|show|describe|desc|explain)\b/i.test(x.summary) ? 'read' : 'write',
      time: `Today, ${x.time.slice(0, 5)}`,
      sort: sortKey(`Today, ${x.time}`) + 0.5,
      user: x.who,
      text: x.summary,
      tables: x.tables,
      durationMs: x.durationMs,
      size: x.bytesRead ?? '—',
      status: x.status,
      error: x.note,
      query: x,
    }));
    const l: Row[] = loads.map((x) => ({
      id: x.id,
      kind: 'load',
      time: x.time,
      sort: sortKey(x.time),
      user: x.identity,
      text: `Load into ${x.table}`,
      tables: [x.table],
      durationMs: x.durationMs,
      size: x.bytes,
      status: x.status,
      error: x.error,
      load: x,
    }));
    return [...q, ...l].sort((a, b) => b.sort - a.sort);
  }, [queries, loads]);

  const tableOptions = useMemo(() => {
    const names = new Set([...objects.map((o) => o.name), ...rows.flatMap((r) => r.tables)]);
    return [{ id: 'all', label: 'All tables' }, ...[...names].sort().map((n) => ({ id: n, label: n }))];
  }, [objects, rows]);
  const userOptions = useMemo(
    () => [{ id: 'all', label: 'All users' }, ...[...new Set(rows.map((r) => r.user))].sort().map((u) => ({ id: u, label: u }))],
    [rows],
  );

  const shown = rows.filter(
    (r) =>
      (kind === 'all' || r.kind === kind) &&
      (table === 'all' || r.tables.includes(table)) &&
      (user === 'all' || r.user === user) &&
      (status === 'all' || r.status === status),
  );

  const todayLoads = loads.filter((l) => l.time.startsWith('Today'));
  const failedToday = queries.filter((q) => q.status === 'Failed').length + todayLoads.filter((l) => l.status === 'Failed').length;
  const running = queries.filter((q) => q.status === 'In progress').length;
  const finished = queries.filter((q) => q.status === 'Completed' && q.durationMs > 0).map((q) => q.durationMs).sort((a, b) => a - b);
  const median = finished.length ? finished[Math.floor(finished.length / 2)] : 0;
  const loadedGB = todayLoads.filter((l) => l.status === 'Completed').reduce((s, l) => s + parseFloat(l.bytes), 0);

  if (rows.length === 0) {
    return (
      <Vertical gap={spacing.F}>
        <PageHeader title="Queries" />
        <div className={styles.empty}>
          <NoData title="No queries yet" />
        </div>
      </Vertical>
    );
  }

  return (
    <Vertical gap={spacing.F}>
      <PageHeader title="Queries" />

      <div className={styles.tiles}>
        <Metric label="Queries" value={queries24h} note={median ? `Median ${formatMs(median)} · ${running} running` : 'Last 24 hours'} />
        <Metric label="Loads" value={String(todayLoads.length)} note={loadedGB ? `${loadedGB.toFixed(1)} GB loaded` : 'Last 24 hours'} />
        <Metric label="Failed" value={String(failedToday)} note="Queries and loads, last 24 hours" tone={failedToday ? 'failure' : undefined} />
        <Metric label="Data read" value="6.3 TB" note="By queries, last 24 hours" />
      </div>

      <Vertical gap={spacing.D}>
        <div className={styles.filters}>
          <SegmentedControl
            size="small"
            aria-label="Type"
            options={[
              { id: 'all', label: 'All' },
              { id: 'read', label: 'Reads' },
              { id: 'write', label: 'Writes' },
              { id: 'load', label: 'Loads' },
            ]}
            value={kind}
            onChange={setKind}
          />
          <SegmentedControl
            size="small"
            aria-label="Status"
            options={[
              { id: 'all', label: 'Any status' },
              { id: 'In progress', label: 'Running' },
              { id: 'Failed', label: 'Failed' },
              { id: 'Stopped', label: 'Stopped' },
            ]}
            value={status}
            onChange={setStatus}
          />
          <span className={styles.grow} />
          <Select size="small" options={tableOptions} value={table} onChange={(v) => setTable(v)} aria-label="Table" />
          <Select size="small" options={userOptions} value={user} onChange={(v) => setUser(v)} aria-label="User" />
        </div>
        <Table
          compact
          hoverable
          rowKey="id"
          onRowClick={(r) => setOpen(r as unknown as Row)}
          data={shown as unknown as Record<string, unknown>[]}
          emptyMessage="Nothing matches these filters"
          columns={[
            { key: 'time', label: 'Time', width: COL.lg, render: (v) => <span className={styles.num}>{logTime(String(v))}</span> },
            { key: 'status', label: 'Status', width: COL.lg, render: (_v, r) => <StatusPill kind={PILL[(r as unknown as Row).status]} label={(r as unknown as Row).status} /> },
            { key: 'kind', label: 'Type', width: COL.sm, render: (v) => ({ read: 'Read', write: 'Write', load: 'Load' })[v as Kind] },
            { key: 'user', label: 'User' },
            {
              key: 'text',
              label: 'Statement',
              render: (v, r) => {
                const row = r as unknown as Row;
                return <span className={styles.oneLine}>{row.error ? `${String(v)} · ${row.error}` : String(v)}</span>;
              },
            },
            { key: 'tables', label: 'Tables', render: (v) => (v as string[]).join(', ') },
            { key: 'durationMs', label: 'Duration', render: (v, r) => ((r as unknown as Row).status === 'In progress' ? '—' : formatMs(v as number)) },
            { key: 'size', label: 'Size', render: (v, r) => `${String(v)}${(r as unknown as Row).kind === 'load' && v !== '—' ? ' loaded' : ''}` },
            ...(canStop
              ? [
                  {
                    key: 'id',
                    label: '',
                    width: COL.md,
                    render: (_v: unknown, r: Record<string, unknown>) => {
                      const row = r as unknown as Row;
                      return row.kind !== 'load' && row.status === 'In progress' ? (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStop(row.id);
                          }}
                        >
                          Cancel
                        </Button>
                      ) : null;
                    },
                  },
                ]
              : []),
          ]}
        />
      </Vertical>

      {open && (
        <Detail
          row={rows.find((r) => r.id === open.id && r.kind === open.kind) ?? open}
          canStop={canStop}
          onStop={() => onStop(open.id)}
          onOpenSql={onOpenSql}
          onClose={() => setOpen(null)}
        />
      )}
    </Vertical>
  );
};

/** One query or one load, with everything the database recorded about it. */
const Detail: React.FC<{ row: Row; canStop: boolean; onStop: () => void; onOpenSql: (database: string, sql: string) => void; onClose: () => void }> = ({
  row: r,
  canStop,
  onStop,
  onOpenSql,
  onClose,
}) => {
  const q = r.query;
  const l = r.load;
  const running = r.status === 'In progress';
  const total = q?.profile?.reduce((s, p) => s + p.ms, 0) ?? r.durationMs;
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={r.kind === 'load' ? `Load into ${l?.table}` : r.kind === 'read' ? 'Read' : 'Write'}
      size="large"
      footer={
        <ModalFooter
          tertiaryAction={
            q ? (
              <Button variant="tertiary" onClick={() => onOpenSql(l?.database ?? 'acme_retail', q.summary.replace(/ … /g, ' ').replace(/…/g, ''))}>
                Open in SQL
              </Button>
            ) : undefined
          }
          secondaryAction={running && canStop ? <Button variant="secondary" onClick={onStop}>Cancel query</Button> : undefined}
          primaryAction={
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          }
        />
      }
    >
      <Vertical gap={spacing.E}>
        <div className={styles.facts}>
          <KeyValue label="Status">
            <Horizontal gap={spacing.B} align="center">
              <StatusPill kind={PILL[r.status]} label={r.status} />
              {r.error && (
                <Typography variant="body-normal" color="gray-light" noMargin>
                  {r.error}
                </Typography>
              )}
            </Horizontal>
          </KeyValue>
          <KeyValue label="User">{r.user}</KeyValue>
          <KeyValue label="Started">{logTime(r.time)}</KeyValue>
          <KeyValue label="Duration">{running ? `${formatMs(total)} so far` : formatMs(r.durationMs)}</KeyValue>
          {q && <KeyValue label="Data read">{q.bytesRead ?? '—'}</KeyValue>}
          {q && <KeyValue label="Rows returned">{q.resultRows === undefined ? '—' : q.resultRows.toLocaleString()}</KeyValue>}
          {l && <KeyValue label="Rows loaded">{l.rows ? formatRows(l.rows) : '0'}</KeyValue>}
          {l && <KeyValue label="Bytes">{l.bytes}</KeyValue>}
          {l && <KeyValue label="Label">{l.label}</KeyValue>}
          <KeyValue label={r.kind === 'load' ? 'Table' : 'Tables'}>{r.tables.join(', ')}</KeyValue>
        </div>

        {q && <CopyField label="Query ID" value={queryId(q.id)} onCopied={() => undefined} />}

        {q && <CodeBlock>{q.summary}</CodeBlock>}

        {q?.profile && q.profile.length > 0 && (
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
