import React from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Sidebar, NavItem } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { RadiantHomePage } from './pages/RadiantHomePage';
import { ComponentDocPage } from './pages/ComponentDocPage';
import { ComponentRegistryPage } from './pages/ComponentRegistryPage';
import { PlaygroundGallery } from './pages/PlaygroundGallery';
import { PlaygroundProject } from './pages/PlaygroundProject';
import { ArchitectureShowcase } from './pages/ArchitectureShowcase';
import { IconsShowcase } from './pages/IconsShowcase';
import { SurfacesShowcase } from './pages/SurfacesShowcase';
import { VersionHistoryPage } from './pages/VersionHistoryPage';
import { ColorSystemPage } from './pages/ColorSystemPage';
import { TypographyPage } from './pages/TypographyPage';
// import { RoadmapPage } from './pages/RoadmapPage';

import { systemColors } from './tokens/colors';
import { getCurrentVersion } from './data/versionHistory';

// Navigation icons
const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.25 6.75L9 1.5L15.75 6.75V15C15.75 15.3978 15.592 15.7794 15.3107 16.0607C15.0294 16.342 14.6478 16.5 14.25 16.5H3.75C3.35218 16.5 2.97064 16.342 2.68934 16.0607C2.40804 15.7794 2.25 15.3978 2.25 15V6.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.75 16.5V9H11.25V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArchitectureIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 12.75V15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 9.75V15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 6.75V15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.25 3.75L9 2.25L15.75 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 6.75C4.24264 6.75 5.25 5.74264 5.25 4.5C5.25 3.25736 4.24264 2.25 3 2.25C1.75736 2.25 0.75 3.25736 0.75 4.5C0.75 5.74264 1.75736 6.75 3 6.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ComponentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 2.25H2.25V7.5H7.5V2.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.75 2.25H10.5V7.5H15.75V2.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.75 10.5H10.5V15.75H15.75V10.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 10.5H2.25V15.75H7.5V10.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 5.25L10.545 8.385L14.0325 8.89125L11.5163 11.34L12.09 14.8125L9 13.185L5.91 14.8125L6.48375 11.34L3.9675 8.89125L7.455 8.385L9 5.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ColorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 1.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 9H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.3033 3.6967L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TableIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.25 3.75H15.75V14.25H2.25V3.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.25 7.5H15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.25 11.25H15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.75 7.5V14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChangelogIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 5V9L11.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


const SurfacesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.25 3.75H15.75V5.25H2.25V3.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.25 7.5H15.75V9H2.25V7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.25 11.25H15.75V12.75H2.25V11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.25 14.25H15.75V15.75H2.25V14.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Route definitions for cleaner mapping
const ROUTES = {
  home: '/',
  // Radiant routes
  radiant: '/radiant',
  colours: '/radiant/colours',
  'typography-page': '/radiant/typography',
  architecture: '/radiant/architecture',
  icons: '/radiant/icons',
  surfaces: '/radiant/surfaces',
  registry: '/radiant/registry',
  changelog: '/radiant/changelog',
  // Widgets
  liveboardheader: '/radiant/components/liveboardheader',
  globalheader: '/radiant/components/globalheader',
  appsidebar: '/radiant/components/appsidebar',
  appshell: '/radiant/components/appshell',
  // Component documentation - Selection Controls
  button: '/radiant/components/button',
  checkbox: '/radiant/components/checkbox',
  radio: '/radiant/components/radio',
  toggle: '/radiant/components/toggle',
  // Component documentation - Inputs
  textinput: '/radiant/components/textinput',
  textarea: '/radiant/components/textarea',
  searchinput: '/radiant/components/searchinput',
  select: '/radiant/components/select',
  datepicker: '/radiant/components/datepicker',
  segmentedcontrol: '/radiant/components/segmentedcontrol',
  // Component documentation - Feedback
  alert: '/radiant/components/alert',
  toast: '/radiant/components/toast',
  modal: '/radiant/components/modal',
  tooltip: '/radiant/components/tooltip',
  popover: '/radiant/components/popover',
  loadingindicator: '/radiant/components/loadingindicator',
  progressbar: '/radiant/components/progressbar',
  // Component documentation - Data Display
  table: '/radiant/components/table',
  chip: '/radiant/components/chip',
  avatar: '/radiant/components/avatar',
  // Component documentation - Navigation
  tabs: '/radiant/components/tabs',
  link: '/radiant/components/link',
  menu: '/radiant/components/menu',
  pagination: '/radiant/components/pagination',
  stepper: '/radiant/components/stepper',
  // Component documentation - Layout
  card: '/radiant/components/card',
  accordion: '/radiant/components/accordion',
  divider: '/radiant/components/divider',
  // Component documentation - Typography
  typography: '/radiant/typography',
  // Component documentation - Utilities
  icongallery: '/radiant/components/icongallery',
  // Layout Primitives
  horizontal: '/radiant/components/horizontal',
  vertical: '/radiant/components/vertical',
  view: '/radiant/components/view',
  grid: '/radiant/components/grid',
  splitpane: '/radiant/components/splitpane',
  // Display & Content
  nodata: '/radiant/components/nodata',
  explainercard: '/radiant/components/explainercard',
  image: '/radiant/components/image',
  illustration: '/radiant/components/illustration',
  legend: '/radiant/components/legend',
  safehtml: '/radiant/components/safehtml',
  overlayloading: '/radiant/components/overlayloading',
  // Form Extensions
  formcontrol: '/radiant/components/formcontrol',
  searchbar: '/radiant/components/searchbar',
  numericfilterinput: '/radiant/components/numericfilterinput',
  directioncontrol: '/radiant/components/directioncontrol',
  colorpicker: '/radiant/components/colorpicker',
  inputmentions: '/radiant/components/inputmentions',
  filtermodal: '/radiant/components/filtermodal',
  // Interaction
  actionmenu: '/radiant/components/actionmenu',
  verticalstepper: '/radiant/components/verticalstepper',
  list: '/radiant/components/list',
  slider: '/radiant/components/slider',
  managedlist: '/radiant/components/managedlist',
  trending: '/radiant/components/trending',
  nestedcheckbox: '/radiant/components/nestedcheckbox',
  managetags: '/radiant/components/managetags',
  // Data Visualization
  tree: '/radiant/components/tree',
  treetable: '/radiant/components/treetable',
  formatters: '/radiant/components/formatters',
  // Advanced
  tour: '/radiant/components/tour',
  richtexteditor: '/radiant/components/richtexteditor',
  dragdrop: '/radiant/components/dragdrop',
  formbuilder: '/radiant/components/formbuilder',
  dynamicform: '/radiant/components/dynamicform',
  facetsortbar: '/radiant/components/facetsortbar',
  // Playground routes
  playground: '/playground',
} as const;

// Layout component with sidebar for Radiant section
const RadiantLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get active page ID from current path
  const getActiveId = (): string => {
    const path = location.pathname;
    
    // Find matching route
    for (const [key, route] of Object.entries(ROUTES)) {
      if (path === route) return key;
    }
    
    // Check if it's a component page
    if (path.startsWith('/radiant/components/')) {
      const componentId = path.replace('/radiant/components/', '');
      return componentId;
    }
    
    return 'radiant';
  };

  const handleNavigate = (id: string) => {
    // Map nav item IDs to routes
    const routeMap: Record<string, string> = {
      'radiant': '/radiant',
      'colours': '/radiant/colours',
      'typography-page': '/radiant/typography',
      'architecture': '/radiant/architecture',
      'icons': '/radiant/icons',
      'surfaces': '/radiant/surfaces',
      'registry': '/radiant/registry',
      'changelog': '/radiant/changelog',
      // 'roadmap': '/radiant/roadmap',
      // Widgets
      'liveboardheader': '/radiant/components/liveboardheader',
      'globalheader': '/radiant/components/globalheader',
      'appsidebar': '/radiant/components/appsidebar',
      'appshell': '/radiant/components/appshell',
      // Selection Controls
      'button': '/radiant/components/button',
      'checkbox': '/radiant/components/checkbox',
      'radio': '/radiant/components/radio',
      'toggle': '/radiant/components/toggle',
      // Inputs
      'textinput': '/radiant/components/textinput',
      'textarea': '/radiant/components/textarea',
      'searchinput': '/radiant/components/searchinput',
      'select': '/radiant/components/select',
      'datepicker': '/radiant/components/datepicker',
      'segmentedcontrol': '/radiant/components/segmentedcontrol',
      // Feedback
      'alert': '/radiant/components/alert',
      'toast': '/radiant/components/toast',
      'modal': '/radiant/components/modal',
      'tooltip': '/radiant/components/tooltip',
      'popover': '/radiant/components/popover',
      'loadingindicator': '/radiant/components/loadingindicator',
      'progressbar': '/radiant/components/progressbar',
      // Data Display
      'table': '/radiant/components/table',
      'chip': '/radiant/components/chip',
      'avatar': '/radiant/components/avatar',
      // Navigation
      'tabs': '/radiant/components/tabs',
      'link': '/radiant/components/link',
      'menu': '/radiant/components/menu',
      'pagination': '/radiant/components/pagination',
      'stepper': '/radiant/components/stepper',
      // Layout
      'card': '/radiant/components/card',
      'accordion': '/radiant/components/accordion',
      'divider': '/radiant/components/divider',
      // Typography Component (redirects to typography page)
      'typography': '/radiant/typography',
      // Layout Primitives
      'horizontal': '/radiant/components/horizontal',
      'vertical': '/radiant/components/vertical',
      'view': '/radiant/components/view',
      'grid': '/radiant/components/grid',
      'splitpane': '/radiant/components/splitpane',
      // Display & Content
      'nodata': '/radiant/components/nodata',
      'explainercard': '/radiant/components/explainercard',
      'image': '/radiant/components/image',
      'illustration': '/radiant/components/illustration',
      'legend': '/radiant/components/legend',
      'safehtml': '/radiant/components/safehtml',
      'overlayloading': '/radiant/components/overlayloading',
      // Form Extensions
      'formcontrol': '/radiant/components/formcontrol',
      'searchbar': '/radiant/components/searchbar',
      'numericfilterinput': '/radiant/components/numericfilterinput',
      'directioncontrol': '/radiant/components/directioncontrol',
      'colorpicker': '/radiant/components/colorpicker',
      'inputmentions': '/radiant/components/inputmentions',
      'filtermodal': '/radiant/components/filtermodal',
      // Interaction
      'actionmenu': '/radiant/components/actionmenu',
      'verticalstepper': '/radiant/components/verticalstepper',
      'list': '/radiant/components/list',
      'slider': '/radiant/components/slider',
      'managedlist': '/radiant/components/managedlist',
      'trending': '/radiant/components/trending',
      'nestedcheckbox': '/radiant/components/nestedcheckbox',
      'managetags': '/radiant/components/managetags',
      // Data Visualization
      'tree': '/radiant/components/tree',
      'treetable': '/radiant/components/treetable',
      'formatters': '/radiant/components/formatters',
      // Advanced
      'tour': '/radiant/components/tour',
      'richtexteditor': '/radiant/components/richtexteditor',
      'dragdrop': '/radiant/components/dragdrop',
      'formbuilder': '/radiant/components/formbuilder',
      'dynamicform': '/radiant/components/dynamicform',
      'facetsortbar': '/radiant/components/facetsortbar',
    };

    const route = routeMap[id] || '/radiant';
    navigate(route);
  };

  const navItems: NavItem[] = [
    { id: 'radiant', label: 'Home', icon: <HomeIcon />, type: 'item' },
    { id: 'colours', label: 'Colours', icon: <ColorIcon />, type: 'item' },
    { id: 'typography-page', label: 'Typography', icon: <ArchitectureIcon />, type: 'item' },
    { id: 'icons', label: 'Icons', icon: <IconsIcon />, type: 'item', badge: '46' },
    { id: 'surfaces', label: 'Surfaces', icon: <SurfacesIcon />, type: 'item' },
    { id: 'registry', label: 'Component Registry', icon: <TableIcon />, type: 'item' },
    { id: 'changelog', label: 'Changelog', icon: <ChangelogIcon />, type: 'item' },
    // { id: 'roadmap', label: 'Roadmap', icon: <RoadmapIcon />, type: 'item', badge: 'New' },
    { id: 'divider0', label: '', type: 'divider' },
    { id: 'widgets-section', label: 'Widgets', type: 'section' },
    { id: 'liveboardheader', label: 'LiveboardHeader', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'globalheader', label: 'GlobalHeader', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'appsidebar', label: 'AppSidebar', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'appshell', label: 'AppShell', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'divider1', label: '', type: 'divider' },
    { id: 'components-section', label: 'Selection Controls', type: 'section' },
    { id: 'button', label: 'Button', icon: <ComponentIcon />, type: 'item', badge: '3' },
    { id: 'checkbox', label: 'Checkbox', icon: <ComponentIcon />, type: 'item' },
    { id: 'radio', label: 'Radio', icon: <ComponentIcon />, type: 'item' },
    { id: 'toggle', label: 'Toggle', icon: <ComponentIcon />, type: 'item' },
    { id: 'divider2', label: '', type: 'divider' },
    { id: 'inputs-section', label: 'Inputs', type: 'section' },
    { id: 'textinput', label: 'TextInput', icon: <ComponentIcon />, type: 'item' },
    { id: 'textarea', label: 'TextArea', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'searchinput', label: 'SearchInput', icon: <ComponentIcon />, type: 'item' },
    { id: 'select', label: 'Select', icon: <ComponentIcon />, type: 'item' },
    { id: 'datepicker', label: 'DatePicker', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'segmentedcontrol', label: 'SegmentedControl', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'divider3', label: '', type: 'divider' },
    { id: 'feedback-section', label: 'Feedback', type: 'section' },
    { id: 'alert', label: 'Alert', icon: <ComponentIcon />, type: 'item', badge: '5' },
    { id: 'toast', label: 'Toast', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'modal', label: 'Modal', icon: <ComponentIcon />, type: 'item' },
    { id: 'tooltip', label: 'Tooltip', icon: <ComponentIcon />, type: 'item' },
    { id: 'popover', label: 'Popover', icon: <ComponentIcon />, type: 'item' },
    { id: 'loadingindicator', label: 'LoadingIndicator', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'progressbar', label: 'ProgressBar', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'divider4', label: '', type: 'divider' },
    { id: 'data-section', label: 'Data Display', type: 'section' },
    { id: 'table', label: 'Table', icon: <ComponentIcon />, type: 'item' },
    { id: 'chip', label: 'Chip', icon: <ComponentIcon />, type: 'item', badge: '4' },
    { id: 'avatar', label: 'Avatar', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'divider5', label: '', type: 'divider' },
    { id: 'navigation-section', label: 'Navigation', type: 'section' },
    { id: 'tabs', label: 'Tabs', icon: <ComponentIcon />, type: 'item' },
    { id: 'link', label: 'Link', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'menu', label: 'Menu', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'pagination', label: 'Pagination', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'stepper', label: 'Stepper', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'divider6', label: '', type: 'divider' },
    { id: 'layout-section', label: 'Layout', type: 'section' },
    { id: 'card', label: 'Card', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'accordion', label: 'Accordion', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'divider', label: 'Divider', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'divider7', label: '', type: 'divider' },
    // ── Layout Primitives ─────────────────────────────────────────────────
    { id: 'layout-primitives-section', label: 'Layout Primitives', type: 'section' },
    { id: 'horizontal', label: 'Horizontal', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'vertical', label: 'Vertical', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'view', label: 'View', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'grid', label: 'Grid / RdGrid', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'splitpane', label: 'SplitPane', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'divider8', label: '', type: 'divider' },
    // ── Display & Content ─────────────────────────────────────────────────
    { id: 'display-section', label: 'Display & Content', type: 'section' },
    { id: 'nodata', label: 'NoData', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'explainercard', label: 'ExplainerCard', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'image', label: 'Image', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'illustration', label: 'Illustration', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'legend', label: 'Legend', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'safehtml', label: 'SafeHTML', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'overlayloading', label: 'OverlayLoading', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'divider9', label: '', type: 'divider' },
    // ── Form Extensions ───────────────────────────────────────────────────
    { id: 'form-extensions-section', label: 'Form Extensions', type: 'section' },
    { id: 'formcontrol', label: 'FormControl', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'searchbar', label: 'SearchBar', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'numericfilterinput', label: 'NumericFilterInput', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'directioncontrol', label: 'DirectionControl', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'colorpicker', label: 'ColorPicker', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'inputmentions', label: 'InputMentions', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'filtermodal', label: 'FilterModal', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'divider10', label: '', type: 'divider' },
    // ── Interaction ───────────────────────────────────────────────────────
    { id: 'interaction-section', label: 'Interaction', type: 'section' },
    { id: 'actionmenu', label: 'ActionMenu', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'verticalstepper', label: 'VerticalStepper', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'list', label: 'List', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'slider', label: 'Slider', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'managedlist', label: 'ManagedList', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'trending', label: 'Trending', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'nestedcheckbox', label: 'NestedCheckbox', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'managetags', label: 'ManageTags', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'divider11', label: '', type: 'divider' },
    // ── Data Visualization ────────────────────────────────────────────────
    { id: 'dataviz-section', label: 'Data Visualization', type: 'section' },
    { id: 'tree', label: 'Tree', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'treetable', label: 'TreeTable', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'formatters', label: 'Formatters', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'divider12', label: '', type: 'divider' },
    // ── Advanced ──────────────────────────────────────────────────────────
    { id: 'advanced-section', label: 'Advanced', type: 'section' },
    { id: 'tour', label: 'Tour', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'richtexteditor', label: 'RichTextEditor', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'dragdrop', label: 'DragDrop', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'formbuilder', label: 'FormBuilder', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'dynamicform', label: 'DynamicForm', icon: <ComponentIcon />, type: 'item', badge: 'New' },
    { id: 'facetsortbar', label: 'FacetSortBar', icon: <ComponentIcon />, type: 'item', badge: 'New' },
  ];

  const SidebarHeader = () => (
    <div style={styles.sidebarHeader}>
      <div 
        style={styles.logoWrapper}
        onClick={() => navigate('/')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
      >
        <div style={styles.logo}>R</div>
        <div style={styles.logoText}>
          <div style={styles.logoTitleRow}>
            <span style={styles.logoTitle}>Radiant</span>
            <span style={styles.logoVersion}>{getCurrentVersion()}</span>
          </div>
          <span style={styles.logoSubtitle}>Design System</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.app}>
      <Sidebar
        items={navItems}
        activeId={getActiveId()}
        onSelect={handleNavigate}
        header={<SidebarHeader />}
      />
      <main style={styles.main}>
        <div style={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
};

// Wrapper component for RadiantHomePage that passes navigation
const RadiantHomePageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const handleNavigate = (id: string) => {
    const routeMap: Record<string, string> = {
      // Top-level pages
      'colours': '/radiant/colours',
      'typography': '/radiant/typography',
      'icons': '/radiant/icons',
      'surfaces': '/radiant/surfaces',
      'registry': '/radiant/registry',
      'architecture': '/radiant/architecture',
      // Widgets
      'liveboardheader': '/radiant/components/liveboardheader',
      'globalheader': '/radiant/components/globalheader',
      'appsidebar': '/radiant/components/appsidebar',
      'appshell': '/radiant/components/appshell',
      // Component pages
      'button': '/radiant/components/button',
      'checkbox': '/radiant/components/checkbox',
      'radio': '/radiant/components/radio',
      'toggle': '/radiant/components/toggle',
      'textinput': '/radiant/components/textinput',
      'textarea': '/radiant/components/textarea',
      'searchinput': '/radiant/components/searchinput',
      'select': '/radiant/components/select',
      'datepicker': '/radiant/components/datepicker',
      'segmentedcontrol': '/radiant/components/segmentedcontrol',
      'chip': '/radiant/components/chip',
      'alert': '/radiant/components/alert',
      'toast': '/radiant/components/toast',
      'modal': '/radiant/components/modal',
      'tooltip': '/radiant/components/tooltip',
      'popover': '/radiant/components/popover',
      'loadingindicator': '/radiant/components/loadingindicator',
      'progressbar': '/radiant/components/progressbar',
      'table': '/radiant/components/table',
      'avatar': '/radiant/components/avatar',
      'tabs': '/radiant/components/tabs',
      'link': '/radiant/components/link',
      'menu': '/radiant/components/menu',
      'pagination': '/radiant/components/pagination',
      'stepper': '/radiant/components/stepper',
      'card': '/radiant/components/card',
      'accordion': '/radiant/components/accordion',
      'divider': '/radiant/components/divider',
      'typography-component': '/radiant/typography',
    };
    navigate(routeMap[id] || `/radiant/components/${id}`);
  };
  return <RadiantHomePage onNavigate={handleNavigate} />;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Prototyping gallery — default landing page */}
      <Route path="/" element={<PlaygroundGallery />} />
      <Route path="/home" element={<HomePage />} />
      {/* How it works is now a static HTML page at /how-it-works.html */}
      
      {/* Radiant Section - With sidebar */}
      <Route path="/radiant" element={<RadiantLayout><RadiantHomePageWrapper /></RadiantLayout>} />
      <Route path="/radiant/colours" element={<RadiantLayout><ColorSystemPage /></RadiantLayout>} />
      <Route path="/radiant/typography" element={<RadiantLayout><TypographyPage /></RadiantLayout>} />
      <Route path="/radiant/icons" element={<RadiantLayout><IconsShowcase /></RadiantLayout>} />
      <Route path="/radiant/surfaces" element={<RadiantLayout><SurfacesShowcase /></RadiantLayout>} />
      <Route path="/radiant/registry" element={<RadiantLayout><ComponentRegistryPage /></RadiantLayout>} />
      <Route path="/radiant/changelog" element={<RadiantLayout><VersionHistoryPage /></RadiantLayout>} />
      {/* <Route path="/radiant/roadmap" element={<RadiantLayout><RoadmapPage /></RadiantLayout>} /> */}
      <Route path="/radiant/architecture" element={<RadiantLayout><ArchitectureShowcase /></RadiantLayout>} />
      {/* Legacy redirect for old colors route */}
      <Route path="/radiant/colors" element={<Navigate to="/radiant/colours" replace />} />
      
      {/* Widget documentation pages */}
      <Route path="/radiant/components/liveboardheader" element={<RadiantLayout><ComponentDocPage componentId="liveboardheader" /></RadiantLayout>} />
      <Route path="/radiant/components/globalheader" element={<RadiantLayout><ComponentDocPage componentId="globalheader" /></RadiantLayout>} />
      <Route path="/radiant/components/appsidebar" element={<RadiantLayout><ComponentDocPage componentId="appsidebar" /></RadiantLayout>} />
      <Route path="/radiant/components/appshell" element={<RadiantLayout><ComponentDocPage componentId="appshell" /></RadiantLayout>} />
      
      {/* Component documentation pages - Selection Controls */}
      <Route path="/radiant/components/button" element={<RadiantLayout><ComponentDocPage componentId="button" /></RadiantLayout>} />
      <Route path="/radiant/components/checkbox" element={<RadiantLayout><ComponentDocPage componentId="checkbox" /></RadiantLayout>} />
      <Route path="/radiant/components/radio" element={<RadiantLayout><ComponentDocPage componentId="radio" /></RadiantLayout>} />
      <Route path="/radiant/components/toggle" element={<RadiantLayout><ComponentDocPage componentId="toggle" /></RadiantLayout>} />
      
      {/* Component documentation pages - Inputs */}
      <Route path="/radiant/components/textinput" element={<RadiantLayout><ComponentDocPage componentId="textinput" /></RadiantLayout>} />
      <Route path="/radiant/components/textarea" element={<RadiantLayout><ComponentDocPage componentId="textarea" /></RadiantLayout>} />
      <Route path="/radiant/components/searchinput" element={<RadiantLayout><ComponentDocPage componentId="searchinput" /></RadiantLayout>} />
      <Route path="/radiant/components/select" element={<RadiantLayout><ComponentDocPage componentId="select" /></RadiantLayout>} />
      <Route path="/radiant/components/datepicker" element={<RadiantLayout><ComponentDocPage componentId="datepicker" /></RadiantLayout>} />
      <Route path="/radiant/components/segmentedcontrol" element={<RadiantLayout><ComponentDocPage componentId="segmentedcontrol" /></RadiantLayout>} />
      
      {/* Component documentation pages - Feedback */}
      <Route path="/radiant/components/alert" element={<RadiantLayout><ComponentDocPage componentId="alert" /></RadiantLayout>} />
      <Route path="/radiant/components/toast" element={<RadiantLayout><ComponentDocPage componentId="toast" /></RadiantLayout>} />
      <Route path="/radiant/components/modal" element={<RadiantLayout><ComponentDocPage componentId="modal" /></RadiantLayout>} />
      <Route path="/radiant/components/tooltip" element={<RadiantLayout><ComponentDocPage componentId="tooltip" /></RadiantLayout>} />
      <Route path="/radiant/components/popover" element={<RadiantLayout><ComponentDocPage componentId="popover" /></RadiantLayout>} />
      <Route path="/radiant/components/loadingindicator" element={<RadiantLayout><ComponentDocPage componentId="loadingindicator" /></RadiantLayout>} />
      <Route path="/radiant/components/progressbar" element={<RadiantLayout><ComponentDocPage componentId="progressbar" /></RadiantLayout>} />
      
      {/* Component documentation pages - Data Display */}
      <Route path="/radiant/components/table" element={<RadiantLayout><ComponentDocPage componentId="table" /></RadiantLayout>} />
      <Route path="/radiant/components/chip" element={<RadiantLayout><ComponentDocPage componentId="chip" /></RadiantLayout>} />
      <Route path="/radiant/components/avatar" element={<RadiantLayout><ComponentDocPage componentId="avatar" /></RadiantLayout>} />
      
      {/* Component documentation pages - Navigation */}
      <Route path="/radiant/components/tabs" element={<RadiantLayout><ComponentDocPage componentId="tabs" /></RadiantLayout>} />
      <Route path="/radiant/components/link" element={<RadiantLayout><ComponentDocPage componentId="link" /></RadiantLayout>} />
      <Route path="/radiant/components/menu" element={<RadiantLayout><ComponentDocPage componentId="menu" /></RadiantLayout>} />
      <Route path="/radiant/components/pagination" element={<RadiantLayout><ComponentDocPage componentId="pagination" /></RadiantLayout>} />
      <Route path="/radiant/components/stepper" element={<RadiantLayout><ComponentDocPage componentId="stepper" /></RadiantLayout>} />
      
      {/* Component documentation pages - Layout */}
      <Route path="/radiant/components/card" element={<RadiantLayout><ComponentDocPage componentId="card" /></RadiantLayout>} />
      <Route path="/radiant/components/accordion" element={<RadiantLayout><ComponentDocPage componentId="accordion" /></RadiantLayout>} />
      <Route path="/radiant/components/divider" element={<RadiantLayout><ComponentDocPage componentId="divider" /></RadiantLayout>} />

      {/* Component documentation pages - Layout Primitives */}
      <Route path="/radiant/components/horizontal" element={<RadiantLayout><ComponentDocPage componentId="horizontal" /></RadiantLayout>} />
      <Route path="/radiant/components/vertical" element={<RadiantLayout><ComponentDocPage componentId="vertical" /></RadiantLayout>} />
      <Route path="/radiant/components/view" element={<RadiantLayout><ComponentDocPage componentId="view" /></RadiantLayout>} />
      <Route path="/radiant/components/grid" element={<RadiantLayout><ComponentDocPage componentId="grid" /></RadiantLayout>} />
      <Route path="/radiant/components/splitpane" element={<RadiantLayout><ComponentDocPage componentId="splitpane" /></RadiantLayout>} />

      {/* Component documentation pages - Display & Content */}
      <Route path="/radiant/components/nodata" element={<RadiantLayout><ComponentDocPage componentId="nodata" /></RadiantLayout>} />
      <Route path="/radiant/components/explainercard" element={<RadiantLayout><ComponentDocPage componentId="explainercard" /></RadiantLayout>} />
      <Route path="/radiant/components/image" element={<RadiantLayout><ComponentDocPage componentId="image" /></RadiantLayout>} />
      <Route path="/radiant/components/illustration" element={<RadiantLayout><ComponentDocPage componentId="illustration" /></RadiantLayout>} />
      <Route path="/radiant/components/legend" element={<RadiantLayout><ComponentDocPage componentId="legend" /></RadiantLayout>} />
      <Route path="/radiant/components/safehtml" element={<RadiantLayout><ComponentDocPage componentId="safehtml" /></RadiantLayout>} />
      <Route path="/radiant/components/overlayloading" element={<RadiantLayout><ComponentDocPage componentId="overlayloading" /></RadiantLayout>} />

      {/* Component documentation pages - Form Extensions */}
      <Route path="/radiant/components/formcontrol" element={<RadiantLayout><ComponentDocPage componentId="formcontrol" /></RadiantLayout>} />
      <Route path="/radiant/components/searchbar" element={<RadiantLayout><ComponentDocPage componentId="searchbar" /></RadiantLayout>} />
      <Route path="/radiant/components/numericfilterinput" element={<RadiantLayout><ComponentDocPage componentId="numericfilterinput" /></RadiantLayout>} />
      <Route path="/radiant/components/directioncontrol" element={<RadiantLayout><ComponentDocPage componentId="directioncontrol" /></RadiantLayout>} />
      <Route path="/radiant/components/colorpicker" element={<RadiantLayout><ComponentDocPage componentId="colorpicker" /></RadiantLayout>} />
      <Route path="/radiant/components/inputmentions" element={<RadiantLayout><ComponentDocPage componentId="inputmentions" /></RadiantLayout>} />
      <Route path="/radiant/components/filtermodal" element={<RadiantLayout><ComponentDocPage componentId="filtermodal" /></RadiantLayout>} />

      {/* Component documentation pages - Interaction */}
      <Route path="/radiant/components/actionmenu" element={<RadiantLayout><ComponentDocPage componentId="actionmenu" /></RadiantLayout>} />
      <Route path="/radiant/components/verticalstepper" element={<RadiantLayout><ComponentDocPage componentId="verticalstepper" /></RadiantLayout>} />
      <Route path="/radiant/components/list" element={<RadiantLayout><ComponentDocPage componentId="list" /></RadiantLayout>} />
      <Route path="/radiant/components/slider" element={<RadiantLayout><ComponentDocPage componentId="slider" /></RadiantLayout>} />
      <Route path="/radiant/components/managedlist" element={<RadiantLayout><ComponentDocPage componentId="managedlist" /></RadiantLayout>} />
      <Route path="/radiant/components/trending" element={<RadiantLayout><ComponentDocPage componentId="trending" /></RadiantLayout>} />
      <Route path="/radiant/components/nestedcheckbox" element={<RadiantLayout><ComponentDocPage componentId="nestedcheckbox" /></RadiantLayout>} />
      <Route path="/radiant/components/managetags" element={<RadiantLayout><ComponentDocPage componentId="managetags" /></RadiantLayout>} />

      {/* Component documentation pages - Data Visualization */}
      <Route path="/radiant/components/tree" element={<RadiantLayout><ComponentDocPage componentId="tree" /></RadiantLayout>} />
      <Route path="/radiant/components/treetable" element={<RadiantLayout><ComponentDocPage componentId="treetable" /></RadiantLayout>} />
      <Route path="/radiant/components/formatters" element={<RadiantLayout><ComponentDocPage componentId="formatters" /></RadiantLayout>} />

      {/* Component documentation pages - Advanced */}
      <Route path="/radiant/components/tour" element={<RadiantLayout><ComponentDocPage componentId="tour" /></RadiantLayout>} />
      <Route path="/radiant/components/richtexteditor" element={<RadiantLayout><ComponentDocPage componentId="richtexteditor" /></RadiantLayout>} />
      <Route path="/radiant/components/dragdrop" element={<RadiantLayout><ComponentDocPage componentId="dragdrop" /></RadiantLayout>} />
      <Route path="/radiant/components/formbuilder" element={<RadiantLayout><ComponentDocPage componentId="formbuilder" /></RadiantLayout>} />
      <Route path="/radiant/components/dynamicform" element={<RadiantLayout><ComponentDocPage componentId="dynamicform" /></RadiantLayout>} />
      <Route path="/radiant/components/facetsortbar" element={<RadiantLayout><ComponentDocPage componentId="facetsortbar" /></RadiantLayout>} />

      {/* Redirect typography component to typography page */}
      <Route path="/radiant/components/typography" element={<Navigate to="/radiant/typography" replace />} />
      
      {/* Redirect icongallery to icons page */}
      <Route path="/radiant/components/icongallery" element={<Navigate to="/radiant/icons" replace />} />
      
      {/* Playground Section - No sidebar */}
      <Route path="/playground" element={<Navigate to="/" replace />} />
      <Route path="/playground/:projectName" element={<PlaygroundProject />} />
      
      {/* Legacy redirects - redirect old routes to new structure */}
      <Route path="/components" element={<Navigate to="/radiant" replace />} />
      <Route path="/components/*" element={<Navigate to="/radiant" replace />} />
      <Route path="/architecture" element={<Navigate to="/radiant/architecture" replace />} />
      <Route path="/icons" element={<Navigate to="/radiant/icons" replace />} />
      <Route path="/examples/*" element={<Navigate to="/radiant" replace />} />
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/playground" replace />} />
    </Routes>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: systemColors.light['background-sunken'],
  },
  main: {
    flex: 1,
    marginLeft: '260px',
    minHeight: '100vh',
    overflowY: 'auto',
  },
  content: {
    minHeight: '100%',
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  logo: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #2770EF 0%, #1E5BBB 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '18px',
    fontWeight: 700,
    color: '#ffffff',
    boxShadow: '0 2px 8px rgba(39, 112, 239, 0.4)',
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  logoTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  logoTitle: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    letterSpacing: '-0.3px',
  },
  logoVersion: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '10px',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '1px 6px',
    borderRadius: '10px',
    letterSpacing: '0.2px',
  },
  logoSubtitle: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '11px',
    fontWeight: 400,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: '0.2px',
  },
};

export default App;
