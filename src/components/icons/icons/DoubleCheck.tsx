import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.16663 3.33334L5.16663 4.66667L0.666626 4.66667L0.666626 3.33334L5.16663 3.33334Z" fill="currentColor"/>
<path d="M5.16663 7.5L5.16663 8.83333L0.666626 8.83333L0.666626 7.5L5.16663 7.5Z" fill="currentColor"/>
<path d="M11.3378 2.47142L7.98325 5.82592L5.86193 3.7046L6.80474 2.76179L7.98325 3.9403L10.3949 1.52861L11.3378 2.47142Z" fill="currentColor"/>
<path d="M11.321 6.63808L7.98322 9.97589L5.8619 7.85457L6.80471 6.91176L7.98322 8.09027L10.3782 5.69527L11.321 6.63808Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.02783 3.88889L6.02783 5.44444L0.777832 5.44444L0.777832 3.88889L6.02783 3.88889Z" fill="currentColor"/>
<path d="M6.02783 8.75L6.02783 10.3056L0.777832 10.3056L0.777832 8.75L6.02783 8.75Z" fill="currentColor"/>
<path d="M13.2274 2.88332L9.31386 6.7969L6.83898 4.32203L7.93893 3.22209L9.31386 4.59702L12.1275 1.78338L13.2274 2.88332Z" fill="currentColor"/>
<path d="M13.2079 7.74444L9.31379 11.6385L6.83892 9.16367L7.93886 8.06373L9.31379 9.43866L12.108 6.64449L13.2079 7.74444Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M6.88892 4.44444L6.88892 6.22222L0.888916 6.22222L0.888916 4.44444L6.88892 4.44444Z" fill="currentColor"/>
<path d="M6.88892 10L6.88892 11.7778L0.888916 11.7778L0.888916 10L6.88892 10Z" fill="currentColor"/>
<path d="M15.117 3.29522L10.6443 7.76789L7.81591 4.93946L9.07299 3.68238L10.6443 5.25373L13.8599 2.03815L15.117 3.29522Z" fill="currentColor"/>
<path d="M15.0947 8.85078L10.6442 13.3012L7.81582 10.4728L9.0729 9.21569L10.6442 10.787L13.8376 7.5937L15.0947 8.85078Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M7.75 5L7.75 7L1 7L1 5L7.75 5Z" fill="currentColor"/>
<path d="M7.75 11.25L7.75 13.25L1 13.25L1 11.25L7.75 11.25Z" fill="currentColor"/>
<path d="M17.0067 3.70713L11.9749 8.73888L8.79296 5.55689L10.2072 4.14268L11.9749 5.91045L15.5925 2.29291L17.0067 3.70713Z" fill="currentColor"/>
<path d="M16.9815 9.95713L11.9748 14.9638L8.79284 11.7819L10.2071 10.3676L11.9748 12.1354L15.5673 8.54291L16.9815 9.95713Z" fill="currentColor"/>` },
};

export const DoubleCheckIcon: React.FC<BaseIconProps> = ({
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

export default DoubleCheckIcon;
