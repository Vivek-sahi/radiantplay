import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M10.6667 4.66667V10H11.3334V11.3333H8.66669V10H9.33335V6H6.66669V10H7.33335V11.3333H4.66669V10H5.33335V6H2.66669V10H3.33335V11.3333H0.666687V10H1.33335V4.66667H5.33335V1.33333H4.66669V0H7.33335V1.33333H6.66669V4.66667H10.6667Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M12.4444 5.44444V11.6667H13.2222V13.2222H10.1111V11.6667H10.8889V7H7.77777V11.6667H8.55555V13.2222H5.44444V11.6667H6.22222V7H3.1111V11.6667H3.88888V13.2222H0.777771V11.6667H1.55555V5.44444H6.22222V1.55556H5.44444V0H8.55555V1.55556H7.77777V5.44444H12.4444Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M14.2222 6.22222V13.3333H15.1111V15.1111H11.5556V13.3333H12.4445V8H8.88892V13.3333H9.7778V15.1111H6.22225V13.3333H7.11114V8H3.55558V13.3333H4.44447V15.1111H0.888916V13.3333H1.7778V6.22222H7.11114V1.77778H6.22225V0H9.7778V1.77778H8.88892V6.22222H14.2222Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M16 7V15H17V17H13V15H14V9H10V15H11V17H7V15H8V9H4V15H5V17H1V15H2V7H8V2H7V0H11V2H10V7H16Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const SchemaIcon: React.FC<BaseIconProps> = ({
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

export default SchemaIcon;
