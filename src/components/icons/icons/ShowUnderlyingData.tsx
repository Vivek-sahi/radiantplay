import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 13 14', inner: `<path d="M9.70979 7.25672L12.2777 8.65714L6.49993 12.2218L0.72218 8.65714L3.29007 7.25672L6.49993 9.16638L9.70979 7.25672ZM6.50725 1.52773L12.2777 4.20126L6.5219 7.76596L0.72218 4.20126L6.50725 1.52773Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M11.014 8.23134L13.9268 9.81984L7.37307 13.8633L0.819336 9.81984L3.73211 8.23134L7.37307 10.3975L11.014 8.23134ZM7.38138 1.73291L13.9268 4.76551L7.39799 8.80897L0.819336 4.76551L7.38138 1.73291Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 17 18', inner: `<path d="M12.6975 9.48955L16.0555 11.3209L8.49999 15.9824L0.944472 11.3209L4.30248 9.48955L8.49999 11.9868L12.6975 9.48955ZM8.50957 1.9978L16.0555 5.49395L8.52872 10.1555L0.944472 5.49395L8.50957 1.9978Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M13.4444 9.5L17 11.3333L9 16L1 11.3333L4.55556 9.5L9 12L13.4444 9.5ZM9.01014 2L17 5.5L9.03042 10.1667L1 5.5L9.01014 2Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const ShowUnderlyingDataIcon: React.FC<BaseIconProps> = ({
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

export default ShowUnderlyingDataIcon;
