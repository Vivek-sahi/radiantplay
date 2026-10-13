# Prototype thumbnails

The gallery shows each prototype as a small screenshot, in light and dark. The order it picks from:

1. Captured screenshots: `src/prototypes/<Name>/thumbnail.light.jpg` and `thumbnail.dark.jpg`, set as `thumbnail: { light, dark }` in the registry.
2. A hand-made SVG imported with `?raw`, using theme tokens so it follows light and dark.
3. A single image URL.
4. Nothing: a live preview of the prototype, scaled down. At most four load at once, only while the card is on screen.

## Capture

Designers get them without asking: `/rp-radiant-check` captures a prototype's thumbnail after a check, `/rp-sync-upstream` captures missing ones, and "update my thumbnail" works too (the `rp-prototype-thumbnails` skill). It handles the setup question, captures, and wires the files into `registry-mine.ts`.

By hand:

```bash
npm run thumbnails:setup                 # once per machine: Playwright and Chromium, about 150 MB, outside the project
npm run thumbnails -- MyPrototype        # capture one or more prototypes
npm run thumbnails -- --all              # every registered prototype
npm run thumbnails:check                 # which thumbnails are missing or older than their prototype (no browser)
```

`capture.mjs` starts its own Vite dev server unless you pass `--base http://localhost:5173`. It blocks `/api/*` and external requests, so AI prototypes show their starting state, freezes animations, and captures at 1280x720 scaled to 640x360 JPEG (about 15 to 30 KB each). It switches to dark with Ctrl+D through the theme controller, so charts redraw. Files are only rewritten when the image changed, and prototypes marked `theme: 'light-only'` get a light image only.

Environment: `VISUAL_DEPS` points at another Playwright install (default `~/.radiantplay-visual`, shared with `scripts/visual-snapshots`). `PLAYWRIGHT_CHROMIUM_PATH` uses a Chromium you already have.

## Hand-made SVGs

`tokenize-svg.mjs` converts an SVG's colours to theme tokens so it follows light and dark:

```bash
node scripts/thumbnails/tokenize-svg.mjs src/prototypes/thumbnails/MyPrototype.svg
```

Screenshots are preferred; they stay accurate as the prototype changes.

## Why no git hook

Designer forks don't install hooks, and a hook would also run during Coolify installs. So capture runs as part of other work: after a `/rp-radiant-check`, after a `/rp-sync-upstream`, inside `/rp-migrate-prototype`, or when a designer asks. All of them follow `.claude/skills/rp-prototype-thumbnails/SKILL.md`.
