#!/usr/bin/env node
// npm run radiance:update [-- --from <radiance-repo-dir>]
//
// Maintainer only. Refreshes the vendored Radiance language from the Radiance
// repo (github.com/vinayakr-cpu/radiance-language, private): the renderer, every
// product recipe, and the lint with its tokens and RULES.md. Writes
// public/vendor/radiance/manifest.json, bumps VENDOR_VERSION in the
// RadianceBackground wrapper so browser caches bust, and lints src/.
//
// Designers never run this. The files ship in the repo and reach forks through
// /rp-sync-upstream. Normal builds never touch the network.
//
//   npm run radiance:update                       # gh repo clone (needs gh auth)
//   npm run radiance:update -- --from ~/radiance  # an existing checkout, offline

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  FIXED_FILES, MANIFEST, ROOT, VENDOR_VERSION_RE, WRAPPER,
  productRecipes, readManifest, sha256,
} from './files.mjs';
import { runLint } from './lint.mjs';

const SOURCE_REPO = 'vinayakr-cpu/radiance-language';
const KNOWN_PRODUCTS = ['home', 'spotterx', 'liveboard']; // recipes RadianceBackground loads

const fail = (message) => {
  console.error(`\nradiance:update: ${message}`);
  process.exit(1);
};
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opts });

// ---------------------------------------------------------------- source

const args = process.argv.slice(2);
const fromIndex = args.indexOf('--from');
let radianceDir;
let tempDir = null;

if (fromIndex >= 0) {
  if (!args[fromIndex + 1]) fail('--from needs a folder: npm run radiance:update -- --from <radiance-repo-dir>');
  radianceDir = path.resolve(args[fromIndex + 1]);
  if (!fs.existsSync(path.join(radianceDir, 'renderer', 'radiance-renderer.js'))) {
    fail(`${radianceDir} does not look like the Radiance repo (no renderer/radiance-renderer.js).`);
  }
} else {
  const gh = run('gh', ['auth', 'status']);
  if (gh.error) {
    fail('this is a maintainer command and needs the GitHub CLI (gh), which is not installed.\n'
      + '  Designers never need it: the Radiance files ship in the repo and arrive with /rp-sync-upstream.\n'
      + '  Offline: npm run radiance:update -- --from <a checkout of the Radiance repo>');
  }
  if (gh.status !== 0) {
    fail('gh is not logged in. Run `gh auth login` with an account that can read '
      + `github.com/${SOURCE_REPO} (private), then try again.\n`
      + '  Designers never need this: the Radiance files ship in the repo and arrive with /rp-sync-upstream.');
  }
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'radiance-'));
  radianceDir = path.join(tempDir, 'radiance-language');
  console.log(`Cloning ${SOURCE_REPO}...`);
  const clone = run('gh', ['repo', 'clone', SOURCE_REPO, radianceDir, '--', '--depth', '1', '--quiet']);
  if (clone.status !== 0) {
    fail(`could not clone ${SOURCE_REPO}. Check that your gh account has access to it.\n${clone.stderr || ''}`);
  }
}

const git = (...a) => run('git', ['-C', radianceDir, ...a]);
const head = git('rev-parse', 'HEAD');
if (head.status !== 0) fail(`${radianceDir} is not a git checkout, so its commit can't be recorded.`);
const commit = head.stdout.trim();
const commitDate = git('log', '-1', '--format=%cI').stdout.trim();
const dirty = git('status', '--porcelain').stdout.trim();
if (dirty) console.warn(`Warning: ${radianceDir} has uncommitted changes; the manifest records ${commit.slice(0, 7)} anyway.`);

const rendererSrc = fs.readFileSync(path.join(radianceDir, 'renderer', 'radiance-renderer.js'), 'utf8');
const version = (rendererSrc.match(/RADIANCE_VERSION\s*=\s*"([^"]+)"/) || [])[1];
if (!version) fail('could not read RADIANCE_VERSION from renderer/radiance-renderer.js.');
const vendorVersion = `${version}-${commit.slice(0, 7)}`;

// ---------------------------------------------------------------- copy

const files = [...FIXED_FILES, ...productRecipes(radianceDir)];
const previous = readManifest();
const changes = [];

for (const file of files) {
  const from = path.join(radianceDir, file.source);
  if (!fs.existsSync(from)) fail(`${file.source} is missing from the Radiance repo. Has its layout changed?`);
  const to = path.join(ROOT, file.path);
  const before = fs.existsSync(to) ? sha256(to) : null;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  file.sha256 = sha256(to);
  if (!before) changes.push(`added    ${file.path}`);
  else if (before !== file.sha256) changes.push(`updated  ${file.path}`);
}

// A file the last manifest listed that upstream no longer ships.
for (const old of previous?.files || []) {
  if (!files.some((f) => f.path === old.path) && fs.existsSync(path.join(ROOT, old.path))) {
    fs.rmSync(path.join(ROOT, old.path));
    changes.push(`removed  ${old.path} (no longer in the Radiance repo)`);
  }
}

const manifest = {
  $comment: 'Managed by scripts/radiance/update.mjs. Never edit these files by hand: npm run radiance:check fails on any change.',
  source: { repo: `github.com/${SOURCE_REPO}`, commit, commitDate },
  radianceVersion: version,
  vendorVersion,
  updated: changes.length || !previous?.updated ? new Date().toISOString().slice(0, 10) : previous.updated,
  files: files.map(({ source, path: p, sha256: s }) => ({ path: p, source, sha256: s })),
};
fs.writeFileSync(path.join(ROOT, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);

// ---------------------------------------------------------------- cache bust

const wrapperFile = path.join(ROOT, WRAPPER);
const wrapper = fs.readFileSync(wrapperFile, 'utf8');
const oldVendorVersion = (wrapper.match(VENDOR_VERSION_RE) || [])[1];
if (!oldVendorVersion) fail(`could not find VENDOR_VERSION in ${WRAPPER}.`);
if (oldVendorVersion !== vendorVersion) {
  fs.writeFileSync(wrapperFile, wrapper.replace(VENDOR_VERSION_RE, `const VENDOR_VERSION = '${vendorVersion}';`));
  changes.push(`bumped   VENDOR_VERSION ${oldVendorVersion} -> ${vendorVersion} in ${WRAPPER}`);
}

// ---------------------------------------------------------------- report

console.log(`\nRadiance ${previous ? `${previous.radianceVersion} (${previous.source.commit.slice(0, 7)})` : '(no manifest)'}`
  + ` -> ${version} (${commit.slice(0, 7)}, ${commitDate.slice(0, 10)})`);
console.log(changes.length ? changes.map((c) => `  ${c}`).join('\n') : '  No file changed.');

const unknown = productRecipes(radianceDir)
  .map((f) => path.basename(f.path).slice('radiance-'.length, -'.css'.length))
  .filter((id) => !KNOWN_PRODUCTS.includes(id));
if (unknown.length) {
  console.log(`\nNew product recipe(s): ${unknown.join(', ')}. RadianceBackground does not load them yet;`
    + ` add them to PRODUCT_RECIPES in ${WRAPPER} with their README markup.`);
}

if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });

console.log('\nLinting src/ with the vendored Radiance lint...');
const lintStatus = runLint(['src'], ['--quiet']);
console.log(`\n${MANIFEST} written. Review the diff, then commit with a changelog line.`);
process.exit(lintStatus === 0 ? 0 : 1);
