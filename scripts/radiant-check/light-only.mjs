#!/usr/bin/env node
/**
 * Keeps prototypes that aren't dark ready in light mode, by setting theme: 'light-only' on their
 * registry-mine.ts entries. /sync-upstream runs it after a merge; /migrate-prototype lifts the flag
 * once a prototype is dark ready. Spec: docs/2026-10-07-prototype-migration-plan.md, section 5.
 *
 * Usage:
 *   node scripts/radiant-check/light-only.mjs                     dry run: what it would flag
 *   node scripts/radiant-check/light-only.mjs --write             add the flag where the scan says "dark: no"
 *   node scripts/radiant-check/light-only.mjs <Name...> --write   the same, for these prototypes only
 *   node scripts/radiant-check/light-only.mjs --remove <Name>     dry run of lifting one flag (add --write to apply)
 *   --by <who>   who set it, for the comment (default "sync")
 *
 * "Dark ready" is the dark column of `scan.mjs --mine --json`. The flag goes in as the entry's last
 * property with a dated comment:
 *   theme: 'light-only', // light-only until migrated (/migrate-prototype), set by sync on 2026-10-07
 * Only that line changes; the rest of the file keeps its formatting. Running it twice changes nothing.
 *
 * A designer who deletes the line by hand keeps it deleted: each flag it sets is recorded in
 * rules-mine.json (lightOnly, with the finding count at the time), and an entry that is recorded but
 * no longer flagged is left alone unless its findings have gone up since. --remove clears the record.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const REGISTRY = path.join(ROOT, 'src/prototypes/registry-mine.ts');
const RULES_MINE = path.join(HERE, 'rules-mine.json');

const argv = process.argv.slice(2);
const WRITE = argv.includes('--write');
const valueOf = (name) => { const i = argv.indexOf(name); return i > -1 ? argv[i + 1] : null; };
const REMOVE = valueOf('--remove');
const BY = valueOf('--by') ?? 'sync';
const NAMES = argv.filter((a, i) => !a.startsWith('--') && !['--remove', '--by'].includes(argv[i - 1]));
if (argv.includes('--remove') && !REMOVE) {
  console.error('Usage: node scripts/radiant-check/light-only.mjs --remove <Name> [--write]');
  process.exit(2);
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const COMMENT = `// light-only until migrated (/migrate-prototype), set by ${BY} on ${today()}`;
const FLAG_LINE = /^[ \t]*theme:\s*['"]light-only['"],?[^\n]*\n/m;

if (!fs.existsSync(REGISTRY)) {
  console.log('No src/prototypes/registry-mine.ts, nothing to do.');
  process.exit(0);
}
let src = fs.readFileSync(REGISTRY, 'utf8');

/** registry-mine.ts entries with their position, same shape the scan and thumbnail tools read. */
function entries(text) {
  const out = [];
  for (const m of text.matchAll(/\{(\s*)id:\s*['"]([^'"]+)['"]([\s\S]*?)\n([ \t]*)\}/g)) {
    const indent = m[1].replace(/^\n/, '').replace(/[^ \t]/g, '');
    out.push({ id: m[2], start: m.index, end: m.index + m[0].length, body: m[0], indent, flagged: /theme:\s*['"]light-only['"]/.test(m[3]) });
  }
  return out;
}

const rulesMine = fs.existsSync(RULES_MINE) ? JSON.parse(fs.readFileSync(RULES_MINE, 'utf8')) : { exclude: [], allow: [] };
const record = rulesMine.lightOnly ?? {};
let recordChanged = false;

function saveRecord() {
  if (!recordChanged) return;
  rulesMine.lightOnly = Object.fromEntries(Object.keys(record).sort().map((k) => [k, record[k]]));
  if (!Object.keys(record).length) delete rulesMine.lightOnly;
  fs.writeFileSync(RULES_MINE, JSON.stringify(rulesMine, null, 2) + '\n');
}

// --remove <Name>: lift one flag
if (REMOVE) {
  const e = entries(src).find((x) => x.id === REMOVE);
  if (!e) {
    console.error(`No entry with id '${REMOVE}' in registry-mine.ts.`);
    process.exit(1);
  }
  if (!e.flagged) {
    console.log(`${REMOVE} has no light-only flag in registry-mine.ts.`);
  } else {
    const body = e.body.replace(FLAG_LINE, '');
    if (WRITE) {
      fs.writeFileSync(REGISTRY, src.slice(0, e.start) + body + src.slice(e.end));
      console.log(`Removed the light-only flag from ${REMOVE}. It now follows the light and dark theme.`);
    } else {
      console.log(`Would remove the light-only flag from ${REMOVE}. Run again with --write to apply.`);
    }
  }
  if (record[REMOVE] && WRITE) { delete record[REMOVE]; recordChanged = true; }
  if (WRITE) saveRecord();
  process.exit(0);
}

// Default: flag every entry the scan doesn't call dark ready
const scan = JSON.parse(execFileSync(process.execPath, [path.join(HERE, 'scan.mjs'), '--mine', '--json'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }));
const COLOUR = ['literal', 'light-read', 'unknown-token', 'media-query', 'theme-write'];
const colourFindings = (c) => COLOUR.reduce((n, k) => n + (c?.[k] ?? 0), 0) + (c?.vendor ?? 0);

const toFlag = [];
const notes = [];
const all = entries(src);
for (const n of NAMES) if (!all.some((e) => e.id === n)) notes.push(`${n}: no entry with that id in registry-mine.ts`);
for (const e of all) {
  if (NAMES.length && !NAMES.includes(e.id)) continue;
  const unit = `src/prototypes/${e.id}`;
  const ready = scan.ready?.[unit];
  const counts = scan.units?.[unit];
  if (!ready) { notes.push(`${e.id}: not scanned (no folder at ${unit}?), left as it is`); continue; }
  const n = colourFindings(counts);
  if (ready.dark) {
    if (e.flagged) notes.push(`${e.id}: dark ready but still light-only. /migrate-prototype ${e.id} can lift the flag`);
    continue;
  }
  if (e.flagged) continue;
  const prev = record[e.id];
  if (prev && n <= prev.findings) {
    notes.push(`${e.id}: not dark ready, but the flag was removed by hand after ${prev.set}; left global`);
    continue;
  }
  const vendor = counts.vendor ? `, ${counts.vendor} in vendor/` : '';
  toFlag.push({ ...e, n, why: `${n} colour findings${vendor}` });
}

if (!toFlag.length) {
  console.log('No prototypes to flag light-only.');
} else {
  console.log(`${WRITE ? 'Flagged' : 'Would flag'} light-only:`);
  for (const e of toFlag) console.log(`  ${e.id}  (${e.why})`);
}
for (const n of notes) console.log(`Note: ${n}`);

if (toFlag.length && WRITE) {
  // Apply from the end of the file so earlier positions stay valid
  for (const e of [...toFlag].sort((a, b) => b.start - a.start)) {
    const lines = e.body.split('\n');
    const closing = lines.pop(); // the entry's closing brace line
    let last = lines.length - 1;
    while (last > 0 && !lines[last].trim()) last--;
    // The last property needs a trailing comma before a new one follows it (unless it ends in a comment)
    if (!/,\s*(\/\/.*)?$/.test(lines[last]) && !/^\s*\/\//.test(lines[last])) {
      lines[last] = lines[last].replace(/(\s*)(\/\/.*)?$/, (m, sp, c) => (c ? `,${sp}${c}` : ','));
    }
    const indent = e.indent || (lines[1]?.match(/^[ \t]*/)?.[0] ?? '    ');
    lines.splice(last + 1, 0, `${indent}theme: 'light-only', ${COMMENT}`);
    const body = [...lines, closing].join('\n');
    src = src.slice(0, e.start) + body + src.slice(e.end);
    record[e.id] = { set: today(), findings: e.n };
    recordChanged = true;
  }
  fs.writeFileSync(REGISTRY, src);
  saveRecord();
} else if (toFlag.length) {
  console.log('Dry run. Run again with --write to apply.');
}
