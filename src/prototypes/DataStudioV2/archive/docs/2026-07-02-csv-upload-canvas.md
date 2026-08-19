# CSV upload + model data mode — ModelCanvas spec
_Status: SIGNED OFF · 2026-07-02 · target:_ `src/prototypes/DataStudioV2/components/ModelCanvas.tsx` _(self-contained)_
## Goal
Let a user bring an external file (CSV) into the visual canvas as a first-class, joinable source — and, because our data store can't federate-join with the warehouse, make the **Live vs. Cached** model state explicit (one-way).
## Decisions (final)
- **Entry points:** file picker (via "Add data → Upload file") **and** drag-and-drop onto the canvas. Manual only — no agent path.
  
- **CSV node:** inserted as a `CanvasGroup` via `addToCanvas`; badged as a file source; table name from filename (editable).
  
- **Preview:** reuse the existing preview panel UX (same as warehouse tables) — no new surface.
  
- **Properties:** add a "CSV import" section — delimiter, first-row-is-header, quote char, encoding (display), table name.
  
- **Fidelity:** **canned mock** (no real parse). The mock CSV carries **nulls in some columns** so a "fix null issues" prep transform has something to act on.
  
- **Demo CSV (default):** `customer_regions.csv` — joins `customers` on `customer_id`; nulls in `region` / `csm_owner`. (Revisit when the canvas mock data is swapped to Customer Health.)
  
- **Data mode:** a **prominent, read-only status indicator** in the canvas global header — **Live (federated)** vs **Cached (materialized)**. **One-way:** once external data is brought in (or a transform applied), the model is Cached and **cannot revert to Live**. Not a toggle.
  
- **Confirm gate:** when the user uploads a CSV **or** applies a transform (filter/formula/SQL/Python) **while CDW sources are present**, prompt before flipping to Cached. Cancel = action not applied.
  

**Confirm prompt (copy draft):**

> _"To join uploaded files and run transformations, ThoughtSpot will cache this model's warehouse data into its data store. The model will run on cached data (refreshed on a schedule). This can't be switched back to live query."_ → **Cache & continue** / Cancel.

After confirm: header indicator shows **Cached**; each warehouse node gets a subtle **"Cached"** badge.

**Nuance:** caching is only needed when CDW sources are present. A CSV joined only to another file/Spotstore source stays in-store with no prompt.
## Build order
1. `sourceKind` on the source step / `CanvasGroup` (`warehouse` | `csv`) + file badge on the node.
  
2. Mock CSV dataset (`customer_regions`) with null cells; wire into `TABLE_COLS` + preview data.
  
3. File picker on the "Upload file" menu item + drop handler on the canvas → `addToCanvas` as a CSV node.
  
4. Properties "CSV import" section (delimiter / header / quote / encoding / name).
  
5. Model data-mode state (`live` | `cached`) + prominent header status indicator.
  
6. Confirm gate on upload / transform → set cached, add "Cached" badges to warehouse nodes.
