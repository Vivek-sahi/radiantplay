import React, { useMemo, useState } from 'react';
import { Button, Horizontal, SearchInput, Select, Table, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { StoreTable } from '../types';
import { formatGB, formatRows } from '../data';
import { PageHeader, Panel } from './primitives';
import styles from './pages.module.css';

/** The tool on top, the service account that wrote it underneath. */
export const SourceCell: React.FC<{ t: StoreTable }> = ({ t }) => (
  <Vertical gap={0}>
    <Typography variant="body-normal" color="base" noMargin>
      {t.writer.label}
    </Typography>
    <Typography variant="footnote" color="gray-light" noMargin>
      {t.writer.detail}
    </Typography>
  </Vertical>
);

export const DataPage: React.FC<{
  tables: StoreTable[];
  onOpenTable: (id: string) => void;
  onCreateTable: () => void;
}> = ({ tables, onOpenTable, onCreateTable }) => {
  const [q, setQ] = useState('');
  const [source, setSource] = useState('all');

  // The filter lists the real sources, built from the tables themselves.
  const sourceOptions = useMemo(
    () => [{ id: 'all', label: 'All sources' }, ...[...new Set(tables.map((t) => t.writer.label))].sort().map((s) => ({ id: s, label: s }))],
    [tables],
  );

  const rows = useMemo(
    () =>
      tables
        .filter((t) => source === 'all' || t.writer.label === source)
        .filter((t) => t.name.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.sizeGB - a.sizeGB),
    [tables, q, source],
  );

  return (
    <Vertical gap={spacing.F}>
      <PageHeader
        title="Data"
        actions={
          <Button variant="primary" icon="plus" onClick={onCreateTable}>
            Create table
          </Button>
        }
      />
      <Panel title={`${rows.length} tables`} flush>
        <Horizontal gap={spacing.C} align="center" className={styles.filters}>
          <div className={styles.search}>
            <SearchInput placeholder="Search tables" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select size="basic" options={sourceOptions} value={source} onChange={(v) => setSource(v)} />
        </Horizontal>
        <Table
          hoverable
          rowKey="id"
          onRowClick={(r) => onOpenTable(String(r.id))}
          data={rows as unknown as Record<string, unknown>[]}
          emptyMessage="No tables match"
          columns={[
            {
              key: 'name',
              label: 'Table',
              render: (v) => (
                <Typography variant="content-label-subhead" color="accent" noMargin>
                  {String(v)}
                </Typography>
              ),
            },
            { key: 'writer', label: 'Source', render: (_v, r) => <SourceCell t={r as unknown as StoreTable} /> },
            { key: 'rows', label: 'Rows', render: (v) => formatRows(v as number) },
            { key: 'sizeGB', label: 'Size', render: (v, r) => ((r as unknown as StoreTable).empty ? '—' : formatGB(v as number)) },
            { key: 'queries24h', label: 'Queries, 24 h', render: (v) => ((v as number) === 0 ? '—' : formatRows(v as number)) },
            { key: 'lastUpdated', label: 'Last updated' },
          ]}
        />
      </Panel>
    </Vertical>
  );
};
