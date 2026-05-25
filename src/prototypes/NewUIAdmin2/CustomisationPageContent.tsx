import React, { useState, useRef, useEffect } from 'react';
import { AppShell } from '../../components/AppShell';
import type { AppSidebarProps, SidebarTab, SidebarCategory, ScopeToggle } from '../../components/AppSidebar';
import type { GlobalHeaderProps } from '../../components/GlobalHeader';
import { systemColors, referenceColors } from '../../tokens/colors';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal, ModalFooter } from '@components/Modal';
import { Button } from '@components/Button';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const brand = systemColors.light['content-brand'];

type SidebarTabId = 'insights' | 'data' | 'develop' | 'admin';

const SIDEBAR_TABS: SidebarTab[] = [
  { id: 'insights', label: 'Insights', headerTitle: 'Insights' },
  { id: 'data', label: 'Data', headerTitle: 'Data Workspace' },
  { id: 'develop', label: 'Develop', headerTitle: 'Develop' },
  { id: 'admin', label: 'Admin', headerTitle: 'Admin' },
];

const SIDEBAR_CATEGORIES: Record<SidebarTabId, SidebarCategory[]> = {
  insights: [{ title: '', items: [{ id: 'home', label: 'Home' }] }],
  data: [{ title: '', items: [{ id: 'data-objects', label: 'Data objects' }] }],
  develop: [{ title: '', items: [{ id: 'playground', label: 'Playground' }] }],
  admin: [
    {
      title: '',
      items: [
        { id: 'home', label: 'Home' },
        { id: 'org-management', label: 'Org management' },
        { id: 'user-management', label: 'User management' },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'feature-management', label: 'Feature management' },
        { id: 'variables', label: 'Variables' },
        { id: 'version-control', label: 'Version control' },
      ],
    },
    {
      title: 'CONFIGURATION',
      items: [
        { id: 'application-settings', label: 'Application settings' },
        { id: 'customisation', label: 'Customisation' },
        { id: 'ai-settings', label: 'AI settings' },
        { id: 'search-spot-iq', label: 'Search & Spot IQ' },
      ],
    },
    {
      title: 'MONITOR',
      items: [
        { id: 'user-adoption', label: 'User & adoption' },
        { id: 'performance-tracking', label: 'performance tracking' },
        { id: 'ai-bi-stats', label: 'AI & BI stats' },
        { id: 'billing-query-stats', label: 'Billing query stats' },
      ],
    },
  ],
};

// ─── Chevron SVG ──────────────────────────────────────────────────────────────

const Chevron: React.FC<{ open: boolean; size?: number }> = ({ open, size = 14 }) => (
  <svg
    width={size} height={size} viewBox="0 0 14 14" fill="none"
    style={{ flexShrink: 0, transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.22s ease' }}
  >
    <path d="M3 5.5l4 4 4-4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Toggle ───────────────────────────────────────────────────────────────────

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    onClick={onChange} role="switch" aria-checked={checked}
    style={{
      position: 'relative', width: '36px', height: '20px', borderRadius: '10px',
      border: 'none', backgroundColor: checked ? brand : referenceColors.gray['30'],
      cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background-color 0.2s ease',
    }}
  >
    <span style={{
      position: 'absolute', top: '2px', left: checked ? '18px' : '2px',
      width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff',
      transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
    }} />
  </button>
);

// ─── Dropdown ─────────────────────────────────────────────────────────────────

const Dropdown: React.FC<{ value: string; options: string[]; width?: number; placeholder?: string }> = ({
  value: initialValue, options, width = 200, placeholder,
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(initialValue);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width, flexShrink: 0 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', height: '34px', padding: '0 10px',
          border: `1px solid ${open ? brand : '#D1D5DB'}`, borderRadius: '6px',
          backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: font, fontSize: '13px',
          color: selected ? '#111827' : '#9CA3AF', outline: 'none',
          boxShadow: open ? `0 0 0 2px ${brand}22` : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected || placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ flexShrink: 0, marginLeft: '6px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
        >
          <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 100, overflow: 'hidden',
          animation: 'dropdownFade 0.15s ease',
        }}>
          {options.map((opt) => (
            <button key={opt} onClick={() => { setSelected(opt); setOpen(false); }}
              style={{
                display: 'block', width: '100%', padding: '9px 14px', border: 'none',
                textAlign: 'left', fontFamily: font, fontSize: '13px',
                fontWeight: opt === selected ? 500 : 400,
                color: opt === selected ? brand : '#111827',
                backgroundColor: opt === selected ? `${brand}10` : 'transparent',
                cursor: 'pointer',
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

// ─── Card ─────────────────────────────────────────────────────────────────────

const Card: React.FC<{
  title: string;
  description?: string;
  open: boolean;
  onToggle: () => void;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, open, onToggle, rightAction, children }) => {
  const multi = React.Children.count(children) > 1;
  const isOpen = multi ? open : true;
  return (
  <div style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
    {/* Header row */}
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 24px 10px', borderBottom: isOpen ? '1px solid #E5E7EB' : 'none' }}>
      {multi ? (
        <button
          onClick={onToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', flex: 1,
            border: 'none', background: 'none', cursor: 'pointer', fontFamily: font, textAlign: 'left', padding: 0,
          }}
        >
          <Chevron open={isOpen} />
          <div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>{title}</span>
            {description && (
              <div style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: font, marginTop: '2px', lineHeight: 1.5 }}>{description}</div>
            )}
          </div>
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>{title}</span>
            {description && (
              <div style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: font, marginTop: '2px', lineHeight: 1.5 }}>{description}</div>
            )}
          </div>
        </div>
      )}
      {rightAction && (
        <div style={{ flexShrink: 0, paddingTop: '1px' }}>{rightAction}</div>
      )}
    </div>

    {/* Body */}
    <div style={{ maxHeight: isOpen ? '3000px' : '0px', overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
      <div style={{ padding: '16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  </div>
  );
};

// ─── Setting Row ──────────────────────────────────────────────────────────────

const SettingRow: React.FC<{
  label: string;
  description?: string;
  control: React.ReactNode;
  noBg?: boolean;
}> = ({ label, description, control, noBg }) => (
  <div style={{
    display: 'flex', alignItems: description ? 'flex-start' : 'center',
    justifyContent: 'space-between', gap: '24px', padding: '16px 20px',
    backgroundColor: noBg ? 'transparent' : '#FFFFFF',
    border: noBg ? 'none' : '1px solid #E9EAEC', borderRadius: '8px',
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font, lineHeight: 1.4 }}>
        {label}
      </div>
      {description && (
        <div style={{ fontSize: '12.5px', color: '#9CA3AF', fontFamily: font, marginTop: '4px', lineHeight: 1.55 }}>
          {description}
        </div>
      )}
    </div>
    <div style={{ flexShrink: 0, paddingTop: description ? '2px' : '0' }}>{control}</div>
  </div>
);

// ─── Image Upload Area ────────────────────────────────────────────────────────

const ImageUploadArea: React.FC = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px',
      minHeight: '72px',
    }}>
      {/* Preview / placeholder */}
      <div style={{
        width: '56px', height: '44px', borderRadius: '6px',
        backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {preview ? (
          <img src={preview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="4" width="16" height="12" rx="2" stroke="#C0C6D0" strokeWidth="1.3" />
            <circle cx="7.5" cy="8.5" r="1.5" stroke="#C0C6D0" strokeWidth="1.3" />
            <path d="M2 13l4-3 3 2.5 3-4 4 4.5" stroke="#C0C6D0" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      {/* Upload button */}
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          height: '32px', padding: '0 16px', border: '1px solid #D1D5DB', borderRadius: '6px',
          backgroundColor: '#FFFFFF', fontSize: '13px', fontWeight: 500, color: '#374151',
          fontFamily: font, cursor: 'pointer',
        }}
      >
        Upload
      </button>
    </div>
  );
};

// ─── Double Dropdown Row ──────────────────────────────────────────────────────

// ─── Font options ─────────────────────────────────────────────────────────────

const FONT_OPTIONS: { label: string; fontFamily: string; color?: string; fontWeight?: number }[] = [
  { label: 'Optimo Plain, helvetica Neue, Helvetica, Arial, Sans serif', fontFamily: '"Plain", -apple-system, sans-serif', color: brand },
  { label: 'Testing font', fontFamily: 'Georgia, "Times New Roman", serif', color: '#111827' },
  { label: 'Ashu all org 2 font', fontFamily: '"Brush Script MT", "Segoe Script", cursive', color: '#1F2937' },
  { label: 'Primary Org style', fontFamily: 'Papyrus, fantasy', color: '#14B8A6' },
  { label: 'Custom Font 1', fontFamily: 'Palatino, "Palatino Linotype", "Book Antiqua", serif', color: '#7C3AED' },
  { label: 'Custom FONT 2', fontFamily: 'Impact, "Arial Black", sans-serif', color: '#111827', fontWeight: 900 },
];

const FontDropdown: React.FC<{ value: string; width?: number }> = ({ value, width = 311 }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(value);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(!open);
  };

  const selectedOpt = FONT_OPTIONS.find(o => o.label === selected) ?? FONT_OPTIONS[0];

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          width, height: '34px', padding: '0 10px', border: '1px solid #D1D5DB', borderRadius: '6px',
          backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
        }}
      >
        <span style={{ fontFamily: selectedOpt.fontFamily, fontSize: '13.5px', color: selectedOpt.color ?? '#111827', fontWeight: selectedOpt.fontWeight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOpt.label}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
          <path d="M2 4l3 3 3-3" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999,
          backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width, maxHeight: '280px', overflowY: 'auto',
        }}>
          {FONT_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => { setSelected(opt.label); setOpen(false); }}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none',
                backgroundColor: selected === opt.label ? `${brand}10` : 'transparent',
                cursor: 'pointer', display: 'block',
                fontFamily: opt.fontFamily, fontSize: '15px',
                color: opt.color ?? '#111827', fontWeight: opt.fontWeight,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DoubleDropdownRow: React.FC<{
  label: string;
  value1: string;
  options1: string[];
  value2: string;
  options2: string[];
  fontMode?: boolean;
}> = ({ label, value1, options1, value2, options2, fontMode }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px',
    padding: '14px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px',
  }}>
    <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>
      {label}
    </span>
    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
      <Dropdown value={value1} options={options1} width={160} />
      {fontMode ? <FontDropdown value={value2} width={311} /> : <Dropdown value={value2} options={options2} width={311} />}
    </div>
  </div>
);

// ─── Color picker grid ────────────────────────────────────────────────────────

const PICKER_COLORS = [
  ['#FFFFFF', '#FECACA', '#FED7AA', '#FEF3C7', '#DCFCE7', '#CFFAFE', '#DBEAFE', '#EDE9FE'],
  ['#F3F4F6', '#FCA5A5', '#FDBA74', '#FDE68A', '#BBF7D0', '#A5F3FC', '#BFDBFE', '#DDD6FE'],
  ['#D1D5DB', '#F87171', '#FB923C', '#FCD34D', '#86EFAC', '#67E8F9', '#93C5FD', '#C4B5FD'],
  ['#9CA3AF', '#EF4444', '#F97316', '#FBBF24', '#4ADE80', '#22D3EE', '#60A5FA', '#A78BFA'],
  ['#6B7280', '#DC2626', '#EA580C', '#F59E0B', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6'],
  ['#4B5563', '#B91C1C', '#C2410C', '#D97706', '#16A34A', '#0891B2', '#2563EB', '#7C3AED'],
  ['#374151', '#991B1B', '#9A3412', '#B45309', '#15803D', '#0E7490', '#1D4ED8', '#6D28D9'],
  ['#111827', '#7F1D1D', '#7C2D12', '#78350F', '#14532D', '#164E63', '#1E3A8A', '#4C1D95'],
];

// ─── Color Swatch with picker popup ──────────────────────────────────────────

const ColorSwatch: React.FC<{ color: string }> = ({ color: initialColor }) => {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(initialColor);
  const [hexInput, setHexInput] = useState(initialColor);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (c: string) => { setColor(c); setHexInput(c); };

  const handleHex = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) setColor(val);
  };

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Trigger button */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          height: '32px', padding: '0 8px', borderRadius: '6px',
          border: open ? `2px solid ${brand}` : '1px solid #D1D5DB',
          backgroundColor: '#FFFFFF', cursor: 'pointer',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: '18px', height: '18px', borderRadius: '3px', backgroundColor: color, flexShrink: 0 }} />
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path d="M2 4l3 3 3-3" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Picker popup */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
          borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          zIndex: 300, padding: '12px', width: '220px',
          animation: 'dropdownFade 0.15s ease',
        }}>
          {/* Color grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '3px', marginBottom: '12px' }}>
            {PICKER_COLORS.flat().map((c, i) => (
              <div
                key={i}
                onClick={() => pick(c)}
                style={{
                  width: '22px', height: '22px', borderRadius: '3px',
                  backgroundColor: c, cursor: 'pointer', boxSizing: 'border-box',
                  border: c === color ? `2px solid ${brand}` : '1px solid rgba(0,0,0,0.08)',
                  outline: c === color ? '2px solid white' : 'none',
                  outlineOffset: '-3px',
                }}
              />
            ))}
          </div>

          {/* Hex input */}
          <div style={{ fontSize: '12px', color: '#374151', fontFamily: font, marginBottom: '6px', fontWeight: 500 }}>
            Hex color
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              value={hexInput}
              onChange={(e) => handleHex(e.target.value)}
              placeholder="#000000"
              style={{
                flex: 1, height: '32px', padding: '0 10px',
                border: '1px solid #D1D5DB', borderRadius: '6px',
                fontSize: '13px', fontFamily: font, color: '#111827', outline: 'none',
              }}
            />
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              backgroundColor: color, border: '1px solid #E5E7EB', flexShrink: 0,
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

const ColorRow: React.FC<{ label?: string; colors: string[] }> = ({ label, colors }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
    {label && (
      <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: font, width: '140px', flexShrink: 0 }}>
        {label}
      </span>
    )}
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {colors.map((c, i) => <ColorSwatch key={i} color={c} />)}
    </div>
  </div>
);

// ─── Checkbox ─────────────────────────────────────────────────────────────────

const Checkbox: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 0' }}>
    <input
      type="checkbox" checked={checked} onChange={onChange}
      style={{ width: '14px', height: '14px', accentColor: brand, cursor: 'pointer' }}
    />
    <span style={{ fontSize: '13px', color: '#374151', fontFamily: font }}>{label}</span>
  </label>
);

// ─── Text Input Row ───────────────────────────────────────────────────────────

const TextInputRow: React.FC<{ label: string; placeholder?: string }> = ({ label, placeholder }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px',
    padding: '14px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px',
  }}>
    <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>
      {label}
    </span>
    <input
      type="text" placeholder={placeholder || 'Enter text'}
      style={{
        height: '34px', width: '220px', padding: '0 12px',
        border: '1px solid #D1D5DB', borderRadius: '6px',
        fontSize: '13px', fontFamily: font, color: '#111827',
        outline: 'none', flexShrink: 0,
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
    />
  </div>
);

// ─── Reset link ───────────────────────────────────────────────────────────────

const ResetLink: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <button onClick={onClick} style={{ border: 'none', background: 'none', fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer', padding: 0 }}>
    Reset
  </button>
);

// ─── Add font link ────────────────────────────────────────────────────────────

const AddFontLink: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'none', fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer', padding: 0 }}>
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 2v9M2 6.5h9" stroke={brand} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    Add new font
  </button>
);

// ─── Add New Font Modal ───────────────────────────────────────────────────────

const AddNewFontModal: React.FC<{ onClose: () => void; onConfirm: () => void }> = ({ onClose, onConfirm }) => {
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const hasFile = fileName !== '';

  const inputStyle: React.CSSProperties = {
    flex: 1, height: '40px', padding: '0 12px', border: '1px solid #D1D5DB',
    borderRadius: '8px', fontSize: '13.5px', fontFamily: font, color: hasFile ? '#111827' : '#9CA3AF',
    outline: 'none', backgroundColor: '#F9FAFB', cursor: 'default', boxSizing: 'border-box',
  };

  return (
    <Modal
      isOpen
      size="M1"
      title="Add new font"
      onClose={onClose}
      footer={
        <ModalFooter
          secondaryAction={<Button variant="secondary" onClick={onClose}>Cancel</Button>}
          primaryAction={<Button variant="primary" onClick={onConfirm}>Add</Button>}
        />
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Upload field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: font }}>
            Upload .otf/.ttf font file
          </span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              readOnly
              value={fileName}
              placeholder="No file chosen"
              style={inputStyle}
            />
            <input
              ref={fileRef}
              type="file"
              accept=".otf,.ttf"
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files?.[0]) setFileName(e.target.files[0].name); }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                height: '40px', padding: '0 20px', border: '1px solid #D1D5DB',
                borderRadius: '8px', backgroundColor: '#F3F4F6', fontSize: '13.5px',
                fontWeight: 500, color: '#374151', fontFamily: font, cursor: 'pointer', flexShrink: 0,
              }}
            >
              Upload
            </button>
          </div>
        </div>

        {/* Preview — only shown when a file is chosen */}
        {hasFile && (
          <span style={{ fontFamily: '"Brush Script MT", "Segoe Script", cursive', fontSize: '22px', color: '#374151', display: 'block' }}>
            The quick brown fox jumps over the lazy dog
          </span>
        )}
      </div>
    </Modal>
  );
};

// ─── Modal primitives removed — use RdModal directly ─────────────────────────

const FormField: React.FC<{ label: string; required?: boolean; helper?: string; placeholder?: string }> = ({ label, required, helper, placeholder }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: font }}>
      {label}{required && <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>}
    </label>
    <input
      type="text" placeholder={placeholder}
      style={{ height: '36px', padding: '0 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', fontFamily: font, color: '#111827', outline: 'none', width: '100%', boxSizing: 'border-box' }}
      onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
    />
    {helper && <span style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: font }}>{helper}</span>}
  </div>
);



// ─── Customise Homepage modal ─────────────────────────────────────────────────

const HOMEPAGE_ITEMS_ORDER = ['Announcement', 'Spotter', 'Watchlist', 'Library', 'Trending', 'Learning', 'Favourites'];

const DragHandle: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, cursor: 'grab' }}>
    <circle cx="5" cy="4" r="1.2" fill="#C0C6CF" />
    <circle cx="5" cy="8" r="1.2" fill="#C0C6CF" />
    <circle cx="5" cy="12" r="1.2" fill="#C0C6CF" />
    <circle cx="11" cy="4" r="1.2" fill="#C0C6CF" />
    <circle cx="11" cy="8" r="1.2" fill="#C0C6CF" />
    <circle cx="11" cy="12" r="1.2" fill="#C0C6CF" />
  </svg>
);

const CustomiseHomepageModal: React.FC<{
  toggles: Record<string, boolean>;
  onToggle: (key: string) => void;
  onClose: () => void;
}> = ({ toggles, onToggle, onClose }) => {
  const keyMap: Record<string, string> = {
    Announcement: 'announcement', Spotter: 'spotter', Watchlist: 'watchlist',
    Library: 'library', Trending: 'trending', Learning: 'learning', Favourites: 'favourites',
  };
  return (
    <Modal
      isOpen
      size="M1"
      title="Customise homepage"
      onClose={onClose}
      footer={
        <ModalFooter
          tertiaryAction={<Button variant="tertiary">Reset to default</Button>}
          secondaryAction={<Button variant="secondary" onClick={onClose}>Cancel</Button>}
          primaryAction={<Button variant="primary" onClick={onClose}>Done</Button>}
        />
      }
    >
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
        {HOMEPAGE_ITEMS_ORDER.map((label, i) => {
          const key = keyMap[label];
          const enabled = toggles[key];
          return (
            <div
              key={label}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px',
                borderBottom: i < HOMEPAGE_ITEMS_ORDER.length - 1 ? '1px solid #F3F4F6' : 'none',
                backgroundColor: '#FFFFFF',
              }}
            >
              <DragHandle />
              <span style={{ flex: 1, fontSize: '14px', color: enabled ? '#111827' : '#9CA3AF', fontFamily: font }}>
                {label}
              </span>
              <Toggle checked={enabled} onChange={() => onToggle(key)} />
            </div>
          );
        })}
      </div>
    </Modal>
  );
};



// ─── Add Action Button ────────────────────────────────────────────────────────

const AddAction: React.FC<{ label: string }> = ({ label }) => (
  <button style={{
    display: 'flex', alignItems: 'center', gap: '5px', border: 'none', background: 'none',
    fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer', padding: 0,
  }}>
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 2v9M2 6.5h9" stroke={brand} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    {label}
  </button>
);

// ─── Text Link ────────────────────────────────────────────────────────────────

const TextLink: React.FC<{ label: string }> = ({ label }) => (
  <button style={{
    border: 'none', background: 'none', fontSize: '13px', fontWeight: 500,
    color: brand, fontFamily: font, cursor: 'pointer', padding: 0,
  }}>
    {label}
  </button>
);

// ─── Simple Row ───────────────────────────────────────────────────────────────

const SimpleRow: React.FC<{
  label: string;
  description?: string;
  learnMore?: boolean;
  control: React.ReactNode;
  extraAction?: React.ReactNode;
  dimmed?: boolean;
}> = ({ label, description, learnMore, control, extraAction, dimmed }) => (
  <div style={{
    display: 'flex', alignItems: description ? 'flex-start' : 'center',
    justifyContent: 'space-between', gap: '24px',
    padding: '14px 20px', backgroundColor: '#FFFFFF',
    border: '1px solid #E9EAEC', borderRadius: '8px',
  }}>
    <div style={{ flex: 1 }}>
      <span style={{ fontSize: '14px', color: dimmed ? '#9CA3AF' : '#111827', fontFamily: font, lineHeight: 1.4 }}>
        {label}
      </span>
      {description && (
        <div style={{ fontSize: '12.5px', color: '#9CA3AF', fontFamily: font, marginTop: '3px', lineHeight: 1.55 }}>
          {description}{learnMore && <> <button style={{ border: 'none', background: 'none', fontSize: '12.5px', color: brand, fontFamily: font, cursor: 'pointer', padding: 0 }}>Learn more</button></>}
        </div>
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0, paddingTop: description ? '2px' : 0 }}>
      {extraAction}
      {control}
    </div>
  </div>
);

// ─── Value Row ────────────────────────────────────────────────────────────────

const ValueRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px',
    padding: '14px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px',
  }}>
    <span style={{ fontSize: '14px', color: '#111827', fontFamily: font }}>{label}</span>
    <span style={{ fontSize: '13px', color: '#6B7280', fontFamily: font, maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
      {value}
    </span>
  </div>
);

// ─── Chart Avatar ─────────────────────────────────────────────────────────────

const ChartAvatar: React.FC = () => (
  <div style={{
    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 600, color: '#fff', fontFamily: font,
  }}>
    AK
  </div>
);

// ─── Color Display Row (Email) ────────────────────────────────────────────────

const ColorDisplayRow: React.FC<{ label: string; color: string; hex: string }> = ({ label, color, hex }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px',
    padding: '14px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px',
  }}>
    <span style={{ fontSize: '14px', color: '#111827', fontFamily: font }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        height: '28px', padding: '0 8px', border: '1px solid #D1D5DB', borderRadius: '6px', backgroundColor: '#fff',
      }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '3px', backgroundColor: color, flexShrink: 0 }} />
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 4l3 3 3-3" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ fontSize: '13px', color: '#374151', fontFamily: font }}>{hex}</span>
    </div>
  </div>
);

// ─── Email Read-only Rows ─────────────────────────────────────────────────────

const EmailShownRow: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px', overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
      <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827', fontFamily: font }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#9CA3AF', fontFamily: font }}>Shown</span>
    </div>
    {children && (
      <div style={{ borderTop: '1px solid #F3F4F6', padding: '14px 20px 16px' }}>
        {children}
      </div>
    )}
  </div>
);

const EmailDotRow: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px' }}>
    <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827', fontFamily: font }}>{label}</span>
    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: brand, flexShrink: 0 }} />
  </div>
);

// ─── Object Table ─────────────────────────────────────────────────────────────

const ObjectTable: React.FC<{
  columns: { label: string; flex?: number }[];
  rows: React.ReactNode[][];
}> = ({ columns, rows }) => {
  const gridCols = columns.map((c) => `${c.flex ?? 1}fr`).join(' ');
  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, padding: '10px 20px', borderBottom: '1px solid #F3F4F6' }}>
        {columns.map((col) => (
          <span key={col.label} style={{ fontSize: '12.5px', fontWeight: 500, color: '#9CA3AF', fontFamily: font }}>{col.label}</span>
        ))}
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: gridCols, padding: '13px 20px',
          borderBottom: i < rows.length - 1 ? '1px solid #F3F4F6' : 'none', alignItems: 'center',
        }}>
          {row.map((cell, j) => <div key={j}>{cell}</div>)}
        </div>
      ))}
    </div>
  );
};

// ─── Help Menu Icons ──────────────────────────────────────────────────────────

const HelpMenuIcon: React.FC<{ type: 'document' | 'video' | 'rocket' | 'people' | 'info' }> = ({ type }) => {
  const paths: Record<string, React.ReactNode> = {
    document: <><rect x="4" y="1.5" width="12" height="17" rx="1.5" stroke="#6B7280" strokeWidth="1.4" /><path d="M7 7h6M7 10.5h6M7 14h4" stroke="#6B7280" strokeWidth="1.3" strokeLinecap="round" /></>,
    video:    <><rect x="1.5" y="4" width="17" height="12" rx="1.5" stroke="#6B7280" strokeWidth="1.4" /><path d="M8.5 8.5l5 2.5-5 2.5V8.5z" fill="#6B7280" /></>,
    rocket:   <><path d="M10 2c0 0-5 4.5-5 9a5 5 0 0 0 10 0c0-4.5-5-9-5-9z" stroke="#6B7280" strokeWidth="1.4" strokeLinejoin="round" /><path d="M7 14c-1.5 1-2.5 2.5-2.5 4h11c0-1.5-1-3-2.5-4" stroke="#6B7280" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="11" r="1.5" fill="#6B7280" /></>,
    people:   <><circle cx="7.5" cy="6.5" r="3" stroke="#6B7280" strokeWidth="1.4" /><path d="M1.5 19v-1.5A5.5 5.5 0 0 1 13 17.5V19" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" /><circle cx="15" cy="7" r="2.5" stroke="#6B7280" strokeWidth="1.2" /><path d="M18.5 19v-1a4 4 0 0 0-3-3.87" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" /></>,
    info:     <><circle cx="10" cy="10" r="8.5" stroke="#6B7280" strokeWidth="1.4" /><path d="M10 9.5V14" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" /><circle cx="10" cy="7" r="0.8" fill="#6B7280" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none">{paths[type]}</svg>;
};

// ─── Help Menu Item Modal (add + edit) ───────────────────────────────────────

type HelpIconType = 'document' | 'video' | 'rocket' | 'people' | 'info';

const HelpMenuItemModal: React.FC<{
  mode: 'add' | 'edit';
  item?: { label: string; icon: HelpIconType; url: string };
  onClose: () => void;
  onSave: () => void;
}> = ({ mode, item, onClose, onSave }) => {
  const [label, setLabel] = useState(mode === 'edit' ? (item?.label ?? '') : '');
  const [url, setUrl] = useState(mode === 'edit' ? (item?.url ?? '') : '');
  const [iconFile, setIconFile] = useState(mode === 'edit' ? 'info_circle.png' : '');
  const fileRef = useRef<HTMLInputElement>(null);

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '40px', padding: '0 14px', border: '1px solid #D1D5DB',
    borderRadius: '8px', fontSize: '13.5px', color: '#111827', fontFamily: font,
    outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF',
  };

  const fieldRow = (labelText: string, content: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px', marginBottom: '20px' }}>
      <span style={{ width: '160px', flexShrink: 0, fontSize: '14px', fontWeight: 500, color: '#111827', fontFamily: font, paddingTop: '9px' }}>
        {labelText}
      </span>
      <div style={{ flex: 1 }}>{content}</div>
    </div>
  );

  return (
    <Modal
      isOpen
      size="M2"
      title={mode === 'add' ? 'Add menu item' : 'Edit menu item'}
      onClose={onClose}
      footer={
        <ModalFooter
          secondaryAction={<Button variant="secondary" onClick={onClose}>Cancel</Button>}
          primaryAction={<Button variant="primary" onClick={onSave}>Save</Button>}
        />
      }
    >
      <div>
        {/* Menu item list label */}
        {fieldRow('Menu item list label', (
          <input
            type="text" value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter list item"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        ))}

        {/* Item URL */}
        {fieldRow('Item URL', (
          <input
            type="text" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="Item URL here"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        ))}

        {/* Custom icon */}
        {fieldRow('Custom icon', (
          <div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text" value={iconFile} readOnly placeholder="upload icon image"
                style={{ ...inputStyle, backgroundColor: '#FFFFFF', cursor: 'default', color: iconFile ? '#111827' : '#9CA3AF' }}
              />
              <input ref={fileRef} type="file" accept=".png,.svg" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) setIconFile(e.target.files[0].name); }} />
              <button onClick={() => fileRef.current?.click()} style={{ height: '40px', padding: '0 20px', border: '1px solid #D1D5DB', borderRadius: '8px', backgroundColor: '#F3F4F6', fontSize: '13.5px', fontWeight: 500, color: '#374151', fontFamily: font, cursor: 'pointer', flexShrink: 0 }}>
                Upload
              </button>
            </div>
            {/* Icon preview */}
            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center' }}>
              {mode === 'edit' && item ? (
                <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HelpMenuIcon type={item.icon} />
                </div>
              ) : (
                <div style={{ width: '48px', height: '48px', border: '1.5px dashed #D1D5DB', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#D1D5DB" strokeWidth="1.5"/>
                    <path d="M3 16l5-5 4 4 3-3 6 6" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="#D1D5DB"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

// ─── Static data ──────────────────────────────────────────────────────────────


const HELP_ITEMS: { label: string; icon: 'document' | 'video' | 'rocket' | 'people' | 'info'; url: string }[] = [
  { label: 'Documents',       icon: 'document', url: 'https://champagne-master-aws.thoughtspotstaging.cloud/#/admin' },
  { label: 'Getting Started', icon: 'video',    url: 'https://champagne-master-aws.thoughtspotstaging.cloud/#/admin' },
  { label: "What's New",      icon: 'rocket',   url: 'https://champagne-master-aws.thoughtspotstaging.cloud/#/admin' },
  { label: 'Contact Support', icon: 'people',   url: 'https://champagne-master-aws.thoughtspotstaging.cloud/#/admin' },
  { label: 'About',           icon: 'info',     url: 'https://champagne-master-aws.thoughtspotstaging.cloud/#/admin' },
];

// ─── Color data ───────────────────────────────────────────────────────────────

const PRIMARY_COLORS = ['#2770EF', '#00BCD4', '#F59E0B', '#22C55E', '#A855F7', '#F97316', '#6B7280', '#EF4444'];

const SECONDARY_COLORS = [
  ['#DBEAFE', '#CFFAFE', '#FEF9C3', '#DCFCE7', '#F3E8FF', '#FFE4E6', '#F3F4F6', '#FCE7F3'],
  ['#93C5FD', '#67E8F9', '#FDE68A', '#86EFAC', '#D8B4FE', '#FDBA74', '#D1D5DB', '#FCA5A5'],
  ['#2563EB', '#0D9488', '#CA8A04', '#16A34A', '#7C3AED', '#C2410C', '#374151', '#DC2626'],
  ['#1E3A8A', '#134E4A', '#78350F', '#14532D', '#4C1D95', '#7C2D12', '#111827', '#7F1D1D'],
];

// ─── Page content (reusable without AppShell) ─────────────────────────────────

export const CustomisationPageContent: React.FC<{ scope?: 'all-orgs' | 'primary-org' }> = ({ scope = 'all-orgs' }) => {
  const [activeTab, setActiveTab] = useState('style');

  const [resetSection, setResetSection] = useState<string | null>(null);

  const [logoDefaultOpen, setLogoDefaultOpen] = useState(true);
  const [logoWideOpen, setLogoWideOpen] = useState(true);
  const [chartTextOpen, setChartTextOpen] = useState(true);
  const [tableTextOpen, setTableTextOpen] = useState(true);
  const [navColourOpen, setNavColourOpen] = useState(true);
  const [chartPaletteOpen, setChartPaletteOpen] = useState(true);
  const [footerTextOpen, setFooterTextOpen] = useState(true);
  const [disableColourRotation, setDisableColourRotation] = useState(false);

  // ── Chart tab ──
  const [chartInnerTab, setChartInnerTab] = useState<'palettes' | 'custom-charts' | 'custom-maps'>('palettes');

  // ── Homepage tab ──
  const [customiseHomepageModal, setCustomiseHomepageModal] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [customiseHomepageOpen, setCustomiseHomepageOpen] = useState(true);
  const [translateOpen, setTranslateOpen] = useState(true);
  const [customBanner, setCustomBanner] = useState(false);
  const [bannerConfigured, setBannerConfigured] = useState(false);
  const [editAlertModal, setEditAlertModal] = useState(false);
  const [homepageItems, setHomepageItems] = useState<Record<string, boolean>>({
    announcement: true, spotter: true, watchlist: true,
    library: true, trending: true, learning: false, favourites: false,
  });
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [csvTranslate, setCsvTranslate] = useState(true);

  // ── Email tab ──
  const [emailOpen, setEmailOpen] = useState(true);
  const [emailPreview, setEmailPreview] = useState(false);
  const [emailToggles, setEmailToggles] = useState<Record<string, boolean>>({
    productName: true, phoneNumber: true, address: true,
    mobileAppNudge: true, modifyAlert: true, unsubscribeLink: true,
    errorMessage: true, manageNotifications: true,
  });

  // ── Help tab ──
  const [helpMenuItemModal, setHelpMenuItemModal] = useState(false);
  const [helpMenuMode, setHelpMenuMode] = useState<'add' | 'edit'>('add');
  const [helpMenuEditItem, setHelpMenuEditItem] = useState<typeof HELP_ITEMS[0] | null>(null);
  const [helpToggles, setHelpToggles] = useState<Record<string, boolean>>({
    Documents: true, 'Getting Started': true, "What's New": true,
    'Contact Support': true, About: true,
  });

  const [addFontModal, setAddFontModal] = useState(false);
  const [settingsToastVisible, setSettingsToastVisible] = useState(false);
  const showSettingsToast = () => { setSettingsToastVisible(true); setTimeout(() => setSettingsToastVisible(false), 2000); };

  const pageTabs = [
    { id: 'style', label: 'Style' },
    { id: 'chart', label: 'Chart' },
    { id: 'homepage', label: 'Homepage' },
    { id: 'email', label: 'Email' },
    ...(scope === 'primary-org' ? [] : [{ id: 'help', label: 'Help' }]),
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>

      {/* ── Reset confirm dialog ── */}
      {resetSection && (
        <ConfirmDialog
          title="Reset customisation"
          message={`This will reset the ${resetSection} to its default. Are you sure?`}
          confirmLabel="Reset"
          cancelLabel="Cancel"
          onConfirm={() => setResetSection(null)}
          onCancel={() => setResetSection(null)}
        />
      )}

      {/* Sticky page header — title + tabs */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '28px 40px 0', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
        <h1 style={{ margin: '0 0 16px 0', fontSize: '22px', fontWeight: 700, color: '#0F172A', fontFamily: font, letterSpacing: '-0.3px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Customisations
        </h1>
        <div style={{ width: '1px', height: '24px', backgroundColor: '#D1D5DB', margin: '0 24px 16px', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
          {pageTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0 14px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: font, fontSize: '13.5px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? brand : '#6B7280',
                borderBottom: activeTab === tab.id ? `2px solid ${brand}` : '2px solid transparent',
                marginBottom: '-1px', transition: 'color 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 40px 64px', boxSizing: 'border-box' }}>

        {activeTab === 'style' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card title="Application Logo (Default) & Favicon" description="Recommended size: 140px x 140 px." open={logoDefaultOpen} onToggle={() => setLogoDefaultOpen(!logoDefaultOpen)} rightAction={<ResetLink onClick={() => setResetSection('default logo and favicon')} />}>
              <ImageUploadArea />
            </Card>
            <Card title="Application Logo (Wide)" description="Recommended size: 230px x 45 px." open={logoWideOpen} onToggle={() => setLogoWideOpen(!logoWideOpen)} rightAction={<ResetLink onClick={() => setResetSection('wide logo')} />}>
              <ImageUploadArea />
            </Card>
            <Card title="Chart Text Styles" open={chartTextOpen} onToggle={() => setChartTextOpen(!chartTextOpen)} rightAction={<AddFontLink onClick={() => setAddFontModal(true)} />}>
              <DoubleDropdownRow label="Select fonts" value1="X-Axis Labels" options1={['X-Axis Labels', 'Y-Axis Labels', 'Chart Title', 'Legend', 'Data Labels']} value2={FONT_OPTIONS[0].label} options2={[]} fontMode />
            </Card>
            <Card title="Table Text Styles" open={tableTextOpen} onToggle={() => setTableTextOpen(!tableTextOpen)} rightAction={<AddFontLink onClick={() => setAddFontModal(true)} />}>
              <DoubleDropdownRow label="Select fonts" value1="Table Value cells" options1={['Table Value cells', 'Table Header cells', 'Table Footer']} value2={FONT_OPTIONS[0].label} options2={[]} fontMode />
            </Card>
            <Card title="Navigation Panel Colour" open={navColourOpen} onToggle={() => setNavColourOpen(!navColourOpen)} rightAction={<ResetLink onClick={() => setResetSection('navigation panel colour')} />}>
              <SettingRow label="Theme colour" control={<Dropdown value="Dark" options={['Dark', 'Light', 'Dual Tone']} width={311} />} />
            </Card>

            <Card title="Footer Text" open={footerTextOpen} onToggle={() => setFooterTextOpen(!footerTextOpen)} rightAction={<ResetLink onClick={() => setResetSection('footer text')} />}>
              <TextInputRow label="Text for embedded objects" placeholder="Enter Text" />
            </Card>
          </div>
        )}

        {/* ── Chart tab ── */}
        {activeTab === 'chart' && (
          <div style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>

            {/* Inner sub-tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', padding: '0 24px' }}>
              {([
                { id: 'palettes',       label: 'Chart Colour Palettes' },
                { id: 'custom-charts',  label: 'Custom Charts' },
                { id: 'custom-maps',    label: 'Custom Maps' },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setChartInnerTab(tab.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '16px 20px 14px', marginBottom: '-1px',
                    fontFamily: font, fontSize: '14px',
                    fontWeight: chartInnerTab === tab.id ? 600 : 400,
                    color: chartInnerTab === tab.id ? brand : '#6B7280',
                    borderBottom: chartInnerTab === tab.id ? `2px solid ${brand}` : '2px solid transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Chart Colour Palettes ── */}
            {chartInnerTab === 'palettes' && (
              <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Subtitle + Reset */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13.5px', color: '#6B7280', fontFamily: font }}>
                    For optimal display, choose your custom chart colour palettes.
                  </span>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: font, fontSize: '13.5px', fontWeight: 500, color: brand, padding: 0 }}>
                    Reset to default
                  </button>
                </div>

                {/* Primary colours */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827', fontFamily: font, width: '160px', flexShrink: 0 }}>
                    Primary colours
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    {PRIMARY_COLORS.map((c, i) => <ColorSwatch key={i} color={c} />)}
                  </div>
                </div>

                {/* Secondary Colors */}
                <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827', fontFamily: font, width: '160px', flexShrink: 0, paddingTop: '6px' }}>
                      Secondary Colors
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      {SECONDARY_COLORS.map((row, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px' }}>
                          {row.map((c, j) => <ColorSwatch key={j} color={c} />)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <Checkbox label="Disable Colour Rotation" checked={disableColourRotation} onChange={() => setDisableColourRotation(!disableColourRotation)} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Custom Charts ── */}
            {chartInnerTab === 'custom-charts' && (
              <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Description + Add button on same row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13.5px', color: '#6B7280', fontFamily: font }}>
                    Add and manage custom chart types available to your users.
                  </span>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font, fontSize: '13px', fontWeight: 600, color: brand, padding: 0, flexShrink: 0, marginLeft: '16px' }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke={brand} strokeWidth="1.6" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke={brand} strokeWidth="1.6" strokeLinecap="round"/></svg>
                    Add chart
                  </button>
                </div>
                {/* Table */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 70px 80px', padding: '12px 20px', borderBottom: '1px solid #E5E7EB' }}>
                    {['Chart Name', 'Created by', 'Last Modified', '', ''].map((h, idx) => (
                      <span key={idx} style={{ fontSize: '12.5px', fontWeight: 500, color: '#9CA3AF', fontFamily: font }}>{h}</span>
                    ))}
                  </div>
                  {/* Rows */}
                  {[
                    { name: 'Muze studio', author: 'Anje Keizer', date: '2 days ago' },
                    { name: 'Gauge',       author: 'Anje Keizer', date: '2 days ago' },
                  ].map((row, i, arr) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 70px 80px', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <span style={{ fontSize: '13.5px', color: '#111827', fontFamily: font, padding: '14px 20px' }}>{row.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px 14px 0' }}>
                        <ChartAvatar />
                        <span style={{ fontSize: '13.5px', color: '#374151', fontFamily: font }}>{row.author}</span>
                      </div>
                      <span style={{ fontSize: '13.5px', color: '#6B7280', fontFamily: font, padding: '14px 20px 14px 0' }}>{row.date}</span>
                      <button style={{ border: 'none', borderLeft: '1px solid #F3F4F6', background: 'none', fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer', padding: '14px 0', textAlign: 'center' }}>Edit</button>
                      <button style={{ border: 'none', borderLeft: '1px solid #F3F4F6', background: 'none', fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer', padding: '14px 20px 14px 0', textAlign: 'center' }}>Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Custom Maps ── */}
            {chartInnerTab === 'custom-maps' && (
              <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Description + Add button on same row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13.5px', color: '#6B7280', fontFamily: font }}>
                    For optimal display, choose your custom chart colour palettes.
                  </span>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font, fontSize: '13px', fontWeight: 600, color: brand, padding: 0, flexShrink: 0, marginLeft: '16px' }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke={brand} strokeWidth="1.6" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke={brand} strokeWidth="1.6" strokeLinecap="round"/></svg>
                    Add maps
                  </button>
                </div>
                {/* Table */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 70px 80px', padding: '12px 20px', borderBottom: '1px solid #E5E7EB' }}>
                    {['Map Name', 'Created by', 'Last Modified', '', ''].map((h, idx) => (
                      <span key={idx} style={{ fontSize: '12.5px', fontWeight: 500, color: '#9CA3AF', fontFamily: font }}>{h}</span>
                    ))}
                  </div>
                  {/* Rows */}
                  {Array(8).fill({ name: 'Germany', author: 'Anje Keizer', date: '2 days ago' }).map((row, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 70px 80px', alignItems: 'center', borderBottom: i < 7 ? '1px solid #F3F4F6' : 'none' }}>
                      <span style={{ fontSize: '13.5px', color: '#111827', fontFamily: font, padding: '14px 20px' }}>{row.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px 14px 0' }}>
                        <ChartAvatar />
                        <span style={{ fontSize: '13.5px', color: '#374151', fontFamily: font }}>{row.author}</span>
                      </div>
                      <span style={{ fontSize: '13.5px', color: '#6B7280', fontFamily: font, padding: '14px 20px 14px 0' }}>{row.date}</span>
                      <button style={{ border: 'none', borderLeft: '1px solid #F3F4F6', background: 'none', fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer', padding: '14px 0', textAlign: 'center' }}>Edit</button>
                      <button style={{ border: 'none', borderLeft: '1px solid #F3F4F6', background: 'none', fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer', padding: '14px 20px 14px 0', textAlign: 'center' }}>Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Homepage tab ── */}
        {activeTab === 'homepage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card
              title="Manage custom alert banner"
              description="When enabled, the alert banner will display across all pages in all your organisations."
              open={bannerOpen}
              onToggle={() => setBannerOpen(!bannerOpen)}
            >
              <SimpleRow
                label="Custom banner"
                control={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Toggle
                      checked={customBanner}
                      onChange={() => {
                        if (!customBanner) {
                          setCustomBanner(true);
                          setEditAlertModal(true);
                        } else {
                          setCustomBanner(false);
                          setBannerConfigured(false);
                        }
                      }}
                    />
                    {bannerConfigured && (
                      <span onClick={() => setEditAlertModal(true)} style={{ cursor: 'pointer' }}>
                        <TextLink label="Edit" />
                      </span>
                    )}
                  </div>
                }
              />

            </Card>

            <Card title="Customise homepage" description="Recommended size: 230px x 45 px." open={customiseHomepageOpen} onToggle={() => setCustomiseHomepageOpen(!customiseHomepageOpen)} rightAction={<span onClick={() => setCustomiseHomepageModal(true)}><TextLink label="Edit" /></span>}>
              {([
                ['announcement', 'Announcement'],
                ['spotter',      'Spotter'],
                ['watchlist',    'Watchlist'],
                ['library',      'Library'],
                ['trending',     'Trending'],
                ['learning',     'Learning'],
                ['favourites',   'Favourites'],
              ] as [string, string][]).map(([key, label]) => (
                <SimpleRow
                  key={key}
                  label={label}
                  dimmed={!homepageItems[key]}
                  extraAction={key === 'announcement' ? <TextLink label="Customise" /> : undefined}
                  control={<Toggle checked={homepageItems[key]} onChange={() => setHomepageItems({ ...homepageItems, [key]: !homepageItems[key] })} />}
                />
              ))}
            </Card>

            <Card title="Translate Liveboards & Answers" open={translateOpen} onToggle={() => setTranslateOpen(!translateOpen)}>
              <SimpleRow
                label="Auto-translate Liveboards and Answers"
                description="Automatically translate metadata of Liveboards and Answers such as titles, descriptions, tab names etc. into each user's preferred language."
                learnMore
                control={<Toggle checked={autoTranslate} onChange={() => setAutoTranslate(!autoTranslate)} />}
              />
              <SimpleRow
                label="Translate Liveboards and Answers based on CSV file"
                description="Translate meta-data of Liveboards and Answers such as titles, descriptions, tab names etc. into each user's preferred language based on the CSV translations uploaded by the Admin."
                learnMore
                control={<Toggle checked={csvTranslate} onChange={() => setCsvTranslate(!csvTranslate)} />}
              />
            </Card>
          </div>
        )}

        {/* ── Email tab ── */}
        {activeTab === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card
              title="Email customisations"
              description="Manage the common appearance settings applied to all your customer emails"
              open={emailOpen}
              onToggle={() => setEmailOpen(!emailOpen)}
              rightAction={<span onClick={() => {}}><TextLink label="Edit" /></span>}
            >
              {/* Logo */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827', fontFamily: font }}>Logo</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ fontSize: '13px', color: '#9CA3AF', fontFamily: font }}>Same as styling</span>
                    {/* Coca-Cola logo */}
                    <div style={{ fontFamily: '"Georgia", "Times New Roman", serif', fontStyle: 'italic', fontWeight: 900, fontSize: '22px', color: '#E61D2B', letterSpacing: '-0.5px', lineHeight: 1 }}>
                      Coca-Cola
                    </div>
                  </div>
                </div>
              </div>

              {/* Button color + Button text color + View KPI preview */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827', fontFamily: font }}>Button color</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#1F2937', borderRadius: '3px', border: '1px solid #D1D5DB', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#374151', fontFamily: font }}>#E61D2B (Default)</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827', fontFamily: font }}>Button text color</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#FFFFFF', borderRadius: '3px', border: '1.5px solid #D1D5DB', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#374151', fontFamily: font }}>#E61D2B (Default)</span>
                  </div>
                </div>
                <div style={{ padding: '14px 20px' }}>
                  <button style={{ height: '36px', padding: '0 28px', borderRadius: '20px', border: 'none', backgroundColor: '#1F2937', color: '#FFFFFF', fontSize: '13.5px', fontWeight: 600, fontFamily: font, cursor: 'default', letterSpacing: '0.01em' }}>
                    View KPI
                  </button>
                </div>
              </div>

              {/* Primary content background color + KPI tile */}
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827', fontFamily: font }}>Primary content background color</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: '#FFFFFF', borderRadius: '3px', border: '1.5px solid #D1D5DB', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#374151', fontFamily: font }}>#E61D2B (Default)</span>
                  </div>
                </div>
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '16px 24px', display: 'flex', alignItems: 'stretch', gap: '24px', maxWidth: '420px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#166534', fontFamily: font, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>CURRENT (1/12/23)</div>
                      <div style={{ fontSize: '44px', fontWeight: 800, color: '#14532D', fontFamily: font, lineHeight: 1 }}>88.2M</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#166534', fontFamily: font, textTransform: 'uppercase', letterSpacing: '0.06em' }}>% CHANGE</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#166534', fontFamily: font, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          20.74%
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 10V3M3.5 6L6.5 3l3 3" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#166534', fontFamily: font, textTransform: 'uppercase', letterSpacing: '0.06em' }}>LAST (12/29/22)</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#166534', fontFamily: font }}>79.9M</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product name */}
              <EmailShownRow label="Product name">
                <div style={{ display: 'inline-flex', alignItems: 'center', height: '28px', padding: '0 14px', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '20px' }}>
                  <span style={{ fontSize: '12.5px', color: '#6B7280', fontFamily: font }}>&lt;Product name&gt;</span>
                </div>
              </EmailShownRow>

              {/* Phone number */}
              <EmailShownRow label="Phone number">
                <div style={{ display: 'inline-flex', alignItems: 'center', height: '28px', padding: '0 14px', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '20px' }}>
                  <span style={{ fontSize: '12.5px', color: '#6B7280', fontFamily: font }}>&lt;8795867721&gt;</span>
                </div>
              </EmailShownRow>

              {/* Address */}
              <EmailShownRow label="Address">
                <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', fontFamily: font }}>Thoughtspot</span>
                  <span style={{ fontSize: '12.5px', color: '#6B7280', fontFamily: font }}>(800) 508-7008</span>
                  <span style={{ fontSize: '12.5px', color: '#6B7280', fontFamily: font }}>444 Castro St, Suite 1000 Mountain View, CA 94041</span>
                </div>
              </EmailShownRow>

              {/* Mobile app nudge */}
              <EmailShownRow label="Mobile app nudge">
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#F9FAFB' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', fontFamily: font, marginBottom: '6px' }}>Want data at your fingertips?</div>
                    <div style={{ fontSize: '12.5px', color: '#6B7280', fontFamily: font, lineHeight: 1.5, marginBottom: '10px' }}>Scan the QR code to download the latest ThoughtSpot mobile app on your phone.</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ backgroundColor: '#111827', color: '#fff', borderRadius: '6px', padding: '6px 12px', fontSize: '10px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.3, fontFamily: font }}>
                        <span style={{ fontSize: '8px' }}>Download on the</span><span>App Store</span>
                      </div>
                      <div style={{ backgroundColor: '#111827', color: '#fff', borderRadius: '6px', padding: '6px 12px', fontSize: '10px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.3, fontFamily: font }}>
                        <span style={{ fontSize: '8px' }}>GET IT ON</span><span>Google Play</span>
                      </div>
                    </div>
                  </div>
                  {/* Phone illustration */}
                  <div style={{ width: '68px', height: '90px', background: 'linear-gradient(160deg, #6366F1 0%, #8B5CF6 100%)', borderRadius: '14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="28" height="44" viewBox="0 0 28 44" fill="none"><rect x="2" y="2" width="24" height="40" rx="5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/><line x1="9" y1="6" x2="19" y2="6" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/><circle cx="14" cy="38" r="2" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/><rect x="6" y="12" width="16" height="18" rx="2" fill="rgba(255,255,255,0.15)"/></svg>
                  </div>
                </div>
              </EmailShownRow>

              {/* Error message */}
              <EmailShownRow label="Error message">
                <div style={{ display: 'inline-flex', alignItems: 'center', height: '28px', padding: '0 14px', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '20px' }}>
                  <span style={{ fontSize: '12.5px', color: '#6B7280', fontFamily: font }}>&lt;Error message&gt;</span>
                </div>
              </EmailShownRow>

              {/* Toggle-only rows */}
              <EmailDotRow label="Modify alert" />
              <EmailDotRow label="Unsubscribe link" />

              {/* Value rows */}
              <ValueRow label="Company signature" value="444 Castro St, Suite 1000 Mountain View, C..." />
              <ValueRow label="Privacy policy" value="https://www.thoughtspot.com/privacy-stat..." />
              <ValueRow label="Contact support" value="https://www.thoughtspot.com/support" />
              <EmailDotRow label="Manage notification preferences" />
              <ValueRow label="Company website URL" value="https://www.thoughtspot.com" />
            </Card>
          </div>
        )}

        {/* ── Help tab ── */}
        {activeTab === 'help' && (
          <div style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>List of help menu items</span>
              <button onClick={() => { setHelpMenuMode('add'); setHelpMenuEditItem(null); setHelpMenuItemModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font, fontSize: '13px', fontWeight: 600, color: brand, padding: 0 }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="12" stroke={brand} strokeWidth="1.6" strokeLinecap="round"/><line x1="1" y1="6.5" x2="12" y2="6.5" stroke={brand} strokeWidth="1.6" strokeLinecap="round"/></svg>
                Add menu item
              </button>
            </div>
            {/* Table */}
            <div style={{ padding: '16px' }}>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '80px 2fr 1.5fr 3fr 140px', padding: '12px 20px', borderBottom: '1px solid #E5E7EB' }}>
                  {['Status', 'Menu item label', 'Custom icon', 'Item URL', 'Action'].map((h) => (
                    <span key={h} style={{ fontSize: '12.5px', fontWeight: 400, color: '#9CA3AF', fontFamily: font }}>{h}</span>
                  ))}
                </div>
                {/* Rows */}
                {HELP_ITEMS.map((item, i) => (
                  <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '80px 2fr 1.5fr 3fr 140px', padding: '20px 20px', alignItems: 'center', borderBottom: i < HELP_ITEMS.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                    <Toggle checked={helpToggles[item.label]} onChange={() => { setHelpToggles({ ...helpToggles, [item.label]: !helpToggles[item.label] }); showSettingsToast(); }} />
                    <span style={{ fontSize: '13.5px', color: '#111827', fontFamily: font }}>{item.label}</span>
                    <HelpMenuIcon type={item.icon} />
                    <span style={{ fontSize: '13px', color: brand, fontFamily: font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <button onClick={() => { setHelpMenuMode('edit'); setHelpMenuEditItem(item); setHelpMenuItemModal(true); }} style={{ border: 'none', background: 'none', fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer', padding: 0 }}>Edit</button>
                      <button style={{ border: 'none', background: 'none', fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, cursor: 'pointer', padding: 0 }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {helpMenuItemModal && <HelpMenuItemModal mode={helpMenuMode} item={helpMenuEditItem ?? undefined} onClose={() => setHelpMenuItemModal(false)} onSave={() => { setHelpMenuItemModal(false); showSettingsToast(); }} />}

      </div>
      </div>

      {/* ── Modals ── */}
      {customiseHomepageModal && (
        <CustomiseHomepageModal
          toggles={homepageItems}
          onToggle={(key) => setHomepageItems({ ...homepageItems, [key]: !homepageItems[key] })}
          onClose={() => setCustomiseHomepageModal(false)}
        />
      )}

      {editAlertModal && (
        <Modal
          isOpen
          size="M1"
          title="Edit alert banner"
          onClose={() => setEditAlertModal(false)}
          footer={
            <ModalFooter
              secondaryAction={<Button variant="secondary" onClick={() => setEditAlertModal(false)}>Cancel</Button>}
              primaryAction={<Button variant="primary" onClick={() => { setBannerConfigured(true); setEditAlertModal(false); showSettingsToast(); }}>Save</Button>}
            />
          }
        >
          <div style={{ padding: '16px 0' }}>
            <p style={{ margin: 0, fontSize: 14, color: '#6B7280', fontFamily: font }}>Configure your custom alert banner message and appearance.</p>
          </div>
        </Modal>
      )}

      {addFontModal && (
        <AddNewFontModal
          onClose={() => setAddFontModal(false)}
          onConfirm={() => { setAddFontModal(false); showSettingsToast(); }}
        />
      )}

      {settingsToastVisible && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#111827', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontFamily: font, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          Settings saved
        </div>
      )}

      <style>{`
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ─── Standalone prototype (with its own AppShell) ─────────────────────────────

export const Customisation: React.FC = () => {
  const [sidebarTab, setSidebarTab] = useState<SidebarTabId>('admin');
  const [sidebarNav, setSidebarNav] = useState('customisation');

  const scopeToggle: ScopeToggle = {
    options: [
      { id: 'all-orgs', label: 'All Orgs' },
      { id: 'primary-org', label: 'Primary Org' },
    ],
    activeId: 'all-orgs',
    onChange: () => {},
  };

  const headerProps: GlobalHeaderProps = {
    searchPlaceholder: 'Search in your library',
    userName: 'Primary',
    notificationCount: 1,
    showHamburger: false,
  };

  const sidebarProps: AppSidebarProps = {
    tabs: SIDEBAR_TABS,
    activeTab: sidebarTab,
    onTabChange: (tabId) => { setSidebarTab(tabId as SidebarTabId); setSidebarNav(''); },
    categories: SIDEBAR_CATEGORIES,
    selectedNav: sidebarNav,
    onNavSelect: setSidebarNav,
    ...(sidebarTab === 'admin' ? { scopeToggle } : {}),
  };

  return (
    <AppShell headerProps={headerProps} sidebarProps={sidebarProps} contentBackground="#FFFFFF" style={{ height: '100vh' }}>
      <CustomisationPageContent />
    </AppShell>
  );
};

export default Customisation;
