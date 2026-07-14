import React from 'react';
import { AppShell } from '../../../components';
import type { AppSidebarProps, SidebarTab, SidebarCategory } from '../../../components/AppSidebar';
import type { GlobalHeaderProps } from '../../../components/GlobalHeader';

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
  canvasMode?: CanvasMode;
  onCanvasModeChange?: (m: CanvasMode) => void;
  children: React.ReactNode;
}

const Shell: React.FC<ShellProps> = ({ activeNav, onNavChange, hideSidebar = false, hideHeader = false, canvasMode = 'dataset', onCanvasModeChange, children }) => {
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
    bottomSlot: (
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Canvas mode · demo</div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 7, padding: 3, gap: 2 }}>
          {([['dataset', 'Option 1'], ['blocks', 'Option 2'], ['dataset2', 'Option 3']] as [CanvasMode, string][]).map(([val, label]) => {
            const active = canvasMode === val;
            return (
              <button
                key={val}
                onClick={() => onCanvasModeChange?.(val)}
                style={{ flex: 1, padding: '5px 0', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit', background: active ? 'rgba(255,255,255,0.16)' : 'transparent', color: active ? '#FFFFFF' : 'rgba(255,255,255,0.55)', transition: 'background 120ms, color 120ms' }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    ),
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
