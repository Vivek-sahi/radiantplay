import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M2.66666 2V3.33333H5.33333V5.96262L6.66666 5.19282V3.33333H9.33333V2H2.66666Z" fill="currentColor"/>
<path d="M5.33333 10V9.04183L6.66666 8.27203V10H5.33333Z" fill="currentColor"/>
<path d="M10.146 3.91774L2.06311 8.58441L2.72978 9.73911L10.8127 5.07244L10.146 3.91774Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M3.11111 2.33334V3.88889H6.22222V6.9564L7.77777 6.0583V3.88889H10.8889V2.33334H3.11111Z" fill="currentColor"/>
<path d="M6.22222 11.6667V10.5488L7.77777 9.6507V11.6667H6.22222Z" fill="currentColor"/>
<path d="M11.837 4.5707L2.40697 10.0151L3.18474 11.3623L12.6148 5.91785L11.837 4.5707Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M3.55556 2.66666V4.44444H7.11111V7.95016L8.88889 6.92376V4.44444H12.4444V2.66666H3.55556Z" fill="currentColor"/>
<path d="M7.11111 13.3333V12.0558L8.88889 11.0294V13.3333H7.11111Z" fill="currentColor"/>
<path d="M13.528 5.22365L2.75082 11.4459L3.63971 12.9855L14.4169 6.76325L13.528 5.22365Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M4 3V5H8V8.94394L10 7.78924V5H14V3H4Z" fill="currentColor"/>
<path d="M8 15V13.5627L10 12.408V15H8Z" fill="currentColor"/>
<path d="M15.219 5.87661L3.09468 12.8766L4.09468 14.6087L16.219 7.60866L15.219 5.87661Z" fill="currentColor"/>` },
};

export const TextUndoIcon: React.FC<BaseIconProps> = ({
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

export default TextUndoIcon;
