// Shared paths for the vendored Radiance language (update.mjs, check.mjs, lint.mjs).
// Node built-ins only.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const VENDOR_DIR = 'public/vendor/radiance';
export const MANIFEST = `${VENDOR_DIR}/manifest.json`;
export const UPSTREAM_DIR = 'scripts/radiance/upstream';
export const LINT = `${UPSTREAM_DIR}/tools/radiance-lint.mjs`;
export const WRAPPER = 'src/app-chrome/RadianceBackground/RadianceBackground.tsx';

// Files RadiantPlay vendors: Radiance repo path -> RadiantPlay path.
// The lint finds radiance.tokens.json one folder above itself, so upstream/
// mirrors the Radiance repo's layout (tools/ next to radiance.tokens.json).
export const FIXED_FILES = [
  { source: 'renderer/radiance-renderer.js', path: `${VENDOR_DIR}/radiance-renderer.js` },
  { source: 'tools/radiance-lint.mjs', path: LINT },
  { source: 'radiance.tokens.json', path: `${UPSTREAM_DIR}/radiance.tokens.json` },
  { source: 'RULES.md', path: `${UPSTREAM_DIR}/RULES.md` },
];

// Every product recipe the Radiance repo ships: products/<id>/radiance-<id>.css.
// Products without a recipe (signup) are drawn by the renderer alone.
export function productRecipes(radianceDir) {
  const productsDir = path.join(radianceDir, 'products');
  return fs
    .readdirSync(productsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => `radiance-${entry.name}.css`)
    .filter((file) => fs.existsSync(path.join(productsDir, file.slice('radiance-'.length, -'.css'.length), file)))
    .sort()
    .map((file) => ({
      source: `products/${file.slice('radiance-'.length, -'.css'.length)}/${file}`,
      path: `${VENDOR_DIR}/${file}`,
    }));
}

export const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

export function readManifest() {
  const file = path.join(ROOT, MANIFEST);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export const VENDOR_VERSION_RE = /const VENDOR_VERSION = '([^']*)';/;
