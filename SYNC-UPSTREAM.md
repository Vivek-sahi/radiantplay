# Upstream Sync Plan
_Saved 2026-05-27. Do this in a dedicated session._

## Goal
Pull platform improvements from `upstream/main` (mohammed-faris/radiantplay) into our fork without breaking stakeholder-facing prototypes.

## Branch strategy
```
upstream/main
      ↓ merge
feat/sync-upstream   ← fix everything here
      ↓ merge (only when build is green + tested)
main                 ← radiantplay-nine.vercel.app (stakeholders)
```

## Steps
1. `git checkout main && git checkout -b feat/sync-upstream`
2. `git merge upstream/main`
3. Fix the known breaks (see below)
4. `npm run build:strict` — must be green
5. Test SpotterPrep2 and DataStudioV2 locally
6. Merge into main and redeploy

## Known fixes required after merge

### 1. RefreshIcon deleted — swap to SyncIcon
File: `src/prototypes/SpotterPrep2/components/DataModelsPage.tsx`
- Line 3: `import { DatabaseIcon } from '@components/icons/icons/Database'` was already changed to `RefreshIcon` — change to `SyncIcon` from `@components/icons/icons/Sync`
- Line ~292: `<RefreshIcon ...>` → `<SyncIcon ...>`

### 2. registry-mine.ts reset to []
File: `src/prototypes/registry-mine.ts`
Restore these four entries after merge:
- SpotterPrep2 (id: 'SpotterPrep2')
- DataStudioV2 (id: 'DataStudioV2')
- DataStudio (id: 'DataStudio')
- SpotterPrep (id: 'SpotterPrep')

### 3. vite.config.ts — API proxy changed
Upstream replaced `/api/anthropic` proxy with `/api/chat` middleware.
Check if DataStudio or DataStudioV2 uses `/api/anthropic` — if so, migrate to `/api/chat` or restore both.

### 4. AppSidebar title now required
If any prototype passes a sidebar category without a `title`, it will error.
Quick grep: `grep -rn "SidebarCategory" src/prototypes/`

### 5. GlobalHeader API changed
Added `theme` prop, extracted logo SVG into BrandMark component.
Visual check all pages using GlobalHeader after merge.

## What you gain
- `.claude/settings.json` — hooks + broad permission allowlist (fewer prompts)
- Playground archive section — organise old prototypes without deleting
- Icon system auto-synced from Figma
- `background-base-inverse` token corrected to `#1D232F`
- Logo clicks navigate back to playground in custom-header prototypes
- New `.claude/commands/` slash commands
