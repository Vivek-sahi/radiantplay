import React from 'react';
import { systemColors, referenceColors } from '../tokens/colors';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  type: 'major' | 'minor' | 'patch';
  changes: {
    category: 'added' | 'changed' | 'fixed' | 'removed';
    items: string[];
  }[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '26.4.1c',
    date: '2026-04-08',
    title: 'Registry Split, Orchestrator v2, Liveboard System, Platform Tooling',
    type: 'major',
    changes: [
      {
        category: 'added',
        items: [
          'Registry split — registry-core.ts (upstream) + registry-mine.ts (designer) + thin merger eliminates merge conflicts for all designer forks',
          'Orchestrator tier system — intent-based classification (Tier 0–3) with 81% context reduction for median tasks',
          'Pre-implementation gate — 4 checks before code (component exists, CSS anti-patterns, icon name, forbidden words)',
          'Iteration loop detection — suggests batching after 3+ sequential changes',
          'Liveboard canvas 3-tier split — core (242), edit (238), advanced (100) with prerequisite chains',
          'Liveboard requirements gate — 4-question pre-build gate (mode, interactions, tile types, data)',
          'Shared tiles system — _shared/tiles/ with AnswerTile, ChartRenderer, and 12 chart types',
          'SalesDashboard prototype — Liveboard with view/edit modes and SpotterViz panel',
          'Platform version system — platformVersion.ts as single source of truth; version badge on 3 surfaces',
          'Component source badges — Figma / Scaligent / Custom on every component doc page',
          'Release tooling — scripts/release.sh, pre-push hook, install-maintainer-hooks.sh',
          '6 Claude Code skills — auto-activating with globs (component-inventory, content-guidelines, token-usage, layout-patterns, widget-patterns, modal-patterns)',
          'UserPromptSubmit hooks — Liveboard intent detection + post-compact convention recovery',
        ],
      },
      {
        category: 'changed',
        items: [
          'Skills and docs updated for registry split — sync-upstream, check-upstream, new-prototype, prototype-structure, FORK-WORKFLOW',
          'Homepage — space blue title, subtle card icons, shortened descriptions, footer easter egg',
          'ECharts lazy-loaded — 1.18 MB chunk deferred from startup to first chart render',
          'CLAUDE.md trimmed 36% (210 → 135 lines) — guidelines moved to on-demand skills',
          'All DS pages centred with maxWidth 1200px in RadiantLayout',
          'Documentation refreshed — README, SETUP-GUIDE, Onepager, prototyping-guide',
        ],
      },
      {
        category: 'fixed',
        items: [
          '0 TypeScript errors — icon name, TileMode import, NoteTileProps, unused variables resolved',
          'Avatar contrast — light background tokens swapped for saturated content tokens',
          'Vite 7.3.2 — high severity vulnerability patched',
          'Picomatch vulnerability patched, Figma Make package.json removed',
          'ConfirmDialog gradient override removed (non-Radiant)',
        ],
      },
      {
        category: 'removed',
        items: [
          'Cmdk prototype gitignored — 11 MB Figma Make export removed from designer forks',
          'Orphaned prototypes deleted — Homepage_example, ImpersonationV2, Liveboard, ModalPatterns',
          'liveboard-canvas.md (568 lines) — replaced by 3-tier canvas files',
        ],
      },
    ],
  },
  {
    version: '26.3.3a',
    date: '2026-03-17',
    title: 'Liveboard Template, New Prototypes, Project Rename',
    type: 'minor',
    changes: [
      {
        category: 'added',
        items: [
          'Liveboard template — starter with AnswerTile, KPI, bar chart, SpotterViz',
          'AdminLang prototype — admin CSV-based translation settings',
          'MiniSpotters prototype — domain-specific Spotter instances',
          'Liveboard scaffolding rules and IA guidelines (PR #4)',
          'Cursor → Claude Code setup guide',
          'Workflow skills: /start, /ship, /release, /status, /sync-upstream',
        ],
      },
      {
        category: 'changed',
        items: [
          'Project renamed: figmaradiant → radiantplay',
          'Playground gallery redesigned with component counts',
          'How it works → slide-based with tabs',
          'Homepage redesigned with getting started guide',
        ],
      },
      {
        category: 'removed',
        items: [
          'Liveboard, Admin Impersonation, MuseChat prototypes removed',
          '_examples folder archived',
        ],
      },
    ],
  },
  {
    version: '26.2.5a',
    date: '2026-03-05',
    title: 'UX Writing Rules, Gallery Redesign, Workflow Skills',
    type: 'minor',
    changes: [
      {
        category: 'added',
        items: [
          'UX writing guidelines integrated into Cursor agent (PR #1 by Yash Chauhan)',
          'How it works page converted to slide-based format',
          'Playground gallery redesign with latest prototype shortcut',
          'Cursor model guide for designers',
        ],
      },
      {
        category: 'changed',
        items: [
          'Project renamed: figmaradiant → radiantplay',
          'Stale docs archived, _examples removed',
        ],
      },
    ],
  },
  {
    version: '26.2.4a',
    date: '2026-03-02',
    title: 'Component Expansion — 35 New Components',
    type: 'minor',
    changes: [
      {
        category: 'added',
        items: [
          'Layout Primitives: Horizontal, Vertical, View — flex layout components that replace inline display:flex styles',
          'Grid / RdGrid / RdGridItem — CSS grid layout components with Scaligent-compatible API',
          'SplitPane — resizable two-panel layout using pointer-capture drag',
          'NoData — empty-state component with illustration, title, description, and action slots',
          'ExplainerCard — educational card with icon, title, description, and CTA (default + highlighted variants)',
          'Image — image component with loading/error fallback and aspect-ratio control',
          'Illustration — ThoughtSpot illustration wrapper (no-data, error, success, welcome, no-access, loading)',
          'Legend — color-keyed label list for chart legends, status keys, and data series',
          'SafeHTML — sanitized HTML renderer (strips scripts, event handlers, javascript: hrefs)',
          'OverlayLoading — absolute-positioned blocking loading overlay',
          'FormControl — label + helper text + error message wrapper for any form field',
          'SearchBar — full-featured search bar distinct from SearchInput; includes clear button and loading state',
          'ActionMenu — compound contextual menu with ActionMenu.Item and ActionMenu.Group sub-components',
          'VerticalStepper — vertical step progression with connector lines and expandable step content',
          'List — generic list with optional HTML5 drag-and-drop reordering',
          'Slider — styled range slider with fill gradient, labels, and optional tick marks',
          'ManagedList — list with add / remove / edit controls and optional search filtering',
          'Trending / Trending.Section — trending items display with count badges and trend direction indicators',
          'NestedCheckbox — checkbox tree with automatic indeterminate parent state',
          'ManageTags — tag creation (Enter or comma) and removal with optional suggestions dropdown',
          'NumericFilterInput — numeric range input with operator select (=, ≠, >, ≥, <, ≤, between)',
          'DirectionControl — LTR / Auto / RTL text-direction selector',
          'ColorPicker — color picker with hex (native), rgb, and palette swatch modes',
          'InputMentions — @mention autocomplete textarea with keyboard-navigable suggestions',
          'FilterModal — filter configuration modal with checkbox, radio, range, and search section types',
          'Tree — recursive hierarchical list with expand/collapse, selection, and optional checkboxes',
          'TreeTable — tree structure with columnar data in a CSS grid layout',
          'Formatters namespace — Formatters.Text, .Number (Intl.NumberFormat), .Line (SVG sparkline), .Interval, .Background, .Marker',
          'Tour — guided walkthrough with spotlight box-shadow overlay and getBoundingClientRect positioning',
          'RichTextEditor — contenteditable WYSIWYG editor with configurable toolbar',
          'DragDrop — DragDropProvider context + useDraggable, useDroppable, useDragAndDrop hooks (HTML5 DnD)',
          'FormBuilder — config-driven form renderer for 7 field types with inline validation',
          'DynamicForm — FormBuilder wrapper with managed state and hasDynamicFormError() utility export',
          'FacetSortBar — horizontal bar with facet pill toggles and sort selector',
        ],
      },
      {
        category: 'changed',
        items: [
          'Component count updated from 38 → 73 in registry and all UI displays',
          'component-inventory.md — 6 new decision-tree sections, 4 new combination patterns, layout-primitive rule',
          'figma-component-mapping.md — 27 new Figma layer → component mappings and 4 new pattern snippets',
          'layout-patterns.md — Layout Primitives section added at top; Card Grid pattern at bottom',
          'widget-patterns.md — ActionMenu, DragDrop, Tree, and Tour pattern sections appended',
          '_orchestration.md — component count updated, Rule #9 (use layout primitives) added',
          'Prototype template JSDoc updated to list all 73 available components',
        ],
      },
      {
        category: 'fixed',
        items: [
          'No new npm dependencies added — all 35 components use browser APIs and React only',
          'FormBuilder FormField type aliased as FormSchemaField at barrel-export level to avoid name clash with FormModal',
        ],
      },
    ],
  },
  {
    version: '26.2.2a',
    date: '2026-02-18',
    title: '3-Layer Color Token Migration',
    type: 'major',
    changes: [
      {
        category: 'added',
        items: [
          'Reference tokens layer (reference.ts) — 9 tonal scales with 12 stops each (00–100)',
          'System tokens layer (system.ts) — 42 semantic tokens (background, content, border) × light/dark modes',
          'Component tokens layer (component.ts) — 46 per-component tokens (button, chip, toggle) × light/dark modes',
          'CSS custom properties with rd-sys-color-* and rd-comp-color-* prefixes in tokens.css',
          'Built-in dark mode support via data-theme attribute and prefers-color-scheme media query',
          'System Tokens preview section on Color System page showing all 42 semantic tokens',
          'Updated Token Architecture page with accurate 3-layer documentation and code examples',
        ],
      },
      {
        category: 'changed',
        items: [
          'Migrated all 36 CSS module files from old --color-brand-* / --color-* variables to --rd-sys-color-* / --rd-comp-color-*',
          'Migrated all 48 TypeScript files from brandColors.* to systemColors / referenceColors',
          'Updated token count from 150+ to 290+ reflecting the expanded system',
          'Token Architecture page rewritten with Reference → System → Component flow',
          'Radiant Home page token section updated with new layer names and examples',
          'Color System page header updated to describe 3-layer architecture',
          'token-usage.md rule rewritten with new import paths and CSS variable names',
        ],
      },
      {
        category: 'removed',
        items: [
          'brand.ts — replaced by reference.ts',
          'alias.ts — functionality absorbed into system.ts',
          'mapped.ts — replaced by system.ts light/dark maps',
          'semantic.ts — replaced by system.ts and component.ts',
          'All legacy --color-brand-* and --color-* CSS custom properties',
        ],
      },
      {
        category: 'fixed',
        items: [
          'Dark mode override on macOS — added data-theme="light" to index.html to prevent prefers-color-scheme from overriding light theme',
          'Sidebar nav items now correctly show selected/active state on all pages',
        ],
      },
    ],
  },
  {
    version: '26.1.4a',
    date: '2026-01-30',
    title: 'Playground System, Modals, Navigation',
    type: 'minor',
    changes: [
      {
        category: 'added',
        items: [
          'ConfirmDialog component - confirmation dialog pattern based on DialogueAlert',
          'WizardModal component - multi-step wizard with progress bar',
          'FormModal component - form-optimized modal with validation',
          'FilterDialog component - filter selection with checkboxes',
          'Select component - dropdown selection with search',
          'Popover component - floating overlay with multiple placements',
          'LoadingIndicator component - spinner and loading overlay',
          'Component Status page - track all radiant-code components',
          'Changelog page - version history of project changes',
          'Example Prototypes section in navigation',
          'Settings Panel demo page',
          'Data Dashboard demo page',
        ],
      },
      {
        category: 'changed',
        items: [
          'Navigation structure updated with new sections',
          'Component count now derived dynamically from registry',
          'Sidebar reorganized with Modal Patterns and Overlay sections',
        ],
      },
      {
        category: 'fixed',
        items: [
          'React Router integration for URL-based navigation',
          'TypeScript build errors for unused variables',
        ],
      },
    ],
  },
  {
    version: '26.1.3a',
    date: '2026-01-21',
    title: 'Initial Release',
    type: 'major',
    changes: [
      {
        category: 'added',
        items: [
          'Design token system: Colors, Typography, Spacing, Radius, Shadows, Borders',
          'Button component - Primary, Secondary, Tertiary variants with icons',
          'Checkbox component - Checked, Unchecked, Indeterminate states',
          'Radio component - Radio button groups',
          'Toggle component - Switch with label positioning',
          'TextInput component - Text input with labels and validation',
          'SearchInput component - Search with icon',
          'Chip component - Attribute, Measure, Filter, Skeleton types',
          'Alert component - Info, Success, Warning, Failure, Muted statuses',
          'Modal component - Base modal dialog',
          'Tabs component - Tab navigation',
          'Sidebar component - Navigation sidebar',
          'Icon system with 46+ icons',
          'Interactive Playground with Inspect mode',
          'Token Architecture documentation',
          'Component documentation pages with live examples',
        ],
      },
    ],
  },
  {
    version: '26.1.2a',
    date: '2026-01-20',
    title: 'Project Setup',
    type: 'minor',
    changes: [
      {
        category: 'added',
        items: [
          'React + TypeScript + Vite project setup',
          'CSS Modules for component styling',
          'Design token infrastructure',
          'Project structure and conventions',
        ],
      },
    ],
  },
];

const categoryColors = {
  added: { bg: systemColors.light['background-success'], text: systemColors.light['content-success'], label: 'Added' },
  changed: { bg: systemColors.light['background-warning'], text: systemColors.light['content-warning'], label: 'Changed' },
  fixed: { bg: systemColors.light['background-information'], text: systemColors.light['content-information'], label: 'Fixed' },
  removed: { bg: systemColors.light['background-failure'], text: systemColors.light['content-failure'], label: 'Removed' },
};

const typeColors = {
  major: systemColors.light['content-failure'],
  minor: systemColors.light['content-brand'],
  patch: systemColors.light['content-tertiary'],
};

export const ChangelogPage: React.FC = () => {
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Changelog</h1>
        <p style={styles.description}>
          A detailed log of all changes, updates, and improvements to the Radiant Design System.
        </p>
      </div>

      {/* Timeline */}
      <div style={styles.timeline}>
        {CHANGELOG.map((entry, index) => (
          <div key={entry.version} style={styles.entry}>
            {/* Version Header */}
            <div style={styles.entryHeader}>
              <div style={styles.versionInfo}>
                <span
                  style={{
                    ...styles.versionBadge,
                    backgroundColor: typeColors[entry.type],
                  }}
                >
                  v{entry.version}
                </span>
                <span style={styles.entryTitle}>{entry.title}</span>
              </div>
              <span style={styles.entryDate}>{entry.date}</span>
            </div>

            {/* Changes */}
            <div style={styles.changesContainer}>
              {entry.changes.map((change, changeIndex) => (
                <div key={changeIndex} style={styles.changeSection}>
                  <span
                    style={{
                      ...styles.categoryBadge,
                      backgroundColor: categoryColors[change.category].bg,
                      color: categoryColors[change.category].text,
                    }}
                  >
                    {categoryColors[change.category].label}
                  </span>
                  <ul style={styles.changesList}>
                    {change.items.map((item, itemIndex) => (
                      <li key={itemIndex} style={styles.changeItem}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Connector line (except for last item) */}
            {index < CHANGELOG.length - 1 && <div style={styles.connector} />}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
  },
  header: {
    marginBottom: '40px',
  },
  title: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '36px',
    fontWeight: 700,
    color: systemColors.light['content-primary'],
    marginBottom: '12px',
  },
  description: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '16px',
    fontWeight: 400,
    color: systemColors.light['content-secondary'],
    lineHeight: '26px',
    maxWidth: '700px',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  entry: {
    position: 'relative',
    backgroundColor: systemColors.light['background-base'],
    borderRadius: '12px',
    border: `1px solid ${systemColors.light['background-subtle']}`,
    padding: '24px',
  },
  entryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  versionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  versionBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontFamily: '"SF Mono", Monaco, monospace',
    fontSize: '13px',
    fontWeight: 600,
    color: systemColors.light['background-base'],
  },
  entryTitle: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '18px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
  },
  entryDate: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    color: systemColors.light['content-tertiary'],
  },
  changesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  changeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    padding: '4px 10px',
    borderRadius: '4px',
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  changesList: {
    margin: 0,
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  changeItem: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    color: referenceColors.gray['70'],
    lineHeight: '22px',
  },
  connector: {
    position: 'absolute',
    bottom: '-32px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '2px',
    height: '32px',
    backgroundColor: systemColors.light['background-subtle'],
  },
};

export default ChangelogPage;
