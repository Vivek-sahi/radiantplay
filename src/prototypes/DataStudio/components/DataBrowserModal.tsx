import React, { useState } from 'react';
import { c, sp, fs, fw, ts } from '../styles';
import { Button } from '../../../components/Button';

interface DataBrowserModalProps {
  onAdd: () => void;
  onClose: () => void;
}

// ── Mock warehouse data ───────────────────────────────────────────────────────

interface Schema { name: string; lastModified: string; author: string; tags: string }
interface Database { id: string; name: string; path: string; description?: string; schemas: Schema[] }

const DATABASES: Database[] = [
  {
    id: 'team_reporting',
    name: 'team_reporting',
    path: 'Sarah-Snowflake/TEAM_REPORTING',
    schemas: [
      { name: 'analytics',  lastModified: 'Yesterday',    author: 'You',  tags: 'Reporting' },
      { name: 'finance',    lastModified: 'Last Week',     author: 'Ram',  tags: 'Finance'   },
    ],
  },
  {
    id: 'wine_falcon',
    name: 'wine_falcon',
    path: 'Sarah-Snowflake/WINE_FALCON',
    schemas: [
      { name: 'marketing', lastModified: 'Yesterday',    author: 'You',  tags: 'Accounts'  },
      { name: 'hr',        lastModified: 'Last Week',    author: 'Ram',  tags: 'Sales'     },
      { name: 'accounts',  lastModified: 'This Month',   author: 'Ram',  tags: 'Users'     },
      { name: 'product',   lastModified: 'Last Quarter', author: 'Jane', tags: 'Feedback'  },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const DataBrowserModal: React.FC<DataBrowserModalProps> = ({ onAdd, onClose }) => {
  const [search, setSearch] = useState('');
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set(['wine_falcon']));
  const [selectedDb, setSelectedDb] = useState<Database>(DATABASES[1]);
  const [selectedSchemas, setSelectedSchemas] = useState<Set<string>>(new Set());

  const toggleDb = (id: string) => {
    setExpandedDbs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSchema = (name: string) => {
    setSelectedSchemas(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ backgroundColor: c['background-base'], borderRadius: 12, width: 860, height: 580, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: `${sp.D}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'], fontSize: fs.md }}>Add table</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c['content-secondary'], lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* Search + filter bar */}
        <div style={{ padding: `${sp.C}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', gap: sp.B, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, border: `1px solid ${c['border-default']}`, borderRadius: 6, padding: `${sp.A}px ${sp.C}px`, flex: 1 }}>
            <span style={{ color: c['content-secondary'], fontSize: fs.sm }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for a table"
              style={{ border: 'none', outline: 'none', fontSize: fs.sm, color: c['content-primary'], flex: 1, background: 'transparent' }}
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: sp.A, border: `1px solid ${c['border-default']}`, borderRadius: 20, padding: `${sp.A}px ${sp.C}px`, background: c['background-subtle'], cursor: 'pointer', fontSize: fs.sm, color: c['content-primary'], fontWeight: fw.medium }}>
            All Warehouses <span style={{ fontSize: fs.xs }}>▾</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left: database tree */}
          <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, overflowY: 'auto', padding: `${sp.B}px 0` }}>
            {DATABASES.map(db => (
              <div key={db.id}>
                {/* Database row */}
                <div
                  onClick={() => { toggleDb(db.id); setSelectedDb(db); }}
                  style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: `${sp.B}px ${sp.D}px`, cursor: 'pointer', backgroundColor: selectedDb.id === db.id ? c['background-information'] : 'transparent' }}
                  onMouseEnter={e => { if (selectedDb.id !== db.id) e.currentTarget.style.backgroundColor = c['background-subtle']; }}
                  onMouseLeave={e => { if (selectedDb.id !== db.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span style={{ fontSize: fs.xs, color: c['content-secondary'], width: 12 }}>{expandedDbs.has(db.id) ? '▾' : '›'}</span>
                  <span style={{ fontSize: fs.xs }}>☰</span>
                  <span style={{ fontSize: fs.sm, color: c['content-primary'] }}>{db.name}</span>
                </div>

                {/* Schemas */}
                {expandedDbs.has(db.id) && db.schemas.map(s => (
                  <div
                    key={s.name}
                    onClick={() => setSelectedDb(db)}
                    style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: `${sp.B}px ${sp.D}px`, paddingLeft: sp.H, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span style={{ fontSize: fs.xs, color: c['content-secondary'], width: 12 }}>›</span>
                    <span style={{ fontSize: fs.xs }}>⊞</span>
                    <span style={{ fontSize: fs.sm, color: c['content-primary'] }}>{s.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Right: detail panel */}
          <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.D}px ${sp.F}px` }}>
            <div style={{ marginBottom: sp.D }}>
              <h2 style={{ margin: `0 0 ${sp.A}px`, fontSize: fs.lg, fontWeight: fw.semibold, color: c['content-primary'] }}>{selectedDb.name}</h2>
              <p style={{ margin: `0 0 ${sp.A}px`, fontSize: fs.sm, color: c['content-secondary'] }}>{selectedDb.path}</p>
              <p style={{ margin: `0 0 ${sp.C}px`, fontSize: fs.sm, color: c['content-secondary'] }}>{selectedDb.description ?? 'No description…'}</p>
              <p style={{ margin: 0, fontSize: fs.sm, color: c['content-primary'] }}>{selectedDb.schemas.length} Schemas</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.sm }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c['border-divider']}` }}>
                  {['Schema', 'Last modified', 'Author', 'Tags'].map(col => (
                    <th key={col} style={{ padding: `${sp.B}px ${sp.C}px`, textAlign: 'left', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'] }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedDb.schemas.map(s => (
                  <tr
                    key={s.name}
                    onClick={() => toggleSchema(s.name)}
                    style={{ borderBottom: `1px solid ${c['border-divider']}`, cursor: 'pointer', backgroundColor: selectedSchemas.has(s.name) ? c['background-information'] : 'transparent' }}
                    onMouseEnter={e => { if (!selectedSchemas.has(s.name)) e.currentTarget.style.backgroundColor = c['background-subtle']; }}
                    onMouseLeave={e => { if (!selectedSchemas.has(s.name)) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={{ padding: `${sp.B}px ${sp.C}px`, color: c['content-primary'] }}>{s.name}</td>
                    <td style={{ padding: `${sp.B}px ${sp.C}px`, color: c['content-secondary'] }}>{s.lastModified}</td>
                    <td style={{ padding: `${sp.B}px ${sp.C}px`, color: c['content-secondary'] }}>{s.author}</td>
                    <td style={{ padding: `${sp.B}px ${sp.C}px`, color: c['content-secondary'] }}>{s.tags}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: `${sp.C}px ${sp.F}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', justifyContent: 'flex-end', gap: sp.B, flexShrink: 0 }}>
          <Button variant="secondary" size="basic" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="basic" onClick={onAdd}>Add to project</Button>
        </div>
      </div>
    </div>
  );
};

export default DataBrowserModal;
