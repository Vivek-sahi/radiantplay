import React, { useState } from 'react';
import { sysVar, shadowVar } from '@tokens/colors';
import { Icon } from '../../components/icons/Icon';

const font = 'var(--font-family-primary)';
const brand = sysVar('content-brand');
const brandFill = sysVar('background-brand');

// ─── Mock data ────────────────────────────────────────────────────────────────

const USERS = [
  {
    id: 1,
    name: 'Simran Pandit',
    username: 'simran.pandit',
    orgs: ['Zeus Inc', 'Aegis Corp', 'Olympus LLC'],
    orgsExtra: 5,
    groups: ['Admin', 'Eng', 'Finance', 'Marketing'],
    groupsExtra: 5,
    authType: 'Local',
    created: '7 days ago',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Nina James',
    username: 'ninand4579',
    orgs: ['Hyperion Group', 'Phoenix Ltd'],
    orgsExtra: 9,
    groups: ['Org Admins', 'Dev', 'QA', 'Sales'],
    groupsExtra: 9,
    authType: 'SSO',
    created: '14 days ago',
    status: 'Active',
  },
  {
    id: 3,
    name: '0oafgxoewfAsYiCR81d72222User',
    username: '0oafgxoewfAsYiCR81d72222Username',
    orgs: ['Hydra Co', 'Cerberus Labs', 'Minotaur Holdings', 'Siren Group'],
    orgsExtra: 0,
    groups: ['EMEA', 'APAC', 'NA', 'IT'],
    groupsExtra: 0,
    authType: 'SSO',
    created: '3 weeks ago',
    status: 'Pending',
  },
  {
    id: 4,
    name: 'Arjun Singh',
    username: '26485arunj',
    orgs: [],
    orgsExtra: 0,
    groups: [],
    groupsExtra: 0,
    authType: 'SSO',
    created: 'a month ago',
    status: 'Locked',
  },
  {
    id: 5,
    name: 'Kiran Patel',
    username: 'kiranpatelUser12345',
    orgs: [],
    orgsExtra: 0,
    groups: [],
    groupsExtra: 0,
    authType: 'Local',
    created: '2 months ago',
    status: 'Suspended',
  },
  {
    id: 6,
    name: 'Leila Khan',
    username: 'leilakhanUser67890',
    orgs: [],
    orgsExtra: 0,
    groups: [],
    groupsExtra: 0,
    authType: 'Local',
    created: '3 months ago',
    status: 'Expired',
  },
  {
    id: 7,
    name: 'Aisha Raza',
    username: 'aisharazaUser54321',
    orgs: ['Gorgon Consortium', 'Centaur Group'],
    orgsExtra: 5,
    groups: ['Admin', 'Eng', 'Finance', 'Marketing'],
    groupsExtra: 5,
    authType: 'SSO',
    created: 'a year ago',
    status: 'Pending',
  },
  {
    id: 8,
    name: 'Aisha Raza',
    username: 'aisharazaUser98765',
    orgs: ['Satyr Systems', 'Nymph Co'],
    orgsExtra: 5,
    groups: ['Admin', 'Eng', 'Finance', 'Marketing'],
    groupsExtra: 5,
    authType: 'Local',
    created: '4 years ago',
    status: 'Deactivated',
  },
];

// ─── IDP mock data ────────────────────────────────────────────────────────────

const IDP_CONNECTIONS = [
  { id: 1, name: 'Saml-01',              idpType: 'SAML 2',   clientId: 'https://identity.thoughtspot-2342342.okta.com/oauth2/default', created: '2 mins ago',  enabled: true,  icon: 'saml'      },
  { id: 2, name: 'SAML IDP 1',           idpType: 'SAML 2',   clientId: 'https://abc.pot-342342.okta',                                  created: '1 hour ago',  enabled: true,  icon: 'saml'      },
  { id: 3, name: 'Auth0',                idpType: 'Google',   clientId: 'https://identity.thoughtspot-2342342.okta.com/oauth2/default', created: '2 days ago',  enabled: false, icon: 'google'    },
  { id: 4, name: 'Azure Active Directory',idpType: 'Google',  clientId: 'https://abc.pot-342342.okta',                                  created: '5 mins ago',  enabled: false, icon: 'google'    },
  { id: 5, name: 'OneLogin',             idpType: 'Google',   clientId: 'https://abc.pot-342342.okta',                                  created: '3 weeks ago', enabled: false, icon: 'google'    },
  { id: 6, name: 'Ping Identity',        idpType: 'Amazon',   clientId: 'https://abc.pot-342342.okta',                                  created: '1 month ago', enabled: true,  icon: 'amazon'    },
  { id: 7, name: 'Salesforce Identity',  idpType: 'Microsoft',clientId: 'https://identity.thoughtspot-2342342.okta.com/oauth2/default', created: '5 hours ago', enabled: false, icon: 'microsoft' },
  { id: 8, name: 'Okta Identity Cloud',  idpType: 'OIDC',     clientId: 'https://identity.thoughtspot-2342342.okta.com/oauth2/default', created: '1 year ago',  enabled: true,  icon: 'okta'      },
];

const GROUPS = [
  { id: 1, name: 'Engineering',     description: 'Thoughtpsot Enggs',          users: 23,  created: '2 mins ago'  },
  { id: 2, name: 'Design',          description: 'Data Insights Team',          users: 344, created: '1 hour ago'  },
  { id: 3, name: 'Marketing',       description: 'Product Development Squad',   users: 122, created: '2 days ago'  },
  { id: 4, name: 'Human Resources', description: 'User Experience Crew',        users: 23,  created: '5 mins ago'  },
  { id: 5, name: 'Finance',         description: 'Quality Assurance Unit',      users: 56,  created: '3 weeks ago' },
  { id: 6, name: 'Sales',           description: 'Marketing Innovations Group', users: 113, created: '1 month ago' },
  { id: 7, name: 'Product',         description: 'Customer Support Team',       users: 121, created: '5 hours ago' },
  { id: 8, name: 'Operations',      description: 'Sales Strategy Division',     users: 34,  created: '1 year ago'  },
];

const ROLES = [
  { id: 1, name: 'role-admin',                        groups: ['Admin', 'Eng', 'Finance', 'Marketing'], groupsExtra: 5, privileges: 23  },
  { id: 2, name: 'can produce creative designs',       groups: ['Org Admins', 'Dev', 'QA', 'Sales'],    groupsExtra: 9, privileges: 344 },
  { id: 3, name: 'can develop marketing strategies',   groups: ['EMEA', 'APAC', 'NA', 'IT'],            groupsExtra: 0, privileges: 122 },
  { id: 4, name: 'can support HR initiatives',         groups: [],                                       groupsExtra: 0, privileges: 23  },
  { id: 5, name: 'can analyze financial data',         groups: [],                                       groupsExtra: 0, privileges: 56  },
  { id: 6, name: 'can drive sales growth',             groups: [],                                       groupsExtra: 0, privileges: 113 },
  { id: 7, name: 'can lead product launches',          groups: ['Admin', 'Eng', 'Finance', 'Marketing'], groupsExtra: 5, privileges: 121 },
  { id: 8, name: 'can optimize operations processes',  groups: ['Admin', 'Eng', 'Finance', 'Marketing'], groupsExtra: 5, privileges: 244 },
];

// ─── IDP brand icons ──────────────────────────────────────────────────────────

// Third-party brand colours: data, left as literals.
const SamlIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M14 3L26 24H2L14 3Z" fill="none" stroke="#E84E3A" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M14 9L21 21H7L14 9Z" fill="#E84E3A" />
  </svg>
);

// Third-party brand colours: data, left as literals.
const GoogleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M26.5 14.3c0-.9-.08-1.76-.23-2.6H14v4.92h7.02a6 6 0 01-2.6 3.94v3.27h4.2c2.47-2.27 3.88-5.62 3.88-9.53z" fill="#4285F4"/>
    <path d="M14 27c3.52 0 6.48-1.17 8.63-3.16l-4.2-3.27C17.26 21.5 15.74 22 14 22c-3.4 0-6.28-2.3-7.31-5.39H2.37v3.38A13 13 0 0014 27z" fill="#34A853"/>
    <path d="M6.69 16.61A7.82 7.82 0 016.27 14c0-.91.16-1.79.42-2.61V7.99H2.37A13 13 0 001 14c0 2.1.5 4.08 1.37 5.99l5.32-3.38z" fill="#FBBC05"/>
    <path d="M14 6.5c1.92 0 3.64.66 4.99 1.95l3.74-3.74C20.47 2.64 17.51 1 14 1A13 13 0 002.37 7.99l5.32 3.4C8.72 8.8 11.6 6.5 14 6.5z" fill="#EA4335"/>
  </svg>
);

// Third-party brand colours: data, left as literals.
const AmazonIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <text x="3" y="20" fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill="#232F3E">a</text>
    <path d="M4 23c4 2.5 14 3 20-1" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Third-party brand colours: data, left as literals.
const MicrosoftIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="2"  y="2"  width="11" height="11" fill="#F25022" />
    <rect x="15" y="2"  width="11" height="11" fill="#7FBA00" />
    <rect x="2"  y="15" width="11" height="11" fill="#00A4EF" />
    <rect x="15" y="15" width="11" height="11" fill="#FFB900" />
  </svg>
);

const OktaIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="12" stroke="var(--rd-sys-color-content-brand)" strokeWidth="2.5" fill="none" />
    <circle cx="14" cy="14" r="5" fill="var(--rd-sys-color-content-brand)" />
    <line x1="14" y1="2" x2="14" y2="6"  stroke="var(--rd-sys-color-content-brand)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="14" y1="22" x2="14" y2="26" stroke="var(--rd-sys-color-content-brand)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="2"  y1="14" x2="6"  y2="14" stroke="var(--rd-sys-color-content-brand)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="22" y1="14" x2="26" y2="14" stroke="var(--rd-sys-color-content-brand)" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const IDP_ICONS: Record<string, React.ReactNode> = {
  saml:      <SamlIcon />,
  google:    <GoogleIcon />,
  amazon:    <AmazonIcon />,
  microsoft: <MicrosoftIcon />,
  okta:      <OktaIcon />,
};

// ─── IDPToggle ────────────────────────────────────────────────────────────────

const IDPToggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button onClick={onChange} role="switch" aria-checked={checked}
    style={{
      position: 'relative', width: '36px', height: '20px', borderRadius: '10px',
      border: 'none', backgroundColor: checked ? brandFill : sysVar('background-secondary-hover'),
      cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background-color 0.2s ease',
    }}
  >
    <span style={{
      position: 'absolute', top: '2px', left: checked ? '18px' : '2px',
      width: '16px', height: '16px', borderRadius: '50%',
      backgroundColor: sysVar('background-base'), transition: 'left 0.2s ease',
      boxShadow: shadowVar('surface'),
    }} />
  </button>
);

// ─── Checkbox ─────────────────────────────────────────────────────────────────

const Checkbox: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    role="checkbox"
    aria-checked={checked}
    style={{
      width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0,
      border: `1.5px solid ${checked ? brand : sysVar('border-bold')}`,
      backgroundColor: checked ? brandFill : sysVar('background-base'),
      cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'border-color 0.15s, background-color 0.15s',
    }}
  >
    {checked && (
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
        <path d="M1 3.5l2.5 2.5L8 1" stroke="var(--rd-sys-color-content-inverse)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </button>
);

// ─── DotsMenu ─────────────────────────────────────────────────────────────────

const DotsMenu: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '32px', height: '32px', borderRadius: '50%', border: 'none',
          backgroundColor: open ? sysVar('background-secondary-action') : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background-color 0.1s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = sysVar('background-secondary-action'); }}
        onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
      >
        <svg width="16" height="4" viewBox="0 0 16 4" fill="none">
          <circle cx="2" cy="2" r="1.5" fill="var(--rd-sys-color-content-secondary)" />
          <circle cx="8" cy="2" r="1.5" fill="var(--rd-sys-color-content-secondary)" />
          <circle cx="14" cy="2" r="1.5" fill="var(--rd-sys-color-content-secondary)" />
        </svg>
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', right: 0,
            backgroundColor: sysVar('background-raised'), border: '1px solid var(--rd-sys-color-border-subtle)', borderRadius: '8px',
            boxShadow: shadowVar('menu'), zIndex: 100, overflow: 'hidden', minWidth: '160px',
          }}>
            {['Edit user', 'Reset password', 'Deactivate', 'Delete'].map((action) => (
              <button key={action} onClick={() => setOpen(false)}
                style={{
                  display: 'block', width: '100%', padding: '10px 16px',
                  border: 'none', textAlign: 'left', fontFamily: font, fontSize: '13px',
                  fontWeight: 400, color: action === 'Delete' ? sysVar('content-failure') : sysVar('content-primary'),
                  backgroundColor: 'transparent', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = action === 'Delete' ? sysVar('background-failure') : sysVar('background-sunken'); }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
              >
                {action}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── UserManagementPageContent ────────────────────────────────────────────────

export const UserManagementPageContent: React.FC<{ scope?: 'all-orgs' | 'primary-org' }> = ({ scope = 'all-orgs' }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [searchValue, setSearchValue] = useState('');
  const [idpEnabled, setIdpEnabled] = useState<Record<number, boolean>>(
    Object.fromEntries(IDP_CONNECTIONS.map(c => [c.id, c.enabled]))
  );

  const [selectedGroupRows, setSelectedGroupRows] = useState<Set<number>>(new Set());
  const [selectedRoleRows, setSelectedRoleRows] = useState<Set<number>>(new Set());

  const allSelected = selectedRows.size === USERS.length;
  const toggleAll = () => {
    if (allSelected) setSelectedRows(new Set());
    else setSelectedRows(new Set(USERS.map(u => u.id)));
  };
  const toggleRow = (id: number) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedRows(next);
  };

  const allGroupsSelected = selectedGroupRows.size === GROUPS.length;
  const toggleAllGroups = () => {
    if (allGroupsSelected) setSelectedGroupRows(new Set());
    else setSelectedGroupRows(new Set(GROUPS.map(g => g.id)));
  };
  const toggleGroupRow = (id: number) => {
    const next = new Set(selectedGroupRows);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedGroupRows(next);
  };

  const allRolesSelected = selectedRoleRows.size === ROLES.length;
  const toggleAllRoles = () => {
    if (allRolesSelected) setSelectedRoleRows(new Set());
    else setSelectedRoleRows(new Set(ROLES.map(r => r.id)));
  };
  const toggleRoleRow = (id: number) => {
    const next = new Set(selectedRoleRows);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedRoleRows(next);
  };

  const isPrimary = scope === 'primary-org';

  const pageTabs = isPrimary
    ? [
        { id: 'users', label: 'Users' },
        { id: 'groups', label: 'Groups' },
        { id: 'roles', label: 'Roles' },
        { id: 'authentication', label: 'Authentication' },
      ]
    : [
        { id: 'users', label: 'Users' },
        { id: 'authentication', label: 'Authentication' },
      ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: sysVar('background-base') }}>

      {/* ── Sticky header ── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center',
        padding: '28px 40px 0', borderBottom: '1px solid var(--rd-sys-color-border-subtle)', backgroundColor: sysVar('background-base'),
      }}>
        <h1 style={{
          margin: '0 0 16px 0', fontSize: '22px', fontWeight: 700,
          color: sysVar('content-primary'), fontFamily: font, letterSpacing: '-0.3px',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          User management
        </h1>
        <div style={{ width: '1px', height: '24px', backgroundColor: sysVar('border-bold'), margin: '0 24px 16px', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
          {pageTabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '0 14px 16px', border: 'none', background: 'none',
              cursor: 'pointer', fontFamily: font, fontSize: '13.5px',
              fontWeight: activeTab === tab.id ? 'var(--font-weight-emphasis)' : 'var(--font-weight-regular)',
              color: activeTab === tab.id ? brand : sysVar('content-secondary'),
              borderBottom: activeTab === tab.id ? `2px solid ${brand}` : '2px solid transparent',
              marginBottom: '-1px', transition: 'color 0.15s', whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {activeTab === 'users' && (
          <div>
            {/* Toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 40px', gap: '16px',
            }}>
              {/* Left: search + filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Search */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    style={{ position: 'absolute', left: '10px', flexShrink: 0 }}>
                    <circle cx="6" cy="6" r="4.5" stroke="var(--rd-sys-color-content-tertiary)" strokeWidth="1.4" />
                    <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="var(--rd-sys-color-content-tertiary)" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    style={{
                      width: '200px', height: '36px', paddingLeft: '32px', paddingRight: '12px',
                      border: '1px solid var(--rd-sys-color-border-bold)', borderRadius: '8px',
                      fontFamily: font, fontSize: '13px', color: sysVar('content-primary'),
                      outline: 'none', backgroundColor: sysVar('background-base'),
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px color-mix(in srgb, ${brand} 13%, transparent)`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = sysVar('border-bold'); e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Add filter */}
                <button style={{
                  display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 12px',
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: font, fontSize: '13px', fontWeight: 500, color: sysVar('content-primary'),
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = brand; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = sysVar('content-primary'); }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  Add filter
                </button>
              </div>

              {/* Right: gear + add new user */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Gear */}
                <button style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                  backgroundColor: sysVar('background-secondary-action'), cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background-color 0.15s',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = sysVar('background-secondary-action'); }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = sysVar('background-secondary-action'); }}
                >
                  <Icon name="settings" size="m" color="var(--rd-sys-color-content-primary)" />
                </button>

                {/* Split button: Add new user + chevron */}
                <div style={{ display: 'flex', borderRadius: '999px', overflow: 'hidden' }}>
                  <button style={{
                    height: '36px', padding: '0 16px', border: 'none', backgroundColor: brandFill,
                    cursor: 'pointer', fontFamily: font, fontSize: '13px', fontWeight: 'var(--font-weight-emphasis)', color: sysVar('content-inverse'),
                    transition: 'opacity 0.15s', borderRight: `1px solid color-mix(in srgb, ${brand} 80%, transparent)`,
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                  >
                    Add new user
                  </button>
                  <button style={{
                    width: '36px', height: '36px', border: 'none', backgroundColor: brandFill,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'opacity 0.15s',
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="var(--rd-sys-color-content-inverse)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ padding: '0 40px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: font }}>
                {/* Header */}
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--rd-sys-color-border-subtle)' }}>
                    <th style={{ width: '48px', padding: '10px 12px 10px 0', textAlign: 'left' }}>
                      <Checkbox checked={allSelected} onChange={toggleAll} />
                    </th>
                    <th style={{ padding: '10px 16px 10px 0', textAlign: 'left' }}>
                      <button style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        border: 'none', background: 'none', cursor: 'pointer',
                        fontFamily: font, fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary'), padding: 0,
                      }}>
                        Name
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M5 7L2 3h6L5 7z" fill="var(--rd-sys-color-content-secondary)" />
                        </svg>
                      </button>
                    </th>
                    <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>{isPrimary ? 'Groups' : 'Orgs'}</th>
                    <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>Auth Type</th>
                    <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>Created</th>
                    <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>Status</th>
                    <th style={{ padding: '10px 0', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>Actions</th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {USERS.map((user) => (
                    <tr key={user.id} style={{
                      borderBottom: '1px solid var(--rd-sys-color-border-subtle)',
                      backgroundColor: selectedRows.has(user.id) ? `color-mix(in srgb, ${brand} 3%, transparent)` : 'transparent',
                      transition: 'background-color 0.1s',
                    }}
                      onMouseEnter={(e) => { if (!selectedRows.has(user.id)) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = sysVar('background-sunken'); }}
                      onMouseLeave={(e) => { if (!selectedRows.has(user.id)) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '16px 12px 16px 0', verticalAlign: 'middle' }}>
                        <Checkbox checked={selectedRows.has(user.id)} onChange={() => toggleRow(user.id)} />
                      </td>

                      {/* Name */}
                      <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle', maxWidth: '260px' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '12px', color: sysVar('content-tertiary'), fontFamily: font, marginTop: '2px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.username}
                        </div>
                      </td>

                      {/* Orgs / Groups */}
                      <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle' }}>
                        {isPrimary ? (
                          user.groups.length === 0 ? (
                            <span style={{ fontSize: '13.5px', color: sysVar('content-tertiary'), fontFamily: font }}>-</span>
                          ) : (
                            <div>
                              <div style={{ fontSize: '13.5px', color: sysVar('content-primary'), fontFamily: font }}>
                                {user.groups.join(' , ')}
                              </div>
                              {user.groupsExtra > 0 && (
                                <div style={{ fontSize: '13px', color: brand, fontFamily: font, fontWeight: 500, cursor: 'pointer', marginTop: '2px' }}>
                                  +{user.groupsExtra} more
                                </div>
                              )}
                            </div>
                          )
                        ) : (
                          user.orgs.length === 0 ? (
                            <span style={{ fontSize: '13.5px', color: sysVar('content-tertiary'), fontFamily: font }}>-</span>
                          ) : (
                            <div>
                              <span style={{ fontSize: '13.5px', color: sysVar('content-primary'), fontFamily: font }}>
                                {user.orgs.join(' , ')}
                                {user.orgsExtra > 0 ? ' , ' : ''}
                              </span>
                              {user.orgsExtra > 0 && (
                                <span style={{ fontSize: '13px', color: brand, fontFamily: font, fontWeight: 500, cursor: 'pointer' }}>
                                  +{user.orgsExtra} more
                                </span>
                              )}
                            </div>
                          )
                        )}
                      </td>

                      {/* Auth Type */}
                      <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '13.5px', color: sysVar('content-primary'), fontFamily: font }}>
                          {user.authType}
                        </span>
                      </td>

                      {/* Created */}
                      <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '13.5px', color: sysVar('content-primary'), fontFamily: font }}>
                          {user.created}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '13.5px', fontFamily: font, color: sysVar('content-primary') }}>
                          {user.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 0', verticalAlign: 'middle', textAlign: 'right' }}>
                        <DotsMenu />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '28px 40px 48px',
              fontFamily: font, fontSize: '13.5px',
            }}>
              <span style={{ color: sysVar('content-primary'), fontWeight: 'var(--font-weight-emphasis)' }}>1-20</span>
              <span style={{ color: sysVar('content-primary') }}>of</span>
              <span style={{ color: sysVar('content-primary'), fontWeight: 'var(--font-weight-emphasis)' }}>500</span>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: font, fontSize: '13.5px', fontWeight: 'var(--font-weight-emphasis)', color: brand,
                marginLeft: '8px', padding: 0,
              }}>
                Next
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 3.5L9 7l-3.5 3.5" stroke={brand} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div>
            {/* Toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 40px', gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Search */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    style={{ position: 'absolute', left: '10px', flexShrink: 0 }}>
                    <circle cx="6" cy="6" r="4.5" stroke="var(--rd-sys-color-content-tertiary)" strokeWidth="1.4" />
                    <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="var(--rd-sys-color-content-tertiary)" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search"
                    style={{
                      width: '200px', height: '36px', paddingLeft: '32px', paddingRight: '12px',
                      border: '1px solid var(--rd-sys-color-border-bold)', borderRadius: '8px',
                      fontFamily: font, fontSize: '13px', color: sysVar('content-primary'),
                      outline: 'none', backgroundColor: sysVar('background-base'),
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px color-mix(in srgb, ${brand} 13%, transparent)`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = sysVar('border-bold'); e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Right: gear + create new group */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                  backgroundColor: sysVar('background-secondary-action'), cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background-color 0.15s',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = sysVar('background-secondary-action'); }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = sysVar('background-secondary-action'); }}
                >
                  <Icon name="settings" size="m" color="var(--rd-sys-color-content-primary)" />
                </button>
                <div style={{ display: 'flex', borderRadius: '999px', overflow: 'hidden' }}>
                  <button style={{
                    height: '36px', padding: '0 16px', border: 'none', backgroundColor: brandFill,
                    cursor: 'pointer', fontFamily: font, fontSize: '13px', fontWeight: 'var(--font-weight-emphasis)', color: sysVar('content-inverse'),
                    transition: 'opacity 0.15s', borderRight: `1px solid color-mix(in srgb, ${brand} 80%, transparent)`,
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                  >
                    Create new group
                  </button>
                  <button style={{
                    width: '36px', height: '36px', border: 'none', backgroundColor: brandFill,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'opacity 0.15s',
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="var(--rd-sys-color-content-inverse)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ padding: '0 40px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: font }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--rd-sys-color-border-subtle)' }}>
                    <th style={{ width: '48px', padding: '10px 12px 10px 0', textAlign: 'left' }}>
                      <Checkbox checked={allGroupsSelected} onChange={toggleAllGroups} />
                    </th>
                    <th style={{ padding: '10px 16px 10px 0', textAlign: 'left' }}>
                      <button style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        border: 'none', background: 'none', cursor: 'pointer',
                        fontFamily: font, fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary'), padding: 0,
                      }}>
                        Group name
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M5 7L2 3h6L5 7z" fill="var(--rd-sys-color-content-secondary)" />
                        </svg>
                      </button>
                    </th>
                    <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>Users</th>
                    <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>Created</th>
                    <th style={{ padding: '10px 0', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {GROUPS.map((group) => (
                    <tr key={group.id} style={{
                      borderBottom: '1px solid var(--rd-sys-color-border-subtle)',
                      backgroundColor: selectedGroupRows.has(group.id) ? `color-mix(in srgb, ${brand} 3%, transparent)` : 'transparent',
                      transition: 'background-color 0.1s',
                    }}
                      onMouseEnter={(e) => { if (!selectedGroupRows.has(group.id)) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = sysVar('background-sunken'); }}
                      onMouseLeave={(e) => { if (!selectedGroupRows.has(group.id)) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '16px 12px 16px 0', verticalAlign: 'middle' }}>
                        <Checkbox checked={selectedGroupRows.has(group.id)} onChange={() => toggleGroupRow(group.id)} />
                      </td>
                      <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer' }}>
                          {group.name}
                        </div>
                        <div style={{ fontSize: '12px', color: sysVar('content-tertiary'), fontFamily: font, marginTop: '2px' }}>
                          {group.description}
                        </div>
                      </td>
                      <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '13.5px', color: sysVar('content-primary'), fontFamily: font }}>{group.users}</span>
                      </td>
                      <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '13.5px', color: sysVar('content-primary'), fontFamily: font }}>{group.created}</span>
                      </td>
                      <td style={{ padding: '16px 0', verticalAlign: 'middle', textAlign: 'right' }}>
                        <DotsMenu />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '28px 40px 48px',
              fontFamily: font, fontSize: '13.5px',
            }}>
              <span style={{ color: sysVar('content-primary'), fontWeight: 'var(--font-weight-emphasis)' }}>1-20</span>
              <span style={{ color: sysVar('content-primary') }}>of</span>
              <span style={{ color: sysVar('content-primary'), fontWeight: 'var(--font-weight-emphasis)' }}>500</span>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: font, fontSize: '13.5px', fontWeight: 'var(--font-weight-emphasis)', color: brand,
                marginLeft: '8px', padding: 0,
              }}>
                Next
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 3.5L9 7l-3.5 3.5" stroke={brand} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div>
            {/* Toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 40px', gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Search */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    style={{ position: 'absolute', left: '10px', flexShrink: 0 }}>
                    <circle cx="6" cy="6" r="4.5" stroke="var(--rd-sys-color-content-tertiary)" strokeWidth="1.4" />
                    <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="var(--rd-sys-color-content-tertiary)" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search"
                    style={{
                      width: '200px', height: '36px', paddingLeft: '32px', paddingRight: '12px',
                      border: '1px solid var(--rd-sys-color-border-bold)', borderRadius: '8px',
                      fontFamily: font, fontSize: '13px', color: sysVar('content-primary'),
                      outline: 'none', backgroundColor: sysVar('background-base'),
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px color-mix(in srgb, ${brand} 13%, transparent)`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = sysVar('border-bold'); e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                {/* Add filter */}
                <button style={{
                  display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 12px',
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: font, fontSize: '13px', fontWeight: 500, color: sysVar('content-primary'),
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = brand; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = sysVar('content-primary'); }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  Add filter
                </button>
              </div>

              {/* Right: create new role split button */}
              <div style={{ display: 'flex', borderRadius: '999px', overflow: 'hidden' }}>
                <button style={{
                  height: '36px', padding: '0 16px', border: 'none', backgroundColor: brandFill,
                  cursor: 'pointer', fontFamily: font, fontSize: '13px', fontWeight: 'var(--font-weight-emphasis)', color: sysVar('content-inverse'),
                  transition: 'opacity 0.15s', borderRight: `1px solid color-mix(in srgb, ${brand} 80%, transparent)`,
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                >
                  Create new role
                </button>
                <button style={{
                  width: '36px', height: '36px', border: 'none', backgroundColor: brandFill,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'opacity 0.15s',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="var(--rd-sys-color-content-inverse)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ padding: '0 40px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: font }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--rd-sys-color-border-subtle)' }}>
                    <th style={{ width: '48px', padding: '10px 12px 10px 0', textAlign: 'left' }}>
                      <Checkbox checked={allRolesSelected} onChange={toggleAllRoles} />
                    </th>
                    <th style={{ padding: '10px 16px 10px 0', textAlign: 'left' }}>
                      <button style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        border: 'none', background: 'none', cursor: 'pointer',
                        fontFamily: font, fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary'), padding: 0,
                      }}>
                        Role name
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M5 7L2 3h6L5 7z" fill="var(--rd-sys-color-content-secondary)" />
                        </svg>
                      </button>
                    </th>
                    <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>Groups</th>
                    <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>Privileges</th>
                    <th style={{ padding: '10px 0', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map((role) => (
                    <tr key={role.id} style={{
                      borderBottom: '1px solid var(--rd-sys-color-border-subtle)',
                      backgroundColor: selectedRoleRows.has(role.id) ? `color-mix(in srgb, ${brand} 3%, transparent)` : 'transparent',
                      transition: 'background-color 0.1s',
                    }}
                      onMouseEnter={(e) => { if (!selectedRoleRows.has(role.id)) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = sysVar('background-sunken'); }}
                      onMouseLeave={(e) => { if (!selectedRoleRows.has(role.id)) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '16px 12px 16px 0', verticalAlign: 'middle' }}>
                        <Checkbox checked={selectedRoleRows.has(role.id)} onChange={() => toggleRoleRow(role.id)} />
                      </td>
                      <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle', maxWidth: '260px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {role.name}
                        </span>
                      </td>
                      <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle' }}>
                        {role.groups.length === 0 ? (
                          <span style={{ fontSize: '13.5px', color: sysVar('content-tertiary'), fontFamily: font }}>-</span>
                        ) : (
                          <div>
                            <div style={{ fontSize: '13.5px', color: sysVar('content-primary'), fontFamily: font }}>
                              {role.groups.join(' , ')}
                            </div>
                            {role.groupsExtra > 0 && (
                              <div style={{ fontSize: '13px', color: brand, fontFamily: font, fontWeight: 500, cursor: 'pointer', marginTop: '2px' }}>
                                +{role.groupsExtra} more
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '13.5px', color: sysVar('content-primary'), fontFamily: font }}>{role.privileges}</span>
                      </td>
                      <td style={{ padding: '16px 0', verticalAlign: 'middle', textAlign: 'right' }}>
                        <DotsMenu />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '28px 40px 48px',
              fontFamily: font, fontSize: '13.5px',
            }}>
              <span style={{ color: sysVar('content-primary'), fontWeight: 'var(--font-weight-emphasis)' }}>1-20</span>
              <span style={{ color: sysVar('content-primary') }}>of</span>
              <span style={{ color: sysVar('content-primary'), fontWeight: 'var(--font-weight-emphasis)' }}>500</span>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: font, fontSize: '13.5px', fontWeight: 'var(--font-weight-emphasis)', color: brand,
                marginLeft: '8px', padding: 0,
              }}>
                Next
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 3.5L9 7l-3.5 3.5" stroke={brand} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'authentication' && (
          <div>
            {/* Toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 40px', gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Search */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    style={{ position: 'absolute', left: '10px' }}>
                    <circle cx="6" cy="6" r="4.5" stroke="var(--rd-sys-color-content-tertiary)" strokeWidth="1.4" />
                    <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="var(--rd-sys-color-content-tertiary)" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input type="text" placeholder="Search"
                    style={{
                      width: '200px', height: '36px', paddingLeft: '32px', paddingRight: '12px',
                      border: '1px solid var(--rd-sys-color-border-bold)', borderRadius: '8px',
                      fontFamily: font, fontSize: '13px', color: sysVar('content-primary'),
                      outline: 'none', backgroundColor: sysVar('background-base'),
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px color-mix(in srgb, ${brand} 13%, transparent)`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = sysVar('border-bold'); e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                {/* Add filter */}
                <button style={{
                  display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 12px',
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: font, fontSize: '13px', fontWeight: 500, color: sysVar('content-primary'),
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = brand; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = sysVar('content-primary'); }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  Add filter
                </button>
              </div>

              {/* Configure IDP */}
              <button style={{
                height: '36px', padding: '0 20px', borderRadius: '20px',
                border: 'none', backgroundColor: brandFill,
                cursor: 'pointer', fontFamily: font, fontSize: '13px', fontWeight: 'var(--font-weight-emphasis)', color: sysVar('content-inverse'),
                transition: 'opacity 0.15s',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                Configure IDP
              </button>
            </div>

            {/* Table */}
            <div style={{ padding: '0 40px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: font }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--rd-sys-color-border-subtle)' }}>
                    <th style={{ width: '80px', padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>Status</th>
                    <th style={{ width: '52px', padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>IDP</th>
                    <th style={{ padding: '10px 16px 10px 0', textAlign: 'left' }}>
                      <button style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        border: 'none', background: 'none', cursor: 'pointer',
                        fontFamily: font, fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary'), padding: 0,
                      }}>
                        Connection name
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M5 7L2 3h6L5 7z" fill="var(--rd-sys-color-content-secondary)" />
                        </svg>
                      </button>
                    </th>
                    {isPrimary && (
                      <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>Client ID</th>
                    )}
                    <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>IDP Type</th>
                    {!isPrimary && (
                      <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>Created</th>
                    )}
                    <th style={{ padding: '10px 0', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: sysVar('content-secondary') }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {IDP_CONNECTIONS.map((conn) => (
                    <tr key={conn.id} style={{ borderBottom: '1px solid var(--rd-sys-color-border-subtle)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = sysVar('background-sunken'); }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                    >
                      {/* Status toggle */}
                      <td style={{ padding: '18px 16px 18px 0', verticalAlign: 'middle' }}>
                        <IDPToggle
                          checked={idpEnabled[conn.id]}
                          onChange={() => setIdpEnabled(prev => ({ ...prev, [conn.id]: !prev[conn.id] }))}
                        />
                      </td>
                      {/* IDP icon */}
                      <td style={{ padding: '18px 16px 18px 0', verticalAlign: 'middle' }}>
                        {IDP_ICONS[conn.icon]}
                      </td>
                      {/* Connection name */}
                      <td style={{ padding: '18px 16px 18px 0', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer' }}>
                          {conn.name}
                        </span>
                      </td>
                      {/* Client ID (Primary Org only) */}
                      {isPrimary && (
                        <td style={{ padding: '18px 16px 18px 0', verticalAlign: 'middle', maxWidth: '280px' }}>
                          <span style={{ fontSize: '13px', color: sysVar('content-primary'), fontFamily: font,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            {conn.clientId}
                          </span>
                        </td>
                      )}
                      {/* IDP Type */}
                      <td style={{ padding: '18px 16px 18px 0', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '13.5px', color: sysVar('content-primary'), fontFamily: font }}>{conn.idpType}</span>
                      </td>
                      {/* Created (All Orgs only) */}
                      {!isPrimary && (
                        <td style={{ padding: '18px 16px 18px 0', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: '13.5px', color: sysVar('content-primary'), fontFamily: font }}>{conn.created}</span>
                        </td>
                      )}
                      {/* Actions */}
                      <td style={{ padding: '18px 0', verticalAlign: 'middle', textAlign: 'right' }}>
                        <DotsMenu />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '28px 40px 48px',
              fontFamily: font, fontSize: '13.5px',
            }}>
              <span style={{ color: sysVar('content-primary'), fontWeight: 'var(--font-weight-emphasis)' }}>1-20</span>
              <span style={{ color: sysVar('content-primary') }}>of</span>
              <span style={{ color: sysVar('content-primary'), fontWeight: 'var(--font-weight-emphasis)' }}>500</span>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: font, fontSize: '13.5px', fontWeight: 'var(--font-weight-emphasis)', color: brand,
                marginLeft: '8px', padding: 0,
              }}>
                Next
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 3.5L9 7l-3.5 3.5" stroke={brand} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserManagementPageContent;
