import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M10.6666 8.66667H1.33325V10.6667H10.6666V8.66667Z" fill="currentColor"/>
<path d="M3.99992 5.33333H1.33325V7.33333H3.99992V5.33333Z" fill="currentColor"/>
<path d="M4.66659 5.33333H7.33325V7.33333H4.66659V5.33333Z" fill="currentColor"/>
<path d="M10.6666 5.33333H7.99992V7.33333H10.6666V5.33333Z" fill="currentColor"/>
<path d="M7.99992 2H10.6666V4H7.99992V2Z" fill="currentColor"/>
<path d="M7.33325 2H1.33325V4H7.33325V2Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M12.4446 10.1112H1.55566V12.4445H12.4446V10.1112Z" fill="currentColor"/>
<path d="M4.66678 6.22226H1.55566V8.5556H4.66678V6.22226Z" fill="currentColor"/>
<path d="M5.44455 6.22226H8.55566V8.5556H5.44455V6.22226Z" fill="currentColor"/>
<path d="M12.4446 6.22226H9.33344V8.5556H12.4446V6.22226Z" fill="currentColor"/>
<path d="M9.33344 2.33337H12.4446V4.66671H9.33344V2.33337Z" fill="currentColor"/>
<path d="M8.55566 2.33337H1.55566V4.66671H8.55566V2.33337Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M14.2223 11.5555H1.77783V14.2222H14.2223V11.5555Z" fill="currentColor"/>
<path d="M5.33339 7.11107H1.77783V9.77774H5.33339V7.11107Z" fill="currentColor"/>
<path d="M6.22228 7.11107H9.77783V9.77774H6.22228V7.11107Z" fill="currentColor"/>
<path d="M14.2223 7.11107H10.6667V9.77774H14.2223V7.11107Z" fill="currentColor"/>
<path d="M10.6667 2.66663H14.2223V5.33329H10.6667V2.66663Z" fill="currentColor"/>
<path d="M9.77783 2.66663H1.77783V5.33329H9.77783V2.66663Z" fill="currentColor"/>` },
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
