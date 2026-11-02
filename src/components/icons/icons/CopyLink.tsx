import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M0.666748 3.33333C0.666748 2.59695 1.18908 2 1.83341 2H4.66675V3.33333H2.00008V8.66667H4.66675V10H1.83341C1.18908 10 0.666748 9.40305 0.666748 8.66667V3.33333ZM3.33341 5.33333H8.66675V6.66667H3.33341V5.33333ZM10.1667 10C10.8111 10 11.3334 9.40305 11.3334 8.66667V3.33333C11.3334 2.59695 10.8111 2 10.1667 2H7.33341V3.33333H10.0001V8.66667H7.33341V10H10.1667Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M0.777832 3.88893C0.777832 3.02982 1.38722 2.33337 2.13894 2.33337H5.4445V3.88893H2.33339V10.1112H5.4445V11.6667H2.13894C1.38722 11.6667 0.777832 10.9703 0.777832 10.1112V3.88893ZM3.88894 6.22226H10.1112V7.77782H3.88894V6.22226ZM11.8612 11.6667C12.6129 11.6667 13.2223 10.9703 13.2223 10.1112V3.88893C13.2223 3.02982 12.6129 2.33337 11.8612 2.33337H8.55561V3.88893H11.6667V10.1112H8.55561V11.6667H11.8612Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M0.888916 4.4444C0.888916 3.46256 1.58536 2.66663 2.44447 2.66663H6.22225V4.4444H2.66669V11.5555H6.22225V13.3333H2.44447C1.58536 13.3333 0.888916 12.5374 0.888916 11.5555V4.4444ZM4.44447 7.11107H11.5556V8.88885H4.44447V7.11107ZM13.5556 13.3333C14.4147 13.3333 15.1111 12.5374 15.1111 11.5555V4.4444C15.1111 3.46256 14.4147 2.66663 13.5556 2.66663H9.7778V4.4444H13.3334V11.5555H9.7778V13.3333H13.5556Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 20 18', inner: `<path d="M1.11108 5C1.11108 3.89543 1.98164 3 3.05553 3H7.77775V5H3.33331V13H7.77775V15H3.05553C1.98164 15 1.11108 14.1046 1.11108 13V5ZM5.55553 8H14.4444V10H5.55553V8ZM16.9444 15C18.0183 15 18.8889 14.1046 18.8889 13V5C18.8889 3.89543 18.0183 3 16.9444 3H12.2222V5H16.6666V13H12.2222V15H16.9444Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const CopyLinkIcon: React.FC<BaseIconProps> = ({
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

export default CopyLinkIcon;
