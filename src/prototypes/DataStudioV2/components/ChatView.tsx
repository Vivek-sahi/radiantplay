import React, { useState, useMemo, useEffect } from 'react';
import { c, ff, fs, fw, sp } from '../styles';
import { ProjectState, MultiSourceCreatedItem } from '../index';
import { AgentMessage, PlanData } from './AgentPanel';
import AgentPanel from './AgentPanel';
import PlanPanel from './PlanPanel';
import QualityPlanPanel from './QualityPlanPanel';
import ChatContextPanel, { CreatedItem, NotebookCell } from './ChatContextPanel';
import NotebookView from './NotebookView';
import InstructionsPanel from './InstructionsPanel';
import { tableMetadata } from '../data/mockData';

interface ChatViewProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
  messages: AgentMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>;
  notebookCells: NotebookCell[];
  setNotebookCells: React.Dispatch<React.SetStateAction<NotebookCell[]>>;
  initialPrompt: string;
  isFromScratch?: boolean;
  isMultiSource?: boolean;
  isNotebookFlow?: boolean;
  isDbtReview?: boolean;
  instructionsCreated: boolean;
  onBuildStart: () => void;
  onNavigateToWorkspace?: () => void;
  onBack: () => void;
  onNavigateToTable?: (tableName: string) => void;
}

const CHAT_WIDTH = 860;
const CHAT_PANEL_PCT = 0.4;

const ChatView: React.FC<ChatViewProps> = ({
  project, setProject, messages, setMessages,
  notebookCells, setNotebookCells,
  initialPrompt, isFromScratch, isMultiSource, isNotebookFlow, isDbtReview, instructionsCreated, onBuildStart, onNavigateToWorkspace, onBack, onNavigateToTable,
}) => {
  const [activePlan, setActivePlan] = useState<PlanData | null>(null);
  const [qualityPlanOpen, setQualityPlanOpen] = useState(false);
  const [instructionsPanelOpen, setInstructionsPanelOpen] = useState(false);
  const [openedMsItem, setOpenedMsItem] = useState<MultiSourceCreatedItem | null>(null);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [contextVisible, setContextVisible] = useState(false);
  const [notebookPanelOpen, setNotebookPanelOpen] = useState(false);
  const [notebookHighlightCellId, setNotebookHighlightCellId] = useState<string | null>(null);

  const isPlanOpen = activePlan !== null || qualityPlanOpen || instructionsPanelOpen || openedMsItem !== null || notebookPanelOpen;

  const openMsItem = (item: MultiSourceCreatedItem) => {
    setOpenedMsItem(item);
    setActivePlan(null);
    setQualityPlanOpen(false);
    setInstructionsPanelOpen(false);
  };

  // Staggered entrance: main content fades in immediately, context panel follows after a delay
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    const t = setTimeout(() => setContextVisible(true), 220);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, []);


  const planMsg = useMemo(() => messages.find(m => m.planData != null), [messages]);

  const created = useMemo((): CreatedItem[] => [
    ...(instructionsCreated ? [{
      type: 'instructions' as const,
      name: 'instructions.md',
      onClick: () => { setInstructionsPanelOpen(true); setActivePlan(null); setQualityPlanOpen(false); },
    }] : []),
    // Notebook flow: show from flow start; subLabel reflects state
    ...(isNotebookFlow ? [{
      type: 'notebook' as const,
      name: 'customer_health_analysis',
      subLabel: notebookCells.length > 0
        ? `Python · ${notebookCells.length} cell${notebookCells.length === 1 ? '' : 's'}`
        : 'Initializing…',
      onClick: notebookCells.length > 0
        ? () => { setNotebookPanelOpen(true); setActivePlan(null); setQualityPlanOpen(false); setOpenedMsItem(null); }
        : undefined,
    }] : []),
    ...(project.buildStep !== 'empty' ? [{
      type: 'model' as const,
      name: project.name,
      onClick: onNavigateToWorkspace,
    }] : []),
    ...(project.multiSourceCreated ?? []).map(item => ({
      type: item.type as CreatedItem['type'],
      name: item.name,
      subLabel: item.type === 'table' ? 'via SF_PROD_CUSTOMER' :
                item.type === 'spotstore-table' ? 'Spotstore' :
                item.type === 'notebook' ? 'Python · Spotstore' :
                item.type === 'csv-dataset' ? 'CSV · uploaded' :
                item.type === 'staging-table' ? 'Spotstore · staging' : undefined,
      onClick: () => openMsItem(item),
    })),
  ], [instructionsCreated, isNotebookFlow, notebookCells.length, notebookCells, project.buildStep, project.name, project.multiSourceCreated, onNavigateToWorkspace]);


  const contextTables = useMemo(() => planMsg?.planData?.tables.map(t => t.name) ?? [], [planMsg]);
  const contextSkills = useMemo(() => project.buildStep !== 'empty' ? ['create-data-model'] : [], [project.buildStep]);

  const NOTEBOOK_CARD_TO_CELL: Record<string, string> = {
    'DIM_ACCOUNTS': 'sql-1',
    'SUPPORT_CASES': 'sql-2',
    'CALL_METRICS': 'sql-3',
    'CUSTOMER_FOUND_DEFECTS': 'sql-4',
    'pendo_nps_enriched': 'sql-pendo-write',
    'customer_health_analysis': 'sql-1',
    'csm_account_mapping': 'sql-csv-write',
    'customer_health_external': 'sql-staging',
  };

  const handleNotebookCardClick = (card: { type: string; name: string }) => {
    const cellId = NOTEBOOK_CARD_TO_CELL[card.name] ?? null;
    setNotebookHighlightCellId(cellId);
    setNotebookPanelOpen(true);
    setActivePlan(null);
    setQualityPlanOpen(false);
    setOpenedMsItem(null);
  };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', backgroundColor: c['background-base'], fontFamily: ff.primary,
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.28s ease-out',
    }}>

      {/* 48px header */}
      <div style={{
        height: 48, flexShrink: 0, display: 'flex', alignItems: 'center',
        borderBottom: `1px solid ${c['border-divider']}`, padding: '0 16px',
      }}>
        <div style={{ flex: 1 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary, borderRadius: 4,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])}
            onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {project.name || 'Overview'}
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setContextPanelOpen(o => !o)}
            title={contextPanelOpen ? 'Hide context panel' : 'Show context panel'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              display: 'flex', alignItems: 'center',
              color: contextPanelOpen ? c['content-primary'] : c['content-secondary'], borderRadius: 4,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1.5" y="1.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="1.5" x2="12" y2="16.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body row */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Chat column */}
        <div style={{
          flex: isPlanOpen ? `0 0 ${CHAT_PANEL_PCT * 100}%` : '1',
          display: 'flex',
          justifyContent: isPlanOpen ? 'flex-start' : 'center',
          overflow: 'hidden',
        }}>
          <div style={{ width: isPlanOpen ? '100%' : CHAT_WIDTH, height: '100%', display: 'flex', overflow: 'hidden' }}>
            <AgentPanel
              project={project}
              setProject={setProject}
              messages={messages}
              setMessages={setMessages}
              initialPrompt={initialPrompt}
              isFromScratch={isFromScratch}
              isMultiSource={isMultiSource}
              isNotebookFlow={isNotebookFlow}
              isDbtReview={isDbtReview}
              onNotebookUpdate={(cells) => setNotebookCells(cells)}
              width={isPlanOpen ? Math.max(340, Math.round(window.innerWidth * CHAT_PANEL_PCT)) : CHAT_WIDTH}
              onOpenPlan={plan => setActivePlan(plan)}
              onOpenQualityPlan={() => setQualityPlanOpen(true)}
              onBuildStart={onBuildStart}
              onNavigateToWorkspace={onNavigateToWorkspace}
              onOpenMsItem={isNotebookFlow ? handleNotebookCardClick : openMsItem as (item: { type: string; name: string }) => void}
            />
          </div>
        </div>

        {/* Plan panel */}
        {isPlanOpen && activePlan && (
          <div style={{ flex: 1, padding: '8px 8px 8px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <PlanPanel
              plan={activePlan}
              onClose={() => setActivePlan(null)}
            />
          </div>
        )}

        {/* Quality plan panel */}
        {isPlanOpen && qualityPlanOpen && (
          <div style={{ flex: 1, padding: '8px 8px 8px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <QualityPlanPanel
              onClose={() => setQualityPlanOpen(false)}
              onApplyFixes={() => {}}
              onEditPlan={() => {}}
            />
          </div>
        )}

        {/* Instructions panel */}
        {isPlanOpen && instructionsPanelOpen && (
          <div style={{ flex: 1, padding: '8px 8px 8px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <InstructionsPanel
              modelName={project.name || 'Marketing Campaign Attribution'}
              onClose={() => setInstructionsPanelOpen(false)}
            />
          </div>
        )}

        {/* Multi-source object preview panel */}
        {isPlanOpen && openedMsItem && (
          <div style={{ flex: 1, padding: '8px 8px 8px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <MultiSourcePreviewPanel item={openedMsItem} onClose={() => setOpenedMsItem(null)} />
          </div>
        )}

        {/* Notebook panel — same layout as other panels */}
        {isPlanOpen && notebookPanelOpen && (
          <NotebookView
            cells={notebookCells}
            onClose={() => setNotebookPanelOpen(false)}
            highlightCellId={notebookHighlightCellId}
          />
        )}

        {/* Context panel — slides in from right after main content */}
        {contextPanelOpen && (
          <div style={{
            opacity: contextVisible ? 1 : 0,
            transform: contextVisible ? 'translateX(0)' : 'translateX(14px)',
            transition: 'opacity 0.26s ease-out, transform 0.26s ease-out',
            display: 'flex', flexShrink: 0,
          }}>
            <ChatContextPanel
              created={created}
              tables={contextTables}
              skills={contextSkills}
              onNavigateToTable={onNavigateToTable}
            />
          </div>
        )}

      </div>
    </div>
  );
};


const NOTEBOOK_CELLS = [
  { label: 'import requests, os', kind: 'code' as const },
  { label: 'PENDO_API_KEY = os.environ["PENDO_API_KEY"]', kind: 'code' as const },
  { label: 'resp = requests.get("https://app.pendo.io/api/v2/nps", headers={"x-pendo-integration-key": PENDO_API_KEY})', kind: 'code' as const },
  { label: '# VADER sentiment scoring', kind: 'comment' as const },
  { label: 'df["sentiment"] = df["nps_comments"].apply(score_sentiment)', kind: 'code' as const },
  { label: 'Output: 2,847 rows written to spotstore.pendo_nps_enriched', kind: 'output' as const },
];

const MultiSourcePreviewPanel: React.FC<{ item: MultiSourceCreatedItem; onClose: () => void }> = ({ item, onClose }) => {
  const panelStyle: React.CSSProperties = {
    flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`,
    borderRadius: 8, fontSize: fs.sm, fontFamily: ff.primary,
  };
  const headerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: `${sp.C}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`,
    flexShrink: 0,
  };
  const thS: React.CSSProperties = {
    padding: '5px 12px', borderBottom: `1px solid ${c['border-divider']}`,
    backgroundColor: c['background-sunken'], color: c['content-secondary'],
    fontWeight: fw.semibold, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.4px',
    textAlign: 'left', whiteSpace: 'nowrap',
  };
  const tdS: React.CSSProperties = {
    padding: '6px 12px', borderBottom: `1px solid ${c['border-divider']}`,
    color: c['content-primary'], verticalAlign: 'middle',
  };

  const tableId = item.name.replace('.ipynb', '').toLowerCase().replace(/ /g, '_');
  const meta = tableMetadata[tableId];
  const [activeTab, setActiveTab] = useState<'schema' | 'sample' | 'data' | 'sql'>('schema');

  const STAGING_SQL = `CREATE TABLE spotstore.customer_health_external AS
SELECT
  p.account_id,
  p.nps_score,
  p.nps_comments,
  p.sentiment,
  p.sentiment_score,
  c.csm_name,
  c.exec_sponsor,
  c.csm_region,
  c.account_tier
FROM spotstore.pendo_nps_enriched p
LEFT JOIN spotstore.csm_account_mapping c
  ON p.account_id = c.account_id
-- Sources: pendo_nps_enriched (2,847 rows) + csm_account_mapping (142 rows)
-- CDW tables joined at query time via federated query`;

  const renderBody = () => {
    if (item.type === 'notebook') {
      return (
        <div style={{ flex: 1, overflowY: 'auto', padding: sp.D }}>
          <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginBottom: sp.C }}>pendo_nps_ingestion.ipynb · Python · 5 cells</div>
          {NOTEBOOK_CELLS.map((cell, i) => (
            <div key={i} style={{
              marginBottom: sp.B, padding: `${sp.B}px ${sp.C}px`,
              borderRadius: 4, fontFamily: ff.mono, fontSize: 12,
              backgroundColor: cell.kind === 'output' ? '#F0FDF4' : cell.kind === 'comment' ? 'transparent' : c['background-sunken'],
              color: cell.kind === 'output' ? '#16A34A' : cell.kind === 'comment' ? c['content-secondary'] : c['content-primary'],
              fontStyle: cell.kind === 'comment' ? 'italic' : 'normal',
              border: cell.kind === 'output' ? '1px solid #BBF7D0' : 'none',
            }}>
              {cell.label}
            </div>
          ))}
        </div>
      );
    }

    if (!meta) {
      return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c['content-secondary'] }}>No preview available</div>;
    }

    const isStaging = item.type === 'staging-table';
    const isCdw = item.type === 'table' || item.type === 'spotstore-table';
    const dqColor = meta.dqScore == null ? c['content-secondary'] : meta.dqScore >= 90 ? '#16A34A' : meta.dqScore >= 80 ? '#D97706' : '#DC2626';

    return (
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Metadata strip */}
        <div style={{ padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, backgroundColor: c['background-sunken'], display: 'flex', flexWrap: 'wrap', gap: `${sp.B}px ${sp.D}px`, fontSize: fs.xs, color: c['content-secondary'] }}>
          <span>{meta.connection} · {meta.columns.length} columns · {meta.rowCount.toLocaleString()} rows</span>
          {meta.owner && <span>Owner: {meta.owner}</span>}
          {meta.lastSynced && <span>Last synced: {new Date(meta.lastSynced).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
          {meta.dqScore != null && (
            <span style={{ fontWeight: fw.semibold, color: dqColor }}>DQ {meta.dqScore}/100</span>
          )}
        </div>
        {meta.description && (
          <div style={{ padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.5 }}>
            {meta.description}
          </div>
        )}
        {/* Tabs for CDW tables with sample rows */}
        {isCdw && meta.sampleRows && (
          <div style={{ display: 'flex', borderBottom: `1px solid ${c['border-divider']}`, padding: `0 ${sp.D}px` }}>
            {(['schema', 'sample'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: `${sp.B}px ${sp.C}px`, fontSize: fs.xs, fontWeight: activeTab === tab ? fw.semibold : fw.regular, color: activeTab === tab ? c['content-brand'] : c['content-secondary'], borderBottom: activeTab === tab ? `2px solid ${c['content-brand']}` : '2px solid transparent', marginBottom: -1, fontFamily: ff.primary }}>
                {tab === 'schema' ? 'Schema' : 'Sample data'}
              </button>
            ))}
          </div>
        )}
        {isStaging && (
          <>
            {/* Federated query note */}
            <div style={{ padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, backgroundColor: c['background-sunken'], fontSize: fs.xs, color: c['content-secondary'], display: 'flex', alignItems: 'flex-start', gap: sp.B }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><line x1="6.5" y1="4" x2="6.5" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="6.5" cy="9" r="0.7" fill="currentColor"/></svg>
              <span>CDW tables (DIM_ACCOUNTS, SUPPORT_CASES, CALL_METRICS, CUSTOMER_FOUND_DEFECTS) are joined via federated query at runtime — they are not copied into this staging table.</span>
            </div>
            {/* Tabs: Data | SQL */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${c['border-divider']}`, padding: `0 ${sp.D}px` }}>
              {(['data', 'sql'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: `${sp.B}px ${sp.C}px`, fontSize: fs.xs, fontWeight: (activeTab === tab || (tab === 'data' && activeTab === 'schema')) ? fw.semibold : fw.regular, color: (activeTab === tab || (tab === 'data' && activeTab === 'schema')) ? c['content-brand'] : c['content-secondary'], borderBottom: (activeTab === tab || (tab === 'data' && activeTab === 'schema')) ? `2px solid ${c['content-brand']}` : '2px solid transparent', marginBottom: -1, fontFamily: ff.primary }}>
                  {tab === 'data' ? 'Data' : 'SQL'}
                </button>
              ))}
            </div>
          </>
        )}
        {/* SQL tab (staging only) */}
        {isStaging && activeTab === 'sql' ? (
          <div style={{ padding: `${sp.C}px ${sp.D}px`, position: 'relative' }}>
            <pre style={{ margin: 0, fontFamily: ff.mono, fontSize: 11, color: c['content-primary'], backgroundColor: c['background-sunken'], padding: sp.C, borderRadius: 4, overflowX: 'auto', lineHeight: 1.6, whiteSpace: 'pre' }}>
              {STAGING_SQL}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(STAGING_SQL)}
              style={{ position: 'absolute', top: sp.C + 4, right: sp.H + 4, background: c['background-base'], border: `1px solid ${c['border-default']}`, borderRadius: 4, padding: '2px 8px', fontSize: fs.xs, color: c['content-secondary'], cursor: 'pointer', fontFamily: ff.primary }}
            >
              Copy
            </button>
          </div>
        ) : /* Sample data tab */
        isCdw && activeTab === 'sample' && meta.sampleRows ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: fs.xs }}>
              <thead>
                <tr>
                  {Object.keys(meta.sampleRows[0]).map(col => (
                    <th key={col} style={thS}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {meta.sampleRows.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} style={{ ...tdS, fontFamily: val === null ? ff.primary : typeof val === 'number' ? ff.mono : ff.primary, color: val === null ? c['content-tertiary'] : c['content-primary'] }}>
                        {val === null ? 'null' : val === true ? 'true' : val === false ? 'false' : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Schema tab (default) */
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: fs.xs }}>
            <thead>
              <tr>
                <th style={thS}>Column</th>
                <th style={thS}>Type</th>
                {isCdw && <th style={thS}>Null %</th>}
                {isStaging && <th style={thS}>Source table</th>}
                {isStaging && <th style={thS}>Source column</th>}
              </tr>
            </thead>
            <tbody>
              {meta.columns.map(col => (
                <tr key={col.id}>
                  <td style={{ ...tdS, fontWeight: fw.medium }}>
                    {col.name}
                    {col.classification === 'key' && <span style={{ marginLeft: 4, fontSize: 9, fontWeight: fw.semibold, color: '#2770EF', backgroundColor: '#DEE8FA', borderRadius: 3, padding: '1px 4px' }}>KEY</span>}
                  </td>
                  <td style={{ ...tdS, fontFamily: ff.mono, color: c['content-secondary'] }}>{col.type.toUpperCase()}</td>
                  {isCdw && (
                    <td style={{ ...tdS, color: (col.nullRate ?? 0) > 10 ? '#D97706' : c['content-secondary'] }}>
                      {col.nullRate != null ? `${col.nullRate}%` : '—'}
                    </td>
                  )}
                  {isStaging && <td style={{ ...tdS, color: c['content-secondary'] }}>{col.sourceTable ?? '—'}</td>}
                  {isStaging && <td style={{ ...tdS, fontFamily: ff.mono, color: c['content-secondary'] }}>{col.sourceColumn ?? '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const title = item.type === 'staging-table' ? item.name :
                item.type === 'notebook'      ? 'pendo_nps_ingestion.ipynb' :
                item.type === 'csv-dataset'   ? item.name :
                item.name;

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <div style={{ fontWeight: fw.semibold, color: c['content-primary'] }}>{title}</div>
          <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2 }}>
            {item.type === 'staging-table' ? 'Spotstore · staging table' :
             item.type === 'notebook'      ? 'Python notebook' :
             item.type === 'csv-dataset'   ? 'CSV · Spotstore' :
             'Snowflake table'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: c['content-secondary'], borderRadius: 4, display: 'flex' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </div>
      {renderBody()}
    </div>
  );
};

export default ChatView;
