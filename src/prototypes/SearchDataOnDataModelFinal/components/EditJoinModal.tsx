import React, { useEffect, useState } from 'react';
import { RdModal } from '@components/RdModal';
import { Select } from '@components/Select';
import { SegmentedControl } from '@components/SegmentedControl';
import { Divider } from '@components/Divider';
import { Link } from '@components/Link';
import { spacing } from '@tokens/spacing';
import { systemColors } from '@tokens/colors';
import { fontFamily, fontSize, fontWeight } from '@tokens/typography';
import styles from './EditJoinModal.module.css';

// Options and their order come from the reference dialog.
const JOIN_TYPES = [
  { id: 'inner', label: 'Inner' },
  { id: 'full_outer', label: 'Full Outer' },
  { id: 'left_outer', label: 'Left Outer' },
  { id: 'right_outer', label: 'Right Outer' },
];

const CARDINALITIES = [
  { id: 'many_one', label: 'Many : 1' },
  { id: 'one_many', label: '1 : Many' },
  { id: 'one_one', label: '1 : 1' },
];

// The canvas stores cardinality as the label itself (see init-dme.js's model state).
const CARDINALITY_VALUE: Record<string, string> = {
  many_one: 'Many : 1',
  one_many: '1 : Many',
  one_one: '1 : 1',
};

export interface EditJoinResult {
  leftTable: string;
  leftCol: string;
  rightTable: string;
  rightCol: string;
  joinType: string;
  cardinality: string;
}

export interface EditJoinModalProps {
  /** Table the join starts from — always fixed, never editable. */
  leftTable: string;
  /**
   * Table the join ends at. Supplied when the user dragged the handle onto a
   * second card, in which case it is fixed too; omitted when the handle was
   * clicked, in which case the user picks it here.
   */
  rightTable?: string;
  /** Every table currently on the canvas — the Table 2 picker's options. */
  tables: string[];
  /** Full source schema, for the two column pickers. */
  dataSourceTables: { name: string; columns: string[] }[];
  onCancel: () => void;
  onSave: (join: EditJoinResult) => void;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: fontFamily.primary,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.medium,
  color: systemColors.light['content-primary'],
  marginBottom: spacing.B,
};

// Table 1 / Table 2 read muted in the reference dialog — they label fields the
// user can't always edit — while the column and join labels are full strength.
const mutedLabelStyle: React.CSSProperties = {
  ...labelStyle,
  color: systemColors.light['content-secondary'],
};

export const EditJoinModal: React.FC<EditJoinModalProps> = ({
  leftTable,
  rightTable,
  tables,
  dataSourceTables,
  onCancel,
  onSave,
}) => {
  const [rightName, setRightName] = useState(rightTable ?? '');
  const [leftCol, setLeftCol] = useState('');
  const [rightCol, setRightCol] = useState('');
  const [joinType, setJoinType] = useState('inner');
  const [cardinality, setCardinality] = useState('many_one');

  // Changing Table 2 invalidates the column chosen from it.
  useEffect(() => { setRightCol(''); }, [rightName]);

  const colsFor = (name: string) =>
    (dataSourceTables.find(d => d.name.toLowerCase() === name.toLowerCase())?.columns ?? [])
      .map(c => ({ id: c, label: c }));

  const tableOptions = tables
    .filter(t => t !== leftTable)
    .map(t => ({ id: t, label: t }));

  const canSave = !!rightName && !!leftCol && !!rightCol;

  return (
    <RdModal
      size="M2"
      title="Edit Join"
      onClose={onCancel}
      cancelLabel="Cancel"
      onCancel={onCancel}
      confirmLabel="Save"
      onConfirm={() => {
        if (!canSave) return;
        onSave({
          leftTable,
          leftCol,
          rightTable: rightName,
          rightCol,
          joinType,
          cardinality: CARDINALITY_VALUE[cardinality],
        });
      }}
    >
      <div style={{ fontFamily: fontFamily.primary }}>
        {/* Table 1 / Table 2 — Table 1 is always fixed; Table 2 is fixed only
            when the join was drawn by dragging onto a second card. */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.J, marginBottom: spacing.F }}>
          <div>
            <label style={mutedLabelStyle}>Table 1</label>
            <Select options={[{ id: leftTable, label: leftTable }]} value={leftTable} disabled fullWidth />
          </div>
          <div>
            <label style={mutedLabelStyle}>Table 2</label>
            <Select
              options={rightTable ? [{ id: rightTable, label: rightTable }] : tableOptions}
              value={rightName}
              onChange={v => setRightName(v)}
              disabled={!!rightTable}
              placeholder="Select a table"
              fullWidth
            />
          </div>
        </div>

        {/* Column pickers — both start empty. */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.J, marginBottom: spacing.C }}>
          <div>
            <label style={labelStyle}>Column from Table 1</label>
            <Select
              options={colsFor(leftTable)}
              value={leftCol}
              onChange={v => setLeftCol(v)}
              placeholder="Select a column"
              fullWidth
            />
          </div>
          <div>
            <label style={labelStyle}>Column from Table 2</label>
            <Select
              options={rightName ? colsFor(rightName) : []}
              value={rightCol}
              onChange={v => setRightCol(v)}
              placeholder="Select a column"
              disabled={!rightName}
              fullWidth
            />
          </div>
        </div>

        {/* Multi-column joins aren't modelled here — present for visual parity. */}
        <div style={{ marginBottom: spacing.F }}>
          <Link href="#" onClick={(e: React.MouseEvent) => e.preventDefault()}>+ Add column</Link>
        </div>

        <Divider />

        <div style={{ margin: `${spacing.F}px 0` }}>
          <label style={labelStyle}>Join Type</label>
          <SegmentedControl className={styles.segmented} options={JOIN_TYPES} value={joinType} onChange={setJoinType} />
        </div>

        <Divider />

        <div style={{ marginTop: spacing.F }}>
          <label style={labelStyle}>Cardinality</label>
          <SegmentedControl className={styles.segmented} options={CARDINALITIES} value={cardinality} onChange={setCardinality} />
        </div>
      </div>
    </RdModal>
  );
};

export default EditJoinModal;
