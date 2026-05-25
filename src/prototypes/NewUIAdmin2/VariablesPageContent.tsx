import React, { useState, useEffect } from 'react';
import { systemColors, rdComponentColors } from '../../tokens/colors';
import { Modal, ModalFooter } from '@components/Modal';
import { Button } from '@components/Button';
import { Toast } from '@components/Toast';
import { ConfirmDialog } from './ConfirmDialog';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const brand = systemColors.light['content-brand'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Variable {
  id: number;
  name: string;
  type: string;
  sensitive: boolean;
  values: number;
}

type Purpose = 'Table mapping' | 'Connection property' | 'Formula';
interface OrgRow { id: number; org: string; value: string; }

// ─── Mock data ────────────────────────────────────────────────────────────────

const INIT_VARIABLES: Variable[] = [
  { id: 1,  name: 'Account',            type: 'Connection property', sensitive: false, values: 2  },
  { id: 2,  name: 'account_name_var',   type: 'Connection property', sensitive: false, values: 0  },
  { id: 3,  name: 'acnt',               type: 'Connection property', sensitive: false, values: 1  },
  { id: 4,  name: 'ash1',               type: 'Connection property', sensitive: false, values: 2  },
  { id: 5,  name: 'ash10',              type: 'Connection property', sensitive: false, values: 2  },
  { id: 6,  name: 'c_name_formula_var', type: 'Formula',             sensitive: false, values: 0  },
  { id: 7,  name: 'clientid',           type: 'Connection property', sensitive: true,  values: 2  },
  { id: 8,  name: 'clientid_1',         type: 'Connection property', sensitive: true,  values: 1  },
  { id: 9,  name: 'db_name',            type: 'Connection property', sensitive: false, values: 3  },
  { id: 10, name: 'default_schema',     type: 'Connection property', sensitive: false, values: 1  },
  { id: 11, name: 'env_config',         type: 'Formula',             sensitive: true,  values: 4  },
  { id: 12, name: 'filter_var',         type: 'Connection property', sensitive: false, values: 1  },
  { id: 13, name: 'host_name',          type: 'Connection property', sensitive: false, values: 2  },
  { id: 14, name: 'org_id_var',         type: 'Formula',             sensitive: false, values: 0  },
  { id: 15, name: 'password_var',       type: 'Connection property', sensitive: true,  values: 3  },
];

const SAMPLE_ORGS = ['Primary', 'DataPlatform', 'test_drishti', 'sales_org', 'analytics_team', 'finance_org', 'eng_org'];
const MOCK_VALUES = ['thoughtspot_partner', 'ts_default', 'prod_value', 'staging_val'];

let rowIdCounter = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockOrgRowsForVariable(v: Variable): OrgRow[] {
  if (v.values === 0) return [{ id: rowIdCounter++, org: '', value: '' }];
  return Array.from({ length: Math.min(v.values, 3) }, (_, i) => ({
    id: rowIdCounter++,
    org: SAMPLE_ORGS[i % SAMPLE_ORGS.length],
    value: MOCK_VALUES[i % MOCK_VALUES.length],
  }));
}

const InfoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginLeft: '4px', verticalAlign: 'middle' }}>
    <circle cx="6.5" cy="6.5" r="5.75" stroke="#9CA3AF" strokeWidth="1.2" />
    <path d="M6.5 5.5v4M6.5 4h.01" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const ErrorDot = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="7" cy="7" r="6.25" fill="#EF4444" />
    <path d="M7 4v3.5M7 9.5h.01" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const RadioOption: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' as const }}>
    <div onClick={onChange} style={{
      width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
      border: `1.5px solid ${checked ? brand : '#D1D5DB'}`, backgroundColor: '#FFFFFF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'border-color 0.15s', cursor: 'pointer',
    }}>
      {checked && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: brand }} />}
    </div>
    <span onClick={onChange} style={{ fontSize: '13.5px', color: '#374151', fontFamily: font }}>{label}</span>
  </label>
);

const Checkbox: React.FC<{ checked: boolean; onChange: () => void; label?: string }> = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' as const }}>
    <button onClick={onChange} role="checkbox" aria-checked={checked} style={{
      width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0,
      border: `1.5px solid ${checked ? brand : '#D1D5DB'}`,
      backgroundColor: checked ? brand : '#FFFFFF',
      cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'border-color 0.15s, background-color 0.15s',
    }}>
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5l2.5 2.5L8 1" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
    {label && <span style={{ fontSize: '13.5px', color: '#374151', fontFamily: font }}>{label}</span>}
  </label>
);

// ─── OrgMappingForm — shared between Create step 2 and Edit ───────────────────

const OrgMappingForm: React.FC<{
  rows: OrgRow[];
  error: string;
  onUpdate: (id: number, field: 'org' | 'value', val: string) => void;
  onRemove: (id: number) => void;
  onAdd: () => void;
  onDismissError: () => void;
}> = ({ rows, error, onUpdate, onRemove, onAdd, onDismissError }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
      <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: font }}>Org mapping</span>
      <InfoIcon />
    </div>

    {error && (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', marginBottom: '16px',
        backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ErrorDot />
          <span style={{ fontSize: '12.5px', color: '#B91C1C', fontFamily: font }}>{error}</span>
        </div>
        <button onClick={onDismissError} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    )}

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: '8px', marginBottom: '8px' }}>
      <span style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', fontFamily: font }}>Org name</span>
      <span style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', fontFamily: font }}>Variable value</span>
      <span />
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
      {rows.map((row) => {
        const rowHasError = !!error && (!row.org || !row.value.trim());
        return (
          <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: '8px', alignItems: 'center' }}>
            <select
              value={row.org}
              onChange={(e) => onUpdate(row.id, 'org', e.target.value)}
              style={{
                height: '36px', padding: '0 10px',
                border: `1px solid ${rowHasError && !row.org ? '#EF4444' : '#D1D5DB'}`,
                borderRadius: '6px', fontFamily: font, fontSize: '13px',
                color: row.org ? '#111827' : '#9CA3AF', outline: 'none',
                backgroundColor: rowHasError && !row.org ? '#FEF2F2' : '#FFFFFF',
                appearance: 'none' as const, cursor: 'pointer',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B7280' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '28px',
              }}
            >
              <option value="" disabled>Select org</option>
              {SAMPLE_ORGS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <input
              value={row.value}
              onChange={(e) => onUpdate(row.id, 'value', e.target.value)}
              placeholder="Enter value"
              style={{
                height: '36px', padding: '0 12px',
                border: `1px solid ${rowHasError && !row.value.trim() ? '#EF4444' : '#D1D5DB'}`,
                borderRadius: '6px', fontFamily: font, fontSize: '13px', color: '#111827',
                outline: 'none', backgroundColor: rowHasError && !row.value.trim() ? '#FEF2F2' : '#FFFFFF',
                boxSizing: 'border-box' as const,
              }}
              onFocus={(e) => { if (!(rowHasError && !row.value.trim())) e.currentTarget.style.borderColor = brand; }}
              onBlur={(e) => { if (!(rowHasError && !row.value.trim())) e.currentTarget.style.borderColor = '#D1D5DB'; }}
            />
            <button
              onClick={() => onRemove(row.id)}
              style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>

    <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: font, fontSize: '13px', fontWeight: 500, color: brand, padding: 0 }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 1v10M1 6h10" stroke={brand} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      Add Row
    </button>
  </div>
);

// ─── DotsMenu ─────────────────────────────────────────────────────────────────

const DotsMenu: React.FC<{
  onEdit: () => void;
  onRename: () => void;
  onDelete: () => void;
}> = ({ onEdit, onRename, onDelete }) => {
  const [open, setOpen] = useState(false);

  const actions = [
    { label: 'Edit',   fn: onEdit   },
    { label: 'Rename', fn: onRename },
    { label: 'Delete', fn: onDelete },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '32px', height: '32px', borderRadius: '50%', border: 'none',
        backgroundColor: open ? '#F3F4F6' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6'; }}
        onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
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
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden', minWidth: '140px',
          }}>
            {actions.map(({ label, fn }) => (
              <button key={label} onClick={() => { setOpen(false); fn(); }} style={{
                display: 'block', width: '100%', padding: '10px 16px',
                border: 'none', textAlign: 'left', fontFamily: font, fontSize: '13px',
                color: label === 'Delete' ? '#EF4444' : '#111827',
                backgroundColor: 'transparent', cursor: 'pointer',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = label === 'Delete' ? '#FEF2F2' : '#F9FAFB'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── VariablesPageContent ─────────────────────────────────────────────────────

export const VariablesPageContent: React.FC = () => {
  const [variables, setVariables] = useState<Variable[]>(INIT_VARIABLES);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: '', visible: false });
  const showToast = (msg: string) => setToast({ msg, visible: true });
  useEffect(() => {
    if (toast.visible) { const t = setTimeout(() => setToast(p => ({ ...p, visible: false })), 4000); return () => clearTimeout(t); }
  }, [toast.visible]);

  // ── Create modal (2 steps) ─────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [varName, setVarName] = useState('');
  const [purpose, setPurpose] = useState<Purpose>('Table mapping');
  const [isSensitive, setIsSensitive] = useState(false);
  const [nameError, setNameError] = useState('');
  const [createRows, setCreateRows] = useState<OrgRow[]>([{ id: rowIdCounter++, org: '', value: '' }]);
  const [createOrgError, setCreateOrgError] = useState('');

  const openCreate = () => {
    setCreateStep(1); setVarName(''); setPurpose('Table mapping'); setIsSensitive(false);
    setNameError(''); setCreateRows([{ id: rowIdCounter++, org: '', value: '' }]); setCreateOrgError('');
    setCreateOpen(true);
  };
  const closeCreate = () => setCreateOpen(false);

  const handleCreateNext = () => {
    if (!varName.trim()) { setNameError('Variable name is required'); return; }
    setNameError(''); setCreateStep(2);
  };
  const handleCreateSave = () => {
    if (createRows.some(r => !r.org || !r.value.trim())) { setCreateOrgError('Missing values: All variable value fields must be filled.'); return; }
    const purposeMap: Record<Purpose, string> = { 'Table mapping': 'Table Mapping', 'Connection property': 'Connection property', 'Formula': 'Formula' };
    setVariables(prev => [{ id: Date.now(), name: varName.trim(), type: purposeMap[purpose], sensitive: isSensitive, values: createRows.length }, ...prev]);
    closeCreate(); showToast('Variable successfully created');
  };

  const updateCreateRow = (id: number, field: 'org' | 'value', val: string) => {
    setCreateRows(p => p.map(r => r.id === id ? { ...r, [field]: val } : r));
    if (createOrgError) setCreateOrgError('');
  };

  // ── Edit modal ─────────────────────────────────────────────────────────────
  const [editVar, setEditVar] = useState<Variable | null>(null);
  const [editRows, setEditRows] = useState<OrgRow[]>([]);
  const [editOrgError, setEditOrgError] = useState('');

  const openEdit = (v: Variable) => {
    setEditVar(v); setEditRows(mockOrgRowsForVariable(v)); setEditOrgError('');
  };
  const closeEdit = () => setEditVar(null);

  const handleEditSave = () => {
    if (editRows.some(r => !r.org || !r.value.trim())) { setEditOrgError('Missing values: All variable value fields must be filled.'); return; }
    setVariables(prev => prev.map(v => v.id === editVar!.id ? { ...v, values: editRows.length } : v));
    closeEdit(); showToast('Variable successfully updated');
  };

  const updateEditRow = (id: number, field: 'org' | 'value', val: string) => {
    setEditRows(p => p.map(r => r.id === id ? { ...r, [field]: val } : r));
    if (editOrgError) setEditOrgError('');
  };

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const [deleteVar, setDeleteVar] = useState<Variable | null>(null);

  const handleDelete = () => {
    setVariables(prev => prev.filter(v => v.id !== deleteVar!.id));
    setDeleteVar(null); showToast(`"${deleteVar!.name}" deleted`);
  };

  // ── Rename modal ───────────────────────────────────────────────────────────
  const [renameVar, setRenameVar] = useState<Variable | null>(null);
  const [renameName, setRenameName] = useState('');

  const openRename = (v: Variable) => { setRenameVar(v); setRenameName(v.name); };
  const closeRename = () => setRenameVar(null);

  const handleRenameSave = () => {
    if (!renameName.trim()) return;
    setVariables(prev => prev.map(v => v.id === renameVar!.id ? { ...v, name: renameName.trim() } : v));
    closeRename(); showToast('Variable renamed successfully');
  };

  // ── Table helpers ──────────────────────────────────────────────────────────
  const allSelected = selected.size === variables.length;
  const toggleAll = () => { if (allSelected) setSelected(new Set()); else setSelected(new Set(variables.map(v => v.id))); };
  const toggleRow = (id: number) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s); };
  const filtered = variables.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));

  // ── Step 1 content ─────────────────────────────────────────────────────────
  const createStep1Content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: font, marginBottom: '6px' }}>Name</label>
        {nameError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <ErrorDot />
            <span style={{ fontSize: '12.5px', color: '#EF4444', fontFamily: font }}>{nameError}</span>
          </div>
        )}
        <input
          value={varName}
          onChange={(e) => { setVarName(e.target.value); if (nameError) setNameError(''); }}
          placeholder="e.g., publish_demo_schema_var"
          style={{
            width: '100%', height: '36px', padding: '0 12px',
            border: `1px solid ${nameError ? '#EF4444' : '#D1D5DB'}`, borderRadius: '6px',
            boxSizing: 'border-box' as const, fontFamily: font, fontSize: '13px', color: '#111827',
            outline: 'none', backgroundColor: nameError ? '#FEF2F2' : '#FFFFFF',
          }}
          onFocus={(e) => { if (!nameError) e.currentTarget.style.borderColor = brand; }}
          onBlur={(e) => { if (!nameError) e.currentTarget.style.borderColor = '#D1D5DB'; }}
        />
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: font }}>Purpose</span>
          <InfoIcon />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(['Table mapping', 'Connection property', 'Formula'] as Purpose[]).map(p => (
            <RadioOption key={p} label={p} checked={purpose === p} onChange={() => setPurpose(p)} />
          ))}
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: font }}>Information type</span>
          <InfoIcon />
        </div>
        <Checkbox checked={isSensitive} onChange={() => setIsSensitive(!isSensitive)} label="Sensitive information" />
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>

      {/* Toast */}
      {toast.visible && (
        <Toast message={toast.msg} type="success" isVisible={toast.visible} onDismiss={() => setToast(p => ({ ...p, visible: false }))} position="bottom-right" duration={4000} />
      )}

      {/* ── Create Variable modal — Step 1 ── */}
      {createOpen && createStep === 1 && (
        <Modal
          isOpen
          size="M2"
          type="wizard"
          eyebrow="Create Variable"
          title="Add variable details"
          currentStep={1}
          totalSteps={2}
          onClose={closeCreate}
          footer={
            <ModalFooter
              tertiaryAction={<Button variant="tertiary" onClick={closeCreate}>Cancel</Button>}
              primaryAction={<Button variant="primary" onClick={handleCreateNext}>Next</Button>}
            />
          }
        >
          {createStep1Content}
        </Modal>
      )}

      {/* ── Create Variable modal — Step 2 ── */}
      {createOpen && createStep === 2 && (
        <Modal
          isOpen
          size="M2"
          type="wizard"
          eyebrow="Create Variable"
          title="Assign values"
          currentStep={2}
          totalSteps={2}
          onClose={closeCreate}
          footer={
            <ModalFooter
              tertiaryAction={<Button variant="tertiary" onClick={closeCreate}>Cancel</Button>}
              secondaryAction={<Button variant="secondary" onClick={() => setCreateStep(1)}>Back</Button>}
              primaryAction={<Button variant="primary" onClick={handleCreateSave}>Save</Button>}
            />
          }
        >
          <OrgMappingForm rows={createRows} error={createOrgError} onUpdate={updateCreateRow} onRemove={(id) => setCreateRows(p => p.filter(r => r.id !== id))} onAdd={() => setCreateRows(p => [...p, { id: rowIdCounter++, org: '', value: '' }])} onDismissError={() => setCreateOrgError('')} />
        </Modal>
      )}

      {/* ── Edit Variable modal ── */}
      {editVar && (
        <Modal
          isOpen
          size="M2"
          eyebrow="Edit Variable"
          title="Assign values"
          onClose={closeEdit}
          footer={
            <ModalFooter
              tertiaryAction={<Button variant="tertiary" onClick={closeEdit}>Cancel</Button>}
              primaryAction={<Button variant="primary" onClick={handleEditSave}>Save</Button>}
            />
          }
        >
          <OrgMappingForm rows={editRows} error={editOrgError} onUpdate={updateEditRow} onRemove={(id) => setEditRows(p => p.filter(r => r.id !== id))} onAdd={() => setEditRows(p => [...p, { id: rowIdCounter++, org: '', value: '' }])} onDismissError={() => setEditOrgError('')} />
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      {deleteVar && (
        <ConfirmDialog
          title="Delete Variable"
          message={<span>Are you sure you want to delete <strong>"{deleteVar.name}"</strong>?</span>}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setDeleteVar(null)}
        />
      )}

      {/* ── Rename modal ── */}
      {renameVar && (
        <Modal
          isOpen
          size="M1"
          title="Rename Variable"
          onClose={closeRename}
          footer={
            <ModalFooter
              secondaryAction={<Button variant="secondary" onClick={closeRename}>Cancel</Button>}
              primaryAction={<Button variant="primary" onClick={handleRenameSave}>Save</Button>}
            />
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', fontFamily: font }}>
              Enter a new name for the variable.
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: font, marginBottom: '6px' }}>Name</label>
              <input
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSave(); }}
                autoFocus
                style={{
                  width: '100%', height: '36px', padding: '0 12px',
                  border: '1px solid #D1D5DB', borderRadius: '6px',
                  boxSizing: 'border-box' as const, fontFamily: font, fontSize: '13px', color: '#111827', outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = brand; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ── Sticky header ── */}
      <div style={{ flexShrink: 0, padding: '28px 40px 20px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 700, color: '#0F172A', fontFamily: font, letterSpacing: '-0.3px' }}>Variables</h1>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#6B7280', fontFamily: font }}>Create and manage variables for your ThoughtSpot instance.</p>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '24px 40px 64px', boxSizing: 'border-box' }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: '10px' }}>
                <circle cx="6" cy="6" r="4.5" stroke="#9CA3AF" strokeWidth="1.4" />
                <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input type="text" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ width: '200px', height: '36px', paddingLeft: '32px', paddingRight: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontFamily: font, fontSize: '13px', color: '#111827', outline: 'none', backgroundColor: '#FFFFFF' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 18px', borderRadius: '20px', border: 'none', backgroundColor: rdComponentColors['button-secondary-default'], cursor: 'pointer', fontFamily: font, fontSize: '13px', fontWeight: 600, color: '#111827', transition: 'opacity 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.8'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="#111827" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Create Variable
            </button>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: font }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #E5E7EB' }}>
                <th style={{ width: '44px', padding: '10px 12px 10px 0', textAlign: 'left' }}>
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                </th>
                <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Name</th>
                <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#9CA3AF' }}>Type</th>
                <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#9CA3AF' }}>Sensitive values</th>
                <th style={{ padding: '10px 16px 10px 0', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#9CA3AF' }}>Values assigned</th>
                <th style={{ padding: '10px 0', width: '48px' }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id}
                  style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: selected.has(v.id) ? `${brand}08` : 'transparent', transition: 'background-color 0.1s' }}
                  onMouseEnter={(e) => { if (!selected.has(v.id)) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#FAFAFA'; }}
                  onMouseLeave={(e) => { if (!selected.has(v.id)) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                >
                  <td style={{ padding: '16px 12px 16px 0', verticalAlign: 'middle' }}>
                    <Checkbox checked={selected.has(v.id)} onChange={() => toggleRow(v.id)} />
                  </td>
                  <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer' }}>{v.name}</span>
                  </td>
                  <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle' }}>
                    <span style={{ fontSize: '13.5px', color: '#374151', fontFamily: font }}>{v.type}</span>
                  </td>
                  <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle' }}>
                    <span style={{ fontSize: '13.5px', color: '#374151', fontFamily: font }}>{v.sensitive ? 'True' : 'False'}</span>
                  </td>
                  <td style={{ padding: '16px 16px 16px 0', verticalAlign: 'middle' }}>
                    <span style={{ fontSize: '13.5px', color: '#374151', fontFamily: font }}>{v.values}</span>
                  </td>
                  <td style={{ padding: '16px 0', verticalAlign: 'middle', textAlign: 'right' }}>
                    <DotsMenu onEdit={() => openEdit(v)} onRename={() => openRename(v)} onDelete={() => setDeleteVar(v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
};

export default VariablesPageContent;
