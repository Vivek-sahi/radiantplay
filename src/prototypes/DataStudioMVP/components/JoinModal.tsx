import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button';
import { c, sp, fs, fw, ff } from '../styles';
import { JoinTypeIcon } from './icons/JoinTypeIcon';

/*
  ── Join configuration ────────────────────────────────────────────────────────
  A modal, like the filter and the formula (Vivek, 2026-08-19: "join will also happen in a
  modal"). It replaces **three copies of the same form** that lived in the docked property
  panel — one for a newly drawn join, one for the multi-select flow, one for editing an
  existing join — which is how the edit path could rot without the others noticing.

  ⚠️ **Both tables are fixed.** You get here by dragging from one card to another, so the two
  ends are already answered; the old form offered a Table 2 select, which asked again for
  something the gesture had already said. Editing an existing join can't change its ends
  either — that would be a different join.

  ⚠️ **No `+ Add column`.** Composite keys are accepted by no store: `CanvasJoin` has one key
  pair, and the old form's extra pairs were dropped at Apply. A control that discards what you
  type into it is worse than one that isn't there, so it is absent until the model can hold
  them — `DESIGN.md` build queue, composite join keys.
*/

export type JoinType = 'inner' | 'full_outer' | 'left_outer' | 'right_outer';
export type Cardinality = 'many_to_one' | 'one_to_many' | 'one_to_one';

export interface JoinDraft {
  name: string;
  col1: string;
  col2: string;
  joinType: JoinType;
  cardinality: Cardinality;
}

export const JOIN_TYPE_PILLS: { key: JoinType; label: string }[] = [
  { key: 'inner', label: 'Inner' },
  { key: 'left_outer', label: 'Left outer' },
  { key: 'right_outer', label: 'Right outer' },
  { key: 'full_outer', label: 'Full outer' },
];

export const CARDINALITY_PILLS: { key: Cardinality; label: string }[] = [
  { key: 'many_to_one', label: 'Many:1' },
  { key: 'one_to_many', label: '1:Many' },
  { key: 'one_to_one', label: '1:1' },
];

export interface JoinModalProps {
  /** `create` is a join just drawn on the canvas; `edit` is one that already exists. */
  mode: 'create' | 'edit';
  table1: string;
  table2: string;
  table1Cols: [string, string][];
  table2Cols: [string, string][];
  draft: JoinDraft;
  onChange: (patch: Partial<JoinDraft>) => void;
  /** Cancel. ⚠️ On `create` the caller removes the join — nothing is joined until Apply. */
  onCancel: () => void;
  onApply: () => void;
}

export function JoinModal({
  mode, table1, table2, table1Cols, table2Cols, draft, onChange, onCancel, onApply,
}: JoinModalProps) {
  const label = (t: string) => (
    <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: sp.A, fontFamily: ff.primary }}>{t}</div>
  );
  const fixedField = (v: string) => (
    <div style={{
      height: 32, boxSizing: 'border-box', display: 'flex', alignItems: 'center',
      padding: `0 ${sp.C}px`, background: c['background-sunken'], borderRadius: 6,
      border: `1px solid ${c['border-divider']}`, fontSize: fs.xs, color: c['content-secondary'],
      fontFamily: ff.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>{v}</div>
  );
  const selectField = (value: string, cols: [string, string][], onPick: (v: string) => void) => (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onPick(e.target.value)}
        style={{
          width: '100%', height: 32, boxSizing: 'border-box', appearance: 'none',
          border: `1px solid ${c['border-default']}`, borderRadius: 6,
          padding: `0 ${sp.G}px 0 ${sp.C}px`, fontSize: fs.xs, color: c['content-primary'],
          fontFamily: ff.primary, outline: 'none', background: c['background-base'], cursor: 'pointer',
        }}
      >
        <option value="">Select a column</option>
        {cols.map(([col]) => <option key={col} value={col}>{col}</option>)}
      </select>
      <span style={{ position: 'absolute', right: sp.C, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: c['content-secondary'] }}>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    </div>
  );
  const pill = (active: boolean, onClick: () => void, children: React.ReactNode) => (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: sp.A + 1, height: 30,
        padding: `0 ${sp.C}px`, borderRadius: 99,
        border: `1px solid ${active ? c['border-brand'] : c['border-default']}`,
        background: active ? c['background-brand'] : c['background-base'],
        color: active ? c['content-alternate'] : c['content-primary'],
        fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary,
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >{children}</button>
  );

  // A key on both sides is what makes this a join at all, so Apply waits for both. Everything
  // else has a workable default, and the preview is what tells the user whether it was right.
  const incomplete = !draft.col1 || !draft.col2;

  return (
    <Modal
      isOpen
      onClose={onCancel}
      title={mode === 'create' ? 'Configure join' : 'Edit join'}
      size="M2"
      footer={(
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: sp.B }}>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" disabled={incomplete} onClick={onApply}>
            {mode === 'create' ? 'Apply join' : 'Save changes'}
          </Button>
        </div>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.E }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.D }}>
          <div>{label('Table 1')}{fixedField(table1)}</div>
          <div>{label('Table 2')}{fixedField(table2)}</div>
          <div>{label('Column')}{selectField(draft.col1, table1Cols, v => onChange({ col1: v }))}</div>
          <div>{label('Column')}{selectField(draft.col2, table2Cols, v => onChange({ col2: v }))}</div>
        </div>

        <div style={{ height: 1, background: c['border-divider'] }} />

        <div>
          {label('Join type')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.B }}>
            {JOIN_TYPE_PILLS.map(({ key, label: l }) => pill(
              draft.joinType === key,
              () => onChange({ joinType: key }),
              <>
                <JoinTypeIcon
                  type={key}
                  size={14}
                  color={draft.joinType === key ? c['content-alternate'] : c['content-primary']}
                  fill={draft.joinType === key ? c['content-alternate'] : c['content-primary']}
                />
                {l}
              </>,
            ))}
          </div>
        </div>

        <div>
          {label('Cardinality')}
          <div style={{ display: 'flex', gap: sp.B }}>
            {CARDINALITY_PILLS.map(({ key, label: l }) => pill(
              draft.cardinality === key,
              () => onChange({ cardinality: key }),
              l,
            ))}
          </div>
          {/* ⚠️ Hardcoded on create, not detected. The canvas draws cardinality as crow's feet,
              so this value becomes a picture asserting something nothing checked — which is why
              auto-proposing it from key uniqueness is in the build queue. */}
          <div style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary, marginTop: sp.B, lineHeight: 1.5 }}>
            Set the wrong one and the preview shows the repetition.
          </div>
        </div>

        <div style={{ height: 1, background: c['border-divider'] }} />

        {/* Last, not first. The name describes the relationship you have just defined — asking
            for it before the keys are chosen is asking you to name something that doesn't exist
            yet. It shows in the data view's header, and deliberately not on the canvas edge. */}
        <div style={{ maxWidth: 360 }}>
          {label('Join name')}
          <input
            value={draft.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder={`${table1} × ${table2}`}
            style={{
              width: '100%', height: 32, boxSizing: 'border-box',
              border: `1px solid ${c['border-default']}`, borderRadius: 6,
              padding: `0 ${sp.C}px`, fontSize: fs.xs, color: c['content-primary'],
              fontFamily: ff.primary, outline: 'none', background: c['background-base'],
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
