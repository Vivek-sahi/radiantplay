import React, { useState, useRef } from 'react';
import { c, sp, ff, fs, fw } from '../../styles';
import Shell from '../Shell';
import PromptBar, { PromptBarRef } from '../PromptBar';
import { Button } from '../../../../components/Button';

// ── Warehouse config ──────────────────────────────────────────────────────────

const WAREHOUSES = [
  {
    id: 'snowflake',
    name: 'Snowflake',
    logo: '/logos/snowflake.svg',
    prompt: 'I want to connect my Snowflake warehouse and build a model in ThoughtSpot',
  },
  {
    id: 'redshift',
    name: 'Redshift',
    logo: '/logos/redshift.svg',
    prompt: 'I want to connect my Amazon Redshift warehouse and build a model in ThoughtSpot',
  },
  {
    id: 'bigquery',
    name: 'BigQuery',
    logo: '/logos/bigquery.svg',
    prompt: 'I want to connect my Google BigQuery warehouse and build a model in ThoughtSpot',
  },
  {
    id: 'databricks',
    name: 'Databricks',
    logo: '/logos/databricks.svg',
    prompt: 'I want to connect my Databricks warehouse and build a model in ThoughtSpot',
  },
] as const;

const EXISTING_MODEL_OPTIONS = [
  {
    id: 'dbt',
    title: 'dbt models',
    description: 'Import a dbt project and publish models directly to Spotter',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c['content-secondary']} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 15L9 3L15 15"/>
        <line x1="5.25" y1="11.25" x2="12.75" y2="11.25"/>
      </svg>
    ),
  },
  {
    id: 'semantic',
    title: 'Semantic views',
    description: 'Start from an existing ThoughtSpot semantic model or worksheet',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c['content-secondary']} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.25" y="2.25" width="13.5" height="13.5" rx="1.5"/>
        <line x1="5.25" y1="6.75" x2="12.75" y2="6.75"/>
        <line x1="5.25" y1="9" x2="12.75" y2="9"/>
        <line x1="5.25" y1="11.25" x2="9.75" y2="11.25"/>
      </svg>
    ),
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

// ── Journey Picker ────────────────────────────────────────────────────────────

export const JourneyPickerExploration: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div style={{
      position: 'fixed', inset: 0, overflowY: 'auto',
      backgroundColor: c['background-sunken'],
      fontFamily: ff.primary,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: `0 ${sp.H}px`,
        backgroundColor: c['background-base'],
        borderBottom: `1px solid ${c['border-divider']}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L8.1 5.4 12.5 7 8.1 8.6 7 13 5.9 8.6 1.5 7 5.9 5.4Z" fill="white" fillOpacity="0.95"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: fw.semibold, color: c['content-primary'] }}>Data Studio</span>
        </div>
        <span style={{
          marginLeft: sp.C,
          fontSize: fs.xs, color: c['content-tertiary'],
          backgroundColor: c['background-subtle'],
          border: `1px solid ${c['border-divider']}`,
          borderRadius: 4, padding: '2px 7px',
          fontWeight: fw.medium, letterSpacing: '0.02em',
        }}>
          BETA
        </span>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: `${sp.J}px ${sp.H}px`,
      }}>
        <div style={{ width: '100%', maxWidth: 760 }}>

          {/* Product identity + vision */}
          <div style={{ marginBottom: sp.J }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: sp.C, marginBottom: sp.B }}>
              <h1 style={{
                margin: 0, fontSize: 26, fontWeight: fw.semibold,
                color: c['content-primary'], letterSpacing: '-0.4px', lineHeight: 1.2,
              }}>
                Data Studio
              </h1>
              <span style={{
                fontSize: fs.sm, color: c['content-tertiary'],
                borderLeft: `1px solid ${c['border-divider']}`,
                paddingLeft: sp.C,
              }}>
                Vision
              </span>
            </div>
            <p style={{
              margin: 0, fontSize: fs.sm, color: c['content-secondary'], lineHeight: 1.6, maxWidth: 520,
            }}>
              A single workspace for analysts to model, prep, and make data ready for AI agents — without waiting on engineering.
            </p>
          </div>

          {/* Pick a journey */}
          <div style={{
            fontSize: 11, fontWeight: fw.semibold, textTransform: 'uppercase' as const,
            letterSpacing: '0.06em', color: c['content-secondary'],
            marginBottom: sp.D,
          }}>
            Pick your journey
          </div>

          {/* Journey cards — 2×2 grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: sp.D,
          }}>
            {JOURNEYS.map(j => (
              <JourneyCard
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

interface JourneyCardProps {
  journey: typeof JOURNEYS[number];
  selected: boolean;
  onSelect: () => void;
}

const JourneyCard: React.FC<JourneyCardProps> = ({ journey, selected, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const isActive = journey.active;
  const highlighted = isActive && (selected || hovered);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => isActive && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: c['background-base'],
        border: `1px solid ${selected ? c['border-brand'] : c['border-divider']}`,
        borderLeft: `3px solid ${selected ? c['content-brand'] : isActive ? c['border-default'] : c['border-divider']}`,
        borderRadius: 10,
        padding: `${sp.E}px ${sp.E}px ${sp.E}px ${sp.D + 2}px`,
        cursor: isActive ? 'pointer' : 'default',
        opacity: isActive ? 1 : 0.45,
        display: 'flex', flexDirection: 'column', gap: sp.C,
        boxShadow: highlighted ? '0 2px 12px rgba(0,0,0,0.07)' : 'none',
        transition: 'border-color 0.12s, box-shadow 0.12s',
        minHeight: 168,
      }}
    >
      {/* Number + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'monospace', fontSize: 11,
          color: selected ? c['content-brand'] : c['content-tertiary'],
          letterSpacing: '0.06em', fontWeight: fw.medium,
        }}>
          {journey.num}
        </span>
        {!isActive && (
          <span style={{
            fontSize: 10, fontWeight: fw.semibold, color: c['content-tertiary'],
            backgroundColor: c['background-subtle'], border: `1px solid ${c['border-divider']}`,
            borderRadius: 3, padding: '2px 6px', letterSpacing: '0.04em', textTransform: 'uppercase' as const,
          }}>
            Coming soon
          </span>
        )}
        {isActive && selected && (
          <span style={{
            fontSize: 10, fontWeight: fw.semibold, color: '#1D4ED8',
            backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE',
            borderRadius: 3, padding: '2px 6px', letterSpacing: '0.04em', textTransform: 'uppercase' as const,
          }}>
            Selected
          </span>
        )}
      </div>

      {/* Title + description */}
      <div>
        <div style={{
          fontSize: 15, fontWeight: fw.semibold, color: c['content-primary'],
          marginBottom: sp.A + 1, lineHeight: 1.3,
        }}>
          {journey.title}
        </div>
        <div style={{ fontSize: fs.sm, color: c['content-secondary'], lineHeight: 1.55 }}>
          {journey.description}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {journey.time && (
          <span style={{ fontSize: 11, color: c['content-tertiary'] }}>{journey.time}</span>
        )}
        {isActive && (
          <Button
            variant={selected ? 'primary' : 'secondary'}
            size="basic"
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            {selected ? 'Starting…' : 'Start journey'}
          </Button>
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
              {/* Heading row */}
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

              {/* Prompt bar */}
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
            <div style={{
              display: 'flex', alignItems: 'center', gap: sp.D, marginBottom: sp.H,
            }}>
              <div style={{ flex: 1, height: 1, backgroundColor: c['border-divider'] }}/>
              <span style={{ fontSize: 11, color: c['content-tertiary'], fontWeight: fw.medium, letterSpacing: '0.04em' }}>
                OR
              </span>
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
        width: 96, padding: `${sp.D}px ${sp.C}px`,
        backgroundColor: selected ? c['background-information'] : hovered ? c['background-subtle'] : c['background-base'],
        border: `1px solid ${selected ? c['border-brand'] : hovered ? c['border-brand'] : c['border-divider']}`,
        borderRadius: 10, cursor: 'pointer',
        transition: 'all 0.12s', fontFamily: ff.primary,
        boxShadow: hovered || selected ? '0 1px 6px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        backgroundColor: c['background-subtle'],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <img
          src={warehouse.logo}
          alt={warehouse.name}
          style={{ width: 28, height: 28, objectFit: 'contain' }}
        />
      </div>
      <span style={{
        fontSize: 11, fontWeight: fw.medium,
        color: selected ? c['content-brand'] : c['content-primary'],
        textAlign: 'center',
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
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        backgroundColor: c['background-subtle'],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {option.icon}
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
