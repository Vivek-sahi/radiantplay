import React from 'react';
import { Table, ProgressBar, Link, Icon, Typography, Horizontal, Vertical } from '@/components';
import type { TableColumn } from '@/components';
import { StatCard, SectionHeader } from './primitives';
import { c, spacing } from '../styles';
import styles from './DataStoreView.module.css';
import { capacitySummary, formatGB, formatSizeMB } from '../utils';
import type { DataModel } from '../types';

const barColor = (pct: number): 'green' | 'yellow' | 'red' =>
  pct > 85 ? 'red' : pct > 65 ? 'yellow' : 'green';

export const DataStoreView: React.FC<{
  models: DataModel[];
  onViewDetails: (modelId: string) => void;
}> = ({ models, onViewDetails }) => {
  const summary = capacitySummary(models);
  const cached = models.filter((m) => m.cache); // cache-enabled (config exists)

  const columns: TableColumn<DataModel>[] = [
    {
      key: 'name',
      label: 'Model',
      render: (_v, row) => (
        <Horizontal gap={spacing.C} align="center">
          <Icon name="table" size="l" color={c['content-secondary']} />
          <Typography variant="content-label-subhead" color="base" as="span" noMargin>{row.name}</Typography>
        </Horizontal>
      ),
    },
    { key: 'tables', label: 'Tables', render: (_v, row) => row.tables.length },
    {
      key: 'size',
      label: 'Cache size',
      render: (_v, row) => formatSizeMB(row.cache!.cacheSizeMB),
    },
    {
      key: 'window',
      label: 'Cache scope',
      render: (_v, row) => (row.cache!.window === 'full' ? 'Full Model' : 'Custom'),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (_v, row) => (
        <Link href="#" onClick={(e) => { e.preventDefault(); onViewDetails(row.id); }}>
          View details
        </Link>
      ),
    },
  ];

  return (
    <Vertical gap={spacing.H} className={styles.page}>
      {/* Capacity overview */}
      <Vertical gap={spacing.F} className={styles.capacityPanel}>
        <SectionHeader
          title="Near Store"
          actions={<Link href="#" onClick={(e) => e.preventDefault()}>How to upgrade plan</Link>}
        />
        <div className={styles.narrow}>
          <Typography variant="body-normal" color="gray-light" noMargin>
            Cached model data lives in Near Store, your ThoughtSpot data store. Track how much of your
            purchased space is in use and which models are consuming it.
          </Typography>
        </div>

        {/* Visualisation first, then the data points read left-to-right into it. */}
        <ProgressBar
          value={summary.usedPct}
          color={barColor(summary.usedPct)}
          size="large"
          label="Storage utilisation"
          showValue
          valueFormatter={() => `${formatGB(summary.usedGB)} of ${formatGB(summary.purchasedGB)} · ${Math.round(summary.usedPct)}%`}
        />

        <Horizontal gap={spacing.D} align="stretch" wrap>
          <StatCard label="Used" value={formatGB(summary.usedGB)} />
          <StatCard label="Available" value={formatGB(summary.availableGB)} />
          <StatCard label="Total" value={formatGB(summary.purchasedGB)} />
        </Horizontal>
      </Vertical>

      {/* Cached models */}
      <Vertical gap={spacing.D}>
        <SectionHeader title="Cached models" />
        <Table columns={columns as unknown as TableColumn[]} data={cached as unknown as Record<string, unknown>[]} rowKey="id" hoverable bordered />
      </Vertical>
    </Vertical>
  );
};
