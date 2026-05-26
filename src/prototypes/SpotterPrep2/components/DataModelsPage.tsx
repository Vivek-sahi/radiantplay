import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import type { QualityState } from './QualityTab';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ModelItem {
  id: string;
  name: string;
  source: string;
  type: 'Model' | 'Table' | 'Dataset' | 'View';
  tags: string[];
  author: { name: string; initials: string; color: string };
  lastModified: string; // ISO date
  isCached: boolean;
}

interface RecentItem {
  id: string;
  name: string;
  type: 'Model' | 'Table' | 'Dataset' | 'View';
  modifiedAt: string;
  openedAt: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MODELS: ModelItem[] = [
  { id: 'hr-analytics',         name: 'hr-analytics',         source: 'Snowflake', type: 'Model',   tags: ['HR'],              author: { name: 'vivek.sahi',      initials: 'VS', color: '#d97706' }, lastModified: '2026-05-19T10:00:00Z', isCached: true  },
  { id: 'revenue-analytics',    name: 'revenue-analytics',    source: 'Snowflake', type: 'Model',   tags: ['Finance'],         author: { name: 'peeyush.vardhan', initials: 'PV', color: '#7c3aed' }, lastModified: '2026-05-18T14:00:00Z', isCached: true  },
  { id: 'customer-360',         name: 'customer-360',         source: 'Snowflake', type: 'Model',   tags: ['Customer', 'CRM'], author: { name: 'pranov.kumar',    initials: 'PK', color: '#0369a1' }, lastModified: '2026-05-17T09:00:00Z', isCached: true  },
  { id: 'campaign-performance', name: 'campaign-performance', source: 'Snowflake', type: 'Model',   tags: ['Marketing'],       author: { name: 'vivek.sahi',      initials: 'VS', color: '#d97706' }, lastModified: '2026-05-16T16:00:00Z', isCached: false },
  { id: 'product-usage',        name: 'product-usage',        source: 'Snowflake', type: 'Model',   tags: ['Product'],         author: { name: 'pranov.kumar',    initials: 'PK', color: '#0369a1' }, lastModified: '2026-05-15T11:00:00Z', isCached: true  },
  { id: 'logistics-ops',        name: 'logistics-ops',        source: 'Snowflake', type: 'Model',   tags: ['Operations'],      author: { name: 'peeyush.vardhan', initials: 'PV', color: '#7c3aed' }, lastModified: '2026-05-14T08:00:00Z', isCached: true  },
  { id: 'pipeline-health',      name: 'pipeline-health',      source: 'Snowflake', type: 'Model',   tags: ['Sales'],           author: { name: 'vivek.sahi',      initials: 'VS', color: '#d97706' }, lastModified: '2026-05-13T17:00:00Z', isCached: false },
  { id: 'support-tickets',      name: 'support-tickets',      source: 'Snowflake', type: 'Dataset', tags: ['Support'],         author: { name: 'pranov.kumar',    initials: 'PK', color: '#0369a1' }, lastModified: '2026-05-12T13:00:00Z', isCached: false },
  { id: 'finance-summary',      name: 'finance-summary',      source: 'Snowflake', type: 'Model',   tags: ['Finance', 'Exec'], author: { name: 'peeyush.vardhan', initials: 'PV', color: '#7c3aed' }, lastModified: '2026-05-11T10:00:00Z', isCached: true  },
];

const RECENT_ITEMS: RecentItem[] = [
  { id: 'hr-analytics',      name: 'hr-analytics',      type: 'Model', modifiedAt: '2026-05-19T10:00:00Z', openedAt: '2 minutes ago' },
  { id: 'revenue-analytics', name: 'revenue-analytics', type: 'Model', modifiedAt: '2026-05-18T14:00:00Z', openedAt: 'a day ago'      },
  { id: 'customer-360',      name: 'customer-360',       type: 'Model', modifiedAt: '2026-05-17T09:00:00Z', openedAt: '2 days ago'     },
  { id: 'finance-summary',   name: 'finance-summary',    type: 'Model', modifiedAt: '2026-05-11T10:00:00Z', openedAt: '4 days ago'     },
  { id: 'logistics-ops',     name: 'logistics-ops',      type: 'Model', modifiedAt: '2026-05-14T08:00:00Z', openedAt: 'a week ago'     },
  { id: 'product-usage',     name: 'product-usage',      type: 'Model', modifiedAt: '2026-05-15T11:00:00Z', openedAt: '2 weeks ago'    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'a day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'a week ago';
  return `${Math.floor(days / 7)} weeks ago`;
}

function fmtModifiedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── DataModelsPage ────────────────────────────────────────────────────────────

interface DataModelsPageProps {
  onOpenModel: (id: string) => void;
  qualityOverride?: Record<string, QualityState>;
}

const DataModelsPage: React.FC<DataModelsPageProps> = ({ onOpenModel, qualityOverride }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Models' | 'Tables' | 'Datasets' | 'Views'>('All');

  const filtered = MODELS
    .filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'All'
        || (typeFilter === 'Models'   && m.type === 'Model')
        || (typeFilter === 'Tables'   && m.type === 'Table')
        || (typeFilter === 'Datasets' && m.type === 'Dataset')
        || (typeFilter === 'Views'    && m.type === 'View');
      return matchSearch && matchType;
    })
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

  const TYPE_PILLS: Array<'All' | 'Models' | 'Tables' | 'Datasets' | 'Views'> = ['All', 'Models', 'Tables', 'Datasets', 'Views'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: c['background-base'], fontFamily: ff.primary }}>

      {/* Recently opened section */}
      <div style={{ padding: `${sp.E}px ${sp.F}px ${sp.C}px`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: sp.C }}>
          <div style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>
            Recently opened
          </div>
          <div style={{ display: 'flex', gap: sp.A }}>
            <button style={{
              width: 28, height: 28, border: `1px solid ${c['border-default']}`, borderRadius: 6,
              backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: c['content-secondary'],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>‹</button>
            <button style={{
              width: 28, height: 28, border: `1px solid ${c['border-default']}`, borderRadius: 6,
              backgroundColor: 'transparent', cursor: 'pointer', fontSize: 14, color: c['content-secondary'],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>›</button>
          </div>
        </div>

        {/* Carousel */}
        <div style={{
          display: 'flex', gap: sp.C, overflowX: 'auto',
          paddingBottom: sp.B, scrollbarWidth: 'none',
        }}>
          <style>{`
            .recent-scroll::-webkit-scrollbar { display: none; }
            .recent-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important; }
          `}</style>
          {RECENT_ITEMS.map(item => (
            <div
              key={item.id}
              className="recent-card"
              onClick={() => onOpenModel(item.id)}
              style={{
                width: 210, minWidth: 210,
                backgroundColor: c['background-base'],
                border: `1px solid ${c['border-default']}`,
                borderRadius: 8, cursor: 'pointer',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'box-shadow 0.15s',
              }}
            >
              {/* Blue top band */}
              <div style={{
                backgroundColor: '#2563eb',
                padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 6,
                height: 48,
              }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1, flexShrink: 0 }}>⊞</span>
                <span style={{ fontSize: 12, fontWeight: fw.semibold, color: '#fff' }}>{item.type}</span>
              </div>
              {/* White bottom section */}
              <div style={{ padding: '12px 14px', backgroundColor: '#fff' }}>
                <div style={{ fontSize: 11, color: c['content-tertiary'], marginBottom: 6 }}>
                  Modified {fmtModifiedDate(item.modifiedAt)}
                </div>
                <div style={{
                  fontSize: 15, fontWeight: fw.semibold, color: c['content-primary'],
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  marginBottom: 8,
                }}>{item.name}</div>
                <div style={{ fontSize: 12, color: c['content-secondary'] }}>
                  Opened {item.openedAt}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        height: 48, borderTop: `1px solid ${c['border-divider']}`, borderBottom: `1px solid ${c['border-divider']}`,
        padding: '0 24px', display: 'flex', alignItems: 'center', gap: sp.B, flexShrink: 0,
      }}>
        {/* Type filter pills */}
        <div style={{ display: 'flex', gap: sp.A }}>
          {TYPE_PILLS.map(pill => {
            const active = typeFilter === pill;
            return (
              <button
                key={pill}
                onClick={() => setTypeFilter(pill)}
                style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: fs.sm, cursor: 'pointer',
                  fontFamily: ff.primary, fontWeight: active ? fw.medium : fw.regular,
                  backgroundColor: active ? '#2563eb' : 'transparent',
                  color: active ? '#fff' : c['content-secondary'],
                  border: active ? 'none' : `1px solid ${c['border-default']}`,
                }}
              >{pill}</button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Right side controls */}
        <button style={{
          padding: '4px 12px', borderRadius: 20, fontSize: fs.sm,
          fontFamily: ff.primary,
          backgroundColor: 'transparent', color: c['content-secondary'],
          border: `1px solid ${c['border-default']}`, cursor: 'pointer',
        }}>All Tags ▾</button>
        <button style={{
          padding: '4px 12px', borderRadius: 20, fontSize: fs.sm,
          fontFamily: ff.primary,
          backgroundColor: 'transparent', color: c['content-secondary'],
          border: `1px solid ${c['border-default']}`, cursor: 'pointer',
        }}>All Authors ▾</button>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search"
          style={{
            width: 200, padding: `${sp.A}px ${sp.C}px`, borderRadius: 6,
            border: `1px solid ${c['border-default']}`,
            fontSize: fs.sm, color: c['content-primary'],
            fontFamily: ff.primary,
            backgroundColor: c['background-sunken'],
            outline: 'none',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-base'] }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.md }}>
          <thead>
            <tr style={{ backgroundColor: c['background-subtle'], position: 'sticky', top: 0, zIndex: 1 }}>
              <th style={{ width: 40, padding: `${sp.C}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
                <input type="checkbox" style={{ cursor: 'pointer' }} />
              </th>
              {[
                { label: 'Name',          width: undefined },
                { label: 'Source',        width: 120 },
                { label: 'Type',          width: 80  },
                { label: 'Tags',          width: 160 },
                { label: 'Author',        width: 160 },
                { label: 'Last modified', width: 120 },
              ].map(col => (
                <th
                  key={col.label}
                  style={{
                    padding: `${sp.C}px ${sp.D}px`,
                    textAlign: 'left', fontSize: fs.md, fontWeight: fw.medium,
                    color: c['content-secondary'],
                    borderBottom: `1px solid ${c['border-divider']}`,
                    whiteSpace: 'nowrap',
                    width: col.width,
                  }}
                >{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((model, i) => (
              <tr
                key={model.id}
                style={{ backgroundColor: i % 2 === 0 ? c['background-base'] : c['background-sunken'], cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-ghost-highlight'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? c['background-base'] : c['background-sunken'])}
                onClick={() => onOpenModel(model.id)}
              >
                {/* Checkbox */}
                <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                  <input type="checkbox" style={{ cursor: 'pointer' }} />
                </td>

                {/* Name */}
                <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: c['content-brand'], lineHeight: 1 }}>■</span>
                    <span style={{ fontWeight: fw.medium, color: c['content-brand'], cursor: 'pointer' }}>
                      {model.name}
                    </span>
                    {(() => {
                      const qs = qualityOverride?.[model.id];
                      const isCached = qs !== undefined ? qs !== 'not-cached' : model.isCached;
                      return isCached ? (
                        <span title="Cached" style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, color: '#15803d' }}>
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M2 4.5C2 3.12 3.12 2 4.5 2h4C9.88 2 11 3.12 11 4.5v.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                            <path d="M11 8.5C11 9.88 9.88 11 8.5 11h-4A2.5 2.5 0 0 1 2 8.5V8.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                            <path d="M9 6.5l2-2 2 2M4 6.5l-2 2-2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      ) : null;
                    })()}
                  </div>
                </td>

                {/* Source */}
                <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-secondary'] }}>
                  {model.source}
                </td>

                {/* Type */}
                <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-secondary'] }}>
                  {model.type}
                </td>

                {/* Tags */}
                <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {model.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: 11, fontWeight: fw.medium,
                        color: '#1d4ed8', backgroundColor: '#dbeafe',
                        borderRadius: 10, padding: '1px 8px',
                      }}>{tag}</span>
                    ))}
                  </div>
                </td>

                {/* Author */}
                <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%',
                      backgroundColor: model.author.color,
                      color: '#fff', fontSize: 11, fontWeight: fw.semibold,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>{model.author.initials}</span>
                    <span style={{
                      fontSize: fs.sm, color: c['content-secondary'],
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      maxWidth: 100,
                    }}>{model.author.name}</span>
                  </div>
                </td>

                {/* Last modified */}
                <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-secondary'], whiteSpace: 'nowrap' }}>
                  {relativeTime(model.lastModified)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataModelsPage;
