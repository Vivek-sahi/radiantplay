import React from 'react';
import { Table, Icon, Typography, Horizontal, Vertical } from '../../../components';
import type { TableColumn } from '../../../components';
import { StatusPill, SectionHeader } from './primitives';
import { c, spacing, fontWeight } from '../styles';
import { formatRowsShort } from '../utils';
import type { DataModel } from '../types';

export const DataObjectsView: React.FC<{
  models: DataModel[];
  onOpenModel: (modelId: string) => void;
}> = ({ models, onOpenModel }) => {
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
    { key: 'source', label: 'Source', render: () => 'Snowflake' },
    {
      key: 'query',
      label: 'Query',
      render: (_v, row) =>
        row.cache?.status === 'cached' ? (
          <StatusPill kind="info" label="Cached" />
        ) : (
          <StatusPill kind="neutral" label="Live" />
        ),
    },
    { key: 'tables', label: 'Tables', render: (_v, row) => row.tables.length },
    {
      key: 'rows',
      label: 'Rows',
      align: 'right',
      render: (_v, row) => formatRowsShort(row.tables.reduce((s, t) => s + t.rowCount, 0)),
    },
  ];

  return (
    <Vertical gap={spacing.D} style={{ maxWidth: '1100px' }}>
      <SectionHeader title="Data objects" />
      <Typography variant="body-normal" color="gray-light" noMargin>
        Models in this workspace. The Query column shows whether a model is served from the
        ThoughtSpot cache or queried live from Snowflake. Select a model to manage its caching.
      </Typography>
      <Table
        columns={columns as unknown as TableColumn[]}
        data={models as unknown as Record<string, unknown>[]}
        rowKey="id"
        hoverable
        bordered
        onRowClick={(row) => onOpenModel((row as unknown as DataModel).id)}
      />
    </Vertical>
  );
};
