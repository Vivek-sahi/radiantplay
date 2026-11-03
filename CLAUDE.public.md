# Radiant Play — Claude Code Guide

## What This Project Is

**Radiant Play** is a prototyping playground built on the **Radiant** design system. It uses Radiant components to create interactive prototypes with realistic data and interactions. It is NOT a designer-developer handoff tool, NOT a code learning platform, NOT a tutorial site, and NOT a generic React starter.

## Behavior Rules

- When asked to save or write content, write directly to the file. Do NOT create sub-tasks, todo items, or intermediate plans unless explicitly asked.
- Do NOT add unsolicited UI elements, features, badges, or enhancements not in the request. Build exactly what was asked.
- The project is branded as **Radiant Play**.
- When asked to save or write recommendations/analysis, prefer simple file writes for document deliverables.
- **Registry rule:** put your own prototype entries in `registry-mine.ts`, not in `registry-core.ts`.

## Tech Stack

React 19 + TypeScript + Vite 7. When building or modifying pages, verify the build succeeds before considering the task complete.

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

New Spotter chat surfaces render `Reasoning`, `UserMessage` and `PromptBar` from `@spotter/chat`. `ReasoningBlock` and `UserBubble` are adapters kept for consumers holding a runtime `ChatMessage`. Never vendor a Spotter block into a prototype — import from `@spotter/*` and PR improvements against `src/spotter/`. `SpotterPrompt` and `PromptBar` both ship until the composer decision lands.

## Project Structure

```
src/
├── components/    # Shared Radiant design system components (DO NOT add prototype-specific components here)
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

// Spacing (4px base: A=4, B=8, C=12, D=16, E=20, F=24, G=28, H=32, I=40, J=48)
import { spacing, componentSpacing } from '@tokens/spacing';

// Typography
import { fontFamily, fontSize, fontWeight, lineHeight, v2TextStyles } from '@tokens/typography';
```

In CSS Modules use CSS variables: `var(--rd-sys-color-content-primary)`, `var(--spacing-4)`, `var(--radius-md)`.

**Forbidden:** hardcoded hex (`#2770EF`), raw `rgb()`/`rgba()`, magic spacing (`17px`), hardcoded font families.

### 2. Always Use Radiant Components

Use `Button` not `<button>`, `TextInput` not `<input>`, `Table` not `<table>`, `Select` not `<select>`, etc. Check the component inventory before building anything custom.

### 3. Layout Primitives

Use `Horizontal`, `Vertical`, `View` instead of inline flex. Use `Grid`/`RdGrid` + `RdGridItem` instead of inline grid. Use `AppShell` for full-page layouts. Responsive grids: always `repeat(auto-fill, minmax(220px, 1fr))` — never fixed column counts.

### 4. Prototype-Local Components

New components for a prototype go in `src/prototypes/<Name>/components/`, **not** in `src/components/`. The shared `src/components/` directory is reserved for the design system.

### 5. Content Guidelines

Sentence case everywhere. Imperative verbs for buttons (Create, Add, Delete, Save, Cancel). See `.cursor/rules/content-guidelines.md` for full rules.

### 6. Component Creation Standards

Use forwardRef, CSS Modules with camelCase, focus styles, keyboard navigation. See `.cursor/rules/design-system.md` for the full spec.

## Mock Data

Import from `@/mocks` for realistic content in prototypes.

## Rules Reference

See `.cursor/rules/_orchestration.md` for tier classification (Tier 0–3) and rule file loading.

## Pre-Flight Checklist

Apply the conventions above + verify `npm run build` passes before finishing a prototype.

## Git Workflow

Standard fork-and-pull-request flow: fork the repo, create a feature branch (`feat/*`, `fix/*`, `chore/*`), commit your work, and open a pull request. Keep your own prototype entries in `registry-mine.ts`.
