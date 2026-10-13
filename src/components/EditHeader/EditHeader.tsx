import { forwardRef } from 'react';
import { Button } from '../Button';
import { Divider } from '../Divider';
import { SegmentedControl } from '../SegmentedControl';
import type { SegmentOption } from '../SegmentedControl';
import styles from './EditHeader.module.css';

export interface EditHeaderProps {
  /** Title of the thing being edited */
  title: string;
  /**
   * Figma State. false is Saved (Reset disabled), true is Edited (Reset enabled).
   * @default false
   */
  edited?: boolean;
  /** Shows the secondary Reset button */
  onReset?: () => void;
  /** Shows the primary Save button */
  onSave?: () => void;
  /** Shows a divider and a tertiary Exit button */
  onExit?: () => void;
  /** Disables Save, e.g. while saving */
  saveDisabled?: boolean;
  /** @default 'Reset' */
  resetLabel?: string;
  /** @default 'Save' */
  saveLabel?: string;
  /** @default 'Exit' */
  exitLabel?: string;
  /** Segmented tabs next to the title (Figma "Show tabs") */
  tabs?: SegmentOption[];
  /** Id of the active tab */
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

/**
 * EditHeader
 *
 * The Figma Edit header (16990:15522, Saved and Edited) as a full-width,
 * 60px page header for edit mode: a 20/28 title with optional segmented tabs
 * on the left; Reset, Save, a divider and a tertiary Exit button on the
 * right. Reset is disabled until there are edits. Same family as WizardHeader.
 *
 * @example
 * ```tsx
 * <EditHeader
 *   title="Sales overview"
 *   edited={isDirty}
 *   onReset={reset}
 *   onSave={save}
 *   onExit={exit}
 * />
 * ```
 */
export const EditHeader = forwardRef<HTMLElement, EditHeaderProps>(({
  title,
  edited = false,
  onReset,
  onSave,
  onExit,
  saveDisabled = false,
  resetLabel = 'Reset',
  saveLabel = 'Save',
  exitLabel = 'Exit',
  tabs,
  activeTab,
  onTabChange,
  className,
}, ref) => {
  const hasCta = Boolean(onReset || onSave);
  const hasTabs = Boolean(tabs && tabs.length > 0);

  return (
    <header ref={ref} className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.left}>
        <h1 className={styles.title} title={title}>{title}</h1>
        {hasTabs && (
          <SegmentedControl
            className={styles.tabs}
            options={tabs ?? []}
            value={activeTab ?? tabs?.[0]?.id ?? ''}
            onChange={(id) => onTabChange?.(id)}
            aria-label={`${title} sections`}
          />
        )}
      </div>
      {(hasCta || onExit) && (
        <div className={styles.actions}>
          {hasCta && (
            <div className={styles.cta}>
              {onReset && (
                <Button variant="secondary" onClick={onReset} disabled={!edited}>
                  {resetLabel}
                </Button>
              )}
              {onSave && (
                <Button variant="primary" onClick={onSave} disabled={saveDisabled}>
                  {saveLabel}
                </Button>
              )}
            </div>
          )}
          {hasCta && onExit && <Divider vertical className={styles.divider} />}
          {onExit && (
            <Button variant="tertiary" onClick={onExit}>
              {exitLabel}
            </Button>
          )}
        </div>
      )}
    </header>
  );
});

EditHeader.displayName = 'EditHeader';

export default EditHeader;
