import React from 'react';
import { Avatar } from '../../../components/Avatar';
import { Chip } from '../../../components/Chip';
import { tableStyles as styles } from '../styles';
import { systemColors, referenceColors } from '../../../tokens/colors';
import { spacing } from '../../../tokens/spacing';
import { Group, organizations, getRelativeTime } from '../data/mockData';

interface GroupsTableProps {
  groups: Group[];
  onGroupClick?: (group: Group) => void;
}

/**
 * GroupsTable Component
 *
 * Data table showing groups with their details.
 */
export const GroupsTable: React.FC<GroupsTableProps> = ({
  groups,
  onGroupClick,
}) => {
  // Get org names for a group
  const getOrgNames = (orgIds: string[]): string[] => {
    return orgIds.map(id => {
      const org = organizations.find(o => o.id === id);
      return org?.name || id;
    });
  };

  return (
    <div style={styles.container}>
      {/* Table Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
          padding: `${spacing.C}px ${spacing.D}px`,
          backgroundColor: systemColors.light['background-sunken'],
          borderBottom: `1px solid ${systemColors.light['background-subtle']}`,
          fontSize: '12px',
          fontWeight: 600,
          color: systemColors.light['content-secondary'],
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
        }}
      >
        <div>Name</div>
        <div>Orgs</div>
        <div>Members</div>
        <div>Created by</div>
        <div>Created</div>
      </div>

      {/* Table Rows */}
      {groups.map((group, index) => {
        const orgNames = getOrgNames(group.orgs);
        const displayOrgs = orgNames.slice(0, 2);
        const moreCount = orgNames.length - 2;

        return (
          <div
            key={group.id}
            onClick={() => onGroupClick?.(group)}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              padding: `${spacing.C}px ${spacing.D}px`,
              borderBottom: index === groups.length - 1 ? 'none' : `1px solid ${systemColors.light['background-subtle']}`,
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = systemColors.light['background-sunken'];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Name */}
            <div>
              <div style={{ fontWeight: 500, color: systemColors.light['content-brand'], fontSize: '14px' }}>
                {group.displayName}
              </div>
              {group.description && (
                <div style={{ fontSize: '12px', color: systemColors.light['content-tertiary'], marginTop: '2px' }}>
                  {group.description.length > 50
                    ? `${group.description.substring(0, 50)}...`
                    : group.description
                  }
                </div>
              )}
            </div>

            {/* Orgs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {displayOrgs.map((orgName, i) => (
                <Chip key={i} label={orgName} />
              ))}
              {moreCount > 0 && (
                <span style={{ fontSize: '12px', color: systemColors.light['content-brand'], fontWeight: 500 }}>
                  +{moreCount} more
                </span>
              )}
            </div>

            {/* Members */}
            <div style={{ fontSize: '14px', color: referenceColors.gray['70'] }}>
              {group.memberCount}
            </div>

            {/* Created by */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar name={group.createdBy.name} size="xs" />
              <span style={{ fontSize: '13px', color: referenceColors.gray['70'] }}>
                {group.createdBy.name}
              </span>
            </div>

            {/* Created */}
            <div style={{ fontSize: '13px', color: systemColors.light['content-tertiary'] }}>
              {getRelativeTime(group.createdAt)}
            </div>
          </div>
        );
      })}

      {groups.length === 0 && (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          color: systemColors.light['content-tertiary'],
          fontSize: '14px',
        }}>
          No groups found. Click "Add group" to create one.
        </div>
      )}
    </div>
  );
};

export default GroupsTable;
