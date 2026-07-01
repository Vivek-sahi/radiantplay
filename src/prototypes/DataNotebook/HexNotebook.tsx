import React, { useCallback, useEffect, useRef, useState } from 'react';
import { c, ff, fw } from './styles';
import type { Cell, CellType, AgentMessage, SqlSourceId } from './types';
import { kernel, type KernelStatus } from './kernel';
import { SEED_TABLES, getSeedTable, SAMPLE_CSV } from './seed';
import { computeInputs, downstreamOf, cellOutputVar } from './deps';
import { pivotTable, aggValue, type Agg } from './agg';
import NotebookCanvas from './components/NotebookCanvas';
import AgentRail from './components/AgentRail';
import GraphView from './components/GraphView';
import DataBrowserModal from './components/DataBrowserModal';
import SpotterPanel from './components/SpotterPanel';
import { HexKeyframes } from './components/ui';
import type { VarInfo } from './components/Cell';
import { getScenario, type NewCellSpec, type ScenarioId, type Scenario } from './agentScript';

interface HexNotebookProps {
  onBack: () => void;
  scenarioId: ScenarioId | null;   // null → free-form / manual notebook
  initialPrompt: string;
}

// Pseudo-scenario for the free-form / manual path (no scripted build).
const MANUAL_SCENARIO: Scenario = {
  id: 's1', name: 'Notebook', blurb: '', sources: 'Notebook',
  prompt: '', searchHits: [], planSteps: [], cells: [], followups: [],
};

// ── id / naming helpers ─────────────────────────────────────────────────────────
let _idc = 0;
const uid = () => `c${++_idc}_${(_idc * 2654435761) % 100000}`;
const NAME_BASE: Record<CellType, string> = { sql: 'query', python: 'df', chart: 'chart', input: 'param', 'single-value': 'metric', pivot: 'pivot', csv: 'data', markdown: 'text' };

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Build a fresh cell of a given type with sensible defaults.
function defaultCell(type: CellType, name: string, firstVar: string): Cell {
  const base = { id: uid(), name, status: 'idle' as const, inputs: [] as string[] };
  switch (type) {
    case 'sql': return { ...base, type, source: 'sf_prod_customer', returnMode: 'dataframe', code: 'SELECT *\nFROM dim_accounts\nLIMIT 100' };
    case 'python': return { ...base, type, code: '# pandas is available; reference upstream dataframes by name\n' };
    case 'chart': return { ...base, type, sourceVar: firstVar, chartType: 'bar', x: '', y: '', agg: 'sum' };
    case 'input': return { ...base, type, inputKind: 'slider', label: 'Parameter', value: 0.5, min: 0, max: 1, step: 0.05 };
    case 'single-value': return { ...base, type, sourceVar: firstVar, column: '', agg: 'count', format: 'number' };
    case 'pivot': return { ...base, type, sourceVar: firstVar, groupBy: [], values: [{ column: '', agg: 'count' }] };
    case 'csv': return { ...base, type, loaded: false };
    case 'markdown': return { ...base, type, markdown: '' };
  }
}

function cellFromSpec(spec: NewCellSpec): Cell {
  const base = { id: uid(), name: spec.name, status: 'idle' as const, inputs: [] as string[] };
  switch (spec.type) {
    case 'sql': return { ...base, type: 'sql', source: spec.source ?? 'sf_prod_customer', returnMode: spec.returnMode ?? 'dataframe', code: spec.code ?? '' };
    case 'python': return { ...base, type: 'python', code: spec.code ?? '' };
    case 'chart': return { ...base, type: 'chart', sourceVar: spec.sourceVar ?? '', chartType: spec.chartType ?? 'bar', x: spec.x ?? '', y: spec.y ?? '', agg: (spec.agg ?? 'sum'), series: spec.series };
    case 'input': return { ...base, type: 'input', inputKind: spec.inputKind ?? 'slider', label: spec.label ?? 'Parameter', value: spec.value ?? 0, min: spec.min, max: spec.max, step: spec.step, options: spec.options };
    case 'single-value': return { ...base, type: 'single-value', sourceVar: spec.sourceVar ?? '', column: spec.column ?? '', agg: (spec.agg as any) ?? 'count', format: spec.format ?? 'number', caption: spec.caption };
    case 'pivot': return { ...base, type: 'pivot', sourceVar: spec.sourceVar ?? '', groupBy: spec.groupBy ?? [], values: (spec.values as { column: string; agg: 'sum' | 'avg' | 'count' | 'min' | 'max' }[]) ?? [{ column: '', agg: 'count' }] };
    case 'csv': return { ...base, type: 'csv', loaded: false, fileName: spec.fileName };
    case 'markdown': return { ...base, type: 'markdown', markdown: spec.markdown ?? '' };
  }
}

const HexNotebook: React.FC<HexNotebookProps> = ({ onBack, scenarioId, initialPrompt }) => {
  const scenario = scenarioId ? getScenario(scenarioId) : MANUAL_SCENARIO;
  const isManual = scenarioId === null;
  const [cells, setCells] = useState<Cell[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [view, setView] = useState<'notebook' | 'graph'>('notebook');
  const [busy, setBusy] = useState(false);
  const [bootHint, setBootHint] = useState<string | null>(null);
  const [draft, setDraft] = useState(isManual ? '' : initialPrompt);
  const seededRef = useRef(false);
  const [model, setModel] = useState('Claude Sonnet 4');
  const [effort, setEffort] = useState('Auto');
  const [dataBrowserOpen, setDataBrowserOpen] = useState(false);
  const [spotterOpen, setSpotterOpen] = useState(false);
  const [, setTick] = useState(0);
  const [kStatus, setKStatus] = useState<KernelStatus>('cold');
  const cellsRef = useRef<Cell[]>([]);
  cellsRef.current = cells;
  const runSeq = useRef(0);

  const bump = () => setTick(t => t + 1);

  // Boot DuckDB eagerly; reflect kernel status.
  useEffect(() => {
    kernel.onStatusChange = (s) => setKStatus(s);
    kernel.ensureSql().catch(() => {/* surfaced per-cell */});
    return () => { kernel.onStatusChange = undefined; };
  }, []);

  // dataframe vars selectable as chart/pivot/single-value sources
  const dataframeVarNames = useCallback((): string[] => {
    const kernelDfs = kernel.listVars().filter(n => kernel.getVar(n)?.kind === 'dataframe');
    const seedNames = SEED_TABLES.map(t => t.name);
    return [...new Set([...kernelDfs, ...seedNames])];
  }, []);

  const resolveVar = useCallback((name: string): VarInfo | undefined => {
    const v = kernel.getVar(name);
    if (v && v.kind === 'dataframe' && v.records) return { records: v.records, columns: v.columns?.map(c => c.name) ?? Object.keys(v.records[0] ?? {}) };
    const seed = getSeedTable(name);
    if (seed) return { records: seed.records, columns: seed.columns.map(c => c.name) };
    return undefined;
  }, []);

  // recompute inputs for all cells given the current variable universe
  const withRecomputedInputs = (list: Cell[]): Cell[] => {
    const known = (() => {
      const fromSeed = SEED_TABLES.map(t => t.name);
      const fromCells = list.map(cellOutputVar).filter((v): v is string => !!v);
      const fromKernel = kernel.listVars();
      return [...new Set([...fromSeed, ...fromCells, ...fromKernel])];
    })();
    return list.map(cell => ({ ...cell, inputs: computeInputs(cell, known) }));
  };

  // ── run a single cell against the kernel ───────────────────────────────────────
  const executeCell = async (cell: Cell): Promise<Cell> => {
    if (cell.type === 'sql') {
      const out = await kernel.runSql(cell.code, { source: cell.source, returnMode: cell.returnMode, outputName: cell.name });
      return { ...cell, output: out, status: out.kind === 'error' ? 'error' : 'success' };
    }
    if (cell.type === 'python') {
      const out = await kernel.runPython(cell.code, { inputs: cell.inputs, outputName: cell.name });
      return { ...cell, output: out, status: out.kind === 'error' ? 'error' : 'success' };
    }
    if (cell.type === 'pivot') {
      const info = resolveVar(cell.sourceVar);
      if (!info) return { ...cell, status: 'error', output: { kind: 'error', error: `Unknown source dataframe "${cell.sourceVar}"` } };
      const t0 = performance.now();
      const { columns, rows } = pivotTable(info.records, cell.groupBy.filter(Boolean), cell.values.filter(v => v.column));
      kernel.vars.set(cell.name, { kind: 'dataframe', records: rows, columns });
      return { ...cell, status: 'success', output: { kind: 'table', columns, rows: rows.slice(0, 200), rowCount: rows.length, elapsedMs: Math.round(performance.now() - t0) } };
    }
    if (cell.type === 'single-value') {
      const info = resolveVar(cell.sourceVar);
      if (!info) return { ...cell, status: 'error', output: { kind: 'error', error: `Unknown source dataframe "${cell.sourceVar}"` } };
      const val = aggValue(info.records, cell.column, cell.agg as Agg);
      kernel.setScalar(cell.name, val);
      return { ...cell, status: 'success', output: { kind: 'scalar', scalar: val } };
    }
    if (cell.type === 'input') {
      // an input cell publishes its value as a scalar variable for downstream cells
      kernel.setScalar(cell.name, cell.value);
      return { ...cell, status: 'success' };
    }
    return cell;
  };

  // run one cell (and refresh downstream stale flags)
  const runCell = useCallback(async (id: string, cascade = true) => {
    const cell = cellsRef.current.find(x => x.id === id);
    if (!cell) return;
    setCells(prev => prev.map(x => x.id === id ? { ...x, status: 'running' } : x));
    const ran = await executeCell({ ...cell });
    setCells(prev => prev.map(x => x.id === id ? ran : x));
    bump();
    if (cascade) await runDownstream(id);
  }, []);

  const runDownstream = async (id: string) => {
    const set = downstreamOf(id, cellsRef.current);
    if (set.size === 0) return;
    // run in notebook order (upstream-before-downstream holds for typical layouts)
    const ordered = cellsRef.current.filter(x => set.has(x.id) && (x.type === 'sql' || x.type === 'python' || x.type === 'pivot' || x.type === 'single-value'));
    for (const x of ordered) {
      setCells(prev => prev.map(p => p.id === x.id ? { ...p, status: 'running' } : p));
      const fresh = cellsRef.current.find(p => p.id === x.id)!;
      const ran = await executeCell({ ...fresh });
      setCells(prev => prev.map(p => p.id === x.id ? ran : p));
      bump();
    }
  };

  const runAll = async () => {
    for (const cell of cellsRef.current) {
      if (cell.type === 'sql' || cell.type === 'python' || cell.type === 'pivot' || cell.type === 'single-value') {
        // eslint-disable-next-line no-await-in-loop
        await runCell(cell.id, false);
      }
    }
  };

  // Parse a CSV (real file text or the bundled sample) into the kernel + this cell.
  const loadCsvIntoCell = useCallback(async (id: string, fileName: string, text: string) => {
    const cell = cellsRef.current.find(x => x.id === id);
    if (!cell || cell.type !== 'csv') return;
    const csvText = text === '__sample__' ? SAMPLE_CSV.text : text;
    setCells(prev => prev.map(x => x.id === id ? { ...x, status: 'running', fileName } : x));
    const out = await kernel.loadCsv(cell.name, csvText);
    setCells(prev => withRecomputedInputs(prev.map(x => x.id === id
      ? { ...x, output: out, loaded: out.kind !== 'error', fileName, status: out.kind === 'error' ? 'error' : 'success' }
      : x)));
    bump();
    await runDownstream(id);
  }, []);

  // ── edits ──────────────────────────────────────────────────────────────────────
  const updateCell = useCallback((id: string, patch: Partial<Cell>) => {
    setCells(prev => {
      let next = prev.map(x => x.id === id ? { ...x, ...patch } as Cell : x);
      // mark edited execution cell + its downstream stale when code/source/config changes
      const touched = next.find(x => x.id === id)!;
      const codey = 'code' in patch || 'source' in patch || 'returnMode' in patch || 'sourceVar' in patch || 'groupBy' in patch || 'values' in patch || 'name' in patch || 'agg' in patch || 'column' in patch;
      if (codey && (touched.status === 'success' || touched.status === 'error')) {
        next = next.map(x => x.id === id ? { ...x, status: 'stale' } : x);
      }
      next = withRecomputedInputs(next);
      const ds = downstreamOf(id, next);
      next = next.map(x => ds.has(x.id) && (x.status === 'success') ? { ...x, status: 'stale' } : x);
      return next;
    });

    // input change → set scalar immediately + reactively re-run downstream
    const cell = cellsRef.current.find(x => x.id === id);
    if (cell?.type === 'input' && 'value' in patch) {
      kernel.setScalar(cell.name, patch.value as any);
      setTimeout(() => runDownstream(id), 0);
    }
  }, []);

  const addCell = useCallback((type: CellType, afterIndex: number) => {
    const firstVar = dataframeVarNames()[0] ?? '';
    // unique default name
    const existing = new Set(cellsRef.current.map(c => c.name));
    let n = 1; let name = `${NAME_BASE[type]}_${n}`;
    while (existing.has(name)) { n++; name = `${NAME_BASE[type]}_${n}`; }
    const cell = defaultCell(type, name, firstVar);
    if (cell.type === 'input') kernel.setScalar(cell.name, cell.value); // publish immediately
    setCells(prev => {
      const next = [...prev];
      next.splice(afterIndex + 1, 0, cell);
      return withRecomputedInputs(next);
    });
  }, [dataframeVarNames]);

  const deleteCell = useCallback((id: string) => {
    const cell = cellsRef.current.find(x => x.id === id);
    if (cell) { const v = cellOutputVar(cell); if (v) kernel.clearVar(v); }
    setCells(prev => withRecomputedInputs(prev.filter(x => x.id !== id)));
  }, []);

  const scrollToCell = (id: string) => {
    setView('notebook');
    setTimeout(() => document.getElementById(`hexcell-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  };

  // ── agent message helpers ────────────────────────────────────────────────────
  const pushMsg = (m: AgentMessage) => setMessages(prev => [...prev, m]);
  const patchMsg = (id: string, patch: Partial<AgentMessage>) => setMessages(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));

  // ── scripted build playback ────────────────────────────────────────────────────
  const playBuild = async (userText: string) => {
    const seq = ++runSeq.current;
    const alive = () => seq === runSeq.current;
    setBusy(true);
    pushMsg({ id: uid(), role: 'user', text: userText });

    // 1) agentic search
    const searchId = uid();
    pushMsg({ id: searchId, role: 'agent', kind: 'search', searchHits: scenario.searchHits, streaming: true });
    setBootHint('Searching data sources…');
    await kernel.ensureSql();
    await sleep(1100); if (!alive()) return;
    patchMsg(searchId, { streaming: false });

    // 2) plan
    await sleep(350); if (!alive()) return;
    pushMsg({ id: uid(), role: 'agent', text: `Found ${scenario.searchHits.length} relevant ${scenario.searchHits.length === 1 ? 'table' : 'tables'} for the “${scenario.name}” setup. Here’s how I’ll assemble it:` });
    const planId = uid();
    const plan = scenario.planSteps.map(label => ({ label, done: false }));
    pushMsg({ id: planId, role: 'agent', plan });
    await sleep(700); if (!alive()) return;

    // 3) stream cells in, running each for real
    setBootHint(null);
    for (const spec of scenario.cells) {
      if (!alive()) return;
      const cell = cellFromSpec(spec);
      // narration + cell reference
      pushMsg({ id: uid(), role: 'agent', text: spec.narration, cellRef: { cellId: cell.id, cellType: cell.type, cellName: cell.name } });
      await sleep(450); if (!alive()) return;
      // insert cell (animated)
      setCells(prev => withRecomputedInputs([...prev, { ...cell, appearing: true }]));
      await sleep(360); if (!alive()) return;
      setCells(prev => prev.map(x => x.id === cell.id ? { ...x, appearing: false } : x));
      // python kernel boot hint on first python cell
      if (cell.type === 'python' && !kernel.listVars().some(() => false)) setBootHint('Starting Python kernel (pandas)…');
      // run / load it for real
      if (cell.type === 'csv') await loadCsvIntoCell(cell.id, cell.fileName ?? 'data.csv', '__sample__');
      else await runCell(cell.id, false);
      setBootHint(null);
      if (!alive()) return;
      // mark plan step done
      if (spec.planIndex >= 0) {
        setMessages(prev => prev.map(m => m.id === planId && m.plan ? { ...m, plan: m.plan.map((p, i) => i === spec.planIndex ? { ...p, done: true } : p) } : m));
      }
      await sleep(250);
    }

    // 4) summary
    if (!alive()) return;
    const avg = kernel.getVar('avg_health')?.value;
    const avgTxt = typeof avg === 'number' ? ` Average health is ${(avg * 100).toFixed(0)}%.` : '';
    pushMsg({ id: uid(), role: 'agent', summary: `Done — built from ${scenario.sources} and every cell is live.${avgTxt} Edit any cell and re-run, or ask me to chart a different cut (try “by tier” or “by CSM”).` });
    setBusy(false);
  };

  // follow-up handling after the build
  const handleFollowup = async (userText: string) => {
    const seq = ++runSeq.current;
    const alive = () => seq === runSeq.current;
    setBusy(true);
    pushMsg({ id: uid(), role: 'user', text: userText });
    await sleep(600); if (!alive()) return;
    const fu = scenario.followups.find(f => f.match.test(userText));
    if (fu && fu.cell) {
      const cell = cellFromSpec(fu.cell);
      pushMsg({ id: uid(), role: 'agent', text: fu.reply, cellRef: { cellId: cell.id, cellType: cell.type, cellName: cell.name } });
      setCells(prev => withRecomputedInputs([...prev, { ...cell, appearing: true }]));
      await sleep(360); if (!alive()) return;
      setCells(prev => prev.map(x => x.id === cell.id ? { ...x, appearing: false } : x));
      if (cell.type === 'pivot' || cell.type === 'single-value') await runCell(cell.id, false);
      scrollToCell(cell.id);
    } else if (isManual) {
      pushMsg({ id: uid(), role: 'agent', text: 'This notebook is yours to drive — write SQL or Python in any cell and run it (⌘↵), drop a CSV into a CSV cell, or add a chart. Everything runs for real on DuckDB + Python.' });
    } else {
      const mainVar = scenario.followups[0]?.cell?.sourceVar ?? 'the result';
      pushMsg({ id: uid(), role: 'agent', text: `I can edit any cell, add SQL/Python, or chart a different cut of \`${mainVar}\`. Try “average health by tier” or “break down by CSM”.` });
    }
    setBusy(false);
  };

  const onSend = (text: string) => {
    setDraft('');
    // scripted build only for a chosen scenario on an empty notebook; otherwise free-form
    if (scenarioId && cellsRef.current.length === 0) playBuild(text);
    else handleFollowup(text);
  };

  // Free-form / manual entry: seed a starter cell + an honest intro, no scripted build.
  useEffect(() => {
    if (!isManual || seededRef.current) return;
    seededRef.current = true;
    const wantsCsv = /\bcsv\b/i.test(initialPrompt);
    const starter = wantsCsv ? defaultCell('csv', 'uploaded_data', '') : defaultCell('sql', 'query_1', '');
    setCells(withRecomputedInputs([starter]));
    if (initialPrompt) pushMsg({ id: uid(), role: 'user', text: initialPrompt });
    pushMsg({
      id: uid(), role: 'agent',
      text: wantsCsv
        ? 'Opened a notebook with a CSV cell — drop your file (or click to browse, or use the sample) and it loads straight into DuckDB. Then write SQL or Python against it, or ask me to chart it.'
        : 'Opened a notebook with a SQL cell to get you started — edit it and run with ⌘↵, or add Python / CSV / chart cells. Everything runs for real.',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const newThread = () => {
    runSeq.current++;
    setMessages([]);
    setBusy(false);
    setDraft('');
  };

  const queryTable = (tableName: string, source: string) => {
    setDataBrowserOpen(false);
    const existing = new Set(cellsRef.current.map(c => c.name));
    let n = 1; let name = `query_${n}`;
    while (existing.has(name)) { n++; name = `query_${n}`; }
    const cell = defaultCell('sql', name, '') as Extract<Cell, { type: 'sql' }>;
    cell.code = `SELECT *\nFROM ${tableName}\nLIMIT 100`;
    cell.source = (source as SqlSourceId) ?? 'sf_prod_customer';
    setCells(prev => withRecomputedInputs([...prev, cell]));
    setView('notebook');
    setTimeout(() => runCell(cell.id, false), 30);
  };

  // The publishable "model": a dataframe var with a health/score column (prefer the
  // scenario's main output), else the most recently produced dataframe.
  const findModel = (): (VarInfo & { name: string }) | null => {
    const names = kernel.listVars().filter(n => kernel.getVar(n)?.kind === 'dataframe');
    if (!names.length) return null;
    const prefer = ['customer_health', 'account_scored', 'nps_health'];
    const scored = names.filter(n => (resolveVar(n)?.columns ?? []).some(co => /health|score/i.test(co)));
    const pick = prefer.find(p => names.includes(p)) ?? scored[0] ?? names[names.length - 1];
    const info = resolveVar(pick);
    return info ? { name: pick, ...info } : null;
  };
  const modelForPublish = findModel();

  // ── render ──────────────────────────────────────────────────────────────────────
  const kernelChip = (() => {
    if (kStatus === 'booting-sql') return { label: 'Starting DuckDB…', color: '#b45309', dot: '#f59e0b' };
    if (kStatus === 'booting-python') return { label: 'Starting Python…', color: '#b45309', dot: '#f59e0b' };
    if (kStatus === 'ready') return { label: 'Kernel ready', color: '#15803d', dot: '#16a34a' };
    return { label: 'Kernel idle', color: '#8a93a3', dot: '#cbd2dd' };
  })();

  return (
    <div style={{ position: 'fixed', inset: 0, background: c['background-sunken'], display: 'flex', flexDirection: 'column', fontFamily: ff.primary, zIndex: 60 }}>
      <HexKeyframes />
      {/* header */}
      <div style={{ height: 52, flexShrink: 0, background: c['background-base'], borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12 }}>
        <button onClick={onBack} style={iconBtn} title="Back to Data Studio">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: fw.semibold, color: c['content-primary'] }}>Customer Health Scorecard</span>
          <span style={{ fontSize: 11, color: '#aeb6c2', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 5, padding: '1px 6px' }}>{scenario.sources}</span>
        </div>

        {/* segmented Notebook / Graph */}
        <div style={{ marginLeft: 18, display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: 8, padding: 2 }}>
          {(['notebook', 'graph'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontFamily: ff.primary, fontSize: 12, fontWeight: fw.semibold, textTransform: 'capitalize',
              background: view === v ? c['background-base'] : 'transparent',
              color: view === v ? c['content-primary'] : c['content-secondary'],
              boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>{v}</button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: fw.medium, color: kernelChip.color }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: kernelChip.dot }} />{kernelChip.label}
          </span>
          <button onClick={() => setDataBrowserOpen(true)} style={ghostBtn}>Browse data</button>
          <button onClick={runAll} style={runAllBtn}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4.5 3.5L12 8L4.5 12.5V3.5Z" fill="currentColor"/></svg>
            Run all
          </button>
          {modelForPublish && (
            <button onClick={() => setSpotterOpen(true)} style={publishBtn} title={`Publish ${modelForPublish.name} and ask it questions`}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C8.4 4.8 11.2 7.6 14.5 8C11.2 8.4 8.4 11.2 8 14.5C7.6 11.2 4.8 8.4 1.5 8C4.8 7.6 7.6 4.8 8 1.5Z" fill="currentColor"/></svg>
              Publish &amp; ask Spotter
            </button>
          )}
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {view === 'notebook'
          ? <NotebookCanvas
              cells={cells}
              varNames={dataframeVarNames()}
              resolveVar={resolveVar}
              onChange={updateCell}
              onRun={runCell}
              onDelete={deleteCell}
              onAddCell={addCell}
              onLoadCsv={loadCsvIntoCell}
              onOpenDataBrowser={() => setDataBrowserOpen(true)}
            />
          : <GraphView cells={cells} onSelectCell={scrollToCell} />}

        <AgentRail
          messages={messages}
          busy={busy}
          bootHint={bootHint}
          draft={draft}
          onDraftChange={setDraft}
          onSend={onSend}
          onNewThread={newThread}
          model={model}
          onModelChange={setModel}
          effort={effort}
          onEffortChange={setEffort}
          onCellRefClick={scrollToCell}
        />
      </div>

      <DataBrowserModal open={dataBrowserOpen} onClose={() => setDataBrowserOpen(false)} onQueryTable={queryTable} />
      {modelForPublish && (
        <SpotterPanel open={spotterOpen} onClose={() => setSpotterOpen(false)} modelName={modelForPublish.name} records={modelForPublish.records} columns={modelForPublish.columns} />
      )}
    </div>
  );
};

const iconBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: c['content-secondary'], display: 'flex', alignItems: 'center', justifyContent: 'center' };
const ghostBtn: React.CSSProperties = { padding: '6px 12px', borderRadius: 8, border: `1px solid ${c['border-default']}`, background: c['background-base'], color: c['content-primary'], fontFamily: ff.primary, fontSize: 12.5, fontWeight: fw.medium, cursor: 'pointer' };
const runAllBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 8, border: 'none', background: c['content-brand'], color: '#fff', fontFamily: ff.primary, fontSize: 12.5, fontWeight: fw.semibold, cursor: 'pointer' };
const publishBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #2770EF, #6E56CF)', color: '#fff', fontFamily: ff.primary, fontSize: 12.5, fontWeight: fw.semibold, cursor: 'pointer' };

export default HexNotebook;
