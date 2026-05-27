import React, { useRef, useEffect, useCallback } from 'react';
import { systemColors } from '@tokens/colors';

// ─── AutoResizeTextarea ────────────────────────────────────────────────────────
// Dynamic-height textarea for NewUIAdmin2 instruction/text fields.
//
// Spec:
//   min height : 32px  (1 line — matches standard input height)
//   max height : 104px (4 lines: 12px padding + 80px content + 12px padding)
//   overflow   : scrollable once content exceeds 104px
//   line-height: 20px

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const MIN_HEIGHT = 32;
const MAX_HEIGHT = 104;

export interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: number | string;
  disabled?: boolean;
}

export const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value,
  onChange,
  placeholder = 'Text',
  width = 311,
  disabled = false,
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = React.useState(false);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Reset height so scrollHeight reflects actual content
    el.style.height = `${MIN_HEIGHT}px`;
    const natural = el.scrollHeight;
    const clamped = Math.min(Math.max(natural, MIN_HEIGHT), MAX_HEIGHT);
    el.style.height = `${clamped}px`;
    el.style.overflowY = natural > MAX_HEIGHT ? 'auto' : 'hidden';
  }, []);

  // Resize on every value change and on mount
  useEffect(() => { resize(); }, [value, resize]);

  const borderColor = focused
    ? systemColors.light['content-brand']
    : '#D1D5DB';

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        minHeight: `${MIN_HEIGHT}px`,
        maxHeight: `${MAX_HEIGHT}px`,
        padding: '6px 12px',
        border: `1px solid ${borderColor}`,
        borderRadius: '6px',
        fontFamily: font,
        fontSize: '13px',
        lineHeight: '20px',
        color: '#111827',
        background: disabled ? '#F9FAFB' : '#FFFFFF',
        outline: 'none',
        boxSizing: 'border-box',
        resize: 'none',
        overflowY: 'hidden',
        display: 'block',
        transition: 'border-color 0.15s ease',
      }}
    />
  );
};

export default AutoResizeTextarea;
