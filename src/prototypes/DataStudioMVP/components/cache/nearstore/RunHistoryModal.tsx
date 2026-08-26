import React, { useState } from 'react';
import { Modal, ModalFooter, Table, Button, Link, Icon, Tooltip, Typography, Horizontal, Vertical } from '@/components';
import type { TableColumn } from '@/components';
import { StatusPill, runStatusPillKind } from './primitives';
import { c, spacing } from './styles';
import styles from './RunHistoryModal.module.css';
import { formatRowsFull, formatSizeMB } from './utils';
import type { CacheRun, DataModel, RunType, TableRunResult } from './types';

// Note cell: single line, truncated so it never widens the table. The full text
// shows on hover (tooltip). No copy affordance.
const NoteCell: React.FC<{ note?: string }> = ({ note }) => {
  if (!note) return <>—</>;
  return (
    <Tooltip content={note} maxWidth={320}>
      <span className={styles.noteText}>{note}</span>
    </Tooltip>
  );
};

// Each run history row carries an event-type icon so scheduled builds, ad-hoc
// refreshes, config/model changes, and purges are distinguishable at a glance.
const RUN_TYPE_ICON: Record<RunType, React.ComponentProps<typeof Icon>['name']> = {
  Scheduled: 'clock',
  'Ad-hoc': 'refresh',
  'Config change': 'pencil',
  'Model update': 'pencil',
  Purge: 'eye-undo',
};

const RunTypeCell: React.FC<{ runType: RunType }> = ({ runType }) => (
  <Horizontal gap={spacing.B} align="center">
    <Icon name={RUN_TYPE_ICON[runType]} size="s" color={c['content-secondary']} />
    <span>{runType}</span>
  </Horizontal>
);

// Run history lists cache builds only — Scheduled and Ad-hoc runs. Purge and
// model-update events are tracked elsewhere and excluded here.
const CACHE_RUN_TYPES: RunType[] = ['Scheduled', 'Ad-hoc'];

export const RunHistoryModal: React.FC<{ model: DataModel; onClose: () => void }> = ({ model, onClose }) => {
  const runs = (model.cache?.runs ?? []).filter((r) => CACHE_RUN_TYPES.includes(r.runType));
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const selectedRun = selectedRunId ? runs.find((r) => r.id === selectedRunId) ?? null : null;

  const tableName = (id: string) => model.tables.find((t) => t.id === id)?.name ?? id;

  const runColumns: TableColumn<CacheRun>[] = [
    { key: 'runType', label: 'Event type', render: (_v, row) => <RunTypeCell runType={row.runType} /> },
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
    { key: 'rows', label: 'Rows', render: (_v, row) => formatRowsFull(row.rows) },
    { key: 'size', label: 'Size', render: (_v, row) => formatSizeMB(row.sizeMB) },
    { key: 'duration', label: 'Duration', render: (_v, row) => `${row.durationSec}s` },
    { key: 'window', label: 'Cached', render: (_v, row) => row.windowApplied },
    { key: 'note', label: 'Note', render: (_v, row) => <NoteCell note={row.note} /> },
  ];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={selectedRun ? 'Run details' : 'Run history'}
      size="M3"
      footer={<ModalFooter primaryAction={<Button variant="primary" onClick={onClose}>Close</Button>} />}
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
