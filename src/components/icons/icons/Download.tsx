import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M8.00657 5.46L6.67324 6.79333V0H5.3399V6.79333L4.00657 5.46L3.06657 6.4L6.00657 9.34L8.94657 6.4L8.00657 5.46Z" fill="currentColor"/>
<path d="M10.6666 10H1.33325V11.3333H10.6666V10Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M9.3412 6.37L7.78565 7.92555V0H6.23009V7.92555L4.67453 6.37L3.57787 7.46667L7.00787 10.8967L10.4379 7.46667L9.3412 6.37Z" fill="currentColor"/>
<path d="M12.4446 11.6667H1.55566V13.2222H12.4446V11.6667Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M10.6756 7.28L8.89781 9.05778V0H7.12003V9.05778L5.34225 7.28L4.08892 8.53333L8.00892 12.4533L11.9289 8.53333L10.6756 7.28Z" fill="currentColor"/>
<path d="M14.2223 13.3333H1.77783V15.1111H14.2223V13.3333Z" fill="currentColor"/>` },
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
