import React, { useState } from 'react';
import DataObjectsPage from './components/DataObjectsPage';
import CreateModelModal from './components/CreateModelModal';
import CanvasChoiceModal from './components/CanvasChoiceModal';
import SelectConnectionModal from './components/SelectConnectionModal';
import { DEFAULT_CONFIG, type ConfigValues } from './components/PrototypeConfig';
import type { ConnectionId } from './data/tableConnections';
import ModelDetailPage from './components/ModelDetailPage';
import { DATA_OBJECTS, RECENT_DATA_OBJECTS, makeCreatedModel } from './data/dataObjects';
import type { DataObject } from './data/dataObjects';
import { CacheProvider } from './components/CacheProgress';
import { ModelCacheProvider } from './components/cache/ModelCacheContext';
import Shell, { NavSection } from './components/Shell';
import ModelCanvas, { InitialCanvasJoin } from './components/ModelCanvas';
import { Spotter } from '../Spotter';
import { GlobalHeader } from '../../components/GlobalHeader';
import { BrandMark } from '../../components/BrandMark';
import { PERSONA } from './persona';
import { MOCK_PLAN_BASE } from './components/AgentPanel';
import { c, sp, ff, fs, fw } from './styles';

/**
 * Semantic context a model carries for Spotter. Authored on the canvas; the shape
 * is here because both the canvas and the agent panel read it.
 */
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

/**
 * ⚠️ Legacy internal type — **do not rename.** `ProjectState` is load-bearing across
 * the canvas and the agent panel. The user-facing object is a **model**.
 */
export interface ProjectState {
  id: string;
  name: string;
  buildStep: 'empty' | 'tables' | 'joined' | 'transformed' | 'healthy';
  activeTab: 'columns' | 'tables' | 'preview' | 'notebook';
  publishedVersion: number;       // 0 = never saved; 1, 2, … = version number
  hasUnpublishedChanges: boolean;
  projectSource: 'warehouse' | 'dbt';
  context: ProjectContext;
  addedTables: string[];
  columnsSelected: boolean;
  includedColumns: Record<string, string[]>; // tableId → [colName, ...]
  columnOverrides: Record<string, { description?: string | null; aiContext?: string | null; synonyms?: string[]; syncStatus?: 'ok' | 'broken' | 'degraded' }>;
  prepTransforms?: PrepTransform[];
  dqStatus?: 'idle' | 'scanning' | 'issues_found' | 'fixing' | 'done';
  /**
   * ⚠️ Multi-source scaffolding, out of the MVP by scope. Kept because the agent
   * panel's scripted flows still write to it; removing the flows is a follow-up.
   */
  spotStoreTables?: string[];
  multiSourceCreated?: { type: 'table' | 'spotstore-table' | 'notebook' | 'csv-dataset' | 'staging-table'; name: string }[];
}

/**
 * The five screens this prototype holds. The canvas is a feature of Data Workspace,
 * not a destination of its own — so the workspace's object list is where you start
 * and where a saved model lands.
 */
type AppView = 'data-objects' | 'model-detail' | 'canvas' | 'spotter' | 'placeholder';

// Reopening a saved model pre-populates the canvas from the same plan the agent
// narrates, so the two never drift apart.
const MODEL_TABLES: string[] = MOCK_PLAN_BASE.tables.map(t => t.name);

const JOIN_TYPE_MAP: Record<string, InitialCanvasJoin['joinType']> = {
  'INNER JOIN':      'inner',
  'LEFT JOIN':       'left_outer',
  'RIGHT JOIN':      'right_outer',
  'FULL OUTER JOIN': 'full_outer',
};

const CARDINALITY_MAP: Record<string, InitialCanvasJoin['cardinality']> = {
  'Many-to-one':  'many_to_one',
  'One-to-many':  'one_to_many',
  'One-to-one':   'one_to_one',
};

const MODEL_JOINS: InitialCanvasJoin[] = MOCK_PLAN_BASE.relationships.map(r => ({
  table1: r.fromTable,
  table2: r.toTable,
  col1: r.fromKey,
  col2: r.toKey,
  joinType: JOIN_TYPE_MAP[r.joinType] ?? 'inner',
  cardinality: CARDINALITY_MAP[r.cardinality ?? ''] ?? 'many_to_one',
}));

// User-facing labels for the nav sections this prototype doesn't hold.
const PLACEHOLDER_LABEL: Record<NavSection, string> = {
  overview:        'Overview',
  projects:        'Models',
  data:            'Data',
  connections:     'Connections',
  'data-objects':  'Data objects',
};

const DataStudioMVP: React.FC = () => {
  React.useEffect(() => {
    const prev = document.title;
    document.title = 'Data Studio - MVP';
    return () => { document.title = prev; };
  }, []);

  const [view, setView]           = useState<AppView>('data-objects');
  const [activeNav, setActiveNav] = useState<NavSection>('data-objects');

  // ── The entry flow: `+` → Model → Build a new model → new canvas → connection ──
  const [createMenuOpen, setCreateMenuOpen]             = useState(false);
  const [createModelOpen, setCreateModelOpen]           = useState(false);
  const [canvasChoiceOpen, setCanvasChoiceOpen]         = useState(false);
  const [selectConnectionOpen, setSelectConnectionOpen] = useState(false);

  /**
   * Prototype configuration — the design options under review, switched from the pill in
   * the canvas topbar. Held here rather than in `ModelCanvas` so the choice survives
   * leaving the canvas and coming back; the canvas unmounts on that trip.
   */
  const [config, setConfig] = useState<ConfigValues>(DEFAULT_CONFIG);

  /**
   * The connection chosen before the canvas opens. A model is single-connection —
   * picked once and unchangeable — so this is what the data browser lists tables
   * from, as a flat list.
   */
  const [modelConnection, setModelConnection] = useState<ConnectionId | null>(null);

  /**
   * The workspace's object list. Stateful because saving a model has to put it in
   * here — landing back on a page that doesn't show what you just made is the thing
   * that breaks the loop.
   */
  const [dataObjects, setDataObjects] = useState<DataObject[]>(DATA_OBJECTS);
  /** The model whose detail page is open — the view state's subject. */
  const [activeModelObject, setActiveModelObject] = useState<DataObject | null>(null);
  /** True when the canvas is opened on an existing model rather than an empty one. */
  const [canvasAutoPopulate, setCanvasAutoPopulate] = useState(false);
  /** The model name carried into Spotter, so its picker offers what you just saved. */
  const [spotterModelName, setSpotterModelName] = useState('');

  const handleNavChange = (nav: NavSection) => {
    setActiveNav(nav);
    setView(nav === 'data-objects' ? 'data-objects' : 'placeholder');
  };

  /** Step 5 → the canvas, on an empty model. */
  const openEmptyCanvas = () => {
    setCanvasAutoPopulate(false);
    setView('canvas');
  };

  const leaveCanvas = () => {
    setCanvasAutoPopulate(false);
    setActiveNav('data-objects');
    setView('data-objects');
  };

  /**
   * Save lands on the model's detail page — the view state. That's what closes the
   * loop: you leave the edit state and arrive at the object you just made, rather
   * than back at a list.
   */
  const handleCanvasSaved = (canvasModelName?: string) => {
    ensureModelObject(canvasModelName);
    setActiveNav('data-objects');
    setView('model-detail');
  };

  /**
   * Bring the model into existence and hand it back — no view change.
   *
   * The canvas owns the model name (it's renameable inline there), and both save paths need
   * the same object in the list, so the creation lives here once rather than in each.
   */
  const ensureModelObject = (canvasModelName?: string, description?: string) => {
    const name = canvasModelName?.trim() || 'Untitled model';
    const existing = dataObjects.find(o => o.type === 'Model' && o.name === name);
    const obj = existing ?? makeCreatedModel(name, PERSONA.userName, description);
    if (!existing) setDataObjects(prev => [obj, ...prev]);
    setActiveModelObject(obj);
    return obj;
  };

  /**
   * ⚠️ **Save keeps you on the canvas** (Vivek, 2026-08-19). It used to land on the model's
   * detail page; now the model is created, the topbar's action becomes *Update model*, Query
   * starts working, and the canvas is still there. `activeModelObject` is still set, so
   * leaving later arrives at the model you just made.
   */
  const handleCanvasSavedInPlace = (canvasModelName?: string, description?: string) => {
    ensureModelObject(canvasModelName, description);
  };

  const handleOpenModelDetail = (obj: DataObject) => {
    setActiveModelObject(obj);
    setView('model-detail');
  };

  /**
   * "Edit model" → the edit state. Models built on this canvas reopen here; the rest
   * belong to the classic modelling UI, which this prototype doesn't hold.
   */
  const handleEditModel = () => {
    if (activeModelObject?.canvas !== 'multiSource') { setView('placeholder'); return; }
    setCanvasAutoPopulate(true);
    setView('canvas');
  };

  return (
    <>
      <Shell
        activeNav={activeNav}
        onNavChange={handleNavChange}
        hideSidebar={view === 'canvas'}
        hideHeader={view === 'canvas'}
        dataWorkspace
        onAddClick={() => setCreateMenuOpen(true)}
      >
        {view === 'data-objects' && (
          <DataObjectsPage
            objects={dataObjects}
            recent={RECENT_DATA_OBJECTS}
            onOpenModel={handleOpenModelDetail}
            /* Tables have no detail page in this prototype — say so rather than
               doing nothing. */
            onOpenTable={() => setView('placeholder')}
          />
        )}
        {view === 'model-detail' && activeModelObject && (
          <ModelDetailPage object={activeModelObject} onEditModel={handleEditModel} />
        )}
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

      {/* Stays mounted while Spotter is open, which is what makes "Back to model"
          return you to the model you left rather than a fresh canvas. Unmounting
          would discard every bit of canvas state — tables, joins, the whole thread.
          Spotter renders opaquely on top rather than this being hidden, so no layout
          is measured at zero size and the join connectors survive the trip. */}
      {(view === 'canvas' || view === 'spotter') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <ModelCanvas
            onBack={leaveCanvas}
            mode="dataset2"
            poc
            /* "Save model" commits and lands on the model's detail page, with no
               publish modal in between. */
            saveMode
            /* Same fact as `canvasAutoPopulate`: the canvas was opened on a model that already
               exists. It drives the topbar's Update-versus-Save wording and whether Query can
               run — a model has to exist before it can be asked anything. */
            modelSaved={canvasAutoPopulate}
            onSavedInPlace={handleCanvasSavedInPlace}
            onPublished={handleCanvasSaved}
            /* Post-save toast → Spotter, so the model can be asked a question
               straight after it's saved. */
            onOpenSpotter={(name) => { setSpotterModelName(name); setView('spotter'); }}
            initialTables={canvasAutoPopulate ? MODEL_TABLES : undefined}
            initialJoins={canvasAutoPopulate ? MODEL_JOINS : undefined}
            /* The connection chosen at step 5. The data browser lists its tables as
               a flat list. */
            modelConnection={modelConnection ?? undefined}
            config={config}
            onConfigChange={setConfig}
          />
        </div>
      )}

      {/* The Spotter prototype, opened from the post-save toast. It renders inside our
          product rather than as a separate one: we pass our own header, so Spotter's
          never mounts and the persona holds across the seam. Its left menu opens
          collapsed — you came here to ask one question, not to browse. */}
      {view === 'spotter' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#fff' }}>
          <Spotter
            initialLeftMode="rail"
            extraModels={[{ id: 'ds-saved', name: spotterModelName || 'Renewal risk' }]}
            initialModelId="ds-saved"
            header={
              <GlobalHeader
                theme="light"
                searchPlaceholder="Search in your library"
                showKeyboardHint={false}
                notificationCount={1}
                userName={PERSONA.userName}
                userAvatar={PERSONA.userAvatar}
                /* The whole logo area is the way back. GlobalHeader already wraps the
                   logo slot in its own button, so a nested button here bubbled its
                   click up to that one — whose default navigates out to the Radiant
                   Play registry. One button, one handler, no nesting. */
                onLogoClick={() => setView('canvas')}
                logo={
                  <span style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
                    <BrandMark pixelSize={22} color="#1D232F" />
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: sp.A,
                      color: '#64748B', fontSize: fs.sm, fontWeight: fw.medium, fontFamily: ff.primary,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="10,4 6,8 10,12" /></svg>
                      Back to model
                    </span>
                  </span>
                }
              />
            }
          />
        </div>
      )}

      {/* ── Data Workspace `+` menu ─────────────────────────────────────────────
          Rendered outside Shell so the sidebar's dark theme variables don't cascade
          into it. Anchored under the sidebar header's `+`.

          Connection / Dataset / SQL view are the real product's and stay inert. */}
      {createMenuOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => setCreateMenuOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: 126, left: 244,
              backgroundColor: c['background-base'],
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 1000,
              padding: `${sp.B}px 0`,
              minWidth: 180,
              fontFamily: ff.primary,
            }}
          >
            {([
              { label: 'Connection', action: null },
              { label: 'Model',      action: () => setCreateModelOpen(true) },
              { label: 'Dataset',    action: null },
              { label: 'SQL view',   action: null },
            ] as { label: string; action: (() => void) | null }[]).map(item => {
              const live = Boolean(item.action);
              return (
                <div
                  key={item.label}
                  onClick={() => {
                    if (item.action) { item.action(); setCreateMenuOpen(false); }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: sp.C,
                    padding: `${sp.B}px ${sp.D}px`,
                    fontSize: fs.sm,
                    color: live ? c['content-primary'] : c['content-tertiary'],
                    cursor: live ? 'pointer' : 'default',
                  }}
                  onMouseEnter={e => { if (live) e.currentTarget.style.backgroundColor = c['background-sunken']; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {item.label}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/*
        ── Entry flow: three modals, in order ────────────────────────────────────
          `+ → Model`         → the model-type modal (Suraj's, unchanged)
          Build a new model   → Select connection
          Next                → the old-vs-new canvas choice
          Continue            → the canvas

        ⚠️ **Only "Build a new model" continues.** Every other option in the first
        modal (semantic layer, dbt, TML, datasets) closes on Next exactly as it
        always did.

        The old/new choice used to be a nav submenu under Model. It moved into the
        flow because at the submenu the user hasn't yet said what kind of model they
        want, so "old" and "new" mean nothing to choose between. It now sits **after**
        the connection: the connection is a property of the model either way, so it
        can be answered without knowing which canvas you'll use — and the canvas
        choice is left as the last thing before you land on one.
      */}
      {createModelOpen && (
        <CreateModelModal
          onClose={() => setCreateModelOpen(false)}
          onBuildOwn={() => { setCreateModelOpen(false); setSelectConnectionOpen(true); }}
        />
      )}

      {selectConnectionOpen && (
        <SelectConnectionModal
          onClose={() => setSelectConnectionOpen(false)}
          onBack={() => { setSelectConnectionOpen(false); setCreateModelOpen(true); }}
          onNext={connId => { setModelConnection(connId); setSelectConnectionOpen(false); setCanvasChoiceOpen(true); }}
        />
      )}

      {canvasChoiceOpen && (
        <CanvasChoiceModal
          onClose={() => setCanvasChoiceOpen(false)}
          onBack={() => { setCanvasChoiceOpen(false); setSelectConnectionOpen(true); }}
          onChooseNew={() => { setCanvasChoiceOpen(false); openEmptyCanvas(); }}
          /*
            ⚠️ **Old canvas has nowhere to go.** It used to *be* the model-type modal,
            so with that modal moving to the front of the flow there is no old-canvas
            destination in this prototype. Closing is the honest placeholder — it does
            not pretend to open something that doesn't exist. Needs a decision.
          */
          onChooseOld={() => setCanvasChoiceOpen(false)}
        />
      )}
    </>
  );
};

const DataStudioMVPRoot: React.FC = () => (
  /* Above Shell and the canvas both: what a model's cache consists of has to outlive
     the canvas, so the model listing and the model's Caching tab can read what was
     set. This is the **model** cache — the performance one on a saved model, after
     the model is ready. Canvas caching is not in this prototype. */
  <CacheProvider>
    <ModelCacheProvider>
      <DataStudioMVP />
    </ModelCacheProvider>
  </CacheProvider>
);

export default DataStudioMVPRoot;
