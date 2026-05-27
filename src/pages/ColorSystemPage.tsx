import React from 'react';
import { systemColors, referenceColors } from '../tokens/colors';
import { fontFamily } from '../tokens/typography';
import { Typography } from '../components/Typography';

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
        <Typography variant="overline" color="gray" noMargin>Common Usage</Typography>
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
                  color: isLight ? systemColors.light['content-primary'] : systemColors.light['background-base'],
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

  const systemBackgroundTokens = Object.entries(systemColors.light)
    .filter(([key]) => key.startsWith('background-'))
    .map(([key, value]) => ({ key, value, cssVar: `--rd-sys-color-${key}` }));

  const systemContentTokens = Object.entries(systemColors.light)
    .filter(([key]) => key.startsWith('content-'))
    .map(([key, value]) => ({ key, value, cssVar: `--rd-sys-color-${key}` }));

  const systemBorderTokens = Object.entries(systemColors.light)
    .filter(([key]) => key.startsWith('border-'))
    .map(([key, value]) => ({ key, value, cssVar: `--rd-sys-color-${key}` }));

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Color System</h1>
        <p style={styles.description}>
          The Radiant color system uses a 3-layer architecture: Reference (primitive tonal scales), 
          System (semantic, mode-aware tokens), and Component (per-component tokens). 
          All prefixed with rd-ref, rd-sys, and rd-comp respectively.
        </p>
      </div>

      {/* System Tokens Section */}
      <section style={styles.systemSection}>
        <Typography variant="modal-title" noMargin style={{ marginBottom: 8 }}>System tokens (light mode)</Typography>
        <Typography variant="body-normal" color="gray" noMargin style={{ marginBottom: 32 }}>
          42 semantic tokens organized into background, content, and border groups. These automatically switch values in dark mode.
        </Typography>

        {/* Background Tokens */}
        <div style={styles.systemGroup}>
          <Typography variant="section-label" noMargin style={{ marginBottom: 16 }}>Background (15 tokens)</Typography>
          <div style={styles.systemTokenGrid}>
            {systemBackgroundTokens.map(({ key, value, cssVar }) => {
              const isTransparent = value.includes('rgba');
              return (
                <div key={key} style={styles.systemTokenItem}>
                  <div style={{
                    ...styles.systemTokenSwatch,
                    backgroundColor: value,
                    border: isTransparent || value === '#FFFFFF' ? `1px solid ${systemColors.light['background-subtle']}` : 'none',
                  }} />
                  <div style={styles.systemTokenInfo}>
                    <span style={styles.systemTokenName}>{key}</span>
                    <span style={styles.systemTokenVar}>{cssVar}</span>
                    <span style={styles.systemTokenValue}>{value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Tokens */}
        <div style={styles.systemGroup}>
          <Typography variant="section-label" noMargin style={{ marginBottom: 16 }}>Content (15 tokens)</Typography>
          <div style={styles.systemTokenGrid}>
            {systemContentTokens.map(({ key, value, cssVar }) => (
              <div key={key} style={styles.systemTokenItem}>
                <div style={{
                  ...styles.systemTokenSwatch,
                  backgroundColor: value,
                  border: value === '#FFFFFF' ? `1px solid ${systemColors.light['background-subtle']}` : 'none',
                }} />
                <div style={styles.systemTokenInfo}>
                  <span style={styles.systemTokenName}>{key}</span>
                  <span style={styles.systemTokenVar}>{cssVar}</span>
                  <span style={styles.systemTokenValue}>{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Border Tokens */}
        <div style={styles.systemGroup}>
          <Typography variant="section-label" noMargin style={{ marginBottom: 16 }}>Border (12 tokens)</Typography>
          <div style={styles.systemTokenGrid}>
            {systemBorderTokens.map(({ key, value, cssVar }) => (
              <div key={key} style={styles.systemTokenItem}>
                <div style={{
                  ...styles.systemTokenSwatch,
                  backgroundColor: value,
                  border: value === '#FFFFFF' ? `1px solid ${systemColors.light['background-subtle']}` : 'none',
                }} />
                <div style={styles.systemTokenInfo}>
                  <span style={styles.systemTokenName}>{key}</span>
                  <span style={styles.systemTokenVar}>{cssVar}</span>
                  <span style={styles.systemTokenValue}>{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Guidelines */}
      <section style={styles.guidelinesSection}>
        <Typography variant="modal-title" noMargin>Usage Guidelines</Typography>
        <div style={styles.guidelinesGrid}>
          <div style={styles.guidelineCard}>
            <div style={{ ...styles.guidelineIcon, backgroundColor: referenceColors.blue['10'] }}>
              <span style={{ color: systemColors.light['content-brand'], fontSize: 20 }}>60</span>
            </div>
            <div>
              <Typography variant="content-label" noMargin>Primary Shade</Typography>
              <Typography variant="footnote" color="gray" noMargin>
                Level 60 is the primary shade for most UI elements
              </Typography>
            </div>
          </div>
          <div style={styles.guidelineCard}>
            <div style={{ ...styles.guidelineIcon, backgroundColor: systemColors.light['background-sunken'] }}>
              <span style={{ color: systemColors.light['content-secondary'], fontSize: 16 }}>10-30</span>
            </div>
            <div>
              <Typography variant="content-label" noMargin>Light Shades</Typography>
              <Typography variant="footnote" color="gray" noMargin>
                Backgrounds, subtle fills, and disabled states
              </Typography>
            </div>
          </div>
          <div style={styles.guidelineCard}>
            <div style={{ ...styles.guidelineIcon, backgroundColor: systemColors.light['content-primary'] }}>
              <span style={{ color: systemColors.light['background-base'], fontSize: 16 }}>70-100</span>
            </div>
            <div>
              <Typography variant="content-label" noMargin>Dark Shades</Typography>
              <Typography variant="footnote" color="gray" noMargin>
                Text, icons, and high-contrast elements
              </Typography>
            </div>
          </div>
          <div style={styles.guidelineCard}>
            <div style={{ ...styles.guidelineIcon, backgroundColor: referenceColors.green['10'] }}>
              <span style={{ color: systemColors.light['content-success'], fontSize: 14 }}>40-50</span>
            </div>
            <div>
              <Typography variant="content-label" noMargin>Mid Shades</Typography>
              <Typography variant="footnote" color="gray" noMargin>
                Borders, dividers, and secondary elements
              </Typography>
            </div>
          </div>
        </div>
      </section>

      {/* Reference Color Scales */}
      <section style={styles.scalesSection}>
        <Typography variant="modal-title" noMargin style={{ marginBottom: 24 }}>Reference Color Scales</Typography>
        {colorData.map((color) => (
          <ColorSwatch key={color.colorName} {...color} />
        ))}
      </section>

      {/* Base Colors */}
      <section style={styles.baseSection}>
        <Typography variant="modal-title" noMargin style={{ marginBottom: 16 }}>Base Colors</Typography>
        <div style={styles.baseColorsGrid}>
          <div style={styles.baseColorItem}>
            <div style={{ ...styles.baseColorSwatch, backgroundColor: systemColors.light['background-base'], border: `1px solid ${systemColors.light['background-subtle']}` }} />
            <div>
              <Typography variant="content-label" noMargin>White</Typography>
              <Typography variant="footnote" color="gray" noMargin>#FFFFFF</Typography>
            </div>
          </div>
          <div style={styles.baseColorItem}>
            <div style={{ ...styles.baseColorSwatch, backgroundColor: referenceColors.gray['00'] }} />
            <div>
              <Typography variant="content-label" noMargin>White Toned</Typography>
              <Typography variant="footnote" color="gray" noMargin>#FAFBFC</Typography>
            </div>
          </div>
          <div style={styles.baseColorItem}>
            <div style={{ ...styles.baseColorSwatch, backgroundColor: referenceColors.black }} />
            <div>
              <Typography variant="content-label" noMargin>Black</Typography>
              <Typography variant="footnote" color="gray" noMargin>#000000</Typography>
            </div>
          </div>
          <div style={styles.baseColorItem}>
            <div style={{ ...styles.baseColorSwatch, backgroundColor: systemColors.light['content-primary'] }} />
            <div>
              <Typography variant="content-label" noMargin>Black Toned</Typography>
              <Typography variant="footnote" color="gray" noMargin>#1C2330</Typography>
            </div>
          </div>
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
    backgroundColor: systemColors.light['background-base'],
    borderRadius: 12,
    border: `1px solid ${systemColors.light['background-subtle']}`,
  },
  systemGroup: {
    marginBottom: 32,
  },
  systemTokenGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  systemTokenItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: systemColors.light['background-sunken'],
    borderRadius: 8,
  },
  systemTokenSwatch: {
    width: 40,
    height: 40,
    borderRadius: 6,
    flexShrink: 0,
  },
  systemTokenInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    minWidth: 0,
  },
  systemTokenName: {
    fontFamily: fontFamily.primary,
    fontSize: 14,
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    lineHeight: '20px',
  },
  systemTokenVar: {
    fontFamily: fontFamily.mono,
    fontSize: 12,
    color: systemColors.light['content-secondary'],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontVariantLigatures: 'none',
    lineHeight: '18px',
  },
  systemTokenValue: {
    fontFamily: fontFamily.mono,
    fontSize: 12,
    color: systemColors.light['content-primary'],
    fontVariantLigatures: 'none',
    lineHeight: '18px',
    fontWeight: 500,
  },
  title: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 36,
    fontWeight: 700,
    color: systemColors.light['content-primary'],
    marginBottom: 12,
  },
  description: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 16,
    fontWeight: 400,
    color: systemColors.light['content-secondary'],
    lineHeight: '26px',
    maxWidth: 700,
  },
  guidelinesSection: {
    marginBottom: 48,
    padding: 24,
    backgroundColor: systemColors.light['background-sunken'],
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
    backgroundColor: systemColors.light['background-base'],
    borderRadius: 8,
    border: `1px solid ${systemColors.light['background-subtle']}`,
  },
  guidelineIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontFamily: '"SF Mono", Monaco, monospace',
  },
  scalesSection: {
    marginBottom: 48,
  },
  colorSection: {
    marginBottom: 40,
    padding: 24,
    backgroundColor: systemColors.light['background-base'],
    borderRadius: 12,
    border: `1px solid ${systemColors.light['background-subtle']}`,
  },
  colorHeader: {
    marginBottom: 16,
  },
  usageList: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: systemColors.light['background-sunken'],
    borderRadius: 8,
  },
  usageItems: {
    margin: '8px 0 0 0',
    paddingLeft: 20,
  },
  usageItem: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 13,
    color: referenceColors.gray['70'],
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
    border: `1px solid ${systemColors.light['background-subtle']}`,
  },
  swatchColor: {
    height: 64,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: 8,
  },
  swatchLevel: {
    fontFamily: '"SF Mono", Monaco, monospace',
    fontSize: 12,
    fontWeight: 600,
  },
  swatchInfo: {
    padding: 8,
    backgroundColor: systemColors.light['background-base'],
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  swatchValue: {
    fontFamily: '"SF Mono", Monaco, monospace',
    fontSize: 11,
    color: systemColors.light['content-primary'],
    fontWeight: 500,
  },
  swatchToken: {
    fontFamily: '"SF Mono", Monaco, monospace',
    fontSize: 10,
    color: systemColors.light['content-secondary'],
  },
  baseSection: {
    marginBottom: 40,
  },
  baseColorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
  },
  baseColorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: systemColors.light['background-base'],
    borderRadius: 8,
    border: `1px solid ${systemColors.light['background-subtle']}`,
  },
  baseColorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
};

export default ColorSystemPage;
