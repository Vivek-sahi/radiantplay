import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M8.66667 2.66663H10V10.75C10 10.9047 9.92976 11.053 9.80474 11.1624C9.67971 11.2718 9.51014 11.3333 9.33333 11.3333H2.66667C2.48986 11.3333 2.32029 11.2718 2.19526 11.1624C2.07024 11.053 2 10.9047 2 10.75V1.24996C2 1.09525 2.07024 0.946876 2.19526 0.83748C2.32029 0.728084 2.48986 0.666626 2.66667 0.666626H9.33333C9.51014 0.666626 9.67971 0.728084 9.80474 0.83748C9.92976 0.946876 10 1.09525 10 1.24996V1.99996H3.33333V2.66663H6V5.91663L7.33333 4.66663L8.66667 5.91663V2.66663Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M10.111 3.11117H11.6666V12.5417C11.6666 12.7222 11.5846 12.8953 11.4388 13.0229C11.2929 13.1506 11.0951 13.2223 10.8888 13.2223H3.11103C2.90475 13.2223 2.70692 13.1506 2.56106 13.0229C2.4152 12.8953 2.33325 12.7222 2.33325 12.5417V1.45839C2.33325 1.27789 2.4152 1.10479 2.56106 0.977162C2.70692 0.849533 2.90475 0.777832 3.11103 0.777832H10.8888C11.0951 0.777832 11.2929 0.849533 11.4388 0.977162C11.5846 1.10479 11.6666 1.27789 11.6666 1.45839V2.33339H3.88881V3.11117H6.99992V6.90283L8.55547 5.4445L10.111 6.90283V3.11117Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M11.5556 3.55558H13.3334V14.3334C13.3334 14.5396 13.2398 14.7375 13.0731 14.8833C12.9064 15.0292 12.6803 15.1111 12.4445 15.1111H3.55564C3.31989 15.1111 3.0938 15.0292 2.9271 14.8833C2.7604 14.7375 2.66675 14.5396 2.66675 14.3334V1.66669C2.66675 1.46041 2.7604 1.26258 2.9271 1.11672C3.0938 0.97086 3.31989 0.888916 3.55564 0.888916H12.4445C12.6803 0.888916 12.9064 0.97086 13.0731 1.11672C13.2398 1.26258 13.3334 1.46041 13.3334 1.66669V2.66669H4.44453V3.55558H8.00008V7.88892L9.77786 6.22225L11.5556 7.88892V3.55558Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M13 4H15V16.125C15 16.3571 14.8946 16.5796 14.7071 16.7437C14.5196 16.9078 14.2652 17 14 17H4C3.73478 17 3.48043 16.9078 3.29289 16.7437C3.10536 16.5796 3 16.3571 3 16.125V1.875C3 1.64294 3.10536 1.42038 3.29289 1.25628C3.48043 1.09219 3.73478 1 4 1H14C14.2652 1 14.5196 1.09219 14.7071 1.25628C14.8946 1.42038 15 1.64294 15 1.875V3H5V4H9V8.875L11 7L13 8.875V4Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const DocumentationIcon: React.FC<BaseIconProps> = ({
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

export default DocumentationIcon;
