# Radiant Play

A tool-agnostic prototyping playground built on ThoughtSpot's Radiant design system. Describe what you want, and your AI tool of choice builds it with real components, real tokens, and real interactions.

[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://vercel.com)

**Live site:** [radiantplay.vercel.app](https://radiantplay.vercel.app) *(ThoughtSpot internal)*

---

## What is this?

Radiant Play is a fork-ready repository for ThoughtSpot designers, PMs, and anyone building product prototypes. It ships with 120+ Radiant UI components, design tokens, mock data, and an AI rule system — so you can describe a UI in plain language and get working, compliant code in seconds.

Works with any AI coding tool: **Claude Code**, **Cursor**, **Codex**, or any tool that reads project-level instructions.

---

## Getting started

### Option 1 — With Git (recommended)

```bash
# Fork on GitHub or Galaxy, then clone your fork
git clone https://github.com/YOUR-USERNAME/radiantplay.git
cd radiantplay
npm install
npm run dev
```

### Option 2 — Without Git

Download the ZIP from GitHub (`Code → Download ZIP`), extract it, then:

```bash
cd radiantplay-main
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Create your first prototype

```bash
npm run new-prototype MyPrototype
```

Open `src/prototypes/MyPrototype/index.tsx` in your AI tool and describe your UI. The AI reads the project rules automatically and builds with Radiant components.

---

## How the AI system works

This is the part that makes Radiant Play different from a blank React repo.

### The orchestrator

At the centre is `_orchestration.md` — a routing layer that classifies every request by intent before loading any rule files. It reads what you're trying to do and decides which instruction files the AI needs.

### Task classification (tiers)

Every request is classified into one of four tiers:

| Tier | Intent | Example | Rules loaded |
|------|--------|---------|-------------|
| **0 — Minor tweak** | Fix a value, swap a prop, adjust padding | "Change the button label to Save" | None — base instructions are enough |
| **1 — Moderate change** | Add a section, modal, table, or interaction | "Add a delete confirmation dialog" | 1–3 files matched by concern |
| **2 — Full build** | New prototype from scratch or from Figma | "Build a settings page with sidebar" | Mandatory files + concern-matched extras |
| **3 — Design system** | Create or modify a shared component | "Add a closable prop to the Chip component" | Fixed set of 4 design system files |

This means a minor colour fix loads ~85% less context than it would if everything loaded upfront. For a typical design day of small tweaks and moderate changes, that's roughly a **60–70% reduction in AI overhead**.

### Concern-matching

Tier 1 tasks are routed through a concern table — the AI loads only the files relevant to what the task involves:

| Concern | Rule file |
|---------|-----------|
| Page layout, grids, sidebars | `layout-patterns.md` |
| Tables, alerts, menus, toasts | `widget-patterns.md` |
| Modals, dialogs, wizards | `modal-patterns.md` |
| Loading, error, empty states | `interaction-patterns.md` |
| Colors, spacing, CSS variables | `token-usage.md` |
| UI copy, labels, buttons | `content-guidelines.md` |
| Figma URL or screenshot | `figma-mcp-workflow.md` + `figma-component-mapping.md` |
| Component props and examples | `component-inventory.md` |
| ThoughtSpot product context | `product-knowledge.md` |

### Pre-implementation gate

Before writing any code, the AI answers four mandatory questions:

1. Does a Radiant component already exist for this?
2. Does the target component's CSS have overrides that need handling?
3. Is the icon name and size valid? (`xs` `s` `m` `l` only)
4. Does the UI text use any forbidden words?

This catches the most common mistakes before a single line is written.

### Context clearing

After completing a full Tier 2 build, the system suggests clearing context (`/compact` in Claude Code) before continuing. A full build can accumulate a lot of history — the next task shouldn't inherit it.

---

## Rule files reference

```
.cursor/rules/                        # Auto-loaded by Cursor
├── _orchestration.md                 # Router — always loaded, classifies every task
├── component-summary.md              # Quick reference: all component names and icons
├── component-inventory.md            # Full component props, variants, code examples
├── compliance-checklist.md           # Pre-ship quality gate
├── layout-patterns.md                # Page templates, grids, AppShell
├── widget-patterns.md                # Tables, alerts, menus, empty states
├── modal-patterns.md                 # Overlay sizing, wizard patterns
├── interaction-patterns.md           # Loading, error, transition states
├── token-usage.md                    # Color scale, spacing, CSS variables
├── content-guidelines.md             # UX writing rules, forbidden words
├── figma-mcp-workflow.md             # Figma URL → code pipeline
├── figma-component-mapping.md        # Figma component → Radiant component map
├── prototype-generation.md           # Build workflow for Tier 2
├── prototype-structure.md            # Folder conventions
├── design-system.md                  # Shared component creation standards
├── product-knowledge.md              # ThoughtSpot domain context
└── liveboard-*/                      # Canvas-specific rules (gated by requirements)

.claude/                              # Claude Code native
├── skills/                           # Same rules as native Claude Code skills
├── hooks/                            # Automated convention enforcement
└── commands/                         # Slash commands (/compact, /explore, etc.)
```

The same rules work across tools — `.cursor/rules/` for Cursor, `.claude/skills/` for Claude Code. You don't need to configure anything.

---

## Available components

120+ production-quality Radiant components ready to use.

| Category | Components |
|----------|------------|
| **Buttons & Actions** | Button, Link, ActionMenu |
| **Forms** | TextInput, TextArea, SearchInput, Select, Checkbox, Radio, Toggle, DatePicker, SegmentedControl, FormBuilder, DynamicForm, RichTextEditor |
| **Data display** | Table, Chip, Card, Accordion, ProgressBar, LoadingIndicator, Typography, List, Tree, TreeTable |
| **Feedback** | Alert, Toast, Tooltip, Popover |
| **Navigation** | Tabs, Sidebar, Pagination, Stepper, Menu |
| **Overlays** | Modal, WizardModal, ConfirmDialog, FilterDialog, FormModal |
| **Layout** | AppShell, AppSidebar, GlobalHeader, Horizontal, Vertical, View, Grid, SplitPane, Divider |
| **Media** | Avatar, IconGallery |
| **Icons** | `Icon` component with 53 built-in icons |

```tsx
import { Button, Modal, TextInput, Table } from '../../components';
import { Icon } from '../../components/icons';
```

---

## Project structure

```
radiantplay/
├── src/
│   ├── components/        # Shared Radiant design system components
│   ├── prototypes/        # Your prototypes go here
│   │   ├── _shared/       # Shared tiles and charts for Liveboard prototypes
│   │   └── YourPrototype/ # Each prototype is self-contained
│   ├── tokens/            # Design tokens — colors, spacing, typography, radius
│   ├── mocks/             # Mock data for realistic prototype content
│   ├── pages/             # App pages and routes
│   ├── styles/            # Global CSS
│   ├── data/              # Component registry and roadmap data
│   └── context/           # React context providers
├── .cursor/rules/         # AI rule files — auto-loaded by Cursor
├── .claude/               # Claude Code skills, hooks, and commands
├── CLAUDE.md              # Project conventions — read by all AI tools
├── GETTING_STARTED.md     # Visual onboarding guide for beginners
├── FORK-WORKFLOW.md       # Fork-based setup for designers
└── SETUP-GUIDE.md         # Detailed step-by-step setup
```

---

## Built-in skills and commands

Radiant Play ships with slash commands you can run directly in Claude Code (or describe in any AI tool). These are in `.claude/commands/`.

| Command | What it does |
|---------|-------------|
| `/explore [scope]` | Suspends Radiant constraints for freeform exploration. Use when you want to try shadcn, Tailwind, custom CSS, or any direction outside the design system. The rest of the prototype stays Radiant-compliant. Example: `/explore shadcn form components` |
| `/radiant-check [prototype]` | Runs a compliance health check on a prototype. Shows what's using the design system correctly, what's been customised, what's hardcoded, and where easy improvements exist. Non-blocking — it's a status check, not a gate. |
| `/new-prototype [Name]` | Scaffolds a new prototype folder with the correct structure, registers it, and pulls the latest from main first. Same as `npm run new-prototype` but with AI guidance through the setup. |
| `/project-status` | Opens a local HTML dashboard showing branches, forks, plans, worktrees, and divergence vs main/staging/upstream. Pure shell — no AI tokens used. |
| `/sync-upstream` | Previews and merges the latest upstream changes into your fork. Shows what's coming first, then asks before applying. Works from any branch — stashes WIP, syncs main, forwards changes into your feature branch, restores WIP. |
| `/fork-status` | Reports on all downstream designer forks — which are up to date, which are behind, and what needs attention. |

**Two automated hooks also run in the background (Claude Code only):**

- **Convention recovery** — After every `/compact`, the five critical Radiant conventions are re-injected automatically so the AI never drifts after a context reset.
- **Liveboard requirements gate** — When it detects a new Liveboard build, it pauses and asks four targeted questions (mode, interactions, tile types, data) before loading any canvas rules. This prevents loading 600 lines of drag-and-resize spec for a view-only dashboard.

---

## Tips for better AI output

| Tip | Example |
|-----|---------|
| Name specific components | "Use a Modal with a SearchInput and Checkbox list" |
| Describe the layout | "Sidebar on the left, main content on the right with a header" |
| Describe interactions | "Clicking a row opens a slide-in detail panel" |
| Reference a Figma URL | Paste a figma.com URL and the AI maps it to Radiant components |
| Reference an existing prototype | "Similar layout to the AdminGroups wizard" |
| Batch visual tweaks | Send all changes in one message — cheaper than one at a time |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at localhost:5173 |
| `npm run build` | Production build |
| `npm run build:strict` | TypeScript check + production build |
| `npm run typecheck` | TypeScript only, no build |
| `npm run new-prototype Name` | Scaffold a new prototype folder |

---

## Key routes

| Route | What it shows |
|-------|--------------|
| `/` | Home |
| `/how-it-works` | AI workflow overview |
| `/radiant` | Design system — components, tokens, icons |
| `/playground` | All prototypes |
| `/playground/:id` | Individual prototype |

---

## Repositories

| Remote | URL | Purpose |
|--------|-----|---------|
| `origin` | `github.com/faris-ts/radiantplay` | Primary — Vercel deploys from here |
| `galaxy` | `galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay` | Internal ThoughtSpot access |

---

**Built for ThoughtSpot designers and PMs to prototype faster.** — Faris

For a live walkthrough of the components, prototypes, and design system: [radiantplay.vercel.app](https://radiantplay.vercel.app)
