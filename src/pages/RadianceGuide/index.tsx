import React, { useEffect, useRef, useState } from 'react';
import { SegmentedControl } from '@components/SegmentedControl';
import { Select } from '@components/Select';
import { Alert } from '@components/Alert';
import { Link } from '@components/Link';
import { Horizontal, Vertical } from '@components/Layout';
import { RadianceBackground } from '@/app-chrome/RadianceBackground/RadianceBackground';
import type { RadianceState, RadianceTemplate } from '@/app-chrome/RadianceBackground/RadianceBackground';
import { PreviewCard } from './PreviewCard';
import { CodeBlock, CodeLine } from './CodeBlock';
import styles from './RadianceGuide.module.css';

/**
 * Radiance guide at /radiant/radiance. Radiance is vendored from a private repo
 * and omitted from the public snapshot (scripts/public-strip.sh). Without the
 * files RadianceBackground draws nothing, so this page reads the manifest at run
 * time (never imports it) and says so when the renderer never loads.
 */

const SITE = 'https://radiance-language.vercel.app';
const VENDOR = `${import.meta.env.BASE_URL}vendor/radiance/`;

interface Manifest {
  radianceVersion?: string;
  source?: { commit?: string };
}

type Availability = 'checking' | 'available' | 'missing';

/** Polls for the renderer (RadianceBackground loads it) for a few seconds. */
function useRadianceAvailability(): Availability {
  const [availability, setAvailability] = useState<Availability>('checking');
  useEffect(() => {
    if (window.RadianceLanguageRenderer) {
      setAvailability('available');
      return undefined;
    }
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (window.RadianceLanguageRenderer) {
        setAvailability('available');
        window.clearInterval(timer);
      } else if (Date.now() - started > 4000) {
        setAvailability('missing');
        window.clearInterval(timer);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, []);
  return availability;
}

function useManifest(): Manifest | null {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`${VENDOR}manifest.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Manifest | null) => {
        if (!cancelled && data && data.radianceVersion) setManifest(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  return manifest;
}

// ── Product patterns ──────────────────────────────────────────────────────

const STATE_OPTIONS = [
  { id: 'idle', label: 'Idle' },
  { id: 'reasoning', label: 'Reasoning' },
  { id: 'answered', label: 'Answered' },
];

const STATE_NOTES: Record<RadianceState, string> = {
  idle: 'Rests along the top edge, drifting slowly. The default, and every new conversation.',
  reasoning: 'From send until the answer lands: brightens, breathes and drifts faster.',
  answered: '530ms after the answer lands, once per conversation: calms and retreats to the top.',
};

const StateControl: React.FC<{ value: RadianceState; onChange: (s: RadianceState) => void; label: string }> = ({
  value,
  onChange,
  label,
}) => (
  <SegmentedControl
    size="small"
    options={STATE_OPTIONS}
    value={value}
    onChange={(v) => onChange(v as RadianceState)}
    aria-label={label}
  />
);

const FIXED_NOTE = 'Fixed: no tuning. The pattern takes its name, the theme and, for SpotterX and Liveboard, the state.';

const ProductPatterns: React.FC = () => {
  const [spotterxState, setSpotterxState] = useState<RadianceState>('idle');
  const [liveboardState, setLiveboardState] = useState<RadianceState>('idle');

  return (
    <>
      <PreviewCard
        id="pattern-home"
        name="Home"
        path='pattern="home"'
        badge="Fixed"
        description="The Home page hero, Spotter home included. A subtle top wash behind the hero that fades into the page."
        stageLabel="Live preview"
        stageNote="Follows the app theme."
        preview={
          <div className={`${styles.stage} ${styles.stageHome}`}>
            <RadianceBackground pattern="home" heroHeight={200} />
          </div>
        }
        code='<RadianceBackground pattern="home" heroHeight={336} />'
        footnote={FIXED_NOTE}
      />

      <PreviewCard
        id="pattern-signup"
        name="Sign up"
        path='pattern="signup"'
        badge="Fixed"
        description="The brand pane on sign up, sign in, password reset and SSO screens. A prominent wash from the right."
        stageLabel="Live preview"
        stageNote="Follows the app theme."
        preview={
          <div className={`${styles.stage} ${styles.stageFill}`}>
            <RadianceBackground pattern="signup" />
          </div>
        }
        code='<RadianceBackground pattern="signup" />'
        footnote={FIXED_NOTE}
      />

      <PreviewCard
        id="pattern-spotterx"
        name="SpotterX"
        path='pattern="spotterx"'
        badge="Fixed"
        description="SpotterX, the full-page Spotter chat. In the product it is fixed to the top of the viewport behind the page; here it is held inside the card. Its state comes from the conversation."
        stageLabel={`State: ${spotterxState}`}
        stageNote={STATE_NOTES[spotterxState]}
        controls={<StateControl value={spotterxState} onChange={setSpotterxState} label="SpotterX state" />}
        preview={
          <div className={`${styles.stage} ${styles.stageContained}`} data-testid="spotterx-stage">
            <RadianceBackground pattern="spotterx" state={spotterxState} />
          </div>
        }
        code='<RadianceBackground pattern="spotterx" state={state} />'
        footnote={
          <>
            {FIXED_NOTE} In a prototype, <code>useRadianceState(conversationId, isResponding)</code> sets the state.
          </>
        }
      />

      <PreviewCard
        id="pattern-liveboard"
        name="Liveboard"
        path='pattern="liveboard"'
        badge="Fixed"
        description="A Liveboard with its Spotter panel. The field sits in the workspace under the top bar and follows the conversation in the panel."
        stageLabel={`State: ${liveboardState}`}
        stageNote={STATE_NOTES[liveboardState]}
        controls={<StateControl value={liveboardState} onChange={setLiveboardState} label="Liveboard state" />}
        preview={
          <div className={`${styles.stage} ${styles.stageWorkspace}`}>
            <RadianceBackground pattern="liveboard" state={liveboardState} />
          </div>
        }
        code='<RadianceBackground pattern="liveboard" state={state} />'
        footnote={FIXED_NOTE}
      />
    </>
  );
};

// ── Template builder ──────────────────────────────────────────────────────

const PLACEMENTS = [
  { id: 'top-wash', label: 'Top wash' },
  { id: 'bottom-wash', label: 'Bottom wash' },
  { id: 'left-wash', label: 'Left wash' },
  { id: 'right-wash', label: 'Right wash' },
  { id: 'neutral', label: 'Neutral' },
];

const TemplateBuilder: React.FC = () => {
  const [placement, setPlacement] = useState('top-wash');
  const [intensity, setIntensity] = useState('subtle');
  const [motion, setMotion] = useState('dynamic');
  const [speed, setSpeed] = useState('fast');

  // Static variants ignore speed (MOTION-3), so the name drops it.
  const name = (
    motion === 'static'
      ? `${placement}-${intensity}-static`
      : `${placement}-${intensity}-${motion}-${speed}`
  ) as RadianceTemplate;

  return (
    <PreviewCard
      id="template-builder"
      name="Template builder"
      path="<placement>-<intensity>-<motion>-<speed>"
      description="Pick the four factors and watch the preview. When it looks right, copy the prompt and give it to Claude in your project: it adds the template, sets the base to your background and checks the Radiance rules."
      stageLabel="Live preview"
      stageNote={name}
      preview={
        <>
          <div className={styles.builderControls}>
            <Vertical gap={4} align="start" className={styles.builderField}>
              <span className={styles.fieldLabel}>Placement</span>
              <Select
                aria-label="Placement"
                size="small"
                options={PLACEMENTS}
                value={placement}
                onChange={(v) => setPlacement(v)}
                fullWidth
              />
            </Vertical>
            <Vertical gap={4} align="start">
              <span className={styles.fieldLabel}>Intensity</span>
              <SegmentedControl
                size="small"
                aria-label="Intensity"
                options={[
                  { id: 'subtle', label: 'Subtle' },
                  { id: 'prominent', label: 'Prominent' },
                ]}
                value={intensity}
                onChange={setIntensity}
              />
            </Vertical>
            <Vertical gap={4} align="start">
              <span className={styles.fieldLabel}>Motion</span>
              <SegmentedControl
                size="small"
                aria-label="Motion"
                options={[
                  { id: 'dynamic', label: 'Dynamic' },
                  { id: 'static', label: 'Static' },
                ]}
                value={motion}
                onChange={setMotion}
              />
            </Vertical>
            <Vertical gap={4} align="start">
              <span className={styles.fieldLabel}>Speed</span>
              <SegmentedControl
                size="small"
                aria-label="Speed"
                options={[
                  { id: 'fast', label: 'Fast' },
                  { id: 'slow', label: 'Slow' },
                ]}
                value={speed}
                onChange={setSpeed}
                disabled={motion === 'static'}
              />
            </Vertical>
          </div>
          <div className={`${styles.stage} ${styles.stageFill}`}>
            {/* Remount on a new name so the renderer builds a fresh surface. */}
            <RadianceBackground key={name} pattern={name} />
          </div>
        </>
      }
      prompt={`Add the Radiance template ${name} behind the main area of my prototype.`}
      footnote="Speed has no effect on a static template, so a static name drops it. Prominent belongs on covers and heroes, never behind dense content (INT-2)."
    />
  );
};

// ── Rules ─────────────────────────────────────────────────────────────────

const DO_RULES: React.ReactNode[] = [
  <>Draw every surface with the renderer, through <code>RadianceBackground</code> (IMPL-1).</>,
  <>Use a product's own pattern on that product's screen, exactly as it ships (PRODUCT-1).</>,
  <>Set the base to the host's own opaque background colour. <code>RadianceBackground</code> defaults it to Base.</>,
  <>Set the SpotterX and Liveboard state from the conversation only, never from hover, scroll or a timer.</>,
  <>Keep at most three moving surfaces on screen at once; make the rest static.</>,
  <>Leave reduced motion to the renderer. It freezes every surface automatically.</>,
];

const DONT_RULES: React.ReactNode[] = [
  <>Hand-make a gradient, glow, blob or noise that looks like Radiance (IMPL-3).</>,
  <>Put CSS filters, blend modes or overlays on top of a surface.</>,
  <>Tune a product pattern: no prominence, speed, seed or base (PRODUCT-2).</>,
  <>Go past a template's four factors without a warning and a <code>RADIANCE-OVERRIDE</code> note.</>,
  <>Copy or edit the renderer or a product recipe in <code>public/vendor/radiance/</code>.</>,
  <>Use Radiance as a fill for buttons, cards, icons, badges or text. It is a background only.</>,
];

// ── Page ──────────────────────────────────────────────────────────────────

// Room the layout's "On this page" list needs to the right of this page (its 220px plus the content's 32px padding)
const RAIL_ROOM = 252;

const SECTIONS = [
  { id: 'templates', label: 'Template builder' },
  { id: 'patterns', label: 'Product patterns' },
  { id: 'rules', label: 'Rules' },
  { id: 'prototypes', label: 'In prototypes' },
];

/**
 * The pill bar leads. Beside the content the layout's shared "On this page" list takes over once the reader
 * scrolls; when the window has no room for it, the pill bar stays pinned instead.
 */
function useOnThisPage(pageRef: React.RefObject<HTMLElement | null>) {
  const [railLeft, setRailLeft] = useState<number | null>(null);
  useEffect(() => {
    const measure = () => {
      const page = pageRef.current;
      if (!page) return;
      const right = page.getBoundingClientRect().right;
      setRailLeft(window.innerWidth - right >= RAIL_ROOM ? right + 32 : null);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [pageRef]);
  return { railLeft };
}

export const RadianceGuide: React.FC = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const { railLeft } = useOnThisPage(pageRef);
  const availability = useRadianceAvailability();
  const manifest = useManifest();
  const commit = manifest?.source?.commit?.slice(0, 7);

  return (
    <div ref={pageRef} className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.hero}>
          <RadianceBackground pattern="home" heroHeight={220} />
          <div className={styles.heroContent}>
            <h1 className={styles.pageTitle}>Radiance</h1>
            <p className={styles.pageSubtitle}>
              ThoughtSpot's AI identity language: an animated gradient layer that sits behind AI surfaces, on top
              of Radiant. Only its renderer draws it.
            </p>
            <Horizontal gap={16} wrap align="center">
              <Link href={SITE} target="_blank" rel="noreferrer" external>
                Open the Radiance site
              </Link>
              {manifest && (
                <span className={styles.version}>
                  Radiance {manifest.radianceVersion}
                  {commit ? ` · commit ${commit}` : ''}
                </span>
              )}
            </Horizontal>
          </div>
        </div>

        {availability === 'missing' && (
          <div className={styles.notice}>
            <Alert
              status="info"
              variant="section-multiline"
              dismissible={false}
              message="Radiance files are not in this copy, so the previews stay empty. The guide still applies."
            />
          </div>
        )}

      </header>

      {/* Section links, pinned while scrolling; the template builder leads */}
      <nav className={`${styles.toc} ${railLeft === null ? styles.tocPinned : ''}`} aria-label="Sections">
        {SECTIONS.map((x) => <a key={x.id} href={`#${x.id}`}>{x.label}</a>)}
      </nav>


      <section id="templates" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Templates</h2>
          <p className={styles.sectionLead}>
            A product surface always uses its product pattern. Templates are for everything else: an AI welcome,
            onboarding, an agent's empty state. Five placements, each subtle or prominent, dynamic or static, fast
            or slow. With nothing else to go on, use <code>top-wash-subtle-dynamic-fast</code>.
          </p>
        </header>
        <TemplateBuilder />
      </section>

      <section id="patterns" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Product patterns</h2>
          <p className={styles.sectionLead}>
            ThoughtSpot's finished screens, each locked exactly as it ships. When a prototype is one of these
            screens, it uses that pattern, even if nobody asked for Radiance. See them all on the{' '}
            <Link href={`${SITE}/patterns/`} target="_blank" rel="noreferrer" external>
              pattern library
            </Link>
            .
          </p>
        </header>
        <ProductPatterns />
      </section>

      <section id="rules" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Rules</h2>
          <p className={styles.sectionLead}>
            A short version of Radiance's rules. The full set, with every rule id, is in{' '}
            <code>scripts/radiance/upstream/RULES.md</code> and on the{' '}
            <Link href={`${SITE}/how-to-use/`} target="_blank" rel="noreferrer" external>
              how to use
            </Link>{' '}
            page.
          </p>
        </header>
        <div className={styles.rulesGrid}>
          <div className={styles.rulesCard}>
            <h3 className={styles.rulesTitle}>Do</h3>
            <ul className={styles.rulesList}>
              {DO_RULES.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </div>
          <div className={styles.rulesCard}>
            <h3 className={styles.rulesTitle}>Don't</h3>
            <ul className={styles.rulesList}>
              {DONT_RULES.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="prototypes" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>In prototypes</h2>
          <p className={styles.sectionLead}>
            Radiance comes with RadiantPlay. Nothing to install and nothing to copy.
          </p>
        </header>

        <div className={styles.stepCard}>
          <h3 className={styles.stepTitle}>It happens automatically</h3>
          <p className={styles.stepText}>
            The <code>rp-radiance</code> skill applies the product pattern when a prototype is a Spotter home,
            SpotterX, a Liveboard with Spotter, or a sign up screen. For other AI surfaces,{' '}
            <code>/rp-new-prototype</code> asks once whether you want a template. Screens with no AI get nothing.
          </p>
          <CodeBlock
            title="In a prototype"
            code={`import { RadianceBackground, useRadianceState } from '@/app-chrome/RadianceBackground/RadianceBackground';

const state = useRadianceState(conversationId, isResponding); // idle, reasoning, answered
<RadianceBackground pattern="spotterx" state={state} />`}
          />
        </div>

        <div className={styles.stepCard}>
          <h3 className={styles.stepTitle}>Check a prototype</h3>
          <p className={styles.stepText}>
            Runs Radiance's own lint against its rules. It must report 0 errors.
          </p>
          <CodeLine code="npm run radiance:lint -- src/prototypes/<Name>" />
        </div>

        <div className={styles.stepCard}>
          <h3 className={styles.stepTitle}>It stays current</h3>
          <p className={styles.stepText}>
            RadiantPlay ships the Radiance files in <code>public/vendor/radiance/</code>.{' '}
            <code>/rp-sync-upstream</code> brings new versions to your fork. Maintainers pull a new version with{' '}
            <code>radiance:update</code>, and <code>radiance:check</code> fails if anyone edits the files.
          </p>
          <CodeBlock
            title="Maintainers"
            code={`npm run radiance:update   # pull the latest Radiance, write the manifest
npm run radiance:check    # the vendored files match the manifest`}
          />
        </div>
      </section>
    </div>
  );
};

export default RadianceGuide;
