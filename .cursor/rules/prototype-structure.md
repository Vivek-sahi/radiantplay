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
import { systemColors } from '../tokens/colors';
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
    backgroundColor: systemColors.light['background-sunken'],
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
import { systemColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

export const styles: Record<string, CSSProperties> = {
  layout: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: systemColors.light['background-sunken'],
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

**Every prototype MUST have a thumbnail image** for display in the Playground Gallery.

### Thumbnail Specifications

| Requirement | Value |
|-------------|-------|
| **Location** | `src/prototypes/thumbnails/{PrototypeName}.svg` |
| **Format** | SVG (recommended) or PNG |
| **Dimensions** | 800 x 450 pixels (16:9 aspect ratio) |
| **Naming** | Match the prototype folder name exactly |

### Creating a Thumbnail

1. Create an SVG file in `src/prototypes/thumbnails/`
2. Use the prototype name as the filename (e.g., `MyPrototype.svg`)
3. Design a simple visual representation of the prototype
4. Use Radiant brand colors for consistency

### Thumbnail Template

```svg
<svg width="800" height="450" viewBox="0 0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background: systemColors.light['background-sunken'] -->
  <rect width="800" height="450" fill="#F6F8FA"/>

  <!-- UI representation: systemColors.light['background-base'] -->
  <rect x="100" y="80" width="600" height="300" rx="12" fill="#FFFFFF"/>

  <!-- Title: systemColors.light['content-primary'] -->
  <text x="400" y="420" fill="#1D232F" font-family="system-ui" font-size="18" text-anchor="middle" font-weight="500">
    Prototype Name
  </text>
</svg>
```

> Note: SVG thumbnails cannot import tokens directly. Use the hex values but document which token each maps to in comments. Keep colors aligned with the reference values in `token-usage.md`.

---

## Registering Prototypes

All prototypes must be registered in `src/prototypes/registry-mine.ts` (designer-owned file).

> **Never** add entries to `registry-core.ts` (upstream-owned) or `registry.ts` (merger file).

```tsx
// In registry-mine.ts:
import React from 'react';
import { ProjectMeta } from './registry-core';
import MyPrototypeThumbnail from './thumbnails/MyPrototype.svg';
const MyPrototype = React.lazy(() => import('./MyPrototype'));

// section: 'mine'   → "My prototypes" gallery (default for all new work)
// Omitting section defaults to 'mine'
export const myRegistry: ProjectMeta[] = [
  {
    id: 'MyPrototype',
    name: 'My Prototype',
    description: 'Description of what this prototype demonstrates.',
    author: 'Designer Name',
    thumbnail: MyPrototypeThumbnail,
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
import { systemColors } from '../../tokens/colors';

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
import { systemColors, referenceColors } from '../../../tokens/colors';
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
- [ ] **Has thumbnail SVG in `thumbnails/` folder**
- [ ] Registered in `registry-mine.ts` with thumbnail
- [ ] Uses Radiant components (not custom HTML where components exist)
- [ ] Uses design tokens (no hard-coded colors/spacing)
- [ ] Mock data is typed and realistic
- [ ] Follows content guidelines (sentence case, imperative verbs)
- [ ] Interactive elements work (buttons, toggles, inputs)
- [ ] No console errors or warnings
