import React from 'react';
import { systemColors, referenceColors, rdComponentColors, sysVar } from '../tokens/colors';
import type { SystemColorKey, RdComponentColorKey } from '../tokens/colors';
import { figmaNameAliases } from '../tokens/colors/system';
import { componentNameAliases } from '../tokens/colors/component';
import { shadowPrimitives } from '../tokens/shadows';
import { fontFamily } from '../tokens/typography';
import { Typography } from '../components/Typography';
import { Grid } from '../components/Grid';
import { Horizontal, Vertical } from '../components/Layout';

// ─── Reference scales ──────────────────────────────────────────────────────

interface ColorSwatchProps {
  colorName: string;
  colorScale: Record<number | string, string>;
  description: string;
  usage: string[];
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ colorName, colorScale, description, usage }) => {
  const scaleEntries = Object.entries(colorScale).sort((a, b) => {
    const aNum = parseInt(a[0], 10);
    const bNum = parseInt(b[0], 10);
    return bNum - aNum; // Sort descending (dark to light)
  });

  return (
    <div style={styles.colorSection}>
      <div style={styles.colorHeader}>
        <Typography variant="section-label" noMargin>{colorName}</Typography>
        <Typography variant="body-normal" color="gray" noMargin>{description}</Typography>
      </div>
      <div style={styles.usageList}>
        <Typography variant="overline" color="gray" noMargin>Common usage</Typography>
        <ul style={styles.usageItems}>
          {usage.map((item, index) => (
            <li key={index} style={styles.usageItem}>{item}</li>
          ))}
        </ul>
      </div>
      <div style={styles.swatchGrid}>
        {scaleEntries.map(([key, value]) => {
          const isLight = parseInt(key, 10) <= 40;
          return (
            <div key={key} style={styles.swatchItem}>
              <div
                style={{
                  ...styles.swatchColor,
                  backgroundColor: value,
                  // The swatch is a fixed reference colour, so its label colour is fixed too
                  color: isLight ? referenceColors.gray['90'] : referenceColors.white,
                }}
              >
                <span style={styles.swatchLevel}>{key}</span>
              </div>
              <div style={styles.swatchInfo}>
                <span style={styles.swatchValue}>{value}</span>
                <span style={styles.swatchToken}>{colorName.toLowerCase()}.{key}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Light and dark token swatches ─────────────────────────────────────────

type Mode = 'light' | 'dark';

interface TokenRow {
  name: string;
  cssVar: string;
  light: string;
  dark: string;
  isShadow: boolean;
}

interface AliasRow {
  alias: string;
  of: string;
}

interface TokenGroup {
  id: string;
  label: string;
  note?: string;
  rows: TokenRow[];
  aliases: AliasRow[];
}

const modeLabel: Record<Mode, string> = { light: 'Light', dark: 'Dark' };

/**
 * One mode's swatch. The tile uses that mode's base surface, so translucent
 * tokens and shadows read the way they do in that theme, whatever the page theme is.
 */
const ModeSwatch: React.FC<{ mode: Mode; value: string; isShadow: boolean }> = ({ mode, value, isShadow }) => {
  const modeColors = systemColors[mode];
  return (
    <Vertical gap="var(--spacing-1)" align="stretch" style={styles.modeSwatch}>
      <div style={{ ...styles.modeTile, backgroundColor: modeColors['background-base'] }}>
        {isShadow ? (
          <div style={{ ...styles.shadowCard, backgroundColor: modeColors['background-raised'], boxShadow: value }} />
        ) : (
          <div style={{ ...styles.modeFill, backgroundColor: value, borderColor: modeColors['border-divider'] }} />
        )}
      </div>
      <span style={styles.modeLabel}>{modeLabel[mode]}</span>
      <span style={styles.modeValue}>{value}</span>
    </Vertical>
  );
};

const TokenCard: React.FC<{ row: TokenRow }> = ({ row }) => (
  <Vertical gap="var(--spacing-2)" align="stretch" style={styles.tokenCard}>
    <Vertical gap={2} align="stretch">
      <span style={styles.tokenName}>{row.name}</span>
      <span style={styles.tokenVar}>{row.cssVar}</span>
    </Vertical>
    <Horizontal gap="var(--spacing-2)" align="start">
      <ModeSwatch mode="light" value={row.light} isShadow={row.isShadow} />
      <ModeSwatch mode="dark" value={row.dark} isShadow={row.isShadow} />
    </Horizontal>
  </Vertical>
);

const TokenGroupBlock: React.FC<{ group: TokenGroup }> = ({ group }) => (
  <div style={styles.systemGroup}>
    <Typography variant="section-label" noMargin style={{ marginBottom: 'var(--spacing-2)' }}>
      {group.label} ({group.rows.length} tokens)
    </Typography>
    {group.note && (
      <Typography variant="footnote" color="gray" noMargin style={{ marginBottom: 'var(--spacing-4)' }}>
        {group.note}
      </Typography>
    )}
    <Grid columns="repeat(auto-fill, minmax(220px, 1fr))" gap="var(--spacing-3)" style={{ marginTop: 'var(--spacing-3)' }}>
      {group.rows.map((row) => (
        <TokenCard key={row.name} row={row} />
      ))}
    </Grid>
    {group.aliases.length > 0 && (
      <Vertical gap="var(--spacing-1)" align="start" style={styles.aliasList}>
        <Typography variant="overline" color="gray" noMargin>Aliases</Typography>
        {group.aliases.map(({ alias, of }) => (
          <span key={alias} style={styles.aliasItem}>
            <code style={styles.aliasCode}>{alias}</code> alias of <code style={styles.aliasCode}>{of}</code>
          </span>
        ))}
      </Vertical>
    )}
  </div>
);

// System tokens. Product (Scaligent) names lead; our older names are listed as aliases.
const olderSystemName: Record<string, string> = Object.fromEntries(
  Object.entries(figmaNameAliases).map(([product, older]) => [older, product]),
);
const productSystemNames = new Set<string>(Object.keys(figmaNameAliases));

const systemRows = (Object.keys(systemColors.light) as SystemColorKey[])
  .filter((key) => !productSystemNames.has(key))
  .map((key) => {
    const name = olderSystemName[key] ?? key;
    return {
      row: {
        name,
        cssVar: `--rd-sys-color-${name}`,
        light: systemColors.light[key],
        dark: systemColors.dark[key],
        isShadow: false,
      },
      alias: olderSystemName[key] ? { alias: key, of: name } : undefined,
    };
  });

const systemGroup = (prefix: string, label: string): TokenGroup => {
  const items = systemRows.filter(({ row }) => row.name.startsWith(`${prefix}-`));
  return {
    id: prefix,
    label,
    rows: items.map(({ row }) => row),
    aliases: items.flatMap(({ alias }) => (alias ? [alias] : [])),
  };
};

const systemGroups: TokenGroup[] = [
  systemGroup('background', 'Background'),
  systemGroup('content', 'Content'),
  systemGroup('border', 'Border'),
];

const shadowGroup: TokenGroup = {
  id: 'shadow',
  label: 'Shadow',
  note: 'Light mode tints the shadow with ink; dark mode uses black so raised surfaces still stand out. The older --shadow-surface, --shadow-menu and --shadow-modal names still work.',
  rows: (Object.keys(shadowPrimitives.light) as (keyof typeof shadowPrimitives.light)[]).map((level) => ({
    name: `shadow-${level}`,
    cssVar: `--rd-sys-color-shadow-${level}`,
    light: shadowPrimitives.light[level],
    dark: shadowPrimitives.dark[level],
    isShadow: true,
  })),
  aliases: [],
};

// Component tokens. Older names are listed as aliases of the product names.
const componentAliasKeys = new Set<string>(Object.keys(componentNameAliases));
const componentAliases: AliasRow[] = Object.entries(componentNameAliases).map(([alias, of]) => ({ alias, of }));

const componentRows: TokenRow[] = (Object.keys(rdComponentColors.light) as RdComponentColorKey[])
  .filter((key) => !componentAliasKeys.has(key))
  .map((key) => ({
    name: key,
    cssVar: `--rd-comp-color-${key}`,
    light: rdComponentColors.light[key],
    dark: rdComponentColors.dark[key],
    isShadow: key.endsWith('-shadow'),
  }));

const componentGroup = (prefix: string, label: string, note?: string): TokenGroup => {
  const rows = componentRows.filter((row) => row.name.startsWith(`${prefix}-`));
  const names = new Set(rows.map((row) => row.name));
  return { id: prefix, label, note, rows, aliases: componentAliases.filter(({ of }) => names.has(of)) };
};

const componentGroups: TokenGroup[] = [
  componentGroup('button', 'Button'),
  componentGroup('chip', 'Chip'),
  componentGroup('progress', 'Progress'),
  componentGroup(
    'chart',
    'Chart',
    'Names and dark values come from the product. The product has no light values yet, so the light values here are proposed.',
  ),
  componentGroup('toggle', 'Toggle'),
  componentGroup('segmented-control', 'Segmented control'),
];

const systemTokenCount = systemGroups.reduce((sum, group) => sum + group.rows.length, 0);
const componentTokenCount = componentGroups.reduce((sum, group) => sum + group.rows.length, 0);

// ─── Page ──────────────────────────────────────────────────────────────────

export const ColorSystemPage: React.FC = () => {
  const colorData: ColorSwatchProps[] = [
    {
      colorName: 'Blue',
      colorScale: referenceColors.blue,
      description: 'Primary brand color. Used for interactive elements, links, and primary actions.',
      usage: [
        'Primary buttons and CTAs',
        'Links and interactive text',
        'Selected states and focus rings',
        'Primary brand elements',
      ],
    },
    {
      colorName: 'Gray',
      colorScale: referenceColors.gray,
      description: 'Neutral scale for text, backgrounds, borders, and UI structure.',
      usage: [
        'Text and typography (90, 70, 60, 50)',
        'Backgrounds (10, 20)',
        'Borders and dividers (20, 30)',
        'Disabled states (40, 50)',
      ],
    },
    {
      colorName: 'Green',
      colorScale: referenceColors.green,
      description: 'Success and positive states. Used for confirmations and positive feedback.',
      usage: [
        'Success alerts and toasts',
        'Positive status indicators',
        'Completed states',
        'Positive metrics and growth',
      ],
    },
    {
      colorName: 'Yellow',
      colorScale: referenceColors.yellow,
      description: 'Warning and caution states. Used for alerts requiring attention.',
      usage: [
        'Warning alerts and messages',
        'Pending or in-progress states',
        'Attention-grabbing highlights',
        'Measure chips in analytics',
      ],
    },
    {
      colorName: 'Red',
      colorScale: referenceColors.red,
      description: 'Error and failure states. Used for destructive actions and errors.',
      usage: [
        'Error messages and validation',
        'Destructive action buttons',
        'Failed or error states',
        'Critical alerts',
      ],
    },
    {
      colorName: 'Purple',
      colorScale: referenceColors.purple,
      description: 'Date/time and secondary accent. Used for temporal data and highlights.',
      usage: [
        'Date and time indicators',
        'Calendar and scheduling',
        'Secondary accent elements',
        'Data visualization accents',
      ],
    },
    {
      colorName: 'Orange',
      colorScale: referenceColors.orange,
      description: 'Accent color for highlights and differentiation.',
      usage: [
        'Accent highlights',
        'Data visualization',
        'Secondary CTAs',
        'Notification badges',
      ],
    },
    {
      colorName: 'Teal',
      colorScale: referenceColors.teal,
      description: 'Info and neutral accent. Used for informational content.',
      usage: [
        'Info alerts and messages',
        'Attribute chips in analytics',
        'Data visualization',
        'Secondary brand accent',
      ],
    },
  ];

  const baseColors = [
    { label: 'White', value: referenceColors.white },
    { label: 'White toned', value: referenceColors.gray['00'] },
    { label: 'Black', value: referenceColors.black },
    { label: 'Black toned', value: referenceColors.gray['90'] },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Color system</h1>
        <p style={styles.description}>
          The Radiant color system has three layers: reference (fixed tonal scales), system (semantic
          tokens that change with the theme) and component (per-component tokens). Their CSS variables
          start with rd-ref, rd-sys and rd-comp. Light is the default theme. Switch it with the theme
          control or Ctrl+D; every token below shows its light and dark value side by side.
        </p>
      </div>

      {/* System Tokens Section */}
      <section style={styles.systemSection}>
        <Typography variant="modal-title" noMargin style={{ marginBottom: 'var(--spacing-2)' }}>System tokens</Typography>
        <Typography variant="body-normal" color="gray" noMargin style={{ marginBottom: 'var(--spacing-8)' }}>
          {systemTokenCount} semantic tokens in background, content and border groups, plus three shadows.
          Use them in CSS as var(--rd-sys-color-*) and in inline styles with sysVar() or shadowVar().
        </Typography>

        {systemGroups.map((group) => (
          <TokenGroupBlock key={group.id} group={group} />
        ))}
        <TokenGroupBlock group={shadowGroup} />
      </section>

      {/* Component Tokens Section */}
      <section style={styles.systemSection}>
        <Typography variant="modal-title" noMargin style={{ marginBottom: 'var(--spacing-2)' }}>Component tokens</Typography>
        <Typography variant="body-normal" color="gray" noMargin style={{ marginBottom: 'var(--spacing-8)' }}>
          {componentTokenCount} tokens for buttons, chips, progress, charts, toggles and the segmented control.
          Use them in CSS as var(--rd-comp-color-*) and in inline styles with compVar().
        </Typography>

        {componentGroups.map((group) => (
          <TokenGroupBlock key={group.id} group={group} />
        ))}
      </section>

      {/* Usage Guidelines */}
      <section style={styles.guidelinesSection}>
        <Typography variant="modal-title" noMargin>Usage guidelines</Typography>
        <div style={styles.guidelinesGrid}>
          <div style={styles.guidelineCard}>
            <div style={{ ...styles.guidelineIcon, backgroundColor: sysVar('background-ghost-highlight') }}>
              <span style={{ color: sysVar('content-brand'), fontSize: 20 }}>60</span>
            </div>
            <div>
              <Typography variant="content-label" noMargin>Primary shade</Typography>
              <Typography variant="footnote" color="gray" noMargin>
                Level 60 is the primary shade for most UI elements
              </Typography>
            </div>
          </div>
          <div style={styles.guidelineCard}>
            <div style={{ ...styles.guidelineIcon, backgroundColor: sysVar('background-sunken') }}>
              <span style={{ color: sysVar('content-secondary'), fontSize: 16 }}>10-30</span>
            </div>
            <div>
              <Typography variant="content-label" noMargin>Light shades</Typography>
              <Typography variant="footnote" color="gray" noMargin>
                Backgrounds, subtle fills, and disabled states
              </Typography>
            </div>
          </div>
          <div style={styles.guidelineCard}>
            <div style={{ ...styles.guidelineIcon, backgroundColor: sysVar('content-primary') }}>
              <span style={{ color: sysVar('content-primary-inverse'), fontSize: 16 }}>70-100</span>
            </div>
            <div>
              <Typography variant="content-label" noMargin>Dark shades</Typography>
              <Typography variant="footnote" color="gray" noMargin>
                Text, icons, and high-contrast elements
              </Typography>
            </div>
          </div>
          <div style={styles.guidelineCard}>
            <div style={{ ...styles.guidelineIcon, backgroundColor: sysVar('background-success') }}>
              <span style={{ color: sysVar('content-success'), fontSize: 14 }}>40-50</span>
            </div>
            <div>
              <Typography variant="content-label" noMargin>Mid shades</Typography>
              <Typography variant="footnote" color="gray" noMargin>
                Borders, dividers, and secondary elements
              </Typography>
            </div>
          </div>
        </div>
      </section>

      {/* Reference Color Scales */}
      <section style={styles.scalesSection}>
        <Typography variant="modal-title" noMargin style={{ marginBottom: 'var(--spacing-6)' }}>Reference color scales</Typography>
        {colorData.map((color) => (
          <ColorSwatch key={color.colorName} {...color} />
        ))}
      </section>

      {/* Base Colors */}
      <section style={styles.baseSection}>
        <Typography variant="modal-title" noMargin style={{ marginBottom: 'var(--spacing-4)' }}>Base colors</Typography>
        <div style={styles.baseColorsGrid}>
          {baseColors.map(({ label, value }) => (
            <div key={label} style={styles.baseColorItem}>
              <div style={{ ...styles.baseColorSwatch, backgroundColor: value }} />
              <div>
                <Typography variant="content-label" noMargin>{label}</Typography>
                <Typography variant="footnote" color="gray" noMargin>{value}</Typography>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1000,
  },
  header: {
    marginBottom: 40,
  },
  systemSection: {
    marginBottom: 48,
    padding: 32,
    backgroundColor: sysVar('background-base'),
    borderRadius: 12,
    border: `1px solid ${sysVar('background-subtle')}`,
  },
  systemGroup: {
    marginBottom: 32,
  },
  tokenCard: {
    padding: 'var(--spacing-3)',
    backgroundColor: sysVar('background-sunken'),
    borderRadius: 'var(--radius-lg)',
    minWidth: 0,
  },
  tokenName: {
    fontFamily: fontFamily.mono,
    fontSize: 12,
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    lineHeight: '18px',
    wordBreak: 'break-all',
    fontVariantLigatures: 'none',
  },
  tokenVar: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: sysVar('content-secondary'),
    lineHeight: '16px',
    wordBreak: 'break-all',
    fontVariantLigatures: 'none',
  },
  modeSwatch: {
    flex: '1 1 0',
    minWidth: 0,
  },
  modeTile: {
    height: 56,
    padding: 'var(--spacing-2)',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${sysVar('border-divider')}`,
    boxSizing: 'border-box',
  },
  modeFill: {
    width: '100%',
    height: '100%',
    borderRadius: 'var(--radius-sm)',
    borderWidth: 1,
    borderStyle: 'solid',
    boxSizing: 'border-box',
  },
  shadowCard: {
    width: '100%',
    height: '100%',
    borderRadius: 'var(--radius-sm)',
  },
  modeLabel: {
    fontFamily: fontFamily.primary,
    fontSize: 11,
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-secondary'),
    lineHeight: '16px',
  },
  modeValue: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: sysVar('content-primary'),
    lineHeight: '16px',
    wordBreak: 'break-all',
    fontVariantLigatures: 'none',
  },
  aliasList: {
    marginTop: 'var(--spacing-3)',
    padding: 'var(--spacing-3)',
    borderRadius: 'var(--radius-lg)',
    border: `1px dashed ${sysVar('border-divider')}`,
  },
  aliasItem: {
    fontFamily: fontFamily.primary,
    fontSize: 12,
    color: sysVar('content-secondary'),
    lineHeight: '18px',
  },
  aliasCode: {
    fontFamily: fontFamily.mono,
    color: sysVar('content-primary'),
    fontVariantLigatures: 'none',
  },
  title: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: 36,
    fontWeight: 700,
    color: sysVar('content-primary'),
    marginBottom: 12,
  },
  description: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: 16,
    fontWeight: 400,
    color: sysVar('content-secondary'),
    lineHeight: '26px',
    maxWidth: 700,
  },
  guidelinesSection: {
    marginBottom: 48,
    padding: 24,
    backgroundColor: sysVar('background-sunken'),
    borderRadius: 12,
  },
  guidelinesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
    marginTop: 20,
  },
  guidelineCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: sysVar('background-base'),
    borderRadius: 8,
    border: `1px solid ${sysVar('background-subtle')}`,
  },
  guidelineIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'var(--font-weight-emphasis)',
    fontFamily: 'var(--font-family-mono)',
  },
  scalesSection: {
    marginBottom: 48,
  },
  colorSection: {
    marginBottom: 40,
    padding: 24,
    backgroundColor: sysVar('background-base'),
    borderRadius: 12,
    border: `1px solid ${sysVar('background-subtle')}`,
  },
  colorHeader: {
    marginBottom: 16,
  },
  usageList: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: sysVar('background-sunken'),
    borderRadius: 8,
  },
  usageItems: {
    margin: '8px 0 0 0',
    paddingLeft: 20,
  },
  usageItem: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: 13,
    color: sysVar('content-secondary'),
    lineHeight: '22px',
  },
  swatchGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 8,
  },
  swatchItem: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: 8,
    border: `1px solid ${sysVar('background-subtle')}`,
  },
  swatchColor: {
    height: 64,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: 8,
  },
  swatchLevel: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: 12,
    fontWeight: 'var(--font-weight-emphasis)',
  },
  swatchInfo: {
    padding: 8,
    backgroundColor: sysVar('background-base'),
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  swatchValue: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: 11,
    color: sysVar('content-primary'),
    fontWeight: 500,
  },
  swatchToken: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: 10,
    color: sysVar('content-secondary'),
  },
  baseSection: {
    marginBottom: 40,
  },
  baseColorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16,
  },
  baseColorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: sysVar('background-base'),
    borderRadius: 8,
    border: `1px solid ${sysVar('background-subtle')}`,
  },
  baseColorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 8,
    border: `1px solid ${sysVar('background-subtle')}`,
  },
};

export default ColorSystemPage;
