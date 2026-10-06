#!/usr/bin/env node
/**
 * Pull text and effect styles from the Radiant 3.0 Figma file into
 * scripts/figma-tokens/snapshot/styles.json.
 *
 * Uses the Figma REST API (works on any plan). Variables are pulled
 * separately through the Figma MCP, see README.md.
 *
 * Text styles in Figma all record "Regular" because Geist is a variable
 * font and the 550 weight is set per layer. So the weight for each style
 * is read from the layers on the Typography spec frame that use it.
 *
 * Reads FIGMA_TOKEN from process.env or .env.local at the repo root.
 *
 * Usage: node scripts/figma-tokens/pull-styles.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const RULES = JSON.parse(await fs.readFile(path.join(HERE, 'rules.json'), 'utf8'));
const FILE_KEY = RULES.figma.fileKey;
const SPEC_FRAME = RULES.figma.typographySpecFrame;
const OUT = path.join(HERE, 'snapshot/styles.json');

async function loadEnv() {
  const envFile = path.join(ROOT, '.env.local');
  try {
    const txt = await fs.readFile(envFile, 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    // ignore
  }
  if (!process.env.FIGMA_TOKEN) {
    console.error('FIGMA_TOKEN missing. Add it to .env.local or export it.');
    process.exit(1);
  }
}

async function figmaFetch(url, attempt = 0) {
  const res = await fetch(url, {
    headers: { 'X-Figma-Token': process.env.FIGMA_TOKEN },
  });
  if (res.status === 429 && attempt < 4) {
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    return figmaFetch(url, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`Figma API ${res.status} ${url}\n${await res.text()}`);
  }
  return res.json();
}

const round = (n, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

function hex(c, opacity = 1) {
  const h = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  const a = (c.a ?? 1) * opacity;
  return `#${h(c.r)}${h(c.g)}${h(c.b)}${a < 1 ? h(a) : ''}`;
}

function collectText(node, acc) {
  if (node.type === 'TEXT') acc.push(node);
  for (const child of node.children ?? []) collectText(child, acc);
  return acc;
}

function sortKeys(obj) {
  return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));
}

async function main() {
  await loadEnv();

  const { meta } = await figmaFetch(`https://api.figma.com/v1/files/${FILE_KEY}/styles`);
  const wanted = meta.styles.filter((s) => s.style_type === 'TEXT' || s.style_type === 'EFFECT');
  const ids = [...wanted.map((s) => s.node_id), SPEC_FRAME].join(',');
  const { nodes } = await figmaFetch(
    `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(ids)}`,
  );

  const specTexts = collectText(nodes[SPEC_FRAME].document, []);

  const text = {};
  const effects = {};
  for (const s of wanted) {
    const doc = nodes[s.node_id].document;
    if (s.style_type === 'TEXT') {
      const st = doc.style;
      const users = specTexts.filter((t) => t.styles?.text === s.node_id);
      const weights = [...new Set(users.map((t) => t.style.fontWeight))].sort();
      text[s.name] = {
        key: s.key,
        nodeId: s.node_id,
        description: s.description || '',
        family: st.fontFamily,
        size: st.fontSize,
        lineHeight: st.lineHeightPx,
        letterSpacing: { value: round((st.letterSpacing / st.fontSize) * 100, 2), unit: 'PERCENT' },
        styleWeight: st.fontWeight,
        weight: weights.length === 1 ? weights[0] : weights,
        weightSource: users.length ? `spec layers (${users.length})` : 'style only',
      };
    } else {
      effects[s.name] = {
        key: s.key,
        nodeId: s.node_id,
        description: s.description || '',
        effects: doc.effects.map((e) => ({
          type: e.type,
          x: e.offset?.x ?? 0,
          y: e.offset?.y ?? 0,
          blur: e.radius,
          spread: e.spread ?? 0,
          color: hex(e.color),
        })),
      };
    }
  }

  const specFrameFamilies = [
    ...new Set(collectText(nodes[SPEC_FRAME].document, []).map((t) => t.style.fontFamily)),
  ].sort();

  const out = {
    fileKey: FILE_KEY,
    text: sortKeys(text),
    effects: sortKeys(effects),
    specFrameFamilies,
  };
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(`Wrote ${path.relative(ROOT, OUT)}: ${Object.keys(text).length} text, ${Object.keys(effects).length} effect styles`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
