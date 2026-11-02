import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M0.661865 5.33811V6.67145H8.77153L6.58099 8.86198L7.5238 9.80479L10.6571 6.67145H10.6619V6.66673L11.3285 6.00005L7.5238 2.19531L6.58099 3.13812L8.78099 5.33811H0.661865Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M0.772217 6.22776V7.78331H10.2335L7.67787 10.3389L8.77781 11.4389L12.4334 7.78331H12.4389V7.77781L13.2167 7.00002L8.77781 2.56116L7.67787 3.6611L10.2445 6.22776H0.772217Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M0.882568 7.1174V8.89518H11.6954L8.77474 11.8159L10.0318 13.073L14.2096 8.89518H14.2159V8.88889L15.1048 7.99999L10.0318 2.927L8.77474 4.18408L11.7081 7.1174H0.882568Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M0.99292 8.00705V10.007H13.1574L9.87161 13.2928L11.2858 14.7071L15.9858 10.007H15.9929V9.99997L16.9929 8.99995L11.2858 3.29285L9.87161 4.70706L13.1716 8.00705H0.99292Z" fill="currentColor"/>` },
};

export const ArrowRightIcon: React.FC<BaseIconProps> = ({
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

export default ArrowRightIcon;
