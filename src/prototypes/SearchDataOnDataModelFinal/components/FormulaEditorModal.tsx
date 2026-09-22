import React, { useState } from 'react';
import { RdModal } from '@components/RdModal';
import { TextInput } from '@components/TextInput';
import { SearchInput } from '@components/SearchInput';
import { Select } from '@components/Select';
import { Button } from '@components/Button';
import { Icon } from '@components/icons';
import { spacing } from '@tokens/spacing';
import { systemColors } from '@tokens/colors';
import { fontFamily, fontSize, fontWeight } from '@tokens/typography';
import { generateMockRows } from './previewMockData';

/**
 * Formula Editor — opened from the left pane's "Add formula" link.
 *
 * Rebuilt to the Figma spec (2026-09-22, Komal: "update the current formula
 * creation pop-up with these specs... we need to show data preview as well.
 * bring it pixel perfect"):
 * https://www.figma.com/design/IhsZRW2P0Yit5R9kwm4rZ9/…?node-id=4518-58918
 * — specifically its "Add formula" / "Formula editor right pane open states"
 * frames. M3 → M2 (788px, matching the spec's Content Area width exactly),
 * a real Output/data-preview column added on the right, and the settings/
 * help icons wired to the two side panels the spec shows (previously
 * decorative — "chevron without expand, present for visual parity").
 *
 * Scope: only this modal. Nothing outside it changed.
 */
const FUNCTION_CATEGORIES = [
  'Logical', 'Comparison', 'Mathematical', 'Text', 'Aggregation',
  'Date and time', 'Conversion', 'Connection passthrough', 'Variable',
];

// The spec's content area is a fixed 550px tall (matching its 788×690 modal),
// not an auto height — the editor and Output columns both need a real,
// bounded height to flex against, which RdModal's own `overflow-y: auto`
// content wrapper doesn't otherwise provide to a plain-flow child.
const CONTENT_HEIGHT = 550;

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
  const isEdit = !!initial;
  // Seeded once: the modal is mounted fresh per open (see the callers' `&&`),
  // so there's no stale-prop case to guard against.
  const [name, setName] = useState(initial?.name ?? '');
  const [expression, setExpression] = useState(initial?.expression ?? '');
  const [search, setSearch] = useState('');
  const [editorFocused, setEditorFocused] = useState(false);

  // Which of the two side panels the gear/help icons show, matching the
  // spec's "Formula editor right pane open states" — at most one at a time,
  // and neither by default (the spec's base "Add formula" state is 2
  // columns: editor + Output only).
  const [activePane, setActivePane] = useState<'none' | 'settings' | 'help'>('none');
  // "Measure or attribute" is a real control per the spec but nothing else
  // in the prototype reads it — same "present for parity" convention this
  // file already used for the gear/help icons before they had panels to open.
  const [measureOrAttribute, setMeasureOrAttribute] = useState<'Attribute' | 'Measure'>('Attribute');
  // "Run again" (spec: Output header, tertiary pill) re-seeds the mock
  // preview rather than re-running anything real — there is no formula
  // evaluation anywhere in this prototype, only generateMockRows' column-name
  // heuristics (see previewMockData.ts), so "running" it again means a fresh
  // draw from the same generator.
  const [previewSeed, setPreviewSeed] = useState(0);

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

  // Data preview (2026-09-22: "we need to show data preview as well") — a
  // formula has no real value until it's syntactically ready to save, same
  // moment the validation line below the editor turns "Formula looks good".
  // Reuses the mock-row generator every other preview in this prototype is
  // built on (init-dme.js has no row-level data at all), keyed by the
  // formula's own name so its column-heuristics (e.g. a name containing
  // "revenue" reads as currency) apply here too.
  const previewCol = trimmedName || 'Result';
  // "Run again" reseeds by sliding the window forward 12 rows into the same
  // deterministic generator (generateMockRows keys every value off its row
  // index) rather than adding randomness generateMockRows doesn't support —
  // a different, but still reproducible, slice each click.
  const previewRows = canSave
    ? generateMockRows([{ col: previewCol, table: 'formula' }], 12 + previewSeed * 12).slice(previewSeed * 12)
    : [];

  const iconBtnStyle = (active: boolean): React.CSSProperties => active
    ? { background: systemColors.light['background-subtle'], borderRadius: 'var(--radius-full, 999px)' }
    : {};

  return (
    <RdModal
      size="M2"
      title={isEdit ? 'Formula Editor' : 'Add formula'}
      onClose={onCancel}
      cancelLabel="Cancel"
      onCancel={onCancel}
      confirmLabel={isEdit ? 'Save' : 'Add'}
      onConfirm={() => { if (canSave) onSave({ name: trimmedName, expression: trimmedExpr }); }}
    >
      <div style={{ fontFamily: fontFamily.primary, display: 'flex', gap: spacing.F, alignItems: 'stretch', height: CONTENT_HEIGHT }}>
        {/* ── Left block: name + icons, then editor (+ optional side panel) ── */}
        <div style={{ width: 472, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: spacing.D, height: '100%' }}>
          {/* Name + the two panel-toggle icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.F, flexShrink: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <TextInput
                placeholder={isEdit ? 'Formula name' : 'Enter formula name'}
                value={name}
                onChange={e => setName(e.target.value)}
                showLabel={false}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.B, flexShrink: 0 }}>
              <Button
                variant="secondary" iconOnly icon="settings" aria-label="Formula output settings"
                onClick={() => setActivePane(p => p === 'settings' ? 'none' : 'settings')}
                style={iconBtnStyle(activePane === 'settings')}
              >Formula output settings</Button>
              <Button
                variant="secondary" iconOnly icon="question-mark" aria-label="Formula help"
                onClick={() => setActivePane(p => p === 'help' ? 'none' : 'help')}
                style={iconBtnStyle(activePane === 'help')}
              >Formula help</Button>
            </div>
          </div>

          <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: spacing.D, width: '100%' }}>
            {/* Editor with its line-number gutter */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: spacing.B, height: '100%' }}>
              <div style={{
                display: 'flex', flex: 1, minHeight: 0,
                border: `1px solid ${editorFocused ? systemColors.light['border-brand'] : systemColors.light['border-default']}`,
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
                  onFocus={() => setEditorFocused(true)}
                  onBlur={() => setEditorFocused(false)}
                  autoFocus={!isEdit}
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
                flexShrink: 0, fontSize: fontSize.sm,
                color: validation.tone === 'error'
                  ? systemColors.light['content-failure']
                  : validation.tone === 'ok'
                    ? systemColors.light['content-success']
                    : systemColors.light['content-primary'],
              }}>
                {validation.text}
              </div>
            </div>

            {/* Side panel — settings or the function browser, whichever the
                header icons opened. Neither by default: the spec's base
                "Add formula" state is 2 columns only. */}
            {activePane !== 'none' && (
              <div style={{ width: 228, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: spacing.D, height: '100%' }}>
                {activePane === 'settings' ? (
                  <>
                    <div style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: systemColors.light['content-primary'] }}>
                      Configure formula output settings
                    </div>
                    <Select
                      label="Data type"
                      value="VARCHAR"
                      options={[{ id: 'VARCHAR', label: 'VARCHAR', value: 'VARCHAR' }]}
                      disabled
                      fullWidth
                      helperText="Indicates the type of data that the formula generates. This is automatically determined by the system, and cannot be customised."
                    />
                    <Select
                      label="Measure or attribute"
                      value={measureOrAttribute}
                      onChange={v => setMeasureOrAttribute(v as 'Attribute' | 'Measure')}
                      options={[{ id: 'Attribute', label: 'Attribute', value: 'Attribute' }, { id: 'Measure', label: 'Measure', value: 'Measure' }]}
                      fullWidth
                      helperText="Determines if the output of the formula is a measure or an attribute. For example, choose attribute for a formula that generates age groups, and choose measure for a formula that generates profit."
                    />
                  </>
                ) : (
                  <>
                    <SearchInput placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
                    <div style={{
                      flex: 1, minHeight: 0, overflowY: 'auto', padding: `${spacing.B}px 0`,
                      border: `1px solid ${systemColors.light['border-divider']}`, borderRadius: 6,
                    }}>
                      {categories.map(c => (
                        <div
                          key={c}
                          style={{
                            display: 'flex', alignItems: 'center', gap: spacing.C,
                            padding: `6px ${spacing.D}px`,
                            fontSize: fontSize.sm, color: systemColors.light['content-primary'],
                          }}
                        >
                          <Icon name="chevron-right" size="s" color={systemColors.light['content-secondary']} />
                          {c}
                        </div>
                      ))}
                    </div>
                    <div style={{ flexShrink: 0, fontSize: fontSize.xs, color: systemColors.light['content-primary'] }}>
                      Select an item above to view details
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Vertical rule between the editor block and Output — the spec's
            own "Utils/Divider" asset, reproduced as a plain 1px rule rather
            than importing its SVG (skill guidance: build from the project's
            own tokens, not the design's raw assets, when a token-based
            equivalent expresses it exactly). */}
        <div style={{ width: 1, alignSelf: 'stretch', background: systemColors.light['border-divider'], flexShrink: 0 }} />

        {/* ── Output / data preview — the addition this update is for ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: spacing.D, height: '100%' }}>
          <div style={{ height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, fontWeight: fontWeight.semibold, color: systemColors.light['content-primary'], letterSpacing: '-0.4px' }}>
              Output
            </span>
            {canSave && (
              <button
                type="button"
                onClick={() => setPreviewSeed(s => s + 1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 12px', border: 'none', borderRadius: 12,
                  background: systemColors.light['background-subtle'],
                  fontFamily: fontFamily.primary, fontSize: fontSize.xs, color: systemColors.light['content-primary'],
                  letterSpacing: '-0.072px', cursor: 'pointer',
                }}
              >
                <Icon name="play" size="xs" />
                Run again
              </button>
            )}
          </div>
          <div style={{
            flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
            border: `1px solid ${systemColors.light['border-divider']}`, borderRadius: 6,
            background: systemColors.light['background-base'], overflow: 'hidden',
          }}>
            {!canSave ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: spacing.B }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: systemColors.light['background-subtle'],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: systemColors.light['content-secondary'],
                }}>
                  <Icon name="search" size="s" />
                </div>
                <div style={{ width: 204, display: 'flex', flexDirection: 'column', gap: spacing.B, alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: systemColors.light['content-primary'] }}>
                    Build a formula first
                  </div>
                  <div style={{ fontSize: fontSize.sm, fontWeight: fontWeight.light, color: systemColors.light['content-secondary'], width: 160 }}>
                    Write your formula to generate its output.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <div style={{
                  height: 48, display: 'flex', alignItems: 'center', padding: `4px ${spacing.D}px`,
                  borderBottom: `2px solid ${systemColors.light['border-default']}`,
                  background: systemColors.light['background-base'],
                  fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: systemColors.light['content-primary'],
                  position: 'sticky', top: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {previewCol}
                </div>
                {previewRows.map((row, i) => (
                  <div key={i} style={{
                    height: 36, display: 'flex', alignItems: 'center', padding: `8px ${spacing.D}px`,
                    borderBottom: `1px solid ${systemColors.light['border-divider']}`,
                    fontSize: fontSize.sm, fontWeight: fontWeight.light, color: systemColors.light['content-primary'],
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {String(row[previewCol])}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </RdModal>
  );
};

export default FormulaEditorModal;
