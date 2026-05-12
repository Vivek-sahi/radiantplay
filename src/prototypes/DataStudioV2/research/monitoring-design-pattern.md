# Monitoring — Design Pattern: Discovery → Inspection → Fix Loop

_Decision doc. Captures the interaction pattern for monitoring workflows in Data Studio. Applies to all 5 monitoring themes._

---

## The core loop

```
Discovery → Inspection → Fix → Verify → back to Discovery
```

Every monitoring workflow follows this loop. What varies per issue type is where inspection happens and which fix tier applies.

---

## Fix tiers

Fix complexity determines where the fix happens — not where the issue was discovered. Three tiers:

### Tier 1 — Inline fix (on the overview card)
Issue is simple and self-contained. The agent proposes the full fix on the overview card. The analyst exercises judgment, not deep understanding. No navigation required.

**Examples:** add a field description, map a new column, endorse a table, set a cache refresh interval, deprecate a stale Liveboard.

> *"23 Spotter questions failed because `net_revenue` has no definition. Proposed: 'Total recognised revenue net of refunds and discounts.' Approve?"*
> [Approve] [Edit] [Skip]

Done in 5 seconds. No model view needed.

---

### Tier 2 — Expand in place
Issue needs more context before the analyst can approve. The monitoring card expands to show before/after, real examples, and scope of impact. Still no navigation — everything stays on the overview.

**Examples:** field definition with structural implications, unmapped column with suggested relationships, a cluster of related Spotter failures, field rename blast radius.

Card grows in place. Agent shows 2–3 real Spotter questions that failed, how they'd answer with the fix applied, and the proposed model change. Analyst approves from the expanded state.

---

### Tier 3 — Agent-guided navigation
Fix is structural — it changes relationships, formulas, or model architecture. The agent can't propose this from the overview because the analyst needs model-level context. But the agent doesn't abandon the flow — it explains why navigation is needed and pre-stages the work:

> *"This requires a structural change to how `arr` relates to `contract_value`. Let me take you to the model — I've already prepared what needs to change."*

The analyst navigates to the model view. The agent has already staged the proposed change. They're not starting from scratch.

---

## Theme → tier mapping

| Monitoring theme | Scenario | Tier |
|---|---|---|
| AI answer improvement | Simple field definition missing | 1 — inline |
| AI answer improvement | Structural model change needed | 3 — guided nav |
| Prep / silent gap | New column mapping | 2 — expand |
| Model breakage | Field rename blast radius | 2 — expand |
| Model breakage | Broken connection credential | 3 — guided nav |
| Cache health | Cache refresh interval | 1 — inline |
| Adoption | Declining Liveboard (deprecate or notify) | 1 — inline |

---

## The overview as a resolution surface

The overview is not just a discovery surface. It is a **resolution surface for Tier 1 and 2 fixes.**

Goal: the analyst should be able to close ~70% of monitoring issues without leaving the overview. The remaining ~30% are genuinely complex enough to warrant navigation — and the agent makes that handoff graceful rather than abrupt.

---

## Design principles this embeds

1. **Fix complexity, not issue type, determines where the fix happens.** Don't force navigation for simple fixes just because the underlying asset is in the model view.
2. **The agent makes the tier judgment.** It knows whether a fix is inline-safe or requires model context. The analyst doesn't have to figure this out.
3. **Tier 3 is a handoff, not an abandonment.** The agent goes with the analyst — it has already prepared the work before navigation.
4. **Verify closes the loop.** Every fix is followed by a verification step where the agent tracks whether the issue actually resolved. This feeds back into Discovery.

---

## Scalability

This three-tier pattern is the same regardless of monitoring theme. Adding a new monitoring capability (e.g., cache health, adoption, model breakage) means deciding which tier its fix types land in — not designing a new interaction pattern. The loop is always the same.
