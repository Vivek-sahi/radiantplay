import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M6 0C9.31371 0 12 2.68629 12 6C12 9.31371 9.31371 12 6 12C2.68629 12 0 9.31371 0 6C0 2.68629 2.68629 0 6 0ZM6 8.25C5.58579 8.25 5.25 8.58579 5.25 9C5.25 9.41421 5.58579 9.75 6 9.75C6.41421 9.75 6.75 9.41421 6.75 9C6.75 8.58579 6.41421 8.25 6 8.25ZM7.19119 2.61127H4.87601L5.25 7.5H6.75L7.19119 2.61127Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M7 0C10.866 0 14 3.13401 14 7C14 10.866 10.866 14 7 14C3.13401 14 0 10.866 0 7C0 3.13401 3.13401 0 7 0ZM7 9.625C6.51675 9.625 6.125 10.0168 6.125 10.5C6.125 10.9832 6.51675 11.375 7 11.375C7.48325 11.375 7.875 10.9832 7.875 10.5C7.875 10.0168 7.48325 9.625 7 9.625ZM8.38972 3.04648H5.68867L6.125 8.75H7.875L8.38972 3.04648Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0ZM8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13C8.55229 13 9 12.5523 9 12C9 11.4477 8.55229 11 8 11ZM9.58826 3.48169H6.50134L7 10H9L9.58826 3.48169Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M9 0C13.9706 0 18 4.02944 18 9C18 13.9706 13.9706 18 9 18C4.02944 18 0 13.9706 0 9C0 4.02944 4.02944 0 9 0ZM9 12.375C8.37868 12.375 7.875 12.8787 7.875 13.5C7.875 14.1213 8.37868 14.625 9 14.625C9.62132 14.625 10.125 14.1213 10.125 13.5C10.125 12.8787 9.62132 12.375 9 12.375ZM10.7868 3.9169H7.31401L7.875 11.25H10.125L10.7868 3.9169Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
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
