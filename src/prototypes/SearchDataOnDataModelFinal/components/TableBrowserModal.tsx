import React from 'react';
import { Modal } from '@components/Modal';
import { Button } from '@components/Button';
import type { ColumnTreeData } from '../../_datamodel/index';
import { TableColumnBrowserBody } from './TableColumnBrowserBody';

// Tables-section Option 2's pop-up table browser (2026-09-21, Komal:
// "you have blindly just brought the left navigation to this popup...
// think like an exceptional designer who understands the analyst persona").
// Purpose-built for this modal, not a reuse of the canvas-oriented ColumnTree
// — nothing here is draggable (there's no canvas to drag onto), and there is
// no chip/shadow styling meant for a compact side panel. Master-detail
// layout instead of one long accordion: an analyst scanning a real catalog
// (a dozen tables, dozens of columns each) picks the table on the left,
// then works through its columns on the right without the rest of the
// catalog's rows pushing that list around underneath it.
//
// The browsing body itself is shared with Option 2.1's inline side panel
// (TableColumnSidePanel.tsx) — this component is just the Modal shell
// around it (title, footer, Cancel/Add to model).
export interface TableBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Full source catalog to browse — every table, not just ones already added. */
  catalog: ColumnTreeData;
  /** The picker's own staged selection, keyed the same as modelColumns. */
  draft: { table: string; columns: string[] }[];
  onToggleColumn: (tableName: string, colName: string, checked: boolean) => void;
  onConfirm: () => void;
  /**
   * Which table to land on when the modal opens, instead of defaulting to
   * the first in the catalog. Set when a specific table's own "edit" trigger
   * opened the modal (2026-09-22, Komal: "getting in and out of edit mode"
   * — jumping straight to the table you meant to change, not hunting for it
   * in the full list every time). Left unset from the section header's own
   * "+", which has no specific table in mind.
   */
  initialFocusTable?: string | null;
  /** See TableColumnBrowserBodyProps — forwarded straight through. */
  tableInfoMode?: 'icon' | 'tab';
}

export const TableBrowserModal: React.FC<TableBrowserModalProps> = ({
  isOpen, onClose, catalog, draft, onToggleColumn, onConfirm, initialFocusTable, tableInfoMode,
}) => {
  const totalSelectedColumns = draft.reduce((n, g) => n + g.columns.length, 0);
  const totalSelectedTables = draft.filter(g => g.columns.length > 0).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="M2"
      title="Add tables and columns"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 'var(--spacing-3)' }}>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--rd-sys-color-content-secondary)' }}>
            {totalSelectedColumns === 0
              ? 'Nothing selected yet'
              : `${totalSelectedTables} table${totalSelectedTables === 1 ? '' : 's'} · ${totalSelectedColumns} column${totalSelectedColumns === 1 ? '' : 's'} selected`}
          </span>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm} disabled={totalSelectedColumns === 0}>Add to model</Button>
        </div>
      }
    >
      <TableColumnBrowserBody
        isOpen={isOpen}
        catalog={catalog}
        draft={draft}
        onToggleColumn={onToggleColumn}
        initialFocusTable={initialFocusTable}
        height={440}
        tableInfoMode={tableInfoMode}
      />
    </Modal>
  );
};

export default TableBrowserModal;
