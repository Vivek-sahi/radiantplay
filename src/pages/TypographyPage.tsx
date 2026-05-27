import React, { Component, ErrorInfo, ReactNode } from 'react';
import { systemColors, referenceColors } from '../tokens/colors';

// Error Boundary to catch React rendering errors
class TypographyPageErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TypographyPage error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h1>Error loading Typography page</h1>
          <p>{this.state.error?.message}</p>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import { Typography } from '../components/Typography';

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1000,
  },
  header: {
    marginBottom: 40,
  },
  pageTitle: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 36,
    fontWeight: 700,
    color: systemColors.light['content-primary'],
    marginBottom: 12,
  },
  pageDescription: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 16,
    fontWeight: 400,
    color: systemColors.light['content-secondary'],
    lineHeight: '26px',
    maxWidth: 700,
  },
  section: {
    marginBottom: 48,
  },
  fontCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    padding: 24,
    backgroundColor: systemColors.light['background-base'],
    border: `1px solid ${systemColors.light['background-subtle']}`,
    borderRadius: 12,
    marginBottom: 12,
  },
  fontPreview: {
    width: 80,
    height: 80,
    backgroundColor: systemColors.light['background-sunken'],
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSample: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 36,
    fontWeight: 600,
    color: systemColors.light['content-primary'],
  },
  fontInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  fontStack: {
    fontFamily: '"SF Mono", Monaco, monospace',
    fontSize: 11,
    color: systemColors.light['content-secondary'],
    marginTop: 8,
    backgroundColor: systemColors.light['background-sunken'],
    padding: '6px 10px',
    borderRadius: 6,
  },
  typographyList: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: systemColors.light['background-base'],
    border: `1px solid ${systemColors.light['background-subtle']}`,
    borderRadius: 12,
    overflow: 'hidden',
  },
  typographyRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: `1px solid ${systemColors.light['background-sunken']}`,
  },
  typographyMeta: {
    width: 240,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  variantCode: {
    fontFamily: '"SF Mono", Monaco, monospace',
    fontSize: 12,
    fontWeight: 500,
    color: systemColors.light['content-brand'],
  },
  specsLabel: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 11,
    color: systemColors.light['content-secondary'],
  },
  typographySample: {
    flex: 1,
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  },
  colorCard: {
    padding: 20,
    backgroundColor: systemColors.light['background-base'],
    border: `1px solid ${systemColors.light['background-subtle']}`,
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  colorCode: {
    fontFamily: '"SF Mono", Monaco, monospace',
    fontSize: 11,
    color: systemColors.light['content-secondary'],
  },
  guidelinesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  },
  guidelineCard: {
    padding: 20,
    backgroundColor: systemColors.light['background-sunken'],
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  codeBlock: {
    backgroundColor: systemColors.light['content-primary'],
    borderRadius: 12,
    padding: 24,
    overflow: 'auto',
  },
  codeContent: {
    fontFamily: '"SF Mono", Monaco, monospace',
    fontSize: 13,
    lineHeight: '22px',
    color: referenceColors.gray['30'],
    margin: 0,
  },
  // Props Table
  propsTable: {
    backgroundColor: systemColors.light['background-base'],
    border: `1px solid ${systemColors.light['background-subtle']}`,
    borderRadius: 12,
    overflow: 'hidden',
  },
  propsHeader: {
    display: 'grid',
    gridTemplateColumns: '150px 1fr 120px 2fr',
    gap: 16,
    padding: '12px 16px',
    backgroundColor: systemColors.light['background-sunken'],
    borderBottom: `1px solid ${systemColors.light['background-subtle']}`,
  },
  propsHeaderCell: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 12,
    fontWeight: 600,
    color: referenceColors.gray['70'],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  propsRow: {
    display: 'grid',
    gridTemplateColumns: '150px 1fr 120px 2fr',
    gap: 16,
    padding: '12px 16px',
    borderBottom: `1px solid ${systemColors.light['background-sunken']}`,
  },
  propsCell: {
    fontFamily: '"SF Mono", Monaco, monospace',
    fontSize: 12,
    color: referenceColors.gray['70'],
  },
  // Examples
  exampleCard: {
    backgroundColor: systemColors.light['background-base'],
    border: `1px solid ${systemColors.light['background-subtle']}`,
    borderRadius: 12,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  exampleColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  exampleRow: {
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap',
  },
};

interface TypographyExampleProps {
  variant: string;
  label: string;
  specs: string;
  sample?: string;
}

const TypographyExample: React.FC<TypographyExampleProps> = ({ variant, label, specs, sample }) => {
  return (
    <div style={styles.typographyRow}>
      <div style={styles.typographyMeta}>
        <code style={styles.variantCode}>{variant}</code>
        <span style={styles.specsLabel}>{specs}</span>
      </div>
      <div style={styles.typographySample}>
        <Typography variant={variant as any} noMargin>
          {sample || label}
        </Typography>
      </div>
    </div>
  );
};

const TypographyPageContent: React.FC = () => {
  const typographyVariants = [
    { variant: 'headline-large', label: 'Headline Large', specs: '32px / 700 / -0.5px' },
    { variant: 'page-title', label: 'Page Title', specs: '24px / 600 / -0.25px' },
    { variant: 'modal-title', label: 'Modal Title', specs: '20px / 600 / 0' },
    { variant: 'section-label', label: 'Section Label', specs: '18px / 600 / 0' },
    { variant: 'content-label', label: 'Content Label', specs: '16px / 600 / 0' },
    { variant: 'content-label-subhead', label: 'Content Label Subhead', specs: '16px / 500 / 0' },
    { variant: 'body-large', label: 'Body Large', specs: '16px / 400 / 0' },
    { variant: 'body-normal', label: 'Body Normal', specs: '14px / 400 / 0' },
    { variant: 'footnote', label: 'Footnote', specs: '12px / 400 / 0' },
    { variant: 'overline', label: 'OVERLINE', specs: '12px / 600 / 0.5px uppercase' },
    { variant: 'caption', label: 'Caption', specs: '12px / 400 / 0' },
  ];

  const colorVariants = [
    { color: 'base', label: 'Base', hex: systemColors.light['content-primary'] },
    { color: 'gray', label: 'Gray', hex: systemColors.light['content-secondary'] },
    { color: 'gray-light', label: 'Gray Light', hex: systemColors.light['content-tertiary'] },
    { color: 'accent', label: 'Accent', hex: systemColors.light['content-brand'] },
    { color: 'success', label: 'Success', hex: systemColors.light['content-success'] },
    { color: 'warning', label: 'Warning', hex: referenceColors.yellow['70'] },
    { color: 'failure', label: 'Failure', hex: systemColors.light['content-failure'] },
  ];

  // Wrap component in Error Boundary to catch React rendering errors
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Typography</h1>
        <p style={styles.pageDescription}>
          The Radiant typography system provides consistent text styling across all components.
          Built on the "Plain" font family with a comprehensive scale from headlines to footnotes.
        </p>
      </div>

      {/* Font Family Section */}
      <section style={styles.section}>
        <Typography variant="modal-title" noMargin style={{ marginBottom: 16 }}>Font Family</Typography>
        <div style={styles.fontCard}>
          <div style={styles.fontPreview}>
            <span style={styles.fontSample}>Aa</span>
          </div>
          <div style={styles.fontInfo}>
            <Typography variant="content-label" noMargin>Plain</Typography>
            <Typography variant="footnote" color="gray" noMargin>
              Primary typeface for UI text, labels, and body content
            </Typography>
            <code style={styles.fontStack}>
              "Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
            </code>
          </div>
        </div>
        <div style={styles.fontCard}>
          <div style={styles.fontPreview}>
            <span style={{ ...styles.fontSample, fontFamily: '"SF Mono", Monaco, monospace' }}>Aa</span>
          </div>
          <div style={styles.fontInfo}>
            <Typography variant="content-label" noMargin>SF Mono</Typography>
            <Typography variant="footnote" color="gray" noMargin>
              Monospace font for code, tokens, and technical content
            </Typography>
            <code style={styles.fontStack}>
              "SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace
            </code>
          </div>
        </div>
      </section>

      {/* Type Scale Section */}
      <section style={styles.section}>
        <Typography variant="modal-title" noMargin style={{ marginBottom: 8 }}>Type Scale</Typography>
        <Typography variant="body-normal" color="gray" noMargin style={{ marginBottom: 24 }}>
          All typography variants with their specifications (size / weight / letter-spacing)
        </Typography>
        <div style={styles.typographyList}>
          {typographyVariants.map((item) => (
            <TypographyExample
              key={item.variant}
              variant={item.variant}
              label={item.label}
              specs={item.specs}
              sample={item.label}
            />
          ))}
        </div>
      </section>

      {/* Color Variants Section */}
      <section style={styles.section}>
        <Typography variant="modal-title" noMargin style={{ marginBottom: 8 }}>Colour Variants</Typography>
        <Typography variant="body-normal" color="gray" noMargin style={{ marginBottom: 24 }}>
          Semantic colour options for text hierarchy and meaning
        </Typography>
        <div style={styles.colorGrid}>
          {colorVariants.map((item) => (
            <div key={item.color} style={styles.colorCard}>
              <Typography variant="body-normal" color={item.color as any} noMargin>
                {item.label}
              </Typography>
              <code style={styles.colorCode}>{item.hex}</code>
            </div>
          ))}
        </div>
      </section>

      {/* Usage Guidelines Section */}
      <section style={styles.section}>
        <Typography variant="modal-title" noMargin style={{ marginBottom: 16 }}>Usage Guidelines</Typography>
        <div style={styles.guidelinesGrid}>
          <div style={styles.guidelineCard}>
            <Typography variant="content-label" noMargin>Headlines</Typography>
            <Typography variant="footnote" color="gray" noMargin>
              Use headline-large for page headers, page-title for section headers
            </Typography>
          </div>
          <div style={styles.guidelineCard}>
            <Typography variant="content-label" noMargin>Body Text</Typography>
            <Typography variant="footnote" color="gray" noMargin>
              body-normal (14px) for most content, body-large (16px) for emphasis
            </Typography>
          </div>
          <div style={styles.guidelineCard}>
            <Typography variant="content-label" noMargin>Labels</Typography>
            <Typography variant="footnote" color="gray" noMargin>
              content-label for form labels, section-label for group headers
            </Typography>
          </div>
          <div style={styles.guidelineCard}>
            <Typography variant="content-label" noMargin>Supporting Text</Typography>
            <Typography variant="footnote" color="gray" noMargin>
              footnote for captions, overline for section dividers
            </Typography>
          </div>
        </div>
      </section>

      {/* Props Documentation */}
      <section style={styles.section}>
        <Typography variant="modal-title" noMargin style={{ marginBottom: 16 }}>Props</Typography>
        <div style={styles.propsTable}>
          <div style={styles.propsHeader}>
            <span style={styles.propsHeaderCell}>Prop</span>
            <span style={styles.propsHeaderCell}>Type</span>
            <span style={styles.propsHeaderCell}>Default</span>
            <span style={styles.propsHeaderCell}>Description</span>
          </div>
          <div style={styles.propsRow}>
            <code style={styles.propsCell}>variant</code>
            <code style={styles.propsCell}>TypographyVariant</code>
            <span style={styles.propsCell}>—</span>
            <span style={styles.propsCell}>Typography variant (headline-large, page-title, body-normal, etc.)</span>
          </div>
          <div style={styles.propsRow}>
            <code style={styles.propsCell}>color</code>
            <code style={styles.propsCell}>'base' | 'gray' | 'accent' | 'success' | 'warning' | 'failure' | 'white'</code>
            <code style={styles.propsCell}>'base'</code>
            <span style={styles.propsCell}>Text color</span>
          </div>
          <div style={styles.propsRow}>
            <code style={styles.propsCell}>as</code>
            <code style={styles.propsCell}>ElementType</code>
            <span style={styles.propsCell}>—</span>
            <span style={styles.propsCell}>Override HTML tag</span>
          </div>
          <div style={styles.propsRow}>
            <code style={styles.propsCell}>noMargin</code>
            <code style={styles.propsCell}>boolean</code>
            <code style={styles.propsCell}>false</code>
            <span style={styles.propsCell}>Remove bottom margin</span>
          </div>
          <div style={styles.propsRow}>
            <code style={styles.propsCell}>ellipsis</code>
            <code style={styles.propsCell}>{'{ rows: number }'}</code>
            <span style={styles.propsCell}>—</span>
            <span style={styles.propsCell}>Truncate after N lines with ellipsis</span>
          </div>
          <div style={styles.propsRow}>
            <code style={styles.propsCell}>wrapContent</code>
            <code style={styles.propsCell}>boolean</code>
            <code style={styles.propsCell}>false</code>
            <span style={styles.propsCell}>Enable word wrapping</span>
          </div>
        </div>
      </section>

      {/* Interactive Examples */}
      <section style={styles.section}>
        <Typography variant="modal-title" noMargin style={{ marginBottom: 16 }}>Examples</Typography>
        <div style={styles.exampleCard}>
          <div style={styles.exampleColumn}>
            <Typography variant="headline-large">Headline Large (32px)</Typography>
            <Typography variant="page-title">Page Title (24px)</Typography>
            <Typography variant="modal-title">Modal Title (20px)</Typography>
            <Typography variant="section-label">Section Label (18px)</Typography>
            <Typography variant="content-label">Content Label (16px)</Typography>
            <Typography variant="body-large">Body Large (16px)</Typography>
            <Typography variant="body-normal">Body Normal (14px)</Typography>
            <Typography variant="footnote" color="gray">Footnote (12px)</Typography>
            <Typography variant="overline" color="gray-light">OVERLINE (12px)</Typography>
          </div>
          <div style={styles.exampleRow}>
            <Typography variant="body-normal" color="accent">Accent color</Typography>
            <Typography variant="body-normal" color="success">Success color</Typography>
            <Typography variant="body-normal" color="warning">Warning color</Typography>
            <Typography variant="body-normal" color="failure">Failure color</Typography>
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section style={styles.section}>
        <Typography variant="modal-title" noMargin style={{ marginBottom: 16 }}>Code Example</Typography>
        <div style={styles.codeBlock}>
          <pre style={styles.codeContent}>{`import { Typography } from '@radiant/components';

<Typography variant="page-title">Welcome to Radiant</Typography>
<Typography variant="body-normal" color="gray">
  A comprehensive design system for building consistent UIs.
</Typography>
<Typography variant="footnote" color="gray-light">
  Last updated: Today
</Typography>`}</pre>
        </div>
      </section>
    </div>
  );
};

export const TypographyPage: React.FC = () => {
  return (
    <TypographyPageErrorBoundary>
      <TypographyPageContent />
    </TypographyPageErrorBoundary>
  );
};

export default TypographyPage;
