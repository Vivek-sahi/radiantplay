import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.33337 2H8.66671V2.66667H7.59996L5.81363 9.33333H6.66671V10H3.33337V9.33333H4.43326L6.21959 2.66667H5.33337V2Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6.22225 2.33331H10.1111V3.11109H8.8666L6.78255 10.8889H7.7778V11.6666H3.88892V10.8889H5.17212L7.25617 3.11109H6.22225V2.33331Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7.11112 2.66669H11.5556V3.55558H10.1332L7.75147 12.4445H8.8889V13.3334H4.44446V12.4445H5.91098L8.29275 3.55558H7.11112V2.66669Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8 3H13V4H11.3999L8.72039 14H10V15H5V14H6.64983L9.32933 4H8V3Z" fill="currentColor"/>` },
};

export const ItalicIcon: React.FC<BaseIconProps> = ({
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

export default ItalicIcon;
