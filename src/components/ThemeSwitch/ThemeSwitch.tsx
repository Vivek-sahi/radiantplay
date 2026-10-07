import { forwardRef } from 'react';
import { SegmentedControl } from '../SegmentedControl';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeName } from '../../tokens/theme';

export interface ThemeSwitchProps {
  /**
   * Size of the control
   * @default 'small'
   */
  size?: 'small' | 'default' | 'large';
  /**
   * Fill the available width
   * @default false
   */
  fullWidth?: boolean;
  className?: string;
}

const OPTIONS: { id: ThemeName; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

/**
 * Light, dark or system theme. Reads and writes the app theme through
 * ThemeProvider, so it shows the saved choice and stays in step with Ctrl+D.
 */
export const ThemeSwitch = forwardRef<HTMLDivElement, ThemeSwitchProps>(
  ({ size = 'small', fullWidth = false, className }, ref) => {
    const { mode, setMode } = useTheme();
    return (
      <div ref={ref} className={className} title="Switch theme (Ctrl+D)">
        <SegmentedControl
          options={OPTIONS}
          value={mode}
          onChange={(value) => setMode(value as ThemeName)}
          size={size}
          fullWidth={fullWidth}
          aria-label="Theme"
        />
      </div>
    );
  },
);

ThemeSwitch.displayName = 'ThemeSwitch';

export default ThemeSwitch;
