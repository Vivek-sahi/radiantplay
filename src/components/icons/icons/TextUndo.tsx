import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M2.66666 2V3.33333H5.33333V5.96262L6.66666 5.19282V3.33333H9.33333V2H2.66666Z" fill="currentColor"/>
<path d="M5.33333 10V9.04183L6.66666 8.27203V10H5.33333Z" fill="currentColor"/>
<path d="M10.146 3.91774L2.06311 8.58441L2.72978 9.73911L10.8127 5.07244L10.146 3.91774Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M3.11112 2.33337V3.88893H6.22223V6.95644L7.77779 6.05834V3.88893H10.8889V2.33337H3.11112Z" fill="currentColor"/>
<path d="M6.22223 11.6667V10.5488L7.77779 9.65074V11.6667H6.22223Z" fill="currentColor"/>
<path d="M11.837 4.57074L2.40698 10.0152L3.18476 11.3623L12.6148 5.91789L11.837 4.57074Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M3.55559 2.66663V4.4444H7.11114V7.95012L8.88892 6.92372V4.4444H12.4445V2.66663H3.55559Z" fill="currentColor"/>
<path d="M7.11114 13.3333V12.0557L8.88892 11.0293V13.3333H7.11114Z" fill="currentColor"/>
<path d="M13.5281 5.22361L2.75085 11.4458L3.63974 12.9854L14.4169 6.76321L13.5281 5.22361Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M4.00005 3V5H8.00005V8.94394L10.0001 7.78924V5H14.0001V3H4.00005Z" fill="currentColor"/>
<path d="M8.00005 15V13.5627L10.0001 12.408V15H8.00005Z" fill="currentColor"/>
<path d="M15.2191 5.87661L3.09473 12.8766L4.09473 14.6087L16.2191 7.60866L15.2191 5.87661Z" fill="currentColor"/>` },
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
