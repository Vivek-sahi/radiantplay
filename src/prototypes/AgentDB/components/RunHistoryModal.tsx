import React, { useState } from 'react';
import { Modal, Table, Button, Link, Typography, Horizontal, Vertical } from '../../../components';
import type { TableColumn } from '../../../components';
import { StatusPill, runStatusPillKind } from './primitives';
import { spacing } from '../styles';
import { formatRowsFull, formatSizeMB } from '../utils';
import type { CacheRun, DataModel, TableRunResult } from '../types';

export const RunHistoryModal: React.FC<{ model: DataModel; onClose: () => void }> = ({ model, onClose }) => {
  const runs = model.cache?.runs ?? [];
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const selectedRun = selectedRunId ? runs.find((r) => r.id === selectedRunId) ?? null : null;

  const tableName = (id: string) => model.tables.find((t) => t.id === id)?.name ?? id;

  const runColumns: TableColumn<CacheRun>[] = [
    { key: 'runType', label: 'Run type', render: (_v, row) => row.runType },
    { key: 'start', label: 'Start time', render: (_v, row) => row.startTime },
    { key: 'end', label: 'End time', render: (_v, row) => row.endTime ?? '—' },
    { key: 'rows', label: 'No. of rows', align: 'right', render: (_v, row) => (row.rows != null ? formatRowsFull(row.rows) : '—') },
    { key: 'status', label: 'Status', render: (_v, row) => <StatusPill kind={runStatusPillKind(row.status)} label={row.status} /> },
    {
      key: 'logs',
      label: '',
      align: 'right',
      render: (_v, row) =>
        row.tableResults.length > 0 ? (
          <Link href="#" onClick={(e) => { e.preventDefault(); setSelectedRunId(row.id); }}>View details</Link>
        ) : (
          '—'
        ),
    },
  ];

  const resultColumns: TableColumn<TableRunResult>[] = [
    { key: 'table', label: 'Table', render: (_v, row) => tableName(row.tableId) },
    { key: 'status', label: 'Status', render: (_v, row) => <StatusPill kind={runStatusPillKind(row.status)} label={row.status} /> },
    { key: 'rows', label: 'Rows', align: 'right', render: (_v, row) => formatRowsFull(row.rows) },
    { key: 'size', label: 'Size', align: 'right', render: (_v, row) => formatSizeMB(row.sizeMB) },
    { key: 'duration', label: 'Duration', align: 'right', render: (_v, row) => `${row.durationSec}s` },
    { key: 'window', label: 'Cached', render: (_v, row) => row.windowApplied },
    { key: 'note', label: 'Note', render: (_v, row) => row.note ?? '—' },
  ];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={selectedRun ? 'Run details' : 'Run history'}
      size="M3"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      {selectedRun ? (
        <Vertical gap={spacing.D}>
          <Link href="#" onClick={(e) => { e.preventDefault(); setSelectedRunId(null); }}>
            ← Back to run history
          </Link>
          <Horizontal gap={spacing.C} align="center">
            <Typography variant="content-label" color="base" noMargin>
              {selectedRun.runType} run · {selectedRun.startTime}
            </Typography>
            <StatusPill kind={runStatusPillKind(selectedRun.status)} label={selectedRun.status} />
          </Horizontal>
          <Typography variant="body-normal" color="gray-light" noMargin>
            Per-table results for this run — useful for debugging failures and seeing where cache space is going.
          </Typography>
          <Table
            columns={resultColumns as unknown as TableColumn[]}
            data={selectedRun.tableResults as unknown as Record<string, unknown>[]}
            rowKey="tableId"
            bordered
          />
        </Vertical>
      ) : (
        <Vertical gap={spacing.C}>
          <Typography variant="body-normal" color="gray-light" noMargin>
            Every scheduled and manual cache run, newest first. Open a run for its per-table breakdown.
          </Typography>
          <Table
            columns={runColumns as unknown as TableColumn[]}
            data={runs as unknown as Record<string, unknown>[]}
            rowKey="id"
            bordered
            hoverable
          />
        </Vertical>
      )}
    </Modal>
  );
};
