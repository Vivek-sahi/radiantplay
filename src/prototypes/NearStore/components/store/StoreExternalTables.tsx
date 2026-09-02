/**
 * External tables — written into AgentDB by the customer's own ETL platform.
 *
 * We are read-only here. Their pipeline owns these: we did not schedule the load,
 * we cannot refresh it, and **we can observe state but not runs** — we know when
 * rows last changed, not whether their pipeline succeeded. So there is no status
 * column and no failure state, only recency.
 *
 * The job of this list is capacity attribution and staleness — what is filling the
 * store, and has anything gone quiet — so it sorts by size, largest first.
 */
import React, { useState } from 'react';
import { Typography, SearchInput, Table, Select } from '@/components';
import type { TableColumn } from '@/components';
import type { StoreTable } from './storeTypes';
import { formatSize, formatRows } from './storePrimitives';
import styles from './store.module.css';

const ALL = 'all-sources';

export const StoreExternalTables: React.FC<{ tables: StoreTable[] }> = ({ tables }) => {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState(ALL);

  // Source options come from what is actually in the store, so the filter can
  // never offer a platform with nothing behind it.
  const sourceOptions = [
    { id: ALL, label: 'All sources' },
    ...Array.from(new Set(tables.map((t) => t.writtenBy).filter(Boolean) as string[]))
      .sort()
      .map((n) => ({ id: n, label: n })),
  ];

  const rows = [...tables]
    .filter((t) => (source === ALL ? true : t.writtenBy === source))
    .filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.sizeMB - a.sizeMB);

  const columns: TableColumn<StoreTable>[] = [
    { key: 'name', label: 'Table', minWidth: '220px' },
    {
      key: 'writtenBy', label: 'Source', minWidth: '150px',
      render: (_v, row) =>
        row.writtenBy ? (
          <Typography variant="body-normal" color="gray-light" noMargin>{row.writtenBy}</Typography>
        ) : (
          <Typography variant="body-normal" color="gray-light" noMargin>&mdash;</Typography>
        ),
    },
    { key: 'sizeMB', label: 'Size', align: 'right', width: '110px', render: (_v, row) => formatSize(row.sizeMB) },
    { key: 'rows', label: 'Rows', align: 'right', width: '110px', render: (_v, row) => formatRows(row.rows) },
    { key: 'lastRefresh', label: 'Last updated', minWidth: '160px' },
  ];

  return (
    <div className={styles.section}>
      <div className={styles.filters}>
        <Select
          options={sourceOptions}
          value={source}
          onChange={(v) => setSource(v as string)}
          size="basic"
          aria-label="Filter by source"
        />
        <div className={styles.searchWrap}>
          <SearchInput placeholder="Search tables" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <div className={styles.card}>
        <Table
          columns={columns as unknown as TableColumn[]}
          data={rows as unknown as Record<string, unknown>[]}
          rowKey="id"
          emptyMessage="No tables match."
        />
        <div className={styles.footer}>
          <Typography variant="footnote" color="gray-light" noMargin>Showing 1–{rows.length}</Typography>
        </div>
      </div>
    </div>
  );
};
