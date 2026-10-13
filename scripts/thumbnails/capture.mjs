#!/usr/bin/env node
/**
 * Captures gallery thumbnails from the running prototypes: one light and one
 * dark screenshot per prototype, 640x360 JPEG, saved next to the prototype as
 * src/prototypes/<Name>/thumbnail.light.jpg and thumbnail.dark.jpg.
 *
 * Usage:
 *   npm run thumbnails -- <Name> [<Name> ...]     capture these prototypes
 *   npm run thumbnails -- --all                   every registered prototype
 *   npm run thumbnails -- <Name> --base http://localhost:5173   use a running server
 *   npm run thumbnails -- <Name> --json           end with a JSON summary, one row per prototype
 *   npm run thumbnails -- <Name> --wait 3000      settle 3s before each shot (default 800ms),
 *                                                 for screens that reload an iframe on a theme switch
 *
 * Without --base it starts its own Vite dev server and stops it afterwards.
 * Playwright lives outside package.json: run `npm run thumbnails:setup` once.
 * The capture blocks /api/* and external requests, so AI prototypes show their
 * starting state. A file is only rewritten when its pixels changed.
 * --all skips prototypes in the archived section; an archived prototype named
 * explicitly is captured.
 *
 * Dark check: when the dark shot comes out the same as the light one (byte for byte,
 * or the same size within 1% with every sampled byte equal), the prototype isn't
 * following the theme, whatever the scan says. It prints a warning and exits with
 * code 2 at the end (1 when a capture failed). With --json, sameAsLight is true for it.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const DEPS = process.env.VISUAL_DEPS || path.join(os.homedir(), '.radiantplay-visual');

let chromium;
try {
  ({ chromium } = createRequire(path.join(DEPS, 'noop.js'))('playwright'));
} catch {
  console.log('Thumbnails need Playwright, which is not installed yet. Run once: npm run thumbnails:setup');
  console.log('Until then the gallery shows a live preview for prototypes without a thumbnail.');
  process.exit(0);
}

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const value = (name) => { const i = argv.indexOf(`--${name}`); return i > -1 ? argv[i + 1] : null; };
const names = argv.filter((a, i) => !a.startsWith('--') && !['--base', '--wait'].includes(argv[i - 1]));
const SETTLE_MS = Number(value('wait')) || 800;

// Registered prototypes, their light-only flag and whether they are archived, read from the registry source
function registered() {
  const out = {};
  for (const file of ['src/prototypes/registry-core.ts', 'src/prototypes/registry-mine.ts']) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, 'utf8');
    for (const m of src.matchAll(/\{\s*id:\s*'([^']+)'([\s\S]*?)\n\s*\}/g)) {
      // A designer prototype with no theme line stays light (26.10.1b); samples follow the theme unless flagged
      const lightOnly = /theme:\s*'light-only'/.test(m[2]) || (file.endsWith('registry-mine.ts') && !/theme:\s*'global'/.test(m[2]));
      out[m[1]] = { lightOnly, archived: /section:\s*'archived'/.test(m[2]) };
    }
  }
  return out;
}

/** Same image? Byte for byte, or the same size within 1% with every sampled byte equal. */
function looksSame(a, b) {
  if (Buffer.compare(a, b) === 0) return true;
  if (Math.abs(a.length - b.length) > Math.max(a.length, b.length) * 0.01) return false;
  const n = Math.min(a.length, b.length);
  // Skip the JPEG header, then sample 256 bytes spread across the image data
  const from = Math.min(1024, Math.floor(n / 4));
  for (let i = 0; i < 256; i++) {
    const at = from + Math.floor(((n - from - 1) * i) / 255);
    if (a[at] !== b[at]) return false;
  }
  return true;
}

const all = registered();
// --all leaves archived prototypes out; one named explicitly is captured
const targets = flag('all') ? Object.keys(all).filter((n) => !all[n].archived) : names;
if (!targets.length) {
  console.log('Name the prototypes to capture, or pass --all. Registered: ' + Object.keys(all).filter((n) => !all[n].archived).join(', '));
  process.exit(1);
}
const unknown = targets.filter((n) => !all[n]);
if (unknown.length) {
  console.log(`Not in the registry: ${unknown.join(', ')}`);
  process.exit(1);
}

const freePort = () => new Promise((resolve) => {
  const srv = net.createServer().listen(0, () => { const { port } = srv.address(); srv.close(() => resolve(port)); });
});

async function startServer() {
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), '--port', String(port), '--strictPort'], {
    cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base)).ok) return { base, stop: () => child.kill() }; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill();
  throw new Error('The Vite dev server did not start');
}

const FREEZE = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}';

async function capture(browser, base, name, { lightOnly }) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 0.5 });
  await context.addInitScript(() => { try { localStorage.setItem('rp-theme-mode', 'light'); } catch {} });
  const page = await context.newPage();
  const origin = new URL(base).origin;
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin && !url.protocol.startsWith('data')) return route.abort();
    if (url.pathname.startsWith('/api/')) return route.abort();
    return route.continue();
  });
  await page.goto(`${base}/playground/${name}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.addStyleTag({ content: FREEZE });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(SETTLE_MS);

  const dir = path.join(ROOT, 'src/prototypes', name);
  const results = [];
  const shots = {};
  const shoot = async (theme) => {
    const file = path.join(dir, `thumbnail.${theme}.jpg`);
    const buf = await page.screenshot({ type: 'jpeg', quality: 80 });
    shots[theme] = buf;
    const same = fs.existsSync(file) && Buffer.compare(fs.readFileSync(file), buf) === 0;
    if (!same) fs.writeFileSync(file, buf);
    results.push(`${theme} ${same ? 'unchanged' : `${Math.round(buf.length / 1024)} KB`}`);
  };
  await shoot('light');
  if (!lightOnly) {
    // Switch through the theme controller (Ctrl+D), so charts redraw for dark too
    await page.keyboard.press('Control+d');
    await page.waitForTimeout(SETTLE_MS);
    await shoot('dark');
  }
  await context.close();
  // A dark shot that matches the light one means the screen ignored the theme switch
  const sameAsLight = !!shots.dark && looksSame(shots.light, shots.dark);
  return { text: results.join(', '), sameAsLight, lightOnly };
}

const { base, stop } = value('base') ? { base: value('base'), stop: () => {} } : await startServer();
const launchOpts = process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {};
const browser = await chromium.launch(launchOpts);
let failed = 0;
const sameAsLight = [];
const summary = [];
try {
  for (const name of targets) {
    try {
      const r = await capture(browser, base, name, all[name]);
      console.log(`${name}: ${r.text}`);
      if (r.sameAsLight) {
        sameAsLight.push(name);
        console.log(`Warning: ${name}: dark looks the same as light; it isn't following the theme`);
      }
      summary.push({ name, result: r.text, lightOnly: r.lightOnly, sameAsLight: r.sameAsLight });
    } catch (e) {
      failed++;
      console.log(`${name}: failed, ${e.message.split('\n')[0]}`);
      summary.push({ name, error: e.message.split('\n')[0] });
    }
  }
} finally {
  await browser.close();
  stop();
}
if (sameAsLight.length) {
  console.log(`\nNot dark ready: ${sameAsLight.join(', ')}. The dark thumbnail matches the light one. Likely causes: code imported from another prototype, a page in an iframe, or a light-only wrapper still set.`);
}
if (flag('json')) console.log(JSON.stringify({ captured: summary, sameAsLight, failed }, null, 2));
if (failed) process.exit(1);
if (sameAsLight.length) process.exit(2);
