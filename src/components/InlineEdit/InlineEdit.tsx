import React, { forwardRef, useEffect, useRef, useState } from 'react';
import styles from './InlineEdit.module.css';

export type InlineEditSize = 'basic' | 'large';

export interface InlineEditProps {
  /** Current text (controlled) */
  value?: string;
  /** Starting text when uncontrolled */
  defaultValue?: string;
  /** Called with the new text when an edit is confirmed */
  onChange?: (value: string) => void;
  /** Called when an edit is cancelled with Escape */
  onCancel?: () => void;
  /** Called when editing starts or stops */
  onEditingChange?: (editing: boolean) => void;
  /**
   * Text size: 'basic' is 14/20, 'large' is 16/24 (Figma Font size 14px and 16px)
   * @default 'basic'
   */
  size?: InlineEditSize;
  /** Text shown when the value is empty */
  placeholder?: string;
  /** Whether editing is turned off */
  disabled?: boolean;
  /**
   * Confirm the edit when the field loses focus. When false, blur cancels.
   * @default true
   */
  confirmOnBlur?: boolean;
  /**
   * Keep the old value when the edit is confirmed empty
   * @default false
   */
  required?: boolean;
  /** Accessible name, e.g. "Liveboard name". Defaults to the placeholder */
  'aria-label'?: string;
  /** Additional CSS class name */
  className?: string;
}

/**
 * InlineEdit
 *
 * The Figma Inline edit (20178:11102): text that reads as plain text, shows a
 * Border/Bold outline on hover and turns into a field with a Border/Brand
 * outline when clicked or when Enter is pressed on it. Enter or blur confirms,
 * Escape cancels. Two sizes: 14/20 and 16/24.
 *
 * @example
 * ```tsx
 * <InlineEdit defaultValue="Sales overview" aria-label="Liveboard name" />
 * <InlineEdit size="large" value={title} onChange={setTitle} required />
 * ```
 */
export const InlineEdit = forwardRef<HTMLInputElement, InlineEditProps>(({
  value,
  defaultValue = '',
  onChange,
  onCancel,
  onEditingChange,
  size = 'basic',
  placeholder,
  disabled = false,
  confirmOnBlur = true,
  required = false,
  'aria-label': ariaLabel,
  className,
}, ref) => {
  const isControlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const current = isControlled ? value : inner;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(current);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const displayRef = useRef<HTMLSpanElement>(null);
  const returnFocus = useRef(false);
  // Set once an edit ends, so a blur fired while the field unmounts is ignored
  const closed = useRef(true);

  const setInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (returnFocus.current) {
      returnFocus.current = false;
      displayRef.current?.focus();
    }
  }, [editing]);

  const start = () => {
    if (disabled || editing) return;
    setDraft(current);
    closed.current = false;
    setEditing(true);
    onEditingChange?.(true);
  };

  const stop = (refocus: boolean) => {
    closed.current = true;
    returnFocus.current = refocus;
    setEditing(false);
    onEditingChange?.(false);
  };

  const confirm = (refocus: boolean) => {
    const next = draft.trim();
    if (!(required && next === '') && next !== current) {
      if (!isControlled) setInner(next);
      onChange?.(next);
    }
    stop(refocus);
  };

  const cancel = (refocus: boolean) => {
    setDraft(current);
    onCancel?.();
    stop(refocus);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirm(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cancel(true);
    }
  };

  const handleBlur = () => {
    if (closed.current) return;
    if (confirmOnBlur) confirm(false);
    else cancel(false);
  };

  const rootClasses = [
    styles.root,
    styles[size],
    editing && styles.editing,
    disabled && styles.disabled,
    !current && styles.empty,
    className,
  ].filter(Boolean).join(' ');

  const name = ariaLabel ?? placeholder;

  if (editing) {
    return (
      <span className={rootClasses}>
        {/* The hidden sizer sets the width so the field grows with the text */}
        <span className={styles.sizer} aria-hidden>
          {draft || placeholder || ' '}
        </span>
        <input
          ref={setInputRef}
          type="text"
          className={styles.input}
          value={draft}
          placeholder={placeholder}
          aria-label={name}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      </span>
    );
  }

  return (
    <span
      ref={displayRef}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label={name ? `${name}: ${current || 'empty'}. Press Enter to edit` : undefined}
      className={rootClasses}
      onClick={start}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'F2') {
          e.preventDefault();
          start();
        }
      }}
    >
      <span className={styles.text}>{current || placeholder}</span>
    </span>
  );
});

InlineEdit.displayName = 'InlineEdit';

export default InlineEdit;
