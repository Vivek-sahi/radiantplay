# DE Review — Multi-source Flow
_Reviewed 2026-06-09 via 4-agent workflow (clarity, bugs, Netflix/Meta DE perspective, agent-context consistency)_

---

## Use-case verdict

The structure is credible — scan, propose, consent-gate every write, compile, build. A senior DE would buy it. What breaks credibility is the execution layer: three data correctness bugs that are exactly the kind of thing that cause production incidents. Fix those and it holds up.

---

## Critical issues (fix before showing to anyone)

### 1. Wrong driving table in join SQL
**Step:** Build (ms_build_project, Step 13 — join mapping collapsible)

The join SQL drives from `customer_health_external` (2,847 Pendo rows), then left-joins `dim_accounts`. Any account with no Pendo NPS response is excluded — that's 75% of the customer base (12,000 accounts in DIM_ACCOUNTS, only 2,847 in Pendo). The "97% join coverage" stat is 97% of Pendo rows, not of accounts. Actively misleading.

**Fix:**
```sql
-- Change FROM customer_health_external che LEFT JOIN dim_accounts da
-- to:
FROM dim_accounts da
LEFT JOIN customer_health_external che ON da.account_id = che.account_id
LEFT JOIN support_cases sc ON da.account_id = sc.account_id
LEFT JOIN call_metrics cm ON da.account_id = cm.account_id
LEFT JOIN customer_found_defects cfd ON da.account_id = cfd.account_id
```

Also update the validation message: "Pendo covers 2,847 of 12,000 accounts — accounts without NPS data will have null NPS components in the health score."

---

### 2. Formula references a non-existent column
**Step:** Build (ms_build_project, column selection / formula collapsible)

`p1_cases_open` appears in the CASE expression but doesn't exist in any source table. `SUPPORT_CASES` has `priority` and `status` as separate fields. `open_defects` has the same problem. An agent that profiled the tables cannot have found these columns.

**Fix:** Show the derivation comment in the formula collapsible:
```sql
-- p1_cases_open = COUNT(*) FILTER (WHERE priority='P1' AND status='Open')
-- open_defects   = COUNT(*) FILTER (WHERE status != 'Resolved')
```

---

### 3. "All checks passed" contradicts a visible flag
**Step:** Build execution message (ms_build_project)

The validation collapsible shows `SUPPORT_CASES DQ 81 — 14% null resolution_time — flagged`. The message the user reads says "All data quality checks passed."

**Fix:** Change to: "Done. One flag: `resolution_time_hours` in SUPPORT_CASES is 14% null — the health score uses P1 case count, not resolution time, so it won't affect results. Ready to test."

---

### 4. Silent `account_tier` column shadowing
**Step:** Staging compile / Build

Both `DIM_ACCOUNTS` and `csm_account_mapping` have `account_tier`. The model silently drops the warehouse-authoritative value with no message.

**Fix:** Add one sentence during the build step: "Both DIM_ACCOUNTS and the CSM CSV have `account_tier` — I'm using the CSM mapping version. Change this in model settings if you want the Snowflake value."

---

### 5. CSV added to Created panel before consent
**Step:** CSV upload → CSV write consent (Steps 8–9)

The CSV entry appears in the Created panel the moment the file is dropped, before the "OK to proceed?" gate. Every other write is gated — this one isn't. If user declines, panel already shows the file as created.

**Fix in `AgentPanel.tsx`:** Move the `multiSourceCreated` update (the `csv-dataset` push) from `handleFileUpload` to the `awaiting_csv_write_consent` confirm path (alongside the `spotStoreTables` update).

---

## Step-by-step gaps

| Step | Status | Issue |
|---|---|---|
| 1 — Env scan | ⚠ | Proposal text names tables by category but not by name inline (cards added this session help, but text should too) |
| 2 — "What other data?" | ⚠ | Completely open-ended. Demo path (Pendo + CSV) invisible. Needs a suggestion chip. |
| 3 — Notebook consent | ⚠ | Over-explains full pipeline (CDW write, sentiment) at wrong gate. Consequential decision is later. Lighten this message. |
| 4 — API key request | ⚠ | No artifact card for the notebook at the point it's created. No recovery path if key fails. |
| 5 — NPS column confirm | ⚠ | Says "predicting" but already hardcoded `nps_comments` in the notebook. Not predicting — reporting. Also no handler for "no." Change to: "The notebook targets `nps_comments` — ready to run it?" |
| 6 — Pendo write consent | ✓ | Well-constructed. |
| 7 — Pendo fetch | ⚠ | Sentiment breakdown (61%/24%/15%) is only in spinner step detail, not in completion message. It's the first real signal about customer sentiment — promote it. |
| 8 — CSV upload | ⚠ | "142 rows, 4 columns" — no column names shown. Silent join failures if names/types don't match. Show: "account_id, csm_name, exec_sponsor, csm_region" |
| 9 — CSV write consent | ✓ | Cleanest gate. |
| 10 — CSV process | ✓ | Good. "All types clean" in step detail but not in completion message — worth one line. |
| 11 — Staging consent | ⚠ | Fourth consent in a row. Could merge CSV write + staging compile into one gate to reduce fatigue. |
| 12 — Staging compile | ⚠ | Leads with refresh schedule, never recaps the 5-source architecture. Add a closing line before the build. |
| 13 — Build | ⚠ | See criticals 1–4. Excluded columns unnamed. AI enrichment is a black box — no example synonyms shown. |

---

## Tone / agent voice issues

- Agent asks user to confirm NPS column it already chose when writing the notebook. Reframe: "The notebook targets `nps_comments` — ready to run it?"
- "Tell me and I'll build the model" is passive. Kill it everywhere. Prose should match the chip: "Ready. Build the model."
- "Spotstore" and "staging table" introduced with no first-use definition, then over-explained after user already confirmed them. Calibration is off in both directions.

---

## Quick wins (each < 30 min, mostly copy changes)

1. **Name tables in scan proposal text** — "4 tables — DIM_ACCOUNTS, SUPPORT_CASES, CALL_METRICS, CUSTOMER_FOUND_DEFECTS — covering..."
2. **Fix "all checks passed"** — 15 words to resolve the visible contradiction
3. **Add suggestion chip at Step 2** — "Add Pendo NPS data + CSM CSV" makes demo path visible
4. **Promote sentiment breakdown** — move "positive: 61% · neutral: 24% · negative: 15%" into Pendo fetch completion message
5. **Show CSV column names** — "142 rows — account_id, csm_name, exec_sponsor, csm_region"
6. **Add recap line before build** — "This staging table joins with your 4 Snowflake tables — all 5 sources in the model build." Closes the mental loop from Step 1.

---

## Suggested build order for next session

1. Critical fix #5 (CSV consent bug — code change, 5 min)
2. Critical fix #1 (wrong driving table in join SQL — mockData.ts change)
3. Critical fix #2 (formula column derivation comments)
4. Critical fix #3 (all checks passed message)
5. Critical fix #4 (account_tier shadowing message)
6. Quick wins 1–6 (copy sweep across AgentPanel.tsx scripts)
7. Step 2 suggestion chip
8. Step 5 NPS column reframe
9. Step 7 sentiment in completion message
10. Step 8 CSV column names in consent message
