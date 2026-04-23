import React from 'react';
import { AppShell } from '../../../components';
import type { AppSidebarProps, SidebarTab, SidebarCategory } from '../../../components/AppSidebar';
import type { GlobalHeaderProps } from '../../../components/GlobalHeader';

export type NavSection = 'overview' | 'projects' | 'data' | 'connections' | 'monitoring' | 'governance';

// ── Sidebar config ────────────────────────────────────────────────────────────

const SIDEBAR_TABS: SidebarTab[] = [
  { id: 'insights', label: 'Insights',  headerTitle: 'Insights' },
  { id: 'data',     label: 'Data',      headerTitle: 'Data Studio' },
  { id: 'develop',  label: 'Develop',   headerTitle: 'Develop' },
  { id: 'admin',    label: 'Admin',     headerTitle: 'Admin' },
];

const SIDEBAR_CATEGORIES: Record<string, SidebarCategory[]> = {
  insights: [],
  data: [
    {
      items: [
        { id: 'overview',     label: 'Overview' },
        { id: 'projects',     label: 'Projects' },
        { id: 'data',         label: 'Data' },
        { id: 'connections',  label: 'Connections' },
        { id: 'monitoring',   label: 'Monitoring' },
        { id: 'governance',   label: 'Governance' },
      ],
    },
  ],
  develop: [],
  admin: [],
};

// ── Shell ─────────────────────────────────────────────────────────────────────

interface ShellProps {
  activeNav: NavSection;
  onNavChange: (nav: NavSection) => void;
  hideSidebar?: boolean;
  hideHeader?: boolean;
  children: React.ReactNode;
}

const Shell: React.FC<ShellProps> = ({ activeNav, onNavChange, hideSidebar = false, hideHeader = false, children }) => {
  const headerProps: GlobalHeaderProps = {
    searchPlaceholder: 'Search in ThoughtSpot',
    searchMode: 'trigger',
    userName: 'Vivek Sahi',
    notificationCount: 0,
    style: hideHeader ? { display: 'none' } : undefined,
  };

  const sidebarProps: AppSidebarProps = {
    tabs: SIDEBAR_TABS,
    activeTab: 'data',
    onTabChange: () => {},
    categories: SIDEBAR_CATEGORIES,
    selectedNav: activeNav,
    onNavSelect: (id) => onNavChange(id as NavSection),
  };

  return (
    <AppShell
      style={{ height: '100vh' }}
      headerProps={headerProps}
      sidebarProps={sidebarProps}
      hideSidebar={hideSidebar}
    >
      <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </AppShell>
  );
};

export default Shell;
