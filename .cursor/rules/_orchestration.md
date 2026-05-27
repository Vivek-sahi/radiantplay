---
description: Master orchestration — classifies every task by intent and loads only the rule files needed. Keeps context lean for minor work, full for builds.
globs: ["src/**/*.tsx", "src/**/*.ts", "src/**/*.css"]
alwaysApply: true
---

# Radiant Rules Orchestration

Classify by intent, then load only what's needed. Use semantic meaning — "make the grid responsive" is a layout concern even without the word "dashboard."

> **Claude Code users:** These rules are also available as auto-activating skills in `.claude/skills/`. The skill system handles loading automatically based on file globs — you may not need to manually read rule files.

---

## Step 0: Exploratory check

If `/explore` was invoked → suspend Radiant constraints for that scope.
If a file has `// @explore:` but `/explore` was NOT invoked → ask: "Continue in exploratory mode or return to Radiant compliance?"
Otherwise → proceed to Step 1.

## Step 0b: Context budget check

Before loading any files, check if a topic switch is happening. Natural boundaries:
- A full prototype was just completed and the next request is unrelated
- Switching from building → analysis, or analysis → building
- Starting a new feature after shipping the previous one
- Session has covered 3+ distinct tasks

If a topic switch is detected → proactively say:
*"Before we start — this is a good point to run `/compact`. It resets the session context and significantly reduces cost on the 1M model. Run it now and come back with the new request."*

Do not wait to be asked. Do not load any rule files until after the designer decides.

## Step 0c: MCP plugin overhead check

MCP plugins add a fixed overhead to every message in the session, whether they are used or not. The Figma MCP plugin alone adds **~4,000 tokens per message** — on a 20-message session that is ~80,000 tokens of overhead before any rule file gets loaded.

If the current session is not doing Figma work and the Figma plugin is enabled, suggest disabling it:

> *"Heads up — Figma MCP is on and adding ~4k tokens per message. If we are not pulling from Figma this session, you can disable it via `/config` or by setting `"figma@claude-plugins-official": false` in `~/.claude/settings.json`. Re-enable when starting a Figma session."*

Do not nag once per session — say it once if the signal is clear (no Figma URL or screenshot in the last few exchanges) and let the designer decide.

---

## Step 1: Classify by intent

### Tier 0 — Minor tweak
Single value, prop, or label. CLAUDE.md + component summary are sufficient. No additional files.

**Signals:** Fix a value · rename/reorder an element · adjust alignment/padding · fix a build error · toggle a prop · swap a variant · wrap with Tooltip or Horizontal · ≤2 files, no new components

**Response style:** One sentence. No preamble.

**Figma at Tier 0:** Single-value lookup only. Raw hex/screenshot → `figma-component-mapping.md`. Figma URL → `figma-mcp-workflow.md` + `figma-component-mapping.md`. Do not escalate to Tier 1.

---

### Tier 1 — Moderate change
Adding or modifying a feature within an existing prototype.

**Signals:** New section, panel, or interaction · replacing a component · adding a modal/dialog/confirmation · adding a table/filter/search · layout structure change · rewriting multiple UI strings · copy review or UX writing task (even with no code changes)

**Action:** Load **ALL** rule files matching the task's concerns below. Matching 3+ rows is expected for compound tasks.

**Shared component audit:** If the implementation imports from `src/components/`, read its `.module.css` first. If it contains `!important`, gradients, or hardcoded hex — fix it before using it (apply Tier 3 rules to that file).

| Concern | Rule file | Semantic triggers |
|---------|-----------|-------------------|
| **Page structure** | `layout-patterns.md` | Layout, sidebar, header, grid, responsive, dashboard, content areas |
| **Interactive widgets** | `widget-patterns.md` | Tables, alerts, toasts, menus, tooltips, empty states, date pickers, action menus, delete flows |
| **Data table / list** | `component-inventory.md` | Any table of rows, object list, data grid — check if Radiant `Table` covers the need before building custom |
| **Interactive element** | `component-inventory.md` | Toggle, switch, status indicator, checkbox, radio, segmented control — check component-inventory before building custom |
| **Modals & dialogs** | `modal-patterns.md` | Any overlay — confirmation, wizard, form modal, filter dialog, multi-step flow |
| **State handling** | `interaction-patterns.md` | Loading spinners, skeletons, error states, disabled controls, transitions |
| **Component details** | `component-inventory.md` | Need full props, code examples, or checking if a specific component exists |
| **Token deep-dive** | `token-usage.md` | Full color scale, component tokens, CSS variable names, anti-pattern reference |
| **UX copy** | `content-guidelines.md` | Writing/changing buttons, titles, labels, errors |
| **ThoughtSpot terms** | `product-knowledge.md` | Answer, Liveboard, SpotIQ, Worksheet, Monitor |
| **Figma URL** | `figma-mcp-workflow.md` + `figma-component-mapping.md` | `figma.com/design/...` URL provided |
| **Figma screenshot** | `figma-component-mapping.md` | Screenshot or Figma layer reference |
| **Liveboard work** | `liveboard-ia.md` | Editing or adding to an existing Liveboard prototype |
| **Liveboard styling panel** | `liveboard-styling.md` | Style button in edit toolbar, add styling panel, density controls, color themes, tile highlights, dark palette, corner radius, spacing mode, per-tile overrides, style drawer |
| **Liveboard canvas (view)** | `liveboard-canvas-core.md` | Grid system, tile types, view mode, chart palette |
| **DME structure / IA** | `data-model-editor-ia.md` | Editing layout variants, tabs, welcome state, or window bridge of an existing DME |
| **DME components / agent panel** | `data-model-editor-components.md` | Modifying `_agentic` or `_datamodel` components used by DME (AgentPanel, TableCard, ColumnTree, etc.) |
| **DME interactions / agent flow** | `data-model-editor-interactions.md` | Drag, column tree, agent panel flow, version history on existing DME |
| **AI agent panel (any prototype)** | `data-model-editor-components.md` + `data-model-editor-interactions.md` | Adopting `_agentic` panel in a non-DME prototype |
| **Liveboard canvas (edit)** | `liveboard-canvas-core.md` + `liveboard-canvas-edit.md` | Drag, resize, selection, toolbars |
| **Liveboard canvas (full)** | All 3 canvas tiers + `liveboard-canvas-advanced.md` | Groups, multi-select, inline editing |
| **Liveboard build** | `liveboard-ia.md` + `liveboard-scaffolding.md` + canvas tiers (see Liveboard Requirements Gate below) | Building a new Liveboard from scratch |

---

### Tier 2 — Full prototype build
New prototype from scratch or substantially rebuilding an existing one.

**Signals:**
- Task requires a new route/page that doesn't exist yet
- Result will be a standalone prototype (not a section within an existing one)
- User references an existing prototype as a template ("similar to X", "like X but for")
- Complete page, multi-view flow, or full-screen experience
- Scaffolding a new prototype folder
- Figma URL or screenshot describing a full page

**Litmus test:** If the end result is a new file in `src/prototypes/`, it's Tier 2.

**Mandatory files:**
- `prototype-generation.md` — step-by-step build workflow, visual verification loop
- `component-inventory.md` — full component reference with props and examples

**Add based on content:** Liveboard → run Liveboard Requirements Gate (see below) · New folder → `prototype-structure.md` · Substantial copy → `content-guidelines.md` · Complex tokens → `token-usage.md`

**Post-build:** After completing a Tier 2 build, suggest `/compact` before continuing — full prototype builds saturate context and the next task benefits from a clean slate.

---

### Tier 3 — Design system work
Creating or modifying a shared component in `src/components/`.

**Signals:** Target file is in `src/components/` · "Add a component to the design system" · Modifying component API, props, or accessibility

**Load:** `design-system.md` · `component-inventory.md` · `token-usage.md` · `content-guidelines.md`

---

## Step 2: Pre-implementation gate

**Before writing any code**, answer these 4 questions:

**1. New UI element?**
Check `component-summary.md` — does a Radiant component exist for this?
If unsure → load `component-inventory.md` before deciding to build custom.

**2. Using `src/components/`?**
Read its `.module.css` — if it has `!important`, gradients, or hardcoded hex → fix first (Tier 3).

**3. Using an icon?**
Verify the name exists in `component-summary.md` icon list.
Valid sizes: `xs` · `s` · `m` · `l` — no `xl`, no numeric values.
Always pass `iconPosition="leading"` or `"trailing"` when using the `icon` prop on Button.

**4. Any UI text?**
Load `content-guidelines.md` before writing OR reviewing any labels, buttons, titles, body copy, or error messages. Do not rely on CLAUDE.md alone — the full rules are in the guidelines file.

---

## Liveboard Requirements Gate

When the task is a **new Liveboard prototype** (Tier 2), BEFORE loading any liveboard canvas rules, ask the user:

1. **Mode** — View-only (read-only dashboard), or edit mode with drag/resize?
2. **Styling panel** — Does edit mode need a styling panel (density, color themes, per-tile highlights)? If yes, load `liveboard-styling.md`.
3. **Interactions** — Which do you need?
   - Drag and drop tiles
   - Resize tiles
   - Group tiles (mini-liveboard inside a container)
   - Inline title/description editing
   - Multi-select and bulk actions (shift+click)
   - SpotterViz panel
   - Filter bar
3. **Tile types** — KPI, charts, notes, groups?
4. **Data** — Mock data or specific dataset?

Based on answers, load ONLY the needed canvas tiers:

| User needs | Canvas files loaded | Total canvas lines |
|-----------|--------------------|--------------------|
| View-only dashboard | `liveboard-canvas-core.md` | ~250 |
| Edit mode (basic drag/resize) | `canvas-core` + `liveboard-canvas-edit.md` | ~500 |
| Full canvas with groups/multi-select | `canvas-core` + `canvas-edit` + `liveboard-canvas-advanced.md` | ~570 |

Always load `liveboard-ia.md` + `liveboard-scaffolding.md` alongside the canvas tiers.

**Skip the gate** for Tier 0/1 tasks (minor tweaks, modifications to existing Liveboards). Only gate Tier 2 new builds.

---

## Data Model Editor Requirements Gate

When the task is a **new Data Model Editor prototype** (Tier 2), BEFORE loading any DME rule files, ask the user:

1. **Starting state** — Blank canvas (`welcomeVariant: 'blank'`) or pre-loaded schema (`welcomeVariant: 'existing'`)?
   - `'blank'` → empty canvas, "Let's build your model" welcome intro with central textarea
   - `'existing'` → pre-populated tables/joins, "Welcome back" + "Check for AI readiness" button
2. **SpotterModel AI?** — Yes or No.
   - **If Yes:** Ask for the Anthropic API key. Write `ANTHROPIC_API_KEY=<key>` to `.env.local`. Then ask model preference:
     - `claude-sonnet-4-6` — balanced speed and quality **(default, recommended)**
     - `claude-opus-4-7` — most capable, slower and more expensive
     - `claude-haiku-4-5-20251001` — fastest and cheapest
     Update the `model` field in `window.__DME_CONFIG__` in `index.tsx`. `init-dme.js` reads it via `window.__DME_CONFIG__?.model`.
   - **If No:** Set `window.__DME_CONFIG__ = { spotterModel: false, welcomeVariant: 'blank' }` in `index.tsx`. Agent panel will not render. No API key needed.
3. **Dataset** — Mock retail schema (default `DATASOURCE_TABLES` — 12 tables) or custom?
   - **If custom:** Replace the `DATASOURCE_TABLES` array in the init file with the user's schema (`{ name, columns: string[] }[]`).

Based on answers, load:

| User needs | Files to load |
|-----------|--------------|
| Any DME work | `data-model-editor-ia.md` + `data-model-editor-components.md` |
| SpotterModel Yes | also `data-model-editor-interactions.md` |
| SpotterModel No | skip interactions file (agent panel not used) |

**Skip the gate** for Tier 0/1 tasks (minor tweaks or edits to existing DME prototypes). Only gate Tier 2 new builds.

---

### Spotter Requirements Gate

When the task is **a new Spotter-flavoured prototype** (Tier 2), BEFORE loading any Spotter rule files, ask the user:

1. **Which Spotter mode?**
   - **Standalone** — Full-page agentic chat (canonical Spotter, like `src/prototypes/Spotter/`)
   - **Spotter Model (embedded)** — Canvas + chat for data-model editing (like `DataModelEditor`)
   - **Spotter Viz (embedded)** — Canvas + chat for visualization / dashboard generation
   - **Spotter Code (embedded)** — Canvas + chat for code generation in an IDE-like surface
2. **Welcome state** — `blank` (first prompt hero, current default), `returning` (recent chats list), `topical` (model-aware), `guided` (starter questions), or `embedded` (no welcome — drop into chat)?
3. **Data** — Mock fixtures from `cannedResponses.ts` (default), or a custom canned dataset?

Based on answers, load:

| Mode | Files to load |
|---|---|
| Any Spotter work | `spotter-components.md` + `spotter-logic.md` + `spotter-response-style.md` + `spotter-scaffolding.md` |
| Standalone | also `spotter-ia.md` |
| Embedded (Model / Viz / Code) | also `spotter-agentic-chat-ia.md` |
| Embedded Model specifically | also `data-model-editor-ia.md` + `data-model-editor-components.md` |
| Embedded Viz | also `liveboard-ia.md` (host surface) |
| Embedded Code | none extra (IDE conventions are TBD) |

Globs auto-attach the inventory / logic / style rules when the active file is in `src/spotter/**` or `src/prototypes/Spotter*/**`. The IA / scaffolding rules need to be loaded explicitly per the table above.

Spotter sits **on top of** the Radiant DS. Tier 3 design-system work that touches Spotter components also needs the Radiant rules (`design-system.md`, `token-usage.md`).

**Skip the gate** for Tier 0/1 tasks (minor tweaks or edits to existing Spotter prototypes). Only gate Tier 2 new builds.

**Reference docs:**
- `docs/spotter-roadmap.md` — resume-here tracker, status per mode, open work
- `docs/2026-05-07-spotter-answer-card.md` — AnswerCard spec (unbuilt; VizBlock is the current stand-in)
- `docs/2026-05-07-spotter-viz-block-behaviour.md` — VizBlock slot model and behaviour
- `docs/archive/2026-05-07-spotter-ds-plan.md`, `*-prototype-shell.md`, `*-chat-extraction.md` — historical scaffolding plans, work is done

---

## Iteration loop detection

If the designer sends 3+ sequential single-property change requests ("make it bigger" → "center it" → "change the color"), suggest batching:
*"If you have other visual tweaks, send them all in one message and I'll apply them together — it's significantly cheaper than one-at-a-time."*

Do not block the current request — apply it, then suggest batching for future tweaks.

---

## MCP tool overhead awareness

Every connected MCP tool adds token overhead to every message, even when idle. Figma MCP alone adds ~4,000 tokens per message.

When classifying a task:
- If the task has **no Figma concern** and Figma MCP is connected → note the overhead but do not block work.
- When a Figma URL is provided → use the structured data path (`get_metadata` first for a lightweight map, then `get_design_context` for specific components) rather than pulling entire pages. The structured path is 30-50% more efficient than screenshots.

---

## Session memory

If a rule file is already in context from an earlier message, **do not re-read it.** Only load new files when the concern changes or escalates. Suggest `/compact` when switching between unrelated tasks.

---

## Rule file integrity

Before using a code example from any rule file, verify it matches the component interface. Known broken patterns to watch for:
- `<Button icon="x" />` without `iconPosition` → icon won't render
- `<Icon size="xl" />` → `xl` is not a valid size
- `<Alert variant="section" buttonText="..." />` → `buttonText` only works in `variant="page"`

If an example conflicts with the component's TypeScript interface, trust the source file over the example.

---

## Key rules (always apply, no file needed)

1. **Never hardcode** — colors, spacing, fonts always from tokens
2. **Use Radiant components** — no raw `<button>`, `<input>`, `<table>`, `<select>`
3. **Layout primitives** — `Horizontal`/`Vertical`/`View` not inline flex; `Grid`/`RdGrid` not inline grid
4. **Local components** — prototype-specific in `src/prototypes/<Name>/components/`, not `src/components/`
5. **Sentence case** — all UI text, imperative verbs for buttons
6. **Mock data** — import from `../../mocks` for realistic content
