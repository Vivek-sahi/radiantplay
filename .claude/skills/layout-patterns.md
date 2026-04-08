---
name: layout-patterns
description: Page layout patterns including AppShell, sidebar, header, grid, responsive design, dashboards, and form pages. Load when building or modifying page structure.
globs:
  - "src/prototypes/**/index.tsx"
---

# Radiant Layout Patterns

Standard layouts for building prototypes. Use these patterns as starting points.

---

## Layout Primitives

> **RULE:** Never write `display: flex` or `display: grid` inline. Use `Horizontal`, `Vertical`, `View`, or `Grid`. See `component-inventory.md` §Layout Primitives for the full component list and examples.

---

## Full Page Layout (Admin/Settings)

```
┌─────────────────────────────────────────────────────┐
│  Header (60px)                                      │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│   Sidebar    │         Main Content                 │
│   (260px)    │                                      │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

**NOTE: For any full-page prototype with header + sidebar, use `AppShell` — do NOT hand-roll the layout below.**

```tsx
// Preferred — use AppShell
import { AppShell } from '../../components/AppShell';
import { systemColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontFamily } from '../../tokens/typography';

const FullPageLayout: React.FC = () => (
  <AppShell
    headerProps={{ searchPlaceholder: 'Search', userName: 'User Name' }}
    sidebarProps={{ tabs, activeTab, onTabChange, categories, selectedNav, onNavSelect }}
    contentBackground={systemColors.light['background-sunken']}
  >
    <div style={{ padding: `${spacing.F}px ${spacing.H}px`, fontFamily: fontFamily.primary }}>
      {/* Page content */}
    </div>
  </AppShell>
);
```

If you cannot use `AppShell` (e.g. embedding inside an existing shell), use the manual layout below:

```tsx
import { systemColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontFamily } from '../../tokens/typography';

const styles = {
  layout: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: systemColors.light['background-sunken'],
    fontFamily: fontFamily.primary,
  },
  header: {
    flexShrink: 0,
    zIndex: 100,
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: '260px',
    flexShrink: 0,
    backgroundColor: systemColors.light['background-base'],
    borderRight: `1px solid ${systemColors.light['border-divider']}`,
    overflowY: 'auto',
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    padding: `${spacing.F}px ${spacing.H}px`,
    backgroundColor: systemColors.light['background-base'],
  },
  content: {
    maxWidth: '1280px',
  },
};
```

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│  Header                                             │
├─────────────────────────────────────────────────────┤
│  Tabs: [Tab 1] [Tab 2] [Tab 3]                     │
├─────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Metric  │ │ Metric  │ │ Metric  │ │ Metric  │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
├─────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────┐    │
│  │   Chart/Graph      │  │   Chart/Graph      │    │
│  └────────────────────┘  └────────────────────┘    │
├─────────────────────────────────────────────────────┤
│  Data Table                                         │
└─────────────────────────────────────────────────────┘
```

```tsx
const DashboardLayout: React.FC = () => {
  return (
    <div style={styles.container}>
      <PageHeader title="Dashboard" />
      <Tabs tabs={tabItems} activeTab={active} onTabChange={setActive} />
      <div style={styles.metricsGrid}>
        {metrics.map(metric => (
          <MetricCard key={metric.id} {...metric} />
        ))}
      </div>
      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <Chart data={chartData1} />
        </div>
        <div style={styles.chartCard}>
          <Chart data={chartData2} />
        </div>
      </div>
      <div style={styles.tableSection}>
        <Table columns={columns} data={tableData} />
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: `${spacing.F}px`,
    backgroundColor: systemColors.light['background-sunken'],
    minHeight: '100vh',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: `${spacing.D}px`,
    marginBottom: `${spacing.F}px`,
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: `${spacing.D}px`,
    marginBottom: `${spacing.F}px`,
  },
  chartCard: {
    backgroundColor: systemColors.light['background-base'],
    borderRadius: '8px',
    padding: `${spacing.F}px`,
    border: `1px solid ${systemColors.light['border-subtle']}`,
  },
  tableSection: {
    backgroundColor: systemColors.light['background-base'],
    borderRadius: '8px',
    border: `1px solid ${systemColors.light['border-subtle']}`,
    overflow: 'hidden',
  },
};
```

---

## Form Page Layout

```tsx
const FormPageLayout: React.FC = () => {
  return (
    <div style={styles.container}>
      <nav style={styles.sidebar}>
        {sections.map(section => (
          <div key={section.id} style={{...styles.sectionItem, ...(active === section.id ? styles.sectionItemActive : {})}} onClick={() => setActive(section.id)}>
            {section.label}
          </div>
        ))}
      </nav>
      <div style={styles.formContainer}>
        <h2 style={styles.sectionTitle}>{currentSection.label}</h2>
        <div style={styles.formFields}>
          <TextInput label="Name" value={name} onChange={setName} />
          <TextInput label="Email" value={email} onChange={setEmail} />
          <Toggle label="Enable notifications" checked={enabled} onChange={setEnabled} />
        </div>
        <div style={styles.footer}>
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">Save</Button>
        </div>
      </div>
    </div>
  );
};
```

---

## Data Table Page Layout

```tsx
const DataTablePageLayout: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div style={styles.breadcrumb}>
          <span>Home</span>
          <Icon name="chevron-right" size="xs" />
          <span>Section</span>
          <Icon name="chevron-right" size="xs" />
          <span style={{ color: systemColors.light['content-primary'] }}>Page</span>
        </div>
        <h1 style={styles.title}>Page Title</h1>
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <SearchInput placeholder="Search..." value={search} onChange={setSearch} />
        </div>
        <div style={styles.actions}>
          <Button variant="secondary" icon="filter" iconPosition="leading">Filter</Button>
          <Button variant="primary" icon="plus" iconPosition="leading">Add item</Button>
        </div>
      </div>
      <div style={styles.tableContainer}>
        <Table columns={columns} data={filteredData} rowKey="id" hoverable />
      </div>
      <div style={styles.pagination}>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
};
```

---

## Responsive Breakpoints

| Breakpoint | Width | Use Case |
|------------|-------|----------|
| Mobile | < 768px | Stack layouts, hide sidebar |
| Tablet | 768px - 1024px | Collapsible sidebar |
| Desktop | > 1024px | Full layout |

### Responsive Grid Pattern

**Always use `auto-fill` + `minmax` — never hard-code column counts.**

```typescript
// GOOD — collapses automatically as viewport narrows
gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))'

// BAD — clips on smaller screens
gridTemplateColumns: 'repeat(4, 1fr)'
```

### Scrollable Table Pattern

Wrap every `<Table>` in an `overflowX: 'auto'` container:

```tsx
<div style={{ overflowX: 'auto' }}>
  <Table columns={columns} data={data} rowKey="id" hoverable />
</div>
```

---

## Common Layout Constants

```typescript
const HEADER_HEIGHT = 60;
const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 64;
const CONTENT_MAX_WIDTH = 1280;
const FORM_MAX_WIDTH = 600;
const MODAL_WIDTH = 600;

const Z_INDEX = {
  sidebar: 50,
  header: 100,
  dropdown: 200,
  modal: 1000,
  toast: 1100,
};
```

---

## Card Grid Layout (using Grid)

```tsx
import { Grid, RdGridItem } from '../../components';

<Grid columns="repeat(auto-fill, minmax(220px, 1fr))" gap={16}>
  {items.map(item => (
    <RdGridItem key={item.id}>
      <Card>{item.content}</Card>
    </RdGridItem>
  ))}
</Grid>
```
