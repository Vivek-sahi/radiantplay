import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M4 8.66667C5.47276 8.66667 6.66667 7.47276 6.66667 6C6.66667 4.52724 5.47276 3.33333 4 3.33333C2.52724 3.33333 1.33333 4.52724 1.33333 6C1.33333 7.47276 2.52724 8.66667 4 8.66667ZM4 10C6.20914 10 8 8.20914 8 6C8 3.79086 6.20914 2 4 2C1.79086 2 0 3.79086 0 6C0 8.20914 1.79086 10 4 10Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M8 10C10.2091 10 12 8.20914 12 6C12 3.79086 10.2091 2 8 2C5.79086 2 4 3.79086 4 6C4 8.20914 5.79086 10 8 10Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M4.66667 10.1112C6.38489 10.1112 7.77778 8.71826 7.77778 7.00004C7.77778 5.28182 6.38489 3.88893 4.66667 3.88893C2.94845 3.88893 1.55556 5.28182 1.55556 7.00004C1.55556 8.71826 2.94845 10.1112 4.66667 10.1112ZM4.66667 11.6667C7.24399 11.6667 9.33333 9.57737 9.33333 7.00004C9.33333 4.42271 7.24399 2.33337 4.66667 2.33337C2.08934 2.33337 0 4.42271 0 7.00004C0 9.57737 2.08934 11.6667 4.66667 11.6667Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M9.33333 11.6667C11.9107 11.6667 14 9.57737 14 7.00004C14 4.42271 11.9107 2.33337 9.33333 2.33337C6.75601 2.33337 4.66667 4.42271 4.66667 7.00004C4.66667 9.57737 6.75601 11.6667 9.33333 11.6667Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.33333 11.5555C7.29701 11.5555 8.88889 9.96364 8.88889 7.99996C8.88889 6.03628 7.29701 4.4444 5.33333 4.4444C3.36965 4.4444 1.77778 6.03628 1.77778 7.99996C1.77778 9.96364 3.36965 11.5555 5.33333 11.5555ZM5.33333 13.3333C8.27885 13.3333 10.6667 10.9455 10.6667 7.99996C10.6667 5.05444 8.27885 2.66663 5.33333 2.66663C2.38781 2.66663 0 5.05444 0 7.99996C0 10.9455 2.38781 13.3333 5.33333 13.3333Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M10.6667 13.3333C13.6122 13.3333 16 10.9455 16 7.99996C16 5.05444 13.6122 2.66663 10.6667 2.66663C7.72115 2.66663 5.33333 5.05444 5.33333 7.99996C5.33333 10.9455 7.72115 13.3333 10.6667 13.3333Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6 13C8.20914 13 10 11.2091 10 9C10 6.79086 8.20914 5 6 5C3.79086 5 2 6.79086 2 9C2 11.2091 3.79086 13 6 13ZM6 15C9.31371 15 12 12.3137 12 9C12 5.68629 9.31371 3 6 3C2.68629 3 0 5.68629 0 9C0 12.3137 2.68629 15 6 15Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z" fill="currentColor"/>` },
};

export const JoinLeftIcon: React.FC<BaseIconProps> = ({
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

export default JoinLeftIcon;
