import React, { useState } from 'react';
import { systemColors, referenceColors } from '../tokens/colors';
import {
  roadmapCategories,
  getTotalItems,
  getCompletedItems,
  getInProgressItems,
  type RoadmapStatus,
  type RoadmapItem,
  type RoadmapSection,
  type RoadmapCategory,
} from '../data/roadmapItems';

/**
 * Status badge colors and labels
 */
const statusConfig: Record<RoadmapStatus, { bg: string; text: string; label: string }> = {
  'not-started': { bg: systemColors.light['background-subtle'], text: systemColors.light['content-secondary'], label: 'Not started' },
  'in-progress': { bg: '#2770EF1A', text: systemColors.light['content-brand'], label: 'In progress' },
  'done': { bg: '#06BF7F1A', text: '#06BF7F', label: 'Done' },
};

/**
 * Single roadmap item row
 */
const RoadmapItemRow: React.FC<{ item: RoadmapItem }> = ({ item }) => {
  const config = statusConfig[item.status];
  return (
    <div style={styles.itemRow}>
      <div style={styles.itemLeft}>
        <div
          style={{
            ...styles.statusDot,
            backgroundColor: item.status === 'done' ? '#06BF7F' : item.status === 'in-progress' ? systemColors.light['content-brand'] : systemColors.light['border-default'],
          }}
        />
        <div style={styles.itemContent}>
          <span
            style={{
              ...styles.itemLabel,
              textDecoration: item.status === 'done' ? 'line-through' : 'none',
              color: item.status === 'done' ? systemColors.light['border-default'] : systemColors.light['content-primary'],
            }}
          >
            {item.label}
          </span>
          {item.description && (
            <span style={styles.itemDescription}>{item.description}</span>
          )}
        </div>
      </div>
      <span
        style={{
          ...styles.statusBadge,
          backgroundColor: config.bg,
          color: config.text,
        }}
      >
        {config.label}
      </span>
    </div>
  );
};

/**
 * Roadmap section with items
 */
const RoadmapSectionBlock: React.FC<{ section: RoadmapSection }> = ({ section }) => {
  const done = section.items.filter(i => i.status === 'done').length;
  const total = section.items.length;

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h4 style={styles.sectionTitle}>{section.title}</h4>
        <span style={styles.sectionCount}>
          {done}/{total}
        </span>
      </div>
      {section.description && (
        <p style={styles.sectionDescription}>{section.description}</p>
      )}
      <div style={styles.progressBarBg}>
        <div
          style={{
            ...styles.progressBarFill,
            width: total > 0 ? `${(done / total) * 100}%` : '0%',
          }}
        />
      </div>
      <div style={styles.itemList}>
        {section.items.map(item => (
          <RoadmapItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

/**
 * Roadmap category card
 */
const RoadmapCategoryCard: React.FC<{ category: RoadmapCategory }> = ({ category }) => {
  return (
    <div style={styles.categoryCard}>
      <div style={styles.categoryHeader}>
        <span style={styles.categoryIcon}>{category.icon}</span>
        <h3 style={styles.categoryTitle}>{category.title}</h3>
      </div>
      {category.sections.map(section => (
        <RoadmapSectionBlock key={section.id} section={section} />
      ))}
    </div>
  );
};

/**
 * RoadmapPage
 *
 * Displays the project roadmap with documentation updates,
 * AI instruction sets, and guidelines work items.
 */
export const RoadmapPage: React.FC = () => {
  const total = getTotalItems();
  const completed = getCompletedItems();
  const inProgress = getInProgressItems();
  const notStarted = total - completed - inProgress;
  const [filterStatus, setFilterStatus] = useState<RoadmapStatus | 'all'>('all');

  const filteredCategories: RoadmapCategory[] = filterStatus === 'all'
    ? roadmapCategories
    : roadmapCategories.map(cat => ({
        ...cat,
        sections: cat.sections
          .map(section => ({
            ...section,
            items: section.items.filter(item => item.status === filterStatus),
          }))
          .filter(section => section.items.length > 0),
      })).filter(cat => cat.sections.length > 0);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Roadmap</h1>
        <p style={styles.subtitle}>
          Track documentation updates, AI instruction sets, and guidelines work items.
        </p>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{total}</span>
          <span style={styles.statLabel}>Total items</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statValue, color: '#06BF7F' }}>{completed}</span>
          <span style={styles.statLabel}>Completed</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statValue, color: systemColors.light['content-brand'] }}>{inProgress}</span>
          <span style={styles.statLabel}>In progress</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statValue, color: systemColors.light['content-tertiary'] }}>{notStarted}</span>
          <span style={styles.statLabel}>Not started</span>
        </div>
      </div>

      {/* Overall progress */}
      <div style={styles.overallProgress}>
        <div style={styles.overallProgressHeader}>
          <span style={styles.overallProgressLabel}>Overall progress</span>
          <span style={styles.overallProgressPercent}>
            {total > 0 ? Math.round((completed / total) * 100) : 0}%
          </span>
        </div>
        <div style={styles.overallProgressBarBg}>
          <div
            style={{
              ...styles.overallProgressBarFill,
              width: total > 0 ? `${(completed / total) * 100}%` : '0%',
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterRow}>
        {(['all', 'not-started', 'in-progress', 'done'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              ...styles.filterButton,
              backgroundColor: filterStatus === status ? systemColors.light['content-brand'] : systemColors.light['background-base'],
              color: filterStatus === status ? systemColors.light['background-base'] : referenceColors.gray['70'],
              borderColor: filterStatus === status ? systemColors.light['content-brand'] : systemColors.light['background-subtle'],
            }}
          >
            {status === 'all' ? 'All' : statusConfig[status].label}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div style={styles.categoriesList}>
        {filteredCategories.map(category => (
          <RoadmapCategoryCard key={category.id} category={category} />
        ))}
        {filteredCategories.length === 0 && (
          <div style={styles.emptyState}>
            No items match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    fontFamily: 'var(--font-family-primary)',
  },
  header: {
    marginBottom: '40px',
  },
  title: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '36px',
    fontWeight: 700,
    color: systemColors.light['content-primary'],
    marginBottom: '12px',
  },
  subtitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '16px',
    fontWeight: 400,
    color: systemColors.light['content-secondary'],
    lineHeight: '26px',
    maxWidth: '700px',
  },

  // Stats
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 16px',
    backgroundColor: systemColors.light['background-base'],
    borderRadius: '12px',
    border: `1px solid ${systemColors.light['background-subtle']}`,
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: systemColors.light['content-primary'],
    lineHeight: 1,
    marginBottom: '6px',
  },
  statLabel: {
    fontSize: '13px',
    fontWeight: 400,
    color: systemColors.light['content-tertiary'],
  },

  // Overall progress
  overallProgress: {
    marginBottom: '24px',
    padding: '20px 24px',
    backgroundColor: systemColors.light['background-base'],
    borderRadius: '12px',
    border: `1px solid ${systemColors.light['background-subtle']}`,
  },
  overallProgressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  overallProgressLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: referenceColors.gray['70'],
  },
  overallProgressPercent: {
    fontSize: '14px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: systemColors.light['content-primary'],
  },
  overallProgressBarBg: {
    height: '8px',
    backgroundColor: systemColors.light['background-subtle'],
    borderRadius: '4px',
    overflow: 'hidden',
  },
  overallProgressBarFill: {
    height: '100%',
    backgroundColor: '#06BF7F',
    borderRadius: '4px',
    transition: 'width 300ms ease',
  },

  // Filters
  filterRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  filterButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: '8px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    fontFamily: 'inherit',
  },

  // Categories
  categoriesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  categoryCard: {
    backgroundColor: systemColors.light['background-base'],
    borderRadius: '16px',
    border: `1px solid ${systemColors.light['background-subtle']}`,
    padding: '28px',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  categoryIcon: {
    fontSize: '24px',
  },
  categoryTitle: {
    fontSize: '20px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: systemColors.light['content-primary'],
    letterSpacing: '-0.3px',
  },

  // Sections
  section: {
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: `1px solid ${systemColors.light['background-subtle']}`,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: systemColors.light['background-raised-inverse'],
  },
  sectionCount: {
    fontSize: '13px',
    fontWeight: 500,
    color: systemColors.light['content-tertiary'],
  },
  sectionDescription: {
    fontSize: '13px',
    fontWeight: 400,
    color: systemColors.light['content-tertiary'],
    marginBottom: '12px',
    lineHeight: 1.5,
  },
  progressBarBg: {
    height: '4px',
    backgroundColor: systemColors.light['background-subtle'],
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#06BF7F',
    borderRadius: '2px',
    transition: 'width 300ms ease',
  },

  // Items
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '10px 12px',
    borderRadius: '8px',
    transition: 'background-color 100ms ease',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    flex: 1,
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginTop: '6px',
    flexShrink: 0,
  },
  itemContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemLabel: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  itemDescription: {
    fontSize: '12px',
    fontWeight: 400,
    color: systemColors.light['content-tertiary'],
    lineHeight: 1.4,
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '3px 10px',
    borderRadius: '12px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    marginLeft: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    fontSize: '15px',
    color: systemColors.light['content-tertiary'],
  },
};

export default RoadmapPage;
