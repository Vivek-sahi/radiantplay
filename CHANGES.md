# Branch changes: feat/data-model-editor

This document summarises everything included in this branch for reviewer reference.

---

## Overview

This branch adds the **Data Model Editor** prototype to the core RadiantPlay gallery, promotes it from the designer's personal registry to the shared sample registry, and introduces two supporting shared component libraries (`_agentic`, `_datamodel`). It also enhances the `OverlayLoading` design system component with new variants, and adds an Anthropic API proxy for the AI agent panel.

---

## 1. DataModelEditor prototype

**Location:** `src/prototypes/DataModelEditor/`

An interactive canvas-based data model editor with an AI-powered SpotterModel agent panel. Users can add tables from a source schema, draw join relationships, and converse with an AI agent to get table, join, column, and formula suggestions.

| File | Description |
|------|-------------|
| `index.tsx` | Entry point. Sets `window.__DME_CONFIG__` inside the component body (not at module level — this prevents stale config when navigating between prototypes). |
| `DataModelEditor.tsx` | Main React component (~380 lines). Manages tab navigation, left pane (tables/columns), canvas area, and agent panel wiring via `window.*` bridge functions. |
| `init-dme.js` | Vanilla JS DOM orchestration layer. Handles click handlers, drag interactions, AI request dispatch to `/api/chat`, response parsing, and bridging back to React state via `window._set*` callbacks. |
| `dme.css` | Prototype-scoped global CSS. All class names are prefixed with `.sm-root`, `.app-header`, etc. to avoid collisions with other components. |

### Configuration (`window.__DME_CONFIG__`)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `spotterModel` | `boolean` | `true` | Show the AI agent panel on the right |
| `welcomeVariant` | `'blank' \| 'existing'` | `'existing'` | `blank` = empty canvas with creation welcome; `existing` = pre-populated retail schema |
| `model` | `string` | `'claude-haiku-4-5-20251001'` | Claude model ID used for AI responses |

---

## 2. _agentic — shared AI agent panel module

**Location:** `src/prototypes/_agentic/`  
**Import:** `import { AgentPanel, ... } from '../_agentic'`

| Component | Description |
|-----------|-------------|
| `AgentPanel` | Root panel component. Owns `messages` state and routes between the welcome view and chat view. Accepts `welcomeVariant: 'blank' \| 'existing'`. |
| `AgentMessage` | Single chat message row wrapping user bubbles or agent response blocks. |
| `AgentResponseBlock` | Structured agent response — headline, body text, and optional action surfaces. |
| `ConfidenceBadge` | Pill showing AI confidence percentage (e.g. "94%"). |
| `JoinDiagram` | Mini two-table join visualisation shown inside agent suggestions. |
| `NextActionChips` | Horizontal row of quick-reply chips for suggested follow-up actions. |
| `ReasoningBlock` | Collapsible block showing the AI's reasoning/thinking steps. |
| `SuggestionCard` | Checkbox-list card for table, join, column, or formula suggestions. Accepts `onAdd` callback; `onRefine` is optional (placeholder UI). |
| `ToolcallCard` | Displays a tool invocation made by the AI agent (name + arguments). |
| `TypingIndicator` | Animated "Analysing…" dots shown while the agent is generating a response. |
| `UserBubble` | Right-aligned user message bubble. |
| `VersionCard` | Card showing a schema version snapshot with restore action. |
| `types.ts` | Shared TypeScript unions: `MessageItem`, `ResponseData`, `SuggType`, etc. |

---

## 3. _datamodel — shared canvas layer module

**Location:** `src/prototypes/_datamodel/`  
**Import:** `import { TableCanvas, ColumnTree } from '../_datamodel'`

| Component | Description |
|-----------|-------------|
| `TableCanvas` | Div/SVG canvas rendering draggable table cards and join connectors. Calls `onTableDragEnd(name, x, y)` on drag end. |
| `JoinConnector` | Orthogonal SVG path drawn between two table cards, with a join-type badge at the midpoint. |
| `TableCard` | Individual table node on the canvas — displays table name, total columns, and added column count. |
| `ColumnTree` | Left-pane tree view: accordion of tables and their columns. Unadded columns are draggable to the canvas (`dataTransfer` type: `application/x-spotter-column`). |

---

## 4. OverlayLoading — component enhancements

**Location:** `src/components/OverlayLoading/`

Two new props added. Fully backward-compatible — existing usages with no props continue to render the spinner as before.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'spinner' \| 'dots'` | `'spinner'` | Switches between the original SVG spinner and a new 3-dot wave animation |
| `label` | `string` | — | Optional loading label; takes precedence over the legacy `text` prop (`label ?? text`) |

**New CSS added (`OverlayLoading.module.css`):**
- `.dots` — flex wrapper for the dot row
- `.dot` — individual 8×8px circle using `--rd-sys-color-content-brand`
- `@keyframes dotWave` — wave animation with staggered delays (0s / 0.2s / 0.4s)

---

## 5. API proxy — Anthropic `/api/chat`

The DataModelEditor agent panel calls `/api/chat` to communicate with Claude.

| Environment | Handler | Notes |
|-------------|---------|-------|
| Local dev (`npm run dev`) | Vite plugin middleware in `vite.config.ts` | Proxies POST requests to `https://api.anthropic.com/v1/messages` |
| Vercel staging / production | `api/chat.ts` serverless function | Same proxy logic, deployed automatically by Vercel |

**Required:** `ANTHROPIC_API_KEY` must be set in `.env.local` for local dev, and in the Vercel project environment variables for staging/production. The key is never committed — `.env.local` is gitignored.

---

## 6. Registry change

DataModelEditor has been moved from the designer's personal registry to the core sample registry.

| Before | After |
|--------|-------|
| `registry-mine.ts` — `section: 'mine'` | `registry-core.ts` — `section: 'sample'` |

`registry-mine.ts` is now an empty array, ready for future designer prototypes.

---

## 7. Static assets

| Location | Contents |
|----------|----------|
| `public/spotter-assets/` | 25 SVG + 1 PNG: UI icons (drag handle, chevron, checkmark, AI icon, join line, Snowflake logo, ThoughtSpot logo, user avatar, table icon) and 2 empty-state illustrations |
| `public/spotter-fonts/` | Plain typeface: `Plain-Light.otf`, `Plain-LightIta.otf`, `Plain-Medium.ttf`, `Plain-Regular.otf` |
| `src/prototypes/thumbnails/DataModelEditor.svg` | Gallery card thumbnail |

---

## 8. Tooling and rules

| File | Change |
|------|--------|
| `.claude/commands/new-prototype.md` | Added Data model editor discovery questions and DME scaffold flow |
| `.claude/commands/switch-model.md` | New command for switching Claude model in AI prototypes |
| `.claude/commands/check-upstream.md` / `explore.md` / `radiant-check.md` / `sync-upstream.md` | Updated descriptions and frontmatter |
| `.cursor/rules/_orchestration.md` | Added DME requirements gate for Tier 2 builds |
| `.cursor/rules/data-model-editor-ia.md` | IA and layout rules for the DME agent panel |
| `.cursor/rules/data-model-editor-components.md` | Component usage rules for DME |
| `.cursor/rules/data-model-editor-interactions.md` | Interaction pattern rules for DME |
| `scripts/status.sh` | Added untracked-file badge to the local status dashboard |

---

## Setup for reviewers

To test the agent panel locally:

1. Add your Anthropic API key to `.env.local` at the project root:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
2. Run `npm run dev`
3. Open the gallery and click **Data model editor** (under "Sample prototypes")
4. The AI agent panel is on the right — type a message to start

The default model is `claude-haiku-4-5-20251001`. To use Sonnet, set `model: 'claude-sonnet-4-6'` in `window.__DME_CONFIG__` in `src/prototypes/DataModelEditor/index.tsx`.
