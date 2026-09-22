import React from 'react';
import { Button } from '@components/Button';
import { Typography } from '@components/Typography';
import type { ColumnTreeData } from '../../_datamodel/index';
import { TableColumnBrowserBody } from './TableColumnBrowserBody';

// Tables-section Option 2.1 (2026-09-22, Komal: "same as option 2, with one
// exception. It opens a panel on the side on the main panel to prevent the
// user from leaving context, instead of opening the pop up") — same
// TableColumnBrowserBody Option 2's TableBrowserModal uses.
//
// Overlay, not a flex sibling (2026-09-22, Komal: "should be an overlay on
// top of the existing canvas and data preview panel instead of shrinking
// these") — position: absolute over .content-row, starting right where
// #left-pane ends (leftOffset), so the canvas/preview panel behind it keep
// their full size instead of being squeezed by a new flex item. The left
// nav itself stays outside the overlay's footprint and fully usable.
export interface TableColumnSidePanelProps {
  open: boolean;
  onClose: () => void;
  catalog: ColumnTreeData;
  draft: { table: string; columns: string[] }[];
  onToggleColumn: (tableName: string, colName: string, checked: boolean) => void;
  onConfirm: () => void;
  initialFocusTable?: string | null;
  /** Pixel width of #left-pane right now (0 if collapsed) — where this overlay's left edge starts. */
  leftOffset: number;
}

export const TableColumnSidePanel: React.FC<TableColumnSidePanelProps> = ({
  open, onClose, catalog, draft, onToggleColumn, onConfirm, initialFocusTable, leftOffset,
}) => {
  if (!open) return null;
  const totalSelectedColumns = draft.reduce((n, g) => n + g.columns.length, 0);
  const totalSelectedTables = draft.filter(g => g.columns.length > 0).length;

  return (
    // Same background and shadow #left-pane itself uses (dme.css: box-shadow:
    // var(--shadow-surface)) — Komal, 2026-09-22: "it doesn't look like it's
    // part of the tables panel visually" — matching it makes this read as a
    // continuation of the Tables section. zIndex 10, not 3 — the preview
    // panel's own collapsed bar (PreviewPanel3.tsx) is ALSO z-index: 3 and,
    // sitting later in the DOM (inside .main-content, which renders after
    // this overlay), won every stacking tie at equal z-index and ate this
    // panel's clicks. 10 clears it unambiguously.
    // 480 — the columns list went back to single-column (Komal, 2026-09-22:
    // "I don't like the double column stacking... make it single column"),
    // so the 640px width sized for a 2-up grid was excess; narrowed back
    // down ("reduce the width of columns") now that a single column of
    // names doesn't need that much room.
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: leftOffset, width: 480, display: 'flex', flexDirection: 'column', background: 'var(--rd-sys-color-background-base)', borderRight: '1px solid var(--rd-sys-color-border-divider)', boxShadow: 'var(--shadow-surface)', zIndex: 10 }}>
      {/* No close "x" (Komal, 2026-09-22: "remove") — Cancel in the footer
          below is the only way to close without confirming. */}
      <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--spacing-3) var(--spacing-4)', background: 'var(--rd-sys-color-background-sunken)', borderBottom: '1px solid var(--rd-sys-color-border-divider)', flexShrink: 0 }}>
        <Typography variant="content-label" as="span" noMargin>Add tables and columns</Typography>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: 'var(--spacing-3) var(--spacing-4)', display: 'flex', flexDirection: 'column' }}>
        <TableColumnBrowserBody
          isOpen={open}
          catalog={catalog}
          draft={draft}
          onToggleColumn={onToggleColumn}
          initialFocusTable={initialFocusTable}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-3) var(--spacing-4)', borderTop: '1px solid var(--rd-sys-color-border-divider)', flexShrink: 0 }}>
        <span style={{ flex: 1, fontSize: 12, color: 'var(--rd-sys-color-content-secondary)' }}>
          {totalSelectedColumns === 0
            ? 'Nothing selected yet'
            : `${totalSelectedTables} table${totalSelectedTables === 1 ? '' : 's'} · ${totalSelectedColumns} column${totalSelectedColumns === 1 ? '' : 's'} selected`}
        </span>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={onConfirm} disabled={totalSelectedColumns === 0}>Add to model</Button>
      </div>
    </div>
  );
};

export default TableColumnSidePanel;
