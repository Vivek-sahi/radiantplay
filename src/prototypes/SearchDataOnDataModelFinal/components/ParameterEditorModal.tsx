import React, { useState } from 'react';
import { RdModal } from '@components/RdModal';
import { TextInput } from '@components/TextInput';
import { TextArea } from '@components/TextArea';
import { Radio } from '@components/Radio';
import { SegmentedControl } from '@components/SegmentedControl';
import { Typography } from '@components/Typography';
import { spacing } from '@tokens/spacing';
import { fontFamily } from '@tokens/typography';

/**
 * "Create parameter" — opened from the left pane's Parameters dock, both its
 * "+" (header) and its empty state's "Add parameter" button.
 *
 * 2026-09-25, Komal: "Clicking on 'Add a parameter' and the plus icon should
 * open this popup pixel by pixel. Do not change or add anything on your
 * own." — every field, label and control below is present in that
 * reference and nothing else was added: same M2 modal (RdModal already
 * matches its 788×~690 footprint and Cancel/Save footer exactly), same fixed
 * content height as the Formula editor's own modal so the same generous
 * blank space below "Default value" is preserved rather than shrink-wrapped
 * to the fields.
 */
const CONTENT_HEIGHT = 550;

const DATA_TYPES = ['Integer', 'Decimal', 'String', 'Boolean', 'Date'] as const;
type DataType = typeof DATA_TYPES[number];

const ALLOWED_VALUES = ['Any', 'List', 'Range'] as const;
type AllowedValues = typeof ALLOWED_VALUES[number];

export interface ParameterDraft {
  name: string;
  value: string;
}

export interface ParameterEditorModalProps {
  onCancel: () => void;
  onSave: (parameter: ParameterDraft) => void;
}

// 2026-09-25, Komal: "strictly use radiant components and spacing" — the
// real @components/Typography, variant="section-label" (its own 18px/500/
// content-primary heading style, literally named for this exact role)
// rather than a hand-rolled span guessing at size/weight, and the data-type
// picker below is the real @components/SegmentedControl rather than a
// bespoke lookalike.
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="section-label" as="div" noMargin>{children}</Typography>
);

export const ParameterEditorModal: React.FC<ParameterEditorModalProps> = ({ onCancel, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dataType, setDataType] = useState<DataType>('Integer');
  const [allowedValues, setAllowedValues] = useState<AllowedValues>('Any');
  const [defaultValue, setDefaultValue] = useState('');

  const trimmedName = name.trim();

  return (
    <RdModal
      size="M2"
      title="Create parameter"
      onClose={onCancel}
      cancelLabel="Cancel"
      onCancel={onCancel}
      confirmLabel="Save"
      onConfirm={() => { if (trimmedName) onSave({ name: trimmedName, value: defaultValue.trim() }); }}
    >
      <div style={{ fontFamily: fontFamily.primary, display: 'flex', flexDirection: 'column', height: CONTENT_HEIGHT }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.D }}>
          <SectionLabel>Name and description</SectionLabel>
          <div style={{ width: 665 }}>
            <TextInput placeholder="Parameter name" value={name} onChange={e => setName(e.target.value)} showLabel={false} />
          </div>
          <div style={{ width: 665 }}>
            <TextArea placeholder="Add a description (optional)" value={description} onChange={e => setDescription(e.target.value)} showLabel={false} rows={3} resize="none" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.B, marginTop: spacing.G }}>
          <SectionLabel>Data settings</SectionLabel>
          <SegmentedControl
            aria-label="Data type"
            options={DATA_TYPES.map(t => ({ id: t, label: t }))}
            value={dataType}
            onChange={v => setDataType(v as DataType)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.C, marginTop: spacing.H }}>
          <SectionLabel>Allowed values</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.F }}>
            {ALLOWED_VALUES.map(v => (
              <Radio key={v} name="parameter-allowed-values" value={v} label={v} checked={allowedValues === v} onChange={() => setAllowedValues(v)} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.C, marginTop: spacing.H }}>
          <SectionLabel>Default value</SectionLabel>
          <div style={{ width: 220 }}>
            <TextInput placeholder="Default value" value={defaultValue} onChange={e => setDefaultValue(e.target.value)} showLabel={false} />
          </div>
        </div>
      </div>
    </RdModal>
  );
};

export default ParameterEditorModal;
