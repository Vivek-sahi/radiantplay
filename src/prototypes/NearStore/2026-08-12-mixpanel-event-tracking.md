# Pulse (AgentDB) — Mixpanel tracking plan
**Owner:** Vivek Sahi · **Date:** 2026-08-12 · **Status:** Draft for eng handoff

* * *
## 1. Scope
Adoption and post-enable churn on the data-person side. Client-side only (Mixpanel JS), fired from the Data workspace.

Out of scope: cache hit rate, latency, cost avoided (query path — backend, separate plan); consumption-side freshness marker (not shipped). Config-choice, purge, setup-abandonment and blocked-model questions are deliberately deferred — see §9.
## 2. Questions
| #   | Question |
| --- | --- |
| Q1  | Are people adopting caching? |
| Q3  | Have people disabled caching after enabling it? |

Numbering follows the original list; Q2, Q4–Q7 are out of scope for this phase.
## 3. Conventions
- **Events:** `Object Action`, past tense, Title Case — `Cache Action Performed`.
  
- **Properties:** `snake_case`.
  
- **Few events, many properties.** Every cache action on a model is one event differentiated by an `action` property, not one event per action — Mixpanel's recommended shape, and new actions need no new event.
  
- Loads and actions stay separate. A load is an impression; folding it into the action event would break both denominators.
  
- No `$` or `mp_` prefixes on custom names — reserved by Mixpanel.
  
- No dynamic values in event names; they go in properties.
  
- **Current state** → group profile properties. **History** → events.
  
- Enums are closed sets (§6). No free text.
  
- If the ThoughtSpot Mixpanel project already has a convention, match it instead.
  
## 4. Properties on every event
Super properties, set once.

| Property | Type | Example |
|---|---|---|
| `org_id` | string | `org_8f21` |
| `cluster_id` | string | `nebula-simar` |
| `ts_version` | string | `10.14.0` |
| `user_role` | enum | `data_engineer` |
| `is_internal` | bool | `true` |

No model, table, or column names in any payload. `model_id` is an opaque ID.
## 5. Events
Three events. Group Analytics keyed on `org_id`. Anchors: `src/prototypes/NearStore/`, branch `prototype/data-studio`.
### Data Workspace Loaded — Q1
Data objects or the Pulse dashboard **finished loading** its model list, once per session. `DataObjectsView.tsx` / `DataStoreView.tsx`

| Property | Type | Notes |
| --- | --- | --- |
| `models_cacheable` | int | Adoption denominator |
| `models_cached` | int | Adoption numerator |
| `models_invalidated` | int | Cached but stale — configured, not delivering |

Also write all three to the `org_id` **group profile** on this event: the profile gives current-state org segmentation, the event gives the trend.
### Caching Tab Loaded — Q1
Caching tab **content rendered** for a model — after cacheability and cache state resolve, not on tab click. `CachingTab.tsx`

| Property | Type |
| --- | --- |
| `model_id` | string |
| `cache_status` | enum |
| `is_cacheable` | bool |
### Cache Action Performed — Q1, Q3
Every cache action on a model, one event. Fires on **confirm / save**, never on menu-item click.

| Action | Fires when | Anchor |
|---|---|---|
| `enabled` | Caching settings saved for the first time on a model | `CachingSettingsModal.tsx:118` → `handleSave` |
| `settings_edited` | Caching settings saved on an already-cached model | same, edit mode |
| `disabled` | Disable confirmed | `CachingTab.tsx:307` → `ConfirmModal` |
| `refreshed` | Manual refresh triggered | `CachingTab.tsx:305` |

**Properties by action** — `✓` = required, `—` = omit.

| Property | Type | `enabled` | `settings_edited` | `disabled` | `refreshed` |
|---|---|---|---|---|---|
| `model_id` | string | ✓ | ✓ | ✓ | ✓ |
| `action` | enum | ✓ | ✓ | ✓ | ✓ |
| `scope` | enum | ✓ | ✓ | ✓ | — |
| `days_since_enabled` | int | — | ✓ | ✓ | ✓ |
| `runs_completed` | int | — | — | ✓ | ✓ |
| `runs_errored` | int | — | — | ✓ | — |
| `was_invalidated` | bool | — | — | ✓ | ✓ |
| `trigger` | enum | — | — | — | ✓ |
| `days_since_last_run` | int | — | — | — | ✓ |

`action = enabled` is the adoption conversion **and** the start of the Q3 survival cohort, so it must be distinguishable from `settings_edited` — an edit counted as an enable inflates adoption.
## 6. Enums
| Property | Values |
|---|---|
| `action` | `enabled` \| `settings_edited` \| `disabled` \| `refreshed` |
| `cache_status` | `not_cached` \| `cached` \| `refreshing` \| `invalidated` \| `purged` |
| `scope` | `full` \| `custom` |
| `trigger` | `menu` \| `invalidated_banner` |
| `user_role` | `admin` \| `data_engineer` \| `analyst` \| `consumer` |

Send `invalidated`, not the internal `paused` key from `types.ts`.
## 7. Metrics
| Metric | Computation | Q   |
| --- | --- | --- |
| Adoption rate | `models_cached / models_cacheable` per org, weekly | Q1  |
| Intent conversion | models with `Cache Action Performed (action=enabled)` ÷ models with `Caching Tab Loaded (is_cacheable=true)` | Q1  |
| Invalidation share | `models_invalidated / models_cached` per org | Q1  |
| Maintained caches | models with ≥1 `action=refreshed` in 30 days ÷ cached models | Q1  |
| Cache survival | retention cohort: `action=enabled` → `action=disabled`, 30 / 60 / 90 days | Q3  |
| Early churn | `action=disabled` where `days_since_enabled <= 14` ÷ all disabled | Q3  |
| Churn cuts | `action=disabled` broken down by `runs_errored > 0`, `was_invalidated`, `scope` | Q3  |

Every report on `Cache Action Performed` filters on `action` — none of them read the raw event count.
## 8. Reports
1. Adoption trend — weekly `models_cached / models_cacheable`, by org.
  
2. Intent conversion — `Caching Tab Loaded (is_cacheable=true)` → `Cache Action Performed (action=enabled)`.
  
3. Cache survival — retention cohort, `enabled` → `disabled`, 30 / 60 / 90 days.
  
4. Churn breakdown — `action=disabled` by `days_since_enabled` bucket, `runs_errored`, `was_invalidated`, `scope`.
  
5. Invalidation share — org-level, trended.
  

All filtered `is_internal = false`.
## 9. Not tracked
Out of scope for this phase, each with the question it would have answered:

| Dropped | Would have answered |
| --- | --- |
| `action = purged` | Q2 — do people need to purge |
| `window_months_selected` on save | Q4, Q5 — window length and per-table windowing |
| Setup started / abandoned | Q6 — never tried vs bailed in setup |
| Blocked-state impression + `reason_code` | Q7 — blocked models by reason |
| Run history, status recheck, learn-more | Trust in the schedule and in run status |
| Scheduled run outcomes | Server-side |
| Cache hit rate, latency, cost avoided | Query path, backend |

`scope` is kept only as a churn cut on `disabled`, not as a Q4 config metric.
## 10. QA
- [ ] 
  
  Super properties on every event.
  
- [ ] 
  
  `action` present on every `Cache Action Performed`; value from §6 exactly.
  
- [ ] 
  
  `enabled` vs `settings_edited` correct on both save paths — the single easiest thing to get wrong.
  
- [ ] 
  
  Property matrix in §5 respected; omit inapplicable properties rather than sending null.
  
- [ ] 
  
  `disabled` fires on confirm only; cancel emits nothing.
  
- [ ] 
  
  Loads fire after content resolves, not on click or route change.
  
- [ ] 
  
  `Data Workspace Loaded` debounced to once per session, and writes the group profile.
  
- [ ] 
  
  `cache_status` sends `invalidated`, not `paused`.
  
- [ ] 
  
  No model, table, or column names in payloads.
  
- [ ] 
  
  `is_internal=true` on dev clusters.
