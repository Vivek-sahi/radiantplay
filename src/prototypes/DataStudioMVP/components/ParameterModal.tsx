import { useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { Radio } from '../../../components/Radio';
import { TextInput } from '../../../components/TextInput';
import { TextArea } from '../../../components/TextArea';
import { DatePicker } from '../../../components/DatePicker';
import { c, sp, fs, fw, ff } from '../styles';

/*
  ── Create parameter ──────────────────────────────────────────────────────────
  Replicates ThoughtSpot's "Create parameter" dialog. Opened from the spreadsheet toolbar,
  after the formula icon — the third thing you *make* in the sheet, alongside a formula and
  a filter, and made the same way: a modal on the sheet, nowhere else.

  ⚠️ **A parameter is part of the model the moment it is saved.** Same rule as filters and
  formulas — "by default, whatever you do in a data model does get saved" (Vivek,
  2026-08-19). There is no draft parameter and no promotion step; it appears in the model
  view's Parameters section, which until now read "Not in this phase".

  ⚠️ **Only the Integer / Any state had a reference.** List and Range, and the typed default
  value, are our reading of what those settings need. The rest matches the screenshot:
  name, optional description, the five types as a pill control, allowed values as radios,
  and a default value — Cancel / Save.
*/

export type ParamType = 'integer' | 'decimal' | 'string' | 'boolean' | 'date';
export type ParamAllowed = 'any' | 'list' | 'range';

export interface ModelParameter {
  id: string;
  name: string;
  description: string;
  type: ParamType;
  allowed: ParamAllowed;
  /** `list` — the permitted values, in order. */
  listValues: string[];
  /** `range` — inclusive bounds. */
  min: string;
  max: string;
  defaultValue: string;
}

const TYPE_OPTIONS: { id: ParamType; label: string }[] = [
  { id: 'integer', label: 'Integer' },
  { id: 'decimal', label: 'Decimal' },
  { id: 'string', label: 'String' },
  { id: 'boolean', label: 'Boolean' },
  { id: 'date', label: 'Date' },
];

const ALLOWED_OPTIONS: { id: ParamAllowed; label: string }[] = [
  { id: 'any', label: 'Any' },
  { id: 'list', label: 'List' },
  { id: 'range', label: 'Range' },
];

/** A fresh parameter, defaulted the way the dialog opens: Integer, Any. */
export function newParameter(id: string): ModelParameter {
  return {
    id, name: '', description: '', type: 'integer', allowed: 'any',
    listValues: [''], min: '', max: '', defaultValue: '',
  };
}

/** The parameter in words, for the model view's row. */
export function describeParameter(p: ModelParameter): string {
  const type = TYPE_OPTIONS.find(t => t.id === p.type)?.label ?? p.type;
  const bounds = p.allowed === 'range'
    ? ` · ${p.min || '—'} to ${p.max || '—'}`
    : p.allowed === 'list'
      ? ` · ${p.listValues.filter(Boolean).length} allowed values`
      : '';
  return `${type}${bounds}${p.defaultValue ? ` · default ${p.defaultValue}` : ''}`;
}

/** Range and a typed default only make sense for the ordered types. */
const isOrdered = (t: ParamType) => t === 'integer' || t === 'decimal' || t === 'date';

const isoDate = (d: Date) => {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const parseIso = (s: string): Date | null => {
  const [y, m, d] = (s || '').split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

export interface ParameterModalProps {
  /** ⚠️ Mount with `key={parameter.id}` — the draft is seeded once, on mount. */
  parameter: ModelParameter;
  mode: 'create' | 'edit';
  onCancel: () => void;
  onSave: (p: ModelParameter) => void;
  /** Only offered when editing. The model view has no row menu, so this is the one route. */
  onDelete?: () => void;
}

export function ParameterModal({ parameter, mode, onCancel, onSave, onDelete }: ParameterModalProps) {
  const [draft, setDraft] = useState<ModelParameter>(parameter);
  const set = (patch: Partial<ModelParameter>) => setDraft(d => ({ ...d, ...patch }));

  const sectionLabel = (t: string) => (
    <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.primary }}>{t}</div>
  );
  const fieldLabel = (t: string) => (
    <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary, marginBottom: sp.B }}>{t}</div>
  );

  const setListValue = (i: number, v: string) =>
    set({ listValues: draft.listValues.map((x, xi) => (xi === i ? v : x)) });

  /** The default value control follows the type — a date default is a date, not free text. */
  const defaultControl = () => {
    if (draft.type === 'boolean') {
      return (
        <div style={{ width: 220 }}>
          <SegmentedControl
            size="small"
            aria-label="Default value"
            value={draft.defaultValue === 'true' ? 'true' : 'false'}
            onChange={v => set({ defaultValue: v })}
            options={[{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }]}
          />
        </div>
      );
    }
    if (draft.type === 'date') {
      return (
        <div style={{ width: 300 }}>
          <DatePicker value={parseIso(draft.defaultValue)} onChange={d => set({ defaultValue: d ? isoDate(d) : '' })} />
        </div>
      );
    }
    return (
      <div style={{ width: 300 }}>
        <TextInput
          value={draft.defaultValue}
          onChange={e => set({ defaultValue: e.target.value })}
          placeholder="Default value"
          showLabel={false}
        />
      </div>
    );
  };

  // A parameter with no name is not a thing you can reference, which is the entire point of
  // one. Everything else has a workable default.
  const incomplete = !draft.name.trim();

  return (
    <Modal
      isOpen
      onClose={onCancel}
      title={mode === 'create' ? 'Create parameter' : 'Edit parameter'}
      size="M2"
      footer={(
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: sp.B }}>
          {/* ⚠️ Delete lives here because the model view is a view list with no row menu —
              without it a saved parameter would have no route back at all. */}
          {mode === 'edit' && onDelete && (
            <Button variant="tertiary" onClick={onDelete}>Delete parameter</Button>
          )}
          <div style={{ flex: 1 }} />
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" disabled={incomplete} onClick={() => onSave(draft)}>Save</Button>
        </div>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.F }}>
        <div>
          {sectionLabel('Name and description')}
          <div style={{ marginTop: sp.C, display: 'flex', flexDirection: 'column', gap: sp.C }}>
            <TextInput
              value={draft.name}
              onChange={e => set({ name: e.target.value })}
              placeholder="Parameter name"
              showLabel={false}
            />
            <TextArea
              value={draft.description}
              onChange={e => set({ description: e.target.value })}
              placeholder="Add a description (optional)"
              showLabel={false}
            />
          </div>
        </div>

        <div>
          {sectionLabel('Data settings')}
          <div style={{ marginTop: sp.C, display: 'flex', flexDirection: 'column', gap: sp.E }}>
            <div>
              <SegmentedControl
                aria-label="Parameter type"
                value={draft.type}
                onChange={v => {
                  const type = v as ParamType;
                  /* Switching away from an ordered type drops a Range that no longer means
                     anything, rather than keeping bounds the new type can't be compared with. */
                  set({
                    type,
                    allowed: !isOrdered(type) && draft.allowed === 'range' ? 'any' : draft.allowed,
                    defaultValue: '',
                  });
                }}
                options={TYPE_OPTIONS}
              />
            </div>

            <div>
              {fieldLabel('Allowed values')}
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.F }}>
                {ALLOWED_OPTIONS.map(o => (
                  <Radio
                    key={o.id}
                    name="param-allowed"
                    value={o.id}
                    label={o.label}
                    checked={draft.allowed === o.id}
                    /* Range needs an ordering. A string or a boolean has none, so the option
                       is disabled rather than offered and then meaningless. */
                    disabled={o.id === 'range' && !isOrdered(draft.type)}
                    onChange={() => set({ allowed: o.id })}
                  />
                ))}
              </div>
            </div>

            {draft.allowed === 'list' && (
              <div>
                {fieldLabel('Allowed values')}
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B, maxWidth: 300 }}>
                  {draft.listValues.map((v, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                      <div style={{ flex: 1 }}>
                        <TextInput
                          value={v}
                          onChange={e => setListValue(i, e.target.value)}
                          placeholder={`Value ${i + 1}`}
                          showLabel={false}
                        />
                      </div>
                      {draft.listValues.length > 1 && (
                        <button
                          onClick={() => set({ listValues: draft.listValues.filter((_, xi) => xi !== i) })}
                          title="Remove value"
                          style={{ width: 26, height: 26, flexShrink: 0, border: 'none', background: 'transparent', borderRadius: 5, color: c['content-secondary'], cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => set({ listValues: [...draft.listValues, ''] })}
                  style={{ marginTop: sp.B, background: 'none', border: 'none', padding: 0, color: c['content-brand'], fontSize: fs.sm, fontWeight: fw.semibold, cursor: 'pointer', fontFamily: ff.primary }}
                >+ Add value</button>
              </div>
            )}

            {draft.allowed === 'range' && (
              <div style={{ display: 'flex', gap: sp.D, maxWidth: 420 }}>
                <div style={{ flex: 1 }}>
                  {fieldLabel('Minimum')}
                  {draft.type === 'date' ? (
                    <DatePicker value={parseIso(draft.min)} onChange={d => set({ min: d ? isoDate(d) : '' })} />
                  ) : (
                    <TextInput value={draft.min} onChange={e => set({ min: e.target.value })} placeholder="Minimum" showLabel={false} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  {fieldLabel('Maximum')}
                  {draft.type === 'date' ? (
                    <DatePicker value={parseIso(draft.max)} onChange={d => set({ max: d ? isoDate(d) : '' })} />
                  ) : (
                    <TextInput value={draft.max} onChange={e => set({ max: e.target.value })} placeholder="Maximum" showLabel={false} />
                  )}
                </div>
              </div>
            )}

            <div>
              {fieldLabel('Default value')}
              {defaultControl()}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
