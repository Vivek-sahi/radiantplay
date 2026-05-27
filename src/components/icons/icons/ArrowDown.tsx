import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M6.65717 0.666656H5.32383V8.77632L3.1333 6.58578L2.19049 7.52859L5.32383 10.6619V10.6667H5.32855L5.99523 11.3333L9.79997 7.52859L8.85716 6.58578L6.65717 8.78578V0.666656Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M7.76669 0.777767H6.21114V10.239L3.65552 7.68342L2.55557 8.78336L6.21114 12.4389V12.4444H6.21665L6.99443 13.2222L11.4333 8.78336L10.3334 7.68342L7.76669 10.2501V0.777767Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8.87622 0.888878H7.09844V11.7018L4.17773 8.78105L2.92065 10.0381L7.09844 14.2159V14.2222H7.10474L7.99364 15.1111L13.0666 10.0381L11.8095 8.78105L8.87622 11.7144V0.888878Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M9.98575 0.999985H7.98575V13.1645L4.69995 9.87868L3.28574 11.2929L7.98575 15.9929V16H7.99283L8.99284 17L14.6999 11.2929L13.2857 9.87868L9.98575 13.1787V0.999985Z" fill="currentColor"/>` },
};

export const ArrowDownIcon: React.FC<BaseIconProps> = ({
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

export default ArrowDownIcon;
