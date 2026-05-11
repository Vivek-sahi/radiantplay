import React, { useState } from 'react';
import { c, fs, fw, sp, ff } from '../styles';
import { Icon } from '../../../components/icons';

export interface CreatedItem {
  type: 'plan' | 'model' | 'quality-plan';
  name: string;
  onClick?: () => void;
  actions?: { label: string; onClick: () => void }[];
}

interface ChatContextPanelProps {
  created: CreatedItem[];
  /** Existing models the agent is working with — renders in Context, not Created. */
  models?: string[];
  tables: string[];
  skills: string[];
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

const ChatContextPanel: React.FC<ChatContextPanelProps> = ({ created, models = [], tables, skills, onNavigateToTable }) => {
  const [createdOpen, setCreatedOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(true);
  const [hoveredTable, setHoveredTable] = useState<number | null>(null);
  const [hoveredModel, setHoveredModel] = useState<number | null>(null);
  const [hoveredCreated, setHoveredCreated] = useState<number | null>(null);

  const secondaryColor = c['content-secondary'];
  const hasContext = models.length > 0 || tables.length > 0 || skills.length > 0;

  return (
    <div style={{
      width: 280, flexShrink: 0,
      borderLeft: `1px solid ${c['border-divider']}`,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto', backgroundColor: c['background-base'],
    }}>

      {/* Created section */}
      <SectionHeader label="Created" open={createdOpen} onToggle={() => setCreatedOpen(o => !o)} />

      {createdOpen && (
        <div style={{ padding: `0 ${sp.C}px ${sp.C}px`, display: 'flex', flexDirection: 'column' }}>
          {created.length === 0 ? (
            <span style={{ fontSize: fs.sm, color: secondaryColor, padding: `2px ${sp.B}px` }}>Nothing created yet.</span>
          ) : created.map((item, i) => (
            <div key={i}>
              <div
                onClick={item.onClick}
                onMouseEnter={() => setHoveredCreated(i)}
                onMouseLeave={() => setHoveredCreated(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: `5px ${sp.B}px`, borderRadius: 4,
                  cursor: item.onClick ? 'pointer' : 'default',
                  backgroundColor: hoveredCreated === i && item.onClick ? c['background-subtle'] : 'transparent',
                  transition: 'background-color 0.1s ease',
                }}
              >
                {item.type === 'model' ? <ModelIcon /> : <DocIcon color={secondaryColor} />}
                <span style={{ fontSize: fs.sm, color: c['content-primary'], flex: 1 }}>{item.name}</span>
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
          ))}
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
