import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M7.33052 5.99507H3.33053V1.3284H1.99719V7.3284H7.33052V9.99507L10.6639 6.66307L7.33052 3.3284V5.99507Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M8.5523 6.99425H3.88563V1.5498H2.33008V8.54981H8.5523V11.6609L12.4412 7.77358L8.5523 3.88314V6.99425Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M9.77408 7.99343H4.44074V1.77121H2.66296V9.77121H9.77408V13.3268L14.2185 8.8841L9.77408 4.43788V7.99343Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M10.9958 8.9926H4.99585V1.9926H2.99585V10.9926H10.9958V14.9926L15.9958 9.9946L10.9958 4.9926V8.9926Z" fill="currentColor"/>` },
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
