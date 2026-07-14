# Near Store — Caching UI fixes (handoff)

Five UI tweaks in the Near Store caching surfaces, found during a live review. All locations pinned below. Nothing here is applied yet.

Files involved:
- `src/prototypes/NearStore/components/CachingTab.tsx`
- `src/prototypes/NearStore/components/CachingSettingsModal.tsx`
- `src/prototypes/NearStore/components/primitives.tsx`

Conventions: tokens only (no hard-coded hex/spacing), Radiant components, sentence case. `c` and `spacing` come from `../styles`. Verify with `npm run build` when done.

---

## 1. Remove the "New" badge  · `CachingTab.tsx`

There's a stray `New` pill showing in every caching state (busy / not-cached / cached).

- Definition (~lines 133–137):
  ```tsx
  const NewChip = (
    <Horizontal>
      <StatusPill kind="info" label="New" />
    </Horizontal>
  );
  ```
- Used as `{NewChip}` at ~lines 143, 163, 207.

**Do:** delete the `NewChip` definition and all three `{NewChip}` usages. `StatusPill` is then unused — remove it from the import on line 17 (`import { KeyValue, SectionHeader, StatusPill } from './primitives';` → `import { KeyValue, SectionHeader } from './primitives';`). Keep `Horizontal` (used elsewhere, e.g. line 220).

---

## 2. Disclaimer callout → full-width + light grey · `CachingSettingsModal.tsx`

The info Alert (~lines 248–255, the `else` branch) is blue and doesn't span full width:
```tsx
) : (
  <Alert
    status="info"
    variant="section-multiline"
    dismissible={false}
    message="First Cache will be done today. Future refreshes will follow the schedule above."
  />
)}
```

**Do:** replace with a full-width, light-grey note. `Alert` has no grey status, so use a subtle box:
```tsx
) : (
  <div style={{
    width: '100%',
    padding: `${spacing.C}px ${spacing.D}px`,
    background: c['background-sunken'],   // verify token; else 'background-subtle'
    borderRadius: '8px',
  }}>
    <Typography variant="body-normal" color="gray" noMargin>
      First Cache will be done today. Future refreshes will follow the schedule above.
    </Typography>
  </div>
)}
```
Leave the `warning` Alert (the `isEdit && changed` branch) as-is. Optional info icon: the Near Store icon set has no "info" glyph — safest is text-only, or reuse an existing neutral one.

---

## 3. Cached-model icon → same box as Snowflake · `primitives.tsx`

`SourceCacheIcon` (~lines 107–115): not-cached is a single 18×18 Snowflake; cached is `16px snowflake + gap + size-m link icon`, so cached renders much wider and misaligns lists.

```tsx
export const SourceCacheIcon: React.FC<{ cached: boolean }> = ({ cached }) =>
  cached ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }} aria-label="Snowflake source, cached in ThoughtSpot">
      <img src="/logos/snowflake.svg" width={16} height={16} alt="" style={{ display: 'block' }} />
      <Icon name="copy-link" size="m" color={c['content-brand']} />
    </span>
  ) : (
    <img src="/logos/snowflake.svg" width={18} height={18} alt="Snowflake" style={{ display: 'block' }} />
  );
```

**Do:** give both states an identical 18×18 box. Cached = snowflake base + a small `copy-link` badge overlaid in the corner (inside the box), e.g.:
```tsx
export const SourceCacheIcon: React.FC<{ cached: boolean }> = ({ cached }) => (
  <span style={{ position: 'relative', display: 'inline-flex', width: 18, height: 18, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}
        aria-label={cached ? 'Snowflake source, cached in ThoughtSpot' : 'Snowflake'}>
    <img src="/logos/snowflake.svg" width={18} height={18} alt="" style={{ display: 'block' }} />
    {cached && (
      <span style={{ position: 'absolute', right: -3, bottom: -3, display: 'inline-flex', background: c['background-base'], borderRadius: '50%' }}>
        <Icon name="copy-link" size="s" color={c['content-brand']} />
      </span>
    )}
  </span>
);
```
Tune badge size/offset so it stays within/aligned to the 18×18 footprint.

---

## 4. Per-table list → structured (icon + dividers) · `CachingSettingsModal.tsx`

The custom per-table settings (~lines 146–195, `model.tables.map((t) => ...)`) render each table as a plain name + controls row. Make it read as a structured table.

**Do:**
- Add a table icon before each name — the repo has `<Icon name="table" size="s" color={c['content-secondary']} />`. Put it in a `Horizontal gap={spacing.B}` with the name.
- Add a divider between rows: give the map an index (`model.tables.map((t, idx, arr) => ...)`) and set `borderBottom: idx < arr.length - 1 ? '1px solid ' + c['border-divider'] : 'none'` plus a little `paddingBottom` on each row's outer `Horizontal`.
- Optional: a lightweight header row ("Table" / "Cache setting") above the list.

---

## 5. "Last cache completed successfully" → toast (not permanent) · `CachingTab.tsx`

In the cached state (~lines 219–224) the success line is a permanent on-screen element:
```tsx
<Horizontal gap={spacing.B} align="center">
  <Icon name="checkmark-circle" size="m" color={c['content-success']} />
  <Typography variant="content-label" color="base" noMargin>
    Last cache completed successfully
  </Typography>
</Horizontal>
```

**Do:** remove this permanent row and instead fire a transient toast when a cache run completes. Near Store has **no toast system yet**, so:
- Use the Radiant `Toast` from `@components` (add a provider/host at the Near Store root if needed).
- Trigger it on the busy → done transition — see `scheduleRebuild` / `applyConfig` in `CachingTab.tsx` (the completion callback after `REBUILD_MS`). Show "Cache completed successfully" there.
- The persistent success state should no longer render; keep the `purged` / `Failure` alerts as they are (those are meaningful persistent states, not transient success).
