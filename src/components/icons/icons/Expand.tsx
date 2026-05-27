import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M10.6666 1.33333V5.99998H9.33331V3.60932L3.60932 9.33331H5.99998V10.6666H1.33333V5.99998H2.66666V8.38997L8.38998 2.66666H5.99998V1.33333H10.6666Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M12.4444 1.55555V6.99998H10.8889V4.21088L4.21088 10.8889H6.99998V12.4444H1.55555V6.99998H3.1111V9.78831L9.78831 3.1111H6.99998V1.55555H12.4444Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M14.2222 1.77777V7.99998H12.4444V4.81243L4.81243 12.4444H7.99998V14.2222H1.77777V7.99998H3.55555V11.1866L11.1866 3.55555H7.99998V1.77777H14.2222Z" fill="currentColor"/>` },
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
