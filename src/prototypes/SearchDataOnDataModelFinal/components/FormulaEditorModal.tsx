import React, { useState } from 'react';
import { RdModal } from '@components/RdModal';
import { TextInput } from '@components/TextInput';
import { SearchInput } from '@components/SearchInput';
import { Button } from '@components/Button';
import { Icon } from '@components/icons';
import { spacing } from '@tokens/spacing';
import { systemColors } from '@tokens/colors';
import { fontFamily, fontSize, fontWeight } from '@tokens/typography';

/**
 * Formula Editor — opened from the left pane's "Add formula" link.
 *
 * The function categories are chevron-only for now: Komal asked for the
 * chevron without the expand, "present for visual parity". The gear and help
 * buttons are there for the same reason.
 */
const FUNCTION_CATEGORIES = ['Logical', 'Comparison', 'Mathematical', 'Text', 'Aggregation'];

export interface FormulaDraft {
  name: string;
  expression: string;
}

export interface FormulaEditorModalProps {
  onCancel: () => void;
  onSave: (formula: FormulaDraft) => void;
  /**
   * Edit mode — the formula to load into the name field and the editor.
   * Omitted when adding, which is the original "+ / Add formula" behaviour.
   */
  initial?: FormulaDraft;
}

export const FormulaEditorModal: React.FC<FormulaEditorModalProps> = ({ onCancel, onSave, initial }) => {
  // Seeded once: the modal is mounted fresh per open (see the callers' `&&`),
  // so there's no stale-prop case to guard against.
  const [name, setName] = useState(initial?.name ?? '');
  const [expression, setExpression] = useState(initial?.expression ?? '');
  const [search, setSearch] = useState('');

  // Validation feedback under the editor, in place of the static hint.
  const trimmedName = name.trim();
  const trimmedExpr = expression.trim();
  const validation = !trimmedExpr
    ? { tone: 'hint' as const, text: 'Enter formula above' }
    : !trimmedName
      ? { tone: 'error' as const, text: 'Give the formula a name' }
      : { tone: 'ok' as const, text: 'Formula looks good' };
  const canSave = !!trimmedExpr && !!trimmedName;

  const categories = FUNCTION_CATEGORIES.filter(c =>
    !search.trim() || c.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <RdModal
      size="M3"
      title="Formula Editor"
      onClose={onCancel}
      cancelLabel="Cancel"
      onCancel={onCancel}
      confirmLabel="Save"
      onConfirm={() => { if (canSave) onSave({ name: trimmedName, expression: trimmedExpr }); }}
    >
      <div style={{ fontFamily: fontFamily.primary }}>
        {/* Name + the two parity controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.C, marginBottom: spacing.D }}>
          <div style={{ flex: 1, minWidth: 0, maxWidth: 420 }}>
            <TextInput
              placeholder="Formula name"
              value={name}
              onChange={e => setName(e.target.value)}
              showLabel={false}
            />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: spacing.B }}>
            <Button variant="secondary" iconOnly icon="settings" aria-label="Formula settings">Settings</Button>
            <Button variant="secondary" iconOnly icon="question-mark" aria-label="Formula help">Help</Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: spacing.F, alignItems: 'stretch' }}>
          {/* Editor with its line-number gutter */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex', height: 360,
              border: `1px solid ${systemColors.light['border-default']}`,
              borderRadius: 6, overflow: 'hidden',
              background: systemColors.light['background-base'],
            }}>
              <div style={{
                width: 40, flexShrink: 0, textAlign: 'right',
                padding: `${spacing.B}px ${spacing.B}px 0 0`,
                fontSize: fontSize.sm, color: systemColors.light['content-brand'],
                borderRight: `1px solid ${systemColors.light['border-divider']}`,
                background: systemColors.light['background-base'],
              }}>1</div>
              <textarea
                value={expression}
                onChange={e => setExpression(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1, minWidth: 0, border: 'none', outline: 'none', resize: 'none',
                  padding: `${spacing.B}px ${spacing.C}px`,
                  fontFamily: fontFamily.primary, fontSize: fontSize.sm,
                  color: systemColors.light['content-primary'], background: 'transparent',
                }}
              />
            </div>
            <div style={{
              marginTop: spacing.C, fontSize: fontSize.sm,
              color: validation.tone === 'error'
                ? systemColors.light['content-failure']
                : validation.tone === 'ok'
                  ? systemColors.light['content-success']
                  : systemColors.light['content-primary'],
            }}>
              {validation.text}
            </div>
          </div>

          {/* Function browser */}
          <div style={{
            width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
            border: `1px solid ${systemColors.light['border-default']}`,
            borderRadius: 6, overflow: 'hidden',
          }}>
            <div style={{ padding: spacing.C }}>
              <SearchInput placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: `0 ${spacing.C}px` }}>
              {categories.map(c => (
                <div
                  key={c}
                  style={{
                    display: 'flex', alignItems: 'center', gap: spacing.B,
                    padding: `${spacing.C}px 0`,
                    fontSize: fontSize.sm, fontWeight: fontWeight.medium,
                    color: systemColors.light['content-primary'],
                  }}
                >
                  <Icon name="chevron-right" size="s" color={systemColors.light['content-secondary']} />
                  {c}
                </div>
              ))}
            </div>
            <div style={{
              borderTop: `1px solid ${systemColors.light['border-divider']}`,
              padding: spacing.D, textAlign: 'center',
              fontSize: fontSize.sm, color: systemColors.light['content-secondary'],
            }}>
              Select an item above to view details
            </div>
          </div>
        </div>
      </div>
    </RdModal>
  );
};

export default FormulaEditorModal;
