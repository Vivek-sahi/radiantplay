import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M7.21512 5.99995L2.66403 10.551L1.53638 9.42339L4.95982 5.99995L1.53638 2.5765L2.66403 1.44885L7.21512 5.99995ZM11.9998 5.99995L7.44875 10.551L6.3211 9.42339L9.74455 5.99995L6.3211 2.5765L7.44875 1.44885L11.9998 5.99995Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M8.41768 7.00004L3.10807 12.3097L1.79248 10.9941L5.7865 7.00004L1.79248 3.00602L3.10807 1.69043L8.41768 7.00004ZM13.9999 7.00004L8.69025 12.3097L7.37466 10.9941L11.3687 7.00004L7.37466 3.00602L8.69025 1.69043L13.9999 7.00004Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M9.62037 8.00001L3.55224 14.0681L2.04871 12.5646L6.6133 8.00001L2.04871 3.43542L3.55224 1.93188L9.62037 8.00001ZM16 8.00001L9.93187 14.0681L8.42834 12.5646L12.9929 8.00001L8.42834 3.43542L9.93187 1.93188L16 8.00001Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M10.8229 8.99998L3.99628 15.8266L2.30481 14.1352L7.43998 8.99998L2.30481 3.86481L3.99628 2.17334L10.8229 8.99998ZM18 8.99998L11.1734 15.8266L9.4819 14.1352L14.6171 8.99998L9.4819 3.86481L11.1734 2.17334L18 8.99998Z" fill="currentColor"/>` },
};

export const CollapseIcon: React.FC<BaseIconProps> = ({
  size = 'm',
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}) => {
  const variant = VARIANTS[size];
  return (
    <svg
      width={iconSize[size]}
      height={iconSize[size]}
      viewBox={variant.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      role={ariaLabel ? 'img' : undefined}
      style={{ color }}
      dangerouslySetInnerHTML={{ __html: variant.inner }}
    />
  );
};

export default CollapseIcon;
