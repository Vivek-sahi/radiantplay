import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M10.9336 6C10.9336 3.2754 8.7246 1.06641 6 1.06641C3.2754 1.06641 1.06641 3.2754 1.06641 6C1.06641 8.7246 3.2754 10.9336 6 10.9336V12C2.68629 12 0 9.31371 0 6C0 2.68629 2.68629 0 6 0C9.31371 0 12 2.68629 12 6C12 9.31371 9.31371 12 6 12V10.9336C8.7246 10.9336 10.9336 8.7246 10.9336 6Z" fill="currentColor"/>
<path d="M6.66663 2.66667H5.33329L5.33329 5.33334L2.66663 5.33334L2.66663 6.66667H5.33329L5.33329 9.33334H6.66663V6.66667H9.33329V5.33334L6.66663 5.33334V2.66667Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M12.7559 7C12.7559 3.82129 10.1787 1.24414 7 1.24414C3.82129 1.24414 1.24414 3.82129 1.24414 7C1.24414 10.1787 3.82129 12.7559 7 12.7559V14C3.13401 14 0 10.866 0 7C0 3.13401 3.13401 0 7 0C10.866 0 14 3.13401 14 7C14 10.866 10.866 14 7 14V12.7559C10.1787 12.7559 12.7559 10.1787 12.7559 7Z" fill="currentColor"/>
<path d="M7.77775 3.11111H6.2222L6.2222 6.22223L3.11108 6.22223L3.11108 7.77778H6.2222L6.2222 10.8889H7.77775V7.77778H10.8889V6.22223L7.77775 6.22223L7.77775 3.11111Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M14.5781 8C14.5781 4.36719 11.6328 1.42188 8 1.42188C4.36719 1.42188 1.42188 4.36719 1.42188 8C1.42188 11.6328 4.36719 14.5781 8 14.5781V16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16V14.5781C11.6328 14.5781 14.5781 11.6328 14.5781 8Z" fill="currentColor"/>
<path d="M8.88888 3.55556H7.1111L7.1111 7.11111L3.55554 7.11111L3.55554 8.88889H7.1111L7.1111 12.4444H8.88888V8.88889H12.4444V7.11111L8.88888 7.11111L8.88888 3.55556Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M16.4004 9C16.4004 4.91309 13.0869 1.59961 9 1.59961C4.91309 1.59961 1.59961 4.91309 1.59961 9C1.59961 13.0869 4.91309 16.4004 9 16.4004V18C4.02944 18 0 13.9706 0 9C0 4.02944 4.02944 0 9 0C13.9706 0 18 4.02944 18 9C18 13.9706 13.9706 18 9 18V16.4004C13.0869 16.4004 16.4004 13.0869 16.4004 9Z" fill="currentColor"/>
<path d="M10 4H8L8 8L4 8L4 10H8L8 14H10V10H14V8L10 8L10 4Z" fill="currentColor"/>` },
};

export const CrossCircle2Icon: React.FC<BaseIconProps> = ({
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

export default CrossCircle2Icon;
