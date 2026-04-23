import React, { useState } from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import { Button } from '../../../components/Button';
import { ProjectState } from '../index';
import { ordersData, tableMetadata, relationships } from '../data/mockData';
import TableDetailModal from './TableDetailModal';

interface CenterPanelProps {
  project: ProjectState;
}

const CenterPanel: React.FC<CenterPanelProps> = ({ project }) => {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: c['background-sunken'] }}>
      {selectedTableId && (
        <TableDetailModal
          tableId={selectedTableId}
          buildStep={project.buildStep}
          onClose={() => setSelectedTableId(null)}
        />
      )}
      {project.activeTab === 'visualizer' && <VisualizerView project={project} onTableClick={setSelectedTableId} />}
      {project.activeTab === 'preview'    && <DataPreviewView project={project} />}
      {project.activeTab === 'notebook'   && <NotebookView project={project} />}
    </div>
  );
};

// ── Visualizer ────────────────────────────────────────────────────────────────

const VisualizerView: React.FC<{ project: ProjectState; onTableClick: (id: string) => void }> = ({ project, onTableClick }) => {
  const [subView, setSubView] = useState<'tables' | 'columns'>('tables');
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

  const hasCalc   = project.buildStep === 'transformed' || project.buildStep === 'healthy';
  const isHealthy = project.buildStep === 'healthy';
  const tables    = project.addedTables;
  const totalIncluded = Object.values(project.includedColumns).flat().length;

  const layout       = getTableLayout(tables);
  const activeJoins  = relationships.filter(
    r => tables.includes(r.leftTable) && tables.includes(r.rightTable)
  );
  const svgH = Math.max(420, Math.ceil(tables.length / 2) * 180 + 60);

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Tables / Columns toggle */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', padding: `${sp.C}px 0 0`, backgroundColor: c['background-sunken'] }}>
        <div style={{ display: 'flex', gap: 2, padding: 3, backgroundColor: c['background-subtle'], borderRadius: 8, border: `1px solid ${c['border-divider']}` }}>
          {(['tables', 'columns'] as const).map(v => (
            <button
              key={v}
              onClick={() => setSubView(v)}
              style={{
                padding: `${sp.A}px ${sp.C}px`,
                borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: ff.primary, fontSize: fs.xs,
                backgroundColor: subView === v ? c['background-base'] : 'transparent',
                color:            subView === v ? c['content-primary']  : c['content-secondary'],
                fontWeight:       subView === v ? fw.medium : fw.regular,
                boxShadow:        subView === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.12s',
              }}
            >
              {v === 'tables' ? 'Tables' : `Columns${project.columnsSelected ? ` (${totalIncluded})` : ''}`}
            </button>
          ))}
        </div>
      </div>

      {subView === 'tables' ? (
        <div style={{ flex: 1, overflow: 'auto', padding: sp.H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="620" height={svgH} viewBox={`0 0 620 ${svgH}`} style={{ maxWidth: '100%' }}>

            {/* Table nodes — dynamic, one per added table */}
            {tables.map((id, idx) => {
              const meta = tableMetadata[id];
              const pos  = layout[id];
              if (!pos) return null;
              const label = meta?.name ?? (id.charAt(0).toUpperCase() + id.slice(1));
              const cols  = meta?.columns.length ?? 0;
              return (
                <TableNode
                  key={id}
                  x={pos.x} y={pos.y}
                  label={label} cols={cols}
                  calcBadge={hasCalc && idx === 0}
                  healthyBadge={isHealthy && idx === 0}
                  onClick={() => onTableClick(id)}
                />
              );
            })}

            {/* Join lines — dynamic, based on relationships data */}
            {hasJoins && activeJoins.map(rel => {
              const fromPos = layout[rel.leftTable];
              const toPos   = layout[rel.rightTable];
              if (!fromPos || !toPos) return null;

              const fromX = fromPos.x + TABLE_W;
              const fromY = fromPos.y + TABLE_H / 2;
              const toX   = toPos.x;
              const toY   = toPos.y + TABLE_H / 2;
              const midX  = (fromX + toX) / 2;
              const midY  = (fromY + toY) / 2;
              const label = rel.joinType.toUpperCase() + ' JOIN';
              const labelW = label.length * 5.8 + 16;

              return (
                <g key={rel.id}>
                  <path d={`M ${fromX} ${fromY} C ${midX} ${fromY} ${midX} ${toY} ${toX} ${toY}`} stroke={c['content-brand']} strokeWidth="1.5" fill="none" />
                  <circle cx={fromX} cy={fromY} r="4" fill={c['content-brand']} />
                  <circle cx={toX}   cy={toY}   r="4" fill={c['content-brand']} />
                  <rect x={midX - labelW / 2} y={midY + 2} width={labelW} height={18} rx="4" fill={c['background-information']} />
                  <text x={midX} y={midY + 15} fill={c['content-brand']} fontSize="10" fontFamily="system-ui" textAnchor="middle" fontWeight="500">{label}</text>
                  <text x={midX} y={midY - 3}  fill={c['content-secondary']} fontSize="9" fontFamily="system-ui" textAnchor="middle">{rel.leftColumn}</text>
                </g>
              );
            })}

          </svg>
        </div>
      ) : (
        <ColumnsView project={project} />
      )}
    </div>
  );
};

// ── Columns view ──────────────────────────────────────────────────────────────

const TABLE_COLORS: Record<string, string> = {
  orders:    '#2770ef',
  campaigns: '#7c3aed',
  users:     '#059669',
};

const ColumnsView: React.FC<{ project: ProjectState }> = ({ project }) => {
  if (!project.columnsSelected || Object.keys(project.includedColumns).length === 0) {
    return (
      <EmptyCenter
        icon="⊟"
        title="No columns selected"
        body="Ask the Data Agent to recommend columns for your model, or select them manually from the left panel."
      />
    );
  }

  // Flatten to rows in table order
  const rows: Array<{ tableId: string; tableName: string; tableColor: string; colName: string; type: string; classification?: string; aggregation?: string; description: string | null; isPII?: boolean; nullRate?: number; synonyms?: string[] }> = [];
  for (const tableId of project.addedTables) {
    const included = project.includedColumns[tableId] ?? [];
    const meta = tableMetadata[tableId];
    if (!meta) continue;
    for (const colName of included) {
      const col = meta.columns.find(c => c.name === colName);
      if (col) rows.push({
        tableId,
        tableName: meta.name,
        tableColor: TABLE_COLORS[tableId] ?? c['content-secondary'],
        colName: col.name,
        type: col.type,
        classification: col.classification,
        aggregation: col.aggregation,
        description: col.description,
        isPII: col.isPII,
        nullRate: col.nullRate,
        synonyms: col.synonyms,
      });
    }
  }

  const classColor = (cls?: string) =>
    cls === 'measure'   ? { bg: '#eff6ff', text: '#1d4ed8' } :
    cls === 'attribute' ? { bg: '#f0fdf4', text: '#15803d' } :
    cls === 'key'       ? { bg: '#fef9c3', text: '#a16207' } :
                          { bg: c['background-subtle'], text: c['content-secondary'] };

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      {/* Column header */}
      <div style={{ display: 'grid', gridTemplateColumns: '160px 90px 90px 1fr 100px', gap: 0, position: 'sticky', top: 0, zIndex: 1, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}` }}>
        {['Column', 'Type', 'Role', 'Description', 'Profile'].map(h => (
          <div key={h} style={{ padding: `${sp.B}px ${sp.C}px`, fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'] }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {rows.map(({ tableId, tableName, tableColor, colName, type, classification, aggregation, description, isPII, nullRate, synonyms }, i) => {
        const cls = classColor(classification);
        return (
          <div
            key={`${tableId}-${colName}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 90px 90px 1fr 100px',
              gap: 0,
              borderBottom: `1px solid ${c['border-divider']}`,
              backgroundColor: i % 2 === 0 ? c['background-base'] : c['background-sunken'],
            }}
          >
            {/* Column name + table badge */}
            <div style={{ padding: `${sp.B}px ${sp.C}px`, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-primary'], fontFamily: 'monospace' }}>{colName}</span>
              <span style={{ fontSize: 10, color: tableColor, backgroundColor: tableColor + '18', padding: '1px 6px', borderRadius: 4, width: 'fit-content', fontWeight: fw.medium }}>{tableName}</span>
            </div>
            {/* Type */}
            <div style={{ padding: `${sp.B}px ${sp.C}px`, display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontFamily: 'monospace' }}>{type}</span>
            </div>
            {/* Classification */}
            <div style={{ padding: `${sp.B}px ${sp.C}px`, display: 'flex', alignItems: 'center', gap: sp.A }}>
              {classification && (
                <span style={{ fontSize: 10, backgroundColor: cls.bg, color: cls.text, padding: '2px 6px', borderRadius: 4, fontWeight: fw.medium }}>
                  {classification}{aggregation ? ` · ${aggregation}` : ''}
                </span>
              )}
              {isPII && (
                <span style={{ fontSize: 10, backgroundColor: '#fef2f2', color: '#dc2626', padding: '2px 5px', borderRadius: 4, fontWeight: fw.medium }}>PII</span>
              )}
            </div>
            {/* Description */}
            <div style={{ padding: `${sp.B}px ${sp.C}px`, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
              {description
                ? <span style={{ fontSize: fs.xs, color: c['content-primary'], lineHeight: '16px' }}>{description}</span>
                : <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontStyle: 'italic' }}>No description</span>
              }
              {synonyms && synonyms.length > 0 && (
                <span style={{ fontSize: 10, color: c['content-secondary'] }}>also: {synonyms.join(', ')}</span>
              )}
            </div>
            {/* Profile */}
            <div style={{ padding: `${sp.B}px ${sp.C}px`, display: 'flex', alignItems: 'center' }}>
              {nullRate && nullRate > 0
                ? <span style={{ fontSize: 10, color: nullRate > 10 ? c['content-warning'] : c['content-secondary'] }}>{nullRate}% null</span>
                : <span style={{ fontSize: 10, color: c['content-secondary'] }}>—</span>
              }
            </div>
          </div>
        );
      })}
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

const TableNode: React.FC<{ x: number; y: number; label: string; cols: number; calcBadge?: boolean; healthyBadge?: boolean; onClick?: () => void }> = ({ x, y, label, cols, calcBadge, healthyBadge, onClick }) => {
  const h = calcBadge ? 96 : 80;
  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <rect x={x} y={y} width={TABLE_W} height={h} rx={8} fill={c['background-base']} stroke={healthyBadge ? c['content-success'] : c['border-divider']} strokeWidth={healthyBadge ? 2 : 1.5} />
      <text x={x + 14} y={y + 24} fill={c['content-primary']} fontSize="13" fontWeight="600" fontFamily="system-ui">{label}</text>
      {cols > 0 && <text x={x + 14} y={y + 42} fill={c['content-secondary']} fontSize="11" fontFamily="system-ui">{cols} columns</text>}
      {Array.from({ length: Math.min(Math.max(cols, 0), 5) }).map((_, i) => (
        <rect key={i} x={x + 14 + i * 22} y={y + 55} width={16} height={5} rx={3} fill={c['border-divider']} />
      ))}
      {calcBadge && (
        <text x={x + 14} y={y + 80} fill={c['content-brand']} fontSize="10" fontFamily="system-ui">ƒx +3 calculated columns</text>
      )}
      {healthyBadge && (
        <text x={x + 130} y={y + 16} fill={c['content-success']} fontSize="10" fontFamily="system-ui" fontWeight="600">✓ AI-ready</text>
      )}
    </g>
  );
};

// ── Data Preview ──────────────────────────────────────────────────────────────

const DataPreviewView: React.FC<{ project: ProjectState }> = ({ project }) => {
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

  const displayRows = ordersData.slice(0, 30);
  // Use only the included columns from orders (the base table for preview rows)
  const ALL_ORDERS_COLS = ['order_id', 'user_id', 'campaign_id', 'order_date', 'amount', 'product_category', 'status', 'region'];
  const includedOrdersCols = project.includedColumns['orders'] ?? ALL_ORDERS_COLS;
  const columns = ALL_ORDERS_COLS.filter(col => includedOrdersCols.includes(col));
  const extraCols = project.buildStep === 'transformed' || project.buildStep === 'healthy'
    ? [...columns, 'return_on_spend', 'campaign_performance']
    : columns;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ height: 40, borderBottom: `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'], display: 'flex', alignItems: 'center', padding: `0 ${sp.C}px`, gap: sp.B, flexShrink: 0 }}>
        {['←', '→', '↑↓', '⊞', '≡', '⇔', '$', '%', 'T', 'ƒx', '▼', '↓'].map(tool => (
          <Button key={tool} variant="tertiary" size="small">{tool}</Button>
        ))}
        <div style={{ width: 1, height: 16, backgroundColor: c['border-divider'] }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, fontSize: fs.xs, color: c['content-secondary'] }}>
          <span style={{ fontWeight: fw.medium, color: c['content-primary'] }}>order_id</span>
          <span>ƒx</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: fs.xs, width: 'max-content' }}>
          <thead>
            <tr style={{ backgroundColor: c['background-subtle'], position: 'sticky', top: 0, zIndex: 1 }}>
              <th style={{ width: 40, padding: `${sp.B}px ${sp.C}px`, borderBottom: `1px solid ${c['border-divider']}`, borderRight: `1px solid ${c['border-divider']}`, color: c['content-secondary'], fontWeight: fw.regular, textAlign: 'center' }}>#</th>
              {extraCols.map(col => (
                <th key={col} style={{ padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, borderRight: `1px solid ${c['border-divider']}`, color: c['content-secondary'], fontWeight: fw.medium, textAlign: 'left', whiteSpace: 'nowrap', minWidth: col === 'return_on_spend' || col === 'campaign_performance' ? 160 : 120 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {col}
                    {(col === 'return_on_spend' || col === 'campaign_performance') && (
                      <span style={{ fontSize: fs.xs, backgroundColor: c['background-information'], color: c['content-brand'], padding: '0 3px', borderRadius: 3 }}>ƒx</span>
                    )}
                    <span style={{ marginLeft: 'auto', color: c['content-secondary'], opacity: 0.5 }}>▾</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={row.order_id + i} style={{ backgroundColor: i % 2 === 0 ? c['background-base'] : c['background-subtle'] }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-information'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? c['background-base'] : c['background-subtle'])}
              >
                <td style={{ padding: `${sp.A}px ${sp.C}px`, borderBottom: `1px solid ${c['border-divider']}`, borderRight: `1px solid ${c['border-divider']}`, color: c['content-secondary'], textAlign: 'center' }}>{i + 1}</td>
                {columns.map(col => {
                  const raw = (row as unknown as Record<string, unknown>)[col];
                  const isHealthy = project.buildStep === 'healthy';
                  // After health fix: nulls are filled
                  const val = isHealthy && (raw === null || raw === undefined) && col === 'campaign_id'
                    ? 'organic'
                    : raw;
                  const isNull = val === null || val === undefined;
                  const isAnomaly = !isHealthy && col === 'amount' && typeof val === 'number' && (val < 0 || val > 10000);
                  const isFlagged = isHealthy && col === 'amount' && typeof val === 'number' && (val < 0 || val > 10000);
                  return (
                    <td key={col} style={{ padding: `${sp.A}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, borderRight: `1px solid ${c['border-divider']}`, whiteSpace: 'nowrap', color: isNull ? c['content-failure'] : isAnomaly ? c['content-warning'] : isFlagged ? c['content-warning'] : c['content-primary'], backgroundColor: isAnomaly ? c['background-warning'] : undefined }}>
                      {isNull ? <em style={{ color: c['content-failure'] }}>null</em> : String(val)}
                      {isFlagged && <span style={{ marginLeft: 4, fontSize: fs.xs, backgroundColor: c['background-warning'], color: c['content-warning'], padding: '1px 4px', borderRadius: 3 }}>⚠</span>}
                    </td>
                  );
                })}
                {(project.buildStep === 'transformed' || project.buildStep === 'healthy') && (
                  <>
                    <td style={{ padding: `${sp.A}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, borderRight: `1px solid ${c['border-divider']}`, color: c['content-brand'] }}>
                      {((row.amount / 18700) * 100).toFixed(2)}
                    </td>
                    <td style={{ padding: `${sp.A}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, borderRight: `1px solid ${c['border-divider']}`, color: c['content-brand'] }}>
                      {(i * 0.42 + 1.1).toFixed(3)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Notebook ──────────────────────────────────────────────────────────────────

const NotebookView: React.FC<{ project: ProjectState }> = ({ project }) => {
  const hasData = project.addedTables.length > 0;

  const cells = [
    { id: 1, type: 'sql', comment: '// Add Orders table into this project',     query: 'SELECT *\nFROM orders;' },
    { id: 2, type: 'sql', comment: '// Add Campaigns table into this project',  query: 'SELECT *\nFROM campaigns;' },
    { id: 3, type: 'sql', comment: '// Add Users table into this project',      query: 'SELECT *\nFROM users;' },
    ...(project.buildStep === 'joined' || project.buildStep === 'transformed' || project.buildStep === 'healthy' ? [
      { id: 4, type: 'sql', comment: '// Join orders with campaigns on campaign_id', query: 'SELECT o.*, c.campaign_name, c.channel, c.budget, c.spend\nFROM orders o\nLEFT JOIN campaigns c ON o.campaign_id = c.campaign_id;' },
      { id: 5, type: 'sql', comment: '// Join orders with users on user_id',         query: 'SELECT o.*, u.name, u.segment, u.region AS user_region, u.lifetime_value\nFROM orders o\nINNER JOIN users u ON o.user_id = u.user_id;' },
    ] : []),
    ...(project.buildStep === 'transformed' || project.buildStep === 'healthy' ? [
      { id: 6, type: 'sql', comment: '// Return on Spend metric',   query: 'SELECT\n  SUM(o.amount) / NULLIF(c.spend, 0) AS return_on_spend\nFROM orders o\nLEFT JOIN campaigns c ON o.campaign_id = c.campaign_id;' },
    ] : []),
    ...(project.buildStep === 'healthy' ? [
      { id: 7, type: 'python', comment: '# Normalize date formats across all tables', query: 'import pandas as pd\n\norders[\'order_date\'] = pd.to_datetime(orders[\'order_date\'], format=\'%m/%d/%Y\')\ncampaigns[\'start_date\'] = pd.to_datetime(campaigns[\'start_date\'])\nusers[\'signup_date\'] = pd.to_datetime(users[\'signup_date\'], format=\'%Y/%m/%d\')' },
      { id: 8, type: 'sql', comment: '// Remove duplicate orders',                   query: 'SELECT DISTINCT *\nFROM (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY order_date DESC) AS rn\n  FROM orders\n)\nWHERE rn = 1;' },
    ] : []),
  ];

  if (!hasData) {
    return (
      <EmptyCenter
        icon="</>"
        title="No cells yet"
        body="The notebook shows every action taken in this project as SQL or Python cells. Add data to get started."
      />
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: sp.D }}>

      {/* Add cell toolbar */}
      <div style={{ marginBottom: sp.D }}>
        <Button variant="secondary" size="small" icon="plus" iconPosition="leading">Add cell</Button>
      </div>

      {/* Cells */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.C }}>
        {cells.map(cell => (
          <NotebookCell key={cell.id} {...cell} />
        ))}
      </div>
    </div>
  );
};

const NotebookCell: React.FC<{ id: number; type: string; comment: string; query: string }> = ({ id, type, comment, query }) => (
  <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 8, backgroundColor: c['background-base'], overflow: 'hidden' }}>
    {/* Cell header */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.B}px ${sp.C}px`, borderBottom: `1px solid ${c['border-divider']}`, backgroundColor: c['background-subtle'] }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
        <span style={{ fontSize: fs.xs, backgroundColor: type === 'sql' ? '#E0E7FF' : '#FEF9C3', color: type === 'sql' ? '#3730A3' : '#854D0E', padding: '1px 6px', borderRadius: 3, fontWeight: fw.semibold, textTransform: 'uppercase' }}>{type}</span>
        <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>Cell {id}</span>
      </div>
      <div style={{ display: 'flex', gap: sp.B }}>
        <IconButton>✏</IconButton>
        <IconButton>▶</IconButton>
        <IconButton>…</IconButton>
      </div>
    </div>
    {/* Cell body */}
    <div style={{ padding: sp.C, fontFamily: ff.mono, fontSize: fs.xs }}>
      <div style={{ color: c['content-secondary'] }}>{comment}</div>
      {query.split('\n').map((line, i) => (
        <div key={i}>
          <span style={{ color: c['content-secondary'], marginRight: 16, userSelect: 'none', fontSize: fs.xs }}>{i + 1}</span>
          <ColorizedLine line={line} lang={type} />
        </div>
      ))}
    </div>
  </div>
);

const ColorizedLine: React.FC<{ line: string; lang: string }> = ({ line, lang }) => {
  if (lang === 'sql') {
    const keywords = /\b(SELECT|FROM|JOIN|LEFT|INNER|ON|WHERE|AS|DISTINCT|OVER|PARTITION|BY|ORDER|SUM|COUNT|NULLIF|AND|OR|NULL)\b/g;
    const parts = line.split(keywords);
    return (
      <span>
        {parts.map((part, i) =>
          keywords.test(part)
            ? <span key={i} style={{ color: '#7C3AED', fontWeight: fw.semibold }}>{part}</span>
            : <span key={i} style={{ color: c['content-primary'] }}>{part}</span>
        )}
      </span>
    );
  }
  if (lang === 'python') {
    if (line.startsWith('#')) return <span style={{ color: c['content-secondary'] }}>{line}</span>;
    if (line.startsWith('import')) return <span style={{ color: '#7C3AED' }}>{line}</span>;
    return <span style={{ color: c['content-primary'] }}>{line}</span>;
  }
  return <span style={{ color: c['content-primary'] }}>{line}</span>;
};

const IconButton: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Button variant="tertiary" size="small">{children}</Button>
);

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
