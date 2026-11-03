#!/usr/bin/env node

/**
 * Create Prototype Script
 *
 * Creates a new prototype folder from a template and registers it in
 * registry-mine.ts (the designer's own registry, never registry.ts or
 * registry-core.ts). The templates use theme tokens, so a new prototype is
 * dark ready: the script checks it with the dark readiness scan and marks it
 * theme: 'global' when the scan agrees, so it follows light and dark.
 *
 * Usage:
 *   node scripts/create-prototype.js MyPrototype
 *   npm run new-prototype MyPrototype
 *   npm run new-prototype MyPrototype -- --liveboard
 *
 * /rp-new-prototype in Claude Code does the same with discovery questions first.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Get prototype name and flags from args
const args = process.argv.slice(2);
const isLiveboard = args.includes('--liveboard');
const prototypeName = args.find((a) => !a.startsWith('--'));

if (!prototypeName) {
  console.error('\x1b[31mError: Please provide a prototype name\x1b[0m');
  console.log('\nUsage:');
  console.log('  npm run new-prototype MyPrototypeName');
  console.log('  node scripts/create-prototype.js MyPrototypeName\n');
  process.exit(1);
}

// Validate name (PascalCase)
if (!/^[A-Z][a-zA-Z0-9]*$/.test(prototypeName)) {
  console.error('\x1b[31mError: Prototype name should be in PascalCase (e.g., MyPrototype)\x1b[0m');
  process.exit(1);
}

const prototypesDir = path.join(ROOT, 'src', 'prototypes');
const prototypeDir = path.join(prototypesDir, prototypeName);
const registryPath = path.join(prototypesDir, 'registry-mine.ts');
const displayName = prototypeName.replace(/([A-Z])/g, ' $1').trim();
const sentenceName = displayName.charAt(0) + displayName.slice(1).toLowerCase();

if (fs.existsSync(prototypeDir)) {
  console.error(`\x1b[31mError: Prototype '${prototypeName}' already exists\x1b[0m`);
  process.exit(1);
}
if (!fs.existsSync(registryPath)) {
  console.error('\x1b[31mError: src/prototypes/registry-mine.ts not found\x1b[0m');
  process.exit(1);
}

// ── Copy the template ──────────────────────────────────
const templateName = isLiveboard ? '_liveboard-template' : '_template';
const templateDir = path.join(prototypesDir, templateName);
if (!fs.existsSync(templateDir)) {
  console.error(`\x1b[31mError: ${templateName} not found. Cannot scaffold.\x1b[0m`);
  process.exit(1);
}

const created = [];
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (/^thumbnail\.(light|dark)\.jpg$/.test(entry.name)) {
      continue; // the template's gallery screenshots don't belong to the new prototype
    } else if (/\.(tsx?|md|css|json)$/.test(entry.name)) {
      let content = fs.readFileSync(srcPath, 'utf-8');
      content = content
        .replace(/LiveboardTemplate/g, prototypeName)
        .replace(/Liveboard Template/g, displayName)
        .replace(/PrototypeTemplate/g, prototypeName)
        .replace(/Prototype Template/g, displayName);
      fs.writeFileSync(destPath, content);
      created.push(path.relative(ROOT, destPath));
    } else {
      fs.copyFileSync(srcPath, destPath);
      created.push(path.relative(ROOT, destPath));
    }
  }
}
copyDir(templateDir, prototypeDir);

// ── Check dark readiness ───────────────────────────────
let darkReady = false;
try {
  const scan = JSON.parse(
    execFileSync(process.execPath, [path.join(ROOT, 'scripts/radiant-check/scan.mjs'), `src/prototypes/${prototypeName}`, '--json'], {
      cwd: ROOT,
      encoding: 'utf-8',
      maxBuffer: 64 * 1024 * 1024,
    }),
  );
  darkReady = Boolean(scan.ready?.[`src/prototypes/${prototypeName}`]?.dark);
} catch {
  darkReady = false; // no scan, no claim: the prototype stays light until checked
}

// ── Register in registry-mine.ts ───────────────────────
let registry = fs.readFileSync(registryPath, 'utf-8');
if (registry.includes(`id: '${prototypeName}'`)) {
  console.error(`\x1b[31mError: registry-mine.ts already has an entry for '${prototypeName}'\x1b[0m`);
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);
const description = isLiveboard
  ? 'Liveboard prototype with view and edit modes and SpotterViz.'
  : 'New prototype. Describe your UI to Claude to build it.';
const entry = [
  '  {',
  `    id: '${prototypeName}',`,
  `    name: '${sentenceName}',`,
  `    description: '${description}',`,
  `    lastModified: '${today}',`,
  `    component: ${prototypeName},`,
  `    section: 'mine',`,
  ...(darkReady ? [`    theme: 'global', // follows light and dark, checked by npm run new-prototype on ${today}`] : []),
  `    look: 'radiant-3', // Radiant 3.0 Figma sizes (32px fields and menu items, 6px radii)`,
  '  },',
].join('\n');

if (!/^import React\b/m.test(registry)) {
  registry = registry.replace(/^(import [^\n]*\n)/m, `import React from 'react';\n$1`);
}
const lazyLine = `const ${prototypeName} = React.lazy(() => import('./${prototypeName}'));`;
registry = registry.replace(/^export const myRegistry/m, `${lazyLine}\n\nexport const myRegistry`);
if (/export const myRegistry:\s*ProjectMeta\[\]\s*=\s*\[\s*\];/.test(registry)) {
  registry = registry.replace(/(export const myRegistry:\s*ProjectMeta\[\]\s*=\s*)\[\s*\];/, `$1[\n${entry}\n];`);
} else {
  const start = registry.search(/export const myRegistry/);
  const close = registry.indexOf('\n];', start);
  if (start < 0 || close < 0) {
    console.error('\x1b[31mError: could not find the myRegistry array in registry-mine.ts. Add the entry by hand:\x1b[0m');
    console.log(`\n${lazyLine}\n\n${entry}\n`);
    process.exit(1);
  }
  registry = registry.slice(0, close) + `\n${entry}` + registry.slice(close);
}
fs.writeFileSync(registryPath, registry);

// ── Report ─────────────────────────────────────────────
console.log(`\n\x1b[32m✓ Created ${isLiveboard ? 'Liveboard prototype' : 'prototype'}: ${prototypeName}\x1b[0m\n`);
console.log(`Files created (from ${templateName}):`);
for (const f of created) console.log(`  ${f}`);
console.log('  src/prototypes/registry-mine.ts (registered)');
console.log(
  darkReady
    ? '\nDark mode: ready. It follows light and dark (theme: \'global\').'
    : '\nDark mode: not confirmed, so it stays light for now. Run /rp-radiant-check or /rp-migrate-prototype to check it.',
);
console.log('\nNext steps:');
console.log(`  1. Open src/prototypes/${prototypeName}/index.tsx`);
console.log('  2. Describe your UI to Claude (or run /rp-new-prototype for a guided start)');
console.log(`  3. Preview at localhost:5173/playground/${prototypeName}\n`);
