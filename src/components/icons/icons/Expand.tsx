import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M10.6666 1.33337V6.00004H9.33325V3.60937L3.60925 9.33337H5.99992V10.6667H1.33325V6.00004H2.66659V8.39004L8.38992 2.66671H5.99992V1.33337H10.6666Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M12.4446 1.55554V6.99999H10.889V4.21088L4.211 10.8889H7.00011V12.4444H1.55566V6.99999H3.11122V9.78832L9.78844 3.1111H7.00011V1.55554H12.4446Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M14.2223 1.77783V8.00005H12.4445V4.8125L4.8125 12.4445H8.00005V14.2223H1.77783V8.00005H3.55561V11.1867L11.1867 3.55561H8.00005V1.77783H14.2223Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M16 2V9H14V5.414L5.414 14H9V16H2V9H4V12.585L12.585 4H9V2H16Z" fill="currentColor"/>` },
};

export const ExpandIcon: React.FC<BaseIconProps> = ({
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

export default ExpandIcon;
