import React from 'react';
import { Table, ProgressBar, Link, Button, Icon, Typography, Horizontal, Vertical } from '../../../components';
import type { TableColumn } from '../../../components';
import { StatCard, SectionHeader } from './primitives';
import { c, spacing, radius, fontWeight } from '../styles';
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
          <span style={{ fontWeight: fontWeight.medium, color: c['content-primary'] }}>{row.name}</span>
        </Horizontal>
      ),
    },
    { key: 'tables', label: 'Tables', render: (_v, row) => row.tables.length },
    {
      key: 'size',
      label: 'Cache size',
      align: 'right',
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
    <Vertical gap={spacing.H} style={{ maxWidth: '1200px' }}>
      {/* Capacity overview */}
      <Vertical
        gap={spacing.F}
        style={{
          backgroundColor: c['background-base'],
          border: `1px solid ${c['border-divider']}`,
          borderRadius: `${radius.card}px`,
          padding: `${spacing.F}px`,
        }}
      >
        <SectionHeader
          title="Data store"
          actions={
            <>
              <Button
                variant="secondary"
                size="small"
                icon="information"
                onClick={() => window.open('/agentdb-overview.html', '_blank', 'noopener')}
              >
                How caching works
              </Button>
              <Link href="#" onClick={(e) => e.preventDefault()}>How to upgrade plan</Link>
            </>
          }
        />
        <div style={{ maxWidth: '640px' }}>
          <Typography variant="body-normal" color="gray-light" noMargin>
            Cached model data lives in your ThoughtSpot data store. Track how much of your purchased
            space is in use and which models are consuming it.
          </Typography>
        </div>

        <Horizontal gap={spacing.D} align="stretch" wrap>
          <StatCard label="Purchased" value={formatGB(summary.purchasedGB)} />
          <StatCard label="Used" value={formatGB(summary.usedGB)} />
          <StatCard label="Available" value={formatGB(summary.availableGB)} />
        </Horizontal>

        <ProgressBar
          value={summary.usedPct}
          color={barColor(summary.usedPct)}
          size="large"
          label="Storage utilisation"
          showValue
          valueFormatter={() => `${formatGB(summary.usedGB)} of ${formatGB(summary.purchasedGB)} · ${Math.round(summary.usedPct)}%`}
        />
      </Vertical>

      {/* Cached models */}
      <Vertical gap={spacing.D}>
        <SectionHeader title="Cached models" />
        <Table columns={columns as unknown as TableColumn[]} data={cached as unknown as Record<string, unknown>[]} rowKey="id" hoverable bordered />
      </Vertical>
    </Vertical>
  );
};
