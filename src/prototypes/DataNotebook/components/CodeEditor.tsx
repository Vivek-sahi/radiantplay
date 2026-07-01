import React, { useMemo, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { python } from '@codemirror/lang-python';
import { EditorView, keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { ff } from '../styles';

interface CodeEditorProps {
  value: string;
  onChange: (v: string) => void;
  language: 'sql' | 'python';
  onRun?: () => void;
  readOnly?: boolean;
  minHeight?: number;
}

// A Hex-style light code editor (CodeMirror 6). Real editing, syntax highlight,
// line numbers, and ⌘/Ctrl-Enter to run.
const editorTheme = EditorView.theme({
  '&': { fontSize: '12.5px', backgroundColor: 'transparent' },
  '.cm-content': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', padding: '8px 0' },
  '.cm-gutters': { backgroundColor: 'transparent', border: 'none', color: '#b8bfcc' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 8px', minWidth: '28px' },
  '.cm-activeLine': { backgroundColor: 'rgba(39,112,239,0.04)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  '&.cm-focused': { outline: 'none' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(39,112,239,0.16)' },
  '.cm-cursor': { borderLeftColor: '#2770EF' },
});

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language, onRun, readOnly, minHeight = 36 }) => {
  const runRef = useRef(onRun);
  runRef.current = onRun;

  const extensions = useMemo(() => {
    const lang = language === 'sql' ? sql({ dialect: PostgreSQL, upperCaseKeywords: true }) : python();
    const runKey = Prec.highest(
      keymap.of([{ key: 'Mod-Enter', run: () => { runRef.current?.(); return true; } }]),
    );
    return [lang, runKey, EditorView.lineWrapping];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  return (
    <div style={{ fontFamily: ff.primary }}>
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={editorTheme}
        extensions={extensions}
        editable={!readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: !readOnly,
          highlightActiveLineGutter: false,
          autocompletion: true,
          bracketMatching: true,
          closeBrackets: true,
          indentOnInput: true,
        }}
        style={{ minHeight }}
      />
    </div>
  );
};

export default CodeEditor;
