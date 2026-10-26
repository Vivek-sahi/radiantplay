#!/usr/bin/env node
/**
 * Handoff export — RadiantPlay → scaligent (engineering).
 *
 * Converts a prototype's token-based CSS Modules into scaligent-shaped SCSS:
 *   var(--spacing-4)                 → $rd-spacing--d
 *   var(--rd-sys-color-...-sunken)   → rd-sys-color('background-sunken')
 *   #F6F8FA                          → rd-sys-color('background-sunken')
 *   16px                             → $rd-spacing--d
 * and prepends `@import '~@thoughtspot/radiant-styles/_base.scss';`.
 *
 * Why this exists: RadiantPlay and the product codebase share the same token
 * names and spacing scale, so the colour/spacing handoff is a deterministic
 * string transform (docs/2026-07-01-handoff-quality-plan.md, Layer A).
 *
 * What it does NOT do (reported, left for a human — Layer B):
 *   - lift inline style={{ }} in .tsx into classes
 *   - swap raw <button>/<input>/<table> for Radiant components
 *   - map typography to `@include rd-font--*` mixins (needs the parity map)
 *
 * The lookup tables are PARSED from src/tokens/* at runtime, so they stay in
 * sync with the tokens automatically. No dependencies; plain node.
 *
 * Usage:
 *   node internal/scripts/handoff-export.mjs <PrototypeName>
 *   node internal/scripts/handoff-export.mjs <PrototypeName> --out <dir>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TOKENS = path.join(ROOT, 'src', 'tokens');

// ── Parse token tables from source (so they never drift) ────────────────────

/** spacing px value → scaligent letter (a..l). Our M/N (80/96) have no scaligent token. */
function spacingValueToLetter() {
  const src = fs.readFileSync(path.join(TOKENS, 'spacing.ts'), 'utf8');
  const map = new Map();
  // Named letter tokens: `A: 4,` ... `N: 96,`
  for (const m of src.matchAll(/^\s*([A-N]):\s*(\d+),/gm)) {
    const letter = m[1].toLowerCase();
    const px = Number(m[2]);
    // scaligent spacing scale is a..l (4..64); M/N are RadiantPlay-only.
    if (letter <= 'l') map.set(px, letter);
  }
  return map;
}

/** hex (UPPER, no alpha) → [token names]. Light mode only — that is what handoff targets. */
function hexToColorNames() {
  const src = fs.readFileSync(path.join(TOKENS, 'colors', 'system.ts'), 'utf8');
  const lightStart = src.indexOf('light: {');
  const darkStart = src.indexOf('dark: {');
  const block = src.slice(lightStart, darkStart === -1 ? undefined : darkStart);
  const map = new Map();
  // `'background-sunken': '#F6F8FA',`
  for (const m of block.matchAll(/'([a-z0-9-]+)':\s*'(#[0-9A-Fa-f]{6,8})'/g)) {
    const name = m[1];
    const hex = m[2].slice(0, 7).toUpperCase(); // drop alpha for matching
    if (!map.has(hex)) map.set(hex, []);
    map.get(hex).push(name);
  }
  return map;
}

const SPACING = spacingValueToLetter();
const HEX = hexToColorNames();

// --spacing-4 / --spacing-D style var → px. Numeric and letter aliases both exist.
const CSSVAR_SPACING = /var\(--spacing-([0-9]+|[A-Za-z])\)/g;
const NUM_ALIAS = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 14: 56, 16: 64 };
const LETTER_ALIAS = { a: 4, b: 8, c: 12, d: 16, e: 20, f: 24, g: 28, h: 32, i: 40, j: 48, k: 56, l: 64, m: 80, n: 96 };

// ── Convert one CSS-module string to SCSS ───────────────────────────────────

function convertCss(css, report) {
  // Comments pass through untouched, so a hex or var in a note is not converted or reported.
  const out = css
    .split(/(\/\*[\s\S]*?\*\/)/)
    .map((part) => (part.startsWith('/*') ? part : convertCode(part, report)))
    .join('');
  return `@import '~@thoughtspot/radiant-styles/_base.scss';\n\n${out.trimStart()}`;
}

function convertCode(css, report) {
  let out = css;

  // 1. Spacing CSS vars → $rd-spacing--<letter>
  out = out.replace(CSSVAR_SPACING, (full, key) => {
    const px = /^[0-9]+$/.test(key) ? NUM_ALIAS[key] : LETTER_ALIAS[key.toLowerCase()];
    const letter = SPACING.get(px);
    if (letter) return `$rd-spacing--${letter}`;
    report.unmapped.add(`${full} (no scaligent spacing token for ${px}px)`);
    return full;
  });

  // 2. System colour CSS vars → rd-sys-color('name') — unambiguous, always safe.
  out = out.replace(/var\(--rd-sys-color-([a-z0-9-]+)\)/g, (_f, name) => {
    report.colorVars++;
    return `rd-sys-color('${name}')`;
  });

  // 3. Raw px → $rd-spacing--<letter> (only exact scale matches; 1px borders etc. stay).
  out = out.replace(/\b(\d+)px\b/g, (full, n) => {
    const px = Number(n);
    const letter = SPACING.get(px);
    if (letter) { report.rawPx++; return `$rd-spacing--${letter}`; }
    return full; // 1px, 2px, off-scale values: leave as-is
  });

  // 4. Raw hex → rd-sys-color('name') only when exactly ONE token owns that hex.
  out = out.replace(/#[0-9A-Fa-f]{6}\b/g, (full) => {
    const hex = full.toUpperCase();
    const names = HEX.get(hex);
    if (!names) { report.unmapped.add(`${full} (not a system colour)`); return full; }
    if (names.length > 1) {
      report.ambiguousHex.add(`${full} → ${names.join(' | ')}`);
      return full; // ambiguous: don't guess
    }
    report.rawHex++;
    return `rd-sys-color('${names[0]}')`;
  });

  // 5. Typography / radius / motion vars — flag, leave untouched (needs parity map).
  for (const m of out.matchAll(/var\(--(font-[a-z-]+|line-height-[a-z0-9]+|radius-[a-z0-9]+)\)/g)) {
    report.manualVars.add(m[0]);
  }

  return out;
}

// ── Scan .tsx for what the converter cannot touch (Layer B) ──────────────────

function scanTsx(dir, report) {
  for (const file of walk(dir, /\.tsx$/)) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);
    const inline = (src.match(/style=\{\{/g) || []).length;
    if (inline) report.inlineStyles.push(`${rel}: ${inline} inline style block(s)`);
    for (const el of ['button', 'input', 'select', 'table']) {
      const n = (src.match(new RegExp(`<${el}[\\s>]`, 'g')) || []).length;
      if (n) report.rawElements.push(`${rel}: ${n} <${el}>`);
    }
  }
}

function* walk(dir, match) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p, match);
    else if (match.test(e.name)) yield p;
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const name = args.find((a) => !a.startsWith('--'));
  const outFlag = args.indexOf('--out');
  if (!name) {
    console.error('Usage: node internal/scripts/handoff-export.mjs <PrototypeName> [--out <dir>]');
    process.exit(2);
  }
  const protoDir = path.join(ROOT, 'src', 'prototypes', name);
  if (!fs.existsSync(protoDir)) {
    console.error(`Prototype not found: src/prototypes/${name}`);
    process.exit(1);
  }
  const outDir = outFlag !== -1 ? path.resolve(args[outFlag + 1]) : path.join(ROOT, 'handoff', name);
  fs.mkdirSync(outDir, { recursive: true });

  const report = {
    colorVars: 0, rawHex: 0, rawPx: 0,
    unmapped: new Set(), ambiguousHex: new Set(), manualVars: new Set(),
    inlineStyles: [], rawElements: [], files: [],
  };

  const cssFiles = [...walk(protoDir, /\.module\.css$/)];
  for (const css of cssFiles) {
    const scss = convertCss(fs.readFileSync(css, 'utf8'), report);
    const outName = path.basename(css).replace(/\.module\.css$/, '.module.scss');
    const outPath = path.join(outDir, path.relative(protoDir, path.dirname(css)), outName);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, scss);
    report.files.push(path.relative(ROOT, outPath));
  }
  scanTsx(protoDir, report);

  // Report
  const lines = [];
  const L = (s = '') => lines.push(s);
  L(`# Handoff export — ${name}`);
  L('');
  L(`Generated ${new Date().toISOString().slice(0, 10)} by internal/scripts/handoff-export.mjs.`);
  L('');
  L('## Converted (automatic, deterministic)');
  L('');
  if (report.files.length) {
    L(`${report.files.length} SCSS file(s): ${report.colorVars} colour vars, ${report.rawHex} raw hex, ${report.rawPx} raw px → scaligent tokens.`);
    for (const f of report.files) L(`- \`${f}\``);
  } else {
    L('No `.module.css` files found — this prototype has nothing to convert mechanically (likely inline-styled; see below).');
  }
  L('');
  L('## Left for a human (Layer B — needs judgment)');
  L('');
  const section = (title, items) => {
    L(`### ${title}`);
    if (items.length === 0) L('- none');
    else for (const i of items) L(`- ${i}`);
    L('');
  };
  section('Inline styles to lift into classes', report.inlineStyles);
  section('Raw elements to swap for Radiant components', report.rawElements);
  section('Typography / radius vars (need the scaligent mixin map)', [...report.manualVars].sort());
  section('Ambiguous hex (several tokens share the value — not converted)', [...report.ambiguousHex].sort());
  section('Unmapped values (left as-is)', [...report.unmapped].sort());

  const reportPath = path.join(outDir, 'HANDOFF-REPORT.md');
  fs.writeFileSync(reportPath, lines.join('\n') + '\n');

  console.log(`Handoff export → ${path.relative(ROOT, outDir)}/`);
  console.log(`  ${report.files.length} SCSS file(s): ${report.colorVars} colour vars, ${report.rawHex} raw hex, ${report.rawPx} raw px converted`);
  const manual = report.inlineStyles.length + report.rawElements.length + report.manualVars.size + report.ambiguousHex.size;
  console.log(`  ${manual} item(s) left for a human — see ${path.relative(ROOT, reportPath)}`);
}

main();
