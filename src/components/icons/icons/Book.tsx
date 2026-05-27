import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.66668 2.57143L2.18316 1.57614C1.75728 1.45446 1.33334 1.77423 1.33334 2.21715V9.47302C1.33334 9.78191 1.54554 10.0504 1.84609 10.1217L5.66668 11.0283V2.57143Z" fill="currentColor"/>
<path d="M6.33334 11.0283L10.1539 10.1217C10.4545 10.0504 10.6667 9.78191 10.6667 9.47302V2.21715C10.6667 1.77423 10.2427 1.45446 9.81686 1.57614L6.33334 2.57143V11.0283Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.61111 3.00001L2.54701 1.83884C2.05015 1.69688 1.55556 2.06995 1.55556 2.58669V11.0519C1.55556 11.4122 1.80312 11.7254 2.15376 11.8086L6.61111 12.8663V3.00001Z" fill="currentColor"/>
<path d="M7.38889 12.8663L11.8462 11.8086C12.1969 11.7254 12.4444 11.4122 12.4444 11.0519V2.58669C12.4444 2.06995 11.9499 1.69688 11.453 1.83884L7.38889 3.00001V12.8663Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M7.55555 3.42857L2.91086 2.10151C2.34302 1.93928 1.77777 2.36564 1.77777 2.9562V12.6307C1.77777 13.0426 2.0607 13.4005 2.46143 13.4956L7.55555 14.7044V3.42857Z" fill="currentColor"/>
<path d="M8.44444 14.7044L13.5386 13.4956C13.9393 13.4005 14.2222 13.0426 14.2222 12.6307V2.9562C14.2222 2.36564 13.657 1.93928 13.0891 2.10151L8.44444 3.42857V14.7044Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M8.5 3.85716L3.27472 2.36422C2.6359 2.1817 2 2.66136 2 3.32574V14.2095C2 14.6729 2.31829 15.0755 2.76912 15.1825L8.5 16.5424V3.85716Z" fill="currentColor"/>
<path d="M9.5 16.5424L15.2309 15.1825C15.6817 15.0755 16 14.6729 16 14.2095V3.32574C16 2.66136 15.3641 2.1817 14.7253 2.36422L9.5 3.85716V16.5424Z" fill="currentColor"/>` },
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
