import React, { useState, useMemo } from 'react';
import { 
  versionHistory, 
  getChangeTypeIcon, 
  getChangeTypeColor, 
  getVersionTypeLabel,
  VersionEntry,
  VersionType
} from '../data/versionHistory';
import { SearchInput } from '../components/SearchInput';
import styles from './VersionHistoryPage.module.css';

/**
 * Get version type badge color
 */
const getVersionTypeBadgeColor = (type: VersionType): string => {
  switch (type) {
    case 'major':
      return 'var(--rd-ref-color-purple-60, #8C62F5)';
    case 'minor':
      return 'var(--rd-sys-color-content-brand, #2770EF)';
    case 'patch':
      return 'var(--rd-sys-color-content-success, #06BF7F)';
    case 'figma-sync':
      return 'var(--rd-sys-color-content-warning, #FCC838)';
    default:
      return 'var(--rd-sys-color-content-secondary, #777E8B)';
  }
};

/**
 * Format date to readable string
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

interface VersionCardProps {
  entry: VersionEntry;
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery: string;
}

const VersionCard: React.FC<VersionCardProps> = ({ 
  entry, 
  isExpanded, 
  onToggle,
  searchQuery 
}) => {
  const filteredChanges = useMemo(() => {
    if (!searchQuery) return entry.changes;
    const query = searchQuery.toLowerCase();
    return entry.changes.filter(
      change => 
        change.component.toLowerCase().includes(query) ||
        change.description.toLowerCase().includes(query)
    );
  }, [entry.changes, searchQuery]);

  const hasMatchingChanges = filteredChanges.length > 0;

  if (searchQuery && !hasMatchingChanges) {
    return null;
  }

  return (
    <div className={styles.versionCard}>
      <button 
        className={styles.versionHeader}
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className={styles.versionInfo}>
          <div className={styles.versionTitleRow}>
            <span className={styles.versionNumber}>v{entry.version}</span>
            <span 
              className={styles.versionBadge}
              style={{ backgroundColor: getVersionTypeBadgeColor(entry.type) }}
            >
              {getVersionTypeLabel(entry.type)}
            </span>
          </div>
          <span className={styles.versionDate}>{formatDate(entry.date)}</span>
        </div>
        <div className={styles.versionMeta}>
          <span className={styles.changeCount}>
            {filteredChanges.length} change{filteredChanges.length !== 1 ? 's' : ''}
          </span>
          <span className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}>
            <ChevronIcon />
          </span>
        </div>
      </button>
      
      {isExpanded && (
        <div className={styles.changesList}>
          {filteredChanges.map((change, index) => {
            const isNewGroup = change.group && change.group !== filteredChanges[index - 1]?.group;
            return (
              <React.Fragment key={index}>
                {isNewGroup && (
                  <div className={styles.groupHeader}>{change.group}</div>
                )}
                <div className={styles.changeItem}>
                  <span
                    className={styles.changeIcon}
                    style={{ color: getChangeTypeColor(change.type) }}
                  >
                    {getChangeTypeIcon(change.type)}
                  </span>
                  <span className={styles.changeComponent}>{change.component}</span>
                  <span className={styles.changeDescription}>{change.description}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ChevronIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * VersionHistoryPage
 * 
 * Full changelog page displaying all version history entries.
 * Supports search/filter by component name and expandable sections.
 */
export const VersionHistoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set([versionHistory[0]?.version]) // Expand latest version by default
  );

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedVersions(new Set(versionHistory.map(v => v.version)));
  };

  const collapseAll = () => {
    setExpandedVersions(new Set());
  };

  // Calculate statistics
  const stats = useMemo(() => {
    let added = 0;
    let modified = 0;
    let removed = 0;
    let synced = 0;
    
    versionHistory.forEach(entry => {
      entry.changes.forEach(change => {
        switch (change.type) {
          case 'added': added++; break;
          case 'modified': modified++; break;
          case 'removed': removed++; break;
          case 'synced': synced++; break;
        }
      });
    });

    return { added, modified, removed, synced, total: added + modified + removed + synced };
  }, []);

  // Filter versions based on search
  const visibleVersions = useMemo(() => {
    if (!searchQuery) return versionHistory;
    const query = searchQuery.toLowerCase();
    return versionHistory.filter(entry => 
      entry.changes.some(
        change => 
          change.component.toLowerCase().includes(query) ||
          change.description.toLowerCase().includes(query)
      )
    );
  }, [searchQuery]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Changelog</h1>
        <p className={styles.subtitle}>
          Version history and component updates for Radiant Design System
        </p>
      </header>

      {/* Statistics */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{versionHistory.length}</span>
          <span className={styles.statLabel}>Versions</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: getChangeTypeColor('added') }}>
            {stats.added}
          </span>
          <span className={styles.statLabel}>Added</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: getChangeTypeColor('modified') }}>
            {stats.modified}
          </span>
          <span className={styles.statLabel}>Modified</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: getChangeTypeColor('synced') }}>
            {stats.synced}
          </span>
          <span className={styles.statLabel}>Synced</span>
        </div>
      </div>

      {/* Search and controls */}
      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <SearchInput
            placeholder="Search by component name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.expandControls}>
          <button className={styles.controlButton} onClick={expandAll}>
            Expand All
          </button>
          <button className={styles.controlButton} onClick={collapseAll}>
            Collapse All
          </button>
        </div>
      </div>

      {/* Version list */}
      <div className={styles.versionList}>
        {visibleVersions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No matching changes found for "{searchQuery}"</p>
          </div>
        ) : (
          visibleVersions.map((entry) => (
            <VersionCard
              key={entry.version}
              entry={entry}
              isExpanded={expandedVersions.has(entry.version)}
              onToggle={() => toggleVersion(entry.version)}
              searchQuery={searchQuery}
            />
          ))
        )}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendTitle}>Legend:</span>
        <div className={styles.legendItem}>
          <span style={{ color: getChangeTypeColor('added') }}>{getChangeTypeIcon('added')}</span>
          <span>Added</span>
        </div>
        <div className={styles.legendItem}>
          <span style={{ color: getChangeTypeColor('modified') }}>{getChangeTypeIcon('modified')}</span>
          <span>Modified</span>
        </div>
        <div className={styles.legendItem}>
          <span style={{ color: getChangeTypeColor('removed') }}>{getChangeTypeIcon('removed')}</span>
          <span>Removed</span>
        </div>
        <div className={styles.legendItem}>
          <span style={{ color: getChangeTypeColor('synced') }}>{getChangeTypeIcon('synced')}</span>
          <span>Figma Sync</span>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryPage;
