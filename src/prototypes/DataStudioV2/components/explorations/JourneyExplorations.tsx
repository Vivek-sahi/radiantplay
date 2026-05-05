import React, { useState, useRef } from 'react';
import { c, sp, ff, fs, fw } from '../../styles';
import Shell from '../Shell';
import PromptBar, { PromptBarRef } from '../PromptBar';
import { Button } from '../../../../components/Button';

// ── Warehouse brand colors ────────────────────────────────────────────────────

const WAREHOUSES = [
  {
    id: 'snowflake',
    name: 'Snowflake',
    color: '#29B5E8',
    bg: '#EFF9FE',
    icon: <SnowflakeIcon />,
  },
  {
    id: 'redshift',
    name: 'Redshift',
    color: '#C7371A',
    bg: '#FEF0ED',
    icon: <RedshiftIcon />,
  },
  {
    id: 'bigquery',
    name: 'BigQuery',
    color: '#4285F4',
    bg: '#EEF3FE',
    icon: <BigQueryIcon />,
  },
  {
    id: 'databricks',
    name: 'Databricks',
    color: '#FF3621',
    bg: '#FFF0EE',
    icon: <DatabricksIcon />,
  },
  {
    id: 'more',
    name: 'More',
    color: c['content-secondary'],
    bg: c['background-subtle'],
    icon: <MoreIcon />,
  },
] as const;

// ── Warehouse SVG icons ───────────────────────────────────────────────────────

function SnowflakeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <line x1="11" y1="1" x2="11" y2="21" stroke="#29B5E8" strokeWidth="2" strokeLinecap="round"/>
      <line x1="1" y1="11" x2="21" y2="11" stroke="#29B5E8" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4.05" y1="4.05" x2="17.95" y2="17.95" stroke="#29B5E8" strokeWidth="2" strokeLinecap="round"/>
      <line x1="17.95" y1="4.05" x2="4.05" y2="17.95" stroke="#29B5E8" strokeWidth="2" strokeLinecap="round"/>
      <line x1="11" y1="1" x2="8.5" y2="4" stroke="#29B5E8" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="11" y1="1" x2="13.5" y2="4" stroke="#29B5E8" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="11" y1="21" x2="8.5" y2="18" stroke="#29B5E8" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="11" y1="21" x2="13.5" y2="18" stroke="#29B5E8" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="1" y1="11" x2="4" y2="8.5" stroke="#29B5E8" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="1" y1="11" x2="4" y2="13.5" stroke="#29B5E8" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="21" y1="11" x2="18" y2="8.5" stroke="#29B5E8" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="21" y1="11" x2="18" y2="13.5" stroke="#29B5E8" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function RedshiftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <ellipse cx="11" cy="7" rx="7" ry="3.5" fill="#C7371A" opacity="0.15" stroke="#C7371A" strokeWidth="1.5"/>
      <rect x="4" y="7" width="14" height="2.5" fill="#C7371A" opacity="0.1"/>
      <ellipse cx="11" cy="9.5" rx="7" ry="3.5" fill="none" stroke="#C7371A" strokeWidth="1.5"/>
      <rect x="4" y="9.5" width="14" height="2.5" fill="#C7371A" opacity="0.1"/>
      <ellipse cx="11" cy="12" rx="7" ry="3.5" fill="none" stroke="#C7371A" strokeWidth="1.5"/>
      <line x1="4" y1="7" x2="4" y2="12" stroke="#C7371A" strokeWidth="1.5"/>
      <line x1="18" y1="7" x2="18" y2="12" stroke="#C7371A" strokeWidth="1.5"/>
    </svg>
  );
}

function BigQueryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="10" cy="10" r="6.5" stroke="#4285F4" strokeWidth="2"/>
      <line x1="14.8" y1="14.8" x2="19" y2="19" stroke="#4285F4" strokeWidth="2" strokeLinecap="round"/>
      <line x1="7" y1="10" x2="13" y2="10" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10" y1="7" x2="10" y2="13" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function DatabricksIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <polygon points="11,2 20,7 20,15 11,20 2,15 2,7" stroke="#FF3621" strokeWidth="1.5" fill="#FF3621" fillOpacity="0.08"/>
      <polygon points="11,5 17,8.5 17,13.5 11,17 5,13.5 5,8.5" stroke="#FF3621" strokeWidth="1" fill="#FF3621" fillOpacity="0.12"/>
      <polygon points="11,8 14,9.75 14,12.25 11,14 8,12.25 8,9.75" fill="#FF3621" fillOpacity="0.7"/>
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="5.5" cy="11" r="2" fill={c['content-tertiary']}/>
      <circle cx="11" cy="11" r="2" fill={c['content-tertiary']}/>
      <circle cx="16.5" cy="11" r="2" fill={c['content-tertiary']}/>
    </svg>
  );
}

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
      {/* Top bar — minimal product identity */}
      <div style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: `0 ${sp.H}px`,
        backgroundColor: c['background-base'],
        borderBottom: `1px solid ${c['border-divider']}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Sparkle mark */}
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

          {/* Hero */}
          <div style={{ marginBottom: sp.J, textAlign: 'center' }}>
            <h1 style={{
              margin: `0 0 ${sp.B}px`,
              fontSize: 28, fontWeight: fw.semibold,
              color: c['content-primary'], letterSpacing: '-0.4px', lineHeight: 1.25,
            }}>
              Where would you like to start?
            </h1>
            <p style={{
              margin: 0, fontSize: fs.sm, color: c['content-secondary'], lineHeight: 1.6,
            }}>
              Data Studio is the single workspace to build, test, and maintain your semantic layer — guided by the agent.
            </p>
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
        borderLeft: `3px solid ${selected ? c['content-brand'] : isActive ? c['border-divider'] : c['border-divider']}`,
        borderRadius: 10,
        padding: `${sp.E}px ${sp.E}px ${sp.E}px ${sp.D + 2}px`,
        cursor: isActive ? 'pointer' : 'default',
        opacity: isActive ? 1 : 0.5,
        display: 'flex', flexDirection: 'column', gap: sp.C,
        boxShadow: highlighted ? '0 2px 12px rgba(0,0,0,0.07)' : 'none',
        transition: 'border-color 0.12s, box-shadow 0.12s',
        minHeight: 160,
      }}
    >
      {/* Number + badge row */}
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
            fontSize: 10, fontWeight: fw.semibold,
            color: c['content-tertiary'],
            backgroundColor: c['background-subtle'],
            border: `1px solid ${c['border-divider']}`,
            borderRadius: 3, padding: '2px 6px',
            letterSpacing: '0.04em', textTransform: 'uppercase' as const,
          }}>
            Coming soon
          </span>
        )}
        {isActive && selected && (
          <span style={{
            fontSize: 10, fontWeight: fw.semibold, color: '#1D4ED8',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 3, padding: '2px 6px',
            letterSpacing: '0.04em', textTransform: 'uppercase' as const,
          }}>
            Selected
          </span>
        )}
      </div>

      {/* Title + description */}
      <div>
        <div style={{
          fontSize: 15, fontWeight: fw.semibold,
          color: c['content-primary'], marginBottom: sp.A + 1, lineHeight: 1.3,
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
          <span style={{ fontSize: 11, color: c['content-tertiary'] }}>
            {journey.time}
          </span>
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
  const [hoveredWarehouse, setHoveredWarehouse] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  return (
    <div style={{ position: 'fixed', inset: 0, fontFamily: ff.primary }}>
      <Shell activeNav="overview" onNavChange={() => {}}>
        <div style={{ height: '100%', overflowY: 'auto', backgroundColor: c['background-sunken'] }}>

          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <div style={{
            backgroundColor: c['background-base'],
            borderBottom: `1px solid ${c['border-divider']}`,
            padding: `${sp.J}px ${sp.H}px ${sp.G}px`,
          }}>
            <div style={{
              maxWidth: 680, margin: '0 auto',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.E,
            }}>
              {/* Agent avatar + heading */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.B + 2 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 1.5L10.5 7.5 16.5 9 10.5 10.5 9 16.5 7.5 10.5 1.5 9 7.5 7.5Z" fill="white" fillOpacity="0.95"/>
                  </svg>
                </div>
                <h1 style={{
                  margin: 0, fontSize: 24, fontWeight: fw.semibold,
                  color: c['content-primary'], letterSpacing: '-0.3px', textAlign: 'center', lineHeight: 1.3,
                }}>
                  Let's build your first model
                </h1>
                <p style={{
                  margin: 0, fontSize: fs.sm, color: c['content-secondary'],
                  textAlign: 'center', maxWidth: 460, lineHeight: 1.6,
                }}>
                  Connect a data warehouse or describe your use case — the agent will handle the rest.
                </p>
              </div>

              {/* Prompt bar */}
              <div style={{ width: '100%' }}>
                <PromptBar
                  ref={promptBarRef}
                  onSubmit={() => {}}
                  placeholder="Describe the business question you want to answer…"
                  dropDirection="down"
                  compact={false}
                  landingPage
                />
              </div>
            </div>
          </div>

          {/* ── Entry points ─────────────────────────────────────────────── */}
          <div style={{ maxWidth: 680, margin: '0 auto', padding: `${sp.H}px ${sp.H}px` }}>

            {/* Warehouse section */}
            <div style={{ marginBottom: sp.H }}>
              <div style={{
                fontSize: 11, fontWeight: fw.semibold, textTransform: 'uppercase' as const,
                letterSpacing: '0.06em', color: c['content-secondary'],
                marginBottom: sp.D,
              }}>
                Connect your warehouse
              </div>
              <div style={{ display: 'flex', gap: sp.C, flexWrap: 'wrap' as const }}>
                {WAREHOUSES.map(w => (
                  <WarehouseCard
                    key={w.id}
                    warehouse={w}
                    hovered={hoveredWarehouse === w.id}
                    selected={selectedWarehouse === w.id}
                    onHover={setHoveredWarehouse}
                    onSelect={setSelectedWarehouse}
                  />
                ))}
              </div>
            </div>

            {/* Divider with OR */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: sp.D,
              marginBottom: sp.H,
            }}>
              <div style={{ flex: 1, height: 1, backgroundColor: c['border-divider'] }} />
              <span style={{ fontSize: 11, color: c['content-tertiary'], fontWeight: fw.medium, letterSpacing: '0.04em' }}>
                OR
              </span>
              <div style={{ flex: 1, height: 1, backgroundColor: c['border-divider'] }} />
            </div>

            {/* Existing model card */}
            <ExistingModelCard />

          </div>
        </div>
      </Shell>
    </div>
  );
};

// ── Warehouse card ────────────────────────────────────────────────────────────

interface WarehouseCardProps {
  warehouse: typeof WAREHOUSES[number];
  hovered: boolean;
  selected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

const WarehouseCard: React.FC<WarehouseCardProps> = ({ warehouse, hovered, selected, onHover, onSelect }) => (
  <button
    onMouseEnter={() => onHover(warehouse.id)}
    onMouseLeave={() => onHover(null)}
    onClick={() => onSelect(warehouse.id)}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.B,
      width: 100, padding: `${sp.D}px ${sp.C}px`,
      backgroundColor: selected ? warehouse.bg : hovered ? c['background-subtle'] : c['background-base'],
      border: `1px solid ${selected ? warehouse.color : hovered ? c['border-brand'] : c['border-divider']}`,
      borderRadius: 10, cursor: 'pointer',
      transition: 'all 0.12s',
      fontFamily: ff.primary,
    }}
  >
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      backgroundColor: selected ? warehouse.bg : c['background-subtle'],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background-color 0.12s',
    }}>
      {warehouse.icon}
    </div>
    <span style={{
      fontSize: 11, fontWeight: fw.medium,
      color: selected ? warehouse.color : c['content-primary'],
      textAlign: 'center',
    }}>
      {warehouse.name}
    </span>
    {selected && (
      <span style={{ fontSize: 10, color: warehouse.color, fontWeight: fw.semibold }}>
        Selected
      </span>
    )}
  </button>
);

// ── Existing model card ───────────────────────────────────────────────────────

const ExistingModelCard: React.FC = () => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: sp.D,
        width: '100%', padding: `${sp.D}px ${sp.E}px`,
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
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c['content-secondary']} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.25" y="2.25" width="13.5" height="13.5" rx="1.5"/>
          <line x1="5.25" y1="6.75" x2="12.75" y2="6.75"/>
          <line x1="5.25" y1="9" x2="12.75" y2="9"/>
          <line x1="5.25" y1="11.25" x2="9.75" y2="11.25"/>
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], marginBottom: 2 }}>
          Start with an existing model
        </div>
        <div style={{ fontSize: fs.xs, color: c['content-secondary'] }}>
          Import a dbt project or open a draft you've been working on
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c['content-tertiary']} strokeWidth="1.5" strokeLinecap="round">
        <path d="M5 2.5l4.5 4.5L5 11.5"/>
      </svg>
    </button>
  );
};
