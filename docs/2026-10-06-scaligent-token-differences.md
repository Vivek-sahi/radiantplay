# Token values where Radiant Play and the product differ

Last checked: 2026-10-06, against Scaligent `app_ib_dev @ b1b1ebfd7`.

Radiant Play's colour tokens follow the Radiant 3.0 Figma file. The product's (`js/ts-packages/radiant-styles`) disagree with it on 33 tokens. The names match; only the values differ. Where they differ, Figma is the source of truth, so these are changes for the product to consider, not for Radiant Play.

Who receives this list hasn't been decided yet.

Regenerate it with `npm run scaligent-tokens:tally -- --markdown`.

## Summary by cause

| Cause | Tokens | What differs |
|---|---|---|
| Dark Gray scale | 15 | Figma moved five steps of the Dark Gray scale. Every token that uses one of them differs in dark mode |
| Different step chosen in dark mode | 13 | Same scale, but Figma and the product pick a different step for chip filter, chip input, chip error and toggle tokens |
| Shadow offsets | 3 | The y offset of the second shadow layer |
| `background-inverse` in light mode | 1 | Figma uses Gray/80, the product Gray/90 |
| Purple 70 | 1 | One purple primitive value |

### Dark Gray scale

| Step | Figma (Radiant Play) | Product |
|---|---|---|
| Dark Gray/15 | `#2D2F34` | `#2F3137` |
| Dark Gray/30 | `#46494E` | `#464A4E` |
| Dark Gray/40 | `#5D636A` | `#60656C` |
| Dark Gray/50 | `#7A7D85` | `#808389` |
| Dark Gray/60 | `#9A9EA2` | `#9C9EA5` |

Fixing these five values in `_tokens-reference.scss` would close 15 of the 33 rows.

## Every token

Colours are `#rrggbbaa`. Shadows are `x y blur spread colour`, one entry per layer.

### System tokens (15)

| Token | Mode | Radiant Play (Figma) | Product |
|---|---|---|---|
| `background-accent-gray` | dark | `#2d2f34` | `#2f3137` |
| `background-active` | dark | `#5d636a` | `#60656c` |
| `background-inverse` | light | `#323946` | `#1d232f` |
| `background-raised` | dark | `#2d2f34` | `#2f3137` |
| `background-secondary-hover` | dark | `#46494e` | `#464a4e` |
| `border-accent-gray` | dark | `#5d636a` | `#60656c` |
| `border-bold` | dark | `#5d636a` | `#60656c` |
| `border-bold-hover` | dark | `#7a7d85` | `#808389` |
| `border-subtle-hover` | dark | `#46494e` | `#464a4e` |
| `content-accent-gray` | dark | `#5d636a` | `#60656c` |
| `content-secondary` | dark | `#9a9ea2` | `#9c9ea5` |
| `content-tertiary` | dark | `#5d636a` | `#60656c` |
| `shadow-menu` | dark | `0 0 6 0 #00000029, 0 12 28 0 #00000052` | `0 0 6 0 #00000029, 0 14 28 0 #00000052` |
| `shadow-modal` | light | `0 0 4 0 #1923311a, 0 24 32 0 #19233129` | `0 0 4 0 #1923311a, 0 16 32 0 #19233129` |
| `shadow-modal` | dark | `0 0 4 0 #00000066, 0 24 32 0 #00000099` | `0 0 4 0 #00000066, 0 16 32 0 #00000099` |
| `shadow-surface` | dark | `0 0 4 0 #0000003d, 0 2 8 0 #00000033` | `0 0 4 0 #0000003d, 0 4 8 0 #00000033` |

`shadow-modal` differs in both modes, so it has two rows.

### Component tokens (18)

| Token | Mode | Radiant Play (Figma) | Product |
|---|---|---|---|
| `button-primary-on-color-hover` | dark | `#2d2f34` | `#2f3137` |
| `button-primary-on-color-pressed` | dark | `#46494e` | `#464a4e` |
| `button-secondary-hover` | dark | `#46494e` | `#464a4e` |
| `button-secondary-pressed` | dark | `#5d636a` | `#60656c` |
| `chip-date-pressed` | dark | `#6a4aba` | `#6847ba` |
| `chip-error-active-border` | dark | `#b6313e` | `#34363c` |
| `chip-filter-active-border` | dark | `#46494e` | `#34363c` |
| `chip-filter-default` | dark | `#34363c` | `#2f3137` |
| `chip-filter-hover` | dark | `#46494e` | `#34363c` |
| `chip-filter-icon` | dark | `#9a9ea2` | `#808389` |
| `chip-filter-pressed` | dark | `#5d636a` | `#464a4e` |
| `chip-input-default` | dark | `#1f2024` | `#18191b` |
| `chip-input-hover` | dark | `#2d2f34` | `#26282c` |
| `chip-input-pressed` | dark | `#34363c` | `#2f3137` |
| `toggle-thumb-off` | dark | `#c7c9cc` | `#afb2b6` |
| `toggle-thumb-on` | dark | `#cedcf5` | `#71a1f4` |
| `toggle-thumb-outline-off` | dark | `#c7c9cc` | `#afb2b6` |
| `toggle-track-off` | dark | `#5d636a` | `#464a4e` |

## Tokens only one side has

- **Product only:** 13 chart tokens (`chart-surface`, `chart-gridline` and so on). They have dark values only and are not in Figma. Radiant Play adds them in the next phase of its dark mode work.
- **Radiant Play only:** 12 tokens (the `*-inverse` set, links, `content-alternate`, `background-inset`). Not in Figma or the product. Listed with a reason each in `scripts/scaligent-tokens/rules.json`.
