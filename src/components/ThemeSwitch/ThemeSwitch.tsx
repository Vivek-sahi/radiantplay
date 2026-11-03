import { forwardRef } from 'react';
import type { ComponentType } from 'react';
import { SegmentedControl } from '../SegmentedControl';
import { Button } from '../Button';
import type { ButtonSize, ButtonVariant } from '../Button';
import { Tooltip } from '../Tooltip';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeName } from '../../tokens/theme';

export interface ThemeSwitchProps {
  /**
   * `segmented` shows Light, Dark and System side by side.
   * `icon` is one icon button that cycles light, dark, system.
   * @default 'segmented'
   */
  variant?: 'segmented' | 'icon';
  /**
   * Size of the segmented control
   * @default 'small'
   */
  size?: 'small' | 'default' | 'large';
  /**
   * Fill the available width (segmented only)
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Button size for the icon variant
   * @default 'basic'
   */
  buttonSize?: ButtonSize;
  /**
   * Button style for the icon variant
   * @default 'tertiary'
   */
  buttonVariant?: ButtonVariant;
  className?: string;
}

const OPTIONS: { id: ThemeName; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

const NEXT_MODE: Record<ThemeName, ThemeName> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

const svgProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  'aria-hidden': true,
  focusable: false,
} as const;

const SunIcon = () => (
  <svg {...svgProps}>
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon = () => (
  <svg {...svgProps}>
    <path
      d="M13.5 9.6A5.5 5.5 0 0 1 6.4 2.5a5.5 5.5 0 1 0 7.1 7.1Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const SystemIcon = () => (
  <svg {...svgProps}>
    <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 2.25a5.75 5.75 0 0 1 0 11.5Z" fill="currentColor" />
  </svg>
);

const MODE_ICON: Record<ThemeName, ComponentType> = {
  light: SunIcon,
  dark: MoonIcon,
  system: SystemIcon,
};

const MODE_LABEL: Record<ThemeName, string> = {
  light: 'light',
  dark: 'dark',
  system: 'system',
};

/**
 * Light, dark or system theme. Reads and writes the app theme through
 * ThemeProvider, so it shows the saved choice and stays in step with Ctrl+D.
 *
 * `variant="icon"` renders one icon button showing the current mode; a click
 * moves to the next mode (light, dark, system, light).
 */
export const ThemeSwitch = forwardRef<HTMLDivElement, ThemeSwitchProps>(
  (
    {
      variant = 'segmented',
      size = 'small',
      fullWidth = false,
      buttonSize = 'basic',
      buttonVariant = 'tertiary',
      className,
    },
    ref,
  ) => {
    const { mode, setMode } = useTheme();

    if (variant === 'icon') {
      const next = NEXT_MODE[mode];
      const ModeIcon = MODE_ICON[mode];
      const label = `Theme: ${MODE_LABEL[mode]}. Switch to ${MODE_LABEL[next]}`;
      return (
        <div ref={ref} className={className}>
          <Tooltip content={`${MODE_LABEL[mode][0].toUpperCase()}${MODE_LABEL[mode].slice(1)} theme. Click for ${MODE_LABEL[next]}`} placement="bottom">
            <Button
              variant={buttonVariant}
              size={buttonSize}
              iconOnly
              icon={<ModeIcon />}
              aria-label={label}
              data-theme-mode={mode}
              onClick={() => setMode(next)}
            >
              {label}
            </Button>
          </Tooltip>
        </div>
      );
    }

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
