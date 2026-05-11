import React, { useState } from 'react';
import Shell, { NavSection } from './components/Shell';
import Overview from './components/Overview';
import ModelView from './components/ModelView';
import Workspace from './components/Workspace';
import NewProjectPrompt from './components/NewProjectPrompt';
import DataBrowserPage from './components/DataBrowserPage';
import ConnectionsPage from './components/ConnectionsPage';
import ModelsPage from './components/ModelsPage';
import { OverviewProject, OverviewAlert } from './data/mockData';
import { c, sp, ff, fs, fw } from './styles';

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

type AppView = 'overview' | 'models' | 'new-project' | 'model-view' | 'workspace' | 'data-browser' | 'connections' | 'placeholder';

// User-facing labels for the unwired nav sections so the placeholder reads cleanly.
const PLACEHOLDER_LABEL: Record<NavSection, string> = {
  overview:    'Overview',
  projects:    'Models',
  data:        'Data',
  connections: 'Connections',
};

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
  const [isDayZero, setIsDayZero] = useState(false);
  const [isDbtReview, setIsDbtReview] = useState(false);
  const [dbtImported, setDbtImported] = useState(false);
  const [dataBrowserInitialTab, setDataBrowserInitialTab] = useState<'warehouses' | 'external-models'>('warehouses');
  const [selectedProject, setSelectedProject] = useState<OverviewProject | null>(null);
  const [activeAlert, setActiveAlert]         = useState<OverviewAlert | null>(null);
  const [project, setProject] = useState<ProjectState>({
    id: 'proj-001',
    name: 'Untitled Model',
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
      name: nameOrId ?? 'Untitled Model',
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

  // Open canvas with a dbt model pre-loaded (from wizard "Review issues")
  const openDbtCanvas = (modelName: string) => {
    setInitialPrompt('');
    setIsDayZero(false);
    setIsDbtReview(true);
    setProject({
      id: `dbt-${Date.now()}`,
      name: modelName,
      buildStep: 'healthy',
      activeTab: 'columns',
      testMode: false,
      publishedVersion: 0,
      hasUnpublishedChanges: true,
      projectSource: 'dbt',
      context: emptyContext,
      addedTables: ['orders', 'campaigns', 'users'],
      columnsSelected: true,
      includedColumns: {
        orders:    ['order_date', 'amount', 'region'],
        campaigns: ['campaign_id', 'campaign_name', 'channel', 'spend', 'budget', 'impressions', 'target_region', 'campaign_roas', 'days_to_convert'],
        users:     ['user_id', 'segment', 'lifetime_value', 'signup_date', 'user_segment_fill'],
      },
      columnOverrides: {},
    });
    navigateTo('workspace');
  };

  // New project → goes to prompt screen first
  const newProject = () => {
    setProject({
      id: `proj-${Date.now()}`,
      name: 'Untitled Model',
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

  // User submitted the hero prompt on the overview page → reset project + go to workspace with clarify flow
  const handleOverviewPromptSubmit = (prompt: string) => {
    setProject(p => ({
      id: `proj-${Date.now()}`,
      name: 'Untitled Model',
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
    setIsDayZero(true);
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
    setIsDayZero(false);
    setIsDbtReview(false);
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
    if (nav === 'overview')         setView('overview');
    else if (nav === 'projects')    setView('models');
    else if (nav === 'data')       { setDataBrowserInitialTab('warehouses'); setView('data-browser'); }
    else if (nav === 'connections') setView('connections');
    else                            setView('placeholder');
  };

  return (
    <>
      <Shell activeNav={activeNav} onNavChange={handleNavChange}>
        {view === 'models' && (
          <ModelsPage
            onOpenProject={openModelView}
            onNewProject={newProject}
          />
        )}
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
        {view === 'data-browser' && (
          <DataBrowserPage
            initialTab={dataBrowserInitialTab}
            dbtImported={dbtImported}
            onImportDbt={() => setDbtImported(true)}
            onReviewIssues={openDbtCanvas}
          />
        )}
        {view === 'connections'  && <ConnectionsPage />}
        {view === 'placeholder' && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: c['background-sunken'], color: c['content-secondary'],
            fontFamily: ff.primary, fontSize: fs.md, lineHeight: 1.5,
            textAlign: 'center', padding: sp.I,
          }}>
            <div>
              <div style={{ fontSize: fs.lg, fontWeight: fw.medium, color: c['content-primary'], marginBottom: sp.A + 2 }}>
                {PLACEHOLDER_LABEL[activeNav]}
              </div>
              <div>Coming in a later step. This nav target isn&rsquo;t wired yet.</div>
            </div>
          </div>
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
            isDayZero={isDayZero}
            isDbtReview={isDbtReview}
          />
        </div>
      )}
    </>
  );
};

export default DataStudio;
