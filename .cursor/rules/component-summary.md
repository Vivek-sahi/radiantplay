---
description: Quick reference of the Radiant components and all 153 icons. Always loaded so the AI knows what exists. For full props, code examples, and patterns, read component-inventory.md.
alwaysApply: true
---

# Radiant Component Summary

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

## Icons (153 available, from `src/components/icons/registry.ts`)

add-user, agenda, ai, answer, app-switcher, apps, apps-stroke, arrow-down, arrow-down-circle, arrow-left, arrow-left-circle, arrow-right, arrow-right-circle, arrow-up, arrow-up-circle, attribute, bold, book, book-closed, brush, bulb, calendar-cleaned, camera, caret-down, caret-left, caret-right, caret-up, case, chart, checkmark, checkmark-circle, chevron-down, chevron-left, chevron-right, chevron-up, clock, cog, collection, community, conditional-format, controls, copy, copy-link, cord, create-pinboard, create-worksheet, cross, cross-circle, cross-circle2, curious, data-column, database, doc, documentation, double-check, download, drag, drill-down, edit-text, embrace, enter, escape, excel, exclamation-point-circle, expand, explore, eye, eye-undo, filter, folder, follow, follow-undo, follow-up, following, formula, fullscreen, fullscreen-undo, funnel, funnel-line, grid-view, group-undo, hamburger, info-circle, information, italic, join-inner, join-left, join-outer, join-right, key, like-undo, list-view, liveboard, lock, lock-undo, magnifying-glass, measure, microphone, minus, monitor, more, navigate, note, number-format, paper-plane, pause, pdf, pencil, pin, pinboard, play, plus, ppt, present, profile, question-mark, r-analysis, redo, replay-search, reset, rocket, save, save-worksheet, schema, share, show-underlying-data, sign-out, sort, spotter, star, star-undo, strike-through, sync, table, tag, text, text-undo, thumb-down, thumb-down-undo, thumb-up, thumb-up-undo, trash-can, underline, undo, upload, upload-data, verified, video, wrench, zoom-area, search, settings, refresh

**Valid sizes:** `xs` (12px) · `s` (14px) · `m` (16px) · `l` (18px) — no `xl`, no numeric values
**Button icon rule:** Always pass `iconPosition="leading"` or `"trailing"` when using the `icon` prop — default `"none"` suppresses icon rendering. Use `iconOnly` prop for circular 32×32 icon buttons.

## Key rules

- Use `Horizontal`/`Vertical`/`View` instead of inline `display: flex`
- Use `Grid`/`RdGrid` instead of inline `display: grid`
- Use `AppShell` for full-page layouts with header + sidebar
- Always prefer existing components over custom HTML

For full props, code examples, and patterns → read `component-inventory.md`
