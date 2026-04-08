---
description: Full Radiant component reference with props, code examples, and patterns. For a quick list of all 77 components, see component-summary.md (always loaded). Load this file when you need props, examples, or to verify a component exists.
globs: ["src/prototypes/**/index.tsx"]
---

# Radiant Component Inventory

This document lists all available components in the Radiant Design System. **ALWAYS prefer using existing components over creating new ones.**

## Component Selection Decision Tree

Use this to quickly find the right component:

> **LAYOUT RULE: ALWAYS use `Horizontal`/`Vertical`/`View` instead of inline `display: flex` styles. Use `Grid`/`RdGrid` instead of inline `display: grid`.**

### For User Input
- **Text entry (single line)** → `TextInput`
- **Text entry (multi-line)** → `TextArea`
- **Search with icon** → `SearchInput`
- **Date selection** → `DatePicker`
- **Dropdown selection** → `Select`

### For Selection Controls
- **Single choice (mutually exclusive)** → `Radio`
- **Multiple choices** → `Checkbox`
- **On/Off toggle** → `Toggle`
- **Segmented options (2-4)** → `SegmentedControl`

### For Actions
- **Primary action (1 per screen)** → `Button variant="primary"`
- **Secondary actions** → `Button variant="secondary"`
- **Inline/text actions** → `Button variant="tertiary"`
- **Link navigation** → `Link`

### For Feedback
- **Inline notification** → `Alert`
- **Temporary notification** → `Toast`
- **Contextual help** → `Tooltip`
- **Loading state** → `LoadingIndicator`
- **Progress visualization** → `ProgressBar`

### For Layout/Navigation
- **Tab switching** → `Tabs`
- **Side navigation** → `Sidebar`
- **Wizard steps** → `Stepper`
- **Content sections** → `Accordion`
- **Visual separator** → `Divider`

### For Data Display
- **Data grid** → `Table`
- **Tags/labels** → `Chip`
- **User representation** → `Avatar`
- **Content container** → `Card`
- **Pagination** → `Pagination`

### For Overlays
- **Dialog with actions** → `Modal`
- **Confirmation prompt** → `ConfirmDialog`
- **Multi-step dialog** → `WizardModal`
- **Form in modal** → `FormModal`
- **Dropdown menu** → `Menu`
- **Contextual overlay** → `Popover`
- **Filter selection** → `FilterDialog`

### For Layout Primitives
- **Flex row layout** → `Horizontal`
- **Flex column layout** → `Vertical`
- **Custom flex layout** → `View`
- **CSS grid layout** → `Grid` or `RdGrid` + `RdGridItem`
- **Two-panel resizable** → `SplitPane`

### For Empty / Loading States
- **Empty state / no results** → `NoData`
- **Blocking loading overlay** → `OverlayLoading`
- **Guided tour / walkthrough** → `Tour`

### For Advanced Inputs
- **Numeric range / operator filter** → `NumericFilterInput`
- **Text direction (LTR/RTL)** → `DirectionControl`
- **Color selection** → `ColorPicker`
- **@mention autocomplete** → `InputMentions`
- **Tag creation and management** → `ManageTags`
- **Sortable/draggable list** → `List` with `draggable`
- **Add/remove list management** → `ManagedList`
- **Range slider** → `Slider`

### For Data Visualization
- **Chart legend** → `Legend`
- **Trend/popular items** → `Trending`
- **Hierarchical tree** → `Tree`
- **Tree with column data** → `TreeTable`
- **Data formatters** → `Formatters.Text / .Number / .Line / .Interval`

### For Content & Forms
- **Config-driven form** → `FormBuilder`
- **Dynamic form with validation** → `DynamicForm`
- **Filter modal** → `FilterModal`
- **Educational/help card** → `ExplainerCard`
- **Sanitized HTML** → `SafeHTML`
- **Image with fallback** → `Image`
- **ThoughtSpot illustration** → `Illustration`
- **Field label + helper + error wrapper** → `FormControl`

### For Advanced Interaction
- **Context menu (right-click / 3-dot)** → `ActionMenu` (compound)
- **Vertical step progression** → `VerticalStepper`
- **Nested checkbox tree** → `NestedCheckbox`
- **Search + facet + sort bar** → `FacetSortBar` + `SearchBar`
- **Rich text editing** → `RichTextEditor`
- **Drag and drop hooks** → `DragDrop` (DragDropProvider + hooks)

---

## Complete Component Reference

### Buttons & Actions

| Component | Primary Use Case | Key Props |
|-----------|-----------------|-----------|
| **Button** | All clickable actions | `variant`: primary/secondary/tertiary, `size`: small/basic/large, `icon`, `loading`, `disabled` |
| **Link** | Navigation, external links | `href`, `variant`, `external` |

**Button Variant Rules:**
- `primary` - Main action, ONE per screen/section
- `secondary` - Alternative/cancel actions
- `tertiary` - Inline actions, less emphasis

### Selection Controls

| Component | When to Use | Key Props |
|-----------|-------------|-----------|
| **Checkbox** | Multi-select, opt-in | `checked`, `onChange`, `label`, `indeterminate` |
| **Radio** | Single selection from group | `checked`, `onChange`, `label`, `name` |
| **Toggle** | On/off, enable/disable | `checked`, `onChange`, `label`, `size` |
| **SegmentedControl** | 2-4 mutually exclusive options | `options`, `value`, `onChange` |

### Form Inputs

| Component | When to Use | Key Props |
|-----------|-------------|-----------|
| **TextInput** | Single-line text | `value`, `onChange`, `label`, `placeholder`, `error`, `helperText` |
| **TextArea** | Multi-line text | `value`, `onChange`, `label`, `rows`, `resize` |
| **SearchInput** | Search with icon | `value`, `onChange`, `placeholder`, `onClear` |
| **Select** | Dropdown selection | `options`, `value`, `onChange`, `placeholder` |
| **DatePicker** | Date selection | `value`, `onChange`, `format` |

### Feedback & Status

| Component | When to Use | Key Props |
|-----------|-------------|-----------|
| **Alert** | Inline notifications | `status`: info/success/warning/failure, `message`, `dismissible` |
| **Toast** | Temporary notifications | `message`, `status`, `duration`, `onClose` |
| **Tooltip** | Contextual help on hover | `content`, `placement`, `children` |
| **LoadingIndicator** | Loading states | `size`, `Contextual` variant, `Skeleton` variant |
| **ProgressBar** | Progress visualization | `value`, `max`, `variant` |

### Navigation

| Component | When to Use | Key Props |
|-----------|-------------|-----------|
| **Tabs** | Switch between views | `tabs`, `activeTab`, `onTabChange` |
| **Sidebar** | Side navigation | `items`, `activeItem`, `onItemClick` |
| **Stepper** | Multi-step progress | `steps`, `currentStep`, `onStepChange` |
| **Pagination** | Page navigation | `page`, `totalPages`, `onPageChange` |
| **Menu** | Dropdown menu | `items`, `onSelect`, `trigger` |

### Data Display

| Component | When to Use | Key Props |
|-----------|-------------|-----------|
| **Table** | Tabular data | `columns`, `data`, `rowKey`, `sortable`, `hoverable` |
| **Chip** | Tags, status labels | `label`, `variant`, `onRemove`, `size` |
| **Avatar** | User representation | `name`, `src`, `size`, `variant` |
| **Card** | Content container | `children`, `variant`, `padding` |
| **Typography** | Styled text | `variant`, `color`, `children` |

### Layout

| Component | When to Use | Key Props |
|-----------|-------------|-----------|
| **Accordion** | Collapsible sections | `items`, `allowMultiple`, `defaultOpen` |
| **Divider** | Visual separator | `orientation`, `variant` |

### Overlays & Modals

| Component | When to Use | Key Props |
|-----------|-------------|-----------|
| **Modal** | Generic dialog | `isOpen`, `onClose`, `title`, `children`, `size` |
| **ConfirmDialog** | Confirmation prompts | `isOpen`, `onConfirm`, `onCancel`, `title`, `message` |
| **WizardModal** | Multi-step dialogs | `isOpen`, `steps`, `currentStep`, `onNext`, `onBack` |
| **FormModal** | Form in modal | `isOpen`, `onSubmit`, `onCancel`, `title`, `children` |
| **FilterDialog** | Filter selection | `isOpen`, `filters`, `onApply`, `onClear` |
| **Popover** | Contextual overlay | `isOpen`, `content`, `placement`, `trigger` |

### Icons

| Component | When to Use | Key Props |
|-----------|-------------|-----------|
| **Icon** | Iconography | `name`, `size`: xs/s/m/l/xl, `color` |
| **IconGallery** | Icon browsing (dev tool) | N/A |

**Available Icon Names (46 icons):**
```
arrow-up, arrow-down, arrow-left, arrow-right,
chevron-up, chevron-down, chevron-left, chevron-right,
plus, minus, cross, checkmark, checkmark-circle, cross-circle,
exclamation-point-circle, info-circle, question-mark,
copy, download, upload, save, refresh, pencil, trash-can,
share, pin, filter, play, pause, eye, eye-undo, clock, cog,
folder, funnel, lock, magnifying-glass, profile, sort, star,
tag, expand, fullscreen, hamburger, more, information
```

### Layout Primitives

| Component | When to Use | Key Props |
|-----------|-------------|-----------|
| **Horizontal** | Flex row layout (PREFERRED over inline flex) | `gap`, `align`, `justify`, `wrap` |
| **Vertical** | Flex column layout (PREFERRED over inline flex) | `gap`, `align`, `justify` |
| **View** | Custom flex layout with full control | `flexDirection`, `gap`, `align`, `justify` |
| **Grid** | CSS grid layout | `columns`, `gap`, `rows` |
| **RdGrid** | Radiant-specific CSS grid | `columns`, `gap` |
| **RdGridItem** | Grid cell with span control | `colSpan`, `rowSpan` |
| **SplitPane** | Resizable two-panel layout | `left`, `right`, `defaultSize`, `minSize`, `maxSize` |

### Display & Content

| Component | When to Use | Key Props |
|-----------|-------------|-----------|
| **NoData** | Empty state / no results | `illustration`, `title`, `description`, `action` |
| **Illustration** | ThoughtSpot illustrations | `id`: no-data/error/success/welcome/etc., `size` |
| **ExplainerCard** | Educational help card | `icon`, `title`, `body`, `action` |
| **Image** | Image with loading/error fallback | `src`, `alt`, `fallback`, `size` |
| **Legend** | Color-keyed label list (chart legends) | `items`, `orientation` |
| **SafeHTML** | Sanitized HTML rendering | `html`, `allowedTags` |
| **FormControl** | Label + helper + error wrapper | `label`, `helperText`, `error`, `required`, `children` |
| **OverlayLoading** | Absolute-positioned loading overlay | `isLoading`, `message` — parent must be `position: relative` |

### Navigation & Interaction

| Component | When to Use | Key Props |
|-----------|-------------|-----------|
| **ActionMenu** | Context menu / overflow menu | compound: `ActionMenu.Item`, `ActionMenu.Group`, `trigger`, `placement` |
| **VerticalStepper** | Vertical step progression | `steps`, `currentStep`, `onStepChange` |
| **List** | Flexible list, optionally draggable | `items`, `draggable`, `onReorder`, `renderItem` |
| **Slider** | Range input | `value`, `min`, `max`, `step`, `onChange` |
| **ManagedList** | List with add/remove/edit management | `items`, `onAdd`, `onRemove`, `onEdit`, `renderItem` |
| **Trending** | Trending items display | compound: `Trending.Section`, `items` |
| **NestedCheckbox** | Checkbox tree with indeterminate parent | `nodes`, `selectedIds`, `onSelect` |
| **ManageTags** | Tag creation and management | `tags`, `onAdd`, `onRemove`, `suggestions` |
| **SearchBar** | Full-featured search (clear + enter) | `value`, `onChange`, `onSearch`, `onClear`, `placeholder` |

### Form Extensions

| Component | When to Use | Key Props |
|-----------|-------------|-----------|
| **NumericFilterInput** | Numeric range input with operator | `value`, `operator`, `onChange`, `min`, `max` |
| **DirectionControl** | LTR/RTL direction selector | `value`, `onChange` |
| **ColorPicker** | Hex/RGB/palette color picker | `value`, `onChange`, `format`, `palette` |
| **InputMentions** | @mention autocomplete textarea | `value`, `onChange`, `suggestions`, `trigger` |
| **FilterModal** | Filter configuration modal | `isOpen`, `filters`, `onApply`, `onClose` |

### Advanced

| Component | When to Use | Key Props |
|-----------|-------------|-----------|
| **Tree** | Recursive hierarchical list | `nodes`, `selectedIds`, `onSelect`, `onExpand`, `checkable` |
| **TreeTable** | Tree with columnar data | `nodes`, `columns`, `selectedIds`, `onSelect` |
| **Formatters** | Data value formatters | compound: `.Text`, `.Number`, `.Line`, `.Interval`, `.Background`, `.Marker` |
| **Tour** | Guided walkthrough with spotlight | `steps`, `isRunning`, `onFinish`, `onSkip` |
| **RichTextEditor** | WYSIWYG rich text editing | `value`, `onChange`, `toolbar`, `placeholder` |
| **DragDrop** | Drag and drop primitives | `DragDropProvider`, `useDraggable`, `useDroppable`, `useDragAndDrop` hooks |
| **FormBuilder** | Config-driven form renderer | `schema`, `values`, `onChange`, `onSubmit` |
| **DynamicForm** | FormBuilder with error state management | `schema`, `values`, `errors`, `onChange`, `onSubmit` |
| **FacetSortBar** | Search facet + sort controls bar | `facets`, `activeFacet`, `sortOptions`, `sortValue`, `onChange` |

---

## Component Combinations

### Search Experience
```
SearchBar + FacetSortBar + NoData (when no results)
→ SearchBar at top, FacetSortBar below it, NoData when filtered list is empty
```

### Onboarding Flow
```
VerticalStepper + ExplainerCard + Tour
→ VerticalStepper tracks progress, ExplainerCard explains each step, Tour highlights UI elements
```

### Data Exploration
```
Tree + TreeTable + Legend
→ Tree for hierarchy navigation, TreeTable for columnar data, Legend for color keys
```

### Form Management
```
FormControl + FormBuilder + DynamicForm
→ FormControl wraps individual fields, FormBuilder generates full forms from config, DynamicForm adds validation state
```

### Filter Dialog Pattern
```tsx
<Modal title="Add filter">
  <SearchInput placeholder="Search..." />
  {items.map(item => <Checkbox key={item.id} label={item.label} />)}
  <Toggle label="Show selected only" />
  <Button variant="primary">Apply</Button>
</Modal>
```

### Settings Form Pattern
```tsx
<Horizontal>
  <Sidebar items={sections} activeItem={active} />
  <Vertical gap={16} style={{ flex: 1 }}>
    <TextInput label="Name" />
    <Toggle label="Enable notifications" />
    <Horizontal gap={8} justify="flex-end">
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Save</Button>
    </Horizontal>
  </Vertical>
</Horizontal>
```

### Data Table Pattern
```tsx
<SearchInput placeholder="Search..." />
<Table
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', render: (v) => <Chip label={v} /> },
  ]}
  data={data}
/>
<Pagination page={page} totalPages={total} />
```

### Confirmation Dialog Pattern
```tsx
<ConfirmDialog
  isOpen={isOpen}
  title="Delete this Answer?"
  message="This action cannot be undone."
  confirmLabel="Delete"
  onConfirm={handleDelete}
  onCancel={() => setIsOpen(false)}
/>
```

### Wizard/Stepper Pattern
```tsx
<WizardModal isOpen={isOpen} onClose={onClose}>
  <Stepper steps={steps} currentStep={current} />
  {/* Step content */}
  <Button variant="secondary">Back</Button>
  <Button variant="primary">Next</Button>
</WizardModal>
```

---

## Component Status

| Status | Components |
|--------|------------|
| **Stable** | Button, Alert, Modal, TextInput, Checkbox, Radio, Toggle, Tabs, Table, Chip, Avatar, Icon, SearchInput, Select, Tooltip, Card, Divider |
| **Beta** | WizardModal, Stepper, ConfirmDialog, FormModal, FilterDialog, DatePicker, Popover, Menu, SegmentedControl |
| **In Development** | Typography variants, LoadingIndicator variants |

---

## When NOT to Create New Components

**DO NOT create a new component if:**
1. An existing component with different props can achieve the result
2. The pattern is a composition of existing components
3. The difference is purely styling (use tokens instead)
4. It's a one-off prototype element (use inline styles)

**DO create a new component if:**
1. The pattern will be reused across 3+ prototypes
2. It has unique interactive behavior
3. It requires accessibility handling not in existing components

---

## Local Component Creation Checklist

When you determine a new component IS needed during prototype generation, create it inside the prototype's own folder. Follow this checklist:

### 1. Placement

```
src/prototypes/MyPrototype/
├── index.tsx
├── components/
│   ├── index.ts          # Re-exports all local components
│   ├── StatusBadge.tsx    # Local component
│   └── MetricCard.tsx     # Local component
└── data/
    └── mockData.ts
```

### 2. Structure requirements

Even for local/prototype-scoped components, follow these standards:

- [ ] **TypeScript props interface** — Define and export a `Props` type

```tsx
export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending';
  label?: string;
}
```

- [ ] **forwardRef** — Wrap in `React.forwardRef` so parent can attach refs

```tsx
export const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, label }, ref) => {
    return <div ref={ref} style={styles[status]}>{label ?? status}</div>;
  }
);
StatusBadge.displayName = 'StatusBadge';
```

- [ ] **Design tokens only** — No hardcoded hex, pixel magic numbers, or font strings
- [ ] **Named export + default export** — Match the shared component convention

```tsx
export { StatusBadge };
export default StatusBadge;
```

### 3. Import pattern

```tsx
// From the prototype's main file:
import { StatusBadge, MetricCard } from './components';
```

### 4. When a Radiant component doesn't exist for what you need

Before building anything custom, work through this in order:

**Step 1 — Check props first.** Can an existing component achieve the visual with different props?
- No SplitButton? → Two `Button` components side by side, no custom HTML needed.
- No circular icon button? → `Button` with `iconOnly` prop (added 2026-04-01).
- No status dot? → `Toggle` (on/off state) or `Chip` (label state).

**Step 2 — If truly no Radiant equivalent**, build a local component in `src/prototypes/<Name>/components/`.
- Follow `design-system.md` rules: forwardRef, TypeScript, CSS Modules.
- Do NOT use raw `<button>`, `<div onClick>`, or `<input>` — wrap in a proper React component.
- Add a comment: `// Gap: Radiant has no <X> — local implementation`.

**Step 3 — Never inline a component workaround** directly in the main component file. Even a one-off custom element belongs in `components/`.

### 5. Promotion criteria

A local component should be promoted to `src/components/` when ALL of these are true:

| Criterion | Check |
|-----------|-------|
| Used in 3+ different prototypes | ✓ |
| Props API is stable (not changing between prototypes) | ✓ |
| No prototype-specific business logic inside | ✓ |
| Has JSDoc documentation on the exported function | ✓ |
| Uses CSS Module (`.module.css`) instead of inline styles | ✓ |
| Follows `design-system.md` component patterns fully | ✓ |

Until all criteria are met, keep the component local to the prototype.
