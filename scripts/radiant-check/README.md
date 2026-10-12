# Dark readiness scan

Finds colour code that won't follow the light/dark theme. `/rp-radiant-check` uses it for its dark readiness line.

```bash
npm run scan:dark                              # whole of src, counts per prototype and layer
npm run scan:dark -- src/prototypes/MyProto --details   # one prototype, every finding with file:line
npm run lint:tokens                            # shared layers only, exits 1 on any finding
```

It reports, per file:

| Kind | What it catches | Fix |
|---|---|---|
| literal | Hex or `rgb()`/`rgba()` colours outside a `var(--x, fallback)` | `var(--rd-sys-color-*)` in CSS, `sysVar()` in inline styles |
| light | `systemColors.light[...]`, `rdComponentColors.light[...]`, `referenceColors.*` | `sysVar()`, `compVar()`, `shadowVar()` from `@tokens/colors` |
| unknown | `var(--rd-sys-color-*)` or `var(--rd-comp-color-*)` names that `tokens.css` doesn't define | Use a real token name |
| media | `@media (prefers-color-scheme)` in app code | Remove; the theme controller handles the system setting |
| theme | Code that sets `data-theme` | Use `useTheme()` from `@/context/ThemeContext` |

A unit is dark ready when all five are zero.

The scan reports. Only `lint:tokens` fails, and only on `src/components`, `src/spotter` and `src/prototypes/_shared`; it isn't wired into `/ship`.

## Exceptions

`rules.json` holds:

- **`exclude`**: files the scan skips, such as the token definitions.
- **`allow`**: accepted findings, each with a reason.

An allow entry has a `path` (a file, or a folder ending in `/`), optional `kinds`, and an optional `match` (text the line must contain). Add an entry only when the colour is data or deliberately fixed, such as a brand colour, a user-picked colour, or a surface that stays dark in both themes.

## Migration codemod

`codemod.mjs` moves an existing prototype onto the Geist font tokens and the theme-aware colour tokens. It rewrites what is safe to rewrite and lists the rest for a decision. Spec: `docs/2026-10-07-prototype-migration-plan.md`, section 6. Its rules live in `codemod-rules.json`; the Phase 6 mapping doc stays the human-readable reference.

```bash
node scripts/radiant-check/codemod.mjs src/prototypes/MyProto           # dry run: counts per rule, one sample each, judgement list
node scripts/radiant-check/codemod.mjs src/prototypes/MyProto --write   # apply, and write migration-todo.md
node scripts/radiant-check/codemod.mjs src/prototypes/MyProto --json    # machine output for /rp-migrate-prototype
```

`--skip=rule,rule` turns rules off. Run it on a clean tree so `git checkout -- src/prototypes/MyProto` undoes it.

What it rewrites:

| Rule | From | To |
|---|---|---|
| font-family, font-mono | Stacks starting with Plain, Inter, Helvetica, Arial, Roboto, -apple-system, system-ui (mono: SF Mono, Menlo, Monaco, Consolas, Fira Code, Courier, or ending in monospace) | `var(--font-family-primary)`, `var(--font-family-mono)` |
| font-face | `@font-face` blocks for Plain | Removed; the Plain files are gone and Geist loads globally |
| weight-600, weight-375, weight-400, weight-500 | `600`, `375`, `400`, `500` as a font weight | `var(--font-weight-emphasis)`, `regular`, `regular`, `medium` |
| weight-conditional | `cond ? 600 : 400` and the like | Both sides as weight tokens |
| weight-alias | `var(--font-weight-light)`, `var(--font-weight-semibold)`, with or without a fallback | `regular`, `emphasis` |
| weight-numeric | Weights in files that import ECharts and in SVG attributes | Numbers: 550 for 600, 400 for 375 |
| font-size | 12, 14, 16, 18, 20, 24, 32, 40 px | `var(--font-size-xs)` to `var(--font-size-4xl)`; skipped in ECharts files and SVG attributes |
| light-read, comp-read | `systemColors.light['x']`, `rdComponentColors.light['x']`, and `const c = systemColors.light` aliases | `sysVar('x')`, `compVar('x')` |
| alpha-suffix | `` `${colour}08` `` | `color-mix(in srgb, colour 3%, transparent)` |
| alpha-colour | `#RRGGBBAA` or `rgba()` of a token colour | `color-mix()` of the text token for that colour |
| hex-token, hex-tailwind | A hex equal to a token, or a Phase 6 Tailwind or status colour, keyed by the property on the same line (`color`, `fill`, `stroke` are text; `background*` is surface; `border*`, `outline*` are border) | The token for that role. A 1px box with a fill is a divider, so border |
| hex-const | `const TEXT_PRIMARY = '#1D232F'` and similar names that state the role | Same tables |
| hover-handler | `el.style.backgroundColor = '#F9FAFB'` | Same tables |
| shadow | `box-shadow` built only from neutral black or ink rgba layers | `shadowVar()`: blur times opacity under 1 is surface, under 5 menu, the rest modal |
| legacy-value | Old token values such as `rgba(29, 35, 47, 0.5)` | The token (`background-overlay`) |
| unknown-token | `var(--rd-sys-color-missing, var(--x))` | `var(--x)` |

In TSX a token becomes `sysVar('x')` (a string that is only the colour), `${sysVar('x')}` in a template literal (a string with other text, such as `1px solid #E5E7EB`), or `{sysVar('x')}` in a JSX attribute. In CSS, in `.js` files and in CSS or markup inside a string it becomes `var(--rd-sys-color-x)`. It adds `sysVar`, `compVar` or `shadowVar` to the existing `tokens/colors` import, or adds one, and drops `systemColors` and `rdComponentColors` when nothing else uses them. Only the matched text changes.

What goes on the judgement list instead, with a suggestion: hex values that match no token (nearest token by colour shown), dark surfaces (`#1D232F`, `#323946`, Tailwind darks), white borders, translucent white or black, colours in gradients, colours in ECharts option objects, colours with no property on the line, colours in list items (`{ label, color }`), `referenceColors` reads, off-scale font sizes, weight 700 and other weights with no token, shadows that aren't neutral elevation, and `theme="dark"`. It also lists a second look for a few rewrites it made: a white surface in a block with a shadow (raised may fit better), a neutral text token used as a surface or the reverse, and a `content-*` constant used as a fill.

The codemod never rewrites anything the scan's exceptions accept. It reads `rules.json` and `rules-mine.json` like the scan: `exclude` skips the file, and an `allow` entry that covers the file and line for the matching kind (`literal` for colour rewrites, `light-read` for `sysVar`/`compVar` swaps, `font-family` or `font-weight` for font rewrites) leaves it alone and off the list. An entry with no `match` covers the whole file for its kinds. The dry run reports how many rewrites each rule skipped this way. Colours in a logo or brand mark (an SVG introduced by "logo" or "brand", a component or variable named `*Logo*` or `*Brand*`, an Icon named after a product, or an object whose `name` is a product such as Google or Slack) go to the judgement list as "Brand colour, keep as data?".

It never touches `src/tokens`, `src/styles/tokens.css`, `src/components`, `src/spotter`, anything else in `src` outside `src/prototypes`, or any `vendor/` folder (it reports how many vendor files it skipped). `--write` writes `src/prototypes/<Name>/migration-todo.md` while a judgement list remains and deletes it when the list is empty.

### Fixture check

`codemod-check.mjs` (maintainer tool) tests the codemod against the Phase 6 migration in git history. For each sample prototype in `codemod-fixtures.json` it takes the pre-Geist state (parent of `e0d1aa1`), runs the codemod with `--write` on a temp copy, scans the result, and compares every line Phase 6 changed (`3005216`) with what the codemod did: match (same text, or an equivalent spelling such as `sysVar('x')` against `'var(--rd-sys-color-x)'`), judgement (left on the list, or allowed as data), or mismatch.

```bash
node scripts/radiant-check/codemod-check.mjs               # exits 1 when any number moves
node scripts/radiant-check/codemod-check.mjs --verbose     # every mismatch with both versions
node scripts/radiant-check/codemod-check.mjs --update      # record new numbers, keeping the notes
```

The comparison runs without `font-size`, `weight-400` and `weight-500`, which Phase 6 never applied; the swap counts include them. Scan counts come from a temp copy, so `rules.json` allow entries don't apply to them. Every recorded mismatch has a `note` saying why. When a codemod change moves a number, check the mismatches, run `--update`, and commit the fixtures file with the change.

## Light-only flag

Since 26.10.1b a designer prototype (`registry-mine.ts`) with no `theme` line stays light when the app is dark; only `theme: 'global'` follows dark mode (`isLightOnly` in `src/prototypes/registry.ts`). So nothing needs flagging after a sync. `light-only.mjs` writes the explicit lines: `theme: 'light-only'` with a dated reason, and `--remove`, which sets `theme: 'global'`. It reads the `dark` column of `scan.mjs --mine --json`.

```bash
node scripts/radiant-check/light-only.mjs                        # dry run: what it would flag
node scripts/radiant-check/light-only.mjs --write                # flag every entry that isn't dark ready
node scripts/radiant-check/light-only.mjs MyProto --write        # the same, for named prototypes only
node scripts/radiant-check/light-only.mjs --remove MyProto --write   # switch it to theme: 'global' (follows light and dark)
```

It adds one line as the entry's last property and changes nothing else in the file:

```ts
    theme: 'light-only', // light-only until migrated (/rp-migrate-prototype), set by sync on 2026-10-07
```

Running it twice changes nothing. `--by <who>` changes "sync" in the comment. Each flag it sets is recorded under `lightOnly` in `rules-mine.json` with the finding count at the time. If the designer deletes the line by hand, the next run leaves it deleted unless the findings have gone up. `--remove` clears the record.

## How the commands use these tools

`/rp-sync-upstream` no longer runs it (26.10.1a did); it shows `npm run scan:dark -- --mine` in its report. `/rp-new-prototype` writes `theme: 'global'` for a new prototype, since the scaffold is dark ready.

`/rp-migrate-prototype` (`.claude/commands/rp-migrate-prototype.md`) runs every prototype in `registry-mine.ts` through one pass, or one named prototype:

1. `scan.mjs --mine --json` and `codemod.mjs <path> --json` (dry run) per prototype, for the status table.
2. `codemod.mjs <paths...> --write --json` over the picked prototypes. Its `judgement` list is grouped by value across all of them, so each decision is asked once.
3. Values kept as data get an `allow` entry in `rules-mine.json`.
4. `light-only.mjs --remove` before `npm run thumbnails` (sets `global`, so both light and dark images are captured), then `light-only.mjs <Name...> --write` puts the light flag back on any named prototype that still isn't dark ready.

It never commits and never touches a `vendor/` folder.
