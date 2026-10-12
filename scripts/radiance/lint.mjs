#!/usr/bin/env node
// npm run radiance:lint -- <path> [--quiet]
//
// Runs Radiance's own linter (vendored, unedited, in scripts/radiance/upstream/)
// over a path, so a prototype can be checked against Radiance's RULES.md
// without access to the private Radiance repo. No path lints src/.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LINT, ROOT } from './files.mjs';

export function runLint(targets, extra = []) {
  const lint = path.join(ROOT, LINT);
  if (!fs.existsSync(lint)) {
    console.error(`Radiance lint is not in this copy (${LINT}).`);
    return 2;
  }
  const result = spawnSync(process.execPath, [lint, ...targets, ...extra], { cwd: ROOT, stdio: 'inherit' });
  return result.status ?? 1;
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const flags = args.filter((a) => a.startsWith('--'));
  const targets = args.filter((a) => !a.startsWith('--'));
  process.exit(runLint(targets.length ? targets : ['src'], flags));
}
