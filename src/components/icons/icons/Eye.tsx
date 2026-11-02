import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M6 7.66667C6.92047 7.66667 7.66667 6.92048 7.66667 6C7.66667 5.07953 6.92047 4.33333 6 4.33333C5.07953 4.33333 4.33333 5.07953 4.33333 6C4.33333 6.92048 5.07953 7.66667 6 7.66667Z" fill="currentColor"/>
<path d="M12 6C11.055 3.85333 9.015 2 6 2C2.985 2 0.945 3.85333 0 6C0.945 8.14667 3.0225 10 6 10C8.9775 10 11.055 8.14667 12 6ZM6 8.66667C7.47276 8.66667 8.66667 7.47276 8.66667 6C8.66667 4.52724 7.47276 3.33333 6 3.33333C4.52724 3.33333 3.33333 4.52724 3.33333 6C3.33333 7.47276 4.52724 8.66667 6 8.66667Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M7 8.94449C8.07389 8.94449 8.94444 8.07393 8.94444 7.00004C8.94444 5.92616 8.07389 5.0556 7 5.0556C5.92611 5.0556 5.05556 5.92616 5.05556 7.00004C5.05556 8.07393 5.92611 8.94449 7 8.94449Z" fill="currentColor"/>
<path d="M14 7.00004C12.8975 4.4956 10.5175 2.33337 7 2.33337C3.4825 2.33337 1.1025 4.4956 0 7.00004C1.1025 9.50449 3.52625 11.6667 7 11.6667C10.4738 11.6667 12.8975 9.50449 14 7.00004ZM7 10.1112C8.71822 10.1112 10.1111 8.71826 10.1111 7.00004C10.1111 5.28182 8.71822 3.88893 7 3.88893C5.28178 3.88893 3.88889 5.28182 3.88889 7.00004C3.88889 8.71826 5.28178 10.1112 7 10.1112Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8 10.2222C9.2273 10.2222 10.2222 9.22726 10.2222 7.99996C10.2222 6.77266 9.2273 5.77774 8 5.77774C6.7727 5.77774 5.77778 6.77266 5.77778 7.99996C5.77778 9.22726 6.7727 10.2222 8 10.2222Z" fill="currentColor"/>
<path d="M16 7.99996C14.74 5.13774 12.02 2.66663 8 2.66663C3.98 2.66663 1.26 5.13774 0 7.99996C1.26 10.8622 4.03 13.3333 8 13.3333C11.97 13.3333 14.74 10.8622 16 7.99996ZM8 11.5555C9.96368 11.5555 11.5556 9.96364 11.5556 7.99996C11.5556 6.03628 9.96368 4.4444 8 4.4444C6.03632 4.4444 4.44444 6.03628 4.44444 7.99996C4.44444 9.96364 6.03632 11.5555 8 11.5555Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M9 11.5C10.3807 11.5 11.5 10.3807 11.5 9C11.5 7.61929 10.3807 6.5 9 6.5C7.61929 6.5 6.5 7.61929 6.5 9C6.5 10.3807 7.61929 11.5 9 11.5Z" fill="currentColor"/>
<path d="M18 9C16.5825 5.78 13.5225 3 9 3C4.4775 3 1.4175 5.78 0 9C1.4175 12.22 4.53375 15 9 15C13.4662 15 16.5825 12.22 18 9ZM9 13C11.2091 13 13 11.2091 13 9C13 6.79086 11.2091 5 9 5C6.79086 5 5 6.79086 5 9C5 11.2091 6.79086 13 9 13Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const EyeIcon: React.FC<BaseIconProps> = ({
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

export default EyeIcon;
