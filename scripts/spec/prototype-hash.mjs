#!/usr/bin/env node
/**
 * A fingerprint of a prototype's code, for spec approval.
 *
 * When a designer approves a prototype's spec (/rp-spec), the fingerprint is
 * stored in its spec.tsx. If the prototype's code changes afterwards, the
 * fingerprint no longer matches and the spec reads "Changed since approval".
 *
 * Hashes every .ts, .tsx, .css and .json file in src/prototypes/<Name>/, except
 * spec.tsx itself, in path order.
 *
 *   node scripts/spec/prototype-hash.mjs <Name>    prints the fingerprint
 *
 * vite.config.ts uses prototypeHashesPlugin() to give the app the same values
 * as `virtual:prototype-hashes`.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const PROTOTYPES = join(ROOT, 'src', 'prototypes');
const HASHED = /\.(tsx?|css|json)$/;

const filesIn = (dir) => readdirSync(dir).flatMap((entry) => {
  const path = join(dir, entry);
  return statSync(path).isDirectory() ? filesIn(path) : [path];
});

/** The fingerprint of one prototype folder, or null when it doesn't exist */
export function prototypeHash(name) {
  const dir = join(PROTOTYPES, name);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return null;
  const files = filesIn(dir)
    .map((path) => relative(dir, path).split(sep).join('/'))
    .filter((rel) => HASHED.test(rel) && rel !== 'spec.tsx')
    .sort();
  const hash = createHash('sha1');
  for (const rel of files) {
    hash.update(rel).update('\0').update(readFileSync(join(dir, rel))).update('\0');
  }
  return hash.digest('hex').slice(0, 12);
}

/** Fingerprints for every prototype folder that has a spec.tsx */
export function specPrototypeHashes() {
  return Object.fromEntries(
    readdirSync(PROTOTYPES)
      .filter((name) => existsSync(join(PROTOTYPES, name, 'spec.tsx')))
      .map((name) => [name, prototypeHash(name)]),
  );
}

const VIRTUAL = 'virtual:prototype-hashes';

/** Vite plugin: `import hashes from 'virtual:prototype-hashes'`, refreshed as prototypes change */
export function prototypeHashesPlugin() {
  return {
    name: 'radiantplay-prototype-hashes',
    resolveId(id) {
      return id === VIRTUAL ? '\0' + VIRTUAL : undefined;
    },
    load(id) {
      return id === '\0' + VIRTUAL ? `export default ${JSON.stringify(specPrototypeHashes())};` : undefined;
    },
    configureServer(server) {
      const refresh = (file) => {
        if (!file.startsWith(PROTOTYPES)) return;
        const mod = server.moduleGraph.getModuleById('\0' + VIRTUAL);
        if (mod) server.moduleGraph.invalidateModule(mod);
      };
      server.watcher.on('change', refresh);
      server.watcher.on('add', refresh);
      server.watcher.on('unlink', refresh);
    },
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const name = process.argv[2];
  if (!name) {
    console.error('Usage: node scripts/spec/prototype-hash.mjs <PrototypeFolder>');
    process.exit(1);
  }
  const value = prototypeHash(name);
  if (!value) {
    console.error(`No prototype folder at src/prototypes/${name}`);
    process.exit(1);
  }
  console.log(value);
}
