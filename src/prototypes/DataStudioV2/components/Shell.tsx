import React from 'react';
import { AppShell } from '../../../components';
import type { AppSidebarProps, SidebarTab, SidebarCategory } from '../../../components/AppSidebar';
import type { GlobalHeaderProps } from '../../../components/GlobalHeader';
import { PERSONA } from '../persona';
import { VariantToggle } from '../variant';

export type NavSection = 'overview' | 'projects' | 'data' | 'connections';
export type FlowOption = 'option1' | 'option2' | 'option3';
export type CanvasMode = 'dataset' | 'blocks' | 'dataset2';

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
        { id: 'projects',     label: 'Models' },
        { id: 'data',         label: 'Data' },
        { id: 'connections',  label: 'Connections' },
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
  /** Rendered before the header's search field — see GlobalHeader's `leadingSlot`. */
  headerLeadingSlot?: React.ReactNode;
  children: React.ReactNode;
}

const Shell: React.FC<ShellProps> = ({ activeNav, onNavChange, hideSidebar = false, hideHeader = false, headerLeadingSlot, children }) => {
  const headerProps: GlobalHeaderProps = {
    searchPlaceholder: 'Search in ThoughtSpot',
    searchMode: 'trigger',
    userName: PERSONA.userName,
    userAvatar: PERSONA.userAvatar,
    notificationCount: 0,
    rightSlot: <VariantToggle />,
    leadingSlot: headerLeadingSlot,
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
