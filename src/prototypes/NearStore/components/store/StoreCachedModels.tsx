/**
 * Cached models — the half of the store ThoughtSpot manages.
 *
 * Unlike external tables these are ours: we scheduled the cache, we know its
 * status, and the row clicks through to the model's Caching tab. Columns match
 * Pulse's dashboard so the same object reads the same way in both places.
 */
import React, { useState } from 'react';
import { Typography, Table, Link, SearchInput } from '@/components';
import type { TableColumn } from '@/components';
import type { DataModel } from '../../types';

/** Per-model status — our agreed vocabulary only: In progress / Success / Error.
 *  Same derivation as Pulse's dashboard: an in-progress run wins over the last
 *  run's outcome, so a model mid-refresh doesn't read as already finished. */
const pulseStatus = (m: DataModel): { kind: PillKind; label: string } => {
  const cache = m.cache!;
  if (cache.runs.some((r) => r.status === 'In progress')) return { kind: 'neutral', label: 'In progress' };
  if (cache.lastRunStatus === 'Error') return { kind: 'failure', label: 'Error' };
  return { kind: 'success', label: 'Success' };
};

/** Last successful cache build (Scheduled / Ad-hoc), newest first — the same
 *  definition Pulse's dashboard uses, so the column reads identically in both. */
const lastRefreshed = (m: DataModel): string => {
  const done = m.cache!.runs.find(
    (r) => (r.runType === 'Scheduled' || r.runType === 'Ad-hoc') && r.status === 'Success' && r.endTime,
  );
  return done?.endTime ?? '—';
};
import { StatusPill } from '../primitives';
import type { PillKind } from '../primitives';
import { formatSizeMB, formatCompact } from '../../utils';
import styles from './store.module.css';

export const StoreCachedModels: React.FC<{
  models: DataModel[];
  onOpenModel: (id: string) => void;
}> = ({ models, onOpenModel }) => {
  const [query, setQuery] = useState('');
  const cached = models
    .filter((m) => m.cache && m.cache.status !== 'not_cached')
    .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));

  const columns: TableColumn<DataModel>[] = [
    {
      key: 'name', label: 'Model', minWidth: '230px',
      render: (_v, row) => <Link onClick={() => onOpenModel(row.id)}>{row.name}</Link>,
    },
    {
      key: 'rows', label: 'Rows', align: 'right', width: '110px',
      render: (_v, row) => (row.cache!.status === 'purged' ? '—' : formatCompact(row.cache!.rowCount)),
    },
    {
      key: 'size', label: 'Size', align: 'right', width: '110px',
      render: (_v, row) => (row.cache!.status === 'purged' ? '—' : formatSizeMB(row.cache!.cacheSizeMB)),
    },
    {
      key: 'status', label: 'Status', width: '130px',
      render: (_v, row) => {
        const st = pulseStatus(row);
        return <StatusPill kind={st.kind} label={st.label} />;
      },
    },
    { key: 'refreshed', label: 'Refreshed', minWidth: '150px', render: (_v, row) => lastRefreshed(row) },
  ];

  return (
    <div className={styles.section}>
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <SearchInput placeholder="Search models" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <div className={styles.card}>
        <Table
          columns={columns as unknown as TableColumn[]}
          data={cached as unknown as Record<string, unknown>[]}
          rowKey="id"
          hoverable
          emptyMessage="No models are cached yet."
        />
        <div className={styles.footer}>
          <Typography variant="footnote" color="gray-light" noMargin>Showing 1–{cached.length}</Typography>
        </div>
      </div>
    </div>
  );
};
