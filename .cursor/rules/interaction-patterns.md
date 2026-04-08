---
description: Patterns for interactive states including loading spinners, skeleton screens, error states, empty states, disabled states, form validation, and transitions/animations. Use when implementing loading behavior, error handling, disabled controls with tooltips, or animated transitions in prototypes.
alwaysApply: false
---

# Interaction Patterns

This file defines how prototypes should handle dynamic UI states. Consult it when building any interactive behavior beyond static layout.

> **See `_orchestration.md`** for the full priority order of guideline files.

---

## Loading States

### When to show loading

Show a loading indicator whenever the UI simulates waiting for data. Even though prototypes use mock data, realistic loading states demonstrate the intended experience.

### Which loading pattern to use

| Scenario | Pattern | Implementation |
|----------|---------|---------------|
| Full page loading (initial render) | Centered spinner | `<LoadingIndicator size="lg" />` centered in the viewport |
| Section/card loading | Contextual spinner | `<LoadingIndicator size="md" variant="contextual" />` inside the section |
| Table loading | Skeleton rows | Render 3-5 skeleton rows matching column widths |
| Button action in progress | Disabled button + spinner | `<Button disabled>` with inline `<LoadingIndicator size="sm" />` |
| Content area loading | Skeleton placeholders | Gray rectangles matching the expected content shape |

### Implementation pattern

```tsx
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const timer = setTimeout(() => setIsLoading(false), 1200);
  return () => clearTimeout(timer);
}, []);

if (isLoading) {
  return (
    <div style={styles.loadingContainer}>
      <LoadingIndicator size="lg" />
    </div>
  );
}
```

### Simulating async actions

For button clicks that trigger an action (save, submit, delete):

```tsx
const [isSaving, setIsSaving] = useState(false);

const handleSave = () => {
  setIsSaving(true);
  setTimeout(() => {
    setIsSaving(false);
    // Show success feedback (Toast or Alert)
  }, 1500);
};

<Button variant="primary" disabled={isSaving} onClick={handleSave}>
  {isSaving ? 'Saving...' : 'Save changes'}
</Button>
```

---

## Error States

> For Alert variant selection (Banner vs Section Alert vs Toast), see `widget-patterns.md` §Alert Taxonomy.

### Form validation errors

| Situation | Behavior |
|-----------|----------|
| Required field left empty | Red border on input, error text below: "This field is required" |
| Invalid format (email, URL) | Red border + specific message: "Enter a valid email address" |
| Server-side error | `Alert` with `status="failure"` above the form |
| Multiple field errors | Show all errors at once (not one at a time) |

```tsx
<TextInput
  label="Email"
  value={email}
  onChange={setEmail}
  error={errors.email}
/>

{submitError && (
  <Alert
    status="failure"
    variant="section"
    message={submitError}
    dismissible
    onDismiss={() => setSubmitError(null)}
  />
)}
```

### Page-level errors

For errors that prevent the entire page from rendering:

```tsx
<div style={styles.errorContainer}>
  <Alert
    status="failure"
    variant="section"
    message="Unable to load data. Please try again."
  />
  <Button variant="secondary" onClick={handleRetry}>
    Retry
  </Button>
</div>
```

---

## Empty States

Use the patterns from `widget-patterns.md` (Muted Alerts / Empty States section). Key rules:

### Decision tree

```
Is there no data at all (first-time user)?
├── Yes → Big empty state (image + title + description + CTA button)
└── No, data was filtered/searched away
    └── Small empty state (title + "Try adjusting your filters")
```

### Standard empty state

```tsx
<div style={styles.emptyState}>
  <img src={emptyIllustration} alt="" style={styles.emptyImage} />
  <h2 style={styles.emptyTitle}>No Liveboards yet</h2>
  <p style={styles.emptyDescription}>
    Create your first Liveboard to visualize your data.
  </p>
  <Button variant="primary" icon="plus" iconPosition="leading">
    Create Liveboard
  </Button>
</div>
```

### Table empty state

When a table has zero rows after filtering or searching:

```tsx
{filteredData.length === 0 ? (
  <div style={styles.tableEmpty}>
    <p style={{ color: systemColors.light['content-tertiary'] }}>
      No results match your search
    </p>
  </div>
) : (
  <Table columns={columns} data={filteredData} />
)}
```

---

## Disabled States

### When to disable

| Element | Disable when... |
|---------|----------------|
| Button (primary) | Required form fields are empty or invalid |
| Button (destructive) | Confirmation checkbox is unchecked |
| Input field | The field is not editable in the current context |
| Tab | The section is not available (show tooltip explaining why) |

### Visual treatment

- Disabled elements use `opacity: 0.5` and `cursor: 'not-allowed'`
- `Button` handles this automatically via the `disabled` prop
- For custom elements, apply:

```tsx
const disabledStyle: React.CSSProperties = {
  opacity: 0.5,
  pointerEvents: 'none',
  cursor: 'not-allowed',
};
```

### Disabled + Tooltip pattern

When a button is disabled, explain why:

```tsx
<Tooltip content="Complete all required fields to continue">
  <Button variant="primary" disabled={!isFormValid}>
    Submit
  </Button>
</Tooltip>
```

---

## Transitions and Animation

### General rules

- Prototypes should feel responsive. Use simple CSS transitions for state changes.
- Keep durations short: 150ms–300ms for UI transitions.
- Use `ease-out` for entrances, `ease-in` for exits.

### Common transitions

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Modal open/close | opacity + transform | 200ms | ease-out |
| Dropdown open | opacity + max-height | 150ms | ease-out |
| Hover effects | background-color, border-color | 150ms | ease |
| Sidebar expand/collapse | width | 250ms | ease-in-out |
| Toast entrance | transform (slide up) | 300ms | ease-out |

### Implementation

```tsx
const baseStyle: React.CSSProperties = {
  transition: 'opacity 200ms ease-out, transform 200ms ease-out',
  opacity: isVisible ? 1 : 0,
  transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
};
```

### What NOT to animate

- Don't animate color token changes (light/dark mode would be jarring)
- Don't add entrance animations to static page content
- Don't use animations longer than 500ms — prototypes should feel snappy

---

## State Management Patterns

### For simple prototypes (single file)

Use `useState` for all interactive state:

```tsx
const [activeTab, setActiveTab] = useState('overview');
const [searchQuery, setSearchQuery] = useState('');
const [selectedItems, setSelectedItems] = useState<string[]>([]);
const [isModalOpen, setIsModalOpen] = useState(false);
```

### For complex prototypes (multi-file)

When a prototype has 5+ pieces of shared state, use `useReducer`:

```tsx
type State = {
  activeTab: string;
  searchQuery: string;
  selectedItems: string[];
  isLoading: boolean;
};

type Action =
  | { type: 'SET_TAB'; tab: string }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'TOGGLE_ITEM'; id: string }
  | { type: 'SET_LOADING'; loading: boolean };
```

### Never use

- External state management libraries (Redux, Zustand, Jotai) — prototypes don't need them
- Context API for single-prototype state — it's overkill
- `useRef` for state that should trigger re-renders — use `useState`
