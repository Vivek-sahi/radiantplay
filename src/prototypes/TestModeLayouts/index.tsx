/**
 * TestModeLayouts — three layout explorations for Data Studio's
 * test/inspect workspace. Covers: Testing (agent diagnostic), Data Preview,
 * SQL/Code, and Lineage — all in one screen.
 *
 * Iteration 1: Always-On Three Panel   (Cortex Analyst-inspired)
 * Iteration 2: Adaptive Weight Shift   (dbt Canvas + Cursor-inspired)
 * Iteration 3: Horizontal Stack        (dbt Cloud IDE-inspired)
 */

import React, { useState } from 'react';
import { systemColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontFamily } from '../../tokens/typography';
import { Button } from '../../components/Button';

// ── Token shortcuts ────────────────────────────────────────────────────
const c = systemColors.light;
const sp = spacing;
const ff = fontFamily;

// ── Brand / semantic colors ────────────────────────────────────────────
const BRAND        = '#6D28D9';
const BRAND_LIGHT  = '#F3F0FF';
const SUCCESS      = '#059669';
const WARN_BG      = '#FFF7ED';
const WARN_TEXT    = '#C2410C';
const WARN_BORDER  = '#FED7AA';

// ── Layout constants ───────────────────────────────────────────────────
const HEADER_H     = 52;
const LEFT_W       = 216;
const AGENT_NARROW = 268;
const AGENT_MID    = 344;
const AGENT_WIDE   = 464;
const BOTTOM_H     = 232;
const SWITCHER_H   = 52;
const MONO         = '"SF Mono", "Monaco", "Inconsolata", monospace';

// ── Shared types ───────────────────────────────────────────────────────
type Iter       = '1' | '2' | '3';
type CenterTab  = 'preview' | 'sql' | 'lineage';
type BottomTab  = 'preview' | 'sql' | 'lineage' | 'testlog';
type BuildTest  = 'build' | 'test';

// ─────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────
const SparkleIcon: React.FC<{ size?: number; color?: string }> = ({ size = 13, color = BRAND }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M7 1.5L8.3 5.4L12.2 5.9L9.4 8.6L10.2 12.5L7 10.6L3.8 12.5L4.6 8.6L1.8 5.9L5.7 5.4L7 1.5Z"
      fill={color}
    />
  </svg>
);

const TableIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="1" y="1" width="11" height="11" rx="2" stroke={c['content-secondary']} strokeWidth="1.2" fill="none"/>
    <line x1="1" y1="4.5" x2="12" y2="4.5" stroke={c['content-secondary']} strokeWidth="1"/>
    <line x1="5" y1="4.5" x2="5" y2="12" stroke={c['content-secondary']} strokeWidth="1"/>
  </svg>
);

const JoinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="4" cy="6.5" r="3" stroke={c['content-secondary']} strokeWidth="1.2" fill="none"/>
    <circle cx="9" cy="6.5" r="3" stroke={c['content-secondary']} strokeWidth="1.2" fill="none"/>
  </svg>
);

const FormulaIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 2h3.5L4 6.5h4M6 9.5h4" stroke={c['content-secondary']} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────
// SHARED MOCK ATOMS
// ─────────────────────────────────────────────────────────────────────

// ── Workspace header ───────────────────────────────────────────────────
interface HeaderProps {
  iter: Iter;
  buildTestState?: BuildTest;
  onBuildTestToggle?: () => void;
}
const WorkspaceHeader: React.FC<HeaderProps> = ({ iter, buildTestState, onBuildTestToggle }) => (
  <div style={{
    height: HEADER_H,
    background: c['background-base'],
    borderBottom: `1px solid ${c['border-divider']}`,
    display: 'flex', alignItems: 'center',
    padding: `0 ${sp.D}px`, gap: sp.C, flexShrink: 0,
  }}>
    {/* Breadcrumb */}
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, flex: 1 }}>
      <span style={{ fontSize: 12, color: c['content-secondary'], cursor: 'pointer' }}>Data Studio</span>
      <span style={{ color: c['border-divider'], fontSize: 14 }}>›</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: c['content-primary'] }}>
        Campaign Performance
      </span>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: '#ECFDF5', borderRadius: 4, padding: `2px 7px`,
        fontSize: 11, color: SUCCESS, fontWeight: 600,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: SUCCESS }} />
        Healthy · 3 tables
      </div>
    </div>

    {/* Iter 2: build / test mode toggle */}
    {iter === '2' && buildTestState && onBuildTestToggle && (
      <div style={{
        display: 'flex', alignItems: 'center',
        background: c['background-sunken'], borderRadius: 6, padding: 3,
      }}>
        {(['build', 'test'] as BuildTest[]).map(mode => (
          <button
            key={mode}
            onClick={onBuildTestToggle}
            style={{
              padding: `4px 14px`, borderRadius: 4, border: 'none',
              cursor: 'pointer', fontSize: 12,
              fontWeight: buildTestState === mode ? 600 : 400,
              color: buildTestState === mode ? c['content-primary'] : c['content-secondary'],
              background: buildTestState === mode ? c['background-base'] : 'transparent',
              boxShadow: buildTestState === mode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              fontFamily: ff.primary,
              transition: 'all 0.15s',
            }}
          >
            {mode === 'build' ? '⚙  Build' : '▷  Test'}
          </button>
        ))}
      </div>
    )}

    {/* Actions */}
    <div style={{ display: 'flex', gap: sp.B }}>
      <Button variant="secondary" size="small">Share</Button>
      <Button variant="primary" size="small">Publish</Button>
    </div>
  </div>
);

// ── Left panel tree ────────────────────────────────────────────────────
const LeftPanelMock: React.FC = () => {
  const Label: React.FC<{ text: string; count: number }> = ({ text, count }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: `${sp.C}px ${sp.D}px ${sp.A}px`,
    }}>
      <span style={{
        fontSize: 10.5, fontWeight: 700, color: c['content-secondary'],
        textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>{text}</span>
      <span style={{ fontSize: 11, color: c['content-secondary'] }}>{count}</span>
    </div>
  );

  const Item: React.FC<{ icon: React.ReactNode; name: string; meta?: string; indent?: boolean }> = ({ icon, name, meta, indent }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: `5px ${sp.D}px 5px ${indent ? sp.F : sp.D}px`,
      fontSize: 12.5, color: c['content-primary'], cursor: 'pointer',
    }}>
      {icon}
      <span style={{ flex: 1 }}>{name}</span>
      {meta && <span style={{ fontSize: 11, color: c['content-secondary'] }}>{meta}</span>}
    </div>
  );

  return (
    <div style={{
      width: LEFT_W, flexShrink: 0,
      background: c['background-base'],
      borderRight: `1px solid ${c['border-divider']}`,
      overflowY: 'auto', display: 'flex', flexDirection: 'column',
    }}>
      <Label text="Tables" count={3} />
      <Item icon={<TableIcon />} name="orders" meta="150 rows" />
      <Item icon={<TableIcon />} name="campaigns" meta="9 cols" />
      <Item icon={<TableIcon />} name="users" meta="7 cols" />

      <div style={{ height: 1, background: c['border-divider'], margin: `${sp.B}px 0` }} />
      <Label text="Joins" count={2} />
      <Item icon={<JoinIcon />} name="orders → campaigns" />
      <Item icon={<JoinIcon />} name="orders → users" />

      <div style={{ height: 1, background: c['border-divider'], margin: `${sp.B}px 0` }} />
      <Label text="Formulas" count={3} />
      <Item icon={<FormulaIcon />} name="ROI" />
      <Item icon={<FormulaIcon />} name="days_to_convert" />
      <Item icon={<FormulaIcon />} name="revenue_per_user" />
    </div>
  );
};

// ── Data Preview ───────────────────────────────────────────────────────
const DataPreviewContent: React.FC<{ narrow?: boolean }> = ({ narrow }) => {
  const columns = narrow
    ? ['campaign_id', 'campaign_name', 'channel', 'spend', 'budget']
    : ['order_id', 'user_id', 'campaign_id', 'order_date', 'amount', 'status', 'region'];

  const rows = [
    ['1001', 'u_482', 'cmp_04', '03/15/2024', '$142', 'complete', 'West'],
    ['1002', 'u_107',    '—',   '03/16/2024',  '$89', 'complete', 'East'],
    ['1003', 'u_293', 'cmp_02', '03/16/2024','$2,100','complete', 'South'],
    ['1004', 'u_482', 'cmp_04', '03/17/2024',  '$67', 'complete', 'West'],
    ['1005', 'u_519',    '—',   '03/18/2024', '$890', 'pending',  'North'],
    ['1006', 'u_203', 'cmp_01', '03/18/2024', '$345', 'complete', 'East'],
  ];

  const narrowRows = [
    ['cmp_01','Spring Sale','email','$12,400','$15,000'],
    ['cmp_02','Summer Push','paid_search','$28,100','$25,000'],
    ['cmp_03','Referral Q2','referral','$6,200','$8,000'],
    ['cmp_04','Brand Video','display','$45,000','$50,000'],
    [    '—', 'Retargeting','retargeting','$9,800','$10,000'],
  ];

  const displayRows = narrow ? narrowRows : rows;

  return (
    <div style={{
      background: c['background-base'], borderRadius: 8,
      border: `1px solid ${c['border-divider']}`, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `7px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`,
        background: c['background-sunken'],
      }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: c['content-secondary'] }}>
          {narrow ? 'campaigns' : 'orders'} · {narrow ? '28 rows' : '150 rows'}
        </span>
        <span style={{ fontSize: 11, color: c['content-secondary'] }}>Showing {narrow ? 5 : 6} rows</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: c['background-sunken'] }}>
            {columns.map(col => (
              <th key={col} style={{
                padding: `6px ${sp.C}px`, textAlign: 'left',
                fontWeight: 600, color: c['content-secondary'], fontSize: 11,
                borderBottom: `1px solid ${c['border-divider']}`, whiteSpace: 'nowrap',
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: `1px solid ${c['border-divider']}` }}>
              {columns.map((_, ci) => (
                <td key={ci} style={{
                  padding: `5px ${sp.C}px`,
                  color: row[ci] === '—' ? c['content-secondary'] : c['content-primary'],
                  fontStyle: row[ci] === '—' ? 'italic' : 'normal',
                  whiteSpace: 'nowrap',
                }}>
                  {row[ci]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── SQL content ────────────────────────────────────────────────────────
const SQLContent: React.FC = () => (
  <div style={{
    background: '#1E1E2E', borderRadius: 8, padding: sp.D,
    fontFamily: MONO, fontSize: 12, lineHeight: 1.8,
    color: '#CDD6F4', overflow: 'auto',
  }}>
    <span style={{ color: '#89B4FA' }}>SELECT{'\n'}</span>
    {'  '}<span style={{ color: '#A6E3A1' }}>o</span>.order_id,{'\n'}
    {'  '}<span style={{ color: '#A6E3A1' }}>o</span>.campaign_id,{'\n'}
    {'  '}<span style={{ color: '#A6E3A1' }}>c</span>.campaign_name,{'\n'}
    {'  '}<span style={{ color: '#A6E3A1' }}>c</span>.channel,{'\n'}
    {'  '}<span style={{ color: '#89DCEB' }}>SUM</span>(<span style={{ color: '#A6E3A1' }}>o</span>.amount) <span style={{ color: '#89B4FA' }}>AS</span> total_revenue,{'\n'}
    {'  '}<span style={{ color: '#89DCEB' }}>COUNT</span>(<span style={{ color: '#A6E3A1' }}>o</span>.order_id) <span style={{ color: '#89B4FA' }}>AS</span> order_count,{'\n'}
    {'  '}<span style={{ color: '#A6E3A1' }}>u</span>.segment{'\n'}
    <span style={{ color: '#89B4FA' }}>FROM</span> orders <span style={{ color: '#A6E3A1' }}>o</span>{'\n'}
    <span style={{ color: '#89B4FA' }}>LEFT JOIN</span> campaigns <span style={{ color: '#A6E3A1' }}>c</span>{'\n'}
    {'  '}<span style={{ color: '#89B4FA' }}>ON</span> <span style={{ color: '#A6E3A1' }}>o</span>.campaign_id = <span style={{ color: '#A6E3A1' }}>c</span>.campaign_id{'\n'}
    <span style={{ color: '#89B4FA' }}>LEFT JOIN</span> users <span style={{ color: '#A6E3A1' }}>u</span>{'\n'}
    {'  '}<span style={{ color: '#89B4FA' }}>ON</span> <span style={{ color: '#A6E3A1' }}>o</span>.user_id = <span style={{ color: '#A6E3A1' }}>u</span>.user_id{'\n'}
    <span style={{ color: '#89B4FA' }}>GROUP BY</span> 1, 2, 3, 4, 7{'\n'}
    <span style={{ color: '#89B4FA' }}>ORDER BY</span> total_revenue <span style={{ color: '#89B4FA' }}>DESC</span>
  </div>
);

// ── Lineage ────────────────────────────────────────────────────────────
const LineageContent: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `${sp.H}px ${sp.D}px` }}>
    <svg width="420" height="140" viewBox="0 0 420 140">
      <defs>
        <marker id="arr-l" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 z" fill={c['border-divider']} />
        </marker>
      </defs>
      {/* Arrows */}
      <line x1="108" y1="55" x2="182" y2="45"  stroke={c['border-divider']} strokeWidth="1.5" markerEnd="url(#arr-l)" />
      <line x1="108" y1="75" x2="182" y2="97"  stroke={c['border-divider']} strokeWidth="1.5" markerEnd="url(#arr-l)" />
      <line x1="306" y1="46" x2="338" y2="62"  stroke={c['border-divider']} strokeWidth="1.5" markerEnd="url(#arr-l)" />
      <line x1="306" y1="100" x2="338" y2="75" stroke={c['border-divider']} strokeWidth="1.5" markerEnd="url(#arr-l)" />

      {/* orders */}
      <rect x="12" y="44" width="96" height="42" rx="7" fill={BRAND_LIGHT} stroke={BRAND} strokeWidth="1.5" />
      <text x="60" y="62" textAnchor="middle" fontSize="12" fontWeight="700" fill={BRAND}>orders</text>
      <text x="60" y="78" textAnchor="middle" fontSize="10.5" fill={BRAND} opacity="0.75">150 rows · 8 cols</text>

      {/* campaigns */}
      <rect x="186" y="22" width="120" height="42" rx="7" fill={c['background-base']} stroke={c['border-divider']} strokeWidth="1.5" />
      <text x="246" y="40" textAnchor="middle" fontSize="12" fontWeight="600" fill={c['content-primary']}>campaigns</text>
      <text x="246" y="56" textAnchor="middle" fontSize="10.5" fill={c['content-secondary']}>campaign_id →</text>

      {/* users */}
      <rect x="186" y="82" width="120" height="42" rx="7" fill={c['background-base']} stroke={c['border-divider']} strokeWidth="1.5" />
      <text x="246" y="100" textAnchor="middle" fontSize="12" fontWeight="600" fill={c['content-primary']}>users</text>
      <text x="246" y="116" textAnchor="middle" fontSize="10.5" fill={c['content-secondary']}>user_id →</text>

      {/* model output */}
      <rect x="342" y="48" width="66" height="42" rx="7" fill="#ECFDF5" stroke={SUCCESS} strokeWidth="1.5" />
      <text x="375" y="66" textAnchor="middle" fontSize="12" fontWeight="700" fill={SUCCESS}>model</text>
      <text x="375" y="82" textAnchor="middle" fontSize="10.5" fill={SUCCESS}>published</text>
    </svg>
  </div>
);

// ── Center panel (tabs + body) ─────────────────────────────────────────
interface CenterTabsProps {
  activeTab: CenterTab;
  onTabChange: (t: CenterTab) => void;
  locked?: boolean;
}
const CenterTabs: React.FC<CenterTabsProps> = ({ activeTab, onTabChange, locked }) => {
  const tabs: { id: CenterTab; label: string }[] = [
    { id: 'preview', label: 'Data Preview' },
    { id: 'sql',     label: 'SQL'          },
    { id: 'lineage', label: 'Lineage'      },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: c['background-sunken'], minWidth: 0 }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', alignItems: 'center', height: 40, flexShrink: 0,
        background: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`,
        padding: `0 ${sp.D}px`, gap: 2,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => !locked && onTabChange(tab.id)}
            style={{
              background: 'none', border: 'none',
              cursor: locked ? 'default' : 'pointer',
              padding: `0 ${sp.C}px`, height: '100%',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? BRAND : c['content-secondary'],
              borderBottom: activeTab === tab.id ? `2px solid ${BRAND}` : '2px solid transparent',
              fontFamily: ff.primary, transition: 'color 0.12s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Tab body */}
      <div style={{ flex: 1, overflow: 'auto', padding: sp.D }}>
        {activeTab === 'preview' && <DataPreviewContent />}
        {activeTab === 'sql'     && <SQLContent />}
        {activeTab === 'lineage' && <LineageContent />}
      </div>
    </div>
  );
};

// ── Agent panel ────────────────────────────────────────────────────────
interface AgentPanelMockProps {
  width: number;
  showDiagnostic?: boolean;
}
const AgentPanelMock: React.FC<AgentPanelMockProps> = ({ width, showDiagnostic }) => {
  const messages = [
    { role: 'assistant', text: "I\u2019ve added **users** to your model and created a join on `user_id`. Your model covers 3 tables and 2 joins." },
    { role: 'user',      text: 'Which campaign drove the most revenue last quarter?' },
  ];

  const answer = 'Campaign **"Spring Sale"** drove the highest revenue at **$142,800** — 23% of total attributed revenue. It ran March 1–31 with $45K spend and a 3.2× ROI.';

  const diagnostic = [
    { label: 'Data quality', ok: true,  note: '18% null campaign_id (organic orders — expected)' },
    { label: 'Context',      ok: false, note: 'users.segment has no description — Spotter approximated from values', fix: true },
    { label: 'Structure',    ok: true,  note: 'orders → campaigns join resolved correctly' },
  ];

  const renderText = (text: string) =>
    text.split(/\*\*(.+?)\*\*/).map((chunk, i) =>
      i % 2 === 1 ? <strong key={i}>{chunk}</strong> : chunk
    );

  return (
    <div style={{
      width, flexShrink: 0,
      background: c['background-base'],
      borderLeft: `1px solid ${c['border-divider']}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      transition: 'width 0.25s ease',
    }}>
      {/* Agent header */}
      <div style={{
        height: 40, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: sp.B,
        padding: `0 ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`,
      }}>
        <SparkleIcon size={13} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: c['content-primary'] }}>Data Agent</span>
        {showDiagnostic && (
          <span style={{
            fontSize: 11, background: WARN_BG, color: WARN_TEXT,
            border: `1px solid ${WARN_BORDER}`, borderRadius: 4, padding: '2px 7px', fontWeight: 600,
          }}>1 issue</span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.D, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', gap: sp.B,
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: BRAND_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 2,
              }}>
                <SparkleIcon size={11} />
              </div>
            )}
            <div style={{
              maxWidth: '82%',
              background: msg.role === 'user' ? BRAND_LIGHT : c['background-sunken'],
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
              padding: `${sp.B}px ${sp.C}px`,
              fontSize: 12.5, color: c['content-primary'], lineHeight: 1.55,
            }}>
              {renderText(msg.text)}
            </div>
          </div>
        ))}

        {/* Answer + diagnostic */}
        <div style={{ display: 'flex', gap: sp.B }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%', background: BRAND_LIGHT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: 2,
          }}>
            <SparkleIcon size={11} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: sp.B, minWidth: 0 }}>
            <div style={{
              background: c['background-sunken'],
              borderRadius: '4px 12px 12px 12px',
              padding: `${sp.B}px ${sp.C}px`,
              fontSize: 12.5, color: c['content-primary'], lineHeight: 1.55,
            }}>
              {renderText(answer)}
            </div>

            {/* 3-dimension diagnostic */}
            <div style={{
              background: c['background-base'], border: `1px solid ${c['border-divider']}`,
              borderRadius: 8, overflow: 'hidden', fontSize: 12,
            }}>
              <div style={{
                padding: `6px ${sp.C}px`, background: c['background-sunken'],
                borderBottom: `1px solid ${c['border-divider']}`,
                fontSize: 10.5, fontWeight: 700, color: c['content-secondary'],
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                Answer quality
              </div>
              {diagnostic.map((d, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: sp.B,
                  padding: `7px ${sp.C}px`,
                  borderBottom: i < diagnostic.length - 1 ? `1px solid ${c['border-divider']}` : 'none',
                }}>
                  <div style={{
                    width: 15, height: 15, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: d.ok ? '#ECFDF5' : WARN_BG,
                    border: `1.5px solid ${d.ok ? SUCCESS : WARN_TEXT}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700,
                    color: d.ok ? SUCCESS : WARN_TEXT,
                  }}>
                    {d.ok ? '✓' : '!'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: c['content-primary'], marginBottom: 2 }}>{d.label}</div>
                    <div style={{ color: c['content-secondary'], lineHeight: 1.4 }}>{d.note}</div>
                    {d.fix && (
                      <button style={{
                        marginTop: 4, background: 'none', border: 'none',
                        color: BRAND, fontSize: 11.5, fontWeight: 600,
                        cursor: 'pointer', padding: 0, fontFamily: ff.primary,
                      }}>
                        Fix all missing descriptions →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Prompt bar */}
      <div style={{ padding: sp.C, borderTop: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
        <div style={{
          background: c['background-sunken'], borderRadius: 8,
          border: `1px solid ${c['border-divider']}`,
          padding: `8px ${sp.C}px`,
          display: 'flex', alignItems: 'center', gap: sp.B,
          fontSize: 12.5, color: c['content-secondary'],
        }}>
          <span style={{ flex: 1 }}>Ask a question or type a command…</span>
          <SparkleIcon size={12} color={c['content-secondary']} />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// ITERATION 1 — Always-On Three Panel
// No mode switch. Agent always full-size. Build + test = same workflow.
// ─────────────────────────────────────────────────────────────────────
export const Iter1Layout: React.FC = () => {
  const [tab, setTab] = useState<CenterTab>('preview');
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <WorkspaceHeader iter="1" />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <LeftPanelMock />
        <CenterTabs activeTab={tab} onTabChange={setTab} />
        <AgentPanelMock width={AGENT_MID} showDiagnostic />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// ITERATION 2 — Adaptive Weight Shift
// Build/test toggle in header re-weights panels. No context switch.
// ─────────────────────────────────────────────────────────────────────
export const Iter2Layout: React.FC = () => {
  const [mode, setMode] = useState<BuildTest>('test');
  const [tab,  setTab ] = useState<CenterTab>('preview');

  const isTest = mode === 'test';

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <WorkspaceHeader
        iter="2"
        buildTestState={mode}
        onBuildTestToggle={() => setMode(m => m === 'build' ? 'test' : 'build')}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <LeftPanelMock />

        {/* Center — narrows during test */}
        <div style={{
          ...(isTest
            ? { width: 292, flexShrink: 0 }
            : { flex: 1, minWidth: 0 }),
          display: 'flex', overflow: 'hidden',
          transition: 'width 0.25s ease, flex 0.25s ease',
        }}>
          <CenterTabs
            activeTab={isTest ? 'preview' : tab}
            onTabChange={t => { if (!isTest) setTab(t); }}
            locked={isTest}
          />
        </div>

        {/* Agent — widens during test */}
        <AgentPanelMock
          width={isTest ? AGENT_WIDE : AGENT_NARROW}
          showDiagnostic={isTest}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// ITERATION 3 — Horizontal Stack
// Model canvas fills top. Supporting views (Preview/SQL/Lineage/Test Log)
// live in a bottom panel. Agent is a narrow right sidebar.
// ─────────────────────────────────────────────────────────────────────

const TestLogContent: React.FC = () => {
  const log = [
    {
      q: 'Which campaign drove the most revenue last quarter?',
      a: 'Spring Sale — $142,800 (23% of attributed revenue, 3.2× ROI)',
      issues: [{ label: 'Context', desc: 'users.segment missing description' }],
    },
    {
      q: 'What is the average order value by region?',
      a: 'West $234 · East $198 · North $187 · South $312',
      issues: [],
    },
    {
      q: 'Show me top 5 products by revenue',
      a: 'Electronics $284K · Apparel $141K · Home $98K · …',
      issues: [],
    },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
      {log.map((item, i) => (
        <div key={i} style={{
          background: c['background-base'], borderRadius: 7,
          border: `1px solid ${c['border-divider']}`, overflow: 'hidden', fontSize: 12,
        }}>
          <div style={{
            padding: `6px ${sp.C}px`, fontWeight: 600,
            color: c['content-primary'], borderBottom: `1px solid ${c['border-divider']}`,
            background: c['background-sunken'],
          }}>
            Q: {item.q}
          </div>
          <div style={{ padding: `6px ${sp.C}px`, color: c['content-primary'] }}>
            {item.a}
          </div>
          {item.issues.length > 0 && (
            <div style={{ padding: `5px ${sp.C}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', gap: sp.B }}>
              {item.issues.map((issue, j) => (
                <span key={j} style={{
                  background: WARN_BG, color: WARN_TEXT,
                  fontSize: 11, borderRadius: 4, padding: '2px 7px', fontWeight: 600,
                }}>
                  {issue.label}: {issue.desc}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const Iter3Layout: React.FC = () => {
  const [bottomTab, setBottomTab] = useState<BottomTab>('testlog');

  const bTabs: { id: BottomTab; label: string }[] = [
    { id: 'preview', label: 'Data Preview' },
    { id: 'sql',     label: 'SQL'          },
    { id: 'lineage', label: 'Lineage'      },
    { id: 'testlog', label: '✦  Test Log'  },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <WorkspaceHeader iter="3" />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <LeftPanelMock />

        {/* Main column: canvas top + bottom panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Canvas — join visualizer gets full top real estate */}
          <div style={{
            flex: 1, background: c['background-sunken'],
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{
              padding: `${sp.B}px ${sp.D}px`, height: 38,
              background: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`,
              display: 'flex', alignItems: 'center', gap: sp.C,
              fontSize: 12, flexShrink: 0,
            }}>
              <span style={{ fontWeight: 600, color: c['content-secondary'] }}>Model canvas</span>
              <span style={{ color: c['border-divider'] }}>·</span>
              <span style={{ color: c['content-secondary'] }}>3 tables · 2 joins · 3 formulas</span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LineageContent />
            </div>
          </div>

          {/* Bottom panel */}
          <div style={{
            height: BOTTOM_H, flexShrink: 0,
            borderTop: `1px solid ${c['border-divider']}`,
            background: c['background-base'],
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Bottom tab bar */}
            <div style={{
              height: 36, flexShrink: 0,
              display: 'flex', alignItems: 'center',
              borderBottom: `1px solid ${c['border-divider']}`,
              padding: `0 ${sp.D}px`,
            }}>
              {bTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setBottomTab(tab.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: `0 ${sp.C}px`, height: '100%',
                    fontSize: 12.5,
                    fontWeight: bottomTab === tab.id ? 600 : 400,
                    color: bottomTab === tab.id
                      ? (tab.id === 'testlog' ? BRAND : c['content-primary'])
                      : c['content-secondary'],
                    borderBottom: bottomTab === tab.id
                      ? `2px solid ${tab.id === 'testlog' ? BRAND : c['content-primary']}`
                      : '2px solid transparent',
                    fontFamily: ff.primary, transition: 'color 0.12s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Bottom panel body */}
            <div style={{ flex: 1, overflow: 'auto', padding: sp.C }}>
              {bottomTab === 'preview' && <DataPreviewContent narrow />}
              {bottomTab === 'sql'     && <SQLContent />}
              {bottomTab === 'lineage' && <LineageContent />}
              {bottomTab === 'testlog' && <TestLogContent />}
            </div>
          </div>
        </div>

        {/* Narrow agent sidebar */}
        <AgentPanelMock width={AGENT_NARROW} showDiagnostic />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// ITERATION SWITCHER + RATIONALE
// ─────────────────────────────────────────────────────────────────────
const ITERATIONS = [
  {
    id: '1' as Iter,
    label: 'Always-On',
    tag: '★ Recommended',
    rationale: 'No mode switch. Agent is always the test console. Build and test are one workflow. CenterPanel tabs (Preview, SQL, Lineage) always accessible. Closest to Snowflake Cortex Analyst.',
    ref: 'Snowflake Cortex Analyst',
  },
  {
    id: '2' as Iter,
    label: 'Adaptive Shift',
    tag: 'Good for demos',
    rationale: 'Header toggle shifts panel weights — Center narrows, Agent widens. Same panels, different proportions. Makes the "test mode" feel intentional without a context switch. Closest to dbt Canvas.',
    ref: 'dbt Canvas + Cursor Editor Mode',
  },
  {
    id: '3' as Iter,
    label: 'Horiz. Stack',
    tag: 'dbt DNA',
    rationale: 'Model canvas gets maximum top real estate. Preview, SQL, Lineage, and Test Log move to a bottom panel. Familiar pattern for data engineers. Closest to dbt Cloud IDE.',
    ref: 'dbt Cloud IDE',
  },
];

const TestModeLayouts: React.FC = () => {
  const [active, setActive] = useState<Iter>('1');
  const iter = ITERATIONS.find(it => it.id === active)!;

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: ff.primary, overflow: 'hidden',
    }}>
      {/* Top switcher bar */}
      <div style={{
        height: SWITCHER_H, flexShrink: 0,
        background: '#16132A',
        display: 'flex', alignItems: 'center',
        padding: `0 ${sp.D}px`, gap: sp.C,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Label */}
        <span style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginRight: 4,
        }}>
          Layout explorations
        </span>

        {/* Iteration buttons */}
        <div style={{ display: 'flex', gap: sp.A }}>
          {ITERATIONS.map(it => (
            <button
              key={it.id}
              onClick={() => setActive(it.id)}
              style={{
                background: active === it.id ? BRAND : 'rgba(255,255,255,0.07)',
                border: 'none', cursor: 'pointer', borderRadius: 6,
                padding: `5px ${sp.D}px`,
                display: 'flex', alignItems: 'center', gap: 7,
                fontFamily: ff.primary, transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 11, color: active === it.id ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)' }}>
                #{it.id}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: active === it.id ? '#FFF' : 'rgba(255,255,255,0.6)' }}>
                {it.label}
              </span>
              {active === it.id && it.tag.startsWith('★') && (
                <span style={{ fontSize: 10.5, background: 'rgba(255,255,255,0.15)', borderRadius: 3, padding: '1px 5px', color: 'rgba(255,255,255,0.8)' }}>
                  {it.tag}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Rationale */}
        <div style={{
          fontSize: 11.5, color: 'rgba(255,255,255,0.45)', maxWidth: 480,
          textAlign: 'right', lineHeight: 1.45,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>ref: </span>
          <span style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{iter.ref}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}> — </span>
          <span>{iter.rationale}</span>
        </div>
      </div>

      {/* Active iteration — fills remaining height */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {active === '1' && <Iter1Layout />}
        {active === '2' && <Iter2Layout />}
        {active === '3' && <Iter3Layout />}
      </div>
    </div>
  );
};

export default TestModeLayouts;
