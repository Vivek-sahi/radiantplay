#!/usr/bin/env node
/**
 * Fixture check for codemod.mjs (maintainer tool). Spec: docs/2026-10-07-prototype-migration-plan.md, 6.4.
 *
 * For each sample prototype in codemod-fixtures.json:
 *   1. git archive the "before" commit (pre-Geist, pre-dark) into a temp folder
 *   2. run the codemod with --write (all rules) and record swaps by rule and the judgement list
 *   3. scan the result with scan.mjs and record findings by kind
 *   4. run the codemod again without the rules the reference never applied (compareSkip),
 *      and diff each before line against the Phase 6 "after" commit:
 *        match      the codemod wrote what Phase 6 wrote
 *        judgement  the codemod left the line on the judgement list
 *        mismatch   the codemod wrote something else, missed the line, or changed a line Phase 6 kept
 *
 * Usage:
 *   node scripts/radiant-check/codemod-check.mjs              compare with the recorded numbers, exit 1 on drift
 *   node scripts/radiant-check/codemod-check.mjs --update     record the current numbers (keeps hand-written reasons)
 *   node scripts/radiant-check/codemod-check.mjs --verbose    print every mismatch
 *   node scripts/radiant-check/codemod-check.mjs --only=Name  one fixture
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { migrate } from './codemod.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const FIXTURES = path.join(HERE, 'codemod-fixtures.json');
const fx = JSON.parse(fs.readFileSync(FIXTURES, 'utf8'));

const argv = process.argv.slice(2);
const UPDATE = argv.includes('--update');
const VERBOSE = argv.includes('--verbose');
const only = argv.find((a) => a.startsWith('--only='))?.slice(7);

const git = (...args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const CODE = /\.(tsx?|jsx?|mjs|css)$/;

function extract(sha, dir, prefix) {
  fs.mkdirSync(dir, { recursive: true });
  execSync(`git -C "${ROOT}" archive ${sha} "${prefix}" | tar -x -C "${dir}"`);
}

function filesIn(dir) {
  const out = [];
  const walk = (p) => {
    for (const f of fs.readdirSync(p)) {
      const q = path.join(p, f);
      if (fs.statSync(q).isDirectory()) walk(q);
      else if (CODE.test(f)) out.push(q);
    }
  };
  walk(dir);
  return out;
}

// ---- line diff (LCS), returns for each line of a: { kind: 'same' } | { kind: 'changed', text } | { kind: 'deleted' }
function align(a, b) {
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0;
  while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  const A = a.slice(pre, a.length - suf), B = b.slice(pre, b.length - suf);
  const n = A.length, m = B.length;
  const W = m + 1;
  const dp = new Uint16Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * W + j] = A[i] === B[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
    }
  }
  const res = new Array(a.length);
  for (let k = 0; k < pre; k++) res[k] = { kind: 'same' };
  for (let k = 0; k < suf; k++) res[a.length - 1 - k] = { kind: 'same' };
  let i = 0, j = 0;
  let dels = [], ins = [];
  // Inside a hunk, pair each removed line with the most similar added line, keeping order
  const flush = () => {
    let from = 0;
    for (const di of dels) {
      let best = -1, bestSim = 0.3;
      for (let k = from; k < ins.length; k++) {
        const sim = similarity(A[di], B[ins[k]]);
        if (sim > bestSim) { bestSim = sim; best = k; }
      }
      if (best >= 0) { res[pre + di] = { kind: 'changed', text: B[ins[best]] }; from = best + 1; }
      else res[pre + di] = { kind: 'deleted' };
    }
    dels = [];
    ins = [];
  };
  while (i < n || j < m) {
    if (i < n && j < m && A[i] === B[j]) { flush(); res[pre + i] = { kind: 'same' }; i++; j++; }
    else if (j < m && (i >= n || dp[i * W + j + 1] >= dp[(i + 1) * W + j])) { ins.push(j); j++; }
    else { dels.push(i); i++; }
  }
  flush();
  return res;
}

function similarity(x, y) {
  const words = (s) => new Set(s.split(/[^A-Za-z0-9#-]+/).filter(Boolean));
  const a = words(x), b = words(y);
  if (!a.size && !b.size) return 1;
  let common = 0;
  for (const w of a) if (b.has(w)) common++;
  return (2 * common) / (a.size + b.size);
}

const squash = (s) => (s ?? '').replace(/\s+/g, ' ').trim();

/** Equivalent spellings of the same token count as a match: sysVar('x'), {sysVar('x')},
 *  `${sysVar('x')}` inside a template and 'var(--rd-sys-color-x)' in a string all render the same. */
function canon(s) {
  if (s === undefined) return s;
  return squash(s)
    .replace(/\$\{(sysVar|compVar|shadowVar)\('([\w-]+)'\)\}/g, (m, f, k) => cssVar(f, k))
    .replace(/(sysVar|compVar|shadowVar)\('([\w-]+)'\)/g, (m, f, k) => `'${cssVar(f, k)}'`)
    .replace(/[`"]/g, "'")
    .replace(/=\{('[^'{}]*')\}/g, '=$1');
}
const cssVar = (f, k) => (f === 'compVar' ? `var(--rd-comp-color-${k})` : f === 'shadowVar' ? `var(--rd-sys-color-shadow-${k})` : `var(--rd-sys-color-${k})`);
const importSet = (s) => {
  const m = s.match(/^\s*import\s*\{([^}]*)\}\s*from/);
  return m ? m[1].split(',').map((x) => x.trim()).filter(Boolean).sort().join(',') : null;
};
const tokensIn = (s) => [...(s ?? '').matchAll(/(?:sysVar|compVar|shadowVar)\('([\w-]+)'\)|var\(--(?:rd-sys-color-|rd-comp-color-|font-[\w]+-)?([\w-]+)\)/g)].map((m) => m[1] ?? m[2]);

function reasonFor(kind, before, codemod, reference) {
  if (kind === 'overreach') return 'Codemod changed a line Phase 6 kept';
  if (kind === 'missed') {
    if (/^\s*$/.test(reference ?? '') || reference === undefined) return 'Phase 6 deleted or restructured this line';
    if (/\/\/|\/\*/.test(reference) && !/\/\/|\/\*/.test(before)) return 'Phase 6 added a comment or restructured the line';
    return 'Phase 6 rewrote a line the codemod neither changed nor listed';
  }
  const ct = tokensIn(codemod), rt = tokensIn(reference);
  if (ct.length && rt.length && ct.join() !== rt.join()) return `Different token: codemod ${ct.join(', ')}; Phase 6 ${rt.join(', ')}`;
  return 'Codemod output differs from Phase 6';
}

function compareFixture(name, cmpDir, judgement) {
  const prefix = `src/prototypes/${name}`;
  const afterFiles = new Set(git('ls-tree', '-r', '--name-only', fx.after, prefix).split('\n').filter((f) => CODE.test(f)));
  const counts = { match: 0, judgement: 0, mismatch: 0 };
  const mismatches = [];
  const notInAfter = [];
  const judged = new Set(judgement.map((j) => `${j.file}:${j.line}`));
  for (const abs of filesIn(path.join(cmpDir, prefix))) {
    const relp = path.relative(cmpDir, abs).split(path.sep).join('/');
    if (!afterFiles.has(relp)) { notInAfter.push(relp); continue; }
    const before = git('show', `${fx.before}:${relp}`).split('\n');
    const codemod = fs.readFileSync(abs, 'utf8').split('\n');
    const after = git('show', `${fx.after}:${relp}`).split('\n');
    const ba = align(before, after);
    const bc = align(before, codemod);
    for (let i = 0; i < before.length; i++) {
      const a = ba[i], c = bc[i];
      const key = `${relp}:${i + 1}`;
      const cText = c.kind === 'changed' ? c.text : c.kind === 'same' ? before[i] : undefined;
      const aText = a.kind === 'changed' ? a.text : a.kind === 'same' ? before[i] : undefined;
      if (a.kind === 'same' && c.kind === 'same') continue;
      let cls, why = null;
      const equal = cText === aText || (cText !== undefined && aText !== undefined && canon(cText) === canon(aText))
        || (importSet(cText ?? '') && importSet(cText) === importSet(aText ?? ''))
        || (a.kind === 'deleted' && c.kind === 'deleted');
      const ci = importSet(cText ?? ''), ai = importSet(aText ?? '');
      const importJudged = ci !== null && ai !== null && (() => {
        const cs = new Set(ci.split(',')), as = new Set(ai.split(','));
        const extraC = [...cs].filter((x) => !as.has(x)), extraA = [...as].filter((x) => !cs.has(x));
        return extraC.every((x) => /^(referenceColors|systemColors|rdComponentColors)$/.test(x)) && extraA.every((x) => /^(sysVar|compVar|shadowVar)$/.test(x));
      })();
      if (a.kind === 'same') { cls = 'mismatch'; why = 'overreach'; }
      else if (equal) cls = 'match';
      else if (importJudged) cls = 'judgement';
      else if (judged.has(key)) cls = 'judgement';
      else if (c.kind === 'same') { cls = 'mismatch'; why = 'missed'; }
      else { cls = 'mismatch'; why = 'different'; }
      counts[cls]++;
      if (cls === 'mismatch') {
        mismatches.push({ at: key, kind: why, codemod: (cText ?? '(deleted)').trim().slice(0, 160), reference: (aText ?? '(deleted)').trim().slice(0, 160), reason: reasonFor(why, before[i], cText, aText) });
      }
    }
  }
  return { counts, mismatches, notInAfter };
}

function scanCounts(dir) {
  try {
    const out = execFileSync('node', [path.join(HERE, 'scan.mjs'), dir, '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const j = JSON.parse(out);
    const by = {};
    for (const f of j.findings) by[f.kind] = (by[f.kind] ?? 0) + 1;
    return by;
  } catch (e) {
    // Fallback: our own count of literal colours and light reads
    const by = { literal: 0, 'light-read': 0 };
    for (const f of filesIn(dir)) {
      for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
        if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d/.test(line.replace(/var\([^)]*\)/g, ''))) by.literal++;
        if (/\b(systemColors|rdComponentColors)\.light\[|\breferenceColors\./.test(line)) by['light-read']++;
      }
    }
    return by;
  }
}

// ---------------------------------------------------------------------------

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codemod-check-'));
let drift = 0;
const results = {};
try {
  for (const [name, rec] of Object.entries(fx.fixtures)) {
    if (only && name !== only) continue;
    const prefix = `src/prototypes/${name}`;
    const fullDir = path.join(tmpRoot, name, 'full');
    const cmpDir = path.join(tmpRoot, name, 'cmp');
    extract(fx.before, fullDir, prefix);
    extract(fx.before, cmpDir, prefix);

    const full = migrate([path.join(fullDir, prefix)], { write: true });
    const cmp = migrate([path.join(cmpDir, prefix)], { write: true, skip: fx.compareSkip });
    const judgementItems = cmp.judgement.flatMap((g) => g.at.map((a) => ({ file: a.file, line: a.line })));
    // Lines left alone because rules.json calls the colour data count as judgement: a designer decided
    for (const a of cmp.allowed) { const i = a.lastIndexOf(':'); judgementItems.push({ file: a.slice(0, i), line: +a.slice(i + 1) }); }
    const { counts, mismatches, notInAfter } = compareFixture(name, cmpDir, judgementItems);
    const scan = scanCounts(path.join(fullDir, prefix));

    const swaps = Object.fromEntries(Object.entries(full.rules).sort().map(([r, v]) => [r, v.count]));
    const now = {
      autoSwaps: swaps,
      autoTotal: Object.values(swaps).reduce((a, b) => a + b, 0),
      judgement: full.judgementCount,
      scanAfter: Object.fromEntries(Object.entries(scan).sort()),
      lines: counts,
      notInAfter,
    };
    // keep hand-written reasons
    const oldReasons = Object.fromEntries((rec.mismatches ?? []).filter((m) => m.note).map((m) => [m.at, m.note]));
    now.mismatches = mismatches.map((m) => (oldReasons[m.at] ? { ...m, note: oldReasons[m.at] } : m));
    results[name] = now;

    const cmpKeys = ['autoSwaps', 'autoTotal', 'judgement', 'scanAfter', 'lines'];
    const diffs = cmpKeys.filter((k) => JSON.stringify(rec[k]) !== JSON.stringify(now[k]));
    const atOf = (list) => JSON.stringify((list ?? []).map((m) => m.at).sort());
    if (atOf(rec.mismatches) !== atOf(now.mismatches)) diffs.push('mismatch lines');
    const l = counts;
    console.log(`${name.padEnd(16)} swaps ${String(now.autoTotal).padEnd(5)} judgement ${String(now.judgement).padEnd(4)} lines: match ${String(l.match).padEnd(4)} judgement ${String(l.judgement).padEnd(4)} mismatch ${String(l.mismatch).padEnd(4)} ${diffs.length ? 'DRIFT: ' + diffs.join(', ') : 'ok'}`);
    if (diffs.length && !UPDATE) {
      drift++;
      for (const k of diffs) console.log(`    ${k}: recorded ${JSON.stringify(rec[k])}\n    ${' '.repeat(k.length)}  now      ${JSON.stringify(now[k])}`);
    }
    if (VERBOSE) for (const m of mismatches) console.log(`    ${m.at}  [${m.kind}] ${m.reason}\n      codemod:   ${m.codemod}\n      reference: ${m.reference}`);
  }
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

if (UPDATE) {
  for (const [name, now] of Object.entries(results)) fx.fixtures[name] = { ...fx.fixtures[name], ...now };
  fs.writeFileSync(FIXTURES, JSON.stringify(fx, null, 2) + '\n');
  console.log(`\nRecorded ${Object.keys(results).length} fixtures in ${path.relative(ROOT, FIXTURES)}`);
} else if (drift) {
  console.log(`\n${drift} fixture(s) drifted. If the change is intended, run with --update and commit codemod-fixtures.json with the codemod change.`);
  process.exit(1);
}
