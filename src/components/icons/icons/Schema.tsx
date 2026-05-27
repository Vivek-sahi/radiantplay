import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M10.6666 4.66665V9.99997H11.3333V11.3333H8.6666V9.99997H9.33327V5.99998H6.66661V9.99997H7.33327V11.3333H4.66661V9.99997H5.33328V5.99998H2.66662V9.99997H3.33328V11.3333H0.666624V9.99997H1.33329V4.66665H5.33328V1.33333H4.66661V0H7.33327V1.33333H6.66661V4.66665H10.6666Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M12.4445 5.44443V11.6666H13.2222V13.2222H10.1111V11.6666H10.8889V6.99998H7.77781V11.6666H8.55558V13.2222H5.44448V11.6666H6.22226V6.99998H3.11116V11.6666H3.88893V13.2222H0.777829V11.6666H1.5556V5.44443H6.22226V1.55555H5.44448V0H8.55558V1.55555H7.77781V5.44443H12.4445Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M14.2222 6.2222V13.3333H15.1111V15.1111H11.5555V13.3333H12.4444V7.99998H8.88889V13.3333H9.77778V15.1111H6.22223V13.3333H7.11112V7.99998H3.55557V13.3333H4.44446V15.1111H0.888913V13.3333H1.7778V6.2222H7.11112V1.77777H6.22223V0H9.77778V1.77777H8.88889V6.2222H14.2222Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M16 7V15H17V17H13V15H14V9H10V15H11V17H7V15H8V9H4V15H5V17H1V15H2V7H8V2H7V0H11V2H10V7H16Z" fill="currentColor"/>` },
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
