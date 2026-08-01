import React, { useState, useEffect, useRef } from 'react';
import { VariantProvider, useVariant } from './variant';
import { CacheProvider, CacheProgressChip } from './components/CacheProgress';
import Shell, { NavSection, FlowOption } from './components/Shell';
import Overview from './components/Overview';
import ModelView from './components/ModelView';
import Workspace from './components/Workspace';
import ModelCanvas, { InitialCanvasJoin } from './components/ModelCanvas';
import SpotterXShell from './components/SpotterXShell';
import { Spotter } from '../Spotter';
import { GlobalHeader } from '../../components/GlobalHeader';
import { BrandMark } from '../../components/BrandMark';
import { PERSONA } from './persona';
import ChatView from './components/ChatView';
import NewProjectPrompt from './components/NewProjectPrompt';
import DataBrowserPage from './components/DataBrowserPage';
import ConnectionsPage from './components/ConnectionsPage';
import ModelsPage from './components/ModelsPage';
import FullChatView from './components/FullChatView';
import { AgentMessage, MOCK_PLAN_BASE } from './components/AgentPanel';
import { NotebookCell } from './components/ChatContextPanel';
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

export interface MultiSourceCreatedItem {
  type: 'table' | 'spotstore-table' | 'notebook' | 'csv-dataset' | 'staging-table';
  name: string;
}

export interface ProjectState {
  id: string;
  name: string;
  buildStep: 'empty' | 'tables' | 'joined' | 'transformed' | 'healthy';
  activeTab: 'columns' | 'tables' | 'preview' | 'notebook';
  publishedVersion: number;       // 0 = never published; 1, 2, … = version number
  hasUnpublishedChanges: boolean; // true when working copy diverges from published
  projectSource: 'warehouse' | 'dbt'; // entry path — affects column view indicators
  scenario?: 'warehouse' | 'multi-source';
  context: ProjectContext;
  addedTables: string[];
  columnsSelected: boolean;
  includedColumns: Record<string, string[]>; // tableId → [colName, ...]
  columnOverrides: Record<string, { description?: string | null; aiContext?: string | null; synonyms?: string[]; syncStatus?: 'ok' | 'broken' | 'degraded' }>;
  prepTransforms?: PrepTransform[];
  spotStoreTables?: string[];          // tables written to ThoughtSpot CDW
  stagingTableId?: string;             // the unified staging table id
  multiSourceCreated?: MultiSourceCreatedItem[];  // items created during multi-source ingestion
  dqStatus?: 'idle' | 'scanning' | 'issues_found' | 'fixing' | 'done';
}

type AppView = 'overview' | 'models' | 'chat' | 'new-project' | 'model-view' | 'workspace' | 'data-browser' | 'connections' | 'placeholder' | 'full-chat' | 'canvas' | 'spotterx' | 'spotter';

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

// MRD flow → visual canvas: derive the tables/joins to pre-populate the canvas with
// from the same MOCK_PLAN_BASE the MRD chat card narrates, so the two never drift apart.
const MRD_MODEL_TABLES: string[] = MOCK_PLAN_BASE.tables.map(t => t.name);

const MRD_JOIN_TYPE_MAP: Record<string, InitialCanvasJoin['joinType']> = {
  'INNER JOIN':      'inner',
  'LEFT JOIN':       'left_outer',
  'RIGHT JOIN':      'right_outer',
  'FULL OUTER JOIN': 'full_outer',
};

const MRD_CARDINALITY_MAP: Record<string, InitialCanvasJoin['cardinality']> = {
  'Many-to-one':  'many_to_one',
  'One-to-many':  'one_to_many',
  'One-to-one':   'one_to_one',
};

const MRD_MODEL_JOINS: InitialCanvasJoin[] = MOCK_PLAN_BASE.relationships.map(r => ({
  table1: r.fromTable,
  table2: r.toTable,
  col1: r.fromKey,
  col2: r.toKey,
  joinType: MRD_JOIN_TYPE_MAP[r.joinType] ?? 'inner',
  cardinality: MRD_CARDINALITY_MAP[r.cardinality ?? ''] ?? 'many_to_one',
}));

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

  const { variant } = useVariant();

  const [view, setView]           = useState<AppView>('overview');
  const [prevView, setPrevView]   = useState<AppView>('overview');
  const [activeNav, setActiveNav] = useState<NavSection>('overview');
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const [isFromScratch, setIsFromScratch] = useState(false);
  const [isMultiSource, setIsMultiSource] = useState(false);
  const [isNotebookFlow, setIsNotebookFlow] = useState(false);
  const [isMrdFlow, setIsMrdFlow] = useState(false);
  // Distinct from isMrdFlow: isMrdFlow gets reset to false the moment we navigate to
  // 'canvas' (see the buildStep effect below), but ModelCanvas needs to know "this visit
  // came from the MRD flow" for its own lifetime — so this flag survives that reset.
  const [canvasAutoPopulate, setCanvasAutoPopulate] = useState(false);
  const [instructionsCreated, setInstructionsCreated] = useState(false);
  const [isDbtReview, setIsDbtReview] = useState(false);
  const [dbtImported, setDbtImported] = useState(false);
  const [dataBrowserInitialTab, setDataBrowserInitialTab] = useState<'warehouses' | 'external-models'>('warehouses');
  const [messages, setMessages]       = useState<AgentMessage[]>([]);
  const [notebookCells, setNotebookCells] = useState<NotebookCell[]>([]);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const multiSourcePendingRef         = useRef(false);
  const notebookFlowPendingRef        = useRef(false);
  const [initialFlow, setInitialFlow]         = useState<string>('');
  const [initialMessage, setInitialMessage]   = useState<string>('');
  const [resolvedInsightIds, setResolvedInsightIds] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<OverviewProject | null>(null);
  const [activeAlert, setActiveAlert]         = useState<OverviewAlert | null>(null);
  const [flowOption] = useState<FlowOption>('option3');
  // The model name carried into Spotter from the post-publish toast, so Spotter's model
  // picker offers the model you just published rather than its own defaults.
  const [spotterModelName, setSpotterModelName] = useState('');
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
    dqStatus: 'idle',
  });

  // Helper: navigate to a view while tracking history
  const navigateTo = (next: AppView) => {
    setPrevView(view);
    setView(next);
  };

  // Auto-transition: chat → workspace when the build starts (buildStep leaves 'empty')
  // Notebook flow stays in chat — build completes there and user navigates manually.
  // MRD flow goes to the visual canvas instead of the workspace.
  useEffect(() => {
    if (view === 'chat' && project.buildStep !== 'empty' && !isNotebookFlow) {
      setInitialPrompt('');
      setIsFromScratch(false);
      if (isMrdFlow) {
        setIsMrdFlow(false);
        setCanvasAutoPopulate(true);
        navigateTo('canvas');
      } else if (variant === 'poc') {
        // POC: the agentic conversation runs as normal; when the model is created
        // it lands on the new visual canvas instead of the old workspace.
        setCanvasAutoPopulate(true);
        navigateTo('canvas');
      } else {
        navigateTo('workspace');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.buildStep, view, isNotebookFlow, isMrdFlow, variant]);

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
    setIsFromScratch(false);
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

  // Open visual canvas builder — "New model" from Models page
  const openModelCanvas = () => {
    setCanvasAutoPopulate(false);
    navigateTo('canvas');
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
      dqStatus: 'idle',
    });
    setInitialPrompt('');
    setCanvasAutoPopulate(false);
    // Pivot: "New model" now opens the no-code visual canvas (Komal's ModelCanvas).
    // The old high-code new-project prompt lives in the frozen "Data Studio 1.5" prototype.
    navigateTo('canvas');
  };

  // User submitted the prompt → go to workspace with agent auto-trigger
  const handlePromptSubmit = (prompt: string, _tables: string[]) => {
    setInitialPrompt(prompt);
    navigateTo('workspace');
  };

  // User submitted the hero prompt on the overview page → go to chat
  const handleOverviewPromptSubmit = (prompt: string) => {
    if (multiSourcePendingRef.current) {
      multiSourcePendingRef.current = false;
      setProject({
        id: `proj-${Date.now()}`,
        name: 'Customer Health Scorecard',
        buildStep: 'empty',
        activeTab: 'tables',
        publishedVersion: 0,
        hasUnpublishedChanges: true,
        projectSource: 'warehouse',
        scenario: 'multi-source',
        context: emptyContext,
        addedTables: [],
        columnsSelected: false,
        includedColumns: {},
        columnOverrides: {},
      });
      setInitialPrompt(prompt);
      setIsFromScratch(false);
      setIsMultiSource(true);
      setIsAgentMode(true);
      setMessages([]);
      navigateTo('chat');
      return;
    }
    if (notebookFlowPendingRef.current) {
      notebookFlowPendingRef.current = false;
      setProject({
        id: `proj-${Date.now()}`,
        name: 'Customer Health Scorecard',
        buildStep: 'empty',
        activeTab: 'tables',
        publishedVersion: 0,
        hasUnpublishedChanges: true,
        projectSource: 'warehouse',
        scenario: 'multi-source',
        context: emptyContext,
        addedTables: [],
        columnsSelected: false,
        includedColumns: {},
        columnOverrides: {},
      });
      setInitialPrompt(prompt);
      setIsFromScratch(false);
      setIsNotebookFlow(true);
      setIsAgentMode(true);
      setMessages([]);
      navigateTo('chat');
      return;
    }
    const isConnectionFlow = /connect.{0,20}snowflake|snowflake.{0,20}connect|set[\s-]up.{0,10}snowflake|add.{0,20}snowflake\b|new data connection/i.test(prompt);
    const isMrdPromptFlow = /\bmrd\b|model requirement/i.test(prompt);
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
      dqStatus: 'idle',
    });
    setInitialPrompt(prompt);
    setIsFromScratch(!isConnectionFlow && !isMrdPromptFlow);
    setIsMrdFlow(isMrdPromptFlow);
    setIsAgentMode(true);
    navigateTo('chat');
  };

  // Multi-source model pill → prefill the prompt bar, don't navigate yet
  const handleMultiSourceClick = () => {
    multiSourcePendingRef.current = true;
  };

  // Single-notebook flow pill → prefill the prompt bar, don't navigate yet
  const handleNotebookFlowClick = () => {
    notebookFlowPendingRef.current = true;
  };

  // Start manually → empty workspace, no agent auto-trigger
  const handleStartManually = () => {
    setInitialPrompt('');
    navigateTo('workspace');
  };

  const goBack = () => {
    setInitialPrompt('');
    setActiveAlert(null);
    setIsFromScratch(false);
    setIsMultiSource(false);
    setIsNotebookFlow(false);
    setIsMrdFlow(false);
    setCanvasAutoPopulate(false);
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
      <Shell
        activeNav={activeNav}
        onNavChange={handleNavChange}
        hideSidebar={view === 'chat' || view === 'workspace' || view === 'full-chat' || view === 'canvas'}
        hideHeader={view === 'canvas'}
        /* Caching progress follows you off the canvas — View is how you get back. */
        headerLeadingSlot={<CacheProgressChip onView={() => setView('canvas')} />}
      >
        {view === 'models' && (
          <ModelsPage
            onOpenProject={openModelView}
            onNewProject={openModelCanvas}
          />
        )}
        {view === 'overview' && (
          <Overview
            onNewProject={newProject}
            onOpenProject={openModelView}
            onPromptSubmit={handleOverviewPromptSubmit}
            onMultiSourceClick={handleMultiSourceClick}
            onNotebookFlowClick={handleNotebookFlowClick}
            onOpenProjectAtMonitoring={(proj) => openModelView(proj, 'monitoring')}
            onFixWithAgent={handleFixWithAgent}
            resolvedInsightIds={resolvedInsightIds}
            onOpenSpotterX={() => navigateTo('spotterx')}
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
            notebookCells={notebookCells}
            setNotebookCells={setNotebookCells}
            initialPrompt={initialPrompt}
            isFromScratch={isFromScratch}
            isMultiSource={isMultiSource}
            isNotebookFlow={isNotebookFlow}
            isMrdFlow={isMrdFlow}
            isDbtReview={isDbtReview}
            instructionsCreated={instructionsCreated}
            onBuildStart={() => setInstructionsCreated(true)}
            onNavigateToWorkspace={() => { setInitialPrompt(''); navigateTo('workspace'); }}
            onBack={goBack}
            onNavigateToTable={() => {
              setDataBrowserInitialTab('warehouses');
              navigateTo('data-browser');
            }}
            flowOption={flowOption}
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
            isFromScratch={isFromScratch}
            isDbtReview={isDbtReview}
            isAgentMode={isAgentMode}
            instructionsCreated={instructionsCreated}
            flowOption={flowOption}
            isNotebookFlow={isNotebookFlow}
            notebookCells={notebookCells}
            onNavigateToTable={(_tableName) => {
              setDataBrowserInitialTab('warehouses');
              navigateTo('data-browser');
            }}
          />
        </div>
      )}
      {/* Stays mounted while Spotter is open, which is what makes "Back to model" return
          you to the model you left rather than a fresh canvas. Unmounting would discard
          every bit of canvas state — tables, joins, published status, the whole thread.
          Spotter renders opaquely on top of it rather than this being hidden, so no
          layout is measured at zero size and the join connectors survive the trip. */}
      {(view === 'canvas' || view === 'spotter') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <ModelCanvas
            onBack={goBack}
            mode="dataset2"
            poc={variant === 'poc'}
            /* Post-publish toast → Spotter, so the model can be asked a question
               straight after it's published. */
            onOpenSpotter={(name) => { setSpotterModelName(name); navigateTo('spotter'); }}
            initialTables={canvasAutoPopulate ? MRD_MODEL_TABLES : undefined}
            initialJoins={canvasAutoPopulate ? MRD_MODEL_JOINS : undefined}
            /* Test tab hidden for now — re-add `showTestTab` to bring it back.
               TestView + all tab logic are left intact; this only stops the +Model
               flow from opting in. */
          />
        </div>
      )}
      {view === 'spotterx' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <SpotterXShell
            onClose={goBack}
            initialTables={MRD_MODEL_TABLES}
            initialJoins={MRD_MODEL_JOINS}
          />
        </div>
      )}
      {/* The Spotter prototype, opened from the post-publish toast. It renders inside our
          product rather than as a separate one: we pass our own header, so Spotter's
          ("Alex", plus a profile photo fetched from the internet) never mounts and the
          persona holds across the seam. Its left menu opens collapsed — you came here to
          ask one question, not to browse — and the rail keeps its own expand control. */}
      {view === 'spotter' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#fff' }}>
          <Spotter
            initialLeftMode="rail"
            extraModels={[{ id: 'ds-published', name: spotterModelName || 'Renewal risk' }]}
            initialModelId="ds-published"
            header={
              <GlobalHeader
                theme="light"
                searchPlaceholder="Search in your library"
                showKeyboardHint={false}
                notificationCount={1}
                userName={PERSONA.userName}
                userAvatar={PERSONA.userAvatar}
                logo={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <BrandMark pixelSize={22} color="#1D232F" />
                    <button
                      /* Straight back to the canvas, not via goBack — goBack resets the
                         flow flags and clears the agent thread, which is right when
                         leaving a flow and wrong when stepping back into one. */
                      onClick={() => setView('canvas')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px 4px 7px', borderRadius: 6, border: 'none',
                        background: 'transparent', color: '#64748B', cursor: 'pointer',
                        fontSize: fs.sm, fontWeight: fw.medium, fontFamily: ff.primary,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F0F2F6'; (e.currentTarget as HTMLElement).style.color = '#1D232F'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="10,4 6,8 10,12" /></svg>
                      Back to model
                    </button>
                  </div>
                }
              />
            }
          />
        </div>
      )}
    </>
  );
};

const DataStudioWithVariant: React.FC = () => (
  <VariantProvider>
    {/* Above Shell and the canvas both: a caching run has to survive navigating away
        from the canvas that started it. See CacheProgress.tsx. */}
    <CacheProvider>
      <DataStudio />
    </CacheProvider>
  </VariantProvider>
);

export default DataStudioWithVariant;
