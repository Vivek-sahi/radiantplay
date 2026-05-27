import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.19531 5.13806L3.13812 4.19525L6.00005 7.05718L8.86198 4.19525L9.80479 5.13806L6.00005 8.9428L2.19531 5.13806Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.56116 5.99441L3.6611 4.89447L7.00002 8.23339L10.3389 4.89447L11.4389 5.99441L7.00002 10.4333L2.56116 5.99441Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.927 6.85077L4.18408 5.59369L7.99999 9.40959L11.8159 5.59369L13.073 6.85077L7.99999 11.9238L2.927 6.85077Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M3.29285 7.70712L4.70706 6.29291L8.99995 10.5858L13.2928 6.29291L14.7071 7.70712L8.99995 13.4142L3.29285 7.70712Z" fill="currentColor"/>` },
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
