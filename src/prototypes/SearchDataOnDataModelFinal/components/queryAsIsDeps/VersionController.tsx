import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useSpotterConfig, type CanvasBehavior } from './SpotterController';

// ─── Types ───────────────────────────────────────────────────────────────────

export type Version = 'v1' | 'minimal';
export type EditableColStyle = 'none' | 'header-badge' | 'cell-tint' | 'hover-indicator' | 'header-accent' | 'cursor-placeholder' | 'header-icon' | 'accent-and-tint' | 'header-fill';
export type ColDetailIconStyle = 'a' | 'b';

interface VersionContextValue {
  version: Version;
  setVersion: (v: Version) => void;
  showSpotter: boolean;
  setShowSpotter: (v: boolean) => void;
  editableColStyle: EditableColStyle;
  setEditableColStyle: (v: EditableColStyle) => void;
  colDetailIconStyle: ColDetailIconStyle;
  setColDetailIconStyle: (v: ColDetailIconStyle) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const VersionContext = createContext<VersionContextValue>({
  version: 'v1',
  setVersion: () => {},
  showSpotter: true,
  setShowSpotter: () => {},
  editableColStyle: 'none',
  setEditableColStyle: () => {},
  colDetailIconStyle: 'a',
  setColDetailIconStyle: () => {},
});

export const useVersion = () => useContext(VersionContext);

// ─── Provider ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sdw-version';

export const VersionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [version, setVersionState] = useState<Version>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as Version) ?? 'v1';
  });
  const [showSpotter, setShowSpotterState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '-spotter');
    return saved === null ? false : saved === 'true';
  });
  const [editableColStyle, setEditableColStyleState] = useState<EditableColStyle>(() => {
    return (localStorage.getItem(STORAGE_KEY + '-ecol') as EditableColStyle) ?? 'none';
  });
  const [colDetailIconStyle, setColDetailIconStyleState] = useState<ColDetailIconStyle>(() => {
    return (localStorage.getItem(STORAGE_KEY + '-cdicon') as ColDetailIconStyle) ?? 'a';
  });

  const setVersion = useCallback((v: Version) => {
    setVersionState(v);
    localStorage.setItem(STORAGE_KEY, v);
  }, []);

  const setShowSpotter = useCallback((v: boolean) => {
    setShowSpotterState(v);
    localStorage.setItem(STORAGE_KEY + '-spotter', String(v));
  }, []);

  const setEditableColStyle = useCallback((v: EditableColStyle) => {
    setEditableColStyleState(v);
    localStorage.setItem(STORAGE_KEY + '-ecol', v);
  }, []);

  const setColDetailIconStyle = useCallback((v: ColDetailIconStyle) => {
    setColDetailIconStyleState(v);
    localStorage.setItem(STORAGE_KEY + '-cdicon', v);
  }, []);

  return (
    <VersionContext.Provider value={{ version, setVersion, showSpotter, setShowSpotter, editableColStyle, setEditableColStyle, colDetailIconStyle, setColDetailIconStyle }}>
      {children}
    </VersionContext.Provider>
  );
};

// ─── Toggle ───────────────────────────────────────────────────────────────────

const Toggle: React.FC<{ on: boolean }> = ({ on }) => (
  <span style={{
    flexShrink: 0,
    width: 32, height: 18, borderRadius: 9,
    background: on ? '#2770ef' : '#c8cdd6',
    display: 'flex', alignItems: 'center', padding: 2,
    transition: 'background 150ms',
  }}>
    <span style={{
      width: 14, height: 14, borderRadius: '50%', background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transform: on ? 'translateX(14px)' : 'translateX(0)',
      transition: 'transform 150ms',
    }} />
  </span>
);

// ─── Option row ──────────────────────────────────────────────────────────────

const OptionRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f0f2f5' }}>
    <span style={{ fontSize: 13, fontWeight: 500, color: '#1d232f', fontFamily: FONT }}>{label}</span>
    {children}
  </div>
);

// ─── Controller UI ───────────────────────────────────────────────────────────

export const VersionController: React.FC = () => {
  const { version, setVersion, showSpotter, setShowSpotter, editableColStyle, setEditableColStyle, colDetailIconStyle, setColDetailIconStyle } = useVersion();
  const { config, setConfig } = useSpotterConfig();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '`' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        title="Design options (` to toggle)"
        style={styles.fab}
      >
        {version === 'minimal' ? 'MIN' : 'V1'}
      </button>

      {open && (
        <>
          <div style={styles.backdrop} onClick={() => setOpen(false)} />
          <div style={styles.modal} role="dialog" aria-modal aria-label="Design options">

            {/* Header */}
            <div style={styles.header}>
              <div>
                <p style={styles.eyebrow}>Prototype</p>
                <h2 style={styles.title}>Design options</h2>
              </div>
              <button style={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 2l12 12M14 2L2 14" stroke="#777e8b" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div style={styles.optionsList}>
              <OptionRow label="Prototype">
                <select style={styles.select} value={version} onChange={e => setVersion(e.target.value as Version)}>
                  <option value="v1">Current</option>
                  <option value="minimal">Minimal UI</option>
                </select>
              </OptionRow>
              <OptionRow label="Canvas behavior">
                <select style={styles.select} value={config.canvasBehavior} onChange={e => setConfig({ ...config, canvasBehavior: e.target.value as CanvasBehavior })}>
                  <option value="auto">Auto-add</option>
                  <option value="ask">Ask every time</option>
                </select>
              </OptionRow>
              <OptionRow label="Spotter">
                <button style={styles.toggleBtn} onClick={() => setShowSpotter(!showSpotter)}>
                  <Toggle on={showSpotter} />
                </button>
              </OptionRow>
              <OptionRow label="Context picker">
                <button style={styles.toggleBtn} onClick={() => setConfig({ ...config, contextPicker: !config.contextPicker })}>
                  <Toggle on={config.contextPicker} />
                </button>
              </OptionRow>
              <OptionRow label="Editable column style">
                <select style={styles.select} value={editableColStyle} onChange={e => setEditableColStyle(e.target.value as EditableColStyle)}>
                  <option value="none">No indicator</option>
                  <option value="header-accent">Header accent</option>
                  <option value="header-fill">Header fill</option>
                  <option value="cell-tint">Cell tint</option>
                  <option value="accent-and-tint">Header accent + Cell tint</option>
                </select>
              </OptionRow>
              <OptionRow label="Column detail icon">
                <select style={styles.select} value={colDetailIconStyle} onChange={e => setColDetailIconStyle(e.target.value as ColDetailIconStyle)}>
                  <option value="a">Icon A (info bar + chevron)</option>
                  <option value="b">Icon B (circle info + arrow)</option>
                </select>
              </OptionRow>
            </div>

            <p style={styles.hint}>Press <kbd style={styles.kbd}>`</kbd> to open · <kbd style={styles.kbd}>Esc</kbd> to close</p>
          </div>
        </>
      )}
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const FONT = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const styles: Record<string, React.CSSProperties> = {
  fab: {
    position: 'fixed', bottom: 20, right: 20, zIndex: 10000,
    width: 40, height: 40, borderRadius: '50%',
    background: '#1d232f', color: '#fff', border: 'none', cursor: 'pointer',
    fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.30)', opacity: 0.75,
  },
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 10001,
    background: 'rgba(25,35,49,0.45)',
  },
  modal: {
    position: 'fixed', top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
    zIndex: 10002, background: '#fff',
    border: '1px solid #eaedf2', borderRadius: 16,
    boxShadow: '0 24px 64px rgba(25,35,49,0.22), 0 4px 16px rgba(25,35,49,0.10)',
    padding: 28, width: 380, fontFamily: FONT,
  },
  optionsList: { display: 'flex', flexDirection: 'column' as const, marginBottom: 4 },
  select: {
    fontSize: 13, fontFamily: FONT, color: '#1d232f',
    background: '#f5f7fa', border: '1px solid #e2e5eb',
    borderRadius: 7, padding: '5px 28px 5px 10px',
    cursor: 'pointer', outline: 'none',
    appearance: 'auto' as const,
  },
  toggleBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8,
  },
  eyebrow: {
    margin: '0 0 2px', fontSize: 11, fontWeight: 500, color: '#a0a9b4',
    textTransform: 'uppercase' as const, letterSpacing: '0.08em',
  },
  title: { margin: 0, fontSize: 20, fontWeight: 700, color: '#1d232f', letterSpacing: '-0.01em' },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, marginTop: 2,
  },
  subtitle: { margin: '0 0 16px', fontSize: 13, fontWeight: 300, color: '#777e8b', lineHeight: 1.5 },
  sectionLabel: {
    margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#a0a9b4',
    textTransform: 'uppercase' as const, letterSpacing: '0.07em',
  },
  group: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  row: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', border: '1.5px solid #eaedf2', borderRadius: 10,
    background: '#f5f7fa', cursor: 'pointer', textAlign: 'left' as const,
    transition: 'background 120ms, border-color 120ms',
  },
  rowActive: { background: '#eef3fd', borderColor: '#2770ef' },
  rowText: { display: 'flex', flexDirection: 'column' as const, gap: 1, flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: 600, color: '#1d232f' },
  rowLabelActive: { color: '#2770ef' },
  rowDesc: { fontSize: 12, fontWeight: 300, color: '#777e8b' },
  hint: { margin: '20px 0 0', fontSize: 11, color: '#a0a9b4', textAlign: 'center' as const },
  kbd: {
    fontFamily: 'monospace', background: '#f0f2f5',
    border: '1px solid #d4d9e2', borderRadius: 3, padding: '1px 5px', fontSize: 11, color: '#1d232f',
  },
};
