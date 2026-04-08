---
description: Quick reference of all 77 Radiant components and 46 icons. Always loaded so the AI knows what exists. For full props, code examples, and patterns, read component-inventory.md.
alwaysApply: true
---

# Radiant Component Summary (77 components)

## Quick lookup — what component for what?

- **Text entry** → TextInput / TextArea / SearchInput
- **Selection** → Select / Checkbox / Radio / Toggle / SegmentedControl
- **Actions** → Button / Link
- **Date** → DatePicker
- **Feedback** → Alert / Toast / Tooltip / LoadingIndicator / ProgressBar
- **Navigation** → Tabs / Sidebar / Stepper / Pagination / Menu
- **Data display** → Table / Card / Chip / Avatar / Tree / TreeTable
- **Layout** → Horizontal / Vertical / View / Grid / RdGrid / RdGridItem / SplitPane
- **Overlays** → Modal / ConfirmDialog / WizardModal / FormModal / FilterDialog / Popover
- **Empty states** → NoData / Illustration
- **Icons** → Icon (with `isValidIconName()` validation)
- **Advanced input** → NumericFilterInput / DirectionControl / ColorPicker / InputMentions / ManageTags / Slider
- **Advanced layout** → ManagedList / List (draggable) / NestedCheckbox / FacetSortBar / SearchBar
- **Advanced display** → Legend / Trending / Formatters (.Text/.Number/.Line/.Interval)
- **Content** → FormBuilder / DynamicForm / FormControl / ExplainerCard / RichTextEditor / SafeHTML / Image
- **Interaction** → ActionMenu / VerticalStepper / Tour / DragDrop / OverlayLoading
- **3-dot / overflow menus** → `ActionMenu` (has trigger prop), NOT `Menu` (no built-in trigger)
- **Page layout** → AppShell / GlobalHeader / AppSidebar

## Icons (46 available)

arrow-up, arrow-down, arrow-left, arrow-right, chevron-up, chevron-down, chevron-left, chevron-right, plus, minus, cross, checkmark, checkmark-circle, cross-circle, exclamation-point-circle, info-circle, question-mark, copy, download, upload, save, refresh, pencil, trash-can, share, pin, filter, play, pause, eye, eye-undo, clock, cog, folder, funnel, lock, magnifying-glass, profile, sort, star, tag, expand, fullscreen, hamburger, more, information

**Valid sizes:** `xs` (12px) · `s` (14px) · `m` (16px) · `l` (18px) — no `xl`, no numeric values
**Button icon rule:** Always pass `iconPosition="leading"` or `"trailing"` when using the `icon` prop — default `"none"` suppresses icon rendering. Use `iconOnly` prop for circular 32×32 icon buttons.

## Key rules

- Use `Horizontal`/`Vertical`/`View` instead of inline `display: flex`
- Use `Grid`/`RdGrid` instead of inline `display: grid`
- Use `AppShell` for full-page layouts with header + sidebar
- Always prefer existing components over custom HTML

For full props, code examples, and patterns → read `component-inventory.md`
