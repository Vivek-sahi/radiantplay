#!/usr/bin/env node
/**
 * Prototype migration codemod: moves a prototype onto the Geist font tokens and the
 * theme-aware colour tokens. Spec: docs/2026-10-07-prototype-migration-plan.md, section 6.
 *
 * Mechanical rules (applied with --write):
 *   font-family / font-mono   old font stacks          -> var(--font-family-primary | mono)
 *   font-face                 @font-face blocks for Plain -> removed (the files are gone)
 *   weight-*                  600, 375, 400, 500         -> var(--font-weight-*); numeric 550/400/500 for ECharts and SVG attributes
 *   weight-alias              var(--font-weight-light | semibold) -> regular | emphasis
 *   font-size                 12, 14, 16, 18, 20, 24, 32, 40 px -> var(--font-size-*)
 *   light-read / comp-read    systemColors.light['x'] / rdComponentColors.light['x'] -> sysVar('x') / compVar('x')
 *   alpha-suffix              `${colour}HH`              -> color-mix(in srgb, colour N%, transparent)
 *   alpha-colour              #RRGGBBAA, rgba() of a token colour -> color-mix(...)
 *   hex-token / hex-tailwind  a hex keyed by the property on the same line -> the token for that role
 *   hex-const                 const TEXT_PRIMARY = '#hex' -> same tables, role from the name
 *   hover-handler             el.style.x = '#hex'        -> same tables
 *   legacy-value              old token values such as rgba(29, 35, 47, 0.5) -> the token
 *   shadow                    neutral rgba box shadows   -> shadowVar('surface' | 'menu' | 'modal')
 *   unknown-token             var(--rd-sys-color-missing, var(--x)) -> var(--x)
 * Anything else that needs a decision goes on the judgement list with a suggestion.
 *
 * Canvas charts: ECharts draws on a canvas and can't read CSS variables. In a chart file (one that
 * imports echarts or echarts-for-react, sits in a charts/ folder or is named chart*, renders
 * <ReactECharts> or calls setOption, or declares an option constant such as LINE_OPTION, VIZ_SPECS or
 * chartOption), colours, light reads and font stacks inside an option context (series, itemStyle,
 * lineStyle, axisLabel, textStyle, label, tooltip, color: [...], option= / setOption(, or a constant
 * named like an option) are never rewritten. Each goes on the judgement list with role `chart`:
 * use useChartTheme() (ui.*, seriesColor()) instead. Font sizes there stay numbers; old weights become
 * the numeric 550 / 400. Inline styles and JSX attributes in the same file are DOM and migrate as usual.
 *
 * Usage:
 *   node scripts/radiant-check/codemod.mjs <path...> [--write] [--json] [--include-vendor] [--skip=rule,rule]
 *
 * Dry run by default. --write applies the rules and writes src/prototypes/<Name>/migration-todo.md
 * when a judgement list remains (and deletes it when the list is empty).
 * Never touches src/tokens, src/styles/tokens.css, src/components, src/spotter, or anything in src outside
 * src/prototypes. vendor/ folders (code from outside the repo) are skipped and counted, unless
 * --include-vendor is passed: use it once the owner has decided that copy is theirs to change.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const RULES = JSON.parse(fs.readFileSync(path.join(HERE, 'codemod-rules.json'), 'utf8'));

// ---------------------------------------------------------------------------
// Token tables, built from tokens.css (light values) and reference.ts

function loadTables() {
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/tokens.css'), 'utf8');
  const lightStart = css.indexOf('[data-theme="light"]');
  const lightBlock = css.slice(lightStart, css.indexOf('\n}', lightStart));
  const sys = []; // [name, HEX6] in file order
  for (const m of lightBlock.matchAll(/--rd-sys-color-([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})\s*;/g)) sys.push([m[1], m[2].toUpperCase()]);
  const sysNames = new Set([...lightBlock.matchAll(/--rd-sys-color-([a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  const compNames = new Set([...lightBlock.matchAll(/--rd-comp-color-([a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  const tokenHex = new Set(sys.map(([, v]) => v));

  const table = {}; // HEX6 -> { text, surface, border }
  for (const [role, pref] of Object.entries(RULES.tokenPreference)) {
    const avoid = new RegExp(pref.avoid);
    for (const [name, hex] of sys) {
      if (!name.startsWith(pref.prefix) || avoid.test(name)) continue;
      table[hex] ??= {};
      table[hex][role] ??= name;
    }
  }
  for (const [hex, roles] of Object.entries(RULES.roleOverrides)) {
    table[hex] ??= {};
    for (const [role, name] of Object.entries(roles)) if (!role.startsWith('_')) table[hex][role] = name;
  }

  const ref = {};
  const refSrc = fs.readFileSync(path.join(ROOT, 'src/tokens/colors/reference.ts'), 'utf8');
  for (const fam of refSrc.matchAll(/^\s{2}(\w+):\s*\{([\s\S]*?)\n\s{2}\}/gm)) {
    ref[fam[1]] = {};
    for (const s of fam[2].matchAll(/'(\w+)':\s*'(#[0-9A-Fa-f]{6})'/g)) ref[fam[1]][s[1]] = s[2].toUpperCase();
  }
  return { sys, sysNames, compNames, tokenHex, table, ref };
}

const T = loadTables();
const BRAND_RE = new RegExp(`\\b(${RULES.brandNames.join('|')})\\b`, 'i');

// Chart option contexts (canvas): see chartContext() in migrateText
const CHART_CONST = /\b(?:const|let|var)\s+(?:[A-Z][A-Z0-9]*_(?:OPTIONS?|SPECS?)|VIZ_SPECS|chartOptions?)\b/;
const CHART_NAME = /^(?:[A-Z][A-Z0-9]*_(?:OPTIONS?|SPECS?)|VIZ_SPECS|options?|chart[A-Z]\w*|chartOptions?|\w+ChartOptions?)$/;
const CHART_KEY = /\b(series|xAxis|yAxis|itemStyle|lineStyle|areaStyle|axisLabel|axisLine|axisTick|axisPointer|splitLine|splitArea|legend|tooltip|grid|visualMap|markLine|markArea|markPoint|emphasis|blur|select|textStyle|nameTextStyle|label|labelLine|title|dataZoom|graphic|radar|polar|angleAxis|radiusAxis|geo|calendar|toolbox|color)\s*:/;
const CHART_REASON = 'Canvas chart option: use useChartTheme() (ui.*, seriesColor()), not CSS variables';
const CHART_SUGGESTION = 'useChartTheme(): ui.* or seriesColor()';

const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (r, g, b) => '#' + [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('').toUpperCase();
const ROLE_PREFIX = { text: 'content-', surface: 'background-', border: 'border-' };

/** sRGB hex to CIE Lab, for a colour distance that respects hue. */
function lab(hex) {
  const lin = rgbOf(hex).map((c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const x = (lin[0] * 0.4124 + lin[1] * 0.3576 + lin[2] * 0.1805) / 0.95047;
  const y = lin[0] * 0.2126 + lin[1] * 0.7152 + lin[2] * 0.0722;
  const z = (lin[0] * 0.0193 + lin[1] * 0.1192 + lin[2] * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

function nearest(hex, role) {
  const L = lab(hex);
  let best = null;
  for (const [name, v] of T.sys) {
    if (role && !name.startsWith(ROLE_PREFIX[role])) continue;
    if (/inverse/.test(name)) continue;
    const L2 = lab(v);
    const d = Math.hypot(L[0] - L2[0], L[1] - L2[1], L[2] - L2[2]);
    if (!best || d < best.d) best = { name, d, hex: v };
  }
  return best;
}

// ---------------------------------------------------------------------------
// Property names to roles

function roleOf(prop) {
  if (!prop) return null;
  const p = prop.replace(/^['"]|['"]$/g, '');
  const R = RULES.roles;
  if (R.judgementProps.includes(p)) return 'judgement';
  if (R.text.includes(p)) return 'text';
  if (R.surface.includes(p)) return 'surface';
  if (R.border.includes(p)) return 'border';
  if (R.borderPrefixes.some((x) => p.startsWith(x)) && !/radius|width|style|spacing|collapse|image/i.test(p)) return 'border';
  return null;
}

/** The scan kinds a codemod rule's rewrite falls under, for matching allow entries. */
function scanKindsOf(rule, from) {
  if (rule === 'light-read' || rule === 'comp-read') return ['light-read'];
  if (rule === 'alpha-suffix') return /\.light\[/.test(from) ? ['literal', 'light-read'] : ['literal'];
  if (/^font-(family|mono|face)$/.test(rule)) return ['font-family'];
  if (rule.startsWith('weight-')) return ['font-weight'];
  if (rule === 'font-size') return ['font-size'];
  return ['literal'];
}

/** A constant whose name states its role (TEXT_PRIMARY, BORDER, BG_SUBTLE): safe to key on. */
function strongRole(name) {
  if (!name) return null;
  if (/^(TEXT|FG|INK|ICON)(_|$)|^(text|fg|ink|icon)([A-Z_]|$)/.test(name)) return 'text';
  if (/^(BORDER|DIVIDER|STROKE)(_|$)|^(border|divider|stroke)([A-Z_]|$)/.test(name)) return 'border';
  if (/^(BG|BACKGROUND|SURFACE)(_|$)|^(bg|background|surface)([A-Z_]|$)/.test(name)) return 'surface';
  return null;
}

/** Guess a role from a variable or object key name, for suggestions only. */
function guessRole(name) {
  if (!name) return null;
  if (/border|divider|stroke|outline|separator|sep/i.test(name)) return 'border';
  if (/bg|background|fill|surface|track|panel|card|hover|highlight/i.test(name)) return 'surface';
  if (/text|color|colour|fg|icon|label|title|heading|ink|brand/i.test(name)) return 'text';
  return null;
}

// ---------------------------------------------------------------------------
// Lexer for TS/JS: finds string tokens (with template segments) and blanks comments

/**
 * Returns { strings, view, exprs } where `view` is the source with comment text and string
 * contents replaced (delimiters and template ${...} code kept), so regexes see only code.
 */
function lex(src) {
  const n = src.length;
  const view = src.split('');
  const strings = [];
  const stack = [{ t: 'code', depth: 0 }];
  let prevSig = '';
  let i = 0;
  const regexOk = () => prevSig === '' || '(,=:[!&|?{};'.includes(prevSig);
  while (i < n) {
    const top = stack[stack.length - 1];
    if (top.t === 'tpl') {
      const c = src[i];
      if (c === '\\') { view[i] = 'x'; if (i + 1 < n && src[i + 1] !== '\n') view[i + 1] = 'x'; i += 2; continue; }
      if (c === '`') {
        top.tok.segs.push([top.segStart, i]);
        top.tok.end = i + 1;
        stack.pop();
        prevSig = '`';
        i++;
        continue;
      }
      if (c === '$' && src[i + 1] === '{') {
        top.tok.segs.push([top.segStart, i]);
        const expr = { start: i + 2, end: -1 };
        top.tok.exprs.push(expr);
        stack.push({ t: 'code', depth: 0, tpl: top, expr });
        prevSig = '{';
        i += 2;
        continue;
      }
      if (c !== '\n') view[i] = 'x';
      i++;
      continue;
    }
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') view[i++] = ' ';
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end < 0 ? n : end + 2;
      for (; i < stop; i++) if (src[i] !== '\n') view[i] = ' ';
      continue;
    }
    if (c === '/' && regexOk()) {
      let j = i + 1, inClass = false, ok = false;
      for (; j < n; j++) {
        const d = src[j];
        if (d === '\n') break;
        if (d === '\\') { j++; continue; }
        if (d === '[') inClass = true;
        else if (d === ']') inClass = false;
        else if (d === '/' && !inClass) { ok = true; break; }
      }
      if (ok) {
        for (let k = i + 1; k < j; k++) view[k] = 'x';
        i = j + 1;
        prevSig = '/';
        continue;
      }
    }
    if (c === '"' || c === "'") {
      let j = i + 1, ok = false;
      for (; j < n; j++) {
        const d = src[j];
        if (d === '\\') { j++; continue; }
        if (d === '\n') break;
        if (d === c) { ok = true; break; }
      }
      if (ok) {
        strings.push({ q: c, start: i, end: j + 1, segs: [[i + 1, j]], exprs: [] });
        for (let k = i + 1; k < j; k++) view[k] = 'x';
        i = j + 1;
        prevSig = c;
        continue;
      }
      // Unclosed on this line: an apostrophe in JSX text, not a string
      i++;
      continue;
    }
    if (c === '`') {
      const tok = { q: '`', start: i, end: -1, segs: [], exprs: [] };
      strings.push(tok);
      stack.push({ t: 'tpl', tok, segStart: i + 1 });
      i++;
      continue;
    }
    if (c === '{') top.depth++;
    if (c === '}') {
      if (top.tpl && top.depth === 0) {
        top.expr.end = i;
        stack.pop();
        stack[stack.length - 1].segStart = i + 1;
        i++;
        continue;
      }
      top.depth--;
    }
    if (!/\s/.test(c)) prevSig = c;
    i++;
  }
  for (const s of strings) if (s.end < 0) s.end = n;
  return { strings, view: view.join('') };
}

/** Blank CSS comments, keeping offsets. */
function cssView(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

// ---------------------------------------------------------------------------
// Value parsing helpers

const COLOUR_RE = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|\brgba?\(\s*\d[^)]*\)|(?<![\w-])white(?![\w-])/g;

function parseColour(lit) {
  let m;
  if (/^white$/i.test(lit)) return { hex: '#FFFFFF', a: 1 };
  if ((m = lit.match(/^#([0-9a-f]{3})$/i))) return { hex: ('#' + [...m[1]].map((c) => c + c).join('')).toUpperCase(), a: 1 };
  if ((m = lit.match(/^#([0-9a-f]{6})$/i))) return { hex: lit.toUpperCase(), a: 1 };
  if ((m = lit.match(/^#([0-9a-f]{6})([0-9a-f]{2})$/i))) return { hex: ('#' + m[1]).toUpperCase(), a: parseInt(m[2], 16) / 255, hexAlpha: m[2] };
  if ((m = lit.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+%?)\s*)?\)$/))) {
    let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { hex: toHex(+m[1], +m[2], +m[3]), a, rgb: `${m[1]},${m[2]},${m[3]}`, norm: lit.replace(/\s+/g, '') };
  }
  return null;
}

const pct = (a) => Math.round(a * 100);

/** Parse a box-shadow value. Returns { level } when it is neutral rgba/hex layers only, else { reason }. */
function parseShadow(value) {
  const layers = [];
  let depth = 0, cur = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { layers.push(cur); cur = ''; } else cur += ch;
  }
  layers.push(cur);
  let maxBlur = 0, anyBlur = false, score = 0;
  for (const raw of layers) {
    const l = raw.trim();
    if (!l) return { reason: 'empty layer' };
    if (/\binset\b/.test(l)) return { reason: 'inset shadow' };
    const colours = [...l.matchAll(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]);
    if (colours.length !== 1) return { reason: 'shadow colour is not a literal' };
    const c = parseColour(colours[0]);
    if (!c) return { reason: 'unreadable colour' };
    const [r, g, b] = rgbOf(c.hex);
    if (!RULES.shadow.inks.includes(`${r},${g},${b}`)) return { reason: 'coloured shadow' };
    const lengths = l.replace(colours[0], '').trim().split(/\s+/).filter(Boolean);
    if (!lengths.every((x) => /^-?[\d.]+(px)?$/.test(x))) return { reason: 'shadow with units other than px' };
    const nums = lengths.map((x) => parseFloat(x));
    const blur = nums[2] ?? 0;
    if (blur > 0) anyBlur = true;
    maxBlur = Math.max(maxBlur, blur);
    score = Math.max(score, blur * c.a);
  }
  if (!anyBlur) return { reason: 'focus ring or hard edge, not an elevation' };
  const level = score < RULES.shadow.menu ? 'surface' : score < RULES.shadow.modal ? 'menu' : 'modal';
  return { level, blur: maxBlur, score };
}

const PRIMARY_RE = new RegExp(RULES.fontFamily.primary, 'i');
const MONO_RE = new RegExp(RULES.fontFamily.mono, 'i');
function fontStack(value) {
  const v = value.trim();
  if (!v || v.startsWith('var(')) return null;
  if (MONO_RE.test(v)) return 'mono';
  if (PRIMARY_RE.test(v)) return 'primary';
  return null;
}

// ---------------------------------------------------------------------------
// Per-file migration

/**
 * Migrate one file's text. Returns { out, hits, judgement }.
 * hits: [{ rule, line, from, to }]; judgement: [{ line, value, role, suggestion, reason }]
 */
export function migrateText(src, file, opts = {}) {
  const skip = new Set(opts.skip ?? []);
  const isCss = file.endsWith('.css');
  const isTs = /\.tsx?$/.test(file);
  const isEcharts = /from\s+['"](echarts|echarts-for-react)[^'"]*['"]|require\(\s*['"]echarts/.test(src);
  // A chart file: imports ECharts, sits in a charts/ folder or is named chart*, renders <ReactECharts>,
  // calls setOption, or declares an option constant (LINE_OPTION, VIZ_SPECS, chartOption).
  // Inside its option objects colours and fonts go to a canvas, which can't read CSS variables.
  const fileNorm = file.split(path.sep).join('/');
  const chartFile = isTs && (isEcharts || /(^|\/)charts\//.test(fileNorm) || /(^|\/)chart[\w.-]*\.[tj]sx?$/i.test(fileNorm)
    || /<ReactECharts\b|\.setOption\(/.test(src) || CHART_CONST.test(src));
  const lineStarts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') lineStarts.push(i + 1);
  const lineOf = (pos) => {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= pos) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
  };
  const lineText = (ln) => src.slice(lineStarts[ln - 1], (lineStarts[ln] ?? src.length + 1) - 1);

  const edits = [];
  const extraHits = []; // counted but applied as part of another edit
  const allowedLines = new Set(); // colours left alone because rules.json / rules-mine.json call them data
  const judgement = [];
  const claimed = [];
  const overlaps = (s, e) => claimed.some(([a, b]) => s < b && e > a);
  const skippedByRule = {};
  /** An allow entry in rules.json / rules-mine.json covers this rewrite: never touch it. */
  const blocked = (rule, pos, from = '') => {
    if (!opts.allowed) return false;
    const line = lineText(lineOf(pos));
    const kinds = scanKindsOf(rule, from);
    if (!kinds.some((k) => opts.allowed(opts.display ?? file, k, line))) return false;
    skippedByRule[rule] = (skippedByRule[rule] ?? 0) + 1;
    allowedLines.add(lineOf(pos));
    return true;
  };
  const edit = (s, e, text, rule, from) => {
    if (skip.has(rule)) return false;
    if (overlaps(s, e)) return false;
    if (blocked(rule, s, from ?? src.slice(s, e))) return false;
    claimed.push([s, e]);
    edits.push({ s, e, text, rule, line: lineOf(s), from: from ?? src.slice(s, e) });
    return true;
  };
  const judge = (pos, value, role, suggestion, reason, kind = 'colour') => {
    // Colours the allow lists already call data are not listed again
    const scanKind = kind === 'light-read' ? 'light-read' : kind === 'colour' ? 'literal' : null;
    if (scanKind && opts.allowed?.(opts.display ?? file, scanKind, lineText(lineOf(pos)))) { allowedLines.add(lineOf(pos)); return; }
    judgement.push({ line: lineOf(pos), value, role: role ?? 'unknown', suggestion: suggestion ?? '', reason, kind });
  };

  // ---- shared value handlers; `form` decides how a token is written:
  //   'var'    CSS text: var(--rd-sys-color-x)
  //   'whole'  TS string that is the whole value: sysVar('x') replaces the string token
  //   'part'   TS string with other text: ${sysVar('x')} inside a template literal
  const sysOut = (name, form) => (form === 'var' ? `var(--rd-sys-color-${name})` : form === 'whole' ? `sysVar('${name}')` : `\${sysVar('${name}')}`);
  const mixOut = (name, p) => `color-mix(in srgb, var(--rd-sys-color-${name}) ${p}%, transparent)`;

  /** Resolve one colour literal for a role. Returns { name, mix, rule } or null after judging it. */
  function resolveColour(lit, role, pos, ctx) {
    const c = parseColour(lit);
    if (!c) return null;
    // An allow entry with a `match` names this exact colour as data: leave it
    if (opts.allowed?.(opts.display ?? file, 'literal', lineText(lineOf(pos))) === 'line') { allowedLines.add(lineOf(pos)); return null; }
    const label = lit.replace(/\s+/g, ' ');
    if (ctx.echarts) {
      judge(pos, label, 'chart', CHART_SUGGESTION, CHART_REASON);
      return null;
    }
    if (c.norm && RULES.legacyValues[c.norm]) return { name: RULES.legacyValues[c.norm], rule: 'legacy-value' };
    if (!role || role === 'judgement') {
      const g = role === 'judgement' ? null : guessRole(ctx.name);
      const sug = c.a < 1 ? '' : g && T.table[c.hex]?.[g] ? T.table[c.hex][g] : nearest(c.hex, g)?.name;
      const reason = role === 'judgement'
        ? `${ctx.name} is a gradient stop or filter colour; tokens work but check the intent`
        : ctx.name ? `No colour property on the line (${ctx.name}); pick the role, or leave it if it is data` : 'No colour property on the line; pick the role, or leave it if it is data';
      judge(pos, label, g, sug, reason);
      return null;
    }
    if (c.a < 1) {
      if (c.hex === '#FFFFFF') { judge(pos, label, role, 'color-mix of content-alternate or content-inverse', 'Translucent white usually sits on a coloured fill; pick the token it should tint'); return null; }
      if (c.hex === '#000000') {
        const s = c.a >= 0.3 ? 'background-overlay' : 'background-ghost-hover';
        judge(pos, label, role, s, c.a >= 0.3 ? 'Black scrim; background-overlay if it covers the page' : 'Translucent black tint; background-ghost-hover for hovers');
        return null;
      }
      const name = T.table[c.hex]?.[RULES.alphaTintRole];
      if (name) return { name, mix: pct(c.a), rule: 'alpha-colour' };
      const nn = nearest(c.hex, RULES.alphaTintRole);
      judge(pos, label, role, nn ? `color-mix of ${nn.name}` : '', 'Translucent colour that matches no token');
      return null;
    }
    const flag = RULES.flagged[`${role}:${c.hex}`];
    if (flag?.hold) { judge(pos, label, role, flag.suggestion, flag.reason); return null; }
    const name = T.table[c.hex]?.[role];
    if (!name) {
      const nn = nearest(c.hex, role);
      judge(pos, label, role, nn ? `${nn.name} (${nn.hex})` : '', 'Matches no token in this role; nearest shown as a suggestion only');
      return null;
    }
    if (role === 'surface' && c.hex === '#FFFFFF' && ctx.shadowBlock) {
      const f = RULES.flagged['surface:#FFFFFF+shadow'];
      judge(pos, label, role, f.suggestion, f.reason, 'check');
    }
    return { name, rule: T.tokenHex.has(c.hex) ? 'hex-token' : 'hex-tailwind' };
  }

  /** Does the {...} block around pos mention a shadow? */
  function inShadowBlock(pos) {
    let depth = 0, a = pos;
    for (; a > 0 && pos - a < 4000; a--) {
      if (src[a] === '}') depth++;
      if (src[a] === '{') { if (depth === 0) break; depth--; }
    }
    depth = 0;
    let b = pos;
    for (; b < src.length && b - pos < 4000; b++) {
      if (src[b] === '{') depth++;
      if (src[b] === '}') { if (depth === 0) break; depth--; }
    }
    return /box-?[sS]hadow\s*:/.test(src.slice(a, b)) && !/box-?[sS]hadow\s*:\s*['"]?none/.test(src.slice(a, b));
  }

  /**
   * Handle one property value. [s, e) is the value text inside src (CSS value, or a string's content).
   * form: 'var' | 'ts' (TS string content; tok is the string token) ; numericCtx for SVG attributes.
   * Returns inner edits for TS strings (so the caller can build a template), or applies them directly.
   */
  function handleValue(prop, s, e, form, tok, ctx = {}) {
    const value = src.slice(s, e);
    const p = (prop ?? '').replace(/^['"]|['"]$/g, '');
    const inner = [];
    const isWhole = (a, b) => form === 'ts' && src.slice(s, a).trim() === '' && src.slice(b, e).trim() === '' && tok.exprs.length === 0;
    const put = (a, b, text, rule, from) => inner.push({ s: a, e: b, text, rule, from });
    // Inside a canvas chart option: no CSS variables, and font sizes and weights stay numbers
    const chart = form === 'ts' && chartAt(s, ctx);

    // Font family
    if (/^font-?family$/i.test(p) || (ctx.byName && /font/i.test(ctx.name ?? '')) || (form === 'ts' && !p && value.includes(','))) {
      const kind = fontStack(value);
      if (kind && chart) {
        judge(s, value.trim(), 'chart', CHART_SUGGESTION, CHART_REASON, 'font');
        return finish();
      }
      if (kind) {
        put(s, e, `var(--font-family-${kind})`, kind === 'mono' ? 'font-mono' : 'font-family');
        return finish();
      }
    }
    if (/^font$/i.test(p) && fontStack(value.replace(/^.*?\d+(px|em|rem)?(\/[\d.]+\w*)?\s+/, ''))) {
      judge(s, value.trim(), 'font', 'font-family: var(--font-family-primary) plus separate size and weight', 'font shorthand with an old stack');
      return finish();
    }
    // Font weight
    if (/weight$/i.test(p)) {
      handleWeightText(s, e, form, ctx.numeric || chart, put, ctx.conditional);
      return finish();
    }
    // Font size
    if (/^font-?size$/i.test(p)) {
      if (!(ctx.numeric || chart)) {
        const m = value.match(/^\s*(\d+(?:\.\d+)?)(px)?\s*(!important)?\s*$/);
        if (m && (m[2] || form === 'ts')) sizeAt(s + value.indexOf(m[1]), m[1], m[2] ? m[1].length + 2 : m[1].length, put, 'var');
      }
      return finish();
    }
    // Shadow
    if (/^box-?shadow$/i.test(p)) {
      const v = value.trim();
      if (!v || /^(none|inherit|initial|unset)$/.test(v) || v.startsWith('var(')) return finish();
      if (form === 'ts' && tok.exprs.length) return finish();
      const sh = parseShadow(v);
      if (sh.level) {
        const whole = isWhole(s, e);
        put(s, e, form === 'ts' && whole ? `shadowVar('${sh.level}')` : `var(--rd-sys-color-shadow-${sh.level})`, 'shadow');
        if (form === 'ts' && whole) inner[inner.length - 1].wholeToken = true;
      } else if (COLOUR_RE.test(v)) {
        judge(s, v, 'shadow', /focus/.test(sh.reason) ? 'outline or border-focus' : "shadowVar('surface' | 'menu' | 'modal')", `Shadow left as is: ${sh.reason}`);
      }
      COLOUR_RE.lastIndex = 0;
      return finish();
    }
    // Colours
    let role = roleOf(p);
    const hover = ctx.hover;
    const around = form === 'ts' ? objectOnLine(s) : '';
    // A 1px-wide or 1px-tall box with a fill is a divider: border role
    if (role === 'surface' && /\b(width|height)\s*:\s*['"]?1px\b/.test(around)) role = 'border';
    // A colour in a list item ({ label, color }) is data, not UI
    const dataItem = ctx.kind === 'key' && /(^|[{,]\s*)(label|name|key|id|title|value)\s*:/.test(around);
    const gradient = /gradient\(/.test(value);
    for (const m of value.matchAll(COLOUR_RE)) {
      const a = s + m.index, b = a + m[0].length;
      if (/white/i.test(m[0]) && value.trim() !== m[0] && !/(solid|dashed|dotted)\s+$/.test(value.slice(0, m.index))) continue; // a bare `white` value, or a border colour
      if (chart) {
        resolveColour(m[0], role, a, { echarts: true });
        continue;
      }
      if (dataItem) {
        const pc = parseColour(m[0]);
        judge(a, m[0], role, pc && T.table[pc.hex]?.[role] ? T.table[pc.hex][role] : '', 'Colour in a list item (label, name, key): usually data such as a series or a user choice. Keep it, or pick a token');
        continue;
      }
      if (gradient) {
        judge(a, m[0], role, 'a token per stop, or a named variable if it is decorative', 'Colour inside a gradient');
        continue;
      }
      if (!isCss && brandContext(a)) {
        judge(a, m[0], role, 'keep as data and add a rules-mine.json entry', 'Brand colour, keep as data?');
        continue;
      }
      const r = resolveColour(m[0], role, a, { echarts: false, name: ctx.name ?? p, shadowBlock: role === 'surface' && inShadowBlock(a) });
      if (!r) continue;
      const rule = hover && (r.rule === 'hex-token' || r.rule === 'hex-tailwind') ? 'hover-handler' : r.rule;
      if (r.mix !== undefined) put(a, b, mixOut(r.name, r.mix), rule);
      else if (form === 'ts' && isTs) {
        if (isWhole(a, b)) { put(a, b, sysOut(r.name, 'whole'), rule); inner[inner.length - 1].wholeToken = true; }
        else put(a, b, sysOut(r.name, 'part'), rule, undefined), (inner[inner.length - 1].template = true);
      } else put(a, b, sysOut(r.name, 'var'), rule);
    }
    return finish();

    function finish() {
      return inner;
    }
  }

  /**
   * Is pos inside a canvas chart option? Walks out through the brackets around pos and looks at
   * what opens each one: an ECharts key (series, itemStyle, axisLabel, label, color: [...]),
   * option= / option: / setOption(, or a constant named like an option (LINE_OPTION, VIZ_SPECS,
   * chartOption, chartUi). Outside every bracket, a top-level constant with such a name counts too
   * (const chartFont = '...'). Only in chart files (see chartFile).
   */
  function chartContext(pos) {
    if (!chartFile || isCss) return false;
    const v = lexed.view;
    const stop = Math.max(0, pos - 20000);
    const DELIMS = [',', ';', '{', '}', '(', ')', '[', ']'];
    let depth = 0;
    let outer = pos;
    for (let i = pos - 1; i >= stop; i--) {
      const ch = v[i];
      if (ch === ')' || ch === ']' || ch === '}') { depth++; continue; }
      if (ch !== '(' && ch !== '[' && ch !== '{') continue;
      if (depth > 0) { depth--; continue; }
      // An opener that encloses pos: what opens it?
      outer = i;
      const lead = v.slice(Math.max(0, i - 160), i);
      const cut = lead.slice(Math.max(...DELIMS.map((c) => lead.lastIndexOf(c))) + 1);
      if (CHART_KEY.test(cut) || /\b(option|options)\s*[=:]\s*$/.test(cut) || /\bsetOption\s*$/.test(cut)) return true;
      const decl = cut.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*$/);
      if (decl && CHART_NAME.test(decl[1])) return true;
    }
    if (outer !== pos) return false;
    const ls = v.lastIndexOf('\n', pos - 1) + 1;
    const decl = v.slice(ls, pos).match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=/);
    return !!decl && CHART_NAME.test(decl[1]);
  }

  /** Chart context, except inline styles, JSX attributes and hover handlers: those are DOM even in a chart file. */
  function chartAt(pos, ctx = {}) {
    if (!chartFile || isCss) return false;
    if (ctx.kind === 'jsx' || ctx.hover || /style=\{\{/.test(lineText(lineOf(pos)))) return false;
    return chartContext(pos);
  }

  /** Is pos inside a logo or brand mark? An <svg> introduced by "logo"/"brand" or a brand name, a
   *  component or variable named *Logo* / *Brand*, an Icon named after a brand, or an object whose
   *  name/label is a known product. */
  function brandContext(pos) {
    const from = Math.max(0, pos - 4000);
    const before = src.slice(from, pos);
    const svgAt = before.lastIndexOf('<svg');
    if (svgAt >= 0 && before.indexOf('</svg>', svgAt) < 0) {
      const tagEnd = before.indexOf('>', svgAt);
      const lead = before.slice(Math.max(0, svgAt - 300), tagEnd < 0 ? before.length : tagEnd);
      if (/logo|brand/i.test(lead) || BRAND_RE.test(lead)) return true;
    }
    const decls = [...view.slice(from, pos).matchAll(/\b(?:function\s+([A-Z][\w$]*)|(?:const|let)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=)/g)];
    const comp = decls.filter((d) => d[1] || /^[A-Z]/.test(d[2] ?? '')).pop();
    const nameOf = (d) => d && (d[1] ?? d[2]);
    if (comp && (/Logo|Brand/.test(nameOf(comp)) || new RegExp(`^(${RULES.brandNames.join('|')})`, 'i').test(nameOf(comp)))) return true;
    const last = decls.pop();
    if (last && /logo|brand/i.test(nameOf(last)) && pos - (from + last.index) < 1500) return true;
    const line = lineText(lineOf(pos));
    if (/<\w*Icon\b[^>]*\bname=["'{]/.test(line) && BRAND_RE.test(line)) return true;
    const ln = lineOf(pos);
    const near = src.slice(lineStarts[Math.max(0, ln - 4)], pos);
    const obj = near.slice(near.lastIndexOf('{') + 1);
    if (new RegExp(`\\b(name|label|key|id|title)\\s*:\\s*['"\`](${RULES.brandNames.join('|')})\\b`, 'i').test(obj)) return true;
    return false;
  }

  /** The {...} object literal around pos, limited to its line. */
  function objectOnLine(pos) {
    const ln = lineOf(pos);
    const ls = lineStarts[ln - 1];
    const text = lineText(ln);
    const at = pos - ls;
    const open = text.lastIndexOf('{', at);
    const close = text.indexOf('}', at);
    return text.slice(open < 0 ? 0 : open, close < 0 ? text.length : close + 1);
  }

  function handleWeightText(s, e, form, numeric, put, conditional = false) {
    const value = src.slice(s, e);
    const alias = value.match(/var\(--font-weight-(light|semibold)(?:\s*,[^)]*)?\)/);
    if (alias) {
      const a = s + alias.index;
      put(a, a + alias[0].length, `var(--font-weight-${RULES.weights.aliases[alias[1]]})`, 'weight-alias');
      return;
    }
    const m = value.match(/^\s*(\d{3}|normal|bold|bolder|lighter)\s*(!important)?\s*$/);
    if (!m) return;
    weightAt(s + value.indexOf(m[1]), m[1], numeric, put, conditional, 'text');
  }

  /** Rewrite one weight literal at pos. kind 'text' = inside a string or CSS; 'number' = bare TS number. */
  function weightAt(pos, w, numeric, put, conditional, kind) {
    const len = w.length;
    if (numeric) {
      const to = RULES.weights.numeric[w];
      if (to) put(pos, pos + len, to, 'weight-numeric');
      else if (!['400', '500', '550'].includes(w)) judge(pos, `weight ${w}`, 'font', '550 (emphasis) or keep', RULES.weights.judgement, 'font');
      return;
    }
    const tok = RULES.weights[w];
    if (!tok || typeof tok !== 'string') {
      judge(pos, `weight ${w}`, 'font', w === '700' || w === 'bold' ? 'keep 700, or var(--font-weight-emphasis)' : 'nearest of regular, medium, emphasis', w === '700' || w === 'bold' ? RULES.weights.judgement : 'Weight with no Geist token', 'font');
      return;
    }
    const rule = conditional ? 'weight-conditional' : w === '600' || w === '550' ? 'weight-600' : w === '375' ? 'weight-375' : w === '500' ? 'weight-500' : 'weight-400';
    if (w === '550' && !conditional) return; // already the right value; leave it
    const text = kind === 'number' ? `'var(--font-weight-${tok})'` : `var(--font-weight-${tok})`;
    put(pos, pos + len, text, rule);
  }

  function sizeAt(pos, n, len, put, kind) {
    const tok = RULES.fontSizes[n];
    if (tok) put(pos, pos + len, kind === 'number' ? `'var(--font-size-${tok})'` : `var(--font-size-${tok})`, 'font-size');
    else {
      const sizes = Object.keys(RULES.fontSizes).map(Number);
      const near = sizes.reduce((x, y) => (Math.abs(y - n) < Math.abs(x - n) ? y : x));
      judge(pos, `size ${n}px`, 'font', `var(--font-size-${RULES.fontSizes[near]}) (${near}px)`, 'Off the type scale', 'font');
    }
  }

  // Unknown token with a token fallback: var(--rd-sys-color-missing, var(--x)) renders as var(--x)
  const plainView = isCss ? cssView(src) : null;
  for (const m of src.matchAll(/var\(--(rd-(?:sys|comp)-color-[a-z0-9-]+)\s*,\s*(var\(--[a-z0-9-]+\))\s*\)/g)) {
    const known = m[1].startsWith('rd-sys') ? T.sysNames.has(m[1].slice(13)) : T.compNames.has(m[1].slice(14));
    if (known) continue;
    if (isCss && plainView[m.index] !== src[m.index]) continue;
    edit(m.index, m.index + m[0].length, m[2], 'unknown-token');
  }

  function cssRoleSwap(pos, role, key) {
    if ((role === 'surface') && /^content-(primary|secondary|tertiary)$/.test(key))
      judge(pos, `${key} as ${role}`, role, 'background-on-base or background-inverse', 'A text colour used as a surface: an inverted (dark) area that turns light in dark mode', 'check');
    else if (role === 'text' && /^background-(base|sunken|subtle|raised)$/.test(key))
      judge(pos, `${key} as text`, role, 'content-inverse, or content-primary if the surface now follows the theme', 'A surface colour used as text: text on an inverted area', 'check');
  }

  // =========================================================================
  if (isCss) {
    const view = cssView(src);
    // @font-face blocks: list Plain ones, skip all
    const faces = [];
    for (const m of view.matchAll(/^([ \t]*)@font-face\s*\{[^}]*\}[ \t]*\n?/gm)) {
      faces.push([m.index, m.index + m[0].length]);
      // The Plain font files are gone and Geist loads globally, so these blocks are dead
      if (/font-family\s*:\s*['"]?Plain\b/.test(m[0])) edit(m.index, m.index + m[0].length, '', 'font-face', '@font-face Plain');
    }
    for (const m of view.matchAll(/([A-Za-z-][\w-]*)\s*:\s*([^;{}]*?)\s*(?=[;}])/g)) {
      const vs = m.index + m[0].indexOf(m[2], m[1].length + 1);
      if (faces.some(([a, b]) => vs >= a && vs < b)) continue;
      // Selectors such as a:hover never end in ; or }, so they don't match
      const prop = m[1];
      if (prop.startsWith('--') && COLOUR_RE.test(m[2])) {
        COLOUR_RE.lastIndex = 0;
        for (const c of m[2].matchAll(COLOUR_RE)) {
          const g = guessRole(prop);
          const pc = parseColour(c[0]);
          judge(vs + c.index, c[0], g, pc && g && T.table[pc.hex]?.[g] ? T.table[pc.hex][g] : '', `Custom property ${prop}; keep it if it is a deliberate fixed colour, else point it at a token`);
        }
        continue;
      }
      COLOUR_RE.lastIndex = 0;
      for (const v of m[2].matchAll(/var\(--rd-sys-color-([a-z0-9-]+)\)/g)) cssRoleSwap(vs + v.index, roleOf(prop), v[1]);
      for (const x of handleValue(prop, vs, vs + m[2].length, 'var', null, {})) edit(x.s, x.e, x.text, x.rule, x.from);
    }
    return finalize();
  }

  // ---- TS / JS
  const lexed = lex(src);
  const { strings, view } = lexed;

  /** Find the property governing position pos on the same line. */
  function propAt(pos) {
    const ls = lineStarts[lineOf(pos) - 1];
    const seg = view.slice(ls, pos);
    const cands = [];
    for (const m of seg.matchAll(/(^|[{,(;])(\s*)(['"]?)([^\s'":,{}()?]+)\3\s*:(?!:)/g)) {
      const ks = ls + m.index + m[1].length + m[2].length;
      const ke = ls + m.index + m[0].length;
      const keyText = src.slice(ks, ke - 1).trim().replace(/^['"]|['"]$/g, '');
      cands.push({ end: ke, prop: keyText, kind: 'key' });
    }
    for (const m of seg.matchAll(/\.style\.(\w+)\s*=(?!=)/g)) cands.push({ end: ls + m.index + m[0].length, prop: m[1], kind: 'hover' });
    for (const m of seg.matchAll(/\.(setAttribute|setProperty)\(\s*(['"])/g)) {
      const qs = ls + m.index + m[0].length;
      const qe = src.indexOf(m[2], qs);
      if (qe > 0 && qe < pos) cands.push({ end: qe + 1, prop: src.slice(qs, qe), kind: 'attr' });
    }
    for (const m of seg.matchAll(/\s([A-Za-z][\w-]*)=\{?/g)) cands.push({ end: ls + m.index + m[0].length, prop: m[1], kind: 'jsx' });
    for (const m of seg.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=(?!=)/g)) cands.push({ end: ls + m.index + m[0].length, prop: null, name: m[1], kind: 'decl' });
    cands.sort((a, b) => b.end - a.end);
    for (const c of cands) {
      // Nothing at top level between the property and pos may end its value
      const between = view.slice(c.end, pos);
      let depth = 0, ok = true;
      for (const ch of between) {
        if ('([{'.includes(ch)) depth++;
        else if (')]}'.includes(ch)) { depth--; if (depth < 0) { ok = false; break; } }
        else if ((ch === ',' || ch === ';') && depth === 0) { ok = false; break; }
      }
      if (c.kind === 'jsx' && between.trim().length && !/^\s*$/.test(between) && view[c.end - 1] !== '{') ok = false;
      if (ok) return c;
      // the closest candidate failed; anything further left is a sibling's value
      if (c.kind !== 'decl') return null;
    }
    return null;
  }

  // 1. Alpha suffix in template literals: `${colour}HH`
  const colourNames = new Set();
  for (const m of view.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:systemColors\.light\[|rdComponentColors\.light\[|sysVar\(|compVar\(|['"]#[0-9a-fA-F]{6}['"])/g)) colourNames.add(m[1]);
  for (const t of strings) {
    if (t.q !== '`') continue;
    for (const ex of t.exprs) {
      if (ex.end < 0) continue;
      const after = src.slice(ex.end + 1, ex.end + 4);
      const mm = after.match(/^([0-9a-fA-F]{2})(?![0-9a-zA-Z])/);
      if (!mm) continue;
      const expr = src.slice(ex.start, ex.end).trim();
      const lr = expr.match(/^(systemColors|rdComponentColors)\.light\[\s*(['"])([\w-]+)\2\s*\]$/);
      const isColour = lr || /^(sysVar|compVar)\(\s*['"][\w-]+['"]\s*\)$/.test(expr) || colourNames.has(expr)
        || /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)+$/.test(expr) && /(color|colour|brand|bg|text|border|fill|accent|primary|secondary|tertiary|surface)$/i.test(expr.split('.').pop())
        || /^[A-Za-z_$][\w$]*$/.test(expr) && /(color|colour|brand|accent)$/i.test(expr);
      if (!isColour) continue;
      // color-mix() and CSS variables mean nothing to a canvas chart
      if (chartAt(ex.start - 2)) { judge(ex.start - 2, `\${${expr}}${mm[1]}`, 'chart', CHART_SUGGESTION, CHART_REASON, lr ? 'light-read' : 'colour'); continue; }
      const exprOut = lr ? `${lr[1] === 'systemColors' ? 'sysVar' : 'compVar'}('${lr[3]}')` : expr;
      const p = pct(parseInt(mm[1], 16) / 255);
      edit(ex.start - 2, ex.end + 3, `color-mix(in srgb, \${${exprOut}} ${p}%, transparent)`, 'alpha-suffix');
    }
  }

  // 2. Light reads, including `const c = systemColors.light` aliases
  const aliasDecls = [];
  for (const m of view.matchAll(/^[ \t]*(?:export\s+)?(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(systemColors|rdComponentColors)\.light\s*;?[ \t]*\n/gm)) {
    aliasDecls.push({ name: m[1], src: m[2], s: m.index, e: m.index + m[0].length });
  }
  for (const m of src.matchAll(/\b(systemColors|rdComponentColors)\.light\[\s*(['"])([\w-]+)\2\s*\]/g)) {
    if (view.slice(m.index, m.index + 5) !== src.slice(m.index, m.index + 5)) continue; // in a comment or string
    const fn = m[1] === 'systemColors' ? 'sysVar' : 'compVar';
    if (chartAt(m.index)) { chartRead(m.index, m[0]); continue; }
    if (edit(m.index, m.index + m[0].length, `${fn}('${m[3]}')`, m[1] === 'systemColors' ? 'light-read' : 'comp-read')) roleSwapCheck(m.index, m[3]);
  }
  for (const a of aliasDecls) {
    const re = new RegExp(`(?<![\\w$.])${a.name.replace(/\$/g, '\\$')}\\[\\s*(['"])([\\w-]+)\\1\\s*\\]`, 'g');
    for (const m of src.matchAll(re)) {
      if (view[m.index] !== src[m.index]) continue;
      if (chartAt(m.index)) { chartRead(m.index, m[0]); continue; }
      if (edit(m.index, m.index + m[0].length, `${a.src === 'systemColors' ? 'sysVar' : 'compVar'}('${m[2]}')`, a.src === 'systemColors' ? 'light-read' : 'comp-read')) roleSwapCheck(m.index, m[2]);
    }
  }
  /** A light read inside a canvas chart option: sysVar() would hand the chart a CSS variable. */
  function chartRead(pos, text) {
    judge(pos, text.replace(/\s+/g, ''), 'chart', CHART_SUGGESTION, CHART_REASON, 'light-read');
  }
  for (const m of view.matchAll(/\b(systemColors|rdComponentColors)\.light\[(?!\s*['"x])/g)) {
    judge(m.index, `${m[1]}.light[dynamic]`, null, "sysVar(key) if key is a SystemColorKey", 'Dynamic key; check the key type and switch to sysVar()', 'light-read');
  }

  /** A neutral text token used as a surface, or a neutral surface token used as text: an inverted
   *  palette (dark nav, white-on-dark). sysVar keeps the light look; in dark mode it flips. */
  function roleSwapCheck(pos, key) {
    const c = propAt(pos);
    const role = roleOf(c?.prop);
    const textNeutral = /^content-(primary|secondary|tertiary)$/.test(key);
    const surfNeutral = /^background-(base|sunken|subtle|raised)$/.test(key);
    if ((role === 'surface' || role === 'border') && textNeutral)
      judge(pos, `${key} as ${role}`, role, role === 'surface' ? 'background-on-base or background-inverse' : 'the token of the surface it sits on', 'A text colour used as a surface: an inverted (dark) area. sysVar keeps it, but it turns light in dark mode', 'check');
    else if (role === 'text' && surfNeutral)
      judge(pos, `${key} as text`, role, 'content-inverse, or content-primary if the surface now follows the theme', 'A surface colour used as text: text on an inverted area', 'check');
  }

  // A constant holding a text token (const brand = content-brand) used as a fill
  for (const m of src.matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:systemColors\.light\[|sysVar\()\s*(['"])content-([\w-]+)\2/g)) {
    if (view[m.index] !== src[m.index]) continue;
    const name = m[1], key = m[3];
    if (!T.sysNames.has(`background-${key}`)) continue;
    const declAt = m.index + m[0].indexOf(name);
    for (const u of view.matchAll(new RegExp(`(?<![\\w$.])${name.replace(/\$/g, '\\$')}(?![\\w$])`, 'g'))) {
      if (u.index === declAt) continue;
      const c = propAt(u.index);
      if (roleOf(c?.prop) === 'surface') judge(u.index, `${name} (content-${key}) as fill`, 'surface', `background-${key}`, `${name} holds a text token; fills use background-${key}, which differs in dark mode`, 'check');
    }
  }

  // 3. referenceColors reads: suggest only
  for (const m of src.matchAll(/\breferenceColors\.(\w+)(?:\?\.)?(?:\[\s*(['"])(\w+)\2\s*\]|\.(\w+))/g)) {
    if (view[m.index] !== src[m.index]) continue;
    const fam = m[1], stop = m[3] ?? m[4];
    const hex = T.ref[fam]?.[stop];
    const c = propAt(m.index);
    const role = roleOf(c?.prop) ?? guessRole(c?.prop ?? c?.name);
    const sug = hex ? (role && T.table[hex]?.[role]) || `${nearest(hex, role)?.name ?? ''}` : '';
    judge(m.index, `referenceColors.${fam}['${stop}']`, role, sug, `Palette value ${hex ?? ''} stays light in dark mode; pick the token for its role`, 'light-read');
  }

  for (const m of view.matchAll(/(?<![\w$.])referenceColors(?![\w$]|\.\w+(\?\.)?(\[|\.))/g)) {
    if (/^\s*import\b/.test(lineText(lineOf(m.index))) || /^\s*[,}]|^\s*\w+\s*[,}]/.test(view.slice(m.index + 15, m.index + 40)) && /import/.test(view.slice(Math.max(0, m.index - 200), m.index))) continue;
    judge(m.index, 'referenceColors', null, 'sysVar() per role', 'The raw palette stays light in dark mode', 'light-read');
  }

  // 4. Theme="dark" surfaces
  for (const m of src.matchAll(/\btheme\s*=\s*\{?\s*['"]dark['"]|\btheme\s*:\s*['"]dark['"]/g)) {
    if (view[m.index] === src[m.index]) judge(m.index, 'theme dark', 'surface', 'remove it so the part follows the theme, or keep it if it should stay dark in both themes', 'A shared component pinned to its dark variant', 'colour');
  }

  // 5. Strings: fonts, weights, sizes, shadows, colours
  const templateEdits = new Map(); // token -> inner edits that need a template literal
  for (const t of strings) {
    if (t.end - t.start < 3) continue;
    const c = propAt(t.start);
    const kind = c?.kind;
    const prop = c?.prop ?? null;
    const name = c?.name ?? prop;
    const numeric = kind === 'jsx' || kind === 'attr' || chartAt(t.start, { kind, hover: kind === 'hover' });
    const styleProp = prop && (roleOf(prop) || /^(font-?family|font-?weight|font-?size|box-?shadow|font)$/i.test(prop) || /weight$/i.test(prop));
    const condSpan = c ? src.slice(c.end, Math.min(src.length, t.end + 40)).split('\n')[0] : '';
    const conditional = c ? /\?/.test(view.slice(c.end, t.start)) || /^\s*:/.test(view.slice(t.end, t.end + 40)) : false;
    const ctx = { kind, name, hover: kind === 'hover', numeric: numeric && /weight|size/i.test(prop ?? ''), byName: kind === 'decl', conditional };
    const form = isTs && kind !== 'attr' ? 'ts' : 'var';
    let inner = [];
    if (styleProp || (kind === 'decl' && /font/i.test(name ?? ''))) {
      for (const [s, e] of t.segs) inner.push(...handleValue(prop, s, e, form, t, ctx));
    } else {
      // CSS text or markup inside a string: declarations and attributes
      let found = false;
      for (const [s, e] of t.segs) {
        const seg = src.slice(s, e);
        const valRe = t.q === "'" ? /(^|[;{\s"'`])([a-z-]+)\s*:\s*([^;"'`}<>]*)/g : /(^|[;{\s"'`])([a-z-]+)\s*:\s*([^;"`}<>]*)/g;
        for (const m of seg.matchAll(valRe)) {
          const p = m[2];
          if (!(roleOf(p) && roleOf(p) !== 'judgement') && !/^(font-family|font-weight|font-size|box-shadow|stop-color)$/.test(p)) continue;
          found = true;
          const vs = s + m.index + m[0].length - m[3].length;
          inner.push(...handleValue(p, vs, vs + m[3].replace(/\s+$/, '').length, 'var', t, { numeric: false }));
        }
        for (const m of seg.matchAll(/\b(fill|stroke|color|stop-color|font-weight|font-size|font-family)=(["'])([^"']*)\2/g)) {
          found = true;
          const vs = s + m.index + m[0].indexOf(m[2]) + 1;
          inner.push(...handleValue(m[1], vs, vs + m[3].length, 'var', t, { numeric: /weight|size/.test(m[1]) }));
        }
      }
      if (!found) {
        // A colour with no property: judge it
        for (const [s, e] of t.segs) {
          const seg = src.slice(s, e);
          if (/^\s*(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d[^)]*\))\s*$/.test(seg)) {
            const lit = seg.trim();
            const a = s + seg.indexOf(lit);
            // const TEXT_PRIMARY = '#1D232F': the name says the role
            if (brandContext(a)) { judge(a, lit, null, 'keep as data and add a rules-mine.json entry', 'Brand colour, keep as data?'); continue; }
            const strong = kind === 'decl' && t.exprs.length === 0 ? strongRole(name) : null;
            if (strong) {
              const r = resolveColour(lit, strong, a, { echarts: chartAt(a), name });
              if (r && r.mix !== undefined) inner.push({ s: a, e: a + lit.length, text: mixOut(r.name, r.mix), rule: 'hex-const' });
              else if (r && isTs) inner.push({ s: a, e: a + lit.length, text: sysOut(r.name, 'whole'), rule: 'hex-const', wholeToken: true });
              else if (r) inner.push({ s: a, e: a + lit.length, text: sysOut(r.name, 'var'), rule: 'hex-const' });
              continue;
            }
            resolveColour(lit, prop && roleOf(prop) === 'judgement' ? 'judgement' : null, a, { echarts: chartAt(a), name });
          } else if (/#[0-9a-fA-F]{6}\b|rgba?\(\s*\d/.test(seg) && seg.length < 200) {
            for (const m of seg.matchAll(COLOUR_RE)) {
              if (/white/i.test(m[0])) continue;
              if (/gradient\(/.test(seg) && !chartAt(s + m.index)) judge(s + m.index, m[0], null, 'a token per stop, or a named variable if it is decorative', 'Colour inside a gradient');
              else resolveColour(m[0], null, s + m.index, { echarts: chartAt(s + m.index), name });
            }
          }
        }
      }
    }
    inner = inner.filter((x) => !blocked(x.rule, x.s, src.slice(x.s, x.e)));
    if (!inner.length) continue;
    const jsxAttr = kind === 'jsx' && src[t.start - 1] === '=';
    t.jsxAttr = jsxAttr;
    if (inner.some((x) => x.wholeToken)) {
      const x = inner.find((y) => y.wholeToken);
      edit(t.start, t.end, jsxAttr ? `{${x.text}}` : x.text, x.rule, src.slice(t.start, t.end));
    } else if (inner.some((x) => x.template) && t.q !== '`') {
      const content = src.slice(t.start + 1, t.end - 1);
      if (content.includes('`') || content.includes('${')) {
        for (const x of inner) edit(x.s, x.e, x.template ? x.text.replace(/^\$\{sysVar\('([\w-]+)'\)\}$/, 'var(--rd-sys-color-$1)') : x.text, x.rule, x.from);
      } else templateEdits.set(t, inner);
    } else {
      for (const x of inner) edit(x.s, x.e, x.text, x.rule, x.from);
    }
  }
  // Template conversion: one edit for the whole string, counted per inner rule
  for (const [t, inner] of templateEdits) {
    if (overlaps(t.start, t.end)) continue;
    let content = src.slice(t.start + 1, t.end - 1);
    const base = t.start + 1;
    for (const x of [...inner].sort((a, b) => b.s - a.s)) content = content.slice(0, x.s - base) + x.text + content.slice(x.e - base);
    claimed.push([t.start, t.end]);
    edits.push({ s: t.start, e: t.end, text: t.jsxAttr ? '{`' + content + '`}' : '`' + content + '`', rule: inner[0].rule, line: lineOf(t.start), from: src.slice(t.start, t.end) });
    for (const x of inner.slice(1)) extraHits.push({ rule: x.rule, line: lineOf(x.s), from: src.slice(x.s, x.e), text: x.text });
  }

  // 6. Bare numbers: fontWeight: 600, fontSize: 14, conditionals
  for (const m of view.matchAll(/(?:(^|[{,(;\s])(['"]?)([A-Za-z-]*[wW]eight|fontSize|font-size)\2\s*:(?!:)|\.style\.(fontWeight|fontSize)\s*=(?!=)|\s(fontWeight|fontSize)=\{)/g)) {
    const prop = m[3] ?? m[4] ?? m[5];
    const jsx = !!m[5];
    const vs = m.index + m[0].length;
    // value runs to the next top-level , ; } ) or end of line
    let depth = 0, ve = vs;
    for (; ve < view.length; ve++) {
      const ch = view[ve];
      if (ch === '\n') break;
      if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) { if (depth === 0) break; depth--; }
      else if ((ch === ',' || ch === ';') && depth === 0) break;
    }
    const valueView = view.slice(vs, ve);
    const conditional = /\?/.test(valueView);
    const isWeight = /weight/i.test(prop);
    const numeric = jsx || chartAt(vs, { hover: !!m[4] });
    if (!isWeight && numeric) continue;
    for (const n of valueView.matchAll(/(?<![\w.'"#$-])(\d+(?:\.\d+)?)(?![\w.%'"])/g)) {
      const pos = vs + n.index;
      if (view[pos - 1] === 'x') continue;
      const put = (a, b, text, rule) => edit(a, b, text, rule);
      if (isWeight) {
        if (/^\d{3}$/.test(n[1])) weightAt(pos, n[1], numeric, put, conditional, 'number');
      } else sizeAt(pos, n[1], n[1].length, put, 'number');
    }
  }

  return finalize();

  // =========================================================================
  function finalize() {
    edits.sort((a, b) => a.s - b.s || a.e - b.e);
    let out = '';
    let at = 0;
    for (const x of edits) {
      if (x.s < at) continue;
      out += src.slice(at, x.s) + x.text;
      at = x.e;
    }
    out += src.slice(at);
    // Alias declarations no longer used
    if (!isCss) {
      for (const m of out.matchAll(/^[ \t]*(?:export\s+)?(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(systemColors|rdComponentColors)\.light\s*;?[ \t]*\n/gm)) {
        const name = m[1];
        const uses = (out.match(new RegExp(`(?<![\\w$.])${name.replace(/\$/g, '\\$')}(?![\\w$])`, 'g')) ?? []).length;
        if (uses === 1) {
          let s = m.index, e = m.index + m[0].length;
          if (out[e] === '\n' && (s === 0 || out[s - 1] === '\n') && out[s - 2] === '\n') e++;
          out = out.slice(0, s) + out.slice(e);
          edits.push({ rule: 'light-read', line: lineOf(src.indexOf(m[0])), from: m[0].trim(), text: '(removed)', alias: true });
        } else {
          judge(src.indexOf(m[0]), `${name} = ${m[2]}.light`, null, 'sysVar(key)', `${name} is still used in a way the codemod can't rewrite`, 'light-read');
        }
      }
    }
    if (isTs) out = fixImports(out);
    const hits = [...edits, ...extraHits];
    return {
      out,
      hits: hits.map((x) => ({ rule: x.rule, line: x.line, from: x.from, to: x.text })),
      judgement: judgement.map((j) => ({ ...j, text: lineText(j.line).trim().slice(0, 160) })),
      allowedLines: [...allowedLines],
      skippedByRule,
    };
  }
}

// ---------------------------------------------------------------------------
// Imports: add sysVar / compVar / shadowVar, drop systemColors / rdComponentColors when unused

const COLORS_PATH = /^(@tokens\/colors|(\.\.?\/)+(.*\/)?tokens\/colors)(\/(index|system|component))?$/;

function fixImports(out) {
  const { view } = lex(out);
  const used = (name, exclude = []) => {
    const re = new RegExp(`(?<![\\w$.'"])${name}(?![\\w$])`, 'g');
    let n = 0;
    for (const m of view.matchAll(re)) if (!exclude.some(([a, b]) => m.index >= a && m.index < b)) n++;
    return n;
  };
  const imports = [];
  for (const m of out.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s*from\s*(['"])([^'"]+)\3;?/g)) {
    if (COLORS_PATH.test(m[4]) && !m[1]) imports.push({ s: m.index, e: m.index + m[0].length, names: m[2].split(',').map((x) => x.trim()).filter(Boolean), path: m[4], quote: m[3], text: m[0] });
  }
  const ranges = imports.map((i) => [i.s, i.e]);
  const need = ['sysVar', 'compVar', 'shadowVar'].filter((n) => used(n, ranges) > 0 && !imports.some((i) => i.names.some((x) => x.split(/\s+as\s+/).pop() === n)));
  // also imported from somewhere else (e.g. @tokens)?
  const elsewhere = (n) => new RegExp(`import[^;]*\\b${n}\\b[^;]*from`).test(out);
  const toAdd = need.filter((n) => !elsewhere(n));
  const changes = [];
  for (const imp of imports) {
    let names = imp.names.filter((x) => {
      const local = x.split(/\s+as\s+/).pop();
      if (!['systemColors', 'rdComponentColors'].includes(local)) return true;
      return used(local, ranges) > 0;
    });
    changes.push({ imp, names });
  }
  // where to add
  let target = changes.find((c) => /tokens\/colors(\/index)?$/.test(c.imp.path));
  if (!target && toAdd.every((n) => n !== 'compVar')) target = changes.find((c) => /\/system$/.test(c.imp.path));
  let newLine = '';
  if (toAdd.length) {
    if (target) target.names.push(...toAdd);
    else newLine = `import { ${toAdd.join(', ')} } from '@tokens/colors';\n`;
  }
  let res = out;
  for (const c of [...changes].sort((a, b) => b.imp.s - a.imp.s)) {
    const same = c.names.length === c.imp.names.length && c.names.every((x, i) => x === c.imp.names[i]);
    if (same) continue;
    if (!c.names.length) {
      let e = c.imp.e;
      if (res[e] === '\n') e++;
      res = res.slice(0, c.imp.s) + res.slice(e);
    } else {
      const multi = c.imp.text.includes('\n');
      const body = multi ? `{\n  ${c.names.join(',\n  ')},\n}` : `{ ${c.names.join(', ')} }`;
      const semi = c.imp.text.trimEnd().endsWith(';') ? ';' : '';
      res = res.slice(0, c.imp.s) + `import ${body} from ${c.imp.quote}${c.imp.path}${c.imp.quote}${semi}` + res.slice(c.imp.e);
    }
  }
  if (newLine) {
    const all = [...res.matchAll(/^import\s[\s\S]*?from\s*['"][^'"]+['"];?[ \t]*$|^import\s+['"][^'"]+['"];?[ \t]*$/gm)];
    const last = all.length ? all[all.length - 1] : null;
    const at = last ? last.index + last[0].length + 1 : 0;
    res = res.slice(0, at) + newLine + res.slice(at);
  }
  return res;
}

// ---------------------------------------------------------------------------
// Files

function walk(p, out, stats) {
  const abs = path.resolve(p);
  const norm = abs.split(path.sep).join('/');
  const isProtected = (x) => (x.endsWith('/') ? norm.includes(x) || norm.endsWith(x.slice(0, -1)) : norm.endsWith(x));
  // Inside this repo only prototype folders are targets; the shared layers are migrated by hand
  const rootNorm = ROOT.split(path.sep).join('/');
  const inRepoSrc = norm.startsWith(`${rootNorm}/src/`) || norm === `${rootNorm}/src`;
  const inPrototypes = norm.startsWith(`${rootNorm}/src/prototypes/`) || norm === `${rootNorm}/src/prototypes`;
  if (RULES.protectedPaths.some(isProtected) || (inRepoSrc && !inPrototypes && fs.statSync(abs).isFile())) {
    stats.protected++;
    return out;
  }
  if (!INCLUDE_VENDOR && (norm.includes(RULES.skipSegment) || norm.endsWith(RULES.skipSegment.slice(0, -1)))) {
    stats.vendor += fs.statSync(abs).isDirectory() ? countFiles(abs) : 1;
    return out;
  }
  const st = fs.statSync(abs);
  if (st.isDirectory()) {
    for (const f of fs.readdirSync(abs).sort()) if (f !== 'node_modules' && !f.startsWith('.')) walk(path.join(abs, f), out, stats);
  } else if (/\.(tsx?|jsx?|css)$/.test(abs) && !/\.(test|spec)\.[tj]sx?$/.test(abs) && !abs.endsWith('.d.ts')) out.push(abs);
  return out;
}

function countFiles(dir) {
  let n = 0;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) n += countFiles(p);
    else if (/\.(tsx?|jsx?|css)$/.test(f)) n++;
  }
  return n;
}

const display = (f) => {
  const r = path.relative(ROOT, f).split(path.sep).join('/');
  if (!r.startsWith('..')) return r;
  const m = f.split(path.sep).join('/').match(/(src\/prototypes\/.*)$/);
  return m ? m[1] : f;
};

function protoRoot(file) {
  const m = file.split(path.sep).join('/').match(/^(.*\/src\/prototypes\/[^/]+)\//);
  return m ? m[1] : null;
}

// Accepted exceptions from the scan's rules.json and rules-mine.json: a colour the designer
// marked as data (a logo, a user-picked colour) is neither rewritten nor listed.
const readJson = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {});
const SCAN_RULES = readJson(path.join(HERE, 'rules.json'));
const MINE_RULES = readJson(path.join(HERE, 'rules-mine.json'));
const ALLOW = [...(SCAN_RULES.allow ?? []), ...(MINE_RULES.allow ?? [])];
const EXCLUDE = [...(SCAN_RULES.exclude ?? []), ...(MINE_RULES.exclude ?? [])];
const ruleMatches = (file, pattern) => (pattern.endsWith('/') ? file.startsWith(pattern) : file === pattern);
function allowedBy(file, kind, line) {
  const hit = ALLOW.filter((a) => ruleMatches(file, a.path) && (!a.kinds || a.kinds.includes(kind)) && (!a.match || line.includes(a.match)));
  if (!hit.length) return false;
  return hit.some((a) => a.match) ? 'line' : 'file';
}

/** Run the codemod over paths. Returns a report; writes files when opts.write. */
// --include-vendor: migrate vendor/ folders too, when the owner has decided that code is theirs to change
let INCLUDE_VENDOR = false;

export function migrate(targets, opts = {}) {
  INCLUDE_VENDOR = !!opts.includeVendor;
  const stats = { vendor: 0, protected: 0, excluded: 0 };
  const files = targets.flatMap((t) => walk(path.resolve(ROOT, t), [], stats)).filter((f) => {
    if (!opts.ignoreAllow && EXCLUDE.some((e) => ruleMatches(display(f), e))) { stats.excluded++; return false; }
    return true;
  });
  const skippedByRule = {};
  const rules = {};
  const judgement = [];
  const allowed = [];
  const changed = [];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const d = display(f);
    const res = migrateText(src, f, { ...opts, display: d, allowed: opts.ignoreAllow ? null : allowedBy });
    for (const h of res.hits) {
      rules[h.rule] ??= { count: 0, sample: null };
      rules[h.rule].count++;
      rules[h.rule].sample ??= `${d}:${h.line}  ${h.from.trim().slice(0, 70)}  ->  ${h.to.slice(0, 70)}`;
    }
    for (const j of res.judgement) judgement.push({ file: d, abs: f, ...j });
    for (const l of res.allowedLines) allowed.push(`${d}:${l}`);
    for (const [r, n] of Object.entries(res.skippedByRule)) skippedByRule[r] = (skippedByRule[r] ?? 0) + n;
    if (res.out !== src) {
      changed.push(d);
      if (opts.write) fs.writeFileSync(f, res.out);
    }
  }
  // Group judgement by distinct value
  const groups = {};
  for (const j of judgement) {
    const key = `${j.kind}|${j.value.toUpperCase()}|${j.role}`;
    groups[key] ??= { value: j.value, kind: j.kind, role: j.role, suggestion: j.suggestion, reason: j.reason, at: [] };
    groups[key].at.push({ file: j.file, line: j.line, text: j.text });
  }
  const grouped = Object.values(groups).sort((a, b) => b.at.length - a.at.length || a.value.localeCompare(b.value));
  const todos = [];
  if (opts.write) {
    const roots = new Set(files.map(protoRoot).filter(Boolean));
    for (const r of roots) {
      const mine = judgement.filter((j) => protoRoot(j.abs) === r);
      const p = path.join(r, 'migration-todo.md');
      if (mine.length) {
        fs.writeFileSync(p, todoMarkdown(path.basename(r), mine));
        todos.push(display(p));
      } else if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  }
  return { files: files.length, changed, allowed, skippedVendor: stats.vendor, skippedProtected: stats.protected, skippedExcluded: stats.excluded, skippedByRule, rules, judgement: grouped, judgementCount: judgement.length, todos };
}

function todoMarkdown(name, items) {
  const groups = {};
  for (const j of items) (groups[`${j.kind}|${j.value.toUpperCase()}|${j.role}`] ??= { ...j, at: [] }).at.push(`${j.file}:${j.line}`);
  const lines = [
    `# ${name}: migration to do`,
    '',
    'Written by `scripts/radiant-check/codemod.mjs --write`. These need a decision; the codemod did not change them.',
    'Work through each, then run the codemod again: this file is deleted when the list is empty.',
    'For a value that is data (a logo, a user-picked colour), leave it and add an entry to `scripts/radiant-check/rules-mine.json`.',
    '',
    '| Value | Role | Suggestion | Reason | Where |',
    '|---|---|---|---|---|',
  ];
  const esc = (s) => String(s).replace(/\|/g, '\\|');
  for (const g of Object.values(groups).sort((a, b) => b.at.length - a.at.length)) {
    lines.push(`| \`${esc(g.value)}\` | ${g.role} | ${esc(g.suggestion)} | ${esc(g.reason)} | ${g.at.map((x) => `\`${x}\``).join('<br>')} |`);
  }
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// CLI

function main() {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const skipArg = argv.find((a) => a.startsWith('--skip='));
  const targets = argv.filter((a) => !a.startsWith('--'));
  if (!targets.length) {
    console.error('Usage: node scripts/radiant-check/codemod.mjs <path...> [--write] [--json] [--include-vendor] [--skip=rule,rule]');
    process.exit(2);
  }
  const report = migrate(targets, { write: flags.has('--write'), includeVendor: flags.has('--include-vendor'), skip: skipArg ? skipArg.slice(7).split(',') : [] });
  if (flags.has('--json')) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`${flags.has('--write') ? 'Codemod' : 'Codemod dry run'}: ${report.files} files, ${report.changed.length} ${flags.has('--write') ? 'changed' : 'would change'}`);
  if (report.skippedVendor) console.log(`Skipped ${report.skippedVendor} files in vendor/`);
  if (report.skippedProtected) console.log(`Skipped ${report.skippedProtected} files outside prototype folders (tokens, components, spotter, pages and so on)`);
  if (report.skippedExcluded) console.log(`Skipped ${report.skippedExcluded} files excluded by rules.json / rules-mine.json`);
  const sk = Object.entries(report.skippedByRule);
  if (sk.length) console.log(`Left alone by allow entries in rules.json / rules-mine.json: ${sk.map(([r, n]) => `${r} ${n}`).join(', ')}`);
  console.log(`\n${pad('Rule', 20)}${pad('Count', 7)}Sample`);
  for (const [r, v] of Object.entries(report.rules).sort((a, b) => b[1].count - a[1].count)) console.log(`${pad(r, 20)}${pad(v.count, 7)}${v.sample}`);
  console.log(`\nJudgement list: ${report.judgementCount} items, ${report.judgement.length} distinct values`);
  for (const g of report.judgement) {
    console.log(`\n  ${g.value}  [${g.kind}, ${g.role}]  ${g.at.length}x`);
    if (g.suggestion) console.log(`    suggestion: ${g.suggestion}`);
    console.log(`    reason: ${g.reason}`);
    for (const a of g.at.slice(0, 6)) console.log(`    ${a.file}:${a.line}`);
    if (g.at.length > 6) console.log(`    ... and ${g.at.length - 6} more`);
  }
  if (report.todos.length) console.log(`\nWrote ${report.todos.join(', ')}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
