# POC / Vision gating review — outstanding

_Created 2026-07-28, when Komal's POC cut was merged into DataStudioV2._


## Why this exists

Her POC work arrived mostly gated behind the `poc` prop, but not entirely. Two
ungated changes were found and split by variant during the merge:

- data-browser tree rows — Vision's hover info/add pair was replaced by a single
  always-visible `+`. Restored behind `!poc`.
- data-browser collapse — Vision's collapse-to-0 + topbar reopen was replaced by
  a 44px rail with a header toggle. Restored behind `!poc`.

Both were found by hand. The regions below are the rest of the surface where the
same kind of change could be hiding: hunks in `ModelCanvas.tsx` that differ from
pre-merge Vision and contain **no** `poc` reference.

**Important:** most of these are *not* regressions. Many are genuine improvements
that belong in both cuts — the unified `renderColumnsTable` (which replaced two
narrower semantic tables and added Description / AI context / Synonyms / Indexed)
is a good example. Some are pure refactors. The job is to classify, not to revert.

## How to work through it

For each region: open it, compare against pre-merge Vision, and mark one of

- **both** — improvement, keep unconditional (no action)
- **gate** — changes Vision's behaviour, wrap the Vision path in `!poc`
- **n/a** — refactor / no behavioural change

Pre-merge Vision for any line: `git show pre-komal-merge-2026-07-28:src/prototypes/DataStudioV2/components/ModelCanvas.tsx`

Line numbers are **post-merge** `ModelCanvas.tsx` and will drift as the file is
edited — re-generate with the diff against the tag if they get stale.

## Regions (71)

| # | Lines | +/- | First changed line |
|---|-------|-----|--------------------|
| 1 | `L1-15` | +6/-2 | `import { c, sp, ff, fs, fw } from '../styles';` |
| 2 | `L23-33` | +3/-1 | `filter?: { name: string; column: string; operator: string; value: string }; // per-step filter predicate` |
| 3 | `L104-131` | +13/-1 | `case 'formula': return <svg {...p}><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.3" s…` |
| 4 | `L460-486` | +12/-1 | `function isStepSaved(s: PipelineStep): boolean {` |
| 5 | `L491-498` | +1/-0 | `{ op: 'join',    label: 'Join' },` |
| 6 | `L610-618` | +2/-4 | `const IconChevronRight = ({ color = '#A5ACB9' }: { size?: number; color?: string }) => (` |
| 7 | `L623-688` | +36/-29 | `const IconInfo = ({ size = 12 }: { size?: number }) => (` |
| 8 | `L690-696` | +0/-13 | `` |
| 9 | `L699-771` | +59/-41 | `const SPOTTER_TESTS = [` |
| 10 | `L776-791` | +3/-4 | `showColumns?: boolean;` |
| 11 | `L795-830` | +16/-4 | `title={onCanvas ? 'Already on canvas' : 'Add to canvas'}` |
| 12 | `L869-881` | +3/-1 | `bare?: boolean;` |
| 13 | `L955-972` | +8/-7 | `<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>` |
| 14 | `L980-992` | +6/-1 | `<span style={{` |
| 15 | `L1044-1051` | +1/-1 | `<div data-block-id={group.id} style={{` |
| 16 | `L1196-1207` | +1/-0 | `const CARD_W = 300;` |
| 17 | `L1258-1272` | +2/-4 | `style={{ position: 'absolute', left: group.x, top: group.y, minWidth: BLOCK_W, maxWidth: CARD_W, cursor: 'grab…` |
| 18 | `L1277-1290` | +6/-4 | `{/* Inline pipeline — steps live as chips inside the card, ordered left-to-right,` |
| 19 | `L1304-1311` | +1/-1 | `{vi < visibleSteps.length - 1 && (` |
| 20 | `L1315-1345` | +19/-20 | `{/* Anchored above vertical-center on purpose — a level join's connector line` |
| 21 | `L1346-1353` | +1/-1 | `placement="right-start"` |
| 22 | `L1506-1513` | +1/-0 | `const [previewScope, setPreviewScope] = useState<'node' \| 'model'>('node');` |
| 23 | `L1518-1542` | +8/-0 | `const [dataSort, setDataSort] = useState<{ col: string; dir: 'asc' \| 'desc' } \| null>(null);` |
| 24 | `L1560-1567` | +1/-1 | `const [activeBrowserTab, setActiveBrowserTab] = useState<'warehouse' \| 'business' \| 'external'>('warehouse')…` |
| 25 | `L1571-1640` | +50/-0 | `const [cardSizes, setCardSizes] = useState<Record<string, { w: number; h: number }>>({});` |
| 26 | `L1646-1678` | +8/-5 | `const [expanded, setExpanded] = useState(new Set(` |
| 27 | `L1754-1761` | +1/-1 | `const [filterConfig, setFilterConfig] = useState<{ name: string; column: string; operator: string; value: stri…` |
| 28 | `L1771-1792` | +7/-1 | `const [viewMode, setViewMode] = useState<'canvas' \| 'columns' \| 'data' \| 'test'>('canvas');` |
| 29 | `L2142-2152` | +2/-0 | `const g0 = groups.find(gr => gr.id === gid);` |
| 30 | `L2174-2181` | +1/-1 | `x = Math.max(...parents.map(p => p.x)) + CARD_W + 64;` |
| 31 | `L2476-2520` | +38/-4 | `{/* Model identity — click to rename inline.` |
| 32 | `L2602-2609` | +1/-1 | `Cache model` |
| 33 | `L2628-2635` | +1/-1 | `>{v === 'canvas' ? 'Canvas' : v === 'columns' ? 'Columns' : v === 'data' ? 'Spreadsheet' : 'Test'}</button>` |
| 34 | `L2872-2887` | +3/-1 | `{/* SpotterX embed: close button (or any right-slot node) */}` |
| 35 | `L2934-2943` | +2/-7 | `{/* Pick mode (A4) — hover outline on canvas cards (no hint pill) */}` |
| 36 | `L3069-3076` | +1/-0 | `)}` |
| 37 | `L3094-3101` | +1/-1 | `</button>}` |
| 38 | `L3147-3154` | +1/-1 | `{showConn('sf') && (` |
| 39 | `L3309-3315` | +0/-3 | `` |
| 40 | `L3338-3379` | +31/-0 | `const summaryRow = (label: string, value: React.ReactNode, key?: string) => (` |
| 41 | `L3399-3406` | +1/-1 | `{ label: 'Formula',   op: 'formula', icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d…` |
| 42 | `L3407-3448` | +24/-299 | `const propertiesPanel = dataActionPicker ? (` |
| 43 | `L3456-3465` | +2/-2 | `<Icon name="chevron-left" size="xs" color="currentColor" />` |
| 44 | `L3469-3476` | +1/-3 | `{panelHeaderIcon(selJoin ? 'join' : 'source', selJoin ? '#2770EF' : '#777E8B')}` |
| 45 | `L3477-3516` | +31/-9 | `<div style={{ color: '#64748B', display: 'flex', flexShrink: 0 }}>{panelHeaderIcon(hstep.type, '#64748B')}</di…` |
| 46 | `L3526-3533` | +1/-1 | `<Icon name="trash-can" size="xs" color="currentColor" />` |
| 47 | `L3534-3541` | +1/-1 | `<Icon name="cross" size="xs" color="currentColor" />` |
| 48 | `L3790-3796` | +0/-1 | `` |
| 49 | `L3832-3889` | +43/-42 | `if (step.type === 'filter') {` |
| 50 | `L3893-3900` | +1/-1 | `<select value={fc.operator} onChange={e => setFilterConfig(c => ({ ...c, operator: e.target.value }))} style={…` |
| 51 | `L3910-3957` | +32/-14 | `<div style={selectWrap}>` |
| 52 | `L3961-3968` | +1/-1 | `<select value={nc.column} onChange={e => setNullFixConfig(c => ({ ...c, column: e.target.value }))} style={sel…` |
| 53 | `L3972-4013` | +25/-14 | `<input value={nc.value} onChange={e => setNullFixConfig(c => ({ ...c, value: e.target.value }))} onFocus={nfFo…` |
| 54 | `L4134-4156` | +7/-7 | `{saveCancelRow({` |
| 55 | `L4158-4189` | +19/-5 | `onCancel: savedFormulas.length > 0 ? () => setEditingStepKey(null) : undefined,` |
| 56 | `L4234-4250` | +4/-0 | `setEditingStepKey(null);` |
| 57 | `L4368-4390` | +16/-0 | `const thisKey = stepKey(sg.id, sg.activeStep);` |
| 58 | `L4494-4512` | +5/-0 | `setGroups(prev => prev.map(g => g.id === selectedId ? { ...g, steps: g.steps.map((s, i) => i === g.activeStep …` |
| 59 | `L5482-5506` | +17/-1 | `{/* POC: node level (current selection) vs model level (entire model, combined) */}` |
| 60 | `L5518-5538` | +13/-1 | `{/* Add formula / Add column — Semantic mode only, moved up here (from the` |
| 61 | `L5561-5568` | +1/-0 | `)}` |
| 62 | `L5579-5676` | +77/-21 | `const previewToolbarProps = {` |
| 63 | `L5691-5733` | +24/-73 | `const t1Rows = t1Group ? rowsForCard(t1Group, rowCap) : (MOCK_DATA[selJoin.name.split(' × ')[0]] ?? []).slice(…` |
| 64 | `L5764-5774` | +3/-51 | `const tableRows = includedCols.filter(({ table }) => table === selectedGroup.tableName);` |
| 65 | `L5818-5825` | +1/-1 | `const dRows = rowsForCard(selectedGroup, rowCap);` |
| 66 | `L5912-5980` | +58/-40 | `const downloadTableCsv = () => {` |
| 67 | `L5984-5999` | +4/-3 | `onAddFormula={() => { if (selectedGroup) addStep('formula', false); }}` |
| 68 | `L6003-6009` | +0/-28 | `` |
| 69 | `L6040-6292` | +219/-176 | `) : renderColumnsTable(includedCols, { showFormulas: true })}` |
| 70 | `L6311-6373` | +41/-30 | `+Model flow: the RADIANCE_WASH + grain persist even when the agent is` |
| 71 | `L6382-6395` | +3/-3 | `<div style={{ fontSize: 15, fontWeight: 700, color: '#1D232F' }}>{cacheConfirm.title ?? 'Caching is required'}…` |

## Known-accepted differences

These were reviewed during the merge and deliberately left as-is:

- **Unified columns table** — `renderColumnsTable` replaces Vision's two bespoke
  semantic preview tables (join: #/Column/Type/Source/Role; card:
  #/Column/Type/Description/Nullable/Role) with one richer shared table. Superset
  of both. Keep for both cuts.
- **"Table info" button** — restored in Vision for visual parity, but it has no
  handler beyond `stopPropagation` and never did anything. Drop it if you'd
  rather not ship a dead affordance.
- **`railBtnStyle`** — orphaned; Vision collapses to 0 so it needs no rail, and
  POC's rail uses inline styles. Delete when convenient.

## Typecheck note

`tsc --noEmit` was already failing on this branch before the merge (389 errors),
so it is not a clean gate. The merge added 18: 14 unused-variable warnings, plus
4 real type errors in code that never runs — `ChatView.tsx` line ~250 sits in the
false branch of `{true ? … : …}`, and two arithmetic errors in `TestView.tsx`
which is dormant (`showTestTab` defaults false). Worth clearing when the Test tab
is next picked up.

