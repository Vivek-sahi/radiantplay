import React, { useState, useRef } from 'react';
import { c, sp, ff, fs, fw } from '../../styles';
import Shell from '../Shell';
import PromptBar, { PromptBarRef } from '../PromptBar';
import { Button } from '../../../../components/Button';

// ── Dark theme palette ────────────────────────────────────────────────────────

const D = {
  pageBg:       '#0B1017',
  cardBg:       '#111827',
  cardBgActive: '#0F1D2E',
  border:       'rgba(255,255,255,0.07)',
  borderActive: '#2770EF',
  heading:      '#F1F5F9',
  body:         '#94A3B8',
  mono:         '#2770EF',
  monoMuted:    '#334155',
  badge:        '#1E293B',
  badgeText:    '#64748B',
  divider:      'rgba(255,255,255,0.06)',
} as const;

// ── Warehouse config ──────────────────────────────────────────────────────────

const WAREHOUSES = [
  { id: 'snowflake',  name: 'Snowflake',  logo: '/logos/snowflake.svg',  prompt: 'I want to connect my Snowflake warehouse and build a model in ThoughtSpot' },
  { id: 'bigquery',   name: 'BigQuery',   logo: '/logos/bigquery.svg',   prompt: 'I want to connect my Google BigQuery warehouse and build a model in ThoughtSpot' },
  { id: 'databricks', name: 'Databricks', logo: '/logos/databricks.svg', prompt: 'I want to connect my Databricks warehouse and build a model in ThoughtSpot' },
  { id: 'redshift',   name: 'Redshift',   logo: '/logos/redshift.svg',   prompt: 'I want to connect my Amazon Redshift warehouse and build a model in ThoughtSpot' },
  { id: 'azure',      name: 'Azure Synapse', logo: '/logos/azure.svg',   prompt: 'I want to connect my Azure Synapse warehouse and build a model in ThoughtSpot' },
  { id: 'postgres',   name: 'PostgreSQL', logo: '/logos/postgres.svg',   prompt: 'I want to connect my PostgreSQL database and build a model in ThoughtSpot' },
  { id: 'dbt',        name: 'dbt',        logo: '/logos/dbt.svg',        prompt: 'I want to connect via dbt and build a model in ThoughtSpot' },
] as const;

const EXISTING_MODEL_OPTIONS = [
  {
    id: 'dbt-import',
    title: 'dbt models',
    description: 'Import a dbt project and publish models directly to Spotter',
    logo: '/logos/dbt.svg',
  },
  {
    id: 'semantic',
    title: 'Semantic views',
    description: 'Start from an existing ThoughtSpot worksheet or semantic model',
    logo: '/logos/snowflake.svg',
    logoOverride: true,
  },
] as const;

// ── Journey data ──────────────────────────────────────────────────────────────

const JOURNEYS = [
  {
    id: 'day-zero',
    num: '01',
    title: 'Get started',
    description: 'Connect a warehouse, build your first model, fix data quality issues, and go live — all inside ThoughtSpot.',
    time: '~10 min',
    active: true,
  },
  {
    id: 'monitor',
    num: '02',
    title: 'Monitor & optimize',
    description: 'Review model health, fix stale cache, and improve AI answer quality across your models.',
    time: null,
    active: false,
  },
  {
    id: 'debug',
    num: '03',
    title: 'Debug issues',
    description: 'Diagnose why Spotter is giving wrong answers and find the root cause in your semantic layer.',
    time: null,
    active: false,
  },
  {
    id: 'dbt',
    num: '04',
    title: 'dbt plug-and-play',
    description: 'Import your dbt project, resolve semantic issues, and publish models to Spotter in minutes.',
    time: null,
    active: false,
  },
];

// ── Journey Picker (dark) ─────────────────────────────────────────────────────

export const JourneyPickerExploration: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div style={{
      position: 'fixed', inset: 0, overflowY: 'auto',
      backgroundColor: D.pageBg,
      fontFamily: ff.primary,
      backgroundImage: 'radial-gradient(ellipse 80% 36% at 50% 0%, rgba(39,112,239,0.14) 0%, transparent 100%)',
    }}>
      {/* Top bar */}
      <div style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: `0 ${sp.H}px`,
        borderBottom: `1px solid ${D.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 0 12px rgba(59,130,246,0.4)',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L8.1 5.4 12.5 7 8.1 8.6 7 13 5.9 8.6 1.5 7 5.9 5.4Z" fill="white" fillOpacity="0.95"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: fw.semibold, color: D.heading, letterSpacing: '-0.1px' }}>
            Data Studio
          </span>
        </div>
        <div style={{ marginLeft: sp.C, height: 14, width: 1, backgroundColor: D.divider }} />
        <span style={{ marginLeft: sp.C, fontSize: 11, color: D.badgeText, letterSpacing: '0.06em', fontWeight: fw.medium }}>
          VISION
        </span>
      </div>

      {/* Content */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: `${sp.J + sp.D}px ${sp.H}px ${sp.J}px`,
      }}>
        <div style={{ width: '100%', maxWidth: 780 }}>

          {/* Product identity */}
          <div style={{ marginBottom: sp.J + sp.D }}>
            <h1 style={{
              margin: `0 0 ${sp.C}px`,
              fontSize: 32, fontWeight: fw.semibold,
              color: D.heading, letterSpacing: '-0.6px', lineHeight: 1.2,
            }}>
              Data Studio
            </h1>
            <p style={{
              margin: 0, fontSize: 15, color: D.body, lineHeight: 1.65, maxWidth: 480,
            }}>
              A single workspace for analysts to model, prep, and make data ready for AI agents — without waiting on engineering.
            </p>
          </div>

          {/* Section label */}
          <div style={{
            fontSize: 10.5, fontWeight: fw.semibold, textTransform: 'uppercase' as const,
            letterSpacing: '0.1em', color: D.badgeText,
            marginBottom: sp.D,
          }}>
            Pick your journey
          </div>

          {/* Journey cards — 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: sp.C + 2 }}>
            {JOURNEYS.map(j => (
              <DarkJourneyCard
                key={j.id}
                journey={j}
                selected={selected === j.id}
                onSelect={() => j.active && setSelected(j.id)}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

interface DarkJourneyCardProps {
  journey: typeof JOURNEYS[number];
  selected: boolean;
  onSelect: () => void;
}

const DarkJourneyCard: React.FC<DarkJourneyCardProps> = ({ journey, selected, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const isActive = journey.active;
  const lit = isActive && (selected || hovered);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => isActive && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: selected ? D.cardBgActive : D.cardBg,
        border: `1px solid ${lit ? D.borderActive : D.border}`,
        borderLeft: `2px solid ${selected ? D.borderActive : lit ? 'rgba(39,112,239,0.4)' : D.border}`,
        borderRadius: 10,
        padding: `${sp.E}px ${sp.E}px ${sp.E}px ${sp.D + 2}px`,
        cursor: isActive ? 'pointer' : 'default',
        opacity: isActive ? 1 : 0.38,
        display: 'flex', flexDirection: 'column', gap: sp.C,
        boxShadow: selected
          ? '0 0 0 1px rgba(39,112,239,0.3), 0 4px 20px rgba(39,112,239,0.12)'
          : hovered && isActive ? '0 2px 12px rgba(0,0,0,0.3)' : 'none',
        transition: 'all 0.14s',
        minHeight: 164,
      }}
    >
      {/* Number + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'monospace', fontSize: 11,
          color: selected ? D.mono : isActive ? D.monoMuted : D.monoMuted,
          letterSpacing: '0.06em', fontWeight: fw.medium,
        }}>
          {journey.num}
        </span>
        {!isActive && (
          <span style={{
            fontSize: 9.5, fontWeight: fw.semibold, color: D.badgeText,
            backgroundColor: D.badge,
            borderRadius: 3, padding: '2px 6px',
            letterSpacing: '0.06em', textTransform: 'uppercase' as const,
          }}>
            Coming soon
          </span>
        )}
        {isActive && selected && (
          <span style={{
            fontSize: 9.5, fontWeight: fw.semibold, color: '#93C5FD',
            backgroundColor: 'rgba(39,112,239,0.15)',
            borderRadius: 3, padding: '2px 6px',
            letterSpacing: '0.06em', textTransform: 'uppercase' as const,
          }}>
            Selected
          </span>
        )}
      </div>

      {/* Title + description */}
      <div>
        <div style={{
          fontSize: 15, fontWeight: fw.semibold,
          color: D.heading, marginBottom: sp.A + 1, lineHeight: 1.3,
        }}>
          {journey.title}
        </div>
        <div style={{ fontSize: fs.sm, color: D.body, lineHeight: 1.6 }}>
          {journey.description}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {journey.time && (
          <span style={{ fontSize: 11, color: D.badgeText }}>{journey.time}</span>
        )}
        {isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            style={{
              height: 30, padding: `0 ${sp.D}px`,
              backgroundColor: selected ? '#2563EB' : 'rgba(39,112,239,0.15)',
              border: `1px solid ${selected ? '#2563EB' : 'rgba(39,112,239,0.3)'}`,
              borderRadius: 6, cursor: 'pointer',
              fontSize: 12, fontWeight: fw.medium, fontFamily: ff.primary,
              color: selected ? '#fff' : '#93C5FD',
              transition: 'all 0.12s',
            }}
          >
            {selected ? 'Starting…' : 'Start journey'}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Day Zero — Empty State Overview ──────────────────────────────────────────

export const DayZeroEmptyExploration: React.FC = () => {
  const promptBarRef = useRef<PromptBarRef>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  const handleWarehouseClick = (warehouse: typeof WAREHOUSES[number]) => {
    setSelectedWarehouse(warehouse.id);
    promptBarRef.current?.setValue(warehouse.prompt);
    promptBarRef.current?.focus();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, fontFamily: ff.primary }}>
      <Shell activeNav="overview" onNavChange={() => {}}>
        <div style={{ height: '100%', overflowY: 'auto', backgroundColor: c['background-sunken'] }}>

          {/* ── Hero — same visual as Overview ───────────────────────── */}
          <div style={{
            backgroundColor: c['background-base'],
            borderBottom: `1px solid ${c['border-divider']}`,
            padding: `${sp.J}px ${sp.H}px ${sp.G}px`,
          }}>
            <div style={{
              maxWidth: 720, margin: '0 auto',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.E,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.B }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2770ef 0%, #5b9ef4 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="1.5" strokeOpacity="0.9"/>
                      <circle cx="10" cy="10" r="2.5" fill="white" fillOpacity="0.9"/>
                      <line x1="10" y1="3" x2="10" y2="6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="10" y1="13.5" x2="10" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="3" y1="10" x2="6.5" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="13.5" y1="10" x2="17" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h1 style={{
                    margin: 0, fontSize: 26, fontWeight: fw.semibold,
                    color: c['content-primary'], letterSpacing: '-0.3px', lineHeight: 1.2,
                  }}>
                    What would you like to build?
                  </h1>
                </div>
                <p style={{ margin: 0, fontSize: fs.sm, color: c['content-secondary'] }}>
                  Describe your goal and the agent will connect, model, and prep your data.
                </p>
              </div>
              <div style={{ width: '100%' }}>
                <PromptBar
                  ref={promptBarRef}
                  onSubmit={() => {}}
                  placeholder="Describe your use case and the questions you'd like to answer…"
                  dropDirection="down"
                  compact={false}
                  landingPage
                />
              </div>
            </div>
          </div>

          {/* ── Entry points ─────────────────────────────────────────── */}
          <div style={{ maxWidth: 720, margin: '0 auto', padding: `${sp.H}px` }}>

            {/* Section 1 — Warehouse */}
            <div style={{ marginBottom: sp.H }}>
              <div style={{
                fontSize: 11, fontWeight: fw.semibold, textTransform: 'uppercase' as const,
                letterSpacing: '0.06em', color: c['content-secondary'], marginBottom: sp.B,
              }}>
                Build from your warehouse
              </div>
              <p style={{ margin: `0 0 ${sp.D}px`, fontSize: fs.sm, color: c['content-secondary'] }}>
                Connect a warehouse and the agent will explore your tables, ask a few questions, and build a semantic model ready for Spotter.
              </p>
              <div style={{ display: 'flex', gap: sp.C, flexWrap: 'wrap' as const }}>
                {WAREHOUSES.map(w => (
                  <WarehouseCard
                    key={w.id}
                    warehouse={w}
                    selected={selectedWarehouse === w.id}
                    onClick={() => handleWarehouseClick(w)}
                  />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.D, marginBottom: sp.H }}>
              <div style={{ flex: 1, height: 1, backgroundColor: c['border-divider'] }}/>
              <span style={{ fontSize: 11, color: c['content-tertiary'], fontWeight: fw.medium, letterSpacing: '0.04em' }}>OR</span>
              <div style={{ flex: 1, height: 1, backgroundColor: c['border-divider'] }}/>
            </div>

            {/* Section 2 — Existing model */}
            <div>
              <div style={{
                fontSize: 11, fontWeight: fw.semibold, textTransform: 'uppercase' as const,
                letterSpacing: '0.06em', color: c['content-secondary'], marginBottom: sp.D,
              }}>
                Start with an existing model
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp.C }}>
                {EXISTING_MODEL_OPTIONS.map(opt => (
                  <ExistingModelCard key={opt.id} option={opt} />
                ))}
              </div>
            </div>

          </div>
        </div>
      </Shell>
    </div>
  );
};

// ── Warehouse card ────────────────────────────────────────────────────────────

interface WarehouseCardProps {
  warehouse: typeof WAREHOUSES[number];
  selected: boolean;
  onClick: () => void;
}

const WarehouseCard: React.FC<WarehouseCardProps> = ({ warehouse, selected, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.B,
        width: 88, padding: `${sp.D}px ${sp.C}px`,
        backgroundColor: selected ? c['background-information'] : hovered ? c['background-subtle'] : c['background-base'],
        border: `1px solid ${selected ? c['border-brand'] : hovered ? c['border-brand'] : c['border-divider']}`,
        borderRadius: 10, cursor: 'pointer',
        transition: 'all 0.12s', fontFamily: ff.primary,
        boxShadow: hovered || selected ? '0 1px 6px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 9,
        backgroundColor: c['background-subtle'],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <img src={warehouse.logo} alt={warehouse.name} style={{ width: 26, height: 26, objectFit: 'contain' }}/>
      </div>
      <span style={{
        fontSize: 10.5, fontWeight: fw.medium,
        color: selected ? c['content-brand'] : c['content-primary'],
        textAlign: 'center', lineHeight: 1.3,
      }}>
        {warehouse.name}
      </span>
    </button>
  );
};

// ── Existing model card ───────────────────────────────────────────────────────

interface ExistingModelCardProps {
  option: typeof EXISTING_MODEL_OPTIONS[number];
}

const ExistingModelCard: React.FC<ExistingModelCardProps> = ({ option }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: sp.D,
        width: '100%', padding: `${sp.C + 2}px ${sp.E}px`,
        backgroundColor: hovered ? c['background-subtle'] : c['background-base'],
        border: `1px solid ${hovered ? c['border-brand'] : c['border-divider']}`,
        borderRadius: 10, cursor: 'pointer', textAlign: 'left',
        fontFamily: ff.primary, transition: 'all 0.12s',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        backgroundColor: c['background-subtle'],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <img src={option.logo} alt={option.title} style={{ width: 22, height: 22, objectFit: 'contain' }}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], marginBottom: 2 }}>
          {option.title}
        </div>
        <div style={{ fontSize: fs.xs, color: c['content-secondary'] }}>
          {option.description}
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c['content-tertiary']} strokeWidth="1.5" strokeLinecap="round">
        <path d="M5 2.5l4.5 4.5L5 11.5"/>
      </svg>
    </button>
  );
};
