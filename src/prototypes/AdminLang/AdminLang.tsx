import React, { useState } from 'react';
import { AppShell } from '../../components/AppShell';
import type { AppSidebarProps, SidebarTab, SidebarCategory, ScopeToggle } from '../../components/AppSidebar';
import type { GlobalHeaderProps } from '../../components/GlobalHeader';
import { Button } from '../../components/Button';
import { CsvTranslationSection } from './components';
import { contentStyles, sectionStyles as s, moduleTableStyles as mt } from './styles';
import { homepageModules } from './data/mockData';
import { systemColors } from '../../tokens/colors';

type SidebarTabId = 'insights' | 'data' | 'develop' | 'admin';

const SIDEBAR_TABS: SidebarTab[] = [
  { id: 'insights', label: 'Insights', headerTitle: 'Insights' },
  { id: 'data', label: 'Data', headerTitle: 'Data Workspace' },
  { id: 'develop', label: 'Develop', headerTitle: 'Develop' },
  { id: 'admin', label: 'Admin', headerTitle: 'Admin Settings' },
];

const SIDEBAR_CATEGORIES: Record<SidebarTabId, SidebarCategory[]> = {
  insights: [
    {
      title: 'Navigation',
      items: [
        { id: 'home', label: 'Home' },
        { id: 'liveboards', label: 'Liveboards' },
        { id: 'answers', label: 'Answers' },
        { id: 'spotter', label: 'Spotter' },
      ],
    },
  ],
  data: [
    {
      title: 'Data Workspace',
      items: [
        { id: 'data-objects', label: 'Data objects' },
        { id: 'connections', label: 'Connections' },
        { id: 'utilities', label: 'Utilities' },
      ],
    },
  ],
  develop: [
    {
      title: 'Developer',
      items: [
        { id: 'playground', label: 'Playground' },
        { id: 'custom-actions', label: 'Custom actions' },
      ],
    },
  ],
  admin: [
    {
      title: '',
      items: [
        { id: 'performance-tracking', label: 'Performance tracking' },
        { id: 'ai-bi-stats', label: 'AI and BI Stats' },
      ],
    },
    {
      title: 'Application Settings',
      items: [
        { id: 'thoughtspot-ai', label: 'ThoughtSpot AI' },
        { id: 'search-spotiq', label: 'Search & SpotIQ' },
        { id: 'help-customization', label: 'Help customization' },
        { id: 'email-customizations', label: 'Email customizations' },
        { id: 'style-customization', label: 'Style customization' },
        { id: 'chart-customization', label: 'Chart customization' },
        { id: 'csv-upload', label: 'CSV upload' },
        { id: 'early-access', label: 'Early access features' },
        { id: 'version-control', label: 'Version Control' },
        { id: 'data-modeling', label: 'Data modeling' },
        { id: 'downloads-schedules', label: 'Downloads & Schedules' },
        { id: 'home-page-experience', label: 'Home Page & App Experience' },
        { id: 'administration', label: 'Administration' },
        { id: 'variables', label: 'Variables' },
      ],
    },
    {
      title: 'Billing',
      items: [
        { id: 'billable-query-stats', label: 'Billable query stats' },
      ],
    },
  ],
};

/**
 * AdminLang Prototype
 *
 * Admin settings page for "Home Page & App Experience" with:
 * - Homepage module ordering
 * - Auto-translate Liveboards and Answers (read-only reference)
 * - Translate Liveboards and Answers based on CSV file (new feature)
 * - Liveboard Visualisation Data Cache
 */
export const AdminLang: React.FC = () => {
  const [sidebarTab, setSidebarTab] = useState<SidebarTabId>('admin');
  const [sidebarNav, setSidebarNav] = useState('home-page-experience');
  const [scope, setScope] = useState<'all-orgs' | 'org'>('all-orgs');
  const [clusterCsvEnabled, setClusterCsvEnabled] = useState(true);

  // Auto-translate state (static reference section)
  const [autoTranslateEnabled] = useState(true);

  // Liveboard cache state (static reference section)
  const [cacheEnabled] = useState(true);

  const scopeToggle: ScopeToggle = {
    options: [
      { id: 'all-orgs', label: 'All Orgs' },
      { id: 'primary-org', label: 'Primary Org' },
    ],
    activeId: scope,
    onChange: (id) => setScope(id as 'all-orgs' | 'org'),
  };

  const headerProps: GlobalHeaderProps = {
    searchPlaceholder: 'Search your library',
    userName: 'Primary',
    notificationCount: 1,
    showHamburger: true,
  };

  const sidebarProps: AppSidebarProps = {
    tabs: SIDEBAR_TABS,
    activeTab: sidebarTab,
    onTabChange: (tabId) => {
      setSidebarTab(tabId as SidebarTabId);
      setSidebarNav('');
    },
    categories: SIDEBAR_CATEGORIES,
    selectedNav: sidebarNav,
    onNavSelect: setSidebarNav,
    ...(sidebarTab === 'admin' ? { scopeToggle } : {}),
  };

  return (
    <AppShell
      headerProps={headerProps}
      sidebarProps={sidebarProps}
      contentBackground="#FFFFFF"
      style={{ height: '100vh' }}
    >
      <div style={contentStyles.page}>
        {/* Homepage module ordering */}
        <div style={mt.container}>
          {homepageModules.map((mod) => (
            <div key={mod.name} style={mt.row}>
              <span style={mt.order}>{mod.order}.</span>
              <span style={mt.name}>{mod.name}</span>
              <span style={mt.status}>{mod.status}</span>
            </div>
          ))}
        </div>

        {/* Auto-translate Liveboards and Answers — existing section (read-only reference) */}
        <div style={s.container}>
          <div style={s.header}>
            <div style={{ flex: 1 }}>
              <h3 style={s.title}>Auto-translate Liveboards and Answers</h3>
              <p style={s.description}>
                Automatically translate meta-data of Liveboards and Answers such as titles,
                descriptions, tab names etc. into each user&apos;s preferred language{' '}
                <a href="#" style={s.learnMore}>
                  Learn more
                </a>
              </p>
            </div>
            <Button variant="secondary">Edit</Button>
          </div>
          <div style={s.statusRow}>
            <span style={s.statusLabel}>Status</span>
            <span style={s.statusValue}>
              {autoTranslateEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* CSV Translation Section — NEW */}
        <CsvTranslationSection
          clusterEnabled={scope === 'all-orgs' ? clusterCsvEnabled : clusterCsvEnabled}
          scope={scope === 'all-orgs' ? 'all-orgs' : 'org'}
        />

        {/* Liveboard Visualisation Data Cache — existing section (read-only reference) */}
        <div style={s.container}>
          <div style={s.header}>
            <div style={{ flex: 1 }}>
              <h3 style={s.title}>Liveboard Visualisation Data Cache</h3>
              <p style={s.description}>
                Configure caching for Liveboard visualisation data to improve performance.
              </p>
            </div>
            <Button variant="secondary">Edit</Button>
          </div>
          <div style={s.statusRow}>
            <span style={s.statusLabel}>Status</span>
            <span style={s.statusValue}>
              {cacheEnabled ? 'Enabled for all Liveboards' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Dev controls — cluster toggle for demo purposes */}
        {scope === 'all-orgs' && (
          <div
            style={{
              marginTop: '48px',
              padding: '16px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              border: '1px dashed #D1D5DB',
            }}
          >
            <p style={{ fontSize: '12px', fontWeight: 'var(--font-weight-emphasis)', color: systemColors.light['content-tertiary'], textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
              Prototype controls
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: systemColors.light['content-secondary'], cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={clusterCsvEnabled}
                onChange={(e) => setClusterCsvEnabled(e.target.checked)}
              />
              CSV translation enabled at cluster level (affects org-level view)
            </label>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default AdminLang;
