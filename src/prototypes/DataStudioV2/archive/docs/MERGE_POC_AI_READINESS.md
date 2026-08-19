# Merge guide — POC AI-readiness flow

> **Read me before merging `dsv/poc-ai-readiness` into Vivek's `datastudio/prototype/data-studio`.**
> This document is written for a future Claude (or human) doing that merge. It records every
> file added, every line changed in shared files, why, and exactly how to resolve conflicts so
> the merge is clean and Vision behaviour stays byte-for-byte identical.

---

## 1. What this branch does (one paragraph)

Ports the **agentic Spotter-readiness / calibration flow** from the external repo
`surajboro-ts/spotter-readiness-vision` (its `Calibration` prototype, `agentic` variant =
`CalibrationAgentPanel.tsx`) into DataStudioV2, so it runs **inside DataStudioV2's own
`AgentPanel`** instead of a right-side panel, and is **launched from the AI-readiness pill**
in `ModelCanvas.tsx`. Scope decisions baked in: **readiness journey only** (scan → findings/
fixes → Spotter answer-grading → apply → Spotter ready), **no drift monitoring**,
**agent-panel only** (no canvas highlighting), **source design language kept** (ported
`.calx` CSS), **POC only** (`variant === 'poc'`) — Vision is untouched.

---

## 2. The single most important fact for a clean merge

**Almost all of the code is in a new, self-contained folder that Vivek's branch does not have:**

```
src/prototypes/DataStudioV2/components/pocReadiness/
```

Nothing in Vivek's branch references that folder, so **it cannot conflict**. The only places a
merge conflict can occur are the **three shared files** in §4. Every edit in those files is
wrapped in `POC-READINESS-PORT` marker comments so you can find and re-apply them mechanically:

```
grep -rn "POC-READINESS-PORT" src/prototypes/DataStudioV2/components/
```

If a shared file conflicts, **take Vivek's version wholesale, then re-apply only the marked
blocks below.** Do not hand-merge line-by-line.

---

## 3. New files (added — no conflict possible)

All under `src/prototypes/DataStudioV2/components/pocReadiness/`:

| File | Origin | Notes |
|------|--------|-------|
| `PocReadinessFlow.tsx` | **New** — ported from source `CalibrationAgentPanel.tsx` | The flow. Drift removed, `_dme*` canvas bridges + `CanvasFixOverlay` removed, renders its own `.calx` panel chrome. Mounted by `AgentPanel` (see §4.B). |
| `data.ts` | Ported from source `Calibration/data.ts` | **Drift section removed** (`DriftType`/`DriftStatus`/`DriftSignal`/`DRIFT_SIGNALS`/`DRIFT_FIX_TARGETS`). Everything else verbatim. `PILLARS`/`MODEL`/`severityRank` are retained but unused (harmless). |
| `readiness.css` | Ported from source `Calibration/calibration.css` **verbatim** + an appended block | Scoped entirely under `.calx` (zero collision — `.calx` is unused elsewhere in DataStudioV2, verified). The appended block (after the original last line `.calx-ag-lead {…}`) adds the flow's own panel/composer chrome (`.pr-*`, `.calx .prompt-bar`, `.calx .send-btn`, `.calx .agent-textarea`) and the inline fix-detail styles (`.calfx-detail*`). |
| `CalFixesDock.tsx` | Ported + one enhancement | The source's info action drove a **canvas overlay**; here it toggles an **inline before→after diff** in the dock (agent-only). `FixItem` gained optional `where`/`tag`/`diff`/`impact`/`suggestion`. |
| `InlineGrading.tsx` | Ported verbatim, imports retargeted | `../data` → `./data`; `./SpotterGradingModal` → `./gradingTypes`. |
| `GradingChart.tsx` | Ported verbatim, import retargeted | `../data` → `./data`. Uses `echarts-for-react` + `@tokens/colors/charts` (both already in the repo). |
| `icons.tsx` | Ported verbatim | Self-contained SVGs. |
| `gradingTypes.ts` | **New** — extracted | `GradeState` / `SpotterVerdict` / `GradingResult` (the source kept these in `SpotterGradingModal.tsx`, which is not ported). |
| `spotterFix.ts` | **New** — extracted | The source's `SpotterCards.spotterFix` helper only; the full `SpotterCards` (side-panel-only) is not ported. |

### Dependencies reused read-only (NOT edited — present on both branches)

- `src/prototypes/_agentic/` — `AgentMessage`, `UserBubble`, `ReasoningBlock`,
  `AgentResponseBlock`, type `ReasoningData`. **Tracked and present on Vivek's branch** (verified
  `git ls-tree datastudio/prototype/data-studio src/prototypes/_agentic/`).
  - ⚠️ **Divergence to know:** DataStudioV2's `_agentic/UserBubble` renders **plain text only**
    (no `html` prop). The source repo's copy supported `html`. `PocReadinessFlow` accordingly
    passes only `text` (the bulleted apply-summary is dropped to a short label). If a merge ever
    brings the `html`-capable `UserBubble` in, nothing breaks — `html` would just be ignored.
- `@tokens/colors/charts` (`chartPalette`), `echarts` / `echarts-for-react`,
  `@components/Button`, `@components/Checkbox` — all already in `package.json`.

**No new npm dependencies were added.** `package.json` is untouched.

---

## 4. Shared-file edits (the only conflict surface)

Three files. Each block is fenced by `POC-READINESS-PORT ↓ … ↑` (or a single-line marker for the
import). Line numbers below are **as authored on this branch** — treat them as hints; anchor on the
surrounding code, not the numbers.

### 4.A `components/ModelCanvas.tsx` — launch the flow from the pill (2 blocks)

**Block A1 — `SpotterReadinessPanel` component** (authored ≈ L693–747).
The POC pill dropdown already rendered a `SpotterReadinessPanel` (a "Check for" checklist with a
per-row **Run**). The change: its prop `onRun: (id) => void` became **`onStart: (scope: string[]) => void`**,
each row's Run now calls `onStart([pillar])`, and a **CTA button** ("Check Spotter readiness")
was added that calls `onStart(selectedOrAll)`. A `READINESS_PILLAR` map converts the panel's
check ids (`physical`/`semantics`/`answers`) to the flow's pillar ids (`physical`/`semantic`/`ai`).

- **Anchor:** `const SpotterReadinessPanel: React.FC<...` and the `SPOTTER_TESTS` array just above it.
- **If it conflicts:** take Vivek's `SpotterReadinessPanel` and re-apply: (1) change the prop to
  `onStart`, (2) point each Run + the new CTA at `onStart`. The `READINESS_PILLAR`/
  `ALL_READINESS_SCOPE` consts live just above the component inside the marker.

**Block A2 — the POC branch of the pill dropdown** (authored ≈ L2681–2685).
Inside `{poc ? ( … ) : …}` in the AI-readiness pill's `AnchoredMenu`, the panel is now:

```tsx
<SpotterReadinessPanel onStart={(scope) => { setAirOpen(false); if (hasTable) (window as any).__pocReadinessStart__?.(new Set(scope)); }} />
```

(Previously it was `<SpotterReadinessPanel onRun={() => { …; airRunScan(); }} />`.) This is the
only behavioural change to the pill — **POC only**, inside the existing `poc ?` ternary. The
Vision branches of that ternary are untouched.

- **Anchor:** the `{poc ? (` line inside the `airOpen && (() => { … <AnchoredMenu>` block.
- **If it conflicts:** in Vivek's `poc ?` branch, swap the panel's `onRun={… airRunScan …}` for
  the `onStart` version above.

> **Note on `airRunScan`:** the old POC path called the Vision scan (`airRunScan`). The new path
> no longer does. `airRunScan` and the rest of the Vision AI-readiness machinery are otherwise
> **untouched** and still drive the Vision pill.

### 4.B `components/AgentPanel.tsx` — host the flow (3 blocks)

**Block B1 — import** (authored ≈ L15, single-line marker):
```tsx
import PocReadinessFlow from './pocReadiness/PocReadinessFlow';
```
Place with the other local component imports (after `import { Button } …`).

**Block B2 — state + window bridge** (authored ≈ L2705–2718), immediately after
`const [refPickActive, setRefPickActive] = useState(false);`:
```tsx
const [pocReadinessActive, setPocReadinessActive] = useState(false);
const [pocReadinessScope, setPocReadinessScope] = useState<Set<string>>(new Set());
useEffect(() => {
  if (!poc) return;
  (window as any).__pocReadinessStart__ = (scope?: Set<string>) => {
    setPocReadinessScope(scope ?? new Set());
    setPocReadinessActive(true);
  };
  return () => { try { delete (window as any).__pocReadinessStart__; } catch { /* noop */ } };
}, [poc]);
```
The effect is a no-op unless `poc` is true. It registers the bridge that Block A2 calls.

**Block B3 — early-return guard** (authored ≈ L4758–4771), immediately before the component's
main `return (` (the one under the `// ── Render ──` comment, `<div style={fullPage ? … }>`):
```tsx
if (poc && pocReadinessActive) {
  return (
    <PocReadinessFlow scope={pocReadinessScope} width={width} fullPage={fullPage} onClose={() => setPocReadinessActive(false)} />
  );
}
```
**Placement is load-bearing:** it must sit **after all hooks** (it does — it's right before the
final render) so React's hook order stays unconditional. If you relocate it, keep it below every
`useState/useEffect/useMemo/useRef` in the component.

- **If B2/B3 conflict:** re-insert B2 next to the other `useState` hooks (any position among them
  is fine), and B3 immediately before the final `return (`. Both must be inside the `AgentPanel`
  component body.

### 4.C No other shared files

`index.tsx`, `variant.tsx`, `Shell.tsx`, `Overview.tsx`, `PromptBar.tsx`, `ConnectionPill.tsx`
are **not touched**. The `poc` flag already flows
`index.tsx:608 (poc={variant==='poc'})` → `ModelCanvas` → `AgentPanel poc={poc}`
(ModelCanvas embeds `<AgentPanel poc={poc}>` at ≈ L2898 and L4836). We reuse that existing
plumbing — no new prop threading.

---

## 5. Proof that Vision is untouched

- **ModelCanvas:** both edits are inside the existing `{poc ? (…) : (…vision…)}` ternary of the
  pill dropdown. The Vision branches (`airDropView === 'intro'`, pending list, tuning) and
  `airRunScan`/`airStartTuning`/`AIR_ITEMS` are unchanged.
- **AgentPanel:** the effect early-returns when `!poc`; the render guard requires `poc &&
  pocReadinessActive`. When `variant === 'vision'`, `poc` is false, `__pocReadinessStart__` is
  never registered, `pocReadinessActive` never flips, and the guard never fires — the component
  renders exactly as before.
- **CSS:** `readiness.css` is only imported by `PocReadinessFlow.tsx` (POC-only), and every rule
  is scoped under `.calx`, a class not used anywhere else in DataStudioV2.

---

## 6. Control flow (how a click reaches the flow)

```
AI-readiness pill (ModelCanvas, POC branch)
  └─ dropdown = <SpotterReadinessPanel>       ← unchanged surface, now with a CTA
       └─ CTA / row Run → onStart(scope)
            └─ window.__pocReadinessStart__(new Set(scope))     [bridge]
                 └─ AgentPanel effect setter → setPocReadinessActive(true)
                      └─ AgentPanel early return → <PocReadinessFlow scope=…>
                           physical pass → semantic pass → Spotter grading → apply → done
                           (Back/close → setPocReadinessActive(false) → normal panel restored)
```

The bridge (`window.__pocReadinessStart__`) mirrors the existing `__air*` / `__ds*` global
convention already used between ModelCanvas and AgentPanel — no new pattern introduced.

---

## 7. Verification checklist (run after merging)

1. `npm run build` → must be clean (Vite). *(Baseline: this branch builds clean; the repo's
   pre-existing `tsc` warnings in unrelated prototypes are not introduced here — the pocReadiness
   module and both shared-file edits are `tsc`-clean.)*
2. In the app, `?v=vision` (or the Vision toggle): AI-readiness pill behaves exactly as before
   (scan → Fix all → tune). **No `.calx` panel, no regression.**
3. `?v=poc`: add a table → click the AI-readiness pill → the "Check for" dropdown still opens →
   click **Check Spotter readiness** → the flow takes over the agent panel: physical checks
   stream → fixes dock (info toggles an inline diff) → Apply → semantic → Spotter grading
   (charts render via ECharts) → grade one wrong → fixes → Apply → ✅ "more ready for Spotter".
4. Click the header back chevron mid-flow → returns to the normal agent panel.
5. Confirm no console errors.

---

## 8. Full revert (if ever needed)

1. Delete `src/prototypes/DataStudioV2/components/pocReadiness/`.
2. Remove the marked blocks in `ModelCanvas.tsx` (restore `SpotterReadinessPanel` to `onRun` +
   the POC branch to `airRunScan`) and `AgentPanel.tsx` (import, state/effect, early return).
   `grep -rn "POC-READINESS-PORT"` finds all of them.

That leaves the tree identical to pre-port.
