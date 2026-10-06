import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { systemColors, referenceColors } from '../tokens/colors';

// Token data structure
interface TokenData {
  token: string;
  value: string;
}

interface ComponentTokens {
  component: string;
  variant: string;
  tokens: Record<string, TokenData>;
}

// Context state interface
interface InspectorContextState {
  inspectMode: boolean;
  toggleInspectMode: () => void;
  setInspectMode: (mode: boolean) => void;
  hoveredComponent: string | null;
  setHoveredComponent: (id: string | null) => void;
  tooltipPosition: { x: number; y: number };
  setTooltipPosition: (pos: { x: number; y: number }) => void;
  getComponentTokens: (componentId: string) => ComponentTokens | null;
}

// Token definitions for all components
const COMPONENT_TOKENS: Record<string, ComponentTokens> = {
  'button-primary': {
    component: 'Button',
    variant: 'Primary',
    tokens: {
      background: { token: '--color-brand-blue-60', value: '#2770EF' },
      backgroundHover: { token: '--color-brand-blue-70', value: '#2359B6' },
      color: { token: '--color-brand-white', value: '#FFFFFF' },
      font: { token: '--font-family-primary', value: 'var(--font-family-primary)' },
      fontSize: { token: '--font-size-sm', value: '14px' },
      fontWeight: { token: '--font-weight-regular', value: '400' },
      borderRadius: { token: '--radius-2xl', value: '16px' },
      padding: { token: '--spacing-4', value: '16px horizontal' },
    },
  },
  'button-secondary': {
    component: 'Button',
    variant: 'Secondary',
    tokens: {
      background: { token: '--color-brand-gray-20', value: '#EAEDF2' },
      backgroundHover: { token: '--color-brand-gray-30', value: '#DBDFE7' },
      color: { token: '--color-brand-gray-90', value: '#1D232F' },
      font: { token: '--font-family-primary', value: 'var(--font-family-primary)' },
      fontSize: { token: '--font-size-sm', value: '14px' },
      fontWeight: { token: '--font-weight-regular', value: '400' },
      borderRadius: { token: '--radius-2xl', value: '16px' },
    },
  },
  'button-tertiary': {
    component: 'Button',
    variant: 'Tertiary',
    tokens: {
      background: { token: 'transparent', value: 'transparent' },
      backgroundHover: { token: '--color-hover', value: 'rgba(192, 198, 207, 0.12)' },
      color: { token: '--color-brand-blue-60', value: '#2770EF' },
      font: { token: '--font-family-primary', value: 'var(--font-family-primary)' },
      fontSize: { token: '--font-size-xs', value: '12px' },
      fontWeight: { token: '--font-weight-regular', value: '400' },
      borderRadius: { token: '--radius-md', value: '6px' },
    },
  },
  'checkbox': {
    component: 'Checkbox',
    variant: 'Default',
    tokens: {
      boxSize: { token: 'fixed', value: '16x16px' },
      borderColor: { token: '--color-brand-gray-50', value: '#A5ACB9' },
      borderColorChecked: { token: '--color-brand-blue-60', value: '#2770EF' },
      checkColor: { token: '--color-brand-blue-60', value: '#2770EF' },
      labelColor: { token: '--color-brand-gray-90', value: '#1D232F' },
      font: { token: '--font-family-primary', value: 'var(--font-family-primary)' },
      fontSize: { token: '--font-size-sm', value: '14px' },
      gap: { token: '--spacing-3', value: '12px' },
    },
  },
  'toggle': {
    component: 'Toggle',
    variant: 'Default',
    tokens: {
      trackSize: { token: 'fixed', value: '28x16px' },
      trackColorOff: { token: '--color-brand-gray-40', value: '#C0C6CF' },
      trackColorOn: { token: '--color-brand-blue-60', value: '#2770EF' },
      thumbColor: { token: '--color-brand-white', value: '#FFFFFF' },
      thumbSize: { token: 'fixed', value: '12px' },
      labelColor: { token: '--color-brand-gray-90', value: '#1D232F' },
      font: { token: '--font-family-primary', value: 'var(--font-family-primary)' },
      fontSize: { token: '--font-size-sm', value: '14px' },
    },
  },
  'search-input': {
    component: 'SearchInput',
    variant: 'Default',
    tokens: {
      background: { token: '--color-brand-white', value: '#FFFFFF' },
      borderColor: { token: '--color-brand-gray-30', value: '#DBDFE7' },
      borderColorFocus: { token: '--color-brand-blue-60', value: '#2770EF' },
      textColor: { token: '--color-brand-gray-90', value: '#1D232F' },
      placeholderColor: { token: '--color-brand-gray-50', value: '#A5ACB9' },
      iconColor: { token: '--color-brand-gray-50', value: '#A5ACB9' },
      font: { token: '--font-family-primary', value: 'var(--font-family-primary)' },
      fontSize: { token: '--font-size-sm', value: '14px' },
      borderRadius: { token: '--radius-lg', value: '8px' },
    },
  },
  'text-input': {
    component: 'TextInput',
    variant: 'Default',
    tokens: {
      background: { token: '--color-brand-white', value: '#FFFFFF' },
      borderColor: { token: '--color-brand-gray-30', value: '#DBDFE7' },
      borderColorFocus: { token: '--color-brand-blue-60', value: '#2770EF' },
      textColor: { token: '--color-brand-gray-90', value: '#1D232F' },
      labelColor: { token: '--color-brand-gray-70', value: '#5C6370' },
      font: { token: '--font-family-primary', value: 'var(--font-family-primary)' },
      fontSize: { token: '--font-size-sm', value: '14px' },
      borderRadius: { token: '--radius-lg', value: '8px' },
    },
  },
  'modal': {
    component: 'Modal',
    variant: 'Dialog',
    tokens: {
      background: { token: '--color-brand-white', value: '#FFFFFF' },
      borderRadius: { token: '--radius-md', value: '6px' },
      shadow: { token: 'custom', value: '0px 24px 32px rgba(25, 35, 49, 0.16)' },
      headerFont: { token: '--font-family-primary', value: 'Geist' },
      headerSize: { token: 'custom', value: '20px' },
      headerColor: { token: '--color-brand-gray-90', value: '#1D232F' },
      footerBackground: { token: '--color-brand-gray-10', value: '#F6F8FA' },
    },
  },
  'select': {
    component: 'Select',
    variant: 'Default',
    tokens: {
      background: { token: '--color-brand-white', value: '#FFFFFF' },
      borderColor: { token: '--color-brand-gray-30', value: '#DBDFE7' },
      borderColorFocus: { token: '--color-brand-blue-60', value: '#2770EF' },
      textColor: { token: '--color-brand-gray-90', value: '#1D232F' },
      font: { token: '--font-family-primary', value: 'var(--font-family-primary)' },
      fontSize: { token: '--font-size-sm', value: '14px' },
      borderRadius: { token: '--radius-lg', value: '8px' },
    },
  },
  'chip': {
    component: 'Chip',
    variant: 'Attribute',
    tokens: {
      background: { token: '--color-chip-attribute', value: 'rgba(39, 112, 239, 0.08)' },
      textColor: { token: '--color-brand-gray-90', value: '#1D232F' },
      font: { token: '--font-family-primary', value: 'var(--font-family-primary)' },
      fontSize: { token: '--font-size-xs', value: '12px' },
      borderRadius: { token: '--radius-full', value: '9999px' },
    },
  },
  'alert': {
    component: 'Alert',
    variant: 'Info',
    tokens: {
      background: { token: '--color-brand-blue-10', value: '#E8F0FE' },
      borderColor: { token: '--color-brand-blue-60', value: '#2770EF' },
      iconColor: { token: '--color-brand-blue-60', value: '#2770EF' },
      textColor: { token: '--color-brand-gray-90', value: '#1D232F' },
      font: { token: '--font-family-primary', value: 'var(--font-family-primary)' },
      fontSize: { token: '--font-size-sm', value: '14px' },
      borderRadius: { token: '--radius-md', value: '6px' },
    },
  },
  'tabs': {
    component: 'Tabs',
    variant: 'Default',
    tokens: {
      activeColor: { token: '--color-brand-blue-60', value: '#2770EF' },
      inactiveColor: { token: '--color-brand-gray-60', value: '#777E8B' },
      borderColor: { token: '--color-brand-blue-60', value: '#2770EF' },
      font: { token: '--font-family-primary', value: 'var(--font-family-primary)' },
      fontSize: { token: '--font-size-sm', value: '14px' },
    },
  },
  'radio': {
    component: 'Radio',
    variant: 'Default',
    tokens: {
      circleSize: { token: 'fixed', value: '16x16px' },
      borderColor: { token: '--color-brand-gray-50', value: '#A5ACB9' },
      selectedColor: { token: '--color-brand-blue-60', value: '#2770EF' },
      labelColor: { token: '--color-brand-gray-90', value: '#1D232F' },
      font: { token: '--font-family-primary', value: 'var(--font-family-primary)' },
      fontSize: { token: '--font-size-sm', value: '14px' },
    },
  },
};

// Create context
const InspectorContext = createContext<InspectorContextState | undefined>(undefined);

// Provider component
export const InspectorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inspectMode, setInspectModeState] = useState(false);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const toggleInspectMode = useCallback(() => {
    setInspectModeState(prev => {
      if (prev) {
        setHoveredComponent(null);
      }
      return !prev;
    });
  }, []);

  const setInspectMode = useCallback((mode: boolean) => {
    setInspectModeState(mode);
    if (!mode) {
      setHoveredComponent(null);
    }
  }, []);

  const getComponentTokens = useCallback((componentId: string): ComponentTokens | null => {
    return COMPONENT_TOKENS[componentId] || null;
  }, []);

  return (
    <InspectorContext.Provider
      value={{
        inspectMode,
        toggleInspectMode,
        setInspectMode,
        hoveredComponent,
        setHoveredComponent,
        tooltipPosition,
        setTooltipPosition,
        getComponentTokens,
      }}
    >
      {children}
      {/* Global Inspector Tooltip */}
      {inspectMode && hoveredComponent && (
        <InspectorTooltip
          componentId={hoveredComponent}
          position={tooltipPosition}
          getComponentTokens={getComponentTokens}
        />
      )}
      {/* Inspect Mode Banner */}
      {inspectMode && (
        <div style={bannerStyles.banner}>
          <span style={bannerStyles.icon}>🔍</span>
          <span>Inspect mode is ON — Hover over components to see their design tokens</span>
          <button style={bannerStyles.closeButton} onClick={toggleInspectMode}>
            ✕
          </button>
        </div>
      )}
    </InspectorContext.Provider>
  );
};

// Inspector Tooltip component
const InspectorTooltip: React.FC<{
  componentId: string;
  position: { x: number; y: number };
  getComponentTokens: (id: string) => ComponentTokens | null;
}> = ({ componentId, position, getComponentTokens }) => {
  const data = getComponentTokens(componentId);
  if (!data) return null;

  return (
    <div style={{ ...tooltipStyles.tooltip, left: position.x, top: position.y }}>
      <div style={tooltipStyles.header}>
        <span style={tooltipStyles.component}>{data.component}</span>
        <span style={tooltipStyles.variant}>{data.variant}</span>
      </div>
      <div style={tooltipStyles.divider} />
      <div style={tooltipStyles.body}>
        {Object.entries(data.tokens).map(([key, tokenData]) => (
          <div key={key} style={tooltipStyles.tokenRow}>
            <span style={tooltipStyles.tokenName}>{key}</span>
            <div style={tooltipStyles.tokenValues}>
              <code style={tooltipStyles.tokenCode}>{tokenData.token}</code>
              <span style={tooltipStyles.tokenValue}>
                {tokenData.value.startsWith('#') && (
                  <span
                    style={{
                      ...tooltipStyles.colorSwatch,
                      backgroundColor: tokenData.value,
                    }}
                  />
                )}
                {tokenData.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom hook for using inspector context
export const useInspector = (): InspectorContextState => {
  const context = useContext(InspectorContext);
  if (context === undefined) {
    throw new Error('useInspector must be used within an InspectorProvider');
  }
  return context;
};

// Inspectable wrapper component
export const Inspectable: React.FC<{
  id: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ id, children, style }) => {
  const { inspectMode, hoveredComponent, setHoveredComponent, setTooltipPosition } = useInspector();

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (inspectMode) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setTooltipPosition({
        x: Math.min(rect.right + 12, window.innerWidth - 340),
        y: Math.max(rect.top, 12),
      });
      setHoveredComponent(id);
    }
  };

  const handleMouseLeave = () => {
    setHoveredComponent(null);
  };

  return (
    <div
      style={{
        ...style,
        position: 'relative',
        outline: inspectMode && hoveredComponent === id ? `2px solid ${systemColors.light['content-brand']}` : 'none',
        outlineOffset: '2px',
        borderRadius: '4px',
        transition: 'outline 150ms ease',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {inspectMode && (
        <div
          style={{
            position: 'absolute',
            top: '-6px',
            left: '-6px',
            width: '12px',
            height: '12px',
            backgroundColor: systemColors.light['content-brand'],
            borderRadius: '50%',
            border: `2px solid ${systemColors.light['background-base']}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            opacity: hoveredComponent === id ? 1 : 0.5,
            transition: 'opacity 150ms ease',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

// Styles for tooltip
const tooltipStyles: Record<string, React.CSSProperties> = {
  tooltip: {
    position: 'fixed',
    zIndex: 10000,
    width: '320px',
    backgroundColor: systemColors.light['content-primary'],
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  header: {
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: systemColors.light['background-raised-inverse'],
  },
  component: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '16px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: systemColors.light['background-base'],
  },
  variant: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '12px',
    fontWeight: 500,
    color: referenceColors.brand['40'],
    backgroundColor: 'rgba(39, 112, 239, 0.2)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  divider: {
    height: '1px',
    backgroundColor: referenceColors.gray['70'],
  },
  body: {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  tokenRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  tokenName: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '11px',
    fontWeight: 500,
    color: systemColors.light['content-tertiary'],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tokenValues: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  tokenCode: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: '12px',
    color: referenceColors.green['50'],
    backgroundColor: 'rgba(6, 191, 127, 0.15)',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  tokenValue: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: '12px',
    color: systemColors.light['border-default'],
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  colorSwatch: {
    width: '12px',
    height: '12px',
    borderRadius: '2px',
    border: '1px solid rgba(255,255,255,0.2)',
  },
};

// Styles for banner
const bannerStyles: Record<string, React.CSSProperties> = {
  banner: {
    position: 'fixed',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: systemColors.light['content-primary'],
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    fontFamily: 'var(--font-family-primary)',
    fontSize: '13px',
    color: systemColors.light['background-base'],
  },
  icon: {
    fontSize: '16px',
  },
  closeButton: {
    marginLeft: '8px',
    padding: '4px 8px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '4px',
    color: systemColors.light['background-base'],
    cursor: 'pointer',
    fontSize: '12px',
  },
};

export default InspectorContext;
