#!/usr/bin/env node
/**
 * Readiness scan: finds code that won't follow the theme or the Geist font tokens.
 *
 * Colour checks (dark ready), per file:
 *   literal       hex or rgb()/rgba() colours, outside var(--x, fallback)
 *   light-read    systemColors.light[...], rdComponentColors.light[...], referenceColors.*
 *   unknown-token var(--rd-sys-color-*) / var(--rd-comp-color-*) names that tokens.css doesn't define
 *   media-query   @media (prefers-color-scheme) in app code (the theme controller owns this)
 *   theme-write   code that sets data-theme outside the theme controller
 * Font checks (Geist ready):
 *   font-family   a hardcoded font stack instead of var(--font-family-*) or fontFamily.*
 *   font-weight   the old Plain weights 600 and 375 written as numbers (Geist uses the weight tokens)
 *
 * Usage:
 *   node scripts/radiant-check/scan.mjs [paths...] [--details] [--json] [--strict]
 *   node scripts/radiant-check/scan.mjs --mine     one row per prototype in registry-mine.ts, with theme and thumbnail
 *   npm run lint:tokens                            strict scan of the shared layers (exits 1 on findings)
 *
 * Paths default to src. Accepted exceptions live in rules.json (upstream's) and
 * rules-mine.json (the designer's own, never touched by upstream), each with a reason.
 * Code under a vendor/ folder came from outside the repo: its findings are counted in
 * a separate column and still keep a prototype from being ready.
 *
 * A prototype can show screens the folder's own findings don't cover. Two more checks feed
 * the dark verdict of each prototype folder:
 *   imports      relative imports (or @/prototypes/...) into another prototype's folder. When that
 *                folder isn't dark ready (colour or vendor findings, or the same checks in turn),
 *                the importer isn't either. _shared, _template and other _ folders are scanned on their own.
 *   iframe       an <iframe src="/..."> whose literal path is a file in public/. That page sits
 *                outside the theme, so the prototype isn't dark ready. An allow entry with kind
 *                "iframe" in rules-mine.json waives it, for a page that handles dark itself.
 * The text output marks such a prototype "no*" when its own folder is clean and lists the reason
 * below the table. The --json output adds meta[unit].dependsOn (the prototype folders it imports
 * from) and meta[unit].notReadyBecause (short reasons, only when it isn't dark ready).
 * The scan reports; it only fails with --strict.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const readJson = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {});
const rules = readJson(path.join(HERE, 'rules.json'));
const mineRules = readJson(path.join(HERE, 'rules-mine.json'));
const EXCLUDE = [...(rules.exclude ?? []), ...(mineRules.exclude ?? [])];
const ALLOW = [...(rules.allow ?? []), ...(mineRules.allow ?? [])];

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const targets = argv.filter((a) => !a.startsWith('--'));
const DETAILS = flags.has('--details');
const JSON_OUT = flags.has('--json');
const STRICT = flags.has('--strict');
const MINE = flags.has('--mine');

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const matches = (file, pattern) => (pattern.endsWith('/') ? file.startsWith(pattern) : file === pattern);

// Token names tokens.css defines
const tokensCss = fs.readFileSync(path.join(ROOT, 'src/styles/tokens.css'), 'utf8');
const defined = new Set([...tokensCss.matchAll(/--(rd-(?:sys|comp)-color-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

function walk(p, out) {
  if (!fs.existsSync(p)) return out;
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
// A font stack written out, wherever it sits: a font-family / fontFamily value or a constant holding
// one. Recognised by the names stacks are made of, outside var() fallbacks. Tokens
// (var(--font-family-*), fontFamily.primary), inherit and @font-face declarations are fine.
const STACK = /(['"`]|font-family\s*:\s*)[^'"`;]*\b(Plain|Inter|Geist|Helvetica|Arial|Roboto|-apple-system|BlinkMacSystemFont|Segoe UI|system-ui|sans-serif|SF Mono|Menlo|Monaco|Consolas|Fira (Code|Mono)|Courier|monospace)\b/;
// Old Plain weights written as numbers, in a font-weight / fontWeight context or a conditional on one
const WEIGHT = /(?:font-weight\s*:\s*|fontWeight\s*:\s*['"]?)(600|375)\b|fontWeight\s*:[^,}]*\?\s*['"]?(600|375)\b/;

function scanFile(file) {
  const r = rel(file);
  const isCss = file.endsWith('.css');
  const lines = stripComments(fs.readFileSync(file, 'utf8'), isCss).split('\n');
  const findings = [];
  const add = (kind, n, text) => findings.push({ kind, file: r, line: n + 1, text: text.trim().slice(0, 140) });
  let inFontFace = false;
  lines.forEach((raw, n) => {
    if (!raw.trim()) return;
    // @font-face blocks name the font being declared; that's not a stack to replace
    if (isCss && /@font-face/.test(raw)) inFontFace = true;
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
    if (!inFontFace && /font|FONT|Font/.test(raw) && STACK.test(noVars)) add('font-family', n, raw);
    if (WEIGHT.test(raw) && !inFontFace) add('font-weight', n, raw);
    if (inFontFace && raw.includes('}')) inFontFace = false;
  });
  return findings;
}

function allowed(f) {
  return ALLOW.find((a) => matches(f.file, a.path) && (!a.kinds || a.kinds.includes(f.kind)) && (!a.match || f.text.includes(a.match)));
}

/** Group a file into a reporting unit: one prototype, or a top-level layer. */
function unitOf(file) {
  const proto = file.match(/^src\/prototypes\/([^/]+)\//);
  if (proto) return `src/prototypes/${proto[1]}`;
  const top = file.match(/^src\/([^/]+)\//);
  return top ? `src/${top[1]}` : file;
}

/** registry-mine.ts entries: id, light-only flag and thumbnail kind. */
function mineEntries() {
  const p = path.join(ROOT, 'src/prototypes/registry-mine.ts');
  if (!fs.existsSync(p)) return [];
  const src = fs.readFileSync(p, 'utf8');
  const out = [];
  for (const m of src.matchAll(/\{\s*id:\s*'([^']+)'([\s\S]*?)\n\s*\}/g)) {
    const body = m[2];
    const thumbVar = body.match(/thumbnail:\s*([\w{][^\n]*)/)?.[1] ?? '';
    let thumb = 'none';
    if (/light\s*:/.test(thumbVar)) thumb = 'captured';
    else if (thumbVar) {
      const name = thumbVar.replace(/[,\s].*$/, '');
      const imp = src.match(new RegExp(`import\\s+${name}\\s+from\\s+'([^']+)'`))?.[1] ?? '';
      thumb = /\.svg\?raw$/.test(imp) ? 'svg (theme)' : /\.svg$/.test(imp) ? 'svg (light)' : imp ? 'image' : 'set';
    }
    out.push({ id: m[1], theme: /theme:\s*'light-only'/.test(body) ? 'light-only' : 'global', thumb });
  }
  return out;
}

// ---------------------------------------------------------------------------

const mine = MINE ? mineEntries() : [];
const scanTargets = MINE ? mine.map((e) => `src/prototypes/${e.id}`) : targets.length ? targets : ['src'];
const roots = scanTargets.map((t) => path.resolve(ROOT, t));
const files = roots.flatMap((p) => walk(p, [])).filter((f) => !EXCLUDE.some((e) => matches(rel(f), e)));

const all = files.flatMap(scanFile);
const reported = all.filter((f) => !allowed(f));
const COLOUR = ['literal', 'light-read', 'unknown-token', 'media-query', 'theme-write'];
const FONT = ['font-family', 'font-weight'];
const KINDS = [...COLOUR, ...FONT];
const isVendor = (file) => /\/vendor\//.test(file);

const units = {};
const blank = () => ({ ...Object.fromEntries(KINDS.map((k) => [k, 0])), vendor: 0 });
for (const e of mine) units[`src/prototypes/${e.id}`] = blank();
for (const f of files) units[unitOf(rel(f))] ??= blank();
for (const f of reported) {
  const u = units[unitOf(f.file)];
  if (isVendor(f.file)) u.vendor++;
  else u[f.kind]++;
}
const allowedCount = all.length - reported.length;
const darkReady = (c) => COLOUR.every((k) => c[k] === 0) && c.vendor === 0;
const geistReady = (c) => FONT.every((k) => c[k] === 0);

// ---------------------------------------------------------------------------
// Screens the scan can't see in the folder itself: imports from another prototype's folder,
// and static pages from public/ shown in an iframe

const PROTO_DIR = path.join(ROOT, 'src/prototypes');
const protoNames = fs.existsSync(PROTO_DIR) ? fs.readdirSync(PROTO_DIR).filter((f) => fs.statSync(path.join(PROTO_DIR, f)).isDirectory()) : [];
/** A prototype folder unit (not a _shared, _template or other _ folder, which are scanned on their own). */
const protoOf = (unit) => unit.match(/^src\/prototypes\/([^_/][^/]*)$/)?.[1] ?? null;
const IMPORT = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|^\s*import\s*['"]([^'"]+)['"]|\brequire\(\s*['"]([^'"]+)['"]\s*\)/gm;
const IFRAME = /<iframe\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*['"`]([^'"`$]*)['"`]\s*\})/g;

const folders = {};
/** Files, findings, prototype imports and iframe pages of one prototype folder; scans it if the run didn't. */
function folderInfo(name) {
  if (folders[name]) return folders[name];
  const unit = `src/prototypes/${name}`;
  const own = files.filter((f) => unitOf(rel(f)) === unit);
  const list = own.length ? own : walk(path.join(ROOT, unit), []).filter((f) => !EXCLUDE.some((e) => matches(rel(f), e)));
  const findings = own.length ? reported.filter((f) => unitOf(f.file) === unit) : list.flatMap(scanFile).filter((f) => !allowed(f));
  const deps = new Set();
  const iframes = [];
  for (const f of list.filter((x) => /\.tsx?$/.test(x))) {
    const text = stripComments(fs.readFileSync(f, 'utf8'), false);
    for (const m of text.matchAll(IMPORT)) {
      const spec = m[1] ?? m[2] ?? m[3] ?? m[4];
      const target = spec.startsWith('.') ? path.resolve(path.dirname(f), spec) : spec.startsWith('@/prototypes/') ? path.join(ROOT, 'src', spec.slice(2)) : null;
      const other = target && rel(target).match(/^src\/prototypes\/([^/]+)\//)?.[1];
      if (!other || other.startsWith('_')) continue;
      // Match the folder's real spelling, so a case-insensitive disk doesn't hide the link
      const real = protoNames.find((n) => n.toLowerCase() === other.toLowerCase());
      if (real && real !== name) deps.add(real);
    }
    for (const m of text.matchAll(IFRAME)) {
      const src = (m[1] ?? m[2] ?? m[3] ?? '').split(/[?#]/)[0];
      if (!src.startsWith('/') || src.startsWith('//')) continue;
      const page = path.join(ROOT, 'public', src.endsWith('/') ? `${src}index.html` : src);
      if (!fs.existsSync(page)) continue;
      const line = text.slice(0, m.index).split('\n').length;
      const finding = { kind: 'iframe', file: rel(f), line, text: fs.readFileSync(f, 'utf8').split('\n')[line - 1].trim().slice(0, 140), page: rel(page) };
      if (!allowed(finding)) iframes.push(finding);
    }
  }
  const colour = findings.filter((f) => COLOUR.includes(f.kind) && !isVendor(f.file)).length;
  const vendor = findings.filter((f) => isVendor(f.file)).length;
  folders[name] = { colour, vendor, deps: [...deps].sort(), iframes };
  return folders[name];
}

/** Dark verdict for a prototype folder, following its imports into other prototype folders. */
function darkVerdict(name, seen = new Set()) {
  seen.add(name);
  const info = folderInfo(name);
  const because = [];
  const n = (k, word) => `${k} ${word}${k === 1 ? '' : 's'}`;
  if (info.colour) because.push(n(info.colour, 'colour finding'));
  if (info.vendor) because.push(`${n(info.vendor, 'finding')} in vendor/`);
  for (const i of info.iframes) because.push(`renders a static page in an iframe (${i.page}), outside the theme`);
  for (const d of info.deps) {
    if (seen.has(d)) continue;
    const v = darkVerdict(d, seen);
    if (!v.ready) because.push(`imports from ${d}, which isn't dark ready (${v.because.join('; ')})`);
  }
  return { ready: !because.length, because };
}

const verdicts = {};
for (const u of Object.keys(units)) {
  const name = protoOf(u);
  if (name && fs.existsSync(path.join(PROTO_DIR, name))) verdicts[u] = { ...darkVerdict(name), dependsOn: folderInfo(name).deps };
}
/** Dark ready: no findings of its own, and nothing it shows from elsewhere holds it back. */
const isDark = (u, c) => (verdicts[u] ? verdicts[u].ready && darkReady(c) : darkReady(c));
/** Reasons that the colour columns don't show: imports and iframe pages. */
const elsewhere = (u) => (verdicts[u]?.because ?? []).filter((b) => /^(imports from|renders a static page)/.test(b));

if (JSON_OUT) {
  const meta = {};
  for (const e of mine) meta[`src/prototypes/${e.id}`] = { theme: e.theme, thumb: e.thumb };
  for (const [u, v] of Object.entries(verdicts)) {
    meta[u] = { ...meta[u], dependsOn: v.dependsOn };
    if (!isDark(u, units[u])) meta[u].notReadyBecause = v.because.length ? v.because : ['colour findings'];
  }
  // The table's dark and geist columns, so tools such as light-only.mjs read the same verdict
  const ready = Object.fromEntries(Object.entries(units).map(([u, c]) => [u, { dark: isDark(u, c), geist: geistReady(c) }]));
  console.log(JSON.stringify({ units, ready, meta, findings: reported, allowed: allowedCount }, null, 2));
} else {
  const pad = (s, n) => String(s).padEnd(n);
  const extra = MINE ? `${pad('theme', 12)}${pad('thumb', 13)}` : '';
  console.log(`${pad('Unit', 40)}${pad('literal', 8)}${pad('light', 6)}${pad('unknown', 8)}${pad('media', 6)}${pad('write', 6)}${pad('family', 7)}${pad('weight', 7)}${pad('vendor', 7)}${pad('dark', 5)}${pad('geist', 6)}${extra}`);
  for (const [u, c] of Object.entries(units).sort()) {
    const e = mine.find((m) => `src/prototypes/${m.id}` === u);
    const tail = MINE ? `${pad(e?.theme ?? '', 12)}${pad(e?.thumb ?? '', 13)}` : '';
    // no* = the folder itself is clean, but what it shows from elsewhere isn't (see the notes below)
    const dark = isDark(u, c) ? 'yes' : elsewhere(u).length ? (darkReady(c) ? 'no*' : 'no') : 'no';
    console.log(`${pad(u, 40)}${pad(c.literal, 8)}${pad(c['light-read'], 6)}${pad(c['unknown-token'], 8)}${pad(c['media-query'], 6)}${pad(c['theme-write'], 6)}${pad(c['font-family'], 7)}${pad(c['font-weight'], 7)}${pad(c.vendor, 7)}${pad(dark, 5)}${pad(geistReady(c) ? 'yes' : 'no', 6)}${tail}`);
  }
  const notes = Object.keys(verdicts).sort().filter((u) => elsewhere(u).length);
  if (notes.length) {
    console.log('\nNot dark ready because of screens from outside the folder:');
    for (const u of notes) for (const b of elsewhere(u)) console.log(`  ${u}: ${b}`);
  }
  console.log(`\n${reported.length} findings, ${allowedCount} allowed by rules.json and rules-mine.json`);
  if (MINE && !mine.length) console.log('No prototypes in src/prototypes/registry-mine.ts.');
  if (DETAILS) {
    for (const k of KINDS) {
      const list = reported.filter((f) => f.kind === k && !isVendor(f.file));
      if (!list.length) continue;
      console.log(`\n== ${k} (${list.length})`);
      for (const f of list) console.log(`  ${f.file}:${f.line}  ${f.text}`);
    }
    const vend = reported.filter((f) => isVendor(f.file));
    if (vend.length) console.log(`\n== vendor (${vend.length}): code from outside the repo, left as it is; see src/prototypes/*/vendor/`);
  }
}

if (STRICT && reported.length) process.exit(1);
