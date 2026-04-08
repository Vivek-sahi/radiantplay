---
description: Widget interaction patterns for alerts, banners, toasts, tables, action menus, tooltips, empty states, date pickers, delete confirmations, drag-and-drop, and tree views. Use when building any of these widget types in a prototype. Do NOT use for page-level layouts (see layout-patterns.md) or modal sizing (see modal-patterns.md).
alwaysApply: false
---

# Radiant Widget Patterns

Widgets are reusable multi-component blocks that compose the ThoughtSpot product UI. Use these patterns when building prototypes to ensure consistency with the Radiant design system.

**Hierarchy:** Surfaces → **Widgets** → Components → Tokens

---

## Alert Widgets

> For loading, disabled, and transition patterns around alerts, see `interaction-patterns.md`.

### Alert Taxonomy — Decision Tree

```
Is it system-wide and critical?     → Banner
Is it section-specific?             → Section Alert
Is it a task completion confirmation? → Toast
Is it an empty/no-data state?       → Muted Alert (Empty State)
```

### Banners (System-Level Alerts)

System-wide alerts for critical events affecting the entire application.

**Behavior:**
- Persist across the session (do not auto-dismiss)
- Appear without user action
- Color-coded by severity (info, warning, failure, success)

**Anatomy:**
1. Indicator icon
2. Description text
3. Link (optional)
4. Close button (optional)
5. Container

**Rules:**
- Provide primary/secondary actions (e.g., "Fix issue", "Report issue")
- Max 2 action buttons
- Include close button when **system** caused the error
- Do NOT include close button when **user** caused the error
- Reserve error-style banners for critical errors only

**Content:**
- Clear, efficient messaging
- Short phrases describing what's happening
- Provide an action to remedy the situation when possible
- No periods for short phrases

```tsx
<Alert
  status="warning"
  message="Could not reach Snowflake. Try reconnecting in a few minutes."
  action={{ label: "Reconnect", onClick: handleReconnect }}
  dismissible={false}  // user-caused: no close button
/>
```

### Toasts (Task Confirmations)

Temporary confirmations that appear after completing an action.

**Behavior:**
- Triggered at task completion (form submission, dialog dismiss)
- Animates from **bottom center** of browser window
- Auto-dismisses after **5 seconds**
- User can dismiss early via close (X) button

**Rules:**
- Use to confirm actions NOT clearly visible in the UI
- Always include a close button
- Do NOT use for inline editing confirmations (user can already see the change)
- Avoid showing multiple toasts simultaneously

**Content:**
- Past tense: "Success! You added your pinboards"
- Keep concise (4-6 words)
- Tone can be informal/emotive: "Well done! You're ready to share your chart"

```tsx
<Toast
  status="success"
  message="Changes saved"
  duration={5000}
  position="bottom-center"
/>
```

### Section Alerts

Inform the user about events in a specific area of the screen.

**Rules:**
- Place **above** the affected area
- Show in context to capture attention
- Include close button for **warning**-style alerts
- Do NOT include close button for **error**-style alerts
- **Never** show multiple section alerts on the same page

```tsx
<Alert
  status="failure"
  message="Could not load data source. Check your connection settings."
  dismissible={false}  // error: no close button
/>
```

### Muted Alerts / Empty States

Displayed when there is no data to show.

**Types:**
- **Big empty state** — Full layout with image, title, subtitle, description, buttons
- **Small empty state** — Compact layout without subtitle

**Big Anatomy:**
1. Image/Illustration (optional)
2. Title
3. Subtitle (optional)
4. Description
5. Link (optional)
6. Primary button (optional)
7. Secondary button (optional)

**Use Cases:**

| Reason | Goal | Template |
|--------|------|----------|
| No data (first use) | User understands what will appear when data is added | Title + description + CTA to add data |
| No search results | User knows how to adjust search | "No results found" + magnifying glass illustration |
| Process completion | User knows process succeeded | "Success!" title + "Your xxx is complete" |
| Permissions error | User understands the problem | Warning illustration + explanation + remedy |
| System error | User has corrective actions | Exclamation illustration + detail + CTA |

**Content:**
- Title describes what content should be there
- Can be informal/playful but must be useful
- Tell users how to remedy the empty state when possible
- Success states: use "Success!" as title (not "Congratulations")

**Illustration choices:**
- No data → contextual illustration
- No search results → magnifying glass
- Success → checkmark
- Generic warning → exclamation mark

```tsx
// Big empty state
<div style={styles.emptyState}>
  <img src={magnifyingGlassIllustration} alt="" />
  <Typography variant="pageTitle">No results found</Typography>
  <Typography variant="bodyNormal" color="secondary">
    Try adjusting your search or filter criteria
  </Typography>
  <Button variant="secondary">Clear filters</Button>
</div>
```

---

## User Assistance Widgets

### Tooltips

Descriptive text shown on hover/focus/tap.

**Behavior:**
- **1 second delay** before showing (prevents unwanted distraction)
- Dismissed when mouse leaves the target element
- Activated by hover (rare exceptions: click)

**Content:**
- 1-2 word nouns describing "what this is" (e.g., "Filters")
- NOT for calls to action (don't use "Edit filters")
- For icon-only buttons: provide the action label as tooltip

**Rule:** ALL icon-only buttons MUST have tooltip labels.

```tsx
<Tooltip content="Filters">
  <Button variant="tertiary" icon="filter" iconPosition="leading" aria-label="Filters" />
</Tooltip>
```

### Explainer Cards

Flexible information cards for answering user questions.

**Behavior:**
- Activated by **click** (not hover)
- Dismissed by clicking X or clicking outside the card
- Container width: **340px**

**Triggers:**
- Explainer icon (14x14px) — Click
- Text link — Click
- Icon button (32/24/20px) — Click
- Text string — Hover with 500ms delay
- Disabled UI element — Hover with 500ms delay

**Anatomy:**
1. Title (optional)
2. Description text block (max 3 lines)
3. Container (340px wide)
4. Close button
5. Media content (optional — images, illustrations, video thumbnails)
6. CTA or next/back buttons (optional)

**Content:**
- 2-4 word title adding context ("Types of joins" not just "Joins")
- 40 characters per line, max 4 lines
- For large text, separate into 4-line blocks for scannability
- Can include images, illustrations, or videos

```tsx
<Popover
  trigger={<Icon name="info-circle" size="s" />}
  placement="bottom"
  style={{ width: 340 }}
>
  <div>
    <Typography variant="contentLabel">Types of joins</Typography>
    <Typography variant="bodyNormal">
      Joins connect related tables in your data model. Choose inner joins
      for matching rows only, or outer joins to include all rows.
    </Typography>
    <Button variant="tertiary" size="small">Learn more</Button>
  </div>
</Popover>
```

### Spotlight Cards

System-activated popups focusing on specific UI elements.

**Behavior:**
- Activated by **system events** (page landing, specific interaction)
- Dismissed by clicking X, close button, or clicking outside
- Can be used individually or in sequence (guided tour)

**Types:**
- Text block with title
- Text block with sequenced stepper
- Text block without title
- Additional media content

**Content:**
- 1-2 word title (optional)
- 40 characters per line, max 4 lines
- Conversational tone when appropriate
- For large text, separate into 4-line blocks

---

## Input / Edit Widgets

### Text Fields

Two types of text field widgets for string or integer data entry.

**User Action:** Enter information to complete a form process
**System Response:** Shows error states based on form validation rules

**Label Rules:**
- Typically nouns (1-2 words): "Name", "Date", "Area code"
- For action labels: start with a verb ("Select card type")
- Must not exceed input field width
- No punctuation (periods, colons)
- Error message temporarily replaces the label

**Error Handling:**
- Wait to validate until CTA is clicked (not before)
- Error message replaces label text
- State the issue clearly without assigning blame
- Provide a remedy when possible

**Optional Fields:**
- Show "(optional)" in placeholder text
- All fields are required by default

```tsx
<TextInput
  label="Email address"
  value={email}
  onChange={setEmail}
  error={emailError}
  helperText="name@company.com"
/>
```

### Object Table

Tabular data in read-only and editable modes.

**User Action:** Search, filter, sort, and take actions on single or multiple objects
**System Response:** Default state shows all objects with global actions

**Sections:**
- **OL.0** — Core object list with columns and action links
- **OL.1** — Batch actions (select single/multiple rows)
- **OL.2** — Sort & filter per column
- **OL.3** — Sort & filter modals (multi-object picker, search, date picker)
- **OL.4** — Editable (inline spreadsheet-like editing)
- **OL.5** — Scrolling behavior (horizontal + vertical)
- **OL.6** — Column width strategy (optimize for 1366px screens)

**Object Row Specs:**
- Default line height: 72px (80px with 3 lines of content)
- Truncate header > 2 lines with "..." + tooltip on hover
- Truncate description > 1 line with "...More" (click to expand)
- Row selection: click checkbox OR click anywhere outside name/author/tag links

**Batch Actions Pattern:**
- Selecting rows replaces search bar and global actions with batch action options
- Bulk edit opens a selection modal
- Error state shows alert with description

**Action Column:**
- 1-2 actions → show as blue links
- 3+ actions → collapse into ellipsis (three-dot) menu dropdown

**Column Width:**
- Optimize to avoid horizontal scrolling at 1366px screen width
- Use en dash (---) for null/N/A values in secondary columns

**Sort & Filter:**
- Click column header → dropdown with sort/filter options
- If column only has filter → opens filter modal directly
- Filter chips: multi-line display, alphabetical order, click to edit

```tsx
<Table
  columns={columns}
  data={filteredData}
  rowKey="id"
  sortable
  hoverable
  selectable
  onSelectionChange={handleSelection}
  batchActions={
    selectedRows.length > 0 && (
      <div style={styles.batchBar}>
        <span>{selectedRows.length} selected</span>
        <Button variant="secondary" size="small">Edit</Button>
        <Button variant="secondary" size="small" icon="trash-can" iconPosition="leading">Delete</Button>
      </div>
    )
  }
/>
```

### Date Picker

Select specific fixed dates for filtering.

**Default State:** Condition dropdown ("Between") + start date + end date fields

**Conditions:**
1. Between
2. On
3. Not on
4. After
5. On or after
6. Before
7. On or before

**Behavior:** Changing the condition updates which date fields are visible.

### Rolling Date Picker

Select dates relative to the current date (anchor date).

**Default State:** Condition dropdown ("Last") + number field ("1") + time period ("Quarter")

**Conditions (14 values):**
Yesterday, Today, Tomorrow, This, Last, Next, Before, After, Before the last, After the next, Week to date, Month to date, Quarter to date, Year to date

**Time Periods (8 values):**
Second, Minute, Hour, Day, Week, Month, Quarter (default), Year

### Frequency Picker

Select time periods for scheduling/syncing operations.

**Default State:** Primary frequency dropdown ("Days") + number field ("1")

**Primary Frequency Options:** Hour, Day, Week, Month

**Conditional Fields:**
- "Hour" selected → removes time dropdown
- "Week" selected → shows day selection cluster (M/T/W/Th/F/Sa/Su), default Monday, multi-select
- "Month" selected → shows month selection inputs:
  - "On the" → two dropdowns (First-Last × weekday)
  - "By date" → text input accepting 1-31 comma-separated

**Number Field:**
- Natural numbers only (1-12 depending on context)
- Required field, defaults to 1
- Validate against non-natural numbers

### Multi-Object List Picker

Select multiple items in a list format.

**Anatomy:**
1. Search bar
2. Column header with count
3. Select all / Clear links
4. Object list with checkboxes (max 7 visible)
5. Add value link (inline text input)
6. Show selected toggle
7. Helper text
8. Add values in bulk link (opens sub-task modal)
9. Add / Cancel buttons

**Behavior:**
- Search dynamically filters the list and highlights matching terms
- Select all/clear affects only currently visible items (search-aware)
- Add value: inline text input with checkmark/cross to save/cancel
- Bulk add: opens sub-task modal with multi-line comma-separated input
- "Show selected" toggle moves selected items to top

**Error States:**
- Empty search → show empty state graphic
- Submit empty add-value → error message replaces label, red border

**Stripped Version:** Same widget without the add value/bulk add links (used for edit mode)

```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Add filter">
  <SearchInput
    placeholder="Search..."
    value={searchQuery}
    onChange={setSearchQuery}
  />
  <div style={styles.listHeader}>
    <span>Country ({selectedCount})</span>
    <div>
      <Button variant="tertiary" size="small" onClick={selectAll}>Select all</Button>
      <Button variant="tertiary" size="small" onClick={clearAll}>Clear</Button>
    </div>
  </div>
  <div style={styles.list}>
    {filteredItems.map(item => (
      <Checkbox
        key={item.id}
        label={item.name}
        checked={selected.includes(item.id)}
        onChange={() => toggleItem(item.id)}
      />
    ))}
  </div>
  <Toggle label="Show selected" checked={showSelected} onChange={setShowSelected} />
  <Button variant="tertiary" size="small" onClick={openBulkAdd}>
    Add values in bulk
  </Button>
  <div style={styles.footer}>
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={handleAdd}>Add</Button>
  </div>
</Modal>
```

### Single Object List Picker

Select a single item from a list with optional nesting and creation.

**Features:**
- Single-level nested navigation (first level → second level)
- Search with zero-results state
- Create new item with error handling

**Behavior:**
- No item selected by default
- Search to find objects
- Click to navigate into nested items
- Create option at bottom of list

---

## Core Pattern Widgets

### Three Dot Menu — Action Categorization

All action menus MUST follow this category ordering:

| Order | Category | Description | Examples |
|-------|----------|-------------|----------|
| 1 | **Create** | Generate new objects | Create, Duplicate |
| 2 | **View** | Change viewing mode (not the object) | Preview, Fullscreen, Sort |
| 3 | **Edit** | Change objects themselves | Edit, Rename, Update |
| 4 | **Manage** | Control info based on objects | Permissions, Settings |
| 5 | **Share** | Invite others to connect | Share, Send |
| 6 | **Export** | Connect objects internally/externally | Export, Download, Sync |
| 7 | **Delete** | Destructive removal (always last) | Delete, Remove |

**Visibility Rules (Decision Tree):**
- IF user cannot do anything to enable the action → **hide** the control
- ELSE IF user can do something to enable it → **disable** the control (with tooltip explaining why)

**Naming Rules:**
- Clear, descriptive, consistent names
- Menu items that open dialogs should include an ellipsis ("Share...")

```tsx
<Menu
  trigger={<Button variant="tertiary" icon="more" iconPosition="leading" aria-label="More actions" />}
  items={[
    { label: 'Duplicate', icon: 'copy', onClick: handleDuplicate },
    { type: 'divider' },
    { label: 'Edit', icon: 'pencil', onClick: handleEdit },
    { label: 'Rename', icon: 'pencil', onClick: handleRename },
    { type: 'divider' },
    { label: 'Share...', icon: 'share', onClick: handleShare },
    { label: 'Export', icon: 'download', onClick: handleExport },
    { type: 'divider' },
    { label: 'Delete', icon: 'trash-can', onClick: handleDelete, variant: 'danger' },
  ]}
/>
```

### Delete Object Pattern

Confirm object or configuration removal.

**Pattern:**
1. Confirmation message (max 140 characters)
2. Extended warning for cascading effects (when applicable)
3. Reconfirmation field as secondary precaution (when applicable)

**Modal Header:** "Delete [object name]"

**Content Rules:**
- Message max 140 characters
- Explain consequences of deletion
- For cascading deletes: warn about dependent objects

```tsx
<ConfirmDialog
  isOpen={isOpen}
  title="Delete this Answer?"
  message="This will permanently remove the Answer and all associated Monitors."
  confirmLabel="Delete"
  onConfirm={handleDelete}
  onCancel={() => setIsOpen(false)}
/>
```

### Sign Up Pattern

User registration flow with password validation.

**States:**
- SU.0 Landing screen
- SU.1 Default state
- SU.2 Check password (strength indicator)
- SU.3 Don't meet all requirements
- SU.4 Include dictionary words error
- SU.4.1 Password tips
- SU.5 Passwords don't match
- SU.6 Show/hide password toggle

---

## View Widgets

### Cards

Content and actions about a single subject.

**Anatomy:** Card container (required) + optional content elements

**Types:**
- **Single cards** — standalone content
- **Grouped cards** — multiple cards in a collection

**Actions:**
- **Primary action** — clicking the card itself
- **Supplemental actions** — icons, text, controls at bottom
- **Overflow menu** — upper-right or lower-right corner
- **Additional actions** — limited number, cards are entry points to detail

**Rules:**
- No singular layout requirement — design to meet content needs
- Keep actions limited (cards are entry points, not full detail views)

---

## Navigation Widgets

### Global Navigation
Appears on View and Browse surfaces for site-level navigation.

### Global Left Rail
Persistent sidebar for section-level navigation within a surface.

---

## Widget-Component Quick Reference

| Widget | Key Components Used |
|--------|-------------------|
| Object Table | Table, Checkbox, SearchInput, Menu, Pagination, Chip, Button |
| Multi-Object List Picker | Modal, SearchInput, Checkbox, Toggle, Button, TextInput |
| Single Object List Picker | Modal, SearchInput, Radio, Button |
| Date Picker | Select (conditions), DatePicker, TextInput |
| Rolling Date Picker | Select (conditions), TextInput (number), Select (time period) |
| Frequency Picker | Select, TextInput (number), Checkbox (days), TextInput (dates) |
| Banner | Alert with action buttons |
| Toast | Toast component |
| Section Alert | Alert (inline) |
| Empty State | Image + Typography + Button |
| Tooltip | Tooltip wrapping icon buttons |
| Explainer Card | Popover with structured content |
| Spotlight Card | Custom positioned card with stepper |
| Three Dot Menu | Menu with categorized items |
| Delete Confirmation | ConfirmDialog or Modal |
| Cards | Card + Button + Menu |

---

## Timing Reference

| Element | Timing | Notes |
|---------|--------|-------|
| Tooltip delay | 1 second | Before showing on hover |
| Explainer card (hover trigger) | 500ms | For text string and disabled element triggers |
| Toast auto-dismiss | 5 seconds | From appearance |
| Banner | Persistent | Does not auto-dismiss |

---

## ActionMenu Pattern

### Standard 3-dot overflow menu
```tsx
import { ActionMenu, Button, Icon } from '../../components';

<ActionMenu
  trigger={<Button variant="tertiary" icon="more" iconPosition="leading" />}
  placement="bottom-end"
>
  <ActionMenu.Item
    label="Edit"
    icon={<Icon name="pencil" size="s" />}
    onClick={handleEdit}
  />
  <ActionMenu.Item label="Duplicate" onClick={handleDuplicate} />
  <ActionMenu.Item label="Share" onClick={handleShare} />
  <ActionMenu.Group label="Danger zone">
    <ActionMenu.Item
      label="Delete"
      icon={<Icon name="trash-can" size="s" />}
      destructive
      onClick={handleDelete}
    />
  </ActionMenu.Group>
</ActionMenu>
```

**Rules:**
- Destructive actions (Delete, Remove) always go in a group at the bottom
- Keyboard shortcut display: use `shortcut` prop e.g. `shortcut="⌘D"` for delete
- Max 8 items without grouping; use groups for 8+

---

## DragDrop Pattern

### Sortable list using List component
```tsx
import { List } from '../../components';

const [items, setItems] = useState([
  { id: '1', label: 'First item' },
  { id: '2', label: 'Second item' },
]);

<List
  items={items}
  draggable
  onReorder={setItems}
  renderItem={(item) => (
    <div style={{ padding: '8px 12px' }}>{item.label}</div>
  )}
  emptyState={<NoData title="No items" />}
/>
```

### Using DragDrop hooks for custom layouts
```tsx
import { DragDropProvider, useDraggable, useDroppable } from '../../components';

<DragDropProvider onDragEnd={handleDragEnd}>
  <DraggableItem id="item-1" />
  <DroppableZone id="zone-1" />
</DragDropProvider>
```

---

## Tree Pattern

### Basic expandable tree
```tsx
import { Tree } from '../../components';

const nodes = [
  {
    id: 'root',
    label: 'Root folder',
    children: [
      { id: 'child-1', label: 'File 1.txt' },
      { id: 'child-2', label: 'File 2.txt' },
    ],
  },
];

<Tree
  nodes={nodes}
  selectedIds={[selectedId]}
  onSelect={setSelectedId}
  onExpand={(id) => console.log('expanded', id)}
/>
```

### Checkable tree (multi-select)
```tsx
<Tree
  nodes={nodes}
  checkable
  selectedIds={selectedIds}
  onSelect={(id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }}
/>
```

---

## Tour Pattern

### Guided onboarding walkthrough
```tsx
import { Tour } from '../../components';

const steps = [
  {
    target: '#search-bar',
    title: 'Search anything',
    content: 'Type a question in natural language to explore your data.',
    placement: 'bottom' as const,
  },
  {
    target: '#data-panel',
    title: 'Your data sources',
    content: 'Connect your data here. We support 50+ sources.',
    placement: 'right' as const,
  },
];

const [tourRunning, setTourRunning] = useState(false);

<Tour
  steps={steps}
  isRunning={tourRunning}
  onFinish={() => setTourRunning(false)}
  onSkip={() => setTourRunning(false)}
/>

// Trigger:
<Button variant="tertiary" onClick={() => setTourRunning(true)}>
  Take a tour
</Button>
```
