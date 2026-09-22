import React from 'react';
import { BaseIconProps } from '@components/icons/Icon.types';
import { iconSize, iconStrokeWidth } from '@tokens/icons';

export const RefreshIcon: React.FC<BaseIconProps> = ({
  size = 'm',
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}) => (
  <svg
    width={iconSize[size]}
    height={iconSize[size]}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label={ariaLabel}
    aria-hidden={ariaHidden}
    role={ariaLabel ? 'img' : undefined}
  >
    <path
      d="M1.5 1.5V6H6"
      stroke={color}
      strokeWidth={iconStrokeWidth[size]}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.5 16.5V12H12"
      stroke={color}
      strokeWidth={iconStrokeWidth[size]}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.7075 6.75C14.346 5.71285 13.7124 4.78852 12.8724 4.07028C12.0325 3.35204 11.0166 2.86595 9.92676 2.66007C8.83692 2.45419 7.71201 2.53598 6.66396 2.89763C5.61591 3.25928 4.68179 3.88798 3.9525 4.7175L1.5 6M16.5 12L14.0475 13.2825C13.3182 14.112 12.3841 14.7407 11.336 15.1024C10.288 15.464 9.16308 15.5458 8.07324 15.3399C6.9834 15.134 5.96754 14.648 5.12758 13.9297C4.28762 13.2115 3.654 12.2871 3.2925 11.25"
      stroke={color}
      strokeWidth={iconStrokeWidth[size]}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default RefreshIcon;
