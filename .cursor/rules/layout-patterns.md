---
description: Layout templates for dashboards, admin panels, settings pages, form pages, and data table pages. Use when building a full page layout, choosing between AppShell/sidebar/content area patterns, or applying responsive breakpoints. Do NOT use for individual widget behavior (see widget-patterns.md) or modal sizing (see modal-patterns.md).
alwaysApply: false
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
│              │                                      │
│              │                                      │
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
    {/* Main content rendered here */}
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
│  │ Card    │ │ Card    │ │ Card    │ │ Card    │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
├─────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────┐    │
│  │                    │  │                    │    │
│  │   Chart/Graph      │  │   Chart/Graph      │    │
│  │                    │  │                    │    │
│  └────────────────────┘  └────────────────────┘    │
├─────────────────────────────────────────────────────┤
│  Data Table                                         │
└─────────────────────────────────────────────────────┘
```

```tsx
const DashboardLayout: React.FC = () => {
  return (
    <div style={styles.container}>
      {/* Header */}
      <PageHeader title="Dashboard" />

      {/* Tabs */}
      <Tabs tabs={tabItems} activeTab={active} onTabChange={setActive} />

      {/* Metrics Grid */}
      <div style={styles.metricsGrid}>
        {metrics.map(metric => (
          <MetricCard key={metric.id} {...metric} />
        ))}
      </div>

      {/* Charts Row */}
      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <Chart data={chartData1} />
        </div>
        <div style={styles.chartCard}>
          <Chart data={chartData2} />
        </div>
      </div>

      {/* Data Table */}
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
    gap: `${spacing.D}px`,  // 16px
    marginBottom: `${spacing.F}px`,  // 24px
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

```
┌──────────────┬──────────────────────────────────────┐
│              │  Section Title                       │
│   Section    │  ┌────────────────────────────────┐  │
│   Sidebar    │  │ Text Input                     │  │
│              │  └────────────────────────────────┘  │
│  [Section 1] │  ┌────────────────────────────────┐  │
│   Section 2  │  │ Text Input                     │  │
│   Section 3  │  └────────────────────────────────┘  │
│              │  ┌────────────────────────────────┐  │
│              │  │ Toggle                         │  │
│              │  └────────────────────────────────┘  │
│              ├──────────────────────────────────────┤
│              │  [Cancel]              [Save]        │
└──────────────┴──────────────────────────────────────┘
```

```tsx
const FormPageLayout: React.FC = () => {
  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <nav style={styles.sidebar}>
        {sections.map(section => (
          <div
            key={section.id}
            style={{
              ...styles.sectionItem,
              ...(active === section.id ? styles.sectionItemActive : {}),
            }}
            onClick={() => setActive(section.id)}
          >
            {section.label}
          </div>
        ))}
      </nav>

      {/* Form Content */}
      <div style={styles.formContainer}>
        <h2 style={styles.sectionTitle}>{currentSection.label}</h2>

        <div style={styles.formFields}>
          <TextInput label="Name" value={name} onChange={setName} />
          <TextInput label="Email" value={email} onChange={setEmail} />
          <Toggle label="Enable notifications" checked={enabled} onChange={setEnabled} />
        </div>

        {/* Footer Actions */}
        <div style={styles.footer}>
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">Save</Button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: systemColors.light['background-sunken'],
  },
  sidebar: {
    width: '200px',
    backgroundColor: systemColors.light['background-base'],
    borderRight: `1px solid ${systemColors.light['border-subtle']}`,
    padding: `${spacing.D}px 0`,
  },
  sectionItem: {
    padding: `${spacing.B}px ${spacing.D}px`,
    cursor: 'pointer',
    fontSize: '14px',
    color: systemColors.light['content-secondary'],
    borderLeft: '3px solid transparent',
  },
  sectionItemActive: {
    color: systemColors.light['content-brand'],
    backgroundColor: `${systemColors.light['content-brand']}08`,
    borderLeftColor: systemColors.light['content-brand'],
    fontWeight: 500,
  },
  formContainer: {
    flex: 1,
    padding: `${spacing.F}px`,
    backgroundColor: systemColors.light['background-base'],
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    marginBottom: `${spacing.F}px`,
  },
  formFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing.E}px`,  // 20px between fields
    maxWidth: '600px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: `${spacing.D}px`,
    marginTop: `${spacing.H}px`,  // 32px
    paddingTop: `${spacing.D}px`,
    borderTop: `1px solid ${systemColors.light['border-subtle']}`,
  },
};
```

---

## Modal/Wizard Layout

```
┌────────────────────────────────────────────┐
│  Context Label (small, gray)               │
│  Step Title (large, bold)                  │
├────────────────────────────────────────────┤
│                                            │
│  Content Area                              │
│  (Scrollable if needed)                    │
│                                            │
│                                            │
├────────────────────────────────────────────┤
│  [====][====][    ][    ]  Progress Bar    │
├────────────────────────────────────────────┤
│  Cancel              [Back]  [Next/Submit] │
└────────────────────────────────────────────┘
```

```tsx
const WizardModalLayout: React.FC = () => {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.contextLabel}>Add new group</div>
          <h2 style={styles.stepTitle}>{steps[currentStep].title}</h2>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {renderStepContent()}
        </div>

        {/* Progress */}
        <div style={styles.progress}>
          {steps.map((_, index) => (
            <div
              key={index}
              style={{
                ...styles.progressSegment,
                ...(index <= currentStep ? styles.progressActive : {}),
              }}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onClose}>Cancel</button>
          <div style={styles.buttonGroup}>
            {currentStep > 0 && (
              <Button variant="secondary" onClick={handleBack}>Back</Button>
            )}
            <Button variant="primary" onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Create' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(29, 35, 47, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '600px',
    maxHeight: '90vh',
    backgroundColor: systemColors.light['background-base'],
    borderRadius: '6px',
    boxShadow: '0px 24px 32px rgba(25, 35, 49, 0.16)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: `${spacing.E}px ${spacing.F}px`,  // 20px 24px
    borderBottom: `1px solid ${systemColors.light['border-subtle']}`,
  },
  contextLabel: {
    fontSize: '14px',
    color: systemColors.light['content-tertiary'],
    marginBottom: `${spacing.A}px`,
  },
  stepTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    margin: 0,
  },
  content: {
    flex: 1,
    padding: `${spacing.F}px`,  // 24px
    overflowY: 'auto',
    minHeight: '300px',
  },
  progress: {
    display: 'flex',
    gap: '6px',
    height: '4px',
  },
  progressSegment: {
    flex: 1,
    height: '4px',
    borderRadius: '2px',
    backgroundColor: systemColors.light['border-subtle'],
  },
  progressActive: {
    backgroundColor: systemColors.light['content-brand'],
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.E}px ${spacing.F}px`,  // 20px 24px
    backgroundColor: systemColors.light['background-sunken'],
  },
  cancelButton: {
    background: 'none',
    border: 'none',
    color: systemColors.light['content-brand'],
    fontSize: '14px',
    cursor: 'pointer',
    padding: `6px ${spacing.A}px`,
  },
  buttonGroup: {
    display: 'flex',
    gap: `${spacing.D}px`,
  },
};
```

---

## Data Table Page Layout

```
┌─────────────────────────────────────────────────────┐
│  Breadcrumb: Home > Section > Page                  │
│  Page Title                                         │
│  [Tab 1] [Tab 2]                                   │
├─────────────────────────────────────────────────────┤
│  [Search...]                      [Filter] [+ Add]  │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐│
│  │ Name        │ Status   │ Created  │ Actions    ││
│  ├─────────────────────────────────────────────────┤│
│  │ Item 1      │ Active   │ 2 days   │ ...        ││
│  │ Item 2      │ Pending  │ 1 week   │ ...        ││
│  │ Item 3      │ Active   │ 3 months │ ...        ││
│  └─────────────────────────────────────────────────┘│
│                              < 1 2 3 4 5 >          │
└─────────────────────────────────────────────────────┘
```

```tsx
const DataTablePageLayout: React.FC = () => {
  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.pageHeader}>
        {/* Breadcrumb */}
        <div style={styles.breadcrumb}>
          <span>Home</span>
          <Icon name="chevron-right" size="xs" />
          <span>Section</span>
          <Icon name="chevron-right" size="xs" />
          <span style={{ color: systemColors.light['content-primary'] }}>Page</span>
        </div>

        <h1 style={styles.title}>Page Title</h1>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <SearchInput
            placeholder="Search..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <div style={styles.actions}>
          <Button variant="secondary" icon="filter" iconPosition="leading">Filter</Button>
          <Button variant="primary" icon="plus" iconPosition="leading">Add item</Button>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <Table
          columns={columns}
          data={filteredData}
          rowKey="id"
          hoverable
        />
      </div>

      {/* Pagination */}
      <div style={styles.pagination}>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: `${spacing.F}px ${spacing.H}px`,
    backgroundColor: systemColors.light['background-base'],
  },
  pageHeader: {
    marginBottom: `${spacing.D}px`,
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.B}px`,
    fontSize: '13px',
    color: systemColors.light['content-tertiary'],
    marginBottom: `${spacing.B}px`,
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    margin: 0,
    marginBottom: `${spacing.D}px`,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: `${spacing.D}px`,
  },
  searchWrapper: {
    width: '260px',
  },
  actions: {
    display: 'flex',
    gap: `${spacing.C}px`,
  },
  tableContainer: {
    border: `1px solid ${systemColors.light['border-subtle']}`,
    borderRadius: '8px',
    overflow: 'hidden',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: `${spacing.D}px`,
  },
};
```

---

## Responsive Breakpoints

| Breakpoint | Width | Use Case |
|------------|-------|----------|
| Mobile | < 768px | Stack layouts, hide sidebar |
| Tablet | 768px - 1024px | Collapsible sidebar |
| Desktop | > 1024px | Full layout |

### useBreakpoint Hook (recommended pattern)

```typescript
import { useState, useEffect } from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => {
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      setBp(w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return bp;
}

// Usage
const MyPage: React.FC = () => {
  const breakpoint = useBreakpoint();
  return (
    <AppShell
      hideSidebar={breakpoint === 'mobile'}
      // ... other props
    >
      <div style={{ padding: breakpoint === 'mobile' ? spacing.D : spacing.H }}>
        {/* content */}
      </div>
    </AppShell>
  );
};
```

### Responsive Grid Pattern (content cards / metric tiles)

**Always use `auto-fill` + `minmax` — never hard-code column counts.**

```typescript
// GOOD — collapses automatically as viewport narrows
gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))'

// BAD — clips on smaller screens
gridTemplateColumns: 'repeat(4, 1fr)'
gridTemplateColumns: '48px 32px 1fr 180px 140px 100px 60px'
```

Full example:

```tsx
import { spacing } from '../../tokens/spacing';

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: spacing.F,   // 24px
};
```

### Scrollable Table Pattern

Wrap every `<Table>` in an `overflowX: 'auto'` container so it scrolls horizontally on narrow screens rather than clipping:

```tsx
<div style={{ overflowX: 'auto' }}>
  <Table columns={columns} data={data} rowKey="id" hoverable />
</div>
```

### AppShell Responsive Collapse

`AppShell` accepts a `hideSidebar` prop that collapses the left sidebar:

```tsx
<AppShell
  hideSidebar={breakpoint === 'mobile'}
  headerProps={...}
  sidebarProps={...}
>
  {children}
</AppShell>
```

---

## Common Layout Constants

```typescript
// Header heights
const HEADER_HEIGHT = 60;

// Sidebar widths
const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 64;

// Content max widths
const CONTENT_MAX_WIDTH = 1280;
const FORM_MAX_WIDTH = 600;
const MODAL_WIDTH = 600;

// Z-index layers
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
