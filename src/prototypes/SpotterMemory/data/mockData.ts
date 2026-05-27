/**
 * Mock data for Spotter Memory prototype
 */

export interface LiveboardAuthor {
  name: string;
  avatar?: string;
}

export interface Liveboard {
  id: string;
  name: string;
  author: LiveboardAuthor;
  modelsWithMemory: string[];
  lastAdded: Date;
  lastAddedBy: LiveboardAuthor;
}

// Generate relative time string
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

// Mock liveboards data matching the screenshot
export const liveboards: Liveboard[] = [
  {
    id: '1',
    name: 'GTM Pipeline Overview',
    author: { name: 'Maya Angelou' },
    modelsWithMemory: ['GTM', '+4'],
    lastAdded: new Date(Date.now() - 4 * 60 * 1000), // 4 minutes ago
    lastAddedBy: { name: 'Maya Angelou' },
  },
  {
    id: '2',
    name: 'Retail Apparel Snapshot',
    author: { name: 'Maya Angelou' },
    modelsWithMemory: ['Sample retail apparel'],
    lastAdded: new Date(Date.now() - 4 * 60 * 1000),
    lastAddedBy: { name: 'Maya Angelou' },
  },
  {
    id: '3',
    name: 'GTM Waterfall Analysis',
    author: { name: 'Maya Angelou' },
    modelsWithMemory: ['GTM', 'GTM waterfall...', '+2'],
    lastAdded: new Date(Date.now() - 4 * 60 * 1000),
    lastAddedBy: { name: 'Maya Angelou' },
  },
  {
    id: '4',
    name: 'Q4 Sales Dashboard',
    author: { name: 'James Baldwin' },
    modelsWithMemory: ['Sales Model', 'Revenue'],
    lastAdded: new Date(Date.now() - 15 * 60 * 1000),
    lastAddedBy: { name: 'James Baldwin' },
  },
  {
    id: '5',
    name: 'Marketing Campaign Tracker',
    author: { name: 'Toni Morrison' },
    modelsWithMemory: ['Marketing', 'Campaigns', 'ROI', '+3'],
    lastAdded: new Date(Date.now() - 30 * 60 * 1000),
    lastAddedBy: { name: 'Emily Chen' },
  },
  {
    id: '6',
    name: 'Customer Insights',
    author: { name: 'Langston Hughes' },
    modelsWithMemory: ['Customer 360'],
    lastAdded: new Date(Date.now() - 2 * 60 * 60 * 1000),
    lastAddedBy: { name: 'Langston Hughes' },
  },
  {
    id: '7',
    name: 'Product Analytics',
    author: { name: 'Zora Neale Hurston' },
    modelsWithMemory: ['Product', 'Usage', 'Engagement'],
    lastAdded: new Date(Date.now() - 5 * 60 * 60 * 1000),
    lastAddedBy: { name: 'Maya Angelou' },
  },
  {
    id: '8',
    name: 'Financial Overview',
    author: { name: 'Richard Wright' },
    modelsWithMemory: ['Finance', 'P&L', '+5'],
    lastAdded: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    lastAddedBy: { name: 'Richard Wright' },
  },
];

// Navigation items for sidebar
export interface NavigationItem {
  id: string;
  label: string;
  type?: 'section' | 'item' | 'divider';
  icon?: string;
  external?: boolean;
  active?: boolean;
}

export interface NavigationGroup {
  id: string;
  label: string;
  icon?: string;
  expandable?: boolean;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    id: 'data-workspace',
    label: 'Data Workspace',
    expandable: true,
    items: [
      { id: 'data-objects', label: 'Data objects' },
      { id: 'connections', label: 'Connections' },
      { id: 'analyst-studio', label: 'Analyst studio', external: true },
      { id: 'utilities', label: 'Utilities' },
      { id: 'sync', label: 'Sync' },
    ],
  },
];

export const sectionNavigation: { section: string; items: NavigationItem[] }[] = [
  {
    section: 'SPOTTER MEMORY',
    items: [
      { id: 'memory-sources', label: 'Memory Sources', active: true },
    ],
  },
  {
    section: 'GOVERNANCE',
    items: [
      { id: 'data-catalog', label: 'Data catalog' },
      { id: 'usage', label: 'Usage' },
      { id: 'dbt', label: 'dbt' },
      { id: 'liveboard-verification', label: 'Liveboard verification' },
    ],
  },
];

// Tab items
export const tabItems = [
  { id: 'liveboard', label: 'Liveboard' },
  { id: 'reference-questions', label: 'Reference questions' },
  { id: 'business-terms', label: 'Business terms' },
];

// Pagination data
export const paginationData = {
  currentPage: 1,
  itemsPerPage: 20,
  totalItems: liveboards.length,
};
