import React, { useState, useRef, useEffect } from 'react';
import { systemColors, referenceColors, rdComponentColors } from '../../tokens/colors';
import { ConfirmDialog } from './ConfirmDialog';
import { RdModal } from '@components/RdModal';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const brand = systemColors.light['content-brand'];

// ─── Toggle ───────────────────────────────────────────────────────────────────

const Toggle: React.FC<{ checked: boolean; onChange: () => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button
    onClick={disabled ? undefined : onChange}
    role="switch" aria-checked={checked} aria-disabled={disabled}
    style={{
      position: 'relative', width: '36px', height: '20px', borderRadius: '10px',
      border: 'none',
      backgroundColor: checked ? (disabled ? `${brand}80` : brand) : referenceColors.gray['30'],
      cursor: disabled ? 'not-allowed' : 'pointer',
      padding: 0, flexShrink: 0, transition: 'background-color 0.2s ease',
      opacity: disabled ? 0.6 : 1,
    }}
  >
    <span style={{
      position: 'absolute', top: '2px', left: checked ? '18px' : '2px',
      width: '16px', height: '16px', borderRadius: '50%',
      backgroundColor: '#fff', transition: 'left 0.2s ease',
      boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
    }} />
  </button>
);

// ─── Dropdown ────────────────────────────────────────────────────────────────

const Dropdown: React.FC<{ value: string; options: string[]; width?: number; onChange?: (val: string) => void }> = ({
  value: initialValue, options, width = 280, onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(initialValue);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width });

  useEffect(() => { setSelected(initialValue); }, [initialValue]);
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

  return (
    <div ref={ref} style={{ position: 'relative', width, flexShrink: 0 }}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', height: '36px', padding: '0 12px',
          border: `1px solid ${open ? brand : '#D1D5DB'}`, borderRadius: '6px',
          backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: font,
          fontSize: '13px', color: '#111827', outline: 'none', textAlign: 'left',
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
            <button key={opt} onClick={() => { setSelected(opt); setOpen(false); onChange?.(opt); }}
              style={{
                display: 'block', width: '100%', padding: '10px 16px',
                border: 'none', textAlign: 'left', fontFamily: font, fontSize: '13px',
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

// ─── Toast ───────────────────────────────────────────────────────────────────

const Toast: React.FC<{ message: string; cta?: string; onCta?: () => void; onClose: () => void }> = ({ message, cta, onCta, onClose }) => (
  <div style={{
    position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', alignItems: 'center', gap: '16px',
    backgroundColor: '#1F2937', color: '#FFFFFF',
    padding: '12px 20px', borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.20)',
    fontFamily: font, fontSize: '13.5px', fontWeight: 500,
    zIndex: 10002, whiteSpace: 'nowrap' as const,
  }}>
    <span>{message}</span>
    {cta && (
      <button onClick={onCta} style={{
        border: 'none', background: 'none', cursor: 'pointer',
        color: brand, fontFamily: font, fontSize: '13.5px', fontWeight: 600, padding: 0,
      }}>{cta}</button>
    )}
    <button onClick={onClose} style={{
      border: 'none', background: 'none', cursor: 'pointer',
      color: '#9CA3AF', fontFamily: font, fontSize: '18px', lineHeight: 1, padding: 0, marginLeft: '4px',
    }}>×</button>
  </div>
);

// ─── SettingRow ───────────────────────────────────────────────────────────────

const SettingRow: React.FC<{
  label: string;
  description?: string;
  control: React.ReactNode;
}> = ({ label, description, control }) => (
  <div style={{
    display: 'flex', alignItems: description ? 'flex-start' : 'center',
    justifyContent: 'space-between', gap: '32px', padding: '18px 24px',
    backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px',
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', fontFamily: font, lineHeight: 1.4 }}>
        {label}
      </div>
      {description && (
        <div style={{ fontSize: '12.5px', color: '#9CA3AF', fontFamily: font, marginTop: '3px', lineHeight: 1.5 }}>
          {description}
        </div>
      )}
    </div>
    <div style={{ flexShrink: 0, paddingTop: description ? '2px' : '0' }}>
      {control}
    </div>
  </div>
);

// ─── ResetLink ────────────────────────────────────────────────────────────────

const ResetLink: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <button onClick={onClick} style={{
    border: 'none', background: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font,
    padding: 0, lineHeight: 1, flexShrink: 0,
  }}>
    Reset
  </button>
);

// ─── LLMTable ────────────────────────────────────────────────────────────────

const LLM_ROWS = [
  { model: 'GPT 5.1',           provider: 'Azure OpenAI',      type: 'ThoughtSpot provided', services: 'Spotter, AI Answers', moreCount: 5, icon: 'openai'    },
  { model: 'GPT 5.1',           provider: 'Azure OpenAI',      type: 'ThoughtSpot provided', services: 'Lumos, Aurora',       moreCount: 0, icon: 'openai'    },
  { model: 'Claude Sonnet 4.5', provider: 'Azure OpenAI',      type: 'ThoughtSpot provided', services: 'AI Context',          moreCount: 0, icon: 'anthropic' },
  { model: 'Claude Sonnet 4.5', provider: 'Google Vertex AI',  type: 'ThoughtSpot provided', services: 'AI Context',          moreCount: 0, icon: 'anthropic' },
  { model: 'Gemini 3 Pro',      provider: 'Google Vertex AI',  type: 'ThoughtSpot provided', services: 'AI Context',          moreCount: 0, icon: 'gemini'    },
  { model: 'Gemini 3 Pro',      provider: 'Google Vertex AI',  type: 'ThoughtSpot provided', services: 'AI Context',          moreCount: 0, icon: 'gemini'    },
  { model: 'Gemini 3 Pro',      provider: 'Google Vertex AI',  type: 'ThoughtSpot provided', services: 'AI Context',          moreCount: 0, icon: 'gemini'    },
];

const ModelIcon: React.FC<{ type: string }> = ({ type }) => {
  if (type === 'openai') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#111827', flexShrink: 0 }}>
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.032.067L9.76 19.958a4.5 4.5 0 0 1-6.16-1.654zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.843-3.369 2.02-1.168a.076.076 0 0 1 .071 0l4.83 2.786a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.402-.676zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
    </svg>
  );
  if (type === 'anthropic') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#D97559" style={{ flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
      <path d="M13.827 3.52h-3.654L6 20.48h3.654l4.173-16.96zm-7.327 0H3L6.413 12 3 20.48h3.5L10.24 12 6.5 3.52zm14.654 0H17.5L13.76 12l3.74 8.48H21L17.587 12 21.154 3.52z"/>
    </svg>
  );
  // gemini — proper multicolor 4-point star
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C11.5 6.5 9.5 10 2 12C9.5 14 11.5 17.5 12 22C12.5 17.5 14.5 14 22 12C14.5 10 12.5 6.5 12 2Z" fill="url(#geminiGrad)"/>
      <defs>
        <linearGradient id="geminiGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4285F4"/>
          <stop offset="33%" stopColor="#EA4335"/>
          <stop offset="66%" stopColor="#FBBC04"/>
          <stop offset="100%" stopColor="#34A853"/>
        </linearGradient>
      </defs>
    </svg>
  );
};

const MORE_SERVICES = ['SpotIQ', 'AI Highlights', 'AI Narratives', 'Smart Suggestions', 'Sage'];

const LLMTable: React.FC = () => {
  const [popoverAnchor, setPopoverAnchor] = useState<{ top: number; left: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverAnchor(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMoreClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverAnchor(popoverAnchor ? null : { top: rect.bottom + 6, left: rect.left });
  };

  const thStyle: React.CSSProperties = {
    fontSize: '13px', color: '#6B7280', fontWeight: 400, fontFamily: font,
    padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
  };
  const tdStyle: React.CSSProperties = {
    fontSize: '14px', color: '#111827', fontFamily: font,
    padding: '20px 16px', borderBottom: '1px solid #E5E7EB', verticalAlign: 'middle',
  };

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '24%' }}>Model</th>
            <th style={{ ...thStyle, width: '22%' }}>Provider</th>
            <th style={{ ...thStyle, width: '22%' }}>Type</th>
            <th style={{ ...thStyle, width: '32%' }}>Services</th>
          </tr>
        </thead>
        <tbody>
          {LLM_ROWS.map((row, i) => (
            <tr key={i} style={{ backgroundColor: '#FFFFFF' }}>
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ModelIcon type={row.icon} />
                  <span>{row.model}</span>
                </div>
              </td>
              <td style={tdStyle}>{row.provider}</td>
              <td style={tdStyle}>{row.type}</td>
              <td style={tdStyle}>
                <span>{row.services}</span>
                {row.moreCount > 0 && (
                  <button onClick={handleMoreClick} style={{
                    border: 'none', background: 'none', cursor: 'pointer', padding: 0,
                    color: brand, fontWeight: 500, fontFamily: font, fontSize: '14px', marginLeft: '4px',
                  }}>
                    +{row.moreCount} more
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {popoverAnchor && (
        <div ref={popoverRef} style={{
          position: 'fixed', top: popoverAnchor.top, left: popoverAnchor.left,
          backgroundColor: '#FFFFFF', borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)', zIndex: 9999,
          minWidth: '200px', overflow: 'hidden',
        }}>
          {MORE_SERVICES.map((s) => (
            <div key={s} style={{
              padding: '14px 20px', fontFamily: font, fontSize: '14px',
              color: '#111827', borderBottom: '1px solid #F3F4F6',
            }}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── CollapsibleSection ───────────────────────────────────────────────────────
// Header: chevron + title (right-aligned Reset) + subtitle on next line

const CollapsibleSection: React.FC<{
  title: string;
  subtitle?: string | React.ReactNode;
  open: boolean;
  onToggle: () => void;
  showReset?: boolean;
  onReset?: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, open, onToggle, showReset = true, onReset, children }) => {
  const multi = React.Children.count(children) > 1;
  const isOpen = multi ? open : true;
  return (
  <div style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
    <div style={{ padding: '16px 24px 12px', borderBottom: isOpen ? '1px solid #E5E7EB' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {multi ? (
          <button onClick={onToggle} style={{
            display: 'flex', alignItems: 'center', gap: '8px', flex: 1,
            border: 'none', background: 'none', cursor: 'pointer', fontFamily: font, padding: 0, textAlign: 'left',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{ flexShrink: 0, transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.22s ease' }}>
              <path d="M3 5.5l4 4 4-4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>{title}</span>
          </button>
        ) : (
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font, flex: 1 }}>{title}</span>
        )}
        {showReset && <ResetLink onClick={onReset} />}
      </div>
      {subtitle && (
        <div style={{ fontSize: '12.5px', color: '#9CA3AF', fontFamily: font, marginTop: '4px', lineHeight: 1.6, paddingLeft: multi ? '22px' : '0px' }}>
          {subtitle}
        </div>
      )}
    </div>
    <div style={{ maxHeight: isOpen ? '3000px' : '0px', overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
      <div style={{ padding: '16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  </div>
  );
};

// ─── FlatSection ─────────────────────────────────────────────────────────────
// Non-collapsible card with title + subtitle + optional right action

const FlatSection: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, action, children }) => (
  <div style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
    <div style={{ padding: '16px 24px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid #E5E7EB' }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: '12.5px', color: '#9CA3AF', fontFamily: font, marginTop: '3px', lineHeight: 1.5 }}>{subtitle}</div>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
    <div style={{ padding: '16px 16px 16px' }}>{children}</div>
  </div>
);

// ─── Connector icons ──────────────────────────────────────────────────────────

const SnowflakeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="14" fill="#E8F6FD" />
    <g stroke="#29B5E8" strokeWidth="1.6" strokeLinecap="round">
      <line x1="14" y1="7" x2="14" y2="21" />
      <line x1="7" y1="14" x2="21" y2="14" />
      <line x1="9.1" y1="9.1" x2="18.9" y2="18.9" />
      <line x1="18.9" y1="9.1" x2="9.1" y2="18.9" />
      <line x1="14" y1="7" x2="12.3" y2="9" /><line x1="14" y1="7" x2="15.7" y2="9" />
      <line x1="14" y1="21" x2="12.3" y2="19" /><line x1="14" y1="21" x2="15.7" y2="19" />
      <line x1="7" y1="14" x2="9" y2="12.3" /><line x1="7" y1="14" x2="9" y2="15.7" />
      <line x1="21" y1="14" x2="19" y2="12.3" /><line x1="21" y1="14" x2="19" y2="15.7" />
    </g>
  </svg>
);

const SlackIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="14" fill="#F0EAF8" />
    <rect x="10" y="9" width="3" height="6" rx="1.5" fill="#611f69" />
    <rect x="10" y="17" width="3" height="3" rx="1.5" fill="#611f69" />
    <rect x="9" y="10" width="6" height="3" rx="1.5" fill="#36c5f0" />
    <rect x="17" y="10" width="3" height="3" rx="1.5" fill="#36c5f0" />
    <rect x="15" y="13" width="3" height="6" rx="1.5" fill="#2eb67d" />
    <rect x="15" y="9" width="3" height="3" rx="1.5" fill="#2eb67d" />
    <rect x="9" y="15" width="6" height="3" rx="1.5" fill="#ecb22e" />
    <rect x="17" y="15" width="3" height="3" rx="1.5" fill="#ecb22e" />
  </svg>
);

const JiraIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="14" fill="#E6EDFF" />
    <path d="M14 7L21 20H7L14 7Z" fill="none" stroke="#2684FF" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="14" cy="16.5" r="1.2" fill="#2684FF" />
    <line x1="14" y1="12" x2="14" y2="15" stroke="#2684FF" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const AsanaIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="14" fill="#FFE8E8" />
    <circle cx="14" cy="12" r="3" fill="#F06A6A" />
    <circle cx="9.5" cy="17" r="2.5" fill="#F06A6A" />
    <circle cx="18.5" cy="17" r="2.5" fill="#F06A6A" />
  </svg>
);

const LiveboardIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="14" fill="#F3F4F6" />
    <rect x="8" y="8" width="5" height="5" rx="1" fill="#9CA3AF" />
    <rect x="15" y="8" width="5" height="5" rx="1" fill="#9CA3AF" />
    <rect x="8" y="15" width="5" height="5" rx="1" fill="#9CA3AF" />
    <rect x="15" y="15" width="5" height="5" rx="1" fill="#9CA3AF" />
  </svg>
);

const WebsearchIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="14" fill="#F3F4F6" />
    <circle cx="14" cy="14" r="6" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
    <ellipse cx="14" cy="14" rx="2.5" ry="6" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
    <line x1="8" y1="14" x2="20" y2="14" stroke="#9CA3AF" strokeWidth="1.5" />
    <line x1="9" y1="11" x2="19" y2="11" stroke="#9CA3AF" strokeWidth="1" />
    <line x1="9" y1="17" x2="19" y2="17" stroke="#9CA3AF" strokeWidth="1" />
  </svg>
);

// ─── ConnectorCard ────────────────────────────────────────────────────────────

// ─── AddConnectorModal ────────────────────────────────────────────────────────

const AddConnectorModal: React.FC<{ onClose: () => void; onSave: () => void }> = ({ onClose, onSave }) => {
  const [authType, setAuthType] = useState('None');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMenuPos, setAuthMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const authButtonRef = useRef<HTMLButtonElement>(null);
  const authRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (authRef.current && !authRef.current.contains(e.target as Node)) setAuthOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const authOptions = ['None', 'OAuth', 'Bearer'];

  const handleAuthToggle = () => {
    if (!authOpen && authButtonRef.current) {
      const rect = authButtonRef.current.getBoundingClientRect();
      setAuthMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setAuthOpen(!authOpen);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '38px', padding: '0 12px',
    border: '1px solid #D1D5DB', borderRadius: '6px',
    fontFamily: font, fontSize: '13px', color: '#111827',
    outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF',
  };

  return (
    <RdModal
      size="M1"
      title="Add custom connector"
      onClose={onClose}
      cancelLabel="Cancel"
      onCancel={onClose}
      confirmLabel="Add"
      onConfirm={() => { onClose(); onSave(); }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Connector display name */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: font, marginBottom: '6px' }}>
            Connector display name
          </label>
          <input type="text" style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        {/* MCP URL */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', fontFamily: font, marginBottom: '6px' }}>
            MCP URL
          </label>
          <input type="text" style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Authentication type */}
        <div ref={authRef}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: authOpen ? brand : '#374151', fontFamily: font, marginBottom: '6px', transition: 'color 0.15s' }}>
            Authentication type
          </label>
          <button
            ref={authButtonRef}
            onClick={handleAuthToggle}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', height: '38px', padding: '0 12px',
              border: `1px solid ${authOpen ? brand : '#D1D5DB'}`, borderRadius: '6px',
              backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: font,
              fontSize: '13px', color: '#111827', outline: 'none',
              boxShadow: authOpen ? `0 0 0 2px ${brand}22` : 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box',
            }}
          >
            <span>{authType}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{ flexShrink: 0, transform: authOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
              <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {authOpen && (
            <div style={{
              position: 'fixed', top: authMenuPos.top, left: authMenuPos.left, width: authMenuPos.width,
              backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 10100, overflow: 'hidden',
            }}>
              {authOptions.map((opt) => (
                <button key={opt} onClick={() => { setAuthType(opt); setAuthOpen(false); }}
                  style={{
                    display: 'block', width: '100%', padding: '11px 16px',
                    border: 'none', textAlign: 'left', fontFamily: font, fontSize: '13px',
                    fontWeight: opt === authType ? 500 : 400,
                    color: opt === authType ? brand : '#111827',
                    backgroundColor: opt === authType ? `${brand}10` : 'transparent',
                    cursor: 'pointer', transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => { if (opt !== authType) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB'; }}
                  onMouseLeave={(e) => { if (opt !== authType) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </RdModal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const CONNECTORS = [
  { id: 'snowflake', name: 'Snowflake MCP agent', icon: <SnowflakeIcon /> },
  { id: 'slack', name: 'Slack', icon: <SlackIcon /> },
  { id: 'jira', name: 'Jira/Confluence', icon: <JiraIcon /> },
  { id: 'asana', name: 'Asana', icon: <AsanaIcon /> },
  { id: 'liveboard', name: 'Liveboard', icon: <LiveboardIcon /> },
  { id: 'websearch', name: 'Websearch', icon: <WebsearchIcon /> },
];

const ConnectorCard: React.FC<{ name: string; icon: React.ReactNode }> = ({ name, icon }) => {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (!menuOpen) setHovered(false); }}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 14px 14px 16px', borderRadius: '10px',
        border: `1px solid ${hovered || menuOpen ? '#D1D5DB' : '#E9EAEC'}`,
        backgroundColor: '#FFFFFF', position: 'relative', cursor: 'default',
        boxShadow: hovered || menuOpen ? '0 2px 8px rgba(0,0,0,0.07)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {icon}
      <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#111827', fontFamily: font, flex: 1 }}>
        {name}
      </span>

      {/* 3-dot menu — visible on hover */}
      {(hovered || menuOpen) && (
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: '28px', height: '28px', borderRadius: '6px', border: 'none',
              backgroundColor: menuOpen ? '#F3F4F6' : 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background-color 0.1s',
            }}
            onMouseEnter={(e) => { if (!menuOpen) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6'; }}
            onMouseLeave={(e) => { if (!menuOpen) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
          >
            {/* ··· three dots */}
            <svg width="16" height="4" viewBox="0 0 16 4" fill="none">
              <circle cx="2" cy="2" r="1.5" fill="#6B7280" />
              <circle cx="8" cy="2" r="1.5" fill="#6B7280" />
              <circle cx="14" cy="2" r="1.5" fill="#6B7280" />
            </svg>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', right: 0,
              backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden', minWidth: '120px',
            }}>
              {['Edit', 'Remove'].map((action) => (
                <button
                  key={action}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block', width: '100%', padding: '10px 16px',
                    border: 'none', textAlign: 'left', fontFamily: font, fontSize: '13px',
                    fontWeight: 400, color: action === 'Remove' ? '#EF4444' : '#111827',
                    backgroundColor: 'transparent', cursor: 'pointer', transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = action === 'Remove' ? '#FEF2F2' : '#F9FAFB'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                >
                  {action}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── SliderRow ────────────────────────────────────────────────────────────────

const SliderRow: React.FC<{
  label: string;
  description?: string;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  unit?: string;
}> = ({ label, description, min, max, step = 1, defaultValue, unit = '' }) => {
  const [value, setValue] = useState(defaultValue);
  return (
    <div style={{
      display: 'flex', alignItems: description ? 'flex-start' : 'center',
      justifyContent: 'space-between', gap: '32px', padding: '18px 24px',
      backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', fontFamily: font, lineHeight: 1.4 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: '12.5px', color: '#9CA3AF', fontFamily: font, marginTop: '4px', lineHeight: 1.6 }}>
            {description}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          style={{ width: '140px', accentColor: brand, cursor: 'pointer' }}
        />
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', fontFamily: font, minWidth: '52px', textAlign: 'right' }}>
          {value}{unit}
        </span>
      </div>
    </div>
  );
};

// ─── RadioGroup ───────────────────────────────────────────────────────────────

const RadioGroup: React.FC<{
  options: { id: string; label: string; description?: string }[];
  defaultValue: string;
}> = ({ options, defaultValue }) => {
  const [selected, setSelected] = useState(defaultValue);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {options.map((opt) => (
        <div key={opt.id} onClick={() => setSelected(opt.id)}
          style={{
            display: 'flex', alignItems: opt.description ? 'flex-start' : 'center',
            gap: '12px', padding: '14px 20px', backgroundColor: '#FFFFFF',
            border: `1px solid ${selected === opt.id ? brand : '#E9EAEC'}`,
            borderRadius: '8px', cursor: 'pointer',
            boxShadow: selected === opt.id ? `0 0 0 2px ${brand}22` : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        >
          <div style={{
            width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, marginTop: opt.description ? '2px' : '0',
            border: `2px solid ${selected === opt.id ? brand : '#D1D5DB'}`,
            backgroundColor: selected === opt.id ? brand : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.15s, background-color 0.15s',
          }}>
            {selected === opt.id && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} />}
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#111827', fontFamily: font }}>{opt.label}</div>
            {opt.description && (
              <div style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: font, marginTop: '3px', lineHeight: 1.5 }}>{opt.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── SectionLabel ─────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontSize: '11px', fontWeight: 700, color: '#6B7280', fontFamily: font,
    letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 4px 4px',
  }}>
    {children}
  </div>
);

// ─── AISettingsPageContent ────────────────────────────────────────────────────

export const AISettingsPageContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  // ── Modals ──
  const [addConnectorModal, setAddConnectorModal] = useState(false);
  const [disableAIModal, setDisableAIModal] = useState(false);
  const [llmModal, setLlmModal] = useState(false);
  const [spotterVersion, setSpotterVersion] = useState('Spotter 3');
  const [pendingSpotterVersion, setPendingSpotterVersion] = useState<string | null>(null);
  const [retentionPeriod, setRetentionPeriod] = useState('180 days');
  const [pendingRetention, setPendingRetention] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); };

  // ── Reset dialog ──
  const [resetSection, setResetSection] = useState<string | null>(null);

  // ── General tab — collapsible sections ──
  const [llmOpen, setLlmOpen] = useState(true);
  const [uxOpen, setUxOpen] = useState(true);
  const [otherOpen, setOtherOpen] = useState(true);

  // Configure user experience toggles
  const [coachingFromConvo, setCoachingFromConvo] = useState(true);
  const [sampleQuestions, setSampleQuestions] = useState(true);

  // Other AI features toggles
  const [aiNarratives, setAiNarratives] = useState(true);
  const [aiHighlights, setAiHighlights] = useState(true);
  const [memoryFromLiveboards, setMemoryFromLiveboards] = useState(true);

  // Data Models
  const [aiOnDataModels, setAiOnDataModels] = useState(true);

  // ── Spotter 3 tab ──
  const [spotterSectionOpen, setSpotterSectionOpen] = useState(true);
  const [spotterAccessOpen, setSpotterAccessOpen] = useState(true);
  const [spotterCapabilitiesOpen, setSpotterCapabilitiesOpen] = useState(true);
  const [spotterOnHomepage, setSpotterOnHomepage] = useState(true);
  const [spotterOnLiveboard, setSpotterOnLiveboard] = useState(true);
  const [autoMode, setAutoMode] = useState(true);
  const [enableConnectorsMCP, setEnableConnectorsMCP] = useState(true);
  const [enableChatHistory, setEnableChatHistory] = useState(true);

  // ── Spotter viz tab ──
  const [spotterVizOpen, setSpotterVizOpen] = useState(true);
  const [spotterVizOnLiveboard, setSpotterVizOnLiveboard] = useState(true);

  // ── Spotter Model tab ──
  const [spotterModelOnEditor, setSpotterModelOnEditor] = useState(true);

  const isSpotter3 = spotterVersion === 'Spotter 3';

  const pageTabs = [
    { id: 'general', label: 'General settings' },
    { id: 'spotter', label: 'Spotter' },
    { id: 'spotter-viz', label: 'Spotter Viz' },
    { id: 'spotter-model', label: 'Spotter Model' },
    { id: 'spotter-code', label: 'Spotter code' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>

      {/* ── LLM Connections modal (M4) ── */}
      {llmModal && (
        <RdModal size="M4" title="LLM Connections" onClose={() => setLlmModal(false)}>
          <LLMTable />
        </RdModal>
      )}

      {/* ── Disable AI search modal ── */}
      {disableAIModal && (
        <ConfirmDialog
          title="Disable AI search on all data models"
          message={
            <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>AI search will be disabled on all data models, excluding system generated models.</li>
              <li>AI query and fragments feedback will be stored and not be accessible while AI search is disabled.</li>
            </ul>
          }
          confirmLabel="Disable"
          cancelLabel="Cancel"
          onConfirm={() => { setDisableAIModal(false); showToast('AI search disabled on all data models.'); }}
          onCancel={() => setDisableAIModal(false)}
        />
      )}

      {/* ── Chat history retention modal ── */}
      {pendingRetention && (
        <ConfirmDialog
          title="Update retention period?"
          message={
            <span>
              This will permanently delete chat history older than{' '}
              <strong>&lt;{pendingRetention}&gt;</strong>{' '}
              retention period. You cannot undo this action.
            </span>
          }
          confirmLabel="Update"
          cancelLabel="Cancel"
          onConfirm={() => { setRetentionPeriod(pendingRetention); setPendingRetention(null); showToast('Changes saved.'); }}
          onCancel={() => setPendingRetention(null)}
        />
      )}

      {/* ── Spotter version modal ── */}
      {pendingSpotterVersion && (
        <ConfirmDialog
          title="Update Spotter version?"
          message={
            <span>
              Update to Spotter 3 to use more contextual data and generate higher-quality insights.{' '}
              <a href="#" style={{ color: brand, textDecoration: 'none', fontFamily: font }}>
                [Learn more]
              </a>
            </span>
          }
          confirmLabel="Update"
          cancelLabel="Cancel"
          onConfirm={() => { setSpotterVersion(pendingSpotterVersion!); setPendingSpotterVersion(null); showToast('Changes saved.'); }}
          onCancel={() => setPendingSpotterVersion(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast}
          cta="Refresh now"
          onCta={() => window.location.reload()}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Reset confirm dialog ── */}
      {resetSection && (
        <ConfirmDialog
          title="Reset settings"
          message={`This will reset all ${resetSection} to their defaults. Are you sure?`}
          confirmLabel="Reset"
          cancelLabel="Cancel"
          onConfirm={() => { setResetSection(null); showToast('Settings reset to defaults.'); }}
          onCancel={() => setResetSection(null)}
        />
      )}

      {/* ── Sticky header ── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center',
        height: '92px', padding: '0 40px', borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF', boxSizing: 'border-box',
      }}>
        <h1 style={{
          margin: 0, fontSize: '22px', fontWeight: 700,
          color: '#0F172A', fontFamily: font, letterSpacing: '-0.3px',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          AI settings
        </h1>
        <div style={{ width: '1px', height: '24px', backgroundColor: '#D1D5DB', margin: '0 24px', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, alignSelf: 'stretch' }}>
          {pageTabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center',
              padding: '0 14px', border: 'none', background: 'none',
              cursor: 'pointer', fontFamily: font, fontSize: '13.5px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? brand : '#6B7280',
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
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 40px 64px', boxSizing: 'border-box' }}>

          {/* ─────────── General settings tab ─────────── */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* LLM Configuration */}
              <div style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '18px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>LLM Configuration</div>
                    <div style={{ fontSize: '12.5px', color: '#9CA3AF', fontFamily: font, marginTop: '6px', lineHeight: 1.6 }}>
                      Manage LLM connections for your ThoughtSpot environment. If you want connect your own model, contact{' '}
                      <a href="#" style={{ color: brand, textDecoration: 'none' }}>ThoughtSpot support.</a>
                    </div>
                  </div>
                  <button onClick={() => setLlmModal(true)} style={{
                    height: '32px', padding: '0 18px', borderRadius: '999px', flexShrink: 0,
                    border: 'none', backgroundColor: rdComponentColors['button-secondary-default'],
                    cursor: 'pointer', fontFamily: font, fontSize: '13px', fontWeight: 500, color: '#374151',
                  }}>
                    View
                  </button>
                </div>
              </div>

              {/* Other AI features */}
              <CollapsibleSection
                title="Other AI features"
                open={otherOpen}
                onToggle={() => setOtherOpen(!otherOpen)}
                onReset={() => setResetSection('other AI feature settings')}
              >
                <SettingRow
                  label="AI Narratives for SpotIQ"
                  control={<Toggle checked={aiNarratives} onChange={() => setAiNarratives(!aiNarratives)} />}
                />
                <SettingRow
                  label="AI Highlights on Liveboard"
                  control={<Toggle checked={aiHighlights} onChange={() => setAiHighlights(!aiHighlights)} />}
                />
              </CollapsibleSection>

              {/* Data Models */}
              <FlatSection
                title="Data Models"
                subtitle="Enable AI on data models from the data workspace."
                action={
                  <button onClick={() => setDisableAIModal(true)} style={{
                    border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, padding: 0,
                    whiteSpace: 'nowrap' as const,
                  }}>
                    Disable AI on data models
                  </button>
                }
              >
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '18px 24px', backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px',
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>
                    AI on data models
                  </span>
                  <button style={{
                    border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, padding: 0,
                    display: 'flex', alignItems: 'center', gap: '5px',
                  }}>
                    Enable AI on data models
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 11L11 3M11 3H6M11 3V8" stroke={brand} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </FlatSection>

              {/* User privileges */}
              <FlatSection
                title="User privileges"
                subtitle="Assign privileges to user groups to ensure they can access AI search."
              >
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '18px 24px', backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px',
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>
                    Manage user groups for AI search
                  </span>
                  <button style={{
                    border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, padding: 0,
                    display: 'flex', alignItems: 'center', gap: '5px',
                  }}>
                    Manage user privileges
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 11L11 3M11 3H6M11 3V8" stroke={brand} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </FlatSection>

            </div>
          )}

          {/* ─────────── Spotter tab ─────────── */}
          {activeTab === 'spotter' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Spotter version — always visible */}
              <CollapsibleSection
                title="Spotter"
                open={spotterSectionOpen}
                onToggle={() => setSpotterSectionOpen(!spotterSectionOpen)}
                showReset={false}
              >
                <SettingRow
                  label="Spotter version"
                  description="Select the version of Spotter you want to use. For the best experience, Spotter 3 is recommended"
                  control={
                    <Dropdown
                      value={spotterVersion}
                      options={['Spotter 3', 'Spotter Agent (Spotter 2)', 'Spotter Classic (Spotter 1)', 'Sage / Ask Sage (Deprecated)']}
                      width={311}
                      onChange={(val) => { if (val !== spotterVersion) setPendingSpotterVersion(val); }}
                    />
                  }
                />
              </CollapsibleSection>

              {/* Sections below disabled when not Spotter 3 */}
              <div style={{ opacity: isSpotter3 ? 1 : 0.45, pointerEvents: isSpotter3 ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Choose where */}
                <CollapsibleSection
                  title="Choose where your users can access Spotter"
                  subtitle="Spotter is available on ThoughtSpot Homepage and Liveboard. Use this option to enable/disable Spotter in each surface."
                  open={spotterAccessOpen}
                  onToggle={() => setSpotterAccessOpen(!spotterAccessOpen)}
                  onReset={() => setResetSection('Spotter access settings')}
                >
                  <SettingRow
                    label="Spotter on homepage and left navigation"
                    control={<Toggle checked={spotterOnHomepage} onChange={() => setSpotterOnHomepage(!spotterOnHomepage)} />}
                  />
                  <SettingRow
                    label="Spotter on Liveboard"
                    control={<Toggle checked={spotterOnLiveboard} onChange={() => setSpotterOnLiveboard(!spotterOnLiveboard)} />}
                  />
                </CollapsibleSection>

                {/* Spotter connectors — only shown for Spotter 3 */}
                {isSpotter3 && (
                  <FlatSection
                    title="Spotter connectors"
                    subtitle="Add global third party connectors on Spotter."
                    action={
                      <button onClick={() => setAddConnectorModal(true)} style={{
                        height: '32px', padding: '0 14px', borderRadius: '999px',
                        border: 'none', backgroundColor: rdComponentColors['button-secondary-default'],
                        cursor: 'pointer', fontFamily: font, fontSize: '13px',
                        fontWeight: 500, color: '#374151',
                      }}>
                        Add custom connector
                      </button>
                    }
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {CONNECTORS.map((c) => (
                        <ConnectorCard key={c.id} name={c.name} icon={c.icon} />
                      ))}
                    </div>
                  </FlatSection>
                )}

                {/* Spotter 3 capabilities */}
                <CollapsibleSection
                  title="Spotter 3 capabilities"
                  subtitle="Enable optional features for Spotter 3. These capabilities will only work with Spotter 3"
                  open={spotterCapabilitiesOpen}
                  onToggle={() => setSpotterCapabilitiesOpen(!spotterCapabilitiesOpen)}
                  onReset={() => setResetSection('Spotter 3 capability settings')}
                >
                  <SettingRow
                    label="Auto-mode to automatically select a data model"
                    control={<Toggle checked={autoMode} onChange={() => setAutoMode(!autoMode)} />}
                  />
                  <SettingRow
                    label="Enable Connectors/MCP"
                    control={<Toggle checked={enableConnectorsMCP} onChange={() => setEnableConnectorsMCP(!enableConnectorsMCP)} />}
                  />
                  <SettingRow
                    label="Enable chat history"
                    control={<Toggle checked={enableChatHistory} onChange={() => setEnableChatHistory(!enableChatHistory)} />}
                  />

                  {/* Dashed separator with green dot */}
                  <div style={{ display: 'flex', alignItems: 'center', margin: '4px -8px' }}>
                    <div style={{ flex: 1, height: '1px', borderTop: '1.5px dashed #D1D5DB' }} />
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#22C55E', borderRadius: '50%', margin: '0 10px', flexShrink: 0 }} />
                    <div style={{ flex: 1, height: '1px', borderTop: '1.5px dashed #D1D5DB' }} />
                  </div>

                  <SettingRow
                    label="Chat history retention period"
                    description="Only applicable when chat history is enabled"
                    control={
                      <Dropdown
                        value={retentionPeriod}
                        options={['7 days', '30 days', '90 days', '180 days', '1 year']}
                        width={311}
                        onChange={(val) => { if (val !== retentionPeriod) setPendingRetention(val); }}
                      />
                    }
                  />
                </CollapsibleSection>

              </div>
            </div>
          )}

          {/* ─────────── Spotter Model tab ─────────── */}
          {activeTab === 'spotter-model' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FlatSection title="Spotter Model">
                <SettingRow
                  label="Spotter Model on data model editor"
                  control={<Toggle checked={spotterModelOnEditor} onChange={() => setSpotterModelOnEditor(!spotterModelOnEditor)} />}
                />
              </FlatSection>
            </div>
          )}

          {/* ─────────── Spotter viz tab ─────────── */}
          {activeTab === 'spotter-viz' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <CollapsibleSection
                title="SpotterViz"
                subtitle="SpotterViz is an early access feature available for creating and editing liveboards. Use this option to enable/disable it"
                open={spotterVizOpen}
                onToggle={() => setSpotterVizOpen(!spotterVizOpen)}
              >
                <SettingRow
                  label="SpotterViz on Liveboard"
                  control={<Toggle checked={spotterVizOnLiveboard} onChange={() => setSpotterVizOnLiveboard(!spotterVizOnLiveboard)} />}
                />
              </CollapsibleSection>
            </div>
          )}

          {/* ─────────── Spotter code tab ─────────── */}
          {activeTab === 'spotter-code' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '32px',
                border: `1.5px dashed ${brand}66`, borderRadius: '12px',
                padding: '36px 40px', maxWidth: '680px', width: '100%',
              }}>
                {/* Illustration */}
                <div style={{ flexShrink: 0, width: '96px', height: '96px', position: 'relative' }}>
                  <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
                    {/* Horizontal lines (document-like) */}
                    <rect x="34" y="18" width="32" height="4" rx="2" fill="#D1D5DB" />
                    <rect x="34" y="26" width="24" height="4" rx="2" fill="#D1D5DB" />
                    <rect x="34" y="34" width="28" height="4" rx="2" fill="#D1D5DB" />
                    {/* Dot grid */}
                    {[0,1,2,3].map(row => [0,1,2,3].map(col => (
                      <circle key={`${row}-${col}`} cx={18 + col * 6} cy={50 + row * 6} r="1.5" fill="#D1D5DB" />
                    )))}
                    {/* Magnifying glass circle */}
                    <circle cx="42" cy="54" r="20" stroke="#C4C9D4" strokeWidth="6" fill="none" />
                    <circle cx="42" cy="54" r="13" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="2" />
                    {/* Handle */}
                    <line x1="57" y1="67" x2="70" y2="80" stroke="#C4C9D4" strokeWidth="7" strokeLinecap="round" />
                    {/* Inner lines on magnifier */}
                    <rect x="36" y="50" width="12" height="2.5" rx="1.25" fill="#D1D5DB" />
                    <rect x="36" y="55" width="9" height="2.5" rx="1.25" fill="#D1D5DB" />
                  </svg>
                </div>

                {/* Text */}
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#374151', fontFamily: font, lineHeight: 1.4, marginBottom: '10px' }}>
                    Settings coming soon for{' '}
                    <span style={{ color: brand }}>Spotter Code</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#9CA3AF', fontFamily: font, lineHeight: 1.7 }}>
                    Settings for Spotter Code will be available soon. Check back for updates to customize your experience.
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Modals ── */}
      {addConnectorModal && <AddConnectorModal onClose={() => setAddConnectorModal(false)} onSave={() => showToast('Connector added.')} />}

    </div>
  );
};

export default AISettingsPageContent;
