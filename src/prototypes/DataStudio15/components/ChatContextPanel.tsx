import React, { useState } from 'react';
import { c, fs, fw, sp, ff } from '../styles';
import { Icon } from '../../../components/icons';

export interface CreatedItem {
  type: 'plan' | 'model' | 'quality-plan' | 'instructions' | 'table' | 'spotstore-table' | 'notebook' | 'csv-dataset' | 'staging-table';
  name: string;
  subLabel?: string;
  onClick?: () => void;
  actions?: { label: string; onClick: () => void }[];
}

export interface NotebookCell {
  id: string;
  type: 'sql' | 'python' | 'file-upload' | 'markdown';
  label: string;
  code: string;
  status: 'pending' | 'running' | 'done' | 'error';
  output?: string;
}

interface ChatContextPanelProps {
  created: CreatedItem[];
  /** Existing models the agent is working with — renders in Context, not Created. */
  models?: string[];
  tables: string[];
  skills: string[];
  isNotebookFlow?: boolean;
  onNavigateToTable?: (tableName: string) => void;
}

// Inline SVGs for icons not in the Radiant registry

const DocIcon: React.FC<{ color?: string }> = ({ color = 'currentColor' }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <rect x="2" y="1" width="10" height="12" rx="1.5" stroke={color} strokeWidth="1.4" fill="none"/>
    <line x1="4.5" y1="4.5" x2="9.5" y2="4.5" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="4.5" y1="7" x2="9.5" y2="7" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="4.5" y1="9.5" x2="7.5" y2="9.5" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);

const TableIcon: React.FC<{ color?: string }> = ({ color = 'currentColor' }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <rect x="1" y="1" width="12" height="12" rx="1.5" stroke={color} strokeWidth="1.3" fill="none"/>
    <line x1="1" y1="4.5" x2="13" y2="4.5" stroke={color} strokeWidth="1.1"/>
    <line x1="5" y1="4.5" x2="5" y2="13" stroke={color} strokeWidth="1.1"/>
  </svg>
);

const PythonNotebookIcon: React.FC<{ color?: string }> = ({ color = 'currentColor' }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <rect x="3" y="1" width="9" height="12" rx="1.5" stroke={color} strokeWidth="1.3" fill="none"/>
    <line x1="1.5" y1="4" x2="3" y2="4" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="1.5" y1="7" x2="3" y2="7" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="1.5" y1="10" x2="3" y2="10" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    {/* code-style lines: indent on even lines to imply code blocks */}
    <line x1="5.5" y1="4" x2="9.5" y2="4" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="6.5" y1="5.6" x2="10" y2="5.6" stroke={color} strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.6"/>
    <line x1="5.5" y1="7" x2="8.5" y2="7" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="6.5" y1="8.6" x2="10" y2="8.6" stroke={color} strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.6"/>
    <line x1="5.5" y1="10.5" x2="9" y2="10.5" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);

const CsvIcon: React.FC<{ color?: string }> = ({ color = 'currentColor' }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <rect x="2" y="1" width="10" height="12" rx="1.5" stroke={color} strokeWidth="1.3" fill="none"/>
    <line x1="2" y1="5" x2="12" y2="5" stroke={color} strokeWidth="1.1"/>
    <line x1="2" y1="8" x2="12" y2="8" stroke={color} strokeWidth="1.1"/>
    <line x1="5.5" y1="5" x2="5.5" y2="13" stroke={color} strokeWidth="1.1"/>
    <line x1="8.5" y1="5" x2="8.5" y2="13" stroke={color} strokeWidth="1.1"/>
  </svg>
);

const StagingTableIcon: React.FC<{ color?: string }> = ({ color = 'currentColor' }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <rect x="1" y="1" width="12" height="5" rx="1.2" stroke={color} strokeWidth="1.3" fill="none"/>
    <rect x="1" y="8" width="12" height="5" rx="1.2" stroke={color} strokeWidth="1.3" fill="none"/>
    <line x1="7" y1="6" x2="7" y2="8" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M5 7.2L7 8.8L9 7.2" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ModelIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <rect x="0.5" y="0.5" width="5.5" height="5.5" rx="1.2" fill="#2770EF" />
    <rect x="8" y="0.5" width="5.5" height="5.5" rx="1.2" fill="#2770EF" opacity="0.5" />
    <rect x="0.5" y="8" width="5.5" height="5.5" rx="1.2" fill="#2770EF" opacity="0.5" />
    <rect x="8" y="8" width="5.5" height="5.5" rx="1.2" fill="#2770EF" />
  </svg>
);

const GoToArrow: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SectionHeader: React.FC<{ label: string; open: boolean; onToggle: () => void }> = ({ label, open, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      display: 'flex', alignItems: 'center', gap: sp.B,
      width: '100%', padding: `${sp.B}px ${sp.C}px`,
      background: 'none', border: 'none', cursor: 'pointer',
      color: c['content-secondary'], fontSize: fs.xs,
      fontWeight: fw.medium, textTransform: 'uppercase', letterSpacing: '0.06em',
      fontFamily: ff.primary,
    }}
  >
    <span style={{ display: 'inline-flex', transition: 'transform 0.15s ease', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
      <Icon name="chevron-down" size="xs" />
    </span>
    {label}
  </button>
);

const ChatContextPanel: React.FC<ChatContextPanelProps> = ({ created, models = [], tables, skills, isNotebookFlow = false, onNavigateToTable }) => {
  const [createdOpen, setCreatedOpen] = useState(true);
  const [sourceTablesOpen, setSourceTablesOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(true);
  const [hoveredTable, setHoveredTable] = useState<number | null>(null);
  const [hoveredModel, setHoveredModel] = useState<number | null>(null);
  const [hoveredCreated, setHoveredCreated] = useState<number | null>(null);
  const [hoveredSource, setHoveredSource] = useState<number | null>(null);
  const [environmentOpen, setEnvironmentOpen] = useState(true);
  const [hoveredEnv, setHoveredEnv] = useState<number | null>(null);

  const secondaryColor = c['content-secondary'];

  // CDW ref tables (type:'table') live in Context → Source tables sub-section
  const sourceTableItems = created.filter(item => item.type === 'table');
  // Notebook goes to Environment only in the single-notebook flow; in multi-source it stays in Created
  const environmentItems = isNotebookFlow ? created.filter(item => item.type === 'notebook') : [];
  const createdItems = created.filter(item =>
    item.type !== 'table' && item.type !== 'csv-dataset'
    && item.type !== 'instructions' && item.type !== 'plan'
    && !(isNotebookFlow && item.type === 'notebook')
  );
  // Pendo API entry appears once pendo_nps_enriched has been written to Spotstore
  const pendoFetchComplete = created.some(item => item.name === 'pendo_nps_enriched');
  const hasContext = models.length > 0 || tables.length > 0 || skills.length > 0 || sourceTableItems.length > 0 || pendoFetchComplete;

  const renderItem = (item: CreatedItem, i: number, hovered: number | null, setHovered: (v: number | null) => void) => (
    <div key={i}>
      <div
        onClick={item.onClick}
        onMouseEnter={() => setHovered(i)}
        onMouseLeave={() => setHovered(null)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: `5px ${sp.B}px`, borderRadius: 4,
          cursor: item.onClick ? 'pointer' : 'default',
          backgroundColor: hovered === i && item.onClick ? c['background-subtle'] : 'transparent',
          transition: 'background-color 0.1s ease',
        }}
      >
        {item.type === 'model'           ? <ModelIcon /> :
         item.type === 'notebook'        ? <PythonNotebookIcon color={secondaryColor} /> :
         item.type === 'csv-dataset'     ? <CsvIcon color={secondaryColor} /> :
         item.type === 'staging-table'   ? <StagingTableIcon color={secondaryColor} /> :
         item.type === 'table'           ? <TableIcon color={secondaryColor} /> :
         item.type === 'spotstore-table' ? <TableIcon color={secondaryColor} /> :
         <DocIcon color={secondaryColor} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: fs.sm, color: c['content-primary'], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
          {item.subLabel && <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 1 }}>{item.subLabel}</div>}
        </div>
      </div>
      {item.actions && item.actions.length > 0 && (
        <div style={{ paddingLeft: 28, display: 'flex', gap: sp.C, paddingBottom: 4 }}>
          {item.actions.map((action, ai) => (
            <button
              key={ai}
              onClick={action.onClick}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
                fontSize: fs.xs, color: c['content-brand'], fontFamily: ff.primary,
                fontWeight: fw.medium,
              }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      width: 280, flexShrink: 0,
      borderLeft: `1px solid ${c['border-divider']}`,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto', backgroundColor: c['background-base'],
    }}>

      {environmentItems.length > 0 && (
        <>
          <SectionHeader label="Environment" open={environmentOpen} onToggle={() => setEnvironmentOpen(o => !o)} />
          {environmentOpen && (
            <div style={{ padding: `0 ${sp.C}px ${sp.C}px`, display: 'flex', flexDirection: 'column' }}>
              {environmentItems.map((item, i) => renderItem(item, i, hoveredEnv, setHoveredEnv))}
              {(() => {
                const ready = environmentItems.some(item => item.subLabel && item.subLabel !== 'Initializing…');
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: `2px ${sp.B}px`, marginTop: 1 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: ready ? c['content-success'] : c['content-secondary'], flexShrink: 0 }} />
                    <span style={{ fontSize: fs.xs, color: ready ? c['content-success'] : c['content-secondary'] }}>
                      {ready ? 'Initialized' : 'Initializing…'}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
          <div style={{ height: 1, backgroundColor: c['border-divider'], margin: `0 ${sp.C}px` }} />
        </>
      )}

      {/* Created this session */}
      <SectionHeader label="Created" open={createdOpen} onToggle={() => setCreatedOpen(o => !o)} />

      {createdOpen && (
        <div style={{ padding: `0 ${sp.C}px ${sp.C}px`, display: 'flex', flexDirection: 'column' }}>
          {createdItems.length === 0 ? (
            <span style={{ fontSize: fs.sm, color: secondaryColor, padding: `2px ${sp.B}px` }}>Nothing created yet.</span>
          ) : createdItems.map((item, i) => renderItem(item, i, hoveredCreated, setHoveredCreated))}
        </div>
      )}

      <div style={{ height: 1, backgroundColor: c['border-divider'], margin: `0 ${sp.C}px` }} />

      {/* Context section */}
      <SectionHeader label="Context" open={contextOpen} onToggle={() => setContextOpen(o => !o)} />

      {contextOpen && (
        <div style={{ padding: `0 ${sp.C}px ${sp.C}px`, display: 'flex', flexDirection: 'column', gap: sp.C }}>
          {!hasContext ? (
            <span style={{ fontSize: fs.sm, color: secondaryColor, padding: `2px ${sp.B}px` }}>No context used yet.</span>
          ) : (
            <>
              {/* Models sub-section */}
              {models.length > 0 && (
                <div>
                  <div style={{ fontSize: fs.xs, color: secondaryColor, fontWeight: fw.medium, padding: `0 ${sp.B}px`, marginBottom: 2 }}>Models</div>
                  {models.map((m, i) => (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredModel(i)}
                      onMouseLeave={() => setHoveredModel(null)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: `4px ${sp.B}px`, borderRadius: 4,
                        backgroundColor: hoveredModel === i ? c['background-subtle'] : 'transparent',
                        transition: 'background-color 0.1s ease',
                      }}
                    >
                      <ModelIcon />
                      <span style={{ flex: 1, fontSize: fs.sm, color: c['content-primary'] }}>{m}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tables sub-section */}
              {tables.length > 0 && (
                <div>
                  <div style={{ fontSize: fs.xs, color: secondaryColor, fontWeight: fw.medium, padding: `0 ${sp.B}px`, marginBottom: 2 }}>Tables</div>
                  {tables.map((t, i) => (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredTable(i)}
                      onMouseLeave={() => setHoveredTable(null)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: `4px ${sp.B}px`, borderRadius: 4,
                        backgroundColor: hoveredTable === i ? c['background-subtle'] : 'transparent',
                        transition: 'background-color 0.1s ease',
                      }}
                    >
                      <TableIcon color={secondaryColor} />
                      <span style={{ flex: 1, fontSize: fs.sm, color: c['content-primary'] }}>{t}</span>
                      {onNavigateToTable && (
                        <button
                          onClick={() => onNavigateToTable(t)}
                          title={`Open ${t} in Data Browser`}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: 2, display: 'flex', alignItems: 'center',
                            color: secondaryColor, borderRadius: 3,
                            opacity: hoveredTable === i ? 1 : 0,
                            transition: 'opacity 0.1s ease',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])}
                          onMouseLeave={e => (e.currentTarget.style.color = secondaryColor)}
                        >
                          <GoToArrow />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Source tables sub-section — CDW refs, accessible via federated query */}
              {(sourceTableItems.length > 0 || pendoFetchComplete) && (
                <div>
                  <div style={{ fontSize: fs.xs, color: secondaryColor, fontWeight: fw.medium, padding: `0 ${sp.B}px`, marginBottom: 2 }}>Source tables</div>
                  {sourceTableItems.length > 0 && (
                    <>
                      <div style={{ fontSize: fs.xs, color: c['content-tertiary'], fontWeight: fw.medium, padding: `2px ${sp.B}px`, marginBottom: 1, letterSpacing: '0.01em' }}>
                        Snowflake · {sourceTableItems.length} table{sourceTableItems.length === 1 ? '' : 's'}
                      </div>
                      {sourceTableItems.map((item, i) => (
                        <div
                          key={i}
                          onClick={item.onClick}
                          onMouseEnter={() => setHoveredSource(i)}
                          onMouseLeave={() => setHoveredSource(null)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: `4px ${sp.B}px`, borderRadius: 4,
                            cursor: item.onClick ? 'pointer' : 'default',
                            backgroundColor: hoveredSource === i && item.onClick ? c['background-subtle'] : 'transparent',
                            transition: 'background-color 0.1s ease',
                          }}
                        >
                          <TableIcon color={secondaryColor} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: fs.sm, color: c['content-primary'], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                            {item.subLabel && <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 1 }}>{item.subLabel}</div>}
                          </div>
                          <span style={{ fontSize: 9, fontWeight: fw.semibold, color: c['content-secondary'], backgroundColor: c['background-subtle'], border: `1px solid ${c['border-default']}`, borderRadius: 3, padding: '1px 4px', flexShrink: 0, letterSpacing: '0.02em' }}>CDW</span>
                        </div>
                      ))}
                      <div style={{ fontSize: fs.xs, color: c['content-tertiary'], padding: `2px ${sp.B}px`, marginTop: 2, marginBottom: pendoFetchComplete ? sp.B : 0 }}>
                        Federated query — not copied to staging
                      </div>
                    </>
                  )}
                  {pendoFetchComplete && (
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: `4px ${sp.B}px`, borderRadius: 4,
                      }}
                    >
                      <DocIcon color={secondaryColor} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: fs.sm, color: c['content-primary'] }}>Pendo API</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: fw.semibold, color: c['content-secondary'], backgroundColor: c['background-subtle'], border: `1px solid ${c['border-default']}`, borderRadius: 3, padding: '1px 4px', flexShrink: 0, letterSpacing: '0.02em' }}>API</span>
                    </div>
                  )}
                </div>
              )}

              {/* Skills sub-section */}
              {skills.length > 0 && (
                <div>
                  <div style={{ fontSize: fs.xs, color: secondaryColor, fontWeight: fw.medium, padding: `0 ${sp.B}px`, marginBottom: 2 }}>Skills</div>
                  {skills.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: `4px ${sp.B}px` }}>
                      <Icon name="checkmark-circle" size="s" color={secondaryColor} />
                      <span style={{ fontSize: fs.sm, color: c['content-primary'] }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default ChatContextPanel;
