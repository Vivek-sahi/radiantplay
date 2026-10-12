# RadiantPlay — Claude Code Guide

## What This Project Is

**Radiant Play** is a prototyping playground built on ThoughtSpot's **Radiant** design system. It uses Radiant components to create interactive prototypes with realistic data and interactions. It is NOT a designer-developer handoff tool, NOT a code learning platform, NOT a tutorial site, and NOT a generic React starter.

## Behavior Rules

- When asked to save or write content, write directly to the file. Do NOT create sub-tasks, todo items, or intermediate plans unless explicitly asked.
- Do NOT add unsolicited UI elements, features, badges, or enhancements not in the request. Build exactly what was asked.
- The project is branded as **Radiant Play** — not figmaradiant, RadiantPlay, or other legacy names in user-facing content.
- When asked to save or write recommendations/analysis, prefer simple file writes for document deliverables.
- **Registry rule:** Never write prototype entries to `registry-core.ts` or `registry.ts`. Designer prototypes always go in `registry-mine.ts`. If asked to add a prototype to the registry, always use `registry-mine.ts`.

## Git & Deployment

**Designer fork** (only `origin` exists): push to `origin` only. Do not attempt to add or push to `galaxy`.

**Main maintainer setup** (both `origin` and `galaxy` exist): the branch determines which remotes to push to.

| Branch | Purpose | Push to |
|---|---|---|
| `main` | Shared library + samples (what other designers sync from) | origin + galaxy |
| `staging` | Shared preview / QA | origin + galaxy |
| `faris` | Maintainer's daily working branch: personal prototypes (in `registry-mine.ts`) and decks | origin + galaxy (the galaxy copy deploys the radiantplay-faris Coolify app) |
| `feat/*`, `fix/*`, `chore/*` | Shared work branches | origin + galaxy |

`faris` is pushed to both remotes; the galaxy copy is what the radiantplay-faris Coolify app deploys. A pre-push hook refuses force-pushes and deletions of `faris`, because it is real history rather than a mirror. `faris` is never merged into `main` or `staging` — shared work is cut from `main` on a `feat/*`, `fix/*` or `chore/*` branch, and `faris` picks it up by merging `main` in. Do not bypass the hook with `--no-verify` unless the user explicitly says to.

There is also a `public` remote (`github.com/thoughtspot/radiant-play`), the curated public release mirror. **Never push to it directly.** The public snapshot is published separately, and only with explicit per-push approval for that specific push.

**The maintainer's daily working branch is `faris`.** Work directly on `faris`; if a side branch is used, merge it back promptly rather than leaving it long-lived. Push it to both remotes in one step with `bash internal/scripts/push-faris.sh`. Keep it current by merging `main` into `faris`, never the other way round. Personal prototypes live in `registry-mine.ts`. To promote a personal prototype to the shared library: switch to `main`, move the entry from `registry-mine.ts` to `registry-core.ts`, commit, and push to both remotes.

Run `git remote -v` to confirm which remotes exist. Default deploy target is **staging**, not main — do not push to main unless explicitly asked.

**Before pushing to main (main maintainer only)**: if both `origin` and `galaxy` remotes exist, always ask whether to run `bash internal/scripts/release.sh` first. This updates the platform version and changelog. If the user confirms they've already run it or wants to skip, proceed with the push. On designer forks (only `origin` exists), skip this prompt — the release ritual is a maintainer concern.

## Tech Stack

React 19 + TypeScript + Vite 7. Deployed on Vercel (main, staging, per-branch previews) and on ThoughtSpot's self-hosted Coolify (main, staging, faris — see `docs/coolify/`). When building or modifying pages, verify the build succeeds before considering the task complete.

## Commands

```bash
npm run dev            # Start dev server
npm run build          # Production build
npm run build:strict   # TypeScript check + production build
npm run typecheck      # TypeScript only (--noEmit)
npm run new-prototype  # Scaffold a new prototype
```

## Path Aliases

| Alias | Path |
|-------|------|
| `@/*` | `src/*` |
| `@tokens/*` | `src/tokens/*` |
| `@components/*` | `src/components/*` |
| `@spotter/*` | `src/spotter/*` |

## Two-layer DS — Radiant + Spotter

`@components/*` is the **Radiant DS** — product-agnostic primitives. `@spotter/*` is the **Spotter DS** — agentic-domain blocks (chat, answers, viz, page shell) built on top of Radiant. Same conventions apply (tokens only, sentence case, layout primitives) but Spotter components encode AI-flavoured patterns.

New Spotter chat surfaces render `Reasoning`, `UserMessage` and `PromptBar` from `@spotter/chat`. `ReasoningBlock` and `UserBubble` are adapters kept for consumers holding a runtime `ChatMessage`. Never vendor a Spotter block into a prototype — import from `@spotter/*` and PR improvements against `src/spotter/`. Both composers (`SpotterPrompt` and `PromptBar`) ship until the composer decision lands — see `docs/2026-09-02-spotter-refresh-adoption-plan.md` §8.1.

When working on Spotter surfaces, the orchestrator auto-loads the Spotter cursor rules. For a new Spotter prototype the orchestrator runs a Requirements Gate first (mode / welcome state / data). See `.cursor/rules/_orchestration.md` → Spotter Requirements Gate.

**Spotter modes:**
- **Standalone Spotter** — full-page agentic chat (`src/prototypes/Spotter/`)
- **Spotter Model (embedded)** — canvas + chat for data-model editing (`DataModelEditor`)
- **Spotter Viz (embedded)** — canvas + chat for dashboard generation (planned)
- **Spotter Code (embedded)** — canvas + chat for code generation in an IDE-like surface (planned)

**Resume-here tracker:** `docs/spotter-roadmap.md` — status per mode, active scope, planned components.

**Active spec docs** (top of `docs/`):
- `docs/2026-05-07-spotter-answer-card.md` — AnswerCard spec (unbuilt; VizBlock is the current stand-in)
- `docs/2026-05-07-spotter-viz-block-behaviour.md` — VizBlock slot model and behaviour

**Archived plans** (work is done — under `docs/archive/`): `spotter-ds-plan`, `spotter-prototype-shell`, `spotter-chat-extraction`.

## Docs and planning conventions

- **Topical folders in `docs/`:** Topics with **3+ related docs** earn their own subfolder (e.g. `collaboration/`, `testing/`, `archive/`). Topics with 1–2 docs stay flat at `docs/`.
- **Date prefixes (`YYYY-MM-DD-*.md`)** apply to active planning / spec docs and capture the date of the **last meaningful update** — rename to today's date on every substantive edit so the filename reflects current state.
- **Roadmap / status docs** (like `spotter-roadmap.md`) carry a `Last updated:` line at the top instead of a date in the filename. Bump it on every meaningful edit.
- **Historical plans** (work done, content frozen) move to `docs/archive/` and keep their original date prefix.
- **Plan docs are gitignored by default** (per `.gitignore` pattern `docs/*plan*.md`) — historical plans get tracked once moved to archive.

## Project Structure

```
src/
├── components/    # 72+ shared Radiant design system components (DO NOT add prototype-specific components here)
├── prototypes/    # Per-prototype folders (each is an independent experiment)
├── tokens/        # Design tokens — colors, spacing, typography, radius, shadows, etc.
├── mocks/         # Mock data for realistic prototype content
├── pages/         # App pages / routes
├── styles/        # Global styles
├── data/          # Static data
├── utils/         # Utility functions
└── context/       # React context providers
```

## Critical Conventions

### 1. Design Tokens — NEVER hard-code values

```typescript
// Colors: theme-aware CSS variables, so the UI follows light and dark mode
import { sysVar, compVar, shadowVar } from '@tokens/colors';
// sysVar('content-primary') → 'var(--rd-sys-color-content-primary)'
// compVar('chip-filter-default') → 'var(--rd-comp-color-chip-filter-default)'
// shadowVar('menu') → 'var(--rd-sys-color-shadow-menu)'

// Spacing (4px base: A=4, B=8, C=12, D=16, E=20, F=24, G=28, H=32, I=40, J=48)
import { spacing, componentSpacing } from '@tokens/spacing';

// Typography
import { fontFamily, fontSize, fontWeight, lineHeight, v2TextStyles } from '@tokens/typography';
```

Common system colors: `background-base`, `background-sunken`, `background-on-base`, `background-secondary-action`, `content-primary`, `content-secondary`, `content-brand`, `border-subtle`, `border-bold`.

In CSS Modules use CSS variables: `var(--rd-sys-color-content-primary)`, `var(--rd-sys-color-shadow-surface)`, `var(--spacing-4)`, `var(--radius-md)`.

**Dark mode.** Every prototype runs in light and dark (ThemeSwitch, Ctrl+D). Never read `systemColors.light[...]`, `rdComponentColors.light[...]` or `referenceColors.*` for UI: they stay light in dark mode. Those objects are token data for docs pages and canvas charts only. Charts use `useChartTheme()` from `src/prototypes/_shared/tiles/chartTheme`. For tints use `color-mix(in srgb, var(--x) 12%, transparent)`, not alpha suffixes on hex. Check a prototype with `npm run scan:dark -- src/prototypes/<Name>` or `/rp-radiant-check`.

**Forbidden:** hardcoded hex (`#2770EF`), raw `rgb()`/`rgba()`, `systemColors.light[...]` in UI, magic spacing (`17px`), hardcoded font families and weights (use `fontFamily.*` and the `--font-weight-*` tokens).

### 2. Always Use Radiant Components

Use `Button` not `<button>`, `TextInput` not `<input>`, `Table` not `<table>`, `Select` not `<select>`, etc. Check the component inventory (72+ components) before building anything custom.

Key categories: **Input** (TextInput, TextArea, SearchInput, DatePicker, Select), **Actions** (Button, Link), **Feedback** (Alert, Toast, Tooltip, LoadingIndicator), **Layout** (Tabs, Sidebar, AppShell, Accordion), **Data** (Table, Card, Chip, Avatar, Pagination, Tree), **Overlays** (Modal, ConfirmDialog, Menu, Popover).

### 3. Layout Primitives

Use `Horizontal`, `Vertical`, `View` instead of inline flex. Use `Grid`/`RdGrid` + `RdGridItem` instead of inline grid. Use `AppShell` for full-page layouts with header + sidebar.

Responsive grids: always `repeat(auto-fill, minmax(220px, 1fr))` — never fixed column counts.

### 4. Prototype-Local Components

New components for a prototype go in `src/prototypes/<Name>/components/`, **not** in `src/components/`. The shared `src/components/` directory is reserved for the design system.

### 5. Content Guidelines

Sentence case everywhere. Imperative verbs for buttons (Create, Add, Delete, Save, Cancel). See `.cursor/rules/content-guidelines.md` for full rules.

### 6. Component Creation Standards

Use forwardRef, CSS Modules with camelCase, focus styles, keyboard navigation. See `.cursor/rules/design-system.md` for full spec.

## Mock Data

Import from `@/mocks` for realistic content in prototypes.

## Rules Reference

See `.cursor/rules/_orchestration.md` for tier classification (Tier 0–3) and rule file loading.

## Pre-Flight Checklist

Apply the 5 conventions above + verify `npm run build` passes before finishing a prototype.

## Workflow

### Branching Model

| Branch | Purpose | Deploys to | Pushed to |
|--------|---------|------------|-----------|
| `main` | Production (shared library) | radiantplay.vercel.app · radiantplay.design.coolify.thoughtspot.com | origin + galaxy |
| `staging` | Shared preview / QA | staging-radiantplay.vercel.app · radiantplay-staging.design.coolify.thoughtspot.com | origin + galaxy |
| `faris` | Maintainer's daily working branch — personal prototypes in `registry-mine.ts`, decks | Per-branch Vercel preview · radiantplay-faris.design.coolify.thoughtspot.com (from galaxy) | origin + galaxy |
| `feat/*`, `fix/*`, `chore/*` | Shared work branches | — | origin + galaxy |

The pre-push hook (`scripts/hooks/pre-push`) refuses force-pushes and deletions of `faris`, since it is the real working branch rather than a mirror. Vercel deploys from `origin`; Coolify deploys from `galaxy` (setup and operations in `docs/coolify/`). To "promote" a personal prototype to the shared library, switch to `main`, move the entry from `registry-mine.ts` to `registry-core.ts`, commit, and push to both remotes.

### Remotes

**Designer forks** have one remote:
- `origin` — the designer's own fork (GitHub or galaxy)

**Main maintainer** has three remotes:
- `origin` — GitHub (`https://github.com/faris-ts/radiantplay.git`)
- `galaxy` — ThoughtSpot (HTTPS: `https://galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay.git` or SSH: `git@galaxy.corp.thoughtspot.com:mohammed-faris/radiantplay.git`)
- `public` — the public mirror (`https://github.com/thoughtspot/radiant-play.git`). A curated, stripped snapshot, not a sync peer. **Never push to it directly without explicit per-push approval for that specific push.**

`origin` and `galaxy` must stay in sync on shared branches. `public` is a one-way publish target.

Always run `git remote -v` to confirm which remotes exist before pushing.
