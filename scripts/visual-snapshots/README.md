# Visual snapshots

Screenshot every page of a Radiant Play build and compare two builds side by side. Used to check the Figma token and font sync (Phase 4 of `docs/2026-10-06-figma-token-sync-plan.md`), and meant for the dark mode rollout's light and dark comparisons.

Playwright is not a project dependency, so `package.json` and the lockfile stay untouched. Install the tools once, anywhere:

```bash
mkdir -p ~/.radiantplay-visual && cd ~/.radiantplay-visual
npm init -y && npm i playwright pixelmatch@6 pngjs@7
npx playwright install chromium
export VISUAL_DEPS=~/.radiantplay-visual
```

## Run

1. Build and serve the two versions on different ports, for example `main` in a separate worktree and your branch here:

   ```bash
   npm run build && npx vite preview --outDir dist --port 4802 --strictPort
   ```

2. Screenshot each one. `--theme` is `light`, `dark` or `both`. Dark saves `rp-theme-mode` before each page loads, so the theme controller applies it; for builds older than the controller it sets `data-theme="dark"` after load.

   ```bash
   node scripts/visual-snapshots/snapshot.mjs --base http://localhost:4801 --out /tmp/shots/before --theme light
   node scripts/visual-snapshots/snapshot.mjs --base http://localhost:4802 --out /tmp/shots/after --theme both
   ```

   Other options:
   - `--width 1024` for a narrower viewport
   - `--sections sample,archived` to include archived prototypes
   - `--only <text>` to limit the run to routes containing that text
   - `--inject-css '<css>'` to add CSS before the screenshot, for example `@font-face` rules that load a font into a before build

   Each run also writes an audit per page to `report.json`: clipped text, the fonts and weights actually rendered, console errors and failed requests. It also lists light surfaces (large backgrounds with high luminance) per page; in a dark run these are usually leftovers that don't follow the theme, and the run ends with a count per page.

3. Compare and open the review page. Pages are sorted by the share of pixels that changed, with before, after and a diff image for each.

   ```bash
   node scripts/visual-snapshots/compare.mjs --before /tmp/shots/before --after /tmp/shots/after \
     --theme light --gallery /tmp/shots/after --gallery-theme dark --out /tmp/shots/review
   open /tmp/shots/review/index.html
   ```

Routes come from `src/App.tsx` (static paths) and the sample prototypes in `src/prototypes/registry-core.ts`, so new pages are picked up automatically. Animations and transitions are frozen, and fonts are awaited before each screenshot.
