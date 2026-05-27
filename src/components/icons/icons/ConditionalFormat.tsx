import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M12 2H6.66667V4H12V2Z" fill="currentColor"/>
<path d="M5.33333 5.33333H0V7.33333H5.33333V5.33333Z" fill="currentColor"/>
<path d="M0 2H5.33333V4H0V2Z" fill="currentColor"/>
<path d="M5.33333 8.66667H0V10.6667H5.33333V8.66667Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M14 2.33334H7.77778V4.66668H14V2.33334Z" fill="currentColor"/>
<path d="M6.22222 6.22223H0V8.55557H6.22222V6.22223Z" fill="currentColor"/>
<path d="M0 2.33334H6.22222V4.66668H0V2.33334Z" fill="currentColor"/>
<path d="M6.22222 10.1111H0V12.4445H6.22222V10.1111Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M16 2.66666H8.88889V5.33332H16V2.66666Z" fill="currentColor"/>
<path d="M7.11111 7.1111H0V9.77777H7.11111V7.1111Z" fill="currentColor"/>
<path d="M0 2.66666H7.11111V5.33332H0V2.66666Z" fill="currentColor"/>
<path d="M7.11111 11.5555H0V14.2222H7.11111V11.5555Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M18 3H10V6H18V3Z" fill="currentColor"/>
<path d="M8 8H0V11H8V8Z" fill="currentColor"/>
<path d="M0 3H8V6H0V3Z" fill="currentColor"/>
<path d="M8 13H0V16H8V13Z" fill="currentColor"/>` },
};

export const ConditionalFormatIcon: React.FC<BaseIconProps> = ({
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

export default ConditionalFormatIcon;
