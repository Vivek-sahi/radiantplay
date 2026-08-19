# Node-canvas peer research — filter/formula placement, browsing, and caching tiers

_2026-08-11. Backing for the "pick 1 of many" calls in `2026-08-11-mvp-feature-breakdown.md`.
Checked against **node/canvas-based data tools** (Alteryx, KNIME, Matillion, Coalesce,
dbt) — a different, more relevant comparison set than the BI tools (Hex, Omni, Sigma)
the earlier research in this project was checked against. None of those three have a
persistent node canvas at all, which matters for exactly the questions below._

---

## Correction to the MVP breakdown

The breakdown states "no peer draws \[model-level filter/formula\] spatially on a
canvas at all" and calls it genuinely novel territory. **That's wrong for this
comparison set.** Checked against tools that actually have a canvas:

| Tool | Filter/Formula representation |
|---|---|
| **Alteryx** | Its own node. Filter has 3 anchors (input, True-output, False-output); Formula creates/updates columns from whatever stream flows in. Wired with edges like anything else. |
| **KNIME** | Same shape — Row Filter, Math Formula, GroupBy are distinct nodes with input/output ports. |
| **Matillion** | Same — Join and Filter are canvas components, connected via directional rings. |
| **Coalesce** | **Different pattern.** Not a separate node — join/filter/grouping logic is written as SQL *inside the Join tab of a single node's editor*. A node can reference multiple source tables directly without a prior dedicated join node. |

So there are two real, established patterns, not zero:

1. **Own dedicated node** (Alteryx, KNIME, Matillion) — Filter and Formula sit on the
   canvas like anything else, wired with edges.
2. **Attached to the consuming node's panel** (Coalesce) — cross-table logic lives in
   the properties of whichever node actually combines those tables, not as its own
   visual object.

**Why pattern 1 doesn't map cleanly onto our canvas:** Alteryx/KNIME/Matillion are all
strictly linear/branching pipelines — by the time you reach a Filter node, you're
already operating on one merged stream, because edges only flow one direction into a
single-input node. Our canvas isn't that shape — it's a free-form join graph, not a
single pipeline. A "Formula node" touching three tables would need edges from all
three, which is a different (and uglier) kind of object than what these tools draw.

**Correction, 2026-08-11, after further discussion: neither pattern actually maps
onto our canvas, and the reason is structural, not stylistic.**

Coalesce's node isn't a pairwise join edge — it's a stage that can pull an arbitrary
number of source tables into one `FROM` clause. That's a different object than what
our canvas has: we draw pairwise edges between two cards, not a node that can itself
span N tables. "Attach filter/formula logic to the join's properties panel" — the
first read of this finding — doesn't actually translate, because there usually isn't
a join edge to attach to.

The harder problem only shows up once a model has more than two tables: a formula can
need columns from two tables that aren't directly joined to each other at all — only
connected transitively, through a third table (e.g. `arr_snapshot` and `usage_events`,
both joined to `accounts` but not to each other). There's no single join edge that
"owns" that relationship, so a join-level home for filter/formula couldn't cover this
case even if the object existed.

**Resolution: filter/formula creation is a model-level action, uniformly — never
attached to a table card, and never attached to a specific join.** One rule regardless
of how many tables a given formula touches, rather than a rule that depends on an
incidental fact (table count, and whether they happen to share a direct edge) the
person authoring it isn't necessarily tracking. The dedicated Fields/Metrics panel is
where creation happens, not just where the result gets listed afterward.

---

## Getting data onto the canvas — stronger evidence for the existing call

Every canvas-based tool checked uses a persistent, docked panel to drag from — **none
use a modal**, including tools with a real node canvas to protect (unlike Hex/Omni/Sigma,
which don't have one):

| Tool | Pattern |
|---|---|
| Alteryx | Categorized tool menu (In/Out, Data Prep, Join, Transform…), drag onto canvas |
| KNIME | Node repository list, drag onto canvas, connect via ports |
| Matillion | Components panel on the left, drag onto canvas, connect via rings |

This is better evidence for the "docked, not modal" call than the earlier Hex/Omni/Sigma
research, precisely because these tools have the thing a modal would be protecting
(a persistent canvas) and still didn't reach for one. Strengthens the existing call;
doesn't change it.

---

## Sample vs. full data — the shape of "sample" needs a second look

dbt's `--sample` flag (a genuinely new feature, still landing as of late 2025) samples
by **time window**, not row count — e.g., "last 3 days," not "first 500 rows." Worth
noting directly against the MVP breakdown's working default: an arbitrary row-count
sample can be unrepresentative if the table isn't ordered by recency, where a recent
time window is more likely to reflect real, current data.

There's also a third tier worth knowing about: dbt's `--empty` flag runs with **zero**
rows — validates that the SQL/schema executes without reading any real data at all,
faster and cheaper than even a sample. That maps onto something we haven't named yet:
a schema-only validation tier, cheaper than a sample, useful for checking a join or
formula compiles before paying for any data read at all.

Worth being honest about the maturity here: even dbt's sample mode is new and still
being discussed as a pattern (the GitHub discussion and write-ups found are from late
2025). This isn't a settled, copy-this-exactly precedent — it's confirmation that the
*direction* (sample-first) is right, without a mature reference implementation to
copy the mechanics from.

**Revises the MVP breakdown's caching call:** consider time-windowed sampling over an
arbitrary row count, and consider a cheaper schema-only tier ahead of "sample" for
pure structure-checking (does this join even compile) before any data is pulled.

---

## Sources

- [Filter Tool | Alteryx Help](https://help.alteryx.com/current/designer/filter-tool)
- [Formula Tool | Alteryx Help](https://help.alteryx.com/20231/designer/formula-tool)
- [Join Tab | Coalesce Documentation](https://docs.coalesce.io/docs/build-your-pipeline/the-build-interface/join-tab)
- [Coalesce Basics: Getting Started | phData](https://www.phdata.io/blog/coalesce-basics-getting-started-creating-your-first-data-pipeline/)
- [GroupBy – KNIME Community Hub](https://hub.knime.com/knime/extensions/org.knime.features.base/latest/org.knime.base.node.preproc.groupby.GroupByNodeFactory)
- [Developing Workflows in Matillion ETL](https://www.matillion.com/blog/developing-workflows-in-matillion-etl)
- [Drag-and-Drop Intuitive User Interface for Pipeline Design | Matillion](https://www.matillion.com/blog/drag-and-drop-intuitive-user-interface-for-pipeline-design)
- [Sample Mode discussion — dbt-labs/dbt-core #11200](https://github.com/dbt-labs/dbt-core/discussions/11200)
- [Speed Up Your dbt Development with Sample Mode | Medium](https://aradsouza.medium.com/speed-up-your-dbt-development-with-sample-mode-fbf9ec131a9d)
- [About the sample flag | dbt Developer Hub](https://docs.getdbt.com/docs/build/sample-flag)
- [Alteryx vs KNIME comparison — From Alteryx to KNIME eBook](https://www.knime.com/sites/default/files/2023-05/From_Alteryx_to_KNIME_Eng_v4.7_ebook.pdf)

---

## What this changes in the MVP breakdown, and what it doesn't

| Call | Status after this research |
|---|---|
| Filter/Formula/Metrics: dedicated off-canvas panel | **Refined twice.** First pass (wrong): author on the join's panel, Coalesce-style. Second pass: the join panel doesn't work either — many formulas span tables with no direct join edge between them at all (transitive connections). Creation is a model-level action, uniformly, never card- or join-attached. |
| Data Browser: docked, not modal | **Strengthened** — better-matched evidence than before, same conclusion |
| Caching: sample-first, ~500 rows | **Revise the shape** — consider a time window over a row count, and consider a schema-only tier ahead of sample |
| "No peer precedent" framing for filter/formula | **Wrong as stated** — real precedent exists once you check the right tools; correct in the breakdown |
