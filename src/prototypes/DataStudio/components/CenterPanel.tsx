import React, { useState } from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import { Button } from '../../../components/Button';
import { ProjectState } from '../index';
import { ordersData } from '../data/mockData';
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
  const hasData  = project.buildStep !== 'empty';
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

  const hasCalc = project.buildStep === 'transformed' || project.buildStep === 'healthy';
  const isHealthy = project.buildStep === 'healthy';

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: sp.H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="620" height="420" viewBox="0 0 620 420" style={{ maxWidth: '100%' }}>

        {/* Orders — central fact table */}
        <TableNode x={60} y={160} label="Orders" cols={8} calcBadge={hasCalc} healthyBadge={isHealthy} onClick={() => onTableClick('orders')} />

        {/* Campaigns & Users — only visible when tables added */}
        <TableNode x={360} y={60}  label="Campaigns" cols={9} onClick={() => onTableClick('campaigns')} />
        <TableNode x={360} y={290} label="Users"     cols={8} onClick={() => onTableClick('users')} />

        {hasJoins && (
          <>
            {/* Orders → Campaigns (LEFT JOIN on campaign_id) */}
            <path d="M 240 195 C 295 195 295 100 360 100" stroke={c['content-brand']} strokeWidth="1.5" fill="none" />
            <circle cx="240" cy="195" r="4" fill={c['content-brand']} />
            <circle cx="360" cy="100" r="4" fill={c['content-brand']} />
            <rect x="262" y="127" width="76" height="18" rx="4" fill={c['background-information']} />
            <text x="300" y="140" fill={c['content-brand']} fontSize="10" fontFamily="system-ui" textAnchor="middle" fontWeight="500">LEFT JOIN</text>
            <text x="300" y="122" fill={c['content-secondary']} fontSize="9" fontFamily="system-ui" textAnchor="middle">campaign_id</text>

            {/* Orders → Users (INNER JOIN on user_id) */}
            <path d="M 240 215 C 295 215 295 330 360 330" stroke={c['content-brand']} strokeWidth="1.5" fill="none" />
            <circle cx="240" cy="215" r="4" fill={c['content-brand']} />
            <circle cx="360" cy="330" r="4" fill={c['content-brand']} />
            <rect x="262" y="255" width="82" height="18" rx="4" fill={c['background-information']} />
            <text x="303" y="268" fill={c['content-brand']} fontSize="10" fontFamily="system-ui" textAnchor="middle" fontWeight="500">INNER JOIN</text>
            <text x="303" y="250" fill={c['content-secondary']} fontSize="9" fontFamily="system-ui" textAnchor="middle">user_id</text>
          </>
        )}
      </svg>
    </div>
  );
};

const TableNode: React.FC<{ x: number; y: number; label: string; cols: number; calcBadge?: boolean; healthyBadge?: boolean; onClick?: () => void }> = ({ x, y, label, cols, calcBadge, healthyBadge, onClick }) => {
  const h = calcBadge ? 96 : 80;
  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <rect x={x} y={y} width={185} height={h} rx={8} fill={c['background-base']} stroke={healthyBadge ? c['content-success'] : c['border-divider']} strokeWidth={healthyBadge ? 2 : 1.5} />
      <text x={x + 14} y={y + 24} fill={c['content-primary']} fontSize="13" fontWeight="600" fontFamily="system-ui">{label}</text>
      <text x={x + 14} y={y + 42} fill={c['content-secondary']} fontSize="11" fontFamily="system-ui">{cols} columns</text>
      {Array.from({ length: Math.min(cols, 5) }).map((_, i) => (
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
        body="No joins exist, so there is no preview available. Create joins between your tables to see the combined dataset here."
      />
    );
  }

  const displayRows = ordersData.slice(0, 30);
  const columns = ['order_id', 'user_id', 'campaign_id', 'order_date', 'amount', 'product_category', 'status', 'region'];
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
  const hasData = project.buildStep !== 'empty';

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
