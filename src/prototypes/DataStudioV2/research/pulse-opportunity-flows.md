# Pulse Opportunity Flows — UX Design

**Context**: User clicks an opportunity item in the Pulse pane on the Overview page. Each opportunity type surfaces a different problem that can be solved with agent assistance.

**Design principles** (from schema drift monitoring flow):
- Storytelling structure: What → Why → Impact
- Progressive disclosure with tabs when needed
- Custom styling over Radiant components
- Clickable objects open in right panel
- Clean visual hierarchy with minimal decoration
- Confidence scoring for recommendations
- Per-item action selection where appropriate

---

## Opportunity Types

Based on `ACTIVE_INSIGHTS`, we have 5 optimization opportunity types:

| ID | Type | Priority | Example Title |
|----|------|----------|---------------|
| O3 | Semantic gaps | 8 | "4 column descriptions missing — Marketing Campaign Attribution" |
| O4 | Cache miss | 7 | '"Win rate by region" — 0% cache hit rate, Sales Performance' |
| O1 | Slow query | 9 | '"Lifetime value distribution" slow — Customer 360' |
| O2 | Unused columns | 10 | '6 unused columns — Churn Prediction' |
| O5 | Low adoption | 10 | 'Low adoption — Churn Prediction' |

---

## Flow 1: Semantic Gaps (O3) — "Fill with agent →"

**Trigger**: User clicks opportunity `ins-o3` — "4 column descriptions missing"

**Journey**: Overview → Agent detects gaps → Generates descriptions → User reviews/edits → Apply → Success card

### Card 1: SemanticGapsCard (Detection)

**What happened**
```
Semantic gaps detected
Marketing Campaign Attribution · 4 columns missing descriptions · Spotter failing 31 queries/week
```

**Why it matters** (yellow info box, subtle)
```
Without descriptions, Spotter can't understand what these columns mean or when to use them. 
This causes query failures and increases analyst interruptions.
```

**Impact** (two tabs: Columns | Downstream)

**Tab: Columns**
Table showing the 4 columns with gaps:

| Column | Type | Current Description | Sample Values | Spotter Failures |
|--------|------|---------------------|---------------|------------------|
| campaign_id | string | — | "cmp_2024_q1_001", "cmp_2023_h2_045" | 12/week |
| target_region | string | — | "APAC", "EMEA", "NA" | 8/week |
| channel | string | — | "paid_search", "organic_social", "email" | 7/week |
| spend | number | — | 45000, 23400, 78900 | 4/week |

- Make column names clickable → opens model in right panel with that column selected
- Spotter Failures column shows impact per column

**Tab: Downstream**
Show where Spotter is failing:

**Example failed queries** (top 3)
- "What's our spend by channel this quarter?" — Failed 8 times this week
- "Show me campaign performance in APAC" — Failed 5 times this week  
- "Compare paid search vs organic social ROI" — Failed 4 times this week

**Action**
```
[Fill with agent →]  (blue button, right-aligned)
```

---

### Card 2: SemanticFillRecommendationsCard (AI-generated descriptions)

**Agent generates descriptions** (working steps)
1. Analyzing column usage patterns...
2. Reviewing sample values and join relationships...
3. Generating context-aware descriptions...

**Recommended descriptions**

For each column, show:
- Column name (clickable)
- AI-generated description (editable textarea, 2-3 lines)
- Confidence pill (High/Medium)
- Sample values below for context

Example layout:

```
┌─ campaign_id ────────────────────────────────────┐
│ Unique identifier for marketing campaigns.       │
│ Links to campaign master table to track          │
│ performance metrics and attribution.              │
│                                                   │
│ [High confidence]                                 │
│ Sample: "cmp_2024_q1_001", "cmp_2023_h2_045"     │
└───────────────────────────────────────────────────┘

┌─ target_region ──────────────────────────────────┐
│ Geographic region targeted by the campaign.       │
│ Values include APAC, EMEA, NA for Americas,      │
│ Europe/Middle East/Africa, and Asia Pacific.     │
│                                                   │
│ [High confidence]                                 │
│ Sample: "APAC", "EMEA", "NA"                      │
│                                                   │
│ [Edit]                                            │
└───────────────────────────────────────────────────┘
```

Each description is in an editable textarea - user can refine inline.

**Note below recommendations:**
```
These descriptions are based on column usage patterns, sample data, and join relationships. 
Review and edit before applying.
```

**Actions**
```
[Cancel]  [Apply descriptions →]  (Apply is primary blue button)
```

---

### Card 3: SemanticGapsResolvedCard (Success)

```
🎉 Descriptions added and Spotter updated

✓ 4 column descriptions added
✓ Model metadata refreshed  
✓ Spotter context updated
❤️ ~31 failed queries/week will now succeed

─────────────────────────────────

Descriptions applied
2:45 PM today

[View model →]  [Undo]
```

**Styling**:
- Green border (`#bbf7d0`)
- Celebration emoji (🎉) next to title
- Checkmarks for first 3 items
- Heart for the impact line
- Clean white background
- Time stamp with undo option

---

## Flow 2: Cache Miss Opportunity (O4) — "Enable with agent →"

**Trigger**: User clicks opportunity `ins-o4` — '"Win rate by region" — 0% cache hit rate'

### Card 1: CacheMissOpportunityCard (Detection)

**What happened**
```
Cache miss opportunity detected
Sales Performance · "Win rate by region" · Run 34× this week · 0% cache hit · ~374s wasted
```

**Why it matters**
```
This query is run frequently but never cached, causing unnecessary warehouse load and slow response times. 
Enabling caching would save ~11 seconds per query.
```

**Impact** (single view, no tabs needed)

**Query pattern**
```
Query: "Win rate by region"
Frequency: 34 runs this week (avg 5/day)
Avg execution time: 11.2s
Cache hit rate: 0%
Total time wasted: ~374s this week
Potential savings: ~11s per query
```

**Who's running it**
- Sarah Chen (12 runs)
- Marcus Rodriguez (8 runs)
- 6 others (14 runs)

**Action**
```
[Enable caching with agent →]
```

---

### Card 2: CacheConfigurationCard (Configure cache settings)

**Recommended cache settings**

```
Cache scope
● This query only  "Win rate by region"
○ All similar queries  Queries with same dimensions (region, time_period)
○ Model-level cache  All queries on Sales Performance model
```

**Refresh strategy**
```
Refresh schedule: [Every 6 hours ▼]
  Options: Real-time, Every hour, Every 6 hours, Daily, Weekly

TTL (time to live): [24 hours ▼]
  Options: 1 hour, 6 hours, 12 hours, 24 hours, 7 days

First refresh: [Now]
```

**Estimated impact**
```
Expected cache hit rate: ~85% (based on query pattern)
Time saved per week: ~320s (5.3 minutes)
Warehouse cost reduction: ~$0.42/week
```

**Actions**
```
[Cancel]  [Enable cache →]
```

---

### Card 3: CacheEnabledCard (Success)

```
🎉 Caching enabled for "Win rate by region"

✓ Cache policy created
✓ First data pull scheduled
✓ Query routing updated
❤️ ~11s saved per query · ~320s/week total

─────────────────────────────────

Cache enabled
2:45 PM today

[View cache config →]  [Disable]
```

---

## Flow 3: Slow Query Hot Spot (O1) — "Optimize with agent →"

**Trigger**: User clicks opportunity `ins-o1` — '"Lifetime value distribution" slow'

### Card 1: SlowQueryCard (Detection)

**What happened**
```
Slow query hot spot detected
Customer 360 · "Lifetime value distribution" · Avg 1.2s · Run 18× this week · Full table scan
```

**Why it matters**
```
This query performs a full table scan on a large fact table, causing slow response times 
and high warehouse costs. Optimization could reduce execution time by 60-80%.
```

**Impact**

**Query details**
```
Query: "Lifetime value distribution"
Frequency: 18 runs this week
Avg execution time: 1.2s
Warehouse cost: ~$0.08 per query
Total cost this week: ~$1.44
```

**Performance breakdown**
```
Table scan: 850ms (71%)  ← Problem
Join operations: 220ms (18%)
Aggregation: 90ms (8%)
Network: 40ms (3%)
```

**Action**
```
[Optimize with agent →]
```

---

### Card 2: QueryOptimizationCard (Recommendations)

**Agent analyzes query** (working steps)
1. Analyzing query execution plan...
2. Identifying bottlenecks...
3. Generating optimization recommendations...

**Recommended optimizations**

```
1. Add index on customer_segment + signup_cohort
   Impact: Reduce table scan time by ~75%
   Estimated new execution time: ~320ms (from 1.2s)
   
   [✓ Apply]  [Skip]

2. Materialize lifetime_value as a computed column
   Impact: Eliminate complex calculation at query time
   Estimated new execution time: ~180ms (from 320ms)
   Trade-off: +2MB storage, daily refresh needed
   
   [✓ Apply]  [Skip]

3. Enable query result caching
   Impact: Instant results for repeat queries
   Expected cache hit rate: ~65%
   
   [✓ Apply]  [Skip]
```

Each recommendation has checkbox (checked by default if high confidence).

**Combined impact**
```
Current: 1.2s avg
With optimizations: ~180ms avg  
Improvement: 85% faster
Cost savings: ~$1.22/week
```

**Actions**
```
[Cancel]  [Apply selected optimizations →]
```

---

### Card 3: QueryOptimizedCard (Success)

```
🎉 Query optimized successfully

✓ Index created on customer_segment + signup_cohort
✓ Lifetime_value materialized
✓ Result caching enabled
❤️ 85% faster · ~1s saved per query

─────────────────────────────────

Optimizations applied
2:45 PM today

[View query performance →]  [Revert]
```

---

## Flow 4: Unused Columns (O2) — "Clean up with agent →"

**Trigger**: User clicks opportunity `ins-o2` — '6 unused columns — Churn Prediction'

### Card 1: UnusedColumnsCard (Detection)

**What happened**
```
Unused columns detected
Churn Prediction · 6 columns unused · 30+ days without queries · Cluttering Spotter context
```

**Why it matters**
```
Unused columns add noise to the semantic layer, making it harder for Spotter to find relevant 
data and increasing context size. Hiding them improves both AI accuracy and user experience.
```

**Impact**

**Unused columns**
| Column | Type | Last Queried | Reason |
|--------|------|--------------|--------|
| referral_source | string | 47 days ago | No queries referencing this column |
| device_type | string | 38 days ago | Replaced by device_category |
| shipping_method | string | 35 days ago | Not relevant for churn analysis |
| legacy_user_id | string | Never | Migration artifact |
| temp_flag_2023 | boolean | 62 days ago | Temporary flag, no longer used |
| old_segment | string | 41 days ago | Replaced by customer_segment |

- Make column names clickable

**Model size impact**
```
Current: 34 columns in Spotter context
After cleanup: 28 columns (18% reduction)
```

**Action**
```
[Clean up with agent →]
```

---

### Card 2: ColumnCleanupRecommendationsCard (Hide or remove)

**Recommended action per column**

For each column:
```
┌─ referral_source ─────────────────────────────────┐
│ Last queried: 47 days ago                         │
│ Reason: No queries referencing this column        │
│                                                   │
│ ● Hide from Spotter  (keeps data, hides from AI) │
│ ○ Remove entirely   (requires warehouse change)  │
│ ○ Keep visible                                    │
└───────────────────────────────────────────────────┘
```

**Note**:
```
"Hide from Spotter" removes columns from the semantic layer but keeps the warehouse data intact. 
"Remove entirely" requires a warehouse change and is not recommended unless the data is truly obsolete.
```

Default: All set to "Hide from Spotter"

**Actions**
```
[Cancel]  [Apply cleanup →]
```

---

### Card 3: ColumnsCleanedUpCard (Success)

```
🎉 Columns cleaned up and model simplified

✓ 6 columns hidden from Spotter
✓ Model context reduced by 18%
✓ Spotter accuracy improved
❤️ Cleaner, more focused semantic layer

─────────────────────────────────

Cleanup applied
2:45 PM today

[View model →]  [Undo]
```

---

## Flow 5: Low Adoption (O5) — "Improve with agent →"

**Trigger**: User clicks opportunity `ins-o5` — 'Low adoption — Churn Prediction'

### Card 1: LowAdoptionCard (Detection)

**What happened**
```
Low model adoption detected
Churn Prediction · 7 users · 94 queries/month · Avg model: 89 users, 1,839 queries/month
```

**Why it matters**
```
This model has significantly lower usage than similar models in your organization. 
This could indicate discovery issues, trust problems, or gaps in the semantic layer.
```

**Impact** (tabs: Usage | Gaps)

**Tab: Usage**
```
Users: 7 (vs 89 avg)  ▼ 92% below average
Queries/month: 94 (vs 1,839 avg)  ▼ 95% below average
Last query: 3 hours ago
Model age: 6 months

Top users:
1. Sarah Chen — 34 queries this month
2. Marcus Rodriguez — 22 queries
3. Alex Kim — 18 queries
4. 4 others — 20 queries combined

Most common queries:
1. "Show me churn rate by segment" (18 queries)
2. "Predict churn risk for top accounts" (14 queries)
3. "What factors drive churn?" (11 queries)
```

**Tab: Gaps**
```
Potential issues limiting adoption:

Missing descriptions: 8 columns without descriptions
Missing synonyms: 12 columns without alternate terms
Low data quality: 4 columns with >10% null rate
Missing documentation: No model-level description or use cases
No example queries: Users don't know what questions to ask
```

**Action**
```
[Improve with agent →]
```

---

### Card 2: AdoptionImprovementCard (Recommendations)

**Agent analyzes adoption barriers** (working steps)
1. Analyzing usage patterns and user feedback...
2. Comparing to high-adoption models...
3. Generating improvement recommendations...

**Recommended improvements**

```
1. Add model description and use cases
   Impact: Helps users discover and understand the model
   Confidence: High
   
   [Generated description]
   "Churn Prediction model helps identify customers at risk of churning 
   and understand the factors driving churn. Use this model to..."
   
   [✓ Apply]  [Edit]  [Skip]

2. Fill 8 missing column descriptions
   Impact: Improves Spotter accuracy and user trust
   Confidence: High
   
   [✓ Apply]  [Skip]

3. Add 15 example queries
   Impact: Shows users what questions they can ask
   Confidence: Medium
   
   Examples:
   - "Which customers are at highest risk of churning?"
   - "What's our churn rate trend over the past 6 months?"
   - "Show me churn by customer segment and tenure"
   
   [✓ Apply]  [Edit]  [Skip]

4. Add synonyms to 12 columns
   Impact: Makes columns easier to discover in natural language
   Confidence: Medium
   
   [✓ Apply]  [Skip]

5. Fix data quality issues (4 columns with high null rates)
   Impact: Increases user trust in the data
   Confidence: Low (requires source data changes)
   
   [Skip]  [Review issues →]
```

**Actions**
```
[Cancel]  [Apply selected improvements →]
```

---

### Card 3: AdoptionImprovementAppliedCard (Success)

```
🎉 Model improvements applied

✓ Model description added
✓ 8 column descriptions added
✓ 15 example queries added
✓ 12 columns got synonyms
❤️ Model is now more discoverable and user-friendly

─────────────────────────────────

Improvements applied
2:45 PM today

[View model →]  [Share with team]
```

---

## Shared Design Patterns

**Across all flows:**

1. **Three-act structure**: What happened → Why it matters → Impact
2. **Yellow info boxes** for "Why it matters" (subtle, not shouty)
3. **Progressive disclosure** via tabs when there's both technical detail and downstream impact
4. **Clickable objects** (columns, models, queries) open in right panel
5. **Confidence pills** for AI recommendations (High/Medium/Low, colored appropriately)
6. **Per-item actions** (checkboxes or radio buttons) when users can choose what to apply
7. **Working steps** animation when agent is analyzing (3-4 steps, 700-800ms each)
8. **Success cards** with:
   - Green border
   - Celebration emoji (🎉)
   - Checkmarks for applied changes
   - Heart (❤️) for impact/benefit line
   - Timestamp + undo option
9. **Editable AI content** (descriptions, queries) shown in textareas
10. **Estimated impact** shown before and after for optimization flows

**Typography & spacing**:
- Title: 15px semibold
- Section labels: 12px medium, `#94a3b8` (slate)
- Body text: 13px regular
- Meta text: 11-12px, `#9ca3af` (gray)
- Generous whitespace between sections (18-24px)
- Hairline dividers: 0.5px `rgba(0,0,0,0.08)`

**Colors**:
- Primary action: `#2770ef` (brand blue)
- Success: `#22c55e` (green)
- Warning: `#f59e0b` (amber)
- Error: `#dc2626` (red)
- Info boxes: `#fef3c7` background, `#92400e` text (subtle yellow)
- Borders: `rgba(15,23,42,0.1)` default, `#bbf7d0` success

---

## Implementation Notes

**AgentPanel.tsx additions needed**:
1. Five new genUI card components (one per opportunity type)
2. Five new SCRIPTS entries for agent workflows
3. Update `handleGenUIAction` to route opportunity actions
4. Wire `onOpenObject` for clickable elements
5. Add working step animations (reuse existing pattern)

**Workspace.tsx connections**:
- `onFixWithAgent` already wired from Overview
- Need to pass through to AgentPanel
- Right panel should open when clicking object links

**mockData.ts**:
- Semantic gaps detail already exists (`SEMANTIC_GAPS`)
- Add mock data for other opportunity types:
  - Cache query patterns
  - Query execution plans
  - Unused columns with last-queried dates
  - Adoption metrics comparison

---

## Future Enhancements

1. **Before/after preview** for optimizations (show query plan diff)
2. **Confidence explanation** on hover for AI recommendations
3. **Bulk opportunity resolution** (fix all semantic gaps across multiple models)
4. **Impact tracking** (show actual improvement after fix applied)
5. **Team collaboration** (assign opportunities, comment on recommendations)
6. **Scheduled opportunities** (recurring checks, proactive alerts)
