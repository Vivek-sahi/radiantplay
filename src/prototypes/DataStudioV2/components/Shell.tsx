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
  onJourneyPickerOpen?: () => void;
  hideSidebar?: boolean;
  hideHeader?: boolean;
  children: React.ReactNode;
}

const JourneyPin: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    title="Switch journey"
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      width: '100%', padding: '8px 24px',
      background: 'transparent', border: 0, cursor: 'pointer',
      color: 'rgba(219,223,231,0.6)',
      fontFamily: 'inherit', fontSize: 14, fontWeight: 375,
      transition: 'color 120ms ease',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#DBDFE7'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(219,223,231,0.6)'; }}
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25"/>
      <path d="M8 4.5L9.5 7H6.5L8 4.5Z" fill="currentColor" opacity="0.9"/>
      <path d="M8 11.5L6.5 9H9.5L8 11.5Z" fill="currentColor" opacity="0.9"/>
      <path d="M4.5 8L7 6.5V9.5L4.5 8Z" fill="currentColor" opacity="0.5"/>
      <path d="M11.5 8L9 9.5V6.5L11.5 8Z" fill="currentColor" opacity="0.5"/>
      <circle cx="8" cy="8" r="1.25" fill="currentColor"/>
    </svg>
    Journeys
  </button>
);

const Shell: React.FC<ShellProps> = ({ activeNav, onNavChange, onJourneyPickerOpen, hideSidebar = false, hideHeader = false, children }) => {
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
    bottomSlot: onJourneyPickerOpen ? <JourneyPin onClick={onJourneyPickerOpen} /> : undefined,
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
