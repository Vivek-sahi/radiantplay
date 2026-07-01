// ─────────────────────────────────────────────────────────────────────────────
// Execution kernel — real in-browser compute for the Hex notebook.
//
//   • SQL   → DuckDB-WASM over the seeded Customer Health tables
//   • Python → Pyodide (real CPython + pandas), booted lazily on first use
//   • Bridge → SQL results flow into Python as pandas DataFrames and back;
//              Python/derived dataframes can be queried by SQL (source: dataframes)
//
// The kernel only executes. Dependency tracking / staleness lives in the React
// container (see deps.ts). Self-contained; touches no existing DataStudio code.
// ─────────────────────────────────────────────────────────────────────────────

import * as duckdb from '@duckdb/duckdb-wasm';
import type { CellColumn, CellOutput, DataFrame } from './types';
import { SEED_TABLES } from './seed';

const PYODIDE_VERSION = '0.27.2';
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const DISPLAY_ROW_CAP = 200;

// A notebook variable produced by a cell.
export interface KernelVar {
  kind: 'dataframe' | 'scalar';
  records?: DataFrame;          // dataframe rows (full, not capped)
  columns?: CellColumn[];
  value?: number | string | boolean | null; // scalar
  native?: boolean;             // already a real DuckDB table (CSV/seed) — don't re-register as a view
}

export type KernelStatus = 'cold' | 'booting-sql' | 'booting-python' | 'ready';

// Convert Arrow / BigInt values into plain JSON-friendly values.
function sanitize(v: unknown): unknown {
  if (typeof v === 'bigint') return Number(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (Array.isArray(v)) return v.map(sanitize);
  if (v && typeof v === 'object') {
    // Arrow row objects expose toJSON; plain objects fall through
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>)) o[k] = sanitize((v as Record<string, unknown>)[k]);
    return o;
  }
  return v;
}

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-hex="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.dataset.hex = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

class HexKernel {
  private db: duckdb.AsyncDuckDB | null = null;
  private conn: duckdb.AsyncDuckDBConnection | null = null;
  private pyodide: any = null;
  private sqlBootPromise: Promise<void> | null = null;
  private pyBootPromise: Promise<void> | null = null;
  private registeredViews = new Set<string>();

  /** Notebook variable store (cell.name → value). */
  vars = new Map<string, KernelVar>();

  status: KernelStatus = 'cold';
  onStatusChange?: (s: KernelStatus) => void;

  private setStatus(s: KernelStatus) {
    this.status = s;
    this.onStatusChange?.(s);
  }

  // ── DuckDB ────────────────────────────────────────────────────────────────
  async ensureSql(): Promise<void> {
    if (this.conn) return;
    if (this.sqlBootPromise) return this.sqlBootPromise;
    this.sqlBootPromise = (async () => {
      this.setStatus('booting-sql');
      const bundles = duckdb.getJsDelivrBundles();
      const bundle = await duckdb.selectBundle(bundles);
      const workerUrl = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' }),
      );
      const worker = new Worker(workerUrl);
      const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.ERROR);
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      URL.revokeObjectURL(workerUrl);
      const conn = await db.connect();
      this.db = db;
      this.conn = conn;
      // Seed the warehouse tables.
      for (const t of SEED_TABLES) {
        await db.registerFileText(`${t.name}.json`, JSON.stringify(t.records));
        await conn.query(
          `CREATE OR REPLACE TABLE ${t.name} AS SELECT * FROM read_json_auto('${t.name}.json')`,
        );
      }
      this.setStatus('ready');
    })();
    return this.sqlBootPromise;
  }

  // ── Pyodide ─────────────────────────────────────────────────────────────────
  async ensurePython(): Promise<void> {
    if (this.pyodide) return;
    if (this.pyBootPromise) return this.pyBootPromise;
    this.pyBootPromise = (async () => {
      this.setStatus('booting-python');
      await loadScriptOnce(`${PYODIDE_BASE}pyodide.js`);
      const loadPyodide = (window as any).loadPyodide;
      const py = await loadPyodide({ indexURL: PYODIDE_BASE });
      await py.loadPackage(['pandas', 'numpy']);
      // Helper used to serialize Python results back to JS.
      await py.runPythonAsync(`
import pandas as pd, numpy as np, json
def _hexdef(o):
    if hasattr(o, 'item'):
        try: return o.item()
        except Exception: pass
    return None if o is None else str(o)
def __hex_serialize(obj, cap=${DISPLAY_ROW_CAP}):
    if isinstance(obj, pd.DataFrame):
        df = obj.replace({np.nan: None})
        return json.dumps({'kind':'table',
                           'columns':[str(c) for c in df.columns],
                           'records': df.head(cap).to_dict('records'),
                           'rowcount': int(len(df))}, default=_hexdef)
    if isinstance(obj, pd.Series):
        s = obj.replace({np.nan: None})
        return json.dumps({'kind':'table',
                           'columns':['index','value'],
                           'records':[{'index':str(i),'value':(v.item() if hasattr(v,'item') else v)} for i,v in s.head(cap).items()],
                           'rowcount': int(len(s))}, default=_hexdef)
    if isinstance(obj, (np.integer,)): return json.dumps({'kind':'scalar','value':int(obj)})
    if isinstance(obj, (np.floating,)): return json.dumps({'kind':'scalar','value':float(obj)})
    if obj is None or isinstance(obj, (int, float, str, bool)):
        return json.dumps({'kind':'scalar','value':obj})
    return json.dumps({'kind':'text','value':repr(obj)}, default=_hexdef)
`);
      this.pyodide = py;
      this.setStatus('ready');
    })();
    return this.pyBootPromise;
  }

  // Register a notebook dataframe var as a DuckDB view (for SQL over dataframes).
  private async registerVarAsView(name: string, v: KernelVar) {
    if (!this.db || !this.conn || v.kind !== 'dataframe' || !v.records) return;
    if (v.native) return; // already a real DuckDB table (CSV/seed)
    await this.db.registerFileText(`__var_${name}.json`, JSON.stringify(v.records));
    await this.conn.query(
      `CREATE OR REPLACE VIEW ${name} AS SELECT * FROM read_json_auto('__var_${name}.json')`,
    );
    this.registeredViews.add(name);
  }

  // ── Load a CSV (real file or bundled sample) into a DuckDB table + dataframe var ──
  async loadCsv(name: string, csvText: string): Promise<CellOutput> {
    const t0 = performance.now();
    try {
      await this.ensureSql();
      const file = `__csv_${name}.csv`;
      await this.db!.registerFileText(file, csvText);
      await this.conn!.query(`CREATE OR REPLACE TABLE ${name} AS SELECT * FROM read_csv_auto('${file}', header=true)`);
      const res = await this.conn!.query(`SELECT * FROM ${name}`);
      const columns: CellColumn[] = res.schema.fields.map((f: any) => ({ name: f.name, type: String(f.type) }));
      const allRows = res.toArray().map((r: any) => sanitize(r.toJSON()) as Record<string, unknown>);
      this.vars.set(name, { kind: 'dataframe', records: allRows, columns, native: true });
      return {
        kind: 'table', columns,
        rows: allRows.slice(0, DISPLAY_ROW_CAP), rowCount: allRows.length,
        truncated: allRows.length > DISPLAY_ROW_CAP, elapsedMs: Math.round(performance.now() - t0),
      };
    } catch (e: any) {
      return { kind: 'error', error: String(e?.message ?? e), elapsedMs: Math.round(performance.now() - t0) };
    }
  }

  // ── Run SQL ──────────────────────────────────────────────────────────────────
  async runSql(
    sql: string,
    opts: { source: string; returnMode: 'dataframe' | 'query'; outputName: string },
  ): Promise<CellOutput> {
    const t0 = performance.now();
    try {
      await this.ensureSql();
      // Expose current dataframe variables as views so SQL can query them.
      for (const [name, v] of this.vars) {
        if (v.kind === 'dataframe') await this.registerVarAsView(name, v);
      }
      const limited = opts.returnMode === 'query' && !/limit\s+\d+/i.test(sql)
        ? `SELECT * FROM (${sql.replace(/;\s*$/, '')}) LIMIT 1000`
        : sql;
      const res = await this.conn!.query(limited);
      const columns: CellColumn[] = res.schema.fields.map((f: any) => ({
        name: f.name,
        type: String(f.type),
      }));
      const allRows = res.toArray().map((r: any) => sanitize(r.toJSON()) as Record<string, unknown>);
      const elapsedMs = Math.round(performance.now() - t0);
      // Store the full result as a notebook variable (dataframe mode).
      if (opts.returnMode === 'dataframe' && opts.outputName) {
        this.vars.set(opts.outputName, { kind: 'dataframe', records: allRows, columns });
      }
      return {
        kind: 'table',
        columns,
        rows: allRows.slice(0, DISPLAY_ROW_CAP),
        rowCount: allRows.length,
        truncated: allRows.length > DISPLAY_ROW_CAP,
        elapsedMs,
      };
    } catch (e: any) {
      return { kind: 'error', error: String(e?.message ?? e), elapsedMs: Math.round(performance.now() - t0) };
    }
  }

  // ── Run Python ────────────────────────────────────────────────────────────────
  async runPython(
    code: string,
    opts: { inputs: string[]; outputName: string },
  ): Promise<CellOutput> {
    const t0 = performance.now();
    let stdout = '';
    try {
      await this.ensurePython();
      const py = this.pyodide;
      // Inject referenced notebook variables into the Python namespace.
      const dfInputs: Record<string, DataFrame> = {};
      for (const name of opts.inputs) {
        const v = this.vars.get(name);
        if (!v) continue;
        if (v.kind === 'dataframe' && v.records) dfInputs[name] = v.records;
        else if (v.kind === 'scalar') py.globals.set(name, v.value as any);
      }
      py.globals.set('__hex_in', py.toPy(dfInputs));
      await py.runPythonAsync(`
import pandas as pd
__hex_in = dict(__hex_in)
for __k in list(__hex_in.keys()):
    globals()[__k] = pd.DataFrame(__hex_in[__k])
del __hex_in
`);
      py.setStdout({ batched: (s: string) => { stdout += s; } });
      const resultProxy = await py.runPythonAsync(code);
      py.setStdout({});

      // Display = serialize the last-expression value.
      let out: CellOutput = { kind: 'none', stdout: stdout || undefined };
      if (resultProxy !== undefined && resultProxy !== null) {
        py.globals.set('__hex_disp', resultProxy);
        const json = await py.runPythonAsync(`__hex_serialize(__hex_disp)`);
        out = this.fromSerialized(JSON.parse(json), stdout);
        if (resultProxy?.destroy) resultProxy.destroy();
      }

      // Export the variable named after the cell (if it exists) for downstream cells.
      if (opts.outputName && /^[A-Za-z_][A-Za-z0-9_]*$/.test(opts.outputName)) {
        const exportJson = await py.runPythonAsync(
          `__hex_serialize(${opts.outputName}) if ('${opts.outputName}' in dir() and not callable(globals().get('${opts.outputName}'))) else 'null'`,
        );
        const parsed = JSON.parse(exportJson);
        if (parsed && parsed.kind === 'table') {
          this.vars.set(opts.outputName, {
            kind: 'dataframe',
            records: parsed.records,
            columns: (parsed.columns as string[]).map(c => ({ name: c, type: 'inferred' })),
          });
          // if no last-expression display, show the exported df
          if (out.kind === 'none') out = this.fromSerialized(parsed, stdout);
        } else if (parsed && parsed.kind === 'scalar') {
          this.vars.set(opts.outputName, { kind: 'scalar', value: parsed.value });
        }
      }
      out.elapsedMs = Math.round(performance.now() - t0);
      return out;
    } catch (e: any) {
      try { this.pyodide?.setStdout({}); } catch { /* noop */ }
      const msg = String(e?.message ?? e).split('\n').filter(Boolean).slice(-6).join('\n');
      return { kind: 'error', error: msg, stdout: stdout || undefined, elapsedMs: Math.round(performance.now() - t0) };
    }
  }

  private fromSerialized(parsed: any, stdout: string): CellOutput {
    if (parsed.kind === 'table') {
      return {
        kind: 'table',
        columns: (parsed.columns as string[]).map(c => ({ name: c, type: 'inferred' })),
        rows: parsed.records as DataFrame,
        rowCount: parsed.rowcount,
        truncated: parsed.rowcount > (parsed.records?.length ?? 0),
        stdout: stdout || undefined,
      };
    }
    if (parsed.kind === 'scalar') return { kind: 'scalar', scalar: parsed.value, stdout: stdout || undefined };
    return { kind: 'text', scalar: parsed.value, stdout: stdout || undefined };
  }

  // Set a scalar variable (used by input cells) immediately.
  setScalar(name: string, value: number | string | boolean | null) {
    this.vars.set(name, { kind: 'scalar', value });
  }

  getVar(name: string): KernelVar | undefined {
    return this.vars.get(name);
  }

  clearVar(name: string) {
    this.vars.delete(name);
  }

  listVars(): string[] {
    return [...this.vars.keys()];
  }
}

// Singleton — one kernel per page session.
export const kernel = new HexKernel();
