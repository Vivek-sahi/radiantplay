import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, ReactNode } from 'react';
import { applyTheme, getSystemTheme, watchSystemTheme } from '../tokens/theme';
import type { ThemeMode, ThemeName } from '../tokens/theme';

/**
 * The one owner of the app theme.
 *
 * Holds the chosen mode (light, dark or system), saves it, and is the only code
 * that writes `data-theme` on <html>. The inline script in index.html sets the
 * same attribute before first paint; keep THEME_STORAGE_KEY and the light
 * default in step with it.
 *
 * Read the theme with useTheme(), or useIsDarkMode() when you only need to know
 * whether dark is showing. Don't read or write `data-theme` anywhere else.
 */

export const THEME_STORAGE_KEY = 'rp-theme-mode';
const DEFAULT_MODE: ThemeName = 'light';

const isThemeName = (value: unknown): value is ThemeName =>
  value === 'light' || value === 'dark' || value === 'system';

const readStoredMode = (): ThemeName => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeName(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
};

const storeMode = (mode: ThemeName): void => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Storage blocked (private window, disabled site data). The mode still applies for this visit.
  }
};

interface ThemeContextState {
  /** What the user chose */
  mode: ThemeName;
  /** What is showing: `system` resolved through the OS setting */
  resolved: ThemeMode;
  setMode: (mode: ThemeName) => void;
  /** Switch between light and dark. From `system`, picks the opposite of what is showing */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextState | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeName>(readStoredMode);
  const [systemMode, setSystemMode] = useState<ThemeMode>(getSystemTheme);
  const resolved: ThemeMode = mode === 'system' ? systemMode : mode;

  // Layout effect so the attribute changes in the same frame as the re-render.
  useLayoutEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  useEffect(() => {
    if (mode !== 'system') return;
    setSystemMode(getSystemTheme());
    return watchSystemTheme(setSystemMode);
  }, [mode]);

  const setMode = useCallback((next: ThemeName) => {
    setModeState(next);
    storeMode(next);
  }, []);

  const toggle = useCallback(() => {
    setMode(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setMode]);

  const value = useMemo(() => ({ mode, resolved, setMode, toggle }), [mode, resolved, setMode, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextState => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/** True while dark is showing. The one dark check for components, charts and canvases. */
export const useIsDarkMode = (): boolean => useTheme().resolved === 'dark';

/**
 * Keeps everything inside it light while the app is dark. For prototypes that
 * aren't dark ready yet: set `theme: 'light-only'` on the registry entry and
 * PlaygroundProject wraps the prototype in this. Light token values cascade
 * from the wrapper, and useIsDarkMode() returns false inside it, so charts
 * stay light too. Portals rendered to document.body (some modals and menus)
 * sit outside the wrapper and follow the app theme.
 */
export const LightOnly: React.FC<{ children: ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
  const parent = useTheme();
  const value = useMemo(() => ({ ...parent, resolved: 'light' as ThemeMode }), [parent]);
  return (
    <ThemeContext.Provider value={value}>
      <div data-theme="light" style={style}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
