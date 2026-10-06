#!/usr/bin/env node
/**
 * Compare the Figma snapshot with Radiant Play's tokens.
 *
 * Three sources are compared:
 *   Figma     scripts/figma-tokens/snapshot/{variables,styles}.json
 *   TS        src/tokens/* (bundled with esbuild, since Node can't resolve
 *             the ./colors directory import natively)
 *   CSS       src/styles/tokens.css (hand-written)
 *
 * Name mapping and decisions live in rules.json.
 *
 * Usage:
 *   node scripts/figma-tokens/diff.mjs            summary + details
 *   node scripts/figma-tokens/diff.mjs --summary  summary only
 *   node scripts/figma-tokens/diff.mjs --json out.json   also write the full report
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const args = process.argv.slice(2);
const SUMMARY_ONLY = args.includes('--summary');
const JSON_OUT = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;

const readJson = async (p) => JSON.parse(await fs.readFile(path.join(HERE, p), 'utf8'));
const rules = await readJson('rules.json');
const { variables } = await readJson('snapshot/variables.json');
const styles = await readJson('snapshot/styles.json');

// ---------------------------------------------------------------- load TS tokens

async function loadTokens() {
  const outfile = path.join(os.tmpdir(), `rp-tokens-${process.pid}.mjs`);
  await build({
    entryPoints: [path.join(ROOT, 'src/tokens/index.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile,
    logLevel: 'silent',
  });
  try {
    return await import(pathToFileURL(outfile).href);
  } finally {
    await fs.rm(outfile, { force: true });
  }
}
const tokens = await loadTokens();

// ---------------------------------------------------------------- helpers

function normColor(v) {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  const h2 = (n) => Math.round(n).toString(16).padStart(2, '0');
  let m = s.match(/^#([0-9a-f]{3})$/);
  if (m) return '#' + [...m[1]].map((c) => c + c).join('');
  if (/^#[0-9a-f]{6}$/.test(s)) return s;
  m = s.match(/^#([0-9a-f]{6})([0-9a-f]{2})$/);
  if (m) return m[2] === 'ff' ? `#${m[1]}` : s;
  m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (m) {
    const a = m[4] === undefined ? 1 : Number(m[4]);
    return `#${h2(m[1])}${h2(m[2])}${h2(m[3])}${a < 1 ? h2(a * 255) : ''}`;
  }
  return s;
}

const kebab = (s) => s.toLowerCase().replace(/\s+/g, '-');
const pad2 = (s) => (/^\d$/.test(s) ? `0${s}` : s);

function newSection(title) {
  return { title, match: [], differs: [], figmaOnly: [], oursOnly: [] };
}

// ---------------------------------------------------------------- Figma → ours name mapping

function semanticKey(name) {
  return rules.semantic.overrides[name] ?? name.split('/').map(kebab).join('-');
}

function componentKey(name) {
  if (rules.component.overrides[name]) return rules.component.overrides[name];
  const parts = name.split('/');
  if (parts[0] === 'Button' && parts[1] === 'Background') parts.splice(1, 1);
  return parts.map(kebab).join('-');
}

function primitiveRef(name) {
  // Color/<Hue>/<Stop>, Space/<L>, Radius/<n> px
  const [group, a, b] = name.split('/');
  if (group === 'Space') return { obj: tokens.spacing, key: a, label: `spacing.${a}` };
  if (group === 'Radius') {
    const key = rules.primitive.radius[name];
    return { obj: tokens.radius, key, label: `radius.${key}` };
  }
  const hue = rules.primitive.hueMap[a];
  if (/A$/.test(b)) {
    const key = `${kebab(a)}-${b.toLowerCase()}`;
    return { obj: tokens.referenceColors.alpha, key, label: `alpha['${key}']` };
  }
  const key = pad2(b);
  return { obj: tokens.referenceColors[hue] ?? {}, key, label: `${hue}['${key}']` };
}

// ---------------------------------------------------------------- 1. primitives

const prim = newSection('Primitives (reference colours, spacing, radius)');
const seenPrim = new Set();
for (const [name, v] of Object.entries(variables)) {
  if (v.collection !== 'Primitive') continue;
  const ref = primitiveRef(name);
  seenPrim.add(ref.label);
  const ours = ref.obj?.[ref.key];
  const fig = v.values.light.value;
  if (ours === undefined) prim.figmaOnly.push(`${name} = ${fig}  (would be ${ref.label})`);
  else if ((v.type === 'COLOR' ? normColor(ours) === fig : Number(ours) === fig)) prim.match.push(name);
  else prim.differs.push(`${name}: ours ${ours}, Figma ${fig}  (${ref.label})`);
}
for (const [hue, scale] of Object.entries(tokens.referenceColors)) {
  if (typeof scale !== 'object') continue;
  for (const key of Object.keys(scale)) {
    const label = hue === 'alpha' ? `alpha['${key}']` : `${hue}['${key}']`;
    if (!seenPrim.has(label)) prim.oursOnly.push(`${label} = ${scale[key]}`);
  }
}

// ---------------------------------------------------------------- 2. semantic + 3. component colours

function compareThemed(section, filter, keyFn, light, dark) {
  const seen = new Set();
  for (const [name, v] of Object.entries(variables)) {
    if (v.collection !== 'Theme' || !filter(name)) continue;
    const key = keyFn(name);
    seen.add(key);
    const fl = v.values.light.value;
    const fd = v.values.dark.value;
    const ol = light[key];
    const od = dark[key];
    if (ol === undefined && od === undefined) {
      section.figmaOnly.push(`${name} → ${key}  light ${fl}, dark ${fd}`);
      continue;
    }
    const lOk = normColor(ol) === fl;
    const dOk = normColor(od) === fd;
    if (lOk && dOk) section.match.push(name);
    else {
      const parts = [];
      if (!lOk) parts.push(`light ours ${ol ?? '—'} Figma ${fl}`);
      if (!dOk) parts.push(`dark ours ${od ?? '—'} Figma ${fd}`);
      section.differs.push(`${name} → ${key}: ${parts.join('; ')}`);
    }
  }
  for (const key of Object.keys(light)) if (!seen.has(key)) section.oursOnly.push(key);
  return section;
}

const isSemantic = (n) => /^(Background|Content|Border)\//.test(n);
const isComponent = (n) => /^(Button|Chip|Toggle|Segmented Control)\//.test(n);

const sem = compareThemed(
  newSection('Semantic colours (systemColors)'),
  isSemantic,
  semanticKey,
  tokens.systemColors.light,
  tokens.systemColors.dark,
);
const comp = compareThemed(
  newSection('Component colours (rdComponentColors)'),
  isComponent,
  componentKey,
  tokens.rdComponentColors.light,
  tokens.rdComponentColors.dark,
);

// ---------------------------------------------------------------- 4. shadows

const shadow = newSection('Shadows (shadowPrimitives)');
for (const [figLevel, level] of Object.entries(rules.shadow.levels)) {
  const effect = styles.effects[`Elevation/${figLevel}`].effects;
  const flat = effect.find((e) => e.y === 0);
  const drop = effect.find((e) => e.y !== 0);
  for (const mode of ['light', 'dark']) {
    const v = (n, part) => variables[`Shadow/${figLevel}/${n}/${part}`].values[mode].value;
    const fig = `0 0 ${v(1, 'Blur')}px ${v(1, 'Color')}, 0 ${drop.y}px ${v(2, 'Blur')}px ${v(2, 'Color')}`;
    const ours = tokens.shadowPrimitives[mode][level];
    const norm = (s) =>
      s.replace(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}/g, (c) => normColor(c)).replace(/\b0px\b/g, '0').replace(/\s+/g, ' ');
    if (norm(ours) === norm(fig)) shadow.match.push(`${figLevel} ${mode}`);
    else shadow.differs.push(`${figLevel} ${mode}: ours "${ours}", Figma "${fig}"`);
    if (mode === 'light' && flat.blur !== v(1, 'Blur')) {
      shadow.differs.push(`${figLevel}: effect style blur ${flat.blur} disagrees with variable ${v(1, 'Blur')}`);
    }
  }
}

// ---------------------------------------------------------------- 5. typography

const type = newSection('Typography (v2TextStyles)');
const px = (x) => (typeof x === 'number' ? x : parseFloat(String(x)));
function lsToPx(ls, size) {
  const s = String(ls).trim();
  if (s.endsWith('em')) return parseFloat(s) * size;
  return parseFloat(s) || 0;
}
for (const [figName, key] of Object.entries(rules.typography.styles)) {
  const f = styles.text[figName];
  const o = tokens.v2TextStyles[key];
  if (!o) {
    type.figmaOnly.push(`${figName} → ${key}`);
    continue;
  }
  const figLsPx = Math.round(((f.letterSpacing.value * f.size) / 100) * 1000) / 1000;
  const oursLsPx = Math.round(lsToPx(o.letterSpacing, px(o.fontSize)) * 1000) / 1000;
  const oursFamily = String(o.fontFamily).split(',')[0].replace(/["']/g, '').trim();
  const checks = [
    ['family', oursFamily, f.family],
    ['size', px(o.fontSize), f.size],
    ['line height', px(o.lineHeight), f.lineHeight],
    ['weight', Number(o.fontWeight), f.weight],
    ['letter spacing (px)', oursLsPx, figLsPx],
  ];
  const bad = checks.filter(([, a, b]) => a !== b);
  if (!bad.length) type.match.push(figName);
  else type.differs.push(`${figName} → ${key}: ${bad.map(([k, a, b]) => `${k} ours ${a} Figma ${b}`).join('; ')}`);
}
const mapped = new Set(Object.values(rules.typography.styles));
for (const key of Object.keys(tokens.v2TextStyles)) if (!mapped.has(key)) type.oursOnly.push(key);

// ---------------------------------------------------------------- 6. TS generator vs tokens.css

const css = await fs.readFile(path.join(ROOT, 'src/styles/tokens.css'), 'utf8');
function block(selectorRegex) {
  const m = css.match(selectorRegex);
  if (!m) return {};
  let i = css.indexOf('{', m.index);
  let depth = 0;
  for (let k = i; k < css.length; k++) {
    if (css[k] === '{') depth++;
    else if (css[k] === '}' && --depth === 0) {
      const body = css.slice(i + 1, k);
      return Object.fromEntries([...body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map((x) => [x[1], x[2].trim()]));
    }
  }
  return {};
}
const cssRoot = block(/^:root\s*\{/m);
const cssLight = { ...cssRoot, ...block(/^\[data-theme="light"\]\s*\{/m) };
const cssDark = block(/^\[data-theme="dark"\]\s*\{/m);
const cssPrefers = block(/:root:not\(\[data-theme="light"\]\)\s*\{/m);

function resolveVar(value, scope, depth = 0) {
  return value.replace(/var\(--([\w-]+)(?:\s*,\s*([^)]+))?\)/g, (_, name, fb) =>
    depth > 5 ? _ : scope[name] !== undefined ? resolveVar(scope[name], scope, depth + 1) : fb ?? _,
  );
}
const normVal = (v) => {
  const c = normColor(v);
  return /^#[0-9a-f]{6,8}$/.test(c) ? c : String(v).replace(/\s+/g, ' ').trim().toLowerCase();
};

const gen = (theme) => ({ ...tokens.generateCSSVariables(), ...tokens.generateThemeVariables(theme) });
const tsCss = newSection('TS generator vs tokens.css');
const drift = { light: { differs: [], cssOnly: [], tsOnly: [] }, dark: { differs: [], tsOnly: [] }, prefers: { differs: [], missing: [] } };
const genLight = gen('light');
const genDark = tokens.generateThemeVariables('dark');
for (const [k, v] of Object.entries(genLight)) {
  if (cssLight[k] === undefined) drift.light.tsOnly.push(k);
  else if (normVal(resolveVar(cssLight[k], cssLight)) !== normVal(v)) drift.light.differs.push(`${k}: TS ${v}, CSS ${cssLight[k]}`);
  else tsCss.match.push(k);
}
for (const k of Object.keys(cssLight)) if (genLight[k] === undefined) drift.light.cssOnly.push(k);
for (const [k, v] of Object.entries(genDark)) {
  if (cssDark[k] === undefined) drift.dark.tsOnly.push(k);
  else if (normVal(resolveVar(cssDark[k], { ...cssLight, ...cssDark })) !== normVal(v)) drift.dark.differs.push(`${k}: TS ${v}, CSS ${cssDark[k]}`);
}
for (const [k, v] of Object.entries(cssDark)) {
  if (cssPrefers[k] === undefined) drift.prefers.missing.push(k);
  else if (normVal(cssPrefers[k]) !== normVal(v)) drift.prefers.differs.push(`${k}: dark ${v}, prefers-color-scheme ${cssPrefers[k]}`);
}
tsCss.differs.push(...drift.light.differs.map((x) => `light ${x}`), ...drift.dark.differs.map((x) => `dark ${x}`));
tsCss.oursOnly.push(...drift.light.cssOnly.map((x) => `CSS only: ${x}`));
tsCss.figmaOnly.push(
  ...drift.light.tsOnly.map((x) => `TS only (light/root): ${x}`),
  ...drift.dark.tsOnly.map((x) => `TS only (dark): ${x}`),
);

// ---------------------------------------------------------------- report

const sections = [prim, sem, comp, shadow, type];
const pad = (s, n) => String(s).padEnd(n);
console.log(`\nFigma ${rules.figma.fileName} (${rules.figma.fileKey}) vs Radiant Play tokens\n`);
console.log(`${pad('Area', 44)}${pad('match', 8)}${pad('differs', 9)}${pad('Figma only', 12)}ours only`);
for (const s of sections) {
  console.log(`${pad(s.title, 44)}${pad(s.match.length, 8)}${pad(s.differs.length, 9)}${pad(s.figmaOnly.length, 12)}${s.oursOnly.length}`);
}
console.log(
  `\n${pad('TS generator vs tokens.css', 44)}${pad(tsCss.match.length, 8)}${pad(tsCss.differs.length, 9)}` +
    `TS only ${drift.light.tsOnly.length + drift.dark.tsOnly.length}, CSS only ${drift.light.cssOnly.length}`,
);
console.log(
  `${pad('tokens.css dark vs prefers-color-scheme', 44)}differs ${drift.prefers.differs.length}, missing from prefers block ${drift.prefers.missing.length}`,
);

if (!SUMMARY_ONLY) {
  const list = (label, items) => {
    if (!items.length) return;
    console.log(`  ${label} (${items.length})`);
    for (const i of items) console.log(`    ${i}`);
  };
  for (const s of sections) {
    console.log(`\n== ${s.title}`);
    list('differs', s.differs);
    list('Figma only', s.figmaOnly);
    list('ours only', s.oursOnly);
  }
  console.log('\n== TS generator vs tokens.css');
  list('differs', tsCss.differs);
  list('TS only', tsCss.figmaOnly);
  list('CSS only', tsCss.oursOnly);
  console.log('\n== tokens.css dark vs prefers-color-scheme block');
  list('differs', drift.prefers.differs);
  list('missing from prefers block', drift.prefers.missing);
}

if (JSON_OUT) {
  await fs.writeFile(JSON_OUT, JSON.stringify({ sections, drift }, null, 2) + '\n');
  console.log(`\nWrote ${JSON_OUT}`);
}
