import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.66675 3.00004C5.66675 3.92052 4.92056 4.66671 4.00008 4.66671C3.07961 4.66671 2.33342 3.92052 2.33342 3.00004C2.33342 2.07957 3.07961 1.33337 4.00008 1.33337C4.92056 1.33337 5.66675 2.07957 5.66675 3.00004Z" fill="currentColor"/>
<path d="M10.3334 2.25004H9.00009V4.00004H7.33342V5.33338H9.00009V6.91671H10.3334V5.33338H12.0001V4.00004H10.3334V2.25004Z" fill="currentColor"/>
<path d="M0.666748 8.58338C0.666748 6.74243 2.15913 5.25004 4.00008 5.25004C5.84103 5.25004 7.33342 6.74243 7.33342 8.58338V10.6667H0.666748V8.58338Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.61117 3.49999C6.61117 4.57387 5.74061 5.44443 4.66672 5.44443C3.59284 5.44443 2.72228 4.57387 2.72228 3.49999C2.72228 2.4261 3.59284 1.55554 4.66672 1.55554C5.74061 1.55554 6.61117 2.4261 6.61117 3.49999Z" fill="currentColor"/>
<path d="M12.0556 2.62499H10.5001V4.66665H8.55561V6.22221H10.5001V8.06943H12.0556V6.22221H14.0001V4.66665H12.0556V2.62499Z" fill="currentColor"/>
<path d="M0.777832 10.0139C0.777832 7.86611 2.51895 6.12499 4.66672 6.12499C6.8145 6.12499 8.55561 7.8661 8.55561 10.0139V12.4444H0.777832V10.0139Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M7.55558 4.00005C7.55558 5.22735 6.56066 6.22228 5.33336 6.22228C4.10606 6.22228 3.11114 5.22735 3.11114 4.00005C3.11114 2.77275 4.10606 1.77783 5.33336 1.77783C6.56066 1.77783 7.55558 2.77275 7.55558 4.00005Z" fill="currentColor"/>
<path d="M13.7778 3.00005H12V5.33339H9.7778V7.11117H12V9.22228H13.7778V7.11117H16V5.33339H13.7778V3.00005Z" fill="currentColor"/>
<path d="M0.888916 11.4445C0.888916 8.9899 2.87876 7.00005 5.33336 7.00005C7.78796 7.00005 9.7778 8.9899 9.7778 11.4445V14.2223H0.888916V11.4445Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M8.5 4.5C8.5 5.88071 7.38071 7 6 7C4.61929 7 3.5 5.88071 3.5 4.5C3.5 3.11929 4.61929 2 6 2C7.38071 2 8.5 3.11929 8.5 4.5Z" fill="currentColor"/>
<path d="M15.5 3.375H13.5V6H11V8H13.5V10.375H15.5V8H18V6H15.5V3.375Z" fill="currentColor"/>
<path d="M1 12.875C1 10.1136 3.23858 7.875 6 7.875C8.76142 7.875 11 10.1136 11 12.875V16H1V12.875Z" fill="currentColor"/>` },
};

export const AddUserIcon: React.FC<BaseIconProps> = ({
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

export default AddUserIcon;
