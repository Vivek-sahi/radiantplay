import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8.66664 2.66666H9.99997V10.75C9.99997 10.9047 9.92974 11.0531 9.80471 11.1625C9.67969 11.2719 9.51012 11.3333 9.33331 11.3333H2.66666C2.48985 11.3333 2.32028 11.2719 2.19526 11.1625C2.07023 11.0531 1.99999 10.9047 1.99999 10.75V1.25C1.99999 1.09529 2.07023 0.94692 2.19526 0.837524C2.32028 0.728128 2.48985 0.66667 2.66666 0.66667H9.33331C9.51012 0.66667 9.67969 0.728128 9.80471 0.837524C9.92974 0.94692 9.99997 1.09529 9.99997 1.25V2H3.33332V2.66666H5.99998V5.91666L7.33331 4.66666L8.66664 5.91666V2.66666Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M10.1111 3.11109H11.6666V12.5416C11.6666 12.7221 11.5847 12.8952 11.4388 13.0228C11.2929 13.1505 11.0951 13.2222 10.8888 13.2222H3.11108C2.9048 13.2222 2.70697 13.1505 2.56111 13.0228C2.41525 12.8952 2.33331 12.7221 2.33331 12.5416V1.45832C2.33331 1.27783 2.41525 1.10473 2.56111 0.977098C2.70697 0.849469 2.9048 0.777768 3.11108 0.777768H10.8888C11.0951 0.777768 11.2929 0.849469 11.4388 0.977098C11.5847 1.10473 11.6666 1.27783 11.6666 1.45832V2.33332H3.88886V3.11109H6.99996V6.90275L8.55551 5.44442L10.1111 6.90275V3.11109Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M11.5555 3.55554H13.3333V14.3333C13.3333 14.5396 13.2397 14.7374 13.073 14.8833C12.9063 15.0291 12.6802 15.1111 12.4444 15.1111H3.55557C3.31982 15.1111 3.09373 15.0291 2.92703 14.8833C2.76033 14.7374 2.66668 14.5396 2.66668 14.3333V1.66666C2.66668 1.46038 2.76033 1.26255 2.92703 1.11669C3.09373 0.970827 3.31982 0.888883 3.55557 0.888883H12.4444C12.6802 0.888883 12.9063 0.970827 13.073 1.11669C13.2397 1.26255 13.3333 1.46038 13.3333 1.66666V2.66666H4.44445V3.55554H8V7.88886L9.77777 6.2222L11.5555 7.88886V3.55554Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M13 4H15V16.125C15 16.3571 14.8946 16.5796 14.7071 16.7437C14.5196 16.9078 14.2652 17 14 17H4C3.73478 17 3.48043 16.9078 3.29289 16.7437C3.10536 16.5796 3 16.3571 3 16.125V1.875C3 1.64294 3.10536 1.42038 3.29289 1.25628C3.48043 1.09219 3.73478 1 4 1H14C14.2652 1 14.5196 1.09219 14.7071 1.25628C14.8946 1.42038 15 1.64294 15 1.875V3H5V4H9V8.875L11 7L13 8.875V4Z" fill="currentColor"/>` },
};

export const DocumentationIcon: React.FC<BaseIconProps> = ({
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

export default DocumentationIcon;
