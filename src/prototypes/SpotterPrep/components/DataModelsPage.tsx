import React, { useState } from 'react';
import { c, sp, fs, fw, ff, styles } from '../styles';
import { QualityGrade } from '../data/mockData';

interface ModelRow {
  id: string;
  name: string;
  connection: string;
  tables: number;
  columns: number;
  lastModified: string;
  status: 'published' | 'draft' | 'building';
  isCached: boolean;
  qualityGrade?: QualityGrade | null;
  qualityScore?: number | null;
}

const MODELS: ModelRow[] = [
  { id: 'fnops-final',      name: 'fnops-final',              connection: 'ThoughtSpot',  tables: 3, columns: 22, lastModified: '2026-04-09', status: 'published', isCached: true,  qualityGrade: 'D', qualityScore: 48  },
  { id: 'campaign-perf',    name: 'Campaign Performance',     connection: 'Snowflake',    tables: 3, columns: 18, lastModified: '2026-04-09', status: 'published', isCached: true,  qualityGrade: 'F', qualityScore: 38  },
  { id: 'revenue-model',    name: 'Revenue Model',            connection: 'ThoughtSpot',  tables: 5, columns: 34, lastModified: '2026-04-08', status: 'published', isCached: true,  qualityGrade: 'C', qualityScore: 63  },
  { id: 'customer-360',     name: 'Customer 360',             connection: 'Snowflake',    tables: 6, columns: 48, lastModified: '2026-04-08', status: 'published', isCached: true,  qualityGrade: 'A', qualityScore: 94  },
  { id: 'product-usage',    name: 'Product Usage',            connection: 'Snowflake',    tables: 4, columns: 31, lastModified: '2026-04-07', status: 'published', isCached: true,  qualityGrade: 'A', qualityScore: 91  },
  { id: 'finance-summary',  name: 'Finance Summary',          connection: 'Snowflake',    tables: 7, columns: 52, lastModified: '2026-04-07', status: 'published', isCached: true,  qualityGrade: 'F', qualityScore: 31  },
  { id: 'user-growth',      name: 'User Growth',              connection: 'ThoughtSpot',  tables: 2, columns: 12, lastModified: '2026-04-06', status: 'draft',     isCached: false, qualityGrade: null, qualityScore: null },
  { id: 'mkt-attribution',  name: 'Marketing Attribution',    connection: 'Snowflake',    tables: 4, columns: 29, lastModified: '2026-04-06', status: 'published', isCached: true,  qualityGrade: 'B', qualityScore: 78  },
  { id: 'pipeline-health',  name: 'Pipeline Health',          connection: 'ThoughtSpot',  tables: 3, columns: 21, lastModified: '2026-04-05', status: 'published', isCached: false, qualityGrade: null, qualityScore: null },
  { id: 'support-tickets',  name: 'Support Tickets',          connection: 'Snowflake',    tables: 2, columns: 14, lastModified: '2026-04-05', status: 'building',  isCached: false, qualityGrade: null, qualityScore: null },
  { id: 'logistics-ops',    name: 'Logistics & Operations',   connection: 'Snowflake',    tables: 5, columns: 40, lastModified: '2026-04-04', status: 'published', isCached: true,  qualityGrade: 'C', qualityScore: 65  },
  { id: 'partner-portal',   name: 'Partner Portal',           connection: 'Snowflake',    tables: 3, columns: 19, lastModified: '2026-04-03', status: 'draft',     isCached: false, qualityGrade: null, qualityScore: null },
];

interface DataModelsPageProps {
  onOpenModel: (id: string) => void;
  prepDone?: boolean;
}

const DataModelsPage: React.FC<DataModelsPageProps> = ({ onOpenModel, prepDone = false }) => {
  const models = MODELS.map(m =>
    m.id === 'fnops-final' && prepDone ? { ...m, qualityGrade: 'A' as QualityGrade, qualityScore: 94 } : m
  );

  const scoreStyle = (score: number) => {
    if (score >= 80) return { color: '#166534', backgroundColor: '#f0fdf4' };
    if (score >= 60) return { color: '#92400e', backgroundColor: '#fef9c3' };
    return { color: '#9f1239', backgroundColor: '#fff1f2' };
  };
  const [search, setSearch] = useState('');

  const filtered = models.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={styles.pageHeader}>
        <div>
          <div style={{ fontSize: 11, color: c['content-secondary'], letterSpacing: '0.05em', textTransform: 'uppercase' }}>Data workspace</div>
          <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>Data models</div>
        </div>
        <div style={{ flex: 1 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search models"
          style={{
            padding: `${sp.A}px ${sp.C}px`, borderRadius: 6,
            border: `1px solid ${c['border-default']}`,
            fontSize: fs.sm, color: c['content-primary'],
            fontFamily: ff.primary, width: 180,
            backgroundColor: c['background-sunken'],
            outline: 'none',
          }}
        />
        <button style={{
          padding: `${sp.A}px ${sp.C}px`, borderRadius: 6,
          border: 'none',
          fontSize: fs.sm, fontWeight: fw.medium,
          color: '#fff', backgroundColor: c['background-brand'],
          cursor: 'pointer', fontFamily: ff.primary,
        }}>+ New model</button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-base'] }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.md }}>
          <thead>
            <tr style={{ backgroundColor: c['background-subtle'], position: 'sticky', top: 0 }}>
              {['Name', 'Source', 'Quality score', 'Last modified'].map(h => (
                <th key={h} style={{
                  padding: `${sp.C}px ${sp.D}px`,
                  textAlign: 'left', fontSize: fs.md, fontWeight: fw.medium,
                  color: c['content-secondary'],
                  borderBottom: `1px solid ${c['border-divider']}`,
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((model, i) => {
              return (
                <tr
                  key={model.id}
                  onClick={() => onOpenModel(model.id)}
                  style={{
                    backgroundColor: i % 2 === 0 ? c['background-base'] : c['background-sunken'],
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-ghost-highlight'])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? c['background-base'] : c['background-sunken'])}
                >
                  <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontWeight: fw.medium, color: c['content-brand'] }}>
                    {model.name}
                  </td>
                  <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-secondary'] }}>
                    {model.connection}
                  </td>
                  <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
                    {model.qualityScore != null ? (
                      <span style={{
                        fontSize: fs.md, fontWeight: fw.semibold,
                        borderRadius: 4, padding: '2px 8px',
                        ...scoreStyle(model.qualityScore),
                      }}>
                        {model.qualityScore}
                      </span>
                    ) : (
                      <span style={{ fontSize: fs.md, color: c['content-tertiary'] }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-secondary'] }}>
                    {model.lastModified}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataModelsPage;
