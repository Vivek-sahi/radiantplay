// ─────────────────────────────────────────────────────────────────────────────
// Reactive dependency graph helpers.
//
// Hex maps relationships between cells into a graph: a cell that reads variable X
// depends on whichever cell produced X. Editing/re-running an upstream cell marks
// everything downstream stale. These pure helpers derive that graph from cell
// definitions; the container applies them.
// ─────────────────────────────────────────────────────────────────────────────

import type { Cell } from './types';

const IDENT = /[A-Za-z_][A-Za-z0-9_]*/g;
const SQL_KEYWORDS = new Set([
  'select', 'from', 'where', 'join', 'left', 'right', 'inner', 'outer', 'full', 'on', 'and', 'or',
  'group', 'by', 'order', 'having', 'as', 'count', 'sum', 'avg', 'min', 'max', 'distinct', 'case',
  'when', 'then', 'else', 'end', 'null', 'is', 'not', 'in', 'like', 'limit', 'with', 'union', 'all',
  'asc', 'desc', 'over', 'partition', 'cast', 'coalesce', 'filter', 'create', 'table', 'view',
]);

// Which known variable names appear as identifiers in a piece of code.
export function deriveCodeInputs(code: string, knownVars: string[], self: string): string[] {
  if (!code) return [];
  const known = new Set(knownVars.filter(v => v !== self));
  const found = new Set<string>();
  const matches = code.match(IDENT) ?? [];
  for (const m of matches) {
    if (SQL_KEYWORDS.has(m.toLowerCase())) continue;
    if (known.has(m)) found.add(m);
  }
  return [...found];
}

// Compute the input variable list for any cell type.
export function computeInputs(cell: Cell, knownVars: string[]): string[] {
  switch (cell.type) {
    case 'sql':
    case 'python':
      return deriveCodeInputs(cell.code, knownVars, cell.name);
    case 'chart':
      return cell.sourceVar ? [cell.sourceVar] : [];
    case 'single-value':
      return cell.sourceVar ? [cell.sourceVar] : [];
    case 'pivot':
      return cell.sourceVar ? [cell.sourceVar] : [];
    case 'markdown': {
      const refs = [...cell.markdown.matchAll(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g)].map(m => m[1]);
      return refs.filter(r => knownVars.includes(r) && r !== cell.name);
    }
    case 'input':
      return cell.optionsFromVar ? [cell.optionsFromVar] : [];
    default:
      return [];
  }
}

// Variable a cell produces, if any (used to build the graph).
export function cellOutputVar(cell: Cell): string | null {
  switch (cell.type) {
    case 'sql':
      return cell.returnMode === 'dataframe' ? cell.name : null;
    case 'python':
    case 'pivot':
    case 'input':
    case 'single-value':
    case 'csv':
      return cell.name;
    default:
      return null; // chart, markdown produce no notebook variable
  }
}

// Map of variable name → producing cell id.
export function producerMap(cells: Cell[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const c of cells) {
    const v = cellOutputVar(c);
    if (v) m.set(v, c.id);
  }
  return m;
}

// All cells transitively downstream of the given cell (consumers of its output, recursively).
export function downstreamOf(cellId: string, cells: Cell[]): Set<string> {
  const byId = new Map(cells.map(c => [c.id, c]));
  const result = new Set<string>();
  const stack = [cellId];
  while (stack.length) {
    const cur = stack.pop()!;
    const curCell = byId.get(cur);
    if (!curCell) continue;
    const outVar = cellOutputVar(curCell);
    if (!outVar) continue;
    for (const c of cells) {
      if (c.id === cur) continue;
      if (c.inputs.includes(outVar) && !result.has(c.id)) {
        result.add(c.id);
        stack.push(c.id);
      }
    }
  }
  return result;
}

// Edges of the DAG, for the graph view: [fromCellId, toCellId].
export function graphEdges(cells: Cell[]): [string, string][] {
  const producers = producerMap(cells);
  const edges: [string, string][] = [];
  for (const c of cells) {
    for (const v of c.inputs) {
      const from = producers.get(v);
      if (from && from !== c.id) edges.push([from, c.id]);
    }
  }
  return edges;
}
