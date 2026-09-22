import React from 'react';
import type { DataSourceTable } from '../../_datamodel/index';

// The metadata card from Komal's reference screenshot (2026-09-22) — shared
// by both ways of surfacing it (the row info-icon popover and the side
// panel's Info tab), so the content and layout only need to be right once.
export interface TableInfoCardProps {
  table: DataSourceTable | undefined;
}

const Field: React.FC<{ label: string; value: string; withRule?: boolean }> = ({ label, value, withRule = true }) => (
  <div style={{
    paddingTop: withRule ? 'var(--spacing-4)' : 0,
    borderTop: withRule ? '1px solid var(--rd-sys-color-border-divider)' : undefined,
  }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--rd-sys-color-content-primary)', marginBottom: 'var(--spacing-1)' }}>
      {label}
    </div>
    <div style={{ fontSize: 13, fontWeight: 400, color: 'var(--rd-sys-color-content-secondary)' }}>
      {value}
    </div>
  </div>
);

export const TableInfoCard: React.FC<TableInfoCardProps> = ({ table }) => {
  if (!table) return null;
  const modelsLabel = table.modelsUsingThisTable?.length ? table.modelsUsingThisTable.join(', ') : '--';
  const columnsLabel = `${table.columns.length} column${table.columns.length === 1 ? '' : 's'}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--rd-sys-color-content-primary)' }}>
        {table.name}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--rd-sys-color-content-secondary)', marginBottom: 'var(--spacing-1)' }}>
            Source table name
          </div>
          <div style={{ fontSize: 13, color: 'var(--rd-sys-color-content-primary)' }}>
            {table.sourceTableName ?? '--'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--rd-sys-color-content-secondary)', marginBottom: 'var(--spacing-1)' }}>
            Created
          </div>
          <div style={{ fontSize: 13, color: 'var(--rd-sys-color-content-primary)' }}>
            {table.createdDate ?? '--'}
          </div>
        </div>
      </div>

      <Field label="Description" value={table.description ?? '--'} withRule={false} />
      <Field label="Database" value={table.database ?? '--'} />
      <Field label="Schema" value={table.schemaName ?? '--'} />
      <Field label="Models using this table" value={modelsLabel} />
      <Field label="Number of columns and rows" value={columnsLabel} />
    </div>
  );
};

export default TableInfoCard;
