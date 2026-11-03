import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.66659 2.5714L2.18307 1.57611C1.75719 1.45443 1.33325 1.7742 1.33325 2.21712V9.47299C1.33325 9.78188 1.54545 10.0503 1.846 10.1216L5.66659 11.0283V2.5714Z" fill="currentColor"/>
<path d="M6.33325 11.0283L10.1538 10.1216C10.4544 10.0503 10.6666 9.78188 10.6666 9.47299V2.21712C10.6666 1.7742 10.2426 1.45443 9.81677 1.57611L6.33325 2.5714V11.0283Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.61122 3.00004L2.54711 1.83887C2.05026 1.69691 1.55566 2.06998 1.55566 2.58672V11.0519C1.55566 11.4123 1.80322 11.7255 2.15386 11.8087L6.61122 12.8664V3.00004Z" fill="currentColor"/>
<path d="M7.389 12.8664L11.8464 11.8087C12.197 11.7255 12.4446 11.4123 12.4446 11.0519V2.58672C12.4446 2.06998 11.95 1.69691 11.4531 1.83887L7.389 3.00004V12.8664Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M7.55561 3.42857L2.91092 2.10151C2.34308 1.93928 1.77783 2.36564 1.77783 2.9562V12.6307C1.77783 13.0426 2.06076 13.4005 2.46149 13.4956L7.55561 14.7044V3.42857Z" fill="currentColor"/>
<path d="M8.4445 14.7044L13.5386 13.4956C13.9394 13.4005 14.2223 13.0426 14.2223 12.6307V2.9562C14.2223 2.36564 13.657 1.93928 13.0892 2.10151L8.4445 3.42857V14.7044Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M8.5 3.85709L3.27472 2.36416C2.6359 2.18164 2 2.6613 2 3.32568V14.2095C2 14.6728 2.31829 15.0755 2.76912 15.1825L8.5 16.5424V3.85709Z" fill="currentColor"/>
<path d="M9.5 16.5424L15.2309 15.1825C15.6817 15.0755 16 14.6728 16 14.2095V3.32568C16 2.6613 15.3641 2.18164 14.7253 2.36416L9.5 3.85709V16.5424Z" fill="currentColor"/>` },
};

export const BookIcon: React.FC<BaseIconProps> = ({
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

export default BookIcon;
