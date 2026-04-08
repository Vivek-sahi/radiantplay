# Radiant Play

Prototyping playground built on ThoughtSpot's Radiant design system — build interactive prototypes with realistic data and interactions.

[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://vercel.com)

---

## What is This?

**Radiant Play** is a fork-ready repository for ThoughtSpot designers to build interactive prototypes that look and feel like the real product. It ships with 75 Radiant UI components, design tokens, mock data, and AI rules — so you can describe a UI and get working code in seconds.

**Live site:** [radiantplay.vercel.app](https://radiantplay.vercel.app) *(ThoughtSpot internal)*

**How it works:**
1. Fork this repository
2. Open in Cursor IDE — AI rules load automatically
3. Describe your UI or paste a Figma screenshot
4. AI generates code using Radiant components
5. Preview your interactive prototype in the browser

---

## Quick Start

### New to this project? Read the full setup guide first:
- [GETTING_STARTED.md](GETTING_STARTED.md) — **start here** if you're new to Git and code (visual explainers with diagrams)
- [FORK-WORKFLOW.md](FORK-WORKFLOW.md) — fork-based setup for designers (recommended)
- [SETUP-GUIDE.md](SETUP-GUIDE.md) — detailed step-by-step guide

### Minimal setup

```bash
# Fork this repo on GitHub or Galaxy, then clone your fork:
git clone https://github.com/YOUR-USERNAME/radiantplay.git
cd radiantplay
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Create a prototype

```bash
npm run new-prototype MyPrototype
```

Then open `src/prototypes/MyPrototype/index.tsx` in Cursor and describe your UI in the Chat panel.

---

## Available Components

75 production-quality Radiant components, ready to use.

| Category | Components |
|----------|------------|
| **Buttons & Actions** | Button (primary, secondary, tertiary, icon), Link, ActionMenu |
| **Forms** | TextInput, TextArea, SearchInput, Select, Checkbox, Radio, Toggle, DatePicker, SegmentedControl, FormBuilder, DynamicForm, RichTextEditor |
| **Data Display** | Table, Chip, Card, Accordion, ProgressBar, LoadingIndicator, Typography, List, Tree, TreeTable |
| **Feedback** | Alert, Toast, Tooltip, Popover |
| **Navigation** | Tabs, Sidebar, Pagination, Stepper, Link, Menu |
| **Overlays** | Modal, WizardModal, ConfirmDialog, FilterDialog, FormModal |
| **Layout** | AppShell, AppSidebar, GlobalHeader, Horizontal, Vertical, View, Grid, SplitPane, Divider |
| **Media** | Avatar, IconGallery |
| **Utility** | DragDrop, Tour |
| **Icons** | `Icon` component with 53 built-in icons |

Import from the shared library:

```tsx
import { Button, Modal, TextInput, Toggle, Table } from '../../components';
import { Icon } from '../../components/icons';
```

---

## Prototypes

Interactive prototypes included as reference and inspiration:

| Prototype | Description |
|-----------|-------------|
| **Spotter Memory** | Memory Sources object table with search, filtering, and pagination |
| **Spotter Model** | SpotterModel agent edit flow with onboarding and recommendations |
| **Admin Groups** | Group creation wizard with bulk org assignment and role management |
| **Admin Language** | Admin settings for CSV-based translation with upload and validation |
| **MiniSpotters** | Domain-specific Spotter instances with bounded context and prompt libraries |
| **Liveboard Template** | Starter template for Liveboard prototypes with AnswerTile and SpotterViz |
| **Sales Dashboard** | Liveboard prototype with view/edit modes and SpotterViz panel |

Browse them at `http://localhost:5173/playground` or study the code in `src/prototypes/`.

---

## Project Structure

```
radiantplay/
├── src/
│   ├── components/        # 75 Radiant UI components
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Table/
│   │   ├── AppSidebar/
│   │   ├── GlobalHeader/
│   │   └── Icons/         # Icon component + 55 icons
│   ├── prototypes/        # Your prototypes go here
│   │   ├── AdminGroups/
│   │   ├── SpotterMemory/
│   │   ├── SpotterModel/
│   │   ├── AdminLang/
│   │   ├── MiniSpotters/
│   │   ├── _liveboard-template/
│   │   ├── SalesDashboard/
│   │   └── _shared/          # Shared tiles and charts
│   ├── pages/             # App pages and routes
│   ├── data/              # Component registry & roadmap data
│   ├── tokens/            # Design tokens (colors, spacing, typography, etc.)
│   ├── mocks/             # Sample data for prototypes
│   ├── context/           # React context providers
│   └── styles/            # Global CSS
├── .cursor/
│   └── rules/             # AI rules — auto-loaded by Cursor
├── project.config.ts      # Fork-level project metadata
├── GETTING_STARTED.md     # Visual onboarding guide for beginners
├── FORK-WORKFLOW.md       # Fork-based setup for designers
└── SETUP-GUIDE.md         # Detailed setup instructions
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at localhost:5173 |
| `npm run build` | Build for production (skips type checking) |
| `npm run build:strict` | Build with full TypeScript type checking |
| `npm run typecheck` | Run TypeScript checks without building |
| `npm run preview` | Preview the production build locally |
| `npm run new-prototype Name` | Scaffold a new prototype folder |

---

## Repositories

This project is hosted on two remotes:

| Remote | URL | Purpose |
|--------|-----|---------|
| `origin` | `github.com/faris-ts/radiantplay` | Primary — Vercel deploys from here |
| `galaxy` | `galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay` | Internal ThoughtSpot access |

To push to both after making changes:

```bash
git push origin main
git push galaxy main
```

---

## For Designers

### Recommended workflow

1. **Fork** the repo (Galaxy or GitHub) — see [FORK-WORKFLOW.md](FORK-WORKFLOW.md)
2. **Clone** your fork and run `npm install && npm run dev`
3. **Open** the `radiantplay` folder in Cursor — AI rules load automatically
4. **Create** a prototype: `npm run new-prototype MyPrototype`
5. **Describe** your UI to Cursor AI in the Chat panel or with Cmd+K
6. **Browse** existing prototypes at `/playground` for reference
7. **Explore** the design system at `/radiant` (components, tokens, icons, roadmap)

### Tips for better AI output

| Tip | Example prompt |
|-----|---------------|
| Name specific components | "Use a `Modal` with a `SearchInput` and `Checkbox` list" |
| Describe layout | "Sidebar on the left, main content on the right with a header" |
| Describe interactions | "Clicking a row opens a slide-in detail panel" |
| Paste Figma screenshots | Drop an image in the chat and say "Recreate this using Radiant" |
| Reference existing prototypes | "Similar layout to the AdminGroups wizard" |

### Key pages in the app

| Route | What it shows |
|-------|--------------|
| `/` | Home — links to DS and Playground |
| `/how-it-works` | How it works — overview of the workflow |
| `/radiant` | Radiant DS — components, tokens, icons, architecture |
| `/radiant/roadmap` | Roadmap — what's in progress and planned |
| `/playground` | Playground gallery — all your prototypes |
| `/playground/:id` | Individual prototype in full-screen |

---

## Tech Stack

| Technology | Version | Role |
|-----------|---------|------|
| React | 19.2 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 7.2 | Build tool and dev server |
| React Router | 7 | Client-side routing |
| CSS Modules | — | Scoped component styling |
| Vercel Analytics | 1.6 | Visitor analytics (production only) |
| Vercel Speed Insights | 1.3 | Core Web Vitals tracking |

---

**Built for ThoughtSpot designers to prototype faster.** — Faris
