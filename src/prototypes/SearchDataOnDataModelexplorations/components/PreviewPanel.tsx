import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@components/Button';
import { SearchInput } from '@components/SearchInput';
import { Select } from '@components/Select';
import { SegmentedControl } from '@components/SegmentedControl';
import { Table } from '@components/Table';
import { Checkbox } from '@components/Checkbox';
import { Icon } from '@components/icons';
import { VizBlock } from '@spotter/chat';
import type { VizBlockData } from '@spotter/runtime';
import { rdComponentColors } from '@tokens/colors';
import type { TablePositionData } from '../../_datamodel/index';
import { generateMockRows, buildQueryFromColumns, isNumericColumn } from './previewMockData';
import type { NlQueryResult } from './previewMockData';

// Kept local (not imported from SearchDataOnDataModelexplorations.tsx) to avoid a circular
// module dependency, since that file imports this component.
type ColRow = { col: string; table: string; desc: string; aiCtx: string };
const COL_TABLE_COLUMNS = [
  { key: 'col',    label: 'Column name' },
  { key: 'table',  label: 'Source table name' },
  { key: 'srcCol', label: 'Source column name', render: (_: unknown, row: Record<string, unknown>) => (row as ColRow).col },
  { key: 'desc',   label: 'Description' },
  { key: 'aiCtx',  label: 'AI context' },
];

const MIN_HEIGHT = 160;
const MAX_HEIGHT = 600;
const COLLAPSED_HEIGHT = 38;
const ROWS_PER_TABLE = 8;

export interface PreviewPanelProps {
  tables: TablePositionData[];
  columnRows: ColRow[];
  dataSourceTables: { name: string; columns: string[] }[];
  open: boolean;
  setOpen: (v: boolean) => void;
  full: boolean;
  setFull: (v: boolean) => void;
  height: number;
  setHeight: (v: number) => void;
  panelTab: 'preview' | 'query';
  setPanelTab: (v: 'preview' | 'query') => void;
  scope: 'table' | 'model';
  setScope: (v: 'table' | 'model') => void;
  selectedTable: string;
  setSelectedTable: (v: string) => void;
}

const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 2.5H2.5V6M10 13.5h3.5V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.5 6V2.5H10M2.5 10v3.5H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const ChevronUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transform: 'rotate(180deg)' }}><path d="M4 6.5L8 10.5l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6.5L8 10.5l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

// Query-bar token — same chip treatment as the real search experience's
// DataToken (measure/attribute background), without its edit/replace menu;
// these tokens are read-only, driven entirely by the column checkboxes.
const QueryToken: React.FC<{ label: string; numeric: boolean }> = ({ label, numeric }) => (
  <span
    className="preview-query-token"
    style={{ backgroundColor: numeric ? rdComponentColors.light['chip-measure-default'] : rdComponentColors.light['chip-attribute-default'] }}
  >
    {label}
  </span>
);

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  tables, columnRows, dataSourceTables,
  open, setOpen, full, setFull, height, setHeight,
  panelTab, setPanelTab,
  scope, setScope,
  selectedTable, setSelectedTable,
}) => {
  const [previewMode, setPreviewMode] = useState<'data' | 'semantic'>('data');
  const [limit, setLimit] = useState('1000');
  const [queryResult, setQueryResult] = useState<NlQueryResult | null>(null);
  const [checkedByTable, setCheckedByTable] = useState<Record<string, Set<string>>>({});
  const [colFilterSearch, setColFilterSearch] = useState('');

  useEffect(() => {
    if (tables.length && !tables.some(t => t.name === selectedTable)) {
      setSelectedTable(tables[0].name);
    }
  }, [tables, selectedTable, setSelectedTable]);

  // The column selector always lists the full source schema for the selected
  // table (e.g. all 9 columns), not just the ones already added to the model.
  const tableColumns = useMemo(() => {
    const ds = dataSourceTables.find(d => d.name === selectedTable);
    return (ds?.columns ?? []).map(col => ({ col, table: selectedTable }));
  }, [dataSourceTables, selectedTable]);
  const modelColumns = useMemo(
    () => columnRows.map(r => ({ col: r.col, table: r.table })),
    [columnRows]
  );

  // Column selector (left of the Data grid and the Query tab) — which of the
  // selected table's columns are in scope. None are checked by default — the
  // user builds up the query/preview by picking columns explicitly, then
  // this persists per-table across switches.
  const checkedSet = useMemo(
    () => checkedByTable[selectedTable] ?? new Set<string>(),
    [checkedByTable, selectedTable]
  );
  const toggleColumn = (col: string) => {
    setCheckedByTable(prev => {
      const current = prev[selectedTable] ?? new Set<string>();
      const next = new Set(current);
      if (next.has(col)) next.delete(col); else next.add(col);
      return { ...prev, [selectedTable]: next };
    });
  };
  const visibleTableColumns = useMemo(
    () => tableColumns.filter(c => checkedSet.has(c.col)),
    [tableColumns, checkedSet]
  );

  // Selecting columns on the left is the query — each checked column renders
  // as a token in the bar. A stale answer no longer matches once the checked
  // set changes, so it's cleared until the user clicks Go again.
  useEffect(() => {
    setQueryResult(null);
  }, [visibleTableColumns]);

  const dataGrid = useMemo(() => {
    if (scope === 'table') {
      const rows = generateMockRows(visibleTableColumns, ROWS_PER_TABLE);
      const columns = visibleTableColumns.map(c => ({ key: c.col, label: c.col }));
      return { columns, rows, colCount: visibleTableColumns.length };
    }
    // Model scope: one wide sheet, columns prefixed by table so grains don't collide.
    const byTable = new Map<string, { col: string; table: string }[]>();
    modelColumns.forEach(c => {
      const list = byTable.get(c.table) ?? [];
      list.push(c);
      byTable.set(c.table, list);
    });
    const columns: { key: string; label: string }[] = [];
    const rows: Record<string, string | number>[] = Array.from({ length: ROWS_PER_TABLE }, () => ({}));
    byTable.forEach((cols, table) => {
      const tableRows = generateMockRows(cols, ROWS_PER_TABLE);
      cols.forEach(c => columns.push({ key: `${table}.${c.col}`, label: `${table}.${c.col}` }));
      tableRows.forEach((r, i) => {
        cols.forEach(c => { rows[i][`${table}.${c.col}`] = r[c.col]; });
      });
    });
    return { columns, rows, colCount: modelColumns.length };
  }, [scope, visibleTableColumns, modelColumns]);

  const semanticRows = scope === 'table'
    ? columnRows.filter(r => r.table === selectedTable)
    : columnRows;

  // Query is always scoped to the selected table's checked columns, not the
  // whole model — narrowed further by the same column selector as the Data grid.
  const runQuery = () => {
    const rows = generateMockRows(visibleTableColumns, ROWS_PER_TABLE);
    setQueryResult(buildQueryFromColumns(visibleTableColumns, rows));
  };

  const clearQuery = () => {
    setCheckedByTable(prev => ({ ...prev, [selectedTable]: new Set<string>() }));
    setQueryResult(null);
  };

  const filteredColumnOptions = tableColumns.filter(c =>
    !colFilterSearch || c.col.toLowerCase().includes(colFilterSearch.toLowerCase())
  );

  const columnSelector = (
    <div className="preview-col-selector">
      <SearchInput
        placeholder="Find columns"
        value={colFilterSearch}
        onChange={e => setColFilterSearch(e.target.value)}
      />
      <div className="preview-col-list">
        {filteredColumnOptions.map(c => (
          <Checkbox
            key={c.col}
            label={c.col}
            checked={checkedSet.has(c.col)}
            onChange={() => toggleColumn(c.col)}
          />
        ))}
      </div>
    </div>
  );

  const answerBlock: VizBlockData | null = queryResult ? {
    kind: 'viz',
    id: 'preview-panel-answer',
    title: `${queryResult.agg === 'count' ? 'Count' : `${queryResult.agg === 'average' ? 'Average' : 'Total'} ${queryResult.metric}`} by ${queryResult.groupBy}`,
    tokens: [
      { id: 'table', label: selectedTable, kind: 'filter' },
      { id: 'metric', label: queryResult.agg === 'count' ? 'Count' : queryResult.metric, kind: 'measure' },
      { id: 'group', label: queryResult.groupBy, kind: 'keyword' },
    ],
    source: {
      type: 'data',
      chartKind: 'bar',
      data: {
        xAxis: { categories: queryResult.data.map(d => d.group) },
        series: [{ id: 'value', label: queryResult.metric, data: queryResult.data.map(d => d.value) }],
      },
    },
    tableData: {
      columns: [queryResult.groupBy, queryResult.metric],
      rows: queryResult.data.map(d => [d.group, d.value]),
    },
  } : null;

  const containerStyle: React.CSSProperties = full
    ? { position: 'fixed', inset: 0, zIndex: 2000, height: 'auto' }
    : { height: open ? height : COLLAPSED_HEIGHT, position: 'relative', zIndex: 2, transition: 'height 180ms cubic-bezier(0.4,0,0.2,1)' };

  return (
    <div className="preview-panel" style={containerStyle}>
      {open && !full && (
        <div
          className="preview-resize-handle"
          onPointerDown={e => {
            e.preventDefault();
            const startY = e.clientY;
            const startH = height;
            const onMove = (ev: PointerEvent) => setHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startH + (startY - ev.clientY))));
            const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
          }}
        />
      )}

      <div className="preview-panel-header">
        <SegmentedControl
          options={[{ id: 'query', label: 'Query' }, { id: 'preview', label: 'Preview' }]}
          value={panelTab}
          onChange={v => setPanelTab(v as 'preview' | 'query')}
          size="small"
        />
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="preview-icon-btn"
          title={full ? 'Exit full screen' : open ? 'Full screen' : 'Expand'}
          onClick={() => {
            if (full) { setFull(false); return; }
            if (!open) { setOpen(true); return; }
            setFull(true);
          }}
        >
          {full || open ? <ExpandIcon /> : <ChevronUpIcon />}
        </button>
        {(open || full) && (
          <button
            type="button"
            className="preview-icon-btn"
            title="Hide"
            onClick={() => { setFull(false); setOpen(false); }}
          >
            <ChevronDownIcon />
          </button>
        )}
      </div>

      {(open || full) && panelTab === 'preview' && (
        <div className="preview-panel-toolbar">
          <SegmentedControl
            options={[{ id: 'table', label: 'Table' }, { id: 'model', label: 'Model' }]}
            value={scope}
            onChange={v => setScope(v as 'table' | 'model')}
            size="small"
          />
          {scope === 'table' && (
            <Select
              placeholder="Select table"
              value={selectedTable}
              options={tables.map(t => ({ id: t.name, label: t.name }))}
              onChange={v => setSelectedTable(v)}
              className="preview-table-select"
            />
          )}
          <SegmentedControl
            options={[{ id: 'data', label: 'Data' }, { id: 'semantic', label: 'Semantic' }]}
            value={previewMode}
            onChange={v => setPreviewMode(v as 'data' | 'semantic')}
            size="small"
          />
          {previewMode === 'data' && (
            <span className="preview-count-label">{dataGrid.colCount} cols · {dataGrid.rows.length} rows</span>
          )}
          <div style={{ flex: 1 }} />
          {previewMode === 'data' && (
            <div className="preview-limit-control">
              <span>Limit</span>
              <Select
                value={limit}
                options={[{ id: '100', label: '100' }, { id: '1000', label: '1000' }, { id: '10000', label: '10000' }]}
                onChange={setLimit}
              />
            </div>
          )}
        </div>
      )}

      {(open || full) && (
        <div className="preview-panel-body">
          {panelTab === 'preview' ? (
            previewMode === 'data' ? (
              scope === 'table' ? (
                <div className="preview-body-split">
                  {columnSelector}
                  <div className="preview-body-main">
                    {tableColumns.length === 0 ? (
                      <div className="preview-empty">No columns added to this table yet.</div>
                    ) : dataGrid.colCount === 0 ? (
                      <div className="preview-empty">Select columns on the left, then build a query in the Query tab to preview your data.</div>
                    ) : (
                      <Table columns={dataGrid.columns} data={dataGrid.rows} rowKey={(_r, i) => String(i)} stickyHeader compact />
                    )}
                  </div>
                </div>
              ) : dataGrid.colCount === 0 ? (
                <div className="preview-empty">No columns added to this model yet.</div>
              ) : (
                <Table columns={dataGrid.columns} data={dataGrid.rows} rowKey={(_r, i) => String(i)} stickyHeader compact />
              )
            ) : (
              semanticRows.length === 0 ? (
                <div className="preview-empty">No columns added to this {scope === 'table' ? 'table' : 'model'} yet.</div>
              ) : (
                <Table
                  columns={COL_TABLE_COLUMNS}
                  data={semanticRows}
                  rowKey={r => `${(r as ColRow).table}.${(r as ColRow).col}`}
                  stickyHeader
                />
              )
            )
          ) : (
            <div className="preview-body-split">
              {columnSelector}
              <div className="preview-body-main">
                <div className="preview-query">
                  <div className="preview-query-bar">
                    <Icon name="search" size="s" />
                    <div className="preview-query-tokens">
                      {visibleTableColumns.length === 0 ? (
                        <span className="preview-query-placeholder">Check columns on the left to build a query</span>
                      ) : (
                        visibleTableColumns.map(c => (
                          <QueryToken key={c.col} label={c.col} numeric={isNumericColumn(c.col)} />
                        ))
                      )}
                    </div>
                    {visibleTableColumns.length > 0 && (
                      <button type="button" className="preview-icon-btn" aria-label="Clear query" title="Clear query" onClick={clearQuery}>
                        <Icon name="cross" size="s" />
                      </button>
                    )}
                    <Button variant="primary" onClick={runQuery} disabled={visibleTableColumns.length === 0}>Go</Button>
                  </div>
                  {answerBlock ? (
                    <VizBlock block={answerBlock} />
                  ) : (
                    <div className="preview-empty">Check columns on the left, then click Go to build a query.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;
