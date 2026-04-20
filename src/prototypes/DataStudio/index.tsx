import React, { useState } from 'react';
import Shell, { NavSection } from './components/Shell';
import Overview from './components/Overview';
import Workspace from './components/Workspace';
import NewProjectPrompt from './components/NewProjectPrompt';

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

export interface ProjectState {
  id: string;
  name: string;
  buildStep: 'empty' | 'tables' | 'joined' | 'transformed' | 'healthy';
  activeTab: 'visualizer' | 'preview' | 'notebook';
  testMode: boolean;
  context: ProjectContext;
  addedTables: string[];
  columnsSelected: boolean;
  includedColumns: Record<string, string[]>; // tableId → [colName, ...]
}

type AppView = 'overview' | 'new-project' | 'workspace';

const DataStudio: React.FC = () => {
  React.useEffect(() => {
    const prev = document.title;
    document.title = 'Data Studio';
    return () => { document.title = prev; };
  }, []);

  const [view, setView] = useState<AppView>('overview');
  const [activeNav, setActiveNav] = useState<NavSection>('overview');
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const [project, setProject] = useState<ProjectState>({
    id: 'proj-001',
    name: 'Untitled Project',
    buildStep: 'empty',
    activeTab: 'visualizer',
    testMode: false,
    context: emptyContext,
    addedTables: [],
    columnsSelected: false,
    includedColumns: {},
  });

  // Open an existing project — seeds a realistic "already built" state for demo
  const openProject = (nameOrId?: string) => {
    setInitialPrompt('');
    setProject({
      id: `proj-${Date.now()}`,
      name: nameOrId ?? 'Untitled Project',
      buildStep: 'healthy',
      activeTab: 'visualizer',
      testMode: false,
      context: emptyContext,
      addedTables: ['orders', 'campaigns', 'users'],
      columnsSelected: true,
      includedColumns: {
        orders:    ['campaign_id', 'user_id', 'order_date', 'amount', 'region'],
        campaigns: ['campaign_id', 'campaign_name', 'channel', 'spend', 'budget', 'impressions', 'target_region'],
        users:     ['user_id', 'segment', 'lifetime_value', 'signup_date'],
      },
    });
    setView('workspace');
  };

  // New project → goes to prompt screen first
  const newProject = () => {
    setProject({
      id: `proj-${Date.now()}`,
      name: 'Untitled Project',
      buildStep: 'empty',
      activeTab: 'visualizer',
      testMode: false,
      context: emptyContext,
      addedTables: [],
      columnsSelected: false,
      includedColumns: {},
    });
    setInitialPrompt('');
    setView('new-project');
  };

  // User submitted the prompt → go to workspace with agent auto-trigger
  const handlePromptSubmit = (prompt: string, _tables: string[]) => {
    setInitialPrompt(prompt);
    setView('workspace');
  };

  // Start manually → empty workspace, no agent auto-trigger
  const handleStartManually = () => {
    setInitialPrompt('');
    setView('workspace');
  };

  const backToOverview = () => {
    setInitialPrompt('');
    setView('overview');
    setActiveNav('overview');
  };

  const handleNavChange = (nav: NavSection) => {
    setActiveNav(nav);
    if (nav === 'overview') setView('overview');
  };

  const hideSidebar = view === 'workspace' || view === 'new-project';

  return (
    <Shell activeNav={activeNav} onNavChange={handleNavChange} hideSidebar={hideSidebar}>
      {view === 'overview' && (
        <Overview onNewProject={newProject} onOpenProject={openProject} />
      )}
      {view === 'new-project' && (
        <NewProjectPrompt onSubmit={handlePromptSubmit} onStartManually={handleStartManually} />
      )}
      {view === 'workspace' && (
        <Workspace
          project={project}
          setProject={setProject}
          onBack={backToOverview}
          initialPrompt={initialPrompt}
        />
      )}
    </Shell>
  );
};

export default DataStudio;
