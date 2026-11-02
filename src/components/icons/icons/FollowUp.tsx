import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M7.33054 5.99504H3.33054V1.32837H1.99721V7.32837H7.33054V9.99504L10.6639 6.66304L7.33054 3.32837V5.99504Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M8.5523 6.99425H3.88563V1.5498H2.33008V8.54981H8.5523V11.6609L12.4412 7.77358L8.5523 3.88314V6.99425Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M9.77406 7.99346H4.44073V1.77124H2.66295V9.77124H9.77406V13.3268L14.2185 8.88413L9.77406 4.43791V7.99346Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M10.9958 8.99256H4.99582V1.99255H2.99582V10.9926H10.9958V14.9926L15.9958 9.99456L10.9958 4.99255V8.99256Z" fill="currentColor"/>` },
};

export const FollowUpIcon: React.FC<BaseIconProps> = ({
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

export default FollowUpIcon;
