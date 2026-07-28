# Near Store — session log · 2026-07-27

Focus: **business-user (consumption) side** — the Spotter surface + the cached/live indicators. Next session picks up with **Liveboard**.

## Shipped this session

- **Header surface-switcher** (`components/Shell.tsx`): dropdown in the `GlobalHeader` `rightSlot` to switch surfaces — Data workspace / Spotter (two variants) / Search data / Liveboard. Stays global across surfaces. `.switcher` wrapper in `Shell.module.css` supplies the missing `--rd-sys-color-background-surface` token so the open menu isn't transparent.
- **Spotter surface** (`components/SpotterSurface.tsx`): reuses the **real `@spotter` chat engine** (`SpotterChatProvider` + `useSpotterChat`, `mode="canned"`) so the "Show work" reasoning ladder animates like the product. Landing = `SpotterWelcome`; chat = a **local** turn-renderer (`AgentTurn`/`TurnBlock`) that reuses `ReasoningBlock` + `TypingIndicator` + `VizBlock` + `TextBlock` + `FollowUpsBlock`. The local renderer exists ONLY so we can inject the cache marker into the answer card (the default `AgentResponseBlock` can't carry it).
- **DAU canned response** added to the SHARED `src/spotter/runtime/cannedResponses.ts` (`dauFixture` + `DAU_STEPS` + a `dau|daily active|active users` route). Reasoning is generic — **no cache mention** (deferred, see below). NB: shared edit → the standalone Spotter prototype now answers DAU too (benign).
- **Cache indicators:**
  - **Answer card (provenance)** — `components/CacheMarker.tsx`: grey `database-zap` icon + hover **tooltip** explaining the cache + text **"Last refreshed on {date}"**; live = grey **"Live"**. Rides INSIDE the card (so it travels when pinned) via VizBlock's new `meta` slot.
  - **Model picker (capability)** — `components/ModelPickerModal.tsx`: cached → `Cached: Last 13 months` + `Last refreshed: …`; not-cached → `Cached: None` + a small **"Learn more"** link (`size="small"`, → `/near-store-overview.html`). Plain grey metadata, matches the `Created on:` line.
- **Two answer-card placements as A/B dropdown options** (identical Spotter, only marker position differs):
  - `Spotter · cache above graph` → marker in `meta` slot below the chips (xs font, tight gap).
  - `Spotter · cache after graph` → marker on the `Showing N of N data points` row, divider between, same xs size.
- **Shared `VizBlock` changes** (`src/spotter/chat/blocks/VizBlock.tsx` + `.module.css`) — all additive / backwards-compatible:
  - new optional `meta` slot (below tokens, above chart) and `dataPointsLeading` slot (on the data-points row);
  - now renders **"Showing N of N data points"** in the INLINE card (was expanded-view only);
  - footer **"Add to coaching" → "Add to memory"**, de-branded to grey.

## Key decisions
- **Capability vs provenance**: model "has a cache" (picker = capability) ≠ "this answer came from cache, as of X" (answer = provenance). Do not conflate. **No indicator on the prompt-bar chip** (confusion risk).
- **Cache-in-reasoning DEFERRED** (Vivek): reasoning stays generic; the indicator lives only on the answer card + picker. The engine is wired so it can be added later.
- **`@spotter` in Radiant Play is a prototype re-creation of Spotter, NOT the shipped product** — it will not match the real product pixel/behaviour (e.g. its reasoning trigger says "Thought for N seconds", the product says "Show work" / "Worked for N seconds"). Don't chase exact fidelity.

## NEXT SESSION → Liveboard (after Spotter; Search data after that)
Reuse assets found this session:
- Prototype: `src/prototypes/_liveboard-template/` (registry-core id `_liveboard-template`) + a "Liveboard - Styling panel" entry.
- Tiles: `src/prototypes/_shared/tiles/` — `AnswerTile`, `GroupTile`, `NoteTile`, `chartPalette`, `charts/`, `useContainerSize`.
- Component: `src/components/LiveboardHeader`.

Plan: build the **Liveboard** surface behind the switcher, reusing the above. Put a **per-tile** cache marker (reuse `CacheMarker`, same language). The interesting/hard case: a board mixing **multiple models** so freshness varies **tile-to-tile** — a `cached-as-of-yesterday` tile next to a `live` tile. Then do **Search data**.

## Working notes / preferences
- **Do NOT use Playwright to verify in this project.** Verify via `npx tsc --noEmit` + `npm run build`, and let Vivek look on the dev server.
- Run with **`npx vite`** (not `npm run dev`). Route: `/playground/NearStore`.
- Requirements doc: `2026-07-27-business-user-requirements.md` (why / scenarios / touchpoint evaluation / post-MVP nuances).
- **Nothing committed or deployed** this session — all local on `prototype/data-studio`.
