# Radiant Prototyping Guide

A comprehensive guide for designers using the Radiant Play to create interactive prototypes.

## Table of Contents

- [Getting Started](#getting-started)
- [Creating Your First Prototype](#creating-your-first-prototype)
- [Working with Components](#working-with-components)
- [Using Mock Data](#using-mock-data)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

1. **Cursor IDE** - Download from [cursor.so](https://cursor.so)
2. **Node.js** - Version 18 or higher
3. **Git** - For version control

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/radiantplay.git
   cd radiantplay
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open in Cursor:**
   ```bash
   cursor .
   ```

### Project Structure

```
radiantplay/
├── src/
│   ├── components/       # Radiant components
│   ├── prototypes/       # Your prototypes go here
│   │   ├── _template/    # Starter template
│   │   └── _liveboard-template/  # Example: liveboard prototype
│   ├── mocks/           # Sample data
│   └── tokens/          # Design tokens
├── .cursor/
│   └── rules/           # AI rules
└── docs/                # Documentation
```

---

## Creating Your First Prototype

### Step 1: Create a New File

Create a new file in `src/prototypes/`:

```
src/prototypes/MyPrototype/
├── index.tsx
└── README.md (optional)
```

### Step 2: Start with the Template

Copy the template structure:

```tsx
import React, { useState } from 'react';
import { Button, Modal, TextInput } from '../../components';
import { brandColors } from '../../tokens/colors/brand';
import { users } from '../../mocks';

export const MyPrototype: React.FC = () => {
  // Your prototype code here
  return (
    <div style={styles.container}>
      {/* Your UI */}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '32px',
    backgroundColor: brandColors.gray[10],
    minHeight: '100vh',
  },
};

export default MyPrototype;
```

### Step 3: Describe Your UI to AI

In Cursor, use the AI chat to describe what you want:

**Example prompts:**

> "Create a user profile settings page with a sidebar navigation on the left, and a form with text inputs for name and email, toggles for notification preferences, and Save/Cancel buttons at the bottom"

> "Build a data table showing user analytics with columns for name, email, status (using Chip component), and last active. Add search and filter controls above the table."

> "I need a modal dialog for confirming deletion. It should have a warning alert at the top, the item name displayed, a checkbox for 'Don't ask again', and Delete/Cancel buttons."

### Step 4: Paste Screenshots

You can also paste screenshots from Figma:

1. Take a screenshot of your Figma design
2. Paste it in the Cursor AI chat
3. Ask: "Recreate this UI using Radiant components"

The AI will analyze the screenshot and generate matching code.

---

## Working with Components

### Available Components

| Component | Import | Description |
|-----------|--------|-------------|
| `Button` | `import { Button } from '../../components'` | Primary, secondary, tertiary buttons |
| `Alert` | `import { Alert } from '../../components'` | Notification banners |
| `Modal` | `import { Modal } from '../../components'` | Dialog overlays |
| `TextInput` | `import { TextInput } from '../../components'` | Text input fields |
| `SearchInput` | `import { SearchInput } from '../../components'` | Search with icon |
| `Select` | `import { Select } from '../../components'` | Dropdown selection |
| `Checkbox` | `import { Checkbox } from '../../components'` | Multi-select control |
| `Radio` | `import { Radio } from '../../components'` | Single-select control |
| `Toggle` | `import { Toggle } from '../../components'` | On/off switch |
| `Tabs` | `import { Tabs } from '../../components'` | Tab navigation |
| `Table` | `import { Table } from '../../components'` | Data table |
| `Tooltip` | `import { Tooltip } from '../../components'` | Hover tooltip |
| `Popover` | `import { Popover } from '../../components'` | Click/hover overlay |
| `Chip` | `import { Chip } from '../../components'` | Tags and labels |
| `Sidebar` | `import { Sidebar } from '../../components'` | Side navigation |
| `Icon` | `import { Icon } from '../../components'` | 55 icons |

### Common Patterns

**Filter Dialog:**
```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Add filter">
  <SearchInput placeholder="Search..." value={query} onChange={setQuery} />
  {items.map(item => (
    <Checkbox 
      key={item.id}
      label={item.label}
      checked={selected.includes(item.id)}
      onChange={() => toggleItem(item.id)}
    />
  ))}
  <Toggle label="Show selected only" checked={showSelected} onChange={setShowSelected} />
</Modal>
```

**Settings Form:**
```tsx
<div style={{ display: 'flex' }}>
  <Sidebar items={sections} activeItem={active} onItemClick={setActive} />
  <div style={{ flex: 1, padding: '24px' }}>
    <TextInput label="Name" value={name} onChange={setName} />
    <Toggle label="Enable notifications" checked={enabled} onChange={setEnabled} />
    <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Save</Button>
    </div>
  </div>
</div>
```

**Data Table:**
```tsx
<Table
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status', render: (val) => (
      <Chip label={val} variant={val === 'Active' ? 'success' : 'default'} />
    )},
  ]}
  data={users}
  rowKey="id"
  hoverable
/>
```

---

## Using Mock Data

### Available Data

```tsx
import { users, analytics, navigation, forms } from '../../mocks';
```

**Users:**
```tsx
users.profiles      // Array of user objects
users.groups        // User groups
users.currentUser   // Current logged-in user
users.roleLabels    // Role display names
```

**Analytics:**
```tsx
analytics.metrics        // KPI cards data
analytics.revenueByMonth // Chart data
analytics.productBreakdown // Table data
analytics.answers        // ThoughtSpot Answers
analytics.liveboards     // ThoughtSpot Liveboards
```

**Navigation:**
```tsx
navigation.sidebar       // Main nav items
navigation.settingsSidebar // Settings nav
navigation.tabs          // Common tab configs
navigation.breadcrumbs   // Breadcrumb examples
```

**Forms:**
```tsx
forms.countries     // Country dropdown options
forms.departments   // Department options
forms.timeRanges    // Time period options
forms.sortOptions   // Sort dropdown options
forms.dataSources   // Data connection options
```

---

## Best Practices

### 1. Use Design Tokens

Always use tokens instead of hard-coded values:

```tsx
// Good
import { brandColors, spacing } from '../../tokens';
backgroundColor: brandColors.gray[10]
padding: spacing.scale.md

// Bad
backgroundColor: '#F6F8FA'
padding: '16px'
```

### 2. Follow Content Guidelines

- **Buttons:** 1-2 words, imperative verbs (Save, Delete, Add)
- **Titles:** 4 words max, sentence case
- **Labels:** 3 words max, no articles

### 3. Component Composition

Build complex UIs by composing simple components:

```tsx
<Modal>
  <Alert status="warning" message="..." />
  <TextInput label="..." />
  <Checkbox label="..." />
  <Button>Confirm</Button>
</Modal>
```

### 4. State Management

Use React state for interactions:

```tsx
const [isOpen, setIsOpen] = useState(false);
const [selected, setSelected] = useState<string[]>([]);
const [searchQuery, setSearchQuery] = useState('');
```

### 5. Responsive Layouts

Use CSS Grid and Flexbox:

```tsx
// Grid for cards
gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'

// Flex for rows
display: 'flex',
alignItems: 'center',
gap: '16px'
```

---

## Troubleshooting

### Component Not Found

Make sure you're importing from the correct path:
```tsx
import { Button } from '../../components';  // Correct
import { Button } from '../components';     // Wrong (if in prototypes folder)
```

### Styles Not Applying

Check that you're using CSS variables correctly:
```css
/* In CSS Modules */
color: var(--color-brand-gray-90);
```

```tsx
/* In inline styles */
color: brandColors.gray[90]
```

### AI Not Understanding

Be more specific in your prompts:
- Mention specific component names
- Describe the layout structure
- Reference example prototypes

---

## Getting Help

- **Examples:** Browse `src/prototypes/` — SpotterMemory, AdminGroups, DataModelEditor are good references
- **Component Docs:** Browse the component showcase in the app
- **AI Rules:** Read `.cursor/rules/prototype-generation.md`
- **Design Tokens:** See `design-token-structure.md`
