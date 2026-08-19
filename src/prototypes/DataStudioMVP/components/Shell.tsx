import React from 'react';
import { AppShell } from '../../../components';
import type { AppSidebarProps, SidebarTab, SidebarCategory } from '../../../components/AppSidebar';
import type { GlobalHeaderProps } from '../../../components/GlobalHeader';
import { PERSONA } from '../persona';

export type NavSection = 'overview' | 'projects' | 'data' | 'connections' | 'data-objects';
export type FlowOption = 'option1' | 'option2' | 'option3';
export type CanvasMode = 'dataset' | 'blocks' | 'dataset2';

// ── Sidebar config — Data Studio's own nav (Vision, POC, Demo) ────────────────

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

// ── Sidebar config — Data Workspace (POC V2) ──────────────────────────────────
//
// POC V2 stops being a destination: the canvas is a feature of ThoughtSpot's Data
// Workspace, so Data Studio gives up its own home and nav and adopts these. Ported
// from `surajboro-ts/spotter-readiness-vision`.
//
// Only Data objects and Connections resolve to a page. The rest are the real
// product's nav and are deliberately present but inert — the shell has to read as
// Data Workspace, and a truncated nav would misrepresent where the canvas lives.
// This is the one place the wire-it-or-remove-it rule doesn't apply, because these
// items aren't ours to build.

const DATA_WORKSPACE_TABS: SidebarTab[] = [
  { id: 'insights', label: 'Insights App',   headerTitle: 'Insights' },
  { id: 'data',     label: 'Data Workspace', headerTitle: 'Data Workspace' },
  { id: 'develop',  label: 'Develop App',    headerTitle: 'Develop' },
];

const DATA_WORKSPACE_CATEGORIES: Record<string, SidebarCategory[]> = {
  insights: [],
  data: [
    {
      items: [
        { id: 'data-objects',           label: 'Data objects' },
        { id: 'connections',            label: 'Connections' },
        { id: 'semantic-integrations',  label: 'Semantic integrations' },
        { id: 'analyst-studio',         label: 'Analyst Studio' },
        { id: 'utilities',              label: 'Utilities' },
        { id: 'sync',                   label: 'Sync' },
      ],
    },
    {
      title: 'Spotter coaching',
      items: [
        { id: 'reference-questions', label: 'Reference questions' },
        { id: 'business-terms',      label: 'Business terms' },
      ],
    },
    {
      title: 'Governance',
      items: [
        { id: 'data-catalog',           label: 'Data catalog' },
        { id: 'usage',                  label: 'Usage' },
        { id: 'liveboard-verification', label: 'Liveboard verification' },
      ],
    },
  ],
  develop: [],
};

/** Nav ids that actually resolve to a page in POC V2. */
const LIVE_WORKSPACE_NAV = new Set(['data-objects', 'connections']);

// ── Shell ─────────────────────────────────────────────────────────────────────

interface ShellProps {
  activeNav: NavSection;
  onNavChange: (nav: NavSection) => void;
  hideSidebar?: boolean;
  hideHeader?: boolean;
  /** Rendered before the header's search field — see GlobalHeader's `leadingSlot`. */
  headerLeadingSlot?: React.ReactNode;
  /** POC V2 — render Data Workspace's nav instead of Data Studio's own. */
  dataWorkspace?: boolean;
  /** The sidebar header's `+` button. Only shown when a handler is passed. */
  onAddClick?: () => void;
  children: React.ReactNode;
}

const Shell: React.FC<ShellProps> = ({ activeNav, onNavChange, hideSidebar = false, hideHeader = false, headerLeadingSlot, dataWorkspace = false, onAddClick, children }) => {
  const headerProps: GlobalHeaderProps = {
    searchPlaceholder: 'Search in ThoughtSpot',
    searchMode: 'trigger',
    userName: PERSONA.userName,
    userAvatar: PERSONA.userAvatar,
    notificationCount: 0,
    leadingSlot: headerLeadingSlot,
    style: hideHeader ? { display: 'none' } : undefined,
  };

  const tabs = dataWorkspace
    ? DATA_WORKSPACE_TABS.map(t =>
        t.id === 'data' && onAddClick ? { ...t, showAddButton: true, onAddClick } : t,
      )
    : SIDEBAR_TABS;

  const sidebarProps: AppSidebarProps = {
    tabs,
    activeTab: 'data',
    onTabChange: () => {},
    categories: dataWorkspace ? DATA_WORKSPACE_CATEGORIES : SIDEBAR_CATEGORIES,
    selectedNav: activeNav,
    // In Data Workspace only the two live items navigate; the rest are the real
    // product's nav and stay inert rather than blanking the page.
    onNavSelect: (id) => {
      if (dataWorkspace && !LIVE_WORKSPACE_NAV.has(id)) return;
      onNavChange(id as NavSection);
    },
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
