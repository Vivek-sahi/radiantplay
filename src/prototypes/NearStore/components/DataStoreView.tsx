import React from 'react';
import { Table, ProgressBar, Card, Link, Icon, Typography, Horizontal, Vertical } from '@/components';
import type { TableColumn } from '@/components';
import { StatusPill, SectionHeader, type PillKind } from './primitives';
import { c, spacing } from '../styles';
import styles from './DataStoreView.module.css';
import { capacitySummary, formatGB, formatSizeMB, formatCompact } from '../utils';
import type { DataModel } from '../types';

const barColor = (pct: number): 'green' | 'yellow' | 'red' =>
  pct > 85 ? 'red' : pct > 65 ? 'yellow' : 'green';

// Per-model status for the Pulse list — our agreed vocabulary only:
// In progress / Success / Error.
const pulseStatus = (m: DataModel): { kind: PillKind; label: string } => {
  const cache = m.cache!;
  if (cache.runs.some((r) => r.status === 'In progress')) return { kind: 'neutral', label: 'In progress' };
  if (cache.lastRunStatus === 'Error') return { kind: 'failure', label: 'Error' };
  return { kind: 'success', label: 'Success' };
};

// Last successful cache build (Scheduled / Ad-hoc), newest first.
const lastRefreshed = (m: DataModel): string => {
  const done = m.cache!.runs.find(
    (r) => (r.runType === 'Scheduled' || r.runType === 'Ad-hoc') && r.status === 'Success' && r.endTime,
  );
  return done?.endTime ?? '—';
};

// A count tile (Models / Rows): a single unambiguous number, vertically centred so
// it doesn't hug the top of the (bar-driven) Usage card's height.
const CountTile: React.FC<{ icon: 'table' | 'chart'; label: string; value: string }> = ({ icon, label, value }) => (
  <Card className={styles.tile}>
    <Vertical gap={spacing.C} className={styles.tileBody}>
      <Horizontal gap={spacing.B} align="center">
        <Icon name={icon} size="m" color={c['content-secondary']} />
        <Typography variant="content-label" color="base" noMargin>{label}</Typography>
      </Horizontal>
      <Typography variant="page-title" color="base" noMargin>{value}</Typography>
    </Vertical>
  </Card>
);

export const DataStoreView: React.FC<{
  models: DataModel[];
  onViewDetails: (modelId: string) => void;
}> = ({ models, onViewDetails }) => {
  const summary = capacitySummary(models);
  const cached = models.filter((m) => m.cache); // cache-enabled (config exists)
  const totalRows = cached.reduce((sum, m) => sum + (m.cache!.status === 'purged' ? 0 : m.cache!.rowCount), 0);

  const usedGB = formatGB(summary.usedGB);
  const freeGB = formatGB(summary.availableGB);
  const totalGB = formatGB(summary.purchasedGB);

  const columns: TableColumn<DataModel>[] = [
    {
      key: 'name',
      label: 'Model',
      render: (_v, row) => (
        <Link href="#" onClick={(e) => { e.preventDefault(); onViewDetails(row.id); }}>
          {row.name}
        </Link>
      ),
    },
    {
      key: 'rows',
      label: 'Rows',
      render: (_v, row) => (row.cache!.status === 'purged' ? '—' : formatCompact(row.cache!.rowCount)),
    },
    {
      key: 'size',
      label: 'Size',
      render: (_v, row) => (row.cache!.cacheSizeMB > 0 ? formatSizeMB(row.cache!.cacheSizeMB) : '—'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v, row) => {
        const s = pulseStatus(row);
        return <StatusPill kind={s.kind} label={s.label} />;
      },
    },
    { key: 'refreshed', label: 'Refreshed', render: (_v, row) => lastRefreshed(row) },
  ];

  return (
    <Vertical gap={spacing.F} className={styles.page}>
      {/* Title — product "Pulse", powered by the AgentDB tech. */}
      <Horizontal justify="space-between" align="center">
        <Horizontal gap={spacing.C} align="center">
          <Typography variant="page-title" color="base" noMargin>Pulse</Typography>
          <StatusPill kind="info" label="Powered by AgentDB" />
        </Horizontal>
        <Link href="#" onClick={(e) => e.preventDefault()}>How to upgrade plan</Link>
      </Horizontal>

      {/* Dashboard tiles — Usage is a meter (bar-led), the other two are counts. */}
      <Horizontal gap={spacing.D} align="stretch" wrap className={styles.tileRow}>
        <Card className={styles.tile}>
          <Vertical gap={spacing.C} className={styles.tileBody}>
            <Horizontal gap={spacing.B} align="center">
              <Icon name="database" size="m" color={c['content-secondary']} />
              <Typography variant="content-label" color="base" noMargin>Usage</Typography>
            </Horizontal>
            <Typography variant="page-title" color="base" noMargin>{usedGB} of {totalGB} used</Typography>
            <div className={styles.bar}>
              <ProgressBar value={summary.usedPct} color={barColor(summary.usedPct)} size="default" />
            </div>
            <Typography variant="footnote" color="gray-light" noMargin>{freeGB} left</Typography>
          </Vertical>
        </Card>

        <CountTile icon="table" label="Models cached" value={String(cached.length)} />
        <CountTile icon="chart" label="Rows cached" value={formatCompact(totalRows)} />
      </Horizontal>

      {/* Cached models */}
      <Vertical gap={spacing.D}>
        <SectionHeader title="Cached models" />
        <Table columns={columns as unknown as TableColumn[]} data={cached as unknown as Record<string, unknown>[]} rowKey="id" hoverable bordered />
      </Vertical>
    </Vertical>
  );
};
