import React, { useMemo, useState } from 'react';
import { Table } from '@components/Table';
import type { TableColumn } from '@components/Table';
import { Button } from '@components/Button';
import { Icon } from '@components/icons';
import type { ComponentSpec } from './types';
import { scanCss, spacingLabel, spacingScss } from './tokenScan';
import type { TokenScan } from './tokenScan';
import styles from './SpecSheet.module.css';

/**
 * Renders a ComponentSpec as an engineering spec sheet: anatomy, states,
 * props, measurements, tokens, behaviour, keyboard, motion, files and source.
 * Sections with no data are left out. Shared app chrome: prototypes feed it
 * from their spec.tsx, component doc pages feed it from the registry.
 */

type Row = Record<string, React.ReactNode>;

const SpecTable: React.FC<{ columns: [key: string, label: string][]; rows: Row[] }> = ({ columns, rows }) => {
  const cols: TableColumn[] = columns.map(([key, label]) => ({
    key,
    label,
    render: (value) => (value ?? '') as React.ReactNode,
  }));
  return (
    <div className={styles.table}>
      <Table columns={cols} data={rows} rowKey={(_, i) => String(i)} bordered compact hoverable={false} />
    </div>
  );
};

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => <code className={styles.code}>{children}</code>;

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className={styles.section}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    {children}
  </section>
);

const STATUS_LABEL: Record<NonNullable<ComponentSpec['status']>, string> = {
  draft: 'Draft',
  'in-review': 'In review',
  ready: 'Ready for build',
  changed: 'Changed since approval',
};

const SourceBlock: React.FC<{ title: string; code: string }> = ({ title, code }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  };
  return (
    <div className={styles.source}>
      <div className={styles.sourceHead}>
        <Icon name="documentation" size="s" color="var(--rd-sys-color-content-secondary)" />
        <span className={styles.sourceTitle}>{title}</span>
        <span className={styles.muted}>{code.split('\n').length} lines</span>
        <span className={styles.spacer} />
        <Button variant="tertiary" size="small" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? 'Hide' : 'Show'}
        </Button>
        <Button variant="tertiary" size="small" icon={copied ? 'checkmark' : 'copy'} onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      {open && <pre className={styles.pre}><code>{code}</code></pre>}
    </div>
  );
};

/** Tokens table plus the hardcoded values engineering would otherwise reverse-map by hand. */
export const TokensSection: React.FC<{ scan: TokenScan; id?: string; title?: string }> = ({ scan, id = 'tokens', title = 'Tokens' }) => {
  if (!scan.tokens.length && !scan.rawColours.length && !scan.rawPx.length) return null;
  return (
    <Section id={id} title={title}>
      {scan.tokens.length > 0 && (
        <SpecTable
          columns={[['kind', 'Kind'], ['variable', 'CSS variable'], ['scss', 'scaligent SCSS'], ['uses', 'Uses']]}
          rows={scan.tokens.map((t) => ({
            kind: t.kind === 'colour'
              ? <span className={styles.kind}><span className={styles.swatch} style={{ background: `var(${t.variable})` }} />Colour</span>
              : t.kind.charAt(0).toUpperCase() + t.kind.slice(1),
            variable: <Code>{t.variable}</Code>,
            scss: t.scss ? <Code>{t.scss}</Code> : <span className={styles.muted}>No 1:1 name</span>,
            uses: t.uses,
          }))}
        />
      )}
      {(scan.rawColours.length > 0 || scan.rawPx.length > 0) && (
        <p className={styles.warn}>
          <Icon name="exclamation-point-circle" size="s" color="var(--rd-sys-color-content-warning)" />
          <span>
            Hardcoded values to swap for tokens before handoff:{' '}
            {[...scan.rawColours, ...scan.rawPx].map((v) => <Code key={v}>{v}</Code>)}
          </span>
        </p>
      )}
    </Section>
  );
};

export const SpecSheet: React.FC<{ spec: ComponentSpec; /** Rendered above the footer, e.g. "From the code". */ extra?: React.ReactNode }> = ({ spec, extra }) => {
  const cssScan = useMemo(
    () => scanCss((spec.sources ?? []).filter((s) => /\.s?css$/.test(s.title)).map((s) => s.code)),
    [spec.sources],
  );

  const toc: [string, string][] = [
    spec.preview || spec.anatomy?.length ? ['anatomy', 'Anatomy'] : null,
    spec.states?.length ? ['states', 'States'] : null,
    spec.usage ? ['usage', 'Usage'] : null,
    spec.props?.length ? ['props', 'Props'] : null,
    spec.measurements?.length ? ['measurements', 'Measurements'] : null,
    cssScan.tokens.length ? ['tokens', 'Tokens'] : null,
    spec.behaviour?.length ? ['behaviour', 'Behaviour'] : null,
    spec.keyboard?.length ? ['keyboard', 'Keyboard'] : null,
    spec.motion?.length ? ['motion', 'Motion'] : null,
    spec.files?.length ? ['files', 'Files'] : null,
    spec.sources?.length ? ['source', 'Source'] : null,
  ].filter((x): x is [string, string] => x !== null);

  return (
    <article className={styles.sheet} data-spec={spec.id}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{spec.name}</h1>
          {spec.status && <span className={`${styles.status} ${styles[`status-${spec.status}`]}`}>{STATUS_LABEL[spec.status]}</span>}
        </div>
        {spec.summary && <p className={styles.summary}>{spec.summary}</p>}
        {spec.tags?.length ? (
          <div className={styles.tags}>{spec.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}</div>
        ) : null}
        {toc.length > 2 && (
          <nav className={styles.toc} aria-label="Spec sections" data-no-toc>
            {toc.map(([id, label]) => <a key={id} href={`#${id}`} className={styles.tocLink}>{label}</a>)}
          </nav>
        )}
      </header>

      {(spec.preview || spec.anatomy?.length) && (
        <Section id="anatomy" title="Anatomy">
          <div className={styles.split}>
            {spec.preview && <div className={styles.specimen} data-demo>{spec.preview()}</div>}
            {spec.anatomy?.length ? (
              <ol className={styles.legend}>
                {spec.anatomy.map((part, i) => (
                  <li key={part.name} className={styles.legendItem}>
                    <span className={styles.legendNum}>{i + 1}</span>
                    <span>
                      <span className={styles.legendName}>{part.name}</span>
                      <span className={styles.legendDesc}>{part.description}</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        </Section>
      )}

      {spec.states?.length ? (
        <Section id="states" title="States">
          <div className={styles.stateGrid}>
            {spec.states.map((s) => (
              <figure key={s.label} className={styles.state}>
                <figcaption className={styles.stateLabel}>{s.label}</figcaption>
                <div className={styles.specimen} data-demo>{s.render()}</div>
                {s.note && <p className={styles.stateNote}>{s.note}</p>}
              </figure>
            ))}
          </div>
        </Section>
      ) : null}

      {spec.usage && (spec.usage.use?.length || spec.usage.avoid?.length) ? (
        <Section id="usage" title="Usage">
          <div className={styles.usage}>
            {[['Do', spec.usage.use, 'checkmark', 'var(--rd-sys-color-content-success)'] as const,
              ['Don’t', spec.usage.avoid, 'cross', 'var(--rd-sys-color-content-failure)'] as const]
              .filter(([, rules]) => rules?.length)
              .map(([label, rules, icon, color]) => (
                <div key={label}>
                  <h3 className={styles.subTitle}>{label}</h3>
                  <ul className={styles.rules}>
                    {rules!.map((r) => (
                      <li key={r} className={styles.rule}><Icon name={icon} size="s" color={color} /><span>{r}</span></li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </Section>
      ) : null}

      {spec.props?.length ? (
        <Section id="props" title="Props">
          <SpecTable
            columns={[['name', 'Prop'], ['type', 'Type'], ['default', 'Default'], ['description', 'Description']]}
            rows={spec.props.map((p) => ({
              name: <Code>{p.name}</Code>,
              type: <Code>{p.type}</Code>,
              default: p.default ? <Code>{p.default}</Code> : <span className={styles.muted}>None</span>,
              description: p.description,
            }))}
          />
        </Section>
      ) : null}

      {spec.measurements?.length ? (
        <Section id="measurements" title="Measurements">
          <SpecTable
            columns={[['element', 'Element'], ['value', 'Value'], ['scss', 'scaligent SCSS']]}
            rows={spec.measurements.map((m) => {
              const scss = m.px !== undefined ? spacingScss(m.px) : undefined;
              return {
                element: m.element,
                value: m.px !== undefined ? spacingLabel(m.px) + (m.value ? `, ${m.value}` : '') : m.value,
                scss: scss ? <Code>{scss}</Code> : <span className={styles.muted}>{m.px !== undefined ? 'Off the grid' : ''}</span>,
              };
            })}
          />
        </Section>
      ) : null}

      <TokensSection scan={cssScan} />

      {spec.behaviour?.length ? (
        <Section id="behaviour" title="Behaviour">
          <SpecTable columns={[['trigger', 'When'], ['result', 'Then']]} rows={spec.behaviour} />
        </Section>
      ) : null}

      {spec.keyboard?.length ? (
        <Section id="keyboard" title="Keyboard and accessibility">
          <SpecTable columns={[['key', 'Key'], ['does', 'Does']]} rows={spec.keyboard.map((k) => ({ key: <Code>{k.key}</Code>, does: k.does }))} />
        </Section>
      ) : null}

      {spec.motion?.length ? (
        <Section id="motion" title="Motion">
          <SpecTable columns={[['what', 'What'], ['property', 'Property'], ['timing', 'Duration and easing']]} rows={spec.motion} />
        </Section>
      ) : null}

      {spec.files?.length ? (
        <Section id="files" title="Files">
          <SpecTable columns={[['path', 'File'], ['holds', 'Holds']]} rows={spec.files.map((f) => ({ path: <Code>{f.path}</Code>, holds: f.holds }))} />
        </Section>
      ) : null}

      {spec.sources?.length ? (
        <Section id="source" title="Source">
          {spec.sources.map((s) => <SourceBlock key={s.title} title={s.title} code={s.code} />)}
        </Section>
      ) : null}

      {spec.notes?.length ? (
        <ul className={styles.notes}>{spec.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      ) : null}

      {extra}
    </article>
  );
};

export default SpecSheet;
