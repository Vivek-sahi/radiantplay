import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M10.6667 8.66667H1.33334V10.6667H10.6667V8.66667Z" fill="currentColor"/>
<path d="M4.00001 5.33333H1.33334V7.33333H4.00001V5.33333Z" fill="currentColor"/>
<path d="M4.66668 5.33333H7.33334V7.33333H4.66668V5.33333Z" fill="currentColor"/>
<path d="M10.6667 5.33333H8.00001V7.33333H10.6667V5.33333Z" fill="currentColor"/>
<path d="M8.00001 2H10.6667V4H8.00001V2Z" fill="currentColor"/>
<path d="M7.33334 2H1.33334V4H7.33334V2Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M12.4444 10.1111H1.55556V12.4445H12.4444V10.1111Z" fill="currentColor"/>
<path d="M4.66667 6.22223H1.55556V8.55557H4.66667V6.22223Z" fill="currentColor"/>
<path d="M5.44445 6.22223H8.55556V8.55557H5.44445V6.22223Z" fill="currentColor"/>
<path d="M12.4444 6.22223H9.33333V8.55557H12.4444V6.22223Z" fill="currentColor"/>
<path d="M9.33333 2.33334H12.4444V4.66668H9.33333V2.33334Z" fill="currentColor"/>
<path d="M8.55556 2.33334H1.55556V4.66668H8.55556V2.33334Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M14.2222 11.5555H1.77777V14.2222H14.2222V11.5555Z" fill="currentColor"/>
<path d="M5.33333 7.1111H1.77777V9.77777H5.33333V7.1111Z" fill="currentColor"/>
<path d="M6.22222 7.1111H9.77777V9.77777H6.22222V7.1111Z" fill="currentColor"/>
<path d="M14.2222 7.1111H10.6667V9.77777H14.2222V7.1111Z" fill="currentColor"/>
<path d="M10.6667 2.66666H14.2222V5.33332H10.6667V2.66666Z" fill="currentColor"/>
<path d="M9.77777 2.66666H1.77777V5.33332H9.77777V2.66666Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M16 13H2V16H16V13Z" fill="currentColor"/>
<path d="M6 8H2V11H6V8Z" fill="currentColor"/>
<path d="M7 8H11V11H7V8Z" fill="currentColor"/>
<path d="M16 8H12V11H16V8Z" fill="currentColor"/>
<path d="M12 3H16V6H12V3Z" fill="currentColor"/>
<path d="M11 3H2V6H11V3Z" fill="currentColor"/>` },
};

export const PinboardIcon: React.FC<BaseIconProps> = ({
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

export default PinboardIcon;
