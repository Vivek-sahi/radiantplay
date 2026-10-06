#!/usr/bin/env node
/**
 * Screenshot every static page and sample prototype of a running Radiant Play
 * build, in light and/or dark theme.
 *
 * Routes come from src/App.tsx (static paths only) and the 'sample' entries in
 * src/prototypes/registry-core.ts, so the list stays current.
 *
 * Playwright is not a project dependency. Install it anywhere and point
 * VISUAL_DEPS at that folder (see README.md).
 *
 * Usage:
 *   VISUAL_DEPS=/path/to/deps node scripts/visual-snapshots/snapshot.mjs \
 *     --base http://localhost:4801 --out /tmp/shots/after --theme both
 *
 * Options: --width 1024 (viewport), --sections sample,archived (which registry
 * entries), --only <text> (route filter), --inject-css '<css>' (e.g. load a
 * font into a before build). Each page also gets an audit in report.json:
 * clipped text, fonts and weights actually rendered, console errors, failed
 * requests.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const req = createRequire(path.join(process.env.VISUAL_DEPS ?? ROOT, 'noop.js'));
const { chromium } = req('playwright');

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const BASE = arg('base', 'http://localhost:4173');
const OUT = path.resolve(arg('out', 'visual-snapshots'));
const THEMES = arg('theme', 'light') === 'both' ? ['light', 'dark'] : [arg('theme', 'light')];
const ONLY = arg('only', null);
const WIDTH = Number(arg('width', 1440));
const INJECT_CSS = arg('inject-css', null);
const SECTIONS = (arg('sections', 'sample')).split(',');
const MAX_HEIGHT = 4000;

async function routes() {
  const app = await fs.readFile(path.join(ROOT, 'src/App.tsx'), 'utf8');
  const paths = [...app.matchAll(/<Route\s+path="([^"]+)"\s+element=\{(<[A-Za-z]+)/g)]
    .filter(([, p, el]) => !p.includes(':') && p !== '*' && el !== '<Navigate')
    .map(([, p]) => p);
  const reg = await fs.readFile(path.join(ROOT, 'src/prototypes/registry-core.ts'), 'utf8');
  const samples = [...reg.matchAll(/id:\s*'([^']+)'[\s\S]*?section:\s*'(\w+)'/g)]
    .filter(([, , section]) => SECTIONS.includes(section))
    .map(([, id]) => `/playground/${id}`);
  const all = [...new Set([...paths, ...samples])];
  return ONLY ? all.filter((r) => r.includes(ONLY)) : all;
}

const fileFor = (route) => (route === '/' ? 'root' : route.replace(/^\//, '').replace(/[/]/g, '__')) + '.png';

// In-page audit: text that is clipped, fonts actually used, weights, and tokens.
function audit() {
  const out = { clipped: [], families: {}, weights: {}, textNodes: 0 };
  const els = document.querySelectorAll('body *');
  for (const el of els) {
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || !el.offsetWidth) continue;
    out.textNodes++;
    const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    out.families[fam] = (out.families[fam] || 0) + 1;
    out.weights[cs.fontWeight] = (out.weights[cs.fontWeight] || 0) + 1;
    const clipsX = el.scrollWidth > el.clientWidth + 1 && /hidden|clip/.test(cs.overflowX + cs.overflow);
    const clipsY = el.scrollHeight > el.clientHeight + 1 && /hidden|clip/.test(cs.overflowY + cs.overflow) && cs.webkitLineClamp === 'none';
    if ((clipsX && cs.textOverflow !== 'ellipsis') || clipsY) {
      out.clipped.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}: "${el.textContent.trim().slice(0, 40)}"`);
    }
  }
  const root = getComputedStyle(document.documentElement);
  out.tokens = ['--font-family-primary', '--font-weight-emphasis', '--font-weight-semibold', '--font-weight-light', '--letter-spacing-relaxed']
    .map((t) => `${t}: ${root.getPropertyValue(t).trim()}`);
  out.clipped = out.clipped.slice(0, 25);
  return out;
}

const FREEZE = `*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}`;

async function main() {
  const list = await routes();
  const browser = await chromium.launch();
  const report = [];
  for (const theme of THEMES) {
    const dir = path.join(OUT, theme);
    await fs.mkdir(dir, { recursive: true });
    const context = await browser.newContext({ viewport: { width: WIDTH, height: 900 }, deviceScaleFactor: 1 });
    for (const route of list) {
      const page = await context.newPage();
      const errors = [];
      const consoleErrors = [];
      const failed = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 200)));
      page.on('requestfailed', (r) => failed.push(r.url()));
      page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
      try {
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
        await page.addStyleTag({ content: FREEZE + (INJECT_CSS ?? '') });
        if (theme === 'dark') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(400);
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        const fonts = await page.evaluate(() =>
          [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`),
        );
        const audited = await page.evaluate(audit);
        await page.screenshot({
          path: path.join(dir, fileFor(route)),
          clip: { x: 0, y: 0, width: WIDTH, height: Math.min(Math.max(height, 900), MAX_HEIGHT) },
          fullPage: true,
        });
        report.push({ theme, route, file: fileFor(route), height, fonts, errors, consoleErrors, failed, audit: audited });
        process.stdout.write('.');
      } catch (e) {
        report.push({ theme, route, file: null, error: e.message.split('\n')[0], errors });
        process.stdout.write('x');
      }
      await page.close();
    }
    await context.close();
  }
  await browser.close();
  await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  const failed = report.filter((r) => !r.file);
  console.log(`\n${report.length - failed.length} screenshots, ${failed.length} failed -> ${OUT}`);
  for (const f of failed) console.log(`  failed ${f.theme} ${f.route}: ${f.error}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
