import React, { useState } from 'react';
import { Select } from '../../../components/Select';
import { Chip } from '../../../components/Chip';
import { Icon } from '../../../components/icons';
import { usersParentStyles as styles } from '../styles';
import { users, existingGroups } from '../data/mockData';
import { systemColors } from '../../../tokens/colors';

interface UsersParentStepProps {
  parentGroupId: string;
  selectedUserIds: string[];
  onParentGroupChange: (groupId: string) => void;
  onSelectedUsersChange: (userIds: string[]) => void;
}

/**
 * UsersParentStep Component
 * 
 * Step 4 of the wizard: Select parent group and add users.
 */
export const UsersParentStep: React.FC<UsersParentStepProps> = ({
  parentGroupId,
  selectedUserIds,
  onParentGroupChange,
  onSelectedUsersChange,
}) => {
  const [userSearchValue, setUserSearchValue] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Parent group options
  const parentGroupOptions = [
    { id: '', label: 'No parent group' },
    ...existingGroups.map(group => ({
      id: group.id,
      label: group.displayName,
    })),
  ];

  // Filter users for dropdown
  const filteredUsers = users.filter(user =>
    !selectedUserIds.includes(user.id) &&
    (user.name.toLowerCase().includes(userSearchValue.toLowerCase()) ||
     user.email.toLowerCase().includes(userSearchValue.toLowerCase()))
  );

  // Get selected user objects
  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));

  const handleAddUser = (userId: string) => {
    onSelectedUsersChange([...selectedUserIds, userId]);
    setUserSearchValue('');
    setShowUserDropdown(false);
  };

  const handleRemoveUser = (userId: string) => {
    onSelectedUsersChange(selectedUserIds.filter(id => id !== userId));
  };

  return (
    <div>
      {/* Parent group section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Parent group</div>
        <p style={styles.sectionDescription}>
          Optionally nest this group under an existing group.
        </p>
        <Select
          options={parentGroupOptions}
          value={parentGroupId}
          onChange={(value) => onParentGroupChange(value)}
          placeholder="Select parent group"
        />
      </div>

      {/* Users section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Add users</div>
        <p style={styles.sectionDescription}>
          Search and add users to this group.
        </p>

        {/* User search input with dropdown */}
        <div style={{ position: 'relative' }}>
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
              placeholder="Search users"
              value={userSearchValue}
              onChange={(e) => {
                setUserSearchValue(e.target.value);
                setShowUserDropdown(true);
              }}
              onFocus={() => setShowUserDropdown(true)}
              style={{
                width: '100%',
                height: '36px',
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

          {/* Dropdown */}
          {showUserDropdown && userSearchValue && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                backgroundColor: systemColors.light['background-base'],
                border: `1px solid ${systemColors.light['background-subtle']}`,
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10,
              }}
            >
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleAddUser(user.id)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${systemColors.light['background-sunken']}`,
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = systemColors.light['background-sunken'];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 500, color: systemColors.light['content-primary'] }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '12px', color: systemColors.light['content-tertiary'] }}>
                      {user.email}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: systemColors.light['content-tertiary'], fontSize: '14px' }}>
                  No users found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected users as chips */}
        {selectedUsers.length > 0 && (
          <div style={styles.selectedUsers}>
            {selectedUsers.map(user => (
              <Chip
                key={user.id}
                label={user.name}
                onDelete={() => handleRemoveUser(user.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersParentStep;
