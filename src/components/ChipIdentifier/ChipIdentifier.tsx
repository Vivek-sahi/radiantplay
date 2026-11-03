import React, { forwardRef } from 'react';
import styles from './ChipIdentifier.module.css';

export interface ChipIdentifierProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Text shown in the chip, e.g. a short id or key */
  label: string;
  /** Maximum width before the label truncates, in px */
  maxWidth?: number;
}

/**
 * ChipIdentifier
 *
 * The Figma Chip - identifier (23295:18281): a 24px, 4px-radius brand chip with
 * inverse text that marks an identifier, such as a key column or an id.
 * Display only.
 *
 * @example
 * ```tsx
 * <ChipIdentifier label="Order ID" />
 * ```
 */
export const ChipIdentifier = forwardRef<HTMLSpanElement, ChipIdentifierProps>(({
  label,
  maxWidth,
  className,
  style,
  title,
  ...rest
}, ref) => (
  <span
    ref={ref}
    className={[styles.chip, className].filter(Boolean).join(' ')}
    style={maxWidth ? { maxWidth, ...style } : style}
    title={title ?? label}
    {...rest}
  >
    <span className={styles.label}>{label}</span>
  </span>
));

ChipIdentifier.displayName = 'ChipIdentifier';

export default ChipIdentifier;
