# Spotter DS plan (2026-05-07)

Plan for bringing Spotter components, logic, and response style into Radiant Play, and for making sure the right context auto-loads when working on a Spotter surface.

## Goal

Spotter is ThoughtSpot's agentic analytics product. Today the design system covers it only partially (some agentic chat patterns inside `_agentic`, no answer or runtime UI). This plan turns Spotter into a first-class library inside Radiant Play, layered on top of Radiant DS, with its own components, logic, response conventions, and AI rules.

Two parallel tracks:

1. **Library track.** Build out `src/spotter/` so any prototype, page, or runtime renderer can pull Spotter blocks the same way it pulls Radiant primitives.
2. **Context track.** Set up `.cursor/rules/spotter-*.md` so AI assistants (Cursor, Claude Code) load Spotter components, logic patterns, and response style automatically when work touches a Spotter file.

## Status today (2026-05-07)

Done on `feat/spotter-ds`:

- `src/spotter/` scaffolded with subfolder shell: `chat/`, `answer/`, `viz/`, `page/`, `runtime/`. Empty barrels in each.
- `@spotter` alias wired in `vite.config.ts` and `tsconfig.json`.

Existing Spotter-flavored work in repo (not yet migrated):

- `src/prototypes/_agentic/` — 12 components (AgentPanel, AgentMessage, AgentResponseBlock, UserBubble, TypingIndicator, ConfidenceBadge, ReasoningBlock, SuggestionCard, ToolcallCard, JoinDiagram, NextActionChips, VersionCard) plus `types.ts`.
- `src/prototypes/MiniSpotters/` — bounded-context Spotters with simulated chat panel.
- `src/prototypes/SpotterMemory/` — Memory Sources object table.
- `src/prototypes/DataModelEditor/` — full agent loop using `/api/chat` proxy.

## Architecture (recap)

Two-layer DS, stacked.

```
Radiant DS  (src/components/, src/tokens/)   product-agnostic primitives
   ↑
Spotter DS  (src/spotter/)                   domain blocks for Spotter surfaces
   ↑
Surfaces    (src/prototypes/, src/pages/)    consume both
```

Rule of thumb: if the concept exists outside Spotter, it belongs in Radiant. If it only makes sense when Spotter is involved, it belongs in Spotter DS.

## Library track

### Phase 1. Component inventory and naming

Lock the full Spotter block list across all five subdomains before moving any code. Output: a single inventory doc with name, subdomain, props sketch, and source (new vs. migrated from `_agentic`).

Subdomain guide:

- **chat/** — ChatThread, ChatMessage, UserBubble, AgentMessage, TypingIndicator, ReasoningBlock, SuggestionCard, NextActionChips, ToolcallCard.
- **answer/** — AnswerCard, AnswerHeader, SourcesPanel, FollowUpRail, ConfidenceBadge, FeedbackBar (thumbs + comment).
- **viz/** — AnswerViz (chart + table swap), DrillPanel, ColumnPicker, FilterChips.
- **page/** — SpotterShell (chat + answer pairing), SpotterHeader, SpotterEmpty.
- **runtime/** — SpotterRenderer (response shape to component), blockRegistry, schema types.

### Phase 2. `_agentic` migration

Map each `_agentic` component to its Spotter DS home. Decide rename vs. keep. Move file by file with imports updated. Keep `_agentic` alive until DataModelEditor and MiniSpotters are switched over, then delete.

Tentative mapping:

| `_agentic` | Spotter DS |
|---|---|
| AgentPanel | page/SpotterShell (refactor) |
| AgentMessage | chat/AgentMessage |
| AgentResponseBlock | answer/AnswerCard (extract) |
| UserBubble | chat/UserBubble |
| TypingIndicator | chat/TypingIndicator |
| ConfidenceBadge | answer/ConfidenceBadge |
| ReasoningBlock | chat/ReasoningBlock |
| SuggestionCard | chat/SuggestionCard |
| ToolcallCard | chat/ToolcallCard |
| JoinDiagram | viz/JoinDiagram |
| NextActionChips | chat/NextActionChips |
| VersionCard | page/VersionCard |

This is a starting mapping, not final. Lock during Phase 1 inventory.

### Phase 3. Net-new components

Anything in the Phase 1 inventory that does not come from `_agentic`. Build greenfield using Radiant primitives. Each component follows Radiant component standards (forwardRef, CSS Modules camelCase, focus styles, keyboard nav, tokens only).

### Phase 4. Runtime renderer

The piece that makes Spotter responses render arbitrary UI. Three parts:

- **schema.ts** — types for Spotter response blocks (text, viz, table, suggestion, citation, follow-up).
- **blockRegistry.ts** — map block type to Spotter component.
- **SpotterRenderer.tsx** — walks a response, picks blocks, renders.

This is the bridge between the API response shape and the Spotter DS visual vocabulary.

### Phase 5. First Spotter prototype

A real consumer at `src/prototypes/Spotter/` that exercises the full kit: chat thread, answer card, sources, follow-ups, runtime-rendered viz. Validates the API and surfaces gaps before locking the library shape.

## Context track

Goal: when an AI assistant edits a file under `src/spotter/**`, `src/prototypes/Spotter*/**`, or any file that imports `@spotter`, the assistant loads Spotter conventions automatically and produces responses that match Spotter's voice and structure.

Mechanism: dedicated `.cursor/rules/spotter-*.md` files with `globs` frontmatter. These auto-attach in Cursor and Claude Code skill mode. Three rule files:

### `.cursor/rules/spotter-components.md`

- Inventory of every Spotter block, grouped by subdomain.
- Props summary, when to use, what Radiant primitive it wraps.
- Forbidden patterns (do not reach into `src/components/spotter/`, that path does not exist).
- Globs: `src/spotter/**`, `src/prototypes/Spotter*/**`.

### `.cursor/rules/spotter-logic.md`

- Conversation state machine (idle, asking, thinking, streaming, answered, errored).
- Async patterns for `/api/chat` calls. Streaming protocol expectations.
- Message schema (id, role, content blocks, timestamps, parent message id for threading).
- Tool call lifecycle. Reasoning trace handling.
- Error and retry conventions.
- Globs: `src/spotter/**`, `src/prototypes/Spotter*/**`, files that import `@spotter`.

### `.cursor/rules/spotter-response-style.md`

- How a Spotter answer should be structured: lead with the answer, support with viz, cite sources, offer follow-ups.
- Voice: direct, sentence case, no preamble, no hedging.
- Confidence framing rules (when to show, when to hide).
- Citation format. Source pill placement.
- Empty state, no-answer state, ambiguity state.
- Globs: same as spotter-logic.

### Orchestration entry

Add a Spotter section to `.cursor/rules/_orchestration.md` so the tier classifier knows when to load these rules. Tier 1 to 2 work on Spotter surfaces should pull all three Spotter rule files plus the relevant Radiant rules.

### CLAUDE.md addendum

Short section in CLAUDE.md pointing to:

- `src/spotter/` and the `@spotter` alias.
- The two-layer DS model (when to use Radiant vs. Spotter).
- The three Spotter rule files for deeper context.

## Open questions

- **Prototype sub-DS pattern.** If Spotter justifies its own layer, does Liveboard? Admin? Onboarding? Do not create more layers without a real second case. Spotter is the test.
- **Streaming UX.** Does the response render block-by-block as it streams, or all-at-once on completion? Needs a call before the runtime renderer locks.
- **Response schema source.** Is the schema defined here, or does it mirror an existing Spotter API contract? If the latter, get the canonical schema before Phase 4.
- **`_agentic` lifespan.** Hard delete after migration, or leave as a thin re-export shim for one release cycle? Preference: hard delete, since this is a prototyping repo and consumers are internal.
- **Mock data.** Spotter needs realistic answer payloads for the prototype to feel real. Source from a captured Spotter session, or hand-author? Probably both, with hand-authored as the default.

## Sequencing

1. Phase 1 (inventory) — half day.
2. Context track rule files — drafted in parallel with Phase 1, since both need the inventory locked.
3. Phase 2 (migration) — one to two days once mapping is locked.
4. Phase 3 (net-new components) — depends on inventory size, plan in chunks.
5. Phase 4 (runtime renderer) — needs schema decision first.
6. Phase 5 (first prototype) — last, validates everything.

## Out of scope for this branch

- Promoting any Spotter component into `src/components/`. Stays in `src/spotter/`.
- Touching the existing `_agentic` consumers (DataModelEditor, MiniSpotters) before Phase 2 is ready.
- Building a real Spotter API. The `/api/chat` proxy is fine for now.
