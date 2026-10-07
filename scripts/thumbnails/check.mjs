#!/usr/bin/env node
/**
 * Lists prototypes whose gallery thumbnail is missing or older than their code.
 * No browser needed. Compares the last commit that touched the thumbnail with the
 * last commit that touched anything else in the prototype folder.
 *
 * Usage: npm run thumbnails:check [-- --mine]   (--mine: registry-mine.ts entries only)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mineOnly = process.argv.includes('--mine');

const git = (...args) => {
  try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return ''; }
};

const files = mineOnly ? ['src/prototypes/registry-mine.ts'] : ['src/prototypes/registry-core.ts', 'src/prototypes/registry-mine.ts'];
const ids = [];
for (const f of files) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  for (const m of fs.readFileSync(p, 'utf8').matchAll(/\{\s*id:\s*'([^']+)'([\s\S]*?)\n\s*\}/g)) {
    if (!/section:\s*'archived'/.test(m[2])) ids.push(m[1]);
  }
}

const missing = [];
const stale = [];
for (const id of ids) {
  const dir = `src/prototypes/${id}`;
  const thumb = `${dir}/thumbnail.light.jpg`;
  if (!fs.existsSync(path.join(ROOT, thumb))) { missing.push(id); continue; }
  const thumbTime = Number(git('log', '-1', '--format=%ct', '--', thumb)) || Infinity; // uncommitted counts as fresh
  const codeTime = Number(git('log', '-1', '--format=%ct', '--', dir, `:(exclude)${dir}/thumbnail.*`)) || 0;
  if (codeTime > thumbTime) stale.push(id);
}

if (!missing.length && !stale.length) {
  console.log('All prototype thumbnails are up to date.');
} else {
  if (missing.length) console.log(`No thumbnail yet (the gallery shows a live preview): ${missing.join(', ')}`);
  if (stale.length) console.log(`Thumbnail older than the prototype: ${stale.join(', ')}`);
  console.log(`Refresh with: npm run thumbnails -- ${[...missing, ...stale].join(' ')}  (or ask Claude: /thumbnail)`);
}
