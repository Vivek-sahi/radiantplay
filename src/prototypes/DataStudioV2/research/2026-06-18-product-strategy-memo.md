# ThoughtSpot Product Strategy: The Experience Layer Above an Open Data Stack

_Executive narrative memo — for product leadership. Companion analysis: `2026-06-16-agentic-analytics-sector-study.md`. Prepared 2026-06-18._

---

## 1. Recommendation (read this first)

ThoughtSpot should win by being **the best experience layer above an increasingly open, warehouse-owned data-and-semantics stack** — an analytics workspace that plugs into *any* data and semantics platform, serves the *full range* of data-team work (both structured/canonical and ad-hoc), and **coexists with the durable vertical giants** rather than trying to displace them. We own everything above the layer; we integrate with everything below it.

We are asking leadership to (1) endorse this positioning, (2) adopt the principle "consume the warehouse's semantic layer; do not build or defend a rival store," and (3) charter two execution bets: **best-in-class cross-platform integration built on open standards**, and **making canonical and ad-hoc work both first-class in one workspace**. The sentence that should govern every roadmap trade-off:

> **Own everything above the layer. Integrate with everything below it. Serve both canonical and ad-hoc work.**

---

## 2. Why this matters now

BI is now consumed by humans *and* AI agents. Every credible internal build we studied — Anthropic, OpenAI, Meta, Pinterest, Uber, Netflix — reached the same conclusion: generating SQL is not the bottleneck; mapping a question to the right business entities is, and the work that compounds is the data foundation plus the loop that keeps it accurate. That favors companies that are strong at modeling, governance, and experience — which is us. But it is happening while the structure of the market shifts underneath, and the strategy has to be built on what is actually true about that structure, not on a wish.

---

## 3. What is true about the market (the three facts we build on)

**Fact 1 — Vertical, end-to-end platforms are durable and will survive.** Looker inside Google Cloud, Power BI inside Microsoft Fabric, Tableau inside Salesforce: these own data, catalog, semantics, BI, and agent in one stack, with distribution we cannot match. We should not plan around them weakening. We plan to **coexist**, and to win the customers and the work they serve poorly.

**Fact 2 — Semantic-layer work is consolidating into the warehouses, and the warehouses are opening up.** Snowflake (Cortex Analyst, semantic views, Open Catalog), Databricks (Unity Catalog, metric views), and the move to open table formats (Iceberg) and open catalogs mean the data-and-semantics layer is increasingly owned at the warehouse *and* increasingly portable across them. The warehouses are removing their own lock-in. That is the enabling condition for our strategy: the layer we build on is becoming standard and accessible, so **integrating broadly across platforms is getting cheaper, not harder.**

**Fact 3 — Data teams do two kinds of work, and a platform must serve both.** There is structured, canonical work (modeled, governed, signed-off, must-tie-to-the-penny) and there is ad-hoc, exploratory analysis (fast, disposable, investigative). These are different modes for different moments — often for the same team. A platform that only does governed modeling is too rigid; one that only does ad-hoc exploration is ungovernable. The winning workspace **does both, on a shared foundation.**

(The full competitive bifurcation behind Facts 1–2 is in the appendix.)

---

## 4. Where we win — and our right to win

If the data-and-semantics layer is owned below us and is becoming open and portable, the durable value is in the layer **above** it: the experience of doing the work, across every platform a real enterprise actually runs.

- **Breadth of integration.** Most large enterprises are not single-platform; they run Snowflake *and* Databricks *and* BigQuery *and* SAP *and* spreadsheets. The vertical giants structurally cannot serve that neutrally — neutrality is the opposite of the lock-in they sell. Being the best experience that plugs into *all* of it is a position only an independent can hold, and open standards are making it cheaper to hold.
- **Both modes, one workspace.** Canonical modeling (Data Studio) and ad-hoc analysis (notebooks/Mode, Spotter exploration) on one governed foundation. General-purpose agents are good at ungoverned ad-hoc; we should not cede that — we should make *governed, integrated* ad-hoc the better experience, and connect it to the canonical models so exploration can graduate into trusted assets.
- **The experience above the layer.** The consumption and agent experience (Spotter), the operational and embedded surfaces (ThoughtSpot Everywhere), and the trust features — provenance, freshness, lineage, the correction loop — are where we differentiate and where the work actually happens.

Our right to win: we were agent-first and warehouse-neutral early; we have a semantic layer to *evolve* into a consumption-and-composition layer rather than invent one; Spotter is a credible destination; Mode gives us ad-hoc/notebook depth; ThoughtSpot Everywhere gives us the embedded surface. The honest disadvantage is **distribution** — the giants are pre-installed. We answer that with integration breadth and experience quality they cannot replicate, not with a distribution fight we would lose.

---

## 5. The strategy, stated

**ThoughtSpot is the analytics workspace that sits above an open, warehouse-owned data-and-semantics stack: it plugs into any platform, serves both canonical and ad-hoc work, and delivers the best experience for turning data into decisions — for humans and agents alike.** We coexist with the vertical giants and win the multi-platform majority and the full breadth of data-team work.

What we **stop doing**, explicitly:

1. **Stop trying to own or defend a warehouse-grade semantic layer.** Consume the warehouse's; the layer is consolidating there and opening up. Position our model as a consumption-and-composition layer above it, not a rival store.
2. **Stop framing strategy as beating the vertical giants.** They are durable. Coexist; win the cross-platform and experience game they cannot play.
3. **Stop forcing teams to choose between governed and exploratory.** Make both canonical and ad-hoc work first-class on one foundation.

---

## 6. Execution path

**Now (next two quarters) — be the best place to build on an open stack.**
- Make **cross-platform integration a first-class capability**, built on the open standards the warehouses are themselves adopting (Iceberg, open catalogs, native semantic views, dbt semantic layer, MCP-based connectors). The promise: plug into anything below, with governance and lineage intact.
- Make **canonical and ad-hoc both first-class** in one workspace on a shared semantic foundation — modeled assets (Data Studio) and exploratory analysis (notebooks/Mode, Spotter exploration), with a clear path for exploration to graduate into governed models.

**Next (two to four quarters) — deepen the experience above the layer.**
- Strengthen the consumption and agent experience (Spotter) and the operational/embedded surfaces as our visible differentiation.
- Ship the **trust loop** as experience, not plumbing: provenance, freshness, ownership and failure reasons on answers; drift detection; correction-mining that drafts fixes for review.
- Treat reusable **doctrine (skills) as portable across platforms** — the one thing the giants build platform-locked.

**Later — compound.**
- Turn the accumulated correction corpus and institutional memory into a flywheel; broaden the range of work the workspace handles above the layer.

---

## 7. Risks and how we de-risk

- **Integration sprawl / connector maintenance cost.** *Mitigation:* build on the open standards (Iceberg, open catalogs, MCP) the warehouses are adopting as they remove lock-in — this lowers our cost over time rather than raising it.
- **Squeezed in single-vendor accounts.** Where a customer goes all-in on one vertical giant, we will be at a disadvantage. *Mitigation:* target the large multi-platform majority; lead with the heterogeneity case.
- **Dual-mode complexity.** Serving canonical and ad-hoc can muddy the product. *Mitigation:* one shared semantic foundation, two clear modes, an explicit graduation path between them.
- **General-purpose agents eating ad-hoc.** *Mitigation:* governed, integrated, in-context ad-hoc beats ungoverned chat for the enterprise; meet users where they work and connect their exploration to trusted models.
- **Positioning drift.** If we keep framing our model as a rival semantic store, we re-enter the losing fight by default. *Mitigation:* make the "consume below, own above" principle a leadership-endorsed product principle.

---

## 8. The ask

We request that leadership:

1. **Endorse the positioning** in §5 — best experience above an open, warehouse-owned data-and-semantics stack; integrate broadly; serve both canonical and ad-hoc; coexist with the verticals — including the three "stop doing" commitments.
2. **Adopt the principle** "consume the warehouse's semantic layer; own the experience and composition layer above it."
3. **Charter two bets** for the next two quarters: cross-platform integration on open standards, and canonical-plus-ad-hoc as first-class in one workspace.
4. **Approve two or three multi-platform enterprise design partners** to validate the integration and dual-mode story.

Items 1 and 2 are the decision gate; items 3 and 4 are the immediate execution we are asking to fund.

---

## Appendix A — The market bifurcation (for Q&A)

| | Owns the platform beneath? | Posture | What it means for us |
|---|---|---|---|
| Power BI / Fabric, Tableau Next, Looker, Databricks, Snowflake | **Yes** | Own data + semantics + BI + agent; durable; bundle the agent | We **coexist** — do not plan around them weakening; win where they can't go |
| ThoughtSpot, Sigma, Hex, Omni, Mode, Metabase | **No** | Build above the warehouse's semantics; differentiate on experience | Our camp — and our edge is breadth of integration + best experience + both modes |
| dbt | No (control-plane bet) | *Be* the cross-warehouse semantic layer | Squeezed; reinforces "don't try to own that layer" |

**The two facts that anchor the strategy:** (1) the semantic/data layer is consolidating at the warehouse *and opening up* (Iceberg, open catalogs) — so building above it and integrating broadly is getting cheaper; (2) the vertical giants are durable but cannot be neutral — cross-platform breadth and experience are the positions left for an independent to own.

## Appendix B — Source material

Full reasoning, milestone by milestone, and all primary sources: `2026-06-16-agentic-analytics-sector-study.md` (same folder).
