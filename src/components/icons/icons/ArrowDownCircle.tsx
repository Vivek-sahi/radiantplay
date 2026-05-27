import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6 0C2.68629 -2.89694e-07 2.89694e-07 2.68629 0 6C-2.89694e-07 9.31371 2.68629 12 6 12C9.31371 12 12 9.31371 12 6C12 2.68629 9.31371 2.89694e-07 6 0ZM5.99997 10L3.11322 7L5.3333 7L5.3333 2L6.66663 2L6.66663 7H8.88672L5.99997 10Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7 0C3.13401 -3.37976e-07 3.37976e-07 3.13401 0 7C-3.37976e-07 10.866 3.13401 14 7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 3.37976e-07 7 0ZM6.99996 11.6667L3.63208 8.16667H6.22218L6.22218 2.33333H7.77774L7.77774 8.16667H10.3678L6.99996 11.6667Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8 0C3.58172 -3.86258e-07 3.86258e-07 3.58172 0 8C-3.86258e-07 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 3.86258e-07 8 0ZM7.99996 13.3333L4.15095 9.33333H7.11107L7.11107 2.66667H8.88885L8.88884 9.33333H11.849L7.99996 13.3333Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M9 0C4.02944 -4.3454e-07 4.3454e-07 4.02944 0 9C-4.3454e-07 13.9706 4.02944 18 9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 4.3454e-07 9 0ZM8.99995 15L4.66982 10.5L7.99995 10.5L7.99995 3L9.99995 3L9.99995 10.5H13.3301L8.99995 15Z" fill="currentColor"/>` },
};

export const ArrowDownCircleIcon: React.FC<BaseIconProps> = ({
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

export default ArrowDownCircleIcon;
