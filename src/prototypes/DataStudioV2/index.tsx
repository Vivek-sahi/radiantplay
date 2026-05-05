import React, { useState } from 'react';
import Shell, { NavSection } from './components/Shell';
import Overview from './components/Overview';
import ModelView from './components/ModelView';
import Workspace from './components/Workspace';
import NewProjectPrompt from './components/NewProjectPrompt';
import { OverviewProject, OverviewAlert } from './data/mockData';

export interface ProjectContext {
  purpose: string;
  persona: string;
  sampleQuestions: string;
  businessLogic: string;
  spotterInstructions: string;
}

export const emptyContext: ProjectContext = {
  purpose: '',
  persona: '',
  sampleQuestions: '',
  businessLogic: '',
  spotterInstructions: '',
};

export interface PrepTransform {
  id: string;
  columnId: string;
  tableId: string;
  issueType: 'null' | 'duplicate' | 'anomaly' | 'date_format';
  label: string;
  sql: string;
}

export interface ProjectState {
  id: string;
  name: string;
  buildStep: 'empty' | 'tables' | 'joined' | 'transformed' | 'healthy';
  activeTab: 'columns' | 'tables' | 'preview' | 'notebook';
  testMode: boolean;
  publishedVersion: number;       // 0 = never published; 1, 2, … = version number
  hasUnpublishedChanges: boolean; // true when working copy diverges from published
  projectSource: 'warehouse' | 'dbt'; // entry path — affects column view indicators
  context: ProjectContext;
  addedTables: string[];
  columnsSelected: boolean;
  includedColumns: Record<string, string[]>; // tableId → [colName, ...]
  columnOverrides: Record<string, { description?: string | null; aiContext?: string | null; synonyms?: string[]; syncStatus?: 'ok' | 'broken' | 'degraded' }>;
  prepTransforms?: PrepTransform[];
}

type AppView = 'overview' | 'new-project' | 'model-view' | 'workspace';

const DataStudio: React.FC = () => {
  React.useEffect(() => {
    const prev = document.title;
    document.title = 'Data Studio';
    return () => { document.title = prev; };
  }, []);

  const [view, setView]           = useState<AppView>('overview');
  const [prevView, setPrevView]   = useState<AppView>('overview');
  const [activeNav, setActiveNav] = useState<NavSection>('overview');
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<OverviewProject | null>(null);
  const [activeAlert, setActiveAlert]         = useState<OverviewAlert | null>(null);
  const [project, setProject] = useState<ProjectState>({
    id: 'proj-001',
    name: 'Untitled Project',
    buildStep: 'empty',
    activeTab: 'columns',
    testMode: false,
    publishedVersion: 0,
    hasUnpublishedChanges: true,
    projectSource: 'warehouse',
    context: emptyContext,
    addedTables: [],
    columnsSelected: false,
    includedColumns: {},
    columnOverrides: {},
  });

  // Helper: navigate to a view while tracking history
  const navigateTo = (next: AppView) => {
    setPrevView(view);
    setView(next);
  };

  // Open model view — landing screen before workspace
  const openModelView = (proj: OverviewProject) => {
    setSelectedProject(proj);
    setActiveAlert(proj.issues?.[0] ?? null);
    navigateTo('model-view');
  };

  // Enter workspace from model view (Edit model button)
  const enterWorkspaceFromModelView = () => {
    if (!selectedProject) return;
    openProject(selectedProject.name, selectedProject.status === 'published');
  };

  // Open an existing project — seeds a realistic "already built" state for demo
  const openProject = (nameOrId?: string, published = false) => {
    setInitialPrompt('');
    setProject({
      id: `proj-${Date.now()}`,
      name: nameOrId ?? 'Untitled Project',
      buildStep: 'healthy',
      activeTab: 'columns',
      testMode: false,
      publishedVersion: published ? 1 : 0,
      hasUnpublishedChanges: !published,
      projectSource: 'warehouse',
      context: emptyContext,
      addedTables: ['orders', 'campaigns', 'users'],
      columnsSelected: true,
      includedColumns: {
        orders:    ['order_date', 'amount', 'region'],
        campaigns: ['campaign_id', 'campaign_name', 'channel', 'spend', 'budget', 'impressions', 'target_region'],
        users:     ['user_id', 'segment', 'lifetime_value', 'signup_date'],
      },
      columnOverrides: {},
    });
    navigateTo('workspace');
  };

  // Mark current project as dbt — called when user clicks the dbt suggestion tile.
  // Does NOT navigate or auto-fire the agent; user still needs to submit the prompt.
  const startDbtProject = () => {
    setProject(p => ({ ...p, projectSource: 'dbt' }));
  };

  // New project → goes to prompt screen first
  const newProject = () => {
    setProject({
      id: `proj-${Date.now()}`,
      name: 'Untitled Project',
      buildStep: 'empty',
      activeTab: 'columns',
      testMode: false,
      publishedVersion: 0,
      hasUnpublishedChanges: true,
      projectSource: 'warehouse',
      context: emptyContext,
      addedTables: [],
      columnsSelected: false,
      includedColumns: {},
      columnOverrides: {},
    });
    setInitialPrompt('');
    navigateTo('new-project');
  };

  // User submitted the prompt → go to workspace with agent auto-trigger
  const handlePromptSubmit = (prompt: string, _tables: string[]) => {
    setInitialPrompt(prompt);
    navigateTo('workspace');
  };

  // User submitted the hero prompt on the overview page → reset project + go straight to workspace
  const handleOverviewPromptSubmit = (prompt: string) => {
    setProject(p => ({
      id: `proj-${Date.now()}`,
      name: 'Untitled Project',
      buildStep: 'empty',
      activeTab: 'columns',
      testMode: false,
      publishedVersion: 0,
      hasUnpublishedChanges: true,
      projectSource: p.projectSource, // preserve dbt chip click
      context: emptyContext,
      addedTables: [],
      columnsSelected: false,
      includedColumns: {},
      columnOverrides: {},
    }));
    setInitialPrompt(prompt);
    navigateTo('workspace');
  };

  // Start manually → empty workspace, no agent auto-trigger
  const handleStartManually = () => {
    setInitialPrompt('');
    navigateTo('workspace');
  };

  const goBack = () => {
    setInitialPrompt('');
    setActiveAlert(null);
    // If previous screen was model-view, go back there; otherwise overview
    if (prevView === 'model-view' && selectedProject) {
      setView('model-view');
      setPrevView('overview');
    } else {
      setView('overview');
      setActiveNav('overview');
    }
  };

  const handleNavChange = (nav: NavSection) => {
    setActiveNav(nav);
    if (nav === 'overview') setView('overview');
  };

  return (
    <>
      <Shell activeNav={activeNav} onNavChange={handleNavChange}>
        {view === 'overview' && (
          <Overview
            onNewProject={newProject}
            onOpenProject={openModelView}
            onPromptSubmit={handleOverviewPromptSubmit}
            onStartDbt={startDbtProject}
          />
        )}
        {view === 'model-view' && selectedProject && (
          <ModelView
            project={selectedProject}
            alert={activeAlert}
            onBack={goBack}
            onEdit={enterWorkspaceFromModelView}
          />
        )}
      </Shell>
      {view === 'new-project' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <NewProjectPrompt onSubmit={handlePromptSubmit} onStartManually={handleStartManually} onStartDbt={startDbtProject} onBack={goBack} />
        </div>
      )}
      {view === 'workspace' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <Workspace
            project={project}
            setProject={setProject}
            onBack={goBack}
            initialPrompt={initialPrompt}
          />
        </div>
      )}
    </>
  );
};

export default DataStudio;
