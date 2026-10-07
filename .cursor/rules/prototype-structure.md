---
description: Folder structure, file organization, naming conventions, thumbnail creation, and registry registration for Radiant prototypes. Use when creating a new prototype folder, organizing files into simple/medium/complex structures, creating thumbnails, or registering a prototype in registry.ts.
alwaysApply: false
---

# Radiant Prototype Structure Guide

How to organize prototype files for maintainability and reusability.

---

## When to Use Each Structure

| Prototype Type | Structure | Example |
|----------------|-----------|---------|
| **Simple (1 view)** | Single file | `Homepage.tsx` |
| **Medium (2-3 views)** | Folder with index | `Dashboard/index.tsx` |
| **Complex (4+ views, reusable parts)** | Full folder structure | `AdminGroups/` |

---

## Simple Prototype (Single File)

For quick prototypes with a single view and no reusable parts.

```
src/prototypes/
└── MyPrototype.tsx
```

```tsx
// MyPrototype.tsx
import React, { useState } from 'react';
import { Button, Modal, TextInput } from '../components';
import { sysVar } from '../tokens/colors';
import { spacing } from '../tokens/spacing';

/**
 * MyPrototype
 * 
 * Brief description of what this prototype demonstrates.
 */
export const MyPrototype: React.FC = () => {
  const [value, setValue] = useState('');

  return (
    <div style={styles.container}>
      {/* Prototype content */}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: `${spacing.F}px`,
    backgroundColor: sysVar('background-sunken'),
    minHeight: '100vh',
  },
};

export default MyPrototype;
```

---

## Medium Prototype (Folder with Index)

For prototypes with multiple sections but no deeply reusable parts.

```
src/prototypes/
└── Dashboard/
    ├── index.tsx           # Main export
    ├── Dashboard.tsx       # Main component
    └── styles.ts           # Shared styles
```

### index.tsx
```tsx
/**
 * Dashboard Prototype
 * 
 * Description of the prototype.
 */
export { default } from './Dashboard';
export { Dashboard } from './Dashboard';
```

### Dashboard.tsx
```tsx
import React, { useState } from 'react';
import { Tabs, Table, Button } from '../../components';
import { styles } from './styles';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={styles.layout}>
      {/* Content */}
    </div>
  );
};

export default Dashboard;
```

### styles.ts
```tsx
import { CSSProperties } from 'react';
import { sysVar } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

export const styles: Record<string, CSSProperties> = {
  layout: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: sysVar('background-sunken'),
  },
  // More styles...
};
```

---

## Complex Prototype (Full Structure)

For prototypes with multiple pages, reusable components, and mock data.

```
src/prototypes/
└── AdminGroups/
    ├── index.tsx                 # Export entry point
    ├── AdminGroups.tsx           # Main component
    ├── styles.ts                 # Shared styles
    ├── components/
    │   ├── index.ts              # Component exports
    │   ├── AdminHeader.tsx       # Prototype-specific header
    │   ├── AdminSidebar.tsx      # Prototype-specific sidebar
    │   ├── GroupsTable.tsx       # Custom table
    │   ├── WizardModal.tsx       # Multi-step modal
    │   └── GroupDetailsStep.tsx  # Wizard step
    └── data/
        └── mockData.ts           # Mock data for prototype
```

### Local components vs shared components

The `components/` subfolder inside a prototype is for **prototype-specific** elements only — things that don't exist in the shared Radiant library.

| Need | Where to look | Where to create |
|------|--------------|----------------|
| Button, Modal, Table, TextInput, etc. | `../../components` (shared library) | Never recreate these |
| A custom wizard step, a prototype-specific sidebar, a specialized chart card | N/A — doesn't exist in shared library | `./components/` inside the prototype folder |

**Rules for local components:**
- Always check `component-inventory.md` first — if a shared component can do the job (even with prop/style tweaks), use it
- Only create a local component when no shared component is suitable
- Local components still follow `design-system.md` rules: forwardRef, TypeScript types, design tokens
- Import shared components normally: `import { Button } from '../../components'`
- Import local components with relative paths: `import { MyWidget } from './components/MyWidget'`
- Do NOT add local components to `src/components/` — that directory is for the shared design system

### index.tsx (Entry Point)
```tsx
/**
 * Admin Groups - Group Management Prototype
 * 
 * A prototype demonstrating:
 * - Multi-step wizard modal for group creation
 * - Bulk org selection with checkboxes
 * - Admin navigation sidebar
 * 
 * Built using Radiant design system components.
 */
export { default } from './AdminGroups';
export { AdminGroups } from './AdminGroups';
```

### components/index.ts
```tsx
/**
 * Components for AdminGroups prototype
 */
export { AdminHeader } from './AdminHeader';
export { AdminSidebar } from './AdminSidebar';
export { GroupsTable } from './GroupsTable';
export { WizardModal } from './WizardModal';
export { GroupDetailsStep } from './GroupDetailsStep';
```

### data/mockData.ts
```tsx
/**
 * Mock data for Admin Groups prototype
 */

export interface Organization {
  id: string;
  name: string;
  type: 'primary' | 'sub';
}

export const organizations: Organization[] = [
  { id: 'org-1', name: 'Engineering', type: 'sub' },
  { id: 'org-2', name: 'Marketing', type: 'sub' },
  // More data...
];

export const roles = [
  { id: 'role-1', name: 'Can view', description: 'View access only' },
  { id: 'role-2', name: 'Can edit', description: 'View and edit access' },
  // More data...
];
```

---

## Thumbnail Requirement

**Every prototype should have a light and a dark screenshot thumbnail** for the Playground Gallery. Without one, the gallery shows a scaled-down live preview of the prototype instead.

### Thumbnail Specifications

| Requirement | Value |
|-------------|-------|
| **Location** | `src/prototypes/{PrototypeName}/thumbnail.light.jpg` and `thumbnail.dark.jpg` |
| **Format** | JPEG screenshots, captured by the script |
| **Size** | Captured at 1280 x 720, saved at 640 x 360 |
| **Registry** | `thumbnail: { light, dark }` |

### Capturing a Thumbnail

1. Run `/thumbnail` (or `/thumbnail MyPrototype`). It captures both themes and wires the files into `registry-mine.ts`.
2. By hand: `npm run thumbnails -- MyPrototype`. Run `npm run thumbnails:setup` once per machine first.
3. Run `npm run thumbnails:check` to list thumbnails that are missing or older than their prototype.

Don't hand-draw SVG thumbnails. Screenshots stay accurate as the prototype changes and follow the theme. See `scripts/thumbnails/README.md` for the details.

---

## Registering Prototypes

All prototypes must be registered in `src/prototypes/registry-mine.ts` (designer-owned file).

> **Never** add entries to `registry-core.ts` (upstream-owned) or `registry.ts` (merger file).

```tsx
// In registry-mine.ts:
import React from 'react';
import { ProjectMeta } from './registry-core';
import MyPrototypeThumbLight from './MyPrototype/thumbnail.light.jpg';
import MyPrototypeThumbDark from './MyPrototype/thumbnail.dark.jpg';
const MyPrototype = React.lazy(() => import('./MyPrototype'));

// section: 'mine'   → "My prototypes" gallery (default for all new work)
// Omitting section defaults to 'mine'
export const myRegistry: ProjectMeta[] = [
  {
    id: 'MyPrototype',
    name: 'My Prototype',
    description: 'Description of what this prototype demonstrates.',
    author: 'Designer Name',
    thumbnail: { light: MyPrototypeThumbLight, dark: MyPrototypeThumbDark },
    component: MyPrototype,
    section: 'mine',
  },
];
```

---

## Naming Conventions

### Folders
- **PascalCase** for prototype folders: `AdminGroups`, `UserSettings`
- **lowercase** for utility folders: `components`, `data`

### Files
- **PascalCase** for components: `AdminHeader.tsx`, `GroupsTable.tsx`
- **camelCase** for utilities: `mockData.ts`, `helpers.ts`
- **index.ts/tsx** for exports

### Components
- **Named export** matching filename: `export const AdminHeader`
- **Default export** for main component: `export default AdminHeader`
- **displayName** set for all components

---

## Style Organization

### Option 1: Inline Styles Object (Recommended for Prototypes)

```tsx
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: `${spacing.F}px`,
  },
};

// Usage
<div style={styles.container}>
```

### Option 2: Separate styles.ts File

```tsx
// styles.ts
import { CSSProperties } from 'react';
import { sysVar } from '../../tokens/colors';

export const styles: Record<string, CSSProperties> = {
  layout: { ... },
  header: { ... },
};

// Usage in component
import { styles } from './styles';
```

### Option 3: Categorized Styles

```tsx
// styles.ts
export const layoutStyles = { ... };
export const headerStyles = { ... };
export const tableStyles = { ... };
```

---

## Mock Data Organization

### Single Data File
```
data/
└── mockData.ts    # All mock data in one file
```

### Categorized Data Files (for complex prototypes)
```
data/
├── index.ts       # Re-exports all data
├── users.ts       # User-related data
├── orgs.ts        # Organization data
└── navigation.ts  # Navigation items
```

### Mock Data Best Practices

1. **Type everything**: Define interfaces for all data
2. **Use realistic data**: Names, emails, dates that look real
3. **Include edge cases**: Empty states, long text, special characters
4. **Export helpers**: Format functions (dates, relative time, etc.)

```tsx
// mockData.ts

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Data
export const users: User[] = [
  { id: 'usr-1', name: 'Maya Chen', email: 'maya.chen@example.com' },
  { id: 'usr-2', name: 'James Wilson', email: 'james.wilson@example.com' },
];

// Helper functions
export function getRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} min ago`;
  // ... more logic
}
```

---

## Component Decision Tree

### Should this be a prototype-local component?

```
Is this pattern used 3+ times in THIS prototype?
├── Yes → Create in components/ folder
└── No → Keep inline in main component

Will this pattern be used in OTHER prototypes?
├── Yes → Consider adding to src/components/
└── No → Keep in prototype components/
```

### When to Promote to Global Components

> See `component-inventory.md` §Promotion Criteria for the full checklist with all 6 criteria.

---

## Import Path Reference

```tsx
// From a prototype component file:

// Radiant components
import { Button, Modal, TextInput } from '../../../components';

// Design tokens
import { sysVar } from '../../../tokens/colors';
import { spacing } from '../../../tokens/spacing';

// Prototype-local components
import { AdminHeader, GroupsTable } from './components';
// or
import { AdminHeader } from './components/AdminHeader';

// Mock data
import { users, organizations } from './data/mockData';

// Shared styles
import { styles, headerStyles } from '../styles';
```

---

## Prototype Checklist

Before submitting a prototype:

- [ ] Has `index.tsx` with proper exports and JSDoc
- [ ] Main component has descriptive JSDoc
- [ ] **Has light and dark screenshot thumbnails** (`/thumbnail` or `npm run thumbnails -- <Name>`)
- [ ] Registered in `registry-mine.ts` with `thumbnail: { light, dark }`
- [ ] Checked in dark mode (ThemeSwitch or Ctrl+D), and `npm run scan:dark -- src/prototypes/<Name>` is clean
- [ ] Uses Radiant components (not custom HTML where components exist)
- [ ] Uses design tokens (no hard-coded colors/spacing)
- [ ] Mock data is typed and realistic
- [ ] Follows content guidelines (sentence case, imperative verbs)
- [ ] Interactive elements work (buttons, toggles, inputs)
- [ ] No console errors or warnings
