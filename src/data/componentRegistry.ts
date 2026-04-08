/**
 * Component Registry
 *
 * Comprehensive metadata for all Radiant design system components.
 * Tracks Figma sync status, component states, and source information.
 */
import { iconRegistry } from '../components/icons/registry';

export type ComponentSource = 'figma' | 'scaligent' | 'custom';
export type ComponentStatus = 'stable' | 'beta' | 'new' | 'deprecated';

export interface ComponentMeta {
  id: string;
  name: string;
  description: string;
  states: string[];
  path: string;
  figmaNodeId?: string;
  figmaFileKey?: string;
  lastFigmaSync?: string;
  lastModified: string;
  source: ComponentSource;
  status: ComponentStatus;
  variants: number;
  author?: string;
  category: string;
}

/**
 * Component registry with metadata for all Radiant components
 */
export const componentRegistry: ComponentMeta[] = [
  // Selection Controls
  {
    id: 'button',
    name: 'Button',
    description: 'Primary, secondary, and tertiary buttons for actions',
    states: ['default', 'hover', 'active', 'disabled', 'loading'],
    path: '/radiant/components/button',
    figmaNodeId: '1234:5678',
    figmaFileKey: 'ABC123',
    lastFigmaSync: '2026-01-28',
    lastModified: '2026-01-30',
    source: 'figma',
    status: 'stable',
    variants: 3,
    author: 'Design Team',
    category: 'Selection Controls',
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    description: 'Selection controls for multiple choices',
    states: ['unchecked', 'checked', 'indeterminate', 'disabled'],
    path: '/radiant/components/checkbox',
    figmaNodeId: '2345:6789',
    figmaFileKey: 'ABC123',
    lastFigmaSync: '2026-01-25',
    lastModified: '2026-01-28',
    source: 'figma',
    status: 'stable',
    variants: 3,
    author: 'Design Team',
    category: 'Selection Controls',
  },
  {
    id: 'radio',
    name: 'Radio',
    description: 'Single selection from a group of options',
    states: ['unselected', 'selected', 'disabled'],
    path: '/radiant/components/radio',
    figmaNodeId: '3456:7890',
    figmaFileKey: 'ABC123',
    lastFigmaSync: '2026-01-25',
    lastModified: '2026-01-25',
    source: 'figma',
    status: 'stable',
    variants: 2,
    author: 'Design Team',
    category: 'Selection Controls',
  },
  {
    id: 'toggle',
    name: 'Toggle',
    description: 'Switch control for on/off states',
    states: ['off', 'on', 'disabled'],
    path: '/radiant/components/toggle',
    figmaNodeId: '4567:8901',
    figmaFileKey: 'ABC123',
    lastFigmaSync: '2026-01-20',
    lastModified: '2026-01-25',
    source: 'figma',
    status: 'stable',
    variants: 2,
    author: 'Design Team',
    category: 'Selection Controls',
  },

  // Inputs
  {
    id: 'textinput',
    name: 'TextInput',
    description: 'Text input fields with labels and validation',
    states: ['default', 'focus', 'error', 'success', 'disabled'],
    path: '/radiant/components/textinput',
    figmaNodeId: '5678:9012',
    figmaFileKey: 'ABC123',
    lastFigmaSync: '2026-01-25',
    lastModified: '2026-01-28',
    source: 'figma',
    status: 'stable',
    variants: 3,
    author: 'Design Team',
    category: 'Inputs',
  },
  {
    id: 'searchinput',
    name: 'SearchInput',
    description: 'Search input with clear button',
    states: ['empty', 'filled', 'focus', 'disabled'],
    path: '/radiant/components/searchinput',
    figmaNodeId: '6789:0123',
    figmaFileKey: 'ABC123',
    lastFigmaSync: '2026-01-20',
    lastModified: '2026-01-22',
    source: 'figma',
    status: 'stable',
    variants: 2,
    author: 'Design Team',
    category: 'Inputs',
  },
  {
    id: 'select',
    name: 'Select',
    description: 'Dropdown select component with search',
    states: ['default', 'open', 'selected', 'disabled'],
    path: '/radiant/components/select',
    figmaNodeId: '7890:1234',
    figmaFileKey: 'ABC123',
    lastFigmaSync: '2026-01-25',
    lastModified: '2026-01-28',
    source: 'figma',
    status: 'new',
    variants: 3,
    author: 'Design Team',
    category: 'Inputs',
  },

  // Feedback
  {
    id: 'alert',
    name: 'Alert',
    description: 'Status alert banners for feedback',
    states: ['info', 'success', 'warning', 'error'],
    path: '/radiant/components/alert',
    figmaNodeId: '8901:2345',
    figmaFileKey: 'ABC123',
    lastFigmaSync: '2026-01-20',
    lastModified: '2026-01-22',
    source: 'figma',
    status: 'stable',
    variants: 5,
    author: 'Design Team',
    category: 'Feedback',
  },
  {
    id: 'modal',
    name: 'Modal',
    description: 'Dialog modal for focused interactions',
    states: ['open', 'closed'],
    path: '/radiant/components/modal',
    figmaNodeId: '9012:3456',
    figmaFileKey: 'ABC123',
    lastFigmaSync: '2026-01-25',
    lastModified: '2026-01-28',
    source: 'figma',
    status: 'stable',
    variants: 2,
    author: 'Design Team',
    category: 'Feedback',
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    description: 'Lightweight tooltip for contextual info',
    states: ['hidden', 'visible'],
    path: '/radiant/components/tooltip',
    figmaNodeId: '0123:4567',
    figmaFileKey: 'ABC123',
    lastFigmaSync: '2026-01-30',
    lastModified: '2026-01-30',
    source: 'figma',
    status: 'new',
    variants: 4,
    author: 'Design Team',
    category: 'Feedback',
  },
  {
    id: 'popover',
    name: 'Popover',
    description: 'Interactive overlay for rich content',
    states: ['closed', 'open'],
    path: '/radiant/components/popover',
    figmaNodeId: '1234:5679',
    figmaFileKey: 'ABC123',
    lastFigmaSync: '2026-01-30',
    lastModified: '2026-01-30',
    source: 'figma',
    status: 'new',
    variants: 2,
    author: 'Design Team',
    category: 'Feedback',
  },

  // Data Display
  {
    id: 'table',
    name: 'Table',
    description: 'Data table with sorting and selection',
    states: ['default', 'loading', 'empty', 'error'],
    path: '/radiant/components/table',
    figmaNodeId: '2345:6790',
    figmaFileKey: 'ABC123',
    lastFigmaSync: '2026-01-30',
    lastModified: '2026-01-30',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Data Display',
  },
  {
    id: 'chip',
    name: 'Chip',
    description: 'Chips for tags, filters, and selections',
    states: ['default', 'hover', 'pressed', 'disabled'],
    path: '/radiant/components/chip',
    figmaNodeId: '3456:7891',
    figmaFileKey: 'ABC123',
    lastFigmaSync: '2026-01-28',
    lastModified: '2026-01-28',
    source: 'figma',
    status: 'stable',
    variants: 4,
    author: 'Design Team',
    category: 'Data Display',
  },

  // Navigation
  {
    id: 'tabs',
    name: 'Tabs',
    description: 'Tab navigation for content sections',
    states: ['default', 'active', 'disabled'],
    path: '/radiant/components/tabs',
    figmaNodeId: '4567:8902',
    figmaFileKey: 'ABC123',
    lastFigmaSync: '2026-01-20',
    lastModified: '2026-01-22',
    source: 'figma',
    status: 'stable',
    variants: 2,
    author: 'Design Team',
    category: 'Navigation',
  },

  // Phase 2 Components (Core)
  {
    id: 'loadingindicator',
    name: 'LoadingIndicator',
    description: 'Spinner indicators for loading states',
    states: ['spinning'],
    path: '/radiant/components/loadingindicator',
    lastModified: '2026-01-30',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Feedback',
  },
  {
    id: 'avatar',
    name: 'Avatar',
    description: 'User avatar with initials fallback and badges',
    states: ['default', 'with-image', 'with-badge'],
    path: '/radiant/components/avatar',
    lastModified: '2026-01-30',
    source: 'scaligent',
    status: 'new',
    variants: 6,
    author: 'Engineering Team',
    category: 'Data Display',
  },
  {
    id: 'card',
    name: 'Card',
    description: 'Content container with header, body, and footer',
    states: ['default', 'selected', 'disabled', 'interactive'],
    path: '/radiant/components/card',
    lastModified: '2026-01-30',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Layout',
  },
  {
    id: 'typography',
    name: 'Typography',
    description: 'Text component with V2 typography variants',
    states: ['default'],
    path: '/radiant/typography',
    lastModified: '2026-01-30',
    source: 'scaligent',
    status: 'new',
    variants: 20,
    author: 'Engineering Team',
    category: 'Typography',
  },
  {
    id: 'divider',
    name: 'Divider',
    description: 'Horizontal and vertical line separators',
    states: ['horizontal', 'vertical'],
    path: '/radiant/components/divider',
    lastModified: '2026-01-30',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Layout',
  },
  {
    id: 'link',
    name: 'Link',
    description: 'Styled anchor element for navigation',
    states: ['default', 'hover', 'disabled'],
    path: '/radiant/components/link',
    lastModified: '2026-01-30',
    source: 'scaligent',
    status: 'new',
    variants: 4,
    author: 'Engineering Team',
    category: 'Navigation',
  },

  // Phase 3 Components (Interactive)
  {
    id: 'accordion',
    name: 'Accordion',
    description: 'Collapsible content sections',
    states: ['collapsed', 'expanded'],
    path: '/radiant/components/accordion',
    lastModified: '2026-01-30',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Layout',
  },
  {
    id: 'menu',
    name: 'Menu',
    description: 'Dropdown menu for actions',
    states: ['closed', 'open'],
    path: '/radiant/components/menu',
    lastModified: '2026-01-30',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Navigation',
  },
  {
    id: 'pagination',
    name: 'Pagination',
    description: 'Page navigation controls',
    states: ['default'],
    path: '/radiant/components/pagination',
    lastModified: '2026-01-30',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Navigation',
  },
  {
    id: 'progressbar',
    name: 'ProgressBar',
    description: 'Horizontal progress indicator',
    states: ['default', 'indeterminate'],
    path: '/radiant/components/progressbar',
    lastModified: '2026-01-30',
    source: 'scaligent',
    status: 'new',
    variants: 4,
    author: 'Engineering Team',
    category: 'Feedback',
  },
  {
    id: 'stepper',
    name: 'Stepper',
    description: 'Multi-step process indicator',
    states: ['active', 'completed', 'pending'],
    path: '/radiant/components/stepper',
    lastModified: '2026-01-30',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Navigation',
  },

  // Phase 4 Components (Advanced)
  {
    id: 'datepicker',
    name: 'DatePicker',
    description: 'Date selection input with calendar dropdown',
    states: ['default', 'open', 'error'],
    path: '/radiant/components/datepicker',
    lastModified: '2026-01-30',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Inputs',
  },
  {
    id: 'segmentedcontrol',
    name: 'SegmentedControl',
    description: 'Mutually exclusive option segments',
    states: ['default', 'selected', 'disabled'],
    path: '/radiant/components/segmentedcontrol',
    lastModified: '2026-02-01',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Inputs',
  },
  {
    id: 'textarea',
    name: 'TextArea',
    description: 'Multi-line text input with character counter',
    states: ['default', 'focus', 'error', 'disabled'],
    path: '/radiant/components/textarea',
    lastModified: '2026-02-01',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Inputs',
  },
  {
    id: 'toast',
    name: 'Toast',
    description: 'Temporary notification messages',
    states: ['info', 'success', 'warning', 'error'],
    path: '/radiant/components/toast',
    lastModified: '2026-02-01',
    source: 'scaligent',
    status: 'new',
    variants: 4,
    author: 'Engineering Team',
    category: 'Feedback',
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Vertical navigation sidebar with sections',
    states: ['expanded', 'collapsed'],
    path: '/radiant/components/sidebar',
    lastModified: '2026-01-30',
    source: 'figma',
    status: 'stable',
    variants: 2,
    author: 'Design Team',
    category: 'Navigation',
  },

  // Composite / Pattern Components
  {
    id: 'confirmdialog',
    name: 'ConfirmDialog',
    description: 'Pre-built confirmation dialog modal',
    states: ['open', 'closed'],
    path: '/radiant/components/confirmdialog',
    lastModified: '2026-02-01',
    source: 'custom',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Feedback',
  },
  {
    id: 'wizardmodal',
    name: 'WizardModal',
    description: 'Multi-step wizard dialog with progress',
    states: ['open', 'closed'],
    path: '/radiant/components/wizardmodal',
    lastModified: '2026-02-01',
    source: 'custom',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Feedback',
  },
  {
    id: 'filterdialog',
    name: 'FilterDialog',
    description: 'Modal dialog for filtering with search and multi-select',
    states: ['open', 'closed'],
    path: '/radiant/components/filterdialog',
    lastModified: '2026-02-01',
    source: 'custom',
    status: 'new',
    variants: 1,
    author: 'Engineering Team',
    category: 'Feedback',
  },
  {
    id: 'formmodal',
    name: 'FormModal',
    description: 'Modal with built-in form layout and validation',
    states: ['open', 'closed'],
    path: '/radiant/components/formmodal',
    lastModified: '2026-02-01',
    source: 'custom',
    status: 'new',
    variants: 1,
    author: 'Engineering Team',
    category: 'Feedback',
  },
  {
    id: 'icongallery',
    name: 'IconGallery',
    description: 'Browsable gallery of available icons',
    states: ['default'],
    path: '/radiant/components/icongallery',
    lastModified: '2026-01-30',
    source: 'custom',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Utilities',
  },
  {
    id: 'globalheader',
    name: 'GlobalHeader',
    description: 'Reusable global app header with search and profile actions',
    states: ['default', 'search-input', 'search-trigger'],
    path: '/radiant/components/globalheader',
    lastModified: '2026-02-14',
    source: 'custom',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Widgets',
  },
  {
    id: 'appsidebar',
    name: 'AppSidebar',
    description: 'Multi-tab application sidebar with category navigation',
    states: ['default', 'overlay', 'highlighted-item'],
    path: '/radiant/components/appsidebar',
    lastModified: '2026-02-14',
    source: 'custom',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Widgets',
  },
  {
    id: 'appshell',
    name: 'AppShell',
    description: 'Application shell layout that composes GlobalHeader and AppSidebar',
    states: ['sidebar-visible', 'sidebar-hidden', 'sidebar-overlay'],
    path: '/radiant/components/appshell',
    lastModified: '2026-02-14',
    source: 'custom',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Widgets',
  },

  // ─── Phase 1 · Layout Primitives ─────────────────────────────────────────
  {
    id: 'horizontal',
    name: 'Horizontal',
    description: 'Flex-row layout primitive — replaces inline display:flex row styles',
    states: ['default'],
    path: '/radiant/components/horizontal',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 1,
    author: 'Engineering Team',
    category: 'Layout Primitives',
  },
  {
    id: 'vertical',
    name: 'Vertical',
    description: 'Flex-column layout primitive — replaces inline display:flex column styles',
    states: ['default'],
    path: '/radiant/components/vertical',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 1,
    author: 'Engineering Team',
    category: 'Layout Primitives',
  },
  {
    id: 'view',
    name: 'View',
    description: 'Generic flex container with configurable direction, alignment, and gap',
    states: ['default'],
    path: '/radiant/components/view',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 1,
    author: 'Engineering Team',
    category: 'Layout Primitives',
  },
  {
    id: 'grid',
    name: 'Grid / RdGrid',
    description: 'CSS grid layout — includes Grid, RdGrid (alias), and RdGridItem sub-components',
    states: ['default'],
    path: '/radiant/components/grid',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Layout Primitives',
  },
  {
    id: 'splitpane',
    name: 'SplitPane',
    description: 'Resizable two-panel layout with pointer-drag divider',
    states: ['default', 'dragging'],
    path: '/radiant/components/splitpane',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Layout Primitives',
  },

  // ─── Phase 1 · Display & Content ─────────────────────────────────────────
  {
    id: 'nodata',
    name: 'NoData',
    description: 'Empty-state placeholder with illustration, title, description, and CTA slots',
    states: ['default', 'with-action'],
    path: '/radiant/components/nodata',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Display & Content',
  },
  {
    id: 'explainercard',
    name: 'ExplainerCard',
    description: 'Educational card with icon, title, description, and optional CTA',
    states: ['default', 'highlighted'],
    path: '/radiant/components/explainercard',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Display & Content',
  },
  {
    id: 'image',
    name: 'Image',
    description: 'Image component with loading error fallback and aspect-ratio control',
    states: ['default', 'loading', 'error'],
    path: '/radiant/components/image',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Display & Content',
  },
  {
    id: 'illustration',
    name: 'Illustration',
    description: 'ThoughtSpot illustration wrapper — no-data, error, success, welcome, and more',
    states: ['no-data', 'error', 'success', 'welcome', 'no-access', 'loading'],
    path: '/radiant/components/illustration',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 4,
    author: 'Engineering Team',
    category: 'Display & Content',
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Color-keyed label list for chart legends and status keys',
    states: ['horizontal', 'vertical'],
    path: '/radiant/components/legend',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Display & Content',
  },
  {
    id: 'safehtml',
    name: 'SafeHTML',
    description: 'Sanitized HTML renderer — strips scripts, event handlers, and javascript: hrefs',
    states: ['default'],
    path: '/radiant/components/safehtml',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 1,
    author: 'Engineering Team',
    category: 'Display & Content',
  },
  {
    id: 'overlayloading',
    name: 'OverlayLoading',
    description: 'Absolute-positioned loading overlay that blocks interaction on its parent',
    states: ['visible', 'hidden', 'transparent'],
    path: '/radiant/components/overlayloading',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Display & Content',
  },

  // ─── Phase 1+3 · Form Extensions ─────────────────────────────────────────
  {
    id: 'formcontrol',
    name: 'FormControl',
    description: 'Label + helper text + error message wrapper for any form field',
    states: ['default', 'error', 'disabled'],
    path: '/radiant/components/formcontrol',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Form Extensions',
  },
  {
    id: 'searchbar',
    name: 'SearchBar',
    description: 'Full-featured search bar with leading icon, clear button, and loading state',
    states: ['empty', 'filled', 'loading', 'focus'],
    path: '/radiant/components/searchbar',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Form Extensions',
  },
  {
    id: 'numericfilterinput',
    name: 'NumericFilterInput',
    description: 'Numeric range input with operator select (=, ≠, >, ≥, <, ≤, between)',
    states: ['default', 'between', 'disabled'],
    path: '/radiant/components/numericfilterinput',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 7,
    author: 'Engineering Team',
    category: 'Form Extensions',
  },
  {
    id: 'directioncontrol',
    name: 'DirectionControl',
    description: 'LTR / Auto / RTL text-direction selector with directional icons',
    states: ['ltr', 'auto', 'rtl', 'disabled'],
    path: '/radiant/components/directioncontrol',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Form Extensions',
  },
  {
    id: 'colorpicker',
    name: 'ColorPicker',
    description: 'Color picker with hex, rgb, and palette swatch selector modes',
    states: ['hex', 'rgb', 'palette', 'disabled'],
    path: '/radiant/components/colorpicker',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Form Extensions',
  },
  {
    id: 'inputmentions',
    name: 'InputMentions',
    description: '@mention autocomplete textarea with keyboard-navigable suggestions dropdown',
    states: ['default', 'mention-active', 'suggestion-open'],
    path: '/radiant/components/inputmentions',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Form Extensions',
  },
  {
    id: 'filtermodal',
    name: 'FilterModal',
    description: 'Filter configuration modal with checkbox, radio, range, and search section types',
    states: ['open', 'closed'],
    path: '/radiant/components/filtermodal',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 4,
    author: 'Engineering Team',
    category: 'Form Extensions',
  },

  // ─── Phase 2 · Interaction ────────────────────────────────────────────────
  {
    id: 'actionmenu',
    name: 'ActionMenu',
    description: 'Compound contextual menu with keyboard nav, grouping, and destructive actions',
    states: ['closed', 'open', 'item-hover', 'item-disabled'],
    path: '/radiant/components/actionmenu',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 4,
    author: 'Engineering Team',
    category: 'Interaction',
  },
  {
    id: 'verticalstepper',
    name: 'VerticalStepper',
    description: 'Vertical step progression with connector lines and expandable step content',
    states: ['pending', 'active', 'completed', 'error'],
    path: '/radiant/components/verticalstepper',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 4,
    author: 'Engineering Team',
    category: 'Interaction',
  },
  {
    id: 'list',
    name: 'List',
    description: 'Generic list with optional HTML5 drag-and-drop reordering',
    states: ['default', 'dragging', 'empty'],
    path: '/radiant/components/list',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Interaction',
  },
  {
    id: 'slider',
    name: 'Slider',
    description: 'Styled range slider with fill percentage, labels, and optional marks',
    states: ['default', 'disabled'],
    path: '/radiant/components/slider',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Interaction',
  },
  {
    id: 'managedlist',
    name: 'ManagedList',
    description: 'List with add / remove / edit controls and optional search filtering',
    states: ['default', 'empty', 'search-active'],
    path: '/radiant/components/managedlist',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Interaction',
  },
  {
    id: 'trending',
    name: 'Trending',
    description: 'Trending / popular items display with count badges and trend direction arrows',
    states: ['flat', 'sectioned'],
    path: '/radiant/components/trending',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Interaction',
  },
  {
    id: 'nestedcheckbox',
    name: 'NestedCheckbox',
    description: 'Checkbox tree with automatic indeterminate parent state propagation',
    states: ['unchecked', 'checked', 'indeterminate', 'disabled'],
    path: '/radiant/components/nestedcheckbox',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Interaction',
  },
  {
    id: 'managetags',
    name: 'ManageTags',
    description: 'Tag creation (Enter / comma) and removal with optional suggestions dropdown',
    states: ['default', 'focused', 'at-limit'],
    path: '/radiant/components/managetags',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Interaction',
  },

  // ─── Phase 4 · Data Visualization ────────────────────────────────────────
  {
    id: 'tree',
    name: 'Tree',
    description: 'Recursive hierarchical list with expand/collapse and optional checkboxes',
    states: ['default', 'selected', 'expanded', 'checkable', 'disabled'],
    path: '/radiant/components/tree',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Data Visualization',
  },
  {
    id: 'treetable',
    name: 'TreeTable',
    description: 'Tree structure with columnar data — tree labels in first column',
    states: ['default', 'selected', 'expanded'],
    path: '/radiant/components/treetable',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Data Visualization',
  },
  {
    id: 'formatters',
    name: 'Formatters',
    description: 'Data formatters namespace — Text, Number (Intl), Line (sparkline), Interval, Background, Marker',
    states: ['default'],
    path: '/radiant/components/formatters',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 6,
    author: 'Engineering Team',
    category: 'Data Visualization',
  },

  // ─── Phase 4 · Advanced ───────────────────────────────────────────────────
  {
    id: 'tour',
    name: 'Tour',
    description: 'Guided walkthrough with spotlight overlay and step-by-step popover positioning',
    states: ['idle', 'running', 'finished'],
    path: '/radiant/components/tour',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Advanced',
  },
  {
    id: 'richtexteditor',
    name: 'RichTextEditor',
    description: 'WYSIWYG rich text editor with configurable toolbar (bold, italic, lists, links)',
    states: ['default', 'focused', 'read-only'],
    path: '/radiant/components/richtexteditor',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Advanced',
  },
  {
    id: 'dragdrop',
    name: 'DragDrop',
    description: 'HTML5 drag-and-drop hooks — DragDropProvider, useDraggable, useDroppable, useDragAndDrop',
    states: ['idle', 'dragging', 'over-droppable'],
    path: '/radiant/components/dragdrop',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 3,
    author: 'Engineering Team',
    category: 'Advanced',
  },
  {
    id: 'formbuilder',
    name: 'FormBuilder',
    description: 'Config-driven form renderer for text, select, checkbox, radio, toggle, and date fields',
    states: ['default', 'invalid', 'submitted'],
    path: '/radiant/components/formbuilder',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 7,
    author: 'Engineering Team',
    category: 'Advanced',
  },
  {
    id: 'dynamicform',
    name: 'DynamicForm',
    description: 'FormBuilder wrapper with managed value state and hasDynamicFormError() utility',
    states: ['default', 'error', 'submitted'],
    path: '/radiant/components/dynamicform',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Advanced',
  },
  {
    id: 'facetsortbar',
    name: 'FacetSortBar',
    description: 'Horizontal bar with facet pill toggles on the left and sort selector on the right',
    states: ['default', 'facet-selected', 'sorted'],
    path: '/radiant/components/facetsortbar',
    lastModified: '2026-02-27',
    source: 'scaligent',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Advanced',
  },
  // Liveboard
  {
    id: 'liveboardheader',
    name: 'LiveboardHeader',
    description: 'Unified Liveboard header that renders PrimaryNav + ViewHeader (view mode) or EditToolbar + EditSubHeader (edit mode)',
    states: ['view-mode', 'edit-mode', 'spotter-open'],
    path: '/radiant/components/liveboardheader',
    lastModified: '2026-03-13',
    source: 'custom',
    status: 'new',
    variants: 2,
    author: 'Engineering Team',
    category: 'Widgets',
  },
];

/**
 * Get component by ID
 */
export const getComponent = (id: string): ComponentMeta | undefined => {
  return componentRegistry.find((c) => c.id === id);
};

/**
 * Get all components
 */
export const getAllComponents = (): ComponentMeta[] => {
  return componentRegistry;
};

/**
 * Get components by category
 */
export const getComponentsByCategory = (category: string): ComponentMeta[] => {
  return componentRegistry.filter((c) => c.category === category);
};

/**
 * Get components by source
 */
export const getComponentsBySource = (source: ComponentSource): ComponentMeta[] => {
  return componentRegistry.filter((c) => c.source === source);
};

/**
 * Get components by status
 */
export const getComponentsByStatus = (status: ComponentStatus): ComponentMeta[] => {
  return componentRegistry.filter((c) => c.status === status);
};

/**
 * Get unique categories
 */
export const getCategories = (): string[] => {
  return [...new Set(componentRegistry.map((c) => c.category))];
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Get source display label
 */
export const getSourceLabel = (source: ComponentSource): string => {
  switch (source) {
    case 'figma':
      return 'Figma';
    case 'scaligent':
      return 'Scaligent';
    case 'custom':
      return 'Custom';
    default:
      return source;
  }
};

/**
 * Get total component count (single source of truth for all UI displays)
 */
export const getComponentCount = (): number => {
  return componentRegistry.length;
};

/**
 * Get icon count
 */
export const getIconCount = (): number => {
  return Object.keys(iconRegistry).length;
};

/**
 * Get token count label
 */
export const getTokenCountLabel = (): string => {
  return '290+';
};

/**
 * Get status color
 */
export const getStatusColor = (status: ComponentStatus): { bg: string; text: string } => {
  switch (status) {
    case 'stable':
      return { bg: '#06BF7F1A', text: '#06BF7F' };
    case 'beta':
      return { bg: '#F5A6231A', text: '#F5A623' };
    case 'new':
      return { bg: '#2770EF1A', text: '#2770EF' };
    case 'deprecated':
      return { bg: '#E22B3D1A', text: '#E22B3D' };
    default:
      return { bg: '#777E8B1A', text: '#777E8B' };
  }
};
