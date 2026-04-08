import React, { useState } from 'react';
import { AppShell } from '../../components/AppShell';
import type { AppSidebarProps, SidebarTab, SidebarCategory, ScopeToggle } from '../../components/AppSidebar';
import type { GlobalHeaderProps } from '../../components/GlobalHeader';
import {
  GroupsTable,
  WizardModal,
  GroupDetailsStep,
  OrgSelectStep,
  RoleAssignStep,
  UsersParentStep,
} from './components';
import { pageHeaderStyles, toolbarStyles } from './styles';
import { existingGroups, Group, groupTabs } from './data/mockData';
import { Button } from '../../components/Button';
import { Tabs } from '../../components/Tabs';
import { Icon } from '../../components/icons';
import { systemColors, referenceColors } from '../../tokens/colors';

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
        { id: 'admin-dashboard', label: 'Admin Dashboard' },
      ],
    },
    {
      title: 'Orgs',
      items: [
        { id: 'orgs-list', label: 'Orgs' },
      ],
    },
    {
      title: 'Users',
      items: [
        { id: 'users-list', label: 'Users' },
        { id: 'groups', label: 'Groups' },
      ],
    },
    {
      title: 'Application Settings',
      items: [
        { id: 'search', label: 'Search' },
        { id: 'style', label: 'Style customization' },
        { id: 'onboarding', label: 'Onboarding' },
        { id: 'email', label: 'Email and onboarding' },
        { id: 'spotter-admin', label: 'Spotter' },
      ],
    },
    {
      title: 'Security & Performance',
      items: [
        { id: 'security', label: 'Security' },
        { id: 'link-settings', label: 'Link settings' },
      ],
    },
  ],
};

// Wizard step configuration
const WIZARD_STEPS = [
  { title: 'Enter details', stepTitle: 'Enter details' },
  { title: 'Select orgs', stepTitle: 'Make selection' },
  { title: 'Assign roles', stepTitle: 'Assign roles' },
  { title: 'Add users', stepTitle: 'Add users' },
];

// Initial wizard data state
interface WizardData {
  groupDetails: {
    name: string;
    displayName: string;
    description: string;
  };
  selectedOrgIds: string[];
  roleAssignments: { orgId: string; roleId: string }[];
  parentGroupId: string;
  selectedUserIds: string[];
}

const initialWizardData: WizardData = {
  groupDetails: {
    name: '',
    displayName: '',
    description: '',
  },
  selectedOrgIds: [],
  roleAssignments: [],
  parentGroupId: '',
  selectedUserIds: [],
};

/**
 * AdminGroups Component
 *
 * Main page layout for the Admin Groups management experience.
 * Features a groups table and a multi-step wizard modal for creating groups.
 */
export const AdminGroups: React.FC = () => {
  const [activeTab, setActiveTab] = useState('local');
  const [searchValue, setSearchValue] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>(initialWizardData);
  const [groups, setGroups] = useState<Group[]>(existingGroups);
  const [sidebarTab, setSidebarTab] = useState<SidebarTabId>('admin');
  const [sidebarNav, setSidebarNav] = useState('');

  // Filter groups based on search
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    group.displayName.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Open wizard
  const handleAddGroup = () => {
    setWizardData(initialWizardData);
    setWizardStep(0);
    setIsWizardOpen(true);
  };

  // Close wizard
  const handleCloseWizard = () => {
    setIsWizardOpen(false);
    setWizardStep(0);
    setWizardData(initialWizardData);
  };

  // Go to next step
  const handleNextStep = () => {
    if (wizardStep < WIZARD_STEPS.length - 1) {
      setWizardStep(wizardStep + 1);
    } else {
      // Final step - create group
      handleCreateGroup();
    }
  };

  // Go to previous step
  const handlePrevStep = () => {
    if (wizardStep > 0) {
      setWizardStep(wizardStep - 1);
    }
  };

  // Create the group
  const handleCreateGroup = () => {
    const newGroup: Group = {
      id: `grp-${Date.now()}`,
      name: wizardData.groupDetails.name,
      displayName: wizardData.groupDetails.displayName || wizardData.groupDetails.name,
      description: wizardData.groupDetails.description,
      orgs: wizardData.selectedOrgIds,
      roles: wizardData.roleAssignments,
      users: wizardData.selectedUserIds,
      parentGroupId: wizardData.parentGroupId || undefined,
      createdAt: new Date(),
      createdBy: { id: 'usr-current', name: 'Current User', email: 'current@example.com' },
      memberCount: wizardData.selectedUserIds.length,
    };

    setGroups([newGroup, ...groups]);
    handleCloseWizard();
  };

  // Check if next button should be disabled
  const isNextDisabled = () => {
    if (wizardStep === 0) {
      return !wizardData.groupDetails.name.trim();
    }
    return false;
  };

  // Get next button label
  const getNextLabel = () => {
    if (wizardStep === WIZARD_STEPS.length - 1) {
      return 'Create group';
    }
    return 'Next';
  };

  // Render current wizard step
  const renderWizardStep = () => {
    switch (wizardStep) {
      case 0:
        return (
          <GroupDetailsStep
            data={wizardData.groupDetails}
            onChange={(data) => setWizardData({ ...wizardData, groupDetails: data })}
          />
        );
      case 1:
        return (
          <OrgSelectStep
            selectedOrgIds={wizardData.selectedOrgIds}
            onSelectionChange={(ids) => setWizardData({ ...wizardData, selectedOrgIds: ids })}
          />
        );
      case 2:
        return (
          <RoleAssignStep
            selectedOrgIds={wizardData.selectedOrgIds}
            roleAssignments={wizardData.roleAssignments}
            onRoleAssignmentsChange={(assignments) =>
              setWizardData({ ...wizardData, roleAssignments: assignments })
            }
          />
        );
      case 3:
        return (
          <UsersParentStep
            parentGroupId={wizardData.parentGroupId}
            selectedUserIds={wizardData.selectedUserIds}
            onParentGroupChange={(id) => setWizardData({ ...wizardData, parentGroupId: id })}
            onSelectedUsersChange={(ids) => setWizardData({ ...wizardData, selectedUserIds: ids })}
          />
        );
      default:
        return null;
    }
  };

  const scopeToggle: ScopeToggle = {
    options: [
      { id: 'all-orgs', label: 'All Orgs' },
      { id: 'primary-org', label: 'Primary Org' },
    ],
    activeId: 'all-orgs',
    onChange: () => {},
  };

  const headerProps: GlobalHeaderProps = {
    searchPlaceholder: 'Search',
    userName: 'Admin User',
    notificationCount: 1,
    showHamburger: true,
  };

  const sidebarProps: AppSidebarProps = {
    tabs: SIDEBAR_TABS,
    activeTab: sidebarTab,
    onTabChange: (tabId) => { setSidebarTab(tabId as SidebarTabId); setSidebarNav(''); },
    categories: SIDEBAR_CATEGORIES,
    selectedNav: sidebarNav,
    onNavSelect: setSidebarNav,
    ...(sidebarTab === 'admin' ? { scopeToggle } : {}),
  };

  return (
    <AppShell headerProps={headerProps} sidebarProps={sidebarProps} contentBackground="#FFFFFF" style={{ height: '100vh' }}>
      <div style={{ padding: '24px 32px' }}>
        {/* Page Header */}
        <div style={pageHeaderStyles.container}>
          {/* Breadcrumb */}
          <div style={pageHeaderStyles.breadcrumb}>
            <span>Admin</span>
            <Icon name="chevron-right" size="xs" />
            <span>Users</span>
            <Icon name="chevron-right" size="xs" />
            <span style={{ color: systemColors.light['content-primary'] }}>Groups</span>
          </div>

          {/* Title */}
          <h1 style={pageHeaderStyles.title}>Groups</h1>

          {/* Tabs */}
          <div style={pageHeaderStyles.tabs}>
            <Tabs
              tabs={groupTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>

        {/* Toolbar */}
        <div style={toolbarStyles.container}>
          {/* Search */}
          <div style={toolbarStyles.searchWrapper}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: systemColors.light['content-tertiary'],
                display: 'flex',
              }}>
                <Icon name="magnifying-glass" size="s" color="currentColor" />
              </span>
              <input
                type="text"
                placeholder="Search groups"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  border: `1px solid ${referenceColors.gray['30']}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              />
            </div>
          </div>

          {/* Add button */}
          <Button variant="primary" onClick={handleAddGroup}>
            Add group
          </Button>
        </div>

        {/* Groups Table */}
        <GroupsTable
          groups={filteredGroups}
          onGroupClick={(group) => console.log('Group clicked:', group)}
        />
      </div>

      {/* Wizard Modal */}
      <WizardModal
        isOpen={isWizardOpen}
        onClose={handleCloseWizard}
        contextLabel="Add new group"
        currentStep={wizardStep}
        totalSteps={WIZARD_STEPS.length}
        stepTitle={WIZARD_STEPS[wizardStep]?.stepTitle || ''}
        onBack={handlePrevStep}
        onNext={handleNextStep}
        nextLabel={getNextLabel()}
        isNextDisabled={isNextDisabled()}
        showBack={wizardStep > 0}
      >
        {renderWizardStep()}
      </WizardModal>
    </AppShell>
  );
};

export default AdminGroups;
