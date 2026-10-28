import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Icon } from '../icons';
import styles from './RichTextEditor.module.css';

export type RichTextToolbarItem =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'link'
  | 'list'
  | 'heading'
  | 'blockquote';

export interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  toolbar?: RichTextToolbarItem[];
  readOnly?: boolean;
  className?: string;
  minHeight?: number;
}

const DEFAULT_TOOLBAR: RichTextToolbarItem[] = ['bold', 'italic', 'underline', 'list'];

/* ─── Toolbar icon SVGs ─────────────────────────────────────────────────── */

const ICONS: Record<RichTextToolbarItem, React.ReactNode> = {
  // Bold, italic, underline and strikethrough use the Radiant icons, as in the Figma Font formatter
  bold: <Icon name="bold" size="s" />,
  italic: <Icon name="italic" size="s" />,
  underline: <Icon name="underline" size="s" />,
  strikethrough: <Icon name="strike-through" size="s" />,
  list: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="2" cy="4" r="1" fill="currentColor" />
      <line x1="5" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="2" cy="8" r="1" fill="currentColor" />
      <line x1="5" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="2" cy="12" r="1" fill="currentColor" />
      <line x1="5" y1="12" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  heading: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <text x="1" y="11" fontFamily="Georgia, serif" fontWeight="bold" fontSize="12" fill="currentColor">H</text>
    </svg>
  ),
  blockquote: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 3C2 3 2 6 4 6C4 7 3 8 2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 3C7 3 7 6 9 6C9 7 8 8 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  link: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M6 8L5 9C4.172 9.828 2.828 9.828 2 9C1.172 8.172 1.172 6.828 2 6L4 4C4.828 3.172 6.172 3.172 7 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 6L9 5C9.828 4.172 11.172 4.172 12 5C12.828 5.828 12.828 7.172 12 8L10 10C9.172 10.828 7.828 10.828 7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const TOOLBAR_LABELS: Record<RichTextToolbarItem, string> = {
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strikethrough: 'Strikethrough',
  link: 'Insert Link',
  list: 'Unordered List',
  heading: 'Heading',
  blockquote: 'Blockquote',
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type something...',
  toolbar = DEFAULT_TOOLBAR,
  readOnly = false,
  className,
  minHeight = 120,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeCommands, setActiveCommands] = useState<Set<string>>(new Set());

  // Set initial HTML on mount only
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value ?? '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateActiveCommands = useCallback(() => {
    const active = new Set<string>();
    const commands: RichTextToolbarItem[] = ['bold', 'italic', 'underline', 'strikethrough'];
    commands.forEach((cmd) => {
      try {
        if (document.queryCommandState(cmd === 'strikethrough' ? 'strikeThrough' : cmd)) {
          active.add(cmd);
        }
      } catch {
        // ignore
      }
    });
    setActiveCommands(active);
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveCommands();
  }, [onChange, updateActiveCommands]);

  const handleKeyUp = useCallback(() => {
    updateActiveCommands();
  }, [updateActiveCommands]);

  const handleMouseUp = useCallback(() => {
    updateActiveCommands();
  }, [updateActiveCommands]);

  const execCommand = useCallback(
    (item: RichTextToolbarItem) => {
      if (!editorRef.current) return;
      editorRef.current.focus();

      switch (item) {
        case 'bold':
          document.execCommand('bold');
          break;
        case 'italic':
          document.execCommand('italic');
          break;
        case 'underline':
          document.execCommand('underline');
          break;
        case 'strikethrough':
          document.execCommand('strikeThrough');
          break;
        case 'list':
          document.execCommand('insertUnorderedList');
          break;
        case 'heading':
          document.execCommand('formatBlock', false, 'h2');
          break;
        case 'blockquote':
          document.execCommand('formatBlock', false, 'blockquote');
          break;
        case 'link': {
          const url = window.prompt('Enter URL:');
          if (url) {
            document.execCommand('createLink', false, url);
          }
          break;
        }
      }

      if (editorRef.current && onChange) {
        onChange(editorRef.current.innerHTML);
      }
      updateActiveCommands();
    },
    [onChange, updateActiveCommands]
  );

  const wrapperClasses = [styles.wrapper, className].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {!readOnly && toolbar.length > 0 && (
        <div className={styles.toolbar} role="toolbar" aria-label="Text formatting">
          {toolbar.map((item) => (
            <button
              key={item}
              type="button"
              className={[
                styles.toolbarButton,
                activeCommands.has(item) && styles.toolbarButtonActive,
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseDown={(e) => {
                // Prevent editor blur before execCommand
                e.preventDefault();
                execCommand(item);
              }}
              aria-label={TOOLBAR_LABELS[item]}
              aria-pressed={activeCommands.has(item)}
              title={TOOLBAR_LABELS[item]}
            >
              {ICONS[item]}
            </button>
          ))}
        </div>
      )}

      <div
        ref={editorRef}
        className={styles.editor}
        contentEditable={readOnly ? false : true}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={handleKeyUp}
        onMouseUp={handleMouseUp}
        data-placeholder={placeholder}
        style={{ minHeight }}
        role="textbox"
        aria-multiline={true}
        aria-readonly={readOnly}
        aria-label="Rich text editor"
      />
    </div>
  );
};

export default RichTextEditor;
