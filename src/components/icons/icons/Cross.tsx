import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M3.17156 2.22876L2.22875 3.17157L5.05717 5.99999L2.22875 8.82841L3.17156 9.77121L5.99998 6.94279L8.8284 9.77121L9.77121 8.82841L6.94279 5.99999L9.77121 3.17157L8.8284 2.22876L5.99998 5.05718L3.17156 2.22876Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M3.70015 2.60022L2.60021 3.70016L5.90004 6.99998L2.60021 10.2998L3.70015 11.3997L6.99998 8.09992L10.2998 11.3997L11.3997 10.2998L8.09992 6.99998L11.3997 3.70016L10.2998 2.60022L6.99998 5.90004L3.70015 2.60022Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M4.22875 2.97168L2.97167 4.22875L6.7429 7.99998L2.97167 11.7712L4.22875 13.0283L7.99997 9.25705L11.7712 13.0283L13.0283 11.7712L9.25705 7.99998L13.0283 4.22875L11.7712 2.97168L7.99997 6.7429L4.22875 2.97168Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M4.75735 3.34315L3.34314 4.75736L7.58578 9L3.34314 13.2426L4.75735 14.6569L8.99999 10.4142L13.2426 14.6569L14.6568 13.2426L10.4142 9L14.6568 4.75736L13.2426 3.34315L8.99999 7.58579L4.75735 3.34315Z" fill="currentColor"/>` },
};

export const CrossIcon: React.FC<BaseIconProps> = ({
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

export default CrossIcon;
