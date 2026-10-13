import React, { forwardRef } from 'react';
import styles from './ScrollArea.module.css';

export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Which directions scroll
   * @default 'vertical'
   */
  orientation?: ScrollAreaOrientation;
  /** Max height before the content scrolls, e.g. 240 or '50vh' */
  maxHeight?: number | string;
  /** Max width before the content scrolls */
  maxWidth?: number | string;
  /**
   * Makes the area focusable so keyboard users can scroll it. Give it an
   * aria-label when it is on.
   * @default true
   */
  focusable?: boolean;
  children: React.ReactNode;
}

/**
 * ScrollArea
 *
 * A light wrapper that gives its content the Figma scroll bar (17817:16155):
 * an 8px track in the secondary action background with a fully rounded thumb
 * in the tertiary content color. The vertical track is inset 8px top and
 * bottom. It is native scrolling styled with CSS, not a drawn scrollbar, and
 * it leaves global scrollbar styles alone.
 *
 * Chromium and Safari get the exact 8px bar through ::-webkit-scrollbar.
 * Firefox gets the same colors with its thin width.
 *
 * @example
 * ```tsx
 * <ScrollArea maxHeight={240} aria-label="Columns">
 *   {columns.map((c) => <div key={c}>{c}</div>)}
 * </ScrollArea>
 * ```
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(({
  orientation = 'vertical',
  maxHeight,
  maxWidth,
  focusable = true,
  className,
  style,
  children,
  ...rest
}, ref) => (
  <div
    ref={ref}
    className={[styles.root, styles[orientation], className].filter(Boolean).join(' ')}
    style={{ maxHeight, maxWidth, ...style }}
    tabIndex={focusable ? 0 : undefined}
    role={focusable && rest['aria-label'] ? 'region' : undefined}
    {...rest}
  >
    {children}
  </div>
));

ScrollArea.displayName = 'ScrollArea';

export default ScrollArea;
