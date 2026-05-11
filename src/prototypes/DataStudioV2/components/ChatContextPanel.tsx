import React, { useState } from 'react';
import { c, fs, fw, sp } from '../styles';
import { Icon } from '../../../components/icons';

interface ChatContextPanelProps {
  created: { type: 'plan' | 'model'; name: string }[];
  tables: string[];
  skills: string[];
}

const ModelIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    <rect x="1" y="1" width="8" height="8" rx="1.5" fill="#BFDBFE" />
    <rect x="11" y="1" width="8" height="8" rx="1.5" fill="#93C5FD" />
    <rect x="1" y="11" width="8" height="8" rx="1.5" fill="#93C5FD" />
    <rect x="11" y="11" width="8" height="8" rx="1.5" fill="#60A5FA" />
  </svg>
);

const SectionHeader: React.FC<{
  label: string;
  open: boolean;
  onToggle: () => void;
}> = ({ label, open, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: sp.B,
      width: '100%',
      padding: `${sp.B}px ${sp.C}px`,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: c['content-secondary'],
      fontSize: fs.xs,
      fontWeight: fw.medium,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}
  >
    <span style={{
      display: 'inline-flex',
      transition: 'transform 0.15s ease',
      transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
    }}>
      <Icon name="chevron-down" size="xs" />
    </span>
    {label}
  </button>
);

const ChatContextPanel: React.FC<ChatContextPanelProps> = ({ created, tables, skills }) => {
  const [createdOpen, setCreatedOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(true);

  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      borderLeft: `1px solid ${c['border-divider']}`,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      backgroundColor: c['background-base'],
    }}>

      {/* Created section */}
      <SectionHeader label="Created" open={createdOpen} onToggle={() => setCreatedOpen(o => !o)} />

      {createdOpen && (
        <div style={{ padding: `0 ${sp.C}px ${sp.C}px`, display: 'flex', flexDirection: 'column', gap: sp.B }}>
          {created.length === 0 ? (
            <span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>Nothing created yet.</span>
          ) : created.map((item, i) => (
            item.type === 'plan' ? (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: sp.B,
                padding: `${sp.B}px ${sp.C}px`,
                backgroundColor: c['background-base'],
                border: `1px solid ${c['border-default']}`,
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'background-color 0.1s ease',
              }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = c['background-base'])}
              >
                <Icon name="doc" size="s" />
                <span style={{ fontSize: fs.sm, color: c['content-primary'], fontWeight: fw.medium }}>{item.name}</span>
              </div>
            ) : (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: sp.B,
                padding: `${sp.B}px ${sp.C}px`,
                backgroundColor: '#EFF6FF',
                border: `1px solid #BFDBFE`,
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'border-color 0.1s ease',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#93C5FD')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#BFDBFE')}
              >
                <ModelIcon />
                <span style={{ fontSize: fs.sm, color: c['content-primary'], fontWeight: fw.medium }}>{item.name}</span>
              </div>
            )
          ))}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: c['border-divider'], margin: `0 ${sp.C}px` }} />

      {/* Context section */}
      <SectionHeader label="Context" open={contextOpen} onToggle={() => setContextOpen(o => !o)} />

      {contextOpen && (
        <div style={{ padding: `0 ${sp.C}px ${sp.C}px`, display: 'flex', flexDirection: 'column', gap: sp.C }}>
          {tables.length === 0 && skills.length === 0 ? (
            <span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>No context used yet.</span>
          ) : (
            <>
              {tables.length > 0 && (
                <div>
                  <div style={{ fontSize: fs.xs, color: c['content-secondary'], fontWeight: fw.medium, marginBottom: sp.A }}>Tables</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {tables.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
                        <Icon name="table" size="xs" />
                        <span style={{ fontSize: fs.sm, color: c['content-primary'] }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {skills.length > 0 && (
                <div>
                  <div style={{ fontSize: fs.xs, color: c['content-secondary'], fontWeight: fw.medium, marginBottom: sp.A }}>Skills</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {skills.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
                        <Icon name="checkmark-circle" size="xs" />
                        <span style={{ fontSize: fs.sm, color: c['content-primary'] }}>{s}</span>
                      </div>
                    ))}
                  </div>
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
