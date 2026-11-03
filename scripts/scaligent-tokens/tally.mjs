#!/usr/bin/env node
/**
 * Compares Radiant Play's colour tokens (src/styles/tokens.css) with the
 * ThoughtSpot product's tokens (Scaligent radiant-styles SCSS maps).
 *
 * Statuses per token, light and dark values compared:
 *   match           same name, same light and dark value
 *   differs         same name, a value differs
 *   proposed        Radiant Play only (or our older alias of a Scaligent name)
 *   scaligent-only  Scaligent has it, we don't
 *
 * Figma wins on values, so "differs" is a gap to report, not a change for us.
 *
 * Usage:
 *   npm run scaligent-tokens:tally                 summary and details
 *   npm run scaligent-tokens:tally -- --summary    summary only
 *   npm run scaligent-tokens:tally -- --markdown   markdown tables
 *   npm run scaligent-tokens:tally -- --names      three-way name check with Figma
 *
 * Scaligent checkout: SCALIGENT_DIR, else rules.json scaligentDirDefault.
 * Reads source files only; no Scaligent build needed.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const rules = JSON.parse(fs.readFileSync(path.join(HERE, 'rules.json'), 'utf8'));
const args = new Set(process.argv.slice(2));

const expandHome = p => (p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p);
const SC = expandHome(process.env.SCALIGENT_DIR || rules.scaligentDirDefault);
if (!fs.existsSync(path.join(SC, rules.scaligentFiles.system))) {
  console.error(`Scaligent token files not found under ${SC}.`);
  console.error('Set SCALIGENT_DIR to your Scaligent checkout, for example:');
  console.error('  SCALIGENT_DIR=~/code/scaligent npm run scaligent-tokens:tally');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Value normalisation
// ---------------------------------------------------------------------------

const hex2 = n => Math.round(n).toString(16).padStart(2, '0');

/** Any CSS colour we use to lowercase #rrggbbaa, or null if it isn't one. */
function normColor(raw) {
  const s = raw.trim().toLowerCase();
  if (s === 'transparent') return '#00000000';
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('');
    if (h.length === 6) h += 'ff';
    return h.length === 8 ? '#' + h : null;
  }
  m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+%?)\s*)?\)$/);
  if (m) {
    let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return '#' + hex2(+m[1]) + hex2(+m[2]) + hex2(+m[3]) + hex2(a * 255);
  }
  return null;
}

/** Split on commas that are not inside parentheses. */
function splitTop(s) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map(x => x.trim()).filter(Boolean);
}

/** A resolved value (colour or box-shadow) to a comparable string. */
function normValue(v) {
  const c = normColor(v);
  if (c) return c;
  const layers = splitTop(v).map(layer => {
    const parts = layer.match(/rgba?\([^)]*\)|#[0-9a-fA-F]+|\S+/g) || [];
    const lengths = parts.filter(p => /^-?[\d.]+(px)?$/.test(p)).map(p => parseFloat(p));
    while (lengths.length < 4) lengths.push(0);
    const color = parts.map(normColor).find(Boolean) || '?';
    return `${lengths.join(' ')} ${color}`;
  });
  return layers.join(', ');
}

// ---------------------------------------------------------------------------
// Scaligent SCSS
// ---------------------------------------------------------------------------

const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

function parseReference(file) {
  const src = stripComments(fs.readFileSync(file, 'utf8'));
  const raw = {};
  for (const m of src.matchAll(/^\s*\$(rd-ref-[a-z0-9-]+)\s*:\s*([^;]+);/gm)) raw[m[1]] = m[2].trim();
  const cache = {};
  const resolve = name => {
    if (name in cache) return cache[name];
    let v = raw[name];
    if (v === undefined) throw new Error(`Unknown Scaligent reference $${name}`);
    v = v.replace(/\$(rd-ref-[a-z0-9-]+)/g, (_, n) => resolve(n));
    // rgba(#hex, a) is SCSS-only syntax
    const m = v.match(/^rgba\(\s*(#[0-9a-fA-F]{3,8})\s*,\s*([\d.]+)\s*\)$/);
    if (m) v = normColor(m[1]).slice(0, 7) + hex2(parseFloat(m[2]) * 255);
    return (cache[name] = v);
  };
  return resolve;
}

/** All `$name: ( ... );` maps in a file, as { name: { key: rawValue } }. */
function parseMaps(file) {
  const src = stripComments(fs.readFileSync(file, 'utf8'));
  const maps = {};
  for (const m of src.matchAll(/\$([a-z0-9-]+)\s*:\s*\(/g)) {
    let i = m.index + m[0].length, depth = 1, body = '';
    while (i < src.length && depth > 0) {
      const ch = src[i++];
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (depth > 0) body += ch;
    }
    const entries = {};
    for (const item of splitTop(body)) {
      const e = item.match(/^'([a-z0-9-]+)'\s*:\s*([\s\S]+)$/);
      if (e) entries[e[1]] = e[2].trim();
    }
    maps[m[1]] = entries;
  }
  return maps;
}

function loadScaligent() {
  const ref = parseReference(path.join(SC, rules.scaligentFiles.reference));
  const resolveRaw = (raw, sysOfMode) => {
    let v = raw.replace(/^\(([\s\S]*)\)$/, '$1');
    v = v.replace(/rd-sys-color\('([a-z0-9-]+)'\)/g, (_, n) => sysOfMode[n]);
    v = v.replace(/\$(rd-ref-[a-z0-9-]+)/g, (_, n) => ref(n));
    return v;
  };

  const sysMaps = parseMaps(path.join(SC, rules.scaligentFiles.system));
  const sys = { light: {}, dark: {} };
  for (const mode of ['light', 'dark']) {
    for (const [k, raw] of Object.entries(sysMaps[rules.systemMaps[mode]])) sys[mode][k] = resolveRaw(raw, sys[mode]);
  }

  const comp = { light: {}, dark: {} };
  const dir = path.join(SC, path.dirname(rules.scaligentFiles.componentGlob));
  const prefix = path.basename(rules.scaligentFiles.componentGlob).split('*')[0];
  for (const f of fs.readdirSync(dir).filter(f => f.startsWith(prefix)).sort()) {
    const maps = parseMaps(path.join(dir, f));
    for (const [name, entries] of Object.entries(maps)) {
      const mode = new RegExp(rules.componentMapPattern.dark).test(name) ? 'dark'
        : new RegExp(rules.componentMapPattern.light).test(name) ? 'light' : null;
      if (!mode) continue;
      for (const [k, raw] of Object.entries(entries)) comp[mode][k] = resolveRaw(raw, sys[mode]);
    }
  }
  return { sys, comp };
}

// ---------------------------------------------------------------------------
// Radiant Play tokens.css
// ---------------------------------------------------------------------------

function cssBlocks(src) {
  const blocks = [];
  for (const m of src.matchAll(/(^|\n)([^{}\n]+)\{([^{}]*)\}/g)) blocks.push({ selector: m[2].trim(), body: m[3] });
  return blocks;
}

function loadOurs() {
  const src = stripComments(fs.readFileSync(path.join(ROOT, rules.oursFile), 'utf8'));
  const decls = body => Object.fromEntries([...body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
  const blocks = cssBlocks(src);
  const pick = sel => Object.assign({}, ...blocks.filter(b => b.selector === sel).map(b => decls(b.body)));
  const light = { ...pick(':root'), ...pick('[data-theme="light"]') };
  const dark = { ...light, ...pick('[data-theme="dark"]') };
  const resolver = vars => {
    const resolve = (v, seen = new Set()) => v.replace(/var\((--[a-z0-9-]+)(?:\s*,[^)]*)?\)/g, (_, n) => {
      if (seen.has(n) || !(n in vars)) return `var(${n})`;
      return resolve(vars[n], new Set([...seen, n]));
    });
    return name => (name in vars ? resolve(vars[name]) : undefined);
  };
  return { light: resolver(light), dark: resolver(dark), names: new Set(Object.keys(light).concat(Object.keys(dark))) };
}

// ---------------------------------------------------------------------------
// Tally
// ---------------------------------------------------------------------------

function tally(layer, scMode, ours) {
  const prefix = layer === 'system' ? '--rd-sys-color-' : '--rd-comp-color-';
  const nameMap = rules.nameMap[layer] || {};
  const rows = [];
  const claimed = new Set();
  const names = new Set([...Object.keys(scMode.light), ...Object.keys(scMode.dark)]);

  for (const name of [...names].sort()) {
    const ourVar = nameMap[name] || prefix + name;
    const scLight = scMode.light[name];
    const scDark = scMode.dark[name] ?? scLight;
    if (!ours.names.has(ourVar)) {
      rows.push({ name, status: 'scaligent-only', scLight, scDark });
      continue;
    }
    claimed.add(ourVar);
    const oLight = ours.light(ourVar), oDark = ours.dark(ourVar);
    const diffs = [];
    if (scLight !== undefined && normValue(scLight) !== normValue(oLight)) diffs.push(`light ours ${normValue(oLight)} vs Scaligent ${normValue(scLight)}`);
    if (scLight === undefined) diffs.push('Scaligent has no light value');
    if (scDark !== undefined && normValue(scDark) !== normValue(oDark)) diffs.push(`dark ours ${normValue(oDark)} vs Scaligent ${normValue(scDark)}`);
    rows.push({ name, ours: ourVar !== prefix + name ? ourVar : undefined, status: diffs.length ? 'differs' : 'match', diffs });
  }

  for (const v of [...ours.names].filter(n => n.startsWith(prefix)).sort()) {
    if (claimed.has(v)) continue;
    const short = v.slice(prefix.length);
    const alias = rules.aliases[short];
    const note = alias ? `older name for ${alias}` : rules.proposed[short] || 'no rationale in rules.json yet';
    rows.push({ name: short, status: 'proposed', note });
  }
  return rows;
}

const STATUSES = ['match', 'differs', 'proposed', 'scaligent-only'];
const counts = rows => Object.fromEntries(STATUSES.map(s => [s, rows.filter(r => r.status === s).length]));

function namesCheck(scaligent, ours) {
  const kebab = s => s.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
  const snap = JSON.parse(fs.readFileSync(path.join(ROOT, rules.figmaSnapshot), 'utf8'));
  const figmaRaw = Object.entries(snap.variables).filter(([, x]) => x.collection === 'Theme').map(([k]) => kebab(k));
  const shadowPart = n => rules.figmaShadowParts.find(s => n.startsWith(s + '-'));
  const figma = new Set(figmaRaw.map(n => rules.figmaNameMap[n] || shadowPart(n) || n));
  const sc = new Set([...Object.keys(scaligent.sys.light), ...Object.keys(scaligent.comp.light), ...Object.keys(scaligent.comp.dark)]);
  const ourNames = new Set([...ours.names].filter(n => /^--rd-(sys|comp)-color-/.test(n)).map(n => n.replace(/^--rd-(sys|comp)-color-/, '')));
  for (const [scName, ourVar] of Object.entries({ ...rules.nameMap.system, ...rules.nameMap.component })) {
    if (!ours.names.has(ourVar)) continue;
    ourNames.delete(ourVar.replace(/^--rd-(sys|comp)-color-/, ''));
    ourNames.add(scName);
  }
  const groups = {};
  for (const n of new Set([...figma, ...sc, ...ourNames])) {
    const key = [figma.has(n) ? 'Figma' : null, sc.has(n) ? 'Scaligent' : null, ourNames.has(n) ? 'ours' : null].filter(Boolean).join(' + ');
    (groups[key] ??= []).push(n);
  }
  const renamed = figmaRaw.filter(n => rules.figmaNameMap[n] || shadowPart(n)).length;
  return { groups, renamed };
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const scaligent = loadScaligent();
const ours = loadOurs();
const layers = {
  system: tally('system', scaligent.sys, ours),
  component: tally('component', scaligent.comp, ours),
};

if (args.has('--names')) {
  const { groups, renamed } = namesCheck(scaligent, ours);
  console.log(`Name check across Figma, Scaligent and ours (${renamed} Figma names mapped through rules.json figmaNameMap and figmaShadowParts)\n`);
  for (const k of Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length)) {
    console.log(`${k}: ${groups[k].length}`);
    if (!args.has('--summary')) console.log('  ' + groups[k].sort().join(' ') + '\n');
  }
  process.exit(0);
}

if (args.has('--markdown')) {
  for (const [layer, rows] of Object.entries(layers)) {
    const c = counts(rows);
    console.log(`### ${layer[0].toUpperCase() + layer.slice(1)} tokens\n`);
    console.log('| Status | Count |\n|---|---|');
    for (const s of STATUSES) console.log(`| ${s} | ${c[s]} |`);
    console.log('\n| Token | Status | Detail |\n|---|---|---|');
    for (const r of rows.filter(r => r.status !== 'match')) {
      const detail = r.status === 'differs' ? r.diffs.join('; ') : r.status === 'proposed' ? r.note : 'not in tokens.css';
      console.log(`| \`${r.name}\`${r.ours ? ` (ours \`${r.ours}\`)` : ''} | ${r.status} | ${detail} |`);
    }
    console.log('');
  }
  process.exit(0);
}

console.log(`Scaligent: ${SC}\n`);
for (const [layer, rows] of Object.entries(layers)) {
  const c = counts(rows);
  const scCount = rows.filter(r => r.status !== 'proposed').length;
  console.log(`${layer}: Scaligent ${scCount}, ours ${c.match + c.differs + c.proposed}  |  ` + STATUSES.map(s => `${s} ${c[s]}`).join(', '));
}
if (!args.has('--summary')) {
  for (const [layer, rows] of Object.entries(layers)) {
    console.log(`\n== ${layer}`);
    for (const s of ['differs', 'scaligent-only', 'proposed']) {
      const list = rows.filter(r => r.status === s);
      if (!list.length) continue;
      console.log(`\n  ${s} (${list.length})`);
      for (const r of list) {
        const detail = s === 'differs' ? r.diffs.join('; ') : s === 'proposed' ? r.note : '';
        console.log(`    ${r.name}${r.ours ? ` (ours ${r.ours})` : ''}${detail ? `: ${detail}` : ''}`);
      }
    }
  }
}
