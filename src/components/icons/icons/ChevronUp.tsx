import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M9.80467 7.33333L8.86186 8.27614L5.99993 5.41421L3.138 8.27614L2.19519 7.33333L5.99993 3.52859L9.80467 7.33333Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M11.4388 8.55556L10.3388 9.6555L6.9999 6.31659L3.66098 9.6555L2.56104 8.55556L6.9999 4.1167L11.4388 8.55556Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M13.073 9.77779L11.8159 11.0349L7.99999 7.21896L4.18408 11.0349L2.927 9.77779L7.99999 4.7048L13.073 9.77779Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M14.7071 11L13.2928 12.4142L8.99995 8.12133L4.70706 12.4142L3.29285 11L8.99995 5.29291L14.7071 11Z" fill="currentColor"/>` },
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
