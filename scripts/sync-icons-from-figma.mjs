#!/usr/bin/env node
/**
 * sync-icons-from-figma.mjs
 *
 * Pulls icon SVGs from the Radiant 3.0 design system Figma file and emits
 * per-size React components into src/components/icons/icons/.
 *
 * Usage:
 *   node scripts/sync-icons-from-figma.mjs --dry-run
 *   node scripts/sync-icons-from-figma.mjs
 *
 * Reads FIGMA_TOKEN from process.env or .env.local at the repo root.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'src/components/icons/icons');
const REPORT_PATH = path.join(ROOT, 'docs/2026-05-07-icon-sync-issues.md');

const FILE_KEY = '1QlRveXx4wppvDXyPVWUTK';
const ICONS_PAGE_NODE_ID = '17651:152';

const SIZE_PIXELS = { xs: 12, s: 14, m: 16, l: 18 };
const SIZE_ORDER = ['xs', 's', 'm', 'l'];

// Hand-drawn icons not present in Figma. Never overwrite these.
const SKIP_OVERWRITE = new Set(['Spotter']);

// Local-only icons (kept manually) that should be exported and registered
// alongside the Figma-sourced set.
const MANUAL_ICONS = [{ base: 'spotter', fileName: 'Spotter' }];

// Aliases that map registry keys to other icons (no separate file needed).
const ALIASES = {
  'search': 'magnifying-glass',
  'settings': 'cog',
  'refresh': 'sync',
};

// Figma layer-name typos → canonical (base, size).
const TYPO_MAP = {
  'chekmark-circle-l': { base: 'checkmark-circle', size: 'l' },
  'question-sark-m': { base: 'question-mark', size: 's' },
  'question-xsark-m': { base: 'question-mark', size: 'xs' },
};

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const issues = [];

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
    const wait = 1000 * 2 ** attempt;
    await new Promise((r) => setTimeout(r, wait));
    return figmaFetch(url, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`Figma API ${res.status} ${url}\n${await res.text()}`);
  }
  return res.json();
}

function normalizeName(rawName) {
  if (!rawName) return null;
  const name = rawName.toLowerCase().replace(/[_\s]+/g, '-');
  if (TYPO_MAP[name]) return TYPO_MAP[name];
  const m = name.match(/^(.+)-(xs|s|m|l)$/);
  if (!m) return null;
  return { base: m[1], size: m[2] };
}

function pascal(kebab) {
  return kebab
    .split('-')
    .map((s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : ''))
    .join('');
}

function collectIconNodes(node, acc) {
  if (!node) return;
  const norm = normalizeName(node.name || '');
  if (norm && node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;
    // Real icons are <= 24x24 in the artboard. Filters out text labels and frames.
    if (width <= 24 && height <= 24) {
      acc.push({ id: node.id, base: norm.base, size: norm.size, raw: node.name });
    }
  }
  for (const child of node.children || []) collectIconNodes(child, acc);
}

async function fetchFileTree() {
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(
    ICONS_PAGE_NODE_ID
  )}&depth=6`;
  return figmaFetch(url);
}

async function fetchSvgUrls(nodeIds) {
  const out = {};
  const chunkSize = 50;
  for (let i = 0; i < nodeIds.length; i += chunkSize) {
    const chunk = nodeIds.slice(i, i + chunkSize);
    const url = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${chunk
      .map(encodeURIComponent)
      .join(',')}&format=svg&svg_outline_text=false&svg_simplify_stroke=false`;
    const data = await figmaFetch(url);
    Object.assign(out, data.images || {});
    console.log(`  Fetched SVG URLs ${Math.min(i + chunkSize, nodeIds.length)}/${nodeIds.length}`);
  }
  return out;
}

async function downloadSvg(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SVG download ${res.status} ${url}`);
  return res.text();
}

function parseSvg(svgText) {
  const m = svgText.match(/<svg([^>]*)>([\s\S]*?)<\/svg>/);
  if (!m) return null;
  const attrs = m[1];
  let inner = m[2].trim();
  const vb = attrs.match(/viewBox="([^"]+)"/);
  const viewBox = vb ? vb[1] : '0 0 18 18';

  // ThoughtSpot icons are monochrome. Replace every hex/named fill or stroke
  // with currentColor so the `color` prop works. Leave fill="none" alone.
  inner = inner.replace(
    /(fill|stroke)="(#[0-9A-Fa-f]{3,8}|black|white)"/g,
    (_match, prop, value) => {
      if (value.toLowerCase() === 'white') return `${prop}="currentColor"`;
      return `${prop}="currentColor"`;
    }
  );

  // Drop xmlns on inner elements (only needed on root <svg>).
  inner = inner.replace(/\s+xmlns="[^"]+"/g, '');

  return { viewBox, inner };
}

function emitComponent(base, sizes /* {xs?, s?, m?, l?: {viewBox, inner}} */) {
  const componentName = `${pascal(base)}Icon`;

  // Fill missing sizes with the closest available, log issue.
  const filled = {};
  for (const sz of SIZE_ORDER) {
    if (sizes[sz]) {
      filled[sz] = sizes[sz];
    } else {
      // Find nearest available size, preferring larger
      const fallback =
        sizes.l || sizes.m || sizes.s || sizes.xs;
      if (!fallback) {
        throw new Error(`No SVGs available for ${base}`);
      }
      filled[sz] = fallback;
      issues.push(`- \`${base}-${sz}\` missing in Figma; using nearest size as fallback.`);
    }
  }

  const pathsBlock = SIZE_ORDER.map((sz) => {
    const escaped = filled[sz].inner
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');
    return `  ${sz}: { viewBox: '${filled[sz].viewBox}', inner: \`${escaped}\` },`;
  }).join('\n');

  return `import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
${pathsBlock}
};

export const ${componentName}: React.FC<BaseIconProps> = ({
  size = 'm',
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}) => {
  const variant = VARIANTS[size];
  return (
    <svg
      width={iconSize[size]}
      height={iconSize[size]}
      viewBox={variant.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      role={ariaLabel ? 'img' : undefined}
      style={{ color }}
      dangerouslySetInnerHTML={{ __html: variant.inner }}
    />
  );
};

export default ${componentName};
`;
}

async function main() {
  await loadEnv();
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'WRITE'}`);
  console.log(`File: ${FILE_KEY}, root node: ${ICONS_PAGE_NODE_ID}`);

  console.log('Fetching Figma file tree...');
  const tree = await fetchFileTree();
  const root = tree.nodes[ICONS_PAGE_NODE_ID]?.document;
  if (!root) throw new Error(`Node ${ICONS_PAGE_NODE_ID} not found in file`);

  const found = [];
  collectIconNodes(root, found);
  console.log(`Found ${found.length} icon nodes.`);

  // Group by base, dedupe (base, size) by keeping first occurrence.
  const grouped = new Map(); // base -> { xs?, s?, m?, l? -> nodeId }
  for (const node of found) {
    if (!grouped.has(node.base)) grouped.set(node.base, {});
    const slot = grouped.get(node.base);
    if (!slot[node.size]) slot[node.size] = node.id;
  }
  console.log(`Distinct icons: ${grouped.size}`);

  // Report missing sizes
  for (const [base, slot] of grouped) {
    const missing = SIZE_ORDER.filter((sz) => !slot[sz]);
    if (missing.length) {
      issues.push(`- \`${base}\` is missing sizes: ${missing.join(', ')}`);
    }
  }

  // Skip Spotter overwrite up front (not in Figma anyway)
  for (const skip of SKIP_OVERWRITE) {
    const baseKebab = skip.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    if (grouped.has(baseKebab)) {
      console.log(`Skipping overwrite of ${skip} (matched in Figma)`);
      grouped.delete(baseKebab);
    }
  }

  if (DRY_RUN) {
    console.log('\nIcons that would be generated:');
    const sorted = [...grouped.keys()].sort();
    for (const base of sorted) {
      const slot = grouped.get(base);
      const sizes = SIZE_ORDER.filter((s) => slot[s]).join(',');
      console.log(`  ${base.padEnd(28)} sizes=${sizes}`);
    }
    console.log(`\nTotal: ${sorted.length} icons.`);
    if (issues.length) {
      console.log(`\nIssues to log:`);
      for (const i of issues) console.log(`  ${i}`);
    }
    return;
  }

  // Collect all unique node IDs we need SVGs for
  const allNodeIds = [];
  for (const slot of grouped.values()) {
    for (const sz of SIZE_ORDER) {
      if (slot[sz]) allNodeIds.push(slot[sz]);
    }
  }
  console.log(`Fetching ${allNodeIds.length} SVG URLs from Figma...`);
  const svgUrlMap = await fetchSvgUrls(allNodeIds);

  console.log('Downloading SVGs and generating components...');
  await fs.mkdir(ICONS_DIR, { recursive: true });
  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });

  const generated = [];
  for (const [base, slot] of grouped) {
    const variants = {};
    for (const sz of SIZE_ORDER) {
      if (!slot[sz]) continue;
      const url = svgUrlMap[slot[sz]];
      if (!url) {
        issues.push(`- \`${base}-${sz}\` has no SVG URL from Figma.`);
        continue;
      }
      const svgText = await downloadSvg(url);
      const parsed = parseSvg(svgText);
      if (!parsed) {
        issues.push(`- \`${base}-${sz}\` SVG could not be parsed.`);
        continue;
      }
      variants[sz] = parsed;
    }
    if (!Object.keys(variants).length) {
      issues.push(`- \`${base}\` had no usable SVGs; skipping.`);
      continue;
    }
    const fileName = `${pascal(base)}.tsx`;
    if (SKIP_OVERWRITE.has(pascal(base))) {
      console.log(`  Skipping ${fileName} (hand-drawn)`);
      continue;
    }
    const code = emitComponent(base, variants);
    await fs.writeFile(path.join(ICONS_DIR, fileName), code, 'utf8');
    generated.push({ base, fileName });
  }
  console.log(`Wrote ${generated.length} icon components to ${path.relative(ROOT, ICONS_DIR)}`);

  // Write issue report
  const reportLines = [
    '# Icon sync issues',
    '',
    `Generated by \`scripts/sync-icons-from-figma.mjs\` on ${new Date().toISOString().slice(0, 10)}.`,
    '',
    `Source: Figma file \`${FILE_KEY}\`, page node \`${ICONS_PAGE_NODE_ID}\`.`,
    '',
    issues.length
      ? '## Issues to flag back to design team\n\n' + issues.join('\n')
      : '## All icons synced cleanly. No issues to flag.',
    '',
    '## Generated icons',
    '',
    ...generated.map((g) => `- \`${g.base}\` → \`src/components/icons/icons/${g.fileName}\``),
    '',
  ];
  await fs.writeFile(REPORT_PATH, reportLines.join('\n'), 'utf8');
  console.log(`Wrote report to ${path.relative(ROOT, REPORT_PATH)}`);

  // Emit barrel export and registry from the generated set + manual icons + aliases.
  const allIcons = [
    ...generated.map((g) => ({ base: g.base, fileName: g.fileName.replace(/\.tsx$/, '') })),
    ...MANUAL_ICONS,
  ].sort((a, b) => a.base.localeCompare(b.base));

  const barrel = [
    '/**',
    ' * Icon Components Barrel Export',
    ' *',
    ' * Auto-generated by scripts/sync-icons-from-figma.mjs.',
    ' * Do not edit by hand. Run `npm run sync-icons` to regenerate.',
    ' */',
    '',
    ...allIcons.map(
      (i) => `export { ${pascal(i.base)}Icon } from './${i.fileName}';`
    ),
    '',
  ].join('\n');
  await fs.writeFile(path.join(ICONS_DIR, 'index.ts'), barrel, 'utf8');
  console.log(`Wrote barrel export with ${allIcons.length} icons.`);

  const registryEntries = allIcons
    .map((i) => `  '${i.base}': ${pascal(i.base)}Icon,`)
    .join('\n');
  const aliasEntries = Object.entries(ALIASES)
    .map(([alias, target]) => `  '${alias}': ${pascal(target)}Icon,`)
    .join('\n');
  const importNames = allIcons.map((i) => `${pascal(i.base)}Icon`).join(',\n  ');

  const registry = `/**
 * Icon Registry
 *
 * Auto-generated by scripts/sync-icons-from-figma.mjs.
 * Do not edit by hand. Run \`npm run sync-icons\` to regenerate.
 */

import { IconComponent } from './Icon.types';

import {
  ${importNames},
} from './icons';

export const iconRegistry = {
${registryEntries}

  // Aliases (map alternate keys to existing components)
${aliasEntries}
} satisfies Record<string, IconComponent>;

export const getRegisteredIconNames = (): string[] => Object.keys(iconRegistry);

export const isIconRegistered = (name: string): boolean => name in iconRegistry;

export default iconRegistry;
`;
  await fs.writeFile(path.join(ROOT, 'src/components/icons/registry.ts'), registry, 'utf8');
  console.log(`Wrote registry with ${allIcons.length} icons + ${Object.keys(ALIASES).length} aliases.`);

  console.log('\nNext steps:');
  console.log('  1. Review docs/2026-05-07-icon-sync-issues.md');
  console.log('  2. Run npm run build:strict');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
