# Agent DB — Use-cases & cache-settings tree
A discussion + clarification artifact (not a spec). Two parts: the use-cases we're supporting, and a tree of every cache setting showing **what's available at which level** and **what's in MVP vs. later**.

Legend: ✅ in MVP · 🚫 not in MVP (future)

* * *
## What caching does (one line)
Cache a model's data from Snowflake into the ThoughtSpot **data store** so queries hit the cache instead of live Snowflake — lower query cost, faster loads. Anything outside the cache (e.g. rows older than a table's time window) still routes live to Snowflake.

* * *
## Use-cases we support
1. **Cache a whole model in one step** — _Full Model_: every table, all history, on a schedule.
  
2. **Cache a large model selectively** — _Custom_: every table defaults to **All history**; the user can switch individual tables to a time window (last 1 / 3 / 6 / 13 months) so only recent history is cached and the long tail stays live (cost / space control).
  
3. **Keep the cache fresh on a schedule** — daily / weekly / monthly at a set time, optionally skipping weekends, in a chosen timezone.
  
4. **Operate an existing cache** — Refresh now · Purge snapshot (keep config) · Disable (remove data + config) · Edit settings.
  
5. **Monitor spend (admin)** — data store purchased / used / available, and which models are consuming space.
  
6. **Debug & audit runs** — run history + per-table breakdown (rows, size, duration, status, note); last-run success/failure surfaced.
  
7. **Spot cached models at a glance** — a Snowflake-source + cache indicator in the model list.
  

* * *
## Cache-settings tree — what's configurable, and at which level
```
Model
├─ Cache scope .................. Full Model | Custom .................... ✅
├─ Refresh schedule
│  ├─ Frequency ................. Daily | Weekly | Monthly ............... ✅
│  ├─ Time of day ............... HH : MM ................................ ✅
│  ├─ Exclude weekends .......... on / off ............................... ✅
│  └─ Timezone .................. e.g. Asia/Calcutta ..................... ✅
│
└─ Table  (only when Cache scope = Custom)
   ├─ Time window ............... All history | Last 1 / 3 / 6 / 13 months ✅
   ├─ Reference date column ..... required when a time window is set ...... ✅
   ├─ Which tables to cache ..... choose a subset of tables .............. 🚫  (MVP caches all tables)
   ├─ Per-table refresh ......... its own frequency per table ............ 🚫  (one schedule per model)
   └─ Per-table filter .......... row filter, e.g. region = 'US' ......... 🚫  (future)
```

**Read it as:** everything at the **Model** level is one setting for the whole model. Under **Custom**, each table defaults to **All history** and can be switched to a time window (+ reference date column); table _selection_, _per-table refresh_, and _filters_ are recognized levers but deliberately **out of MVP**.

* * *
## Explicitly out of MVP
- **Table selection** — all tables in the model are cached; you can't cache only some.
  
- **Per-table refresh frequency** — a single schedule applies to the whole model.
  
- **Filters** — no row-level filter on what gets cached (e.g. only US, only active).
  

* * *
## Open questions for discussion
1. Is "cache **all** tables" acceptable for v1, or is table selection needed before GA?
  
2. Should a per-table time window ever imply a per-table refresh cadence, or always one model schedule?
  
3. Filters: which matter first — date range beyond the window, geo/segment, something else?
  
4. Any **column**-level control needed (cache a subset of columns), or is that out of scope entirely?
