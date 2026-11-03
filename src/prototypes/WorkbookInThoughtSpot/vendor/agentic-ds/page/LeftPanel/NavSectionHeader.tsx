import { forwardRef } from 'react';
import { Icon } from '@components/icons';
import styles from './LeftPanel.module.css';

export interface NavSectionHeaderProps {
  label: string;
  open: boolean;
  onToggle: () => void;
}

/**
 * Collapsible group label — 12px footnote plus a chevron that rotates when the
 * section is closed.
 */
export const NavSectionHeader = forwardRef<HTMLButtonElement, NavSectionHeaderProps>(
  ({ label, open, onToggle }, ref) => (
    <button
      ref={ref}
      type="button"
      className={styles.sectionHeader}
      onClick={onToggle}
      aria-expanded={open}
    >
      <span className={styles.sectionHeaderLabel}>{label}</span>
      <span
        className={[styles.sectionHeaderChevron, open ? '' : styles.sectionHeaderChevronClosed]
          .filter(Boolean)
          .join(' ')}
      >
        <Icon name="chevron-down" size="xs" />
      </span>
    </button>
  )
);

NavSectionHeader.displayName = 'NavSectionHeader';

export default NavSectionHeader;
