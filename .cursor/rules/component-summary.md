---
description: Quick reference of the Radiant components and all 171 icons. Always loaded so the AI knows what exists. For full props, code examples, and patterns, read component-inventory.md.
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

## Icons (171 available, from `src/components/icons/registry.ts`)

add-user, agenda, ai, ai-star, analyst, answer, answer-stroke, app-switcher, apps, apps-stroke, arrow-down, arrow-down-circle, arrow-left, arrow-left-circle, arrow-right, arrow-right-circle, arrow-up, arrow-up-circle, attribute, bold, book, book-closed, brush, bulb, calendar-cleaned, camera, caret-down, caret-left, caret-right, caret-up, case, chart, checkmark, checkmark-circle, chevron-down, chevron-left, chevron-right, chevron-up, clock, cog, collapse, collection, community, conditional-format, controls, copy, copy-link, cord, create-pinboard, create-worksheet, cross, cross-circle, cross-circle2, curious, data-column, database, delete, delete-stroke, doc, documentation, double-check, download, drag, drill-down, edit-text, embrace, enter, escape, excel, exclamation-point-circle, expand, explore, eye, eye-undo, filter, folder, follow, follow-undo, follow-up, following, formula, fullscreen, fullscreen-undo, funnel, funnel-line, globe, grid-view, group-undo, hamburger, info-circle, information, italic, join-inner, join-left, join-outer, join-right, key, like-undo, list-view, liveboard, liveboard-stroke, lock, lock-undo, magnifying-glass, measure, memory, microphone, minus, model, model-stroke, monitor, more, navigate, new-chat, note, number-format, paper-plane, parameter, pause, pdf, pencil, pin, pinboard, play, plus, ppt, present, profile, question-mark, r-analysis, redo, replay-search, reset, rocket, save, save-worksheet, schema, share, show-underlying-data, sign-out, sort, spotter, star, star-undo, strike-through, styling, sync, tab, table, table-stroke, tag, text, text-undo, thumb-down, thumb-down-undo, thumb-up, thumb-up-undo, trash-folder, trash-folder-stroke, underline, undo, upload, upload-data, verified, video, wrench, zoom-area, search, settings, refresh, trash-can

**Pick by meaning, not by name.** Many names aren't what you'd guess. Common needs:

| Need | Icon | Need | Icon |
|---|---|---|---|
| Close, dismiss | `cross` | Clear a field | `cross-circle` |
| Add, new | `plus` (`cross-circle2` is a plus in a circle) | Delete | `delete` (or `trash-can`) |
| Edit | `pencil` | Rename text | `edit-text` |
| Search | `search` | Settings | `settings` |
| Filter | `filter` (sliders), `funnel` | Sort | `sort` |
| More actions | `more` (three dots) | Menu | `hamburger` |
| Drag handle | `drag` | Expand, collapse | `chevron-down` / `chevron-up` |
| Back | `arrow-left`, `chevron-left` | Dropdown caret | `caret-down` |
| Info | `info-circle` | Help | `question-mark` |
| Warning, error | `exclamation-point-circle` | Success | `checkmark-circle` |
| Done, selected | `checkmark` | Refresh | `refresh` |
| Undo, redo | `undo`, `redo` | Share | `share` |
| Download, upload | `download`, `upload` | Copy, copy link | `copy`, `copy-link` |
| Send | `paper-plane` | Comment | `cord` |
| User, add user | `profile`, `add-user` | Team, group | `community` |
| Date, time | `calendar-cleaned`, `clock` | Notifications, alerts | `monitor` (a bell) |
| Show, hide | `eye`, `eye-undo` | Lock, unlock | `lock`, `lock-undo` |
| Favourite (off, on) | `star`, `star-undo` | Pin | `pin` |
| Full screen | `expand` | Sign out | `sign-out` |
| AI, Spotter, analyst | `ai`, `ai-star`, `spotter`, `analyst` | Liveboard, Answer, App | `liveboard`, `answer`, `apps` |
| Chart, table | `chart`, `table` | Data model, database | `model`, `database` |
| Column, formula | `data-column`, `formula` | Folder, tag | `folder`, `tag` |

The `-undo` names are usually the filled or active state of the plain one (`star` and `star-undo`, `thumb-up` and `thumb-up-undo`).

**No icon for:** home, external link, image, mail, phone, location, heart, sun and moon. Object icons (`liveboard`, `answer`, `table`, `model`, `apps`, `delete`, `trash-folder`) also come as `-stroke` outlines. Use the closest icon from the list, or a text button. **Never draw an icon** as inline `<svg>`, never use emoji, and never add an icon library. If nothing fits, say so and leave a `// TODO: icon` comment.

**Connector and brand logos** (Salesforce, Slack, ThoughtSpot and others): use `<ConnectorLogo id="salesforce" />` from `@components/ConnectorLogo`, never an icon or a hand-drawn logo. Logos with files: thoughtspot, salesforce, hubspot, slack, gong, monday. Others (gworkspace, onedrive, canva, notion, dropbox, figma) show a brand-colour disc until a logo is added. To add one, put the file in `src/assets/logos/connectors/` and add it to `connectors.ts`.

**Valid sizes:** `xs` (12px) · `s` (14px) · `m` (16px) · `l` (18px) — no `xl`, no numeric values
**Button icon rule:** Always pass `iconPosition="leading"` or `"trailing"` when using the `icon` prop — default `"none"` suppresses icon rendering. Use `iconOnly` prop for circular 32×32 icon buttons.

## Key rules

- Use `Horizontal`/`Vertical`/`View` instead of inline `display: flex`
- Use `Grid`/`RdGrid` instead of inline `display: grid`
- Use `AppShell` for full-page layouts with header + sidebar
- Always prefer existing components over custom HTML

For full props, code examples, and patterns → read `component-inventory.md`
