# Column Properties — Research & Design Decisions

_Created: 2026-04-21. Update this file as decisions evolve._

---

## Why this matters

Columns are the atomic unit of a data model. The properties we expose on a column determine:
- How well Spotter can answer questions (Description, AI Context, Synonyms)
- How aggregations behave (Column type, Aggregation, Additive)
- What business users see and don't see (Hidden, Format pattern)
- Whether the data is trustworthy (Null %, Duplicates, Blanks, Anomalies)

---

## Research sources

| Tool | Where |
|------|--------|
| ThoughtSpot | docs.thoughtspot.com — Worksheets, Data Modeling Patterns |
| Omni Analytics | docs.omni.co — Modeling Overview, AI Context |
| Sigma Computing | help.sigmacomputing.com — Data Models, Data Types |
| Looker LookML | cloud.google.com/looker — Field Parameters |
| dbt | docs.getdbt.com — Column-level metadata |

---

## What each tool exposes

**ThoughtSpot:** Column name, data type, description, column type (attribute/measure), aggregation, hidden, format/number formatting

**Omni:** Column name, description, data type, AI context, synonyms, field categorization

**Sigma:** Column name, data type, description, format (currency/date), data quality stats (null count, distinct count)

**Looker LookML:** Name, type, description, hidden, group_label, value_format, label, sql

**dbt:** Column name, data_type, description, tests, meta (custom key-value), tags

---

## Tier classification

### Tier 1 — Essential (show by default)
Every analyst needs these on day 1. Drive Spotter accuracy and basic model correctness.

| Property | Why essential |
|----------|--------------|
| Column name | Identity |
| Source table | Provenance — where did this come from |
| Data type | Fundamental — VARCHAR, NUMBER, DATE |
| Description | Primary semantic signal for Spotter |
| AI Context | Explicitly how the AI should interpret this column — increasingly standard (Omni, ThoughtSpot) |
| Synonyms | Alternative names Spotter uses to match user queries |
| Column type | Attribute vs. Measure — determines aggregation behavior |
| Aggregation | SUM / AVG / COUNT etc. — only meaningful for measures |
| Additive | Whether the measure can be summed across all dimensions — critical for avoiding double-counting |
| Hidden | Visibility toggle — governance baseline |
| Format pattern | How values display (currency, %, date) — affects readability |

### Tier 2 — Data quality (show by default, rightmost)
Operational metadata. Important for trust, but not modeling.

| Property | Why shown |
|----------|-----------|
| Null % | How many rows are missing this value |
| Duplicates | Duplicate row count for this column |
| Blanks | Empty string count (different from null) |
| Anomalies | Statistical outliers in this column's values |

### Tier 3 — Advanced (hidden by default)
Context-specific or rarely used. Accessible via column visibility control.

| Property | When relevant |
|----------|--------------|
| Currency type | Only when format = currency and multi-currency model |
| Default date bucket | Only for date columns — sets default time grain (Day/Week/Month) |
| Calendar type | Fiscal vs. Gregorian calendar — niche |
| Geo config | Latitude/longitude or country/region columns only |
| Index priority | Search ranking — affects which columns surface in suggestions |
| Suggestion settings | Auto / Include / Exclude from suggestions |
| SpotIQ preference | Default / Exclude from automated insights |
| Custom sort | Categorical overrides (e.g. XS, S, M, L, XL instead of alphabetical) |
| Attribution dimension | Whether this dimension is used for campaign attribution logic |

---

## Design decisions

### Column order (left → right)
Fixed: ☐ checkbox · Column name

Default visible scrollable:
1. Source table (read-only)
2. Data type (read-only, auto from warehouse)
3. Description (editable textarea)
4. AI Context (editable textarea)
5. Synonyms (editable text, comma-separated)
6. Column type (dropdown: Attribute / Measure)
7. Aggregation (dropdown, **disabled for attributes**)
8. Additive (toggle Yes/No, **disabled for attributes**)
9. Hidden (toggle Yes/No)
10. Format pattern (dropdown: Number / Currency / Percentage / Date / Text)
11. Null % (read-only)
12. Duplicates (read-only)
13. Blanks (read-only)
14. Anomalies (read-only)

### Disabled pattern for measure-only properties
Aggregation and Additive only apply to measures. For attribute rows: show the cell but grey it out and make it non-interactive. Tooltip: "Only applicable to measures."

### Auto-detected values
Data type and Column type are auto-detected from the warehouse schema. Show an "Auto" badge (small, muted) when the value was set automatically. Analyst can override; badge disappears when manually set.

### Inline edit pattern
- Description, AI Context: Click anywhere in the cell → textarea expands. Blur or Cmd+Enter saves.
- Synonyms: Click → single-line text input. Comma-separated. Blur saves.
- Placeholder text when empty: "Click to add"
- Agent-written values show without any special treatment — they're just values.

### Agent sync
When the agent writes descriptions, AI context, or synonyms (Situation 3 — Coach), those changes must be reflected here. This requires Description/AI Context/Synonyms to be stored on ProjectState (not local component state), so agent writes and UI edits share the same source of truth.

### Top controls
- Search: filter rows by column name (client-side)
- Column visibility: toggle individual columns on/off. Tier 3 properties accessible here.
- Bulk action bar: appears when ≥1 checkbox checked → "Remove from model" action

---

## Open questions

- [ ] **Source column name as separate column** — currently merged with "Column name" (no renaming in prototype). Should be added as a distinct column in ColumnsView to support the rename feature. **Tracked as a future build task.**
- [ ] **Blank count vs. null count** — in Snowflake these are distinct. Show as two separate columns or merge into one? **Needs PM input.**
- [ ] **Anomaly count: absolute or percentage?** — confirmed as static (from last prep/profile scan, not live). Open question: is the value shown as an absolute row count or as a percentage? **Needs PM input.**
