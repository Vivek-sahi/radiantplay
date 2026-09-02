/**
 * Jobs — every sync run, newest first.
 *
 * Monitoring is one of the four workflows on the product agenda: space
 * utilisation · sync statuses · sync failure cases · modify extract settings.
 * This covers the middle two; the failure row carries its reason inline, since
 * a run that failed silently is the trap this product has to avoid.
 */
import React, { useState } from 'react';
import { Typography, SearchInput, Table, SegmentedControl } from '@/components';
import type { TableColumn } from '@/components';
import type { SyncRun } from './storeTypes';
import { StatusText, formatRows } from './storePrimitives';
import styles from './store.module.css';

type Filter = 'all' | 'failed';

export const StoreJobsView: React.FC<{
  runs: SyncRun[];
  showHeader?: boolean;
}> = ({ runs, showHeader = true }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const rows = runs
    .filter((r) => (filter === 'failed' ? r.status === 'Error' : true))
    .filter((r) => r.tableName.toLowerCase().includes(query.toLowerCase()));

  const columns: TableColumn<SyncRun>[] = [
    { key: 'tableName', label: 'Table', minWidth: '190px' },
    { key: 'when', label: 'Run at', minWidth: '150px' },
    { key: 'by', label: 'Triggered by', minWidth: '130px' },
    {
      key: 'rows', label: 'Rows', align: 'right', width: '100px',
      render: (_v, row) => (row.status === 'Success' ? formatRows(row.rows) : '—'),
    },
    { key: 'duration', label: 'Duration', width: '110px' },
    { key: 'status', label: 'Status', width: '120px', render: (_v, row) => <StatusText status={row.status} /> },
    {
      key: 'note', label: 'Detail', minWidth: '260px',
      render: (_v, row) => (
        <Typography variant="footnote" color="gray-light" noMargin>{row.note ?? ''}</Typography>
      ),
    },
  ];

  return (
    <div className={styles.subPage}>
      {showHeader ? (
        <div className={styles.head}>
          <div className={styles.headText}>
            <Typography variant="page-title" noMargin>Jobs</Typography>
            <Typography variant="body-normal" color="gray-light" noMargin>
              Every sync run, newest first.
            </Typography>
          </div>
        </div>
      ) : null}

      <div className={styles.bar}>
        <div className={styles.search}>
          <SearchInput placeholder="Search runs" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <SegmentedControl
          size="small"
          options={[
            { id: 'all', label: 'All runs' },
            { id: 'failed', label: 'Failures' },
          ]}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
        />
      </div>

      <div className={styles.card}>
        <Table
          columns={columns as unknown as TableColumn[]}
          data={rows as unknown as Record<string, unknown>[]}
          rowKey="id"
          hoverable
          emptyMessage="No runs match."
        />
        <div className={styles.footer}>
          <Typography variant="footnote" color="gray-light" noMargin>Showing 1–{rows.length}</Typography>
        </div>
      </div>
    </div>
  );
};
