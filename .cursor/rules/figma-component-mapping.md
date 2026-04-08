---
description: Mapping tables from Figma layer names, variants, colors, typography, and icons to Radiant components and design tokens. Use when converting a Figma screenshot or Figma design data into Radiant prototype code. Do NOT use for general prototyping without Figma input.
alwaysApply: false
---

# Figma-to-Radiant Component Mapping

When recreating a Figma design, use this guide to map Figma elements to Radiant components.

## Figma Layer Naming → Radiant Component

### Common Figma Names

| Figma Layer Name | Radiant Component | Notes |
|------------------|-------------------|-------|
| `Button`, `CTA`, `Primary button` | `<Button variant="primary">` | |
| `Secondary button`, `Ghost button` | `<Button variant="secondary">` | |
| `Tertiary button`, `Text button` | `<Button variant="tertiary">` | |
| `Checkbox`, `Check box` | `<Checkbox>` | |
| `Radio`, `Radio button` | `<Radio>` | |
| `Toggle`, `Switch`, `Toggle switch` | `<Toggle>` | |
| `Input`, `Text field`, `Text input` | `<TextInput>` | |
| `Text area`, `Multiline` | `<TextArea>` | |
| `Search`, `Search bar`, `Search input` | `<SearchInput>` | |
| `Dropdown`, `Select`, `Picker` | `<Select>` | |
| `Modal`, `Dialog`, `Popup` | `<Modal>` | |
| `Alert`, `Banner`, `Notification` | `<Alert>` | |
| `Toast`, `Snackbar` | `<Toast>` | |
| `Chip`, `Tag`, `Badge`, `Label` | `<Chip>` | |
| `Avatar`, `Profile pic` | `<Avatar>` | |
| `Tabs`, `Tab bar`, `Tab group` | `<Tabs>` | |
| `Sidebar`, `Nav`, `Navigation` | `<Sidebar>` | |
| `Table`, `Data table`, `Grid` | `<Table>` | |
| `Tooltip`, `Hint` | `<Tooltip>` | |
| `Card`, `Container`, `Panel` | `<Card>` or custom div | |
| `Divider`, `Separator`, `Line` | `<Divider>` | |
| `Icon`, icon names | `<Icon name="...">` | Map to available icons |
| `Stepper`, `Progress steps` | `<Stepper>` | |
| `Progress`, `Progress bar` | `<ProgressBar>` | |
| `Loader`, `Spinner` | `<LoadingIndicator>` | |
| `Pagination` | `<Pagination>` | |
| `Menu`, `Dropdown menu` | `<Menu>` | |
| `Popover`, `Floating panel` | `<Popover>` | |
| `Empty state`, `No results`, `Zero state` | `NoData` | |
| `Skeleton loader`, `Empty content`, `No data illustration` | `Illustration` | Use with NoData |
| `Split view`, `Dual panel`, `Side-by-side` | `SplitPane` | |
| `Context menu`, `Right-click menu`, `More actions`, `Overflow menu` | `ActionMenu` | Compound: ActionMenu.Item, ActionMenu.Group |
| `Sortable list`, `Drag list`, `Reorder list` | `List` with `draggable={true}` | |
| `Tag input`, `Multi-tag`, `Tag manager` | `ManageTags` | |
| `Range slider`, `Value slider` | `Slider` | |
| `Card grid`, `Masonry grid`, `4-column grid` | `Grid` or `RdGrid` + `RdGridItem` | |
| `Horizontal group`, `Row layout`, `Flex row` | `Horizontal` | PREFERRED over inline flex |
| `Vertical stack`, `Column layout`, `Flex column` | `Vertical` | PREFERRED over inline flex |
| `Stepper (vertical)`, `Progress steps (side)`, `Setup wizard` | `VerticalStepper` | |
| `Legend`, `Color key`, `Chart legend` | `Legend` | |
| `Trending`, `Popular searches`, `Hot topics` | `Trending` | |
| `Tree`, `File tree`, `Hierarchy list` | `Tree` | |
| `Tree table`, `Hierarchical table` | `TreeTable` | |
| `Color picker`, `Color swatch` | `ColorPicker` | |
| `Mention input`, `@mention` | `InputMentions` | |
| `Nested checkboxes`, `Checkbox tree` | `NestedCheckbox` | |
| `Filter bar`, `Facet bar`, `Category filters` | `FacetSortBar` | |
| `Rich text`, `WYSIWYG editor`, `Text editor` | `RichTextEditor` | |
| `Guided tour`, `Walkthrough`, `Onboarding steps` | `Tour` | |
| `Form builder`, `Dynamic form` | `FormBuilder` | Or `DynamicForm` for validation |
| `Loading overlay`, `Blocking loader` | `OverlayLoading` | Parent must be position: relative |
| `Search bar` (full-featured with clear+enter) | `SearchBar` | Distinct from SearchInput (simpler) |
| `Explain card`, `Help card`, `Info card` | `ExplainerCard` | |
| `Image with fallback` | `Image` | Handles loading/error states |
| `Illustration`, `Empty state art` | `Illustration` | ids: no-data, error, success, welcome, etc. |

---

## Figma Variants → Radiant Props

### Button Variants

| Figma Variant | Radiant Props |
|---------------|---------------|
| Type: Primary | `variant="primary"` |
| Type: Secondary | `variant="secondary"` |
| Type: Tertiary / Ghost | `variant="tertiary"` |
| Size: Small / S | `size="small"` |
| Size: Medium / M / Default | `size="basic"` |
| Size: Large / L | `size="large"` |
| State: Disabled | `disabled={true}` |
| State: Loading | `loading={true}` |
| Icon: Left / Leading | `icon="icon-name"` |

### Alert/Status Variants

| Figma Status | Radiant Props |
|--------------|---------------|
| Info / Information / Blue | `status="info"` |
| Success / Green / Positive | `status="success"` |
| Warning / Yellow / Caution | `status="warning"` |
| Error / Red / Failure / Negative | `status="failure"` |
| Neutral / Muted / Gray | `status="muted"` |

### Size Variants

| Figma Size | Radiant Props |
|------------|---------------|
| XS / Extra small / Tiny | `size="xs"` |
| S / Small | `size="s"` or `size="small"` |
| M / Medium / Default | `size="m"` or `size="basic"` |
| L / Large | `size="l"` or `size="large"` |
| XL / Extra large | `size="xl"` |

---

## Figma Auto-Layout → CSS

### Flex Direction

| Figma Auto-Layout | CSS |
|-------------------|-----|
| Horizontal | `display: 'flex', flexDirection: 'row'` |
| Vertical | `display: 'flex', flexDirection: 'column'` |

### Alignment

| Figma Alignment | CSS |
|-----------------|-----|
| Top Left | `alignItems: 'flex-start', justifyContent: 'flex-start'` |
| Top Center | `alignItems: 'flex-start', justifyContent: 'center'` |
| Center Left | `alignItems: 'center', justifyContent: 'flex-start'` |
| Center Center | `alignItems: 'center', justifyContent: 'center'` |
| Space Between | `justifyContent: 'space-between'` |

### Gap

| Figma Gap | Radiant Token |
|-----------|---------------|
| 4px | `spacing.A` |
| 8px | `spacing.B` |
| 12px | `spacing.C` |
| 16px | `spacing.D` |
| 20px | `spacing.E` |
| 24px | `spacing.F` |
| 32px | `spacing.H` |

### Padding

| Figma Padding | Radiant Token |
|---------------|---------------|
| 4px | `spacing.A` |
| 8px | `spacing.B` |
| 12px | `spacing.C` |
| 16px | `spacing.D` |
| 20px | `spacing.E` |
| 24px | `spacing.F` |

---

## Figma Colors → Radiant Tokens

### Text Colors

| Figma Color | Radiant Token |
|-------------|---------------|
| #1D232F | `systemColors.light['content-primary']` (default text) |
| #777E8B | `systemColors.light['content-secondary']` (secondary text) |
| #A5ACB9 | `systemColors.light['content-tertiary']` (disabled/placeholder) |
| #2770EF | `systemColors.light['content-brand']` (link/primary) |

### Background Colors

| Figma Color | Radiant Token |
|-------------|---------------|
| #FFFFFF | `systemColors.light['background-base']` (surface) |
| #F6F8FA | `systemColors.light['background-sunken']` (page background) |
| #EAEDF2 | `systemColors.light['background-muted']` (subtle background) |

### Border Colors

| Figma Color | Radiant Token |
|-------------|---------------|
| #EAEDF2 | `systemColors.light['border-subtle']` (default border) |
| #C0C6CF | `systemColors.light['border-default']` (input border) |
| #2770EF | `systemColors.light['border-brand']` (focus/active border) |

### Status Colors

| Figma Color | Radiant Token |
|-------------|---------------|
| #06BF7F (green) | `systemColors.light['content-success']` (success) |
| #E22B3D (red) | `systemColors.light['content-failure']` (error) |
| #FCC838 (yellow) | `systemColors.light['content-warning']` (warning) |
| #2770EF (blue) | `systemColors.light['content-brand']` (info) |

---

## Figma Typography → Radiant Tokens

### Font Sizes

| Figma Size | Radiant Token |
|------------|---------------|
| 12px | `fontSize.xs` |
| 14px | `fontSize.sm` |
| 16px | `fontSize.md` |
| 18px | `fontSize.lg` |
| 20px | `fontSize.xl` |
| 24px | `fontSize['2xl']` |
| 32px | `fontSize['3xl']` |

### Font Weights

| Figma Weight | Radiant Token |
|--------------|---------------|
| Light / 300-400 | `fontWeight.light` (375) |
| Regular / 400 | `fontWeight.regular` (400) |
| Medium / 500 | `fontWeight.medium` (500) |
| Semibold / 600 | `fontWeight.semibold` (600) |

### Text Style Mapping

| Figma Text Style | Radiant V2 Style |
|------------------|------------------|
| Page Title | `v2TextStyles.pageTitle` |
| Modal Title | `v2TextStyles.modalTitle` |
| Section Label | `v2TextStyles.sectionLabel` |
| Body Normal | `v2TextStyles.bodyNormal` |
| Caption | `v2TextStyles.caption` |
| Footnote | `v2TextStyles.footnote` |
| Overline | `v2TextStyles.overline` |

---

## What to Ignore from Figma

### Always Ignore

1. **Decorative shadows** that don't match Radiant tokens
2. **Custom colors** not in the Radiant palette (use closest token)
3. **Pixel-perfect spacing** that doesn't match 4px grid (round to nearest token)
4. **Non-standard fonts** (use `fontFamily.primary`)
5. **Frame names** that are organizational only

### Simplify When Mapping

1. **Complex gradients** → Use solid colors from tokens
2. **Elaborate animations** → Use simple transitions
3. **Custom icons** → Use available Icon names or placeholder
4. **Non-standard hover states** → Use Radiant component defaults

---

## Icon Mapping

### Common Figma Icon Names → Radiant Icon Names

| Figma Icon | Radiant `<Icon name="...">` |
|------------|----------------------------|
| Close, X | `cross` |
| Check, Tick | `checkmark` |
| Add, Plus | `plus` |
| Remove, Minus | `minus` |
| Search, Magnifier | `magnifying-glass` |
| Settings, Gear | `cog` |
| Edit, Pencil | `pencil` |
| Delete, Trash | `trash-can` |
| Download | `download` |
| Upload | `upload` |
| Share | `share` |
| Filter, Funnel | `filter` or `funnel` |
| Sort | `sort` |
| Info, Information | `info-circle` or `information` |
| Warning, Alert | `exclamation-point-circle` |
| Error | `cross-circle` |
| Success | `checkmark-circle` |
| Help, Question | `question-mark` |
| User, Profile | `profile` |
| Menu, Hamburger | `hamburger` |
| More, Dots, Ellipsis | `more` |
| Arrow Left/Right/Up/Down | `arrow-left`, `arrow-right`, etc. |
| Chevron Left/Right/Up/Down | `chevron-left`, `chevron-right`, etc. |
| Eye, View | `eye` |
| Eye Off, Hide | `eye-undo` |
| Pin | `pin` |
| Star, Favorite | `star` |
| Copy | `copy` |
| Refresh, Reload | `refresh` |
| Lock | `lock` |
| Folder | `folder` |
| Clock, Time | `clock` |
| Play | `play` |
| Pause | `pause` |
| Expand | `expand` |
| Fullscreen | `fullscreen` |
| Tag | `tag` |
| Save | `save` |

---

## Pattern Recognition: Figma → Radiant

### When you see a list with checkboxes
```tsx
// Figma: List of items with checkbox indicators
// Radiant:
{items.map(item => (
  <Checkbox 
    key={item.id}
    label={item.name}
    checked={selected.includes(item.id)}
    onChange={() => toggle(item.id)}
  />
))}
```

### When you see a modal with form fields
```tsx
// Figma: Popup/Dialog with input fields and buttons
// Radiant:
<Modal isOpen={isOpen} onClose={onClose} title="Form Title">
  <TextInput label="Field 1" value={value} onChange={setValue} />
  <Select label="Field 2" options={options} value={selected} onChange={setSelected} />
  <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={handleSubmit}>Save</Button>
  </div>
</Modal>
```

### When you see a data table with actions
```tsx
// Figma: Grid/Table with rows and action buttons/icons
// Radiant:
<Table
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', render: (v) => <Chip label={v} /> },
    { key: 'actions', label: '', render: () => (
      <Button variant="tertiary" icon="more" iconPosition="leading" />
    )},
  ]}
  data={data}
/>
```

### When you see tabs with content panels
```tsx
// Figma: Tab bar with different content areas
// Radiant:
<Tabs
  tabs={[
    { id: 'tab1', label: 'First Tab' },
    { id: 'tab2', label: 'Second Tab' },
  ]}
  activeTab={active}
  onTabChange={setActive}
/>
{active === 'tab1' && <FirstTabContent />}
{active === 'tab2' && <SecondTabContent />}
```

### When you see a flex row / horizontal group
```tsx
// Figma: Auto Layout → Horizontal
// OLD (bad): <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
// NEW (good): <Horizontal gap={8} align="center">
//               {children}
//             </Horizontal>
```

### When you see an empty state / no results screen
```tsx
// Figma: Empty state with illustration, title, description, CTA
<NoData
  illustration={<Illustration id="no-results" size="md" />}
  title="No results found"
  description="Try a different search term"
  action={<Button variant="secondary" onClick={clearSearch}>Clear search</Button>}
/>
```

### When you see a context/overflow menu (3-dot button)
```tsx
// Figma: Icon button + dropdown menu
<ActionMenu
  trigger={<Button variant="tertiary" icon="more" iconPosition="leading" />}
  placement="bottom-end"
>
  <ActionMenu.Item label="Edit" icon={<Icon name="pencil" size="s" />} onClick={handleEdit} />
  <ActionMenu.Item label="Duplicate" onClick={handleDuplicate} />
  <ActionMenu.Group label="Danger zone">
    <ActionMenu.Item label="Delete" destructive onClick={handleDelete} />
  </ActionMenu.Group>
</ActionMenu>
```

### When you see a sortable / draggable list
```tsx
// Figma: List with drag handles
<List
  items={items}
  draggable
  onReorder={setItems}
  renderItem={(item) => <div>{item.label}</div>}
/>
```
