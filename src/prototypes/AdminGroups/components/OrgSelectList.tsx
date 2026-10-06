import React, { useState, useMemo } from 'react';
import { Checkbox } from '../../../components/Checkbox';
import { Toggle } from '../../../components/Toggle';
import { Icon } from '../../../components/icons';
import { orgSelectStyles as styles } from '../styles';
import { systemColors } from '../../../tokens/colors';
import { Organization } from '../data/mockData';

interface OrgSelectListProps {
  organizations: Organization[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

/**
 * OrgSelectList Component
 * 
 * Checkbox list for selecting organizations.
 * Features:
 * - Search input with filtering
 * - "Orgs (X)" counter showing selection count
 * - "Select all" and "Clear" action links
 * - Scrollable checkbox list
 * - "Show selected" toggle to filter view
 */
export const OrgSelectList: React.FC<OrgSelectListProps> = ({
  organizations,
  selectedIds,
  onSelectionChange,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Filter organizations based on search and show selected toggle
  const filteredOrgs = useMemo(() => {
    let filtered = organizations;
    
    if (searchValue) {
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    
    if (showSelectedOnly) {
      filtered = filtered.filter(org => selectedIds.includes(org.id));
    }
    
    return filtered;
  }, [organizations, searchValue, showSelectedOnly, selectedIds]);

  const handleSelectAll = () => {
    const allIds = filteredOrgs.map(org => org.id);
    const newSelected = [...new Set([...selectedIds, ...allIds])];
    onSelectionChange(newSelected);
  };

  const handleClear = () => {
    const filteredIds = filteredOrgs.map(org => org.id);
    const newSelected = selectedIds.filter(id => !filteredIds.includes(id));
    onSelectionChange(newSelected);
  };

  const handleToggleOrg = (orgId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, orgId]);
    } else {
      onSelectionChange(selectedIds.filter(id => id !== orgId));
    }
  };

  return (
    <div>
      {/* Section label */}
      <div style={styles.sectionLabel}>Select Orgs</div>

      {/* Search input */}
      <div style={styles.searchContainer}>
        <div style={{ position: 'relative' }}>
          <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: systemColors.light['content-tertiary'],
              display: 'flex',
            }}>
            <Icon name="magnifying-glass" size="m" />
          </span>
          <input
            type="text"
            placeholder="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{
              width: '100%',
              height: '32px',
              paddingLeft: '40px',
              paddingRight: '12px',
              border: `1px solid ${systemColors.light['border-default']}`,
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'var(--font-family-primary)',
            }}
          />
        </div>
      </div>

      {/* Header row with count and actions */}
      <div style={styles.headerRow}>
        <span style={styles.countLabel}>Orgs ({selectedIds.length})</span>
        <div style={styles.actionLinks}>
          <button style={styles.actionLink} onClick={handleSelectAll}>
            Select all
          </button>
          <div style={styles.divider} />
          <button style={styles.actionLink} onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>

      {/* Checkbox list */}
      <div style={styles.listContainer}>
        <div style={styles.listScroll}>
          {filteredOrgs.map((org) => (
            <div key={org.id} style={styles.listItem}>
              <Checkbox
                checked={selectedIds.includes(org.id)}
                onChange={(checked) => handleToggleOrg(org.id, checked)}
              />
              <span style={styles.listItemLabel}>{org.name}</span>
            </div>
          ))}
          {filteredOrgs.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '24px',
              color: systemColors.light['content-tertiary'],
              fontSize: '14px',
            }}>
              {showSelectedOnly ? 'No organizations selected' : 'No organizations found'}
            </div>
          )}
        </div>

        {/* Toggle footer */}
        <div style={styles.toggleFooter}>
          <Toggle
            checked={showSelectedOnly}
            onChange={setShowSelectedOnly}
          />
          <span style={styles.toggleLabel}>Show selected</span>
        </div>
      </div>
    </div>
  );
};

export default OrgSelectList;
