# Data Studio — Getting Started

Welcome. This doc orients you before you touch anything.

---

## What this is

**Data Studio** is ThoughtSpot's unified workspace for the full data model lifecycle. Data teams use it to connect warehouse sources, build AI-ready models, test and improve them, cache data for performance, and monitor for drift — all in one place.

It is agent-first. The primary interaction is a conversation with an agent that handles the heavy work. Data teams direct; the agent executes.

The central object is a **model**. Not a project, not a dataset.

For the full product direction, read `product.md`.

---

## The prototype

This is the current working state of the product — not a throwaway exploration.

**Branch:** `prototype/data-studio` on `origin` (vivek-sahi/radiantplay on galaxy)  
**Live:** https://radiantplay-nine.vercel.app/playground/DataStudioV2  
**Stack:** React 19 + TypeScript + Vite 7

```bash
npm run dev      # start dev server
npm run build    # verify before finishing a session
```

New file additions require a dev server restart — HMR alone won't pick them up.

---

## What's built

Open the prototype — it is the source of truth: https://radiantplay-nine.vercel.app/playground/DataStudioV2

---

## Files to read

| File | When to read |
|------|-------------|
| `product.md` | First — product direction, mission, key decisions |
| `CONTEXT.md` | Every session — current build state, what's partial |
| `CLAUDE.md` | Every session — session protocol, hard rules |
| `design-system.md` | Before building any UI — Radiant component cheat sheet |
| `reference.md` | When touching `mockData.ts`, routing pipeline, or `ProjectState` |

---

## How to work

Before starting any task, classify it on two dimensions:

**Scale:** Small (≤2 files, no new component) · Medium (new component or interaction) · Large (new product area or user journey)

**Novelty:** Known (extends something already built) · New (first time this problem is touched)

| | Known | New |
|---|---|---|
| **Small** | Build directly | Check prior decisions first |
| **Medium** | Check prior decisions, then build | Write a research doc first |
| **Large** | Research + explore before committing | Full process: understand → research → explore → build |

---

## Hard rules

- **Always work on `prototype/data-studio`** — never on `main`
- **Push to `origin` only** — never to `upstream` (mohammed-faris/radiantplay)
- **Never invent mock data** — all table and column names come from `mockData.ts`
- **Never add prototype components to `src/components/`** — DataStudio components go in `src/prototypes/DataStudioV2/components/` only
- **Never restructure the routing pipeline** without asking — highly interdependent, breaks silently
- **Always run `npm run build`** before marking a session complete
- **WorkflowDirectory** is cosmetic — do not wire without an explicit decision
