---
description: Move your prototypes onto the Geist font and dark mode in one pass. Pass a prototype name, or nothing to include every prototype in registry-mine.ts. Never commits.
---

# Migrate prototypes to Geist and dark mode

Migrate: $ARGUMENTS

This command moves the designer's own prototypes (the ones in `src/prototypes/registry-mine.ts`) onto the Geist font tokens and the colour tokens that follow light and dark mode. It works on every prototype in one pass, because the same colours and the same decisions repeat across prototypes. Naming one (`/rp-migrate-prototype DataApps`) runs the same flow on a list of one.

Spec: `docs/2026-10-07-prototype-migration-plan.md`, section 4.2 (if the file isn't in this fork, this command is the full spec).

## How to talk to the designer

- Designers are not engineers. Don't make them know git, file paths or token names to answer a question. Say "the grey used for secondary text", then show the token in brackets for the record.
- Short sentences, sentence case, active voice. No em dashes.
- Every question has a recommended answer they can accept in one word.
- Report progress at each step in one line ("Scanning done. 3 prototypes, about an hour of work in total.").

## Hard rules

- **Never commit, push, stash or switch branches.** The command runs in place on the current branch. It stops for review at the end.
- **Leave `vendor/` folders alone by default.** That code came from outside the repo. Don't edit it and don't raise it. A prototype whose remaining findings are in `vendor/` stays light-only, and the report says so. The one exception: the designer asks for `vendor/` to be migrated too (see step 2). Then the codemod runs with `--include-vendor`.
- Never edit `src/components`, `src/spotter`, `src/tokens`, `src/styles/tokens.css`, `registry-core.ts` or `registry.ts`. Only the picked prototypes' folders, `registry-mine.ts` and `scripts/radiant-check/rules-mine.json` change.
- The theme line in `registry-mine.ts` (`theme: 'light-only'` or `theme: 'global'`) is set by `scripts/radiant-check/light-only.mjs`, never by hand. Since 26.10.1b a prototype with no theme line stays light; only `theme: 'global'` follows dark mode. `--remove` sets `global`.

### The undo command

Steps 2, 6 and 9 show it. **Show it only. Never run it on your own.**

```bash
git checkout -- src/prototypes scripts/radiant-check/rules-mine.json && git clean -fd src/prototypes
```

It puts back every changed file and deletes new files under `src/prototypes` (`migration-todo.md`, new thumbnails). If the designer asks you to undo:

1. Say it throws away every change this migration made, and wait for an explicit yes.
2. Run `git clean -nd src/prototypes` and show the list of files it would delete. This dry run is mandatory: step 0 started from a clean tree, but a file the designer added during a long run would be deleted too. If the list has anything this command didn't create, stop and ask.
3. Only then run `git checkout -- src/prototypes scripts/radiant-check/rules-mine.json` and `git clean -fd src/prototypes`.

---

## 0. Before starting

Tell the designer what to expect, in one short message, before running anything:

> This moves your prototypes onto the new font and makes them work in dark mode. Here's how it goes:
>
> 1. I scan your prototypes and show you how much work each one is (under a minute).
> 2. You pick which ones to do.
> 3. I make the safe changes automatically (seconds), then ask you a batch of questions about colours I can't decide on my own. One answer covers every place a colour is used.
> 4. I build the project and take light and dark screenshots of each prototype to check the result (a few minutes).
> 5. I stop and show you what changed. Nothing is saved to git until you say so, and everything can be undone.
>
> Small prototypes take a few minutes. Big ones with hundreds of hardcoded colours can take an hour or two.

Then check the two preconditions. If either fails, say why in plain words and stop.

1. **Clean tree.** `git status --porcelain` must print nothing. If it prints anything: "You have unsaved changes. Commit them first (ask me to commit), so this migration can be undone with one command." List the changed files.
2. **The build passes now.** Run `npm run build`. If it fails: "The project doesn't build right now, before any migration. Let's fix that first." Show the first error. Don't migrate on top of a broken build: you couldn't tell which errors the migration caused.

## 1. Scan everything

Pick the prototypes:

- `$ARGUMENTS` names one or more: use those ids (as in `registry-mine.ts`). If a name isn't in `registry-mine.ts`, say so and stop. Prototypes in `registry-core.ts` are upstream's samples; they're migrated upstream.
- `$ARGUMENTS` is empty: every entry in `registry-mine.ts`. If there are none, say "You have no prototypes of your own in registry-mine.ts yet" and stop.

Run, all read-only:

```bash
node scripts/radiant-check/scan.mjs --mine --json      # per prototype: findings by kind, ready.dark, ready.geist, theme, thumb
node scripts/radiant-check/codemod.mjs src/prototypes/<Name> --json    # once per prototype (dry run)
```

From the codemod JSON per prototype: the automatic swaps are the sum of `rules[*].count`; the decisions are `judgement.length` (distinct values) and `judgementCount` (uses); `skippedVendor` is the number of `vendor/` files left alone. From the scan: `vendor` is the number of findings inside `vendor/`.

Show **one table**, one row per prototype:

| Prototype | Colour findings | Font findings | Fixed automatically | Decisions left | In `vendor/` (left as is) | Theme now | Thumbnail | Rough size |
|---|---|---|---|---|---|---|---|---|

- Colour findings: `literal + light-read + unknown-token + media-query + theme-write`. Font findings: `font-family + font-weight`.
- Fixed automatically: the codemod's swap count. Decisions left: distinct values (uses), for example `31 (51 uses)`.
- Theme now: `global` or `light-only`. Thumbnail: the scan's `thumb` value as it is: `captured`, `svg (light)`, `svg (theme)`, `image`, `set` or `none`.
- Rough size, from the distinct decisions: 0 to 10 "a few minutes", 11 to 40 "under an hour", over 40 "an hour or two".
- Mark a prototype **ready** when the scan says `dark` and `geist` are both yes, the thumbnail is `captured` and the theme is `global`. Ready prototypes are listed and skipped.
- A prototype that is dark and Geist ready with a captured thumbnail but still light (theme isn't `global`) needs no migration: don't offer it in step 2, and take it straight to step 8 so it's switched to `global`. Say so in one line under the table.
- If a prototype has findings in `vendor/`, add under the table: "<Name> stays light-only after this, because some of its code came from outside the repo (`vendor/`). Migrating still moves its own code to the new font and colours."
- The scan can say `dark: no` for a prototype whose own folder is clean. Its `meta.notReadyBecause` says why. Put it in plain words under the table:

  | Reason in the scan | Say |
  |---|---|
  | `imports from <Other>, which isn't dark ready` | "<Name> shows screens from <Other>. It turns dark ready once <Other> does." |
  | `renders a static page in an iframe (public/...)` | "<Name> shows a static page in a frame. The theme can't reach that page, so it stays light-only unless the page handles dark itself." |

  The scan's `meta.dependsOn` lists every prototype folder a prototype imports from. Migrating the one it imports from changes how both look: say so.
- A static page that does handle dark itself: add an allow entry with kind `iframe` to `rules-mine.json` (`{ "path": "src/prototypes/<Name>/", "kinds": ["iframe"], "reason": "The page follows prefers-color-scheme itself" }`). Only on the designer's word.

Below the table, one line with the totals and the overall time.

## 2. Pick

First a single-select AskUserQuestion with two options: "Migrate all (recommended)" and "Let me pick". In the question text, say: "Nothing is committed. If you want to undo everything afterwards, there's one command for it, and I'll show it to you."

Only if they choose "Let me pick", ask a multi-select (`multiSelect: true`) with the prototypes that aren't ready, each with its rough size as the description. AskUserQuestion takes up to four options per question and four questions per call: with more than four prototypes, split them across several multi-select questions in the same call. With more than 16, list them numbered in plain text and ask for the numbers.

If they pick none, stop.

From here on, "picked" means the prototypes they chose. Remember each one's theme from step 1; step 8 needs it.

**`vendor/` code.** Don't raise it. Only if the designer asks for the `vendor/` code to be migrated too (for example "the left nav comes from vendor/, do that as well"), confirm in one line that it changes code copied from outside the repo, and that the copy then no longer matches its source. On a yes, steps 3 and 6 add `--include-vendor`. When several picked prototypes carry the same `vendor/` copy, check with `diff -rq src/prototypes/<A>/vendor src/prototypes/<B>/vendor`. If it prints nothing, the copies are identical: migrate one, then copy that `vendor/` folder over the others, so they stay identical and every decision is made once.

## 3. Codemod, all picked prototypes in one run

```bash
node scripts/radiant-check/codemod.mjs src/prototypes/<A> src/prototypes/<B> ... --write --json
```

Add `--include-vendor` only when the designer asked for `vendor/` in step 2. With identical `vendor/` copies, run it in two passes: first `--include-vendor` over one of those prototypes, then copy its migrated `vendor/` folder over the other copies, then the run above over the rest without the flag. Their `vendor/` is already done and the decisions are listed once.

This applies only the mechanical rules (font stacks, weights 600/375/400/500, font sizes on the scale, `systemColors.light[...]` to `sysVar()`, hex values that equal a token in their role, neutral shadows). It skips `vendor/` by itself, unless `--include-vendor` is passed. It never rewrites colours or fonts inside chart options: those come back as decisions with role `chart` (step 5). It writes `src/prototypes/<Name>/migration-todo.md` for every prototype with decisions left. Keep the JSON: its `judgement` array is already grouped by distinct value across all picked prototypes, each with `at` (every file and line), `role`, `suggestion` and `reason`.

Tell the designer the totals in one line ("Made 1,580 safe changes across 3 prototypes. 177 colours and sizes need a decision.").

## 4. Decisions, grouped across prototypes

Work from the codemod's `judgement` groups. One decision applies to every use of that value, in every picked prototype.

**Resolve these yourself, without asking**, using `docs/2026-10-07-phase6-colour-mapping.md` and the code around each use:

- A value the Phase 6 mapping lists for that role (for example `#4B5563` as text is `content-secondary`).
- A near-miss grey or blue whose role is clear from the property and the nearest token suggestion (for example `#5C636F` as text is `content-secondary`; `#F1F4F8` as a fill is `background-sunken`).
- Translucent black hovers (`background-ghost-hover`), black overlays behind modals (`background-overlay`), translucent white on a coloured fill (`color-mix()` of `content-inverse`).
- Gradient stops between two neutral tokens: a token per stop.
- `check` items (a white surface with a shadow, a text token used as a fill): read the code and pick.
- Status colours (red, green, amber) used for success, failure and warning states.

**Ask the designer only about these**, because they're design intent, not mapping:

- **Always-dark panels.** A dark surface that should stay dark in both themes (a dark hero, a code block, a video player), or follow the theme.
- **User-picked colours.** Colours the user chooses in the prototype (a colour picker, label colours, avatar colours). Default: keep them as data.
- **Brand colours.** Logos and product colours (Google, Slack, the app's own accent). Default: keep them as data.
- **Weight 700.** Keep it as a bold display weight, or use the emphasis weight (550). Default: emphasis, unless it's a big heading.
- **Off-scale font sizes** (13px, 15px, 22px and so on). Default: the nearest size on the scale, which the codemod suggests. Inside a migrated `vendor/` folder that copies a product screen, the default is "keep": the copy should match the product.
- Any colour whose role you can't tell from the code.

Items with role `chart` are not questions for the designer. Step 5 handles them.

Sort every unclear item into one of those kinds first, including the codemod's catch-alls: "No colour property on the line (NAME)" items (constants such as `AVATAR_COLORS`, `GOOD_LINE`, `canvasColor`) and "Palette value" items (`referenceColors` reads). Read the constant's name and where it's used, and put it in the kind it belongs to: user-picked, brand, a role you can resolve yourself, or unclear.

Ask **in one batched message**, grouped by kind:

- Where one answer covers the whole kind, ask one question for the kind, not one per value: all off-scale font sizes in one question ("Use the nearest size on the scale for all 11? Recommended: yes", with the sizes listed), all 700 weights in one, all user-picked colours in one, all brand colours in one.
- Number only the items that need their own answer (each always-dark panel, each colour whose role is unclear), each with a plain description, where it shows up, how many uses in how many prototypes, and your recommendation:

  > 4. A dark navy panel (`#1D232F`, 12 uses in 2 prototypes: the app header in Native and Convo & Drafts). Should it stay dark in light mode too? Recommended: follow the theme (light grey in light mode, dark in dark mode).

- Keep a message to about 20 numbered items. If there are more, go kind by kind instead: one message per kind, in the order above, each capped the same way.

End each message with: "Reply with the numbers you want to change, or 'all recommended'."

**Applying the answers:**

- A token answer: replace every use listed in `at`. In TSX inline styles use `sysVar('<token>')` (`compVar`, `shadowVar`) from `@tokens/colors`; in CSS `var(--rd-sys-color-<token>)`. Same spelling rules the codemod uses.
- **Data stays a literal.** Leave the value, add a short comment on the line (`// brand colour, stays as is` or `// user-picked colour, data`), and add one entry to `scripts/radiant-check/rules-mine.json` so the scan and codemod stop reporting it:

  ```json
  { "path": "src/prototypes/<Name>/<file>", "kinds": ["literal"], "match": "#1DA1F2", "reason": "Brand colour (Twitter logo), kept as data" }
  ```

  Use a folder path ending in `/` when the same value is data across a whole prototype. Keep the file's existing format and the `lightOnly` record if there is one.
- **Always dark**: a surface that stays dark in both themes. Keep its literals (the panel and the text on it), comment them (`// stays dark in both themes`) and add `rules-mine.json` entries with that reason. Don't use theme tokens there: they flip in dark mode.
- Never edit inside `vendor/`, even when the same value appears there, unless the designer asked for `vendor/` in step 2.

## 5. Charts and canvases

ECharts draws on a canvas and can't read CSS variables. The codemod lists every colour, light read and font stack inside a chart option as a decision with role `chart` (reason "Canvas chart option"). Resolve them all yourself, in the files listed in `at`:

- Use `useChartTheme()` from `@/prototypes/_shared/tiles` (`const { colors, ui, seriesColor, isDark } = useChartTheme();`). Replace `chartColors` and `chartUi` with it, and set `backgroundColor: 'transparent'` on the option.
- Map literal axis, grid, label and tooltip colours to `ui.axis`, `ui.gridLine`, `ui.labelColor`, `ui.valueColor`, `ui.tooltipSurface`, `ui.tooltipText`.
- **Never `sysVar()`, `var(--...)` or `color-mix()` in a chart option.** The canvas can't read them, and the chart draws black or nothing.
- Numbers stay numbers. Font sizes stay as they are. Font weights stay numbers: `550` for emphasis, `400` regular, `500` medium. Never `'var(--font-size-*)'` or `'var(--font-weight-*)'`.
- A chart with its own series palette: ask once (fold it into the step 4 message): keep it, passing each colour through `seriesColor()` so it adapts in dark mode, or use the theme's `colors`. Recommended: `seriesColor()`.
- `useChartTheme()` is a hook. A chart option kept in a constant outside a component (`LINE_OPTION`, `VIZ_SPECS`) becomes a function that takes the theme, called inside the component.

## 6. Build once

```bash
npm run typecheck
npm run build
```

If either fails, fix what the migration caused (a missing `sysVar` import, a `sysVar()` call in a place that needs a number, a type that expected a literal). If an error has nothing to do with the migration, or you can't fix it in two tries, stop: show the error in plain words and show the undo command (don't run it).

Then run the codemod once more with `--write` over the picked prototypes (with `--include-vendor` if step 3 used it), so each `migration-todo.md` matches what's left (it's deleted when nothing is left). This run no longer lists step 3's `check` items (second looks at rewrites it already made). That's fine only because step 4 resolved every one of them; if any is still open, resolve it before this run.

Before that `--write` run, do a dry run first (the same command without `--write`, with `--json`). If it proposes any rewrite inside a chart option you fixed by hand in step 5 (a `sysVar()` or `var(--font-*)` in a chart file), don't run `--write` over that folder: it would undo your chart fixes. This shouldn't happen any more; if it does, say so in the summary and leave that folder's `migration-todo.md` as it is.

`migration-todo.md` can be deleted by hand when every item left in it is a deliberate keep (data, brand colours, a `vendor/` size kept to match the product).

## 7. Light and dark check, per prototype

Check the screenshot tools the way the thumbnails skill does (step 2 of `.claude/skills/rp-prototype-thumbnails/SKILL.md`): `~/.radiantplay-visual/.thumbnails-enabled` means ready; `.thumbnails-declined` means skip this step; otherwise ask the one-time setup question from that skill. If they say no, or setup fails, skip to step 8 and say the light and dark check was skipped.

If this step stops early for any reason (a capture fails, the dev server won't start, the designer says stop), still run step 8. This step switches picked prototypes to `global` for the capture, and step 8 puts back the light flag where needed.

`npm run thumbnails` captures only a light image for a prototype that stays light. So first switch every picked prototype that isn't `global` yet, so both images get captured:

```bash
node scripts/radiant-check/light-only.mjs --remove <Name> --write     # once per picked prototype that isn't global
npm run thumbnails -- <A> <B> ...
```

Read each pair of images (`src/prototypes/<Name>/thumbnail.light.jpg` and `.dark.jpg`):

- The light image: there's usually no earlier screenshot to compare with (most prototypes had a hand-drawn SVG). Check it shows the main screen with its content and nothing looks broken: missing text, a collapsed layout, empty panels.
- The dark image: list light surfaces left behind (light panels, white cards), text you can't read (dark text on a dark background, invisible labels) and content that's missing compared with the light image. Fix the ones you can trace to a line of code in the prototype's own folder, then capture that prototype again. Leftovers that come from `vendor/` stay; note them.
- An image that shows an error or an empty loading state: say what you see and don't wire it up.
- **The dark image looks the same as the light one**: the prototype is not dark ready, whatever the scan says. `npm run thumbnails` warns ("dark looks the same as light") and exits with code 2. Likely causes: screens imported from another prototype's folder, a page in an iframe, or a light-only flag or wrapper still set. Look for the cause; if you can't fix it in the prototype's own folder, treat it as not dark ready in step 8.

## 8. Flag and thumbnail, per prototype

Run `node scripts/radiant-check/scan.mjs --mine --json` again. For each picked prototype:

- **Dark ready** (`ready.dark` is true, which means every leftover is fixed or listed in `rules-mine.json`): it stays global. Clear any record with `node scripts/radiant-check/light-only.mjs --remove <Name> --write` (harmless if step 7 already did it). Wire both thumbnails into its `registry-mine.ts` entry as step 4 of `.claude/skills/rp-prototype-thumbnails/SKILL.md` describes (`thumbnail: { light: <Name>ThumbLight, dark: <Name>ThumbDark }`) and drop the old thumbnail import if nothing else uses it.
- **Not dark ready, and it was light in step 1** (a `light-only` line or no theme line): put the flag back:

  ```bash
  node scripts/radiant-check/light-only.mjs <Name> [<Name> ...] --write --by /rp-migrate-prototype
  ```

  Wire the light image only (`thumbnail: { light: <Name>ThumbLight }`), delete the dark image you captured for the check, and drop the old thumbnail import. Give the reason in plain words: "stays light-only: code from outside the repo (`vendor/`)", "stays light-only: it shows screens from <Other>", or "stays light-only: 3 decisions still open".
- **The scan says dark ready, but it must stay light-only** (step 7 found the dark image the same as the light one, or the designer wants it light-only): the script skips a dark-ready prototype unless forced. Force it, with the reason in plain words:

  ```bash
  node scripts/radiant-check/light-only.mjs <Name> --write --by /rp-migrate-prototype --force --reason "home screen comes from Native's vendor/ code"
  ```

  The reason goes in the registry comment and in `rules-mine.json`. Wire the light image only, as above.
- **Not dark ready, and it was `global` in step 1** (the designer had set it themselves): leave it global and say it isn't dark ready yet.

If step 7 was skipped, leave the thumbnails as they are. For a dark-ready prototype, switch it to `global` only if the designer agrees without a dark check ("It's dark ready by the scan, but I couldn't check it in dark mode. Turn dark mode on for it now? Recommended: yes, then look at it with Ctrl+D.").

Run `npm run typecheck` once more after the registry edits.

### 8b. Offer the Radiant 3.0 look (optional, never automatic)

After the dark check, ask once for all picked prototypes: "Radiant 3.0 sizes are available: 32px text fields and menu items, 6px radii, 48px tabs. Turn them on for <Names>? Layouts can shift, so look at each one afterwards. Recommended: only for prototypes you're actively working on." Add `look: 'radiant-3',` to the `registry-mine.ts` entry of each prototype they name, and nothing else. Skip the question if every picked prototype already has it. Never add it without a yes; `/rp-sync-upstream` never adds it either. Mention the answer in the summary under step 9's first item.

## 9. Stop for review

One summary, in this order:

1. **Per prototype**: migrated (global, dark ready, Geist ready) or still light-only, and why.
2. **What changed automatically**: totals by kind (fonts, weights, sizes, colours, shadows), from the codemod's `rules`.
3. **Decisions made**: one line each, the ones you resolved and the ones the designer answered. Values kept as data, with the `rules-mine.json` entries added.
4. **Left for later**: anything still in a `migration-todo.md`, and `vendor/` findings left as they are. A `migration-todo.md` whose items are all deliberate keeps can be deleted: say so, and delete it if the designer agrees.
5. **Screenshots**: the image paths, and anything in them that still looks wrong.
6. **Undo**: show the undo command from the top of this file. Say you'll run it only if they ask, and that you'll show which files it deletes first.
7. End with: "Review the changes in the gallery, in light and dark (Ctrl+D). When you're happy, ask me to commit."

Don't commit. Don't push. Don't offer to do either until they ask.
