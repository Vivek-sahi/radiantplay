/**
 * AgentDB Store — Tables.
 *
 * The landing surface: everything currently loaded into the store, and the way
 * in to loading more. Columns follow the PM's build (table, source, size, rows,
 * last refresh, status, schedule, owner) because those are the questions an
 * owner actually asks; the chrome is Radiant.
 */
import React, { useState } from 'react';
import { Typography, SearchInput, Table, Link } from '@/components';
import type { TableColumn } from '@/components/Table';
import type { StoreTable, Connection } from './storeTypes';
import type { DataModel } from '../../types';
import { ConnectorMark } from './ConnectorMark';
import { StatusText, AuthorCell, formatSize, formatRows } from './storePrimitives';
import styles from './store.module.css';

/** In the unified product model a cached model is just another thing in the
 *  store, so it appears in the same list — with a column saying how it arrived. */
type Row = StoreTable & { arrivedBy: 'Extract' | 'Model cache' };

export const StoreTablesView: React.FC<{
  tables: StoreTable[];
  connections: Connection[];
  /** Supplied only in the unified model. Cached models join the same list. */
  models?: DataModel[];
  onOpenTable: (id: string) => void;
}> = ({ tables, connections, models, onOpenTable }) => {
  const unified = models !== undefined;
  const [query, setQuery] = useState('');
  const connOf = (id: string) => connections.find((cn) => cn.id === id);

  const extracted: Row[] = tables.map((t) => ({ ...t, arrivedBy: 'Extract' }));

  // A cached model, expressed in the store's own terms.
  const cached: Row[] = (models ?? [])
    .filter((m) => m.cache && m.cache.status !== 'not_cached' && m.cache.status !== 'purged')
    .map((m) => ({
      id: `model-${m.id}`,
      name: m.name,
      path: m.source,
      connectionId: '',
      sizeMB: m.cache!.cacheSizeMB,
      rows: m.cache!.rowCount,
      lastRefresh: m.cache!.nextRunAt,
      status: m.cache!.status === 'refreshing' ? 'In progress' : 'Success',
      schedule: 'Model schedule',
      owner: m.author?.name ?? '—',
      incremental: false,
      columns: [],
      arrivedBy: 'Model cache',
    }));

  const all = [...extracted, ...cached];

  const rows = all.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.path.toLowerCase().includes(query.toLowerCase()),
  );

  const columns: TableColumn<Row>[] = [
    {
      key: 'name', label: 'Table', minWidth: '220px',
      render: (_v, row) => (
        <span className={styles.cellLink}>
          <Link onClick={() => onOpenTable(row.id)}>{row.name}</Link>
        </span>
      ),
    },
    {
      key: 'source', label: 'Source', minWidth: '160px',
      render: (_v, row) => {
        const cn = connOf(row.connectionId);
        if (cn) return <ConnectorMark source={cn.source} label={cn.sourceName} />;
        return <ConnectorMark source="snowflake" label={row.path} />;
      },
    },
    ...(unified
      ? [{
          key: 'arrivedBy', label: 'Loaded by', minWidth: '130px',
        } as TableColumn<Row>]
      : []),
    { key: 'sizeMB', label: 'Size', align: 'right', render: (_v, row) => formatSize(row.sizeMB) },
    { key: 'rows', label: 'Rows', align: 'right', render: (_v, row) => formatRows(row.rows) },
    { key: 'lastRefresh', label: 'Last refresh', minWidth: '140px' },
    { key: 'status', label: 'Status', render: (_v, row) => <StatusText status={row.status} /> },
    { key: 'schedule', label: 'Schedule', minWidth: '130px' },
    { key: 'owner', label: 'Owner', minWidth: '160px', render: (_v, row) => <AuthorCell name={row.owner} /> },
  ];

  return (
    <div className={styles.subPage}>
      <div className={styles.bar}>
        <div className={styles.search}>
          <SearchInput placeholder="Search tables" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className={styles.card}>
        <Table
          columns={columns as unknown as TableColumn[]}
          data={rows as unknown as Record<string, unknown>[]}
          rowKey="id"
          hoverable
          selectable
          emptyMessage="No tables match your search."
        />
        <div className={styles.footer}>
          <Typography variant="footnote" color="gray-light" noMargin>
            Showing 1–{rows.length} of {all.length}
          </Typography>
        </div>
      </div>
    </div>
  );
};
