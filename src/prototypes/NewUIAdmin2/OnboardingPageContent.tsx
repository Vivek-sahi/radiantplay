import React, { useState } from 'react';
import { systemColors } from '../../tokens/colors';
import { ConfirmDialog } from './ConfirmDialog';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const brand = systemColors.light['content-brand'];

// ─── Toggle ───────────────────────────────────────────────────────────────────

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    role="switch"
    aria-checked={checked}
    style={{
      position: 'relative', width: '36px', height: '20px',
      borderRadius: '10px', border: 'none',
      backgroundColor: checked ? brand : '#D1D5DB',
      cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background-color 0.2s',
    }}
  >
    <span style={{
      position: 'absolute', top: '3px',
      left: checked ? '19px' : '3px',
      width: '14px', height: '14px',
      borderRadius: '50%', backgroundColor: '#FFFFFF',
      transition: 'left 0.2s', display: 'block',
    }} />
  </button>
);

// ─── TextRow — label + text input ────────────────────────────────────────────

const TextRow: React.FC<{ label: string; placeholder?: string; defaultValue?: string }> = ({
  label, placeholder, defaultValue = '',
}) => {
  const [value, setValue] = useState(defaultValue);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '32px', padding: '14px 20px',
      backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px',
    }}>
      <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#111827', fontFamily: font, flexShrink: 0, minWidth: '200px' }}>
        {label}
      </div>
      <input
        type="text"
        value={value}
        placeholder={placeholder ?? label}
        onChange={(e) => setValue(e.target.value)}
        style={{
          flex: 1, height: '34px', padding: '0 10px',
          border: '1px solid #D1D5DB', borderRadius: '6px',
          fontFamily: font, fontSize: '13px', color: '#111827',
          outline: 'none', backgroundColor: '#FFFFFF',
          maxWidth: '380px',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
      />
    </div>
  );
};

// ─── ToggleRow — label + toggle ───────────────────────────────────────────────

const ToggleRow: React.FC<{ label: string; defaultEnabled?: boolean }> = ({ label, defaultEnabled = false }) => {
  const [enabled, setEnabled] = useState(defaultEnabled);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '32px', padding: '14px 20px',
      backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px',
    }}>
      <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#111827', fontFamily: font }}>
        {label}
      </div>
      <Toggle checked={enabled} onChange={() => setEnabled(!enabled)} />
    </div>
  );
};

// ─── ResetLink ────────────────────────────────────────────────────────────────

const ResetLink: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <button onClick={onClick} style={{
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: font, fontSize: '13px', fontWeight: 500,
    color: '#6B7280', textDecoration: 'underline', padding: '0',
  }}>
    Reset
  </button>
);

// ─── CollapsibleSection ───────────────────────────────────────────────────────

const CollapsibleSection: React.FC<{
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  onReset?: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, defaultOpen = true, onReset, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const multi = React.Children.count(children) > 1;
  const isOpen = multi ? open : true;
  return (
    <div style={{
      backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB',
      borderRadius: '12px', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: isOpen ? '1px solid #E5E7EB' : 'none',
        cursor: multi ? 'pointer' : 'default',
      }} onClick={() => { if (multi) setOpen(!open); }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {multi && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{ flexShrink: 0, transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s ease' }}>
              <path d="M3 5.5l4 4 4-4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: '12.5px', color: '#6B7280', fontFamily: font, marginTop: '2px' }}>{subtitle}</div>
            )}
          </div>
        </div>
        {onReset && (
          <div onClick={(e) => e.stopPropagation()}>
            <ResetLink onClick={onReset} />
          </div>
        )}
      </div>

      {/* Content */}
      {isOpen && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ─── OnboardingPageContent ────────────────────────────────────────────────────

export const OnboardingPageContent: React.FC = () => {
  const [resetSection, setResetSection] = useState<string | null>(null);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>

      {/* ── Reset confirm dialog ── */}
      {resetSection && (
        <ConfirmDialog
          title="Reset settings"
          message={`This will reset ${resetSection} to its defaults. Are you sure?`}
          confirmLabel="Reset"
          cancelLabel="Cancel"
          onConfirm={() => setResetSection(null)}
          onCancel={() => setResetSection(null)}
        />
      )}

      {/* ── Sticky header ── */}
      <div style={{
        flexShrink: 0, padding: '28px 40px 20px',
        borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF',
      }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0F172A', fontFamily: font, letterSpacing: '-0.3px' }}>
          Onboarding
        </h1>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 40px 64px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Email settings */}
            <CollapsibleSection
              title="Email settings"
              subtitle="Customise email notifications sent to your users."
              defaultOpen
              onReset={() => setResetSection('email settings')}
            >
              <ToggleRow label="Welcome emails" defaultEnabled />
              <TextRow label="Company name" defaultValue="ThoughtSpot" />
              <TextRow label="Custom admin email" placeholder="admin@company.com" />
              <TextRow label="From ID" placeholder="no-reply@company.com" />
              <TextRow label="Support email ID" placeholder="support@company.com" />
              <TextRow label="'Learn More' link" placeholder="https://docs.thoughtspot.com" />
              <TextRow label="Product name" defaultValue="ThoughtSpot" />
              <TextRow label="'Get started' link" placeholder="https://thoughtspot.com/get-started" />
              <TextRow label="Custom message" placeholder="Welcome to ThoughtSpot!" />
              <ToggleRow label="Signup" />
              <TextRow label="Signup button text" defaultValue="Sign up" />
              <TextRow label="Signup button link" placeholder="https://thoughtspot.com/signup" />
            </CollapsibleSection>

          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPageContent;
