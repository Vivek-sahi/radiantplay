# Scaligent token tally

Compares Radiant Play's colour tokens with the ThoughtSpot product's (Scaligent `radiant-styles`), so prototypes stay easy to hand off to developers.

Decisions it follows (plan: `docs/2026-10-07-dark-mode-rollout-plan.md`, section 9):

- Scaligent names in code.
- Figma wins on values. A "differs" row is a gap to report to the product team, not a change for us.
- Tokens we have and Scaligent doesn't keep our naming scheme and are marked "proposed".

## Run it

Needs a local Scaligent checkout. The script reads the SCSS source files only, so no Scaligent build is needed.

```bash
npm run scaligent-tokens:tally                 # summary and details
npm run scaligent-tokens:tally -- --summary    # counts only
npm run scaligent-tokens:tally -- --markdown   # tables, for a ticket or a doc
npm run scaligent-tokens:tally -- --names      # name check across Figma, Scaligent and ours
```

The checkout path comes from `SCALIGENT_DIR`, else `~/code/scaligent`:

```bash
SCALIGENT_DIR=~/work/scaligent npm run scaligent-tokens:tally
```

## Statuses

| Status | Meaning |
|---|---|
| match | Same name, same light and dark value |
| differs | Same name, a light or dark value differs |
| proposed | Radiant Play only. Either a token Scaligent doesn't have, or our older name for a Scaligent token |
| scaligent-only | Scaligent has it, `tokens.css` doesn't |

Values are compared after resolving every alias on both sides, as lowercase `#rrggbbaa`. Shadows are compared layer by layer. When Scaligent has no dark value for a token, the light value is used, as in the browser.

## What it reads

| Side | Source |
|---|---|
| Scaligent | `_tokens-reference.scss`, `_tokens-system.scss` (`$rd-sys-color-map` and `-dark`), every `_tokens-component-*.scss` (`$rd-comp-*-color-map` and `-dark`) |
| Ours | `src/styles/tokens.css`: `:root` plus `[data-theme="light"]` for light, and `[data-theme="dark"]` on top for dark |
| Figma (`--names` only) | `scripts/figma-tokens/snapshot/variables.json`, Theme collection |

## Changing a decision

Everything that might change lives in `rules.json`. Edit it, then re-run.

| Key | What it holds |
|---|---|
| `nameMap` | Scaligent name to the CSS variable we use today, where they differ. Remove a row once Phase 2 renames ours to the Scaligent name |
| `aliases` | Our older names for a Scaligent token |
| `proposed` | One line per Radiant Play-only token explaining why it exists |
| `figmaNameMap`, `figmaShadowParts` | Figma names that differ from Scaligent's, for `--names` |
| `scaligentFiles`, `systemMaps`, `componentMapPattern` | Where to find the Scaligent maps, in case the files move |
