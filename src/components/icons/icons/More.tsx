import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M2.66669 6C2.66669 6.55229 2.21897 7 1.66669 7C1.1144 7 0.666687 6.55229 0.666687 6C0.666687 5.44772 1.1144 5 1.66669 5C2.21897 5 2.66669 5.44772 2.66669 6Z" fill="currentColor"/>
<path d="M7.00002 6C7.00002 6.55229 6.5523 7 6.00002 7C5.44774 7 5.00002 6.55229 5.00002 6C5.00002 5.44772 5.44774 5 6.00002 5C6.5523 5 7.00002 5.44772 7.00002 6Z" fill="currentColor"/>
<path d="M10.3334 7C10.8856 7 11.3334 6.55229 11.3334 6C11.3334 5.44772 10.8856 5 10.3334 5C9.78107 5 9.33335 5.44772 9.33335 6C9.33335 6.55229 9.78107 7 10.3334 7Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M3.11113 7C3.11113 7.64433 2.5888 8.16667 1.94447 8.16667C1.30014 8.16667 0.777802 7.64433 0.777802 7C0.777802 6.35567 1.30014 5.83333 1.94447 5.83333C2.5888 5.83333 3.11113 6.35567 3.11113 7Z" fill="currentColor"/>
<path d="M8.16669 7C8.16669 7.64433 7.64436 8.16667 7.00002 8.16667C6.35569 8.16667 5.83336 7.64433 5.83336 7C5.83336 6.35567 6.35569 5.83333 7.00002 5.83333C7.64436 5.83333 8.16669 6.35567 8.16669 7Z" fill="currentColor"/>
<path d="M12.0556 8.16667C12.6999 8.16667 13.2222 7.64433 13.2222 7C13.2222 6.35567 12.6999 5.83333 12.0556 5.83333C11.4112 5.83333 10.8889 6.35567 10.8889 7C10.8889 7.64433 11.4112 8.16667 12.0556 8.16667Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M3.55555 8C3.55555 8.73638 2.9586 9.33333 2.22222 9.33333C1.48584 9.33333 0.888885 8.73638 0.888885 8C0.888885 7.26362 1.48584 6.66667 2.22222 6.66667C2.9586 6.66667 3.55555 7.26362 3.55555 8Z" fill="currentColor"/>
<path d="M9.33333 8C9.33333 8.73638 8.73638 9.33333 8 9.33333C7.26362 9.33333 6.66666 8.73638 6.66666 8C6.66666 7.26362 7.26362 6.66667 8 6.66667C8.73638 6.66667 9.33333 7.26362 9.33333 8Z" fill="currentColor"/>
<path d="M13.7778 9.33333C14.5142 9.33333 15.1111 8.73638 15.1111 8C15.1111 7.26362 14.5142 6.66667 13.7778 6.66667C13.0414 6.66667 12.4444 7.26362 12.4444 8C12.4444 8.73638 13.0414 9.33333 13.7778 9.33333Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M4 9C4 9.82843 3.32843 10.5 2.5 10.5C1.67157 10.5 1 9.82843 1 9C1 8.17157 1.67157 7.5 2.5 7.5C3.32843 7.5 4 8.17157 4 9Z" fill="currentColor"/>
<path d="M10.5 9C10.5 9.82843 9.82843 10.5 9 10.5C8.17157 10.5 7.5 9.82843 7.5 9C7.5 8.17157 8.17157 7.5 9 7.5C9.82843 7.5 10.5 8.17157 10.5 9Z" fill="currentColor"/>
<path d="M15.5 10.5C16.3284 10.5 17 9.82843 17 9C17 8.17157 16.3284 7.5 15.5 7.5C14.6716 7.5 14 8.17157 14 9C14 9.82843 14.6716 10.5 15.5 10.5Z" fill="currentColor"/>` },
};

export const MoreIcon: React.FC<BaseIconProps> = ({
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

export default MoreIcon;
