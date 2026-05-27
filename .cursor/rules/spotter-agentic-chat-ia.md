---
description: Information architecture for the embedded Spotter agentic chat — used inside Spotter Model, Spotter Viz, and Spotter Code surfaces. Documents the canvas + chat split, shared patterns, and per-mode differences. Loads alongside spotter-components.md and spotter-logic.md.
globs: ["src/prototypes/*Model*/**", "src/prototypes/*Viz*/**", "src/prototypes/*Code*/**", "src/prototypes/_agentic/**"]
alwaysApply: false
---

# Spotter — Agentic chat IA (embedded surfaces)

> Embedded Spotter is the **canvas + side-chat** pattern used by Spotter Model, Spotter Viz, and Spotter Code. The chat panel is a passenger inside a larger product surface — not the full page. For the standalone full-page chat, see `spotter-ia.md`.

Last updated: 2026-05-18.

---

## The shared pattern — canvas + chat

All three embedded modes share the same high-level frame:

```
GlobalHeader (light)
ProductShell                                    ← varies per mode
├── Canvas (left, dominant)                     ← the work area
│   └── Mode-specific UI (schema editor, viz, IDE-like surface)
└── AgentPanel (right, secondary)               ← chat passenger
    ├── ChatThread
    │   ├── MessageRow (UserBubble / AgentMessage)
    │   ├── ReasoningBlock + AgentResponseBlock
    │   └── TypingIndicator
    └── SpotterPrompt                           ← anchored at bottom of panel
```

**Why share the chat:** all three are agentic surfaces. The chat patterns (state machine, streaming, reasoning, blocks) are identical to standalone Spotter — they come from `@spotter/chat`. What changes between modes is the **canvas**, not the chat.

**Reuse:** `_agentic/` (`AgentPanel`, `AgentMessage`, `ReasoningBlock`, etc.) was the predecessor pattern. New embedded surfaces should use `@spotter/chat` and `@spotter/page` directly; `_agentic/` is the legacy entry point still used inside DataModelEditor.

---

## Shared behaviours (apply to all three modes)

1. **Provider scope.** Wrap the embedded surface in `SpotterChatProvider`. The provider lives at the prototype root so the agent panel can call `useSpotterChat()`.
2. **Canvas commands chat, chat commands canvas.** A user can act on the canvas, and the agent reacts in chat. The agent's suggestions can update the canvas (e.g., add a join, change a chart). The two surfaces speak to each other through prototype-local state — not through the chat reducer.
3. **Streaming preserved.** Reasoning chunks + response blocks stream the same way as standalone. Don't strip the reasoning trace just because the surface is smaller — collapse it by default instead.
4. **Welcome state inside the panel.** When the chat is empty, render a slim panel-internal welcome. Don't push the canvas around to make room for a full hero.
5. **Panel resize / collapse.** The chat panel should be resizable. Provide a collapse affordance so the canvas can take the full width when the user wants to focus on it.

---

## Mode 1 — Spotter Model (embedded, built)

**Use case:** Build and refine a SpotterModel — tables, joins, columns, formulas. Agent assists with schema suggestions.

**Canvas:** `_datamodel/` components (`TableCanvas`, `ColumnTree`, `JoinConnector`) — visual schema editor with 6 tabs (Tables / Columns / Formulas / Filters / Parameters / Settings).

**Chat panel role:**
- Propose joins based on canvas selection
- Suggest column derivations
- Read the canvas state to ground answers

**Live in:** `src/prototypes/DataModelEditor/`

**Detailed reference:** `data-model-editor-ia.md`, `data-model-editor-components.md`, `data-model-editor-interactions.md`.

---

## Mode 2 — Spotter Viz (embedded, planned)

**Use case:** Visualization agent for instant dashboards — turn business questions into trusted, decision-ready dashboards. The agent generates viz, the user refines, the result lands in a Liveboard tile.

**Canvas:** Liveboard surface (tiles, the canvas engine from `liveboard-canvas-*.md`). The Spotter Viz panel sits beside a Liveboard, generating tiles into it.

**Chat panel role:**
- Accept a business question
- Generate a viz preview (chart type, fields, breakdown)
- Refine via follow-ups
- Commit the result as a Liveboard tile

**Live in:** `src/prototypes/*Viz*/` (path convention pending — confirm when first prototype lands)

**Status:** Not built. Document the IA, components, and behavior here as design lands. Once built, also see `liveboard-ia.md` for the host surface.

**Open questions:**
- Does the Viz panel attach to a single Liveboard or float between Liveboards?
- Multi-tile generation in one turn, or one tile per turn?
- Where does the viz preview render before commit — inside the chat panel or as a draft tile on the Liveboard?

---

## Mode 3 — Spotter Code (embedded, planned)

**Use case:** Developer-facing code generation for embedded analytics. Turn embedded analytics requirements into production-ready code directly in the IDE — less time wrestling with SDKs and authentication, more time shipping product value.

**Canvas:** IDE-like surface. File tree on the left, code editor in the middle, agent panel on the right. (Path convention pending — confirm when first prototype lands.)

**Chat panel role:**
- Accept a feature request ("embed a Liveboard with single-sign-on")
- Read the file context
- Generate code in the editor (insertions, replacements)
- Explain SDK choices and authentication wiring

**Status:** Not built. Document the IA, components, and behavior here as design lands.

**Open questions:**
- Which IDE primitives are needed? (file tree, tabs, code editor, terminal pane?)
- Diff preview for agent-proposed edits?
- Do we use an existing code-editor component (Monaco, CodeMirror) or build one?

---

## Future — Spotter in Liveboard

A separate scenario where Spotter sits **inside** a Liveboard (not alongside it). Different behaviour entirely from Spotter Viz:

- Spotter Viz = chat surface that *generates* Liveboard tiles
- Spotter in Liveboard = chat surface *invoked from* a Liveboard tile or filter, asking follow-up questions about an existing answer

**Status:** Coming soon. Not implemented. Document the design here when it lands.

**Open questions:**
- Entry points (which tile actions invoke it? which filters?)
- Modal vs side-panel vs inline
- Scope of conversation (single tile vs whole Liveboard)

---

## Cross-references

- **Standalone Spotter IA:** `spotter-ia.md`
- **Components:** `spotter-components.md`
- **State machine / streaming:** `spotter-logic.md`
- **Voice and block usage:** `spotter-response-style.md`
- **Scaffolding a new embedded Spotter prototype:** `spotter-scaffolding.md`
- **DataModelEditor reference:** `data-model-editor-ia.md`
- **Liveboard host surface:** `liveboard-ia.md`
