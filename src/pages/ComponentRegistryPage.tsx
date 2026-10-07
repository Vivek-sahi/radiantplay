import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableColumn } from '../components/Table';
import { SearchInput } from '../components/SearchInput';
import {
  componentRegistry,
  ComponentMeta,
  formatDate,
  getSourceLabel,
  getStatusColor,
  getCategories,
} from '../data/componentRegistry';
import { sysVar } from '../tokens/colors';

// Type alias for column render function parameters
type ColumnData = Record<string, unknown>;

/**
 * Component Registry Page
 * 
 * Displays a table view of all Radiant components with metadata
 * including states, Figma sync status, and source information.
 */
export const ComponentRegistryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const categories = useMemo(() => getCategories(), []);

  // Filter components based on search and filters
  const filteredComponents = useMemo(() => {
    return componentRegistry.filter((component) => {
      const matchesSearch =
        searchQuery === '' ||
        component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === null || component.category === selectedCategory;

      const matchesSource =
        selectedSource === null || component.source === selectedSource;

      return matchesSearch && matchesCategory && matchesSource;
    });
  }, [searchQuery, selectedCategory, selectedSource]);

  // Table columns configuration
  const columns: TableColumn<ColumnData>[] = [
    {
      key: 'name',
      label: 'Component',
      width: '180px',
      sortable: true,
      render: (_: unknown, row: ColumnData) => {
        const data = row as unknown as ComponentMeta;
        return (
          <div style={styles.componentCell}>
            <span style={styles.componentName}>{data.name}</span>
            <span style={styles.componentCategory}>{data.category}</span>
          </div>
        );
      },
    },
    {
      key: 'states',
      label: 'States',
      width: '200px',
      render: (_: unknown, row: ColumnData) => {
        const data = row as unknown as ComponentMeta;
        return (
          <div style={styles.statesCell}>
            {data.states.slice(0, 3).map((state: string) => (
              <span key={state} style={styles.stateTag}>
                {state}
              </span>
            ))}
            {data.states.length > 3 && (
              <span style={styles.moreStates}>+{data.states.length - 3}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      sortable: true,
      render: (_: unknown, row: ColumnData) => {
        const data = row as unknown as ComponentMeta;
        const statusColors = getStatusColor(data.status);
        return (
          <span
            style={{
              ...styles.statusBadge,
              backgroundColor: statusColors.bg,
              color: statusColors.text,
            }}
          >
            {data.status}
          </span>
        );
      },
    },
    {
      key: 'source',
      label: 'Source',
      width: '100px',
      sortable: true,
      render: (_: unknown, row: ColumnData) => {
        const data = row as unknown as ComponentMeta;
        return (
          <span
            style={{
              ...styles.sourceBadge,
              backgroundColor:
                data.source === 'figma'
                  ? 'color-mix(in srgb, var(--rd-sys-color-content-accent-purple) 12.5%, transparent)'
                  : data.source === 'scaligent'
                  ? 'color-mix(in srgb, var(--rd-sys-color-content-accent-green) 12.5%, transparent)'
                  : 'color-mix(in srgb, var(--rd-sys-color-content-secondary) 12.5%, transparent)',
              color:
                data.source === 'figma'
                  ? sysVar('content-accent-purple')
                  : data.source === 'scaligent'
                  ? sysVar('content-accent-green')
                  : sysVar('content-secondary'),
            }}
          >
            {getSourceLabel(data.source)}
          </span>
        );
      },
    },
    {
      key: 'lastFigmaSync',
      label: 'Last Figma Sync',
      width: '130px',
      sortable: true,
      render: (_: unknown, row: ColumnData) => {
        const data = row as unknown as ComponentMeta;
        return (
          <span style={styles.dateText}>
            {data.lastFigmaSync ? formatDate(data.lastFigmaSync) : '—'}
          </span>
        );
      },
    },
    {
      key: 'lastModified',
      label: 'Last Modified',
      width: '130px',
      sortable: true,
      render: (_: unknown, row: ColumnData) => {
        const data = row as unknown as ComponentMeta;
        return (
          <span style={styles.dateText}>{formatDate(data.lastModified)}</span>
        );
      },
    },
    {
      key: 'variants',
      label: 'Variants',
      width: '80px',
      align: 'center',
      render: (_: unknown, row: ColumnData) => {
        const data = row as unknown as ComponentMeta;
        return (
          <span style={styles.variantCount}>{data.variants}</span>
        );
      },
    },
    {
      key: 'link',
      label: '',
      width: '60px',
      align: 'center',
      render: (_: unknown, row: ColumnData) => {
        const data = row as unknown as ComponentMeta;
        return (
          <button
            style={styles.linkButton}
            onClick={(e) => {
              e.stopPropagation();
              navigate(data.path);
            }}
            title={`View ${data.name} documentation`}
          >
            →
          </button>
        );
      },
    },
  ];

  const handleRowClick = (row: ColumnData) => {
    const data = row as unknown as ComponentMeta;
    navigate(data.path);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Component Registry</h1>
          <p style={styles.subtitle}>
            All Radiant design system components with Figma sync status and metadata
          </p>
        </div>
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{componentRegistry.length}</span>
            <span style={styles.statLabel}>Components</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>
              {componentRegistry.filter((c) => c.source === 'figma').length}
            </span>
            <span style={styles.statLabel}>From Figma</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>
              {componentRegistry.filter((c) => c.status === 'new').length}
            </span>
            <span style={styles.statLabel}>New</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <SearchInput
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '280px' }}
        />
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Category:</span>
          <select
            style={styles.select}
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Source:</span>
          <select
            style={styles.select}
            value={selectedSource || ''}
            onChange={(e) => setSelectedSource(e.target.value || null)}
          >
            <option value="">All Sources</option>
            <option value="figma">Figma</option>
            <option value="scaligent">Scaligent</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <Table
          columns={columns}
          data={filteredComponents as unknown as ColumnData[]}
          rowKey="id"
          hoverable
          striped
          onRowClick={handleRowClick}
          emptyMessage="No components match your filters"
        />
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <span style={styles.legendTitle}>Source Legend:</span>
        <div style={styles.legendItems}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: sysVar('content-accent-purple') }} />
            <span>Figma - Synced from Figma design file</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: sysVar('content-accent-green') }} />
            <span>Scaligent - Referenced from Scaligent design system</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: sysVar('content-secondary') }} />
            <span>Custom - Created independently</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '40px',
  },
  headerContent: {},
  title: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '36px',
    fontWeight: 700,
    color: sysVar('content-primary'),
    marginBottom: '12px',
  },
  subtitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '16px',
    fontWeight: 400,
    color: sysVar('content-secondary'),
    lineHeight: '26px',
    maxWidth: '700px',
  },
  stats: {
    display: 'flex',
    gap: '24px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 20px',
    background: sysVar('background-sunken'),
    borderRadius: '12px',
    minWidth: '80px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: sysVar('content-brand'),
  },
  statLabel: {
    fontSize: '11px',
    color: sysVar('content-secondary'),
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  filters: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '24px',
    padding: '16px 20px',
    background: sysVar('background-sunken'),
    borderRadius: '12px',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '13px',
    color: sysVar('content-secondary'),
  },
  select: {
    padding: '8px 12px',
    fontSize: '13px',
    border: `1px solid ${sysVar('border-subtle-hover')}`,
    borderRadius: '6px',
    background: sysVar('background-base'),
    color: sysVar('content-primary'),
    cursor: 'pointer',
  },
  tableContainer: {
    background: sysVar('background-base'),
    borderRadius: '12px',
    border: `1px solid ${sysVar('background-subtle')}`,
    overflow: 'hidden',
  },
  componentCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  componentName: {
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
  },
  componentCategory: {
    fontSize: '11px',
    color: sysVar('content-secondary'),
  },
  statesCell: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  stateTag: {
    fontSize: '10px',
    padding: '2px 6px',
    background: sysVar('background-sunken'),
    color: sysVar('content-primary'),
    borderRadius: '4px',
    textTransform: 'lowercase',
  },
  moreStates: {
    fontSize: '10px',
    padding: '2px 6px',
    color: sysVar('content-secondary'),
    fontStyle: 'italic',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 'var(--font-weight-emphasis)',
    padding: '4px 8px',
    borderRadius: '6px',
    textTransform: 'capitalize',
  },
  sourceBadge: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '4px 8px',
    borderRadius: '6px',
  },
  dateText: {
    fontSize: '12px',
    color: sysVar('content-secondary'),
  },
  variantCount: {
    fontSize: '13px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
  },
  linkButton: {
    padding: '6px 10px',
    background: sysVar('background-information'),
    color: sysVar('content-brand'),
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'var(--font-weight-emphasis)',
    transition: 'all 150ms ease',
  },
  legend: {
    marginTop: '24px',
    padding: '16px 20px',
    background: sysVar('background-sunken'),
    borderRadius: '12px',
  },
  legendTitle: {
    fontSize: '12px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    marginBottom: '12px',
    display: 'block',
  },
  legendItems: {
    display: 'flex',
    gap: '24px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: sysVar('content-secondary'),
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
};

export default ComponentRegistryPage;
