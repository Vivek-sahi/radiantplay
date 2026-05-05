import React, { useState } from 'react';
import { sp, ff, fs, fw } from '../styles';

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

const JOURNEYS = [
  {
    id: 'day-zero',
    num: '01',
    title: 'Get started',
    description: 'Connect a warehouse, build your first model, fix data quality issues, and go live — all inside ThoughtSpot.',
    time: '~10 min',
  },
  {
    id: 'monitor',
    num: '02',
    title: 'Monitor & optimize',
    description: 'Review model health, fix stale cache, and improve AI answer quality across your models.',
    time: null,
  },
  {
    id: 'debug',
    num: '03',
    title: 'Debug issues',
    description: 'Diagnose why Spotter is giving wrong answers and find the root cause in your semantic layer.',
    time: null,
  },
  {
    id: 'dbt',
    num: '04',
    title: 'dbt plug-and-play',
    description: 'Import your dbt project, resolve semantic issues, and publish models to Spotter in minutes.',
    time: null,
  },
];

interface JourneyPickerProps {
  onSelectJourney: (journeyId: string) => void;
}

const JourneyPicker: React.FC<JourneyPickerProps> = ({ onSelectJourney }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => onSelectJourney(id), 120);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, overflowY: 'auto',
      backgroundColor: D.pageBg,
      fontFamily: ff.primary,
      backgroundImage: 'radial-gradient(ellipse 80% 36% at 50% 0%, rgba(39,112,239,0.14) 0%, transparent 100%)',
      zIndex: 50,
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
            <p style={{ margin: 0, fontSize: 15, color: D.body, lineHeight: 1.65, maxWidth: 480 }}>
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
              <JourneyCard
                key={j.id}
                journey={j}
                selected={selected === j.id}
                onSelect={() => handleSelect(j.id)}
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
  const lit = selected || hovered;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: selected ? D.cardBgActive : D.cardBg,
        border: `1px solid ${lit ? D.borderActive : D.border}`,
        borderLeft: `2px solid ${selected ? D.borderActive : lit ? 'rgba(39,112,239,0.4)' : D.border}`,
        borderRadius: 10,
        padding: `${sp.E}px ${sp.E}px ${sp.E}px ${sp.D + 2}px`,
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: sp.C,
        boxShadow: selected
          ? '0 0 0 1px rgba(39,112,239,0.3), 0 4px 20px rgba(39,112,239,0.12)'
          : hovered ? '0 2px 12px rgba(0,0,0,0.3)' : 'none',
        transition: 'all 0.14s',
        minHeight: 164,
      }}
    >
      {/* Number + selected badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'monospace', fontSize: 11,
          color: selected ? D.mono : D.monoMuted,
          letterSpacing: '0.06em', fontWeight: fw.medium,
        }}>
          {journey.num}
        </span>
        {selected && (
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
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          style={{
            marginLeft: 'auto',
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
      </div>
    </div>
  );
};

export default JourneyPicker;
