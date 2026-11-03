import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M6 12C9.31371 12 12 9.31371 12 6C12 2.68629 9.31371 0 6 0C2.68629 0 0 2.68629 0 6C0 9.31371 2.68629 12 6 12ZM3.18546 4.14787L4.12827 3.20506L6.01389 5.09068L7.933 3.17157L8.87581 4.11438L6.9567 6.03349L8.84231 7.91911L7.89951 8.86192L6.01389 6.9763L4.16176 8.82843L3.21895 7.88562L5.07108 6.03349L3.18546 4.14787Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14ZM3.71637 4.83919L4.81631 3.73924L7.0162 5.93913L9.25516 3.70017L10.3551 4.80011L8.11615 7.03907L10.316 9.23896L9.21609 10.3389L7.0162 8.13902L4.85539 10.2998L3.75544 9.19989L5.91626 7.03907L3.71637 4.83919Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM4.24728 5.5305L5.50436 4.27342L8.01852 6.78758L10.5773 4.22876L11.8344 5.48584L9.2756 8.04465L11.7898 10.5588L10.5327 11.8159L8.01852 9.30173L5.54901 11.7712L4.29194 10.5142L6.76144 8.04465L4.24728 5.5305Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 0 9 0C4.02944 0 0 4.02944 0 9C0 13.9706 4.02944 18 9 18ZM4.77819 6.22181L6.1924 4.8076L9.02083 7.63602L11.8995 4.75736L13.3137 6.17157L10.435 9.05024L13.2635 11.8787L11.8493 13.2929L9.02083 10.4644L6.24264 13.2426L4.82843 11.8284L7.60662 9.05024L4.77819 6.22181Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
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
