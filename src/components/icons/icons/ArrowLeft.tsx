import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M11.3285 6.66199L11.3285 5.32865L3.21888 5.32865L5.40941 3.13812L4.4666 2.19531L1.33326 5.32865L1.32854 5.32865L1.32854 5.33337L0.661866 6.00005L4.46661 9.80479L5.40941 8.86198L3.20942 6.66199L11.3285 6.66199Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M13.2167 7.77228V6.21672H3.7554L6.31102 3.6611L5.21108 2.56116L1.55551 6.21672H1.55V6.22223L0.772217 7.00002L5.21108 11.4389L6.31102 10.3389L3.74436 7.77228H13.2167Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M15.1048 8.88257L15.1048 7.10479L4.29192 7.10479L7.21263 4.18408L5.95555 2.927L1.77776 7.10479L1.77147 7.10479L1.77147 7.11108L0.882569 7.99999L5.95555 13.073L7.21263 11.8159L4.27931 8.88257L15.1048 8.88257Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M16.9927 9.99286V7.99286H4.8282L8.114 4.70706L6.69978 3.29285L1.99977 7.99286H1.99269V7.99994L0.992676 8.99995L6.69978 14.7071L8.114 13.2928L4.81401 9.99286H16.9927Z" fill="currentColor"/>` },
};

export const ArrowLeftIcon: React.FC<BaseIconProps> = ({
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

export default ArrowLeftIcon;
