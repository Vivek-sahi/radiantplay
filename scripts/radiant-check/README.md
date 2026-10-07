# Dark readiness scan

Finds colour code that won't follow the light/dark theme. `/radiant-check` uses it for its dark readiness line.

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
