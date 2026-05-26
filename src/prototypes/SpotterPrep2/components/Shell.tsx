import React from 'react';
import { AppShell } from '../../../components';
import type { AppSidebarProps, SidebarTab, SidebarCategory } from '../../../components/AppSidebar';
import type { GlobalHeaderProps } from '../../../components/GlobalHeader';

// ── Sidebar config ────────────────────────────────────────────────────────────

const SIDEBAR_TABS: SidebarTab[] = [
  { id: 'insights', label: 'Insights', headerTitle: 'Insights' },
  { id: 'data',     label: 'Data',     headerTitle: 'Data workspace' },
  { id: 'develop',  label: 'Develop',  headerTitle: 'Develop' },
  { id: 'admin',    label: 'Admin',    headerTitle: 'Admin' },
];

const SIDEBAR_CATEGORIES: Record<string, SidebarCategory[]> = {
  insights: [
    {
      title: 'Navigation',
      items: [
        { id: 'home',       label: 'Home' },
        { id: 'liveboards', label: 'Liveboards' },
        { id: 'spotter',    label: 'Spotter' },
      ],
    },
  ],
  data: [
    {
      title: 'Data workspace',
      items: [
        { id: 'data-models',     label: 'Data models' },
        { id: 'data-objects',    label: 'Data objects' },
        { id: 'connections',     label: 'Connections' },
        { id: 'analyst-studio',  label: 'Analyst studio', isExternal: true },
        { id: 'utilities',       label: 'Utilities' },
        { id: 'sync',            label: 'Sync' },
      ],
    },
    {
      title: 'Governance',
      items: [
        { id: 'data-catalog', label: 'Data catalog' },
        { id: 'usage',        label: 'Usage' },
        { id: 'dbt',          label: 'dbt' },
      ],
    },
  ],
  develop: [
    {
      title: 'Developer',
      items: [
        { id: 'playground',      label: 'Playground' },
        { id: 'custom-actions',  label: 'Custom actions' },
      ],
    },
  ],
  admin: [
    {
      title: 'Overview',
      items: [
        { id: 'resource-control-centre', label: 'Resource control centre' },
      ],
    },
  ],
};

// ── Shell ─────────────────────────────────────────────────────────────────────

interface ShellProps {
  children: React.ReactNode;
  activeNav?: string;
  onNavChange?: (id: string) => void;
}

const Shell: React.FC<ShellProps> = ({ children, activeNav = 'data-models', onNavChange }) => {
  const headerProps: GlobalHeaderProps = {
    searchPlaceholder: 'Search in ThoughtSpot',
    searchMode: 'trigger',
    userName: 'Vivek Sahi',
    notificationCount: 0,
  };

  const sidebarProps: AppSidebarProps = {
    tabs: SIDEBAR_TABS,
    activeTab: 'data',
    onTabChange: () => {},
    categories: SIDEBAR_CATEGORIES,
    selectedNav: activeNav,
    onNavSelect: (id) => onNavChange?.(id),
  };

  return (
    <AppShell
      style={{ height: '100%' }}
      headerProps={headerProps}
      sidebarProps={sidebarProps}
      contentBackground="#FFFFFF"
    >
      <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </AppShell>
  );
};

export default Shell;
