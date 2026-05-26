import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize, iconStrokeWidth } from '../../../tokens/icons';

export const DatabaseIcon: React.FC<BaseIconProps> = ({
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
      d="M3 5c0-1.1 2.686-2 6-2s6 .9 6 2v8c0 1.1-2.686 2-6 2s-6-.9-6-2V5Z"
      stroke={color}
      strokeWidth={iconStrokeWidth[size]}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 5c0 1.1-2.686 2-6 2S3 6.1 3 5"
      stroke={color}
      strokeWidth={iconStrokeWidth[size]}
      strokeLinecap="round"
    />
    <path
      d="M15 9c0 1.1-2.686 2-6 2S3 10.1 3 9"
      stroke={color}
      strokeWidth={iconStrokeWidth[size]}
      strokeLinecap="round"
    />
  </svg>
);

export default DatabaseIcon;
