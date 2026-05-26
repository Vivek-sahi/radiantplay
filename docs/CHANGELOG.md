# Changelog

## 26.5.4a — 2026-05-26

### Highlights

- **Spotter prototype** — AnalystLandingPage, AnalystListPage, and right-pane state machine added. Prompt bar rebuilt with mode toggle, hideable data-model picker, and a new PromptSuggestionsPanel. 12 IA polish corrections (analyst selection, recency-sorted chats, panel restructure, chat naming). The Liveboard template's SpotterViz side panel was also rebuilt to match the Figma design: dark navy overlay with welcome state, persona suggestion chips, and prompt bar.
- **Liveboard Styling panel restored** — Per-tile density, color theme, corner style, spacing, and highlight overrides via a right-side drawer. Shared tile CSS variables added to `AnswerTile`, `NoteTile`, `GroupTile`. Two integration bugs from the original PR fixed (missing `AnswerTileProps.highlighted`, `EditToolbar` `onToggleStyling` wiring).
- **AdminUI 2.0 prototype** — Application Settings screen added to the shared sample registry: cluster settings, administration toggles, downloads and schedules, version control, AI settings.
- **Playground archive section and sidebar navigation** — Gallery now has a light left sidebar with Prototypes (default) and Archived sections. Per-card 3-dot menu archives or restores any prototype in your session. Save-to-code modal generates a Claude-ready prompt to commit the layout permanently. `MiniSpotters` and `AdminLang` now appear as archived by default.

### Added
- `src/prototypes/StylingPanel/` — Liveboard Styling panel prototype restored (originally PR #14, reverted then re-landed via worktree cherry-pick). Per-tile drawer with density, color theme, corner style, spacing, and highlight overrides. Authored by Devanshi Behara.
- Shared tile CSS variables for tile density / color theme / corner / spacing / highlight on `AnswerTile`, `NoteTile`, `GroupTile`.
- `src/prototypes/NewUIAdmin2/` — AdminUI 2.0 Application Settings screen. Registered in `registry-core.ts` as a sample. Cluster settings, administration toggles, downloads and schedules, version control, AI settings. Authored by the Design Team via Simran Pandit (PR #19).
- `src/prototypes/Spotter/AnalystLandingPage.tsx` + `AnalystListPage.tsx` — right-pane state machine for the standalone Spotter prototype. Replaces the prior "always show chat" right pane.
- `src/spotter/page/PromptSuggestionsPanel.tsx` — new suggestion panel surfaced from the prompt bar. Hideable, mode-aware.
- `src/prototypes/_liveboard-template/components/SpotterVizPanel.tsx` — full rebuild to match the Figma side-panel overlay. `position: fixed` (not flex sibling), dark navy `#1d232f`, mascot + greeting + 3 suggestion chips + sticky prompt bar.
- `src/prototypes/_liveboard-template/components/spotterviz-mascot.png` — mascot asset.
- `section?: 'sample' | 'mine' | 'archived'` field on `ProjectMeta` in `src/prototypes/registry-core.ts`. Drives the new archive section in the gallery.
- `src/pages/PlaygroundGallery.tsx` — light left sidebar with Prototypes / Archived sections, per-card 3-dot menu, sessionStorage-backed archive overrides, save-to-code modal generating a Claude-ready prompt.
- `MiniSpotters` and `AdminLang` registered with `section: 'archived'` so they appear in the Archived section by default.
- `Liveboard - Styling panel` and `AdminUI2.0` thumbnails (`StylingPanel.svg`, `NewUIAdmin2.svg`).

### Fixed
- `AnswerTileProps` was missing `highlighted?: boolean`. `GroupTile` was passing it through and tripping TS2322. Added to the props interface so the highlight-override path from the styling drawer works.
- `EditToolbar` was missing the `onToggleStyling` + `stylingOpen` props wiring. The Styling button rendered but did nothing. Added the props, wired the click handler, and applied the active-state styling.
- `background-base-inverse` token reverted from `#323946` back to `#1D232F` to match the production Liveboard edit-toolbar background (the Phase 2 token change had unintentionally muted it).
- `ThoughtSpot` brand mark click in `GlobalHeader`, `LiveboardHeader` (`PrimaryNav`), `EditToolbar`, and the `DataModelEditor` title now all navigate back to `/` (the playground gallery).
- Spotter prototype IA polish — 12 corrections: analyst selection state, recency-sorted chats, panel restructure, chat naming, analyst reorder on chat start only, clear analyst highlights when "View all" opens, center analyst grid at 936px, move Spotter (Default) into its own panel section, drop the logo icon from the Default panel item and welcome page.
- 43 TypeScript errors resolved across DS + `NewUIAdmin2` + `ChangelogPage` (38 were in `NewUIAdmin2`, 4 pre-existing). 34 of the 38 were `unused-var` noise — switched to `noUnusedLocals: false` for the prototype layer.
- `LineChart` legend overlap in the Liveboard template.
- `package-lock.json` rewritten — 31 ThoughtSpot internal artifactory URLs swapped to the public npm registry so Vercel can install dependencies.

### Changed
- Liveboard template: KPI cards shortened (default height 1 row), and the first two (`Revenue`, `Customers`) now show chart variants instead of bare numbers.
- Royal Enfield references scrubbed from prototypes and replaced with `Acme Apparel`.
- `Liveboard - Styling panel` is the canonical display name for the styling drawer prototype (was `StylingPanel`).
- `MiniSpotters` and `AdminLang` moved from "hidden" to "archived" so they remain discoverable in the Archived gallery section.

## 26.5.3d — 2026-05-19

### Highlights

- **ThoughtSpot brand mark refresh** — new Radiant 3.0 monogram (4-path geometric mark with bars + "T" hook + dot) replaces the older wordmark across `GlobalHeader`, `LiveboardHeader`, `EditToolbar`, and the Spotter showcase.
- **Spotter Standalone IA — Stage B Phase 1** — Analysts section in the left panel (replaces "Custom spotters"), Settings popover at the bottom (6 items in 4 dividered groups, inline Personal memory toggle), hover row menus on both chats and analysts.
- **Spotter chat surface polish** — flat reasoning layout matching the real product (no card chrome), code-block-styled tool I/O, single content stream (no separator between chat thread and prompt), eased peek-description transitions.
- **`@components/BrandMark`** — new single source of truth for the TS brand mark; the SVG paths were previously duplicated in 4 files.

### Added
- `src/components/BrandMark/BrandMark.tsx` — canonical TS brand mark. Props: `pixelSize`, `color` (defaults to `currentColor`), `className`, aria props. Renders the 4-path Radiant 3.0 monogram at viewBox `0 0 47.4216 48`.
- `src/spotter/page/SettingsMenu.tsx` + `PersonalMemoryToggle.tsx` — popover Settings menu opened from a trigger (uses Radiant `Popover` with `children` as the trigger). 6 items in 4 dividered groups: Spotter instructions (modal) · Usage monitoring + Admin settings (external) · Manage memory sources (external) + Personal memory (inline toggle) · Spotter best practices (modal).
- `src/spotter/page/ChatRowMenu.tsx` + `AnalystRowMenu.tsx` — hover-triggered row menus. ChatRow: Rename / Favorite / Share / Delete. AnalystRow: Edit (privilege-gated) / Share / Make a copy / Delete. Built on Radiant `ActionMenu` for keyboard + click-outside.
- `src/spotter/page/RowMenuAffordance.tsx` — internal helper for the shared hover-affordance pattern (kebab fades in on row hover / focus-within / menu-open).

### Fixed
- `ReasoningBlock` peek (streaming + semi-collapsed): brand-blue inline title with chevron + description below with a thin left guideline. Was a bordered card with dot column. Now matches the real product.
- `ReasoningBlock` expanded view: dropped the card border around the steps list — steps now flow as a plain dot column.
- `ReasoningBlock` header: unified into a single brand-blue button. Text shows the current step label while streaming, "Thought for X seconds" once settled. Chevron rotates on expand.
- `ReasoningBlock` toolcall I/O: Input/Output values render as proper code blocks — monospace, `background-subtle`, rounded, generous padding. Labels changed from UPPERCASE letterspaced to sentence-case "Input:" / "Output:". JSON output gets a language hint.
- `ReasoningBlock` peek description: fades out (opacity + max-height + guideline) instead of unmounting instantly when streaming ends.
- `AgentMessage`: avatar centers vertically with the first body line (negative margin compensates for the 32px avatar vs 20px text-line center offset).
- `SpotterPrompt` mode toggle: ChartSearch at `size="m"` (16px), Orbits at `size="l"` (18px) — per design spec.
- `ChatCanvas` `.promptArea`: dropped `border-top` and opaque background; dropped top padding. Chat thread now flows into the sticky prompt as one continuous stream.
- `SpotterWelcome` content width: uses `--spotter-text-max-width` (844) instead of inheriting the wider chat-active 936.
- Width tokens (`chatMaxWidth = 936`, `textMaxWidth = 844`) now actually flow through `ChatThread`, `SpotterPrompt`, `ChatCanvas` `promptWrapper`, and `SpotterWelcome` via `--spotter-chat-max-width` / `--spotter-text-max-width` CSS vars injected at the `SpotterShell` root.
- Toolcall icons in `cannedResponses` now use semantic Radiant glyphs (`database`, `ai`, `search`) instead of the generic `spotter` sparkle.
- TS brand mark SVG updated to Radiant 3.0 — was the older wordmark with a single composite path; now four geometric paths.

### Changed
- `GlobalHeader`, `LiveboardHeader`, `EditToolbar` all now import `<BrandMark />` from `@components/BrandMark` instead of inlining their own SVG.
- `@spotter/icons` `ThoughtSpotMark` is now a deprecated alias for `BrandMark` (kept for backwards compatibility with the Spotter showcase).
- `src/prototypes/Spotter/index.tsx` — left panel reordered. "Custom spotters" section renamed to **Analysts** (matches the IA spec — analyst = custom AI agent, separate from data model). Dropped the "Spotter (Default)" row. "View library" → "View all >". Settings button at the bottom now opens `SettingsMenu`. Chat and analyst rows wrapped in their respective hover menus.
- `src/prototypes/Spotter/data/mockData.ts` — `customSpotters` → `analysts` with a `canEdit` flag per row.
- `docs/spotter-roadmap.md` — Stage B Phase 1 marked done, Phase 2 (right-pane state machine + Analyst pages) listed as pending.

## 26.5.3c — 2026-05-19

### Highlights

- **Spotter design system gets its own doc surface** — new `/radiant/spotter` showcase covering chat primitives, block renderers, icons, and tokens; new `/radiant/components/spottershell` peer to the GlobalHeader / AppShell docs.
- **Fullscreen previews** for SpotterShell and AppShell — `/preview/spottershell` and `/preview/appshell` render the shells at full viewport without Radiant chrome.

### Added
- `/radiant/spotter` Spotter DS showcase page — 4 sections (Chat, Blocks, Icons, Tokens) with static previews for every shipped Spotter component plus ghosted placeholders for planned ones (AnswerCard, Source/Model picker, Analyst components, ChatRowMenu, SettingsMenu, PersonalMemoryToggle).
- `/radiant/components/spottershell` — dedicated SpotterShell doc page mirroring the GlobalHeader / AppShell pattern. SpotterLeftSide preview rolls SpotterRail + SpotterPanel into one card since they're internal compositions of the same component. SpotterShell preview uses real `GlobalHeader theme="light"` (matches AppShell composition).
- "View fullscreen ↗" link on SpotterShell and AppShell doc pages — opens `/preview/spottershell` and `/preview/appshell` in a new tab. Both render at 100vh × 100vw with no Radiant chrome.
- `PreviewCard` gained `useTabs` (Radiant Tabs for multi-variant cards) and `fullSizeHref` (fullscreen link) primitives.
- 4 new Spotter cursor rules: `spotter-ia.md` (standalone IA — left panel, right-pane states, Settings menu, hover menus, widths), `spotter-agentic-chat-ia.md` (embedded Code/Viz/Model surfaces), `spotter-scaffolding.md` (how to create a new Spotter prototype), plus a Planned-components section in `spotter-components.md`.
- `docs/spotter-roadmap.md` resume-here tracker with status per mode and per phase.

### Fixed
- VizBlock expand button now uses the diagonal `expand` icon (matches Figma `RzKUZMdJsNVdoVhkYmXvlI` node `852:7344`) instead of the horizontal `fullscreen` icon. Affects every viz answer rendered in Spotter responses.
- Home page hero now reads `PLATFORM_VERSION` instead of the hardcoded `26.4.1b`.
- Sidebar Icons badge reads `getIconCount()` (151) instead of the hardcoded `46`.
- Design Tokens stat computes from `generateCSSVariables` + theme generators (373) instead of the hardcoded `290+`.
- Component count includes RdModal (76 total).
- `26.5.3` icon-sync numbers corrected: 53 → 148 unique icons (151 registry entries with 3 backward-compat aliases — settings → cog, search → magnifying-glass, refresh → sync).
- TextBlock mock data in the showcase now includes `block.id` (was missing — caused React "missing key prop" warnings in AgentMessage previews).
- Spotter DS page CSS aligned to ComponentDocPage conventions (1000px container, 36px title, 20px section title, 32px card padding, 12px radius) and no longer renders its own white background — picks up the sunken layout bg like other Radiant pages.

### Changed
- Sidebar: top-level "Spotter" renamed to **"Spotter DS"**; new **"SpotterShell"** entry under Widgets; "New" badges removed from LiveboardHeader / GlobalHeader / AppSidebar / AppShell.
- `spotterLayout` tokens — `chatMaxWidth` 880 → **936** (matches 2026-05-19 IA spec); new `textMaxWidth = 844` for text content inside the chat container.
- `ReasoningBlock` streaming behaviour tightened in `spotter-logic.md`: explicit three-state model (semi-collapsed during streaming → expanded then collapsing → settled "Thought for X seconds").
- Spotter Requirements Gate in `_orchestration.md` upgraded from "load 3 rules" to a Q&A flow with tiered loading by surface mode (Standalone / Spotter Model / Viz / Code).
- `spotter-scaffolding.md` example replaced placeholder `<Canvas>` / `<WelcomeState />` with copy-pasteable JSX using real component names. Added a `SpotterWelcome` prop-surface table noting `greeting` is a single ReactNode (no title/subtitle split). Added a maintainer note: on `main`/`staging`, `registry-mine.ts` stays empty.
- 3 historical Spotter plans moved to `docs/archive/` (ds-plan, prototype-shell, chat-extraction). Active spec docs (answer-card, viz-block-behaviour) stay flat at `docs/`.
- VizBlock showcase entry reduced from 5 chart-kind variants to a single Default line-chart preview; supported kinds mentioned in the description instead.

## 26.5.3b — 2026-05-18

### Highlights

- **`/sync-upstream` rewrite** — preview-first, feature-branch safe. Stashes WIP with `--include-untracked`, lands upstream on `main` before forwarding into your branch, never silently abandons your work.

### Fixed
- `/sync-upstream`: now refuses to merge `upstream/main` directly into a feature branch. Always lands on `main` first, then merges `main` forward into the feature branch. Stash uses `--include-untracked` so new files are no longer lost during sync.
- middleware: staging branch publicly accessible, other preview branches stay gated.
- vercel: `X-Frame-Options: SAMEORIGIN` so same-origin iframes inside prototypes load correctly.

### Changed
- `/check-upstream` consolidated into `/sync-upstream` — preview is now phase one of a single command with a yes/no gate before anything destructive runs.
- Maintainer branch model split documented in CLAUDE.md: `personal` and `personal/*` are origin-only (galaxy-bound branches are `main`, `staging`, and shared `feat/*` / `fix/*` / `chore/*`). Pre-push hook enforces the rule.

## 26.5.3a — 2026-05-08

### Changed
- registry-core: Spotter moved to the bottom of the array so it appears first in the gallery (gallery reverses array order to show newest-by-date first)

## 26.5.3 — 2026-05-08

### Highlights

- **Spotter prototype** — in-thread agentic chat with reasoning, viz blocks, and follow-ups
- **Spotter design system (in progress)** — chat / page / runtime layered on Radiant

### Added
- feat(spotter): two-layer DS scaffold — `@spotter/*` peer to `@components/*` for Spotter-domain blocks built on Radiant primitives. Subdomains: chat, page, answer, viz, runtime, plus `tokens.ts` and `icons.tsx`
- feat(spotter): Spotter prototype registered in `registry-core.ts` as a sample. Wraps `SpotterChatProvider`, switches between welcome and chat-active canvas, light-mode `GlobalHeader`, collapsible 64↔260 left panel with smooth animation
- feat(spotter): chat extraction end-to-end — `SpotterChatProvider`, `useReducer`, `AbortController`, async-iterable `askSpotter()` service with canned + live modes, four canned fixtures with rich reasoning
- feat(spotter): six block renderers — TextBlock, VizBlock (real ECharts via `_shared/tiles/chartPalette` — line / bar / pie / table with axes, gridlines, tooltips, value labels, legend; iframe / data / placeholder slot priority; Pin / Save / Download / Edit + Add to coaching footer; M4 fullscreen expand modal portaled to body), SourcesBlock, FollowUpsBlock (clickable chips that call `send`), RefineBlock (clickable options), ErrorBlock
- feat(spotter): `ChatThread`, `MessageRow`, `UserBubble` (single-row), `AgentMessage` with feedback row, `TypingIndicator` (spinner + "Analysing…"), `ReasoningBlock` (collapsed-by-default "Show work ⌄" trigger, gray done dots, embedded `ToolcallCard` with "Show details", "Worked for X seconds" footer)
- feat(spotter): purple → blue gradient border on `SpotterPrompt:focus-within`
- feat(spotter): custom icons — `PanelToggleIcon` (sidebar layout glyph from Figma), `ChartSearchIcon` + `OrbitsIcon` (prompt mode toggle), `BellIcon`, `ThoughtSpotMark`. All other glyphs use Radiant icons (151-icon registry)
- feat(icons): sync 147 icons from Radiant 3.0 Figma + light-mode GlobalHeader (carried forward from `26.5.2`)
- docs(spotter): four planning docs — DS plan, prototype shell, AnswerCard spec, chat extraction. Plus `docs/2026-05-07-spotter-viz-block-behaviour.md` (slot model + customization guide)
- docs(spotter): three `.cursor/rules/` files — `spotter-components.md`, `spotter-logic.md`, `spotter-response-style.md` — auto-attach when working in `src/spotter/**` or `src/prototypes/Spotter*/**`. Spotter Requirements Gate added to `_orchestration.md`. CLAUDE.md addendum points to the Spotter docs
- spotter(tokens): `spotterGlow` (radial brand glow) + `spotterChartBg` (chart-token aliases) + `spotterLayout.chatMaxWidth` (880)

### Changed
- spotter(chat): streaming animation polish — step dot color transitions, block fade-up entry, steps container collapse via `max-height + opacity` (no remount), toolcall body slide-open, ReasoningBlock fades in only when reasoning starts, "Worked for X seconds" fade-in
- spotter(panel): full-width selected state on items, full-width line breaks between sections (per Figma)
- spotter(reasoning): brand-blue trigger when expanded, gray done dots, ToolcallCard collapsed by default with brand-blue "Show details ⌄" link
- spotter(prototype): sentence-case fixes — "Deal Accelerator" → "Deal accelerator", "Fall and Winter" → "fall and winter"

### Fixed
- spotter(chat): streaming keyframes (blockIn, reasoningIn, stepIn, workedForIn) end with `transform: none` instead of `translateY(0)` — translate(0) creates a containing block per CSS spec, which had trapped Modal's `position: fixed` to the chat canvas

## 26.5.2e — 2026-05-08

### Changed
- spotter(prototype): sentence-case fixes — "Deal Accelerator" → "Deal accelerator", "Fall and Winter" → "fall and winter" (flagged by /radiant-check)

### Added
- spotter(tokens): `spotterLayout.chatMaxWidth` (880) — documented constant for the shared chat thread + prompt max-width

## 26.5.2d — 2026-05-08

### Changed
- spotter(viz): VizBlock now uses real ECharts (echarts-for-react) instead of an SVG sketch. Pulls from the shared chart palette (`_shared/tiles/chartPalette`) so colors, fonts, and axis styling match the rest of the project's charts. Supports `line` / `bar` / `pie` / `table` from the schema with axis labels, gridlines, tooltips, value labels on bars, and a top legend for multi-series
- spotter(viz): M4 expand modal — portaled to `document.body` to escape any ancestor containing block, full-width override (`max-width: none`), proper layout with chart title + view toggle + tokens + chart + "Showing X of X data points" footer

### Fixed
- spotter(chat): streaming keyframes (blockIn, reasoningIn, stepIn, workedForIn) end with `transform: none` instead of `translateY(0)` — translate(0) still creates a containing block per CSS spec, which had trapped Modal's `position: fixed` to the chat canvas

## 26.5.2c — 2026-05-08

### Changed
- spotter(chat): streaming animation polish — six fixes to make the live agent message feel smooth instead of poppy
  - Step dot color transitions smoothly between gray / brand / gray as `reasoning_step` chunks fire
  - New blocks (viz, followups, sources) fade up on entry instead of popping
  - Steps container collapses via `max-height + opacity` (no unmount), so the auto-collapse 600ms after done animates instead of jumping
  - Toolcall body slides open via `max-height + opacity` instead of conditional render
  - `ReasoningBlock` only renders once reasoning is set — cleaner crossfade from TypingIndicator
  - "Worked for X seconds" fades up with a 120ms delay instead of popping
- spotter(chat): ReasoningBlock keeps steps + toolcall bodies mounted across collapse cycles so re-open is instant and collapse is animated

## 26.5.2b — 2026-05-07

### Added
- feat(spotter): chat extraction end-to-end — SpotterChatProvider + useReducer + AbortController, ChatThread, MessageRow, UserBubble (single-row), AgentMessage with feedback row, TypingIndicator (spinner + "Analysing…"), ReasoningBlock with rich steps (descriptions + embedded ToolcallCard, "Worked for X seconds")
- feat(spotter): streaming runtime — AnswerChunk protocol, askSpotter() async generator (canned + live shell), 4 fixtures with naive keyword routing (viz default)
- feat(spotter): six block renderers — TextBlock, VizBlock (slot model with iframe / data / placeholder, canonical footer, chart/table toggle, expand modal), SourcesBlock, FollowUpsBlock (clickable chips), RefineBlock, ErrorBlock
- feat(spotter): smooth 64↔260 panel animation via SpotterLeftSide wrapper
- feat(spotter): purple→blue gradient border on SpotterPrompt :focus-within
- feat(spotter): custom PanelToggle icon (Figma path), ChartSearch + Orbits glyphs for prompt mode toggle
- feat(prototype): Spotter prototype now wraps in SpotterChatProvider; welcome ↔ chat-active transition with sticky prompt and disclaimer
- docs(spotter): VizBlock behaviour doc; three .cursor/rules files (components, logic, response-style) with auto-attach globs; Spotter Requirements Gate in _orchestration.md; CLAUDE.md two-layer DS section

### Changed
- spotter(panel): full-width selected state on items, full-width line breaks between sections (per Figma)
- spotter(reasoning): brand-blue trigger when expanded, gray done dots, ToolcallCard collapsed by default with "Show details" link
- spotter(viz): schema discriminated union with `source: iframe | data | placeholder` + optional `tableData`

## 26.5.2a — 2026-05-07

### Added
- feat(spotter): `@spotter/*` peer to `@components/*` — two-layer DS scaffold for Spotter-domain building blocks layered on Radiant
- feat(spotter): chat primitives — QuickAction, QuickActionRow, SpotterPrompt (controlled, auto-resize, mode toggle, model picker, blue submit)
- feat(spotter): page primitives — SpotterShell, SpotterLeftSide, SpotterRail/Item, SpotterPanel/Section/Item/Action, SpotterWelcome
- feat(spotter): smooth 64↔260 width animation between collapsed rail and expanded panel
- feat(spotter): spotter tokens (radial glow + chart-bg aliases) and spotter icons (PanelToggle, Bell, ThoughtSpotMark, ChartSearch, Orbits) — only glyphs missing from Radiant registry
- feat(prototype): Spotter prototype — first DS consumer with light-mode GlobalHeader and welcome canvas
- docs(spotter): four plan docs covering the two-layer DS, prototype shell, AnswerCard spec, and chat extraction approach

## 26.5.2 — 2026-05-07

### Added
- docs(muze): `docs/muze-charts-setup.md` — opt-in guide for adding Muze charts (auth, install, chart-shape cheatsheet, resize-aware mounting). Default install stays friction-free for designers who don't use Muze

### Changed
- refactor(LiveboardHeader): unify dark surfaces and tokenize raw hex values
- fix(radiant-pages): bump content-tertiary to content-secondary for readability
- chore(components): remove duplicate exports of LoadingIndicator, Popover, Select from components/index.ts

### Removed
- chore(pages): delete 5 unrouted page components (ComponentStatusPage, DataDashboardDemo, GuidelinesPage, SettingsPanelDemo, SpotterDashboard) — ~2,400 lines of dead code never wired into App.tsx

## 26.5.1 — 2026-05-05

### Removed
- chore(prototypes): SalesDashboard prototype removed from the registry — reference patterns continue to live in `_liveboard-template`
- chore(prototypes): SpotterModel standalone prototype removed — patterns now covered by DataModelEditor + the shared `_agentic` module
- revert(prototype): PR #14 (StylingPanel + shared tile density/override system) reverted on staging due to integration issues; will be re-introduced in a follow-up PR

## 26.5.0 — 2026-04-30

### Added
- feat(prototype): Data Model Editor — interactive canvas-based prototype with table cards, draggable column tree, and join connectors
- feat(prototype): SpotterModel agent panel — AI-powered chat interface with table, join, column, and formula suggestions backed by Anthropic
- feat(prototypes): shared `_agentic` module — AgentPanel, SuggestionCard, ReasoningBlock, ConfidenceBadge, JoinDiagram, NextActionChips, ToolcallCard, TypingIndicator, UserBubble, VersionCard, AgentResponseBlock
- feat(prototypes): shared `_datamodel` module — TableCanvas, ColumnTree, JoinConnector, TableCard
- feat(infra): `/api/chat` proxy for the Anthropic API (Vercel function + Vite dev middleware)
- feat(ds): OverlayLoading variant + label props (backwards-compatible)
- feat(tooling): `/switch-model` command — switch the Claude model used by AI-capable prototypes between Haiku, Sonnet, and Opus
- docs(rules): three new orchestrator rule files — `data-model-editor-ia.md`, `data-model-editor-components.md`, `data-model-editor-interactions.md`
- docs(orchestrator): "AI agent panel (any prototype)" fallback row so non-DME prototypes can adopt `_agentic`

### Changed
- chore(orchestrator): split the single DME concern row into three sub-rows (IA / components / interactions) so the right rule file loads per task
- chore(tooling): `new-prototype` command updated for DME-style scaffolding
- chore(tooling): status.sh untracked-files badge

### Fixed
- fix(infra): vite middleware now reads `ANTHROPIC_API_KEY` via `loadEnv` — `process.env` was empty in dev and the AI panel errored

## 26.4.4c — 2026-04-28

- feat(changelog): Highlights section at the top — curated picks across recent releases (60-day window, min 6 items)
- feat(release): release.sh prompts for highlights interactively during release
- docs(orchestration): add MCP plugin overhead check (B1 from workflow plan)
- feat(status): sort forks by last push descending
- feat(status): add worktrees + branch divergence vs main/staging/upstream
- feat(status): merge plans/rules/docs into one tab, drop Open work
- feat(status): role-aware dashboard — designer forks see upstream-sync tab
- feat(status): rename to /project-status, add inline md viewer + local badges
- chore(deps): bump postcss to 8.5.10 in lockfile (fixes XSS advisory)
- chore: salvage workflow explorations + orchestration tightening
- Merge branch 'feat/token-system-figma-alignment' into staging
- feat(tokens): Phases 4 & 5 — shadows + layout aligned with Figma 3.0
- feat(tokens): Phase 3 — typography aligned with Figma 3.0 + changelog
- feat(tokens): Phase 2 — light mode semantic colors aligned with Figma 3.0
- feat(tokens): Phase 1 — primitive colors aligned with Figma 3.0
- Merge branch 'review/rd-modal-component' into staging
- docs: add 26.4.4a changelog for Modal Figma alignment
- feat: align Modal with Figma spec and absorb RdModal learnings
- Merge branch 'pr-10-rd-modal' into staging
- feat: add RdModal shared modal component
- fix: add process type declaration to middleware to resolve TS2580 errors
- chore: extend password gate cookie lifetime to 14 days


All notable changes to Radiant Play are documented here.

**Versioning:** `YY.M.Ws` — Year.Month.Week + sub-release letter (a, b, c...).
Example: `26.4.1b` = 2026, April, week 1, second release that week.

---

## [26.4.4b] - 2026-04-28

### Token system Figma alignment (Phases 1–5 of 8, dark mode out of scope)

#### Phase 4 — Elevation / Shadows

- New `shadowPrimitives` with 3 semantic levels matched to Figma: `surface` (Card, Tooltip, Nav), `menu` (Dropdown, Popover, Sidebar overlay), `modal` (Modal, Dialog)
- Light mode uses colored ink tints (`#192331`); dark mode uses pure black for cool dark base
- New CSS variables `--shadow-surface`, `--shadow-menu`, `--shadow-modal` with light/dark theme variants
- Component CSS migrated from legacy `--shadow-xs/sm/md/lg/xl/2xl` (kept as aliases) to semantic vars: Modal, Tooltip, Popover, Card, Menu, DatePicker, FilterModal, InputMentions, AppSidebar overlay
- Modal hardcoded RGBA box-shadow replaced with `var(--shadow-modal)` (token-only compliance)

#### Phase 5 — Layout constants

- `AppSidebar.tsx` and `AppShell.tsx` default sidebar width `261px → 260px` (Figma rounding alignment)
- Header height stays `60px`, content max width `1280px` — `CLAUDE.md` and `.cursor/rules/layout-patterns.md` already reflect these (no doc updates needed)

### Token system Figma alignment (Phases 1–3 of 8)

Plan: `plans/2026-04-07-token-system-implementation.md`

#### Phase 1 — Primitive colors

- **darkGray scale** (12 stops) added to `referenceColors` — neutral foundation for Phase 6 dark mode remap
- **Alpha variants** added: `gray-70a/60a/40a/10a`, `blue-10a`, `dark-gray-30a`
- **Hex fixes** to match Figma: `purple/70` `#6847BA → #6A4ABA`, `purple/100` `#0D0030 → #0E0033`, `teal/70` `#359FAA → #369FAA`
- New primitives exposed in `tokens.css` as `--rd-ref-color-dark-gray-*` and `--rd-ref-color-*a`

#### Phase 2 — Light mode semantic colors

- **6 value fixes**: `content-tertiary`, `border-focus`, `border-hover`, `background-overlay`, `background-ghost-highlight`, `background-base-inverse`
- **22 new tokens**: 9 background-accent-*, 6 content-accent-*, 7 border-* (subtle-hover + 6 accents), `background-on-base`, `background-active`
- Same keys added to dark object as placeholders (Phase 6 will remap properly)
- Phase 2.5 (deprecate 25 extra RP tokens) deferred — list not enumerated

#### Phase 3 — Typography

- `letterSpacing.tight`: `-0.01em → -0.4px` (Figma absolute)
- `letterSpacing.tighter`: new (`-0.6px`)
- 6 v2TextStyles weights `medium → semibold`: headlineLarge, pageTitle, modalTitle, sectionLabel, contentLabel, contentLabelSubhead
- pageTitle/modalTitle: `letterSpacing.normal → tight`
- footnote/caption/overline: `letterSpacing → tighter`
- `textStyles.body.large/normal`: `light (375) → regular (400)`

---

## [26.4.4a] - 2026-04-27

### Modal alignment with Figma (absorbed RdModal PR)

- **Header**: padding restored to `20px 24px` (variable height) so wizard variants grow correctly for eyebrow + title
- **Footer**: fixed at 72px height with `0 24px` padding; CTA placement bug fixed (tertiary-left / primary-right now sit at correct edges — was double-wrapped)
- **Wizard stepper**: rebuilt as discrete 4px segments with 6px gap and 2px radii; also renders for `splashscreen` type to enable onboarding flows
- **Close button**: removed X icon from M1/M2/M3 simple modals — only M4 keeps the "Close" text link, per Figma
- **Splash screen**: header no longer renders (title lives in body via `ModalSplashContent`)
- **Overlay z-index**: bumped to 1000 so M4 covers the sidebar

### Surfaces showcase additions

- New M2 eyebrow-only variant (no stepper)
- New M2 splash-screen-multi (3-step onboarding flow with stepper)
- Wizard footer keeps Back rendered (disabled on step 1) + primary button uses `minWidth: spacing.I*2` so position stays consistent across steps
- Spec card updated to Figma values; secondary/primary demo swatches use `content-primary` / `content-alternate` tokens

### LastUpdated component

- New shared component reads `lastModified` from `componentRegistry` (or accepts a manual date)
- Added at top of Surfaces, Icons, Architecture, and ComponentDocPage
- Modal registry entry refreshed with current Figma node ID and `2026-04-27` sync date

---

## [26.4.1c] - 2026-04-08

### Fork architecture

- **Registry split**: Monolith `registry.ts` split into `registry-core.ts` (upstream) + `registry-mine.ts` (designer) + thin merger — eliminates merge conflicts for all designer forks
- **Skills and docs updated**: `sync-upstream`, `check-upstream`, `new-prototype`, `prototype-structure`, `FORK-WORKFLOW` all reference new 3-file registry architecture
- **Self-documenting migration**: Migration note in `registry-mine.ts` guides any Claude instance through first-time conflict resolution

### AI orchestrator

- **Orchestrator tier system**: Intent-based classification (Tier 0–3) with concern-matching table — 81% context reduction for median tasks
- **Pre-implementation gate**: 4 checks before code (component exists, CSS anti-patterns, icon name, forbidden words)
- **Iteration loop detection**: Suggests batching after 3+ sequential single-property changes
- **MCP overhead awareness**: Flags Figma MCP ~4,000 token overhead when idle
- **Context budget check**: Proactive `/compact` suggestion on topic switches
- **Session memory**: Tracks loaded rule files to prevent redundant reads

### Liveboard system

- **Canvas 3-tier split**: Monolithic `liveboard-canvas.md` (568 lines) → core (242), edit (238), advanced (100) with prerequisite chains
- **Requirements gate**: 4-question pre-build gate (mode, interactions, tile types, data) before loading canvas context
- **UserPromptSubmit hooks**: Liveboard intent detection + post-compact convention recovery (~200 tokens/msg)
- **Shared tiles**: `_shared/tiles/` with AnswerTile, ChartRenderer, and 12 chart types
- **SalesDashboard prototype**: Liveboard prototype with view/edit modes and SpotterViz panel

### Platform and tooling

- **Deployment password gate**: Edge middleware password-gates Vercel deployments — opt-in per designer via `SITE_PASSWORD` env var in their Vercel dashboard
- **CalVer versioning**: `platformVersion.ts` as single source of truth; version badge on homepage, playground, and DS sidebar
- **Component source badges**: Figma / Scaligent / Custom badge on every component doc page
- **Release tooling**: `scripts/release.sh`, pre-push hook, `install-maintainer-hooks.sh`
- **6 Claude Code skills**: Auto-activating with `globs` frontmatter (component-inventory, content-guidelines, token-usage, layout-patterns, widget-patterns, modal-patterns)
- **CLAUDE.md trimmed 36%** (210 → 135 lines) — detailed guidelines moved to on-demand skills

### UI and performance

- **Homepage polish**: Space blue title, subtle card icons, shortened descriptions, footer easter egg
- **ECharts lazy-loaded**: 1.18 MB chunk deferred from startup to first chart render
- **All DS pages centred**: maxWidth 1200px in RadiantLayout

### Bug fixes and security

- **0 TypeScript errors**: Icon name, TileMode import, NoteTileProps, unused variables all resolved
- **Avatar contrast**: Light background tokens swapped for saturated content tokens
- **Vite 7.3.2**: High severity vulnerability patched
- **Picomatch**: Vulnerability patched, Figma Make package.json removed
- **ConfirmDialog**: Non-Radiant gradient override removed
- **Button examples**: All now include `iconPosition` prop

### Cleanup

- **Cmdk prototype gitignored**: 11 MB Figma Make export removed from designer forks
- **Orphaned prototypes deleted**: Homepage_example, ImpersonationV2, Liveboard, ModalPatterns
- **Documentation updated**: README, SETUP-GUIDE, Onepager, prototyping-guide refreshed with current counts

---

## [26.3.3a] - 2026-03-17

### Added

- **Liveboard template**: Starter template with AnswerTile, KPI tile, bar chart, and SpotterViz panel
- **AdminLang prototype**: Admin CSV-based translation settings with upload and validation
- **MiniSpotters prototype**: Domain-specific Spotter instances with bounded context and prompt libraries
- **Liveboard scaffolding rules**: `liveboard-ia.md` and `liveboard-scaffolding.md` for Liveboard generation
- **Cursor → Claude Code setup guide**: Migration guide linked from gallery

### Changed

- Thumbnail illustrations: removed dark colors, muted palette
- Legacy slash commands replaced with skill-based commands (`/start`, `/ship`, `/release`, `/status`)
- Docs updated to Galaxy URLs

### Removed

- **Liveboard prototype**: Removed from gallery (replaced by Liveboard template system)
- **Admin Impersonation prototype**: Removed from registry

---

## [26.3.2a] - 2026-03-13

### Added

- **Liveboard scaffolding**: Template, IA guidelines, and scaffolding rules (contributed by Devanshi Behera via PR #4)

---

## [26.3.1a] - 2026-03-10

### Changed

- Cursor rules optimized for progressive disclosure and on-demand loading

### Removed

- SpotterViz chart editor prototype reverted (premature)

---

## [26.2.5a] - 2026-03-05

### Added

- **UX writing guidelines**: Spotter Writer rules integrated into Cursor agent (contributed by Yash Chauhan via PR #1)
- **How it works page**: Converted to slide-based format with tab navigation
- **Playground gallery redesign**: New card layout with component counts and latest prototype shortcut
- **Workflow skills**: `/start`, `/ship`, `/release`, `/status` commands
- **Cursor model guide**: Model selection guidance for designers

### Changed

- **Project renamed**: figmaradiant → radiantplay across all config, docs, and UI
- Homepage redesigned with getting started guide
- `_examples` folder archived, stale docs cleaned up

---

## [26.2.4a] - 2026-03-03

### Added

- Getting started guide link on homepage

### Changed

- Homepage redesigned with split layout and polished guide landing

### Fixed

- Guide CTA moved below cards, floating hint removed

---

## [26.2.3a] - 2026-03-02

### Added

- **35 new components** (38 → 73 total): Horizontal, Vertical, View, Grid/RdGrid/RdGridItem, SplitPane, NoData, ExplainerCard, Image, Illustration, Legend, SafeHTML, OverlayLoading, FormControl, SearchBar, ActionMenu, VerticalStepper, List, Slider, ManagedList, Trending, NestedCheckbox, ManageTags, NumericFilterInput, DirectionControl, ColorPicker, InputMentions, FilterModal, Tree, TreeTable, Formatters, Tour, RichTextEditor, DragDrop, FormBuilder, DynamicForm, FacetSortBar

### Fixed

- Rollup path traversal vulnerability patched (GHSA-mw96-cpmx-2vgc)

---

## [26.2.3a] - 2026-02-25

### Added

- **Admin Impersonation prototype**: GlobalHeader icon, session popup, toast notification
- Fork-based workflow guide for designer onboarding

---

## [26.2.2a] - 2026-02-19

### Added

- **Vercel Analytics and Speed Insights**: Visitor analytics and Core Web Vitals tracking
- **AppSidebar integration**: Added to Liveboard, AdminGroups, and ChartEditorAI prototypes
- **localStorage filter**: Exclude internal visits from analytics

### Changed

- Cmdk simplified to icon-only admin trigger
- Prototype headers replaced with shared GlobalHeader component
- Component registry overhauled with roadmap page

---

## [26.2.2a] - 2026-02-18

### Added

- **3-layer color token system**: Reference (9 tonal scales × 12 stops) → System (42 semantic tokens × light/dark) → Component (46 per-component tokens × light/dark)
- CSS custom properties with `rd-sys-color-*` and `rd-comp-color-*` prefixes
- Dark mode support via `data-theme` attribute

### Changed

- All 36 CSS modules and 48 TypeScript files migrated from legacy `brandColors.*` to new `systemColors` / `referenceColors`
- Token count: 150+ → 290+

### Removed

- `brand.ts`, `alias.ts`, `mapped.ts`, `semantic.ts` — replaced by 3-layer system
- All legacy `--color-brand-*` CSS custom properties

### Fixed

- Dark mode override on macOS — default light theme set in `index.html`

---

## [26.2.1a] - 2026-02-16

### Added

- **ChartEditorAI prototype**: Figma-accurate chart editor layout
- **Homepage redesign**: Getting started guide with unified page title styles
- **ThoughtSpot product icons**: Added to Cmdk prototype
- **TODO.md checklist**: Project task tracking

### Changed

- Playground page overhauled with consolidated AI prototyping rules
- Hard-coded spacing replaced with design tokens across prototypes

### Fixed

- Typography page crash fixed
- Vercel 404 on direct URL navigation fixed with rewrites
- HTTP security headers added to `vercel.json`

---

## [26.2.1a] - 2026-02-04

### Added

- **Surfaces Showcase** (`/radiant/surfaces`): Modal patterns with all 4 sizes (M1–M4) and 4 types
- **Modal sub-components**: ModalFooter, ModalHeader, ModalWizardProgress, ModalNavPanel, ModalNavItem, ModalSplashContent
- **Admin Groups prototype**: Group creation wizard with bulk org assignment
- **SpotterMemory prototype**: Memory Sources object table with search and pagination

### Changed

- Modal spacing updated to Figma spec (header 20/24, content 24, footer 20/24)
- Modal footer buttons right-aligned per spec

### Removed

- ModalPatterns moved from Playground to Surfaces showcase

---

## [26.1.4a] - 2026-01-30

### Added

- **Playground system**: Gallery grid + full-page project viewer with lazy loading
- **Project Registry** (`src/prototypes/registry.ts`): Central metadata registry
- **Navigation sidebar**: Added to Liveboard prototype
- **Version history page**: Changelog component

### Changed

- URL structure reorganized under `/radiant/*`
- Renamed HomePage.tsx → RadiantHomePage.tsx

### Removed

- PlaygroundShowcase.tsx, WelcomePage.tsx — replaced by new system
- Command K prototype experiments cleaned up

---

## [26.1.3a] - 2026-01-28

### Added

- WelcomePage, global Inspector, and 7 new components
- Quick Setup section on HomePage

---

## [26.1.2a] - 2026-01-21

### Added

- **Initial release**: 17 core components, 3-tier design token system, 46 icons
- Component documentation pages
- Example prototypes (Filter Dialog, Data Dashboard, Settings Panel)
- AI-assisted prototyping workflow
- Project renamed from figmamcp → figmaradiant
