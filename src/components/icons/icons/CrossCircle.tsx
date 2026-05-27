import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.99998 12C9.31369 12 12 9.31369 12 5.99998C12 2.68628 9.31369 0 5.99998 0C2.68628 0 0 2.68628 0 5.99998C0 9.31369 2.68628 12 5.99998 12ZM3.18545 4.14786L4.12826 3.20506L6.01387 5.09067L7.93298 3.17157L8.87578 4.11437L6.95668 6.03348L8.84229 7.91909L7.89949 8.8619L6.01387 6.97628L4.16175 8.8284L3.21894 7.8856L5.07107 6.03348L3.18545 4.14786Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6.99998 14C10.866 14 14 10.866 14 6.99998C14 3.134 10.866 0 6.99998 0C3.134 0 0 3.134 0 6.99998C0 10.866 3.134 14 6.99998 14ZM3.71636 4.83917L4.8163 3.73923L7.01619 5.93912L9.25514 3.70016L10.3551 4.8001L8.11613 7.03906L10.316 9.23894L9.21607 10.3389L7.01619 8.139L4.85538 10.2998L3.75544 9.19987L5.91625 7.03906L3.71636 4.83917Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7.99998 16C12.4183 16 16 12.4183 16 7.99998C16 3.58171 12.4183 0 7.99998 0C3.58171 0 0 3.58171 0 7.99998C0 12.4183 3.58171 16 7.99998 16ZM4.24727 5.53049L5.50435 4.27341L8.0185 6.78756L10.5773 4.22876L11.8344 5.48583L9.27558 8.04464L11.7897 10.5588L10.5327 11.8159L8.0185 9.30172L5.549 11.7712L4.29193 10.5141L6.76143 8.04464L4.24727 5.53049Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 0 9 0C4.02944 0 0 4.02944 0 9C0 13.9706 4.02944 18 9 18ZM4.77819 6.22181L6.1924 4.8076L9.02083 7.63602L11.8995 4.75736L13.3137 6.17157L10.435 9.05024L13.2635 11.8787L11.8493 13.2929L9.02083 10.4644L6.24264 13.2426L4.82843 11.8284L7.60662 9.05024L4.77819 6.22181Z" fill="currentColor"/>` },
};

export const CrossCircleIcon: React.FC<BaseIconProps> = ({
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

export default CrossCircleIcon;
