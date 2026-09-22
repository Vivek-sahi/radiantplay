import React, { createContext, useCallback, useContext, useState } from 'react';

export type CanvasBehavior = 'auto' | 'ask';

export interface SpotterConfig {
  canvasBehavior: CanvasBehavior;
  contextPicker: boolean;
}

interface SpotterConfigContextValue {
  config: SpotterConfig;
  setConfig: (c: SpotterConfig) => void;
}

const DEFAULT: SpotterConfig = { canvasBehavior: 'auto', contextPicker: false };

export const SpotterConfigContext = createContext<SpotterConfigContextValue>({
  config: DEFAULT,
  setConfig: () => {},
});

export const useSpotterConfig = () => useContext(SpotterConfigContext);

const STORAGE_KEY = 'spotter-config';

export const SpotterConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<SpotterConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT, ...JSON.parse(saved) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  const setConfig = useCallback((c: SpotterConfig) => {
    setConfigState(c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  }, []);

  return (
    <SpotterConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </SpotterConfigContext.Provider>
  );
};
