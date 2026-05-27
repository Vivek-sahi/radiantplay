import { forwardRef } from 'react';
import { Horizontal } from '@components/Layout';
import { Toggle } from '@components/Toggle';
import styles from './PersonalMemoryToggle.module.css';

export interface PersonalMemoryToggleProps {
  /**
   * Whether personal memory is currently enabled.
   */
  enabled: boolean;
  /**
   * Called when the user flips the toggle.
   */
  onChange: (next: boolean) => void;
  /**
   * Optional label override. Defaults to "Personal memory".
   */
  label?: string;
  /**
   * Whether the row is disabled.
   */
  disabled?: boolean;
  className?: string;
}

/**
 * PersonalMemoryToggle
 *
 * Inline row used inside `SpotterSettingsMenu`. Renders "Personal memory" on
 * the left and a Radiant `Toggle` on the right. The row height and padding
 * match the other settings rows so it visually belongs in the menu.
 *
 * No navigation — flips on/off in place. Reads and writes a user preference
 * via `enabled` / `onChange`.
 */
export const PersonalMemoryToggle = forwardRef<HTMLDivElement, PersonalMemoryToggleProps>(
  ({ enabled, onChange, label = 'Personal memory', disabled = false, className }, ref) => {
    const classes = [styles.row, disabled && styles.disabled, className]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes} data-disabled={disabled || undefined}>
        <Horizontal
          align="center"
          justify="space-between"
          gap="var(--spacing-3, 12px)"
          style={{ width: '100%' }}
        >
          <span className={styles.label}>{label}</span>
          <Toggle
            checked={enabled}
            onChange={onChange}
            showLabel={false}
            disabled={disabled}
            label={label}
          />
        </Horizontal>
      </div>
    );
  },
);

PersonalMemoryToggle.displayName = 'PersonalMemoryToggle';

export default PersonalMemoryToggle;
