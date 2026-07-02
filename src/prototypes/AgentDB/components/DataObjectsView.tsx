import React from 'react';
import { Table, Typography, Horizontal, Vertical } from '../../../components';
import type { TableColumn } from '../../../components';
import { SourceCacheIcon, SectionHeader } from './primitives';
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
          <SourceCacheIcon cached={!!row.cache} />
          <span style={{ fontWeight: fontWeight.medium, color: c['content-primary'] }}>{row.name}</span>
        </Horizontal>
      ),
    },
    { key: 'source', label: 'Source', render: () => 'Snowflake' },
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
      <Typography variant="body-normal" color="gray" noMargin>
        Models in this workspace. A cache badge on the source icon marks models whose data is
        also cached in ThoughtSpot. Select a model to manage its caching.
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
