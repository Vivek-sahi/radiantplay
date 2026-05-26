import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { systemColors, referenceColors } from '@tokens/colors';
import { v2TextStyles, textStyles } from '@tokens/typography';
import { Icon } from '@components/icons';

// ─── lineHeight px fix ────────────────────────────────────────────────────────
const px = <T extends { lineHeight: number }>(ts: T): Omit<T, 'lineHeight'> & { lineHeight: string } =>
  ({ ...ts, lineHeight: `${ts.lineHeight}px` });

const ty = {
  sectionLabel:  px(v2TextStyles.sectionLabel),
  contentLabel:  px(v2TextStyles.contentLabel),
  bodyNormal:    px(textStyles.body.normal),
  captionMedium: px(textStyles.caption.medium),
};

// ─── Tokens ───────────────────────────────────────────────────────────────────
// d and r kept for future use
const _d = systemColors.dark; void _d;
const _r = referenceColors; void _r;

// Colors from Liveboard-Styling Figma node 4431:494053
const t = {
  bg:            '#1D232F',   // Gray/90 — panel background
  border:        '#303136',   // Border/Subtle — panel outer border
  borderBold:    '#4A515E',   // Gray/70 — control borders, header divider
  textTitle:     '#EAEDF2',   // Gray/20 — panel "Styling" title
  textHeading:   '#F6F8FA',   // Gray/10 — section headings (Liveboard, Group, Tile)
  textPrimary:   '#DBDFE7',   // Gray/30 — label text
  textSecondary: '#A5ACB9',   // Gray/50 — secondary text, unchecked checkbox border
  textTertiary:  '#777E8B',   // Gray/60 — tertiary
  brand:         '#71A1F4',   // Blue/50 — active/brand/checked
  highlight:     '#71A1F41F', // Blue/50 @ 12% — ghost highlight (selected icon picker)
  checkboxBg:    '#323946',   // Gray/80 — checkbox background
  // Toggle colors: pending confirmation from design
  toggleOff:     '#4A515E',   // Gray/70 — best guess for off state
  toggleOn:      '#71A1F4',   // Blue/50 — on state
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type SelectedTileType = 'answer' | 'kpi' | 'note' | 'group' | 'answer-in-group' | null;

export interface TileOverride {
  linked: boolean;
  description?: boolean;
  highlight?: boolean;   // shared across all tile types
  color?: string;
  kpiView?: string;
  kpiSize?: string;
  kpiColor?: string;
  groupTitle?: boolean;
  groupDescription?: boolean;
  groupTileDescription?: boolean;
  groupColor?: string;
  removePadding?: boolean;
  removeBackground?: boolean;
}

export interface StylingSettings {
  color: string;
  density: 'compact' | 'medium' | 'spacious';
  cornerStyle: 'rounded' | 'sharp';
  spacing: 'guttered' | 'no-gutter';
  groupTitle: boolean;
  groupDescription: boolean;
  groupTileDescription: boolean;
  tileDescription: boolean;
  kpiDescription: boolean;
  kpiView: string;
  kpiSize: string;
  noteRemovePadding: boolean;
  noteRemoveBackground: boolean;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const LinkIcon: React.FC<{ color?: string }> = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6.5 9.5L9.5 6.5" stroke={color || t.textSecondary} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M8 5L9.5 3.5A3 3 0 0 1 14 8L12.5 9.5" stroke={color || t.textSecondary} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M5 8L3.5 9.5A3 3 0 0 0 8 14L9.5 12.5" stroke={color || t.textSecondary} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const UnlinkIcon: React.FC<{ color?: string }> = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 5L9.5 3.5A3 3 0 0 1 14 8L12.5 9.5" stroke={color || t.textSecondary} strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M5 8L3.5 9.5A3 3 0 0 0 8 14L9.5 12.5" stroke={color || t.textSecondary} strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="4" y1="4" x2="12" y2="12" stroke={color || t.textSecondary} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

// ─── Primitives ───────────────────────────────────────────────────────────────

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ height: 28, display: 'flex', alignItems: 'center', paddingTop: 2, paddingBottom: 2 }}>
    <span style={{ ...ty.contentLabel, color: t.textHeading }}>{children}</span>
  </div>
);

const SubHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ paddingTop: 12 }}>
    <span style={{ ...ty.captionMedium, color: t.textSecondary }}>{children}</span>
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ ...ty.bodyNormal, color: t.textPrimary, whiteSpace: 'nowrap' }}>{children}</span>
);

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
    {children}
  </div>
);

const Section: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 16px 16px', width: '100%' }}>
    {children}
  </div>
);

const Divider: React.FC = () => (
  <div style={{ height: 1, background: t.borderBold, width: '100%', flexShrink: 0 }} />
);

// Dark-themed Checkbox matching Figma: Gray/80 bg, Gray/50 border (unchecked), Blue/50 border + checkmark (checked)
const DarkCheckbox: React.FC<{ label: string; checked?: boolean; onChange?: (v: boolean) => void }> = ({ label, checked = false, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => onChange?.(!checked)}>
    <div style={{
      width: 16, height: 16, borderRadius: 2, flexShrink: 0,
      background: t.checkboxBg,
      border: `1px solid ${checked ? t.brand : t.textSecondary}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke={t.brand} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
    <Label>{label}</Label>
  </div>
);

// Dark-themed Toggle — Gray/70 off, Blue/50 on, white thumb
// Toggle colors are best-guess pending design confirmation
const DarkToggle: React.FC<{ checked?: boolean; onChange?: (v: boolean) => void }> = ({ checked = false, onChange }) => (
  <button
    role="switch" aria-checked={checked}
    onClick={() => onChange?.(!checked)}
    style={{
      width: 28, height: 16, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 0,
      position: 'relative', flexShrink: 0,
      background: checked ? t.toggleOn : t.toggleOff,
      transition: 'background 150ms',
    }}
  >
    <span style={{
      position: 'absolute', top: 2,
      left: checked ? 14 : 2,
      width: 12, height: 12, borderRadius: '50%',
      background: '#ffffff',
      transition: 'left 150ms',
    }} />
  </button>
);

// Dark-themed Select dropdown
interface DarkSelectOption { id: string; label: string }
const DarkSelect: React.FC<{
  options: DarkSelectOption[];
  value: string;
  onChange?: (v: string) => void;
  style?: React.CSSProperties;
}> = ({ options, value, onChange, style }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value) ?? options[0];

  React.useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, padding: '0 12px', background: t.bg,
          border: `1px solid ${t.borderBold}`, borderRadius: 6, cursor: 'pointer',
        }}
      >
        <span style={{ ...ty.bodyNormal, color: t.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
          {selected?.label}
        </span>
        <Icon name="chevron-down" size="xs" color={t.textSecondary} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, marginTop: 2,
          background: t.bg, border: `1px solid ${t.borderBold}`, borderRadius: 6,
          overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onChange?.(opt.id); setOpen(false); }}
              style={{
                width: '100%', height: 32, padding: '0 12px', display: 'flex', alignItems: 'center',
                background: opt.id === value ? t.highlight : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ ...ty.bodyNormal, color: opt.id === value ? t.brand : t.textPrimary }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// "Properties linked to X" row — shown when linked (unlink icon) or unlinked (link icon to relink)
const PropertyLinkRow: React.FC<{
  label: string;
  linked: boolean;
  onUnlink: () => void;
  onRelink: () => void;
}> = ({ label, linked, onUnlink, onRelink }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 28 }}>
    <Label>{label}</Label>
    <button
      onClick={linked ? onUnlink : onRelink}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      title={linked ? 'Unlink from liveboard' : 'Link back to liveboard'}
    >
      {linked ? <UnlinkIcon /> : <LinkIcon />}
    </button>
  </div>
);

// ─── Liveboard color swatches (8 theme keys → light BG colors) ────────────────
const LIVEBOARD_SWATCHES = [
  { key: 'gray',   color: '#F6F8FA' },
  { key: 'purple', color: '#f0ebff' },
  { key: 'blue',   color: '#dee8fa' },
  { key: 'teal',   color: '#e1f7fa' },
  { key: 'green',  color: '#e0f8ef' },
  { key: 'yellow', color: '#fff8e5' },
  { key: 'orange', color: '#ffeee5' },
  { key: 'red',    color: '#ffebec' },
] as const;

// Tile color swatches — 2 rows: light (row 1) + dark/highlight (row 2)
const TILE_SWATCHES_LIGHT = [
  '#FFFFFF', '#F8F5FE', '#F3F6FC', '#F1FBFC', '#F1FCF8', '#FEFBF3', '#FFF6F2', '#FEF4F5',
];
export const TILE_SWATCHES_DARK = [
  '#323946', '#422E75', '#163772', '#22636B', '#005D39', '#785F1A', '#7A3D1F', '#721F27',
];

// Color swatch picker for liveboard theme
const LiveboardColorPicker: React.FC<{ value: string; onChange: (k: string) => void; onPreview?: (k: string | null) => void }> = ({ value, onChange, onPreview }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const current = LIVEBOARD_SWATCHES.find(s => s.key === value) ?? LIVEBOARD_SWATCHES[0];

  React.useEffect(() => {
    if (!open) return;
    const onOut = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, [open]);

  return (
    <Row>
      <Label>Color</Label>
      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', height: 32, border: `1px solid ${open ? t.brand : t.borderBold}`, borderRadius: 6, background: t.bg, cursor: 'pointer' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: current.color, border: `0.75px solid ${t.borderBold}`, flexShrink: 0 }} />
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size="xs" color={t.textSecondary} />
        </button>
        {open && (
          <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 200, background: '#2A2E3A', border: `1px solid ${t.borderBold}`, borderRadius: 8, padding: 10, display: 'flex', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
            {LIVEBOARD_SWATCHES.map(s => (
              <button key={s.key}
                onClick={() => { onChange(s.key); onPreview?.(null); setOpen(false); }}
                onMouseEnter={() => onPreview?.(s.key)}
                onMouseLeave={() => onPreview?.(null)}
                style={{ width: 28, height: 28, borderRadius: '50%', background: s.color, border: `2px solid ${s.key === value ? t.brand : 'transparent'}`, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.key === value && <Icon name="checkmark" size="xs" color="#1D232F" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </Row>
  );
};

// Tile color picker — 2 rows (light + dark)
const TileColorPicker: React.FC<{ label: string; value?: string; onChange: (c: string) => void; onPreview?: (c: string | null) => void }> = ({ label, value, onChange, onPreview }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const current = value ?? '#FFFFFF';

  React.useEffect(() => {
    if (!open) return;
    const onOut = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, [open]);

  return (
    <Row>
      <Label>{label}</Label>
      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', height: 32, border: `1px solid ${open ? t.brand : t.borderBold}`, borderRadius: 6, background: t.bg, cursor: 'pointer' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: current, border: `0.75px solid ${t.borderBold}`, flexShrink: 0 }} />
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size="xs" color={t.textSecondary} />
        </button>
        {open && (
          <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 200, background: '#2A2E3A', border: `1px solid ${t.borderBold}`, borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {TILE_SWATCHES_LIGHT.map(c => (
                <button key={c}
                  onClick={() => { onChange(c); onPreview?.(null); setOpen(false); }}
                  onMouseEnter={() => onPreview?.(c)}
                  onMouseLeave={() => onPreview?.(null)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: `2px solid ${c === current ? t.brand : 'rgba(255,255,255,0.15)'}`, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {c === current && <Icon name="checkmark" size="xs" color="#1D232F" />}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {TILE_SWATCHES_DARK.map(c => (
                <button key={c}
                  onClick={() => { onChange(c); onPreview?.(null); setOpen(false); }}
                  onMouseEnter={() => onPreview?.(c)}
                  onMouseLeave={() => onPreview?.(null)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: `2px solid ${c === current ? t.brand : 'transparent'}`, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {c === current && <Icon name="checkmark" size="xs" color="#FFFFFF" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Row>
  );
};

// ─── Icon picker icons ────────────────────────────────────────────────────────

const DensityCompact = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    {([0.75, 5.39, 10.04] as number[]).map(y =>
      ([0.75, 5.69, 10.49] as number[]).map((x, ci) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={ci === 1 ? 4.795 : 4.945} height={4.945} rx={0.4} fill="currentColor" />
      ))
    )}
  </svg>
);

const DensityMedium = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    {([1.05, 6.14, 11.39] as number[]).map((y, i) => (
      <rect key={i} x={1.05} y={y} width={13.785} height={3.446} rx={0.4} fill="currentColor" />
    ))}
  </svg>
);

const DensitySpacious = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    {([1.2, 6.74, 12.29] as number[]).map(y =>
      ([1.2, 6.74, 12.29] as number[]).map(x => (
        <rect key={`${x}-${y}`} x={x} y={y} width={2.547} height={2.547} rx={0.4} fill="currentColor" />
      ))
    )}
  </svg>
);

const CornerRounded = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 13V6.5C3 4.567 4.567 3 6.5 3H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CornerSharp = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 13V3H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SpacingSpaced = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="0.6" y="1.05" width="5.694" height="14.085" rx="0.6" stroke="currentColor" strokeWidth="1.199" />
    <rect x="9.706" y="1.05" width="5.694" height="14.085" rx="0.6" stroke="currentColor" strokeWidth="1.199" />
    {([1.34, 3.74, 6.13, 8.53, 10.93, 13.33] as number[]).map(y => (
      <rect key={y} x={7.3} y={y} width={1.199} height={1.199} rx={0.2} fill="currentColor" />
    ))}
  </svg>
);

const SpacingTight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="0.6" y="1.05" width="14.834" height="14.085" rx="0.6" stroke="currentColor" strokeWidth="1.199" />
    <line x1="8.1" y1="1.8" x2="8.1" y2="13.886" stroke="currentColor" strokeWidth="1.199" />
  </svg>
);

const IconPicker: React.FC<{
  label: string;
  options: { value: string; icon: React.ReactNode; tooltip: string }[];
  value: string;
  onChange?: (v: string) => void;
}> = ({ label, options, value, onChange }) => {
  const [hovered, setHovered] = React.useState<string | null>(null);
  return (
    <Row>
      <Label>{label}</Label>
      <div style={{ display: 'flex', border: `1px solid ${t.borderBold}`, borderRadius: 6, overflow: 'visible', position: 'relative' }}>
        {options.map(opt => (
          <div key={opt.value} style={{ position: 'relative' }}
            onMouseEnter={() => setHovered(opt.value)}
            onMouseLeave={() => setHovered(null)}
          >
            <button onClick={() => onChange?.(opt.value)} style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: value === opt.value ? t.highlight : hovered === opt.value ? '#323946' : 'transparent',
              border: 'none', cursor: 'pointer', padding: 0,
              color: value === opt.value ? t.brand : t.textPrimary,
              transition: 'background 120ms',
            }}>
              {opt.icon}
            </button>
            {hovered === opt.value && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', right: 0,
                background: 'rgba(50, 57, 70, 0.9)', borderRadius: 6, padding: '8px 12px',
                boxShadow: '0 0 4px rgba(25,35,49,0.08), 0 12px 24px rgba(25,35,49,0.12)',
                whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 300,
              }}>
                <span style={{ fontSize: 12, fontWeight: 400, color: '#FFFFFF', lineHeight: '18px', letterSpacing: '-0.6px' }}>
                  {opt.tooltip}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Row>
  );
};

// ─── KPI Select options ───────────────────────────────────────────────────────

const KPI_VIEW_OPTIONS = [
  { id: 'default-all',        label: 'Default (All)'       },
  { id: 'only-value',         label: 'Only value'          },
  { id: 'value-and-change',   label: 'Value and change'    },
  { id: 'value-comparison',   label: 'Value and comparison'},
];

const KPI_SIZE_OPTIONS = [
  { id: 'S', label: 'S' },
  { id: 'M', label: 'M' },
  { id: 'L', label: 'L' },
];

// ─── Panel states ─────────────────────────────────────────────────────────────

type StateProps = {
  override: TileOverride;
  onChange: (p: Partial<TileOverride>) => void;
  onUnlink: () => void;
  onRelink: () => void;
  onPreviewTileColor: (hex: string | null) => void;
};

// No tile selected → Liveboard level
const LiveboardState: React.FC<{ settings: StylingSettings; onChange: (s: Partial<StylingSettings>) => void; onPreviewLiveboard: (k: string | null) => void }> = ({ settings, onChange, onPreviewLiveboard }) => (
  <>
    <Section>
      <SectionHeading>Liveboard</SectionHeading>
      <LiveboardColorPicker value={settings.color} onChange={v => onChange({ color: v })} onPreview={onPreviewLiveboard} />
      <IconPicker label="Density" value={settings.density}
        onChange={v => onChange({ density: v as StylingSettings['density'] })}
        options={[
          { value: 'compact',  icon: <DensityCompact />,   tooltip: 'Compact'  },
          { value: 'medium',   icon: <DensityMedium />,    tooltip: 'Regular'  },
          { value: 'spacious', icon: <DensitySpacious />,  tooltip: 'Loose'    },
        ]}
      />
      <IconPicker label="Corner style" value={settings.cornerStyle}
        onChange={v => onChange({ cornerStyle: v as StylingSettings['cornerStyle'] })}
        options={[
          { value: 'rounded', icon: <CornerRounded />, tooltip: 'Rounded' },
          { value: 'sharp',   icon: <CornerSharp />,   tooltip: 'Sharp'   },
        ]}
      />
      <IconPicker label="Spacing" value={settings.spacing}
        onChange={v => onChange({ spacing: v as StylingSettings['spacing'] })}
        options={[
          { value: 'guttered',  icon: <SpacingSpaced />, tooltip: 'Spaced'     },
          { value: 'no-gutter', icon: <SpacingTight />,  tooltip: 'Continuous' },
        ]}
      />
    </Section>
    <Divider />
    <Section>
      <SectionHeading>Group</SectionHeading>
      <DarkCheckbox label="Title"       checked={settings.groupTitle}       onChange={v => onChange({ groupTitle: v })}/>
      <DarkCheckbox label="Description" checked={settings.groupDescription} onChange={v => onChange({ groupDescription: v })}/>
      <SubHeading>Tiles inside group</SubHeading>
      <DarkCheckbox label="Description" checked={settings.groupTileDescription} onChange={v => onChange({ groupTileDescription: v })}/>
    </Section>
    <Divider />
    <Section>
      <SectionHeading>Tile</SectionHeading>
      <DarkCheckbox label="Description" checked={settings.tileDescription} onChange={v => onChange({ tileDescription: v })}/>
    </Section>
  </>
);

// Answer tile (bar, line, area, table etc.)
const AnswerTileState: React.FC<StateProps> = ({ override, onChange, onUnlink, onRelink, onPreviewTileColor }) => {
  if (override.linked) {
    return (
      <Section>
        <SectionHeading>Answer tile</SectionHeading>
        <Row>
          <Label>Highlight tile</Label>
          <DarkToggle checked={override.highlight ?? false} onChange={v => onChange({ highlight: v })} />
        </Row>
        <PropertyLinkRow label="Properties linked to Liveboard" linked onUnlink={onUnlink} onRelink={onRelink} />
      </Section>
    );
  }
  return (
    <Section>
      <SectionHeading>Answer tile</SectionHeading>
      <Row>
        <Label>Highlight tile</Label>
        <DarkToggle checked={override.highlight ?? false} onChange={v => onChange({ highlight: v })} />
      </Row>
      <Row>
        <Label>Custom properties</Label>
        <button onClick={onRelink} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }} title="Link back to Liveboard">
          <LinkIcon />
        </button>
      </Row>
      <DarkCheckbox label="Description" checked={override.description ?? false} onChange={v => onChange({ description: v })}/>
      <TileColorPicker label="Color" value={override.color} onChange={v => onChange({ color: v })} onPreview={onPreviewTileColor} />
    </Section>
  );
};

// KPI tile
const KpiTileState: React.FC<StateProps> = ({ override, onChange, onUnlink, onRelink, onPreviewTileColor }) => {
  if (override.linked) {
    return (
      <Section>
        <SectionHeading>KPI tile</SectionHeading>
        <Row>
          <Label>Highlight tile</Label>
          <DarkToggle checked={override.highlight ?? false} onChange={v => onChange({ highlight: v })} />
        </Row>
        <PropertyLinkRow label="Properties linked to Liveboard" linked onUnlink={onUnlink} onRelink={onRelink} />
      </Section>
    );
  }
  return (
    <Section>
      <SectionHeading>KPI tile</SectionHeading>
      <Row>
        <Label>Highlight tile</Label>
        <DarkToggle checked={override.highlight ?? false} onChange={v => onChange({ highlight: v })} />
      </Row>
      <Row>
        <Label>Custom properties</Label>
        <button onClick={onRelink} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }} title="Link back to Liveboard">
          <LinkIcon />
        </button>
      </Row>
      <DarkCheckbox label="Description" checked={override.description ?? false} onChange={v => onChange({ description: v })}/>
      <TileColorPicker label="Tile color" value={override.color} onChange={v => onChange({ color: v })} onPreview={onPreviewTileColor} />
      <SubHeading>KPI</SubHeading>
      <Row>
        <Label>View</Label>
        <DarkSelect options={KPI_VIEW_OPTIONS} value={override.kpiView ?? 'default-all'} onChange={v => onChange({ kpiView: v })} style={{ minWidth: 170 }} />
      </Row>
      <Row>
        <Label>Size</Label>
        <DarkSelect options={KPI_SIZE_OPTIONS} value={override.kpiSize ?? 'M'} onChange={v => onChange({ kpiSize: v })} style={{ width: 80 }} />
      </Row>
      <TileColorPicker label="KPI color" value={override.kpiColor} onChange={v => onChange({ kpiColor: v })} onPreview={onPreviewTileColor} />
    </Section>
  );
};

// Note tile
const NoteTileState: React.FC<StateProps> = ({ override, onChange, onUnlink, onRelink, onPreviewTileColor: _p1 }) => {
  if (override.linked) {
    return (
      <Section>
        <SectionHeading>Note tile</SectionHeading>
        <PropertyLinkRow label="Properties linked to Liveboard" linked onUnlink={onUnlink} onRelink={onRelink} />
      </Section>
    );
  }
  return (
    <Section>
      <SectionHeading>Note tile</SectionHeading>
      <Row>
        <Label>Highlight tile</Label>
        <DarkToggle checked={override.highlight ?? false} onChange={v => onChange({ highlight: v })} />
      </Row>
      <DarkCheckbox label="Remove padding"    checked={override.removePadding ?? false}    onChange={v => onChange({ removePadding: v })}/>
      <DarkCheckbox label="Remove background" checked={override.removeBackground ?? false} onChange={v => onChange({ removeBackground: v })}/>
    </Section>
  );
};

// Group tile
const GroupTileState: React.FC<StateProps> = ({ override, onChange, onUnlink, onRelink, onPreviewTileColor: _p2 }) => {
  if (override.linked) {
    return (
      <Section>
        <SectionHeading>Group</SectionHeading>
        <PropertyLinkRow label="Properties linked to Liveboard" linked onUnlink={onUnlink} onRelink={onRelink} />
      </Section>
    );
  }
  return (
    <Section>
      <SectionHeading>Group</SectionHeading>
      <Row>
        <Label>Custom properties</Label>
        <button onClick={onRelink} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }} title="Link back to Liveboard">
          <LinkIcon />
        </button>
      </Row>
      <DarkCheckbox label="Title"       checked={override.groupTitle ?? true}       onChange={v => onChange({ groupTitle: v })}/>
      <DarkCheckbox label="Description" checked={override.groupDescription ?? false} onChange={v => onChange({ groupDescription: v })}/>
      <SubHeading>Tiles inside group</SubHeading>
      <DarkCheckbox label="Description" checked={override.groupTileDescription ?? false} onChange={v => onChange({ groupTileDescription: v })}/>
    </Section>
  );
};

// Answer tile inside a group
const AnswerInGroupState: React.FC<StateProps> = ({ override, onChange, onUnlink, onRelink, onPreviewTileColor }) => {
  if (override.linked) {
    return (
      <Section>
        <SectionHeading>Answer tile</SectionHeading>
        <Row>
          <Label>Highlight tile</Label>
          <DarkToggle checked={override.highlight ?? false} onChange={v => onChange({ highlight: v })} />
        </Row>
        <PropertyLinkRow label="Properties linked to group" linked onUnlink={onUnlink} onRelink={onRelink} />
      </Section>
    );
  }
  return (
    <Section>
      <SectionHeading>Answer tile</SectionHeading>
      <Row>
        <Label>Highlight tile</Label>
        <DarkToggle checked={override.highlight ?? false} onChange={v => onChange({ highlight: v })} />
      </Row>
      <Row>
        <Label>Custom properties</Label>
        <button onClick={onRelink} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }} title="Link back to group">
          <LinkIcon />
        </button>
      </Row>
      <DarkCheckbox label="Description" checked={override.description ?? false} onChange={v => onChange({ description: v })}/>
      <TileColorPicker label="Color" value={override.color} onChange={v => onChange({ color: v })} onPreview={onPreviewTileColor} />
    </Section>
  );
};

// ─── Main panel ───────────────────────────────────────────────────────────────

interface StylingPanelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTileId: string | null;
  selectedTileType: SelectedTileType;
  tileOverrides: Record<string, TileOverride>;
  onTileOverrideChange: (tileId: string, override: Partial<TileOverride>) => void;
  settings: StylingSettings;
  onSettingsChange: (s: Partial<StylingSettings>) => void;
  onPreviewLiveboardColor: (key: string | null) => void;
  onPreviewTileColor: (hex: string | null) => void;
  onPreviewInnerTileColor: (hex: string | null) => void;
}

export const StylingPanelDrawer: React.FC<StylingPanelDrawerProps> = ({
  isOpen, onClose,
  selectedTileId, selectedTileType,
  tileOverrides, onTileOverrideChange,
  settings, onSettingsChange,
  onPreviewLiveboardColor, onPreviewTileColor, onPreviewInnerTileColor,
}) => {
  const override: TileOverride = (selectedTileId ? tileOverrides[selectedTileId] : undefined) ?? { linked: true };
  const onChange = (p: Partial<TileOverride>) => {
    if (selectedTileId) onTileOverrideChange(selectedTileId, p);
  };
  const onUnlink = () => onChange({ linked: false });
  const onRelink = () => onChange({ linked: true });

  const stateProps: StateProps = { override, onChange, onUnlink, onRelink, onPreviewTileColor };
  const innerStateProps: StateProps = { override, onChange, onUnlink, onRelink, onPreviewTileColor: onPreviewInnerTileColor };
  // Group unlink seeds the override with current liveboard values so description etc. don't reset to false
  const onUnlinkGroup = () => onChange({
    linked: false,
    groupTitle: settings.groupTitle,
    groupDescription: settings.groupDescription,
    groupTileDescription: settings.groupTileDescription,
  });
  const groupStateProps: StateProps = { ...stateProps, onUnlink: onUnlinkGroup };

  return (
    <div style={{
      position: 'fixed', top: 60, right: 0, height: 'calc(100vh - 60px)', width: 336,
      background: t.bg, borderLeft: `1px solid ${t.border}`,
      display: 'flex', flexDirection: 'column',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 250ms ease',
      zIndex: 90,
      fontFamily: textStyles.body.normal.fontFamily,
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, height: 48, flexShrink: 0,
        borderBottom: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', background: t.bg,
      }}>
        <span style={{ ...ty.sectionLabel, color: t.textTitle }}>Styling</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Collapse panel">
          <Icon name="chevron-right" size="s" color={t.textSecondary} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {selectedTileType === null             && <LiveboardState settings={settings} onChange={onSettingsChange} onPreviewLiveboard={onPreviewLiveboardColor} />}
        {selectedTileType === 'answer'         && <AnswerTileState     {...stateProps} />}
        {selectedTileType === 'kpi'            && <KpiTileState        {...stateProps} />}
        {selectedTileType === 'note'           && <NoteTileState       {...stateProps} />}
        {selectedTileType === 'group'          && <GroupTileState      {...groupStateProps} />}
        {selectedTileType === 'answer-in-group'&& <AnswerInGroupState  {...innerStateProps} />}
      </div>
    </div>
  );
};
