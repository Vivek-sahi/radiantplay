import React, { useState } from 'react';
import { TextInput } from '../../../../components/TextInput';
import { Select } from '../../../../components/Select';
import { Button } from '../../../../components/Button';
import { c, sp, fs, ff } from '../../styles';

/**
 * A short form the agent asks for inline, in the thread.
 *
 * Used for the Jira beat: S8 asks for the credentials needed to reach a system
 * with no connection, S9 asks how to scope the pull. Both are the same shape —
 * a few pre-filled fields and one submit — so they share this.
 *
 * Values are pre-filled by design. The script is explicit: "Nobody should watch
 * a VP type credentials, and no real key goes on a stage."
 *
 * Built on Radiant TextInput/Select rather than the existing single-field
 * `inlineInput`, which is hardcoded to one Pendo key.
 */

export interface AgentFormField {
  key: string;
  label: string;
  /** Pre-filled value. */
  value: string;
  type?: 'text' | 'secret' | 'select';
  /** For type 'select'. */
  options?: string[];
  hint?: string;
}

export interface AgentFormProps {
  fields: AgentFormField[];
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => void;
  /** Frozen after submit so the thread keeps a record of what was sent. */
  isReadOnly?: boolean;
  /** Shown in place of the fields once submitted. */
  submittedNote?: string;
}

/** Masks all but the last four characters, so a token reads as real without being legible. */
const mask = (v: string) => (v.length <= 4 ? '••••' : `${'•'.repeat(Math.min(v.length - 4, 20))}${v.slice(-4)}`);

export const AgentForm: React.FC<AgentFormProps> = ({
  fields, submitLabel, onSubmit, isReadOnly, submittedNote,
}) => {
  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(fields.map(f => [f.key, f.value]))
  );

  const set = (key: string, v: string) => setValues(prev => ({ ...prev, [key]: v }));

  if (isReadOnly) {
    return (
      // Once submitted this is a record, not a control — a bordered card gave it
      // the same weight as the live form, so it's a quiet line instead.
      <div style={{ marginTop: sp.B, display: 'flex', alignItems: 'center', gap: sp.A + 2 }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ color: '#16A34A', flexShrink: 0 }}>
          <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontFamily: ff.primary }}>
          {submittedNote ?? 'Submitted'}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: sp.C, padding: `${sp.D}px`, borderRadius: 8,
      border: `1px solid ${c['border-default']}`, backgroundColor: c['background-base'],
      display: 'flex', flexDirection: 'column', gap: sp.C,
    }}>
      {fields.map(f => (
        <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: sp.A }}>
          {f.type === 'select' ? (
            <Select
              label={f.label}
              value={values[f.key]}
              options={(f.options ?? []).map(o => ({ id: o, label: o, value: o }))}
              onChange={v => set(f.key, v)}
              size="small"
            />
          ) : (
            <TextInput
              label={f.label}
              value={f.type === 'secret' ? mask(values[f.key]) : values[f.key]}
              onChange={e => set(f.key, e.target.value)}
            />
          )}
          {f.hint && (
            <span style={{ fontSize: 11, color: c['content-secondary'], fontFamily: ff.primary }}>{f.hint}</span>
          )}
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="small" onClick={() => onSubmit(values)}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};
