import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M2.19531 5.13812L3.13812 4.19531L6.00005 7.05724L8.86198 4.19531L9.80479 5.13812L6.00005 8.94286L2.19531 5.13812Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M2.56104 5.99448L3.66098 4.89453L6.9999 8.23345L10.3388 4.89453L11.4388 5.99448L6.9999 10.4333L2.56104 5.99448Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M2.927 6.85071L4.18408 5.59363L7.99999 9.40953L11.8159 5.59363L13.073 6.85071L7.99999 11.9237L2.927 6.85071Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M3.29297 7.70706L4.70718 6.29285L9.00008 10.5857L13.293 6.29285L14.7072 7.70706L9.00008 13.4142L3.29297 7.70706Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const ChevronDownIcon: React.FC<BaseIconProps> = ({
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

export default ChevronDownIcon;
