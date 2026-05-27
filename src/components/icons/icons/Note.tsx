import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M9.99997 0.666662H1.99999V11.3333H7.99998L9.99997 9.33331V0.666662ZM7.33331 7.99998H3.33332V9.33331H7.33331V7.99998ZM3.33332 5.33332H8.66664V6.66665H3.33332V5.33332ZM8.66664 2.66666H3.33332V3.99999H8.66664V2.66666Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M11.6666 0.777777H2.33331V13.2222H9.33329L11.6666 10.8889V0.777777ZM8.55551 9.33331H3.88886V10.8889H8.55551V9.33331ZM3.88886 6.22221H10.1111V7.77776H3.88886V6.22221ZM10.1111 3.1111H3.88886V4.66665H10.1111V3.1111Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M13.3333 0.888883H2.66668V15.1111H10.6667L13.3333 12.4444V0.888883ZM9.77777 10.6666H4.44445V12.4444H9.77777V10.6666ZM4.44445 7.11109H11.5555V8.88886H4.44445V7.11109ZM11.5555 3.55554H4.44445V5.33331H11.5555V3.55554Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M15 1H3V17H12L15 14V1ZM11 12H5V14H11V12ZM5 8H13V10H5V8ZM13 4H5V6H13V4Z" fill="currentColor"/>` },
};

export const NoteIcon: React.FC<BaseIconProps> = ({
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

export default NoteIcon;
