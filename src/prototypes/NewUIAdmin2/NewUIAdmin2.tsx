import React, { useState, useRef, useEffect } from 'react';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { AppShell } from '../../components/AppShell';
import type { AppSidebarProps, SidebarTab, SidebarCategory, ScopeToggle } from '../../components/AppSidebar';
import type { GlobalHeaderProps } from '../../components/GlobalHeader';
import { systemColors, referenceColors } from '../../tokens/colors';
import { CustomisationPageContent } from './CustomisationPageContent';
import { AISettingsPageContent } from './AISettingsPageContent';
import { SearchSpotIQPageContent } from './SearchSpotIQPageContent';
import { UserManagementPageContent } from './UserManagementPageContent';
import { FeatureManagementPageContent } from './FeatureManagementPageContent';
import { VariablesPageContent } from './VariablesPageContent';
import { VersionControlPageContent } from './VersionControlPageContent';
import { OnboardingPageContent } from './OnboardingPageContent';
import { OrgManagementPageContent } from './OrgManagementPageContent';
import { UsageAdoptionPageContent } from './UsageAdoptionPageContent';
import { PerformanceTrackingPageContent } from './PerformanceTrackingPageContent';
import { AIBIStatsPageContent } from './AIBIStatsPageContent';
import { BillingQueryStatsPageContent } from './BillingQueryStatsPageContent';
import { TermsPageContent } from './TermsPageContent';
import { ScheduledMaintenancePageContent } from './ScheduledMaintenancePageContent';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const brand = systemColors.light['content-brand'];

type SidebarTabId = 'insights' | 'data' | 'develop' | 'admin';

const SIDEBAR_TABS: SidebarTab[] = [
  { id: 'insights', label: 'Insights', headerTitle: 'Insights' },
  { id: 'data', label: 'Data', headerTitle: 'Data Workspace' },
  { id: 'develop', label: 'Develop', headerTitle: 'Develop' },
  { id: 'admin', label: 'Admin', headerTitle: 'Admin' },
];

const SIDEBAR_CATEGORIES: Record<SidebarTabId, SidebarCategory[]> = {
  insights: [{ title: '', items: [{ id: 'home', label: 'Home' }] }],
  data: [{ title: '', items: [{ id: 'data-objects', label: 'Data objects' }] }],
  develop: [{ title: '', items: [{ id: 'playground', label: 'Playground' }] }],
  admin: [
    {
      title: '',
      items: [
        { id: 'home', label: 'Home' },
        { id: 'org-management', label: 'Org management' },
        { id: 'user-management', label: 'User management' },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'feature-management', label: 'Feature management' },
        { id: 'variables', label: 'Variables' },
        { id: 'version-control', label: 'Version control' },
      ],
    },
    {
      title: 'CONFIGURATION',
      items: [
        { id: 'application-settings', label: 'Application settings' },
        { id: 'customisation', label: 'Customisation' },
        { id: 'ai-settings', label: 'AI settings' },
        { id: 'search-spot-iq', label: 'Search & Spot IQ' },
      ],
    },
    {
      title: 'MONITOR',
      items: [
        { id: 'user-adoption', label: 'User & adoption' },
        { id: 'performance-tracking', label: 'Performance tracking' },
        { id: 'ai-bi-stats', label: 'AI & BI stats' },
        { id: 'billing-query-stats', label: 'Billing query stats' },
      ],
    },
  ],
};

const SIDEBAR_CATEGORIES_PRIMARY: Record<SidebarTabId, SidebarCategory[]> = {
  insights: [{ title: '', items: [{ id: 'home', label: 'Home' }] }],
  data: [{ title: '', items: [{ id: 'data-objects', label: 'Data objects' }] }],
  develop: [{ title: '', items: [{ id: 'playground', label: 'Playground' }] }],
  admin: [
    {
      title: '',
      items: [
        { id: 'home', label: 'Home' },
        { id: 'user-management', label: 'User management' },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'feature-management', label: 'Feature management' },
        { id: 'version-control', label: 'Version control' },
      ],
    },
    {
      title: 'CONFIGURATION',
      items: [
        { id: 'customisation', label: 'Customisation' },
        { id: 'onboarding', label: 'Onboarding' },
      ],
    },
    {
      title: 'MONITOR',
      items: [
        { id: 'user-adoption', label: 'Usage & adoption' },
        { id: 'performance-tracking', label: 'Performance tracking' },
        { id: 'ai-bi-stats', label: 'AI & BI stats' },
        { id: 'billing-query-stats', label: 'Billing query stats' },
        { id: 'scheduled-maintenance', label: 'Scheduled maintenance' },
        { id: 'terms', label: 'Terms' },
      ],
    },
  ],
};

// ─── Toggle ──────────────────────────────────────────────────────────────────

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    role="switch"
    aria-checked={checked}
    style={{
      position: 'relative',
      width: '36px',
      height: '20px',
      borderRadius: '10px',
      border: 'none',
      backgroundColor: checked ? brand : referenceColors.gray['30'],
      cursor: 'pointer',
      padding: 0,
      flexShrink: 0,
      transition: 'background-color 0.2s ease',
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: '2px',
        left: checked ? '18px' : '2px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: '#fff',
        transition: 'left 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
      }}
    />
  </button>
);

// ─── Custom Dropdown ──────────────────────────────────────────────────────────

const Dropdown: React.FC<{ value: string; options: string[]; width?: number }> = ({
  value: initialValue,
  options,
  width = 280,
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(initialValue);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width });
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen(!open);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width, flexShrink: 0 }}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '36px',
          padding: '0 12px',
          border: `1px solid ${open ? brand : '#D1D5DB'}`,
          borderRadius: '6px',
          backgroundColor: '#FFFFFF',
          cursor: 'pointer',
          fontFamily: font,
          fontSize: '13px',
          color: '#111827',
          outline: 'none',
          textAlign: 'left',
          boxShadow: open ? `0 0 0 2px ${brand}22` : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{selected}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            flexShrink: 0,
            marginLeft: '8px',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        >
          <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            width: menuPos.width,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { setSelected(opt); setOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                textAlign: 'left',
                fontFamily: font,
                fontSize: '13px',
                fontWeight: opt === selected ? 500 : 400,
                color: opt === selected ? brand : '#111827',
                backgroundColor: opt === selected ? `${brand}10` : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.1s',
              }}
              onMouseEnter={(e) => {
                if (opt !== selected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB';
              }}
              onMouseLeave={(e) => {
                if (opt !== selected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Setting Row (white sub-card inside gray card) ────────────────────────────

const SettingRow: React.FC<{
  label: string;
  description?: string;
  control: React.ReactNode;
}> = ({ label, description, control }) => (
  <div
    style={{
      display: 'flex',
      alignItems: description ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      gap: '32px',
      padding: '20px 24px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E9EAEC',
      borderRadius: '8px',
    }}
  >
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font, lineHeight: 1.4 }}>
        {label}
      </div>
      {description && (
        <div style={{ fontSize: '12.5px', color: '#9CA3AF', fontFamily: font, marginTop: '4px', lineHeight: 1.6 }}>
          {description}
        </div>
      )}
    </div>
    <div style={{ flexShrink: 0, paddingTop: description ? '2px' : '0' }}>
      {control}
    </div>
  </div>
);

// ─── Card (collapsible gray outer container) ──────────────────────────────────

const Card: React.FC<{
  title: string;
  description?: string;
  open?: boolean;
  onToggle?: () => void;
  onReset?: () => void;
  children: React.ReactNode;
}> = ({ title, description, open, onToggle, onReset, children }) => {
  const collapsible = onToggle !== undefined && React.Children.count(children) > 1;

  return (
    <div
      style={{
        backgroundColor: '#F3F4F6',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      {collapsible ? (
        <div style={{
          display: 'flex', alignItems: 'center',
          borderBottom: open ? '1px solid #E5E7EB' : 'none',
          padding: '16px 24px',
        }}>
          <button
            onClick={onToggle}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', flex: 1,
              border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: font, textAlign: 'left', padding: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{ flexShrink: 0, transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.22s ease' }}
            >
              <path d="M3 5.5l4 4 4-4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>
              {title}
            </span>
          </button>
          {onReset && (
            <button onClick={onReset} style={{
              border: 'none', background: 'none', cursor: 'pointer', padding: 0,
              fontFamily: font, fontSize: '13px', fontWeight: 500, color: brand, flexShrink: 0,
            }}>
              Reset to default
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>
            {title}
          </div>
          {description && (
            <div style={{ fontSize: '12.5px', color: '#9CA3AF', fontFamily: font, marginTop: '4px', lineHeight: 1.5 }}>
              {description}
            </div>
          )}
        </div>
      )}

      {/* Body — always visible when not collapsible, otherwise animated */}
      <div
        style={{
          maxHeight: collapsible ? (open ? '2000px' : '0px') : undefined,
          overflow: collapsible ? 'hidden' : undefined,
          transition: collapsible ? 'max-height 0.25s ease' : undefined,
        }}
      >
        <div style={{ padding: '16px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const NewUIAdmin2: React.FC = () => {
  const [sidebarTab, setSidebarTab] = useState<SidebarTabId>('admin');
  const [sidebarNav, setSidebarNav] = useState('application-settings');
  const [activeTab, setActiveTab] = useState('general');

  const [hideOrgName, setHideOrgName] = useState(true);
  const [orgUrlSharing, setOrgUrlSharing] = useState(true);
  const [inAppSupport, setInAppSupport] = useState(true);

  const [includeCoverPages, setIncludeCoverPages] = useState(false);
  const [hideMetadataHeader, setHideMetadataHeader] = useState(false);
  const [downloadedFileInstructions, setDownloadedFileInstructions] = useState('Test');
  const [a4PdfResolution, setA4PdfResolution] = useState('');
  const [showButtonInEmails, setShowButtonInEmails] = useState(true);
  const [whitelistedDomains, setWhitelistedDomains] = useState('');

  // Data modelling toggles
  const [newTmlUtility, setNewTmlUtility] = useState(false);
  const [nonEquiJoins, setNonEquiJoins] = useState(false);
  const [dataModelsOpen, setDataModelsOpen] = useState(true);

  // CSV upload toggles
  const [snowflake, setSnowflake] = useState(false);
  const [databricks, setDatabricks] = useState(false);
  const [googleBigQuery, setGoogleBigQuery] = useState(false);

  const [clusterOpen, setClusterOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(true);
  const [downloadsOpen, setDownloadsOpen] = useState(true);

  const [scope, setScope] = useState<'all-orgs' | 'primary-org'>('all-orgs');

  const scopeToggle: ScopeToggle = {
    options: [
      { id: 'all-orgs', label: 'All Orgs' },
      { id: 'primary-org', label: 'Primary Org' },
    ],
    activeId: scope,
    onChange: (id: string) => {
      setScope(id as 'all-orgs' | 'primary-org');
      // Reset nav when switching scope — avoid landing on a page that doesn't exist in the new scope
      const primaryIds = SIDEBAR_CATEGORIES_PRIMARY.admin.flatMap((c) => c.items.map((i) => i.id));
      const allIds = SIDEBAR_CATEGORIES.admin.flatMap((c) => c.items.map((i) => i.id));
      const validIds = id === 'primary-org' ? primaryIds : allIds;
      if (!validIds.includes(sidebarNav)) {
        setSidebarNav('home');
      }
    },
  };

  const headerProps: GlobalHeaderProps = {
    searchPlaceholder: 'Search in your library',
    userName: 'Primary',
    notificationCount: 1,
    showHamburger: false,
  };

  const sidebarProps: AppSidebarProps = {
    tabs: SIDEBAR_TABS,
    activeTab: sidebarTab,
    onTabChange: (tabId) => { setSidebarTab(tabId as SidebarTabId); setSidebarNav(''); },
    categories: scope === 'primary-org' ? SIDEBAR_CATEGORIES_PRIMARY : SIDEBAR_CATEGORIES,
    selectedNav: sidebarNav,
    onNavSelect: setSidebarNav,
    ...(sidebarTab === 'admin' ? { scopeToggle } : {}),
  };

  const pageTabs = [
    { id: 'general', label: 'General settings' },
    { id: 'data-modelling', label: 'Data modelling' },
    { id: 'csv-upload', label: 'CSV upload' },
  ];

  return (
    <AppShell
      headerProps={headerProps}
      sidebarProps={sidebarProps}
      contentBackground="#FFFFFF"
      style={{ height: '100vh' }}
    >
      {/* Route to Customisation page when that nav item is selected */}
      {sidebarNav === 'home' ? (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '32px',
            border: `1.5px dashed ${brand}66`, borderRadius: '12px',
            padding: '36px 40px', maxWidth: '680px', width: '100%',
          }}>
            <div style={{ flexShrink: 0, width: '96px', height: '96px' }}>
              <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
                <rect x="20" y="56" width="56" height="22" rx="4" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="1.5" />
                <rect x="28" y="30" width="40" height="26" rx="4" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="1.5" />
                <rect x="36" y="14" width="24" height="18" rx="4" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="1.5" />
                <rect x="32" y="34" width="12" height="8" rx="2" fill="#D1D5DB" />
                <rect x="48" y="34" width="12" height="3" rx="1.5" fill="#D1D5DB" />
                <rect x="48" y="40" width="8" height="3" rx="1.5" fill="#D1D5DB" />
                <rect x="28" y="61" width="16" height="8" rx="2" fill="#D1D5DB" />
                <rect x="50" y="61" width="18" height="3" rx="1.5" fill="#D1D5DB" />
                <rect x="50" y="67" width="12" height="3" rx="1.5" fill="#D1D5DB" />
                <path d="M48 30v-4M44 26l4-4 4 4" stroke={brand} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#374151', fontFamily: font, lineHeight: 1.4, marginBottom: '10px' }}>
                Admin home <span style={{ color: brand }}>coming soon</span>
              </div>
              <div style={{ fontSize: '14px', color: '#9CA3AF', fontFamily: font, lineHeight: 1.7 }}>
                The admin home dashboard is being built. Check back for an at-a-glance overview of your system health, key metrics, and recent activity.
              </div>
            </div>
          </div>
        </div>
      ) :
       sidebarNav === 'user-adoption' ? <UsageAdoptionPageContent /> :
       sidebarNav === 'performance-tracking' ? <PerformanceTrackingPageContent /> :
       sidebarNav === 'ai-bi-stats' ? <AIBIStatsPageContent /> :
       sidebarNav === 'billing-query-stats' ? <BillingQueryStatsPageContent /> :
       sidebarNav === 'org-management' ? <OrgManagementPageContent /> :
       sidebarNav === 'customisation' ? <CustomisationPageContent scope={scope} /> :
       sidebarNav === 'ai-settings' ? <AISettingsPageContent /> :
       sidebarNav === 'search-spot-iq' ? <SearchSpotIQPageContent /> :
       sidebarNav === 'user-management' ? <UserManagementPageContent scope={scope} /> :
       sidebarNav === 'feature-management' ? <FeatureManagementPageContent scope={scope} /> :
       sidebarNav === 'variables' ? <VariablesPageContent /> :
       sidebarNav === 'version-control' ? <VersionControlPageContent scope={scope} /> :
       sidebarNav === 'onboarding' ? <OnboardingPageContent /> :
       sidebarNav === 'terms' ? <TermsPageContent /> :
       sidebarNav === 'scheduled-maintenance' ? <ScheduledMaintenancePageContent /> : (

      <div style={{ height: '100%', overflowY: 'auto', backgroundColor: '#FFFFFF' }}>

        {/* ── Page header: full-width, title left + tabs inline ── */}
        <div
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center',
            height: '92px', padding: '0 40px',
            borderBottom: '1px solid #E5E7EB', boxSizing: 'border-box',
          }}
        >
          <h1
            style={{
              margin: 0, fontSize: '22px', fontWeight: 700,
              color: '#0F172A', fontFamily: font, letterSpacing: '-0.3px',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            Application settings
          </h1>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#D1D5DB', margin: '0 24px', flexShrink: 0 }} />

          <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, alignSelf: 'stretch' }}>
            {pageTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '0 14px',
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: font, fontSize: '13.5px',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? brand : '#6B7280',
                  borderBottom: activeTab === tab.id ? `2px solid ${brand}` : '2px solid transparent',
                  marginBottom: '-1px', transition: 'color 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Centered content column */}
        <div
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            padding: '32px 40px 64px',
            boxSizing: 'border-box',
          }}
        >

          {/* ── General settings tab ────────────────────────────── */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Cluster settings */}
              <Card title="Cluster settings" open={clusterOpen} onToggle={() => setClusterOpen(!clusterOpen)}>
                <SettingRow
                  label="Time zone"
                  control={
                    <Dropdown
                      value="Asia/Calcutta"
                      options={['Asia/Calcutta', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo']}
                      width={311}
                    />
                  }
                />
                <SettingRow
                  label="Date & Time format"
                  control={
                    <Dropdown
                      value="DD/MM/YYYY"
                      options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'MMM DD, YYYY']}
                      width={311}
                    />
                  }
                />
                <SettingRow
                  label="Cluster version (v26.7)"
                  description="This cluster is running an outdated version. Please update to the latest release to ensure full compatibility."
                  control={
                    <a
                      href="#"
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: brand,
                        fontFamily: font,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Request Update
                    </a>
                  }
                />
              </Card>

              {/* Administration */}
              <Card title="Administration" open={adminOpen} onToggle={() => setAdminOpen(!adminOpen)}>
                <SettingRow
                  label="Hide org name"
                  description="Manage visibility of Org name in the top-nav bar for user belonging to single org."
                  control={<Toggle checked={hideOrgName} onChange={() => setHideOrgName(!hideOrgName)} />}
                />
                <SettingRow
                  label="Org URL sharing"
                  description="When enabled, Liveboards from different orgs can be viewed in the same window without needing to switch between orgs."
                  control={<Toggle checked={orgUrlSharing} onChange={() => setOrgUrlSharing(!orgUrlSharing)} />}
                />
                <SettingRow
                  label="In-app support"
                  description="To enhance your support experience, ThoughtSpot now offers in-app support for all Cloud customers. This feature provides immediate assistance for product-related inquiries and 'how-to' questions directly within the ThoughtSpot application."
                  control={<Toggle checked={inAppSupport} onChange={() => setInAppSupport(!inAppSupport)} />}
                />
              </Card>

              {/* Downloads & Schedules */}
              <Card title="Downloads & Schedules" open={downloadsOpen} onToggle={() => setDownloadsOpen(!downloadsOpen)} onReset={() => {}}>
                <SettingRow
                  label="Include cover and filter pages in the Liveboard PDF by default"
                  description="Information in tooltip comes here"
                  control={<Toggle checked={includeCoverPages} onChange={() => setIncludeCoverPages(!includeCoverPages)} />}
                />
                <SettingRow
                  label="Hide Metadata header in CSV exports"
                  control={<Toggle checked={hideMetadataHeader} onChange={() => setHideMetadataHeader(!hideMetadataHeader)} />}
                />
                <SettingRow
                  label="Downloaded file instructions"
                  description="Information in tooltip comes here"
                  control={
                    <AutoResizeTextarea
                      value={downloadedFileInstructions}
                      onChange={setDownloadedFileInstructions}
                      placeholder="Text"
                    />
                  }
                />
                <SettingRow
                  label="A4 PDF Resolution"
                  control={
                    <input
                      value={a4PdfResolution}
                      onChange={(e) => setA4PdfResolution(e.target.value)}
                      placeholder="Text"
                      style={{
                        width: '311px', height: '36px', padding: '0 12px',
                        border: '1px solid #D1D5DB', borderRadius: '6px',
                        fontFamily: font, fontSize: '13px', color: '#111827',
                        outline: 'none', boxSizing: 'border-box' as const,
                      }}
                    />
                  }
                />
                <SettingRow
                  label="Show button in Emails"
                  control={<Toggle checked={showButtonInEmails} onChange={() => setShowButtonInEmails(!showButtonInEmails)} />}
                />
                <SettingRow
                  label="Whitelisted Domains"
                  control={
                    <input
                      value={whitelistedDomains}
                      onChange={(e) => setWhitelistedDomains(e.target.value)}
                      placeholder="Text"
                      style={{
                        width: '311px', height: '36px', padding: '0 12px',
                        border: '1px solid #D1D5DB', borderRadius: '6px',
                        fontFamily: font, fontSize: '13px', color: '#111827',
                        outline: 'none', boxSizing: 'border-box' as const,
                      }}
                    />
                  }
                />
              </Card>

            </div>
          )}

          {activeTab === 'data-modelling' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Card title="Data models" open={dataModelsOpen} onToggle={() => setDataModelsOpen(!dataModelsOpen)}>
                <SettingRow
                  label="New TML Utility UI"
                  description="Enable the new TML Utility UI with asynchronous TML imports."
                  control={<Toggle checked={newTmlUtility} onChange={() => setNewTmlUtility(!newTmlUtility)} />}
                />
                <SettingRow
                  label="Non Equi Joins"
                  description="Enable creation of non equi joins in the model UI."
                  control={<Toggle checked={nonEquiJoins} onChange={() => setNonEquiJoins(!nonEquiJoins)} />}
                />
              </Card>
            </div>
          )}

          {activeTab === 'csv-upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Card
                title="CSV upload"
                description="Configure the data upload using CSV files"
              >
                <SettingRow
                  label="Snowflake"
                  control={<Toggle checked={snowflake} onChange={() => setSnowflake(!snowflake)} />}
                />
                <SettingRow
                  label="Databricks"
                  control={<Toggle checked={databricks} onChange={() => setDatabricks(!databricks)} />}
                />
                <SettingRow
                  label="Google BigQuery"
                  control={<Toggle checked={googleBigQuery} onChange={() => setGoogleBigQuery(!googleBigQuery)} />}
                />
              </Card>
            </div>
          )}

        </div>
      </div>

      )}

      {/* Dropdown animation keyframe */}
      <style>{`
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AppShell>
  );
};

export default NewUIAdmin2;
