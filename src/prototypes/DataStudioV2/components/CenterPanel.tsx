import React, { useState, useRef, useEffect, useMemo } from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import { Select, SelectOption } from '../../../components/Select';
import { Checkbox } from '../../../components/Checkbox';
import { radius } from '../../../tokens/radius';
import { ProjectState } from '../index';
import { ordersData, campaignsData, usersData, tableMetadata, relationships } from '../data/mockData';
import TableDetailModal from './TableDetailModal';

interface CenterPanelProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
  onSendToAgent?: (msg: string) => void;
  onInjectToAgent?: (text: string) => void;
  selectedColumns?: string[];
  onToggleColumn?: (name: string) => void;
  onClearColumns?: () => void;
  search: string;
  visibleCols: Set<string>;
  showIssuesOnly: boolean;
}

const CenterPanel: React.FC<CenterPanelProps> = ({ project, setProject, onSendToAgent, onInjectToAgent, selectedColumns, onToggleColumn, onClearColumns, search, visibleCols, showIssuesOnly }) => {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: c['background-base'] }}>
      {selectedTableId && (
        <TableDetailModal
          tableId={selectedTableId}
          buildStep={project.buildStep}
          onClose={() => setSelectedTableId(null)}
        />
      )}
      {project.activeTab === 'columns'  && <ColumnsView project={project} setProject={setProject} onSendToAgent={onSendToAgent} onInjectToAgent={onInjectToAgent} selectedColumns={selectedColumns} onToggleColumn={onToggleColumn} onClearColumns={onClearColumns} search={search} visibleCols={visibleCols} showIssuesOnly={showIssuesOnly} />}
      {project.activeTab === 'tables'   && <TablesView project={project} onTableClick={setSelectedTableId} />}
      {project.activeTab === 'preview'  && <DataPreviewView project={project} />}
      {project.activeTab === 'notebook' && <NotebookView project={project} />}
    </div>
  );
};

// ── Tables view (diagram) ─────────────────────────────────────────────────────

const TablesView: React.FC<{ project: ProjectState; onTableClick: (id: string) => void }> = ({ project, onTableClick }) => {
  const hasData  = project.addedTables.length > 0;
  const hasJoins = project.buildStep === 'joined' || project.buildStep === 'transformed' || project.buildStep === 'healthy';

  if (!hasData) {
    return (
      <EmptyCenter
        icon="📊"
        title="No data yet"
        body="Start by telling the Data Agent what you want to build, or use the + button in the Data panel to add tables."
      />
    );
  }

  const tables      = project.addedTables;
  const layout      = getTableLayout(tables);
  const activeJoins = relationships.filter(r => tables.includes(r.leftTable) && tables.includes(r.rightTable));
  const svgH        = Math.max(420, Math.ceil(tables.length / 2) * 180 + 60);

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: sp.H, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: c['background-base'] }}>
      <svg width="620" height={svgH} viewBox={`0 0 620 ${svgH}`} style={{ maxWidth: '100%' }}>
        {tables.map((id) => {
          const meta         = tableMetadata[id];
          const pos          = layout[id];
          if (!pos) return null;
          const label        = meta?.name ?? (id.charAt(0).toUpperCase() + id.slice(1));
          const totalCols    = meta?.columns.length ?? 0;
          const selectedCols = project.columnsSelected ? (project.includedColumns[id]?.length ?? 0) : 0;
          return <TableNode key={id} x={pos.x} y={pos.y} label={label} totalCols={totalCols} selectedCols={selectedCols} onClick={() => onTableClick(id)} />;
        })}
        {hasJoins && activeJoins.map(rel => {
          const fromPos = layout[rel.leftTable];
          const toPos   = layout[rel.rightTable];
          if (!fromPos || !toPos) return null;
          const fromX = fromPos.x + TABLE_W;
          const fromY = fromPos.y + TABLE_H / 2;
          const toX   = toPos.x;
          const toY   = toPos.y + TABLE_H / 2;
          const midX  = Math.round((fromX + toX) / 2);
          const dotX  = midX;
          const dotY  = Math.round((fromY + toY) / 2);
          const connColor = '#9CA3AF';
          return (
            <g key={rel.id}>
              <path d={fromY === toY ? `M ${fromX} ${fromY} H ${toX}` : `M ${fromX} ${fromY} H ${midX} V ${toY} H ${toX}`} stroke={connColor} strokeWidth="1.5" fill="none" />
              <line x1={fromX + 16} y1={fromY} x2={fromX} y2={fromY - 14} stroke={connColor} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1={fromX + 16} y1={fromY} x2={fromX} y2={fromY}      stroke={connColor} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1={fromX + 16} y1={fromY} x2={fromX} y2={fromY + 14} stroke={connColor} strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx={dotX} cy={dotY} r="6" fill={c['background-sunken']} stroke={connColor} strokeWidth="1.5"/>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Columns view ──────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = { string: 'VARCHAR', number: 'NUMBER', date: 'DATE', boolean: 'BOOLEAN' };

const COL_TYPE_OPTIONS: SelectOption[] = [
  { id: 'attribute', label: 'Attribute' },
  { id: 'measure',   label: 'Measure' },
  { id: 'key',       label: 'Key' },
];
const AGG_SELECT_OPTIONS: SelectOption[] = ['—', 'SUM', 'AVG', 'COUNT', 'COUNT_DISTINCT', 'MAX', 'MIN'].map(v => ({ id: v, label: v }));
const FORMAT_SELECT_OPTIONS: SelectOption[] = ['text', 'number', 'currency', 'percentage', 'date'].map(v => ({ id: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));

/** Local-state wrapper so DS Select can work in a table cell without mutating ProjectState */
const SelectCell: React.FC<{ defaultValue: string; options: SelectOption[] }> = ({ defaultValue, options }) => {
  const [val, setVal] = useState(defaultValue);
  return <Select options={options} value={val} onChange={setVal} size="small" />;
};

/** Local-state wrapper so DS Checkbox can work in a table cell without mutating ProjectState */
const CheckboxCell: React.FC<{ defaultChecked: boolean; label: string }> = ({ defaultChecked, label }) => {
  const [checked, setChecked] = useState(defaultChecked);
  return <Checkbox checked={checked} label={label} onChange={setChecked} />;
};

export const DEFAULT_VISIBLE_COLS = ['sourceTable','dataType','description','aiContext','synonyms','columnType','nullPct','duplicates','blanks','anomalies'];
export const ADVANCED_COLS = [
  { key: 'aggregation', label: 'Aggregation' }, { key: 'additive', label: 'Additive' },
  { key: 'hidden', label: 'Hidden' },            { key: 'format', label: 'Format' },
  { key: 'currencyType', label: 'Currency type' }, { key: 'dateBucket', label: 'Date bucket' },
  { key: 'calendar', label: 'Calendar type' },     { key: 'geoConfig', label: 'Geo config' },
  { key: 'indexPriority', label: 'Index priority' },{ key: 'suggestion', label: 'Suggestion settings' },
  { key: 'spotIQ', label: 'SpotIQ preference' },   { key: 'customSort', label: 'Custom sort' },
  { key: 'attribution', label: 'Attribution dimension' },
];
export const COL_LABELS: Record<string, string> = {
  sourceTable: 'Source table', dataType: 'Data type', description: 'Description',
  aiContext: 'AI Context', synonyms: 'Synonyms', columnType: 'Column type',
  aggregation: 'Aggregation', additive: 'Additive', hidden: 'Hidden',
  format: 'Format', nullPct: 'Null %', duplicates: 'Duplicates', blanks: 'Blanks', anomalies: 'Anomalies',
};

const STICKY_SHADOW = '4px 0 10px rgba(0,0,0,0.14)';
const NAME_WIDTH = 160;

interface EditingCell { rowKey: string; colId: string; field: 'description' | 'aiContext' | 'synonyms' }

const ColumnsView: React.FC<{ project: ProjectState; setProject: React.Dispatch<React.SetStateAction<ProjectState>>; onSendToAgent?: (msg: string) => void; onInjectToAgent?: (text: string) => void; selectedColumns?: string[]; onToggleColumn?: (name: string) => void; onClearColumns?: () => void; search: string; visibleCols: Set<string>; showIssuesOnly: boolean }> = ({ project, setProject, onSendToAgent, onInjectToAgent, selectedColumns = [], onToggleColumn, onClearColumns, search, visibleCols, showIssuesOnly }) => {
  const [editing,    setEditing]    = useState<EditingCell | null>(null);
  const [editVal,    setEditVal]    = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [visible,    setVisible]    = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 16);
    return () => clearTimeout(t);
  }, []);
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const editRef      = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  useEffect(() => {
    if (editRef.current) editRef.current.focus();
  }, [editing]);

  useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const onScroll = () => setIsScrolled(el.scrollLeft > 1);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const rows = useMemo(() => {
    const result: Array<{ rowKey: string; tableId: string; tableName: string; col: any }> = [];
    for (const tableId of project.addedTables) {
      const included = project.includedColumns[tableId] ?? [];
      const meta = tableMetadata[tableId];
      if (!meta) continue;
      for (const colName of included) {
        const col = meta.columns.find(c => c.name === colName || c.id === colName);
        if (col) result.push({ rowKey: `${tableId}_${col.id}`, tableId, tableName: meta.name, col });
      }
    }
    return result.sort((a, b) => a.col.name.localeCompare(b.col.name));
  }, [project.addedTables, project.includedColumns]);

  const prepTransformMap = useMemo(() => {
    const map = new Map<string, string>(); // `${tableId}:${columnId}:${issueType}` → sql
    for (const t of (project.prepTransforms ?? [])) {
      map.set(`${t.tableId}:${t.columnId}:${t.issueType}`, t.sql);
    }
    return map;
  }, [project.prepTransforms]);

  const filtered = rows.filter(r => {
    if (showIssuesOnly && r.col.syncStatus !== 'broken' && r.col.syncStatus !== 'degraded') return false;
    if (search && !r.col.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!project.columnsSelected || rows.length === 0) {
    return (
      <EmptyCenter
        icon="📊"
        title="No data yet"
        body="Start by telling the Data Agent what you want to build, or use the + button in the Data panel to add tables."
      />
    );
  }

  const getVal = (col: any, field: 'description' | 'aiContext' | 'synonyms') => {
    const ov = project.columnOverrides?.[col.id];
    if (ov && field in ov) return ov[field as keyof typeof ov];
    return col[field];
  };

  const commitEdit = () => {
    if (!editing) return;
    const { colId, field } = editing;
    const val = field === 'synonyms'
      ? editVal.split(',').map((s: string) => s.trim()).filter(Boolean)
      : (editVal.trim() || null);
    setProject(p => ({
      ...p,
      columnOverrides: { ...p.columnOverrides, [colId]: { ...(p.columnOverrides?.[colId] ?? {}), [field]: val } },
    }));
    setEditing(null);
  };

  const startEdit = (rowKey: string, colId: string, field: 'description' | 'aiContext' | 'synonyms', currentVal: any) => {
    const strVal = field === 'synonyms' ? (currentVal ?? []).join(', ') : (currentVal ?? '');
    setEditing({ rowKey, colId, field });
    setEditVal(strVal);
  };

  const isMeasure = (col: any) => col.classification === 'measure';
  const isAttr    = (col: any) => col.classification !== 'measure';


  const thStyle = (minW: number): React.CSSProperties => ({
    minWidth: minW, padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`,
    textAlign: 'left', fontWeight: fw.medium, color: c['content-secondary'], fontSize: fs.xs,
    textTransform: 'uppercase', letterSpacing: '0.5px',
    whiteSpace: 'nowrap', backgroundColor: c['background-sunken'],
    position: 'sticky', top: 0, zIndex: 2,
  });
  const tdStyle = (): React.CSSProperties => ({
    padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`,
    verticalAlign: 'middle',
  });
  const naCell = (): React.CSSProperties => tdStyle();

  const EditableCell = ({ rowKey, colId, field, multiline, currentVal }: { rowKey: string; colId: string; field: 'description' | 'aiContext' | 'synonyms'; multiline: boolean; currentVal: any }) => {
    const isEditing = editing?.rowKey === rowKey && editing?.field === field;
    const display = field === 'synonyms'
      ? (currentVal?.length ? currentVal.join(', ') : null)
      : currentVal;
    const editInputStyle: React.CSSProperties = {
      width: '100%', fontFamily: ff.primary, fontSize: fs.sm, fontWeight: fw.light,
      border: `1px solid ${c['border-default']}`, borderRadius: radius.input,
      padding: '6px 10px', outline: 'none', color: c['content-primary'],
      lineHeight: 1.45, boxSizing: 'border-box', backgroundColor: c['background-base'],
    };
    if (isEditing) {
      return multiline ? (
        <textarea
          ref={editRef as React.RefObject<HTMLTextAreaElement>}
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onBlur={commitEdit}
          onFocus={e => (e.currentTarget.style.borderColor = c['border-brand'])}
          onKeyDown={e => { if (e.key === 'Escape') setEditing(null); if (e.key === 'Enter' && e.metaKey) commitEdit(); }}
          style={{ ...editInputStyle, minHeight: 56, resize: 'vertical' }}
        />
      ) : (
        <input
          ref={editRef as React.RefObject<HTMLInputElement>}
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onBlur={commitEdit}
          onFocus={e => (e.currentTarget.style.borderColor = c['border-brand'])}
          onKeyDown={e => { if (e.key === 'Escape') setEditing(null); if (e.key === 'Enter') commitEdit(); }}
          style={editInputStyle}
        />
      );
    }
    return (
      <div
        onClick={() => startEdit(rowKey, colId, field, currentVal)}
        title={display ?? undefined}
        style={{ cursor: 'text', padding: '4px 6px', borderRadius: radius.sm, fontSize: fs.sm, color: display ? c['content-primary'] : c['content-secondary'], fontStyle: display ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: multiline ? 'normal' : 'nowrap', lineHeight: 1.45, maxWidth: multiline ? 210 : 170 }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-sunken'])}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {display ?? 'Click to add'}
      </div>
    );
  };

  const show = (key: string) => visibleCols.has(key);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: c['background-base'], opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.22s ease, transform 0.22s ease' }}>



      {/* Table */}
      <div ref={tableWrapRef} style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: fs.sm, minWidth: '100%', whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle(NAME_WIDTH), position: 'sticky', left: 0, top: 0, zIndex: 4 }}>
                Column name
                {isScrolled && <div style={{ position: 'absolute', top: 0, right: -14, bottom: 0, width: 14, background: 'linear-gradient(to right, rgba(0,0,0,0.09), transparent)', pointerEvents: 'none', zIndex: 5 }} />}
              </th>
              {show('sourceTable') && <th style={thStyle(110)}>Source table</th>}
              {show('dataType')    && <th style={thStyle(90)}>Data type</th>}
              {show('description') && <th style={thStyle(220)}>Description</th>}
              {show('aiContext')   && <th style={thStyle(220)}>✦ AI Context</th>}
              {show('synonyms')    && <th style={thStyle(180)}>✦ Synonyms</th>}
              {show('columnType')  && <th style={thStyle(120)}>Column type</th>}
              {show('aggregation') && <th style={thStyle(140)}>Aggregation</th>}
              {show('additive')    && <th style={thStyle(90)}>Additive</th>}
              {show('hidden')      && <th style={thStyle(80)}>Hidden</th>}
              {show('format')      && <th style={thStyle(120)}>Format</th>}
              {show('nullPct')     && <th style={thStyle(80)}>Null %</th>}
              {show('duplicates')  && <th style={thStyle(100)}>Duplicates</th>}
              {show('blanks')      && <th style={thStyle(80)}>Blanks</th>}
              {show('anomalies')   && <th style={thStyle(90)}>Anomalies</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ rowKey, tableId, tableName, col }) => {
              const isSelected = selectedColumns.includes(col.name);
              const desc   = getVal(col, 'description') as string | null;
              const aiCtx  = getVal(col, 'aiContext') as string | null;
              const syns   = getVal(col, 'synonyms') as string[] | undefined;
              const qVal   = (v?: number) => v && v > 0
                ? <span style={{ color: c['content-primary'] }}>{v}</span>
                : <span style={{ color: c['content-secondary'] }}>—</span>;
              const rowBg  = isSelected ? c['background-subtle'] : c['background-base'];

              const effectiveSyncStatus = project.columnOverrides?.[col.id]?.syncStatus ?? col.syncStatus;
              return (
                <tr key={rowKey}
                  onClick={() => onToggleColumn?.(col.name)}
                  style={{ backgroundColor: rowBg, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = c['background-sunken']; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = rowBg; }}
                >
                  <td
                    style={{ ...tdStyle(), position: 'sticky', left: 0, zIndex: 2, fontWeight: fw.medium, backgroundColor: rowBg }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
                      {col.name}
                      {col.isPII && <span style={{ fontSize: fs.xs, background: c['background-failure'], color: c['content-failure'], padding: '1px 5px', borderRadius: radius.tag, fontWeight: fw.regular }}>PII</span>}
                      {effectiveSyncStatus === 'broken' && (
                        <span
                          title="Couldn't be translated"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: c['background-failure'], flexShrink: 0 }}
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M4 2V4.5" stroke={c['content-failure']} strokeWidth="1.5" strokeLinecap="round"/><circle cx="4" cy="6.5" r="0.75" fill={c['content-failure']}/></svg>
                        </span>
                      )}
                      {effectiveSyncStatus === 'degraded' && (
                        <span
                          title="Partially translated"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: c['background-warning'], flexShrink: 0 }}
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M4 2V4.5" stroke={c['content-warning']} strokeWidth="1.5" strokeLinecap="round"/><circle cx="4" cy="6.5" r="0.75" fill={c['content-warning']}/></svg>
                        </span>
                      )}
                    </span>
                    {isScrolled && <div style={{ position: 'absolute', top: 0, right: -14, bottom: 0, width: 14, background: 'linear-gradient(to right, rgba(0,0,0,0.09), transparent)', pointerEvents: 'none', zIndex: 5 }} />}
                  </td>
                  {show('sourceTable') && <td style={{ ...tdStyle(), color: c['content-secondary'] }}>{tableName}</td>}
                  {show('dataType')    && <td style={{ ...tdStyle(), fontFamily: ff.mono, fontSize: fs.xs, color: c['content-secondary'] }}>{TYPE_LABEL[col.type] ?? col.type.toUpperCase()}</td>}
                  {show('description') && <td style={{ ...tdStyle(), maxWidth: 220 }}><EditableCell rowKey={rowKey} colId={col.id} field="description" multiline={true} currentVal={desc} /></td>}
                  {show('aiContext')   && <td style={{ ...tdStyle(), maxWidth: 220 }}><EditableCell rowKey={rowKey} colId={col.id} field="aiContext"   multiline={true} currentVal={aiCtx} /></td>}
                  {show('synonyms')    && <td style={{ ...tdStyle(), maxWidth: 180, overflow: 'hidden' }}><EditableCell rowKey={rowKey} colId={col.id} field="synonyms" multiline={false} currentVal={syns} /></td>}
                  {show('columnType')  && (
                    <td style={tdStyle()}>
                      <SelectCell
                        defaultValue={col.classification ?? 'attribute'}
                        options={COL_TYPE_OPTIONS}
                      />
                    </td>
                  )}
                  {show('aggregation') && (
                    isAttr(col)
                      ? <td style={naCell()} title="Only applicable to measures"><span style={{ color: c['content-tertiary'] }}>—</span></td>
                      : <td style={tdStyle()}>
                          <SelectCell defaultValue={col.aggregation ?? '—'} options={AGG_SELECT_OPTIONS} />
                        </td>
                  )}
                  {show('additive') && (
                    isAttr(col)
                      ? <td style={naCell()} title="Only applicable to measures"><span style={{ color: c['content-tertiary'] }}>—</span></td>
                      : <td style={tdStyle()}>
                          <CheckboxCell defaultChecked={col.isAdditive ?? false} label="Yes" />
                        </td>
                  )}
                  {show('hidden') && (
                    <td style={tdStyle()}>
                      <CheckboxCell defaultChecked={col.isHidden ?? false} label="Hide" />
                    </td>
                  )}
                  {show('format') && (
                    <td style={tdStyle()}>
                      <SelectCell defaultValue={col.formatPattern ?? 'text'} options={FORMAT_SELECT_OPTIONS} />
                    </td>
                  )}
                  {show('nullPct') && (
                    <td style={tdStyle()}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {qVal(col.nullRate)}{col.nullRate ? '%' : ''}
                        {prepTransformMap.has(`${tableId}:${col.id}:null`) && (
                          <span title={`Transform active: ${prepTransformMap.get(`${tableId}:${col.id}:null`)}`} style={{ fontSize: 12, color: c['content-brand'], cursor: 'default', lineHeight: 1, padding: '2px 2px' }}>✦</span>
                        )}
                      </span>
                    </td>
                  )}
                  {show('duplicates') && (
                    <td style={tdStyle()}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {qVal(col.duplicateCount)}
                        {prepTransformMap.has(`${tableId}:${col.id}:duplicate`) && (
                          <span title={`Transform active: ${prepTransformMap.get(`${tableId}:${col.id}:duplicate`)}`} style={{ fontSize: 12, color: c['content-brand'], cursor: 'default', lineHeight: 1, padding: '2px 2px' }}>✦</span>
                        )}
                      </span>
                    </td>
                  )}
                  {show('blanks')     && <td style={tdStyle()}>{qVal(col.blankCount)}</td>}
                  {show('anomalies') && (
                    <td style={tdStyle()}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {qVal(col.anomalyCount)}
                        {prepTransformMap.has(`${tableId}:${col.id}:anomaly`) && (
                          <span title={`Transform active: ${prepTransformMap.get(`${tableId}:${col.id}:anomaly`)}`} style={{ fontSize: 12, color: c['content-brand'], cursor: 'default', lineHeight: 1, padding: '2px 2px' }}>✦</span>
                        )}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Visualizer layout helpers ─────────────────────────────────────────────────

const TABLE_W = 185;
const TABLE_H = 80;
const SVG_W   = 620;

function getTableLayout(tables: string[]): Record<string, { x: number; y: number }> {
  const n = tables.length;
  const positions: Record<string, { x: number; y: number }> = {};
  if (n === 0) return positions;

  if (n === 1) {
    positions[tables[0]] = { x: (SVG_W - TABLE_W) / 2, y: 170 };
  } else if (n === 2) {
    positions[tables[0]] = { x: 55, y: 170 };
    positions[tables[1]] = { x: SVG_W - TABLE_W - 55, y: 170 };
  } else {
    // First table on the left, rest stacked on the right
    const rightCount = n - 1;
    const svgH = Math.max(420, rightCount * 180 + 60);
    const spacing = svgH / (rightCount + 1);
    positions[tables[0]] = { x: 55, y: svgH / 2 - TABLE_H / 2 };
    for (let i = 1; i < n; i++) {
      positions[tables[i]] = { x: SVG_W - TABLE_W - 55, y: spacing * i - TABLE_H / 2 };
    }
  }
  return positions;
}

// ── Table node ────────────────────────────────────────────────────────────────

const TableNode: React.FC<{ x: number; y: number; label: string; totalCols: number; selectedCols: number; onClick?: () => void }> = ({ x, y, label, totalCols, selectedCols, onClick }) => {
  const colLabel = selectedCols > 0 ? `${selectedCols} / ${totalCols} columns` : `${totalCols} columns`;
  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <rect x={x} y={y} width={TABLE_W} height={TABLE_H} rx={8} fill={c['background-base']} stroke="#9CA3AF" strokeWidth="1.5"/>
      {/* Type label */}
      <text x={x + 14} y={y + 20} fill="#9CA3AF" fontSize="10" fontFamily="system-ui" letterSpacing="0.3">Table</text>
      {/* Menu dots */}
      <text x={x + TABLE_W - 14} y={y + 21} fill="#9CA3AF" fontSize="13" fontFamily="system-ui" textAnchor="end">···</text>
      {/* Table name */}
      <text x={x + 14} y={y + 44} fill={c['content-primary']} fontSize="13" fontWeight="600" fontFamily="system-ui">{label}</text>
      {/* Columns */}
      <text x={x + 14} y={y + 66} fill="#9CA3AF" fontSize="11" fontFamily="system-ui">{colLabel}</text>
    </g>
  );
};

// ── Data Preview ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 100;

const DataPreviewView: React.FC<{ project: ProjectState }> = ({ project }) => {
  const [page, setPage] = useState(1);
  const hasJoins = project.buildStep === 'joined' || project.buildStep === 'transformed' || project.buildStep === 'healthy';

  if (!hasJoins) {
    return (
      <EmptyCenter
        icon="📄"
        title="No preview available"
        body="Create joins between your tables to see the combined dataset here."
      />
    );
  }

  if (!project.columnsSelected) {
    return (
      <EmptyCenter
        icon="⊟"
        title="Select columns first"
        body="Choose which columns to include in your model to see a data preview. Ask the Data Agent to recommend columns."
      />
    );
  }

  // Build lookup maps for joins
  const campaignMap = Object.fromEntries(campaignsData.map(c => [c.campaign_id, c]));
  const userMap = Object.fromEntries(usersData.map(u => [u.user_id, u]));

  const isHealthy = project.buildStep === 'healthy';
  const isTransformed = project.buildStep === 'transformed' || isHealthy;

  // Column definitions: orders base + campaign cols + user cols + computed
  const ALL_ORDERS_COLS   = ['order_id', 'user_id', 'campaign_id', 'order_date', 'amount', 'product_category', 'status', 'region'];
  const ALL_CAMPAIGN_COLS = ['campaign_name', 'channel', 'spend', 'budget', 'target_region'];
  const ALL_USER_COLS     = ['segment', 'lifetime_value', 'age'];

  const includedOrders   = project.includedColumns['orders']    ?? ALL_ORDERS_COLS;
  const includedCampaign = project.includedColumns['campaigns'] ?? ALL_CAMPAIGN_COLS;
  const includedUser     = project.includedColumns['users']     ?? ALL_USER_COLS;

  const orderCols   = ALL_ORDERS_COLS.filter(col => includedOrders.includes(col) || col === 'campaign_id' || col === 'user_id');
  const campaignCols = ALL_CAMPAIGN_COLS.filter(col => includedCampaign.includes(col));
  const userCols    = ALL_USER_COLS.filter(col => includedUser.includes(col));
  const computedCols = isTransformed ? ['return_on_spend', 'campaign_performance'] : [];

  // Determine which column groups to show based on build state
  const hasJoinedCampaigns = project.addedTables.includes('campaigns');
  const hasJoinedUsers     = project.addedTables.includes('users');

  const allCols = [
    ...orderCols,
    ...(hasJoinedCampaigns ? campaignCols : []),
    ...(hasJoinedUsers     ? userCols     : []),
    ...computedCols,
  ];

  const totalRows = ordersData.length;
  const totalPages = Math.ceil(totalRows / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, totalRows);
  const baseRows = ordersData.slice(start, end);

  // Join each order row with its campaign and user
  type JoinedRow = Record<string, unknown>;
  const displayRows: JoinedRow[] = baseRows.map((row, i) => {
    const campaignId = isHealthy && row.campaign_id == null ? 'organic' : row.campaign_id;
    const campaign = campaignId != null ? campaignMap[campaignId as string] : undefined;
    const user = userMap[row.user_id];
    return {
      ...row,
      campaign_id: campaignId,
      ...(campaign ? {
        campaign_name:   campaign.campaign_name,
        channel:         campaign.channel,
        spend:           campaign.spend,
        budget:          campaign.budget,
        target_region:   campaign.target_region,
      } : {
        campaign_name: null, channel: null, spend: null, budget: null, target_region: null,
      }),
      ...(user ? {
        segment:        user.segment,
        lifetime_value: user.lifetime_value,
        age:            user.age,
      } : {
        segment: null, lifetime_value: null, age: null,
      }),
      return_on_spend:       isTransformed ? ((row.amount / 18700) * 100).toFixed(2) : null,
      campaign_performance:  isTransformed ? (i * 0.42 + 1.1).toFixed(3) : null,
    };
  });

  const cellPad = '3px 10px';
  const thStyle: React.CSSProperties = {
    padding: '5px 10px',
    borderBottom: `2px solid ${c['border-divider']}`,
    borderRight: `1px solid ${c['border-divider']}`,
    backgroundColor: c['background-sunken'],
    color: c['content-secondary'],
    fontWeight: fw.semibold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: fs.xs, width: 'max-content', fontFamily: ff.primary }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <th style={{ ...thStyle, width: 36, minWidth: 36, textAlign: 'right', borderRight: `2px solid ${c['border-divider']}`, fontWeight: fw.regular }}>#</th>
              {allCols.map(col => {
                const isComputed = computedCols.includes(col);
                const isCampaignCol = ALL_CAMPAIGN_COLS.includes(col);
                const isUserCol = ALL_USER_COLS.includes(col);
                const minW = col === 'campaign_name' ? 200 : isComputed ? 148 : isCampaignCol || isUserCol ? 120 : 108;
                return (
                  <th key={col} style={{ ...thStyle, minWidth: minW }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontFamily: ff.mono, fontSize: 10 }}>{col}</span>
                      {isComputed && (
                        <span style={{ fontSize: 9, fontFamily: ff.primary, backgroundColor: c['background-information'], color: c['content-brand'], padding: '1px 4px', borderRadius: 3, textTransform: 'none', letterSpacing: 0, fontWeight: fw.semibold }}>ƒx</span>
                      )}
                      <svg style={{ marginLeft: 'auto', opacity: 0.4, flexShrink: 0 }} width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr
                key={String(row['order_id']) + i}
                style={{ backgroundColor: c['background-base'] }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = c['background-base'])}
              >
                <td style={{ padding: cellPad, borderBottom: `1px solid ${c['border-divider']}`, borderRight: `2px solid ${c['border-divider']}`, color: c['content-secondary'], textAlign: 'right', fontFamily: ff.mono, fontSize: 10, userSelect: 'none', backgroundColor: c['background-sunken'] }}>
                  {start + i + 1}
                </td>
                {allCols.map(col => {
                  const val = row[col];
                  const isNull = val === null || val === undefined;
                  const isAnomaly = !isHealthy && col === 'amount' && typeof val === 'number' && (val < 0 || val > 10000);
                  const isFlagged =  isHealthy && col === 'amount' && typeof val === 'number' && (val < 0 || val > 10000);
                  return (
                    <td key={col} style={{
                      padding: cellPad,
                      borderBottom: `1px solid ${c['border-divider']}`,
                      borderRight: `1px solid ${c['border-divider']}`,
                      whiteSpace: 'nowrap',
                      fontFamily: ff.mono,
                      color: isNull ? c['content-failure'] : isAnomaly || isFlagged ? c['content-warning'] : c['content-primary'],
                      backgroundColor: isAnomaly ? c['background-warning'] : undefined,
                    }}>
                      {isNull
                        ? <em style={{ fontStyle: 'italic', opacity: 0.55 }}>null</em>
                        : String(val)
                      }
                      {isFlagged && <span style={{ marginLeft: 5, fontSize: 10, color: c['content-warning'] }}>⚠</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination bar */}
      <div style={{ height: 36, borderTop: `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'], display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${sp.D}px`, flexShrink: 0 }}>
        <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>
          {start + 1}–{end} of {totalRows} rows
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 5, border: `1px solid ${c['border-default']}`, backgroundColor: c['background-base'], cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, color: c['content-primary'] }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L4 6l3.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span style={{ fontSize: fs.xs, color: c['content-secondary'], minWidth: 48, textAlign: 'center' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 5, border: `1px solid ${c['border-default']}`, backgroundColor: c['background-base'], cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, color: c['content-primary'] }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2L8 6l-3.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── SQL / Python colorizers ───────────────────────────────────────────────────

const NB_SQL_KW = new Set([
  'SELECT', 'FROM', 'JOIN', 'LEFT', 'INNER', 'RIGHT', 'OUTER', 'ON', 'WHERE', 'AS',
  'DISTINCT', 'OVER', 'PARTITION', 'BY', 'ORDER', 'GROUP', 'HAVING', 'WITH',
  'SUM', 'COUNT', 'AVG', 'MAX', 'MIN', 'NULLIF', 'AND', 'OR', 'NOT', 'NULL',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'COALESCE',
]);
const NB_SQL_KW_RE = /\b(SELECT|FROM|JOIN|LEFT|INNER|RIGHT|OUTER|ON|WHERE|AS|DISTINCT|OVER|PARTITION|BY|ORDER|GROUP|HAVING|WITH|SUM|COUNT|AVG|MAX|MIN|NULLIF|AND|OR|NOT|NULL|CASE|WHEN|THEN|ELSE|END|COALESCE)\b/g;

const NbSqlTokens: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(new RegExp(NB_SQL_KW_RE.source, 'g'));
  return (
    <span>
      {parts.map((part, i) =>
        NB_SQL_KW.has(part)
          ? <span key={i} style={{ color: '#7C3AED', fontWeight: fw.semibold }}>{part}</span>
          : <span key={i} style={{ color: c['content-primary'] }}>{part}</span>
      )}
    </span>
  );
};

const NbSqlLine: React.FC<{ line: string }> = ({ line }) => {
  const commentIdx = line.indexOf('--');
  if (commentIdx === 0) return <span style={{ color: c['content-secondary'] }}>{line}</span>;
  if (commentIdx > 0) {
    return (
      <span>
        <NbSqlTokens text={line.slice(0, commentIdx)} />
        <span style={{ color: c['content-secondary'] }}>{line.slice(commentIdx)}</span>
      </span>
    );
  }
  return <NbSqlTokens text={line} />;
};

const NbPyLine: React.FC<{ line: string }> = ({ line }) => {
  if (line.startsWith('#')) return <span style={{ color: c['content-secondary'] }}>{line}</span>;
  if (line.startsWith('import') || line.startsWith('from')) return <span style={{ color: '#7C3AED' }}>{line}</span>;
  return <span style={{ color: c['content-primary'] }}>{line}</span>;
};

// ── Notebook ──────────────────────────────────────────────────────────────────

type NbCellType = 'sql' | 'python' | 'text';

const NB_CELL_ACCENT: Record<NbCellType, string> = {
  sql:    '#2770EF',
  python: '#D97706',
  text:   c['border-divider'],
};

interface NbCellDef {
  id: number;
  type: NbCellType;
  label: string;
  query: string;
  instruction?: string;
}

function buildNotebookCells(project: ProjectState): NbCellDef[] {
  const joined      = ['joined', 'transformed', 'healthy'].includes(project.buildStep);
  const transformed = ['transformed', 'healthy'].includes(project.buildStep);
  const healthy     = project.buildStep === 'healthy';
  return [
    { id: 1, type: 'sql', label: 'Source: orders',
      instruction: 'Imports the orders table into this model.',
      query: '-- Add Orders table into this model\nSELECT *\nFROM orders;' },
    { id: 2, type: 'sql', label: 'Source: campaigns',
      instruction: 'Imports the campaigns table into this model.',
      query: '-- Add Campaigns table into this model\nSELECT *\nFROM campaigns;' },
    { id: 3, type: 'sql', label: 'Source: users',
      instruction: 'Imports the users table into this model.',
      query: '-- Add Users table into this model\nSELECT *\nFROM users;' },
    ...(joined ? [
      { id: 4, type: 'sql' as NbCellType, label: 'Join: orders × campaigns',
        instruction: 'Joins orders with campaigns on campaign_id to combine transaction and marketing data.',
        query: '-- Join orders with campaigns on campaign_id\nSELECT o.*, c.campaign_name, c.channel, c.budget, c.spend\nFROM orders o\nLEFT JOIN campaigns c ON o.campaign_id = c.campaign_id;' },
      { id: 5, type: 'sql' as NbCellType, label: 'Join: orders × users',
        instruction: 'Joins orders with users on user_id to enrich transactions with user attributes.',
        query: '-- Join orders with users on user_id\nSELECT o.*, u.name, u.segment, u.region AS user_region, u.lifetime_value\nFROM orders o\nINNER JOIN users u ON o.user_id = u.user_id;' },
    ] : []),
    ...(transformed ? [
      { id: 6, type: 'sql' as NbCellType, label: 'Metric: return_on_spend',
        instruction: 'Calculates revenue generated per unit of ad spend.',
        query: '-- Return on Spend metric\nSELECT\n  SUM(o.amount) / NULLIF(c.spend, 0) AS return_on_spend\nFROM orders o\nLEFT JOIN campaigns c ON o.campaign_id = c.campaign_id;' },
    ] : []),
    ...(healthy ? [
      { id: 7, type: 'python' as NbCellType, label: 'Transform: normalize dates',
        instruction: 'Standardizes date formats across all source tables for consistent querying.',
        query: "# Normalize date formats across all tables\nimport pandas as pd\n\norders['order_date'] = pd.to_datetime(orders['order_date'], format='%m/%d/%Y')\ncampaigns['start_date'] = pd.to_datetime(campaigns['start_date'])\nusers['signup_date'] = pd.to_datetime(users['signup_date'], format='%Y/%m/%d')" },
      { id: 8, type: 'sql' as NbCellType, label: 'Deduplicate: orders',
        instruction: 'Removes duplicate order records, keeping the most recent version.',
        query: '-- Remove duplicate orders\nSELECT DISTINCT *\nFROM (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY order_date DESC) AS rn\n  FROM orders\n)\nWHERE rn = 1;' },
    ] : []),
  ];
}

const NotebookView: React.FC<{ project: ProjectState }> = ({ project }) => {
  const hasData = project.addedTables.length > 0;
  const cells   = buildNotebookCells(project);

  const [editingCell, setEditingCell] = useState<number | null>(null);
  const [draftValue, setDraftValue]   = useState('');
  const [cellValues, setCellValues]   = useState<Record<number, string>>({});
  const [extraCells, setExtraCells]   = useState<NbCellDef[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const getValue = (cell: NbCellDef) => cellValues[cell.id] ?? cell.query;

  const handleEdit = (cell: NbCellDef) => {
    setEditingCell(cell.id);
    setDraftValue(getValue(cell));
  };
  const handleRun = (cellId: number) => {
    setCellValues(prev => ({ ...prev, [cellId]: draftValue }));
    setEditingCell(null);
  };
  const handleCancel = () => setEditingCell(null);

  const addCell = (type: NbCellType) => {
    const defaults: Record<NbCellType, string> = {
      sql:    '-- Write SQL here\n',
      python: '# Write Python here\n',
      text:   'Add description here',
    };
    const labels: Record<NbCellType, string> = {
      sql:    'New SQL cell',
      python: 'New Python cell',
      text:   'New text cell',
    };
    const newId = 100 + extraCells.length;
    setExtraCells(prev => [...prev, { id: newId, type, label: labels[type], query: defaults[type] }]);
    setShowAddMenu(false);
  };

  const allCells = [...cells, ...extraCells];

  if (!hasData) {
    return (
      <EmptyCenter
        icon="</>"
        title="No cells yet"
        body="The notebook shows every action taken in this model as SQL or Python cells. Add data to get started."
      />
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: sp.D }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.C }}>
        {allCells.map(cell => (
          <div key={cell.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {cell.instruction && (
              <p style={{ margin: 0, fontSize: fs.xs, color: c['content-secondary'], lineHeight: '16px', paddingLeft: 4 }}>{cell.instruction}</p>
            )}
            <NotebookCell
              type={cell.type}
              label={cell.label}
              value={getValue(cell)}
              isEditing={editingCell === cell.id}
              draftValue={editingCell === cell.id ? draftValue : ''}
              onEdit={() => handleEdit(cell)}
              onRun={() => handleRun(cell.id)}
              onCancel={handleCancel}
              onDraftChange={setDraftValue}
            />
          </div>
        ))}

        {/* Add new code block */}
        <div style={{ position: 'relative', marginTop: sp.B }}>
          <button
            onClick={() => setShowAddMenu(prev => !prev)}
            style={{
              width: '100%', padding: `${sp.B}px ${sp.C}px`,
              border: `1px dashed ${c['border-divider']}`, borderRadius: 8,
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp.B,
              fontSize: fs.xs, color: c['content-secondary'], fontFamily: ff.primary,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = c['border-default']; e.currentTarget.style.color = c['content-primary']; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = c['border-divider']; e.currentTarget.style.color = c['content-secondary']; }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 1v10M1 6h10" />
            </svg>
            Add new code block
          </button>

          {showAddMenu && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, marginBottom: 4,
              background: c['background-base'], border: `1px solid ${c['border-divider']}`,
              borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden', minWidth: 160, zIndex: 10,
            }}>
              {(['sql', 'python', 'text'] as NbCellType[]).map(type => (
                <button
                  key={type}
                  onClick={() => addCell(type)}
                  style={{
                    width: '100%', padding: `${sp.B}px ${sp.C}px`,
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: sp.B,
                    fontSize: fs.xs, color: c['content-primary'],
                    fontFamily: ff.primary, textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = c['background-subtle']; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: NB_CELL_ACCENT[type], flexShrink: 0 }} />
                  {type === 'sql' ? 'SQL cell' : type === 'python' ? 'Python cell' : 'Text cell'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface NotebookCellProps {
  type: NbCellType;
  label: string;
  value: string;
  isEditing: boolean;
  draftValue: string;
  onEdit: () => void;
  onRun: () => void;
  onCancel: () => void;
  onDraftChange: (v: string) => void;
}

const NotebookCell: React.FC<NotebookCellProps> = ({
  type, label, value, isEditing, draftValue, onEdit, onRun, onCancel, onDraftChange,
}) => {
  const [headerHovered, setHeaderHovered] = useState(false);
  const displayValue = isEditing ? draftValue : value;
  const lineCount    = displayValue.split('\n').length;

  return (
    <div style={{
      border: `1px solid ${c['border-divider']}`,
      borderLeft: `3px solid ${NB_CELL_ACCENT[type]}`,
      borderRadius: 8,
      backgroundColor: c['background-base'],
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `6px ${sp.C}px`, borderBottom: `1px solid ${c['border-divider']}`,
          backgroundColor: headerHovered && !isEditing ? c['background-subtle'] : c['background-base'],
          transition: 'background-color 0.1s',
        }}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
          <span style={{
            fontSize: 10, fontWeight: fw.semibold,
            color: type === 'sql' ? '#7C3AED' : type === 'python' ? '#D97706' : c['content-secondary'],
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{type}</span>
          <span style={{ fontSize: fs.xs, color: c['content-primary'], fontWeight: fw.medium }}>{label}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, opacity: isEditing || headerHovered ? 1 : 0, transition: 'opacity 0.15s' }}>
          {isEditing ? (
            <>
              <button
                onClick={onCancel}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: fs.xs, color: c['content-secondary'], padding: '2px 6px', fontFamily: ff.primary }}
              >
                Cancel
              </button>
              <button
                onClick={onRun}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: '#16a34a', color: '#fff', border: 'none',
                  borderRadius: 5, cursor: 'pointer',
                  fontSize: fs.xs, fontWeight: fw.semibold, padding: '3px 10px', fontFamily: ff.primary,
                }}
              >
                <svg width="7" height="8" viewBox="0 0 7 8" fill="currentColor"><polygon points="0,0 7,4 0,8" /></svg>
                Run
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              title="Edit cell"
              style={{
                width: 24, height: 24, border: 'none', background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', borderRadius: 4,
                color: c['content-secondary'], padding: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])}
              onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.5 2.5a1.5 1.5 0 0 1 2.1 2.1L5 13.1l-3 .9.9-3 8.6-8.5z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {isEditing ? (
        <textarea
          autoFocus
          value={draftValue}
          onChange={e => onDraftChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: Math.max(lineCount * 20 + 24, 80),
            padding: sp.C,
            fontFamily: ff.mono,
            fontSize: fs.xs,
            color: c['content-primary'],
            backgroundColor: c['background-sunken'],
            border: 'none', outline: 'none',
            resize: 'vertical', lineHeight: '20px',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <div style={{ padding: sp.C, fontFamily: ff.mono, fontSize: fs.xs, lineHeight: '20px', backgroundColor: c['background-sunken'] }}>
          {displayValue.split('\n').map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: sp.C }}>
              <span style={{ color: c['content-secondary'], userSelect: 'none', minWidth: 18, textAlign: 'right', flexShrink: 0, opacity: 0.5 }}>
                {i + 1}
              </span>
              {type === 'sql' ? <NbSqlLine line={line} /> : <NbPyLine line={line} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Empty center ──────────────────────────────────────────────────────────────

const EmptyCenter: React.FC<{ icon: string; title: string; body: string }> = ({ icon, title, body }) => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', maxWidth: 360, padding: sp.H }}>
      <div style={{ fontSize: fs['4xl'], marginBottom: sp.D }}>{icon}</div>
      <h3 style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], margin: `0 0 ${sp.B}px` }}>{title}</h3>
      <p style={{ fontSize: fs.sm, color: c['content-secondary'], margin: 0 }}>{body}</p>
    </div>
  </div>
);

export default CenterPanel;
