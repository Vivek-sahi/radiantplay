/**
 * Icon Component Types
 *
 * Type definitions for the icon system. The IconName union is derived
 * from the registry via `keyof typeof iconRegistry`, so any new icon
 * added by `npm run sync-icons` is automatically reflected in the type
 * system. Do not maintain a hand-written union here.
 */

import { IconSize } from '../../tokens/icons';
import { iconRegistry } from './registry';

/**
 * Base props shared by all individual icon components
 */
export interface BaseIconProps {
  /** Size variant of the icon */
  size?: IconSize;
  /** Color of the icon - defaults to currentColor */
  color?: string;
  /** Additional CSS class names */
  className?: string;
  /** Accessibility label */
  'aria-label'?: string;
  /** Hide from screen readers when decorative */
  'aria-hidden'?: boolean;
}

/**
 * Props for the main Icon component that renders icons by name
 */
export interface IconProps extends BaseIconProps {
  /** Name of the icon to render */
  name: IconName;
}

/**
 * Icon component type for registry entries
 */
export type IconComponent = React.FC<BaseIconProps>;

/**
 * All available icon names, derived from the registry.
 */
export type IconName = keyof typeof iconRegistry;

/**
 * Re-export IconSize for convenience
 */
export type { IconSize } from '../../tokens/icons';
