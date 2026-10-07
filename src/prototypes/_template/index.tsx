import React from 'react';
import { sysVar } from '@tokens/colors';

/**
 * Prototype Template
 * 
 * This is your starting point for creating a new prototype.
 * 
 * ## How to Use
 * 
 * 1. Copy this folder to a new location: `src/prototypes/YourPrototypeName/`
 * 2. Rename this file or create new files as needed
 * 3. Describe your UI to Cursor AI or paste a screenshot
 * 4. The AI will generate components using the Radiant design system
 * 
 * ## Available Components (72 total)
 *
 * Import from '../../components':
 *
 * **Layout Primitives (always prefer over inline flex/grid):**
 * - Horizontal, Vertical, View — flex layouts
 * - Grid, RdGrid, RdGridItem — CSS grid layouts
 * - SplitPane — resizable two-panel layout
 *
 * **Core UI:**
 * - Button (primary, secondary, tertiary variants)
 * - Alert (info, success, warning, failure, muted)
 * - Modal, ConfirmDialog, WizardModal, FormModal
 * - TextInput, TextArea, SearchInput, SearchBar
 * - Select, DatePicker, Checkbox, Radio, Toggle, SegmentedControl
 * - Tabs, Chip, Card, Avatar, Typography
 * - Icon (46 icons), Tooltip, Popover
 * - LoadingIndicator, ProgressBar, Pagination
 * - Sidebar, Stepper, Accordion, Divider
 * - Table, Menu, FilterDialog
 *
 * **Display & Content:**
 * - NoData — empty state with illustration slot
 * - Illustration — ThoughtSpot illustrations (no-data, error, success, welcome, etc.)
 * - ExplainerCard — educational card with icon + title + body
 * - Image — image with loading/error fallback
 * - Legend — color-keyed label list (chart legends)
 * - SafeHTML — sanitized HTML rendering
 * - FormControl — label + helper + error wrapper
 * - OverlayLoading — absolute-positioned loading overlay
 *
 * **Navigation & Interaction:**
 * - ActionMenu — compound context menu (ActionMenu.Item, ActionMenu.Group)
 * - VerticalStepper — vertical step progression
 * - List — flexible list with optional drag-and-drop
 * - Slider — range input
 * - ManagedList — list with add/remove/edit management
 * - Trending, Trending.Section — trending items display
 * - NestedCheckbox — checkbox tree with indeterminate parent
 * - ManageTags — tag creation and management
 *
 * **Form Extensions:**
 * - NumericFilterInput — numeric range input with operator
 * - DirectionControl — LTR/RTL direction selector
 * - ColorPicker — hex/rgb/palette color picker
 * - InputMentions — @mention autocomplete textarea
 * - FilterModal — filter configuration modal
 *
 * **Advanced:**
 * - Tree — recursive hierarchical list
 * - TreeTable — tree with columnar data
 * - Formatters — data formatters (Formatters.Text, .Number, .Line, .Interval, .Background, .Marker)
 * - Tour — guided walkthrough with spotlight
 * - RichTextEditor — WYSIWYG rich text editing
 * - DragDrop — DragDropProvider + useDraggable + useDroppable hooks
 * - FormBuilder — config-driven form renderer
 * - DynamicForm — FormBuilder with error state management
 * - FacetSortBar — search facet + sort controls bar
 *
 * ## Available Mock Data
 * 
 * Import from '../mocks':
 * - users (sample user profiles)
 * - analytics (chart and table data)
 * - navigation (menu structures)
 * - forms (dropdown options, filter values)
 * 
 * @example
 * ```tsx
 * import { Button, Modal, Alert } from '../../components';
 * import { users, analytics } from '../../mocks';
 * ```
 */

// Delete this placeholder and start building your prototype!
export const PrototypeTemplate: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Your Prototype</h1>
        <p style={styles.description}>
          Start building your prototype here. Describe what you want to create
          or paste a screenshot, and the AI will help generate the UI.
        </p>
        <div style={styles.placeholder}>
          <span style={styles.placeholderIcon}>🎨</span>
          <p style={styles.placeholderText}>
            Replace this with your prototype content
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: sysVar('background-sunken'),
    padding: '48px',
    fontFamily: 'var(--font-family-primary)',
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    marginBottom: '16px',
  },
  description: {
    fontSize: '16px',
    color: sysVar('content-secondary'),
    lineHeight: '24px',
    marginBottom: '32px',
  },
  placeholder: {
    backgroundColor: sysVar('background-base'),
    border: `2px dashed ${sysVar('border-default')}`,
    borderRadius: '12px',
    padding: '64px',
    textAlign: 'center' as const,
  },
  placeholderIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
  },
  placeholderText: {
    fontSize: '14px',
    color: sysVar('content-secondary'),
    margin: 0,
  },
};

export default PrototypeTemplate;
