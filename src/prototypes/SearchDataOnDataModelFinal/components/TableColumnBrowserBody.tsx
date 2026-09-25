import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SearchInput } from '@components/SearchInput';
import { Button } from '@components/Button';
import { Checkbox } from '@components/Checkbox';
import { Icon } from '@components/icons';
import { Popover } from '@components/Popover';
import { Menu } from '@components/Menu';
import { SegmentedControl } from '@components/SegmentedControl';
import type { ColumnTreeData } from '../../_datamodel/index';
import { ColumnChip } from './TablePickerV2';
import { TableInfoCard } from './TableInfoCard';
import { AnchoredMenu } from './AnchoredMenu';
import { AddFiltersModal } from './AddFiltersModal';

// The search + master-detail table/column list shared by Tables-section
// Option 2 (pop-up, TableBrowserModal.tsx) and Option 2.1 (inline side
// panel, TableColumnSidePanel.tsx) — 2026-09-22, Komal: "create option 2.1,
// which is same as option 2, with one exception: it opens a panel on the
// side... instead of the pop up". Same body either way; only the container
// (Modal vs. a flex sibling in .content-row) differs, so it lives here once.
export interface TableColumnBrowserBodyProps {
  isOpen: boolean;
  /** Full source catalog to browse — every table, not just ones already added. */
  catalog: ColumnTreeData;
  /** The picker's own staged selection, keyed the same as modelColumns. */
  draft: { table: string; columns: string[] }[];
  onToggleColumn: (tableName: string, colName: string, checked: boolean) => void;
  /** Which table to land on when opened, instead of the catalog's first. */
  initialFocusTable?: string | null;
  /** Fixed pixel height (Modal's own 440) — omit to fill the parent instead (the side panel). */
  height?: number;
  /**
   * Where the table info card (source table name, created, description,
   * database, schema, models using this table, columns/rows) surfaces —
   * two designs being compared (2026-09-22, Komal: "let's try 1 and 3"),
   * switched from the prototype's own Options menu. 'icon' puts an
   * info-circle button on each left-list row (opens a popover); 'tab' adds
   * an "Info" tab next to "Columns" in the right pane instead.
   */
  tableInfoMode?: 'icon' | 'tab';
}

// Shared by both panel header bars ("Tables" / "Columns") so they're the
// same size regardless of how many lines each one's content needs — sized
// to fit "Columns" plus the focused table name underneath it, the taller of
// the two; "Tables" (one line) centers vertically inside the same height.
const PANEL_HEADER_HEIGHT = 54;

export const TableColumnBrowserBody: React.FC<TableColumnBrowserBodyProps> = ({
  isOpen, catalog, draft, onToggleColumn, initialFocusTable, height, tableInfoMode = 'icon',
}) => {
  const [rightPaneTab, setRightPaneTab] = useState<'columns' | 'info'>('columns');
  const tableMetaOf = (name: string) => catalog.dataSourceTables.find(d => d.name === name);
  const [search, setSearch] = useState('');
  // Lazy initial value, not plain `useState(null)` (2026-09-22, Komal: "when
  // the panel is closed and I select the edit icon, the panel is still
  // incorrectly selecting the first table"). Both containers fully unmount
  // this component while closed (Modal and TableColumnSidePanel each
  // `return null` when !isOpen), so every open is a fresh mount — the
  // "just opened" ref-diffing below always found prevOpen.current already
  // equal to isOpen (both captured "true" at the same mount instant) and
  // never detected a transition, silently falling through to "first table
  // in the list" instead of the one that was actually clicked. Seeding the
  // very first render with initialFocusTable sidesteps that race entirely.
  const [focusedTable, setFocusedTable] = useState<string | null>(() => initialFocusTable ?? null);
  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // 2026-09-25, Komal: "Sort should open this dropdown" (Sort by name / Sort
  // by modified). The catalog only carries a `createdDate`, not a real
  // "last modified" timestamp, so "Sort by modified" falls back to the
  // catalog's own default order rather than a fabricated recency.
  const [sortBy, setSortBy] = useState<'name' | 'modified'>('name');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  // 2026-09-25, Komal: "for Add filters, recreate this pixel perfect" — the
  // Filter button opens the full "Add filters" modal (databases/schemas,
  // tags, authors) rather than a menu like Sort.
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);

  const draftCols = (table: string) => draft.find(g => g.table === table)?.columns ?? [];
  const selectedCount = (table: string) => draftCols(table).length;

  const q = search.trim().toLowerCase();
  const columnsOf = (name: string) => catalog.dataSourceTables.find(d => d.name === name)?.columns ?? [];
  const filteredTables = useMemo(() => {
    const base = q
      ? catalog.tables.filter(t => t.name.toLowerCase().includes(q) || columnsOf(t.name).some(c => c.toLowerCase().includes(q)))
      : catalog.tables;
    return sortBy === 'name' ? [...base].sort((a, b) => a.name.localeCompare(b.name)) : base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, q, sortBy]);

  // The lazy initializer above handles landing on initialFocusTable at mount
  // (every open is a fresh mount — see its own comment). This effect covers
  // the one thing a mount-time value can't: initialFocusTable changing
  // WHILE already mounted and open, e.g. clicking a different row's "edit"
  // pencil without closing first — re-focuses to the new target instead of
  // leaving the previous one selected. Also falls back to the first visible
  // table when there's no target and whatever's focused scrolls out of the
  // filtered list (search).
  const prevOpen = useRef(isOpen);
  const prevInitialFocusTable = useRef(initialFocusTable);
  useEffect(() => {
    if (!isOpen) { prevOpen.current = false; return; }
    const justOpened = !prevOpen.current;
    const focusTargetChanged = initialFocusTable !== prevInitialFocusTable.current;
    prevOpen.current = true;
    prevInitialFocusTable.current = initialFocusTable;
    if ((justOpened || focusTargetChanged) && initialFocusTable && filteredTables.some(t => t.name === initialFocusTable)) {
      setFocusedTable(initialFocusTable);
      return;
    }
    if (!focusedTable || !filteredTables.some(t => t.name === focusedTable)) {
      setFocusedTable(filteredTables[0]?.name ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filteredTables, initialFocusTable]);

  useEffect(() => { if (!isOpen) setSearch(''); }, [isOpen]);

  // Scroll the focused row into view when it was set programmatically
  // (initialFocusTable) rather than by the user's own click.
  useEffect(() => {
    if (!isOpen || !focusedTable) return;
    rowRefs.current[focusedTable]?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, focusedTable]);

  const activeCols = focusedTable ? columnsOf(focusedTable) : [];
  const visibleCols = q ? activeCols.filter(c => c.toLowerCase().includes(q) || focusedTable?.toLowerCase().includes(q)) : activeCols;
  const checkedVisibleCount = focusedTable ? visibleCols.filter(c => draftCols(focusedTable).includes(c)).length : 0;
  const allChecked = visibleCols.length > 0 && checkedVisibleCount === visibleCols.length;
  const someChecked = checkedVisibleCount > 0 && !allChecked;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', minHeight: 0, height: height ? undefined : '100%' }}>
      {/* 2026-09-25, Komal: "add this filter and sort option inside the data
          browser next to search as well" — icon-only buttons, same as the
          reference screenshot. No filter/sort behavior wired up yet since
          none was specified. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SearchInput
            placeholder="Search tables or columns"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="secondary" size="basic" iconOnly icon="filter" aria-label="Filter" onClick={() => setFiltersModalOpen(true)}>Filter</Button>
        <Button
          ref={sortBtnRef}
          variant="secondary"
          size="basic"
          iconOnly
          icon="sort"
          aria-label="Sort"
          onClick={() => setSortMenuOpen(o => !o)}
        >
          Sort
        </Button>
        <AnchoredMenu
          open={sortMenuOpen}
          anchorRef={sortBtnRef}
          onClose={() => setSortMenuOpen(false)}
          placement="bottom-end"
        >
          <Menu onClose={() => setSortMenuOpen(false)}>
            <Menu.Item active={sortBy === 'name'} onClick={() => { setSortBy('name'); setSortMenuOpen(false); }}>Sort by name</Menu.Item>
            <Menu.Item active={sortBy === 'modified'} onClick={() => { setSortBy('modified'); setSortMenuOpen(false); }}>Sort by modified</Menu.Item>
          </Menu>
        </AnchoredMenu>
      </div>
      <div style={{ display: 'flex', height: height ?? undefined, flex: height ? undefined : 1, minHeight: 0, border: '1px solid var(--rd-sys-color-border-divider)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {/* Left — table list. Clicking a row focuses it on the right; it is
            not itself a selection control (Komal: "no row picker"). Equal
            flex:1 with the columns pane on the right (Komal, 2026-09-22:
            "the width of column for table and column should be the same.
            Balance it.") — was a fixed 240px before. */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--rd-sys-color-border-divider)', background: 'var(--rd-sys-color-background-sunken)' }}>
          {/* 2026-09-24, Komal: "add headings to columns and table panels",
              then "looks weird the way you have placed it" — the first pass
              set the label loosely inline with the row list (no separation,
              scrolled away with it). A proper header bar fixes both: it's
              pinned above the scrolling rows, not part of them, with its own
              border-bottom closing it off — same "label bar, divider,
              scrollable body" shape the right pane's header already had via
              "Select all"'s own border. */}
          <div style={{
            flexShrink: 0, height: PANEL_HEADER_HEIGHT, boxSizing: 'border-box', padding: '10px var(--spacing-3)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            borderBottom: '1px solid var(--rd-sys-color-border-divider)',
            background: 'var(--rd-sys-color-background-base)',
          }}>
            {/* Icon + label (2026-09-25, Komal: "make it visually appealing
                and beautiful") — the same icon+label pairing every table row
                below already uses, so the header reads as one more step of
                the same pattern rather than a plainer, unrelated banner. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <Icon name="table" size="xs" color="var(--rd-sys-color-content-secondary)" />
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--rd-sys-color-content-primary)' }}>Tables</span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {filteredTables.length === 0 ? (
            <div style={{ padding: 'var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--rd-sys-color-content-secondary)', textAlign: 'center' }}>No matches</div>
          ) : filteredTables.map(t => {
            const count = selectedCount(t.name);
            const total = columnsOf(t.name).length;
            const active = t.name === focusedTable;
            return (
              // Kept as div>button rather than one <button> (2026-09-22,
              // Komal: "remove the checkboxes from tables") — the row still
              // needs to host the info-icon popover as a sibling control in
              // "row icon" mode, which can't nest inside the name button.
              <div
                key={t.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', width: '100%',
                  padding: '9px var(--spacing-3)', borderLeft: active ? '2px solid var(--rd-sys-color-border-brand)' : '2px solid transparent',
                  background: active ? 'var(--rd-sys-color-background-base)' : 'transparent',
                }}
              >
                <button
                  ref={el => { rowRefs.current[t.name] = el; }}
                  type="button"
                  onClick={() => setFocusedTable(t.name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1, minWidth: 0,
                    padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Icon name="table" size="xs" color="var(--rd-sys-color-content-secondary)" />
                  <span style={{
                    flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontSize: 'var(--font-size-sm)', fontWeight: active ? 600 : 500, color: 'var(--rd-sys-color-content-primary)',
                  }}>
                    {t.name}
                  </span>
                  {count > 0 && (
                    <span style={{
                      flexShrink: 0, minWidth: 28, height: 18, padding: '0 6px', borderRadius: 9,
                      background: 'var(--rd-sys-color-background-brand-subtle, var(--rd-sys-color-background-information))',
                      color: 'var(--rd-sys-color-content-brand)', fontSize: 11, fontWeight: 'var(--font-weight-semibold)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {/* Selected vs. total, not just selected (Komal,
                          2026-09-22: "this number should be 7/9, selected
                          column vs total") — matches the "n/m Columns" the
                          canvas card already shows once the table's added. */}
                      {count}/{total}
                    </span>
                  )}
                </button>
                {/* Table info popover (2026-09-22) — only in the "row icon"
                    design; the "side panel tab" design surfaces the same
                    card in the right pane's Info tab instead. */}
                {tableInfoMode === 'icon' && (
                  <Popover
                    trigger="click"
                    placement="right-start"
                    content={
                      <div style={{ width: 280, padding: 'var(--spacing-4)' }}>
                        <TableInfoCard table={tableMetaOf(t.name)} />
                      </div>
                    }
                  >
                    <button
                      type="button"
                      aria-label={`${t.name} info`}
                      style={{
                        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 20, height: 20, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
                        color: 'var(--rd-sys-color-content-secondary)',
                      }}
                    >
                      <Icon name="info-circle" size="xs" />
                    </button>
                  </Popover>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Right — the focused table's columns (plus, in "tab" mode, an Info
            tab showing the same table info card the "icon" mode puts in a
            popover). Same header-bar-then-scrollable-body shape as the left
            pane now uses, for the same reason. */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {!focusedTable ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--rd-sys-color-content-secondary)', textAlign: 'center' }}>Select a table to see its columns</div>
          ) : (
            <>
              {/* Header bar — same fixed-then-scrollable shape as the left
                  pane's "Tables": a pinned bar with its own border-bottom,
                  not part of what scrolls beneath it. */}
              {tableInfoMode === 'tab' ? (
                <div style={{
                  flexShrink: 0, height: PANEL_HEADER_HEIGHT, boxSizing: 'border-box', padding: '10px var(--spacing-3)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  borderBottom: '1px solid var(--rd-sys-color-border-divider)',
                }}>
                  <SegmentedControl
                    size="small"
                    options={[{ id: 'columns', label: 'Columns' }, { id: 'info', label: 'Info' }]}
                    value={rightPaneTab}
                    onChange={v => setRightPaneTab(v as 'columns' | 'info')}
                  />
                </div>
              ) : (
                // "Columns" — the pane's own generic heading, same size/weight
                // and bar treatment as "Tables" on the left so the two read
                // as a pair — with the specific table still named right under
                // it, since knowing WHICH table's columns these are stays
                // useful context. Both bars share PANEL_HEADER_HEIGHT (Komal,
                // 2026-09-25: "both the headers should be of the same size")
                // — this one's naturally two lines tall, "Tables" is one, so
                // that one centers vertically inside the same fixed height
                // rather than the two bars ending up different sizes.
                <div style={{ flexShrink: 0, height: PANEL_HEADER_HEIGHT, boxSizing: 'border-box', padding: '10px var(--spacing-3)', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderBottom: '1px solid var(--rd-sys-color-border-divider)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <Icon name="data-column" size="xs" color="var(--rd-sys-color-content-secondary)" />
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--rd-sys-color-content-primary)' }}>Columns</span>
                  </div>
                  {/* Indented past the icon (18px = xs icon width + spacing-2
                      gap) so the table name lines up under "Columns" itself,
                      not under the icon beside it. */}
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--rd-sys-color-content-secondary)', marginTop: 2, marginLeft: 18 }}>
                    {focusedTable}
                  </div>
                </div>
              )}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--spacing-3) var(--spacing-4)' }}>
                {tableInfoMode === 'tab' && rightPaneTab === 'info' ? (
                  <TableInfoCard table={tableMetaOf(focusedTable)} />
                ) : visibleCols.length === 0 ? (
                  <div style={{ padding: 'var(--spacing-3) 0', fontSize: 'var(--font-size-xs)', color: 'var(--rd-sys-color-content-secondary)' }}>No columns match "{search}"</div>
                ) : (
                  <>
                    {/* Select all — scoped to whatever's currently visible (the
                        search-filtered set), same "select what you see"
                        convention as Gmail/Drive-style list pickers. */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', padding: '6px 0', marginBottom: 'var(--spacing-1)', cursor: 'pointer' }}>
                      <Checkbox
                        checked={allChecked}
                        indeterminate={someChecked}
                        onChange={next => visibleCols.forEach(c => onToggleColumn(focusedTable, c, next))}
                        showLabel={false}
                      />
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--rd-sys-color-content-secondary)' }}>Select all</span>
                    </label>
                    {/* Single column (Komal, 2026-09-22: "I don't like the
                        double column stacking... make it single column") — the
                        earlier 2-up grid tried to use the extra width the wider
                        panel now has, but reverted back to a plain list per her
                        call. The panel's own width increase stays. */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {visibleCols.map(c => {
                        const checked = draftCols(focusedTable).includes(c);
                        return (
                          <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', padding: '6px 0', cursor: 'pointer', minWidth: 0 }}>
                            <Checkbox
                              checked={checked}
                              onChange={next => onToggleColumn(focusedTable, c, next)}
                              showLabel={false}
                            />
                            {/* Same ColumnChip every other column list already
                                uses — Option 1's ColumnTree, the populated
                                Option 2 nav row, Option 4's panel (2026-09-22,
                                Komal: "use consistent styling for columns
                                everywhere. Even in the table and column
                                browser"). This was the one holdout still on a
                                plain text label. */}
                            <ColumnChip label={c} />
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <AddFiltersModal
        isOpen={filtersModalOpen}
        onCancel={() => setFiltersModalOpen(false)}
        onAdd={() => setFiltersModalOpen(false)}
      />
    </div>
  );
};

export default TableColumnBrowserBody;
