# AgentDB — Radiant design-system compliance audit
**Date:** 2026-07-14 **Scope:** `src/prototypes/AgentDB/**` only (per instruction, the shared `src/components/Select` edits from this session are **excluded** — flag separately if you want them reviewed). **Bar:** _Strict / copy-paste-ready_ — the goal is that a developer can lift a block of this code into the product and it uses real Radiant components, real `@components` / `@tokens` imports, and no bespoke layout scaffolding. Anything that would need rewriting before it lands in product is a finding. **Method:** full read of all 10 `.tsx` + `styles.ts`; grep sweeps for hex / px / `fontFamily` / inline `style` / raw HTML; cross-checked every recommendation against the actual Radiant component inventory (`src/components/`) and token files (`src/tokens/`).

* * *
## Verdict
AgentDB is **already substantially Radiant-aware** — it uses ~25 real Radiant components and routes _every_ color, radius, spacing, and type value through Radiant tokens. There are **no raw hex/rgb colors** and **no truly hardcoded font families** (the 7 `#hex` grep hits are all annotation comments in `styles.ts`).

What keeps it from being copy-paste-ready is **structural, not cosmetic**: a local token re-export layer (`styles.ts`), relative import paths instead of the DS aliases, ~47 inline `style={{}}` blocks doing layout that primitives/CSS-modules should do, a hand-built app shell where Radiant already ships `AppShell`/`GlobalHeader`/`AppSidebar`, and a handful of raw `<span>`/`<div>`/`<button>` elements that have Radiant equivalents.
### Scorecard
| Dimension | State | Grade |
| --- | --- | --- |
| Colors (no hex/rgb) | All via tokens | ✅ Strong |
| Typography tokens | All via tokens; `Typography` used 31× | ✅ Strong |
| Spacing tokens | All via `spacing.*` (a few `/2` off-grid) | 🟡 Good |
| Radius tokens | All via `radius.*` | ✅ Strong |
| Component reuse | ~25 real Radiant components | ✅ Strong |
| Import convention (`@components`/`@tokens`) | Relative paths + local re-export | 🔴 Gap |
| Layout method (primitives/CSS-modules vs inline) | ~47 inline `style` blocks | 🔴 Gap |
| App shell | Hand-built vs `AppShell`/`GlobalHeader`/`AppSidebar` | 🔴 Gap |
| Raw HTML elements | ~14 `<span>`, 10 `<div>`, 1 `<button>` | 🟡 Mixed |

* * *
## What's already compliant (leave alone)
- **Components in real use:** `Typography, Horizontal, Vertical, Table, Button, Link, Icon, Avatar, Tooltip, Modal, ModalFooter, Select, SegmentedControl, Checkbox, TextInput, Alert, ConfirmDialog, ActionMenu, ActionMenuItem, Tabs, NoData, ProgressBar, Toast`.
  
- **Zero hardcoded colors.** Everything resolves through `systemColors` / semantic tokens (`content-brand`, `border-divider`, `background-success`, …).
  
- `Typography` **color quirk is correctly handled** — code uses `color="gray-light"` for secondary grey (not `color="gray"`, which renders black in this DS). Keep this.
  
- **Semantic status → token mapping** in `StatusPill` (`background-success`/`content-success`, etc.) is correct.
  

* * *
## Findings (grouped, strict bar)
### A. Import convention — relative paths + local re-export layer 🔴 High
**Where:** every component (`from '../../../components'`, `from '../styles'`); `styles.ts` (`from '../../tokens/*'`). **Count:** 14 relative `components` imports; all token access proxied through `styles.ts`.

The DS convention (CLAUDE.md) is `@components/*` and `@tokens/*`. AgentDB instead imports Radiant via `../../../components` and re-exports tokens through a local `styles.ts` that also invents aliases: `c = systemColors.light` and a `shell` object. A dev copying a snippet gets `c['content-brand']` and `shell.bg`, **which don't exist in the product** — they have to mentally translate every reference.

**Fix (copy-paste-ready):**

- Replace relative imports with aliases: `import { Table, Typography } from '@components'`, `import { systemColors } from '@tokens/colors'`.
  
- Delete the `c` alias; use `systemColors.light[...]` or (preferably in CSS) `var(--rd-sys-color-content-brand)`.
  
- Keep `shell` only if you document each key as the exact inverse token it maps to (it already does in comments) — but consider whether `AppShell`/`GlobalHeader` remove the need (see §E).
  

* * *
### B. Inline `style={{}}` doing layout & typography 🔴 High
**Where:** ~47 blocks across all components. Representative:

- `Shell.tsx:21–31, 46, 60, 102–116, 136–150` — spans styled with `fontFamily`/`fontSize`/`fontWeight`/`color`.
  
- `primitives.tsx:22–34` (StatusPill), `95–104` (KeyValue), `53–65` (StatCard).
  
- `CachingSettingsModal.tsx:53–65` (`dayChip`), `172, 199–202`.
  
- `index.tsx:61, 65`; `CachingTab.tsx:203, 286`.
  

Radiant convention is CSS Modules with token CSS-vars (`var(--spacing-4)`, `var(--rd-sys-color-*)`) or layout-primitive props (`gap`, `padding`, `align`). Manual `padding: \`${spacing.D}px``and`fontSize: `${fontSize.sm}px`` on inline styles is the single biggest copy-paste blocker — none of it transfers cleanly.

**Fix:** move per-component styling into a `*.module.css` file using CSS vars; keep layout in `Horizontal`/`Vertical`/`Grid` props. For text, delete the inline font styling and use `Typography` (see §C).

* * *
### C. Raw HTML elements with Radiant equivalents 🟡 Med
`<span>` **for styled text →** `Typography` (it supports `as="span"`, already used at `CachingSettingsModal.tsx:81`):

- `Shell.tsx:21` (brand), `:46` (search placeholder), `:60` ("Primary"), `:96` (nav label), `:102` (group label), `:164` (workspace title).
  
- `DataObjectsView.tsx:26` & `DataStoreView.tsx:26` — clickable model name is a styled `<span>` with `cursor:pointer`; should be a `Link` (it navigates) or `Typography` with `variant`/`weight`.
  
- `CachingTab.tsx:290, 305`; `RunHistoryModal.tsx:23`.
  

`<button>` **→ Radiant control** — `CachingSettingsModal.tsx:311` weekday chips are raw `<button style={dayChip(on)}>`. Closest fits: selectable `Chip`s, `Toggle`s, or `Button` with a pressed state. (Radiant has no multi-select day picker — see §F/propose.)

`<div>` **layout wrappers → primitives /** `Divider`**:**

- Max-width wrappers (`CachingTab.tsx:203`, `DataStoreView.tsx:69`, `index.tsx:65`) → `Vertical`/`View`-style wrapper or a CSS-module class.
  
- Divider lines drawn as `borderTop/borderBottom: 1px solid` (`CachingTab.tsx:286`, `CachingSettingsModal.tsx:172, 201`, `Shell.tsx:17, 131, 159`) → use the Radiant `Divider` component.
  

* * *
### D. Hand-built app shell vs Radiant shell components 🔴 High
**Where:** `Shell.tsx` (`TopBar`, `Sidebar`, `NavItem`, `GroupLabel`), ~150 lines of inline-styled flex.

Radiant ships `AppShell`**,** `GlobalHeader`**,** `AppSidebar`**,** `Sidebar`**,** `Layout` — the entire top-bar + icon-rail + nav-panel scaffold is reinvented here with hardcoded `56px`/`232px`/`320px`/`36px` dimensions and manual dark-surface colors. This is the largest block of non-transferable code.

**Fix:** rebuild `Shell` on `AppShell` + `GlobalHeader` + `AppSidebar`. Two likely DS gaps to confirm while doing so: (1) `Typography` may not expose an _inverse/white_ color for dark chrome — hence the raw spans with `color: shell.text`; (2) whether these shells support a dark variant out of the box. Both → §Propose.

* * *
### E. Custom primitives duplicating (or extending) DS concepts 🟡 Med
`primitives.tsx`:

- `StatCard` (`48–76`) — a styled `Vertical` with border/radius/padding. Radiant has `Card`; rebuild on it.
  
- `StatusPill` (`18–39`) — no Radiant `Badge`/`Pill` exists (only `Chip`, which is semantically a tag/filter). This is a legitimate net-new → §Propose.
  
- `KeyValue` (`94–105`) — label→value rows; no DS equivalent (no `DescriptionList`). Net-new → §Propose.
  
- `SectionHeader` (`108–115`) — thin wrapper over `Typography` + `Horizontal`; fine to keep as prototype-local.
  
- `FloatingToast` (`81–91`) — portals `Toast` and pins it, because "the DS `Toast` has no positioning of its own." Real DS gap → §Propose.
  

* * *
### F. Hardcoded dimensions & magic values 🟡 Med / Low
- **Layout px** (not spacing tokens): `1200/640/480/320/232/180/160/56/36/34/32/40px` across `Shell.tsx`, `ModelView.tsx:25,32`, `DataObjectsView.tsx:89`, `DataStoreView.tsx:54,69`, `CachingTab.tsx:203`, `CachingSettingsModal.tsx:49,54,55,199,319`, `primitives.tsx:60,96`. Structural widths (content max-width, sidebar) should come from the shell components (§D); the rest should map to `spacing.*`.
  
- `1px solid` **borders** — border _width_ is hardcoded everywhere (color/radius are tokenized). Use `Divider` or a border-width token if one exists.
  
- `spacing.A / 2` (`Shell.tsx:155`, `CachingTab.tsx:289`) = 2px, an off-grid half-step. Pick a real token.
  
- `letterSpacing: '-0.01em' / '0.06em'` (`Shell.tsx:27,108`) — no token.
  
- `zIndex: 4000` (`primitives.tsx:87`) — magic z-index; use a layering token if available.
  

* * *
## Propose for Radiant DS (net-new — scope these as additions)
These are things AgentDB genuinely needs that Radiant doesn't provide today. Each is a candidate contribution so the pattern is reusable and devs don't re-invent it:

1. `database-zap` **/ "cached" icon.** Registry has `database` but no `database-zap`, `zap`, `cache`, or `warehouse`. `DatabaseZapIcon.tsx` is a hand-rolled SVG. → Add `database-zap` (and likely `warehouse`, repeatedly requested in other prototypes) to `components/icons/registry.ts` so it's usable via `<Icon name="database-zap" />`.
  
2. `Badge` **/** `StatusPill` **component.** Semantic status label (success/failure/warning/info/neutral) with token-mapped bg/fg. `Chip` is a tag/filter, not a status pill. → New component; `StatusPill` here is a ready-made spec.
  
3. `KeyValue` **/** `DescriptionList`**.** Label→value detail rows are common (cache settings, run details). → New primitive.
  
4. `Toast` **positioning / provider.** `Toast` has no self-positioning or stacking container; `FloatingToast` portals + pins it manually. → Add a positioned `Toast`/`ToastProvider`.
  
5. **Dark app-chrome support.** If `AppShell`/`GlobalHeader`/`AppSidebar` don't support a dark variant, and/or `Typography` can't render inverse/white text, add those — that's the only reason the shell is hand-built.
  
6. **Multi-select day picker** (weekly schedule) — minor; Radiant has no clean multi-toggle chip group. Lower priority.
  

* * *
## Suggested remediation order
**Quick wins (low risk, high compliance gain):**

1. Swap relative imports → `@components` / `@tokens` aliases; delete the `c` re-export (§A).
  
2. Replace styled `<span>`s with `Typography`; model-name spans → `Link` (§C).
  
3. Replace `borderTop/Bottom` divider lines with `Divider` (§C).
  
4. `StatCard` → `Card` (§E).
  

**Structural (schedule as its own pass):** 5. Rebuild `Shell` on `AppShell`/`GlobalHeader`/`AppSidebar` (§D) — resolves most hardcoded px and inline styles at once. 6. Move remaining per-component inline styles into CSS Modules with token vars (§B).

**Scope as DS additions (don't hack locally):** 7. File the 6 "Propose for Radiant" items; until they land, keep the local versions but mark them `// TODO(radiant): promote`.

* * *
## Appendix — raw signal counts (`src/prototypes/AgentDB`)
| Signal | Count | Note |
|---|---|---|
| Hardcoded hex | 7 | all annotation comments in `styles.ts` — **not** violations |
| Raw `rgb()/rgba()` | 0 | ✅ |
| Inline `style={{}}` | 47 | §B |
| Raw `<div>` | 10 | §C/§F |
| Raw `<button>` | 1 | `CachingSettingsModal.tsx:311` |
| Raw `<span>` (+table/input/select) | 14 | §C |
| Hardcoded `px` | 29 | §F (many are `${spacing.X}px` interpolations — token-derived) |
| `fontFamily` refs | 16 | all `fontFamily.primary` token — via inline style (§B) |
| `@components`/`@tokens` alias imports | 0 | §A — uses relative paths |
| `Typography` usages | 31 | ✅ |
