import React, { useState } from 'react';
import { ActionMenu, ActionMenuItem, ActionMenuItemGroup, Button, ColorPicker, Horizontal, Icon, SegmentedControl, Select, Slider, TextInput, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { FONTS_MONO, FONTS_UI, RADIANT_ID, UI_STYLES, UiStyle } from '../uiStyle';
import styles from '../v6.module.css';

const SAVED_KEY = 'agentdb-v5-ui-styles-saved';
const loadSaved = (): UiStyle[] => {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]') as UiStyle[];
  } catch {
    return [];
  }
};

/**
 * The UI style control (Vivek, 26 Oct): a brush button next to the prototype's gear. The menu
 * picks a style, like picking a version; Customize opens the generator as a drawer, where every
 * dial restyles the product live and a tuned style can be saved under a name. Radiant has no
 * palette icon; brush is the nearest.
 */
export const StylePanel: React.FC<{ value: UiStyle; onChange: (s: UiStyle) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [menuKey, setMenuKey] = useState(0);
  const [saved, setSaved] = useState<UiStyle[]>(loadSaved);
  const [name, setName] = useState('');
  const all = [...UI_STYLES, ...saved];
  const mark = (on: boolean) => (on ? <Icon name="checkmark" size="s" aria-hidden /> : <span className={styles.iconSpacer} aria-hidden />);
  const tune = (patch: Partial<UiStyle>) => onChange({ ...value, ...patch, id: value.id.endsWith('~') ? value.id : `${value.id}~` });
  const tuneColor = (k: keyof UiStyle['c'], v: string) => tune({ c: { ...value.c, [k]: v } });
  const base = value.id.replace(/~$/, '');

  const save = () => {
    const s: UiStyle = { ...value, id: `saved-${Date.now()}`, name: name.trim() || `${value.name} (tuned)` };
    const next = [...saved, s];
    setSaved(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    onChange(s);
    setName('');
  };
  const remove = (id: string) => {
    const next = saved.filter((x) => x.id !== id);
    setSaved(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    if (value.id === id) onChange(UI_STYLES[0]);
  };

  return (
    <>
      <div className={styles.styleControls}>
        <ActionMenu
          key={menuKey}
          placement="top-start"
          trigger={
            <Button variant="secondary" icon="brush" iconOnly aria-label="UI style">
              UI style
            </Button>
          }
        >
          <ActionMenuItemGroup label="UI style">
            {all.map((s) => (
              <ActionMenuItem
                key={s.id}
                label={s.name}
                icon={mark(base === s.id)}
                onClick={() => {
                  onChange(s);
                  setMenuKey((n) => n + 1);
                }}
              />
            ))}
          </ActionMenuItemGroup>
          <ActionMenuItemGroup label="Generator">
            <ActionMenuItem
              label="Customize…"
              onClick={() => {
                setOpen(true);
                setMenuKey((n) => n + 1);
              }}
            />
          </ActionMenuItemGroup>
        </ActionMenu>
      </div>

      {open && (
        <aside className={styles.styleDrawer} aria-label="UI style generator">
          <Horizontal justify="space-between" align="center">
            <Typography variant="content-label" color="base" noMargin>
              UI style
            </Typography>
            <Button variant="tertiary" size="small" iconOnly icon="cross" aria-label="Close" onClick={() => setOpen(false)}>
              Close
            </Button>
          </Horizontal>
          <Typography variant="footnote" color="gray-light" noMargin>
            {value.idea ?? 'Tuned by hand'}
          </Typography>

          <Vertical gap={spacing.B}>
            <Typography variant="footnote" color="gray-light" noMargin>
              Start from
            </Typography>
            <div className={styles.styleSwatches}>
              {all.map((s) => (
                <button key={s.id} type="button" className={[styles.styleSwatch, base === s.id && styles.styleSwatchOn].filter(Boolean).join(' ')} onClick={() => onChange(s)} title={s.idea}>
                  <span className={styles.styleStrip}>
                    {(['frame', 'surface', 'ink', 'accent', 'signal'] as const).map((k) => (
                      <span key={k} style={{ background: s.c[k] }} />
                    ))}
                  </span>
                  <Typography variant="footnote" color="base" noMargin>
                    {s.name}
                  </Typography>
                </button>
              ))}
            </div>
          </Vertical>

          {value.id !== RADIANT_ID && (
            <>
              <Vertical gap={spacing.B}>
                <Typography variant="footnote" color="gray-light" noMargin>
                  Colour
                </Typography>
                <div className={styles.styleColors}>
                  {(['frame', 'surface', 'ink', 'accent', 'signal', 'good'] as const).map((k) => (
                    <Vertical key={k} gap={spacing.A}>
                      <Typography variant="footnote" color="gray-light" noMargin>
                        {k}
                      </Typography>
                      <ColorPicker selectorType="hex" value={value.c[k]} onChange={(v) => tuneColor(k, v)} />
                    </Vertical>
                  ))}
                </div>
              </Vertical>

              <Select label="Interface font" options={FONTS_UI.map((f) => ({ id: f, label: f }))} value={value.fu} onChange={(v) => tune({ fu: v })} fullWidth />
              <Select label="Code font" options={FONTS_MONO.map((f) => ({ id: f, label: f }))} value={value.fm} onChange={(v) => tune({ fm: v })} fullWidth />
              <Slider label="Roundness" min={0} max={20} step={1} value={value.radius} onChange={(v) => tune({ radius: v })} showValue />
              <Slider label="Spacing" min={3} max={6} step={0.5} value={value.spacing} onChange={(v) => tune({ spacing: v })} showValue />
              <Vertical gap={spacing.A}>
                <Typography variant="footnote" color="gray-light" noMargin>
                  Density
                </Typography>
                <SegmentedControl
                  size="small"
                  fullWidth
                  value={value.density}
                  onChange={(v) => tune({ density: v as UiStyle['density'] })}
                  options={[
                    { id: 'compact', label: 'Compact' },
                    { id: 'regular', label: 'Regular' },
                    { id: 'comfortable', label: 'Airy' },
                  ]}
                />
              </Vertical>
              <Vertical gap={spacing.A}>
                <Typography variant="footnote" color="gray-light" noMargin>
                  Borders
                </Typography>
                <SegmentedControl
                  size="small"
                  fullWidth
                  value={value.border}
                  onChange={(v) => tune({ border: v as UiStyle['border'] })}
                  options={[
                    { id: 'none', label: 'None' },
                    { id: 'hair', label: 'Hairline' },
                    { id: 'solid', label: 'Solid' },
                  ]}
                />
              </Vertical>

              <Vertical gap={spacing.B}>
                <TextInput label="Save as" placeholder={`${value.name} (tuned)`} value={name} onChange={(e) => setName(e.target.value)} />
                <Button variant="primary" onClick={save}>
                  Save style
                </Button>
              </Vertical>
            </>
          )}

          {saved.length > 0 && (
            <Vertical gap={spacing.A}>
              <Typography variant="footnote" color="gray-light" noMargin>
                Saved in this browser
              </Typography>
              {saved.map((s) => (
                <Horizontal key={s.id} justify="space-between" align="center">
                  <Typography variant="body-normal" color="base" noMargin>
                    {s.name}
                  </Typography>
                  <Button variant="tertiary" size="small" iconOnly icon="trash-can" aria-label={`Delete ${s.name}`} onClick={() => remove(s.id)}>
                    Delete
                  </Button>
                </Horizontal>
              ))}
            </Vertical>
          )}
        </aside>
      )}
    </>
  );
};
