# Near Store — business-user cache awareness (requirements)
**Status:** Draft for PM + Eng alignment

**Date:** 2026-07-27

**Owner:** Vivek Sahi

**Scope:** The _consumption_ (business-user) side of Near Store.

* * *
## 1. Why
Near Store lets data teams cache a model's data inside ThoughtSpot to cut live query cost and speed up loads. That setup work lives on the **data-person** side.

Once a model is cached, the people who actually _consume_ the data — business users asking questions and reading dashboards — are served from the cache, conditionally (condition scenarios are detailed in how section). That creates a **trust gap**:

- Looking at a number, a business user can't tell whether it's **current** or a point-in-time snapshot.
  
- They can't tell **where it came from** — cached vs live.
  
- When they need certainty for a decision, they have no way to **force a fresh read**.
  

**Goal:** give business users enough transparency to trust cached answers — enough to answer two questions at a glance: _"Is this current enough?"_ and _"Where did it come from?"_ — plus an escape hatch to live data when they need it. All without adding noise or anxiety to every answer.

* * *
## 2. How — scenarios & routing
From the **business user's point of view there are only two states** they ever perceive:

- **Cached** — served from Near Store, shown with an _"as of [date/time]"_ freshness marker.
  
- **Live** — served directly from Snowflake.
  

All routing between the two is decided by the **backend**; the user never manages it. The table below is the agreed handling.

| Situation | User is served | Rationale |
| --- | --- | --- |
| Model cached, question **within** the cached time window | **Cached** (as of last refresh) | The core value — fast and cheap. |
| Question reaches **beyond** the cached time window | **Live** (entire query) | No partial results. If any of the requested range falls outside the window, the whole query goes live. |
| Model never cached / cache purged | **Live** | Nothing to serve from cache. |
| Cache **invalidated** (model changed since last cache) | **Live** | Deliberate call — **accuracy over cost.** Serving a possibly-wrong last snapshot is worse than being slower. |
| Cache **refreshing** right now | **Cached** (current snapshot) | Refresh is **invisible** — the user keeps seeing the current cache until the new one is ready. |

**Explicitly out of the user-facing model:**

- **No "partial" state** — an answer is never a blend of cached + live. It is one or the other.
  
- **No "refreshing" state** — refreshes are invisible to the consumer.
  
### Switch to live control - out of MVP scope
- A per-answer **"Requery with live data"** action — mirrors the existing _regenerate_ affordance, but forces a fresh Snowflake run. For when a user wants to double-check a cached number against live.
  
### Open nuance
- When an answer _is_ **Live**, do we quietly tell the user **why** (e.g. _"live because your question went beyond the cached range"_)? Helps trust, but risks clutter. To be decided when we design the indicator.
  
### Nuances to think through (post-MVP)
- **Mixed provenance within one chat.** In a single Spotter conversation, one question can go **live** (beyond the cached window) while the next comes from **cache**. So the indicator is **per-answer**, not per-chat — this is the main reason the marker lives on each answer card, each with its own _"as of"_.
  
- **Forcing live — three levels, rising power and risk:** (1) one-off per-answer **"Requery with live data"** _(above; out of MVP)_; (2) **chat-level** toggle — "this whole conversation goes live" (ephemeral, simple); (3) **model-level user preference** — "always serve _me_ live for this model, even though it's cached" (persistent). Level 3 directly **undermines the cost savings caching exists for**, so it likely needs a guardrail (admin allow/block, or a cost-aware nudge). Suggested sequencing: 1 → 2 → 3, all post-MVP.
  

* * *
## 3. What it will look like
The prototype makes the touchpoints navigable through a **surface switcher** — a dropdown in the top header — so a stakeholder can jump between them and see how the same cached/live truth is surfaced natively in each. Switchable surfaces:

1. **Data workspace** — _built._ The data-person side: browse models, set up and manage a model's cache. Where the story starts.
  
2. **Spotter** — the _AI_ answer path; the returned answer carries the cached/live marker (warehouse icon + _"as of"_). _Built — reuses the real Spotter answer components._
  
3. **Search data** — the _deterministic_ answer path: pick columns off a model, plot a result carrying the same marker. _To prototype._
  
4. **Liveboard** — a dashboard of many answers across possibly many models; the hardest case, since one board can show a _cached-as-of-yesterday_ tile next to a _live_ tile. _Built — reuses the real liveboard tiles + header, left nav hidden, two marker placements (above graph / card bottom)._
  

**One running example across all surfaces.** Every surface reflects the _same_ underlying scenario (e.g. a model cached as of yesterday, 9:00 AM), so switching shows one concept expressed several ways — not four disconnected mocks.

**Consistent marker treatment.** On every surface the indicator answers the same two questions — _cached or live?_ and _as of when?_ — expanding to detail on demand.

**Three consumption routes, one grain.** Indication is driven by the three routes a business user actually consumes an answer through — **Spotter** (AI answers), **Search data** (deterministic answers), and **Liveboard** (pinned answers) — and by the grain each can express (model = capability, answer = provenance, board = summary; detailed below). **Team-aligned:** the marker is present on the **Spotter answer** and on the **Liveboard card**. Liveboard is the least settled of the three — **more UI exploration to come** (mixed-freshness boards are the hard case).
### Capability vs provenance (the key distinction)
A **cached model** (_capability_ — "this model _has_ a cache") is **not** the same as a **cached answer** (_provenance_ — "_this result_ came from cache, as of X"). A model can be cached yet a given answer still runs live (the question went beyond the window). Any touchpoint that shows a _model_ property must not be misread as answer provenance — that mismatch is the main source of confusion.
### Granularity — the right grain is the _answer_
A business user reasons about a specific **answer** — the number or chart they're about to act on. _"Is_ **_this_** _current, and where did it come from?"_ is an answer-level question, so that's where the signal has to live. The other levels are the wrong grain:

| Level | What it can express | Right grain for provenance? | Decision |
| --- | --- | --- | --- |
| **Model** (capability) | "This model _has_ a cache" | No — a cached model can still answer live (question ran beyond the window). Reads like provenance but isn't. | Capability only, in the model picker. Never as answer provenance. |
| **Liveboard** (board) | One freshness state for the whole board | No — a board can mix models, so freshness varies tile-to-tile. A single board marker is either wrong or too coarse. | Board-level _"refreshed …"_ is a useful **summary** when the board shares one state (a native pattern, shown by the title), but not the source of truth. |
| **Answer** (provenance) | "_This result_ is cached as of X / live" | **Yes** — this is the grain at which freshness actually varies, and at which the user acts. | **Surface here** — on each Spotter answer and each liveboard tile. |

Mental model: **capability lives on the model, provenance lives on the answer, and the board only summarises.** Conflating the three is the main source of confusion.
### Touchpoint evaluation — where to show it, and how much
Scored on three axes — **transparency** (clarifies "current? / where from?"), **usefulness** (does the user act on it here?), **confusion risk** (could it mislead or add noise?). Rule: show only where transparency + usefulness clearly beat confusion; **detail scales with transparency** (high → icon + date; low → icon only, or nothing).

| Touchpoint | Signal | Transparency requirement | Usefulness | Confusion risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Prompt-bar model chip | Capability | Low | Low | **High** (model ≠ answer) | **Don't show in model chip** |
| Model-picker details | Capability | Low | Medium | Low | **Show with detail** cached · last refreshed · time window |
| Answer card | **Provenance** | **High** | **High** | **High** | **Show with detail** — cache glyph + _"Last refreshed 26 Jul, 9:00 AM"_ when cached; warehouse glyph + _"Live"_ when not |

**Answer-card placement (Spotter + Liveboard tiles):** the marker sits **inside the card, always visible** — two placements are prototyped as A/B options: **above the graph** (just under the title/subtitle) or a **bottom legend row**. Same content either way, so only the position differs.

- **Icons — two distinct glyphs by source:** **cached** reuses the **data-workspace cache glyph** (database-zap), so the same mark means "cached in Near Store" everywhere; **live** uses the standard **data-warehouse** glyph, since a live answer is read straight from the warehouse (Snowflake).
  
- **Cached:** cache glyph + _"Last refreshed 26 Jul, 9:00 AM"_.
  
- **Not cached:** warehouse glyph + _"Live"_ (queried live from Snowflake) — shown, **not hidden**, so an absent marker is never ambiguous. Only some cards on a board are cached; the rest read "Live".
  
- The future _"Requery with live"_ action lives in the tile's bottom actions menu (out of MVP).
  
### Visual treatment — Liveboard explorations (under exploration)
On a **mixed** board the marker has to work tile-by-tile _and_ stay legible across many small cards at once — so how we **encode** cached-vs-live matters as much as where it sits. These are prototyped as **switcher options on the Liveboard surface** (same A/B pattern as the placement options), so each encoding can be compared against a real mixed board.

**Principle — stay neutral.** Neither cached nor live is "good," so avoid a **green/red (good/bad)** reading. Distinguish with a calm, non-judgmental pair — the Near Store accent for _cached_ vs. a neutral grey for _live_ — plus the two source glyphs (cache / warehouse). Colour never carries the meaning alone.

| Encoding | What it is | Transparency | Confusion risk | Reads as |
| --- | --- | --- | --- | --- |
| **Text** _(above graph / card bottom)_ | The explicit _"Last refreshed …"_ / _"Live"_ line already in the build | **Highest** — states source **and** as-of date in words | Low, but the **heaviest** — repeated on every tile, adds clutter on a dense board | Safe default |
| **Neutral dot** | A small status dot before the title; detail on hover | **Low alone** (a dot isn't a date) — leans on the tooltip for as-of | Low **if neutral**; a green dot would falsely read as "healthy/good" | Quietest; best for scanning, weakest for as-of |
| **Board statement** | One summary line at the board level (under the title) | Good **only when the board shares one state**; on a mixed board a single line is coarse | **High on mixed boards** — implies one freshness for every tile | Summary, not source of truth |
| **Card stroke** | Card border coloured by source | **Medium** — needs a legend to decode (paired here with a small key) | **High** — a coloured border reads as selection / alert; colour-only fails a11y | Strong grouping, semantically noisy |

**Where this nets out (to validate in the prototype):** **text** stays the most transparent and is the safe default; the **dot** is the most promising _quiet_ option for dense boards **if** paired with hover-for-detail and a neutral palette; the **board statement** is a useful _summary_ but can't be the source of truth on a mixed board; **card stroke** groups well at a glance but needs a legend and risks reading as an alert. **Liveboard needs the most UI exploration** — these switcher options exist to pressure-test the four against the same mixed board. (Colour of the neutral pair is itself a placeholder, easily swapped.)

**Liveboard specifics:** a liveboard is a full-width surface — the data-workspace **left nav is hidden** (product-accurate). Board-level freshness reuses the native _"refreshed …"_ affordance by the title; the per-tile marker earns its space on **mixed** boards, where it flags each tile's own state.

**Build order:** Spotter → Liveboard → **Search data** (Data workspace already done). Spotter first (flagship + most reusable pieces); Liveboard next (mixed freshness is trickiest); **Search data is still to prototype** — its cached/live treatment is TBD.

**Still to define** (as we prototype each surface, from shared screenshots): the **Liveboard visual treatment** (text / dot / statement / stroke — see above), the **Search data** surface + its marker, where exactly the marker sits, what the expanded detail shows, and how the (out-of-MVP) _"Requery with live data"_ control behaves.

* * *
## Object model (reference)
```
Data model ──> Search data ─┐
           └─> Spotter ──────┴─> Answer ──> pinned onto a Liveboard
```

- **Search data** = deterministic answer generation.
  
- **Spotter** = AI answer generation.
  
- **Answer** = a single saved viz.
  
- **Liveboard** = many answers, possibly across many models.
