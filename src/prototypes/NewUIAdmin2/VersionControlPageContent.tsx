import React, { useState, useRef, useEffect } from 'react';
import { systemColors } from '../../tokens/colors';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal, ModalFooter } from '@components/Modal';
import { Button } from '@components/Button';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const brand = systemColors.light['content-brand'];

// ─── Mock data ─────────────────────────────────────────────────────────────────

const VC_ORGS = [
  { id: 1, name: 'Tata Steel Ltd.',   isPrimary: true,  status: 'mapped',   repository: 'Repository 1', branch: 'Branch 1' },
  { id: 2, name: 'Air Asia',          isPrimary: false, status: 'unmapped', repository: '-',            branch: '-'        },
  { id: 3, name: 'Tata Sky',          isPrimary: false, status: 'unmapped', repository: '-',            branch: '-'        },
  { id: 4, name: 'Voltas',            isPrimary: false, status: 'unmapped', repository: '-',            branch: '-'        },
  { id: 5, name: 'Tanishq Gold',      isPrimary: false, status: 'mapped',   repository: 'Repository 1', branch: 'Branch 1' },
  { id: 6, name: 'AIG Mutual Funds',  isPrimary: false, status: 'mapped',   repository: 'Repository 1', branch: 'Branch 1' },
  { id: 7, name: 'Lifestyle',         isPrimary: false, status: 'mapped',   repository: 'Repository 1', branch: 'Branch 1' },
  { id: 8, name: 'AIG Mutual Funds',  isPrimary: false, status: 'mapped',   repository: 'Repository 1', branch: 'Branch 1' },
];

// ─── Dropdown ─────────────────────────────────────────────────────────────────

const Dropdown: React.FC<{ value: string; options: string[]; width?: number; label?: string }> = ({
  value: initialValue, options, width = 280,
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(initialValue);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width });
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen(!open);
  };

  const isPlaceholder = selected === initialValue && (selected === 'Select' || selected.startsWith('Select '));

  return (
    <div ref={ref} style={{ position: 'relative', width, flexShrink: 0 }}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', height: '40px', padding: '0 14px',
          border: `1px solid ${open ? brand : '#D1D5DB'}`, borderRadius: '8px',
          backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: font,
          fontSize: '13.5px', color: isPlaceholder ? '#9CA3AF' : '#111827',
          outline: 'none', textAlign: 'left',
          boxShadow: open ? `0 0 0 2px ${brand}22` : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{selected}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ flexShrink: 0, marginLeft: '8px', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
          <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'fixed', top: menuPos.top, left: menuPos.left, width: menuPos.width,
          backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 9999, overflow: 'hidden',
        }}>
          {options.map((opt) => (
            <button key={opt} onClick={() => { setSelected(opt); setOpen(false); }}
              style={{
                display: 'block', width: '100%', padding: '10px 16px',
                border: 'none', textAlign: 'left', fontFamily: font, fontSize: '13.5px',
                fontWeight: opt === selected ? 500 : 400,
                color: opt === selected ? brand : '#111827',
                backgroundColor: opt === selected ? `${brand}10` : 'transparent',
                cursor: 'pointer', transition: 'background-color 0.1s',
              }}
              onMouseEnter={(e) => { if (opt !== selected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB'; }}
              onMouseLeave={(e) => { if (opt !== selected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── VCDotsMenu ────────────────────────────────────────────────────────────────

const VCDotsMenu: React.FC<{
  status: string;
  onEdit: () => void;
  onReset: () => void;
}> = ({ status, onEdit, onReset }) => {
  const [open, setOpen] = useState(false);
  const mapped = status === 'mapped';
  const items = mapped
    ? [
        { label: 'Edit',  action: () => { setOpen(false); onEdit(); } },
        { label: 'Reset', action: () => { setOpen(false); onReset(); } },
      ]
    : [
        { label: 'Enable version control', action: () => setOpen(false) },
      ];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '32px', height: '32px', borderRadius: '50%', border: 'none',
          backgroundColor: '#F3F4F6',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background-color 0.1s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E5E7EB'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6'; }}
      >
        <svg width="16" height="4" viewBox="0 0 16 4" fill="none">
          <circle cx="2" cy="2" r="1.5" fill="#6B7280" />
          <circle cx="8" cy="2" r="1.5" fill="#6B7280" />
          <circle cx="14" cy="2" r="1.5" fill="#6B7280" />
        </svg>
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', right: 0,
            backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden', minWidth: '180px',
          }}>
            {items.map((item) => (
              <button key={item.label} onClick={item.action}
                style={{
                  display: 'block', width: '100%', padding: '10px 16px',
                  border: 'none', textAlign: 'left', fontFamily: font, fontSize: '13px',
                  fontWeight: 400, color: '#111827',
                  backgroundColor: 'transparent', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── InfoBanner ────────────────────────────────────────────────────────────────

const InfoBanner = () => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE',
    borderRadius: '8px', padding: '14px 20px', marginBottom: '24px',
  }}>
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
      <circle cx="9" cy="9" r="8.5" fill="#3B82F6" />
      <path d="M9 8v4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9" cy="5.5" r="0.9" fill="#fff" />
    </svg>
    <div style={{ fontSize: '13.5px', color: '#1E40AF', fontFamily: font, lineHeight: 1.55 }}>
      Changing these settings will result in a service interruption for all users for a few minutes. Consider making your changes during a scheduled maintenance window.
    </div>
  </div>
);

// ─── VCIllustration ────────────────────────────────────────────────────────────

const VCIllustration = () => (
  <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
    <rect x="18" y="12" width="58" height="72" rx="4" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1.5" />
    <rect x="28" y="26" width="38" height="5" rx="2" fill="#9CA3AF" />
    <rect x="28" y="37" width="30" height="5" rx="2" fill="#9CA3AF" />
    <rect x="28" y="48" width="34" height="5" rx="2" fill="#9CA3AF" />
    <rect x="28" y="59" width="24" height="5" rx="2" fill="#9CA3AF" />
    <path d="M47 72v18" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M39 80l8-8 8 8" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="30" cy="97" r="2" fill="#D1D5DB" />
    <circle cx="38" cy="97" r="2" fill="#D1D5DB" />
    <circle cx="46" cy="97" r="2" fill="#D1D5DB" />
    <circle cx="54" cy="97" r="2" fill="#D1D5DB" />
    <circle cx="62" cy="97" r="2" fill="#D1D5DB" />
  </svg>
);

// ─── ProgressBar removed — stepper is now built into RdModal ──────────────────

// ─── OrgBranchForm ────────────────────────────────────────────────────────────
// Right-panel form in All Orgs step 2

const OrgBranchForm: React.FC<{ org: typeof VC_ORGS[number] }> = ({ org }) => {
  const [saveHistory, setSaveHistory] = useState(true);

  return (
    <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', fontFamily: font }}>{org.name}</div>
        <div style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: font, marginTop: '2px' }}>
          {org.isPrimary ? 'Primary org' : 'Org'}
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '6px', fontFamily: font }}>
          Branch <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <Dropdown value="Select" options={['main', 'develop', 'staging', 'production']} width={311} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '6px', fontFamily: font }}>
          GUID mapping
        </label>
        <Dropdown value="Select GUId branch" options={['guid-main', 'guid-develop', 'guid-staging']} width={311} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => setSaveHistory(!saveHistory)}
          role="checkbox" aria-checked={saveHistory}
          style={{
            width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0,
            border: `1.5px solid ${saveHistory ? brand : '#D1D5DB'}`,
            backgroundColor: saveHistory ? brand : '#FFFFFF',
            cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.15s, background-color 0.15s',
          }}
        >
          {saveHistory && (
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <path d="M1 3.5l2.5 2.5L8 1" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <span style={{ fontSize: '13.5px', color: '#111827', fontFamily: font }}>Save version history</span>
      </div>
    </div>
  );
};

// ─── SetupWizardModal ──────────────────────────────────────────────────────────

const SetupWizardModal: React.FC<{
  scope: 'all-orgs' | 'primary-org';
  onClose: () => void;
  onComplete: () => void;
}> = ({ scope, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [repo, setRepo] = useState('');
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [credError, setCredError] = useState(false);
  const [saveHistory, setSaveHistory] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState(VC_ORGS[0].id);
  const selectedOrg = VC_ORGS.find(o => o.id === selectedOrgId) ?? VC_ORGS[0];

  const handleNext = () => {
    if (!repo.trim() || !username.trim() || !token.trim()) {
      setCredError(true);
      return;
    }
    setCredError(false);
    setStep(2);
  };

  const dismissError = () => { if (credError) setCredError(false); };

  const labelStyle = (hasError: boolean): React.CSSProperties => ({
    display: 'block', fontSize: '13.5px', fontWeight: 500,
    color: hasError ? '#EF4444' : '#111827', marginBottom: '8px', fontFamily: font,
  });

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%', height: '40px', padding: '0 14px',
    border: `1px solid ${hasError ? '#EF4444' : '#D1D5DB'}`, borderRadius: '8px',
    fontFamily: font, fontSize: '13.5px', color: '#111827',
    outline: 'none', backgroundColor: hasError ? '#FEF2F2' : '#FFFFFF', boxSizing: 'border-box',
  });

  return (
    <Modal
      isOpen
      size="M2"
      type="wizard"
      eyebrow="Version control"
      title={step === 1 ? 'Enter GitHub credentials' : 'Select a branch'}
      currentStep={step}
      totalSteps={2}
      onClose={onClose}
      footer={
        <ModalFooter
          tertiaryAction={<Button variant="tertiary" onClick={onClose}>Cancel</Button>}
          secondaryAction={step === 2 ? <Button variant="secondary" onClick={() => setStep(1)}>Back</Button> : undefined}
          primaryAction={<Button variant="primary" onClick={step === 1 ? handleNext : onComplete}>{step === 1 ? 'Next' : 'Enable'}</Button>}
        />
      }
    >
      <div style={{ minHeight: '260px' }}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Error banner */}
            {credError && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA', borderRadius: '8px',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="8" cy="8" r="7.25" fill="#EF4444" />
                  <path d="M8 5v3.5M8 10.5h.01" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: '13.5px', color: '#B91C1C', fontFamily: font }}>
                  These fields cannot be empty
                </span>
              </div>
            )}

            <div>
              <label style={labelStyle(credError)}>Repository</label>
              <input type="text" placeholder="https://github.com/simranpandit-thoughtspot" value={repo}
                onChange={(e) => { setRepo(e.target.value); dismissError(); }}
                style={inputStyle(credError)}
                onFocus={(e) => { if (!credError) { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; } }}
                onBlur={(e) => { if (!credError) { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; } }}
              />
            </div>
            <div>
              <label style={labelStyle(credError)}>Username</label>
              <input type="text" placeholder="Enter Username" value={username}
                onChange={(e) => { setUsername(e.target.value); dismissError(); }}
                style={inputStyle(credError)}
                onFocus={(e) => { if (!credError) { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; } }}
                onBlur={(e) => { if (!credError) { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; } }}
              />
            </div>
            <div>
              <label style={labelStyle(credError)}>Token</label>
              <input type="text" placeholder="Enter Access Token" value={token}
                onChange={(e) => { setToken(e.target.value); dismissError(); }}
                style={inputStyle(credError)}
                onFocus={(e) => { if (!credError) { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; } }}
                onBlur={(e) => { if (!credError) { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; } }}
              />
            </div>
          </div>
        )}

        {step === 2 && scope === 'primary-org' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={labelStyle}>Branch</label>
              <Dropdown value="Select" options={['main', 'develop', 'staging', 'production']} width={656} />
            </div>
            <div>
              <label style={labelStyle}>GUID</label>
              <Dropdown value="Select GUID branch" options={['guid-main', 'guid-develop', 'guid-staging']} width={656} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setSaveHistory(!saveHistory)}
                role="checkbox" aria-checked={saveHistory}
                style={{
                  width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0,
                  border: `1.5px solid ${saveHistory ? brand : '#D1D5DB'}`,
                  backgroundColor: saveHistory ? brand : '#FFFFFF',
                  cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'border-color 0.15s, background-color 0.15s',
                }}
              >
                {saveHistory && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5l2.5 2.5L8 1" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span style={{ fontSize: '13.5px', color: '#111827', fontFamily: font }}>Save version history</span>
            </div>
          </div>
        )}

        {step === 2 && scope === 'all-orgs' && (
          <div style={{ display: 'flex', minHeight: '260px', margin: '0 -32px' }}>
            {/* Left: org list */}
            <div style={{ width: '220px', flexShrink: 0, borderRight: '1px solid #E5E7EB', overflowY: 'auto' }}>
              {VC_ORGS.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrgId(org.id)}
                  style={{
                    display: 'block', width: '100%', padding: '14px 20px',
                    border: 'none', textAlign: 'left', fontFamily: font, fontSize: '13.5px',
                    fontWeight: org.id === selectedOrgId ? 600 : 400, color: '#111827',
                    backgroundColor: org.id === selectedOrgId ? '#F5F8FF' : 'transparent',
                    cursor: 'pointer',
                    borderLeft: org.id === selectedOrgId ? `3px solid ${brand}` : '3px solid transparent',
                    borderBottom: '1px solid #F3F4F6', transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => { if (org.id !== selectedOrgId) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB'; }}
                  onMouseLeave={(e) => { if (org.id !== selectedOrgId) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                >
                  <div>{org.name}</div>
                  {org.isPrimary && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>Primary Org</div>}
                </button>
              ))}
            </div>
            {/* Right: branch form for selected org */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <OrgBranchForm org={selectedOrg} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ─── Edit Credentials Modal ───────────────────────────────────────────────────

const EditCredentialsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [repo, setRepo] = useState('Repository 1');
  const [username, setUsername] = useState('Branch 1');
  const [token, setToken] = useState('1w3d.gfs5.hgt5.234v');
  const [credError, setCredError] = useState(false);

  const handleNext = () => {
    if (!repo.trim() || !username.trim() || !token.trim()) {
      setCredError(true);
      return;
    }
    onClose();
  };

  const labelColor = (empty: boolean) => empty && credError ? '#EF4444' : '#374151';
  const borderColor = (empty: boolean) => empty && credError ? '#EF4444' : '#D1D5DB';
  const bgColor = (empty: boolean) => empty && credError ? '#FEF2F2' : '#FFFFFF';

  const inputStyle = (value: string): React.CSSProperties => ({
    width: '100%', height: '40px', padding: '0 14px',
    border: `1px solid ${borderColor(!value.trim())}`, borderRadius: '6px',
    fontSize: '13.5px', color: '#111827', fontFamily: font,
    outline: 'none', boxSizing: 'border-box',
    backgroundColor: bgColor(!value.trim()),
  });

  return (
    <Modal
      isOpen
      size="M2"
      type="wizard"
      eyebrow="Version control"
      title="Enter GitHub credentials"
      currentStep={1}
      totalSteps={2}
      onClose={onClose}
      footer={
        <ModalFooter
          tertiaryAction={<Button variant="tertiary" onClick={onClose}>Cancel</Button>}
          primaryAction={<Button variant="primary" onClick={handleNext}>Next</Button>}
        />
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Warning or error banner */}
        {!credError ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A', borderRadius: '8px',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="8" cy="8" r="7.25" fill="#F59E0B" />
              <path d="M8 5v3.5M8 10.5h.01" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: '13.5px', color: '#92400E', fontFamily: font }}>
              Updating details might lead to loss of version history
            </span>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA', borderRadius: '8px',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="8" cy="8" r="7.25" fill="#EF4444" />
              <path d="M8 5v3.5M8 10.5h.01" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: '13.5px', color: '#B91C1C', fontFamily: font }}>
              These fields cannot be empty
            </span>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: labelColor(!repo.trim()), fontFamily: font, marginBottom: '8px' }}>Repository</label>
          <input type="text" placeholder="https://github.com/simranpandit-thoughtspot" value={repo}
            onChange={(e) => { setRepo(e.target.value); if (credError) setCredError(false); }}
            style={inputStyle(repo)}
            onFocus={(e) => { if (repo.trim()) { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; } }}
            onBlur={(e) => { if (repo.trim()) { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; } }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: labelColor(!username.trim()), fontFamily: font, marginBottom: '8px' }}>Username</label>
          <input type="text" placeholder="Enter Username" value={username}
            onChange={(e) => { setUsername(e.target.value); if (credError) setCredError(false); }}
            style={inputStyle(username)}
            onFocus={(e) => { if (username.trim()) { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; } }}
            onBlur={(e) => { if (username.trim()) { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; } }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: labelColor(!token.trim()), fontFamily: font, marginBottom: '8px' }}>Token</label>
          <input type="text" placeholder="Enter Access Token" value={token}
            onChange={(e) => { setToken(e.target.value); if (credError) setCredError(false); }}
            style={inputStyle(token)}
            onFocus={(e) => { if (token.trim()) { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; } }}
            onBlur={(e) => { if (token.trim()) { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; } }}
          />
        </div>
      </div>
    </Modal>
  );
};

// ─── VersionControlPageContent ─────────────────────────────────────────────────

export const VersionControlPageContent: React.FC<{ scope?: 'all-orgs' | 'primary-org' }> = ({ scope = 'all-orgs' }) => {
  const isPrimary = scope === 'primary-org';

  // Enabled state per scope
  const [primaryEnabled, setPrimaryEnabled] = useState(true);
  const [allOrgsEnabled, setAllOrgsEnabled] = useState(false);
  const vcEnabled = isPrimary ? primaryEnabled : allOrgsEnabled;

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [credCardOpen, setCredCardOpen] = useState(true);

  // All orgs search
  const [searchValue, setSearchValue] = useState('');
  const filteredOrgs = VC_ORGS.filter(o =>
    o.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Credential field state (Primary Org)
  const [credRepo, setCredRepo] = useState('TS_repotest');
  const [credUsername, setCredUsername] = useState('TSdemo1234');
  const [credToken, setCredToken] = useState('12wre:84hs64:2745s:g4534:4542');
  const [credBranch, setCredBranch] = useState('Branch Name 1');
  const [credGuidBranch, setCredGuidBranch] = useState('Branch Name 2');
  const [credVersionHistory, setCredVersionHistory] = useState('Enabled');

  // Reset dialog
  const [resetDialog, setResetDialog] = useState(false);
  const [editCredModal, setEditCredModal] = useState(false);

  const handleEnable = () => {
    if (isPrimary) setPrimaryEnabled(true);
    else setAllOrgsEnabled(true);
    setShowSetupModal(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>

      {/* ── Sticky header ── */}
      <div style={{
        flexShrink: 0, padding: '28px 40px 20px',
        borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF',
      }}>
        <h1 style={{
          margin: 0, fontSize: '22px', fontWeight: 700,
          color: '#0F172A', fontFamily: font, letterSpacing: '-0.3px',
        }}>
          Version control
        </h1>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={isPrimary ? { maxWidth: '960px', margin: '0 auto', padding: '32px 40px 64px', boxSizing: 'border-box' } : { padding: '32px 24px 64px', boxSizing: 'border-box' }}>

          {/* ── EMPTY STATE (both scopes, before enabling) ── */}
          {!vcEnabled && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: '420px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '48px', maxWidth: '700px' }}>
                <div style={{ flexShrink: 0 }}>
                  <VCIllustration />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', fontFamily: font, marginBottom: '12px' }}>
                    Enable version control
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280', fontFamily: font, lineHeight: 1.7, marginBottom: '24px' }}>
                    Your users will be able to track and maintain a history of changes to ThoughSpot objects. Once version control is enabled, you will find credentials and branch settings here.
                  </div>
                  <button
                    onClick={() => setShowSetupModal(true)}
                    style={{
                      height: '38px', padding: '0 24px', borderRadius: '20px',
                      border: 'none', backgroundColor: brand,
                      cursor: 'pointer', fontFamily: font, fontSize: '13.5px', fontWeight: 600, color: '#FFFFFF',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                  >
                    Enable
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── PRIMARY ORG: enabled view ── */}
          {isPrimary && vcEnabled && (
            <div>
              <InfoBanner />
              <div style={{
                backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB',
                borderRadius: '12px', overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 24px',
                  borderBottom: credCardOpen ? '1px solid #E5E7EB' : 'none',
                }}>
                  <button
                    onClick={() => setCredCardOpen(!credCardOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      border: 'none', background: 'none', cursor: 'pointer',
                      fontFamily: font, padding: 0, textAlign: 'left',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                      style={{ flexShrink: 0, transform: credCardOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.22s ease' }}>
                      <path d="M3 5.5l4 4 4-4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>
                      Manage credentials and branch settings
                    </span>
                  </button>
                  <button
                    onClick={() => setEditCredModal(true)}
                    style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, padding: 0,
                    }}
                  >
                    Edit
                  </button>
                </div>
                <div style={{
                  maxHeight: credCardOpen ? '2000px' : '0px',
                  overflow: 'hidden', transition: 'max-height 0.25s ease',
                }}>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'Repository',     value: credRepo           },
                      { label: 'Username',        value: credUsername       },
                      { label: 'Token',           value: credToken          },
                      { label: 'Branch',          value: credBranch         },
                      { label: 'GUID branch',     value: credGuidBranch     },
                      { label: 'Version history', value: credVersionHistory },
                    ].map(({ label, value }) => (
                      <div key={label} style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: '32px',
                        padding: '18px 24px', backgroundColor: '#FFFFFF',
                        border: '1px solid #E9EAEC', borderRadius: '8px',
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', fontFamily: font, minWidth: '140px' }}>
                          {label}
                        </div>
                        <div style={{
                          flex: 1, maxWidth: '400px', height: '38px',
                          borderRadius: '6px', padding: '0 14px',
                          fontSize: '13.5px', color: '#374151', fontFamily: font,
                          backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center',
                        }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ALL ORGS: enabled view ── */}
          {!isPrimary && vcEnabled && (
            <div>
              <InfoBanner />

              {/* Search */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    style={{ position: 'absolute', left: '12px', flexShrink: 0 }}>
                    <circle cx="6" cy="6" r="4.5" stroke="#9CA3AF" strokeWidth="1.4" />
                    <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text" placeholder="Search"
                    value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
                    style={{
                      width: '300px', height: '36px', paddingLeft: '36px', paddingRight: '12px',
                      border: '1px solid #D1D5DB', borderRadius: '8px',
                      fontFamily: font, fontSize: '13px', color: '#111827',
                      outline: 'none', backgroundColor: '#FFFFFF',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Table card — grey outer, white inner table */}
              <div style={{
                backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB',
                borderRadius: '12px', overflow: 'hidden',
              }}>
                {/* Card header */}
                <div style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid #E5E7EB',
                  fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font,
                }}>
                  Manage version control
                </div>

                {/* White table container inside grey card */}
                <div style={{ padding: '16px' }}>
                  <div style={{
                    backgroundColor: '#FFFFFF', borderRadius: '8px',
                    border: '1px solid #E5E7EB', overflow: 'hidden',
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: font }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                          <th style={{ padding: '12px 16px 12px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 400, color: '#9CA3AF' }}>Name</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 400, color: '#9CA3AF' }}>Status</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 400, color: '#9CA3AF' }}>Repository</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 400, color: '#9CA3AF' }}>Branch</th>
                          <th style={{ width: '52px', padding: '12px 20px 12px 0' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrgs.map((org, idx) => (
                          <tr key={org.id} style={{
                            borderBottom: idx < filteredOrgs.length - 1 ? '1px solid #F3F4F6' : 'none',
                            transition: 'background-color 0.1s',
                          }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#FAFAFA'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                          >
                            <td style={{ padding: '18px 16px 18px 20px', verticalAlign: 'middle' }}>
                              <span style={{ fontSize: '13.5px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer' }}>
                                {org.name}
                              </span>
                            </td>
                            <td style={{ padding: '18px 16px', verticalAlign: 'middle' }}>
                              <span style={{
                                display: 'inline-block', padding: '3px 10px', borderRadius: '4px',
                                fontSize: '12.5px', fontWeight: 500, fontFamily: font,
                                backgroundColor: org.status === 'mapped' ? '#DCFCE7' : '#FEE2E2',
                                color: org.status === 'mapped' ? '#166534' : '#991B1B',
                              }}>
                                {org.status === 'mapped' ? 'Mapped' : 'Unmapped'}
                              </span>
                            </td>
                            <td style={{ padding: '18px 16px', verticalAlign: 'middle' }}>
                              <span style={{ fontSize: '13.5px', color: '#374151', fontFamily: font }}>{org.repository}</span>
                            </td>
                            <td style={{ padding: '18px 16px', verticalAlign: 'middle' }}>
                              <span style={{ fontSize: '13.5px', color: '#374151', fontFamily: font }}>{org.branch}</span>
                            </td>
                            <td style={{ padding: '18px 20px 18px 0', verticalAlign: 'middle', textAlign: 'right' }}>
                              <VCDotsMenu status={org.status} onEdit={() => setEditCredModal(true)} onReset={() => setResetDialog(true)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Setup wizard modal ── */}
      {showSetupModal && (
        <SetupWizardModal
          scope={scope}
          onClose={() => setShowSetupModal(false)}
          onComplete={handleEnable}
        />
      )}

      {/* ── Reset confirm dialog ── */}
      {resetDialog && (
        <ConfirmDialog
          title="Reset configuration"
          message="Version history from the GIT branches will be lost. Are you sure you wish to reset connection?"
          confirmLabel="Reset"
          cancelLabel="Cancel"
          onConfirm={() => setResetDialog(false)}
          onCancel={() => setResetDialog(false)}
        />
      )}

      {/* ── Edit credentials modal ── */}
      {editCredModal && <EditCredentialsModal onClose={() => setEditCredModal(false)} />}
    </div>
  );
};

export default VersionControlPageContent;
