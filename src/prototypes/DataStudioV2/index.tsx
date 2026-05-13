import React, { useState, useEffect } from 'react';
import Shell, { NavSection } from './components/Shell';
import Overview from './components/Overview';
import ModelView from './components/ModelView';
import Workspace from './components/Workspace';
import ChatView from './components/ChatView';
import NewProjectPrompt from './components/NewProjectPrompt';
import DataBrowserPage from './components/DataBrowserPage';
import ConnectionsPage from './components/ConnectionsPage';
import ModelsPage from './components/ModelsPage';
import FullChatView from './components/FullChatView';
import { AgentMessage } from './components/AgentPanel';
import { OverviewProject, OverviewAlert, ActiveInsight } from './data/mockData';
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

type AppView = 'overview' | 'models' | 'chat' | 'new-project' | 'model-view' | 'workspace' | 'data-browser' | 'connections' | 'placeholder' | 'full-chat';

// Derives a short model name from the user's intent prompt.
const deriveModelName = (prompt: string): string => {
  const s = prompt
    .replace(/^i (want to |would like to )?(build|create|make|start with|improve|cache|debug)\s+(a |an )?(new )?(data model\s*(that |to |for |which |and |,)?\s*)?/i, '')
    .replace(/^(that |to |for |which |and )\s*/i, '')
    .replace(/^(tracks?|analyzes?|measures?|helps?|shows?|enables?|answers?|builds?|improves?)\s+/i, '')
    .trim();
  if (!s) return 'Untitled Model';
  const words = s.split(/\s+/).slice(0, 5).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

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
  const [instructionsCreated, setInstructionsCreated] = useState(false);
  const [isDbtReview, setIsDbtReview] = useState(false);
  const [dbtImported, setDbtImported] = useState(false);
  const [dataBrowserInitialTab, setDataBrowserInitialTab] = useState<'warehouses' | 'external-models'>('warehouses');
  const [messages, setMessages]       = useState<AgentMessage[]>([]);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [initialFlow, setInitialFlow]         = useState<string>('');
  const [initialMessage, setInitialMessage]   = useState<string>('');
  const [resolvedInsightIds, setResolvedInsightIds] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<OverviewProject | null>(null);
  const [activeAlert, setActiveAlert]         = useState<OverviewAlert | null>(null);
  const [project, setProject] = useState<ProjectState>({
    id: 'proj-001',
    name: 'Untitled Model',
    buildStep: 'empty',
    activeTab: 'tables',
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

  // Auto-transition: chat → workspace when the build starts (buildStep leaves 'empty')
  useEffect(() => {
    if (view === 'chat' && project.buildStep !== 'empty') {
      setInitialPrompt('');
      setIsDayZero(false);
      navigateTo('workspace');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.buildStep, view]);

  const [modelViewInitialTab, setModelViewInitialTab] = useState<'info' | 'usage' | 'cache' | 'quality' | 'monitoring' | undefined>(undefined);

  // Open model view — landing screen before workspace
  const openModelView = (proj: OverviewProject, initialTab?: 'info' | 'usage' | 'cache' | 'quality' | 'monitoring') => {
    setSelectedProject(proj);
    setActiveAlert(proj.issues?.[0] ?? null);
    setModelViewInitialTab(initialTab);
    navigateTo('model-view');
  };

  const handleInsightResolved = (id: string) => {
    setResolvedInsightIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const handleFixWithAgent = (insight: ActiveInsight, proj: OverviewProject) => {
    const flowMap: Record<string, string> = {
      'ins-d1': 'dbt_connection_repair',
      'ins-d2': 'schema_drift_repair',
      'ins-d3': 'schema_blast_repair',
      'ins-d6': 'null_rate_investigation',
      'ins-o3': 'semantic_gaps_detect',
      'ins-o4': 'cache_miss_detect',
    };
    const flow = flowMap[insight.id]
      ?? (insight.primaryAction.type === 'fix-models' ? 'schema_drift_multi_repair'
        : insight.primaryAction.type === 'fix-model'  ? 'schema_drift_repair'
        : '');
    const promptMap: Record<string, string> = {
      'ins-d1': 'Fix the dbt Cloud connection — sales_analytics sync failed and 3 models are blocked.',
      'ins-d2': 'Fix the schema drift on FnOps Cost Model — cost_center and allocation_type were removed from dbt_finance_spend.',
      'ins-d3': 'Fix the schema drift on fact_sales — gross_margin and store_id were removed from Snowflake_Sales_Prod.',
      'ins-d6': 'Investigate the null rate spike in Marketing Campaign Attribution — campaign_id nulls spiked from 2% to 18%.',
      'ins-o3': 'Fill the semantic gaps in Marketing Campaign Attribution — 4 high-use columns are missing descriptions that Spotter needs to answer questions about them correctly.',
      'ins-o4': "Enable caching for the 'Win rate by region' query — it's run 34× this week with 0% cache hit rate. This should save ~11 seconds per query.",
    };
    setInitialFlow(flow);
    setInitialMessage(promptMap[insight.id] ?? insight.title);
    setProject(p => ({
      ...p,
      id: `proj-${Date.now()}`,
      name: proj.name,
      buildStep: 'healthy',
      activeTab: 'tables',
      publishedVersion: proj.status === 'published' ? 1 : 0,
      hasUnpublishedChanges: proj.status !== 'published',
      projectSource: 'warehouse',
      addedTables: ['orders', 'campaigns', 'users'],
      columnsSelected: true,
      includedColumns: {
        orders:    ['order_date', 'amount', 'region', 'cost_center', 'allocation_type'],
        campaigns: ['campaign_id', 'campaign_name', 'channel', 'spend', 'budget'],
        users:     ['user_id', 'segment', 'lifetime_value'],
      },
      columnOverrides: {},
    }));
    setMessages([]);
    navigateTo('full-chat');
  };

  // Enter workspace from model view (Edit model button)
  const enterWorkspaceFromModelView = () => {
    if (!selectedProject) return;
    setIsAgentMode(true);
    openProject(selectedProject.name, selectedProject.status === 'published');
  };

  // Open an existing project — seeds a realistic "already built" state for demo
  const openProject = (nameOrId?: string, published = false) => {
    setInitialPrompt('');
    setProject({
      id: `proj-${Date.now()}`,
      name: nameOrId ?? 'Untitled Model',
      buildStep: 'healthy',
      activeTab: 'tables',
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
      prepTransforms: [
        { id: 'pt1', columnId: 'order_date', tableId: 'orders', issueType: 'date_format', label: 'Standardise order_date to ISO 8601', sql: "TO_DATE(order_date, 'MM/DD/YYYY')" },
        { id: 'pt2', columnId: 'amount', tableId: 'orders', issueType: 'null', label: 'Fill null amount with 0', sql: 'COALESCE(amount, 0)' },
        { id: 'pt3', columnId: 'spend', tableId: 'campaigns', issueType: 'anomaly', label: 'Cap spend outliers at p99', sql: 'LEAST(spend, 9800)' },
      ],
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
      activeTab: 'tables',
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
      activeTab: 'tables',
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

  // User submitted the hero prompt on the overview page → go to chat
  const handleOverviewPromptSubmit = (prompt: string) => {
    setProject({
      id: `proj-${Date.now()}`,
      name: deriveModelName(prompt),
      buildStep: 'empty',
      activeTab: 'tables',
      publishedVersion: 0,
      hasUnpublishedChanges: true,
      projectSource: 'warehouse',
      context: emptyContext,
      addedTables: [],
      columnsSelected: false,
      includedColumns: {},
      columnOverrides: {},
    });
    setInitialPrompt(prompt);
    setIsDayZero(true);
    setIsAgentMode(true);
    navigateTo('chat');
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
    setIsAgentMode(false);
    setMessages([]);
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
      <Shell activeNav={activeNav} onNavChange={handleNavChange} hideSidebar={view === 'chat' || view === 'workspace' || view === 'full-chat'}>
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
            onOpenProjectAtMonitoring={(proj) => openModelView(proj, 'monitoring')}
            onFixWithAgent={handleFixWithAgent}
            resolvedInsightIds={resolvedInsightIds}
          />
        )}
        {view === 'model-view' && selectedProject && (
          <ModelView
            project={selectedProject}
            alert={activeAlert}
            initialTab={modelViewInitialTab}
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
        {view === 'chat' && (
          <ChatView
            project={project}
            setProject={setProject}
            messages={messages}
            setMessages={setMessages}
            initialPrompt={initialPrompt}
            isDayZero={isDayZero}
            isDbtReview={isDbtReview}
            instructionsCreated={instructionsCreated}
            onBuildStart={() => setInstructionsCreated(true)}
            onBack={goBack}
            onNavigateToTable={() => {
              setDataBrowserInitialTab('warehouses');
              navigateTo('data-browser');
            }}
          />
        )}
        {view === 'full-chat' && (
          <FullChatView
            project={project}
            setProject={setProject}
            initialFlow={initialFlow}
            initialMessage={initialMessage}
            onBack={goBack}
            onInsightResolved={handleInsightResolved}
          />
        )}
      </Shell>
      {view === 'new-project' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <NewProjectPrompt onSubmit={(prompt) => handleOverviewPromptSubmit(prompt)} onStartManually={handleStartManually} onStartDbt={startDbtProject} onBack={goBack} />
        </div>
      )}
      {view === 'workspace' && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
          <Workspace
            project={project}
            setProject={setProject}
            messages={messages}
            setMessages={setMessages}
            onBack={goBack}
            initialPrompt={initialPrompt}
            isDayZero={isDayZero}
            isDbtReview={isDbtReview}
            isAgentMode={isAgentMode}
            instructionsCreated={instructionsCreated}
            onNavigateToTable={(tableName) => {
              setDataBrowserInitialTab('warehouses');
              navigateTo('data-browser');
            }}
          />
        </div>
      )}
    </>
  );
};

export default DataStudio;
