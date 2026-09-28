import React, { useMemo, useState } from 'react';
import { Button, Horizontal, SearchInput, Select, Table, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { StoreTable, WriterKind } from '../types';
import { formatGB, formatRows } from '../data';
import { PageHeader, Panel, StatusPill } from './primitives';
import { useVariant } from '../variant';
import styles from './pages.module.css';

const WRITER_FILTER = [
  { id: 'all', label: 'All sources' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'pipeline', label: 'Pipelines' },
  { id: 'upload', label: 'File uploads' },
];

export const WriterCell: React.FC<{ t: StoreTable }> = ({ t }) =>
  t.writer.kind === 'pulse' ? (
    <Vertical gap={0}>
      <StatusPill kind="info" label="Managed by Pulse" />
      <Typography variant="footnote" color="gray-light" noMargin>
        Model: {t.writer.detail}
      </Typography>
    </Vertical>
  ) : (
    <Vertical gap={0}>
      <Typography variant="body-normal" color="base" noMargin>
        {t.writer.label}
      </Typography>
      <Typography variant="footnote" color="gray-light" noMargin>
        {t.writer.kind === 'upload' ? `Uploaded by ${t.writer.detail}` : t.writer.detail}
      </Typography>
    </Vertical>
  );

export const DataPage: React.FC<{
  tables: StoreTable[];
  onOpenTable: (id: string) => void;
  onUpload: () => void;
  onCreateTable: () => void;
}> = ({ tables, onOpenTable, onUpload, onCreateTable }) => {
  const [q, setQ] = useState('');
  const [writer, setWriter] = useState('all');
  const variant = useVariant();
  const writerOptions = variant === 'v1' ? WRITER_FILTER : WRITER_FILTER.filter((o) => o.id !== 'pulse');

  const rows = useMemo(
    () =>
      tables
        .filter((t) => writer === 'all' || t.writer.kind === (writer as WriterKind))
        .filter((t) => `${t.database}.${t.name}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.sizeGB - a.sizeGB),
    [tables, q, writer],
  );

  return (
    <Vertical gap={spacing.F}>
      <PageHeader
        title="Data"
        subtitle="Every table in AgentDB and where it came from."
        actions={
          <>
            <Button variant="secondary" icon="upload" onClick={onUpload}>
              Upload a file
            </Button>
            <Button variant="primary" icon="plus" onClick={onCreateTable}>
              Create table
            </Button>
          </>
        }
      />
      <Panel title={`${rows.length} tables`} flush>
        <Horizontal gap={spacing.C} align="center" className={styles.filters}>
          <div className={styles.search}>
            <SearchInput placeholder="Search tables" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select size="basic" options={writerOptions} value={writer} onChange={(v) => setWriter(v)} />
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
              render: (_v, r) => {
                const t = r as unknown as StoreTable;
                return (
                  <Vertical gap={0}>
                    <Typography variant="content-label-subhead" color="accent" noMargin>
                      {t.name}
                    </Typography>
                    <Typography variant="footnote" color="gray-light" noMargin>
                      {t.database}
                    </Typography>
                  </Vertical>
                );
              },
            },
            { key: 'writer', label: 'Written by', render: (_v, r) => <WriterCell t={r as unknown as StoreTable} /> },
            { key: 'rows', label: 'Rows', align: 'right', render: (v) => formatRows(v as number) },
            { key: 'sizeGB', label: 'Size', align: 'right', render: (v, r) => ((r as unknown as StoreTable).empty ? '—' : formatGB(v as number)) },
            {
              key: 'lastArrived',
              label: 'Last data arrived',
              render: (v, r) => {
                const t = r as unknown as StoreTable;
                return (
                  <Horizontal gap={spacing.B} align="center">
                    {t.empty ? <StatusPill kind="neutral" label="Waiting for first load" /> : <span>{String(v)}</span>}
                    {t.late && <StatusPill kind="warning" label="Late" />}
                    {t.loading && <StatusPill kind="info" label="Load arriving" />}
                  </Horizontal>
                );
              },
            },
          ]}
        />
      </Panel>
    </Vertical>
  );
};
