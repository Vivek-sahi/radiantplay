import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M3.99325 6.53987L5.32659 5.20653V11.9999H6.65992V5.20653L7.99325 6.53987L8.93325 5.59987L5.99325 2.65987L3.05325 5.59987L3.99325 6.53987ZM10.6666 0.666504V3.33317H8.66659C8.66659 2.66649 8.00658 1.33317 5.99992 1.33317C3.99325 1.33317 3.33325 2.66649 3.33325 3.33317H1.33325V0.666504H10.6666Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M4.659 7.62985L6.21455 6.07429V13.9998H7.77011V6.07429L9.32567 7.62985L10.4223 6.53318L6.99233 3.10318L3.56233 6.53318L4.659 7.62985ZM12.4446 0.777588V3.8887H10.1112C10.1112 3.11091 9.34122 1.55537 7.00011 1.55537C4.659 1.55537 3.889 3.11091 3.889 3.8887H1.55566V0.777588H12.4446Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M5.3245 8.72007L7.10228 6.94229V16.0001H8.88006V6.94229L10.6578 8.72007L11.9112 7.46673L7.99117 3.54673L4.07117 7.46673L5.3245 8.72007ZM14.2223 0.888916V4.44447H11.5556C11.5556 3.55557 10.6756 1.7778 8.00005 1.7778C5.3245 1.7778 4.4445 3.55557 4.4445 4.44447H1.77783V0.888916H14.2223Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M5.99 9.81005L7.99 7.81005V18H9.99V7.81005L11.99 9.81005L13.4 8.40005L8.99 3.99005L4.58 8.40005L5.99 9.81005ZM16 1V5H13C13 3.99998 12.01 2 9 2C5.99 2 5 3.99998 5 5H2V1H16Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const UploadIcon: React.FC<BaseIconProps> = ({
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

export default UploadIcon;
