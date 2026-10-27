import React, { useMemo, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { MySQL, sql as sqlLang } from '@codemirror/lang-sql';
import { EditorView, keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { Database, DbObject } from '../types';

/**
 * The SQL editor (26 Oct): CodeMirror, as in the Data Notebook prototype. Line numbers, syntax
 * colour, and autocomplete of tables and columns from the catalog (Vivek: must). MySQL dialect,
 * because AgentDB speaks the MySQL protocol. Cmd+Enter runs. Drop from the catalog works natively.
 * Colours and sizes are Radiant variables; the one code font lives here.
 */
const theme = EditorView.theme({
  '&': { height: '100%', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--rd-sys-color-background-base)' },
  '.cm-scroller': { fontFamily: 'var(--font-family-mono)', lineHeight: '1.6' },
  '.cm-content': { padding: 'var(--spacing-3) 0' },
  '.cm-gutters': { backgroundColor: 'var(--rd-sys-color-background-base)', border: 'none', color: 'var(--rd-sys-color-content-tertiary)' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 var(--spacing-3) 0 var(--spacing-4)' },
  '.cm-activeLine': { backgroundColor: 'var(--rd-sys-color-background-ghost-hover)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--rd-sys-color-content-secondary)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-cursor': { borderLeftColor: 'var(--rd-sys-color-content-brand)' },
  '.cm-placeholder': { color: 'var(--rd-sys-color-content-tertiary)' },
  '.cm-tooltip': { border: '1px solid var(--rd-sys-color-border-divider)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--rd-sys-color-background-raised)' },
});

export const SqlEditor: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  databases: Database[];
  objects: DbObject[];
  /** The catalog's database, for unqualified names. 'all' = every database. */
  database: string;
  onView: (view: EditorView) => void;
}> = ({ value, onChange, onRun, databases, objects, database, onView }) => {
  const runRef = useRef(onRun);
  runRef.current = onRun;

  const extensions = useMemo(() => {
    // Autocomplete knows every table and its columns; bare names for the catalog's database.
    const schema: Record<string, string[]> = {};
    for (const o of objects) {
      const cols = o.columns.map((c) => c.name);
      schema[`${o.database}.${o.name}`] = cols;
      if (database === 'all' || o.database === database) schema[o.name] = cols;
    }
    for (const d of databases) if (!(d.id in schema)) schema[d.id] = [];
    const run = Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => (runRef.current(), true) }]));
    return [sqlLang({ dialect: MySQL, schema, upperCaseKeywords: true }), run];
  }, [objects, databases, database]);

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={theme}
      height="100%"
      extensions={extensions}
      placeholder="Write SQL, or drag a table in from the catalog."
      onCreateEditor={(view) => onView(view)}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        autocompletion: true,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
      }}
      style={{ height: '100%' }}
    />
  );
};
