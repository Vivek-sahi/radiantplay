#!/usr/bin/env node
/**
 * Dark readiness scan: finds colour code that won't follow the theme.
 *
 * Checks, per file:
 *   literal       hex or rgb()/rgba() colours, outside var(--x, fallback)
 *   light-read    systemColors.light[...], rdComponentColors.light[...], referenceColors.*
 *   unknown-token var(--rd-sys-color-*) / var(--rd-comp-color-*) names that tokens.css doesn't define
 *   media-query   @media (prefers-color-scheme) in app code (the theme controller owns this)
 *   theme-write   code that sets data-theme outside the theme controller
 *
 * Usage:
 *   node scripts/radiant-check/scan.mjs [paths...] [--details] [--json] [--strict]
 *   npm run lint:tokens            strict scan of the shared layers (exits 1 on findings)
 *
 * Paths default to src. Allowed exceptions, each with a reason, live in rules.json.
 * The scan reports; it only fails with --strict.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const rules = JSON.parse(fs.readFileSync(path.join(HERE, 'rules.json'), 'utf8'));

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const targets = argv.filter((a) => !a.startsWith('--'));
const DETAILS = flags.has('--details');
const JSON_OUT = flags.has('--json');
const STRICT = flags.has('--strict');

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const matches = (file, pattern) => (pattern.endsWith('/') ? file.startsWith(pattern) : file === pattern);

// Token names tokens.css defines
const tokensCss = fs.readFileSync(path.join(ROOT, 'src/styles/tokens.css'), 'utf8');
const defined = new Set([...tokensCss.matchAll(/--(rd-(?:sys|comp)-color-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

function walk(p, out) {
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    for (const f of fs.readdirSync(p)) if (f !== 'node_modules' && !f.startsWith('.')) walk(path.join(p, f), out);
  } else if (/\.(tsx?|css)$/.test(p) && !/\.(test|spec)\.tsx?$/.test(p) && !p.endsWith('.d.ts')) {
    out.push(p);
  }
  return out;
}

/** Blank out comments, keeping line numbers. */
function stripComments(src, isCss) {
  const blank = (s) => s.replace(/[^\n]/g, ' ');
  let out = src.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (!isCss) out = out.replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, pre) => pre + blank(m.slice(pre.length)));
  return out;
}

/** Blank out every var(...) expression, so fallbacks inside them don't count as literals. */
function stripVars(line) {
  let out = '';
  for (let i = 0; i < line.length; i++) {
    if (line.startsWith('var(', i)) {
      let depth = 0, j = i + 3;
      for (; j < line.length; j++) {
        if (line[j] === '(') depth++;
        else if (line[j] === ')' && --depth === 0) break;
      }
      out += ' '.repeat(j - i + 1);
      i = j;
    } else out += line[i];
  }
  return out;
}

// rgb()/rgba() must start with a number, so code that builds colour strings (`rgba(${r}, ...)`) isn't counted
const LITERAL = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b|\brgba?\(\s*\d/g;
const LIGHT_READ = /\b(systemColors|rdComponentColors)\.light\[|\breferenceColors\./g;
const TOKEN_REF = /var\(--(rd-(?:sys|comp)-color-[a-z0-9-]+)/g;
const THEME_WRITE = /setAttribute\(\s*['"]data-theme['"]|dataset\.theme\s*=|removeAttribute\(\s*['"]data-theme['"]/g;

function scanFile(file) {
  const r = rel(file);
  const isCss = file.endsWith('.css');
  const lines = stripComments(fs.readFileSync(file, 'utf8'), isCss).split('\n');
  const findings = [];
  const add = (kind, n, text) => findings.push({ kind, file: r, line: n + 1, text: text.trim().slice(0, 140) });
  lines.forEach((raw, n) => {
    if (!raw.trim()) return;
    const noVars = stripVars(raw);
    // Skip import lines and CSS id selectors like #root
    if (!/^\s*import\b/.test(raw)) {
      for (const m of noVars.matchAll(LITERAL)) {
        if (isCss && /^\s*#[\w-]+\s*[{,]/.test(raw)) continue;
        add('literal', n, raw);
        break;
      }
    }
    if (LIGHT_READ.test(raw)) add('light-read', n, raw);
    LIGHT_READ.lastIndex = 0;
    for (const m of raw.matchAll(TOKEN_REF)) if (!defined.has(m[1])) add('unknown-token', n, `--${m[1]}`);
    if (/@media[^{]*prefers-color-scheme/.test(raw)) add('media-query', n, raw);
    if (THEME_WRITE.test(raw)) add('theme-write', n, raw);
    THEME_WRITE.lastIndex = 0;
  });
  return findings;
}

function allowed(f) {
  return rules.allow.find((a) => matches(f.file, a.path) && (!a.kinds || a.kinds.includes(f.kind)) && (!a.match || f.text.includes(a.match)));
}

/** Group a file into a reporting unit: one prototype, or a top-level layer. */
function unitOf(file) {
  const proto = file.match(/^src\/prototypes\/([^/]+)\//);
  if (proto) return `src/prototypes/${proto[1]}`;
  const top = file.match(/^src\/([^/]+)\//);
  return top ? `src/${top[1]}` : file;
}

// ---------------------------------------------------------------------------

const roots = (targets.length ? targets : ['src']).map((t) => path.resolve(ROOT, t));
const files = roots.flatMap((p) => walk(p, [])).filter((f) => !rules.exclude.some((e) => matches(rel(f), e)));

const all = files.flatMap(scanFile);
const reported = all.filter((f) => !allowed(f));
const KINDS = ['literal', 'light-read', 'unknown-token', 'media-query', 'theme-write'];

const units = {};
for (const f of files) units[unitOf(rel(f))] ??= Object.fromEntries(KINDS.map((k) => [k, 0]));
for (const f of reported) units[unitOf(f.file)][f.kind]++;
const allowedCount = all.length - reported.length;

if (JSON_OUT) {
  console.log(JSON.stringify({ units, findings: reported, allowed: allowedCount }, null, 2));
} else {
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`${pad('Unit', 44)}${pad('literal', 9)}${pad('light', 7)}${pad('unknown', 9)}${pad('media', 7)}${pad('theme', 7)}dark ready`);
  for (const [u, c] of Object.entries(units).sort()) {
    const ready = KINDS.every((k) => c[k] === 0) ? 'yes' : 'no';
    console.log(`${pad(u, 44)}${pad(c.literal, 9)}${pad(c['light-read'], 7)}${pad(c['unknown-token'], 9)}${pad(c['media-query'], 7)}${pad(c['theme-write'], 7)}${ready}`);
  }
  console.log(`\n${reported.length} findings, ${allowedCount} allowed by rules.json`);
  if (DETAILS) {
    for (const k of KINDS) {
      const list = reported.filter((f) => f.kind === k);
      if (!list.length) continue;
      console.log(`\n== ${k} (${list.length})`);
      for (const f of list) console.log(`  ${f.file}:${f.line}  ${f.text}`);
    }
  }
}

if (STRICT && reported.length) process.exit(1);
