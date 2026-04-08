# Changelog

All notable changes to Radiant Play are documented here.

**Versioning:** `YY.M.Ws` — Year.Month.Week + sub-release letter (a, b, c...).
Example: `26.4.1b` = 2026, April, week 1, second release that week.

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
