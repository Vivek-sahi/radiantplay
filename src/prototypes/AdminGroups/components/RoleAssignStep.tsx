import React from 'react';
import { Select } from '../../../components/Select';
import { roleAssignStyles as styles } from '../styles';
import { organizations, roles } from '../data/mockData';
import { sysVar } from '../../../tokens/colors';

interface RoleAssignment {
  orgId: string;
  roleId: string;
}

interface RoleAssignStepProps {
  selectedOrgIds: string[];
  roleAssignments: RoleAssignment[];
  onRoleAssignmentsChange: (assignments: RoleAssignment[]) => void;
}

/**
 * RoleAssignStep Component
 * 
 * Step 3 of the wizard: Assign roles to selected organizations.
 * Shows a table of selected orgs with role dropdowns.
 */
export const RoleAssignStep: React.FC<RoleAssignStepProps> = ({
  selectedOrgIds,
  roleAssignments,
  onRoleAssignmentsChange,
}) => {
  // Get selected organizations
  const selectedOrgs = organizations.filter(org => 
    selectedOrgIds.includes(org.id)
  );

  // Get role for an org
  const getRoleForOrg = (orgId: string): string => {
    const assignment = roleAssignments.find(a => a.orgId === orgId);
    return assignment?.roleId || '';
  };

  // Handle role change for an org
  const handleRoleChange = (orgId: string, roleId: string) => {
    const existingIndex = roleAssignments.findIndex(a => a.orgId === orgId);
    let newAssignments: RoleAssignment[];
    
    if (existingIndex >= 0) {
      newAssignments = [...roleAssignments];
      newAssignments[existingIndex] = { orgId, roleId };
    } else {
      newAssignments = [...roleAssignments, { orgId, roleId }];
    }
    
    onRoleAssignmentsChange(newAssignments);
  };

  // Apply role to all orgs
  const handleApplyToAll = (roleId: string) => {
    const newAssignments = selectedOrgIds.map(orgId => ({
      orgId,
      roleId,
    }));
    onRoleAssignmentsChange(newAssignments);
  };

  // Role options for select
  const roleOptions = roles.map(role => ({
    id: role.id,
    label: role.name,
  }));

  return (
    <div>
      <p style={styles.description}>
        Assign roles to each selected organization. You can apply the same role to all orgs or customize per org.
      </p>

      {/* Bulk action */}
      <div style={styles.bulkAction}>
        <span style={styles.bulkLabel}>Apply to all:</span>
        <div style={{ width: '180px' }}>
          <Select
            options={[{ id: '', label: 'Select role' }, ...roleOptions]}
            value=""
            onChange={(value) => {
              if (value) handleApplyToAll(value);
            }}
            placeholder="Select role"
          />
        </div>
      </div>

      {/* Org-role table */}
      <div style={styles.tableContainer}>
        {/* Header */}
        <div style={styles.tableHeader}>
          <div style={{ flex: 1 }}>ORGANIZATION</div>
          <div style={{ width: '180px' }}>ROLE</div>
        </div>

        {/* Rows */}
        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
          {selectedOrgs.map((org, index) => (
            <div 
              key={org.id} 
              style={{
                ...styles.tableRow,
                borderBottom: index === selectedOrgs.length - 1 ? 'none' : `1px solid ${sysVar('background-subtle')}`,
              }}
            >
              <div style={styles.orgName}>{org.name}</div>
              <div style={styles.roleSelect}>
                <Select
                  options={[{ id: '', label: 'Select role' }, ...roleOptions]}
                  value={getRoleForOrg(org.id)}
                  onChange={(value) => handleRoleChange(org.id, value)}
                  placeholder="Select role"
                />
              </div>
            </div>
          ))}
        </div>

        {selectedOrgs.length === 0 && (
          <div style={{ 
            padding: '24px', 
            textAlign: 'center',
            color: sysVar('content-tertiary'),
            fontSize: '14px',
          }}>
            No organizations selected. Go back to select orgs.
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleAssignStep;
