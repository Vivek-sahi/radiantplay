import React from 'react';
import { sysVar } from '../tokens/colors';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  type: 'major' | 'minor' | 'patch';
  changes: {
    category: 'added' | 'changed' | 'fixed' | 'removed' | 'synced';
    label?: string; // overrides the default badge text (e.g. theme group names)
    items: string[];
  }[];
}

// Curated highlights — cherry-picked across releases. Newest first.
// Visibility rule: items from the last 60 days, OR the most recent 6 items
// if fewer than 6 fall inside that window.
interface Highlight {
  title: string;
  description: string;
  version: string; // links back to the corresponding CHANGELOG entry
  date: string; // ISO date for the time-based window
}

const HIGHLIGHTS: Highlight[] = [
  // v26.10, in the order the teaser film tells it.
  {
    title: 'Dark mode, everywhere',
    description: 'Every page, shared component and sample prototype works in light and dark: press Ctrl+D or use the theme icon. Every new prototype is dark ready, and /rp-migrate-prototype moves your own prototypes across when you are ready.',
    version: '26.10.1b',
    date: '2026-10-12',
  },
  {
    title: 'Describe it, get a working prototype',
    description: 'Type /rp-new-prototype and a name in Claude, and it scaffolds the prototype, registers it in registry-mine.ts and opens it in the playground, dark ready from the start.',
    version: '26.10.1b',
    date: '2026-10-12',
  },
  {
    title: 'Spotter DS in the design system',
    description: 'The Spotter design system sits in the design system left panel: chat surfaces, blocks, icons and tokens, with every component previewed.',
    version: '26.10.2e',
    date: '2026-10-12',
  },
  {
    title: 'Meet Radiance, ThoughtSpot\'s AI identity',
    description: 'The Radiance wash comes to the playground, the home page and the design system, and new Spotter, SpotterX, Liveboard and sign up prototypes get their official pattern automatically. Its guide, with patterns, rules and a template builder, is in the design system left panel.',
    version: '26.10.2e',
    date: '2026-10-12',
  },
  {
    title: 'Skills, built in: type /rp-',
    description: 'Every RadiantPlay command starts with rp-, so typing /rp- in Claude lists them all: new prototype, migrate, Radiant check, sync, project canvas and Coolify deploy.',
    version: '26.10.1b',
    date: '2026-10-12',
  },
  {
    title: 'Share any branch',
    description: '/rp-coolify-deploy puts your fork live on Coolify at its own URL, and every push redeploys it.',
    version: '26.9.1a',
    date: '2026-10-12',
  },
  {
    title: 'See your work at a glance',
    description: 'Run /rp-project-canvas for your next steps, sync state, your site, your branches and every prototype with its dark and Geist readiness.',
    version: '26.10.2a',
    date: '2026-10-12',
  },
  {
    title: 'Radiant matches Figma',
    description: 'Tokens come from Figma (400 of them), type is set in Geist, and components take their Radiant 3.0 Figma shape: Toggle, Toast, Stepper, Tabs, new variants and a Wizard header, with Figma sizes as an opt-in look.',
    version: '26.10.2e',
    date: '2026-10-12',
  },
  {
    title: 'Spotter Refresh blocks in the shared Spotter DS',
    description: "Devanshi's Reasoning timeline, UserMessage bubble, PromptBar composer and ToolIcon now live in src/spotter/chat/. ReasoningBlock and UserBubble stay as adapters, so existing prototypes pick up the new look without changes. Front door on /radiant/spotter.",
    version: '26.9.1a',
    date: '2026-09-03',
  },
  {
    title: 'Spotter prototype',
    description: 'AnalystLandingPage, AnalystListPage, and the right-pane state machine landed. Prompt bar rebuilt with a mode toggle, hideable data-model picker, and a new PromptSuggestionsPanel. 12 IA polish corrections across analyst selection, recency-sorted chats, panel restructure, and chat naming. The Liveboard template SpotterViz side panel was also rebuilt to match the Figma design.',
    version: '26.5.4a',
    date: '2026-05-26',
  },
  {
    title: 'Liveboard Styling panel restored',
    description: 'Per-tile density, color theme, corner style, spacing, and highlight overrides via a right-side drawer. Shared tile CSS variables added to AnswerTile, NoteTile, GroupTile. The two integration bugs from the original PR (missing AnswerTileProps.highlighted and EditToolbar onToggleStyling wiring) are fixed.',
    version: '26.5.4a',
    date: '2026-05-26',
  },
  {
    title: 'AdminUI 2.0 prototype',
    description: 'Application Settings screen added to the shared sample registry. Cluster settings, administration toggles, downloads and schedules, version control, AI settings.',
    version: '26.5.4a',
    date: '2026-05-26',
  },
  {
    title: 'Playground archive section + sidebar nav',
    description: 'Gallery has a light left sidebar with Prototypes and Archived sections. Per-card 3-dot menu archives or restores any prototype in your session. Save-to-code modal generates a Claude-ready prompt to commit the layout permanently. MiniSpotters and AdminLang now appear as archived by default.',
    version: '26.5.4a',
    date: '2026-05-26',
  },
  {
    title: 'Spotter design system gets its own doc surface',
    description: 'New /radiant/spotter showcase with Chat, Blocks, Icons, and Tokens sections, plus a dedicated SpotterShell doc page peer to GlobalHeader / AppShell. Fullscreen previews land too for both SpotterShell and AppShell.',
    version: '26.5.3c',
    date: '2026-05-19',
  },
  {
    title: '/sync-upstream — feature-branch safe',
    description: 'Preview-first, with a yes/no gate before anything destructive runs. Stash includes untracked files, so new prototypes you have not committed are no longer lost. Lands on main first, then merges forward into your branch.',
    version: '26.5.3b',
    date: '2026-05-18',
  },
  {
    title: 'Spotter prototype',
    description: 'In-thread agentic chat with reasoning trace, viz blocks (real ECharts), sources, follow-ups, and refine. Welcome → chat-active transition, sticky prompt with gradient focus border, M4 fullscreen expand on charts.',
    version: '26.5.3',
    date: '2026-05-08',
  },
  {
    title: 'Spotter design system (in progress)',
    description: 'New @spotter/* peer to @components/* — Spotter-domain blocks (chat, page, answer, viz, runtime) built on Radiant primitives. Auto-loading .cursor/rules so future sessions get the right context.',
    version: '26.5.3',
    date: '2026-05-08',
  },
  {
    title: 'Project status dashboard',
    description: 'A local HTML dashboard with overview, branches, forks/upstream, worktrees, and docs/plans tabs. Run /project-status; zero LLM token cost.',
    version: '26.4.4c',
    date: '2026-04-28',
  },
  {
    title: 'Token system — Figma 3.0 alignment',
    description: 'Phases 1–5 of 8 shipped: primitive colors, light semantic colors, typography, shadows, layout. Dark mode (Phase 6) is next.',
    version: '26.4.4c',
    date: '2026-04-28',
  },
  {
    title: 'Changelog highlights',
    description: 'Curated highlights at the top of this page surface major work across recent releases — like the section you are reading.',
    version: '26.4.4c',
    date: '2026-04-28',
  },
];

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '26.10.3d',
    date: '2026-10-13',
    title: 'Thumbnail setup works again',
    type: 'patch',
    changes: [
      { category: 'fixed', label: 'Tooling', items: [
        'Thumbnail setup failed on every machine. It now installs the screenshot tool cleanly, and the capture can wait longer for slow screens (--wait).',
      ] },
    ],
  },
  {
    version: '26.10.3c',
    date: '2026-10-13',
    title: 'Coolify only',
    type: 'patch',
    changes: [
      { category: 'changed', label: 'Documentation', items: ['RadiantPlay runs on Coolify only, and Vercel is switched off. The docs and the project canvas list Coolify sites only; forks still on Vercel keep working.'] },
    ],
  },
  {
    version: '26.10.3b',
    date: '2026-10-13',
    title: 'Thirteen Figma components and a tidier design system',
    type: 'patch',
    changes: [
      { category: 'added', label: 'Components', items: [
        'PageHeader, EditHeader, Breadcrumb, SplitButton, NumberInput, InlineEdit, FileUploader, DateRangePicker, Token, ChipIdentifier, UserChip, DotLoader and ScrollArea, built from Figma.',
        'GlobalHeader, AppSidebar and DatePicker use tokens wherever one has the same value. Nothing changes on screen.',
      ] },
      { category: 'changed', label: 'Design system', items: [
        'The theme icon sits at the top right, and longer pages list their sections on the right once you scroll.',
        'One heading style and the same left spacing on every page; section links are blue pills.',
        'The Radiance guide opens on its template builder, which hands you a prompt for Claude. The Colours page follows the theme.',
      ] },
    ],
  },
  {
    version: '26.10.3a',
    date: '2026-10-13',
    title: 'A faster project canvas',
    type: 'patch',
    changes: [
      { category: 'changed', label: 'Tooling', items: [
        '/rp-project-canvas opens in seconds. /rp-project-canvas full also refreshes forks and the prototype census in the background, in under 10 minutes, and replaces /rp-prototype-census.',
        'Skills Claude loads on its own (Radiance, prototype model, thumbnails) no longer crowd the / menu.',
      ] },
    ],
  },
  {
    version: '26.10.2e',
    date: '2026-10-12',
    title: 'Figma variants, WizardHeader and the Radiance guide',
    type: 'patch',
    changes: [
      { category: 'added', label: 'Components', items: [
        'Accordion variant="card", ExplainerCard appearance="raised" with media, dismiss and actions, NoData layout="horizontal" with statuses, and Tour tone="brand". Every default looks as before.',
        'WizardHeader: the Figma wizard as a page header with Exit and a segmented progress bar.',
      ] },
      { category: 'added', label: 'Documentation', items: ['The Radiance guide at /radiant/radiance: the product patterns live, a template builder, the rules, and how Radiance reaches prototypes.'] },
    ],
  },
  {
    version: '26.10.2d',
    date: '2026-10-12',
    title: 'Figma sizes, opt-in',
    type: 'patch',
    changes: [
      { category: 'added', label: 'Components', items: [
        'Add look: \'radiant-3\' to a prototype\'s registry entry for Figma\'s sizes: 32px fields, menus without borders, 48 and 32px tabs and more. New prototypes get it; existing ones keep their look until they opt in, and /rp-migrate-prototype offers it.',
        'TextInput gains readOnly, helperText and trailingIcon; Tabs gain size; Button gains size="xs".',
      ] },
    ],
  },
  {
    version: '26.10.2c',
    date: '2026-10-12',
    title: 'Toggle, Toast and Stepper match Figma',
    type: 'patch',
    changes: [
      { category: 'changed', label: 'Components', items: [
        'Toggle has a thin track with an overhanging thumb, in the same box.',
        'Toast is dark with a white action button; it is 8px taller.',
        'Stepper shows done steps in green and the current step outlined.',
        'Tabs turn blue on hover with no fill; small primary buttons have 16px corners.',
      ] },
    ],
  },
  {
    version: '26.10.2b',
    date: '2026-10-12',
    title: 'Figma colours, one theme icon, Radiance built in',
    type: 'patch',
    changes: [
      { category: 'changed', label: 'Components', items: ['Button, Checkbox, Radio, Tooltip, SegmentedControl, Alert, Modal and ProgressBar pick up Figma\'s colours and tokens. Nothing changes size.'] },
      { category: 'changed', label: 'Playground', items: ['The theme control at the top right of the playground is one icon: click to go light, dark, system. Ctrl+D works as before.'] },
      { category: 'added', label: 'Radiance', items: ['RadiantPlay ships Radiance, updated by the maintainer and brought to forks by /rp-sync-upstream. New Spotter, SpotterX, Liveboard and sign up prototypes get their pattern automatically; npm run radiance:lint checks a prototype.'] },
    ],
  },
  {
    version: '26.10.2a',
    date: '2026-10-12',
    title: 'Radiance on the playground, and your project canvas',
    type: 'patch',
    changes: [
      { category: 'added', label: 'Radiance', items: ['The Radiance wash sits behind the playground and the home page, and the design system page opens on a light hero card with it.'] },
      { category: 'added', label: 'Tooling', items: ['/rp-project-canvas on a designer fork shows your own work: next steps, prototypes, updates, branches and your site.'] },
    ],
  },
  {
    version: '26.10.1b',
    date: '2026-10-12',
    title: 'One prefix for every command',
    type: 'patch',
    changes: [
      {
        category: 'changed',
        label: 'Tooling',
        items: [
          'Every RadiantPlay command now starts with rp-, so typing /rp- lists them all: /rp-new-prototype, /rp-radiant-check, /rp-migrate-prototype, /rp-sync-upstream, /rp-coolify-deploy and more. The old names still work.',
          'Thumbnails happen as part of other work: /rp-radiant-check captures one after a check, /rp-sync-upstream captures missing ones, /rp-migrate-prototype keeps capturing them. Or ask Claude to update a thumbnail. /thumbnail is gone.',
          'Ask Claude to switch a prototype\'s AI model; /switch-model still works too. Claude Code\'s own /model is unrelated.',
          'Your prototypes stay light until you migrate them, so one /rp-sync-upstream is all it takes. /rp-migrate-prototype switches each one to light and dark when it is ready, and new prototypes start in both.',
        ],
      },
    ],
  },
  {
    version: '26.10.1a',
    date: '2026-10-09',
    title: 'Dark mode, Geist and Figma 3.0 tokens',
    type: 'major',
    changes: [
      {
        category: 'added',
        label: 'Dark mode',
        items: [
          'Press Ctrl+D anywhere to switch between light and dark. The choice is saved. Shared components, Spotter, the Liveboard tiles, charts and every sample prototype follow the theme.',
          'A prototype that is not dark ready yet can set theme: light-only in its registry entry and stays light while the rest of the app is dark.',
        ],
      },
      {
        category: 'synced',
        label: 'Tokens and type',
        items: [
          'Light and dark token values match the Radiant 3.0 Figma design system, with Figma and product names as aliases. Nothing is renamed.',
          'Type is Geist and Geist Mono, self-hosted, with the 550 emphasis weight for headings and labels.',
        ],
      },
      {
        category: 'added',
        label: 'Tooling',
        items: [
          '/migrate-prototype moves your prototypes onto Geist and dark mode in one pass, and never commits.',
          '/sync-upstream marks prototypes that are not dark ready as light-only after a merge. On the first sync of this release, run npm run migrate:light-only -- --write once.',
          '/thumbnail captures light and dark gallery screenshots. Sample prototypes have them already.',
          'npm run scan:dark reports dark readiness per prototype.',
        ],
      },
      {
        category: 'changed',
        label: 'Deployment',
        items: [
          'Coolify apps serve HTML with no-cache, so a new deploy shows up without a hard refresh. /coolify-deploy is written for Claude in Chrome and Coolify v4.4.3.',
          'GlobalHeader and AppSidebar follow the theme by default. Pass theme="dark" for the old always-dark nav.',
        ],
      },
    ],
  },
  {
    version: '26.9.1c',
    date: '2026-09-03',
    title: 'Guided Coolify setup for designers',
    type: 'patch',
    changes: [
      {
        category: 'added',
        label: 'Tooling',
        items: [
          '/coolify-deploy walks a designer through putting their fork on Coolify one verified step at a time (deploy key, app, build settings, Node pin, static site and nginx fallback, first deploy, auto-deploy webhook). /coolify-deploy check compares an existing app against the known-good recipe. Reads docs/coolify/ at run time and never types secrets.',
        ],
      },
      {
        category: 'changed',
        label: 'Deployment',
        items: [
          'Coolify docs now state that every app on one fork must share the same GitHub webhook secret, since Coolify verifies the signature per app and silently skips mismatches.',
        ],
      },
    ],
  },
  {
    version: '26.9.1b',
    date: '2026-09-03',
    title: 'Dependency security update',
    type: 'patch',
    changes: [
      {
        category: 'changed',
        label: 'Dependencies',
        items: [
          'npm audit fix clears all 19 Dependabot alerts with no major bumps: react-router-dom 7.13 to 7.18.3, vite 7.3.3 to 7.3.6, plus transitive patches for postcss, browserslist, @babel/core and esbuild. Lockfile stays on the public npm registry.',
        ],
      },
    ],
  },
  {
    version: '26.9.1a',
    date: '2026-09-03',
    title: 'Spotter Refresh blocks adopted + Coolify deployment consolidated',
    type: 'minor',
    changes: [
      {
        category: 'added',
        label: 'Spotter',
        items: [
          "Reasoning, UserMessage, PromptBar and ToolIcon (Devanshi Behera) moved from the SpotterComponents prototype into src/spotter/chat/. ReasoningBlock and UserBubble became adapters over them, so existing prototypes are unchanged; PromptBar ships alongside SpotterPrompt until the composer decision.",
          'Refresh blocks front door on /radiant/spotter with usage rules; Spotter roadmap updated.',
        ],
      },
      {
        category: 'added',
        label: 'Deployment',
        items: [
          'docs/coolify/ gathers the designer deploy guide, an operations sheet (apps, webhook, recipe, quirks) and an index. docker/nginx.conf carries the SPA fallback every Coolify app uses; a Dockerfile covers the no-git path.',
        ],
      },
      {
        category: 'changed',
        label: 'Repository',
        items: [
          'faris replaces the retired personal branch in CLAUDE.md and the pre-push hook; each branch lists its Coolify URL beside its Vercel one. push-faris.sh pushes a branch to origin and galaxy in one step.',
        ],
      },
    ],
  },
  {
    version: '26.7.1b',
    date: '2026-07-01',
    title: 'SegmentedControl — Radiant 3.0 visual alignment',
    type: 'patch',
    changes: [
      {
        category: 'changed',
        label: 'Components',
        items: [
          'SegmentedControl aligned to the Radiant 3.0 Figma: pill-shaped track and segments, brand-blue active label, Elevation/100 shadow, lighter font weight, unified disabled opacity. CSS-only; propagates everywhere SegmentedControl is used.',
        ],
      },
    ],
  },
  {
    version: '26.7.1a',
    date: '2026-07-01',
    title: 'Prototype census + chart color override + tooling cleanup',
    type: 'minor',
    changes: [
      {
        category: 'added',
        label: 'Tooling',
        items: [
          'Prototype census (/prototype-census) counts prototypes across every fork (folders + registry entries by section, per creator, archived included), with API-based fork auto-discovery. Surfaced in the local status dashboard, refreshed only on demand.',
        ],
      },
      {
        category: 'added',
        label: 'Tiles',
        items: [
          'Optional per-tile chart color override on AnswerTile and the chart renderer. AreaChart and ColumnChart use it, falling back to the default sequential palette. Additive and backward-compatible.',
        ],
      },
      {
        category: 'changed',
        label: 'Dependencies',
        items: [
          'Removed the Vercel Analytics dependency and its inject() wiring in main.tsx.',
          'Bumped echarts to 6.1.',
        ],
      },
      {
        category: 'fixed',
        label: 'Public release',
        items: [
          'public-strip.sh now omits .claude/settings.json and the post-compact hook, avoiding the liveboard-gate.sh hook error on public clones.',
        ],
      },
      {
        category: 'removed',
        label: 'Repository',
        items: [
          'Removed the personal Revefi talk deck from main; it now lives on the personal branch (dated).',
        ],
      },
    ],
  },
  {
    version: '26.5.4b',
    date: '2026-05-27',
    title: 'Repository housekeeping + public-release groundwork',
    type: 'patch',
    changes: [
      {
        category: 'changed',
        label: 'Repository structure',
        items: [
          'Archived stale root files (old HTML exports, a duplicate page, the superseded root backlog) to internal/archive/ with a manifest.',
          'Consolidated onboarding: SETUP-GUIDE.md and getting-started/ merged into GETTING_STARTED.md.',
          'Grouped maintainer-only scripts under internal/scripts/.',
          'Dropped a redundant build-time cp of cursor-to-claude-setup.html.',
          'Stopped tracking the 11 MB Notion export (kept on disk, gitignored).',
        ],
      },
      {
        category: 'added',
        label: 'Tooling',
        items: [
          'public-strip.sh produces a clean public snapshot (omits internal files, scrubs strings, grep-gates the result).',
          'housekeeping-check.sh runs the reorg pre-merge checks in one command.',
        ],
      },
    ],
  },
  {
    version: '26.5.4a',
    date: '2026-05-26',
    title: 'Spotter prototype + Liveboard Styling panel + AdminUI 2.0 + Playground archive',
    type: 'minor',
    changes: [
      {
        category: 'added',
        label: 'Prototypes',
        items: [
          'Liveboard - Styling panel (StylingPanel) — restored after the original PR #14 revert. Per-tile drawer with density, color theme, corner style, spacing, and highlight overrides. Shared tile CSS variables added to AnswerTile, NoteTile, GroupTile. Authored by Devanshi Behera.',
          'AdminUI 2.0 (NewUIAdmin2) — Application Settings screen added to the shared sample registry. Cluster settings, administration toggles, downloads and schedules, version control, AI settings. Lands via PR #19.',
        ],
      },
      {
        category: 'added',
        label: 'Spotter prototype + DS',
        items: [
          'AnalystLandingPage + AnalystListPage — right-pane state machine for the standalone Spotter prototype. Right pane now switches between chat, analyst landing, and analyst list states (matches the spotter-ia.md spec).',
          'PromptSuggestionsPanel — new suggestion panel surfaced from the prompt bar. Hideable, mode-aware.',
          'Prompt bar mode toggle + hideable data-model picker. Position stays fixed when the suggestion panel opens.',
        ],
      },
      {
        category: 'added',
        label: 'Playground',
        items: [
          'Archive section + left sidebar — gallery now has a light left sidebar with Prototypes (default) and Archived sections. Per-card 3-dot menu archives or restores any prototype in your session (sessionStorage-backed).',
          'Save-to-code modal — generates a Claude-ready prompt to commit the layout permanently.',
          "ProjectMeta.section field ('sample' | 'mine' | 'archived') on registry-core.ts. MiniSpotters and AdminLang now appear as archived by default.",
        ],
      },
      {
        category: 'changed',
        label: 'Liveboard template',
        items: [
          'SpotterViz side panel rebuilt to match the Figma side-panel overlay. position: fixed (not flex sibling), dark navy #1d232f, mascot + greeting + 3 suggestion chips + sticky prompt bar.',
          'KPI cards shortened (default height 1 row); the first two (Revenue, Customers) now show chart variants instead of bare numbers.',
        ],
      },
      {
        category: 'fixed',
        label: 'Styling panel integration bugs',
        items: [
          'AnswerTileProps was missing the highlighted prop. GroupTile was passing it through and tripping TS2322. Added to the props interface so the highlight-override path from the styling drawer works.',
          'EditToolbar was missing the onToggleStyling + stylingOpen props wiring. The Styling button rendered but did nothing. Added the props, wired the click handler, and applied the active-state styling.',
        ],
      },
      {
        category: 'fixed',
        label: 'Spotter IA polish + Logo nav + Tokens',
        items: [
          '12 IA polish corrections in the standalone Spotter prototype: analyst selection state, recency-sorted chats, panel restructure, chat naming, analyst reorder on chat start only, clear analyst highlights when "View all" opens, center analyst grid at 936px, move Spotter (Default) into its own panel section, drop the logo icon from the Default panel item and welcome page.',
          'ThoughtSpot brand mark click in GlobalHeader, LiveboardHeader (PrimaryNav), EditToolbar, and the DataModelEditor title now all navigate back to / (the playground gallery).',
          'background-base-inverse token reverted from #323946 back to #1D232F to match the production Liveboard edit-toolbar background (the Phase 2 token change had unintentionally muted it).',
          'LineChart legend overlap in the Liveboard template.',
        ],
      },
      {
        category: 'fixed',
        label: 'TypeScript + deps',
        items: [
          '43 TypeScript errors resolved across DS + NewUIAdmin2 + ChangelogPage (38 were in NewUIAdmin2, 4 pre-existing). 34 of the 38 were unused-var noise.',
          'package-lock.json rewritten — 31 ThoughtSpot internal artifactory URLs swapped to the public npm registry so Vercel can install dependencies.',
        ],
      },
      {
        category: 'changed',
        label: 'Content',
        items: [
          'Royal Enfield references scrubbed from prototypes and replaced with Acme Apparel.',
        ],
      },
    ],
  },
  {
    version: '26.5.3c',
    date: '2026-05-19',
    title: 'Spotter DS showcase + SpotterShell doc page',
    type: 'patch',
    changes: [
      {
        category: 'added',
        label: 'Spotter design system doc surfaces',
        items: [
          '/radiant/spotter — Spotter DS showcase with 4 sections (Chat, Blocks, Icons, Tokens). Every shipped Spotter component has a static preview; planned components (AnswerCard, Source/Model picker, Analyst components, ChatRowMenu, SettingsMenu, PersonalMemoryToggle) appear as ghosted placeholders.',
          '/radiant/components/spottershell — dedicated SpotterShell doc page peer to GlobalHeader / AppShell. SpotterLeftSide preview rolls rail + panel into one card (they are internal compositions of the same component, not separate things). SpotterShell preview uses real GlobalHeader theme="light", matching the AppShell composition pattern.',
          'Fullscreen previews — /preview/spottershell and /preview/appshell render the shells at 100vh × 100vw with no Radiant chrome. Linked from each doc page via "View fullscreen ↗".',
          'PreviewCard primitives — useTabs (Radiant Tabs for multi-variant cards, matches GlobalHeader doc-page pattern) and fullSizeHref (fullscreen link).',
        ],
      },
      {
        category: 'added',
        label: 'Spotter cursor rules + tracker',
        items: [
          'spotter-ia.md — standalone IA: page layout with exact 260/936/844 widths, full left-panel structure (Analysts + Chats + Settings), right-pane states (chat / analyst landing / analyst list), 6-item Settings menu with mixed modal / new-tab / toggle behaviours, hover menus on chats and analysts.',
          'spotter-agentic-chat-ia.md — shared embedded canvas+chat IA for Spotter Model / Viz / Code surfaces.',
          'spotter-scaffolding.md — how to create a new Spotter prototype, file layout, provider wiring, registry rules, pre-flight checklist.',
          'docs/spotter-roadmap.md — resume-here tracker with status per Spotter mode and per phase.',
        ],
      },
      {
        category: 'fixed',
        label: 'Icons, copy, and stats accuracy',
        items: [
          'VizBlock expand button now uses the diagonal expand glyph (matches Figma node 852:7344) instead of the horizontal fullscreen icon. Affects every viz answer rendered in Spotter responses.',
          'Home page hero reads PLATFORM_VERSION instead of the hardcoded 26.4.1b.',
          'Sidebar Icons badge reads getIconCount() (151) instead of the hardcoded 46.',
          'Design Tokens stat computes from generateCSSVariables + theme generators (373) instead of the hardcoded 290+.',
          'Component count now includes RdModal (76 total).',
          'Showcase pages render on the sunken layout bg (no own white background card-in-a-card) and match ComponentDocPage typography + spacing.',
        ],
      },
      {
        category: 'changed',
        label: 'Sidebar + tokens + conventions',
        items: [
          'Sidebar: "Spotter" → "Spotter DS"; new "SpotterShell" entry under Widgets; "New" badges removed from LiveboardHeader / GlobalHeader / AppSidebar / AppShell.',
          'spotterLayout tokens — chatMaxWidth 880 → 936; new textMaxWidth = 844.',
          'ReasoningBlock streaming behaviour documented as a three-state model (semi-collapsed during, expanded → collapsing on done, settled "Thought for X seconds" trigger).',
          'Spotter Requirements Gate in _orchestration.md upgraded to a mode-based Q&A flow with tiered rule loading.',
          '3 historical Spotter plans moved to docs/archive/.',
        ],
      },
    ],
  },
  {
    version: '26.5.3b',
    date: '2026-05-18',
    title: '/sync-upstream rewrite + infrastructure fixes',
    type: 'patch',
    changes: [
      {
        category: 'fixed',
        label: '/sync-upstream — feature-branch safe',
        items: [
          'No longer merges upstream/main directly into a feature branch. Always lands on main first, then merges main forward into your branch.',
          'Stash now uses --include-untracked, so new files you have created are no longer lost during sync.',
          'Preview is built in — phase one shows what is coming and asks before anything destructive runs. /check-upstream was removed.',
          'Pre-flight refuses to run on broken git state (mid-merge, mid-rebase, detached HEAD, leftover sync stash).',
        ],
      },
      {
        category: 'fixed',
        label: 'Deploy infrastructure',
        items: [
          'Middleware: staging branch is publicly accessible; other preview branches stay gated.',
          'Vercel: X-Frame-Options SAMEORIGIN so same-origin iframes inside prototypes load correctly.',
        ],
      },
      {
        category: 'changed',
        label: 'Maintainer branch model',
        items: [
          'CLAUDE.md split: personal and personal/* are origin-only; galaxy-bound branches are main, staging, and shared feat/fix/chore.',
          'Pre-push hook in scripts/hooks/pre-push refuses to push personal* to galaxy.',
        ],
      },
    ],
  },
  {
    version: '26.5.3',
    date: '2026-05-08',
    title: 'Spotter prototype + Spotter design system (in progress)',
    type: 'minor',
    changes: [
      {
        category: 'added',
        label: 'Spotter prototype — in-thread agentic chat',
        items: [
          'New sample prototype registered in registry-core.ts: agentic chat with welcome state and chat-active canvas',
          'Streaming reasoning trace with description per step, embedded ToolcallCard ("Show details ⌄"), gray dots, and "Worked for X seconds" footer',
          'Six block renderers — text, viz (real ECharts via the shared chart palette), sources, follow-ups (clickable chips), refine (clickable options), error',
          'M4 fullscreen expand modal — portaled to body, edge-to-edge, with chart title + view toggle + tokens + chart slot + "Showing X of X data points" footer',
          'Sticky prompt with purple → blue gradient border on focus, "Spotter responses should be reviewed. Learn more" disclaimer below',
          'Feedback row (Is this useful? 👍 👎) on every completed agent message',
        ],
      },
      {
        category: 'added',
        label: 'Spotter design system (in progress)',
        items: [
          '@spotter/* peer to @components/* — domain DS layered on Radiant',
          'Subdomains: chat (state + thread + bubble + reasoning + blocks), page (shell + collapsible 64↔260 left panel + welcome), answer (reserved for AnswerCard), viz, runtime (schema + service + system prompt)',
          'Spotter-local tokens (radial brand glow + chart-token bg aliases + chatMaxWidth)',
          'Five custom icon glyphs not in Radiant: PanelToggle, Bell, ThoughtSpotMark, ChartSearch, Orbits',
          'AsyncIterable streaming protocol (AnswerChunk) — same shape for canned mode and the live /api/chat path that lands later',
        ],
      },
      {
        category: 'added',
        label: 'Spotter context for future sessions',
        items: [
          'Three .cursor/rules files (spotter-components, spotter-logic, spotter-response-style) auto-attach on src/spotter/** and src/prototypes/Spotter*/**',
          'Spotter Requirements Gate in _orchestration.md classifies Spotter tasks and pre-loads the rules',
          'CLAUDE.md two-layer DS section pointing to the four Spotter docs',
          'Plans + behaviour guides under docs/: DS plan, prototype shell, AnswerCard spec, chat extraction, VizBlock behaviour',
        ],
      },
      {
        category: 'synced',
        label: 'Radiant 3.0 icon sync + light GlobalHeader',
        items: [
          'Icon registry expanded 53 → 148 unique icons (151 entries with 3 backward-compat aliases: settings → cog, search → magnifying-glass, refresh → sync)',
          'GlobalHeader gained a light theme variant — used as the Spotter prototype header',
        ],
      },
    ],
  },
  {
    version: '26.4.4c',
    date: '2026-04-28',
    title: 'Token system Figma alignment, Modal alignment, Project status dashboard',
    type: 'minor',
    changes: [
      {
        category: 'added',
        label: 'Token system — Figma 3.0 alignment (Phases 1–5 of 8)',
        items: [
          'Phase 1 — Primitive colors: darkGray scale (12 stops), alpha variants, hex fixes for purple and teal',
          'Phase 2 — Light semantic colors: 6 value fixes + 22 new accent tokens (background-accent, content-accent, border)',
          'Phase 3 — Typography: letter-spacing aligned to Figma absolutes, 6 v2TextStyles bumped medium → semibold, body weight light → regular',
          'Phase 4 — Elevation: shadowPrimitives with 3 semantic levels (surface, menu, modal) and light/dark variants; component CSS migrated to semantic vars',
          'Phase 5 — Layout: AppSidebar/AppShell default width 261px → 260px',
        ],
      },
      {
        category: 'changed',
        label: 'Modal alignment with Figma',
        items: [
          'Modal header padding restored to 20px 24px (variable height) so wizard variants grow correctly',
          'Modal footer fixed at 72px with corrected tertiary-left / primary-right CTA placement',
          'Wizard stepper rebuilt as discrete 4px segments with 6px gap and 2px radii; renders for splashscreen too',
          'Close icon removed from M1/M2/M3 simple modals — only M4 keeps the Close text link, per Figma',
          'New M2 eyebrow-only modal demo (no stepper)',
          'Splash screen: header no longer renders (title moved to body)',
          'Overlay z-index bumped to 1000 so M4 covers the sidebar',
          'RdModal absorbed into Modal — single modal component going forward',
        ],
      },
      {
        category: 'added',
        label: 'Project status dashboard (/project-status)',
        items: [
          'Local HTML dashboard with overview, branches, forks/upstream, and docs/plans tabs at zero LLM token cost',
          'Worktree view — each checkout shown with branch, modified count, divergence vs main, locked/prunable badges',
          'Branch divergence in three columns: vs main, vs staging, vs upstream/main, with last commit subject + relative age',
          'Role-aware tabs — maintainers see all designer forks; designer forks see upstream sync state',
          'Inline markdown viewer — click any .md row to open its rendered content in an in-page modal',
          'Local-only badges — gitignored files (BACKLOG.md, plans/, articles/) tagged with a blue local chip',
          'Forks sorted by last push descending (most recent first)',
        ],
      },
      {
        category: 'added',
        label: 'Changelog highlights',
        items: [
          'Curated Highlights section at the top of the Changelog page surfaces major work across recent releases',
          'Visibility rule: last 60 days OR last 6 items, whichever is longer',
          'release.sh now prompts the maintainer for highlights interactively during release',
        ],
      },
      {
        category: 'changed',
        label: 'AI orchestrator',
        items: [
          'New Step 0c — flags Figma MCP\'s ~4k tokens-per-message cost once per session when no Figma signal is detected',
          'Tier 1 signals expanded to include copy review and UX writing tasks (even with no code changes)',
          'UI text rule strengthened — load content-guidelines.md before writing or reviewing labels, buttons, titles, body copy, or error messages',
        ],
      },
      {
        category: 'fixed',
        label: 'Security',
        items: [
          'postcss bumped 8.5.6 → 8.5.10 in lockfile (GHSA-qx2v-qp2m-jg93 — XSS via unescaped </style> in CSS stringify output)',
        ],
      },
    ],
  },
  {
    version: '26.4.1c',
    date: '2026-04-08',
    title: 'Registry Split, Orchestrator v2, Liveboard System, Platform Tooling',
    type: 'major',
    changes: [
      {
        category: 'added',
        label: 'Fork architecture',
        items: [
          'Registry split — registry-core.ts (upstream) + registry-mine.ts (designer) + thin merger eliminates merge conflicts for all designer forks',
          'Skills and docs updated — sync-upstream, check-upstream, new-prototype, prototype-structure, FORK-WORKFLOW all reference new 3-file registry',
        ],
      },
      {
        category: 'added',
        label: 'AI orchestrator',
        items: [
          'Orchestrator tier system — intent-based classification (Tier 0–3) with 81% context reduction for median tasks',
          'Pre-implementation gate — 4 checks before code (component exists, CSS anti-patterns, icon name, forbidden words)',
          'Iteration loop detection — suggests batching after 3+ sequential changes',
          '6 Claude Code skills — auto-activating with globs (component-inventory, content-guidelines, token-usage, layout-patterns, widget-patterns, modal-patterns)',
          'UserPromptSubmit hooks — Liveboard intent detection + post-compact convention recovery',
          'CLAUDE.md trimmed 36% (210 → 135 lines) — guidelines moved to on-demand skills',
        ],
      },
      {
        category: 'added',
        label: 'Liveboard system',
        items: [
          'Liveboard canvas 3-tier split — core (242), edit (238), advanced (100) with prerequisite chains',
          'Liveboard requirements gate — 4-question pre-build gate (mode, interactions, tile types, data)',
          'Shared tiles system — _shared/tiles/ with AnswerTile, ChartRenderer, and 12 chart types',
          'SalesDashboard prototype — Liveboard with view/edit modes and SpotterViz panel',
        ],
      },
      {
        category: 'added',
        label: 'Platform tooling',
        items: [
          'Platform version system — platformVersion.ts as single source of truth; version badge on homepage, playground, and DS sidebar',
          'Component source badges — Figma / Scaligent / Custom on every component doc page',
          'Release tooling — scripts/release.sh, pre-push hook, install-maintainer-hooks.sh',
        ],
      },
      {
        category: 'changed',
        label: 'UI and performance',
        items: [
          'Homepage — space blue title, subtle card icons, shortened descriptions, footer easter egg',
          'ECharts lazy-loaded — 1.18 MB chunk deferred from startup to first chart render',
          'All DS pages centred with maxWidth 1200px in RadiantLayout',
          'Documentation refreshed — README, SETUP-GUIDE, Onepager, prototyping-guide',
        ],
      },
      {
        category: 'fixed',
        label: 'Bug fixes and security',
        items: [
          '0 TypeScript errors — icon name, TileMode import, NoteTileProps, unused variables resolved',
          'Avatar contrast — light background tokens swapped for saturated content tokens',
          'Vite 7.3.2 — high severity vulnerability patched',
          'Picomatch vulnerability patched, Figma Make package.json removed',
          'ConfirmDialog gradient override removed (non-Radiant)',
        ],
      },
      {
        category: 'removed',
        label: 'Cleanup',
        items: [
          'Cmdk prototype gitignored — 11 MB Figma Make export removed from designer forks',
          'Orphaned prototypes deleted — Homepage_example, ImpersonationV2, Liveboard, ModalPatterns',
          'liveboard-canvas.md (568 lines) — replaced by 3-tier canvas files',
        ],
      },
    ],
  },
  {
    version: '26.3.3a',
    date: '2026-03-17',
    title: 'Liveboard Template, New Prototypes, Project Rename',
    type: 'minor',
    changes: [
      {
        category: 'added',
        items: [
          'Liveboard template — starter with AnswerTile, KPI, bar chart, SpotterViz',
          'AdminLang prototype — admin CSV-based translation settings',
          'MiniSpotters prototype — domain-specific Spotter instances',
          'Liveboard scaffolding rules and IA guidelines (PR #4)',
          'Cursor → Claude Code setup guide',
          'Workflow skills: /start, /ship, /release, /status, /sync-upstream',
        ],
      },
      {
        category: 'changed',
        items: [
          'Project renamed: figmaradiant → radiantplay',
          'Playground gallery redesigned with component counts',
          'How it works → slide-based with tabs',
          'Homepage redesigned with getting started guide',
        ],
      },
      {
        category: 'removed',
        items: [
          'Liveboard, Admin Impersonation, MuseChat prototypes removed',
          '_examples folder archived',
        ],
      },
    ],
  },
  {
    version: '26.2.5a',
    date: '2026-03-05',
    title: 'UX Writing Rules, Gallery Redesign, Workflow Skills',
    type: 'minor',
    changes: [
      {
        category: 'added',
        items: [
          'UX writing guidelines integrated into Cursor agent (PR #1 by Yash Chauhan)',
          'How it works page converted to slide-based format',
          'Playground gallery redesign with latest prototype shortcut',
          'Cursor model guide for designers',
        ],
      },
      {
        category: 'changed',
        items: [
          'Project renamed: figmaradiant → radiantplay',
          'Stale docs archived, _examples removed',
        ],
      },
    ],
  },
  {
    version: '26.2.4a',
    date: '2026-03-02',
    title: 'Component Expansion — 35 New Components',
    type: 'minor',
    changes: [
      {
        category: 'added',
        items: [
          'Layout Primitives: Horizontal, Vertical, View — flex layout components that replace inline display:flex styles',
          'Grid / RdGrid / RdGridItem — CSS grid layout components with Scaligent-compatible API',
          'SplitPane — resizable two-panel layout using pointer-capture drag',
          'NoData — empty-state component with illustration, title, description, and action slots',
          'ExplainerCard — educational card with icon, title, description, and CTA (default + highlighted variants)',
          'Image — image component with loading/error fallback and aspect-ratio control',
          'Illustration — ThoughtSpot illustration wrapper (no-data, error, success, welcome, no-access, loading)',
          'Legend — color-keyed label list for chart legends, status keys, and data series',
          'SafeHTML — sanitized HTML renderer (strips scripts, event handlers, javascript: hrefs)',
          'OverlayLoading — absolute-positioned blocking loading overlay',
          'FormControl — label + helper text + error message wrapper for any form field',
          'SearchBar — full-featured search bar distinct from SearchInput; includes clear button and loading state',
          'ActionMenu — compound contextual menu with ActionMenu.Item and ActionMenu.Group sub-components',
          'VerticalStepper — vertical step progression with connector lines and expandable step content',
          'List — generic list with optional HTML5 drag-and-drop reordering',
          'Slider — styled range slider with fill gradient, labels, and optional tick marks',
          'ManagedList — list with add / remove / edit controls and optional search filtering',
          'Trending / Trending.Section — trending items display with count badges and trend direction indicators',
          'NestedCheckbox — checkbox tree with automatic indeterminate parent state',
          'ManageTags — tag creation (Enter or comma) and removal with optional suggestions dropdown',
          'NumericFilterInput — numeric range input with operator select (=, ≠, >, ≥, <, ≤, between)',
          'DirectionControl — LTR / Auto / RTL text-direction selector',
          'ColorPicker — color picker with hex (native), rgb, and palette swatch modes',
          'InputMentions — @mention autocomplete textarea with keyboard-navigable suggestions',
          'FilterModal — filter configuration modal with checkbox, radio, range, and search section types',
          'Tree — recursive hierarchical list with expand/collapse, selection, and optional checkboxes',
          'TreeTable — tree structure with columnar data in a CSS grid layout',
          'Formatters namespace — Formatters.Text, .Number (Intl.NumberFormat), .Line (SVG sparkline), .Interval, .Background, .Marker',
          'Tour — guided walkthrough with spotlight box-shadow overlay and getBoundingClientRect positioning',
          'RichTextEditor — contenteditable WYSIWYG editor with configurable toolbar',
          'DragDrop — DragDropProvider context + useDraggable, useDroppable, useDragAndDrop hooks (HTML5 DnD)',
          'FormBuilder — config-driven form renderer for 7 field types with inline validation',
          'DynamicForm — FormBuilder wrapper with managed state and hasDynamicFormError() utility export',
          'FacetSortBar — horizontal bar with facet pill toggles and sort selector',
        ],
      },
      {
        category: 'changed',
        items: [
          'Component count updated from 38 → 73 in registry and all UI displays',
          'component-inventory.md — 6 new decision-tree sections, 4 new combination patterns, layout-primitive rule',
          'figma-component-mapping.md — 27 new Figma layer → component mappings and 4 new pattern snippets',
          'layout-patterns.md — Layout Primitives section added at top; Card Grid pattern at bottom',
          'widget-patterns.md — ActionMenu, DragDrop, Tree, and Tour pattern sections appended',
          '_orchestration.md — component count updated, Rule #9 (use layout primitives) added',
          'Prototype template JSDoc updated to list all 73 available components',
        ],
      },
      {
        category: 'fixed',
        items: [
          'No new npm dependencies added — all 35 components use browser APIs and React only',
          'FormBuilder FormField type aliased as FormSchemaField at barrel-export level to avoid name clash with FormModal',
        ],
      },
    ],
  },
  {
    version: '26.2.2a',
    date: '2026-02-18',
    title: '3-Layer Color Token Migration',
    type: 'major',
    changes: [
      {
        category: 'added',
        items: [
          'Reference tokens layer (reference.ts) — 9 tonal scales with 12 stops each (00–100)',
          'System tokens layer (system.ts) — 42 semantic tokens (background, content, border) × light/dark modes',
          'Component tokens layer (component.ts) — 46 per-component tokens (button, chip, toggle) × light/dark modes',
          'CSS custom properties with rd-sys-color-* and rd-comp-color-* prefixes in tokens.css',
          'Built-in dark mode support via data-theme attribute and prefers-color-scheme media query',
          'System Tokens preview section on Color System page showing all 42 semantic tokens',
          'Updated Token Architecture page with accurate 3-layer documentation and code examples',
        ],
      },
      {
        category: 'changed',
        items: [
          'Migrated all 36 CSS module files from old --color-brand-* / --color-* variables to --rd-sys-color-* / --rd-comp-color-*',
          'Migrated all 48 TypeScript files from brandColors.* to systemColors / referenceColors',
          'Updated token count from 150+ to 290+ reflecting the expanded system',
          'Token Architecture page rewritten with Reference → System → Component flow',
          'Radiant Home page token section updated with new layer names and examples',
          'Color System page header updated to describe 3-layer architecture',
          'token-usage.md rule rewritten with new import paths and CSS variable names',
        ],
      },
      {
        category: 'removed',
        items: [
          'brand.ts — replaced by reference.ts',
          'alias.ts — functionality absorbed into system.ts',
          'mapped.ts — replaced by system.ts light/dark maps',
          'semantic.ts — replaced by system.ts and component.ts',
          'All legacy --color-brand-* and --color-* CSS custom properties',
        ],
      },
      {
        category: 'fixed',
        items: [
          'Dark mode override on macOS — added data-theme="light" to index.html to prevent prefers-color-scheme from overriding light theme',
          'Sidebar nav items now correctly show selected/active state on all pages',
        ],
      },
    ],
  },
  {
    version: '26.1.4a',
    date: '2026-01-30',
    title: 'Playground System, Modals, Navigation',
    type: 'minor',
    changes: [
      {
        category: 'added',
        items: [
          'ConfirmDialog component - confirmation dialog pattern based on DialogueAlert',
          'WizardModal component - multi-step wizard with progress bar',
          'FormModal component - form-optimized modal with validation',
          'FilterDialog component - filter selection with checkboxes',
          'Select component - dropdown selection with search',
          'Popover component - floating overlay with multiple placements',
          'LoadingIndicator component - spinner and loading overlay',
          'Component Status page - track all radiant-code components',
          'Changelog page - version history of project changes',
          'Example Prototypes section in navigation',
          'Settings Panel demo page',
          'Data Dashboard demo page',
        ],
      },
      {
        category: 'changed',
        items: [
          'Navigation structure updated with new sections',
          'Component count now derived dynamically from registry',
          'Sidebar reorganized with Modal Patterns and Overlay sections',
        ],
      },
      {
        category: 'fixed',
        items: [
          'React Router integration for URL-based navigation',
          'TypeScript build errors for unused variables',
        ],
      },
    ],
  },
  {
    version: '26.1.3a',
    date: '2026-01-21',
    title: 'Initial Release',
    type: 'major',
    changes: [
      {
        category: 'added',
        items: [
          'Design token system: Colors, Typography, Spacing, Radius, Shadows, Borders',
          'Button component - Primary, Secondary, Tertiary variants with icons',
          'Checkbox component - Checked, Unchecked, Indeterminate states',
          'Radio component - Radio button groups',
          'Toggle component - Switch with label positioning',
          'TextInput component - Text input with labels and validation',
          'SearchInput component - Search with icon',
          'Chip component - Attribute, Measure, Filter, Skeleton types',
          'Alert component - Info, Success, Warning, Failure, Muted statuses',
          'Modal component - Base modal dialog',
          'Tabs component - Tab navigation',
          'Sidebar component - Navigation sidebar',
          'Icon system with 46+ icons',
          'Interactive Playground with Inspect mode',
          'Token Architecture documentation',
          'Component documentation pages with live examples',
        ],
      },
    ],
  },
  {
    version: '26.1.2a',
    date: '2026-01-20',
    title: 'Project Setup',
    type: 'minor',
    changes: [
      {
        category: 'added',
        items: [
          'React + TypeScript + Vite project setup',
          'CSS Modules for component styling',
          'Design token infrastructure',
          'Project structure and conventions',
        ],
      },
    ],
  },
];

const categoryColors = {
  added: { bg: sysVar('background-accent-green'), text: sysVar('content-accent-green'), label: 'Added' },
  changed: { bg: sysVar('background-accent-yellow'), text: sysVar('content-accent-yellow'), label: 'Changed' },
  fixed: { bg: sysVar('background-accent-blue'), text: sysVar('content-accent-blue'), label: 'Fixed' },
  removed: { bg: sysVar('background-accent-red'), text: sysVar('content-accent-red'), label: 'Removed' },
  synced: { bg: sysVar('background-accent-blue'), text: sysVar('content-accent-blue'), label: 'Synced' },
};

const typeColors = {
  major: sysVar('content-failure'),
  minor: sysVar('content-brand'),
  patch: sysVar('content-tertiary'),
};

// Visible highlights: items from the last 60 days, OR the most recent 6 if
// fewer than 6 fall in that window.
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
const visibleHighlights = (() => {
  const now = Date.now();
  const recent = HIGHLIGHTS.filter((h) => now - new Date(h.date).getTime() <= SIXTY_DAYS_MS);
  return recent.length >= 6 ? recent : HIGHLIGHTS.slice(0, Math.max(6, recent.length));
})();

export const ChangelogPage: React.FC = () => {
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Changelog</h1>
        <p style={styles.description}>
          A detailed log of all changes, updates, and improvements to the Radiant Design System.
        </p>
      </div>

      {/* Curated highlights — cherry-picked across recent releases */}
      {visibleHighlights.length > 0 && (
        <div style={styles.hero}>
          <div style={styles.heroLabel}>Highlights</div>
          <ul style={styles.heroList}>
            {visibleHighlights.map((h, i) => (
              <li key={i} style={styles.heroItem}>
                <div style={styles.heroItemHead}>
                  <span style={styles.heroTitle}>{h.title}</span>
                  <span style={styles.heroVersion}>v{h.version}</span>
                </div>
                <p style={styles.heroDescription}>{h.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timeline */}
      <div style={styles.timeline}>
        {CHANGELOG.map((entry, index) => (
          <div key={entry.version} style={styles.entry}>
            {/* Version Header */}
            <div style={styles.entryHeader}>
              <div style={styles.versionInfo}>
                <span
                  style={{
                    ...styles.versionBadge,
                    backgroundColor: typeColors[entry.type],
                  }}
                >
                  v{entry.version}
                </span>
                <span style={styles.entryTitle}>{entry.title}</span>
              </div>
              <span style={styles.entryDate}>{entry.date}</span>
            </div>

            {/* Changes */}
            <div style={styles.changesContainer}>
              {entry.changes.map((change, changeIndex) => (
                <div key={changeIndex} style={styles.changeSection}>
                  <span
                    style={{
                      ...styles.categoryBadge,
                      backgroundColor: change.label
                        ? sysVar('background-subtle')
                        : categoryColors[change.category].bg,
                      color: change.label
                        ? sysVar('content-secondary')
                        : categoryColors[change.category].text,
                    }}
                  >
                    {change.label ?? categoryColors[change.category].label}
                  </span>
                  <ul style={styles.changesList}>
                    {change.items.map((item, itemIndex) => (
                      <li key={itemIndex} style={styles.changeItem}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Connector line (except for last item) */}
            {index < CHANGELOG.length - 1 && <div style={styles.connector} />}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
  },
  header: {
    marginBottom: '40px',
  },
  title: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '36px',
    fontWeight: 700,
    color: sysVar('content-primary'),
    marginBottom: '12px',
  },
  description: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '16px',
    fontWeight: 400,
    color: sysVar('content-secondary'),
    lineHeight: '26px',
    maxWidth: '700px',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  entry: {
    position: 'relative',
    backgroundColor: sysVar('background-base'),
    borderRadius: '12px',
    border: `1px solid ${sysVar('background-subtle')}`,
    padding: '24px',
  },
  entryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  versionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  versionBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontFamily: 'var(--font-family-mono)',
    fontSize: '13px',
    fontWeight: 550,
    color: sysVar('content-alternate'),
  },
  entryTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '18px',
    fontWeight: 550,
    color: sysVar('content-primary'),
  },
  entryDate: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '14px',
    color: sysVar('content-tertiary'),
  },
  changesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  changeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    padding: '4px 10px',
    borderRadius: '4px',
    fontFamily: 'var(--font-family-primary)',
    fontSize: '11px',
    fontWeight: 550,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  changesList: {
    margin: 0,
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  changeItem: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '14px',
    color: sysVar('content-primary'),
    lineHeight: '22px',
  },
  hero: {
    backgroundColor: sysVar('background-subtle'),
    border: `1px solid ${sysVar('background-subtle')}`,
    borderRadius: '12px',
    padding: '24px 28px',
    marginBottom: '40px',
  },
  heroLabel: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: sysVar('content-brand'),
    marginBottom: '16px',
  },
  heroList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  heroItem: {
    backgroundColor: sysVar('background-base'),
    border: `1px solid ${sysVar('background-subtle')}`,
    borderRadius: '8px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  heroItemHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  heroTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '15px',
    fontWeight: 550,
    color: sysVar('content-primary'),
    lineHeight: '20px',
  },
  heroVersion: {
    flexShrink: 0,
    padding: '2px 8px',
    borderRadius: '4px',
    fontFamily: 'var(--font-family-mono)',
    fontSize: '11px',
    fontWeight: 550,
    letterSpacing: '0.04em',
    backgroundColor: sysVar('background-subtle'),
    color: sysVar('content-secondary'),
  },
  heroDescription: {
    margin: 0,
    fontFamily: 'var(--font-family-primary)',
    fontSize: '13px',
    fontWeight: 400,
    color: sysVar('content-secondary'),
    lineHeight: '19px',
  },
  connector: {
    position: 'absolute',
    bottom: '-32px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '2px',
    height: '32px',
    backgroundColor: sysVar('background-subtle'),
  },
};

export default ChangelogPage;
