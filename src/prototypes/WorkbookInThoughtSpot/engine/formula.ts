// A small spreadsheet formula engine for the Workbook prototype: enough Excel / Google Sheets
// to run the demo story, not a full engine. Parses A1 references ($ locks, ranges, whole
// columns, other sheets, named cells), arithmetic, comparisons, & and the functions in FUNCTIONS.

export type Value = number | string | boolean | null;
export class FormulaError {
  constructor(public code: '#REF!' | '#NAME?' | '#VALUE!' | '#DIV/0!' | '#N/A' | '#CYCLE!' | '#ERROR!', public detail = '') {}
  toString() { return this.code; }
}
export type Result = Value | FormulaError;

/** A reference to one cell or a range. Rows are sheet rows (row 1 is the header row). */
export interface Ref {
  sheet?: string;
  c1: number; r1: number | null; // r null = whole column
  c2: number; r2: number | null;
  absC1?: boolean; absR1?: boolean; absC2?: boolean; absR2?: boolean;
}

type Node =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'ref'; ref: Ref }
  | { t: 'name'; v: string }
  | { t: 'fn'; name: string; args: Node[] }
  | { t: 'un'; op: string; a: Node }
  | { t: 'bin'; op: string; a: Node; b: Node };

// ── Column letters ────────────────────────────────────────────────────────────

export const colLetter = (c: number): string => {
  let s = '';
  let n = c + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};
export const colIndex = (letters: string): number =>
  letters.toUpperCase().split('').reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1;

export const refText = (ref: Ref, currentSheet?: string): string => {
  const sheet = ref.sheet && ref.sheet !== currentSheet ? `${/\s/.test(ref.sheet) ? `'${ref.sheet}'` : ref.sheet}!` : '';
  const one = (c: number, r: number | null, ac?: boolean, ar?: boolean) =>
    `${ac ? '$' : ''}${colLetter(c)}${r === null ? '' : `${ar ? '$' : ''}${r}`}`;
  const a = one(ref.c1, ref.r1, ref.absC1, ref.absR1);
  const single = ref.c1 === ref.c2 && ref.r1 === ref.r2 && ref.r1 !== null;
  return sheet + (single ? a : `${a}:${one(ref.c2, ref.r2, ref.absC2, ref.absR2)}`);
};

// ── Tokenizer ─────────────────────────────────────────────────────────────────

type Tok = { k: 'num' | 'str' | 'ref' | 'id' | 'op' | 'lp' | 'rp' | 'comma'; v: string };

const REF_RE = /^(?:(?:'([^']+)'|([A-Za-z_][\w.]*))!)?(\$?[A-Za-z]{1,3})(\$?\d+)?(?::(\$?[A-Za-z]{1,3})(\$?\d+)?)?/;

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '"') {
      let j = i + 1; let s = '';
      while (j < src.length && src[j] !== '"') s += src[j++];
      out.push({ k: 'str', v: s }); i = j + 1; continue;
    }
    if (/[0-9.]/.test(ch)) {
      const m = /^\d*\.?\d+(?:[eE][-+]?\d+)?%?/.exec(src.slice(i))!;
      out.push({ k: 'num', v: m[0] }); i += m[0].length; continue;
    }
    if (ch === '(') { out.push({ k: 'lp', v: ch }); i++; continue; }
    if (ch === ')') { out.push({ k: 'rp', v: ch }); i++; continue; }
    if (ch === ',') { out.push({ k: 'comma', v: ch }); i++; continue; }
    const two = src.slice(i, i + 2);
    if (two === '<=' || two === '>=' || two === '<>') { out.push({ k: 'op', v: two }); i += 2; continue; }
    if ('+-*/^&=<>'.includes(ch)) { out.push({ k: 'op', v: ch }); i++; continue; }
    // a reference, a sheet-qualified reference, a function name or a named cell
    const rest = src.slice(i);
    const m = REF_RE.exec(rest);
    const idm = /^[A-Za-z_][\w.]*/.exec(rest);
    const isFn = idm && src[i + idm[0].length] === '(';
    if (m && !isFn && (m[4] || m[5] || m[1] || m[2] || /^\$?[A-Za-z]{1,3}:\$?[A-Za-z]{1,3}/.test(rest)) && (m[0].length >= (idm?.[0].length ?? 0))) {
      out.push({ k: 'ref', v: m[0] }); i += m[0].length; continue;
    }
    if (idm) { out.push({ k: 'id', v: idm[0] }); i += idm[0].length; continue; }
    if (ch === "'") { // quoted sheet name followed by a reference
      if (m) { out.push({ k: 'ref', v: m[0] }); i += m[0].length; continue; }
    }
    throw new FormulaError('#ERROR!', `Unexpected "${ch}"`);
  }
  return out;
}

export function parseRef(text: string): Ref | null {
  const m = REF_RE.exec(text);
  if (!m || m[0].length !== text.length) return null;
  const sheet = m[1] ?? m[2];
  const c1s = m[3]; const r1s = m[4]; const c2s = m[5] ?? c1s; const r2s = m[5] ? m[6] : r1s;
  if (!r1s && !m[5]) return null; // a bare "A" is not a reference
  const c = (s: string) => colIndex(s.replace('$', ''));
  const r = (s: string | undefined) => (s ? parseInt(s.replace('$', ''), 10) : null);
  return {
    sheet,
    c1: c(c1s), r1: r(r1s), c2: c(c2s), r2: r(r2s),
    absC1: c1s.startsWith('$'), absR1: !!r1s?.startsWith('$'), absC2: c2s.startsWith('$'), absR2: !!r2s?.startsWith('$'),
  };
}

// ── Parser (precedence: comparison < & < +- < */ < ^ < unary) ─────────────────

function parse(src: string): Node {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const take = () => toks[p++];
  const PREC: Record<string, number> = { '=': 1, '<>': 1, '<': 1, '>': 1, '<=': 1, '>=': 1, '&': 2, '+': 3, '-': 3, '*': 4, '/': 4, '^': 5 };
  const primary = (): Node => {
    const t = take();
    if (!t) throw new FormulaError('#ERROR!', 'The formula ends too soon');
    if (t.k === 'op' && (t.v === '-' || t.v === '+')) return { t: 'un', op: t.v, a: expr(6) };
    if (t.k === 'num') return t.v.endsWith('%') ? { t: 'num', v: parseFloat(t.v) / 100 } : { t: 'num', v: parseFloat(t.v) };
    if (t.k === 'str') return { t: 'str', v: t.v };
    if (t.k === 'lp') { const e = expr(0); if (take()?.k !== 'rp') throw new FormulaError('#ERROR!', 'Missing )'); return e; }
    if (t.k === 'ref') { const ref = parseRef(t.v); if (!ref) throw new FormulaError('#REF!'); return { t: 'ref', ref }; }
    if (t.k === 'id') {
      if (peek()?.k === 'lp') {
        take();
        const args: Node[] = [];
        if (peek()?.k !== 'rp') {
          for (;;) { args.push(expr(0)); if (peek()?.k === 'comma') { take(); continue; } break; }
        }
        if (take()?.k !== 'rp') throw new FormulaError('#ERROR!', 'Missing )');
        return { t: 'fn', name: t.v.toUpperCase(), args };
      }
      if (/^(TRUE|FALSE)$/i.test(t.v)) return { t: 'bool', v: t.v.toUpperCase() === 'TRUE' };
      return { t: 'name', v: t.v };
    }
    throw new FormulaError('#ERROR!', `Unexpected "${t.v}"`);
  };
  const expr = (min: number): Node => {
    let left = primary();
    for (;;) {
      const t = peek();
      if (!t || t.k !== 'op') break;
      const prec = PREC[t.v];
      if (prec === undefined || prec < min) break;
      take();
      const right = expr(t.v === '^' ? prec : prec + 1);
      left = { t: 'bin', op: t.v, a: left, b: right };
    }
    return left;
  };
  const node = expr(0);
  if (p < toks.length) throw new FormulaError('#ERROR!', `Unexpected "${toks[p].v}"`);
  return node;
}

const cache = new Map<string, Node | FormulaError>();
export function compile(src: string): Node | FormulaError {
  let n = cache.get(src);
  if (!n) {
    try { n = parse(src); } catch (e) { n = e instanceof FormulaError ? e : new FormulaError('#ERROR!'); }
    cache.set(src, n);
  }
  return n;
}

// ── Evaluation ────────────────────────────────────────────────────────────────

export interface EvalContext {
  sheet: string;
  /** Read a cell's value. Row is the sheet row (row 1 = headers). */
  get(sheet: string, col: number, row: number): Result;
  /** Last data row of a sheet, for whole-column references. */
  lastRow(sheet: string): number;
  /** A named cell or range. */
  name(n: string): Ref | null;
  /** Row offset applied to relative row references (column formulas, fill down). */
  rowShift?: number;
  colShift?: number;
}

type Range = { range: Result[][] };
type Arg = Result | Range;
const isRange = (a: Arg): a is Range => typeof a === 'object' && a !== null && 'range' in a;

const num = (v: Result): number | FormulaError => {
  if (v instanceof FormulaError) return v;
  if (v === null || v === '') return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const n = Number(String(v).replace(/[$,%\s]/g, ''));
  return Number.isNaN(n) ? new FormulaError('#VALUE!') : n;
};
const flat = (a: Arg): Result[] => (isRange(a) ? a.range.flat() : [a]);
const scalar = (a: Arg): Result => (isRange(a) ? a.range[0]?.[0] ?? null : a);
const eq = (x: Result, y: Result) =>
  typeof x === 'string' && typeof y === 'string' ? x.toLowerCase() === y.toLowerCase() : x === y;

function matches(v: Result, crit: Result): boolean {
  if (typeof crit === 'string') {
    const m = /^(<=|>=|<>|<|>|=)(.*)$/.exec(crit);
    if (m) {
      const [, op, rhs] = m;
      const a = num(v); const b = num(rhs);
      const numeric = !(a instanceof FormulaError) && !(b instanceof FormulaError) && rhs.trim() !== '';
      switch (op) {
        case '=': return numeric ? a === b : eq(v, rhs);
        case '<>': return numeric ? a !== b : !eq(v, rhs);
        case '<': return numeric && (a as number) < (b as number);
        case '>': return numeric && (a as number) > (b as number);
        case '<=': return numeric && (a as number) <= (b as number);
        case '>=': return numeric && (a as number) >= (b as number);
      }
    }
  }
  return eq(v, crit);
}

function sumOf(args: Arg[]): Result {
  let s = 0;
  for (const a of args) for (const v of flat(a)) {
    if (v instanceof FormulaError) return v;
    if (typeof v === 'number') s += v;
    else if (!isRange(a) && v !== null && v !== '') { const n = num(v); if (n instanceof FormulaError) return n; s += n; }
  }
  return s;
}
const numbersIn = (args: Arg[]) => args.flatMap(flat).filter((v): v is number => typeof v === 'number');

type Fn = (args: Arg[]) => Result;
const FN: Record<string, Fn> = {
  SUM: sumOf,
  AVERAGE: (a) => { const n = numbersIn(a); return n.length ? n.reduce((x, y) => x + y, 0) / n.length : new FormulaError('#DIV/0!'); },
  COUNT: (a) => numbersIn(a).length,
  COUNTA: (a) => a.flatMap(flat).filter((v) => v !== null && v !== '').length,
  MIN: (a) => { const n = numbersIn(a); return n.length ? Math.min(...n) : 0; },
  MAX: (a) => { const n = numbersIn(a); return n.length ? Math.max(...n) : 0; },
  ABS: (a) => { const n = num(scalar(a[0])); return n instanceof FormulaError ? n : Math.abs(n); },
  ROUND: (a) => { const n = num(scalar(a[0])); const d = num(scalar(a[1] ?? 0)); if (n instanceof FormulaError) return n; if (d instanceof FormulaError) return d; const f = 10 ** d; return Math.round(n * f) / f; },
  IF: (a) => { const c = scalar(a[0]); if (c instanceof FormulaError) return c; return c && c !== 0 ? scalar(a[1] ?? true) : scalar(a[2] ?? false); },
  IFERROR: (a) => { const v = scalar(a[0]); return v instanceof FormulaError ? scalar(a[1] ?? '') : v; },
  AND: (a) => a.flatMap(flat).every((v) => !!v),
  OR: (a) => a.flatMap(flat).some((v) => !!v),
  CONCAT: (a) => a.flatMap(flat).map((v) => (v === null ? '' : String(v))).join(''),
  XLOOKUP: (a) => {
    const key = scalar(a[0]); const look = flat(a[1] ?? null); const ret = flat(a[2] ?? null);
    const i = look.findIndex((v) => eq(v, key));
    return i >= 0 ? ret[i] ?? null : a[3] !== undefined ? scalar(a[3]) : new FormulaError('#N/A', 'Not found');
  },
  VLOOKUP: (a) => {
    const key = scalar(a[0]); const tbl = a[1]; const idx = num(scalar(a[2] ?? 1));
    if (!isRange(tbl) || idx instanceof FormulaError) return new FormulaError('#REF!');
    const row = tbl.range.find((r) => eq(r[0], key));
    return row ? row[idx - 1] ?? null : new FormulaError('#N/A', 'Not found');
  },
  SUMIFS: (a) => {
    const target = flat(a[0]); const pairs: [Result[], Result][] = [];
    for (let i = 1; i + 1 < a.length; i += 2) pairs.push([flat(a[i]), scalar(a[i + 1])]);
    let s = 0;
    target.forEach((v, i) => { if (typeof v === 'number' && pairs.every(([r, c]) => matches(r[i] ?? null, c))) s += v; });
    return s;
  },
  COUNTIFS: (a) => {
    const pairs: [Result[], Result][] = [];
    for (let i = 0; i + 1 < a.length; i += 2) pairs.push([flat(a[i]), scalar(a[i + 1])]);
    const n = pairs[0]?.[0].length ?? 0;
    let c = 0;
    for (let i = 0; i < n; i++) if (pairs.every(([r, cr]) => matches(r[i] ?? null, cr))) c++;
    return c;
  },
  SUMIF: (a) => { const r = flat(a[0]); const c = scalar(a[1]); const s = a[2] ? flat(a[2]) : r; let t = 0; r.forEach((v, i) => { const x = s[i]; if (matches(v, c) && typeof x === 'number') t += x; }); return t; },
};

/** The functions offered by autocomplete and Insert function, Google Sheets style. */
export const FUNCTIONS: { name: string; syntax: string; args: string[]; about: string; category: string }[] = [
  { name: 'SUM', syntax: 'SUM(value1, [value2, …])', args: ['value1', '[value2, …]'], about: 'Adds numbers or the numbers in a range.', category: 'Math' },
  { name: 'AVERAGE', syntax: 'AVERAGE(value1, [value2, …])', args: ['value1', '[value2, …]'], about: 'The mean of numbers in a range, ignoring text.', category: 'Statistical' },
  { name: 'COUNT', syntax: 'COUNT(value1, [value2, …])', args: ['value1', '[value2, …]'], about: 'How many numbers a range holds.', category: 'Statistical' },
  { name: 'COUNTA', syntax: 'COUNTA(value1, [value2, …])', args: ['value1', '[value2, …]'], about: 'How many values a range holds.', category: 'Statistical' },
  { name: 'COUNTIFS', syntax: 'COUNTIFS(criteria_range1, criterion1, …)', args: ['criteria_range1', 'criterion1', '…'], about: 'Counts rows that meet every criterion.', category: 'Statistical' },
  { name: 'MIN', syntax: 'MIN(value1, [value2, …])', args: ['value1', '[value2, …]'], about: 'The smallest number.', category: 'Math' },
  { name: 'MAX', syntax: 'MAX(value1, [value2, …])', args: ['value1', '[value2, …]'], about: 'The largest number.', category: 'Math' },
  { name: 'ABS', syntax: 'ABS(value)', args: ['value'], about: 'A number without its sign.', category: 'Math' },
  { name: 'ROUND', syntax: 'ROUND(value, [places])', args: ['value', '[places]'], about: 'Rounds to a number of decimal places.', category: 'Math' },
  { name: 'IF', syntax: 'IF(logical_expression, value_if_true, value_if_false)', args: ['logical_expression', 'value_if_true', 'value_if_false'], about: 'One value if a test is true, another if false.', category: 'Logical' },
  { name: 'IFERROR', syntax: 'IFERROR(value, [value_if_error])', args: ['value', '[value_if_error]'], about: 'A fallback when a formula errors.', category: 'Logical' },
  { name: 'AND', syntax: 'AND(logical_expression1, …)', args: ['logical_expression1', '…'], about: 'True when every test is true.', category: 'Logical' },
  { name: 'OR', syntax: 'OR(logical_expression1, …)', args: ['logical_expression1', '…'], about: 'True when any test is true.', category: 'Logical' },
  { name: 'CONCAT', syntax: 'CONCAT(value1, value2)', args: ['value1', 'value2'], about: 'Joins values into one text.', category: 'Text' },
  { name: 'XLOOKUP', syntax: 'XLOOKUP(search_key, lookup_range, result_range, [missing_value])', args: ['search_key', 'lookup_range', 'result_range', '[missing_value]'], about: 'Finds a key in one range and returns the value at the same position in another.', category: 'Lookup' },
  { name: 'VLOOKUP', syntax: 'VLOOKUP(search_key, range, index)', args: ['search_key', 'range', 'index'], about: 'Finds a key in a range’s first column and returns a value from the same row.', category: 'Lookup' },
  { name: 'SUMIF', syntax: 'SUMIF(range, criterion, [sum_range])', args: ['range', 'criterion', '[sum_range]'], about: 'Adds the values that meet one criterion.', category: 'Math' },
  { name: 'SUMIFS', syntax: 'SUMIFS(sum_range, criteria_range1, criterion1, …)', args: ['sum_range', 'criteria_range1', 'criterion1', '…'], about: 'Adds the values in rows that meet every criterion.', category: 'Math' },
];

export function evaluate(src: string, ctx: EvalContext, depth = 0): Result {
  if (depth > 40) return new FormulaError('#CYCLE!');
  const node = compile(src.startsWith('=') ? src.slice(1) : src);
  if (node instanceof FormulaError) return node;
  const shiftR = ctx.rowShift ?? 0;
  const shiftC = ctx.colShift ?? 0;

  const resolve = (ref: Ref): Ref => ({
    ...ref,
    c1: ref.absC1 ? ref.c1 : ref.c1 + shiftC,
    c2: ref.absC2 ? ref.c2 : ref.c2 + shiftC,
    r1: ref.r1 === null ? null : ref.absR1 ? ref.r1 : ref.r1 + shiftR,
    r2: ref.r2 === null ? null : ref.absR2 ? ref.r2 : ref.r2 + shiftR,
  });

  const readRange = (ref: Ref): Arg => {
    const sheet = ref.sheet ?? ctx.sheet;
    const single = ref.c1 === ref.c2 && ref.r1 === ref.r2 && ref.r1 !== null;
    if (single) return ctx.get(sheet, ref.c1, ref.r1!);
    const r1 = ref.r1 ?? 2;
    const r2 = ref.r2 ?? ctx.lastRow(sheet);
    const rows: Result[][] = [];
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
      const row: Result[] = [];
      for (let c = Math.min(ref.c1, ref.c2); c <= Math.max(ref.c1, ref.c2); c++) row.push(ctx.get(sheet, c, r));
      rows.push(row);
    }
    return { range: rows };
  };

  const ev = (n: Node): Arg => {
    switch (n.t) {
      case 'num': return n.v;
      case 'str': return n.v;
      case 'bool': return n.v;
      case 'ref': return readRange(resolve(n.ref));
      case 'name': {
        const ref = ctx.name(n.v);
        return ref ? readRange(ref) : new FormulaError('#NAME?', `Unknown name ${n.v}`);
      }
      case 'fn': {
        const f = FN[n.name];
        if (!f) return new FormulaError('#NAME?', `Unknown function ${n.name}`);
        return f(n.args.map(ev));
      }
      case 'un': {
        const v = num(scalar(ev(n.a)));
        return v instanceof FormulaError ? v : n.op === '-' ? -v : v;
      }
      case 'bin': {
        const a = scalar(ev(n.a)); const b = scalar(ev(n.b));
        if (a instanceof FormulaError) return a;
        if (b instanceof FormulaError) return b;
        if (n.op === '&') return `${a ?? ''}${b ?? ''}`;
        if (['=', '<>', '<', '>', '<=', '>='].includes(n.op)) {
          const x = typeof a === 'number' ? a : a; const y = b;
          switch (n.op) {
            case '=': return eq(x, y);
            case '<>': return !eq(x, y);
            case '<': return (x as number) < (y as number);
            case '>': return (x as number) > (y as number);
            case '<=': return (x as number) <= (y as number);
            default: return (x as number) >= (y as number);
          }
        }
        const x = num(a); const y = num(b);
        if (x instanceof FormulaError) return x;
        if (y instanceof FormulaError) return y;
        switch (n.op) {
          case '+': return x + y;
          case '-': return x - y;
          case '*': return x * y;
          case '/': return y === 0 ? new FormulaError('#DIV/0!') : x / y;
          case '^': return x ** y;
        }
        return new FormulaError('#ERROR!');
      }
    }
  };
  return scalar(ev(node));
}

/** References in a formula, for colour-coding while editing (Google Sheets style). */
export function refsIn(src: string): { text: string; start: number; end: number }[] {
  const out: { text: string; start: number; end: number }[] = [];
  const re = /(?:'[^']+'|[A-Za-z_][\w.]*)?!?\$?[A-Za-z]{1,3}\$?\d+(?::\$?[A-Za-z]{1,3}\$?\d+)?|(?:(?:'[^']+'|[A-Za-z_][\w.]*)!)?\$?[A-Za-z]{1,3}:\$?[A-Za-z]{1,3}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const text = m[0].replace(/^!/, '');
    if (parseRef(text)) out.push({ text, start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/** F4: cycle a reference A1 → $A$1 → A$1 → $A1 → A1. */
export function cycleLock(ref: string): string {
  const m = /^((?:'[^']+'|[A-Za-z_][\w.]*)!)?(\$?)([A-Za-z]{1,3})(\$?)(\d+)$/.exec(ref);
  if (!m) return ref;
  const [, sheet = '', dc, c, dr, r] = m;
  const state = (dc ? 1 : 0) + (dr ? 2 : 0); // 0 none, 3 both, 2 row, 1 col
  const next = state === 0 ? 3 : state === 3 ? 2 : state === 2 ? 1 : 0;
  return `${sheet}${next & 1 ? '$' : ''}${c}${next & 2 ? '$' : ''}${r}`;
}
