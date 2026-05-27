import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M2 1.99982H10V3.33315H2V1.99982ZM2 5.33315H10V6.66648H2V5.33315ZM2 8.66648H10V9.99982H2V8.66648Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M2.33337 2.33316H11.6667V3.88872H2.33337V2.33316ZM2.33337 6.22205H11.6667V7.7776H2.33337V6.22205ZM2.33337 10.1109H11.6667V11.6665H2.33337V10.1109Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M2.66669 2.66667H13.3334V4.44445H2.66669V2.66667ZM2.66669 7.11112H13.3334V8.88889H2.66669V7.11112ZM2.66669 11.5556H13.3334V13.3333H2.66669V11.5556Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M3 3H15V5H3V3ZM3 8H15V10H3V8ZM3 13H15V15H3V13Z" fill="currentColor"/>` },
};

export const HamburgerIcon: React.FC<BaseIconProps> = ({
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

export default HamburgerIcon;
