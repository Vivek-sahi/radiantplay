# Data Studio — Design System Cheat Sheet

_DataStudio-specific reference. Use this for routine Tier 1 work instead of loading the full rule files. Escalate to `component-inventory.md`, `layout-patterns.md`, or `token-usage.md` only for genuinely novel patterns._

---

## Token shortcuts (from `../styles`)

```typescript
import { c, sp, fs, fw, ff, ts } from '../styles';

c   // systemColors.light — e.g. c['background-base']
sp  // spacing — A=4, B=8, C=12, D=16, E=20, F=24, G=28, H=32, I=40, J=48
fs  // fontSize — fs.xs, fs.sm, fs.md, fs.lg, fs.xl
fw  // fontWeight — fw.regular, fw.medium, fw.semibold, fw.bold
ff  // fontFamily — ff.primary
ts  // v2TextStyles — e.g. ts.contentLabelSubhead
```

**Most-used colors:**

| Token | Use |
|-------|-----|
| `c['background-base']` | Panel/card backgrounds |
| `c['background-sunken']` | Page/canvas background |
| `c['background-subtle']` | Hover states, secondary fills |
| `c['background-information']` | Selected row, info tint |
| `c['background-success']` | Success tint |
| `c['background-warning']` | Warning tint |
| `c['background-error']` | Error tint |
| `c['content-primary']` | Body text |
| `c['content-secondary']` | Labels, captions, secondary text |
| `c['content-brand']` | Brand accent, table names |
| `c['border-divider']` | Section separators |
| `c['border-default']` | Input borders, card outlines |

**Never use:** raw hex (`#2770EF`), `rgba()`, `rgb()`, magic px values.

---

## Layout primitives

Use these instead of inline flex divs. Import from `'../../../components/Layout'`.

```tsx
import { Horizontal, Vertical, View } from '../../../components/Layout';

// Row with gap and alignment
<Horizontal gap={sp.B} align="center">...</Horizontal>

// Column with gap
<Vertical gap={sp.C}>...</Vertical>

// A flex CONTAINER — not a generic div. See the warning below.
<View flexDirection="column" style={{ flex: 1, overflow: 'hidden' }}>...</View>
```

`Horizontal` props: `gap`, `align` (**start** | center | **end** | stretch | baseline), `justify`, `wrap`
`Vertical` props: `gap`, `align`, `justify`

⚠️ **`align` values are `start` / `end`, not `flex-start` / `flex-end`.** The latter typechecks as an
error, not a runtime surprise.

⚠️ **`View` is `display: flex` with row direction** — its only CSS is `display:flex`, and it always
writes `justifyContent`. It is **not** a generic div:

- Text inside a `View` becomes an anonymous flex item, so a label in one stretches instead of sitting
  at its natural size.
- A **list** inside a `View` lays its rows out **side by side**, because the default direction is row.

This cost a full layout break in both entry-flow modals on 2026-08-19. Use plain `<div>` for text and
for block containers; use `Vertical` / `Horizontal` when you actually want flex; reach for `View` only
when you want a flex container and are passing `flexDirection` / `align` / `justify` deliberately.

---

## Components in DataStudio today

### Button
```tsx
import { Button } from '../../../components/Button';

<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="tertiary">More</Button>
<Button variant="primary" size="small" icon="plus" iconPosition="leading">Add</Button>
<Button variant="primary" disabled>Disabled</Button>
```
- `variant`: `primary` | `secondary` | `tertiary`
- `size`: `small` | `basic` | `large`
- Always pass `iconPosition` when using `icon` prop (`"leading"` or `"trailing"`)

### Modal
```tsx
import { Modal } from '../../../components/Modal/Modal';

<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Modal title"
  size="M3"
  footer={<Horizontal gap={sp.B}><Button variant="primary">Apply</Button><Button variant="secondary">Cancel</Button></Horizontal>}
>
  {/* content */}
</Modal>
```
- `size`: `M1` (small) → `M4` (full-width). Use `M3` for data-heavy modals (DataQualityPlanModal pattern).

### Select
```tsx
import { Select, SelectOption } from '../../../components/Select';

const options: SelectOption[] = [{ id: 'a', label: 'Option A' }];

<Select options={options} value={val} onChange={(v) => setVal(v)} placeholder="Choose..." />
```
⚠️ **`SelectOption` keys on `id`, not `value`.** `value` exists but is an optional override that
defaults to `id` — writing `{ value, label }` and omitting `id` is a type error.

### Tabs
```tsx
import { Tabs } from '../../../components/Tabs';

<Tabs
  tabs={[{ id: 'overview', label: 'Overview' }, { id: 'columns', label: 'Columns' }]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

### SearchInput
```tsx
import { SearchInput } from '../../../components/SearchInput';

<SearchInput value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." />
```
Use this instead of a custom `<input>` for any search/filter field.

### TextInput
```tsx
import { TextInput } from '../../../components/TextInput';

<TextInput value={val} onChange={e => setVal(e.target.value)} placeholder="Enter value" label="Label" />
```

### Checkbox
```tsx
import { Checkbox } from '../../../components/Checkbox';

<Checkbox checked={checked} onChange={e => setChecked(e.target.checked)} label="Label" />
```

### SegmentedControl
```tsx
import { SegmentedControl } from '../../../components/SegmentedControl';

<SegmentedControl
  options={[{ id: 'list', label: 'List' }, { id: 'grid', label: 'Grid' }]}
  value={view}
  onChange={setView}
/>
```
⚠️ **`SegmentOption` keys on `id`.** And the accessible label prop is `aria-label`, not `ariaLabel`.

### Radio
```tsx
import { Radio } from '../../../components/Radio';

<Radio value="option-a" checked={val === 'option-a'} onChange={() => setVal('option-a')} label="Option A" />
```

### ProgressBar
```tsx
import { ProgressBar } from '../../../components/ProgressBar';

<ProgressBar value={75} max={100} />
```

### Icon
```tsx
import { Icon } from '../../../components/icons';

<Icon name="plus" size="s" />
<Icon name="chevron-down" size="m" />
```
Valid sizes: `xs` | `s` | `m` | `l` — never `xl` or numeric values.

### Avatar
```tsx
import { Avatar } from '../../../components/Avatar';

<Avatar name="Sara Chen" size="small" />
```

### WizardModal
Used for multi-step flows (publish, share). See `Workspace.tsx` for the existing pattern.

---

## Compliance gaps (known, open)

These components exist in Radiant but aren't used yet in DataStudio. Prefer them when building new UI:

| Raw pattern in use | Should be |
|--------------------|-----------|
| `<button style={{...}}>` | `<Button variant="tertiary">` |
| `<div style={{ display: 'flex' }}>` | `<Horizontal>` or `<Vertical>` |
| `<input style={{...}}>` for search | `<SearchInput>` |
| `<table style={{...}}>` for data | `<Table>` from `../../../components/Table` |

The core panels (AgentPanel, LeftPanel, CenterPanel) still use raw HTML — this is a known gap, not a mistake to copy.

---

## Content rules (quick ref)

- Sentence case everywhere — including headings, labels, tab names
- Imperative verbs for buttons: Apply, Cancel, Save, Add, Delete — not "Apply changes" or "Click to save"
- No periods on labels or button text
- Full content rules: `.cursor/rules/content-guidelines.md`
