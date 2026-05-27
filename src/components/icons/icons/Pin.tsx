import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M10 7.33334C10 5.33334 8.01793 4 6.66965 4V2.66667C7.3931 2.39747 8.06782 1.65207 8.01793 0.666672H4.0265C3.98159 1.63175 4.63782 2.39239 5.33632 2.66667V4C4.02649 4 2.00001 5.33334 2 7.33334H10Z" fill="currentColor"/>
<path d="M6.66966 8H5.33633V10.6667L6.003 12L6.66966 10.6667V8Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M11.6667 8.55555C11.6667 6.22222 9.35426 4.66666 7.78127 4.66666V3.1111C8.6253 2.79703 9.41247 1.9274 9.35426 0.777771H4.69759C4.6452 1.9037 5.4108 2.7911 6.22572 3.1111V4.66666C4.69758 4.66666 2.33335 6.22222 2.33334 8.55555H11.6667Z" fill="currentColor"/>
<path d="M7.78129 9.33333H6.22573V12.4444L7.00351 14L7.78129 12.4444V9.33333Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M13.3333 9.77777C13.3333 7.11111 10.6906 5.33333 8.89288 5.33333V3.55555C9.85747 3.19661 10.7571 2.20275 10.6906 0.888885H5.36867C5.3088 2.17566 6.18377 3.18984 7.1151 3.55555V5.33333C5.36866 5.33333 2.66668 7.11111 2.66667 9.77777H13.3333Z" fill="currentColor"/>
<path d="M8.89289 10.6667H7.11511V14.2222L8.004 16L8.89289 14.2222V10.6667Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M15 11C15 8 12.0269 6 10.0045 6V4C11.0897 3.59619 12.1017 2.4781 12.0269 1H6.03975C5.97239 2.44762 6.95673 3.58857 8.00448 4V6C6.03974 6 3.00001 8 3 11H15Z" fill="currentColor"/>
<path d="M10.0045 12H8.0045V16L9.0045 18L10.0045 16V12Z" fill="currentColor"/>` },
};

export const PinIcon: React.FC<BaseIconProps> = ({
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

export default PinIcon;
