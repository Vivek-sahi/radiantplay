/**
 * Icon System
 *
 * A comprehensive icon library with size variants and easy swapping support.
 *
 * Usage:
 * ```tsx
 * // Using the Icon component (recommended for dynamic icons)
 * import { Icon } from './components/icons';
 * <Icon name="plus" size="m" />
 *
 * // Using individual icon components (for static icons)
 * import { PlusIcon, ChevronDownIcon } from './components/icons';
 * <PlusIcon size="l" />
 * ```
 */

export { Icon, isValidIconName, getIconNames } from './Icon';

import { getIconNames as _getIconNames } from './Icon';
export const iconNames = _getIconNames();

export type {
  IconProps,
  BaseIconProps,
  IconComponent,
  IconName,
  IconSize,
} from './Icon.types';

export { iconRegistry, getRegisteredIconNames, isIconRegistered } from './registry';

export * from './icons';
