# Spotter components

> ## ⚠️ Maintainer note (Faris)
>
> Some of these components overlap with the shared Spotter DS at
> `src/spotter/`. **This PR keeps them separate** ("Spotter new components")
> — nothing in `src/spotter/` changes.
>
> They are structured for easy promotion later: everything is imported via
> `components/index.ts`, so once verified in a second prototype, the folder
> can move into `src/spotter/` and consumers only update one import path.
>
> Replacement map for that promotion:
>
> | New (this folder) | Replaces in `src/spotter/` |
> |-------------------|----------------------------|
> | `Reasoning` | `ReasoningBlock` |
> | `UserMessage` | `UserBubble` |
> | `PromptBar` | `SpotterPrompt` |
> | `ResponseGridView` | — (new, no old equivalent) |
> | `ToolIcon` | — (new, no old equivalent) |
>
> The only consumer of the old blocks **visible in this repo** is the Spotter
> prototype (`src/prototypes/Spotter/`), which would be migrated in that same
> change. But designers may be using the old components in local branches and
> forks that aren't on main — so when replacing:
>
> - **Announce the change first** and give people time to speak up
> - **Don't delete the old components immediately** — keep them for a
>   deprecation window so unmerged work still builds after syncing upstream
>
> **Note for that migration — the grids differ.** The old `ChatThread` uses a
> single 880px column with 16px side padding; the new layout is a 800px
> content column with a 24px page gutter + 16px inner padding and a 768px
> text column. Swapping old for new is a visible change (the page gets
> narrower), not just a code change.
>
> **Rollout:** additive first (this PR, safe to ship to staging — no existing
> project changes), replacement later once verified in a second prototype.

The Spotter chat-response building blocks from the **Spotter Refresh** prototype,
packaged to drop into a RadiantPlay fork.

## What's inside

| Component | Files | What it is |
|-----------|-------|------------|
| **Reasoning** | `Reasoning.tsx` · `Reasoning.module.css` · `ToolIcons.tsx` | The "Show work" chain-of-thought — a flat timeline of NL text + tool calls that expands/collapses. Has an optional `triggerLeading` slot (used to place an agent photo before the "Show work" label). |
| **User message** | `UserMessage.tsx` · `UserMessage.module.css` | The user's chat bubble — squircle bubble, attached files, edit/hover states. Also exports `FileCard`. |
| **Prompt bar** | `PromptBar.tsx` · `PromptBar.module.css` | The input composer — model picker, skills, connectors, deep analysis, file attach, highlighted-text pill. |
| **Response grid (layout spec)** | `ResponseGridView.tsx` · `ResponseGridView.module.css` | **Not a shipping component — the grid, drawn as a live page.** Shows how user message + reasoning + response body + footer sit on the Spotter page grid (24px page gutter / 16px inner padding / 800px content / 768px text column). Toggles for grid overlay, stacked turns, agent photo, and show reasoning; drag the right edge to test resize. Copy its measurements and wiring into your prototype — don't embed it. |

Shared helpers: `useSquirclePath.ts` + `figmaSquircle.ts` (squircle geometry used by
UserMessage and PromptBar).

`assets/` holds the images these components import (Slack logo, prompt-bar icons,
Google Drive, and the sample agent avatar).

## How a response is composed

```
UserMessage            ← the question bubble (right-aligned)
  └─ Reasoning          ← "Show work" timeline (agent photo optional in the trigger)
       └─ response body ← headings + paragraphs
            └─ footer   ← thumbs up/down · copy · verify
```

`ResponseGridView.tsx` is the reference layout that wires all of the above together
on the Spotter page grid.

## Install

These are prototype-local components that build on the shared Radiant + Spotter
design system (they import from `@components/*` and `@tokens/*`), so they need a
RadiantPlay checkout to run.

1. Copy `components/` and `assets/` into a prototype folder, e.g.
   `src/prototypes/<YourPrototype>/` — keep them as **siblings** (the components
   import assets via `../assets/...`).
2. Import everything from the barrel (`components/index.ts`) — never from the
   individual files. This keeps the future promotion to `src/spotter/` a
   one-line path change:
   ```tsx
   import { Reasoning, UserMessage, PromptBar } from './components';
   ```
3. Register your prototype in `src/prototypes/registry-mine.ts`.

## Live demo

The layout spec runs in the gallery as **Spotter components** (under
"My prototypes"), route `/playground/SpotterComponents` — grid overlay,
stacked turns, and resize toggles included.

## Conventions

Tokens only (no hardcoded colors/spacing), Radiant components, sentence case.
See the RadiantPlay `CLAUDE.md` / `.cursor/rules` for the full design-system rules.
