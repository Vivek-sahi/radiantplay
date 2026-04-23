import React, { useState } from 'react';
import { c, sp, fs, fw, ts, ff } from '../styles';
import { ProjectState } from '../index';
import { tableMetadata, ordersData, campaignsData, usersData } from '../data/mockData';

interface TableDetailModalProps {
  tableId: string;
  buildStep: ProjectState['buildStep'];
  onClose: () => void;
}

// Descriptions revealed after fix_health
const COLUMN_DESCRIPTIONS: Record<string, Record<string, { description: string; aiContext: string }>> = {
  orders: {
    order_id:         { description: 'Unique identifier for each order.',              aiContext: 'Primary key for the orders table.' },
    user_id:          { description: 'References the user who placed the order.',       aiContext: 'Foreign key → users.user_id' },
    campaign_id:      { description: 'Campaign that drove this order. Null = organic.', aiContext: "Null values are organic orders with no attribution. Don't exclude them from totals." },
    order_date:       { description: 'Date the order was placed.',                     aiContext: 'Normalized to YYYY-MM-DD.' },
    amount:           { description: 'Order value in USD at time of purchase.',         aiContext: 'Excludes refunds. Use for revenue calculations.' },
    product_category: { description: 'Top-level product category.',                    aiContext: 'e.g. Electronics, Apparel, Home.' },
    status:           { description: 'Current fulfillment status of the order.',        aiContext: 'Values: pending, shipped, delivered, cancelled.' },
    region:           { description: 'Geographic region of the order.',                aiContext: 'Values: North, South, East, West.' },
  },
  campaigns: {
    campaign_id:   { description: 'Unique identifier for each marketing campaign.',  aiContext: 'Primary key for campaigns table.' },
    campaign_name: { description: 'Human-readable name of the campaign.',            aiContext: 'Use this for display, not campaign_id.' },
    channel:       { description: 'Marketing channel (email, social, paid, etc.).',  aiContext: 'Aggregate by channel for channel mix analysis.' },
    budget:        { description: 'Total approved budget in USD.',                   aiContext: 'Compare with spend to compute budget utilization.' },
    spend:         { description: 'Actual spend to date in USD.',                    aiContext: 'Used in return_on_spend calculation.' },
    start_date:    { description: 'Campaign launch date.',                           aiContext: 'Normalized to YYYY-MM-DD.' },
    end_date:      { description: 'Campaign end date. Null = ongoing.',              aiContext: 'Null means the campaign is still active.' },
    target_region: { description: 'Geographic region the campaign targets.',         aiContext: 'Matches orders.region for attribution.' },
    status:        { description: 'Current campaign status.',                        aiContext: 'Values: active, paused, completed.' },
  },
  users: {
    user_id:        { description: 'Unique identifier for each user.',              aiContext: 'Primary key for users table.' },
    name:           { description: 'Full name of the user.',                        aiContext: 'Do not use in aggregations.' },
    email:          { description: 'Email address of the user.',                    aiContext: 'PII — exclude from shared reports.' },
    segment:        { description: 'Customer segment classification.',              aiContext: 'Values: Premium, Standard, Basic. Null = unclassified.' },
    region:         { description: 'Geographic region of the user.',               aiContext: 'Matches orders.region.' },
    age:            { description: 'Age of the user in years.',                    aiContext: 'Values of 0, -3, 142, 199 are anomalies — flagged with is_anomaly.' },
    signup_date:    { description: 'Date the user created their account.',          aiContext: 'Normalized to YYYY-MM-DD.' },
    lifetime_value: { description: 'Total revenue from this user to date in USD.', aiContext: 'Use for cohort and retention analysis.' },
  },
};

const TYPE_ICON: Record<string, string> = {
  string: 'T',
  number: '123',
  date: '⊟',
  boolean: '☑',
};

const TableDetailModal: React.FC<TableDetailModalProps> = ({ tableId, buildStep, onClose }) => {
  const [activeTab, setActiveTab] = useState<'columns' | 'preview'>('columns');
  const [colSearch, setColSearch] = useState('');

  const table = tableMetadata[tableId];
  if (!table) return null;

  const descriptionsRevealed = buildStep === 'healthy';
  const descriptions = COLUMN_DESCRIPTIONS[tableId] ?? {};

  const filteredCols = table.columns.filter(col =>
    col.name.toLowerCase().includes(colSearch.toLowerCase())
  );

  // Sample data rows for preview
  const previewData = (tableId === 'orders' ? ordersData.slice(0, 20)
    : tableId === 'campaigns' ? campaignsData.slice(0, 20)
    : usersData.slice(0, 20)) as unknown as Record<string, unknown>[];

  const previewKeys = Object.keys(previewData[0] ?? {});

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ backgroundColor: c['background-base'], borderRadius: 12, width: '90vw', maxWidth: 1100, height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: `${sp.C}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', gap: sp.B, flexShrink: 0 }}>
          <span style={{ fontSize: fs.sm }}>⊞</span>
          <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'], fontSize: fs.md, flex: 1 }}>{table.name}</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: fs.xs, color: c['content-brand'], display: 'flex', alignItems: 'center', gap: 4, padding: `${sp.A}px ${sp.B}px` }}>
            ↗ Go to table
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c['content-secondary'], lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${c['border-divider']}`, padding: `0 ${sp.F}px`, flexShrink: 0 }}>
          {(['columns', 'preview'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: `${sp.C}px ${sp.D}px`,
                fontSize: fs.sm,
                fontWeight: activeTab === tab ? fw.medium : fw.regular,
                color: activeTab === tab ? c['content-brand'] : c['content-secondary'],
                borderBottom: activeTab === tab ? `2px solid ${c['content-brand']}` : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab === 'columns' ? 'Columns' : 'Data Preview'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {activeTab === 'columns' && (
            <>
              {/* Column search */}
              <div style={{ padding: `${sp.C}px ${sp.F}px`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, border: `1px solid ${c['border-default']}`, borderRadius: 20, padding: `${sp.A}px ${sp.C}px`, width: 220 }}>
                  <span style={{ color: c['content-secondary'], fontSize: fs.sm }}>🔍</span>
                  <input
                    value={colSearch}
                    onChange={e => setColSearch(e.target.value)}
                    placeholder="Search column"
                    style={{ border: 'none', outline: 'none', fontSize: fs.sm, background: 'transparent', color: c['content-primary'], flex: 1 }}
                  />
                </div>
              </div>

              {/* Column list */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredCols.map(col => {
                  const desc = descriptions[col.id];
                  const hasDesc = descriptionsRevealed && desc;
                  return (
                    <div key={col.id} style={{ display: 'flex', alignItems: 'center', padding: `${sp.C}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
                      {/* Type icon */}
                      <div style={{ width: 32, flexShrink: 0, fontFamily: ff.mono, fontSize: fs.xs, color: c['content-secondary'], fontWeight: fw.medium }}>
                        {TYPE_ICON[col.type] ?? 'T'}
                      </div>

                      {/* Name + metadata */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], marginBottom: 2 }}>
                          {col.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp.D, fontSize: fs.xs, color: c['content-secondary'] }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>≡</span>
                            <span style={{ color: hasDesc ? c['content-primary'] : c['content-secondary'] }}>
                              {hasDesc ? desc.description : 'No description'}
                            </span>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>💡</span>
                            <span style={{ color: hasDesc ? c['content-primary'] : c['content-secondary'] }}>
                              {hasDesc ? desc.aiContext : 'No AI context'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: c['content-secondary'], fontSize: fs.sm, padding: `0 ${sp.B}px` }}>···</button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'preview' && (
            <div style={{ flex: 1, overflowAuto: 'auto', overflow: 'auto' } as React.CSSProperties}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.xs }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: c['background-base'], zIndex: 1 }}>
                  <tr style={{ borderBottom: `1px solid ${c['border-divider']}` }}>
                    <th style={{ padding: `${sp.B}px ${sp.C}px`, textAlign: 'left', width: 40, color: c['content-secondary'], fontWeight: fw.regular }}>#</th>
                    {previewKeys.map(k => (
                      <th key={k} style={{ padding: `${sp.B}px ${sp.C}px`, textAlign: 'left', color: c['content-secondary'], fontWeight: fw.regular, whiteSpace: 'nowrap' }}>
                        {k} <span style={{ opacity: 0.5 }}>▾</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row: Record<string, unknown>, i: number) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${c['border-divider']}`, backgroundColor: i % 2 === 0 ? c['background-base'] : c['background-subtle'] }}>
                      <td style={{ padding: `${sp.B}px ${sp.C}px`, color: c['content-secondary'] }}>{i + 1}</td>
                      {previewKeys.map(k => {
                        const val = row[k];
                        const isNull = val === null || val === undefined || val === '';
                        return (
                          <td key={k} style={{ padding: `${sp.B}px ${sp.C}px`, color: isNull ? c['content-secondary'] : c['content-primary'], backgroundColor: isNull ? 'rgba(255,80,80,0.08)' : 'transparent', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {isNull ? '-' : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableDetailModal;
