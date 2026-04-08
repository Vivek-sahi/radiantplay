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

**If `galaxy` remote exists** (main maintainer setup): push to BOTH `origin` and `galaxy` after every commit. Verify remote URLs are current before pushing.

**If only `origin` exists** (designer fork): push to `origin` only. Do not attempt to add or push to `galaxy`.

Run `git remote -v` to determine which applies before pushing. Default deploy target is **staging**, not main — do not push to main unless explicitly asked.

**Before pushing to main**: always ask whether to run `bash scripts/release.sh` first. This updates the platform version and changelog. If the user confirms they've already run it or wants to skip, proceed with the push.

## Tech Stack

React 19 + TypeScript + Vite 7, deployed on Vercel. When building or modifying pages, verify the build succeeds before considering the task complete.

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
// Colors (3-layer: reference → system → component)
import { systemColors, referenceColors, rdComponentColors } from '@tokens/colors';

// Spacing (4px base: A=4, B=8, C=12, D=16, E=20, F=24, G=28, H=32, I=40, J=48)
import { spacing, componentSpacing } from '@tokens/spacing';

// Typography
import { fontFamily, fontSize, fontWeight, lineHeight, v2TextStyles } from '@tokens/typography';
```

Common system colors: `background-base`, `background-sunken`, `background-subtle`, `content-primary`, `content-secondary`, `content-brand`, `border-default`, `border-divider`.

In CSS Modules use CSS variables: `var(--rd-sys-color-content-primary)`, `var(--spacing-4)`, `var(--radius-md)`.

**Forbidden:** hardcoded hex (`#2770EF`), raw `rgb()`/`rgba()`, magic spacing (`17px`), hardcoded font families.

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

| Branch | Purpose | Deploys to |
|--------|---------|------------|
| `main` | Production | radiantplay.vercel.app |
| `staging` | Preview / QA | staging-radiantplay.vercel.app |
| `feat/*`, `fix/*`, `chore/*` | Work branches | — |

### Remotes

**Designer forks** have one remote:
- `origin` — the designer's own fork (GitHub or galaxy)

**Main maintainer** has two remotes that must stay in sync:
- `origin` — GitHub (`https://github.com/faris-ts/radiantplay.git`)
- `galaxy` — ThoughtSpot (HTTPS: `https://galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay.git` or SSH: `git@galaxy.corp.thoughtspot.com:mohammed-faris/radiantplay.git`)

Always run `git remote -v` to confirm which remotes exist before pushing.
