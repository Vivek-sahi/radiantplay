import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M9.80479 7.3333L8.86198 8.27611L6.00005 5.41418L3.13812 8.27611L2.19531 7.3333L6.00005 3.52856L9.80479 7.3333Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M11.4388 8.55556L10.3388 9.6555L6.9999 6.31659L3.66098 9.6555L2.56104 8.55556L6.9999 4.1167L11.4388 8.55556Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M13.073 9.77782L11.8159 11.0349L7.99999 7.21899L4.18408 11.0349L2.927 9.77782L7.99999 4.70483L13.073 9.77782Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M14.7069 11L13.2927 12.4142L8.99983 8.12127L4.70694 12.4142L3.29272 11L8.99983 5.29285L14.7069 11Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const ChevronUpIcon: React.FC<BaseIconProps> = ({
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

export default ChevronUpIcon;
