import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.99998 0C9.31369 0 12 2.68628 12 5.99998C12 9.31369 9.31369 12 5.99998 12C2.68628 12 0 9.31369 0 5.99998C0 2.68628 2.68628 0 5.99998 0ZM5.99998 8.24998C5.58577 8.24998 5.24999 8.58576 5.24999 8.99998C5.24999 9.41419 5.58577 9.74998 5.99998 9.74998C6.4142 9.74998 6.74998 9.41419 6.74998 8.99998C6.74998 8.58576 6.4142 8.24998 5.99998 8.24998ZM7.19117 2.61126H4.87599L5.24999 7.49998H6.74998L7.19117 2.61126Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6.99998 0C10.866 0 14 3.134 14 6.99998C14 10.866 10.866 14 6.99998 14C3.134 14 0 10.866 0 6.99998C0 3.134 3.134 0 6.99998 0ZM6.99998 9.62498C6.51674 9.62498 6.12499 10.0167 6.12499 10.5C6.12499 10.9832 6.51674 11.375 6.99998 11.375C7.48323 11.375 7.87498 10.9832 7.87498 10.5C7.87498 10.0167 7.48323 9.62498 6.99998 9.62498ZM8.38971 3.04647H5.68866L6.12499 8.74998H7.87498L8.38971 3.04647Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7.99998 0C12.4183 0 16 3.58171 16 7.99998C16 12.4183 12.4183 16 7.99998 16C3.58171 16 0 12.4183 0 7.99998C0 3.58171 3.58171 0 7.99998 0ZM7.99998 11C7.4477 11 6.99999 11.4477 6.99999 12C6.99999 12.5523 7.4477 13 7.99998 13C8.55227 13 8.99998 12.5523 8.99998 12C8.99998 11.4477 8.55227 11 7.99998 11ZM9.58824 3.48168H6.50133L6.99999 9.99998H8.99998L9.58824 3.48168Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M9 0C13.9706 0 18 4.02944 18 9C18 13.9706 13.9706 18 9 18C4.02944 18 0 13.9706 0 9C0 4.02944 4.02944 0 9 0ZM9 12.375C8.37868 12.375 7.875 12.8787 7.875 13.5C7.875 14.1213 8.37868 14.625 9 14.625C9.62132 14.625 10.125 14.1213 10.125 13.5C10.125 12.8787 9.62132 12.375 9 12.375ZM10.7868 3.9169H7.31401L7.875 11.25H10.125L10.7868 3.9169Z" fill="currentColor"/>` },
};

export const ExclamationPointCircleIcon: React.FC<BaseIconProps> = ({
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

export default ExclamationPointCircleIcon;
