# Token System Update Plan — Radiant 3.0 Alignment

> Created: 2026-03-31
> Based on: `docs/figma-token-delta-report.md` (complete)
> Source of truth: Figma Radiant 3.0 Design System (`1QlRveXx4wppvDXyPVWUTK`)

## Overview

This plan aligns Radiant Play's entire token system with the Figma Radiant 3.0 spec. It covers colors, typography, elevation, layout constants, component updates, and dark mode readiness. Changes are ordered so each phase is independently shippable.

---

## Current state (what's wrong)

| Category | Mismatches | Missing | Notes |
|----------|-----------|---------|-------|
| Primitive colors | 3 hex values off | Dark Gray scale (12 stops), alpha variants (6) | |
| Light semantic (52 tokens) | 6 value mismatches | ~15 tokens (accents, Active, On Base) | |
| Dark semantic (52 tokens) | 24 mismatches | 10 missing | Wrong gray scale (blue-tinted vs neutral) |
| Typography | All heading weights wrong (500→600), letter spacing missing on 8/9 styles | | Neither textStyles nor v2TextStyles is fully correct |
| Elevation | Different architecture (6-step scale vs 3 semantic levels) | Dark mode shadows | |
| Layout | Header, sidebar, content max width all mismatch documentation | Viewport targets, fluid layout | |

### Actual component values vs documentation

The code doesn't match CLAUDE.md either:

| Constant | CLAUDE.md says | Code actually has | Figma says |
|----------|---------------|-------------------|------------|
| Header height | 56px | **60px** (`GlobalHeader.module.css:8`) | 48px / 60px (both exist) |
| Sidebar width | 240px | **261px** (`AppSidebar.tsx:168`, `AppShell.tsx:36`) | 260px |
| Content max width | 1200px | varies by prototype | 1280px |
| Search min-width | — | **260px** (`GlobalHeader.module.css:93`) | — |

---

## Phases

### Phase 1: Primitive colors (zero risk)

**What:** Add missing primitives, fix 3 hex mismatches.

**File: `src/tokens/colors/reference.ts`**

| Change | Detail |
|--------|--------|
| Add Dark Gray scale | 12 stops: 0 (#131416), 5 (#1a1b1e), 10 (#212326), 15 (#282a2e), 20 (#303136), 30 (#43474b), 40 (#585e64), 50 (#73767d), 60 (#8c9196), 70 (#aaadb1), 80 (#c4c6ca), 90 (#dfe0e2) |
| Add alpha variants | Gray/70A (#1f2632cc), Gray/60A (#20293a99), Gray/40A (#16223a42), Gray/10A (#c0c6cf1f), Blue/10A (#71a1f41f), Dark Gray/30A (#00030aba) |
| Fix Purple/70 | #6847BA → #6A4ABA |
| Fix Purple/100 | #0D0030 → #0E0033 |
| Fix Teal/70 | #359FAA → #369FAA |

**Impact:** No existing code references Dark Gray or alpha variants yet. The 3 hex fixes are single-digit RGB channel changes — visually imperceptible. Zero risk.

---

### Phase 2: Light mode semantic colors (low risk)

**What:** Fix 6 value mismatches and add 15 missing tokens.

**File: `src/tokens/colors/system.ts`**

**Value fixes (light mode):**

| Token | Current | Correct | Impact |
|-------|---------|---------|--------|
| `content-tertiary` | #A5ACB9 (Gray/50) | #C0C6CF (Gray/40) | Placeholder/disabled text gets lighter |
| `border-focus` | #2770EF (Blue/60) | #71A1F4 (Blue/50) | Focus rings get lighter/softer |
| `border-hover` | #777E8B (Gray/60) | #A5ACB9 (Gray/50) | Hover borders get lighter |
| `background-overlay` | rgba(29,35,47,0.5) | #1F2632CC (80%) | Modal overlays get darker |
| `background-ghost-highlight` | #DEE8FA (solid) | #71A1F41F (12% translucent) | Ghost highlights become translucent |
| `background-base-inverse` | #1D232F (Gray/90) | #323946 (Gray/80) | Inverse surfaces get lighter |

**New tokens to add (light mode):**

| Token | Value | Purpose |
|-------|-------|---------|
| `background-on-base` | #F6F8FA | Surface-on-surface |
| `background-active` | #FFFFFF | Selected/active state |
| `background-accent-green` | #E0F8EF | Green accent surface |
| `background-accent-yellow` | #FFF8E5 | Yellow accent surface |
| `background-accent-red` | #FFEBEC | Red accent surface |
| `background-accent-blue` | #DEE8FA | Blue accent surface |
| `background-accent-gray` | #F6F8FA | Gray accent surface |
| `background-accent-purple-subtle` | #F0EBFF | Purple subtle surface |
| `background-accent-purple-bold` | #8C62F5 | Purple bold surface |
| `content-accent-yellow` | #FCC838 | |
| `content-accent-red` | #E22B3D | |
| `content-accent-blue` | #2770EF | |
| `content-accent-gray` | #777E8B | |
| `content-accent-green` | #06BF7F | |
| `content-accent-purple` | #8C62F5 | |
| `border-subtle-hover` | #DBDFE7 | Subtle border hover state |
| `border-accent-green` | #06BF7F | |
| `border-accent-yellow` | #FCC838 | |
| `border-accent-red` | #E22B3D | |
| `border-accent-blue` | #2770EF | |
| `border-accent-gray` | #777E8B | |
| `border-accent-purple` | #8C62F5 | |

**Impact on components:** The 6 value fixes cascade automatically to all components using CSS variables. New tokens don't affect anything until used. The visible changes:
- Focus rings softer (Blue/50 vs Blue/60) — affects all focusable components
- Hover borders lighter — affects TextInput, Select, etc.
- Tertiary text lighter — affects placeholder text, disabled labels
- Modal overlays darker (50% → 80%) — affects Modal, ConfirmDialog
- Ghost highlights translucent — affects Button tertiary hover

**Components to verify after update:**
- `Button` — tertiary hover (ghost highlight), focus ring
- `TextInput` / `Select` — border hover, focus ring
- `Modal` / `ConfirmDialog` — overlay opacity
- `Chip` — may use tertiary content color
- `Tooltip` — may use inverse background

---

### Phase 3: Typography (low risk)

**What:** Fix heading weights, add letter spacing, align legacy body weights.

**File: `src/tokens/typography.ts`**

| Change | Before | After |
|--------|--------|-------|
| `letterSpacing.tight` | `-0.01em` | `-0.4px` |
| Add `letterSpacing.tighter` | — | `-0.6px` |
| `v2TextStyles` heading/label weights (6 styles) | `fontWeight.medium` (500) | `fontWeight.semibold` (600) |
| `v2TextStyles` letter spacing (7 styles) | `normal` (0) | `tight` (-0.4px) or `tighter` (-0.6px) |
| `textStyles.body.large` weight | `fontWeight.light` (375) | `fontWeight.regular` (400) |
| `textStyles.body.normal` weight | `fontWeight.light` (375) | `fontWeight.regular` (400) |

**Impact:** All headings and labels render slightly bolder. Text spacing tightens slightly. Body text in legacy styles gets slightly heavier. Visually, prototypes will look "more like Figma."

**Components to verify:**
- `Typography` component (if it references v2TextStyles)
- Any component with hardcoded `fontWeight: 500` instead of using tokens
- Modal titles, page titles, section headers across all prototypes

---

### Phase 4: Elevation / Shadows (medium risk)

**What:** Replace generic 6-step shadow scale with Figma's 3 semantic levels, add dark mode variants.

**File: `src/tokens/shadows.ts`**

**Current architecture:**
```
shadows.none / xs / sm / md / lg / xl / 2xl / inner / focusRing
  ↓ mapped to
semanticShadows.level0-5
  ↓ mapped to
componentShadows.card / dropdown / popover / tooltip / modal / nav / button / input
```

**New architecture:**
```
shadowPrimitives.surface / menu / modal (each with light + dark layer pairs)
  ↓ mapped to
componentShadows.card / dropdown / popover / tooltip / modal (direct mapping)
```

**Light mode shadow values:**

| Level | Layer 1 (ambient) | Layer 2 (key light) |
|-------|-------------------|-------------------|
| Surface | `0 0 4px #1923311a` | `0 2px 4px #1923310a` |
| Menu | `0 0 4px #19233114` | `0 12px 24px #1923311f` |
| Modal | `0 0 4px #1923311a` | `0 24px 32px #19233129` |

**Dark mode shadow values:**

| Level | Layer 1 (ambient) | Layer 2 (key light) |
|-------|-------------------|-------------------|
| Surface | `0 0 4px rgba(0,0,0,0.24)` | `0 2px 8px rgba(0,0,0,0.2)` |
| Menu | `0 0 6px rgba(0,0,0,0.16)` | `0 12px 28px rgba(0,0,0,0.32)` |
| Modal | `0 0 4px rgba(0,0,0,0.4)` | `0 24px 32px rgba(0,0,0,0.6)` |

**Component shadow mapping:**

| Component | Current (RP) | New (Figma) |
|-----------|-------------|-------------|
| Card | `xs` (single layer) | `surface` (2 layers) |
| Dropdown / Menu | `lg` | `menu` |
| Popover | `lg` | `menu` |
| Tooltip | `md` | `surface` |
| Modal | `xl` | `modal` |
| Nav | `md` | `surface` |

**Impact:** Shadow values change on every elevated component. Cards get a subtler shadow (ambient + key instead of single offset). Modals and dropdowns get more pronounced depth. Components using `boxShadow` from CSS variables update automatically. Components with hardcoded shadow strings need manual update.

**Components to verify:**
- `Card` — new 2-layer shadow
- `Modal` / `ConfirmDialog` / `WizardModal` / `FormModal` — new modal shadow
- `Menu` / `Popover` / `ActionMenu` — new menu shadow
- `Tooltip` — new surface shadow
- `AppSidebar` — nav shadow
- Any prototype with inline `boxShadow` styles

**Also update:**
- `src/tokens/shadows.ts` — restructure exports
- `src/styles/css-variables.ts` — regenerate CSS variables for shadows
- `src/styles/tokens.css` — regenerated output

---

### Phase 5: Layout constants (needs design confirmation)

**What:** Align header height, sidebar width, and content max width between documentation, code, and Figma.

**Current reality (code > docs):**

| Constant | Code | CLAUDE.md | layout-patterns.md | Figma |
|----------|------|-----------|-------------------|-------|
| Header | 60px | 56px | 56px | 48px / 60px |
| Sidebar | 261px | 240px | 240px (mostly) | 260px |
| Content max | varies | 1200px | 1200px | 1280px |

**Recommendation (pending design confirmation):**

| Constant | Proposed value | Rationale |
|----------|---------------|-----------|
| Header | **60px** (keep current code) | Code already uses 60px. Figma has both 48 and 60. Don't change code; update docs to match. |
| Sidebar | **260px** | Figma says 260. Code says 261 (likely a rounding artifact). Align to 260. |
| Content max | **1280px** | Figma is explicit about this. Update from 1200. |

**Files to update:**

| File | Change |
|------|--------|
| `CLAUDE.md` | `HEADER_HEIGHT = 60`, `SIDEBAR_WIDTH = 260`, `CONTENT_MAX_WIDTH = 1280` |
| `.cursor/rules/layout-patterns.md` | Update all 240px → 260px, 1200px → 1280px, 56px → 60px |
| `src/components/AppSidebar/AppSidebar.tsx` | Default width 261 → 260 |
| `src/components/AppShell/AppShell.tsx` | Default sidebarWidth 261 → 260 |
| `src/components/GlobalHeader/GlobalHeader.module.css` | Already 60px — no change needed |

**Impact on prototypes:** Any prototype hardcoding `width: '240px'` for sidebar or `maxWidth: '1200px'` for content will be slightly off from the new defaults. These are visual tweaks, not breakages.

---

### Phase 6: Dark mode semantic colors (medium effort)

**What:** Remap all dark mode tokens from blue-tinted Gray to neutral Dark Gray.

**File: `src/tokens/colors/system.ts` — `dark` object**

This is the largest value change. Every dark mode background, most content tokens, and several border tokens need new values. See delta report Section 8 for the full comparison table.

**Key changes:**
- Surface tokens: Gray → Dark Gray scale
- Status backgrounds: rgba overlays → solid /90 stops
- Primary text: pure white → off-white (#DFE0E2)
- Brand: stays Blue/60 for background, lightens to Blue/50 for content
- Borders: RP currently inverts (darker for dark mode), Figma keeps same values

**Also add:**
- `Background/Raised` dark: `#282A2E` (Dark Gray/15) — for elevated surfaces in dark mode

**Impact:** All dark mode rendering changes fundamentally. Since RP doesn't currently expose dark mode to users (no toggle), this is safe to ship — no one sees it yet.

**File: `src/styles/css-variables.ts`** — regenerate dark mode CSS variables after updating `system.ts`.

---

### Phase 7: CSS variable migration for prototypes (medium effort)

**What:** Convert prototype inline styles from `systemColors.light[...]` to CSS variable strings.

This enables dark mode for prototypes. Currently 35 prototype files with ~410 references to `systemColors.light[...]`.

**Pattern:**
```typescript
// Before (locked to light)
backgroundColor: systemColors.light['background-sunken']

// After (theme-aware)
backgroundColor: 'var(--rd-sys-color-background-sunken)'
```

**Automation:** A find-and-replace script can handle most of this:
```
systemColors.light['X'] → 'var(--rd-sys-color-X)'
referenceColors.gray['N'] → 'var(--rd-ref-color-gray-N)'
```

**Impact on forks:** This only touches your prototypes. Designer forks have their own prototype folders — no merge conflicts. Their prototypes continue using `systemColors.light[...]` which still works for light mode.

---

### Phase 8: Component preview / dark mode toggle (small effort)

**What:** Add a theme toggle to GlobalHeader or AppShell so users can switch between light and dark mode.

**Infrastructure already exists:**
- `theme.ts` has `applyTheme('dark')` / `applyTheme('light')`
- `tokens.css` has `[data-theme="dark"]` selectors
- Components using CSS variables switch automatically

**What to build:**
- Toggle button in GlobalHeader (sun/moon icon)
- Persist preference in localStorage
- Apply on page load

**Components that work immediately after toggle:**
- All 66 components using CSS Modules with `var(--rd-sys-color-*)` — automatic
- GlobalHeader, AppShell, AppSidebar — automatic
- Button, Card, Modal, Table, TextInput, etc. — automatic

**Components that need Phase 7 first:**
- Prototypes using `systemColors.light[...]` — locked to light until migrated

---

## Execution order & dependencies

```
Phase 1 (Primitives)         → Independent, ship anytime
Phase 2 (Light semantic)     → Independent, ship anytime
Phase 3 (Typography)         → Independent, ship anytime
Phase 4 (Elevation)          → Independent, ship anytime
Phase 5 (Layout)             → Needs design confirmation first
Phase 6 (Dark semantic)      → Depends on Phase 1 (needs Dark Gray scale)
Phase 7 (CSS var migration)  → Depends on Phase 6 (need correct dark values)
Phase 8 (Theme toggle)       → Depends on Phase 7 (prototypes need to be theme-aware)
```

Phases 1-4 can be done in parallel with no dependencies. Phase 5 is blocked on design team input. Phases 6-8 are sequential.

---

## Fork impact summary

| Phase | Breaks forks? | What designers see |
|-------|--------------|-------------------|
| 1 (Primitives) | No | Nothing — new data, unused |
| 2 (Light semantic) | No | Subtle color shifts (lighter focus rings, darker overlays) |
| 3 (Typography) | No | Headings slightly bolder, text slightly tighter |
| 4 (Elevation) | No | Shadow changes on cards, modals, menus |
| 5 (Layout) | No | Sidebar 1px narrower (261→260) |
| 6 (Dark semantic) | No | Nothing — dark mode not exposed |
| 7 (CSS migration) | No | Nothing — only affects your prototypes |
| 8 (Theme toggle) | No | New toggle in header (optional to use) |

**No phase breaks existing fork code.** All changes are value updates or additions — no keys are renamed or removed.

---

## Files touched per phase

| Phase | Files | Est. lines changed |
|-------|-------|-------------------|
| 1 | `src/tokens/colors/reference.ts` | ~40 |
| 2 | `src/tokens/colors/system.ts` | ~50 |
| 3 | `src/tokens/typography.ts` | ~20 |
| 4 | `src/tokens/shadows.ts`, `src/styles/css-variables.ts` | ~60 |
| 5 | `CLAUDE.md`, `layout-patterns.md`, `AppSidebar.tsx`, `AppShell.tsx` | ~15 |
| 6 | `src/tokens/colors/system.ts` (dark object) | ~60 |
| 7 | ~35 prototype files | ~410 replacements (scriptable) |
| 8 | `GlobalHeader.tsx` or `AppShell.tsx`, `theme.ts` | ~30 |

---

## Verification checklist per phase

After each phase, run:

1. `npm run typecheck` — zero errors
2. `npm run build` — passes
3. Visual check — open 2-3 prototypes in browser, compare before/after
4. Component spot-check — open the component that changed most (Button for Phase 2, Typography for Phase 3, Card for Phase 4)

After Phase 8 (theme toggle):
5. Toggle dark mode — verify all components switch correctly
6. Toggle back to light — verify nothing is stuck in dark mode
7. Test with a prototype that was migrated (Phase 7) vs one that wasn't

---

## Open questions

1. **Header height** — 48px, 56px, or 60px? Code is 60, docs say 56, Figma has both 48 and 60. Needs design team answer.
2. **Extra RP tokens** — 25 tokens exist in RP but not in Figma (inverse variants, link colors, etc.). Deprecate or keep as extensions?
3. **Semantics alias layer** — Figma has `Semantics/Surface/*`, `Semantics/Icon/*`, `Semantics/Text/*` aliases. Should RP add these as an alternative access pattern, or is the current flat `systemColors` sufficient?
4. **Component colors** — Button, Chip, Toggle state colors not yet compared against Figma. Should this be Phase 2.5 or deferred?
5. **Overline letter spacing** — Figma groups it with footnote/caption (-0.6px) but overlines traditionally use positive spacing. Keep current `wider` or switch to `-0.6px`?
