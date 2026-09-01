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
> The only consumer of the old blocks is the Spotter prototype
> (`src/prototypes/Spotter/`), which would be migrated in that same change.

The Spotter chat-response building blocks from the **Spotter Refresh** prototype,
packaged to drop into a RadiantPlay fork.

## What's inside

| Component | Files | What it is |
|-----------|-------|------------|
| **Reasoning** | `Reasoning.tsx` · `Reasoning.module.css` · `ToolIcons.tsx` | The "Show work" chain-of-thought — a flat timeline of NL text + tool calls that expands/collapses. Has an optional `triggerLeading` slot (used to place an agent photo before the "Show work" label). |
| **User message** | `UserMessage.tsx` · `UserMessage.module.css` | The user's chat bubble — squircle bubble, attached files, edit/hover states. Also exports `FileCard`. |
| **Prompt bar** | `PromptBar.tsx` · `PromptBar.module.css` | The input composer — model picker, skills, connectors, deep analysis, file attach, highlighted-text pill. |
| **Response (composition)** | `ResponseGridView.tsx` · `ResponseGridView.module.css` | **How they come together.** Lays a user message + reasoning + response body + footer (thumbs up/down, copy, verify) onto the page grid (24px page padding / 16px inner padding / 768px text column). Toggles for grid overlay, stacked turns, agent photo, and show reasoning. |

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
2. Import what you need, e.g.:
   ```tsx
   import { ResponseGridView } from './components/ResponseGridView';
   import { Reasoning } from './components/Reasoning';
   import { UserMessage } from './components/UserMessage';
   import PromptBar from './components/PromptBar';
   ```
3. Register your prototype in `src/prototypes/registry-mine.ts`.

## Conventions

Tokens only (no hardcoded colors/spacing), Radiant components, sentence case.
See the RadiantPlay `CLAUDE.md` / `.cursor/rules` for the full design-system rules.
