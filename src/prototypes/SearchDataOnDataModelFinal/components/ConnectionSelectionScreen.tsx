import React, { useState } from 'react';
import { RdModal } from '@components/RdModal';
import { SearchInput } from '@components/SearchInput';
import { Horizontal } from '@components/Layout';
import { systemColors } from '@tokens/colors';
import { spacing } from '@tokens/spacing';
import { fontSize, fontWeight, fontFamily } from '@tokens/typography';
import { dataConnections, DataConnection } from '../data/mockData';

// ── Provider icon SVGs ─────────────────────────────────────────────────────────
// Third-party brand colours — hardcoded per brand guidelines, no Radiant token equivalent

const SnowflakeIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-label="Snowflake">
    <path d="M9 1v16M9 1L6.5 3.5M9 1l2.5 2.5M9 17l-2.5-2.5M9 17l2.5-2.5M1 9h16M1 9l2.5-2.5M1 9l2.5 2.5M17 9l-2.5-2.5M17 9l-2.5 2.5M3.636 3.636l10.728 10.728M3.636 3.636l-.707 3.5M3.636 3.636l3.5-.707M14.364 14.364l.707-3.5M14.364 14.364l-3.5.707M14.364 3.636l-10.728 10.728M14.364 3.636l.707 3.5M14.364 3.636l-3.5-.707M3.636 14.364l-.707-3.5M3.636 14.364l3.5.707" stroke="#29B5E8" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const RedshiftIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-label="Redshift">
    <path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z" fill="#8C4FFF" />
    <path d="M9 5L13 7.5V12.5L9 15L5 12.5V7.5L9 5Z" fill="#C39AF7" />
    <circle cx="9" cy="9" r="2" fill="white" />
  </svg>
);

const BigQueryIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-label="BigQuery">
    <circle cx="8" cy="8" r="6" stroke="#4285F4" strokeWidth="1.5" fill="none" />
    <path d="M12.5 12.5L16 16" stroke="#4285F4" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M6 8h4M8 6v4" stroke="#4285F4" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const DatabricksIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-label="Databricks">
    <path d="M9 2L16 6V10L9 14L2 10V6L9 2Z" fill="#FF3621" />
    <path d="M2 10L9 14L16 10" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" fill="none" />
    <path d="M2 8L9 12L16 8" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" fill="none" />
  </svg>
);

const PROVIDER_ICONS: Record<DataConnection['source'], React.FC> = {
  Snowflake:  SnowflakeIcon,
  Redshift:   RedshiftIcon,
  BigQuery:   BigQueryIcon,
  Databricks: DatabricksIcon,
};

// ── Detail panel — flat document layout matching the product UI ────────────────

const HR: React.FC = () => (
  <div style={{ height: 1, backgroundColor: systemColors.light['border-divider'], margin: `${spacing.D}px 0` }} />
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: systemColors.light['content-primary'], marginBottom: spacing.B }}>
    {children}
  </div>
);

const DetailPanel: React.FC<{ conn: DataConnection }> = ({ conn }) => {
  const ProviderIcon = PROVIDER_ICONS[conn.source];
  return (
    <div style={{ fontFamily: fontFamily.primary }}>
      {/* Name + source type */}
      <div style={{ marginBottom: spacing.C }}>
        <div style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: systemColors.light['content-primary'], marginBottom: 4 }}>
          {conn.name}
        </div>
        <Horizontal align="center" gap={spacing.B}>
          <ProviderIcon />
          <span style={{ fontSize: fontSize.sm, color: systemColors.light['content-secondary'] }}>{conn.source}</span>
        </Horizontal>
      </div>

      {/* Created + Modified inline */}
      <Horizontal gap={spacing.F} style={{ marginBottom: spacing.C }}>
        <span style={{ fontSize: fontSize.sm, color: systemColors.light['content-tertiary'] }}>
          Created: <span style={{ color: systemColors.light['content-secondary'] }}>{conn.created}</span>
        </span>
        <span style={{ fontSize: fontSize.sm, color: systemColors.light['content-tertiary'] }}>
          Modified: <span style={{ color: systemColors.light['content-secondary'] }}>{conn.modified}</span>
        </span>
      </Horizontal>

      <HR />

      {/* Description */}
      <div style={{ marginBottom: spacing.D }}>
        <SectionLabel>Description</SectionLabel>
        <p style={{ margin: 0, fontSize: fontSize.sm, color: systemColors.light['content-secondary'], lineHeight: 1.6 }}>
          {conn.desc}
        </p>
      </div>

      <HR />

      {/* Tags */}
      <div style={{ marginBottom: spacing.D }}>
        <SectionLabel>Tags</SectionLabel>
        {conn.tags.length > 0 ? (
          <Horizontal gap={spacing.B} style={{ flexWrap: 'wrap' }}>
            {conn.tags.map(tag => (
              <span
                key={tag}
                style={{
                  fontSize: fontSize.xs,
                  color: systemColors.light['content-secondary'],
                  border: `1px solid ${systemColors.light['border-default']}`,
                  borderRadius: 4,
                  padding: `2px ${spacing.B}px`,
                }}
              >
                {tag}
              </span>
            ))}
          </Horizontal>
        ) : (
          <span style={{ fontSize: fontSize.sm, color: systemColors.light['content-tertiary'] }}>—</span>
        )}
      </div>

      <HR />

      {/* Authors */}
      <div>
        <SectionLabel>Authors</SectionLabel>
        <span style={{ fontSize: fontSize.sm, color: systemColors.light['content-secondary'] }}>{conn.author}</span>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export interface ConnectionSelectionScreenProps {
  onBack: () => void;
  onDismiss?: () => void;
  onNext: (connection: DataConnection) => void;
  cancelLabel?: string;
  confirmLabel?: string;
}

export const ConnectionSelectionScreen: React.FC<ConnectionSelectionScreenProps> = ({ onBack, onDismiss, onNext, cancelLabel = 'Back', confirmLabel = 'Next' }) => {
  const [selectedId, setSelectedId] = useState<string | null>(dataConnections[0].id);
  const [search, setSearch] = useState('');

  const filtered = dataConnections.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const selected = dataConnections.find(c => c.id === selectedId) ?? null;

  return (
    <RdModal
      size="M2"
      title="Select a connection"
      onClose={onDismiss ?? onBack}
      tertiaryLabel="Create a connection"
      onTertiary={() => {/* no-op */}}
      cancelLabel={cancelLabel}
      onCancel={onBack}
      confirmLabel={confirmLabel}
      onConfirm={() => selected && onNext(selected)}
      confirmDisabled={!selected}
    >
      {/* Negate the modal's 24px content padding to get edge-to-edge columns */}
      {/* 600, not 552: this body negates RdModal's 24px content padding with the
          -24 margin, where ModelSelectionModal's 552 sits inside it. 552 + 48 of
          padding = 600, so both modals end up the same height on screen. */}
      <div style={{ display: 'flex', margin: -24, height: 600, fontFamily: fontFamily.primary }}>

        {/* Left — connection list */}
        <div
          style={{
            width: 260,
            flexShrink: 0,
            borderRight: `1px solid ${systemColors.light['border-divider']}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search */}
          <div style={{ padding: `${spacing.C}px ${spacing.C}px ${spacing.B}px` }}>
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
            />
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map(conn => {
              const isActive = selectedId === conn.id;
              const ProviderIcon = PROVIDER_ICONS[conn.source];
              return (
                <div
                  key={conn.id}
                  onClick={() => setSelectedId(conn.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.B,
                    height: 40,
                    padding: `0 ${spacing.C}px`,
                    cursor: 'pointer',
                    backgroundColor: isActive ? systemColors.light['background-subtle'] : 'transparent',
                    borderLeft: isActive
                      ? `2px solid ${systemColors.light['content-brand']}`
                      : '2px solid transparent',
                    boxSizing: 'border-box',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = systemColors.light['background-subtle'];
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <ProviderIcon />
                  <span
                    style={{
                      flex: 1,
                      fontSize: fontSize.sm,
                      fontWeight: isActive ? fontWeight.medium : fontWeight.light,
                      color: systemColors.light['content-primary'],
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {conn.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — detail panel */}
        <div
          style={{
            flex: 1,
            padding: `${spacing.F}px`,
            overflowY: 'auto',
          }}
        >
          {selected ? (
            <DetailPanel conn={selected} />
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: systemColors.light['content-tertiary'],
                fontSize: fontSize.sm,
              }}
            >
              Select a connection to see details
            </div>
          )}
        </div>
      </div>
    </RdModal>
  );
};

export default ConnectionSelectionScreen;
