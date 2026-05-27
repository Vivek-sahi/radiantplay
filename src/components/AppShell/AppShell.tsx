import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { referenceColors } from '../../tokens/colors';
import { AppSidebar, AppSidebarProps } from '../AppSidebar';
import { GlobalHeader, GlobalHeaderProps } from '../GlobalHeader';
import styles from './AppShell.module.css';

const classNames = (...values: Array<string | undefined | false>): string =>
  values.filter(Boolean).join(' ');

export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  headerProps: GlobalHeaderProps;
  sidebarProps: AppSidebarProps;
  hideSidebar?: boolean;
  overlaySlot?: React.ReactNode;
  contentBackground?: string;
  children: React.ReactNode;
}

export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(
  (
    {
      headerProps,
      sidebarProps,
      hideSidebar = false,
      overlaySlot,
      contentBackground = referenceColors.gray['10'],
      children,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const [isOverlaySidebarOpen, setIsOverlaySidebarOpen] = useState(false);

    const sidebarWidth = sidebarProps.width ?? 260;
    const shouldShowHamburger = headerProps.showHamburger ?? hideSidebar;

    useEffect(() => {
      if (!hideSidebar) {
        setIsOverlaySidebarOpen(false);
      }
    }, [hideSidebar]);

    const {
      className: headerClassName,
      onHamburgerClick,
      showHamburger,
      ...headerRest
    } = headerProps;
    const {
      className: sidebarClassName,
      onClose: onSidebarClose,
      isOverlay: sidebarIsOverlay,
      ...sidebarRest
    } = sidebarProps;

    const shellStyles: React.CSSProperties = useMemo(
      () => ({
        '--ash-sidebar-width': `${sidebarWidth}px`,
        '--ash-content-bg': contentBackground,
        ...style,
      }) as React.CSSProperties,
      [contentBackground, sidebarWidth, style],
    );

    const handleHamburgerClick = (): void => {
      onHamburgerClick?.();
      if (hideSidebar) {
        setIsOverlaySidebarOpen((prev) => !prev);
      }
    };

    const handleOverlayClose = (): void => {
      setIsOverlaySidebarOpen(false);
      onSidebarClose?.();
    };

    return (
      <div ref={ref} className={classNames(styles.shell, className)} style={shellStyles} {...props}>
        <GlobalHeader
          {...headerRest}
          className={classNames(styles.header, headerClassName)}
          showHamburger={shouldShowHamburger}
          onHamburgerClick={handleHamburgerClick}
        />

        <div className={styles.body}>
          {!hideSidebar && (
            <AppSidebar
              {...sidebarRest}
              className={classNames(styles.sidebar, sidebarClassName)}
              isOverlay={sidebarIsOverlay}
              onClose={onSidebarClose}
            />
          )}

          <main className={classNames(styles.content, hideSidebar && styles.contentNoSidebar)}>{children}</main>

          {hideSidebar && isOverlaySidebarOpen && (
            <div className={styles.sidebarOverlayContainer}>
              <AppSidebar
                {...sidebarRest}
                className={classNames(styles.sidebarOverlay, sidebarClassName)}
                isOverlay
                onClose={handleOverlayClose}
              />
              <button
                type="button"
                className={styles.sidebarOverlayBackdrop}
                onClick={handleOverlayClose}
                aria-label="Close sidebar overlay"
              />
            </div>
          )}

          {overlaySlot && <div className={styles.overlaySlot}>{overlaySlot}</div>}
        </div>
      </div>
    );
  },
);

AppShell.displayName = 'AppShell';

export default AppShell;
