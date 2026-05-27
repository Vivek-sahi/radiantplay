import React, { useState } from 'react';
import { systemColors } from '../../tokens/colors';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const brand = systemColors.light['content-brand'];

// ─── Mock data ────────────────────────────────────────────────────────────────

type OrgRow = {
  id: number;
  name: string;
  description?: string;
  groups: string[];
  groupsExtra?: number;
  users: number;
  created: string;
};

const ORGS: OrgRow[] = [
  {
    id: 1,
    name: 'Testing org 1',
    description: 'This is a default description of the org.',
    groups: ['Admin', 'Eng', 'Finance', 'Marketing'],
    groupsExtra: 5,
    users: 23,
    created: '7 days ago',
  },
  {
    id: 2,
    name: 'Nina Enterprises',
    description: 'Nina Enterprises is an organization focuse...',
    groups: ['Org Admins', 'Dev', 'QA', 'Sales'],
    groupsExtra: 9,
    users: 45,
    created: '14 days ago',
  },
  {
    id: 3,
    name: 'Innovative Solutions Corp.',
    groups: ['EMEA', 'APAC', 'NA', 'IT'],
    users: 78,
    created: '3 weeks ago',
  },
  {
    id: 4,
    name: 'Arjun Industries',
    description: 'Arjun Industries is an org focused on emp...',
    groups: [],
    users: 12,
    created: 'a month ago',
  },
  {
    id: 5,
    name: 'Kiran Technologies',
    groups: [],
    users: 32,
    created: '2 months ago',
  },
  {
    id: 6,
    name: 'Leila Innovations',
    description: 'Leila Khan is a dynamic organization focus...',
    groups: [],
    users: 67,
    created: '3 months ago',
  },
  {
    id: 7,
    name: 'Aisha Consulting',
    groups: ['Admin', 'Eng', 'Finance', 'Marketing'],
    groupsExtra: 5,
    users: 89,
    created: 'a year ago',
  },
  {
    id: 8,
    name: 'Aisha Holdings',
    groups: ['Admin', 'Eng', 'Finance', 'Marketing'],
    groupsExtra: 5,
    users: 123,
    created: '4 years ago',
  },
];

// ─── Checkbox ─────────────────────────────────────────────────────────────────

const Checkbox: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({
  checked, indeterminate, onChange,
}) => (
  <button
    role="checkbox"
    aria-checked={indeterminate ? 'mixed' : checked}
    onClick={onChange}
    style={{
      width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
      border: checked || indeterminate ? 'none' : '1.5px solid #D1D5DB',
      backgroundColor: checked || indeterminate ? brand : '#FFFFFF',
      cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background-color 0.15s',
    }}
  >
    {indeterminate && !checked && (
      <svg width="8" height="2" viewBox="0 0 8 2" fill="none">
        <rect width="8" height="2" rx="1" fill="#FFFFFF" />
      </svg>
    )}
    {checked && (
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
        <path d="M1 3.5L3.5 6L8 1" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </button>
);

// ─── DotsMenu ─────────────────────────────────────────────────────────────────

const DotsMenu: React.FC = () => (
  <button style={{
    width: '32px', height: '32px', borderRadius: '50%', border: 'none',
    backgroundColor: '#F3F4F6', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background-color 0.15s',
  }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E5E7EB'; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6'; }}
  >
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="3" cy="7" r="1.2" fill="#6B7280" />
      <circle cx="7" cy="7" r="1.2" fill="#6B7280" />
      <circle cx="11" cy="7" r="1.2" fill="#6B7280" />
    </svg>
  </button>
);

// ─── GroupsCell ───────────────────────────────────────────────────────────────

const GroupsCell: React.FC<{ groups: string[]; extra?: number }> = ({ groups, extra }) => {
  if (groups.length === 0) {
    return <span style={{ color: '#9CA3AF', fontFamily: font, fontSize: '13.5px' }}>-</span>;
  }
  return (
    <div>
      <span style={{ fontFamily: font, fontSize: '13.5px', color: '#374151' }}>
        {groups.join('\u2002,\u2002')}
      </span>
      {extra && extra > 0 && (
        <div>
          <button style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: font, fontSize: '12.5px', fontWeight: 500, color: brand,
          }}>
            +{extra} more
          </button>
        </div>
      )}
    </div>
  );
};

// ─── OrgManagementPageContent ─────────────────────────────────────────────────

export const OrgManagementPageContent: React.FC = () => {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const allSelected = selectedRows.size === ORGS.length;
  const someSelected = selectedRows.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelectedRows(new Set());
    else setSelectedRows(new Set(ORGS.map((o) => o.id)));
  };

  const toggleRow = (id: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const colStyle = (width: string): React.CSSProperties => ({
    padding: '10px 16px 10px 0',
    textAlign: 'left',
    fontFamily: font,
    fontSize: '12.5px',
    fontWeight: 500,
    color: '#6B7280',
    borderBottom: '1px solid #E5E7EB',
    width,
    whiteSpace: 'nowrap',
  });

  const cellStyle: React.CSSProperties = {
    padding: '16px 16px 16px 0',
    verticalAlign: 'top',
    borderBottom: '1px solid #F3F4F6',
    fontFamily: font,
    fontSize: '13.5px',
    color: '#374151',
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>

      {/* ── Sticky header ── */}
      <div style={{ flexShrink: 0, padding: '28px 40px 20px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0F172A', fontFamily: font, letterSpacing: '-0.3px' }}>
          Org management
        </h1>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '20px 40px 64px' }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            {/* Left: search + filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Search */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: '10px' }}>
                  <circle cx="6" cy="6" r="4.5" stroke="#9CA3AF" strokeWidth="1.4" />
                  <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="Search"
                  style={{
                    width: '200px', height: '36px', paddingLeft: '32px', paddingRight: '12px',
                    border: '1px solid #D1D5DB', borderRadius: '8px',
                    fontFamily: font, fontSize: '13px', color: '#111827',
                    outline: 'none', backgroundColor: '#FFFFFF',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Add filter */}
              <button style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                height: '36px', padding: '0 14px',
                border: 'none', background: 'none',
                cursor: 'pointer', fontFamily: font, fontSize: '13px', fontWeight: 500, color: brand,
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1.5 3.5h11M3.5 7h7M5.5 10.5h3" stroke={brand} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Add filter
              </button>
            </div>

            {/* Right: Add new org pill button */}
            <button style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              height: '36px', padding: '0 20px',
              border: 'none', borderRadius: '999px',
              backgroundColor: brand, cursor: 'pointer',
              fontFamily: font, fontSize: '13px', fontWeight: 600, color: '#FFFFFF',
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              Add new org
            </button>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: font }}>
            <thead>
              <tr>
                <th style={{ ...colStyle('40px'), padding: '10px 12px 10px 0' }}>
                  <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
                </th>
                <th style={colStyle('30%')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Org name
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2v8M3 7l3 3 3-3" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </th>
                <th style={colStyle('28%')}>Groups</th>
                <th style={colStyle('12%')}>Users</th>
                <th style={colStyle('16%')}>Created</th>
                <th style={{ ...colStyle('80px'), textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ORGS.map((org) => (
                <tr key={org.id}>
                  {/* Checkbox */}
                  <td style={{ ...cellStyle, padding: '16px 12px 16px 0', width: '40px', verticalAlign: 'middle' }}>
                    <Checkbox checked={selectedRows.has(org.id)} onChange={() => toggleRow(org.id)} />
                  </td>

                  {/* Org name + description */}
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 500, color: brand, cursor: 'pointer', marginBottom: org.description ? '2px' : 0 }}>
                      {org.name}
                    </div>
                    {org.description && (
                      <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.4 }}>
                        {org.description}
                      </div>
                    )}
                  </td>

                  {/* Groups */}
                  <td style={cellStyle}>
                    <GroupsCell groups={org.groups} extra={org.groupsExtra} />
                  </td>

                  {/* Users */}
                  <td style={cellStyle}>{org.users}</td>

                  {/* Created */}
                  <td style={cellStyle}>{org.created}</td>

                  {/* Actions */}
                  <td style={{ ...cellStyle, textAlign: 'right', verticalAlign: 'middle' }}>
                    <DotsMenu />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', marginTop: '32px',
            fontFamily: font, fontSize: '13.5px', fontWeight: 600, color: '#111827',
          }}>
            1-20 of 500
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: '2px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: font, fontSize: '13.5px', fontWeight: 600, color: brand,
              padding: '0 4px',
            }}>
              Next
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke={brand} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrgManagementPageContent;
