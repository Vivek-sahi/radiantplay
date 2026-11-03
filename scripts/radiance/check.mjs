#!/usr/bin/env node
// npm run radiance:check   (also part of npm run build:strict)
//
// 1. Every vendored Radiance file matches the sha256 in
//    public/vendor/radiance/manifest.json, so nobody has edited a copy
//    (Radiance RULES.md IMPL-1, PRODUCT-3, PRODUCT-5).
// 2. VENDOR_VERSION in the RadianceBackground wrapper matches the manifest.
// 3. The vendored Radiance lint passes over src/ and internal/scripts/.
//
// Node built-ins only, no network. A copy without the vendored files (the
// public snapshot omits them) skips the check.

import fs from 'node:fs';
import path from 'node:path';
import { MANIFEST, ROOT, VENDOR_DIR, VENDOR_VERSION_RE, WRAPPER, readManifest, sha256 } from './files.mjs';
import { runLint } from './lint.mjs';

// --root <dir> checks another copy of the repo (used to test the check itself).
const rootArg = process.argv.indexOf('--root');
const root = rootArg >= 0 ? path.resolve(process.argv[rootArg + 1]) : ROOT;

const manifest = rootArg >= 0
  ? (fs.existsSync(path.join(root, MANIFEST)) ? JSON.parse(fs.readFileSync(path.join(root, MANIFEST), 'utf8')) : null)
  : readManifest();

if (!manifest) {
  console.log(`radiance:check: no ${MANIFEST} in this copy, so there is nothing to check.`);
  process.exit(0);
}

const problems = [];

for (const file of manifest.files) {
  const full = path.join(root, file.path);
  if (!fs.existsSync(full)) problems.push(`missing   ${file.path}`);
  else if (sha256(full) !== file.sha256) problems.push(`edited    ${file.path} (differs from Radiance ${manifest.source.commit.slice(0, 7)})`);
}

const listed = new Set(manifest.files.map((f) => path.basename(f.path)));
for (const name of fs.readdirSync(path.join(root, VENDOR_DIR))) {
  if (!listed.has(name) && name !== 'manifest.json' && name !== 'README.md') {
    problems.push(`unmanaged ${VENDOR_DIR}/${name} (not in the manifest)`);
  }
}

const wrapper = path.join(root, WRAPPER);
const vendorVersion = fs.existsSync(wrapper) ? (fs.readFileSync(wrapper, 'utf8').match(VENDOR_VERSION_RE) || [])[1] : null;
if (vendorVersion !== manifest.vendorVersion) {
  problems.push(`stale     VENDOR_VERSION in ${WRAPPER} is '${vendorVersion}', manifest says '${manifest.vendorVersion}'`);
}

if (problems.length) {
  console.error(`radiance:check: the vendored Radiance files don't match ${MANIFEST}:\n`);
  console.error(problems.map((p) => `  ${p}`).join('\n'));
  console.error('\nThese files are Radiance\'s own and are never edited here. Restore them with'
    + ' `git checkout -- <file>`, or, as the maintainer, refresh them with `npm run radiance:update`.');
  process.exit(1);
}

console.log(`radiance:check: ${manifest.files.length} vendored files match Radiance ${manifest.radianceVersion}`
  + ` (${manifest.source.commit.slice(0, 7)}).`);

if (rootArg >= 0) process.exit(0);

const targets = ['src', 'internal/scripts'].filter((t) => fs.existsSync(path.join(ROOT, t)));
process.exit(runLint(targets, ['--quiet']) === 0 ? 0 : 1);
