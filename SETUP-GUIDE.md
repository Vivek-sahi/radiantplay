# Radiant Play — Setup & Usage Guide

Build interactive prototypes with AI assistance using ThoughtSpot's Radiant design system.

---

## Prerequisites (one-time installs)

### 1. Install Node.js

- Go to [https://nodejs.org](https://nodejs.org)
- Download the **LTS** version (18 or higher)
- Run the installer, accept all defaults
- To verify, open any terminal and type:

```bash
node --version
```

You should see `v18.x.x` or higher.

### 2. Install Cursor IDE

- Go to [https://cursor.so](https://cursor.so)
- Download and install for your OS (Mac/Windows)
- Open it once to complete initial setup

---

## Getting Started (5 minutes)

### Step 1: Unzip the file

- Unzip `radiantplay.zip` to a location you'll remember (e.g., Desktop or Documents)
- You'll get a folder called `radiantplay/`

### Step 2: Open in Cursor

- Open Cursor IDE
- Go to **File > Open Folder**
- Select the `radiantplay` folder
- Cursor will load the project and automatically pick up the AI rules

### Step 3: Open the terminal

- In Cursor, open the built-in terminal: **Terminal > New Terminal** (or press `` Ctrl+` ``)

### Step 4: Install dependencies

```bash
npm install
```

- This downloads all required packages (~74MB). Takes 1–2 minutes.
- You only need to do this **once**.

### Step 5: Start the dev server

```bash
npm run dev
```

- You'll see a message like: `Local: http://localhost:5173`
- Open that URL in your browser (Chrome recommended)
- You should see the Radiant Play welcome page

> **Leave this terminal running** — it watches for changes and updates the browser automatically.

---

## Creating Your First Prototype

### Step 6: Create a new prototype

Open a **second terminal** in Cursor (click the `+` icon in the terminal panel) and run:

```bash
npm run new-prototype MyPrototypeName
```

This creates a starter file at `src/prototypes/MyPrototypeName/index.tsx`.

### Step 7: Ask Cursor AI to build your UI

- Open the new `index.tsx` file
- Press **Cmd+K** (Mac) or **Ctrl+K** (Windows) to open inline AI edit, or use the **Chat panel** on the right
- Describe what you want. Example prompts:

> "Create a user onboarding wizard with 3 steps: welcome screen, profile form with name and email, and notification preferences with toggles. Include a progress stepper at the top and Next/Back buttons."

> "Build a data dashboard with 4 KPI cards at the top, a tab bar switching between Chart and Table views, and a data table with user name, email, and status columns."

> "Recreate this UI using Radiant components" *(paste a Figma screenshot)*

The AI already knows all 74 Radiant components, design tokens, and patterns thanks to the built-in `.cursor/rules/`.

### Step 8: Preview in browser

After the AI generates code, your browser at `http://localhost:5173` updates automatically. Navigate to the Playground to see your prototype listed.

### Step 9: Iterate

Ask the AI to refine:

- "Make the sidebar narrower"
- "Add a search input above the table"
- "Change the primary button to secondary"

Each change appears instantly in the browser.

---

## Daily Workflow

Each time you come back to work:

1. Open the `radiantplay` folder in Cursor
2. Open terminal and run:

```bash
npm run dev
```

3. Open `http://localhost:5173` in your browser
4. Start building or editing prototypes with AI

---

## Tips for Better Results

| Tip | Example |
|-----|---------|
| **Name specific components** | "Use a `Modal` with a `SearchInput` and `Checkbox` list" |
| **Describe layout** | "Sidebar on the left, content area on the right" |
| **Describe interactions** | "Clicking the row opens a detail panel" |
| **Paste Figma screenshots** | Drop an image in the chat and say "Recreate this" |
| **Reference existing prototypes** | "Similar to the AdminGroups prototype" |
| **Use mock data** | "Use the mock user data for the table" |

---

## Available Components (74 total)

| Category | Components |
|----------|------------|
| **Layout Primitives** | Horizontal, Vertical, View, Grid, RdGrid, SplitPane |
| **Selection Controls** | Button, Checkbox, Radio, Toggle, SegmentedControl |
| **Inputs** | TextInput, TextArea, SearchInput, SearchBar, Select, DatePicker |
| **Form Extensions** | FormControl, NumericFilterInput, DirectionControl, ColorPicker, InputMentions, FilterModal |
| **Feedback** | Alert, Modal, Toast, Tooltip, Popover, LoadingIndicator, ProgressBar, OverlayLoading |
| **Overlays** | ConfirmDialog, WizardModal, FilterDialog, FormModal, ActionMenu |
| **Data Display** | Table, Chip, Card, Avatar, Tree, TreeTable, Legend, Formatters |
| **Display & Content** | NoData, ExplainerCard, Image, Illustration, SafeHTML |
| **Navigation** | Tabs, Sidebar, Pagination, Stepper, VerticalStepper, Link, Menu |
| **Interaction** | List, Slider, ManagedList, ManageTags, NestedCheckbox, Trending |
| **Advanced** | Tour, RichTextEditor, DragDrop, FormBuilder, DynamicForm, FacetSortBar |
| **Layout** | Accordion, Divider, Separator |
| **Widgets** | GlobalHeader, AppSidebar, AppShell |
| **Icons** | Icon component with 55 built-in icons, IconGallery |

All components are imported from `../../components`:

```tsx
import { Button, Modal, TextInput, Toggle } from '../../components';
```

---

## Using Mock Data

Import realistic sample data for your prototypes:

```tsx
import { users, analytics, navigation, forms } from '../../mocks';
```

| Data | What's included |
|------|----------------|
| `users.profiles` | Array of user objects with name, email, role |
| `users.groups` | User groups |
| `analytics.metrics` | KPI card data |
| `analytics.revenueByMonth` | Chart data |
| `navigation.sidebar` | Main nav items |
| `navigation.settingsSidebar` | Settings nav items |
| `forms.countries` | Country dropdown options |
| `forms.departments` | Department options |
| `forms.timeRanges` | Time period options |

---

## Example Prototypes

The kit includes several example prototypes you can study and reference:

| Prototype | Description | Location |
|-----------|-------------|----------|
| **AdminGroups** | Admin panel with table, wizard modal, sidebar | `src/prototypes/AdminGroups/` |
| **SpotterMemory** | Data table with toolbar and navigation | `src/prototypes/SpotterMemory/` |
| **SpotterModel** | SpotterModel agent edit flow with onboarding and columns editing | `src/prototypes/SpotterModel/` |
| **AdminLang** | Admin settings for CSV-based translation with upload and validation | `src/prototypes/AdminLang/` |
| **MiniSpotters** | Domain-specific Spotter instances with bounded context | `src/prototypes/MiniSpotters/` |
| **Liveboard Template** | Starter template for Liveboard prototypes with AnswerTile and SpotterViz | `src/prototypes/_liveboard-template/` |
| **Sales Dashboard** | Liveboard prototype with view/edit modes and SpotterViz panel | `src/prototypes/SalesDashboard/` |

---

## Project Structure

```
radiantplay/
├── src/
│   ├── components/        ← 74 Radiant UI components
│   ├── prototypes/        ← YOUR prototypes go here
│   │   ├── _template/     ← Starter template
│   │   ├── AdminGroups/   ← Example: admin panel
│   │   ├── AdminGroups/        ← Example: admin panel
│   │   ├── SpotterMemory/      ← Example: data table
│   │   └── SalesDashboard/     ← Example: liveboard
│   ├── mocks/             ← Sample data (users, analytics, etc.)
│   ├── tokens/            ← Design tokens (colors, spacing, etc.)
│   └── styles/            ← Global CSS
├── .cursor/
│   ├── rules/             ← AI rules (auto-loaded by Cursor)
│   └── commands/          ← Custom AI commands
├── docs/                  ← Detailed documentation
└── getting-started/       ← Beginner guides
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm install` fails | Make sure Node.js is installed: run `node --version` |
| `npm run dev` fails | Delete the `node_modules` folder, then run `npm install` again |
| Browser shows blank page | Check the terminal for errors — usually a typo in code |
| AI doesn't know components | Make sure you opened the `radiantplay` folder (not a parent folder) so Cursor loads the rules |
| Port 5173 already in use | Close other dev servers, or the terminal will show an alternate port |
| Changes not showing in browser | Make sure `npm run dev` is still running in the terminal |

---

## Further Reading

- [Getting Started Guide](GETTING_STARTED.md) — Detailed designer's guide with step-by-step instructions
- [Fork Workflow](FORK-WORKFLOW.md) — How to fork, branch, and submit changes
- [Component Registry](/radiant/registry) — Browse all 74 components with props and live previews
- [Changelog](/radiant/changelog) — Version history and what's new

---

**Built for ThoughtSpot designers to prototype faster.**
