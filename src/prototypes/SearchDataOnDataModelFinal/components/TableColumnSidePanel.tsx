import React, { useEffect } from 'react';
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
  initialFocusTable?: string | null;
  /** Pixel width of #left-pane right now (0 if collapsed) — where this overlay's left edge starts. */
  leftOffset: number;
  /** See TableColumnBrowserBodyProps — forwarded straight through. */
  tableInfoMode?: 'icon' | 'tab';
  /**
   * Additive, opt-in (2026-09-23, "Table info panel" Option 3, Komal: "bring
   * the CTAs back at the bottom"): a footer row rendered below the body.
   * Omit to keep the free-flowing, no-footer panel exactly as it is.
   */
  footer?: React.ReactNode;
}

export const TableColumnSidePanel: React.FC<TableColumnSidePanelProps> = ({
  open, onClose, catalog, draft, onToggleColumn, initialFocusTable, leftOffset, tableInfoMode, footer,
}) => {
  // No footer to confirm or cancel any more (2026-09-22, Komal: "remove the
  // 'add to model' and cancel from the bottom. It should be free flowing
  // selection. Clicking outside should close the panel") — every checkbox
  // already writes straight to the model, so the only thing left to do is
  // close. A click anywhere that isn't this panel or the left nav that hosts
  // its own entry points ("+", each row's edit pencil) does that. #left-pane
  // is deliberately included in "inside": those triggers sit outside this
  // component's own DOM (the panel starts where the pane ends), and without
  // this a click on a different table's edit pencil — meant to re-focus this
  // same panel on a new table — would register as "outside" and close it
  // first.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      // Read the ancestry from composedPath(), not target.closest()/.contains():
      // icon-only buttons (Sort, Filter) re-render their inline SVG on
      // mousedown (active/pressed state), which can detach e.target's own
      // node — by the time this document-level listener runs, its
      // .parentElement chain is already null even though the click
      // genuinely landed inside this panel. composedPath() is captured at
      // dispatch time, before any such mutation, so it stays reliable.
      const path = e.composedPath ? e.composedPath() : [e.target as EventTarget];
      const pathHasAttr = (attr: string) => path.some(n => n instanceof Element && n.hasAttribute(attr));
      const pathHasId = (id: string) => path.some(n => n instanceof Element && n.id === id);
      if (pathHasAttr('data-side-panel-root')) return;
      if (pathHasId('left-pane')) return;
      // 2026-09-25, Komal: "when I apply a sort, the panel should not
      // automatically close" — AnchoredMenu (the sort/filter dropdowns) and
      // AddFiltersModal both portal their content to document.body, outside
      // this panel's own DOM subtree; they tag their portaled root with this
      // attribute precisely so callers like this one can still recognize it
      // as "inside" despite the portal.
      if (pathHasAttr('data-portal-overlay')) return;
      onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    // Same background and shadow #left-pane itself uses (dme.css: box-shadow:
    // var(--shadow-surface)) — Komal, 2026-09-22: "it doesn't look like it's
    // part of the tables panel visually" — matching it makes this read as a
    // continuation of the Tables section. zIndex 35: must clear the preview
    // panel (PreviewPanel3.tsx docked z, 30 since 2026-09-25 — raised there
    // so its modal overlay/menus beat the canvas pills at 20), which sits
    // later in the DOM and otherwise paints over this panel's bottom and
    // eats its clicks (Vivek, 2026-09-25: "this panel should come above
    // preview panel"; originally 10-vs-3 for the same reason).
    // 480 — the columns list went back to single-column (Komal, 2026-09-22:
    // "I don't like the double column stacking... make it single column"),
    // so the 640px width sized for a 2-up grid was excess; narrowed back
    // down ("reduce the width of columns") now that a single column of
    // names doesn't need that much room.
    <div data-side-panel-root="" style={{ position: 'absolute', top: 0, bottom: 0, left: leftOffset, width: 480, display: 'flex', flexDirection: 'column', background: 'var(--rd-sys-color-background-base)', borderRight: '1px solid var(--rd-sys-color-border-divider)', boxShadow: 'var(--shadow-surface)', zIndex: 35 }}>
      {/* No close "x" (Komal, 2026-09-22: "remove") and no footer any more
          either — clicking outside closes it, and there's nothing left to
          confirm or cancel. */}
      <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--spacing-3) var(--spacing-4)', background: 'var(--rd-sys-color-background-sunken)', borderBottom: '1px solid var(--rd-sys-color-border-divider)', flexShrink: 0 }}>
        {/* 2026-09-24, Komal: "in data browser, update the title of the panel
            to 'Data browser'". */}
        <Typography variant="content-label" as="span" noMargin>Data browser</Typography>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: 'var(--spacing-3) var(--spacing-4)', display: 'flex', flexDirection: 'column' }}>
        <TableColumnBrowserBody
          isOpen={open}
          catalog={catalog}
          draft={draft}
          onToggleColumn={onToggleColumn}
          initialFocusTable={initialFocusTable}
          tableInfoMode={tableInfoMode}
        />
      </div>
      {footer}
    </div>
  );
};

export default TableColumnSidePanel;
