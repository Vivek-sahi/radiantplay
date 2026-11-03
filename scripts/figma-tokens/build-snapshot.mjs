#!/usr/bin/env node
/**
 * Assemble scripts/figma-tokens/snapshot/variables.json from the raw
 * exports in snapshot/raw/ (pulled through the Figma MCP, see README.md).
 *
 * Raw files are compact because the MCP caps each response at 20 KB:
 *   raw/primitives.json   [name, id, type, value, scopes, description][]
 *   raw/theme.json        { modes, rows: [name, id, type, scopes, ...valuePerMode][] }
 *                         a value starting with '@' is an alias to a primitive id
 *   raw/descriptions.json { [id]: { d?: description, c?: codeSyntax } }
 *
 * Fails if counts don't match the collection sizes recorded below, or an
 * alias points at an unknown primitive.
 *
 * Usage: node scripts/figma-tokens/build-snapshot.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.join(HERE, 'snapshot/raw');
const OUT = path.join(HERE, 'snapshot/variables.json');

// Collection sizes as reported by Figma on the last pull. Update with the raw files.
const EXPECTED = { Primitive: 129, Theme: 112 };

const TYPES = { C: 'COLOR', F: 'FLOAT', S: 'STRING', B: 'BOOLEAN' };
const read = async (f) => JSON.parse(await fs.readFile(path.join(RAW, f), 'utf8'));

const primitivesRaw = await read('primitives.json');
const themeRaw = await read('theme.json');
const descriptions = await read('descriptions.json');

const errors = [];
const byId = new Map();
const variables = {};

for (const [name, id, type, value, scopes, description] of primitivesRaw) {
  const entry = {
    id: `VariableID:${id}`,
    collection: 'Primitive',
    type: TYPES[type],
    scopes: scopes.split('+').sort(),
    values: { light: { value } },
  };
  if (description) entry.description = description;
  variables[name] = entry;
  byId.set(id, { name, value });
}

const modes = themeRaw.modes.map((m) => m.toLowerCase());
for (const [name, id, type, scopes, ...perMode] of themeRaw.rows) {
  const values = {};
  perMode.forEach((raw, i) => {
    if (typeof raw === 'string' && raw.startsWith('@')) {
      const target = byId.get(raw.slice(1));
      if (!target) errors.push(`${name} (${modes[i]}): alias to unknown primitive ${raw}`);
      values[modes[i]] = target
        ? { value: target.value, alias: { id: `VariableID:${raw.slice(1)}`, name: target.name } }
        : { value: null, alias: { id: `VariableID:${raw.slice(1)}`, name: null } };
    } else {
      values[modes[i]] = { value: raw };
    }
  });
  const entry = {
    id: `VariableID:${id}`,
    collection: 'Theme',
    type: TYPES[type],
    scopes: scopes.split('+').sort(),
    values,
  };
  const extra = descriptions[id];
  if (extra?.d) entry.description = extra.d;
  if (extra?.c) entry.codeSyntax = extra.c;
  variables[name] = entry;
}

const counts = { Primitive: primitivesRaw.length, Theme: themeRaw.rows.length };
for (const [col, n] of Object.entries(EXPECTED)) {
  if (counts[col] !== n) errors.push(`${col}: expected ${n} variables, raw file has ${counts[col]}`);
}
for (const id of Object.keys(descriptions)) {
  if (!themeRaw.rows.some((r) => r[1] === id)) errors.push(`description for unknown theme id ${id}`);
}

if (errors.length) {
  console.error(`Snapshot not written:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}

const sorted = Object.fromEntries(Object.keys(variables).sort().map((k) => [k, variables[k]]));
const out = {
  fileKey: '1QlRveXx4wppvDXyPVWUTK',
  collections: {
    Primitive: { modes: ['Light'], count: counts.Primitive },
    Theme: { modes: themeRaw.modes, count: counts.Theme },
  },
  variables: sorted,
};
await fs.writeFile(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote ${path.relative(path.resolve(HERE, '../..'), OUT)}: ${counts.Primitive} primitive, ${counts.Theme} theme variables`);
