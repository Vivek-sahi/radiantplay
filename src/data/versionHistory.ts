/**
 * Version History Data
 *
 * Tracks version history for Radiant design system updates.
 * Includes component additions, modifications, Figma syncs, and removals.
 */
import { PLATFORM_VERSION } from './platformVersion';

export type ChangeType = 'added' | 'modified' | 'removed' | 'synced';
export type VersionType = 'major' | 'minor' | 'patch' | 'figma-sync';

export interface VersionChange {
  type: ChangeType;
  component: string;
  description: string;
  group?: string; // optional theme group — renders a section header in the changelog
}

export interface VersionEntry {
  version: string;
  date: string;
  type: VersionType;
  changes: VersionChange[];
}

/**
 * Version history entries - newest first
 */
export const versionHistory: VersionEntry[] = [
  {
    version: '26.5.4a',
    date: '2026-05-26',
    type: 'minor',
    changes: [
      { type: 'added', group: 'Prototypes', component: 'StylingPanel (Liveboard - Styling panel)', description: 'Restored after the original PR #14 revert. Per-tile drawer with density, color theme, corner style, spacing, and highlight overrides. Shared tile CSS variables added to AnswerTile, NoteTile, GroupTile. Authored by Devanshi Behara. Two integration bugs from the original PR also fixed (missing AnswerTileProps.highlighted, EditToolbar onToggleStyling wiring)' },
      { type: 'added', group: 'Prototypes', component: 'NewUIAdmin2 (AdminUI 2.0)', description: 'Application Settings screen added to the shared sample registry. Cluster settings, administration toggles, downloads and schedules, version control, AI settings. Lands via PR #19 from simran-pandit/feat/newuiadmin2' },
      { type: 'added', group: 'Spotter prototype', component: 'Analyst right-pane state machine', description: 'AnalystLandingPage + AnalystListPage added. Right pane now switches between chat, analyst landing, and analyst list states (matches the spotter-ia.md spec)' },
      { type: 'added', group: 'Spotter DS', component: 'PromptSuggestionsPanel', description: 'New panel surfaced from the prompt bar. Hideable, mode-aware. Prompt bar position stays fixed when the suggestion panel opens' },
      { type: 'modified', group: 'Spotter prototype', component: '12 IA polish corrections', description: 'Analyst selection state, recency-sorted chats, chat naming, analyst reorder on chat start only, clear analyst highlights when View all opens, center analyst grid at 936px, move Spotter (Default) into its own panel section, drop the logo icon from the Default panel item and welcome page' },
      { type: 'modified', group: 'Liveboard template', component: 'SpotterViz side panel', description: 'Full rebuild to match the Figma side-panel overlay. position: fixed (not flex sibling), dark navy #1d232f, mascot + greeting + 3 suggestion chips + sticky prompt bar' },
      { type: 'added', group: 'Playground', component: 'Archive section + sidebar nav', description: 'Gallery has a light left sidebar with Prototypes (default) and Archived sections. Per-card 3-dot menu archives or restores any prototype in your session (sessionStorage-backed). Save-to-code modal generates a Claude-ready prompt to commit the layout permanently. MiniSpotters and AdminLang now appear as archived by default' },
      { type: 'added', group: 'Registry', component: 'ProjectMeta.section field', description: "New 'sample' | 'mine' | 'archived' field on ProjectMeta. Drives the new archive section in the gallery" },
      { type: 'modified', group: 'Liveboard template', component: 'KPI cards + LineChart legend', description: 'KPI cards shortened (default height 1 row), and the first two (Revenue, Customers) now show chart variants instead of bare numbers. LineChart legend overlap fixed' },
      { type: 'modified', group: 'Brand', component: 'Logo navigates back to playground', description: 'ThoughtSpot brand mark click in GlobalHeader, LiveboardHeader (PrimaryNav), EditToolbar, and the DataModelEditor title now all navigate back to / (the playground gallery)' },
      { type: 'modified', group: 'Tokens', component: 'background-base-inverse', description: 'Reverted from #323946 back to #1D232F to match the production Liveboard edit-toolbar background. The Phase 2 token change had unintentionally muted the dark header' },
      { type: 'modified', group: 'Content', component: 'Customer references scrubbed', description: 'Royal Enfield references swapped to Acme Apparel across prototypes' },
      { type: 'modified', group: 'TypeScript', component: '43 errors resolved', description: '38 were in NewUIAdmin2, 4 pre-existing across DS + ChangelogPage. 34 of the 38 were unused-var noise — switched to noUnusedLocals: false for the prototype layer' },
      { type: 'modified', group: 'Dependencies', component: 'package-lock.json registry URLs', description: '31 ThoughtSpot internal artifactory URLs (jfrog-colo.corp.thoughtspot.com) rewritten to the public npm registry so Vercel can install dependencies on the open repo' },
    ],
  },
  {
    version: '26.5.3d',
    date: '2026-05-19',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Radiant brand', component: 'BrandMark component', description: 'New @components/BrandMark — canonical Radiant 3.0 TS monogram (4-path geometric mark). Single source of truth. Props: pixelSize, color (defaults to currentColor), className, aria props. Replaces inline SVG copies that lived in GlobalHeader, LiveboardHeader, EditToolbar, and spotter/icons.tsx' },
      { type: 'modified', group: 'Radiant brand', component: 'TS logo refresh', description: 'GlobalHeader, LiveboardHeader (PrimaryNav), and EditToolbar all swapped from the older single-path wordmark to the new 4-path monogram via <BrandMark />. ThoughtSpotMark in @spotter/icons is now a deprecated alias for BrandMark' },
      { type: 'added', group: 'Spotter DS', component: 'SettingsMenu + PersonalMemoryToggle', description: '@spotter/page popover Settings menu opened from a Radiant Popover trigger. 6 items in 4 dividered groups: Spotter instructions (modal) · Usage monitoring + Admin settings (external) · Manage memory sources (external) + Personal memory (inline toggle) · Spotter best practices (modal)' },
      { type: 'added', group: 'Spotter DS', component: 'ChatRowMenu + AnalystRowMenu', description: 'Hover-triggered row menus built on Radiant ActionMenu. ChatRow: Rename / Favorite / Share / Delete. AnalystRow: Edit (privilege-gated) / Share / Make a copy / Delete. Shared RowMenuAffordance helper for the fade-on-hover kebab pattern' },
      { type: 'modified', group: 'Spotter DS', component: 'ReasoningBlock', description: 'Unified brand-blue header (current step while streaming, "Thought for X seconds" once settled). Flat layout — no card chrome around peek or expanded steps. Code-block-styled tool I/O (monospace, background-subtle, generous padding). Peek description fades out instead of unmounting instantly' },
      { type: 'modified', group: 'Spotter DS', component: 'SpotterShell width tokens', description: 'spotterLayout.chatMaxWidth (936) and textMaxWidth (844) now actually flow through ChatThread, SpotterPrompt, ChatCanvas, and SpotterWelcome via --spotter-chat-max-width / --spotter-text-max-width CSS vars injected at the shell root. Tokens were bumped in 26.5.3c but CSS still hardcoded the old 880/760' },
      { type: 'modified', group: 'Spotter DS', component: 'AgentMessage avatar centering', description: 'Avatar now centers vertically with the first body line via a -6px margin (compensates for the 32px avatar vs 20px text-line center offset)' },
      { type: 'modified', group: 'Spotter DS', component: 'SpotterPrompt mode toggle', description: 'ChartSearch at size="m" (16px), Orbits at size="l" (18px) per design spec' },
      { type: 'modified', group: 'Spotter DS', component: 'ChatCanvas single stream', description: 'Dropped border-top + opaque background + top padding from .promptArea — chat thread now flows into the sticky prompt as one continuous stream, no visible separator' },
      { type: 'modified', group: 'Spotter prototype', component: 'Left panel restructure', description: '"Custom spotters" → "Analysts" (matches IA — analyst = custom AI agent, separate from data model). Dropped the "Spotter (Default)" row. "View library" → "View all >". Settings button at the bottom opens SettingsMenu. Chat + analyst rows wrapped in hover menus. mockData.ts: customSpotters → analysts with canEdit flag' },
      { type: 'modified', group: 'Spotter runtime', component: 'Toolcall icons', description: 'cannedResponses now use semantic Radiant glyphs (database, ai, search) instead of the generic spotter sparkle — toolcall icons describe the tool type, not the vendor' },
      { type: 'modified', group: 'Documentation', component: 'spotter-roadmap.md', description: 'Stage B Phase 1 marked done with itemized completion list. Phase 2 (right-pane state machine + AnalystLandingPage + AnalystListPage + showcase previews) listed as pending with effort estimates' },
    ],
  },
  {
    version: '26.5.3c',
    date: '2026-05-19',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Spotter DS', component: 'Spotter DS showcase page', description: 'New /radiant/spotter page with 4 sections — Chat (UserBubble, AgentMessage, TypingIndicator, ReasoningBlock, SpotterPrompt, QuickAction, QuickActionRow), Blocks (Text, Viz, Sources, FollowUps, Refine, Error + AnswerCard placeholder), Icons (5 Spotter glyphs at XS-XL), Tokens (spotterGlow, spotterChartBg, spotterLayout swatches). Ghosted placeholders for all planned components' },
      { type: 'added', group: 'Spotter DS', component: 'SpotterShell doc page', description: 'New /radiant/components/spottershell — peer to GlobalHeader / AppShell doc pages. Breadcrumb + title + previews for SpotterShell, SpotterLeftSide (rail+panel internals merged), SpotterWelcome (default + custom greeting via tabs), SpotterLeftToggle. SpotterShell preview uses real GlobalHeader theme="light"' },
      { type: 'added', group: 'Spotter DS', component: 'Fullscreen previews', description: '/preview/spottershell and /preview/appshell render the shells at full viewport with no Radiant chrome. Linked from each doc page via "View fullscreen ↗"' },
      { type: 'added', group: 'Documentation', component: 'Spotter cursor rules', description: 'Four new rules — spotter-ia.md (standalone IA: left panel structure, right-pane states, Settings menu, hover menus, exact widths), spotter-agentic-chat-ia.md (embedded Code/Viz/Model), spotter-scaffolding.md, plus Planned-components section in spotter-components.md. Spotter Requirements Gate in _orchestration.md upgraded to Q&A by mode' },
      { type: 'added', group: 'Documentation', component: 'docs/spotter-roadmap.md', description: 'Resume-here tracker for all Spotter work — status per mode, active scope, planned components, open questions, linked docs' },
      { type: 'modified', group: 'Sidebar', component: 'Radiant nav', description: '"Spotter" renamed to "Spotter DS"; new "SpotterShell" entry under Widgets; "New" badges removed from LiveboardHeader / GlobalHeader / AppSidebar / AppShell' },
      { type: 'modified', group: 'Tokens', component: 'spotterLayout', description: 'chatMaxWidth 880 → 936 (matches 2026-05-19 IA spec). New textMaxWidth = 844 for text content inside the chat container' },
      { type: 'modified', group: 'Icons', component: 'VizBlock expand button', description: 'Now uses the diagonal expand glyph (matches Figma node 852:7344) instead of the horizontal fullscreen icon. Affects every viz answer rendered in Spotter responses' },
      { type: 'modified', group: 'Spotter logic', component: 'ReasoningBlock streaming', description: 'Three-state model documented — semi-collapsed during streaming (current step upfront, expand to see prior steps), expanded then auto-collapsing on done, settled "Thought for X seconds" trigger after 600ms' },
      { type: 'modified', group: 'Showcase styling', component: 'Visual conventions', description: 'Spotter doc pages aligned to ComponentDocPage spec — 1000px container, 36px Plain 700 title, 20px Plain 600 section title, 32px card padding, 12px radius. No own background — inherits the sunken layout bg like other Radiant pages' },
      { type: 'modified', group: 'Components', component: 'PreviewCard', description: 'Showcase wrapper gained useTabs (Radiant Tabs for multi-variant cards, matches GlobalHeader doc-page pattern) and fullSizeHref ("View fullscreen ↗" link) props' },
    ],
  },
  {
    version: '26.5.3b',
    date: '2026-05-18',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Tooling', component: '/sync-upstream', description: 'Rewrite — preview-first, feature-branch safe. Lands upstream on main before forwarding into your branch. Stash uses --include-untracked so new files are no longer lost. /check-upstream consolidated into /sync-upstream as phase one' },
      { type: 'modified', group: 'Infrastructure', component: 'middleware', description: 'Staging branch is publicly accessible; other preview branches stay gated' },
      { type: 'modified', group: 'Infrastructure', component: 'Vercel headers', description: 'X-Frame-Options SAMEORIGIN so same-origin iframes inside prototypes load correctly' },
      { type: 'modified', group: 'Maintainer workflow', component: 'Branch model', description: 'CLAUDE.md split: personal + personal/* are origin-only, galaxy-bound branches are main, staging, and shared feat/fix/chore. Pre-push hook enforces the rule' },
    ],
  },
  {
    version: '26.5.3a',
    date: '2026-05-08',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Sample prototypes', component: 'Gallery order', description: 'Spotter moved to the bottom of registry-core.ts so it appears first in the gallery (the gallery reverses array order to show newest-by-date first). Convention: append new sample prototypes to the end of the array' },
    ],
  },
  {
    version: '26.5.3',
    date: '2026-05-08',
    type: 'minor',
    changes: [
      { type: 'added', group: 'Spotter prototype', component: 'Spotter prototype', description: 'Registered in registry-core.ts as a sample. In-thread agentic chat with welcome state, collapsible 64↔260 left panel, light-mode GlobalHeader, sticky prompt' },
      { type: 'added', group: 'Spotter DS', component: '@spotter/* — two-layer DS', description: 'Peer to @components/* — Spotter-domain blocks built on Radiant primitives. Subdomains: chat, page, answer, viz, runtime, plus tokens and icons' },
      { type: 'added', group: 'Spotter DS', component: 'Chat layer', description: 'SpotterChatProvider + useReducer + AbortController, async-iterable askSpotter() service (canned + live modes), 4 fixtures with rich reasoning' },
      { type: 'added', group: 'Spotter DS', component: 'Block renderers', description: 'TextBlock, VizBlock (real ECharts with line/bar/pie/table, iframe/data/placeholder slot, M4 fullscreen expand modal, canonical 5-action footer), SourcesBlock, FollowUpsBlock (clickable chips that call send), RefineBlock, ErrorBlock' },
      { type: 'added', group: 'Spotter DS', component: 'Page shell + chat layout', description: 'SpotterShell, SpotterLeftSide (smooth 64↔260 animation), SpotterRail/Item, SpotterPanel/Section/Item/Action, SpotterWelcome. ChatThread, MessageRow, UserBubble, AgentMessage with feedback row, TypingIndicator, ReasoningBlock with embedded ToolcallCard and "Worked for X seconds" footer' },
      { type: 'added', group: 'Spotter DS', component: 'Prompt + icons', description: 'SpotterPrompt with purple→blue gradient on :focus-within. Custom PanelToggle, ChartSearch, Orbits, Bell, ThoughtSpotMark glyphs (Radiant icons used for everything else)' },
      { type: 'added', group: 'Documentation', component: 'Spotter rules + plans', description: 'Three .cursor/rules files (spotter-components, spotter-logic, spotter-response-style) auto-attach on Spotter files. Spotter Requirements Gate in _orchestration.md. CLAUDE.md addendum. Four plan docs covering DS, prototype shell, answer card, chat extraction, plus VizBlock behaviour guide' },
      { type: 'synced', group: 'Design system', component: '147 icons + light GlobalHeader', description: 'Radiant 3.0 Figma icon sync — 96 new icons added, 51 existing icons updated, 1 retired (Refresh → Sync with refresh alias). Registry went from 53 → 148 unique icons (151 entries with 3 backward-compat aliases). Light-mode GlobalHeader theme used by the Spotter prototype' },
    ],
  },
  {
    version: '26.5.2e',
    date: '2026-05-08',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Spotter prototype', component: 'Sentence-case fixes', description: '"Deal Accelerator" → "Deal accelerator", "Fall and Winter" → "fall and winter" — flagged by /radiant-check' },
      { type: 'added', group: 'Spotter DS', component: 'spotterLayout token', description: 'New spotterLayout.chatMaxWidth (880) constant in src/spotter/tokens.ts. Documented constant for shared use; CSS modules continue to use 880px until a global CSS-variable home is decided' },
    ],
  },
  {
    version: '26.5.2d',
    date: '2026-05-08',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Spotter chat', component: 'VizBlock — real ECharts rendering', description: 'Replaced the custom SVG sketch with echarts-for-react using the existing chart palette (chartColors / chartUi / chartFont) from _shared/tiles. Supports line / bar / pie / table chartKinds with axis labels, gridlines, tooltips, value labels on bars, multi-series legend' },
      { type: 'modified', group: 'Spotter chat', component: 'VizBlock M4 expand modal', description: 'Modal portaled to document.body to escape the chat tree containing block; M4 full-width override (max-width: none) so it covers the viewport edge-to-edge; "Expand"/"Close" header + chart title + view toggle + tokens row + chart slot + "Showing X of X data points" footer matching the figma' },
      { type: 'modified', group: 'Spotter chat', component: 'Streaming keyframes containing block', description: 'blockIn / reasoningIn / stepIn / workedForIn keyframes now end with transform: none instead of translateY(0). Translate(0) is a non-none transform that creates a containing block, which trapped Modal position: fixed' },
    ],
  },
  {
    version: '26.5.2c',
    date: '2026-05-08',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Spotter chat', component: 'Streaming animation polish', description: 'Six smoothness fixes: step dot color transition (gray→brand→gray no longer snaps), block fade-up entry on viz / followups / sources, steps container collapse via max-height + opacity (no remount), toolcall body slide-open instead of pop, ReasoningBlock fades in only when reasoning starts (cleaner crossfade from TypingIndicator), "Worked for X seconds" fade-in with delay' },
      { type: 'modified', group: 'Spotter chat', component: 'ReasoningBlock mount behaviour', description: 'Steps + toolcall body now stay mounted, visibility flips via data attributes — re-open is instant, collapse animates smoothly' },
    ],
  },
  {
    version: '26.5.2b',
    date: '2026-05-07',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Spotter chat', component: 'Chat extraction end-to-end', description: 'SpotterChatProvider + useReducer + AbortController. ChatThread, MessageRow, UserBubble (single-row layout), AgentMessage with feedback row. TypingIndicator (spinner + "Analysing…"). ReasoningBlock with rich steps (descriptions + embedded ToolcallCard, brand-blue trigger when expanded, gray done dots, "Worked for X seconds")' },
      { type: 'added', group: 'Spotter chat', component: 'Streaming runtime', description: 'AnswerChunk protocol (reasoning_start/step/done, block_start/text_delta/block_done, message_done, error). askSpotter() async generator with canned + live modes. 4 fixtures (viz, text, refine, sources) with rich reasoning. Naive keyword router defaults to viz' },
      { type: 'added', group: 'Spotter chat', component: 'Block renderers', description: 'TextBlock, VizBlock (slot model: chartSlot > iframe > data > placeholder; canonical 5-action footer; chart/table toggle; expand modal), SourcesBlock, FollowUpsBlock (clickable chips that call send), RefineBlock (clickable options), ErrorBlock' },
      { type: 'modified', group: 'Spotter chat', component: 'SpotterPrompt', description: 'Purple→blue gradient border on :focus-within using token-based linear-gradient with background-clip trick' },
      { type: 'modified', group: 'Spotter prototype', component: 'Welcome ↔ chat transition', description: 'Prototype now wraps in SpotterChatProvider; renders SpotterWelcome when empty, ChatCanvas (sticky prompt + thread + disclaimer) when populated' },
      { type: 'modified', group: 'Spotter DS', component: 'Smooth panel animation', description: 'SpotterLeftSide owns a wrapper with cubic-bezier(0.32, 0.72, 0, 1) width transition for 64↔260 collapsed/expanded' },
      { type: 'modified', group: 'Spotter DS', component: 'PanelToggle icon, ChartSearch + Orbits glyphs', description: 'Custom SVGs in src/spotter/icons.tsx — panel toggle from Figma (8K7cAOPsv...), prompt mode toggles (RzKUZMdJsNVdoVhkYmXvlI / 1887:6197)' },
      { type: 'modified', group: 'Spotter DS', component: 'Panel section visuals', description: 'Full-width selected state on items, full-width line breaks between sections (per Figma 1887:3912)' },
      { type: 'added', group: 'Documentation', component: 'VizBlock behaviour doc + Spotter rules', description: 'docs/2026-05-07-spotter-viz-block-behaviour.md covers slot model and customization. Three .cursor/rules files (spotter-components, -logic, -response-style) auto-load when working on Spotter files. Spotter Requirements Gate added to _orchestration.md. CLAUDE.md addendum points to the four Spotter docs' },
    ],
  },
  {
    version: '26.5.2a',
    date: '2026-05-07',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Spotter DS', component: '@spotter/ peer to @components/', description: 'Two-layer DS scaffold: Spotter-domain building blocks layered on top of Radiant. New path alias @spotter/* in vite + tsconfig' },
      { type: 'added', group: 'Spotter DS', component: 'chat primitives', description: 'QuickAction, QuickActionRow, SpotterPrompt — controlled prompt with auto-resize, mode toggle, model picker, controls icon, blue submit' },
      { type: 'added', group: 'Spotter DS', component: 'page primitives', description: 'SpotterShell, SpotterLeftSide, SpotterRail/Item, SpotterPanel/Section/Item/Action, SpotterWelcome — full shell with smooth 64↔260 width animation between rail and panel modes' },
      { type: 'added', group: 'Spotter DS', component: 'spotter tokens', description: 'src/spotter/tokens.ts — radial brand glow + chart-token bg aliases over Radiant system colors' },
      { type: 'added', group: 'Spotter DS', component: 'spotter icons', description: 'src/spotter/icons.tsx — PanelToggle, Bell, ThoughtSpotMark (brand), ChartSearch and Orbits (prompt mode toggle) — only glyphs missing from Radiant registry' },
      { type: 'added', group: 'Prototypes', component: 'Spotter prototype', description: 'First Spotter DS consumer: light-mode GlobalHeader, collapsible left nav, welcome canvas with greeting + prompt + 3 quick actions; mock chats and custom Spotters in left panel' },
      { type: 'added', group: 'Documentation', component: 'Spotter DS plan set', description: 'Four plan docs under docs/: parent two-layer DS plan, prototype shell plan, AnswerCard spec, chat extraction spec' },
    ],
  },
  {
    version: '26.5.2',
    date: '2026-05-07',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Documentation', component: 'Muze charts setup guide', description: 'docs/muze-charts-setup.md — opt-in walkthrough for adding Muze (private packagecloud library) to a prototype: auth, install, component scaffolding, chart-shape cheatsheet, and resize-aware mounting' },
      { type: 'modified', group: 'Design system', component: 'LiveboardHeader', description: 'Refactor: unify dark surfaces and tokenize raw hex values' },
      { type: 'modified', group: 'Design system', component: 'Radiant pages text contrast', description: 'Bump content-tertiary to content-secondary for readability' },
      { type: 'removed', group: 'Pages', component: '5 unrouted page components', description: 'Delete ComponentStatusPage, DataDashboardDemo, GuidelinesPage, SettingsPanelDemo, SpotterDashboard — never wired into App.tsx routes (~2,400 lines)' },
      { type: 'modified', group: 'Design system', component: 'components/index.ts', description: 'Remove duplicate exports of LoadingIndicator, Popover, Select' },
    ],
  },
  {
    version: '26.5.1',
    date: '2026-05-05',
    type: 'patch',
    changes: [
      { type: 'removed', group: 'Prototypes', component: 'SalesDashboard prototype', description: 'Liveboard sample prototype removed from the registry — reference patterns continue to live in _liveboard-template' },
      { type: 'removed', group: 'Prototypes', component: 'SpotterModel prototype', description: 'Standalone agent edit-flow prototype removed — its patterns are now covered by DataModelEditor + the shared _agentic module' },
      { type: 'removed', group: 'Prototypes', component: 'StylingPanel merge reverted', description: 'PR #14 (StylingPanel + shared tile density/override system) reverted on staging due to integration issues; will be re-introduced in a follow-up PR' },
    ],
  },
  {
    version: '26.5.0',
    date: '2026-04-30',
    type: 'minor',
    changes: [
      { type: 'added', group: 'Data Model Editor', component: 'DataModelEditor prototype', description: 'New canvas-based prototype: draggable table cards, column tree, join connectors, retail schema preset, and a unified config gate via window.__DME_CONFIG__' },
      { type: 'added', group: 'Data Model Editor', component: 'Welcome variants', description: 'Two starting states: blank canvas with creation welcome, or pre-populated retail schema with "Check for AI readiness" CTA' },
      { type: 'added', group: 'SpotterModel', component: 'AI agent panel', description: 'Right-side AI chat panel with table, join, column, and formula suggestions; reasoning blocks; confidence badges; and version-history restore' },
      { type: 'added', group: 'SpotterModel', component: '/api/chat proxy', description: 'Anthropic proxy as a Vercel serverless function and a Vite dev middleware so the panel works in both environments' },
      { type: 'added', group: 'SpotterModel', component: '/switch-model command', description: 'Switch the Claude model used by AI-capable prototypes between Haiku (cheap/fast), Sonnet (balanced), and Opus (most capable)' },
      { type: 'added', group: 'Shared modules', component: '_agentic module', description: '11 components shared across AI-enabled prototypes: AgentPanel, SuggestionCard, ReasoningBlock, ConfidenceBadge, JoinDiagram, NextActionChips, ToolcallCard, TypingIndicator, UserBubble, VersionCard, AgentResponseBlock' },
      { type: 'added', group: 'Shared modules', component: '_datamodel module', description: '4 canvas-layer components: TableCanvas, ColumnTree, JoinConnector, TableCard — reusable for any data-model surface' },
      { type: 'modified', group: 'Design system', component: 'OverlayLoading', description: 'New variant + label props (backwards-compatible — existing usages continue to render the spinner)' },
      { type: 'added', group: 'AI orchestrator', component: 'DME rule files', description: 'Three new rule files (data-model-editor-ia, -components, -interactions) and a Tier 2 DME Requirements Gate that asks welcomeVariant, SpotterModel, and dataset before loading' },
      { type: 'modified', group: 'AI orchestrator', component: 'DME concern row split', description: 'Single Tier 1 DME row split into IA / components / interactions plus an "AI agent panel (any prototype)" fallback row for non-DME adopters' },
      { type: 'modified', group: 'Infrastructure', component: 'ANTHROPIC_API_KEY in dev', description: 'Fixed: vite middleware now reads the key via loadEnv — previously process.env was empty and the AI panel errored on dev' },
    ],
  },
  {
    version: '26.4.4c',
    date: '2026-04-28',
    type: 'minor',
    changes: [
      { type: 'added', group: 'Project status dashboard', component: '/project-status command', description: 'Renamed from /status-page; generates a local HTML dashboard with overview, branches, forks/upstream, and docs/plans tabs at zero LLM token cost' },
      { type: 'added', group: 'Project status dashboard', component: 'Worktree view', description: 'Each checkout shown with branch, modified count, divergence vs main, and locked/prunable badges' },
      { type: 'added', group: 'Project status dashboard', component: 'Branch divergence', description: 'Three columns vs main, staging, and upstream/main with last commit subject + relative age' },
      { type: 'added', group: 'Project status dashboard', component: 'Role-aware tabs', description: 'Maintainers see the full Forks tab; designer forks see an Upstream sync tab with behind/ahead vs upstream' },
      { type: 'added', group: 'Project status dashboard', component: 'Inline markdown viewer', description: 'Click any .md row to open its rendered content in an in-page modal (marked with raw fallback)' },
      { type: 'added', group: 'Project status dashboard', component: 'Local-only badges', description: 'Gitignored files (BACKLOG.md, plans/, articles/) get a blue local chip' },
      { type: 'modified', group: 'Project status dashboard', component: 'Forks sort order', description: 'Most recently pushed forks first instead of alphabetical' },
      { type: 'added', group: 'Changelog highlights', component: 'Highlights section', description: 'Curated section at the top of the Changelog page cherry-picks major work across recent releases' },
      { type: 'added', group: 'Changelog highlights', component: 'Visibility window', description: 'Highlights show items from the last 60 days OR the last 6 items, whichever is longer' },
      { type: 'added', group: 'Changelog highlights', component: 'release.sh prompt', description: 'release.sh asks the maintainer for highlights interactively during release and pre-inserts them in the printed ChangelogPage draft' },
      { type: 'added', group: 'AI orchestrator', component: 'MCP plugin overhead check', description: 'New Step 0c flags Figma MCP ~4k tokens-per-message cost once per session if no Figma signal is detected' },
      { type: 'modified', group: 'Security', component: 'postcss', description: 'Bumped 8.5.6 to 8.5.10 in lockfile to patch XSS via unescaped style tag (GHSA-qx2v-qp2m-jg93)' },
      { type: 'added', group: 'Documentation', component: 'Workflow explorations', description: '3-slide ASCII workflow deck and revised AI workflow diagram salvaged from local experiments' },
    ],
  },
  {
    version: '26.4.4b',
    date: '2026-04-28',
    type: 'minor',
    changes: [
      { type: 'added', group: 'Phase 1 — Primitive colors', component: 'darkGray Scale', description: '12 stops added to referenceColors — neutral foundation for Phase 6 dark mode remap' },
      { type: 'added', group: 'Phase 1 — Primitive colors', component: 'Alpha Variants', description: 'gray-70a/60a/40a/10a, blue-10a, dark-gray-30a for overlays and translucent highlights' },
      { type: 'modified', group: 'Phase 1 — Primitive colors', component: 'Hex Fixes', description: 'purple/70 #6847BA→#6A4ABA, purple/100 #0D0030→#0E0033, teal/70 #359FAA→#369FAA' },
      { type: 'modified', group: 'Phase 2 — Light semantic colors', component: '6 Value Fixes', description: 'content-tertiary, border-focus, border-hover, background-overlay, background-ghost-highlight, background-base-inverse' },
      { type: 'added', group: 'Phase 2 — Light semantic colors', component: '22 Accent Tokens', description: '9 background-accent-*, 6 content-accent-*, 7 border-* (subtle-hover + 6 accents)' },
      { type: 'modified', group: 'Phase 3 — Typography', component: 'Letter Spacing', description: 'tight -0.01em → -0.4px (Figma absolute), new tighter -0.6px' },
      { type: 'modified', group: 'Phase 3 — Typography', component: 'Heading Weights', description: '6 v2TextStyles entries medium → semibold (headlineLarge, pageTitle, modalTitle, sectionLabel, contentLabel, contentLabelSubhead)' },
      { type: 'modified', group: 'Phase 3 — Typography', component: 'Body Weight', description: 'textStyles.body.large/normal light (375) → regular (400)' },
      { type: 'added', group: 'Phase 4 — Elevation', component: 'shadowPrimitives', description: '3 semantic levels (surface/menu/modal) with light + dark variants matching Figma' },
      { type: 'added', group: 'Phase 4 — Elevation', component: 'CSS Shadow Variables', description: '--shadow-surface, --shadow-menu, --shadow-modal added to :root and [data-theme="dark"]' },
      { type: 'modified', group: 'Phase 4 — Elevation', component: 'Component Migration', description: 'Modal, Tooltip, Popover, Card, Menu, DatePicker, FilterModal, InputMentions, AppSidebar overlay now use semantic shadow vars' },
      { type: 'modified', group: 'Phase 5 — Layout', component: 'Sidebar Width', description: 'AppSidebar/AppShell default 261px → 260px (Figma alignment)' },
    ],
  },
  {
    version: '26.4.4a',
    date: '2026-04-27',
    type: 'minor',
    changes: [
      { type: 'modified', group: 'Modal alignment with Figma', component: 'Modal Header', description: 'Padding restored to 20px 24px (variable height) so wizard variants grow correctly for eyebrow + title' },
      { type: 'modified', group: 'Modal alignment with Figma', component: 'Modal Footer', description: 'Fixed at 72px with 0 24px padding; tertiary-left / primary-right CTA placement bug fixed (was double-wrapped)' },
      { type: 'modified', group: 'Modal alignment with Figma', component: 'Wizard Stepper', description: 'Rebuilt as discrete 4px segments with 6px gap and 2px radii; also renders for splashscreen type' },
      { type: 'removed', group: 'Modal alignment with Figma', component: 'Close Icon', description: 'X icon removed from M1/M2/M3 simple modals — only M4 keeps the "Close" text link, per Figma' },
      { type: 'modified', group: 'Modal alignment with Figma', component: 'Splash Screen', description: 'Header no longer renders (title lives in body via ModalSplashContent)' },
      { type: 'modified', group: 'Modal alignment with Figma', component: 'Overlay z-index', description: 'Bumped to 1000 so M4 covers the sidebar' },
      { type: 'added', group: 'Surfaces showcase', component: 'Eyebrow Variant', description: 'New M2 eyebrow-only modal demo (no stepper)' },
      { type: 'added', group: 'Surfaces showcase', component: 'Splash Screen Multi', description: 'New 3-step onboarding splash flow with stepper' },
      { type: 'modified', group: 'Surfaces showcase', component: 'Wizard Footer', description: 'Back kept rendered (disabled on step 1) + primary button minWidth: spacing.I*2 for position consistency' },
      { type: 'modified', group: 'Surfaces showcase', component: 'Button Demo Tokens', description: 'Secondary uses content-primary, primary uses content-alternate' },
      { type: 'added', group: 'Platform tooling', component: 'LastUpdated', description: 'Shared component reads lastModified from componentRegistry; added to Surfaces, Icons, Architecture, ComponentDocPage' },
      { type: 'modified', group: 'Platform tooling', component: 'Modal Registry Entry', description: 'Refreshed with current Figma node ID and 2026-04-27 sync date' },
    ],
  },
  {
    version: '26.4.1c',
    date: '2026-04-08',
    type: 'major',
    changes: [
      { type: 'added', group: 'Fork architecture', component: 'Registry Split', description: 'registry-core.ts (upstream) + registry-mine.ts (designer) + thin merger — eliminates merge conflicts for all designer forks' },
      { type: 'modified', group: 'Fork architecture', component: 'Fork Workflow', description: 'sync-upstream, check-upstream, new-prototype, prototype-structure, FORK-WORKFLOW updated for 3-file registry' },
      { type: 'added', group: 'AI orchestrator', component: 'Orchestrator Tier System', description: 'Intent-based classification (Tier 0–3) with concern-matching — 81% context reduction' },
      { type: 'added', group: 'AI orchestrator', component: 'Pre-Implementation Gate', description: '4 checks before code: component exists, CSS anti-patterns, icon name, forbidden words' },
      { type: 'added', group: 'AI orchestrator', component: 'Iteration Loop Detection', description: 'Suggests batching after 3+ sequential single-property changes' },
      { type: 'added', group: 'AI orchestrator', component: 'Claude Code Skills', description: '6 auto-activating skills with globs (component-inventory, content-guidelines, token-usage, layout-patterns, widget-patterns, modal-patterns)' },
      { type: 'added', group: 'Liveboard system', component: 'Canvas 3-Tier Split', description: 'liveboard-canvas.md (568 lines) → core (242), edit (238), advanced (100) with prerequisite chains' },
      { type: 'added', group: 'Liveboard system', component: 'Liveboard Requirements Gate', description: '4-question pre-build gate (mode, interactions, tile types, data)' },
      { type: 'added', group: 'Liveboard system', component: 'Shared Tiles', description: '_shared/tiles/ with AnswerTile, ChartRenderer, and 12 chart types' },
      { type: 'added', group: 'Liveboard system', component: 'SalesDashboard', description: 'Liveboard prototype with view/edit modes and SpotterViz panel' },
      { type: 'added', group: 'Platform tooling', component: 'Deployment Password Gate', description: 'Edge middleware password-gates Vercel deployments — opt-in per designer via SITE_PASSWORD env var in their Vercel dashboard' },
      { type: 'added', group: 'Platform tooling', component: 'Platform Version', description: 'platformVersion.ts as single source of truth — version badge on homepage, playground, and DS sidebar' },
      { type: 'added', group: 'Platform tooling', component: 'Component Source Badge', description: 'Figma / Scaligent / Custom badge on every component doc page' },
      { type: 'added', group: 'Platform tooling', component: 'Release Tooling', description: 'scripts/release.sh, pre-push hook, install-maintainer-hooks.sh' },
      { type: 'modified', group: 'UI and performance', component: 'Homepage', description: 'Space blue title, subtle card icons, shortened descriptions, footer easter egg' },
      { type: 'modified', group: 'UI and performance', component: 'ECharts Bundle', description: 'Lazy-loaded via React.lazy — 1.18 MB chunk deferred until first chart render' },
      { type: 'modified', group: 'UI and performance', component: 'CLAUDE.md', description: 'Trimmed 36% (210 → 135 lines) — guidelines moved to on-demand skills' },
      { type: 'modified', group: 'UI and performance', component: 'Documentation', description: 'README, SETUP-GUIDE, Onepager, prototyping-guide refreshed with current counts' },
      { type: 'modified', group: 'Bug fixes and security', component: 'TypeScript', description: 'All 6 errors resolved — icon name, TileMode import, NoteTileProps, unused variables' },
      { type: 'modified', group: 'Bug fixes and security', component: 'Avatar', description: 'Light background tokens swapped for saturated content tokens (contrast fix)' },
      { type: 'modified', group: 'Bug fixes and security', component: 'Vite', description: '7.3.2 — high severity vulnerability patched' },
      { type: 'modified', group: 'Bug fixes and security', component: 'ConfirmDialog', description: 'Non-Radiant gradient override removed' },
      { type: 'removed', group: 'Cleanup', component: 'Cmdk Prototype', description: 'Gitignored (11 MB Figma Make export) — reduces designer fork size' },
      { type: 'removed', group: 'Cleanup', component: 'Orphaned Prototypes', description: 'Deleted Homepage_example, ImpersonationV2, Liveboard, ModalPatterns' },
      { type: 'removed', group: 'Cleanup', component: 'liveboard-canvas.md', description: 'Replaced by 3-tier canvas files (core + edit + advanced)' },
    ],
  },
  {
    version: '26.3.3a',
    date: '2026-03-17',
    type: 'major',
    changes: [
      { type: 'added', component: 'Liveboard Template', description: 'Starter template with AnswerTile, KPI, bar chart, SpotterViz' },
      { type: 'added', component: 'AdminLang', description: 'Admin CSV-based translation settings prototype' },
      { type: 'added', component: 'MiniSpotters', description: 'Domain-specific Spotter instances with bounded context' },
      { type: 'added', component: 'Liveboard Scaffolding', description: 'liveboard-ia.md and liveboard-scaffolding.md rules' },
      { type: 'added', component: 'Workflow Skills', description: '/start, /ship, /release, /status, /sync-upstream commands' },
      { type: 'modified', component: 'Project Name', description: 'Renamed figmaradiant → radiantplay across all config and UI' },
      { type: 'modified', component: 'Playground Gallery', description: 'Redesigned with component counts and metadata cards' },
      { type: 'removed', component: 'Liveboard Prototype', description: 'Removed from gallery (replaced by template system)' },
      { type: 'removed', component: 'Admin Impersonation', description: 'Removed from registry' },
    ],
  },
  {
    version: '26.2.5a',
    date: '2026-03-05',
    type: 'minor',
    changes: [
      { type: 'added', component: 'UX Writing Guidelines', description: 'Spotter Writer rules integrated into Cursor agent (PR #1 by Yash Chauhan)' },
      { type: 'added', component: 'How It Works Page', description: 'Converted to slide-based format with tab navigation' },
      { type: 'added', component: 'Cursor Model Guide', description: 'Model selection guidance for designers' },
      { type: 'modified', component: 'Homepage', description: 'Redesigned with getting started guide' },
    ],
  },
  {
    version: '26.2.4a',
    date: '2026-03-02',
    type: 'minor',
    changes: [
      { type: 'added', component: '35 New Components', description: 'Horizontal, Vertical, View, Grid, SplitPane, NoData, ExplainerCard, Image, Illustration, Legend, SafeHTML, and 24 more' },
      { type: 'modified', component: 'Component Count', description: 'Updated from 38 → 73 in registry and all UI displays' },
      { type: 'modified', component: 'component-inventory.md', description: '6 new decision-tree sections, 4 new combination patterns' },
      { type: 'modified', component: 'widget-patterns.md', description: 'ActionMenu, DragDrop, Tree, and Tour patterns appended' },
    ],
  },
  {
    version: '26.2.2a',
    date: '2026-02-18',
    type: 'major',
    changes: [
      { type: 'added', component: 'Reference Tokens', description: '9 tonal scales (brand, gray, blue, green, red, yellow, orange, purple, teal) × 12 stops' },
      { type: 'added', component: 'System Tokens', description: '42 semantic tokens (background, content, border) with light/dark mode support' },
      { type: 'added', component: 'Component Tokens', description: '46 per-component tokens (button, chip, toggle) with light/dark mode' },
      { type: 'added', component: 'CSS Custom Properties', description: 'rd-sys-color-* and rd-comp-color-* variables in tokens.css' },
      { type: 'added', component: 'Dark Mode', description: 'Built-in light/dark mode via data-theme attribute' },
      { type: 'modified', component: 'All Components', description: 'Migrated 36 CSS modules and 48 TS files to new 3-layer token system' },
      { type: 'modified', component: 'Color System Page', description: 'Added System Tokens preview with 42 semantic tokens' },
      { type: 'modified', component: 'Architecture Page', description: 'Rewritten with Reference → System → Component documentation' },
      { type: 'removed', component: 'brand.ts / alias.ts / mapped.ts', description: 'Replaced by reference.ts, system.ts, and component.ts' },
    ],
  },
  {
    version: '26.2.1b',
    date: '2026-02-03',
    type: 'patch',
    changes: [
      { type: 'modified', component: 'Typography Page', description: 'Fixed page crash by removing invalid body-small variant' },
      { type: 'modified', component: 'Typography Page', description: 'Consolidated Typography documentation to /radiant/typography path' },
      { type: 'modified', component: 'App Routes', description: 'Added redirect from /radiant/components/typography to /radiant/typography' },
    ],
  },
  {
    version: '26.2.1a',
    date: '2026-02-03',
    type: 'minor',
    changes: [
      { type: 'added', component: 'Surfaces Showcase', description: 'New Surfaces section showcasing Modal patterns (M1-M4) with interactive examples' },
      { type: 'added', component: 'ModalFooter', description: 'Reusable footer component with tertiary, secondary, and primary action slots' },
      { type: 'added', component: 'ModalHeader', description: 'Reusable header component with title, eyebrow, and close button' },
      { type: 'added', component: 'ModalWizardProgress', description: 'Progress bar component for wizard-type modals (2-4 steps)' },
      { type: 'added', component: 'ModalNavPanel', description: 'Left navigation panel for sub-navigation type modals' },
      { type: 'added', component: 'ModalSplashContent', description: 'Content component for splash screen modals' },
      { type: 'modified', component: 'Modal', description: 'Fixed spacing to match Figma specs (20px/24px padding), right-aligned CTAs in footer' },
      { type: 'modified', component: 'Modal.module.css', description: 'Added margin-left: auto to primaryActions for proper right alignment' },
      { type: 'removed', component: 'ModalPatterns', description: 'Removed from playground gallery (now available in Surfaces showcase)' },
    ],
  },
  {
    version: '26.1.4c',
    date: '2026-01-30',
    type: 'minor',
    changes: [
      { type: 'added', component: 'Toast', description: 'Temporary notification component with auto-dismiss' },
      { type: 'added', component: 'TextArea', description: 'Multi-line text input with character counter' },
      { type: 'added', component: 'SegmentedControl', description: 'Mutually exclusive segment options (text/icon variants)' },
      { type: 'added', component: 'LoadingIndicator.Skeleton', description: 'Shimmer/skeleton loading placeholder variant' },
      { type: 'added', component: 'AvatarGroup', description: 'Stacked avatars with +N overflow indicator' },
      { type: 'added', component: 'TableCellRenderers', description: 'Helper utilities for Avatar, Chip, Status table cells' },
      { type: 'added', component: 'VersionHistoryPage', description: 'Full changelog page replacing popup panel' },
      { type: 'modified', component: 'DatePicker', description: 'Added Month and Year picker view modes' },
      { type: 'modified', component: 'Sidebar', description: 'Changed version footer to link to changelog page' },
    ],
  },
  {
    version: '26.1.4b',
    date: '2026-01-30',
    type: 'minor',
    changes: [
      // Phase 2: Core Components
      { type: 'added', component: 'LoadingIndicator', description: 'Contextual and global loading spinners' },
      { type: 'added', component: 'Avatar', description: 'User avatars with initials fallback and badges' },
      { type: 'added', component: 'Card', description: 'Content container with header, body, and footer' },
      { type: 'added', component: 'Typography', description: 'V2 typography system with 20+ variants' },
      { type: 'added', component: 'Divider', description: 'Horizontal and vertical line separators' },
      { type: 'added', component: 'Link', description: 'Styled anchor element for navigation' },
      // Phase 3: Interactive Components
      { type: 'added', component: 'Accordion', description: 'Collapsible content sections' },
      { type: 'added', component: 'Menu', description: 'Dropdown menu with items, groups, and dividers' },
      { type: 'added', component: 'Pagination', description: 'Page navigation with numbers, dots, and range' },
      { type: 'added', component: 'ProgressBar', description: 'Determinate and indeterminate progress indicator' },
      { type: 'added', component: 'Stepper', description: 'Multi-step process indicator' },
      // Phase 4: Advanced Components
      { type: 'added', component: 'DatePicker', description: 'Date selection input with calendar dropdown' },
      { type: 'added', component: 'IconGallery', description: 'Searchable gallery of available icons' },
      // Token Enhancements
      { type: 'modified', component: 'Tokens', description: 'Added complete color scales and V2 typography tokens' },
    ],
  },
  {
    version: '26.1.4a',
    date: '2026-01-30',
    type: 'minor',
    changes: [
      { type: 'added', component: 'Popover', description: 'New interactive overlay component' },
      { type: 'added', component: 'Tooltip', description: 'Lightweight tooltip component' },
      { type: 'added', component: 'Table', description: 'Data table with sorting and selection' },
    ],
  },
  {
    version: '26.1.3c',
    date: '2026-01-28',
    type: 'figma-sync',
    changes: [
      { type: 'synced', component: 'Button', description: 'Updated hover states from Figma' },
      { type: 'synced', component: 'Chip', description: 'Synced color tokens from Figma' },
    ],
  },
  {
    version: '26.1.3b',
    date: '2026-01-25',
    type: 'minor',
    changes: [
      { type: 'added', component: 'Select', description: 'Dropdown select component with search' },
      { type: 'modified', component: 'TextInput', description: 'Added password visibility toggle' },
      { type: 'modified', component: 'Modal', description: 'Improved animation transitions' },
    ],
  },
  {
    version: '26.1.3a',
    date: '2026-01-20',
    type: 'minor',
    changes: [
      { type: 'added', component: 'Modal', description: 'Dialog modal component' },
      { type: 'added', component: 'Tabs', description: 'Tab navigation component' },
      { type: 'added', component: 'Alert', description: 'Status alert banners' },
    ],
  },
  {
    version: '26.1.2b',
    date: '2026-01-15',
    type: 'patch',
    changes: [
      { type: 'modified', component: 'Button', description: 'Fixed disabled state opacity' },
      { type: 'modified', component: 'Checkbox', description: 'Improved focus ring styling' },
    ],
  },
  {
    version: '26.1.2a',
    date: '2026-01-10',
    type: 'major',
    changes: [
      { type: 'added', component: 'Button', description: 'Initial button component with 3 variants' },
      { type: 'added', component: 'Checkbox', description: 'Checkbox with indeterminate state' },
      { type: 'added', component: 'Radio', description: 'Radio button group component' },
      { type: 'added', component: 'Toggle', description: 'Toggle switch component' },
      { type: 'added', component: 'TextInput', description: 'Text input with labels and validation' },
      { type: 'added', component: 'SearchInput', description: 'Search input with clear button' },
      { type: 'added', component: 'Chip', description: 'Chip component for tags and filters' },
    ],
  },
];

/**
 * Get the current version (latest entry)
 */
export const getCurrentVersion = (): string => {
  return PLATFORM_VERSION;
};

/**
 * Get recent version entries
 */
export const getRecentVersions = (count: number = 5): VersionEntry[] => {
  return versionHistory.slice(0, count);
};

/**
 * Get change type icon
 */
export const getChangeTypeIcon = (type: ChangeType): string => {
  switch (type) {
    case 'added':
      return '+';
    case 'modified':
      return '~';
    case 'removed':
      return '-';
    case 'synced':
      return '↻';
    default:
      return '•';
  }
};

/**
 * Get change type color
 */
export const getChangeTypeColor = (type: ChangeType): string => {
  switch (type) {
    case 'added':
      return 'var(--rd-sys-color-content-success, #06BF7F)';
    case 'modified':
      return 'var(--rd-sys-color-content-brand, #2770EF)';
    case 'removed':
      return 'var(--rd-sys-color-content-failure, #E22B3D)';
    case 'synced':
      return 'var(--rd-ref-color-purple-60, #8C62F5)';
    default:
      return 'var(--rd-sys-color-content-secondary, #777E8B)';
  }
};

/**
 * Get version type label
 */
export const getVersionTypeLabel = (type: VersionType): string => {
  switch (type) {
    case 'major':
      return 'Major Release';
    case 'minor':
      return 'Minor Release';
    case 'patch':
      return 'Patch';
    case 'figma-sync':
      return 'Figma Sync';
    default:
      return 'Update';
  }
};
