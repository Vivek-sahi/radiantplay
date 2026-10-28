import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@components/Button';
import { Tabs } from '@components/Tabs';
import { LoadingIndicator } from '@components/LoadingIndicator';
import { SpecSheet, TokensSection } from './SpecSheet';
import { scanCss } from './tokenScan';
import type { SpecInfo } from './useSpecState';
import styles from './PrototypeSpec.module.css';

/**
 * The spec view of a prototype: /playground/<Name>?spec, opened with the
 * Prototype / Spec switch.
 *
 * The specs come from src/prototypes/<Name>/spec.tsx, written with the designer
 * through /rp-spec and approved by them. Each spec also gets "From the code":
 * the tokens the prototype's CSS Modules use and the hardcoded values left.
 *
 * ?spec=<id> opens one spec. The prototype itself is not rendered.
 */

// Lazy, so a prototype's CSS loads only when its spec view opens.
const CSS_SOURCES = import.meta.glob<string>('/src/prototypes/*/**/*.module.css', { query: '?raw', import: 'default' });

const folderOf = (key: string) => key.split('/')[3];

interface Props {
  projectId: string;
  projectName: string;
  info: SpecInfo;
}

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export const PrototypeSpec: React.FC<Props> = ({ projectId, projectName, info }) => {
  const [params, setParams] = useSearchParams();
  const [css, setCss] = useState<{ path: string; code: string }[] | null>(null);
  const specs = info.loading ? null : info.specs;

  useEffect(() => {
    let live = true;
    const cssKeys = Object.keys(CSS_SOURCES).filter((k) => folderOf(k) === projectId);
    Promise.all(cssKeys.map(async (k) => ({ path: k.slice(1), code: await CSS_SOURCES[k]() }))).then((c) => {
      if (live) setCss(c);
    });
    return () => { live = false; };
  }, [projectId]);

  // A live specimen can take focus as it mounts (an edit state, say) and scroll the
  // page down; open the spec at the top, with nothing focused
  useEffect(() => {
    if (!specs) return;
    const t = window.setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      window.scrollTo(0, 0);
    }, 0);
    return () => window.clearTimeout(t);
  }, [specs, params]);

  const scan = useMemo(() => scanCss((css ?? []).map((c) => c.code)), [css]);

  const requested = params.get('spec');
  const found = specs?.find((s) => s.id === requested) ?? specs?.[0];
  // The approval sets the status, so a spec can't call itself ready on its own
  const status = info.state === 'ready' ? 'ready' as const : info.state === 'changed' ? 'changed' as const : 'draft' as const;
  const active = found && { ...found, status };
  const { approval } = info;

  const banner =
    info.state === 'draft' ? (
      <div className={`${styles.banner} ${styles.bannerDraft}`} role="status">
        <strong>Draft, not approved.</strong> Only you see this, while npm run dev runs. Run{' '}
        <code className={styles.code}>/rp-spec {projectId}</code> to review and approve it.
      </div>
    ) : info.state === 'changed' ? (
      <div className={`${styles.banner} ${styles.bannerChanged}`} role="status">
        <strong>Changed since approval.</strong> {approval?.by ?? 'The designer'} approved this spec on{' '}
        {formatDate(approval?.on)}, and the prototype has changed since. Check with them before building from it.
      </div>
    ) : info.state === 'ready' ? (
      <div className={`${styles.banner} ${styles.bannerReady}`} role="status">
        <strong>Ready for build.</strong> Approved by {approval?.by ?? 'the designer'} on {formatDate(approval?.on)}.
      </div>
    ) : null;

  const select = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('spec', id);
    setParams(next, { replace: true });
  };

  const backToPrototype = () => {
    const next = new URLSearchParams(params);
    next.delete('spec');
    setParams(next);
  };

  const fromTheCode = (
    <section className={styles.fromCode} data-no-toc>
      <h2 className={styles.heading}>From the code</h2>
      <p className={styles.body}>
        Read from the prototype&rsquo;s files on every load, so it can&rsquo;t drift from what ships.
        For scaligent SCSS, run <code className={styles.code}>npm run handoff {projectId}</code>.
      </p>
      {css && css.length > 0 ? (
        <>
          <TokensSection scan={scan} id="code-tokens" title="Tokens in CSS Modules" />
          <p className={styles.muted}>
            {css.length} CSS Module{css.length === 1 ? '' : 's'}: {css.map((c) => <code key={c.path} className={styles.code}>{c.path}</code>)}
          </p>
        </>
      ) : (
        <p className={styles.muted}>
          No CSS Modules in this prototype yet. Inline styles can&rsquo;t be read here or exported; moving them to a
          <code className={styles.code}>.module.css</code> file is the first handoff step.
        </p>
      )}
    </section>
  );

  return (
    <div className={styles.page}>
      <div className={styles.bar}>
        <Button variant="tertiary" size="small" icon="arrow-left" onClick={backToPrototype}>
          Back to prototype
        </Button>
        <span className={styles.barTitle}>{projectName}: spec</span>
      </div>

      {specs === null ? (
        <div className={styles.loading}><LoadingIndicator /></div>
      ) : (
        <>
          {specs.length > 1 && (
            <div className={styles.tabs}>
              <Tabs tabs={specs.map((s) => ({ id: s.id, label: s.name }))} activeTab={active!.id} onTabChange={select} size="small" />
            </div>
          )}
          {banner}
          {active && info.state !== 'none' && (info.state !== 'draft' || import.meta.env.DEV) ? (
            <SpecSheet key={active.id} spec={active} extra={fromTheCode} />
          ) : (
            <article className={styles.empty}>
              <h1 className={styles.title}>{projectName}</h1>
              <p className={styles.body}>
                No approved spec yet. The designer writes one with Claude when the prototype is ready to hand off:{' '}
                <code className={styles.code}>/rp-spec {projectId}</code>.
              </p>
            </article>
          )}
        </>
      )}
    </div>
  );
};

export default PrototypeSpec;
