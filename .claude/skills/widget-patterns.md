---
name: widget-patterns
description: Interactive widget patterns for tables, alerts, toasts, menus, tooltips, empty states, action menus, and delete flows. Load when adding interactive UI elements.
globs:
  - "src/prototypes/**/*.tsx"
---

# Radiant Widget Patterns

Widgets are reusable multi-component blocks that compose the ThoughtSpot product UI. Use these patterns when building prototypes to ensure consistency with the Radiant design system.

**Hierarchy:** Surfaces → **Widgets** → Components → Tokens

---

## Alert Widgets

### Alert Taxonomy — Decision Tree

```
Is it system-wide and critical?     → Banner
Is it section-specific?             → Section Alert
Is it a task completion confirmation? → Toast
Is it an empty/no-data state?       → Muted Alert (Empty State)
```

### Banners (System-Level Alerts)

- Persist across the session (do not auto-dismiss)
- Color-coded by severity (info, warning, failure, success)
- Max 2 action buttons
- Include close button when **system** caused the error
- Do NOT include close button when **user** caused the error

```tsx
<Alert
  status="warning"
  message="Could not reach Snowflake. Try reconnecting in a few minutes."
  action={{ label: "Reconnect", onClick: handleReconnect }}
  dismissible={false}
/>
```

### Toasts (Task Confirmations)

- Animates from **bottom center** of browser window
- Auto-dismisses after **5 seconds**
- Use to confirm actions NOT clearly visible in the UI
- Tone can be informal: "Well done! You're ready to share your chart"

```tsx
<Toast status="success" message="Changes saved" duration={5000} position="bottom-center" />
```

### Section Alerts

- Place **above** the affected area
- **Never** show multiple section alerts on the same page

```tsx
<Alert status="failure" message="Could not load data source. Check your connection settings." dismissible={false} />
```

### Muted Alerts / Empty States

| Reason | Template |
|--------|----------|
| No data (first use) | Title + description + CTA to add data |
| No search results | "No results found" + magnifying glass illustration |
| Process completion | "Success!" title + "Your xxx is complete" |
| Permissions error | Warning illustration + explanation + remedy |

```tsx
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

- **1 second delay** before showing
- 1-2 word nouns describing "what this is"
- NOT for calls to action
- ALL icon-only buttons MUST have tooltip labels

```tsx
<Tooltip content="Filters">
  <Button variant="tertiary" icon="filter" iconPosition="leading" aria-label="Filters" />
</Tooltip>
```

### Explainer Cards

- Activated by **click** (not hover)
- Container width: **340px**
- 2-4 word title adding context

```tsx
<Popover trigger={<Icon name="info-circle" size="s" />} placement="bottom" style={{ width: 340 }}>
  <div>
    <Typography variant="contentLabel">Types of joins</Typography>
    <Typography variant="bodyNormal">
      Joins connect related tables in your data model.
    </Typography>
    <Button variant="tertiary" size="small">Learn more</Button>
  </div>
</Popover>
```

---

## Input / Edit Widgets

### Text Fields

- Error message temporarily replaces the label
- Wait to validate until CTA is clicked (not before)
- Show "(optional)" in placeholder text for optional fields

```tsx
<TextInput label="Email address" value={email} onChange={setEmail} error={emailError} helperText="name@company.com" />
```

### Object Table

- Default line height: 72px (80px with 3 lines of content)
- 1-2 actions → show as blue links; 3+ actions → collapse into ellipsis menu
- Optimize to avoid horizontal scrolling at 1366px screen width

```tsx
<Table
  columns={columns} data={filteredData} rowKey="id"
  sortable hoverable selectable
  onSelectionChange={handleSelection}
  batchActions={selectedRows.length > 0 && (
    <div style={styles.batchBar}>
      <span>{selectedRows.length} selected</span>
      <Button variant="secondary" size="small">Edit</Button>
      <Button variant="secondary" size="small" icon="trash-can" iconPosition="leading">Delete</Button>
    </div>
  )}
/>
```

---

## Core Pattern Widgets

### Three Dot Menu — Action Categorization

All action menus MUST follow this category ordering:

| Order | Category | Examples |
|-------|----------|----------|
| 1 | **Create** | Create, Duplicate |
| 2 | **View** | Preview, Fullscreen, Sort |
| 3 | **Edit** | Edit, Rename, Update |
| 4 | **Manage** | Permissions, Settings |
| 5 | **Share** | Share, Send |
| 6 | **Export** | Export, Download, Sync |
| 7 | **Delete** | Delete, Remove (always last) |

**Visibility Rules:**
- IF user cannot do anything to enable the action → **hide** the control
- ELSE IF user can do something to enable it → **disable** the control (with tooltip)

```tsx
<Menu
  trigger={<Button variant="tertiary" icon="more" iconPosition="leading" aria-label="More actions" />}
  items={[
    { label: 'Duplicate', icon: 'copy', onClick: handleDuplicate },
    { type: 'divider' },
    { label: 'Edit', icon: 'pencil', onClick: handleEdit },
    { type: 'divider' },
    { label: 'Share...', icon: 'share', onClick: handleShare },
    { label: 'Export', icon: 'download', onClick: handleExport },
    { type: 'divider' },
    { label: 'Delete', icon: 'trash-can', onClick: handleDelete, variant: 'danger' },
  ]}
/>
```

### Delete Object Pattern

- Modal header: "Delete [object name]"
- Message max 140 characters
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

---

## ActionMenu Pattern

```tsx
<ActionMenu
  trigger={<Button variant="tertiary" icon="more" iconPosition="leading" />}
  placement="bottom-end"
>
  <ActionMenu.Item label="Edit" icon={<Icon name="pencil" size="s" />} onClick={handleEdit} />
  <ActionMenu.Item label="Duplicate" onClick={handleDuplicate} />
  <ActionMenu.Group label="Danger zone">
    <ActionMenu.Item label="Delete" icon={<Icon name="trash-can" size="s" />} destructive onClick={handleDelete} />
  </ActionMenu.Group>
</ActionMenu>
```

- Max 8 items without grouping; use groups for 8+
- Destructive actions always go in a group at the bottom

---

## DragDrop Pattern

```tsx
<List items={items} draggable onReorder={setItems}
  renderItem={(item) => (<div style={{ padding: '8px 12px' }}>{item.label}</div>)}
  emptyState={<NoData title="No items" />}
/>
```

---

## Tree Pattern

```tsx
<Tree nodes={nodes} selectedIds={[selectedId]} onSelect={setSelectedId} onExpand={(id) => console.log('expanded', id)} />
```

Checkable tree:
```tsx
<Tree nodes={nodes} checkable selectedIds={selectedIds}
  onSelect={(id) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }}
/>
```

---

## Widget-Component Quick Reference

| Widget | Key Components Used |
|--------|-------------------|
| Object Table | Table, Checkbox, SearchInput, Menu, Pagination, Chip, Button |
| Multi-Object List Picker | Modal, SearchInput, Checkbox, Toggle, Button, TextInput |
| Banner | Alert with action buttons |
| Toast | Toast component |
| Section Alert | Alert (inline) |
| Empty State | Image + Typography + Button |
| Tooltip | Tooltip wrapping icon buttons |
| Three Dot Menu | Menu with categorized items |
| Delete Confirmation | ConfirmDialog or Modal |

---

## Timing Reference

| Element | Timing |
|---------|--------|
| Tooltip delay | 1 second |
| Explainer card (hover trigger) | 500ms |
| Toast auto-dismiss | 5 seconds |
| Banner | Persistent |
