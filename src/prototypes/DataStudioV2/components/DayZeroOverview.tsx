import React, { useState, useRef } from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import PromptBar, { PromptBarRef } from './PromptBar';

const WAREHOUSES = [
  { id: 'snowflake',  name: 'Snowflake',     logo: '/logos/snowflake.svg',  prompt: 'I want to connect my Snowflake warehouse and build a model in ThoughtSpot' },
  { id: 'bigquery',   name: 'BigQuery',      logo: '/logos/bigquery.svg',   prompt: 'I want to connect my Google BigQuery warehouse and build a model in ThoughtSpot' },
  { id: 'databricks', name: 'Databricks',    logo: '/logos/databricks.svg', prompt: 'I want to connect my Databricks warehouse and build a model in ThoughtSpot' },
  { id: 'redshift',   name: 'Redshift',      logo: '/logos/redshift.svg',   prompt: 'I want to connect my Amazon Redshift warehouse and build a model in ThoughtSpot' },
  { id: 'azure',      name: 'Azure Synapse', logo: '/logos/azure.svg',      prompt: 'I want to connect my Azure Synapse warehouse and build a model in ThoughtSpot' },
  { id: 'postgres',   name: 'PostgreSQL',    logo: '/logos/postgres.svg',   prompt: 'I want to connect my PostgreSQL database and build a model in ThoughtSpot' },
  { id: 'dbt',        name: 'dbt',           logo: '/logos/dbt.svg',        prompt: 'I want to connect via dbt and build a model in ThoughtSpot' },
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
  },
] as const;

interface DayZeroOverviewProps {
  onPromptSubmit: (prompt: string) => void;
  onNewProject: () => void;
}

const DayZeroOverview: React.FC<DayZeroOverviewProps> = ({ onPromptSubmit, onNewProject }) => {
  const promptBarRef = useRef<PromptBarRef>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  const handleWarehouseClick = (warehouse: typeof WAREHOUSES[number]) => {
    setSelectedWarehouse(warehouse.id);
    promptBarRef.current?.setValue(warehouse.prompt);
    promptBarRef.current?.focus();
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: c['background-sunken'] }}>

      {/* Hero */}
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
              onSubmit={onPromptSubmit}
              placeholder="Describe your use case and the questions you'd like to answer…"
              dropDirection="down"
              compact={false}
              landingPage
            />
          </div>
        </div>
      </div>

      {/* Entry points */}
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
              <ExistingModelCard key={opt.id} option={opt} onClick={onNewProject} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

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
        border: `1px solid ${selected || hovered ? c['border-brand'] : c['border-divider']}`,
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

interface ExistingModelCardProps {
  option: typeof EXISTING_MODEL_OPTIONS[number];
  onClick: () => void;
}

const ExistingModelCard: React.FC<ExistingModelCardProps> = ({ option, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
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

export default DayZeroOverview;
