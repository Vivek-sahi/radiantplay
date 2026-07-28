import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ── Data Studio experience variant ──────────────────────────────────────────
// 'vision' = the full vision-level experience. 'poc' = the scoped-down POC.
// One source of truth, read anywhere via useVariant(); toggled from the header.
export type DataStudioVariant = 'vision' | 'poc';

// Central scope config — the single place that names what the POC turns off or
// simplifies. Components gate off this (e.g. `useScope().showPulse`) so the whole
// POC surface is legible in one file. Empty for now — no behaviour change yet;
// we add entries here as we scope the POC down.
export interface PocScope {
  // Example (to be filled in as we decide scope):
  // showPulse: boolean;
  // showExternalSources: boolean;
  // canvasActions: OpType[];
}

const VISION_SCOPE: PocScope = {};
const POC_SCOPE: PocScope = {};

export const SCOPE_BY_VARIANT: Record<DataStudioVariant, PocScope> = {
  vision: VISION_SCOPE,
  poc: POC_SCOPE,
};

interface VariantContextValue {
  variant: DataStudioVariant;
  scope: PocScope;
  setVariant: (v: DataStudioVariant) => void;
}

const VariantContext = createContext<VariantContextValue>({
  variant: 'vision',
  scope: VISION_SCOPE,
  setVariant: () => {},
});

const STORAGE_KEY = 'ds2-variant';
const isVariant = (v: unknown): v is DataStudioVariant => v === 'vision' || v === 'poc';

// Initial value: ?v= URL param wins, then localStorage, then 'vision'.
function readInitialVariant(): DataStudioVariant {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('v');
    if (isVariant(fromUrl)) return fromUrl;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isVariant(stored)) return stored;
  } catch { /* SSR / storage blocked — fall through */ }
  return 'vision';
}

// Reflect the variant in the URL (?v=…) so each version is shareable + reload-safe.
function syncUrl(v: DataStudioVariant): void {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('v') !== v) {
      url.searchParams.set('v', v);
      window.history.replaceState({}, '', url.toString());
    }
  } catch { /* noop */ }
}

export const VariantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [variant, setVariantState] = useState<DataStudioVariant>(readInitialVariant);

  const setVariant = useCallback((v: DataStudioVariant) => {
    setVariantState(v);
    try { localStorage.setItem(STORAGE_KEY, v); } catch { /* noop */ }
    syncUrl(v);
  }, []);

  // Ensure the URL carries ?v= from first render, even before any toggle.
  useEffect(() => { syncUrl(variant); }, [variant]);

  return (
    <VariantContext.Provider value={{ variant, scope: SCOPE_BY_VARIANT[variant], setVariant }}>
      {children}
    </VariantContext.Provider>
  );
};

export const useVariant = (): VariantContextValue => useContext(VariantContext);
// Convenience: read just the active scope config.
export const useScope = (): PocScope => useContext(VariantContext).scope;

// ── Header toggle — a small segmented control (Vision · POC) ─────────────────
export const VariantToggle: React.FC = () => {
  const { variant, setVariant } = useVariant();
  const options: { value: DataStudioVariant; label: string }[] = [
    { value: 'vision', label: 'Vision' },
    { value: 'poc', label: 'POC' },
  ];
  return (
    <div
      role="tablist"
      aria-label="Data Studio experience"
      style={{ display: 'flex', alignItems: 'center', background: '#EAEDF2', borderRadius: 8, padding: 2, gap: 2 }}
    >
      {options.map(({ value, label }) => {
        const active = variant === value;
        return (
          <button
            key={value}
            role="tab"
            aria-selected={active}
            onClick={() => setVariant(value)}
            style={{
              padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              background: active ? '#FFFFFF' : 'transparent',
              color: active ? '#1D232F' : '#777E8B',
              boxShadow: active ? '0 1px 2px rgba(25,35,49,0.12)' : 'none',
              transition: 'background 120ms, color 120ms',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
