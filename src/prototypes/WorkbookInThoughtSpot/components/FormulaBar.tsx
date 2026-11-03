import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { FUNCTIONS, cycleLock, refsIn } from '../engine/formula';
import { REF_COLORS } from './SheetGrid';
import styles from './FormulaBar.module.css';

// The formula bar, Google Sheets style: a name box (the cell, or a name you type to define one),
// fx, the formula with references colour-coded, function autocomplete while you type, the
// argument hint for the function you're in, and F4 to cycle $ locks. On the right, a fixed slot
// says what the workbook did with your last edit, so no message ever pushes the grid down.

export interface FormulaBarHandle {
  focus(caretToEnd?: boolean): void;
  /** Insert text at the caret (point mode). */
  insert(text: string): void;
  /** Point mode is open: the caret sits after an operator, "(" or ",". */
  wantsRef(): boolean;
}

export interface FormulaBarProps {
  cellRef: string;
  /** The text being edited, or the active cell's raw text when not editing. */
  value: string;
  editing: boolean;
  onStartEdit: (text: string) => void;
  onChange: (text: string) => void;
  onCommit: (move: 'down' | 'right' | 'none') => void;
  onCancel: () => void;
  onNameBox: (text: string) => void;
  note?: string | null;
}

const tokenAtCaret = (text: string, caret: number) => /([A-Za-z_][\w.]*)$/.exec(text.slice(0, caret))?.[1] ?? '';

/** The function call the caret is inside, and which argument. */
function callAt(text: string, caret: number): { name: string; arg: number } | null {
  const stack: { name: string; arg: number }[] = [];
  let inStr = false;
  for (let i = 0; i < caret; i++) {
    const ch = text[i];
    if (ch === '"') inStr = !inStr;
    if (inStr) continue;
    if (ch === '(') stack.push({ name: (/([A-Za-z_][\w.]*)$/.exec(text.slice(0, i))?.[1] ?? '').toUpperCase(), arg: 0 });
    else if (ch === ')') stack.pop();
    else if (ch === ',' && stack.length) stack[stack.length - 1].arg++;
  }
  return stack.length ? stack[stack.length - 1] : null;
}

export const FormulaBar = forwardRef<FormulaBarHandle, FormulaBarProps>(function FormulaBar(
  { cellRef, value, editing, onStartEdit, onChange, onCommit, onCancel, onNameBox, note },
  ref,
) {
  const input = useRef<HTMLInputElement>(null);
  const [caret, setCaret] = useState(0);
  const [pick, setPick] = useState(0);
  const [nameDraft, setNameDraft] = useState<string | null>(null);

  const isFormula = editing && value.startsWith('=');
  const token = isFormula ? tokenAtCaret(value, caret) : '';
  const before = value.slice(0, caret - token.length);
  const suggestions = useMemo(
    () => (token && /[=+\-*/^(,&<>:\s]$/.test(before) ? FUNCTIONS.filter((f) => f.name.startsWith(token.toUpperCase())).slice(0, 6) : []),
    [token, before],
  );
  const call = isFormula && !suggestions.length ? callAt(value, caret) : null;
  const hint = call ? FUNCTIONS.find((f) => f.name === call.name) : undefined;

  useEffect(() => setPick(0), [token]);

  const accept = (name: string) => {
    const next = `${value.slice(0, caret - token.length)}${name}(${value.slice(caret)}`;
    const at = caret - token.length + name.length + 1;
    onChange(next);
    requestAnimationFrame(() => { input.current?.setSelectionRange(at, at); setCaret(at); });
  };

  useImperativeHandle(ref, () => ({
    focus: (end = true) => {
      const el = input.current;
      if (!el) return;
      el.focus();
      if (end) { const n = el.value.length; el.setSelectionRange(n, n); setCaret(n); }
    },
    insert: (text) => {
      const el = input.current;
      const at = el?.selectionStart ?? value.length;
      const next = value.slice(0, at) + text + value.slice(at);
      onChange(next);
      requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(at + text.length, at + text.length); setCaret(at + text.length); });
    },
    wantsRef: () => {
      const at = input.current?.selectionStart ?? value.length;
      return value.startsWith('=') && /[=+\-*/^(,&<>:]\s*$/.test(value.slice(0, at));
    },
  }), [value, onChange]);

  // Colour-coded references in the read view (Google Sheets style).
  const coloured = useMemo(() => {
    if (!value.startsWith('=')) return null;
    const refs = refsIn(value);
    const parts: React.ReactNode[] = [];
    let at = 0;
    refs.forEach((r, i) => {
      parts.push(value.slice(at, r.start));
      parts.push(<span key={i} style={{ color: `var(--rd-sys-color-${REF_COLORS[i % REF_COLORS.length]})` }}>{value.slice(r.start, r.end)}</span>);
      at = r.end;
    });
    parts.push(value.slice(at));
    return parts;
  }, [value]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setPick((p) => (p + 1) % suggestions.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setPick((p) => (p - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === 'Tab' || e.key === 'Enter') { e.preventDefault(); accept(suggestions[pick].name); return; }
    }
    if (e.key === 'F4') {
      e.preventDefault();
      const el = e.currentTarget;
      const at = el.selectionStart ?? value.length;
      const r = refsIn(value).find((x) => at >= x.start && at <= x.end);
      if (r) {
        const next = cycleLock(r.text);
        onChange(value.slice(0, r.start) + next + value.slice(r.end));
        const end = r.start + next.length;
        requestAnimationFrame(() => { el.setSelectionRange(end, end); setCaret(end); });
      }
      return;
    }
    if (e.key === 'Enter') { e.preventDefault(); onCommit('down'); return; }
    if (e.key === 'Tab') { e.preventDefault(); onCommit('right'); return; }
    if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
  };

  return (
    <div className={styles.bar}>
      <input
        className={styles.nameBox}
        aria-label="Name box"
        value={nameDraft ?? cellRef}
        onFocus={(e) => { setNameDraft(cellRef); requestAnimationFrame(() => e.target.select()); }}
        onChange={(e) => setNameDraft(e.target.value)}
        onBlur={() => setNameDraft(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { onNameBox((nameDraft ?? '').trim()); setNameDraft(null); e.currentTarget.blur(); }
          if (e.key === 'Escape') { setNameDraft(null); e.currentTarget.blur(); }
        }}
      />
      <span className={styles.fx} aria-hidden>fx</span>
      <div className={styles.field}>
        {!editing && coloured && <div className={styles.read} onMouseDown={(e) => { e.preventDefault(); onStartEdit(value); }}>{coloured}</div>}
        <input
          ref={input}
          className={`${styles.input} ${!editing && coloured ? styles.hidden : ''}`}
          aria-label="Formula"
          value={value}
          spellCheck={false}
          onFocus={() => { if (!editing) onStartEdit(value); }}
          onChange={(e) => { if (!editing) onStartEdit(e.target.value); else onChange(e.target.value); setCaret(e.target.selectionStart ?? 0); }}
          onSelect={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
          onKeyDown={onKeyDown}
        />
        {suggestions.length > 0 && (
          <div className={styles.popup} role="listbox" aria-label="Functions">
            {suggestions.map((f, i) => (
              <div
                key={f.name}
                role="option"
                aria-selected={i === pick}
                className={`${styles.option} ${i === pick ? styles.optionOn : ''}`}
                onMouseDown={(e) => { e.preventDefault(); accept(f.name); }}
              >
                <span className={styles.fnName}>{f.name}</span>
                <span className={styles.fnSyntax}>{f.syntax}</span>
                {i === pick && <span className={styles.fnAbout}>{f.about}</span>}
              </div>
            ))}
          </div>
        )}
        {hint && (
          <div className={styles.popup} role="tooltip">
            <div className={styles.hint}>
              {hint.name}(
              {hint.args.map((a, i) => (
                <React.Fragment key={a}>
                  {i > 0 && ', '}
                  <span className={i === Math.min(call!.arg, hint.args.length - 1) ? styles.argOn : undefined}>{a}</span>
                </React.Fragment>
              ))}
              )
            </div>
            <div className={styles.fnAbout}>{hint.about}</div>
          </div>
        )}
      </div>
      {note && <span className={styles.note}>{note}</span>}
    </div>
  );
});

export default FormulaBar;
