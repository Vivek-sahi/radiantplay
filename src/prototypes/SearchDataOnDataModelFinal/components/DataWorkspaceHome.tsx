import React, { useEffect, useRef, useState } from 'react';
import { AppShell } from '@components/AppShell';
import { Button } from '@components/Button';
import { Avatar } from '@components/Avatar';
import { SearchInput } from '@components/SearchInput';
import { SegmentedControl } from '@components/SegmentedControl';
import { Pagination } from '@components/Pagination';
import { Divider } from '@components/Divider';
import { Icon } from '@components/icons';
import { Horizontal } from '@components/Layout';
import { Table } from '@components/Table';
import type { TableColumn } from '@components/Table';
import { systemColors } from '@tokens/colors';
import { spacing } from '@tokens/spacing';
import { fontSize, fontWeight, fontFamily } from '@tokens/typography';
import { dataObjects, DataObject } from '../data/mockData';

// ── Provider icon SVGs ──────────────────────────────────────────────────────
// Third-party brand colours — hardcoded per brand guidelines, no Radiant token equivalent

const SnowflakeIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-label="Snowflake">
    {/* Snowflake brand colour: #29B5E8 */}
    <path d="M9 1v16M9 1L6.5 3.5M9 1l2.5 2.5M9 17l-2.5-2.5M9 17l2.5-2.5M1 9h16M1 9l2.5-2.5M1 9l2.5 2.5M17 9l-2.5-2.5M17 9l-2.5 2.5M3.636 3.636l10.728 10.728M3.636 3.636l-.707 3.5M3.636 3.636l3.5-.707M14.364 14.364l.707-3.5M14.364 14.364l-3.5.707M14.364 3.636l-10.728 10.728M14.364 3.636l.707 3.5M14.364 3.636l-3.5-.707M3.636 14.364l-.707-3.5M3.636 14.364l3.5.707" stroke="#29B5E8" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const DbtIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-label="dbt">
    {/* dbt brand colour: #FF694A */}
    <path d="M2 9C2 9 4 4 9 4C14 4 16 9 16 9C16 9 14 14 9 14C4 14 2 9 2 9Z" fill="#FF694A" />
    <circle cx="9" cy="9" r="2" fill="white" />
    <path d="M9 4L10.5 6H7.5L9 4Z" fill="#FF694A" />
    <path d="M14 7L12 8.5V5.5L14 7Z" fill="#FF694A" />
  </svg>
);

const DbConnectionIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-label="Database connection">
    {/* DB connection brand colour: #FF3621 */}
    <path d="M9 2C5.5 2 3 3.5 3 5.5V12.5C3 14.5 5.5 16 9 16C12.5 16 15 14.5 15 12.5V5.5C15 3.5 12.5 2 9 2Z" stroke="#FF3621" strokeWidth="1.5" fill="none" />
    <ellipse cx="9" cy="5.5" rx="6" ry="2" stroke="#FF3621" strokeWidth="1.5" fill="none" />
    <path d="M3 9C3 11 5.5 12.5 9 12.5C12.5 12.5 15 11 15 9" stroke="#FF3621" strokeWidth="1.2" />
  </svg>
);

// ── Type icons ──────────────────────────────────────────────────────────────

const DataModelTypeIcon: React.FC<{ color?: string }> = ({ color = systemColors.light['content-tertiary'] }) => (
  <Icon name="schema" size="s" color={color} />
);

const TableTypeIcon: React.FC<{ color?: string }> = ({ color = systemColors.light['content-tertiary'] }) => (
  <Icon name="table" size="s" color={color} />
);

// ── Recent objects data + card ──────────────────────────────────────────────

interface RecentObject {
  id: string;
  name: string;
  type: 'Model' | 'Table';
  modified: string;
  opened: string;
}

const RECENT_OBJECTS: RecentObject[] = [
  { id: '1', name: 'Sales Analytics Model', type: 'Model', modified: 'Modified 3 days ago', opened: 'Opened today' },
  { id: '2', name: 'Inventory Model', type: 'Model', modified: 'Modified 20 days ago', opened: 'Opened 2 days ago' },
  { id: '3', name: 'fact_orders', type: 'Table', modified: 'Modified 1 month ago', opened: 'Opened 1 week ago' },
  { id: '4', name: 'Customer Segments Model', type: 'Model', modified: 'Modified 2 months ago', opened: 'Opened 3 weeks ago' },
  { id: '5', name: 'dim_products', type: 'Table', modified: 'Modified 45 days ago', opened: 'Opened last month' },
  { id: '6', name: 'Marketing Attribution Model', type: 'Model', modified: 'Modified 5 days ago', opened: 'Opened yesterday' },
  { id: '7', name: 'dim_customers', type: 'Table', modified: 'Modified 3 months ago', opened: 'Opened 2 weeks ago' },
  { id: '8', name: 'Finance Model', type: 'Model', modified: 'Modified 1 week ago', opened: 'Opened 4 days ago' },
  { id: '9', name: 'fact_transactions', type: 'Table', modified: 'Modified 2 months ago', opened: 'Opened 1 month ago' },
];

const RecentObjectCard: React.FC<{ obj: RecentObject }> = ({ obj }) => {
  return (
    <div
      style={{
        width: 204,
        flexShrink: 0,
        borderRadius: 8,
        border: `1px solid ${systemColors.light['border-divider']}`,
        boxShadow: '0px 0px 4px 0px rgba(25,35,49,0.08), 0px 2px 4px 0px rgba(25,35,49,0.04)',
        overflow: 'hidden',
        fontFamily: fontFamily.primary,
      }}
    >
      {/* Header — prototype illustration colour matched from Figma source, no Radiant token equivalent */}
      <div
        style={{
          background: '#2770ef',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          gap: `${spacing.B}px`,
          padding: `0 ${spacing.C}px`,
        }}
      >
        {obj.type === 'Model' ? <DataModelTypeIcon color="#ffffff" /> : <TableTypeIcon color="#ffffff" />}
        <span style={{ fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: '#ffffff' }}>
          {obj.type}
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          backgroundColor: systemColors.light['background-base'],
          height: 76,
          padding: `${spacing.C}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: `${spacing.A}px`,
        }}
      >
        <span style={{ fontSize: fontSize.xs, color: systemColors.light['content-secondary'] }}>
          {obj.modified}
        </span>
        <span
          style={{
            fontSize: fontSize.sm,
            fontWeight: fontWeight.medium,
            color: systemColors.light['content-primary'],
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {obj.name}
        </span>
      </div>

      {/* Footer */}
      <div
        style={{
          backgroundColor: systemColors.light['background-base'],
          borderTop: `1px solid ${systemColors.light['border-divider']}`,
          height: 32,
          padding: `0 ${spacing.C}px`,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: fontSize.xs, color: systemColors.light['content-secondary'] }}>
          {obj.opened}
        </span>
      </div>
    </div>
  );
};

// ── Segment control options ─────────────────────────────────────────────────

const SEGMENTS = [
  { id: 'all', label: 'All' },
  { id: 'models', label: 'Models' },
  { id: 'tables', label: 'Tables' },
  { id: 'datasets', label: 'Datasets' },
  { id: 'views', label: 'Views' },
];

// ── Table column definitions ────────────────────────────────────────────────

const DATA_OBJECT_COLUMNS: TableColumn<DataObject>[] = [
  {
    key: 'name',
    label: 'Name',
    width: '30%',
    render: (_, row) => (
      <Horizontal align="center" gap={spacing.B} style={{ overflow: 'hidden' }}>
        {row.type === 'Model' ? <DataModelTypeIcon /> : <TableTypeIcon />}
        <span style={{ color: systemColors.light['content-brand'], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>
          {row.name}
        </span>
      </Horizontal>
    ),
  },
  {
    key: 'source',
    label: 'Source',
    width: '25%',
    render: (_, row) => (
      <Horizontal align="center" gap={spacing.B} style={{ overflow: 'hidden' }}>
        {row.sourceProvider === 'snowflake' && <SnowflakeIcon />}
        {row.sourceProvider === 'dbt' && <DbtIcon />}
        {row.sourceProvider === 'db_connection' && <DbConnectionIcon />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.source}</span>
      </Horizontal>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    width: '88px',
  },
  {
    key: 'tags',
    label: 'Tags',
    width: '140px',
    render: (_, row) => (
      <Horizontal gap={spacing.A} style={{ flexWrap: 'nowrap', overflow: 'hidden' }}>
        {row.tags.map((tag) => (
          <span
            key={tag}
            style={{
              border: `1px solid ${systemColors.light['border-brand']}`,
              borderRadius: 4,
              padding: `2px ${spacing.A}px`,
              fontSize: fontSize.xs,
              color: systemColors.light['content-primary'],
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {tag}
          </span>
        ))}
      </Horizontal>
    ),
  },
  {
    key: 'author',
    label: 'Author',
    width: '176px',
    render: (_, row) => (
      <div style={{ '--font-weight-regular': fontWeight.light } as React.CSSProperties}>
        <Avatar name={row.author} size="s" showName />
      </div>
    ),
  },
  {
    key: 'lastModified',
    label: 'Last modified',
    width: '140px',
  },
];

// ── Main component ──────────────────────────────────────────────────────────

export interface DataWorkspaceHomeProps {
  onOpenModal: () => void;
}

export const DataWorkspaceHome: React.FC<DataWorkspaceHomeProps> = ({ onOpenModal }) => {
  const [sidebarTab, setSidebarTab] = useState('data');
  const [sidebarNav, setSidebarNav] = useState('data-objects');
  const [searchValue, setSearchValue] = useState('');
  const [activeSegment, setActiveSegment] = useState('all');
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const carouselRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => carouselRef.current?.scrollBy({ left: -216, behavior: 'smooth' });
  const scrollRight = () => carouselRef.current?.scrollBy({ left: 216, behavior: 'smooth' });

  useEffect(() => {
    // Target AppShell's <main> (overflow: auto) — the actual source of bounce
    const mainEl = containerRef.current?.closest('main') as HTMLElement | null;
    const targets = [mainEl, document.documentElement, document.body].filter(Boolean) as HTMLElement[];
    const prevValues = targets.map(el => el.style.overscrollBehavior);
    targets.forEach(el => { el.style.overscrollBehavior = 'none'; });
    return () => { targets.forEach((el, i) => { el.style.overscrollBehavior = prevValues[i]; }); };
  }, []);

  const filteredRows = dataObjects.filter((obj) => {
    const matchesSearch =
      obj.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      obj.source.toLowerCase().includes(searchValue.toLowerCase());
    const matchesSegment =
      activeSegment === 'all' ||
      (activeSegment === 'models' && obj.type === 'Model') ||
      (activeSegment === 'tables' && obj.type === 'Table');
    return matchesSearch && matchesSegment;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const pagedRows = filteredRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSearchValue(e.target.value); setCurrentPage(1); };
  const handleSegmentChange = (id: string) => { setActiveSegment(id); setCurrentPage(1); };

  return (
    <>
    <AppShell
      style={{ height: '100vh' }}
      contentBackground={systemColors.light['background-base']}
      headerProps={{
        theme: 'dark',
        searchMode: 'input',
        searchPlaceholder: 'Search in ThoughtSpot',
        userName: 'Suraj Boro',
        notificationCount: 1,
        showDefaultActions: true,
      }}
      sidebarProps={{
        tabs: [
          { id: 'insights', label: 'Insights App', headerTitle: 'Insights' },
          {
            id: 'data',
            label: 'Data Workspace',
            headerTitle: 'Data Workspace',
            showAddButton: true,
            onAddClick: () => setAddMenuOpen(true),
          },
          { id: 'develop', label: 'Develop App', headerTitle: 'Develop' },
        ],
        activeTab: sidebarTab,
        onTabChange: (id) => { if (id === 'data') setSidebarTab(id); },
        categories: {
          data: [
            {
              title: '',
              items: [
                { id: 'data-objects', label: 'Data objects' },
                { id: 'connections', label: 'Connections' },
                { id: 'semantic-integrations', label: 'Semantic integrations' },
                { id: 'analyst-studio', label: 'Analyst Studio' },
                { id: 'utilities', label: 'Utilities' },
                { id: 'sync', label: 'Sync' },
              ],
            },
            {
              title: 'Spotter coaching',
              items: [
                { id: 'reference-questions', label: 'Reference questions' },
                { id: 'business-terms', label: 'Business terms' },
              ],
            },
            {
              title: 'Governance',
              items: [
                { id: 'data-catalog', label: 'Data catalog' },
                { id: 'usage', label: 'Usage' },
                { id: 'liveboard-verification', label: 'Liveboard verification' },
              ],
            },
          ],
        },
        selectedNav: sidebarNav,
        onNavSelect: (id) => { if (id === 'data-objects') setSidebarNav(id); },
      }}
    >
      <div ref={containerRef} style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: fontFamily.primary }}>

        {/* Recent objects carousel */}
        <div style={{ backgroundColor: systemColors.light['background-sunken'], padding: `${spacing.F}px` }}>
          <Horizontal align="center" gap={spacing.C}>
            <Button variant="secondary" iconOnly icon="arrow-left" onClick={scrollLeft}>
              Left
            </Button>
            <div
              ref={carouselRef}
              style={{
                flex: 1,
                display: 'flex',
                gap: `${spacing.C}px`,
                overflowX: 'auto',
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none',
                overscrollBehavior: 'none',
              }}
            >
              {RECENT_OBJECTS.map((obj) => (
                <RecentObjectCard key={obj.id} obj={obj} />
              ))}
            </div>
            <Button variant="secondary" iconOnly icon="arrow-right" onClick={scrollRight}>
              Right
            </Button>
          </Horizontal>
        </div>

        {/* Filter toolbar + table + pagination — fills remaining height, table scrolls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: `${spacing.F}px` }}>

          {/* Toolbar */}
          <Horizontal align="center" gap={spacing.C} style={{ marginBottom: `${spacing.D}px` }}>
            <SegmentedControl
              options={SEGMENTS}
              value={activeSegment}
              onChange={handleSegmentChange}
            />
            <div style={{ pointerEvents: 'none' }}>
              <Button variant="secondary" icon="chevron-down" iconPosition="trailing">
                All tags
              </Button>
            </div>
            <div style={{ pointerEvents: 'none' }}>
              <Button variant="secondary" icon="chevron-down" iconPosition="trailing">
                All authors
              </Button>
            </div>
            <Divider vertical />
            <SearchInput
              placeholder="Search"
              value={searchValue}
              onChange={handleSearchChange}
              style={{ width: 160 }}
            />
          </Horizontal>

          {/* Data objects table — flex:1 fills remaining height; outer div scrolls */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', overscrollBehavior: 'none', borderRadius: 6, border: `1px solid ${systemColors.light['border-divider']}` }}>
            <style>{`.dw-objects-table table { table-layout: fixed; }`}</style>
            <div className="dw-objects-table" style={{ fontWeight: fontWeight.light, '--font-weight-medium': fontWeight.light, '--font-weight-regular': fontWeight.light } as React.CSSProperties}>
              <Table
                columns={DATA_OBJECT_COLUMNS as unknown as TableColumn[]}
                data={pagedRows as unknown as Record<string, unknown>[]}
                rowKey="id"
                selectable
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
                hoverable
                stickyHeader
                emptyMessage="No data objects match your search."
                style={{ overflow: 'visible' }}
              />
            </div>
          </div>

          {/* Pagination — always visible at bottom, outside scroll area */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: `${spacing.D}px`,
              paddingBottom: `${spacing.B}px`,
              flexShrink: 0,
              fontWeight: fontWeight.light,
            }}
          >
            <Pagination.Range
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={filteredRows.length}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </AppShell>

    {/* Floating add menu — rendered outside AppShell to avoid dark sidebar CSS variable inheritance */}
    {addMenuOpen && (
      <>
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 999 }}
          onClick={() => setAddMenuOpen(false)}
        />
        <div
          style={{
            position: 'fixed',
            top: 126,  // global header 60px + tabs row 54px + sidebar header padding-top 12px
            left: 244,
            backgroundColor: systemColors.light['background-base'],
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            zIndex: 1000,
            padding: `${spacing.B}px 0`,
            minWidth: 180,
            fontFamily: fontFamily.primary,
          }}
        >
          {([
            { label: 'Connection', action: null },
            { label: 'Model', action: onOpenModal },
            { label: 'Dataset', action: null },
            { label: 'SQL view', action: null },
          ] as { label: string; action: (() => void) | null }[]).map((item) => (
            <div
              key={item.label}
              onClick={() => { if (item.action) item.action(); setAddMenuOpen(false); }}
              style={{
                padding: `${spacing.B}px ${spacing.D}px`,
                fontSize: fontSize.sm,
                fontWeight: fontWeight.light,
                color: systemColors.light['content-primary'],
                cursor: item.action ? 'pointer' : 'default',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = systemColors.light['background-ghost-hover']; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {item.label}
            </div>
          ))}
        </div>
      </>
    )}
    </>
  );
};

export default DataWorkspaceHome;
