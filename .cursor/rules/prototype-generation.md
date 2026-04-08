---
description: Core workflow for AI-assisted prototype generation from screenshots or descriptions
globs: ["src/prototypes/**/index.tsx"]
---

# Prototype Generation Rules

You are helping designers create interactive prototypes using the **Radiant Design System**. When a designer provides a screenshot, description, or Figma reference, generate production-quality React code using the available components.

> **See `_orchestration.md`** for the full priority order of guideline files.

---

## Generation Workflow

### Step 0: Pre-Flight Checklist (MANDATORY before writing any code)

Before generating a single line of code, complete this checklist:

**A. Inventory Radiant components**

Open `component-inventory.md` and identify which Radiant components map to every UI element in the design. List them explicitly. For each UI element, answer: does a Radiant component cover this? If yes, it MUST be used.

**B. Confirm zero raw HTML for covered patterns** — Check `component-inventory.md` and `compliance-checklist.md`. Every UI element must use a Radiant component if one exists.

**C. Confirm all colors/fonts from tokens** — See `compliance-checklist.md`. No hardcoded hex, rgb, or font strings.

**D. Confirm layout scaffolding**

- Does the design require a full-page layout with header + sidebar? → Use `AppShell` (not a custom `<div>` layout)
- Does the content need to fill the viewport? → Wrap in `AppShell` and pass content as children
- Is responsive behavior required? → Apply responsive grid patterns from `layout-patterns.md`

Only proceed to step 1 after confirming all four checklist items.

---

### 1. Determine the input type

| Input | Action |
|-------|--------|
| Figma URL (`figma.com/design/...`) | Follow **`figma-mcp-workflow.md`** for the MCP tool-call sequence, then adapt output |
| Figma screenshot (pasted image) | See **Screenshot Input** below, then consult **`figma-component-mapping.md`** |
| Text description | Identify UI patterns below, then pick components from **`component-inventory.md`** |
| Existing prototype to modify | Read the current file, apply changes using the same patterns |

#### Screenshot Input

When the designer pastes a screenshot (no Figma URL), apply these rules:

**Fidelity expectations are lower than MCP.** You are interpreting visual appearance, not structured data. Approximations are acceptable — document them.

1. **Identify layout pattern** — Match the screenshot to a layout template from `layout-patterns.md` (dashboard, admin, form, table, wizard)
2. **Map components visually** — For each UI element, find the closest Radiant component from `component-inventory.md`. Prefer semantic matches over pixel-perfect recreation.
3. **Approximate colors** — Use `figma-component-mapping.md` hex → token tables. When a color doesn't match exactly, choose the semantically closest token (e.g. "this looks like secondary text" → `systemColors.light['content-secondary']`).
4. **Approximate spacing** — Round to the nearest spacing scale value (`spacing.A` through `spacing.H`). Don't try to match 13px or 17px exactly.
5. **Flag unknowns** — If a UI element doesn't map to any Radiant component, add a TODO comment: `{/* TODO: No Radiant component for [description] — using placeholder */}`

**Do NOT:**
- Ask more than 2 clarifying questions — make reasonable assumptions and proceed
- Attempt pixel-perfect reproduction from a screenshot
- Hardcode hex values extracted from the image — always map to tokens

### 2. Pick a layout template

Choose a starting point from **`layout-patterns.md`**:

| Need | Layout Template |
|------|----------------|
| Admin panel with sidebar | Full Page Layout |
| Dashboard with metrics and charts | Dashboard Layout |
| Settings page with form sections | Form Page Layout |
| Multi-step wizard in a modal | Modal/Wizard Layout |
| Table with search, filters, pagination | Data Table Page Layout |

### 3. Select components

Use the **Component Selection Decision Tree** in **`component-inventory.md`** to find the right component for each UI element. Always prefer existing components over custom HTML.

### 3b. Component reuse vs creation

**ALWAYS prefer existing Radiant components.** Check `component-inventory.md` first.

| Situation | Action |
|-----------|--------|
| Existing component matches | Import from `../../components` |
| Close match needs minor tweaks | Use the existing component with props/styling overrides |
| No suitable component exists | Create a LOCAL component in the prototype's own `components/` subfolder |

When creating a local component:
- Place it in `src/prototypes/MyPrototype/components/ComponentName.tsx`
- Follow the rules in `design-system.md` (forwardRef, TypeScript, CSS tokens)
- Do NOT add it to `src/components/` — that directory is for shared design system components only
- Import it with a relative path: `import { MyWidget } from './components/MyWidget'`

### 4. Apply interaction patterns

Consult **`widget-patterns.md`** for correct behavior:

| Building this? | Consult this section |
|----------------|---------------------|
| Alerts or notifications | Alert Taxonomy Decision Tree — banner vs toast vs section alert |
| Action menus (three-dot) | Three Dot Menu — category ordering (Create > View > Edit > Manage > Share > Export > Delete) |
| Delete confirmations | Delete Object Pattern — confirmation message, cascading warnings |
| Empty states | Muted Alerts / Empty States — big vs small, content templates |
| Tooltips or help text | Tooltips (1s delay) and Explainer Cards (340px, click-activated) |
| Object tables | Object Table — row specs, batch actions, sort/filter, column widths |
| Date/time pickers | Date Picker, Rolling Date Picker, Frequency Picker patterns |
| Filter selection dialogs | Multi-Object List Picker — search, select all, bulk add, show selected |

### 5. Apply modal rules

When building modals or dialogs, consult **`modal-patterns.md`** for:
- Size selection (M1: 394px, M2: 788px, M3: 1182px, M4: Full screen)
- Type selection (simple, wizard, subnavigation, splashscreen)
- Footer button placement (Tertiary left, Secondary + Primary right)
- Wizard progress bar (2-4 steps, 4px height)

### 6. Style with tokens

Use design tokens from **`token-usage.md`** — never hard-code colors, spacing, or typography.

### 7. Write UI text

Follow **`content-guidelines.md`** for all user-facing text:
- Buttons: 1-2 words, imperative verbs (Save, Delete, Export)
- Titles: 4 words max, sentence case
- Labels: 3 words max, no articles
- Errors: remedy-focused
- ThoughtSpot terms: capitalize product features (see **`product-knowledge.md`**)

### 8. Organize files

Follow **`prototype-structure.md`** for file organization:
- Simple (1 view): single `.tsx` file
- Medium (2-3 views): folder with `index.tsx`
- Complex (4+ views): full folder with `components/` and `data/`

---

## Step 9: Visual Verification Loop (MANDATORY for Figma-based prototypes)

After generating the prototype code, you MUST:

1. **Build and run** — Verify the prototype compiles (`npm run build`) and loads in the browser
2. **Screenshot and compare** — Open the prototype in the browser, take a mental inventory of every section, and compare against the Figma screenshot region by region:
   - Header / navigation bar
   - Each panel or sidebar
   - Main content area (chart, table, form, etc.)
   - Action buttons and their states
   - Icons — verify each icon matches the Figma (don't use the same icon for different elements)
   - Colors — verify backgrounds, text colors, borders match the token mapping
   - Spacing — verify gaps, padding, margins look proportionally correct
3. **Iterate** — Fix any mismatches before declaring done. Expect 2-3 iterations for complex prototypes.

### Common Mistakes to Check For

| Mistake | How to Catch |
|---------|-------------|
| Using same icon for all items in a list | Compare each list item's icon against Figma individually |
| Wrong layout order (e.g., toolbar before panel) | Check left-to-right / top-to-bottom order matches Figma |
| `height: 100vh` clipping content inside a wrapper | Check if the prototype renders inside PlaygroundProject (which adds its own container) |
| Approximate colors instead of exact tokens | Cross-reference with `figma-component-mapping.md` color table |
| Missing sections (header, footer, sidebar) | Count the number of distinct sections in Figma vs your code |

---

## Step 10: Compliance Check (MANDATORY after every prototype or edit)

Run the full checklist in **`compliance-checklist.md`** on every file you created or modified. Do NOT declare done until all checks pass.

---

## Step 11. Figma Sub-Node Drill-Down (MANDATORY when design is too large)

When `get_design_context` returns "design was too large," you MUST:

1. Identify 4-6 key sub-sections from the metadata (header, main content, sidebar, panel, footer)
2. Call `get_design_context` on each sub-section's node ID separately
3. Extract exact values: icon names, colors, spacing, font sizes, border-radius
4. Do NOT approximate — if you can't get the exact value, call `get_screenshot` on the sub-node for visual reference

---

## Code Structure Template

Every prototype MUST follow this structure:

```tsx
import React, { useState } from 'react';
// 1. Import Radiant components (never use raw <button>, <input>, <table> — check component-inventory.md)
import { Button, TextInput } from '../../components/Button';
import { Table } from '../../components/Table';
// 2. Import tokens — NEVER hard-code colors, fonts, or spacing
import { systemColors, referenceColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontFamily } from '../../tokens/typography';
// 3. Import mock data if needed
// import { users } from '../../mocks';

/**
 * PrototypeName
 *
 * Brief description of what this prototype demonstrates.
 */
export const PrototypeName: React.FC = () => {
  // 4. State management
  const [isOpen, setIsOpen] = useState(false);

  // 5. Handlers
  const handleSubmit = () => {
    // Logic here
  };

  // 6. Render
  return (
    <div style={styles.container}>
      {/* Content */}
    </div>
  );
};

// 7. Styles object — ONLY use design tokens; never hard-code hex values or font strings
const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: systemColors.light['background-sunken'],
    padding: `${spacing.F}px`,
    minHeight: '100vh',
    fontFamily: fontFamily.primary,
  },
};

export default PrototypeName;
```

---

## Mock Data

Always import realistic mock data rather than using placeholders:

```tsx
import { users, analytics, navigation, forms } from '../../mocks';

const userList = users.profiles;      // Array of user objects
const chartData = analytics.revenue;  // Chart data
const menuItems = navigation.sidebar; // Navigation items
const countries = forms.countries;    // Dropdown options
```

---

## Common Styling Patterns

Use these token-based patterns for consistent styling:

```tsx
// Card container
container: {
  backgroundColor: systemColors.light['background-base'],
  border: `1px solid ${systemColors.light['border-subtle']}`,
  borderRadius: '8px',
  padding: `${spacing.F}px`,  // 24px
}

// Section with border
section: {
  borderBottom: `1px solid ${systemColors.light['border-subtle']}`,
  paddingBottom: `${spacing.F}px`,
  marginBottom: `${spacing.F}px`,
}

// Flex row with gap
row: {
  display: 'flex',
  alignItems: 'center',
  gap: `${spacing.C}px`,  // 12px
}

// Grid layout
grid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: `${spacing.D}px`,  // 16px
}
```

> For the full token reference including color scales, spacing values, and typography, see **`token-usage.md`**.

---

## Quick Pattern Recognition

When you see these patterns in a screenshot or description, use these component combinations:

| UI Pattern | Components to Use | Details in |
|------------|-------------------|------------|
| Filter/selection dialog | Modal + SearchInput + Checkbox + Toggle + Button | `widget-patterns.md` Multi-Object List Picker |
| Data table with actions | SearchInput + Table + Chip + Menu + Pagination | `widget-patterns.md` Object Table |
| Settings/form page | Sidebar + TextInput + Toggle + Radio + Button | `layout-patterns.md` Form Page Layout |
| Dashboard with metrics | Tabs + metric cards + Table | `layout-patterns.md` Dashboard Layout |
| Confirmation prompt | ConfirmDialog or Modal with warning text | `widget-patterns.md` Delete Object Pattern |
| Multi-step wizard | Modal (wizard type) + Stepper + form fields | `modal-patterns.md` Wizard Modal |
| Action menu | Menu with categorized items | `widget-patterns.md` Three Dot Menu |
| Empty/no-data state | Illustration + Typography + Button | `widget-patterns.md` Muted Alerts |

---

## Examples Reference

Study these existing prototypes for patterns:
- `src/prototypes/AdminGroups/` — Complex prototype with wizard modal and table
- `src/prototypes/Liveboard/` — Dashboard with charts and KPIs
- `src/prototypes/Cmdk/` — Command palette with search
