#!/usr/bin/env node
/**
 * Compare two snapshot runs (before / after) and write an HTML review page,
 * pages sorted by how much changed. Also lists a third run (e.g. dark) as a
 * gallery if given.
 *
 * Usage:
 *   VISUAL_DEPS=/path/to/deps node scripts/visual-snapshots/compare.mjs \
 *     --before /tmp/shots/before --after /tmp/shots/after --theme light \
 *     [--gallery /tmp/shots/after --gallery-theme dark] --out /tmp/shots/review
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const req = createRequire(path.join(process.env.VISUAL_DEPS ?? process.cwd(), 'noop.js'));
const { PNG } = req('pngjs');
const pixelmatch = (await import(pathToFileURL(req.resolve('pixelmatch')).href)).default;

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const BEFORE = path.resolve(arg('before'));
const AFTER = path.resolve(arg('after'));
const THEME = arg('theme', 'light');
const GALLERY = arg('gallery', null);
const GALLERY_THEME = arg('gallery-theme', 'dark');
const OUT = path.resolve(arg('out', 'visual-review'));

async function readPng(p) {
  try {
    return PNG.sync.read(await fs.readFile(p));
  } catch {
    return null;
  }
}

function padTo(png, w, h) {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  out.data.fill(255);
  PNG.bitblt(png, out, 0, 0, Math.min(png.width, w), Math.min(png.height, h), 0, 0);
  return out;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function main() {
  await fs.mkdir(path.join(OUT, 'img'), { recursive: true });
  const afterReport = JSON.parse(await fs.readFile(path.join(AFTER, 'report.json'), 'utf8'));
  const beforeReport = JSON.parse(await fs.readFile(path.join(BEFORE, 'report.json'), 'utf8'));
  const rows = [];
  for (const r of afterReport.filter((x) => x.theme === THEME)) {
    const b = beforeReport.find((x) => x.theme === THEME && x.route === r.route);
    const row = { route: r.route, errors: r.errors ?? [], fonts: r.fonts ?? [], heightBefore: b?.height, heightAfter: r.height };
    if (!r.file || !b?.file) {
      rows.push({ ...row, diff: 100, note: `missing ${!r.file ? 'after' : 'before'}: ${r.error ?? b?.error ?? ''}` });
      continue;
    }
    const pb = await readPng(path.join(BEFORE, THEME, b.file));
    const pa = await readPng(path.join(AFTER, THEME, r.file));
    const w = Math.max(pb.width, pa.width);
    const h = Math.max(pb.height, pa.height);
    const A = padTo(pb, w, h);
    const B = padTo(pa, w, h);
    const diffPng = new PNG({ width: w, height: h });
    const changed = pixelmatch(A.data, B.data, diffPng.data, w, h, { threshold: 0.1, alpha: 0.25 });
    const base = r.file.replace(/\.png$/, '');
    await fs.copyFile(path.join(BEFORE, THEME, b.file), path.join(OUT, 'img', `${base}.before.png`));
    await fs.copyFile(path.join(AFTER, THEME, r.file), path.join(OUT, 'img', `${base}.after.png`));
    await fs.writeFile(path.join(OUT, 'img', `${base}.diff.png`), PNG.sync.write(diffPng));
    rows.push({ ...row, base, diff: Math.round((changed / (w * h)) * 10000) / 100 });
  }
  rows.sort((a, b) => b.diff - a.diff);

  let gallery = [];
  if (GALLERY) {
    const g = JSON.parse(await fs.readFile(path.join(GALLERY, 'report.json'), 'utf8')).filter((x) => x.theme === GALLERY_THEME && x.file);
    for (const r of g) {
      const name = r.file.replace(/\.png$/, `.${GALLERY_THEME}.png`);
      await fs.copyFile(path.join(GALLERY, GALLERY_THEME, r.file), path.join(OUT, 'img', name));
      gallery.push({ route: r.route, img: `img/${name}` });
    }
  }

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Visual review</title>
<style>
body{font:14px/1.4 system-ui,sans-serif;margin:24px;color:#1d232f;background:#f6f8fa}
h1{font-size:20px;margin:0 0 4px} h2{font-size:16px;margin:32px 0 8px}
.row{background:#fff;border:1px solid #eaedf2;border-radius:8px;margin:12px 0;padding:12px}
.meta{display:flex;gap:16px;align-items:baseline;flex-wrap:wrap;margin-bottom:8px}
.pct{font-weight:600} .hi{color:#e22b3d} .mid{color:#bf982a} .lo{color:#06bf7f}
.imgs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.imgs a{display:block;max-height:420px;overflow:hidden;border:1px solid #eaedf2}
.imgs img{width:100%;display:block}
.cap{font-size:12px;color:#777e8b;margin-bottom:2px}
.err{color:#e22b3d;font-size:12px}
.gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.gal a{display:block;max-height:220px;overflow:hidden;border:1px solid #eaedf2;background:#fff}
.gal img{width:100%;display:block}
</style></head><body>
<h1>Visual review: ${esc(THEME)}, before vs after</h1>
<p>${rows.length} pages, sorted by share of pixels changed. Click an image to open it full size.</p>
${rows
  .map((r) => {
    const cls = r.diff >= 20 ? 'hi' : r.diff >= 5 ? 'mid' : 'lo';
    const h = r.heightBefore !== r.heightAfter ? ` · height ${r.heightBefore} → ${r.heightAfter}` : '';
    return `<div class="row"><div class="meta"><strong>${esc(r.route)}</strong><span class="pct ${cls}">${r.diff}% changed</span><span>${esc(h)}</span>${r.note ? `<span class="err">${esc(r.note)}</span>` : ''}</div>
${r.errors.length ? `<div class="err">Page errors: ${esc(r.errors.slice(0, 3).join(' | '))}</div>` : ''}
${r.base ? `<div class="imgs">${['before', 'after', 'diff'].map((k) => `<div><div class="cap">${k}</div><a href="img/${r.base}.${k}.png" target="_blank"><img loading="lazy" src="img/${r.base}.${k}.png"></a></div>`).join('')}</div>` : ''}</div>`;
  })
  .join('\n')}
${gallery.length ? `<h2>${esc(GALLERY_THEME)} theme (baseline, after)</h2><div class="gal">${gallery.map((g) => `<div><div class="cap">${esc(g.route)}</div><a href="${g.img}" target="_blank"><img loading="lazy" src="${g.img}"></a></div>`).join('')}</div>` : ''}
</body></html>`;
  await fs.writeFile(path.join(OUT, 'index.html'), html);
  await fs.writeFile(path.join(OUT, 'summary.json'), JSON.stringify(rows.map(({ route, diff, heightBefore, heightAfter, note, errors }) => ({ route, diff, heightBefore, heightAfter, note, errors: errors.length })), null, 2));
  console.log(`Wrote ${path.join(OUT, 'index.html')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
