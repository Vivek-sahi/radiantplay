import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Checkbox } from '../components/Checkbox';
import { Radio } from '../components/Radio';
import { Toggle } from '../components/Toggle';
import { TextInput } from '../components/TextInput';
import { TextArea } from '../components/TextArea';
import { SearchInput } from '../components/SearchInput';
import { Chip } from '../components/Chip';
import { Alert } from '../components/Alert';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { Tabs } from '../components/Tabs';
import { Select } from '../components/Select';
import { Table, TableCellRenderers } from '../components/Table';
import { Tooltip } from '../components/Tooltip';
import { Popover } from '../components/Popover';
// New Phase 2-4 components
import { LoadingIndicator } from '../components/LoadingIndicator';
import { Avatar, AvatarGroup } from '../components/Avatar';
import { Card } from '../components/Card';
import { Typography } from '../components/Typography';
import { Divider } from '../components/Divider';
import { Link } from '../components/Link';
import { Accordion } from '../components/Accordion';
import { Menu } from '../components/Menu';
import { Pagination } from '../components/Pagination';
import { ProgressBar } from '../components/ProgressBar';
import { Stepper } from '../components/Stepper';
import { DatePicker, DateRangePicker } from '../components/DatePicker';
import { IconGallery } from '../components/IconGallery';
import { SegmentedControl } from '../components/SegmentedControl';
import { GlobalHeader } from '../components/GlobalHeader';
import { AppSidebar } from '../components/AppSidebar';
import { AppShell } from '../components/AppShell';
// Phase 1-4 new components
import { Horizontal, Vertical, View } from '../components/Layout';
import { Grid, RdGridItem } from '../components/Grid';
import { SplitPane } from '../components/SplitPane';
import { NoData } from '../components/NoData';
import { ExplainerCard } from '../components/ExplainerCard';
import { Image } from '../components/Image';
import { Illustration } from '../components/Illustration';
import { Legend } from '../components/Legend';
import { SafeHTML } from '../components/SafeHTML';
import { OverlayLoading } from '../components/OverlayLoading';
import { FormControl } from '../components/FormControl';
import { SearchBar } from '../components/SearchBar';
import { ActionMenu } from '../components/ActionMenu';
import { VerticalStepper } from '../components/VerticalStepper';
import { List } from '../components/List';
import { Slider } from '../components/Slider';
import { ManagedList } from '../components/ManagedList';
import { Trending } from '../components/Trending';
import { NestedCheckbox } from '../components/NestedCheckbox';
import { ManageTags } from '../components/ManageTags';
import { NumericFilterInput } from '../components/NumericFilterInput';
import { DirectionControl } from '../components/DirectionControl';
import { ColorPicker } from '../components/ColorPicker';
import { InputMentions } from '../components/InputMentions';
import { FilterModal } from '../components/FilterModal';
import { Tree } from '../components/Tree';
import { TreeTable } from '../components/TreeTable';
import { Formatters } from '../components/Formatters';
import { Tour } from '../components/Tour';
import { WizardHeader } from '../components/WizardHeader';
import { RichTextEditor } from '../components/RichTextEditor';
import { FormBuilder } from '../components/FormBuilder';
import { DynamicForm } from '../components/DynamicForm';
import { FacetSortBar } from '../components/FacetSortBar';
import { LiveboardHeader } from '../components/LiveboardHeader';
import { sysVar } from '../tokens/colors';
import { getComponent, getSourceLabel, ComponentSource } from '../data/componentRegistry';
import { LastUpdated } from '../components/LastUpdated';
import { PageHeader } from '../components/PageHeader';
import { EditHeader } from '../components/EditHeader';
import { SplitButton } from '../components/SplitButton';
import { DotLoader } from '../components/DotLoader';
import { ScrollArea } from '../components/ScrollArea';
import { Token } from '../components/Token';
import type { TokenType } from '../components/Token';
import { ChipIdentifier } from '../components/ChipIdentifier';
import { UserChip } from '../components/UserChip';
import { Breadcrumb } from '../components/Breadcrumb';
import { NumberInput } from '../components/NumberInput';
import { RadiantLook } from '../context/RadiantLookContext';
import { InlineEdit } from '../components/InlineEdit';
import { FileUploader } from '../components/FileUploader';
import type { DateRange } from '../components/DatePicker';
import { Icon } from '../components/icons';

interface PropDefinition {
  name: string;
  type: string;
  default?: string;
  description: string;
}

interface ComponentDocPageProps {
  componentId: string;
}

/** Usage rules from the Radiant 3.0 Figma pages. Claude reads these too, so keep them short and literal. */
interface UsageGuidance {
  use?: string[];
  avoid?: string[];
}

const componentDocs: Record<string, {
  name: string;
  description: string;
  usage?: UsageGuidance;
  props: PropDefinition[];
}> = {
  button: {
    name: 'Button',
    description: 'A comprehensive button component supporting multiple variants, sizes, colorways, and states. The most used component in the Radiant design system.',
    usage: {
      use: [
        'Use Primary for the one dominant action on a screen',
        'Use Secondary for supporting or alternative actions',
        'Use Tertiary for low-emphasis actions, like Learn more',
      ],
      avoid: [
        'Place several Primary buttons close together',
        'Use Tertiary for critical actions like Delete or Submit',
        'Mix button styles in one group of actions unless the hierarchy needs it',
      ],
    },
    props: [
      { name: 'variant', type: "'primary' | 'secondary' | 'tertiary'", default: "'primary'", description: 'The visual style variant' },
      { name: 'size', type: "'xs' | 'small' | 'basic' | 'large'", default: "'basic'", description: 'The size of the button' },
      { name: 'colorway', type: "'standard' | 'white'", default: "'standard'", description: 'Color scheme for light/dark backgrounds' },
      { name: 'icon', type: 'ReactNode', description: 'Optional icon element' },
      { name: 'iconPosition', type: "'leading' | 'trailing' | 'none'", default: "'none'", description: 'Position of the icon' },
      { name: 'loading', type: 'boolean', default: 'false', description: 'Whether the button is in loading state' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the button is disabled' },
      { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Whether the button spans full width' },
      { name: 'iconOnly', type: 'boolean', default: 'false', description: 'Icon button: shows only the icon. children becomes the accessible label' },
      { name: 'active', type: 'boolean', default: 'false', description: 'Selected or activated state, for toggle buttons' },
      { name: 'htmlType', type: "'button' | 'submit' | 'reset'", default: "'button'", description: 'The native button type' },
    ],
  },
  checkbox: {
    name: 'Checkbox',
    description: 'A form control for boolean or indeterminate selections. Supports checked, unchecked, and indeterminate states.',
    props: [
      { name: 'checked', type: 'boolean', default: 'false', description: 'The checked state of the checkbox' },
      { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Whether the checkbox is in indeterminate state' },
      { name: 'label', type: 'string', description: 'Label text' },
      { name: 'showLabel', type: 'boolean', default: 'true', description: 'Whether to show the label' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the checkbox is disabled' },
      { name: 'error', type: 'boolean', default: 'false', description: 'Whether the checkbox has an error' },
      { name: 'onChange', type: '(checked: boolean) => void', description: 'Change handler' },
    ],
  },
  radio: {
    name: 'Radio',
    description: 'A form control for single selection from a group of options. Use the name prop to group radios together.',
    props: [
      { name: 'checked', type: 'boolean', default: 'false', description: 'Whether the radio is selected' },
      { name: 'label', type: 'string', description: 'Label text' },
      { name: 'showLabel', type: 'boolean', default: 'true', description: 'Whether to show the label' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the radio is disabled' },
      { name: 'error', type: 'boolean', default: 'false', description: 'Whether the radio has an error' },
      { name: 'name', type: 'string', description: 'Name attribute for form submission' },
      { name: 'value', type: 'string', description: 'Value attribute for form submission' },
      { name: 'onChange', type: '(value: string) => void', description: 'Change handler' },
    ],
  },
  toggle: {
    name: 'Toggle',
    description: 'A switch control for boolean on/off states. Commonly used for settings and preferences.',
    props: [
      { name: 'checked', type: 'boolean', default: 'false', description: 'Whether the toggle is on' },
      { name: 'label', type: 'string', description: 'Label text' },
      { name: 'showLabel', type: 'boolean', default: 'true', description: 'Whether to show the label' },
      { name: 'labelPosition', type: "'left' | 'right'", default: "'left'", description: 'Position of the label' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the toggle is disabled' },
      { name: 'onChange', type: '(checked: boolean) => void', description: 'Change handler' },
    ],
  },
  textinput: {
    name: 'TextInput',
    description: 'A text input field with optional label and error states. Built for accessibility and form validation.',
    usage: {
      use: [
        'Under look: \'radiant-3\', put helper text in brackets beside the label, not under the field',
        'On an error, the label becomes the message, for example Please add “Name”',
      ],
    },
    props: [
      { name: 'label', type: 'string', description: 'Label text' },
      { name: 'showLabel', type: 'boolean', default: 'true', description: 'Whether to show the label' },
      { name: 'placeholder', type: 'string', description: 'Placeholder text' },
      { name: 'value', type: 'string', description: 'Current value' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the input is disabled' },
      { name: 'error', type: 'boolean', default: 'false', description: 'Whether the input has an error' },
      { name: 'errorMessage', type: 'string', description: 'Error message under the field. Under look: \'radiant-3\' it replaces the label text, defaulting to Please add “{label}”' },
      { name: 'helperText', type: 'string', description: 'Helper text under the field. Under look: \'radiant-3\' it sits in brackets beside the label' },
      { name: 'trailingIcon', type: 'ReactNode', description: 'Icon at the end of the field' },
      { name: 'readOnly', type: 'boolean', default: 'false', description: 'Shows the value without letting people edit it' },
      { name: 'onChange', type: '(e: ChangeEvent) => void', description: 'Change handler' },
    ],
  },
  textarea: {
    name: 'TextArea',
    description: 'A multi-line text input field with optional label, helper text, character counter, and error states.',
    usage: {
      use: [
        'Under look: \'radiant-3\', put helper text in brackets beside the label, not under the field',
        'On an error, the label becomes the message, for example Please add “Description”',
      ],
    },
    props: [
      { name: 'label', type: 'string', description: 'Label text' },
      { name: 'showLabel', type: 'boolean', default: 'true', description: 'Whether to show the label' },
      { name: 'placeholder', type: 'string', description: 'Placeholder text' },
      { name: 'value', type: 'string', description: 'Current value' },
      { name: 'rows', type: 'number', default: '4', description: 'Number of visible text rows' },
      { name: 'resize', type: "'none' | 'vertical' | 'horizontal' | 'both'", default: "'vertical'", description: 'Whether to allow resizing' },
      { name: 'maxLength', type: 'number', description: 'Maximum character count (shows counter when set)' },
      { name: 'helperText', type: 'string', description: 'Helper text in brackets beside the label' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the textarea is disabled' },
      { name: 'error', type: 'boolean', default: 'false', description: 'Whether the textarea has an error' },
      { name: 'errorMessage', type: 'string', description: 'Error message under the field. Under look: \'radiant-3\' it replaces the label text, defaulting to Please add “{label}”' },
      { name: 'onChange', type: '(e: ChangeEvent) => void', description: 'Change handler' },
    ],
  },
  searchinput: {
    name: 'SearchInput',
    description: 'A search input with a leading search icon, for filtering lists and searching content.',
    props: [
      { name: 'placeholder', type: 'string', default: "'Search'", description: 'Placeholder text' },
      { name: 'value', type: 'string', description: 'Current value' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the input is disabled' },
      { name: 'onChange', type: '(e: ChangeEvent) => void', description: 'Change handler' },
      { name: 'onClear', type: '() => void', description: 'Shows a clear button while there is a value, and is called when it is clicked' },
      { name: 'variant', type: "'outlined' | 'underlined'", default: "'outlined'", description: 'Underlined is a 40px row with a bottom border, for menus and panels' },
    ],
  },
  chip: {
    name: 'Chip',
    description: 'A pill-shaped component for displaying attributes, measures, filters, or placeholder skeleton states.',
    props: [
      { name: 'type', type: "'attribute' | 'measure' | 'filter' | 'skeleton'", default: "'attribute'", description: 'The type/variant of chip' },
      { name: 'label', type: 'string', description: 'The label text to display' },
      { name: 'filterValue', type: 'string', description: 'For filter type: the filter value' },
      { name: 'showChevron', type: 'boolean', default: 'true', description: 'Whether to show the trailing chevron' },
      { name: 'deletable', type: 'boolean', default: 'false', description: 'Whether to show delete button on hover' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the chip is disabled' },
      { name: 'onClick', type: '() => void', description: 'Click handler for the chip' },
      { name: 'onDelete', type: '() => void', description: 'Handler when delete button is clicked' },
    ],
  },
  alert: {
    name: 'Alert',
    description: 'A notification component for displaying important messages. Supports different statuses and variants.',
    usage: {
      use: [
        'Keep a page banner caption to 80 characters or fewer',
      ],
    },
    props: [
      { name: 'status', type: "'info' | 'success' | 'warning' | 'failure' | 'muted'", default: "'info'", description: 'The status/type of alert' },
      { name: 'variant', type: "'page' | 'section' | 'section-multiline'", default: "'section'", description: 'The variant/layout of the alert' },
      { name: 'message', type: 'string', description: 'The main message text' },
      { name: 'linkText', type: 'string', description: 'Optional link text' },
      { name: 'buttonText', type: 'string', description: 'Optional button text (page variant only)' },
      { name: 'dismissible', type: 'boolean', default: 'true', description: 'Whether the alert can be dismissed' },
      { name: 'showIcon', type: 'boolean', default: 'true', description: 'Whether to show the status icon' },
    ],
  },
  toast: {
    name: 'Toast',
    description: 'A temporary notification that appears to provide feedback about an action. Auto-dismisses after a configurable duration.',
    usage: {
      use: [
        'Confirm an action that finished, like a save or a share',
      ],
      avoid: [
        'Show errors or warnings in a toast. Use an Alert instead. The warning and error types are kept for older prototypes but are off-spec',
      ],
    },
    props: [
      { name: 'message', type: 'string', description: 'Toast message' },
      { name: 'type', type: "'success' | 'info' | 'warning' | 'error'", default: "'info'", description: 'Toast type' },
      { name: 'duration', type: 'number', default: '5000', description: 'Auto-dismiss duration in milliseconds (0 to disable)' },
      { name: 'isVisible', type: 'boolean', default: 'true', description: 'Whether the toast is visible' },
      { name: 'onDismiss', type: '() => void', description: 'Called when toast is dismissed' },
      { name: 'actionText', type: 'string', description: 'Action button text' },
      { name: 'onAction', type: '() => void', description: 'Action button click handler' },
      { name: 'position', type: "'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right'", default: "'bottom'", description: 'Position of the toast' },
    ],
  },
  modal: {
    name: 'Modal',
    description: 'An overlay modal dialog for displaying content on top of the page. Supports keyboard navigation and focus trapping.',
    usage: {
      use: [
        'Pick the size for the content: M1 394px for confirmations, M2 788px, M3 1182px, M4 full screen',
        'Use the splash screen type to introduce a new feature, once per feature',
        'In a splash screen, use one image or a short video of 6 to 11 seconds, and at most three steps',
      ],
    },
    props: [
      { name: 'isOpen', type: 'boolean', description: 'Whether the modal is open' },
      { name: 'onClose', type: '() => void', description: 'Handler to close the modal' },
      { name: 'title', type: 'string', description: 'Modal title' },
      { name: 'children', type: 'ReactNode', description: 'Modal content' },
      { name: 'footer', type: 'ReactNode', description: 'Footer content (typically buttons)' },
      { name: 'size', type: "'M1' | 'M2' | 'M3' | 'M4' | 'small' | 'medium' | 'large'", default: "'M2'", description: 'M1 394px, M2 788px, M3 1182px, M4 full screen. small, medium and large are older names' },
      { name: 'type', type: "'simple' | 'wizard' | 'subnavigation' | 'splashscreen'", default: "'simple'", description: 'Layout of the modal' },
      { name: 'eyebrow', type: 'string', description: 'Small line above the title' },
      { name: 'currentStep', type: 'number', description: 'Wizard: the current step' },
      { name: 'totalSteps', type: 'number', description: 'Wizard: the number of steps' },
      { name: 'navigation', type: 'ReactNode', description: 'Sub-navigation: the left panel' },
      { name: 'mediaContent', type: 'ReactNode', description: 'Splash screen: the media area' },
      { name: 'showCloseButton', type: 'boolean', default: 'true', description: 'Whether to show the close button' },
      { name: 'closeOnOverlayClick', type: 'boolean', default: 'true', description: 'Whether to close on overlay click' },
      { name: 'closeOnEscape', type: 'boolean', default: 'true', description: 'Whether to close on Escape key' },
    ],
  },
  tabs: {
    name: 'Tabs',
    description: 'Navigation tabs for switching between views of the same content.',
    props: [
      { name: 'tabs', type: 'Array<{ id: string, label: string, icon?: ReactNode }>', description: 'Array of tab items' },
      { name: 'size', type: "'medium' | 'small'", description: 'Tab height: medium 48px, small 32px. Unset keeps the older 46px tabs; look: \'radiant-3\' uses 48px' },
      { name: 'activeTab', type: 'string', description: 'Currently active tab ID' },
      { name: 'onTabChange', type: '(id: string) => void', description: 'Handler when a tab is selected' },
    ],
  },
  select: {
    name: 'Select',
    description: 'A dropdown selection component with search functionality, keyboard navigation, and customizable options.',
    props: [
      { name: 'options', type: 'Array<{ id: string, label: string, value?: string }>', description: 'Array of options to display' },
      { name: 'value', type: 'string', description: 'Currently selected value' },
      { name: 'onChange', type: '(value: string, option: SelectOption) => void', description: 'Handler when selection changes' },
      { name: 'placeholder', type: 'string', default: "'Select an option'", description: 'Placeholder text when no selection' },
      { name: 'label', type: 'string', description: 'Label text above the select' },
      { name: 'helperText', type: 'string', description: 'Helper text below the select' },
      { name: 'error', type: 'boolean', default: 'false', description: 'Error state' },
      { name: 'errorMessage', type: 'string', description: 'Error message to display' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
      { name: 'searchable', type: 'boolean', default: 'false', description: 'Show search input in dropdown' },
      { name: 'size', type: "'small' | 'basic' | 'large'", default: "'basic'", description: 'Size variant' },
    ],
  },
  segmentedcontrol: {
    name: 'SegmentedControl',
    description: 'A group of mutually exclusive options displayed as connected segments. Supports text and icon variants.',
    props: [
      { name: 'options', type: 'Array<{ id: string, label?: string, icon?: ReactNode, disabled?: boolean, ariaLabel?: string }>', description: 'Array of segment options' },
      { name: 'value', type: 'string', description: 'Currently selected segment ID' },
      { name: 'onChange', type: '(value: string) => void', description: 'Change handler' },
      { name: 'size', type: "'small' | 'default' | 'large'", default: "'default'", description: 'Size variant' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the entire control is disabled' },
      { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Fill available width' },
    ],
  },
  table: {
    name: 'Table',
    description: 'A data table with sorting, selection and custom cells. TableCellRenderers gives ready-made cells: title (with description and error lines), tokens, button, iconButton, avatar, chip, chips, status, date, number and boolean. Under look: \'radiant-3\' it follows the Figma Object table: a 32px header, 72px rows and Radiant checkboxes.',
    props: [
      { name: 'columns', type: 'Array<TableColumn>', description: 'Column definitions with key, label, width, and render function' },
      { name: 'data', type: 'Array<T>', description: 'Table data rows' },
      { name: 'rowKey', type: 'string | ((row, index) => string)', default: "'id'", description: 'Key extractor for rows' },
      { name: 'loading', type: 'boolean', default: 'false', description: 'Loading state' },
      { name: 'emptyMessage', type: 'string', default: "'No data available'", description: 'Empty state message' },
      { name: 'selectable', type: 'boolean', default: 'false', description: 'Whether rows are selectable' },
      { name: 'selectedKeys', type: 'string[]', description: 'Selected row keys' },
      { name: 'onSelectionChange', type: '(selectedKeys: string[]) => void', description: 'Selection change handler' },
      { name: 'hoverable', type: 'boolean', default: 'true', description: 'Show hover state on rows' },
      { name: 'bordered', type: 'boolean', default: 'false', description: 'Show table borders' },
      { name: 'striped', type: 'boolean', default: 'false', description: 'Striped rows' },
      { name: 'compact', type: 'boolean', default: 'false', description: 'Shorter rows' },
      { name: 'stickyHeader', type: 'boolean', default: 'false', description: 'Header stays visible while the rows scroll' },
      { name: 'onRowClick', type: '(row: T, index: number) => void', description: 'Called when a row is clicked' },
      { name: 'columns[].sortable', type: 'boolean', default: 'false', description: 'Makes a column sortable from its header' },
    ],
  },
  tooltip: {
    name: 'Tooltip',
    description: 'A lightweight tooltip component for displaying contextual information on hover or focus.',
    props: [
      { name: 'content', type: 'ReactNode', description: 'Tooltip content' },
      { name: 'children', type: 'ReactElement', description: 'Element that triggers the tooltip' },
      { name: 'placement', type: "'top' | 'bottom' | 'left' | 'right'", default: "'top'", description: 'Placement of the tooltip' },
      { name: 'showDelay', type: 'number', default: '200', description: 'Delay before showing (ms)' },
      { name: 'hideDelay', type: 'number', default: '0', description: 'Delay before hiding (ms)' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether tooltip is disabled' },
      { name: 'maxWidth', type: 'number', default: '250', description: 'Maximum width of tooltip' },
    ],
  },
  popover: {
    name: 'Popover',
    description: 'An interactive overlay component for displaying content in a floating container with click or hover triggers.',
    props: [
      { name: 'content', type: 'ReactNode', description: 'Popover content' },
      { name: 'children', type: 'ReactElement', description: 'Element that triggers the popover' },
      { name: 'placement', type: "'top' | 'bottom' | 'left' | 'right' | ...", default: "'bottom'", description: 'Placement of the popover' },
      { name: 'trigger', type: "'click' | 'hover'", default: "'click'", description: 'How to trigger the popover' },
      { name: 'isOpen', type: 'boolean', description: 'Controlled open state' },
      { name: 'onOpenChange', type: '(isOpen: boolean) => void', description: 'Open state change handler' },
      { name: 'closeOnClickOutside', type: 'boolean', default: 'true', description: 'Close on click outside' },
      { name: 'closeOnEscape', type: 'boolean', default: 'true', description: 'Close on escape key' },
      { name: 'offset', type: 'number', default: '8', description: 'Offset from trigger element (px)' },
    ],
  },
  // Phase 2: Core Components
  loadingindicator: {
    name: 'LoadingIndicator',
    description: 'Loading states: a spinner with optional text, a small inline spinner (Contextual), and placeholder shapes (Skeleton). For a full-area loader over content, use LoadingOverlay.',
    usage: {
      use: [
        'Use Skeleton when a section is loading, for cards, titles and images',
        'Keep border radii consistent when combining several Skeletons',
        'Use Contextual (the spinner) for small inline waits',
      ],
      avoid: [
        'Use a single Skeleton to show a whole page loading',
      ],
    },
    props: [
      { name: 'size', type: "'small' | 'medium' | 'large'", default: "'medium'", description: 'Size of the spinner' },
      { name: 'text', type: 'string', description: 'Text under the spinner' },
      { name: 'centered', type: 'boolean', default: 'false', description: 'Centres the spinner in its container' },
      { name: 'Contextual.size', type: "'xs' | 's' | 'm' | 'l' | 'xl'", default: "'m'", description: 'Size of the inline spinner (12-48px)' },
      { name: 'Skeleton.variant', type: "'text' | 'circular' | 'rectangular' | 'rounded'", default: "'text'", description: 'Shape of the placeholder' },
      { name: 'Skeleton.width', type: 'number | string', description: 'Placeholder width' },
      { name: 'Skeleton.height', type: 'number | string', description: 'Placeholder height' },
    ],
  },
  avatar: {
    name: 'Avatar',
    description: 'Displays a user avatar with automatic initials fallback, image loading, and optional badge support.',
    usage: {
      use: [
        'Group one to three avatars, overlapping left to right',
        'Make avatars clickable or not, as the context needs',
        'Show a tooltip on hover and focus, with the same text as the avatar label',
      ],
    },
    props: [
      { name: 'name', type: 'string', description: 'User name (used for initials and alt text)' },
      { name: 'src', type: 'string', description: 'Image source URL' },
      { name: 'size', type: "'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl'", default: "'m'", description: 'Avatar size (20-64px)' },
      { name: 'showName', type: 'boolean', default: 'false', description: 'Display name alongside avatar' },
      { name: 'namePosition', type: "'right' | 'bottom'", default: "'right'", description: 'Position of name relative to avatar' },
      { name: 'badgeValue', type: 'number', description: 'Numbered badge value (max 99)' },
      { name: 'showBadge', type: 'boolean', default: 'false', description: 'Show dot badge' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
    ],
  },
  card: {
    name: 'Card',
    description: 'A flexible container component for grouping related content with header, body, and footer sections.',
    props: [
      { name: 'interactive', type: 'boolean', default: 'false', description: 'Whether the card is clickable' },
      { name: 'isSelected', type: 'boolean', default: 'false', description: 'Selected state' },
      { name: 'isDisabled', type: 'boolean', default: 'false', description: 'Disabled state' },
      { name: 'noBorder', type: 'boolean', default: 'false', description: 'Remove border' },
      { name: 'onClick', type: '(data: string) => void', description: 'Click handler' },
      { name: 'Header.title', type: 'string', description: 'Header title text' },
      { name: 'Header.subtitle', type: 'string', description: 'Header subtitle' },
      { name: 'Footer.align', type: "'left' | 'center' | 'right' | 'space-between'", default: "'right'", description: 'Footer alignment' },
    ],
  },
  typography: {
    name: 'Typography',
    description: 'A flexible text component supporting Radiant V2 typography system with 20+ variants and semantic colors.',
    props: [
      { name: 'variant', type: 'TypographyVariant', description: 'Typography variant (headline-large, page-title, body-normal, etc.)' },
      { name: 'color', type: "'base' | 'gray' | 'accent' | 'success' | 'warning' | 'failure' | 'white'", default: "'base'", description: 'Text color' },
      { name: 'as', type: 'ElementType', description: 'Override HTML tag' },
      { name: 'noMargin', type: 'boolean', default: 'false', description: 'Remove bottom margin' },
      { name: 'ellipsis', type: '{ rows: number }', description: 'Truncate after N lines with ellipsis' },
      { name: 'wrapContent', type: 'boolean', default: 'false', description: 'Enable word wrapping' },
    ],
  },
  divider: {
    name: 'Divider',
    description: 'A simple line separator for dividing content sections, supporting horizontal and vertical orientations.',
    props: [
      { name: 'vertical', type: 'boolean', default: 'false', description: 'Vertical orientation' },
      { name: 'spacing', type: "'none' | 's' | 'm' | 'l'", default: "'none'", description: 'Margin around divider' },
      { name: 'section', type: 'boolean', default: 'false', description: 'Include section-level spacing' },
      { name: 'onDarkBg', type: 'boolean', default: 'false', description: 'For use on dark backgrounds' },
    ],
  },
  link: {
    name: 'Link',
    description: 'A styled anchor element for navigation with color variants and external link support.',
    props: [
      { name: 'color', type: "'blue' | 'black' | 'white' | 'gray'", default: "'blue'", description: 'Link color' },
      { name: 'size', type: "'small' | 'default' | 'large'", default: "'default'", description: 'Link size' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
      { name: 'noUnderline', type: 'boolean', default: 'false', description: 'Disable underline on hover' },
      { name: 'external', type: 'boolean', default: 'false', description: 'Show external link icon' },
      { name: 'href', type: 'string', description: 'Link destination' },
    ],
  },
  // Phase 3: Interactive Components
  accordion: {
    name: 'Accordion',
    description: 'A collapsible content component for showing/hiding sections with smooth animations.',
    props: [
      { name: 'allowMultiple', type: 'boolean', default: 'false', description: 'Allow multiple items expanded' },
      { name: 'defaultExpanded', type: 'number | number[]', description: 'Initially expanded item(s)' },
      { name: 'expanded', type: 'number | number[]', description: 'Controlled expanded state' },
      { name: 'onExpandedChange', type: '(expanded: number[]) => void', description: 'Expansion change handler' },
      { name: 'variant', type: "'default' | 'minimal' | 'bordered' | 'card'", default: "'default'", description: 'Visual variant. card is the Figma card: raised items with a leading chevron' },
      { name: 'Item.title', type: 'ReactNode', description: 'Item title' },
      { name: 'Item.subtitle', type: 'string', description: 'Item subtitle' },
      { name: 'Item.disabled', type: 'boolean', default: 'false', description: 'Disable item' },
    ],
  },
  menu: {
    name: 'Menu',
    description: 'A dropdown menu for displaying a list of actions with keyboard navigation support.',
    props: [
      { name: 'show', type: 'boolean', default: 'true', description: 'Menu visibility' },
      { name: 'variant', type: "'default' | 'compact'", default: "'default'", description: 'Visual variant' },
      { name: 'theme', type: "'light' | 'dark'", default: "'light'", description: 'Color theme' },
      { name: 'onClose', type: '() => void', description: 'Close handler' },
      { name: 'Item.active', type: 'boolean', default: 'false', description: 'Selected state' },
      { name: 'Item.disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
      { name: 'Item.danger', type: 'boolean', default: 'false', description: 'Destructive action style' },
      { name: 'Item.shortcut', type: 'string', description: 'Keyboard shortcut display' },
    ],
  },
  pagination: {
    name: 'Pagination',
    description: 'A compound component for page navigation with three variants: Numbers, Dots, and Range.',
    props: [
      { name: 'Numbers.currentPage', type: 'number', description: 'Current page (1-indexed)' },
      { name: 'Numbers.totalPages', type: 'number', description: 'Total number of pages' },
      { name: 'Numbers.onPageChange', type: '(page: number) => void', description: 'Page change handler' },
      { name: 'Numbers.siblingCount', type: 'number', default: '1', description: 'Pages to show on each side' },
      { name: 'Dots.currentPage', type: 'number', description: 'Current page for dot indicators' },
      { name: 'Range.itemsPerPage', type: 'number', description: 'Items per page for range display' },
      { name: 'Range.totalItems', type: 'number', description: 'Total items for range calculation' },
    ],
  },
  pageheader: {
    name: 'PageHeader',
    description: 'The Figma page header: an optional breadcrumb, a 24/32 title with optional tabs beside it and buttons on the right, and an optional description. Only the title is required.',
    props: [
      { name: 'title', type: 'string', description: 'Page title (required)' },
      { name: 'description', type: 'string', description: 'Line under the title' },
      { name: 'breadcrumbs', type: '{ label, href?, onClick? }[]', description: 'Pages above this one; shows the back button and parent links' },
      { name: 'onBack', type: '() => void', description: 'Overrides what the breadcrumb back button does' },
      { name: 'tabs', type: 'Tab[]', description: 'Radiant Tabs next to the title' },
      { name: 'activeTab', type: 'string', description: 'Id of the active tab' },
      { name: 'onTabChange', type: '(id: string) => void', description: 'Called when a tab is chosen' },
      { name: 'actions', type: '{ label, onClick?, variant?, icon?, disabled? }[]', description: 'Buttons on the right; variant defaults to secondary' },
    ],
  },
  editheader: {
    name: 'EditHeader',
    description: 'The Figma edit-mode page header, sibling of WizardHeader: a 20/28 title with optional segmented tabs, then Reset, Save, a divider and a tertiary Exit button. Reset is disabled until there are edits (Saved and Edited states).',
    props: [
      { name: 'title', type: 'string', description: 'Title of the thing being edited (required)' },
      { name: 'edited', type: 'boolean', default: 'false', description: 'Edited state; false is Saved and disables Reset' },
      { name: 'onReset', type: '() => void', description: 'Shows the secondary Reset button' },
      { name: 'onSave', type: '() => void', description: 'Shows the primary Save button' },
      { name: 'onExit', type: '() => void', description: 'Shows a divider and a tertiary Exit button' },
      { name: 'saveDisabled', type: 'boolean', default: 'false', description: 'Disables Save' },
      { name: 'resetLabel / saveLabel / exitLabel', type: 'string', default: "'Reset' / 'Save' / 'Exit'", description: 'Button labels' },
      { name: 'tabs', type: 'SegmentOption[]', description: 'Segmented tabs next to the title' },
      { name: 'activeTab', type: 'string', description: 'Id of the active tab' },
      { name: 'onTabChange', type: '(id: string) => void', description: 'Called when a tab is chosen' },
    ],
  },
  splitbutton: {
    name: 'SplitButton',
    description: 'A main action and a chevron that opens a menu, joined with a 2px gap. Primary and secondary types, each with a text or icon-only main action. Each half hovers, presses and disables on its own, and the chevron stays pressed while the menu is open. Enter, Space or Arrow down on the chevron opens the menu; arrow keys move; Escape closes it.',
    props: [
      { name: 'label', type: 'string', description: 'Main action text; the accessible name when iconOnly (required)' },
      { name: 'onClick', type: '(e) => void', description: 'Main action handler' },
      { name: 'items', type: '{ label, onClick?, icon?, disabled?, destructive? }[]', description: 'Menu items behind the chevron (required)' },
      { name: 'variant', type: "'primary' | 'secondary'", default: "'primary'", description: 'Button type' },
      { name: 'icon', type: 'IconName | ReactNode', description: 'Icon on the main action' },
      { name: 'iconOnly', type: 'boolean', default: 'false', description: 'Main action shows only the icon (Figma Primary icon and Secondary icon)' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables both halves' },
      { name: 'mainDisabled', type: 'boolean', default: 'false', description: 'Disables only the main action' },
      { name: 'menuDisabled', type: 'boolean', default: 'false', description: 'Disables only the chevron' },
      { name: 'menuPlacement', type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'", default: "'bottom-start'", description: 'Where the menu opens' },
      { name: 'menuLabel', type: 'string', default: "'More options'", description: 'Accessible name of the chevron' },
    ],
  },
  dotloader: {
    name: 'DotLoader',
    description: 'The three-dot global loader for full-area waits, such as an answer being generated. The large dot travels left to right; with reduced motion the dots hold still. An optional message sits below. LoadingIndicator stays the ring spinner for inline loading.',
    props: [
      { name: 'message', type: 'ReactNode', description: 'Text under the dots, 14/20 secondary, up to 256px wide' },
      { name: 'label', type: 'string', default: "'Loading'", description: 'Accessible name when there is no message' },
      { name: 'className', type: 'string', description: 'Extra class on the root' },
    ],
  },
  scrollarea: {
    name: 'ScrollArea',
    description: 'A light wrapper that gives its content the Figma scroll bar: an 8px track in the secondary action background with a rounded tertiary thumb. Native scrolling styled with CSS; global scrollbars are untouched. Firefox gets the same colors at its thin width.',
    props: [
      { name: 'orientation', type: "'vertical' | 'horizontal' | 'both'", default: "'vertical'", description: 'Which directions scroll' },
      { name: 'maxHeight', type: 'number | string', description: 'Height before the content scrolls' },
      { name: 'maxWidth', type: 'number | string', description: 'Width before the content scrolls' },
      { name: 'focusable', type: 'boolean', default: 'true', description: 'Lets keyboard users focus and scroll the area; pair with aria-label' },
      { name: 'children', type: 'ReactNode', description: 'Scrolling content (required)' },
    ],
  },
  token: {
    name: 'Token',
    description: 'The Figma Token / Read Only and Token / Editable sets as one component: a 24px, 4px-radius label in the chip colours for a measure, attribute, condition or date. Read only tokens carry a 14px icon and a warning or error border; editable tokens drop the icon, show a remove circle on hover and take an active look while being edited.',
    props: [
      { name: 'label', type: 'string', description: 'Text shown in the token (required)' },
      { name: 'type', type: "'measure' | 'attribute' | 'condition' | 'date'", default: "'measure'", description: 'Sets the fill and icon colour; condition uses the filter chip colours' },
      { name: 'status', type: "'default' | 'warning' | 'error'", default: "'default'", description: 'Read only: border and alert icon. Editable: error uses the error fill' },
      { name: 'editable', type: 'boolean', default: 'false', description: 'Editable token: no icon, remove button, active look' },
      { name: 'showIcon', type: 'boolean', default: 'true', description: 'Read only: shows the leading icon' },
      { name: 'icon', type: 'IconName | ReactNode', description: 'Read only: overrides the default icon for the type' },
      { name: 'active', type: 'boolean', default: 'false', description: 'Editable: being edited, no fill and a 1px bottom line' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Fades the token to 40%' },
      { name: 'onClick', type: '() => void', description: 'Click or Enter/Space on the token' },
      { name: 'onRemove', type: '() => void', description: 'Editable: shows the remove button; Delete or Backspace also fires it' },
      { name: 'maxWidth', type: 'number', description: 'Width in px before the label truncates' },
    ],
  },
  chipidentifier: {
    name: 'ChipIdentifier',
    description: 'The Figma Chip - identifier: a 24px, 4px-radius brand chip with inverse text that marks an identifier, such as a key column or an id. Display only.',
    props: [
      { name: 'label', type: 'string', description: 'Text shown in the chip (required)' },
      { name: 'maxWidth', type: 'number', description: 'Width in px before the label truncates' },
      { name: 'className', type: 'string', description: 'Extra class on the chip' },
    ],
  },
  userchip: {
    name: 'UserChip',
    description: 'The Figma Input chip: a 28px pill with a 24px Avatar, the person\'s name and an optional remove button, for people inside inputs such as share or mention fields. Selected chips use the dark fill, inverse text and a checkmark over the dimmed avatar.',
    props: [
      { name: 'name', type: 'string', description: 'Person\'s name; also the avatar initials (required)' },
      { name: 'src', type: 'string', description: 'Avatar image URL; falls back to initials' },
      { name: 'id', type: 'string', description: 'Stable id for the avatar initials colour' },
      { name: 'selected', type: 'boolean', default: 'false', description: 'Selected look with a checkmark over the avatar' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Fades the chip to 40%' },
      { name: 'onClick', type: '() => void', description: 'Click or Enter/Space, e.g. to toggle selection; sets aria-pressed' },
      { name: 'onRemove', type: '() => void', description: 'Shows the remove button; Delete or Backspace also fires it' },
      { name: 'maxWidth', type: 'number', description: 'Width in px before the name truncates' },
    ],
  },
  breadcrumb: {
    name: 'Breadcrumb',
    description: 'The Figma breadcrumb: a small round back button and gray links for the pages above this one, separated by chevrons. The last item is the current page (aria-current="page"). Long labels truncate.',
    props: [
      { name: 'items', type: '{ label, href?, onClick? }[]', description: 'Trail from the top level down; the last item is the current page (required)' },
      { name: 'showBackButton', type: 'boolean', default: 'true', description: 'Round back button that goes to the item before the current page' },
      { name: 'onBack', type: '() => void', description: 'Overrides what the back button does' },
      { name: 'showCurrent', type: 'boolean', default: 'true', description: 'Shows the current page at the end; turn off when a title below names the page' },
      { name: 'aria-label', type: 'string', default: "'Breadcrumb'", description: 'Name of the navigation landmark' },
    ],
  },
  numberinput: {
    name: 'NumberInput',
    description: 'A number field with up and down spin buttons that show on hover and focus. Follows TextInput for label, helper text and error message, and picks up the radiant-3 look (32px field, 6px radius, 12/18 label that turns brand on focus). ArrowUp and ArrowDown step the value, Shift steps by 10, Home and End jump to min and max, and typed values are clamped on blur.',
    props: [
      { name: 'label', type: 'string', description: 'Label text' },
      { name: 'value', type: 'number | null', description: 'Current value (controlled); null is empty' },
      { name: 'defaultValue', type: 'number | null', default: 'null', description: 'Starting value when uncontrolled' },
      { name: 'onChange', type: '(value: number | null) => void', description: 'Called with the new number, or null when cleared' },
      { name: 'min', type: 'number', description: 'Lowest allowed value' },
      { name: 'max', type: 'number', description: 'Highest allowed value' },
      { name: 'step', type: 'number', default: '1', description: 'Amount each spin or arrow key adds or removes' },
      { name: 'error', type: 'boolean', default: 'false', description: 'Error state: failure border, label and icon' },
      { name: 'errorMessage', type: 'string', description: 'Error message below the field' },
      { name: 'helperText', type: 'string', description: 'Helper text below the field' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the field' },
      { name: 'readOnly', type: 'boolean', default: 'false', description: 'Filled background, no border, no spin buttons' },
      { name: 'hideSpinButtons', type: 'boolean', default: 'false', description: 'Hide the spin buttons; arrow keys still work' },
    ],
  },
  inlineedit: {
    name: 'InlineEdit',
    description: 'Text that reads as plain text, shows a Border/Bold outline on hover and turns into a field with a Border/Brand outline on click, Enter, Space or F2. Enter or blur confirms, Escape cancels and puts focus back on the text. Two sizes: 14/20 and 16/24. The field grows with the text.',
    props: [
      { name: 'value', type: 'string', description: 'Current text (controlled)' },
      { name: 'defaultValue', type: 'string', default: "''", description: 'Starting text when uncontrolled' },
      { name: 'onChange', type: '(value: string) => void', description: 'Called with the new text when an edit is confirmed' },
      { name: 'onCancel', type: '() => void', description: 'Called when an edit is cancelled with Escape' },
      { name: 'onEditingChange', type: '(editing: boolean) => void', description: 'Called when editing starts or stops' },
      { name: 'size', type: "'basic' | 'large'", default: "'basic'", description: "Text size: 'basic' 14/20, 'large' 16/24" },
      { name: 'placeholder', type: 'string', description: 'Text shown when empty' },
      { name: 'confirmOnBlur', type: 'boolean', default: 'true', description: 'Blur confirms; when false, blur cancels' },
      { name: 'required', type: 'boolean', default: 'false', description: 'Keep the old value when confirmed empty' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Turns editing off' },
      { name: 'aria-label', type: 'string', description: 'Accessible name, e.g. "Liveboard name"' },
    ],
  },
  fileuploader: {
    name: 'FileUploader',
    description: 'A label row, a 32px field that shows the chosen file name with a clear button, and a secondary Upload button. Click the field or the button to browse, or drop files on the field (dashed brand outline while dragging). Nothing uploads: picks and removals come through onFilesChange, and you set status and progress per file to show uploading, complete or error in the file list.',
    props: [
      { name: 'label', type: 'string', description: 'Label above the field' },
      { name: 'helperText', type: 'string', description: 'Shown in brackets after the label' },
      { name: 'placeholder', type: 'string', description: 'Text inside the empty field' },
      { name: 'buttonLabel', type: 'string', default: "'Upload'", description: 'Upload button label' },
      { name: 'files', type: 'FileUploaderItem[]', description: 'Files (controlled): { id, name, size?, file?, status?, progress?, errorMessage? }' },
      { name: 'defaultFiles', type: 'FileUploaderItem[]', default: '[]', description: 'Starting files when uncontrolled' },
      { name: 'onFilesChange', type: '(files: FileUploaderItem[]) => void', description: 'Called with the full list after a pick, drop or removal' },
      { name: 'accept', type: 'string', description: 'Accepted types, e.g. ".csv,.xlsx"' },
      { name: 'multiple', type: 'boolean', default: 'false', description: 'Allow several files; new picks add to the list' },
      { name: 'showFileList', type: 'boolean', description: "File list with size and status; on by default when multiple or any file has a status other than 'idle'" },
      { name: 'error', type: 'boolean', default: 'false', description: 'Failure border' },
      { name: 'errorMessage', type: 'string', description: 'Shown in place of the label with an error icon' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Whole control at 40%' },
      { name: 'readOnly', type: 'boolean', default: 'false', description: 'Filled field, no border, Upload disabled' },
    ],
  },
  daterangepicker: {
    name: 'DateRangePicker',
    description: 'Two date fields joined by "to" that share one calendar. The calendar opens under the active field, picking a start date moves on to the end field, and the days in between are highlighted.',
    props: [
      { name: 'value', type: '{ start: Date | null; end: Date | null }', default: '{ start: null, end: null }', description: 'Selected range' },
      { name: 'onChange', type: '(range: DateRange) => void', description: 'Called with the full range on every change' },
      { name: 'format', type: "'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'", default: "'MM/DD/YYYY'", description: 'Date format for both fields' },
      { name: 'label', type: 'string', description: 'Label above both fields' },
      { name: 'startPlaceholder', type: 'string', default: "'Start date'", description: 'Start field placeholder and accessible name' },
      { name: 'endPlaceholder', type: 'string', default: "'End date'", description: 'End field placeholder and accessible name' },
      { name: 'separator', type: 'string', default: "'to'", description: 'Word between the fields' },
      { name: 'hasError', type: 'boolean', default: 'false', description: 'Error state on both fields' },
      { name: 'helperText', type: 'string', description: 'Helper or error text' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables both fields' },
      { name: 'minDate', type: 'Date', description: 'Earliest selectable date' },
      { name: 'maxDate', type: 'Date', description: 'Latest selectable date' },
      { name: 'id', type: 'string', description: 'Base id; fields get <id>-start and <id>-end' },
    ],
  },
  wizardheader: {
    name: 'WizardHeader',
    description: 'The Figma wizard as a full-width page header: eyebrow over a 20/28 title, Secondary and Primary buttons, a divider and a tertiary Exit button, with a 4px segmented progress bar below. WizardModal stays for the modal form.',
    props: [
      { name: 'title', type: 'string', description: 'Step title (required)' },
      { name: 'eyebrow', type: 'string', description: 'Small line above the title' },
      { name: 'totalSteps', type: 'number', default: '0', description: 'Segments in the progress bar; 0 hides it' },
      { name: 'currentStep', type: 'number', default: '0', description: 'Current step, 1-based; segments up to it are filled' },
      { name: 'primaryAction', type: '{ label, onClick?, disabled? }', description: 'Primary button' },
      { name: 'secondaryAction', type: '{ label, onClick?, disabled? }', description: 'Secondary button before the primary' },
      { name: 'onExit', type: '() => void', description: 'Shows a divider and a tertiary Exit button' },
      { name: 'exitLabel', type: 'string', default: "'Exit'", description: 'Exit button label' },
    ],
  },
  progressbar: {
    name: 'ProgressBar',
    description: 'A horizontal bar that shows progress toward a goal with color and size variants.',
    props: [
      { name: 'value', type: 'number', description: 'Progress value (0-100)' },
      { name: 'max', type: 'number', default: '100', description: 'Maximum value' },
      { name: 'color', type: "'green' | 'blue' | 'yellow' | 'red'", default: "'green'", description: 'Bar color' },
      { name: 'size', type: "'small' | 'default' | 'large'", default: "'default'", description: 'Bar size (4-8px)' },
      { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Show loading animation' },
      { name: 'label', type: 'string', description: 'Label text above bar' },
      { name: 'showValue', type: 'boolean', default: 'false', description: 'Show percentage value' },
    ],
  },
  stepper: {
    name: 'Stepper',
    description: 'A progress indicator for multi-step processes with horizontal and vertical orientations.',
    props: [
      { name: 'steps', type: 'Array<{ title: string, description?: string }>', description: 'Step items' },
      { name: 'currentStep', type: 'number', default: '0', description: 'Current active step (0-indexed)' },
      { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Stepper orientation' },
      { name: 'sequential', type: 'boolean', default: 'true', description: 'Steps must be completed in order' },
      { name: 'allCompleted', type: 'boolean', default: 'false', description: 'Mark all steps as completed' },
      { name: 'onStepClick', type: '(stepIndex: number) => void', description: 'Step click handler' },
    ],
  },
  // Phase 4: Advanced Components
  datepicker: {
    name: 'DatePicker',
    description: 'A date selection input with calendar dropdown, supporting multiple date formats.',
    props: [
      { name: 'value', type: 'Date | null', description: 'Selected date' },
      { name: 'onChange', type: '(date: Date | null) => void', description: 'Date change handler' },
      { name: 'format', type: "'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'", default: "'MM/DD/YYYY'", description: 'Date format' },
      { name: 'label', type: 'string', description: 'Input label' },
      { name: 'placeholder', type: 'string', default: "'Select date'", description: 'Placeholder text' },
      { name: 'hasError', type: 'boolean', default: 'false', description: 'Error state' },
      { name: 'helperText', type: 'string', description: 'Helper or error text' },
      { name: 'minDate', type: 'Date', description: 'Minimum selectable date' },
      { name: 'maxDate', type: 'Date', description: 'Maximum selectable date' },
    ],
  },
  icongallery: {
    name: 'IconGallery',
    description: 'A searchable, browsable gallery of all available icons in the design system.',
    props: [
      { name: 'size', type: "'compact' | 'default' | 'large'", default: "'default'", description: 'Gallery density' },
      { name: 'iconSize', type: "'xs' | 's' | 'm' | 'l' | 'xl'", default: "'m'", description: 'Icon display size' },
      { name: 'theme', type: "'light' | 'dark'", default: "'light'", description: 'Color theme' },
      { name: 'searchable', type: 'boolean', default: 'true', description: 'Enable search filtering' },
      { name: 'selectable', type: 'boolean', default: 'false', description: 'Enable icon selection' },
      { name: 'selectedIcon', type: 'IconName', description: 'Currently selected icon' },
      { name: 'onSelectIcon', type: '(iconName: IconName) => void', description: 'Selection handler' },
    ],
  },
  // Widgets
  globalheader: {
    name: 'GlobalHeader',
    description: 'A reusable global application header bar with ThoughtSpot logo, search trigger/input, help, notifications, and profile actions. Designed for use inside AppShell or standalone.',
    props: [
      { name: 'logo', type: 'ReactNode', description: 'Custom logo element (defaults to ThoughtSpot logo)' },
      { name: 'onLogoClick', type: '() => void', description: 'Handler when logo is clicked' },
      { name: 'searchPlaceholder', type: 'string', default: "'Search in ThoughtSpot'", description: 'Placeholder text for the search bar' },
      { name: 'searchMode', type: "'trigger' | 'input'", default: "'trigger'", description: 'Search bar mode: click-to-open trigger or live text input' },
      { name: 'onSearchClick', type: '() => void', description: 'Handler when search trigger is clicked (trigger mode)' },
      { name: 'onSearchChange', type: '(query: string) => void', description: 'Handler when search text changes (input mode)' },
      { name: 'searchValue', type: 'string', default: "''", description: 'Controlled search value (input mode)' },
      { name: 'showKeyboardHint', type: 'boolean', default: 'true', description: 'Show Cmd+K keyboard shortcut badge' },
      { name: 'userName', type: 'string', default: "'Workspace'", description: 'Name displayed in the profile button' },
      { name: 'userAvatar', type: 'string', description: 'Avatar image URL for the profile button' },
      { name: 'notificationCount', type: 'number', default: '0', description: 'Notification badge count (hidden when 0)' },
      { name: 'showHamburger', type: 'boolean', default: 'false', description: 'Show hamburger menu button (for fullscreen modes)' },
      { name: 'onHamburgerClick', type: '() => void', description: 'Handler when hamburger is clicked' },
      { name: 'showDefaultActions', type: 'boolean', default: 'true', description: 'Show help, notification, and profile actions' },
      { name: 'rightSlot', type: 'ReactNode', description: 'Custom content rendered after default actions' },
      { name: 'theme', type: "'auto' | 'light' | 'dark'", default: "'auto'", description: 'auto follows the app theme, like the product nav. light is the older name for auto. dark is the legacy always-dark nav.' },
    ],
  },
  appsidebar: {
    name: 'AppSidebar',
    description: 'A multi-tab application sidebar with icon tab switcher, categorized navigation items, scope toggle, and overlay mode. Data-driven via props for maximum reusability.',
    props: [
      { name: 'tabs', type: 'SidebarTab[]', description: 'Array of tab definitions with id, label, headerTitle, icon, and optional add button' },
      { name: 'activeTab', type: 'string', description: 'Currently active tab ID' },
      { name: 'onTabChange', type: '(tabId: string) => void', description: 'Handler when a tab is selected' },
      { name: 'categories', type: 'Record<string, SidebarCategory[]>', description: 'Navigation categories keyed by tab ID. Each category has a title and array of nav items' },
      { name: 'selectedNav', type: 'string', description: 'Currently selected navigation item ID' },
      { name: 'onNavSelect', type: '(navId: string) => void', description: 'Handler when a navigation item is selected' },
      { name: 'scopeToggle', type: 'ScopeToggle', description: 'Optional scope/org toggle with options array, activeId, and onChange' },
      { name: 'highlightedItem', type: 'string | null', default: 'null', description: 'Item ID to flash-highlight (e.g., after command palette navigation)' },
      { name: 'headerSlot', type: 'ReactNode', description: 'Custom content rendered below the tab title (e.g., search input)' },
      { name: 'isOverlay', type: 'boolean', default: 'false', description: 'Render in overlay mode with shadow (for fullscreen views)' },
      { name: 'theme', type: "'auto' | 'light' | 'dark'", default: "'auto'", description: 'auto follows the app theme, like the product nav. light is the same as auto. dark is the legacy always-dark navy nav.' },
      { name: 'onClose', type: '() => void', description: 'Close handler for overlay mode' },
      { name: 'width', type: 'number', default: '260', description: 'Sidebar width in pixels' },
    ],
  },
  appshell: {
    name: 'AppShell',
    description: 'A complete application shell layout that composes GlobalHeader and AppSidebar with a content area. Handles sidebar visibility, overlay mode, and an overlay slot for modals and command palettes.',
    props: [
      { name: 'headerProps', type: 'GlobalHeaderProps', description: 'Props passed to the GlobalHeader component' },
      { name: 'sidebarProps', type: 'AppSidebarProps', description: 'Props passed to the AppSidebar component' },
      { name: 'hideSidebar', type: 'boolean', default: 'false', description: 'Hide sidebar for fullscreen content mode (enables hamburger toggle)' },
      { name: 'overlaySlot', type: 'ReactNode', description: 'Content rendered above everything (command palette, modals, etc.)' },
      { name: 'contentBackground', type: 'string', default: "brandColors.gray[10]", description: 'Background color of the main content area' },
      { name: 'children', type: 'ReactNode', description: 'Main content rendered in the content area' },
    ],
  },
  // ── Layout Primitives ────────────────────────────────────────────────────
  horizontal: {
    name: 'Horizontal',
    description: 'Flex-row layout primitive. Always prefer this over writing inline display:flex styles. Accepts gap, align, justify, and wrap props.',
    props: [
      { name: 'gap', type: 'number | string', description: 'Gap between children (px number or CSS string)' },
      { name: 'align', type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'", default: "'center'", description: 'align-items value' },
      { name: 'justify', type: "'start' | 'center' | 'end' | 'space-between' | 'space-around'", default: "'start'", description: 'justify-content value' },
      { name: 'wrap', type: 'boolean', default: 'false', description: 'Allow children to wrap' },
    ],
  },
  vertical: {
    name: 'Vertical',
    description: 'Flex-column layout primitive. Always prefer this over writing inline display:flex column styles.',
    props: [
      { name: 'gap', type: 'number | string', description: 'Gap between children' },
      { name: 'align', type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'", default: "'stretch'", description: 'align-items value' },
      { name: 'justify', type: "'start' | 'center' | 'end' | 'space-between' | 'space-around'", default: "'start'", description: 'justify-content value' },
    ],
  },
  view: {
    name: 'View',
    description: 'Generic flex container with all flex properties configurable including direction.',
    props: [
      { name: 'flexDirection', type: "'row' | 'column' | 'row-reverse' | 'column-reverse'", description: 'Flex direction' },
      { name: 'gap', type: 'number | string', description: 'Gap between children' },
      { name: 'align', type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'", description: 'align-items value' },
      { name: 'justify', type: "'start' | 'center' | 'end' | 'space-between' | 'space-around'", description: 'justify-content value' },
    ],
  },
  grid: {
    name: 'Grid / RdGrid',
    description: 'CSS grid layout component. RdGrid is a Scaligent-compatible alias. Use RdGridItem for child spanning.',
    props: [
      { name: 'columns', type: 'number | string', description: 'Number of columns (number = repeat(n, 1fr)) or full grid-template-columns string' },
      { name: 'gap', type: 'number | string', description: 'Both row and column gap' },
      { name: 'rowGap', type: 'number | string', description: 'Row gap only' },
      { name: 'colGap', type: 'number | string', description: 'Column gap only' },
      { name: 'autoRows', type: 'string', description: 'grid-auto-rows value' },
      { name: 'RdGridItem.colSpan', type: 'number', description: 'How many columns this item spans' },
      { name: 'RdGridItem.rowSpan', type: 'number', description: 'How many rows this item spans' },
      { name: 'RdGridItem.colStart', type: 'number', description: 'Which column line to start at' },
    ],
  },
  splitpane: {
    name: 'SplitPane',
    description: 'Resizable two-panel layout. Drag the divider to resize. Works with pointer events — no external library.',
    props: [
      { name: 'left', type: 'ReactNode', description: 'Content for the left/top panel' },
      { name: 'right', type: 'ReactNode', description: 'Content for the right/bottom panel' },
      { name: 'defaultSize', type: 'number', default: '50', description: 'Initial size of left panel as a percentage' },
      { name: 'minSize', type: 'number', default: '20', description: 'Minimum size of left panel (%)' },
      { name: 'maxSize', type: 'number', default: '80', description: 'Maximum size of left panel (%)' },
      { name: 'direction', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Split direction' },
    ],
  },
  // ── Display & Content ────────────────────────────────────────────────────
  nodata: {
    name: 'NoData',
    description: 'Empty-state component with slots for illustration, title, description, and a call-to-action.',
    props: [
      { name: 'title', type: 'string', default: "'No data available'", description: 'Primary heading' },
      { name: 'description', type: 'string', description: 'Explanatory text below the title' },
      { name: 'illustration', type: 'ReactNode', description: 'Illustration or icon above the title' },
      { name: 'action', type: 'ReactNode', description: 'CTA button or link below the description' },
      { name: 'layout', type: "'stack' | 'horizontal'", default: "'stack'", description: 'horizontal is the Figma Muted layout: icon left, text right' },
      { name: 'type', type: "'page' | 'section'", default: "'section'", description: 'Horizontal only. section: 32px status icon; page: status illustration' },
      { name: 'status', type: "'empty' | 'warning' | 'success'", default: "'empty'", description: 'Horizontal only. Picks the status icon or illustration' },
      { name: 'icon', type: 'ReactNode', description: 'Horizontal section only. Replaces the status icon' },
      { name: 'primaryAction', type: '{ label, onClick? }', description: 'Horizontal only. Small primary button' },
      { name: 'secondaryAction', type: '{ label, onClick? }', description: 'Horizontal only. Small secondary button' },
      { name: 'link', type: '{ label, onClick? }', description: 'Horizontal only. Tertiary link after the buttons' },
    ],
  },
  explainercard: {
    name: 'ExplainerCard',
    description: 'Educational card with an icon, title, description body, and optional CTA. Use to explain features or onboard users.',
    usage: {
      use: [
        'Opened by a click: show the dismiss button, and keep it open until people dismiss it or click outside',
        'Opened by hover: no dismiss button, and close it when the pointer leaves',
        'Keep the text to 4 lines or fewer',
      ],
    },
    props: [
      { name: 'title', type: 'string', description: 'Card heading. Leave it out for the title-less layout' },
      { name: 'description', type: 'ReactNode', description: 'Body text (required)' },
      { name: 'icon', type: 'ReactNode', description: 'Leading icon element' },
      { name: 'action', type: 'ReactNode', description: 'CTA button or link' },
      { name: 'variant', type: "'default' | 'highlighted'", default: "'default'", description: 'Background style' },
      { name: 'appearance', type: "'bordered' | 'raised'", default: "'bordered'", description: 'raised is the Figma card: menu shadow, no border, radius 6, 18/24 title' },
      { name: 'media', type: 'ReactNode', description: 'Image or video, 300 x 170 with radius 6' },
      { name: 'onDismiss', type: '() => void', description: 'Shows a 24px close button' },
      { name: 'primaryAction', type: '{ label, onClick? }', description: 'Small primary button' },
      { name: 'secondaryAction', type: '{ label, onClick? }', description: 'Small tertiary button before the primary' },
    ],
  },
  image: {
    name: 'Image',
    description: 'Image component with graceful error fallback and aspect-ratio control.',
    props: [
      { name: 'src', type: 'string', description: 'Image URL' },
      { name: 'alt', type: 'string', description: 'Alt text' },
      { name: 'fallback', type: 'ReactNode', description: 'Content to show on load error' },
      { name: 'aspectRatio', type: 'string', description: "Aspect ratio e.g. '16/9'" },
      { name: 'objectFit', type: "'cover' | 'contain' | 'fill'", default: "'cover'", description: 'CSS object-fit' },
      { name: 'rounded', type: 'boolean', default: 'false', description: 'Apply border radius' },
    ],
  },
  illustration: {
    name: 'Illustration',
    description: 'ThoughtSpot illustration wrapper. Use in empty states, error pages, and onboarding.',
    props: [
      { name: 'id', type: "'no-data' | 'error' | 'no-results' | 'welcome' | 'no-access' | 'loading' | 'success' | 'empty-search' | string", description: 'Illustration identifier' },
      { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Size: sm=80px md=120px lg=160px xl=240px' },
    ],
  },
  legend: {
    name: 'Legend',
    description: 'Color-keyed label list for chart legends, data series, and status keys.',
    props: [
      { name: 'items', type: 'LegendItem[]', description: 'Array of { color, label, value? }' },
      { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Layout direction' },
      { name: 'dotShape', type: "'circle' | 'square' | 'line'", default: "'circle'", description: 'Shape of the color indicator' },
    ],
  },
  safehtml: {
    name: 'SafeHTML',
    description: 'Renders an HTML string safely — strips <script> tags, event handlers, and javascript: hrefs before injecting.',
    props: [
      { name: 'html', type: 'string', description: 'HTML string to render (required)' },
      { name: 'as', type: 'string', default: "'div'", description: 'Wrapper element tag name' },
    ],
  },
  overlayloading: {
    name: 'OverlayLoading',
    description: 'Absolute-positioned loading overlay that blocks its parent container. The parent must be position: relative.',
    props: [
      { name: 'isVisible', type: 'boolean', description: 'Whether the overlay is shown (required)' },
      { name: 'text', type: 'string', description: 'Loading label text' },
      { name: 'transparent', type: 'boolean', default: 'false', description: 'Semi-transparent background instead of opaque' },
    ],
  },
  // ── Form Extensions ──────────────────────────────────────────────────────
  formcontrol: {
    name: 'FormControl',
    description: 'Wraps any form field with a label, helper text, and error message. The htmlFor prop wires the label to the input.',
    props: [
      { name: 'label', type: 'string', description: 'Label text' },
      { name: 'helperText', type: 'string', description: 'Helper text below the field' },
      { name: 'error', type: 'boolean', default: 'false', description: 'Whether the field is in an error state' },
      { name: 'errorMessage', type: 'string', description: 'Error message shown when error=true' },
      { name: 'required', type: 'boolean', default: 'false', description: 'Show required asterisk' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the wrapper' },
      { name: 'htmlFor', type: 'string', description: "Links the label's for attribute to an input id" },
      { name: 'children', type: 'ReactNode', description: 'The form field to wrap (required)' },
    ],
  },
  searchbar: {
    name: 'SearchBar',
    description: 'Full-featured search bar with leading icon, clear button, and loading state. Distinct from SearchInput (simpler).',
    props: [
      { name: 'value', type: 'string', description: 'Controlled value' },
      { name: 'placeholder', type: 'string', default: "'Search'", description: 'Placeholder text' },
      { name: 'onChange', type: '(value: string) => void', description: 'Change handler — receives the string value directly' },
      { name: 'onSearch', type: '(value: string) => void', description: 'Called when Enter is pressed' },
      { name: 'onClear', type: '() => void', description: 'Called when clear button is clicked' },
      { name: 'loading', type: 'boolean', default: 'false', description: 'Show spinner instead of search icon' },
      { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height: sm=28px md=32px lg=40px' },
    ],
  },
  numericfilterinput: {
    name: 'NumericFilterInput',
    description: 'Numeric filter with operator selection (=, ≠, >, ≥, <, ≤, between). When between is selected, a second value input appears.',
    props: [
      { name: 'value', type: 'NumericFilterValue', description: '{ operator, value, value2? }' },
      { name: 'onChange', type: '(v: NumericFilterValue) => void', description: 'Change handler' },
      { name: 'label', type: 'string', description: 'Label above the control' },
      { name: 'placeholder', type: 'string', description: 'Input placeholder' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
    ],
  },
  directioncontrol: {
    name: 'DirectionControl',
    description: 'LTR / Auto / RTL text-direction selector rendered as connected toggle buttons with directional icons.',
    props: [
      { name: 'value', type: "'ltr' | 'rtl' | 'auto'", description: 'Selected direction (required)' },
      { name: 'onChange', type: "(v: 'ltr' | 'rtl' | 'auto') => void", description: 'Change handler' },
      { name: 'label', type: 'string', description: 'Label above the control' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
    ],
  },
  colorpicker: {
    name: 'ColorPicker',
    description: 'Color picker with three selector modes: hex (native browser input), rgb (R/G/B sliders), and palette (swatch grid).',
    props: [
      { name: 'value', type: 'string', description: 'Current CSS color string' },
      { name: 'onChange', type: '(color: string) => void', description: 'Change handler' },
      { name: 'selectorType', type: "'hex' | 'rgb' | 'palette'", default: "'hex'", description: 'Which mode to show' },
      { name: 'palette', type: 'string[]', description: 'Swatch colors for palette mode (defaults to 12 common colors)' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
    ],
  },
  inputmentions: {
    name: 'InputMentions',
    description: '@mention autocomplete textarea. Detects @ trigger, filters suggestions, supports keyboard navigation (↑↓ Enter Esc).',
    props: [
      { name: 'value', type: 'string', description: 'Controlled value' },
      { name: 'onChange', type: '(value: string) => void', description: 'Change handler' },
      { name: 'suggestions', type: 'MentionSuggestion[]', description: '{ id, label, avatar? }[]' },
      { name: 'onMention', type: '(query: string) => void', description: 'Called on every @ query change (for async loading)' },
      { name: 'placeholder', type: 'string', description: 'Textarea placeholder' },
    ],
  },
  filtermodal: {
    name: 'FilterModal',
    description: 'Self-contained filter modal with multiple section types. Tracks local state and calls onApply when confirmed.',
    props: [
      { name: 'isOpen', type: 'boolean', description: 'Whether the modal is open (required)' },
      { name: 'onClose', type: '() => void', description: 'Close handler (required)' },
      { name: 'sections', type: 'FilterSection[]', description: '{ id, label, type: checkbox|radio|range|search, options? }[]' },
      { name: 'value', type: 'Record<string, unknown>', description: 'Controlled filter values' },
      { name: 'onChange', type: '(value) => void', description: 'Called on every section change' },
      { name: 'onApply', type: '(value) => void', description: 'Called when Apply Filters is clicked' },
      { name: 'onReset', type: '() => void', description: 'Called when Reset is clicked' },
      { name: 'title', type: 'string', default: "'Filters'", description: 'Modal title' },
    ],
  },
  // ── Interaction ──────────────────────────────────────────────────────────
  actionmenu: {
    name: 'ActionMenu',
    description: 'Compound contextual menu. Attach to any trigger element. Supports keyboard navigation, grouping, and destructive items.',
    props: [
      { name: 'trigger', type: 'ReactElement', description: 'Element that opens the menu on click (required)' },
      { name: 'placement', type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'", default: "'bottom-start'", description: 'Menu placement relative to trigger' },
      { name: 'onOpen', type: '() => void', description: 'Called when menu opens' },
      { name: 'onClose', type: '() => void', description: 'Called when menu closes' },
      { name: 'ActionMenu.Item.label', type: 'string', description: 'Item label text (required)' },
      { name: 'ActionMenu.Item.icon', type: 'ReactNode', description: 'Leading icon' },
      { name: 'ActionMenu.Item.destructive', type: 'boolean', default: 'false', description: 'Red tint for destructive actions' },
      { name: 'ActionMenu.Item.shortcut', type: 'string', description: 'Keyboard shortcut display (e.g. "⌘D")' },
      { name: 'ActionMenu.Group.label', type: 'string', description: 'Optional group header label' },
    ],
  },
  verticalstepper: {
    name: 'VerticalStepper',
    description: 'Vertical step-by-step progression with connector lines, status indicators, and expandable content per step.',
    props: [
      { name: 'steps', type: 'VerticalStepItem[]', description: '{ title, description?, status?, content? }[]' },
      { name: 'currentStep', type: 'number', description: 'Index of the currently active step (overrides per-step status)' },
      { name: 'onStepClick', type: '(index: number) => void', description: 'Called when a step is clicked' },
    ],
  },
  list: {
    name: 'List',
    description: 'Generic list with optional HTML5 drag-and-drop reordering. Accepts a renderItem render prop for full customisation.',
    props: [
      { name: 'items', type: 'T[]', description: 'Array of items (must have id: string)' },
      { name: 'renderItem', type: '(item: T, index: number) => ReactNode', description: 'Render function for each item (required)' },
      { name: 'draggable', type: 'boolean', default: 'false', description: 'Enable drag-and-drop reordering' },
      { name: 'onReorder', type: '(items: T[]) => void', description: 'Called after a drag-drop reorder' },
      { name: 'emptyState', type: 'ReactNode', description: 'Content to show when items is empty' },
    ],
  },
  slider: {
    name: 'Slider',
    description: 'Styled range slider with CSS fill gradient, label, value display, and optional tick marks.',
    props: [
      { name: 'value', type: 'number', description: 'Current value (required)' },
      { name: 'min', type: 'number', default: '0', description: 'Minimum value' },
      { name: 'max', type: 'number', default: '100', description: 'Maximum value' },
      { name: 'step', type: 'number', default: '1', description: 'Step increment' },
      { name: 'onChange', type: '(value: number) => void', description: 'Change handler' },
      { name: 'showValue', type: 'boolean', default: 'false', description: 'Show numeric value label' },
      { name: 'label', type: 'string', description: 'Label above the slider' },
      { name: 'marks', type: '{ value: number; label?: string }[]', description: 'Tick mark positions' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
    ],
  },
  managedlist: {
    name: 'ManagedList',
    description: 'List with built-in add, remove, and edit controls. Optional search filtering.',
    props: [
      { name: 'items', type: 'ManagedListItem[]', description: '{ id, label }[] (required)' },
      { name: 'onAdd', type: '() => void', description: 'Called when Add button is clicked' },
      { name: 'onRemove', type: '(id: string) => void', description: 'Called when trash icon is clicked' },
      { name: 'onEdit', type: '(id: string) => void', description: 'Called when pencil icon is clicked' },
      { name: 'addLabel', type: 'string', default: "'Add item'", description: 'Add button label' },
      { name: 'searchable', type: 'boolean', default: 'false', description: 'Show search input' },
      { name: 'renderItem', type: '(item) => ReactNode', description: 'Custom item renderer' },
    ],
  },
  trending: {
    name: 'Trending',
    description: 'Trending / popular items with count badges and trend direction arrows. Supports flat list or sectioned layout.',
    props: [
      { name: 'items', type: 'TrendingItem[]', description: 'Flat list of items — { id, label, count?, trend?, icon?, onClick? }' },
      { name: 'sections', type: 'TrendingSectionData[]', description: 'Sectioned layout — { title, items }[]' },
      { name: 'maxItems', type: 'number', description: 'Limit items shown per section' },
    ],
  },
  nestedcheckbox: {
    name: 'NestedCheckbox',
    description: 'Checkbox tree with automatic indeterminate parent state. When some (not all) children are checked, the parent shows indeterminate.',
    props: [
      { name: 'items', type: 'NestedCheckboxItem[]', description: '{ id, label, checked?, children? }[] (required)' },
      { name: 'onChange', type: '(items: NestedCheckboxItem[]) => void', description: 'Called with updated items on every toggle' },
    ],
  },
  managetags: {
    name: 'ManageTags',
    description: 'Tag creation (Enter or comma) and removal. Optional suggestions dropdown appears as you type.',
    props: [
      { name: 'tags', type: 'string[]', description: 'Current tags (required)' },
      { name: 'onChange', type: '(tags: string[]) => void', description: 'Change handler' },
      { name: 'maxTags', type: 'number', description: 'Maximum number of tags' },
      { name: 'placeholder', type: 'string', default: "'Add a tag'", description: 'Input placeholder' },
      { name: 'suggestions', type: 'string[]', description: 'Autocomplete suggestions shown on focus' },
    ],
  },
  // ── Data Visualization ───────────────────────────────────────────────────
  tree: {
    name: 'Tree',
    description: 'Recursive hierarchical list with expand/collapse, click selection, and optional checkbox mode.',
    props: [
      { name: 'nodes', type: 'TreeNode[]', description: '{ id, label, icon?, children?, disabled? }[] (required)' },
      { name: 'selectedIds', type: 'string[]', description: 'Selected node IDs' },
      { name: 'expandedIds', type: 'string[]', description: 'Controlled expanded IDs' },
      { name: 'onSelect', type: '(id: string) => void', description: 'Called when a node is selected' },
      { name: 'onExpand', type: '(id: string) => void', description: 'Called when a node is expanded/collapsed' },
      { name: 'checkable', type: 'boolean', default: 'false', description: 'Show checkboxes instead of highlight selection' },
    ],
  },
  treetable: {
    name: 'TreeTable',
    description: 'Tree structure with columnar data. Tree labels in the first column, additional columns show node.data values.',
    props: [
      { name: 'nodes', type: 'TreeTableNode[]', description: 'Tree nodes with optional data: Record<string, unknown>' },
      { name: 'columns', type: 'TreeTableColumn[]', description: '{ id, label, width?, render? }[] (required)' },
      { name: 'selectedIds', type: 'string[]', description: 'Selected node IDs' },
      { name: 'onSelect', type: '(id: string) => void', description: 'Selection handler' },
      { name: 'onExpand', type: '(id: string) => void', description: 'Expand handler' },
    ],
  },
  formatters: {
    name: 'Formatters',
    description: 'Data formatter namespace. Formatters.Text, .Number (Intl), .Line (SVG sparkline), .Interval, .Background, .Marker.',
    props: [
      { name: 'Formatters.Text.value', type: 'string | number', description: 'Text value to display' },
      { name: 'Formatters.Text.bold', type: 'boolean', default: 'false', description: 'Bold weight' },
      { name: 'Formatters.Number.value', type: 'number', description: 'Numeric value' },
      { name: 'Formatters.Number.format', type: "'currency' | 'percent' | 'decimal' | 'integer' | 'compact'", default: "'decimal'", description: 'Number format' },
      { name: 'Formatters.Number.currency', type: 'string', default: "'USD'", description: 'Currency code for currency format' },
      { name: 'Formatters.Line.data', type: 'number[]', description: 'Series data for sparkline' },
      { name: 'Formatters.Interval.start', type: 'Date | string', description: 'Start date/time' },
      { name: 'Formatters.Interval.format', type: "'duration' | 'range'", default: "'range'", description: 'Duration or date range display' },
      { name: 'Formatters.Marker.color', type: 'string', description: 'Dot color' },
      { name: 'Formatters.Marker.size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Dot size' },
    ],
  },
  // ── Advanced ─────────────────────────────────────────────────────────────
  tour: {
    name: 'Tour',
    description: 'Guided walkthrough with spotlight overlay. Positions popovers using getBoundingClientRect on CSS selectors. No external library.',
    props: [
      { name: 'steps', type: 'TourStep[]', description: '{ target: string (CSS selector), title?, content, placement? }[]' },
      { name: 'isRunning', type: 'boolean', description: 'Whether the tour is active (required)' },
      { name: 'onFinish', type: '() => void', description: 'Called after the last step' },
      { name: 'onSkip', type: '() => void', description: 'Called when Skip is clicked' },
      { name: 'startIndex', type: 'number', default: '0', description: 'Step to start from' },
      { name: 'tone', type: "'default' | 'brand'", default: "'default'", description: 'brand is the Figma spotlight card: brand fill, inverse text, "2 of 4" counter, white tertiary buttons' },
    ],
  },
  richtexteditor: {
    name: 'RichTextEditor',
    description: 'WYSIWYG rich text editor using contenteditable and document.execCommand. No external library required.',
    props: [
      { name: 'value', type: 'string', description: 'HTML string initial content' },
      { name: 'onChange', type: '(html: string) => void', description: 'Called on every edit with the current innerHTML' },
      { name: 'placeholder', type: 'string', description: 'Placeholder text when empty' },
      { name: 'toolbar', type: "('bold' | 'italic' | 'underline' | 'link' | 'list' | 'heading' | 'blockquote')[]", description: 'Toolbar items to show (defaults to bold, italic, underline, list)' },
      { name: 'readOnly', type: 'boolean', default: 'false', description: 'Disables editing and hides toolbar' },
      { name: 'minHeight', type: 'number', default: '120', description: 'Minimum editor height in px' },
    ],
  },
  formbuilder: {
    name: 'FormBuilder',
    description: 'Config-driven form renderer. Pass a fields array and it renders the correct input type with validation.',
    props: [
      { name: 'fields', type: 'FormField[]', description: '{ id, type, label, required?, options?, validation? }[]' },
      { name: 'value', type: 'Record<string, unknown>', description: 'Controlled form values' },
      { name: 'onChange', type: '(value) => void', description: 'Called on every field change' },
      { name: 'onSubmit', type: '(value) => void', description: 'Called on valid form submission' },
      { name: 'submitLabel', type: 'string', default: "'Submit'", description: 'Submit button label' },
    ],
  },
  dynamicform: {
    name: 'DynamicForm',
    description: 'FormBuilder with managed internal state and error utilities. Export hasDynamicFormError(fields, value) for validation.',
    props: [
      { name: 'fields', type: 'FormField[]', description: 'Form field definitions (required)' },
      { name: 'initialValue', type: 'Record<string, unknown>', description: 'Initial form values' },
      { name: 'onChange', type: '(value) => void', description: 'Called on every change' },
      { name: 'onSubmit', type: '(value) => void', description: 'Called on valid submission' },
      { name: 'submitLabel', type: 'string', default: "'Submit'", description: 'Submit button label' },
    ],
  },
  facetsortbar: {
    name: 'FacetSortBar',
    description: 'Horizontal bar with facet pill toggles on the left (filter by category) and sort selector on the right.',
    props: [
      { name: 'facets', type: 'FacetOption[]', description: '{ id, label, count? }[]' },
      { name: 'selectedFacet', type: 'string', description: 'Currently active facet ID' },
      { name: 'onFacetChange', type: '(id: string) => void', description: 'Facet change handler' },
      { name: 'sortOptions', type: 'SortOption[]', description: '{ id, label }[]' },
      { name: 'selectedSort', type: 'string', description: 'Currently selected sort ID' },
      { name: 'onSortChange', type: '(id: string) => void', description: 'Sort change handler' },
    ],
  },
  // Liveboard
  liveboardheader: {
    name: 'LiveboardHeader',
    description: 'Unified Liveboard header that renders PrimaryNav + ViewHeader in view mode, or EditToolbar + EditSubHeader in edit mode. Handles tabs, filters, personalised views, and SpotterViz toggle.',
    props: [
      { name: 'mode', type: "'view' | 'edit'", description: 'Current Liveboard mode' },
      { name: 'title', type: 'string', description: 'Liveboard title' },
      { name: 'activeTab', type: 'string', description: 'Currently active tab ID' },
      { name: 'tabs', type: '{ label: string; id: string }[]', description: 'Tab definitions' },
      { name: 'filters', type: '{ label: string; value: string }[]', description: 'Active filter chips' },
      { name: 'onTabChange', type: '(id: string) => void', description: 'Tab change handler' },
      { name: 'onEdit', type: '() => void', description: 'Enter edit mode' },
      { name: 'onSave', type: '() => void', description: 'Save and exit edit mode' },
      { name: 'onCancel', type: '() => void', description: 'Cancel and exit edit mode' },
      { name: 'onToggleSpotter', type: '() => void', description: 'Toggle SpotterViz side panel (edit mode)' },
      { name: 'spotterOpen', type: 'boolean', default: 'false', description: 'Whether SpotterViz panel is open' },
    ],
  },
};

const getSourceBadgeStyle = (source: ComponentSource): React.CSSProperties => {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '14px',
    fontWeight: 500,
    padding: '4px 12px',
    borderRadius: '20px',
    fontFamily: 'var(--font-family-primary)',
  };
  switch (source) {
    case 'figma':
      return { ...base, backgroundColor: sysVar('background-accent-purple-subtle'), color: sysVar('content-accent-purple') };
    case 'scaligent':
      return { ...base, backgroundColor: 'var(--rd-sys-color-background-success)', color: 'var(--rd-sys-color-content-success)' };
    case 'custom':
    default:
      return { ...base, backgroundColor: 'var(--rd-sys-color-background-subtle)', color: 'var(--rd-sys-color-content-secondary)' };
  }
};

export const ComponentDocPage: React.FC<ComponentDocPageProps> = ({ componentId }) => {
  const doc = componentDocs[componentId];
  const meta = getComponent(componentId);
  
  // State for interactive examples
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [toggleChecked, setToggleChecked] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');
  const [selectValue, setSelectValue] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [globalHeaderTheme, setGlobalHeaderTheme] = useState<'auto' | 'dark'>('auto');
  // New component states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [paginationPage, setPaginationPage] = useState(1);
  const [stepperStep, setStepperStep] = useState(1);
  const [progressValue, setProgressValue] = useState(45);
  const [segmentedValue, setSegmentedValue] = useState('day');
  // New component states (Phase 1-4)
  const [searchBarValue, setSearchBarValue] = useState('');
  const [tableSelection, setTableSelection] = useState<string[]>([]);
  // Props start collapsed on every component page, unless the link points at them
  const [openPropsFor, setOpenPropsFor] = useState<string | null>(() =>
    typeof window !== 'undefined' && window.location.hash === '#props' ? componentId : null);
  const propsOpen = openPropsFor === componentId;
  const [sliderValue, setSliderValue] = useState(40);
  const [managedItems, setManagedItems] = useState([
    { id: '1', label: 'Item one' },
    { id: '2', label: 'Item two' },
    { id: '3', label: 'Item three' },
  ]);
  const [trendingTags, setTrendingTags] = useState(['design', 'react']);
  const [directionValue, setDirectionValue] = useState<'ltr' | 'rtl' | 'auto'>('ltr');
  const [colorValue, setColorValue] = useState('#2770EF');
  const [numericFilter, setNumericFilter] = useState({ operator: 'gt' as const, value: 100 });
  const [listItems, setListItems] = useState([
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' },
    { id: 'c', label: 'Gamma' },
  ]);
  const [nestedItems, setNestedItems] = useState([
    { id: 'parent1', label: 'Category A', checked: false, children: [
      { id: 'child1', label: 'Item 1', checked: false },
      { id: 'child2', label: 'Item 2', checked: false },
    ]},
    { id: 'parent2', label: 'Category B', checked: true, children: [
      { id: 'child3', label: 'Item 3', checked: true },
      { id: 'child4', label: 'Item 4', checked: true },
    ]},
  ]);
  const [selectedTreeIds, setSelectedTreeIds] = useState<string[]>([]);
  const [richText, setRichText] = useState('<p>Start typing <strong>rich</strong> text here…</p>');
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [userChipSelected, setUserChipSelected] = useState<string[]>(['Leo Park']);
  const [userChipPeople, setUserChipPeople] = useState<string[]>(['Priya Shah', 'Leo Park', 'Ana García']);
  const [editableTokens, setEditableTokens] = useState<TokenType[]>(['measure', 'attribute', 'condition', 'date']);
  const [editHeaderDirty, setEditHeaderDirty] = useState(false);
  const [editHeaderTab, setEditHeaderTab] = useState('tables');
  const [pageHeaderTab, setPageHeaderTab] = useState('tables');
  const [isBrandTourRunning, setIsBrandTourRunning] = useState(false);
  const [wizardHeaderStep, setWizardHeaderStep] = useState(2);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedFacet, setSelectedFacet] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [lbMode, setLbMode] = useState<'view' | 'edit'>('view');
  const [lbActiveTab, setLbActiveTab] = useState('overview');
  const [lbSpotterOpen, setLbSpotterOpen] = useState(false);

  if (!doc) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Component not found</h1>
      </div>
    );
  }

  const renderExample = () => {
    switch (componentId) {
      case 'button':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleRow}>
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="tertiary">Tertiary Button</Button>
            </div>
            <div style={styles.exampleRow}>
              <Button variant="primary" size="small">Small</Button>
              <Button variant="primary" size="basic">Basic</Button>
              <Button variant="primary" size="large">Large</Button>
            </div>
            <div style={styles.exampleRow}>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="primary" loading>Loading</Button>
            </div>
          </div>
        );
      
      case 'checkbox':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleColumn}>
              <Checkbox label="Unchecked" checked={false} onChange={() => {}} />
              <Checkbox label="Checked" checked={true} onChange={() => {}} />
              <Checkbox label="Indeterminate" indeterminate onChange={() => {}} />
              <Checkbox label="Disabled" disabled />
              <Checkbox label="Error state" error />
            </div>
            <div style={styles.interactiveBox}>
              <h4 style={styles.interactiveLabel}>Try it:</h4>
              <Checkbox 
                label="Interactive checkbox" 
                checked={checkboxChecked} 
                onChange={setCheckboxChecked} 
              />
            </div>
          </div>
        );
      
      case 'radio':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleColumn}>
              <Radio name="demo" value="option1" label="Option 1" checked={radioValue === 'option1'} onChange={setRadioValue} />
              <Radio name="demo" value="option2" label="Option 2" checked={radioValue === 'option2'} onChange={setRadioValue} />
              <Radio name="demo" value="option3" label="Option 3" checked={radioValue === 'option3'} onChange={setRadioValue} />
            </div>
            <div style={styles.exampleColumn}>
              <Radio label="Disabled" disabled />
              <Radio label="Error state" error />
            </div>
          </div>
        );
      
      case 'toggle':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleColumn}>
              <Toggle label="Off state" checked={false} onChange={() => {}} />
              <Toggle label="On state" checked={true} onChange={() => {}} />
              <Toggle label="Disabled" disabled />
              <Toggle label="Label on right" labelPosition="right" checked={toggleChecked} onChange={setToggleChecked} />
            </div>
          </div>
        );
      
      case 'textinput':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleColumn}>
              <TextInput label="Default" placeholder="Enter text..." value={textValue} onChange={(e) => setTextValue(e.target.value)} />
              <TextInput label="Disabled" placeholder="Disabled input" disabled />
              <TextInput label="Error" error errorMessage="This field is required" value="Invalid value" />
            </div>
            <RadiantLook>
              <div style={styles.exampleColumn}>
                <TextInput label="Label" helperText="helper text - optional" placeholder="Text" />
                <TextInput label="Label" helperText="helper text - optional" value="Text" error />
                <TextInput label="Label" helperText="helper text - optional" placeholder="Text" disabled />
                <TextInput label="Label" helperText="helper text - optional" value="Text" readOnly />
              </div>
            </RadiantLook>
          </div>
        );
      
      case 'textarea':
        return (
          <div style={styles.exampleContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
              <TextArea 
                label="Description" 
                placeholder="Enter a description..." 
                rows={4}
              />
              <TextArea 
                label="Bio" 
                placeholder="Tell us about yourself..." 
                maxLength={200}
                helperText="Max 200 characters"
              />
              <TextArea 
                label="Comment" 
                error 
                errorMessage="This field is required"
                rows={3}
              />
              <TextArea 
                label="Disabled" 
                placeholder="This textarea is disabled"
                disabled
              />
            </div>
            <RadiantLook>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
                <TextArea label="Label" helperText="helper text - optional" placeholder="Text" rows={4} />
                <TextArea label="Label" helperText="helper text - optional" value="Text" error rows={4} />
                <TextArea label="Label" helperText="helper text - optional" placeholder="Text" rows={4} disabled />
              </div>
            </RadiantLook>
          </div>
        );
      
      case 'searchinput':
        return (
          <div style={styles.exampleContent}>
            <div style={{ maxWidth: '320px' }}>
              <SearchInput 
                placeholder="Search..." 
                value={searchValue} 
                onChange={(e) => setSearchValue(e.target.value)} 
                onClear={() => setSearchValue('')}
              />
            </div>
            <div style={{ maxWidth: '320px' }}>
              <SearchInput variant="underlined" placeholder="Search in this list" />
            </div>
          </div>
        );
      
      case 'chip':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleRow}>
              <Chip type="attribute" label="Country" />
              <Chip type="measure" label="Revenue" />
              <Chip type="filter" label="Status" filterValue="Active" />
              <Chip type="skeleton" label="Drag a column" />
            </div>
            <div style={styles.exampleRow}>
              <Chip type="attribute" label="Deletable chip" deletable onDelete={() => alert('Deleted!')} />
              <Chip type="attribute" label="Disabled" disabled />
            </div>
          </div>
        );
      
      case 'alert':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleColumn}>
              <Alert status="info" message="This is an informational message." dismissible={false} />
              <Alert status="success" message="Operation completed successfully!" dismissible={false} />
              <Alert status="warning" message="Please review before proceeding." dismissible={false} />
              <Alert status="failure" message="An error occurred. Please try again." dismissible={false} />
              <Alert status="muted" message="This is a muted notification." dismissible={false} />
            </div>
          </div>
        );
      
      case 'toast':
        return (
          <div style={styles.exampleContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Toast type="success" message="Changes saved successfully" duration={0} />
              <Toast type="info" message="New updates available" duration={0} />
              <Toast type="warning" message="Your session will expire soon" duration={0} />
              <Toast type="error" message="Failed to save changes" duration={0} />
              <Toast 
                type="info" 
                message="Item deleted" 
                actionText="Undo"
                onAction={() => {}}
                duration={0} 
              />
            </div>
          </div>
        );
      
      case 'modal':
        return (
          <div style={styles.exampleContent}>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Open Modal
            </Button>
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Example Modal"
              size="small"
              footer={
                <>
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" onClick={() => setIsModalOpen(false)}>Confirm</Button>
                </>
              }
            >
              <p style={{ margin: 0, color: sysVar('content-primary') }}>
                This is the modal content. You can put any content here.
              </p>
            </Modal>
          </div>
        );
      
      case 'tabs':
        return (
          <div style={styles.exampleContent}>
            <Tabs
              tabs={[
                { id: 'tab1', label: 'First Tab' },
                { id: 'tab2', label: 'Second Tab' },
                { id: 'tab3', label: 'Third Tab' },
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            <div style={{ marginTop: '16px', padding: '16px', background: sysVar('background-sunken'), borderRadius: '8px' }}>
              Content for {activeTab}
            </div>
          </div>
        );

      case 'select':
        return (
          <div style={styles.exampleContent}>
            <div style={{ maxWidth: '320px' }}>
              <Select
                label="Country"
                placeholder="Select a country"
                options={[
                  { id: 'us', label: 'United States' },
                  { id: 'ca', label: 'Canada' },
                  { id: 'uk', label: 'United Kingdom' },
                  { id: 'de', label: 'Germany' },
                  { id: 'fr', label: 'France' },
                ]}
                value={selectValue}
                onChange={(value) => setSelectValue(value)}
              />
            </div>
            <div style={{ maxWidth: '320px' }}>
              <Select
                label="Searchable select"
                placeholder="Search and select..."
                searchable
                options={[
                  { id: 'opt1', label: 'Option 1' },
                  { id: 'opt2', label: 'Option 2' },
                  { id: 'opt3', label: 'Option 3' },
                  { id: 'opt4', label: 'Option 4' },
                  { id: 'opt5', label: 'Option 5' },
                ]}
                value=""
                onChange={() => {}}
              />
            </div>
            <div style={styles.exampleRow}>
              <Select
                placeholder="Disabled"
                disabled
                options={[{ id: '1', label: 'Option' }]}
              />
              <Select
                placeholder="Error state"
                error
                errorMessage="Please select an option"
                options={[{ id: '1', label: 'Option' }]}
              />
            </div>
            <RadiantLook>
              <div style={styles.exampleColumn}>
                <Select label="Label" helperText="helper text - optional" placeholder="Select" options={[{ id: '1', label: 'Option' }]} />
                <Select label="Label" helperText="helper text - optional" placeholder="Select" error options={[{ id: '1', label: 'Option' }]} />
              </div>
            </RadiantLook>
          </div>
        );

      case 'segmentedcontrol':
        return (
          <div style={styles.exampleContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <Typography variant="overline" style={{ marginBottom: '8px', display: 'block' }}>Text Variant</Typography>
                <SegmentedControl
                  options={[
                    { id: 'day', label: 'Day' },
                    { id: 'week', label: 'Week' },
                    { id: 'month', label: 'Month' },
                    { id: 'year', label: 'Year' },
                  ]}
                  value={segmentedValue}
                  onChange={setSegmentedValue}
                />
              </div>
              <div>
                <Typography variant="overline" style={{ marginBottom: '8px', display: 'block' }}>Size Variants</Typography>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
                  <SegmentedControl
                    size="small"
                    options={[
                      { id: 'a', label: 'Small' },
                      { id: 'b', label: 'Option' },
                    ]}
                    value="a"
                    onChange={() => {}}
                  />
                  <SegmentedControl
                    size="default"
                    options={[
                      { id: 'a', label: 'Default' },
                      { id: 'b', label: 'Option' },
                    ]}
                    value="a"
                    onChange={() => {}}
                  />
                  <SegmentedControl
                    size="large"
                    options={[
                      { id: 'a', label: 'Large' },
                      { id: 'b', label: 'Option' },
                    ]}
                    value="a"
                    onChange={() => {}}
                  />
                </div>
              </div>
              <div>
                <Typography variant="overline" style={{ marginBottom: '8px', display: 'block' }}>Full Width</Typography>
                <SegmentedControl
                  fullWidth
                  options={[
                    { id: 'opt1', label: 'Option 1' },
                    { id: 'opt2', label: 'Option 2' },
                    { id: 'opt3', label: 'Option 3' },
                  ]}
                  value="opt1"
                  onChange={() => {}}
                />
              </div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div style={styles.exampleContent}>
            <Table
              columns={[
                { key: 'name', label: 'Name', sortable: true },
                { key: 'email', label: 'Email' },
                { key: 'role', label: 'Role' },
                { key: 'status', label: 'Status', render: (value) => (
                  <Chip 
                    label={value as string} 
                    type="attribute"
                  />
                )},
              ]}
              data={[
                { id: '1', name: 'Alex Johnson', email: 'alex@example.com', role: 'Admin', status: 'Active' },
                { id: '2', name: 'Sarah Chen', email: 'sarah@example.com', role: 'User', status: 'Active' },
                { id: '3', name: 'Mike Roberts', email: 'mike@example.com', role: 'User', status: 'Pending' },
              ]}
              rowKey="id"
              hoverable
            />
            <RadiantLook>
              <Table
                selectable
                selectedKeys={tableSelection}
                onSelectionChange={setTableSelection}
                columns={[
                  { key: 'name', label: 'Name', sortable: true, render: TableCellRenderers.title({ descriptionKey: 'description', errorKey: 'error', icon: 'table' }) },
                  { key: 'columns', label: 'Columns', render: TableCellRenderers.tokens({ type: 'attribute', max: 2 }) },
                  { key: 'owner', label: 'Owner', sortable: true },
                  { key: 'open', label: '', width: '96px', render: TableCellRenderers.button({ label: 'Open', onClick: () => {} }) },
                  { key: 'more', label: '', width: '56px', render: TableCellRenderers.iconButton({ icon: 'more', label: 'More actions', onClick: () => {} }) },
                ]}
                data={[
                  { id: 'a', name: 'Retail sales', description: 'Orders, returns and stores', columns: ['Region', 'Revenue', 'Store'], owner: 'Alex Johnson' },
                  { id: 'b', name: 'Marketing spend', description: 'Campaigns by channel', columns: ['Channel', 'Spend'], owner: 'Sarah Chen' },
                  { id: 'c', name: 'Support tickets', error: 'Could not load ticketing system data', columns: ['Priority'], owner: 'Mike Roberts' },
                ]}
                rowKey="id"
                hoverable
              />
            </RadiantLook>
          </div>
        );

      case 'tooltip':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleRow}>
              <Tooltip content="This is a tooltip" placement="top">
                <Button variant="secondary">Hover me (top)</Button>
              </Tooltip>
              <Tooltip content="Bottom tooltip" placement="bottom">
                <Button variant="secondary">Hover me (bottom)</Button>
              </Tooltip>
              <Tooltip content="Left tooltip" placement="left">
                <Button variant="secondary">Hover me (left)</Button>
              </Tooltip>
              <Tooltip content="Right tooltip" placement="right">
                <Button variant="secondary">Hover me (right)</Button>
              </Tooltip>
            </div>
            <div style={styles.exampleRow}>
              <Tooltip 
                content="This tooltip has a longer content that wraps to multiple lines to show how it handles text."
                placement="top"
                maxWidth={200}
              >
                <Button variant="tertiary">Long content tooltip</Button>
              </Tooltip>
            </div>
          </div>
        );

      case 'popover':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleRow}>
              <Popover
                content={
                  <div style={{ padding: '8px', minWidth: '150px' }}>
                    <Button variant="tertiary" fullWidth style={{ justifyContent: 'flex-start' }}>Edit</Button>
                    <Button variant="tertiary" fullWidth style={{ justifyContent: 'flex-start' }}>Duplicate</Button>
                    <Button variant="tertiary" fullWidth style={{ justifyContent: 'flex-start', color: sysVar('content-failure') }}>Delete</Button>
                  </div>
                }
                placement="bottom-start"
              >
                <Button variant="secondary">Click for menu</Button>
              </Popover>
              
              <Popover
                content={
                  <div style={{ padding: '12px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: sysVar('content-primary') }}>
                      This popover appears on hover
                    </p>
                  </div>
                }
                trigger="hover"
                placement="bottom"
              >
                <Button variant="secondary">Hover for info</Button>
              </Popover>
            </div>
            <div style={styles.interactiveBox}>
              <h4 style={styles.interactiveLabel}>Controlled popover:</h4>
              <Popover
                content={
                  <div style={{ padding: '12px' }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Controlled popover content</p>
                    <Button variant="primary" size="small" onClick={() => setIsPopoverOpen(false)}>
                      Close
                    </Button>
                  </div>
                }
                isOpen={isPopoverOpen}
                onOpenChange={setIsPopoverOpen}
              >
                <Button variant="primary" onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
                  {isPopoverOpen ? 'Close popover' : 'Open popover'}
                </Button>
              </Popover>
            </div>
          </div>
        );

      // Phase 2: Core Components
      case 'loadingindicator':
        return (
          <div style={styles.exampleContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <Typography variant="overline" style={{ marginBottom: '8px', display: 'block' }}>Contextual Spinner</Typography>
                <div style={styles.exampleRow}>
                  <LoadingIndicator.Contextual size="xs" />
                  <LoadingIndicator.Contextual size="s" />
                  <LoadingIndicator.Contextual size="m" />
                  <LoadingIndicator.Contextual size="l" />
                  <LoadingIndicator.Contextual size="xl" />
                </div>
                <div style={{ ...styles.exampleRow, marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: sysVar('content-secondary') }}>xs (12px)</span>
                  <span style={{ fontSize: '12px', color: sysVar('content-secondary') }}>s (16px)</span>
                  <span style={{ fontSize: '12px', color: sysVar('content-secondary') }}>m (24px)</span>
                  <span style={{ fontSize: '12px', color: sysVar('content-secondary') }}>l (32px)</span>
                  <span style={{ fontSize: '12px', color: sysVar('content-secondary') }}>xl (48px)</span>
                </div>
              </div>
              <div>
                <Typography variant="overline" style={{ marginBottom: '8px', display: 'block' }}>Skeleton / Shimmer</Typography>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '320px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <LoadingIndicator.Skeleton variant="circular" width={40} height={40} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <LoadingIndicator.Skeleton variant="text" width="60%" />
                      <LoadingIndicator.Skeleton variant="text" width="80%" />
                    </div>
                  </div>
                  <LoadingIndicator.Skeleton variant="rounded" width="100%" height={120} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <LoadingIndicator.Skeleton variant="rectangular" width={80} height={24} />
                    <LoadingIndicator.Skeleton variant="rectangular" width={80} height={24} />
                    <LoadingIndicator.Skeleton variant="rectangular" width={80} height={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'avatar':
        return (
          <div style={styles.exampleContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <Typography variant="overline" style={{ marginBottom: '8px', display: 'block' }}>Size Variants</Typography>
                <div style={styles.exampleRow}>
                  <Avatar name="Alice Brown" size="xs" />
                  <Avatar name="Bob Chen" size="s" />
                  <Avatar name="Carol Davis" size="m" />
                  <Avatar name="Dan Evans" size="l" />
                  <Avatar name="Eve Foster" size="xl" />
                  <Avatar name="Frank Green" size="xxl" />
                </div>
              </div>
              <div>
                <Typography variant="overline" style={{ marginBottom: '8px', display: 'block' }}>With Name and Badge</Typography>
                <div style={styles.exampleRow}>
                  <Avatar name="Grace Hill" showName />
                  <Avatar name="Henry Irwin" showName badgeValue={5} />
                  <Avatar name="Iris James" showName showBadge />
                </div>
              </div>
              <div>
                <Typography variant="overline" style={{ marginBottom: '8px', display: 'block' }}>Avatar Group (Stacked)</Typography>
                <AvatarGroup
                  avatars={[
                    { name: 'John Doe' },
                    { name: 'Jane Smith' },
                    { name: 'Bob Wilson' },
                    { name: 'Alice Brown' },
                    { name: 'Charlie Davis' },
                    { name: 'Eve Foster' },
                  ]}
                  max={4}
                  size="m"
                />
              </div>
              <div>
                <Typography variant="overline" style={{ marginBottom: '8px', display: 'block' }}>Avatar Group Sizes</Typography>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <AvatarGroup
                    avatars={[
                      { name: 'User A' },
                      { name: 'User B' },
                      { name: 'User C' },
                    ]}
                    max={3}
                    size="s"
                  />
                  <AvatarGroup
                    avatars={[
                      { name: 'User A' },
                      { name: 'User B' },
                      { name: 'User C' },
                      { name: 'User D' },
                      { name: 'User E' },
                    ]}
                    max={3}
                    size="m"
                  />
                  <AvatarGroup
                    avatars={[
                      { name: 'User A' },
                      { name: 'User B' },
                      { name: 'User C' },
                    ]}
                    max={3}
                    size="l"
                  />
                </div>
              </div>
              <div>
                <Typography variant="overline" style={{ marginBottom: '8px', display: 'block' }}>Disabled</Typography>
                <div style={styles.exampleRow}>
                  <Avatar name="Kevin Lee" disabled />
                </div>
              </div>
            </div>
          </div>
        );

      case 'card':
        return (
          <div style={styles.exampleContent}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <Card>
                <Card.Header title="Basic Card" subtitle="With header and body" />
                <Card.Body>
                  <p style={{ margin: 0, color: sysVar('content-primary') }}>Card content goes here.</p>
                </Card.Body>
              </Card>
              <Card interactive onClick={() => alert('Card clicked!')}>
                <Card.Header title="Interactive Card" />
                <Card.Body>
                  <p style={{ margin: 0, color: sysVar('content-primary') }}>Click me!</p>
                </Card.Body>
              </Card>
              <Card isSelected>
                <Card.Header title="Selected Card" />
                <Card.Body>
                  <p style={{ margin: 0, color: sysVar('content-primary') }}>This card is selected.</p>
                </Card.Body>
                <Card.Footer>
                  <Button variant="secondary" size="small">Cancel</Button>
                  <Button variant="primary" size="small">Save</Button>
                </Card.Footer>
              </Card>
              <Card isDisabled>
                <Card.Header title="Disabled Card" />
                <Card.Body>
                  <p style={{ margin: 0, color: sysVar('content-primary') }}>This card is disabled.</p>
                </Card.Body>
              </Card>
            </div>
          </div>
        );

      case 'typography':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleColumn}>
              <Typography variant="headline-large">Headline Large (32px)</Typography>
              <Typography variant="page-title">Page Title (24px)</Typography>
              <Typography variant="modal-title">Modal Title (20px)</Typography>
              <Typography variant="section-label">Section Label (18px)</Typography>
              <Typography variant="content-label">Content Label (16px)</Typography>
              <Typography variant="body-large">Body Large (16px)</Typography>
              <Typography variant="body-normal">Body Normal (14px)</Typography>
              <Typography variant="footnote" color="gray">Footnote (12px)</Typography>
              <Typography variant="overline" color="gray-light">OVERLINE (12px)</Typography>
            </div>
            <div style={styles.exampleRow}>
              <Typography variant="body-normal" color="accent">Accent color</Typography>
              <Typography variant="body-normal" color="success">Success color</Typography>
              <Typography variant="body-normal" color="warning">Warning color</Typography>
              <Typography variant="body-normal" color="failure">Failure color</Typography>
            </div>
          </div>
        );

      case 'divider':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleColumn}>
              <p style={{ margin: 0, color: sysVar('content-primary') }}>Content above divider</p>
              <Divider />
              <p style={{ margin: 0, color: sysVar('content-primary') }}>Content below divider</p>
            </div>
            <div style={styles.exampleColumn}>
              <p style={{ margin: 0, color: sysVar('content-primary') }}>With spacing="m"</p>
              <Divider spacing="m" />
              <p style={{ margin: 0, color: sysVar('content-primary') }}>More space around</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '40px' }}>
              <span>Item 1</span>
              <Divider vertical />
              <span>Item 2</span>
              <Divider vertical />
              <span>Item 3</span>
            </div>
          </div>
        );

      case 'link':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleRow}>
              <Link href="#">Default Link</Link>
              <Link href="#" color="black">Black Link</Link>
              <Link href="#" color="gray">Gray Link</Link>
            </div>
            <div style={styles.exampleRow}>
              <Link href="#" size="small">Small Link</Link>
              <Link href="#">Default Size</Link>
              <Link href="#" size="large">Large Link</Link>
            </div>
            <div style={styles.exampleRow}>
              <Link href="https://example.com" target="_blank" external>External Link</Link>
              <Link href="#" disabled>Disabled Link</Link>
              <Link href="#" noUnderline>No underline on hover</Link>
            </div>
          </div>
        );

      // Phase 3: Interactive Components
      case 'accordion':
        return (
          <div style={styles.exampleContent}>
            <Accordion defaultExpanded={0}>
              <Accordion.Item title="What is Radiant?">
                Radiant is ThoughtSpot's design system providing reusable components and design tokens.
              </Accordion.Item>
              <Accordion.Item title="How do I get started?">
                Import components from the component library and use design tokens for consistent styling.
              </Accordion.Item>
              <Accordion.Item title="Is it customizable?" disabled>
                This item is disabled.
              </Accordion.Item>
            </Accordion>
            <div style={{ marginTop: '24px' }}>
              <h4 style={styles.interactiveLabel}>Bordered variant:</h4>
              <Accordion variant="bordered" allowMultiple>
                <Accordion.Item title="Section 1">Content for section 1</Accordion.Item>
                <Accordion.Item title="Section 2">Content for section 2</Accordion.Item>
              </Accordion>
            </div>
            <div style={{ marginTop: '24px' }} data-demo="accordion-card">
              <h4 style={styles.interactiveLabel}>Card variant:</h4>
              <Accordion variant="card" defaultExpanded={0}>
                <Accordion.Item title="What is a Liveboard?">
                  A Liveboard is a set of answers pinned together, so you can track the numbers that matter in one place.
                </Accordion.Item>
                <Accordion.Item title="Who can see my answers?">
                  Only people you share an answer with, or who can see the Liveboard it is pinned to.
                </Accordion.Item>
                <Accordion.Item title="Can I schedule a report?" disabled>
                  This item is disabled.
                </Accordion.Item>
              </Accordion>
            </div>
          </div>
        );

      case 'menu':
        return (
          <div style={styles.exampleContent}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <h4 style={styles.interactiveLabel}>Basic Menu:</h4>
                <Menu>
                  <Menu.Item onClick={() => alert('Edit')}>Edit</Menu.Item>
                  <Menu.Item onClick={() => alert('Duplicate')}>Duplicate</Menu.Item>
                  <Menu.Item shortcut="Cmd+S">Save</Menu.Item>
                  <Menu.Divider />
                  <Menu.Item danger onClick={() => alert('Delete')}>Delete</Menu.Item>
                </Menu>
              </div>
              <div>
                <h4 style={styles.interactiveLabel}>With Groups:</h4>
                <Menu>
                  <Menu.Group label="Actions">
                    <Menu.Item active>Copy</Menu.Item>
                    <Menu.Item>Paste</Menu.Item>
                  </Menu.Group>
                  <Menu.Divider />
                  <Menu.Group label="Other">
                    <Menu.Item disabled>Disabled item</Menu.Item>
                    <Menu.Item>Settings</Menu.Item>
                  </Menu.Group>
                </Menu>
              </div>
            </div>
          </div>
        );

      case 'pagination':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleColumn}>
              <h4 style={styles.interactiveLabel}>Numbers:</h4>
              <Pagination.Numbers
                currentPage={paginationPage}
                totalPages={10}
                onPageChange={setPaginationPage}
              />
            </div>
            <div style={styles.exampleColumn}>
              <h4 style={styles.interactiveLabel}>Dots (for carousels):</h4>
              <Pagination.Dots
                currentPage={paginationPage}
                totalPages={5}
                onPageChange={setPaginationPage}
              />
            </div>
            <div style={styles.exampleColumn}>
              <h4 style={styles.interactiveLabel}>Range:</h4>
              <Pagination.Range
                currentPage={paginationPage}
                totalPages={10}
                itemsPerPage={20}
                totalItems={195}
                onPageChange={setPaginationPage}
              />
            </div>
          </div>
        );

      case 'progressbar':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleColumn}>
              <ProgressBar value={progressValue} label="Upload Progress" showValue />
              <ProgressBar value={75} color="blue" />
              <ProgressBar value={40} color="yellow" size="small" />
              <ProgressBar value={90} color="red" size="large" />
            </div>
            <div style={styles.exampleColumn}>
              <h4 style={styles.interactiveLabel}>Indeterminate:</h4>
              <ProgressBar value={0} indeterminate color="blue" />
            </div>
            <div style={styles.interactiveBox}>
              <h4 style={styles.interactiveLabel}>Interactive: {progressValue}%</h4>
              <input
                type="range"
                min="0"
                max="100"
                value={progressValue}
                onChange={(e) => setProgressValue(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        );

      case 'stepper':
        return (
          <div style={styles.exampleContent}>
            <div style={styles.exampleColumn}>
              <h4 style={styles.interactiveLabel}>Horizontal:</h4>
              <Stepper
                steps={[
                  { title: 'Account' },
                  { title: 'Profile' },
                  { title: 'Review' },
                  { title: 'Complete' },
                ]}
                currentStep={stepperStep}
                onStepClick={setStepperStep}
              />
            </div>
            <div style={{ marginTop: '32px' }}>
              <h4 style={styles.interactiveLabel}>Vertical with descriptions:</h4>
              <Stepper
                orientation="vertical"
                steps={[
                  { title: 'Create account', description: 'Enter your email and password' },
                  { title: 'Setup profile', description: 'Add your personal details' },
                  { title: 'Complete', description: 'Review and finish' },
                ]}
                currentStep={stepperStep}
                onStepClick={setStepperStep}
              />
            </div>
            <div style={styles.interactiveBox}>
              <h4 style={styles.interactiveLabel}>Current Step: {stepperStep + 1}</h4>
              <div style={styles.exampleRow}>
                <Button size="small" variant="secondary" onClick={() => setStepperStep(Math.max(0, stepperStep - 1))} disabled={stepperStep === 0}>
                  Previous
                </Button>
                <Button size="small" variant="primary" onClick={() => setStepperStep(Math.min(3, stepperStep + 1))} disabled={stepperStep === 3}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        );

      // Phase 4: Advanced Components
      case 'datepicker':
        return (
          <div style={styles.exampleContent}>
            <div style={{ maxWidth: '280px' }}>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                label="Select a date"
                placeholder="MM/DD/YYYY"
              />
            </div>
            <div style={{ maxWidth: '280px' }}>
              <DatePicker
                value={null}
                onChange={() => {}}
                label="With error"
                hasError
                helperText="Please select a valid date"
              />
            </div>
            <div style={styles.interactiveBox}>
              <h4 style={styles.interactiveLabel}>Selected date:</h4>
              <p style={{ margin: 0, color: sysVar('content-primary') }}>
                {selectedDate ? selectedDate.toLocaleDateString() : 'No date selected'}
              </p>
            </div>
          </div>
        );

      case 'icongallery':
        return (
          <div style={styles.exampleContent}>
            <IconGallery size="compact" iconSize="m" />
          </div>
        );

      case 'globalheader':
        return (
          <div style={styles.exampleContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Tabs
                tabs={[
                  { id: 'auto', label: 'Follows theme' },
                  { id: 'dark', label: 'Legacy dark' },
                ]}
                activeTab={globalHeaderTheme}
                onTabChange={(id) => setGlobalHeaderTheme(id as 'auto' | 'dark')}
              />
              <Typography variant="body-normal" style={{ color: sysVar('content-secondary') }}>
                By default the header follows the app theme, like the product nav with the Radiant theme on. Switch the theme with the control in the sidebar or Ctrl+D.
              </Typography>
              <div>
                <Typography variant="overline" style={{ marginBottom: '8px', display: 'block' }}>Trigger mode (default)</Typography>
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${sysVar('border-divider')}` }}>
                  <GlobalHeader
                    theme={globalHeaderTheme}
                    userName="Acme Apparel"
                    notificationCount={3}
                    onSearchClick={() => alert('Search clicked — open command palette')}
                    onLogoClick={() => alert('Logo clicked — navigate home')}
                  />
                </div>
              </div>
              <div>
                <Typography variant="overline" style={{ marginBottom: '8px', display: 'block' }}>Input mode</Typography>
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${sysVar('border-divider')}` }}>
                  <GlobalHeader
                    theme={globalHeaderTheme}
                    searchMode="input"
                    searchPlaceholder="Search library"
                    userName="Acme Corp"
                    showKeyboardHint={false}
                  />
                </div>
              </div>
              <div>
                <Typography variant="overline" style={{ marginBottom: '8px', display: 'block' }}>With hamburger (fullscreen mode)</Typography>
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${sysVar('border-divider')}` }}>
                  <GlobalHeader
                    theme={globalHeaderTheme}
                    showHamburger
                    onHamburgerClick={() => alert('Hamburger clicked — toggle sidebar overlay')}
                    userName="Demo User"
                    notificationCount={0}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'appsidebar':
        return (
          <div style={styles.exampleContent}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ height: '480px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${sysVar('border-divider')}` }}>
                <AppSidebar
                  tabs={[
                    { id: 'insights', label: 'Insights', headerTitle: 'Insights', showAddButton: true },
                    { id: 'data', label: 'Data', headerTitle: 'Data workspace', showAddButton: true },
                    { id: 'develop', label: 'Develop', headerTitle: 'Develop' },
                    { id: 'admin', label: 'Admin', headerTitle: 'Admin' },
                  ]}
                  activeTab="insights"
                  onTabChange={() => {}}
                  categories={{
                    insights: [
                      { title: 'Main', items: [
                        { id: 'Home', label: 'Home' },
                        { id: 'Spotter', label: 'Spotter' },
                        { id: 'Search data', label: 'Search data' },
                      ]},
                      { title: 'Library', items: [
                        { id: 'Liveboards', label: 'Liveboards' },
                        { id: 'Answers', label: 'Answers' },
                        { id: 'Collections', label: 'Collections' },
                      ]},
                      { title: 'Analysis & Alerts', items: [
                        { id: 'Liveboard schedules', label: 'Liveboard schedules' },
                        { id: 'Monitor subscriptions', label: 'Monitor subscriptions' },
                      ]},
                    ],
                    data: [
                      { title: 'Main', items: [
                        { id: 'Data objects', label: 'Data objects' },
                        { id: 'Connections', label: 'Connections' },
                      ]},
                    ],
                    develop: [
                      { title: 'Main', items: [
                        { id: 'Dev Home', label: 'Home' },
                      ]},
                    ],
                    admin: [
                      { title: 'Overview', items: [
                        { id: 'Resource control centre', label: 'Resource control centre' },
                      ]},
                    ],
                  }}
                  selectedNav="Home"
                  onNavSelect={() => {}}
                />
              </div>
            </div>
          </div>
        );

      case 'appshell':
        return (
          <div style={styles.exampleContent}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <a
                href="/preview/appshell"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: sysVar('content-brand'),
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                View fullscreen ↗
              </a>
            </div>
            <div style={{ height: '500px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${sysVar('border-divider')}`, position: 'relative' }}>
              <AppShell
                headerProps={{
                  userName: 'Demo User',
                  notificationCount: 2,
                  onSearchClick: () => {},
                  onLogoClick: () => {},
                }}
                sidebarProps={{
                  tabs: [
                    { id: 'insights', label: 'Insights', headerTitle: 'Insights', showAddButton: true },
                    { id: 'data', label: 'Data', headerTitle: 'Data workspace' },
                    { id: 'admin', label: 'Admin', headerTitle: 'Admin' },
                  ],
                  activeTab: 'insights',
                  onTabChange: () => {},
                  categories: {
                    insights: [
                      { title: 'Main', items: [
                        { id: 'Home', label: 'Home' },
                        { id: 'Spotter', label: 'Spotter' },
                      ]},
                      { title: 'Library', items: [
                        { id: 'Liveboards', label: 'Liveboards' },
                        { id: 'Answers', label: 'Answers' },
                      ]},
                    ],
                    data: [
                      { title: 'Main', items: [{ id: 'Data objects', label: 'Data objects' }] },
                    ],
                    admin: [
                      { title: 'Overview', items: [{ id: 'Resource control centre', label: 'Resource control centre' }] },
                    ],
                  },
                  selectedNav: 'Home',
                  onNavSelect: () => {},
                }}
              >
                <div style={{ padding: '32px' }}>
                  <Typography variant="page-title">Home</Typography>
                  <Typography variant="body-normal" color="gray" style={{ marginTop: '8px' }}>
                    This is the main content area rendered inside the AppShell. The header and sidebar are composed automatically.
                  </Typography>
                </div>
              </AppShell>
            </div>
          </div>
        );

      // ── Layout Primitives ──────────────────────────────────────────────
      case 'horizontal':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Horizontal gap={8} align="center">
              <Button variant="primary" size="small">Save</Button>
              <Button variant="secondary" size="small">Cancel</Button>
            </Horizontal>
            <Horizontal gap={16} justify="space-between">
              <span style={{ fontSize: 14, color: sysVar('content-primary') }}>Left content</span>
              <span style={{ fontSize: 14, color: sysVar('content-secondary') }}>Right content</span>
            </Horizontal>
            <Horizontal gap={8} wrap>
              {['React', 'TypeScript', 'Vite', 'CSS Modules', 'Radiant'].map(t => (
                <span key={t} style={{ padding: '4px 10px', background: sysVar('background-subtle'), borderRadius: 99, fontSize: 12 }}>{t}</span>
              ))}
            </Horizontal>
          </div>
        );

      case 'vertical':
        return (
          <Vertical gap={12} style={{ maxWidth: 320 }}>
            <TextInput label="First name" placeholder="Enter first name" value="" onChange={() => {}} />
            <TextInput label="Last name" placeholder="Enter last name" value="" onChange={() => {}} />
            <Toggle label="Subscribe to updates" checked={false} onChange={() => {}} />
          </Vertical>
        );

      case 'view':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <View flexDirection="row" gap={8} align="center" justify="space-between">
              <span style={{ fontSize: 14 }}>row / space-between</span>
              <Button variant="secondary" size="small">Action</Button>
            </View>
            <View flexDirection="column" gap={8}>
              <span style={{ fontSize: 14 }}>column layout</span>
              <Button variant="primary" size="small">Submit</Button>
            </View>
          </div>
        );

      case 'grid':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Grid columns={3} gap={12}>
              {['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'].map(n => (
                <div key={n} style={{ background: sysVar('background-subtle'), borderRadius: 8, padding: '12px 16px', fontSize: 13, textAlign: 'center' }}>{n}</div>
              ))}
            </Grid>
            <Grid columns={3} gap={12}>
              <RdGridItem colSpan={2} style={{ background: sysVar('background-information'), borderRadius: 8, padding: '12px 16px', fontSize: 13 }}>Spans 2 columns</RdGridItem>
              <div style={{ background: sysVar('background-subtle'), borderRadius: 8, padding: '12px 16px', fontSize: 13 }}>1 column</div>
            </Grid>
          </div>
        );

      case 'splitpane':
        return (
          <div style={{ height: 200, border: `1px solid ${sysVar('border-default')}`, borderRadius: 8, overflow: 'hidden' }}>
            <SplitPane
              left={<div style={{ padding: 16, height: '100%', background: sysVar('background-subtle'), fontSize: 13 }}>Left panel — drag the divider to resize</div>}
              right={<div style={{ padding: 16, height: '100%', fontSize: 13 }}>Right panel content</div>}
              defaultSize={35}
            />
          </div>
        );

      // ── Display & Content ──────────────────────────────────────────────
      case 'nodata':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <NoData
              illustration={<Illustration id="no-results" size="md" />}
              title="No results found"
              description="Try adjusting your search or filter to find what you're looking for."
              action={<Button variant="secondary" size="small">Clear filters</Button>}
            />
            <NoData title="No data available" description="Connect a data source to get started." />
            <div data-demo="nodata-horizontal" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <h4 style={styles.interactiveLabel}>Horizontal layout, section type:</h4>
              <NoData
                layout="horizontal"
                status="empty"
                title="No answers yet"
                description="Ask a question to see answers here."
                secondaryAction={{ label: 'Browse data' }}
                primaryAction={{ label: 'Ask a question' }}
                link={{ label: 'Learn more' }}
              />
              <NoData layout="horizontal" status="warning" title="Some columns are missing" description="Reconnect the data source to bring them back." />
              <NoData layout="horizontal" status="success" title="All caught up" description="There are no new alerts." />
              <h4 style={styles.interactiveLabel}>Horizontal layout, page type:</h4>
              <NoData
                layout="horizontal"
                type="page"
                title="No Liveboards yet"
                description="Pin answers to a Liveboard to track them in one place."
                secondaryAction={{ label: 'Import' }}
                primaryAction={{ label: 'Create Liveboard' }}
              />
            </div>
          </div>
        );

      case 'explainercard':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
            <ExplainerCard
              icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: sysVar('content-brand') }}><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              title="Schedule your first report"
              description="Reports can be scheduled to run automatically and delivered to your inbox."
              action={<Button variant="primary" size="small">Set up schedule</Button>}
            />
            <ExplainerCard
              title="Pro tip"
              description="You can pin answers to a Liveboard for quick access."
              variant="highlighted"
            />
            <div data-demo="explainer-raised" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
              <h4 style={styles.interactiveLabel}>Raised appearance:</h4>
              <ExplainerCard
                appearance="raised"
                title="Meet Spotter"
                description="Ask questions about your data in plain language and get answers as charts and tables."
                media={<div style={{ width: '100%', height: '100%' }} />}
                onDismiss={() => {}}
                secondaryAction={{ label: 'Learn more' }}
                primaryAction={{ label: 'Try it' }}
              />
              <ExplainerCard
                appearance="raised"
                description="Answers you pin show up here, so you can find them later."
                onDismiss={() => {}}
              />
            </div>
          </div>
        );

      case 'image':
        return (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Image src="https://picsum.photos/seed/radiant/240/160" alt="Sample image" style={{ width: 240 }} rounded />
            <Image src="broken-url" alt="Fallback demo" style={{ width: 240, height: 160 }} fallback={<div style={{ width: 240, height: 160, background: sysVar('background-subtle'), display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, fontSize: 13, color: sysVar('content-secondary') }}>Image failed to load</div>} />
          </div>
        );

      case 'illustration':
        return (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {(['no-data', 'error', 'success', 'welcome', 'no-access', 'loading'] as const).map(id => (
              <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Illustration id={id} size="sm" />
                <span style={{ fontSize: 11, color: sysVar('content-secondary') }}>{id}</span>
              </div>
            ))}
          </div>
        );

      case 'legend':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Legend items={[{ color: sysVar('content-accent-blue'), label: 'Revenue', value: '$1.2M' }, { color: sysVar('content-accent-green'), label: 'Profit', value: '$340K' }, { color: sysVar('content-accent-yellow'), label: 'Expenses', value: '$860K' }]} orientation="horizontal" />
            <Legend items={[{ color: sysVar('content-accent-blue'), label: 'Completed' }, { color: sysVar('content-accent-yellow'), label: 'In progress' }, { color: sysVar('content-accent-red'), label: 'Blocked' }]} orientation="vertical" dotShape="square" />
          </div>
        );

      case 'safehtml':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14 }}>
            <SafeHTML html="<p>This is <strong>safe HTML</strong> with a <a href='#'>link</a>.</p>" />
            <SafeHTML html="<p>Script injection attempt: &lt;script&gt;alert('xss')&lt;/script&gt; — stripped automatically.</p>" />
          </div>
        );

      case 'overlayloading':
        return (
          <div style={{ position: 'relative', height: 140, border: `1px solid ${sysVar('border-default')}`, borderRadius: 8, padding: 16 }}>
            <p style={{ fontSize: 14 }}>Content underneath the overlay — set isVisible to true to block it.</p>
            <OverlayLoading isVisible={true} text="Loading data…" transparent />
          </div>
        );

      // ── Form Extensions ────────────────────────────────────────────────
      case 'formcontrol':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 400 }}>
            <FormControl label="Email address" helperText="We'll never share your email." htmlFor="fc-email">
              <TextInput id="fc-email" placeholder="you@example.com" value="" onChange={() => {}} />
            </FormControl>
            <FormControl label="Password" error errorMessage="Password must be at least 8 characters." required htmlFor="fc-pass">
              <TextInput id="fc-pass" placeholder="Enter password" value="short" onChange={() => {}} />
            </FormControl>
            <FormControl label="Notes" disabled>
              <TextArea placeholder="Disabled field" disabled rows={2} />
            </FormControl>
          </div>
        );

      case 'searchbar':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 380 }}>
            <SearchBar placeholder="Search components…" value={searchBarValue} onChange={setSearchBarValue} onClear={() => setSearchBarValue('')} size="lg" />
            <SearchBar placeholder="Loading state" loading size="md" />
            <SearchBar placeholder="Small size" size="sm" />
          </div>
        );

      case 'numericfilterinput':
        return (
          <div style={{ maxWidth: 400 }}>
            <NumericFilterInput
              label="Revenue filter"
              value={numericFilter as any}
              onChange={setNumericFilter as any}
              placeholder="Enter value"
            />
          </div>
        );

      case 'directioncontrol':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 300 }}>
            <DirectionControl label="Text direction" value={directionValue} onChange={setDirectionValue} />
            <span style={{ fontSize: 13, color: sysVar('content-secondary') }}>Selected: {directionValue}</span>
            <DirectionControl label="Disabled" value="ltr" disabled />
          </div>
        );

      case 'colorpicker':
        return (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 12, marginBottom: 8, color: sysVar('content-secondary') }}>Hex mode</p>
              <ColorPicker value={colorValue} onChange={setColorValue} selectorType="hex" />
            </div>
            <div>
              <p style={{ fontSize: 12, marginBottom: 8, color: sysVar('content-secondary') }}>Palette mode</p>
              <ColorPicker value={colorValue} onChange={setColorValue} selectorType="palette" />
            </div>
          </div>
        );

      case 'inputmentions':
        return (
          <div style={{ maxWidth: 420 }}>
            <InputMentions
              placeholder="Type @ to mention a user…"
              suggestions={[
                { id: '1', label: 'Alice Johnson' },
                { id: '2', label: 'Bob Smith' },
                { id: '3', label: 'Carol White' },
                { id: '4', label: 'David Brown' },
              ]}
            />
          </div>
        );

      case 'filtermodal':
        return (
          <div>
            <Button variant="secondary" onClick={() => setIsFilterModalOpen(true)}>Open filter modal</Button>
            <FilterModal
              isOpen={isFilterModalOpen}
              onClose={() => setIsFilterModalOpen(false)}
              title="Filter results"
              sections={[
                { id: 'status', label: 'Status', type: 'checkbox', options: [{ id: 'active', label: 'Active' }, { id: 'inactive', label: 'Inactive' }, { id: 'pending', label: 'Pending' }] },
                { id: 'type', label: 'Type', type: 'radio', options: [{ id: 'all', label: 'All types' }, { id: 'answer', label: 'Answers' }, { id: 'liveboard', label: 'Liveboards' }] },
                { id: 'search', label: 'Search', type: 'search' },
              ]}
              onApply={() => setIsFilterModalOpen(false)}
            />
          </div>
        );

      // ── Interaction ────────────────────────────────────────────────────
      case 'actionmenu':
        return (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <ActionMenu
              trigger={<Button variant="secondary" size="small">Actions ▾</Button>}
              placement="bottom-start"
            >
              <ActionMenu.Item label="Edit" onClick={() => {}} />
              <ActionMenu.Item label="Duplicate" onClick={() => {}} />
              <ActionMenu.Item label="Share" onClick={() => {}} />
              <ActionMenu.Group label="Danger zone">
                <ActionMenu.Item label="Delete" destructive onClick={() => {}} />
              </ActionMenu.Group>
            </ActionMenu>
            <ActionMenu
              trigger={<Button variant="tertiary" size="small">⋯</Button>}
              placement="bottom-end"
            >
              <ActionMenu.Item label="Copy link" shortcut="⌘C" onClick={() => {}} />
              <ActionMenu.Item label="Move to folder" onClick={() => {}} />
              <ActionMenu.Item label="Remove" destructive onClick={() => {}} />
            </ActionMenu>
          </div>
        );

      case 'verticalstepper':
        return (
          <div style={{ maxWidth: 420 }}>
            <VerticalStepper
              steps={[
                { title: 'Connect data source', description: 'Link your database or cloud service', status: 'completed' },
                { title: 'Configure schema', description: 'Map tables and relationships', status: 'active', content: <Alert status="info" message="Select the tables you want to include in your workspace." /> },
                { title: 'Set permissions', description: 'Control who can access this data', status: 'pending' },
                { title: 'Deploy', status: 'pending' },
              ]}
            />
          </div>
        );

      case 'list':
        return (
          <div style={{ maxWidth: 360 }}>
            <List
              items={listItems}
              draggable
              onReorder={setListItems}
              renderItem={(item) => (
                <div style={{ padding: '10px 12px', fontSize: 14 }}>{item.label}</div>
              )}
            />
          </div>
        );

      case 'slider':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 380 }}>
            <Slider label="Volume" value={sliderValue} onChange={setSliderValue} showValue />
            <Slider label="Opacity" value={70} onChange={() => {}} min={0} max={100} marks={[{ value: 0, label: '0%' }, { value: 50, label: '50%' }, { value: 100, label: '100%' }]} />
            <Slider label="Disabled" value={30} disabled />
          </div>
        );

      case 'managedlist':
        return (
          <div style={{ maxWidth: 360 }}>
            <ManagedList
              items={managedItems}
              searchable
              onAdd={() => setManagedItems(prev => [...prev, { id: String(Date.now()), label: `Item ${prev.length + 1}` }])}
              onRemove={(id) => setManagedItems(prev => prev.filter(i => i.id !== id))}
            />
          </div>
        );

      case 'trending':
        return (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 200 }}>
              <Trending
                items={[
                  { id: '1', label: 'Revenue by region', count: 142, trend: 'up' },
                  { id: '2', label: 'Monthly active users', count: 89, trend: 'up' },
                  { id: '3', label: 'Churn rate', count: 34, trend: 'down' },
                  { id: '4', label: 'NPS score', count: 21, trend: 'neutral' },
                ]}
                maxItems={4}
              />
            </div>
          </div>
        );

      case 'nestedcheckbox':
        return (
          <div style={{ maxWidth: 320 }}>
            <NestedCheckbox items={nestedItems as any} onChange={setNestedItems as any} />
          </div>
        );

      case 'managetags':
        return (
          <div style={{ maxWidth: 420 }}>
            <ManageTags
              tags={trendingTags}
              onChange={setTrendingTags}
              placeholder="Add a tag…"
              suggestions={['react', 'typescript', 'design-system', 'dashboard', 'analytics', 'charts']}
            />
          </div>
        );

      // ── Data Visualization ─────────────────────────────────────────────
      case 'tree':
        return (
          <div style={{ maxWidth: 320, border: `1px solid ${sysVar('border-default')}`, borderRadius: 8, overflow: 'hidden' }}>
            <Tree
              nodes={[
                { id: 'src', label: 'src', children: [
                  { id: 'components', label: 'components', children: [
                    { id: 'Button', label: 'Button.tsx' },
                    { id: 'Modal', label: 'Modal.tsx' },
                  ]},
                  { id: 'pages', label: 'pages', children: [
                    { id: 'Home', label: 'HomePage.tsx' },
                  ]},
                ]},
                { id: 'public', label: 'public' },
              ]}
              selectedIds={selectedTreeIds}
              onSelect={(id) => setSelectedTreeIds([id])}
            />
          </div>
        );

      case 'treetable':
        return (
          <div style={{ border: `1px solid ${sysVar('border-default')}`, borderRadius: 8, overflow: 'hidden' }}>
            <TreeTable
              nodes={[
                { id: 'q1', label: 'Q1 2026', data: { revenue: '$1.2M', growth: '+12%' }, children: [
                  { id: 'jan', label: 'January', data: { revenue: '$380K', growth: '+8%' } },
                  { id: 'feb', label: 'February', data: { revenue: '$400K', growth: '+11%' } },
                  { id: 'mar', label: 'March', data: { revenue: '$420K', growth: '+18%' } },
                ]},
                { id: 'q2', label: 'Q2 2026', data: { revenue: '$980K', growth: '+4%' } },
              ]}
              columns={[
                { id: 'revenue', label: 'Revenue', width: 120 },
                { id: 'growth', label: 'Growth', width: 100 },
              ]}
            />
          </div>
        );

      case 'formatters':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <div><p style={{ fontSize: 11, color: sysVar('content-secondary'), marginBottom: 4 }}>Text</p><Formatters.Text value="Sample text" bold /></div>
              <div><p style={{ fontSize: 11, color: sysVar('content-secondary'), marginBottom: 4 }}>Currency</p><Formatters.Number value={1234567} format="currency" /></div>
              <div><p style={{ fontSize: 11, color: sysVar('content-secondary'), marginBottom: 4 }}>Percent</p><Formatters.Number value={0.724} format="percent" /></div>
              <div><p style={{ fontSize: 11, color: sysVar('content-secondary'), marginBottom: 4 }}>Compact</p><Formatters.Number value={48200} format="compact" /></div>
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <div><p style={{ fontSize: 11, color: sysVar('content-secondary'), marginBottom: 4 }}>Sparkline</p><Formatters.Line data={[10, 25, 18, 40, 35, 55, 48, 62]} width={100} height={28} /></div>
              <div><p style={{ fontSize: 11, color: sysVar('content-secondary'), marginBottom: 4 }}>Interval</p><Formatters.Interval start="2026-01-01" end="2026-03-31" format="range" /></div>
              <div style={{ display: 'flex', gap: 8 }}><Formatters.Marker color={sysVar('content-accent-green')} /><Formatters.Marker color={sysVar('content-accent-blue')} /><Formatters.Marker color={sysVar('content-accent-red')} size="lg" /></div>
            </div>
          </div>
        );

      // ── Advanced ───────────────────────────────────────────────────────
      case 'tour':
        return (
          <div>
            <div id="tour-target-search" style={{ display: 'inline-block', marginBottom: 16 }}>
              <SearchBar placeholder="Search…" size="md" />
            </div>
            <div>
              <Button variant="secondary" size="small" onClick={() => setIsTourRunning(true)}>Start tour</Button>
            </div>
            <Tour
              steps={[{ target: '#tour-target-search', title: 'Search bar', content: 'Use this to search for any content in ThoughtSpot.', placement: 'bottom' }]}
              isRunning={isTourRunning}
              onFinish={() => setIsTourRunning(false)}
              onSkip={() => setIsTourRunning(false)}
            />
            <div style={{ marginTop: 24 }}>
              <h4 style={styles.interactiveLabel}>Brand tone:</h4>
              <Button variant="secondary" size="small" onClick={() => setIsBrandTourRunning(true)}>Start brand tour</Button>
            </div>
            <Tour
              tone="brand"
              steps={[
                { target: '#tour-target-search', title: 'Search bar', content: 'Use this to search for any content in ThoughtSpot.', placement: 'bottom' },
                { target: '#tour-target-search', title: 'Ask in plain language', content: 'Type a question and Spotter turns it into an answer.', placement: 'bottom' },
                { target: '#tour-target-search', title: 'Pin what matters', content: 'Pin answers to a Liveboard to track them.', placement: 'bottom' },
                { target: '#tour-target-search', title: 'Share', content: 'Share a Liveboard with your team.', placement: 'bottom' },
              ]}
              isRunning={isBrandTourRunning}
              onFinish={() => setIsBrandTourRunning(false)}
              onSkip={() => setIsBrandTourRunning(false)}
            />
          </div>
        );

      case 'pageheader':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div data-demo="pageheader">
              <PageHeader
                breadcrumbs={[{ label: 'Previous page title', onClick: () => {} }]}
                title="Page title"
                description="Page description"
              />
            </div>
            <PageHeader
              breadcrumbs={[{ label: 'Data', onClick: () => {} }, { label: 'Connections', onClick: () => {} }]}
              title="Snowflake prod"
              description="Owned by Data platform. Synced every hour."
              tabs={[
                { id: 'tables', label: 'Tables' },
                { id: 'columns', label: 'Columns' },
                { id: 'settings', label: 'Settings' },
              ]}
              activeTab={pageHeaderTab}
              onTabChange={setPageHeaderTab}
              actions={[{ label: 'Share' }, { label: 'Edit', variant: 'primary' }]}
            />
            <PageHeader title="Liveboards" actions={[{ label: 'Create liveboard', variant: 'primary', icon: 'plus' }]} />
          </div>
        );
      case 'editheader':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div data-demo="editheader" style={{ border: `1px solid ${sysVar('border-subtle')}`, borderRadius: 8, overflow: 'hidden' }}>
              <EditHeader
                title="Sales overview"
                edited={editHeaderDirty}
                onReset={() => setEditHeaderDirty(false)}
                onSave={() => setEditHeaderDirty(false)}
                onExit={() => setEditHeaderDirty(false)}
              />
            </div>
            <div>
              <Button variant="secondary" size="small" onClick={() => setEditHeaderDirty(true)}>Make an edit</Button>
            </div>
            <div style={{ border: `1px solid ${sysVar('border-subtle')}`, borderRadius: 8, overflow: 'hidden' }}>
              <EditHeader
                title="Retail model"
                edited
                tabs={[
                  { id: 'tables', label: 'Tables' },
                  { id: 'columns', label: 'Columns' },
                  { id: 'formulas', label: 'Formulas' },
                  { id: 'filters', label: 'Filters' },
                ]}
                activeTab={editHeaderTab}
                onTabChange={setEditHeaderTab}
                onReset={() => {}}
                onSave={() => {}}
                onExit={() => {}}
              />
            </div>
          </div>
        );
      case 'splitbutton': {
        const splitItems = [
          { label: 'Save as copy' },
          { label: 'Save as template' },
          { label: 'Export' },
        ];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 160 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <SplitButton label="Save" items={splitItems} />
              <SplitButton label="Save" variant="secondary" items={splitItems} />
              <SplitButton label="Reply" icon="undo" iconOnly items={splitItems} />
              <SplitButton label="Reply" icon="undo" iconOnly variant="secondary" items={splitItems} />
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <SplitButton label="Save" mainDisabled items={splitItems} />
              <SplitButton label="Save" menuDisabled items={splitItems} />
              <SplitButton label="Save" variant="secondary" disabled items={splitItems} />
            </div>
          </div>
        );
      }
      case 'dotloader':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
            <div style={{ border: `1px solid ${sysVar('border-subtle')}`, borderRadius: 8 }}>
              <DotLoader />
            </div>
            <div style={{ border: `1px solid ${sysVar('border-subtle')}`, borderRadius: 8 }}>
              <DotLoader message="We're crunching a lot of numbers. Please be patient. Your answer will be here shortly." />
            </div>
          </div>
        );
      case 'scrollarea':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
            <div style={{ border: `1px solid ${sysVar('border-subtle')}`, borderRadius: 8 }}>
              <ScrollArea maxHeight={200} aria-label="Vertical scroll example">
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} style={{ padding: '6px 16px', color: sysVar('content-primary') }}>Column {i + 1}</div>
                ))}
              </ScrollArea>
            </div>
            <div style={{ border: `1px solid ${sysVar('border-subtle')}`, borderRadius: 8 }}>
              <ScrollArea orientation="horizontal" aria-label="Horizontal scroll example">
                <div style={{ display: 'flex', gap: 8, padding: 16, width: 'max-content' }}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <Chip key={i} type="attribute" label={`Column ${i + 1}`} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        );
      case 'token': {
        const tokenTypes: TokenType[] = ['measure', 'attribute', 'condition', 'date'];
        const tokenLabels: Record<TokenType, string> = { measure: 'Revenue', attribute: 'Region', condition: 'Status = Active', date: 'Last 30 days' };
        const row = { display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: 16 };
        const caption = { fontSize: 12, color: sysVar('content-secondary'), margin: 0 };
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div data-demo="token" style={row}>
              {tokenTypes.map((t) => <Token key={t} type={t} label={tokenLabels[t]} />)}
            </div>
            <p style={caption}>Read only, warning and error</p>
            <div style={row}>
              {tokenTypes.map((t) => <Token key={t} type={t} label={tokenLabels[t]} status="warning" />)}
            </div>
            <div style={row}>
              {tokenTypes.map((t) => <Token key={t} type={t} label={tokenLabels[t]} status="error" />)}
            </div>
            <p style={caption}>Editable: hover or focus to remove</p>
            <div style={{ ...row, paddingTop: 8 }}>
              {editableTokens.map((t) => (
                <Token
                  key={t}
                  editable
                  type={t}
                  label={tokenLabels[t]}
                  onClick={() => {}}
                  onRemove={() => setEditableTokens((list) => list.filter((x) => x !== t))}
                />
              ))}
              <Token editable status="error" label="Unknown column" onRemove={() => {}} />
              {editableTokens.length < 4 && (
                <Button variant="tertiary" size="small" onClick={() => setEditableTokens(tokenTypes)}>Reset</Button>
              )}
            </div>
            <p style={caption}>Editable, active and disabled</p>
            <div style={row}>
              {tokenTypes.map((t) => <Token key={t} editable active type={t} label={tokenLabels[t]} />)}
              <Token editable active status="error" label="Unknown column" />
            </div>
            <div style={row}>
              {tokenTypes.map((t) => <Token key={t} editable disabled type={t} label={tokenLabels[t]} />)}
            </div>
          </div>
        );
      }
      case 'chipidentifier':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div data-demo="chipidentifier" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
              <ChipIdentifier label="Label" />
              <ChipIdentifier label="Order ID" />
              <ChipIdentifier label="customer_account_identifier_long_name" maxWidth={160} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: sysVar('content-primary') }}>
              <span>Primary key</span>
              <ChipIdentifier label="Customer ID" />
            </div>
          </div>
        );
      case 'userchip': {
        const toggleUserChip = (n: string) =>
          setUserChipSelected((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
        const row = { display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: 12 };
        const caption = { fontSize: 12, color: sysVar('content-secondary'), margin: 0 };
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div data-demo="userchip" style={row}>
              {userChipPeople.map((n) => (
                <UserChip
                  key={n}
                  name={n}
                  selected={userChipSelected.includes(n)}
                  onClick={() => toggleUserChip(n)}
                  onRemove={() => setUserChipPeople((p) => p.filter((x) => x !== n))}
                />
              ))}
              {userChipPeople.length < 3 && (
                <Button variant="tertiary" size="small" onClick={() => setUserChipPeople(['Priya Shah', 'Leo Park', 'Ana García'])}>Reset</Button>
              )}
            </div>
            <p style={caption}>Without remove</p>
            <div style={row}>
              <UserChip name="Priya Shah" />
              <UserChip name="Leo Park" selected />
            </div>
            <p style={caption}>Disabled</p>
            <div style={row}>
              <UserChip name="Priya Shah" onRemove={() => {}} disabled />
              <UserChip name="Leo Park" selected onRemove={() => {}} disabled />
            </div>
          </div>
        );
      }
      case 'breadcrumb':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div data-demo="breadcrumb">
              <Breadcrumb
                items={[{ label: 'Previous page title', onClick: () => {} }, { label: 'Page title' }]}
                showCurrent={false}
              />
            </div>
            <Breadcrumb
              items={[
                { label: 'Data', onClick: () => {} },
                { label: 'Connections', onClick: () => {} },
                { label: 'Snowflake prod' },
              ]}
            />
            <Breadcrumb
              showBackButton={false}
              items={[
                { label: 'Admin', onClick: () => {} },
                { label: 'Users and groups', onClick: () => {} },
                { label: 'Sales analysts' },
              ]}
            />
          </div>
        );
      case 'numberinput':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 24, alignItems: 'start' }}>
              <NumberInput label="Rows" defaultValue={10} min={1} max={100} />
              <NumberInput label="Step 0.5" defaultValue={2.5} step={0.5} min={0} max={10} helperText="0 to 10" />
              <NumberInput label="Limit" defaultValue={80} error errorMessage="Enter 50 or less" />
              <NumberInput label="Disabled" defaultValue={10} disabled />
              <NumberInput label="Read only" defaultValue={10} readOnly />
            </div>
            <RadiantLook>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 24, alignItems: 'start' }}>
                <NumberInput label="Label" defaultValue={10} />
                <NumberInput label="Label" defaultValue={10} error />
                <NumberInput label="Label" defaultValue={10} disabled />
              </div>
            </RadiantLook>
          </div>
        );
      case 'inlineedit':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start' }}>
            <InlineEdit defaultValue="Sales overview" aria-label="Liveboard name" />
            <InlineEdit size="large" defaultValue="Quarterly revenue by region" aria-label="Answer title" required />
            <InlineEdit placeholder="Add a description" aria-label="Description" />
            <InlineEdit defaultValue="Locked title" aria-label="Title" disabled />
          </div>
        );
      case 'fileuploader':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 420 }}>
            <FileUploader label="Data file" helperText="CSV up to 50 MB" accept=".csv" />
            <FileUploader label="Data file" defaultFiles={[{ id: 'f1', name: 'orders_2026.csv', size: 482000 }]} />
            <FileUploader label="Data file" error errorMessage="Choose a CSV file" helperText="CSV up to 50 MB" />
            <FileUploader
              label="Attachments"
              multiple
              defaultFiles={[
                { id: 'a1', name: 'q3-forecast.xlsx', size: 1240000, status: 'uploading', progress: 45 },
                { id: 'a2', name: 'regions.csv', size: 38000, status: 'complete' },
                { id: 'a3', name: 'notes.pdf', size: 9800000, status: 'error', errorMessage: 'File is over 5 MB' },
              ]}
            />
            <FileUploader label="Data file" disabled />
            <FileUploader label="Data file" readOnly defaultFiles={[{ id: 'r1', name: 'orders_2026.csv' }]} />
          </div>
        );
      case 'daterangepicker':
        return (
          <div style={styles.exampleContent}>
            <DateRangePicker
              label="Date range"
              value={dateRange}
              onChange={setDateRange}
            />
            <DateRangePicker
              label="Prefilled"
              value={{ start: new Date(2024, 11, 3), end: new Date(2024, 11, 17) }}
              onChange={() => {}}
            />
            <DateRangePicker
              label="With error"
              value={{ start: null, end: null }}
              onChange={() => {}}
              hasError
              helperText="Choose a start and an end date"
            />
            <DateRangePicker
              label="Disabled"
              value={{ start: null, end: null }}
              onChange={() => {}}
              disabled
            />
            <div style={styles.interactiveBox}>
              <h4 style={styles.interactiveLabel}>Selected range:</h4>
              <p style={{ margin: 0, color: sysVar('content-primary') }}>
                {dateRange.start ? dateRange.start.toLocaleDateString() : 'No start'}
                {' to '}
                {dateRange.end ? dateRange.end.toLocaleDateString() : 'No end'}
              </p>
            </div>
          </div>
        );
      case 'wizardheader':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div data-demo="wizardheader" style={{ border: `1px solid ${sysVar('border-subtle')}`, borderRadius: 8, overflow: 'hidden' }}>
              <WizardHeader
                eyebrow="Create a connection"
                title="Choose tables"
                totalSteps={4}
                currentStep={wizardHeaderStep}
                secondaryAction={{ label: 'Back', onClick: () => setWizardHeaderStep((s) => Math.max(1, s - 1)), disabled: wizardHeaderStep === 1 }}
                primaryAction={{ label: wizardHeaderStep === 4 ? 'Finish' : 'Next', onClick: () => setWizardHeaderStep((s) => Math.min(4, s + 1)) }}
                onExit={() => setWizardHeaderStep(1)}
              />
            </div>
            <div style={{ border: `1px solid ${sysVar('border-subtle')}`, borderRadius: 8, overflow: 'hidden' }}>
              <WizardHeader title="Review and publish" totalSteps={3} currentStep={3} primaryAction={{ label: 'Publish' }} />
            </div>
          </div>
        );

      case 'richtexteditor':
        return (
          <div style={{ maxWidth: 560 }}>
            <RichTextEditor
              value={richText}
              onChange={setRichText}
              placeholder="Start typing…"
              toolbar={['bold', 'italic', 'underline', 'list', 'heading']}
              minHeight={140}
            />
          </div>
        );

      case 'formbuilder':
        return (
          <div style={{ maxWidth: 420 }}>
            <FormBuilder
              fields={[
                { id: 'name', type: 'text', label: 'Full name', required: true, placeholder: 'Enter your name' },
                { id: 'role', type: 'select', label: 'Role', options: [{ id: 'admin', label: 'Admin' }, { id: 'editor', label: 'Editor' }, { id: 'viewer', label: 'Viewer' }] },
                { id: 'notify', type: 'toggle', label: 'Email notifications' },
              ]}
              onSubmit={() => {}}
              submitLabel="Save settings"
            />
          </div>
        );

      case 'dynamicform':
        return (
          <div style={{ maxWidth: 420 }}>
            <DynamicForm
              fields={[
                { id: 'title', type: 'text', label: 'Report title', required: true },
                { id: 'description', type: 'textarea', label: 'Description' },
                { id: 'schedule', type: 'radio', label: 'Schedule', options: [{ id: 'daily', label: 'Daily' }, { id: 'weekly', label: 'Weekly' }, { id: 'monthly', label: 'Monthly' }] },
              ]}
              initialValue={{ schedule: 'weekly' }}
              onSubmit={() => {}}
              submitLabel="Create report"
            />
          </div>
        );

      case 'facetsortbar':
        return (
          <div>
            <FacetSortBar
              facets={[{ id: 'all', label: 'All', count: 148 }, { id: 'answers', label: 'Answers', count: 82 }, { id: 'liveboards', label: 'Liveboards', count: 41 }, { id: 'worksheets', label: 'Worksheets', count: 25 }]}
              selectedFacet={selectedFacet}
              onFacetChange={setSelectedFacet}
              sortOptions={[{ id: 'newest', label: 'Newest first' }, { id: 'oldest', label: 'Oldest first' }, { id: 'az', label: 'A → Z' }]}
              selectedSort={selectedSort}
              onSortChange={setSelectedSort}
            />
          </div>
        );

      case 'liveboardheader':
        return (
          <div style={styles.exampleContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <Button variant={lbMode === 'view' ? 'primary' : 'secondary'} size="small" onClick={() => { setLbMode('view'); setLbSpotterOpen(false); }}>View mode</Button>
                <Button variant={lbMode === 'edit' ? 'primary' : 'secondary'} size="small" onClick={() => setLbMode('edit')}>Edit mode</Button>
              </div>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${sysVar('border-divider')}` }}>
                <LiveboardHeader
                  mode={lbMode}
                  title="Online retail sales"
                  activeTab={lbActiveTab}
                  tabs={[
                    { id: 'overview', label: 'Overview' },
                    { id: 'revenue', label: 'Revenue' },
                    { id: 'pipeline', label: 'Pipeline' },
                  ]}
                  filters={[
                    { label: 'Region', value: 'North America' },
                    { label: 'Period', value: 'Last 90 days' },
                  ]}
                  onTabChange={setLbActiveTab}
                  onEdit={() => setLbMode('edit')}
                  onSave={() => { setLbMode('view'); setLbSpotterOpen(false); }}
                  onCancel={() => { setLbMode('view'); setLbSpotterOpen(false); }}
                  onToggleSpotter={() => setLbSpotterOpen(!lbSpotterOpen)}
                  spotterOpen={lbSpotterOpen}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.breadcrumb}>
          <span style={styles.breadcrumbItem}>Components</span>
          <span style={styles.breadcrumbSeparator}>/</span>
          <span style={styles.breadcrumbCurrent}>{doc.name}</span>
        </div>
        <LastUpdated componentId={componentId} />
        <div style={styles.titleRow}>
          <h1 style={styles.title}>{doc.name}</h1>
          <span style={getSourceBadgeStyle(meta?.source ?? 'custom')}>
            {getSourceLabel(meta?.source ?? 'custom')}
          </span>
        </div>
        <p style={styles.description}>{doc.description}</p>
      </div>

      {/* Live Example */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Live Example</h2>
        <div style={styles.exampleBox}>
          {renderExample()}
        </div>
      </section>

      {/* Usage, from the Radiant 3.0 Figma pages */}
      {doc.usage && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Usage</h2>
          <div style={styles.usageGrid}>
            {doc.usage.use && (
              <div style={styles.usageColumn}>
                <h3 style={styles.usageHeading}>Do</h3>
                <ul style={styles.usageList}>
                  {doc.usage.use.map((rule) => (
                    <li key={rule} style={styles.usageItem}>
                      <span style={styles.usageIcon}><Icon name="checkmark" size="s" color={sysVar('content-success')} /></span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {doc.usage.avoid && (
              <div style={styles.usageColumn}>
                <h3 style={styles.usageHeading}>Don't</h3>
                <ul style={styles.usageList}>
                  {doc.usage.avoid.map((rule) => (
                    <li key={rule} style={styles.usageItem}>
                      <span style={styles.usageIcon}><Icon name="cross" size="s" color={sysVar('content-failure')} /></span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Props Table */}
      <section style={styles.section}>
        <div style={styles.propsTitleRow}>
          <h2 style={{ ...styles.sectionTitle, marginBottom: 0 }}>Props</h2>
          <Button
            variant="tertiary"
            size="small"
            icon={propsOpen ? 'chevron-up' : 'chevron-down'}
            iconPosition="trailing"
            aria-expanded={propsOpen}
            onClick={() => setOpenPropsFor(propsOpen ? null : componentId)}
          >
            {propsOpen ? 'Hide props' : `Show ${doc.props.length} props`}
          </Button>
        </div>
        {propsOpen && (
        <div style={styles.propsTable}>
          <div style={styles.propsHeader}>
            <div style={styles.propName}>Prop</div>
            <div style={styles.propType}>Type</div>
            <div style={styles.propDefault}>Default</div>
            <div style={styles.propDescription}>Description</div>
          </div>
          {doc.props.map((prop) => (
            <div key={prop.name} style={styles.propsRow}>
              <div style={styles.propName}>
                <code style={styles.propCode}>{prop.name}</code>
              </div>
              <div style={styles.propType}>
                <code style={styles.typeCode}>{prop.type}</code>
              </div>
              <div style={styles.propDefault}>
                {prop.default ? <code style={styles.defaultCode}>{prop.default}</code> : '—'}
              </div>
              <div style={styles.propDescription}>{prop.description}</div>
            </div>
          ))}
        </div>
        )}
      </section>
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
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  breadcrumbItem: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '13px',
    color: sysVar('content-secondary'),
  },
  breadcrumbSeparator: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '13px',
    color: sysVar('content-tertiary'),
  },
  breadcrumbCurrent: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '13px',
    color: sysVar('content-primary'),
    fontWeight: 500,
  },
  title: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '36px',
    fontWeight: 700,
    color: sysVar('content-primary'),
    margin: 0,
  },
  description: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '16px',
    fontWeight: 400,
    color: sysVar('content-secondary'),
    lineHeight: '26px',
    maxWidth: '700px',
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '20px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    marginBottom: '16px',
  },
  exampleBox: {
    padding: '32px',
    background: sysVar('background-base'),
    border: `1px solid ${sysVar('background-subtle')}`,
    borderRadius: '12px',
  },
  exampleContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  exampleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  exampleColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  interactiveBox: {
    padding: '20px',
    background: sysVar('background-sunken'),
    borderRadius: '8px',
    marginTop: '8px',
  },
  interactiveLabel: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '12px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-secondary'),
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
  },
  propsTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
    marginBottom: 'var(--spacing-4)',
  },
  usageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 'var(--spacing-4)',
  },
  usageColumn: {
    padding: 'var(--spacing-5)',
    background: sysVar('background-base'),
    border: `1px solid ${sysVar('border-subtle')}`,
    borderRadius: 'var(--radius-lg)',
  },
  usageHeading: {
    margin: '0 0 var(--spacing-3)',
    fontFamily: 'var(--font-family-primary)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
  },
  usageList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-3)',
  },
  usageItem: {
    display: 'flex',
    gap: 'var(--spacing-2)',
    alignItems: 'flex-start',
    fontFamily: 'var(--font-family-primary)',
    fontSize: 'var(--font-size-sm)',
    lineHeight: 'var(--line-height-md)',
    color: sysVar('content-secondary'),
  },
  usageIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    height: 'var(--line-height-md)',
  },
  propsTable: {
    background: sysVar('background-base'),
    border: `1px solid ${sysVar('background-subtle')}`,
    borderRadius: '12px',
    overflow: 'hidden',
  },
  propsHeader: {
    display: 'grid',
    gridTemplateColumns: '140px 200px 100px 1fr',
    padding: '14px 20px',
    background: sysVar('background-sunken'),
    borderBottom: `1px solid ${sysVar('background-subtle')}`,
    fontFamily: 'var(--font-family-primary)',
    fontSize: '11px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-secondary'),
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  propsRow: {
    display: 'grid',
    gridTemplateColumns: '140px 200px 100px 1fr',
    padding: '14px 20px',
    borderBottom: `1px solid ${sysVar('background-sunken')}`,
    alignItems: 'flex-start',
  },
  propName: {},
  propType: {},
  propDefault: {},
  propDescription: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '13px',
    color: sysVar('content-secondary'),
    lineHeight: '20px',
  },
  propCode: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: '13px',
    fontWeight: 500,
    color: sysVar('content-brand'),
  },
  typeCode: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: '12px',
    color: sysVar('content-primary'),
    background: sysVar('background-sunken'),
    padding: '2px 6px',
    borderRadius: '4px',
  },
  defaultCode: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: '12px',
    color: sysVar('content-success'),
  },
};

export default ComponentDocPage;
