import React from 'react';
import { Icon, Avatar, Horizontal, Vertical } from '../../../components';
import type { IconName } from '../../../components';
import { shell, c, spacing, radius, fontFamily, fontSize, fontWeight } from '../styles';

export type NavKey = 'objects' | 'datastore';

// ── Top bar ─────────────────────────────────────────────────────────────────
export const TopBar: React.FC = () => (
  <Horizontal
    justify="space-between"
    align="center"
    style={{
      height: '56px',
      flexShrink: 0,
      backgroundColor: shell.bg,
      borderBottom: `1px solid ${shell.divider}`,
      padding: `0 ${spacing.F}px`,
    }}
  >
    <span
      style={{
        fontFamily: fontFamily.primary,
        fontSize: `${fontSize.lg}px`,
        fontWeight: fontWeight.semibold,
        color: shell.text,
        letterSpacing: '-0.01em',
      }}
    >
      ThoughtSpot
    </span>

    <Horizontal gap={spacing.E} align="center">
      <Horizontal
        gap={spacing.B}
        align="center"
        style={{
          width: '320px',
          height: '36px',
          backgroundColor: shell.raised,
          borderRadius: `${radius.full}px`,
          padding: `0 ${spacing.D}px`,
        }}
      >
        <Icon name="search" size="m" color={shell.textDim} />
        <span style={{ fontFamily: fontFamily.primary, fontSize: `${fontSize.sm}px`, color: shell.textDim }}>
          Search your library
        </span>
      </Horizontal>
      <Icon name="question-mark" size="l" color={shell.textDim} />
      <Horizontal
        gap={spacing.A}
        align="center"
        style={{
          backgroundColor: shell.raised,
          borderRadius: `${radius.full}px`,
          padding: `${spacing.A}px ${spacing.C}px`,
        }}
      >
        <span style={{ fontFamily: fontFamily.primary, fontSize: `${fontSize.sm}px`, color: shell.text }}>
          Primary
        </span>
        <Icon name="chevron-down" size="s" color={shell.textDim} />
      </Horizontal>
      <Avatar name="Sam W" size="s" />
    </Horizontal>
  </Horizontal>
);

// ── Sidebar (icon rail + Data workspace nav) ──────────────────────────────────
const railIcons: IconName[] = ['chart', 'database', 'cog'];

const NavItem: React.FC<{
  label: string;
  active?: boolean;
  clickable?: boolean;
  external?: boolean;
  onClick?: () => void;
}> = ({ label, active, clickable, external, onClick }) => (
  <Horizontal
    gap={spacing.B}
    align="center"
    onClick={clickable ? onClick : undefined}
    style={{
      padding: `${spacing.B}px ${spacing.C}px`,
      borderRadius: `${radius.md}px`,
      cursor: clickable ? 'pointer' : 'default',
      backgroundColor: active ? shell.raised : 'transparent',
      color: active ? shell.accent : shell.textDim,
      fontFamily: fontFamily.primary,
      fontSize: `${fontSize.sm}px`,
      fontWeight: active ? fontWeight.medium : fontWeight.regular,
      userSelect: 'none',
    }}
  >
    <span>{label}</span>
    {external && <Icon name="expand" size="xs" color={shell.textDim} />}
  </Horizontal>
);

const GroupLabel: React.FC<{ children: string }> = ({ children }) => (
  <span
    style={{
      fontFamily: fontFamily.primary,
      fontSize: `${fontSize.xs}px`,
      fontWeight: fontWeight.semibold,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: shell.textMuted,
      padding: `0 ${spacing.C}px`,
      marginTop: `${spacing.D}px`,
      marginBottom: `${spacing.A}px`,
    }}
  >
    {children}
  </span>
);

export const Sidebar: React.FC<{ active: NavKey; onNavigate: (key: NavKey) => void }> = ({
  active,
  onNavigate,
}) => (
  <Horizontal align="stretch" style={{ flexShrink: 0, height: '100%' }}>
    {/* Icon rail */}
    <Vertical
      align="center"
      gap={spacing.B}
      style={{
        width: '56px',
        backgroundColor: shell.bg,
        borderRight: `1px solid ${shell.divider}`,
        padding: `${spacing.C}px 0`,
      }}
    >
      {railIcons.map((name, i) => (
        <span
          key={name}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: `${radius.md}px`,
            backgroundColor: i === 1 ? shell.raised : 'transparent',
          }}
        >
          <Icon name={name} size="l" color={i === 1 ? shell.text : shell.textDim} />
        </span>
      ))}
    </Vertical>

    {/* Nav panel */}
    <Vertical
      gap={spacing.A / 2}
      style={{
        width: '232px',
        backgroundColor: shell.bg,
        borderRight: `1px solid ${shell.divider}`,
        padding: `${spacing.E}px ${spacing.C}px`,
      }}
    >
      <Horizontal justify="space-between" align="center" style={{ padding: `0 ${spacing.C}px`, marginBottom: `${spacing.D}px` }}>
        <span style={{ fontFamily: fontFamily.primary, fontSize: `${fontSize.xl}px`, fontWeight: fontWeight.semibold, color: shell.text }}>
          Data workspace
        </span>
        <Icon name="plus" size="m" color={shell.textDim} />
      </Horizontal>

      <NavItem label="Data objects" active={active === 'objects'} clickable onClick={() => onNavigate('objects')} />
      <NavItem label="Connections" />
      <NavItem label="Analyst Studio" external />
      <NavItem label="Utilities" />
      <NavItem label="Sync" />

      <GroupLabel>Governance</GroupLabel>
      <NavItem label="Data catalog" />
      <NavItem label="Usage" />
      <NavItem label="Data store" active={active === 'datastore'} clickable onClick={() => onNavigate('datastore')} />
      <NavItem label="dbt" />
      <NavItem label="Liveboard verification" />
    </Vertical>
  </Horizontal>
);

// Content color tokens re-export for convenience in views.
export const pageBg = c['background-sunken'];
