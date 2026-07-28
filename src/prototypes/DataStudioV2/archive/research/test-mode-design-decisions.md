# Test Mode — Design Decisions

_Thinking session: 2026-05-12. This doc captures the reasoning, options we considered, decisions we made, and decisions we discarded — not just the outcome._

---

## The starting question

We previously had Build and Test as tabs at the top of the agent panel. We removed tabs as part of the artifact paradigm shift (chat as top-level container, model as artifact within conversation). That left testing unresolved: where does it live, what does it mean, and what happens to test output?

---

## What does testing actually mean for a data analyst?

Before deciding on UI mechanics, we grounded the problem in what a seasoned data analyst actually does when they test a data model. It's not random exploration. It's targeted verification:

1. **Known-answer queries first.** "Total revenue last quarter was $4.2M — does this model return that?" Sanity checks against numbers they already know.
2. **Granularity ladder.** Same metric, different cuts: total → by campaign → by campaign by week. Tests whether joins hold at every level of aggregation.
3. **Business question coverage.** They mentally run through questions their stakeholders actually ask and verify those work cleanly.
4. **Spotter interpretation.** Does Spotter pick the right column when the user asks in natural language? If not, it's a naming or synonym problem, not a data problem.

The key insight: **testing produces visualizations and numbers, not just text.** The analyst looks at a chart or a number and says "right" or "wrong" or "that's not what I meant." The output of a test is a query result, not a log.

---

## Test mode = Spotter

This framing clarified everything. In DataStudio:

- **Build mode:** the agent modifies the model (adds tables, rewires joins, writes formulas, renames columns)
- **Test mode:** Spotter answers natural language questions and returns visualizations

This gives the prompt bar mode switch a real semantic meaning — you're switching between two different AI behaviors, not just two different intents. Build mode and test mode aren't the same agent in different moods. They're fundamentally different: one modifies the model, one queries it.

**Important:** testing only begins after a model exists. For the first few minutes of a new build, there's nothing to test. The mode switch should be unavailable (or absent) until the model artifact exists. Once a model is built or an existing model is opened, testing becomes available.

---

## Options we considered for what happens to test answers

### Option A: Answers saved to Created, with liveboard creation

Every Spotter answer becomes an artifact in the Created bucket. Users could also prompt to generate a full dashboard, which would also land in Created. At publish time, users would select what to publish.

**Why we discarded it:**

DataStudio is a model builder, not a liveboard creator. ThoughtSpot already has a surface for building liveboards — that's the consumption layer. If DataStudio also builds liveboards, we blur a clean boundary that already exists in the product.

More concretely: the job to be done for DataStudio is "build a reliable data model that Spotter can use to answer my team's questions." Liveboard creation is what happens *after* that job is done, not during it. Mixing them conflates two different mental modes — verification vs. composition.

---

### Option B: Fully ephemeral, nothing saved

Testing leaves no trace. Answers appear in conversation, disappear when the session ends.

**Why we partially discarded it:**

Too restrictive. The analyst might want to capture something meaningful — proof that a key metric works, a chart that validates the model is correct. Fully ephemeral removes all agency from the user.

---

### Option C: Pin mechanic (middle path — considered seriously)

Answers are ephemeral by default. User can explicitly pin individual answers, which moves them to Created. At publish, user selects which pinned items to include.

We considered this seriously. The pin mechanic is lightweight and doesn't expand scope dramatically. But two problems emerged:

**Problem 1 — Staleness.** A pinned answer is a snapshot from a specific moment in the model's history. If the metric it references gets renamed, the join changes, or the formula is modified during further building, the pinned answer may return a wrong number or stop working entirely. Answers are inherently tied to the model state at the time of creation — they're not live objects.

**Problem 2 — Wrong publish moment.** An alternative to pin-during-testing was "ask at publish time if the user wants to publish any answers." This creates decision fatigue at the worst possible moment — publish should feel like a milestone, not a curation task. Surfacing 12 answers from 3 test sessions at publish time is too late and too noisy.

**Why we discarded pinning:** The staleness problem is structurally hard to solve without adding complexity (freshness signals, re-verification flows, stale state UI). The value pinning provides — capturing verification evidence — is better served by the conversation itself.

---

### Final decision: Answers stay in chat history only

Test answers are ephemeral as artifacts but **the conversation persists**. The analyst can scroll back and see every question they asked and what the model returned at each stage. The chat IS the verification trail.

This means:
- Nothing from test mode moves to Created
- No pin mechanic needed
- No answer curation at publish time
- Created stays clean: model + instructions.md only

The conversation history gives the analyst a full record without the complexity of managing live artifacts.

---

## No liveboards in draft state

**Decision:** Liveboard creation is not available while the model is in draft state.

**Reasoning:**

1. **Draft models are volatile.** During building, columns get renamed, joins get changed, formulas get rewritten. A liveboard built on a draft would break constantly — and the consumer of that liveboard didn't sign up for that instability.

2. **Publish becomes a real gate.** Without this rule, publish is a checkbox. With it, publish becomes a deliberate quality commitment: "I'm confident enough in this model that others can build on top of it." That's a meaningful moment.

3. **Clean product boundary.** Draft state = builder's workspace. Published state = opens up to consumers (Spotter at org level, liveboard creation in ThoughtSpot proper). The two-phase model is clear and defensible.

4. **Validates the scope.** Data teams frequently request the ability to build reports and dashboards. DataStudio answers that need — but only after the model is solid. The sequence enforces quality without blocking the use case.

---

## Chat persistence per model

**Decision:** One conversation per model, persists across sessions.

The paradigm established earlier is that chat is the top-level container and the model is an artifact within that conversation. Returning to a model means returning to its conversation. You see the full history: build decisions, test questions, what worked, what didn't, what was changed.

"Multiple sessions" as a concept would require a session picker — which session has the test from last week? That's UI overhead that dilutes the whole idea. Instead: one conversation, always the same one, picks up where it left off. Past sessions are just scrolling up.

---

## Implicit coaching — deferred

We discussed but explicitly deferred the question of implicit coaching: the agent observing failed queries, inferring naming gaps from repeated reformulations, suggesting fixes based on test behavior patterns. This is the right long-term direction but too nuanced to prototype now. Explicit coaching (user types "rename this column", agent does it) is sufficient for the current prototype scope.

---

## Final state

| Question | Decision |
|---|---|
| What is test mode? | Spotter — natural language queries against the model |
| When is it available? | Only after a model exists (not during initial build) |
| What happens to test answers? | Ephemeral in chat history, not saved as artifacts |
| Pin mechanic? | Discarded — staleness problem, wrong publish moment |
| Liveboard creation in draft? | Not allowed |
| When can liveboards be created? | Post-publish only, in ThoughtSpot proper |
| What's in Created? | Model + instructions.md |
| What gets published? | Model (+ instructions.md optionally) |
| Chat persistence? | One conversation per model, persists indefinitely |
| Implicit coaching? | Deferred — too nuanced for current prototype scope |

---

## What this makes possible later

The draft/published boundary sets up a natural expansion path: post-publish features (liveboard creation, answer sharing, monitoring) can be added to DataStudio without muddying the build+test scope. The boundary is a feature, not a limitation.
