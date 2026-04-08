/**
 * Icon Component
 * 
 * A flexible icon component that renders icons by name with support for
 * size variants and color customization.
 */

import React from 'react';
import { iconRegistry } from './registry';
import { IconProps, IconName } from './Icon.types';

/**
 * Icon component that renders icons from the registry by name.
 * 
 * @example
 * // Basic usage
 * <Icon name="plus" />
 * 
 * // With size variant
 * <Icon name="chevron-down" size="s" />
 * 
 * // With custom color
 * <Icon name="star" size="l" color="#FFD700" />
 * 
 * // Accessible icon
 * <Icon name="settings" aria-label="Open settings" />
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 'm',
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}) => {
  const IconComponent = iconRegistry[name];

  if (!IconComponent) {
    if (import.meta.env.DEV) {
      console.warn(`Icon "${name}" not found in registry`);
    }
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      className={className}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden ?? !ariaLabel}
    />
  );
};

/**
 * Type guard to check if a string is a valid icon name
 */
export const isValidIconName = (name: string): name is IconName => {
  return name in iconRegistry;
};

/**
 * Get all available icon names
 */
export const getIconNames = (): IconName[] => {
  return Object.keys(iconRegistry) as IconName[];
};

export default Icon;
