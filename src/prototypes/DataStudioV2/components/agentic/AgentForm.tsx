import React, { useState } from 'react';
import { TextInput } from '../../../../components/TextInput';
import { Select } from '../../../../components/Select';
import { Button } from '../../../../components/Button';
import { Checkbox } from '../../../../components/Checkbox';
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
  /**
   * 'checkbox'  — value is 'true' / 'false'; the label sits beside the box, and `hint`
   *               below it, so an option can explain its own consequence.
   * 'time'      — an hour and a minute select on one row, reading "at 09 : 00 hours".
   *               Writes `<key>` (hour) and `<key>Minute`.
   * 'select-inline' — a select that shares its row with the field above it, for a
   *               "Daily at 09:00" pairing rather than three stacked rows.
   */
  type?: 'text' | 'secret' | 'select' | 'checkbox' | 'time';
  /** For type 'select'. */
  options?: string[];
  hint?: string;
  /** Rendered under the control as a muted note — the description in the real form. */
  description?: string;
  /** A trailing text link (e.g. a timezone). Display only. */
  link?: string;
  /** Pull this field up onto the previous field's row instead of starting a new one. */
  sameRow?: boolean;
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

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export const AgentForm: React.FC<AgentFormProps> = ({
  fields, submitLabel, onSubmit, isReadOnly, submittedNote,
}) => {
  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(fields.map(f => [f.key, f.value]))
  );

  const set = (key: string, v: string) => setValues(prev => ({ ...prev, [key]: v }));

  // Group fields into rows so a `sameRow` field sits beside its predecessor — the real
  // caching form pairs "Daily" with "at 09:00", rather than stacking them.
  const rows: AgentFormField[][] = [];
  fields.forEach(f => {
    if (f.sameRow && rows.length) rows[rows.length - 1].push(f);
    else rows.push([f]);
  });

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
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', alignItems: 'flex-end', gap: sp.B, flexWrap: 'wrap' }}>
        {row.map(f => (
        <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: sp.A, flex: f.sameRow ? '0 0 auto' : 1, minWidth: 0 }}>
          {f.type === 'checkbox' ? (
            <>
              <Checkbox
                checked={values[f.key] === 'true'}
                onChange={checked => set(f.key, checked ? 'true' : 'false')}
                label={f.label}
              />
              {f.description && (
                <span style={{ fontSize: 11, color: c['content-secondary'], fontFamily: ff.primary, paddingLeft: 24 }}>
                  {f.description}
                </span>
              )}
            </>
          ) : f.type === 'time' ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: sp.A + 2 }}>
              <Select
                label={f.label}
                value={values[f.key]}
                options={HOURS.map(o => ({ id: o, label: o, value: o }))}
                onChange={v => set(f.key, v)}
                size="small"
              />
              <span style={{ fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary, paddingBottom: 7 }}>:</span>
              <Select
                label=""
                value={values[`${f.key}Minute`] ?? '00'}
                options={MINUTES.map(o => ({ id: o, label: o, value: o }))}
                onChange={v => set(`${f.key}Minute`, v)}
                size="small"
              />
              <span style={{ fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary, paddingBottom: 7 }}>hours</span>
            </div>
          ) : f.type === 'select' ? (
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
          {f.description && f.type !== 'checkbox' && (
            <span style={{ fontSize: 11, color: c['content-secondary'], fontFamily: ff.primary }}>{f.description}</span>
          )}
          {f.link && (
            <span style={{ fontSize: 11, color: c['content-brand'], fontFamily: ff.primary, cursor: 'pointer' }}>{f.link}</span>
          )}
          {f.hint && (
            <span style={{ fontSize: 11, color: c['content-secondary'], fontFamily: ff.primary }}>{f.hint}</span>
          )}
        </div>
        ))}
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {/* `basic`, not `small` — a form's submit is the commit action of the whole
            message, and at small it read as incidental next to the fields. */}
        <Button variant="primary" size="basic" onClick={() => onSubmit(values)}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};
