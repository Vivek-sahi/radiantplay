import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M8.00661 5.45999L6.67328 6.79332V0H5.33995V6.79332L4.00662 5.45999L3.06662 6.39998L6.00661 9.33998L8.94661 6.39998L8.00661 5.45999Z" fill="currentColor"/>
<path d="M10.6666 9.99997H1.33331V11.3333H10.6666V9.99997Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M9.34106 6.36999L7.78551 7.92554V0H6.22995V7.92554L4.6744 6.36999L3.57774 7.46665L7.00773 10.8966L10.4377 7.46665L9.34106 6.36999Z" fill="currentColor"/>
<path d="M12.4444 11.6666H1.55554V13.2222H12.4444V11.6666Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M10.6755 7.27999L8.89773 9.05776V0H7.11996V9.05776L5.34218 7.27999L4.08885 8.53332L8.00884 12.4533L11.9288 8.53332L10.6755 7.27999Z" fill="currentColor"/>
<path d="M14.2222 13.3333H1.77777V15.1111H14.2222V13.3333Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M12.01 8.19L10.01 10.19V0H8.00998V10.19L6.00998 8.19L4.59998 9.6L9.00998 14.01L13.42 9.6L12.01 8.19Z" fill="currentColor"/>
<path d="M16 15H2V17H16V15Z" fill="currentColor"/>` },
};

export const DownloadIcon: React.FC<BaseIconProps> = ({
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

export default DownloadIcon;
