#!/usr/bin/env node
/**
 * Makes a prototype thumbnail SVG follow the light/dark theme.
 *
 * Rewrites neutral and brand colours in fill, stroke and stop-color to theme
 * tokens, written as style="fill: var(--rd-sys-color-*)" because SVG
 * presentation attributes can't take var(). Accent colours (chart series and
 * the like) stay as they are: they read on both themes.
 *
 * The gallery inlines the SVG markup, so the tokens resolve against the page.
 *
 * Usage:
 *   node scripts/thumbnails/tokenize-svg.mjs src/prototypes/thumbnails/*.svg
 *   node scripts/thumbnails/tokenize-svg.mjs --check src/prototypes/thumbnails/*.svg
 *
 * --check lists colours that aren't mapped and changes nothing.
 */

import fs from 'node:fs';

const v = (token) => `var(--rd-sys-color-${token})`;
const mix = (token, pct, base = 'background-base') => `color-mix(in srgb, ${v(token)} ${pct}%, ${v(base)})`;

// Colour → token, separately for fills and strokes. Keys are lowercase.
const FILL = {
  'white': v('background-base'), '#fff': v('background-base'), '#ffffff': v('background-base'),
  '#f6f8fa': v('background-sunken'), '#f8f9fb': v('background-sunken'), '#f0f2f5': v('background-sunken'),
  '#eaedf2': v('background-secondary-action'), '#e5e7eb': v('background-secondary-action'), '#e8ebf0': v('background-secondary-action'),
  '#c0c6cf': v('background-inset'),
  '#a5acb9': v('content-tertiary'), '#9ca3af': v('content-tertiary'),
  '#777e8b': v('content-secondary'), '#64748b': v('content-secondary'), '#6b7280': v('content-secondary'), '#4a515e': v('content-secondary'),
  '#1d232f': v('content-primary'), '#374151': v('content-primary'), '#252b36': v('content-primary'), '#3b4252': v('content-primary'),
  '#2770ef': v('content-brand'), '#4f46e5': v('content-brand'),
  '#8aaee8': mix('content-brand', 55),
  '#eef2ff': v('background-information'), '#f0f4ff': v('background-information'), '#eaf1fc': v('background-information'), '#dee8fa': v('background-information'),
  'rgba(39,112,239,0.1)': v('background-ghost-highlight'), 'rgba(39,112,239,0.08)': v('background-ghost-highlight'),
  '#f0ebff': v('background-accent-purple-subtle'),
};
const STROKE = {
  ...FILL,
  'white': v('border-gap'), '#fff': v('border-gap'), '#ffffff': v('border-gap'),
  '#f6f8fa': v('border-subtle'), '#eaedf2': v('border-subtle'), '#e5e7eb': v('border-subtle'), '#e8ebf0': v('border-subtle'),
  '#c0c6cf': v('border-bold'), '#a5acb9': v('border-bold'),
  '#2770ef': v('border-brand'),
};
// Accents kept as data: chart series and status colours read on both themes.
const KEEP = new Set(['none', 'transparent', '#06bf7f', '#e22b3d', '#fcc838', '#72c9a8', '#e08a92', '#b09aef', '#818cf8', '#a855f7', '#ec8866', '#f5c87a',
  'rgba(224,138,146,0.15)', 'rgba(114,201,168,0.15)']);

const norm = (c) => c.trim().toLowerCase().replace(/\s+/g, '');

const args = process.argv.slice(2);
const check = args.includes('--check');
const files = args.filter((a) => a !== '--check');
if (!files.length) {
  console.error('Usage: node scripts/thumbnails/tokenize-svg.mjs [--check] <file.svg ...>');
  process.exit(1);
}

let unmapped = 0;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const missing = new Set();
  // Rewrite each element's colour attributes into its style attribute
  const out = src.replace(/<([a-zA-Z]+)(\s[^>]*?)?(\/?)>/g, (tag, name, attrs = '', selfClose) => {
    if (!attrs) return tag;
    const styles = [];
    let rest = attrs.replace(/\s(fill|stroke|stop-color)="([^"]+)"/g, (m, prop, value) => {
      const key = norm(value);
      if (key.startsWith('var(') || KEEP.has(key) || key.startsWith('url(')) return m;
      const token = (prop === 'stroke' ? STROKE : FILL)[key];
      if (!token) { missing.add(`${prop} ${value}`); return m; }
      styles.push(`${prop}: ${token}`);
      return '';
    });
    if (!styles.length) return tag;
    if (/\sstyle="/.test(rest)) rest = rest.replace(/\sstyle="([^"]*)"/, (m, s) => ` style="${s.replace(/;?\s*$/, '; ')}${styles.join('; ')}"`);
    else rest += ` style="${styles.join('; ')}"`;
    return `<${name}${rest}${selfClose}>`;
  });
  if (missing.size) {
    unmapped += missing.size;
    console.log(`${file}: unmapped ${[...missing].join(', ')}`);
  }
  if (!check && out !== src) {
    fs.writeFileSync(file, out);
    console.log(`${file}: tokenized`);
  }
}
if (check) console.log(unmapped ? `\n${unmapped} unmapped colours` : 'All colours mapped or kept');
