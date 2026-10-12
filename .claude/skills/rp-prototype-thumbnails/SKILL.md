---
name: rp-prototype-thumbnails
description: Capture or refresh a prototype's gallery thumbnails (light and dark screenshots, 640x360) and wire them into registry-mine.ts. Load when a designer asks to capture, update or refresh a thumbnail or screenshot for the gallery, and when /rp-radiant-check, /rp-sync-upstream or /rp-migrate-prototype reach their thumbnail step. Covers the one-time screenshot tool setup question (asked once per machine, remembered), capture, checking each image, and registry wiring. Never commits.
---

# Capture prototype thumbnails

The gallery shows a real screenshot for each prototype, in light and dark. Without one it falls back to a live preview, which works but is heavier. There is no thumbnail command: /rp-radiant-check refreshes a prototype's thumbnail after a check, /rp-sync-upstream captures missing ones after a sync, /rp-migrate-prototype captures them as part of its light and dark check, and a designer can simply ask ("update my thumbnail"). Each of them follows the steps below.

## 1. Pick the prototypes

- If the designer or the calling command named prototypes, use those (ids as in `registry-mine.ts` or `registry-core.ts`).
- Otherwise run `npm run thumbnails:check -- --mine` and use the prototypes it lists. If it says everything is up to date, tell the designer and stop.
- On a fork, only capture prototypes from `registry-mine.ts`. Core prototypes get their thumbnails from upstream.

## 2. Make sure the screenshot tools are installed (once per machine)

Check whether `~/.radiantplay-visual/.thumbnails-enabled` exists.

- If it exists, go to step 3.
- If `~/.radiantplay-visual/.thumbnails-declined` exists, the designer said no before. Tell them the gallery keeps showing live previews, and that they can say "set up thumbnails" any time. Stop.
- Otherwise ask once: "Thumbnails need a one-time download of a screenshot tool (Playwright and Chromium, about 150 MB, installed outside the project). Set it up now? (yes / no)"
  - Yes: run `npm run thumbnails:setup`. If the download fails (company networks sometimes block it), say so plainly, mention the live preview keeps working, and stop. Don't try other mirrors or workarounds.
  - No: create `~/.radiantplay-visual/.thumbnails-declined` (make the folder if needed) and stop.

## 3. Capture

Run `npm run thumbnails -- <Name> [<Name> ...]`. It starts its own dev server, captures each prototype in light and dark at 640x360, and writes `src/prototypes/<Name>/thumbnail.light.jpg` and `thumbnail.dark.jpg`. Unchanged images are left alone. Prototypes marked `theme: 'light-only'` get a light image only.

Look at each new image (read the file) and check it shows the prototype's main screen, not an error or an empty loading state. If it's wrong, say what you see and don't wire it up.

## 4. Wire it into the registry

For each prototype whose entry doesn't use the screenshots yet, edit its registry entry (`registry-mine.ts` for designer prototypes; never `registry-core.ts` on a fork):

```ts
import <Name>ThumbLight from './<Name>/thumbnail.light.jpg';
import <Name>ThumbDark from './<Name>/thumbnail.dark.jpg';
// ...
  {
    id: '<Name>',
    // ...
    thumbnail: { light: <Name>ThumbLight, dark: <Name>ThumbDark },
  },
```

Remove the old thumbnail import for that entry if there was one. For a light-only prototype use `{ light: <Name>ThumbLight }`.

Run `npm run typecheck`.

## 5. Report

List the prototypes captured, their file sizes, and anything that looked wrong. Don't commit; say the images are ready to commit with the prototype.
