import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Button, Typography } from '@/components';
import { CodeIcon } from './v5/components/CodeIcon';
import styles from './Slides.module.css';

/**
 * Onboarding slides (Vivek, 29 Oct), opened from the project home. For people new to the project:
 * the data flow in a nutshell, how AgentDB differs from a warehouse, the user, then the core workflows,
 * each drawn as a flow with every step marked by where it happens (AgentDB or an external tool).
 * Claude Code lanes removed (Vivek, 29 Oct). The happy path carries the main deck; the workflows sit in an
 * appendix at the end (Vivek, 29 Oct).
 */

type Where = 'agentdb' | 'tool' | 'claude';
interface Step {
  text: string;
  where: Where;
  /** Clicks the person makes for this step: an estimate, for the comparison. */
  clicks: number;
  /** Happens behind the scenes (over MCP): no screen of its own for the person. */
  bg?: boolean;
}
interface Lane {
  title: string;
  steps: Step[];
  draft?: boolean;
}
interface Workflow {
  n: number;
  name: string;
  job: string;
  lanes: Lane[];
  link: { label: string; to: string };
  /** A detail panel under the flow, e.g. what the query log holds. */
  detail?: { title: string; items: { label: string; text: string }[] };
  /** How the same job works from Claude Code, one or two lines (Vivek, 29 Oct). */
  claude?: string;
}

const PROTO = '/playground/AgentDBMVP';
/** The deployed prototype, for the demo slide (Vivek, 29 Oct). */
const LIVE = 'https://radiantplay-nine.vercel.app/playground/AgentDBMVP';
/** Loom recording of the workflow (Vivek, 29 Oct). */
const LOOM = 'https://www.loom.com/share/8508c6d8fedd4b0bbcd940192b588381';

const WORKFLOWS: Workflow[] = [
  {
    n: 1,
    name: 'Connect with the ETL tool',
    job: 'Once per tool: give the ETL tool a key it can load with.',
    link: { label: 'Open API keys', to: `${PROTO}?flow=etl` },
    lanes: [{ title: 'Steps', steps: [
      { text: 'Sign in via email code', where: 'agentdb', clicks: 3 },
      { text: 'Create an API key with load access', where: 'agentdb', clicks: 5 },
      { text: 'Copy the key, shown once', where: 'agentdb', clicks: 1 },
      { text: 'Save the key in the ETL tool', where: 'tool', clicks: 3 },
    ] }],
  },
  {
    n: 2,
    name: 'Load data',
    claude: 'Paste your DDL and say what to load: Claude Code creates the table over MCP and writes the load command or ETL settings for you.',
    job: 'Every table, every run: create the table, point the ETL tool at it, let it load. One table or many.',
    link: { label: 'Open Connect › Ingestion', to: `${PROTO}?flow=ingest` },
    lanes: [{ title: 'Steps', steps: [
      { text: 'Create table using SQL', where: 'agentdb', clicks: 3 },
      { text: 'Copy load instructions into ETL tool', where: 'agentdb', clicks: 5 },
      { text: 'Configure the load: schedule, formatting', where: 'tool', clicks: 6 },
      { text: 'Load runs', where: 'tool', clicks: 0 },
      { text: 'Rows land in AgentDB', where: 'agentdb', clicks: 0 },
    ] }],
  },
  {
    n: 3,
    name: 'Connect a target tool',
    job: 'Once per tool: connect ThoughtSpot, a BI tool, an app or an agent to read the data.',
    link: { label: 'Open Connect › Consumption', to: `${PROTO}?flow=bi` },
    lanes: [{ title: 'Steps', steps: [
      { text: 'Create an API key with query access', where: 'agentdb', clicks: 5 },
      { text: 'Consumption: copy the connection details', where: 'agentdb', clicks: 2 },
      { text: 'Add a connection in the target tool', where: 'tool', clicks: 4 },
      { text: 'Select the tables to bring in', where: 'tool', clicks: 4 },
    ] }],
  },
  {
    n: 4,
    name: 'Query runs on data',
    claude: 'Ask in plain words: Claude Code writes the SQL, runs it on AgentDB over MCP and brings the answer back. It is logged like any other query.',
    job: 'People, apps and agents ask; AgentDB answers and records every query.',
    link: { label: 'Open Queries', to: `${PROTO}?flow=queries` },
    detail: {
      title: 'What the query log holds',
      items: [
        { label: 'Who', text: 'The API key or person that ran it' },
        { label: 'From where', text: 'The tool or app, and its IP' },
        { label: 'When', text: 'Start time, and how long it took' },
        { label: 'What', text: 'The SQL, and which database' },
        { label: 'Outcome', text: 'Successful or failed, with the error' },
        { label: 'Cost', text: 'Rows returned, rows and data scanned' },
      ],
    },
    lanes: [{ title: 'Steps', steps: [
      { text: 'Users run a query from the tool', where: 'tool', clicks: 1 },
      { text: 'The query runs in AgentDB', where: 'agentdb', clicks: 0 },
      { text: 'It is logged in Queries', where: 'agentdb', clicks: 0 },
      { text: 'Status: successful or failed', where: 'agentdb', clicks: 0 },
      { text: 'Results back in the tool', where: 'tool', clicks: 0 },
    ] }],
  },
  {
    n: 5,
    name: 'Monitoring',
    claude: 'Ask “how are queries doing today?”: Claude Code reads the query log over MCP and sums up volume, speed and failures.',
    job: 'Check how queries are doing: volume, speed, failures.',
    link: { label: 'Open Queries', to: `${PROTO}?flow=queries` },
    lanes: [{ title: 'Steps', steps: [
      { text: 'Go to Queries', where: 'agentdb', clicks: 1 },
      { text: 'See stats of queries', where: 'agentdb', clicks: 0 },
    ] }],
  },
  {
    n: 6,
    name: 'Debugging',
    claude: 'Ask “why did this query fail?”: Claude Code finds it in the query log, reruns it and explains the cause.',
    job: 'A query got stuck or failed: someone hears about it, and the user looks it up in AgentDB.',
    link: { label: 'Open Queries', to: `${PROTO}?flow=queries` },
    lanes: [{ title: 'Steps', steps: [
      { text: 'Query running in the tool', where: 'tool', clicks: 0 },
      { text: 'Query status stuck or failed', where: 'agentdb', clicks: 0 },
      { text: 'User gets notified (pipeline based monitoring or consumer raises an issue)', where: 'tool', clicks: 0 },
      { text: 'User comes to Queries', where: 'agentdb', clicks: 1 },
      { text: 'Checks query log details', where: 'agentdb', clicks: 2 },
    ] }],
  },
];

const WHERE_LABEL: Record<Where, string> = { agentdb: 'In AgentDB', tool: 'In an external tool', claude: 'In Claude Code' };

const Legend: React.FC<{ show: Where[] }> = ({ show }) => (
  <div className={styles.legend}>
    {show.map((w) => (
      <span key={w} className={styles.legendItem}>
        <span className={`${styles.swatch} ${styles[w]}`} aria-hidden />
        {WHERE_LABEL[w]}
      </span>
    ))}
  </div>
);

/** A workflow as a flow: steps in order, arrows between, each step coloured by where it happens. */
const Flow: React.FC<{ lane: Lane }> = ({ lane }) => (
  <div className={styles.lane}>
    <div className={styles.laneHead}>
      {lane.title !== 'Steps' && <span className={styles.laneTitle}>{lane.title}</span>}
      {lane.draft && <span className={styles.draft}>Draft · to match the recorded demo</span>}
      <span className={styles.laneCount}>{lane.steps.length} steps</span>
    </div>
    <ol className={styles.flow}>
      {lane.steps.map((s, i) => (
        <li key={i} className={styles.flowItem}>
          <span className={`${styles.step} ${styles[s.where]} `} title={WHERE_LABEL[s.where]}>
            <span className={styles.stepN}>{i + 1}</span>
            {s.text}
          </span>
          {i < lane.steps.length - 1 && <span className={styles.arrow} aria-hidden>→</span>}
        </li>
      ))}
    </ol>
  </div>
);

/**
 * How AgentDB (Apache Doris, the engine behind VeloDB) differs from a cloud warehouse like Snowflake: the
 * technology, and the value it brings (Vivek, 29 Oct: no interface rows, only engine differences).
 */
const DIFFERENT: { topic: string; warehouse: string; agentdb: string; value: string }[] = [
  { topic: 'Built for', warehouse: 'Storing and transforming everything: large batch scans', agentdb: 'Serving it: many small, fast queries at once', value: 'Each does its own job; AgentDB is the fast layer in front' },
  { topic: 'Compute', warehouse: 'Virtual warehouses that suspend and resume; billed per second, one-minute minimum', agentdb: 'An always-on engine that runs queries in parallel (MPP), with data cached next to compute', value: 'No cold starts: steady sub-second answers' },
  { topic: 'Concurrency', warehouse: 'A warehouse runs about eight queries at a time by default; more users need more clusters', agentdb: 'Built for high concurrency on one cluster', value: 'Dashboards and agents scale without cost spikes' },
  { topic: 'Indexes', warehouse: 'Partition pruning; search optimisation is a paid add-on', agentdb: 'Sort-key, bloom-filter and inverted (full-text) indexes built in', value: 'Filters and lookups in milliseconds' },
  { topic: 'Freshness', warehouse: 'Snowpipe micro-batches, about a minute behind', agentdb: 'Stream and Kafka loads visible in seconds; upserts by key', value: 'Real-time data for apps and agents' },
  { topic: 'Pre-aggregation', warehouse: 'Materialised views on Enterprise edition, refreshed in the background for credits', agentdb: 'Aggregate tables and materialised views updated as data loads; queries rewritten to use them', value: 'Heavy dashboards answered from small pre-summed tables' },
];

/** The happy path, end to end (Vivek, 29 Oct), grouped into phases that map to the workflow slides. */
const JOURNEY: { phase: string; workflows: string; steps: Step[]; note?: string }[] = [
  { phase: 'Connect in', workflows: '1', steps: [{ text: 'Connect AgentDB to ETL', where: 'tool', clicks: 0 }] },
  {
    phase: 'Load',
    workflows: '2',
    steps: [
      { text: 'Create table', where: 'agentdb', clicks: 0 },
      { text: 'Copy table load instructions from AgentDB to ETL', where: 'agentdb', clicks: 0 },
      { text: 'Configure run in ETL', where: 'tool', clicks: 0 },
      { text: 'Data lands in AgentDB', where: 'agentdb', clicks: 0 },
    ],
  },
  {
    phase: 'Connect out',
    workflows: '3',
    steps: [
      { text: 'Connect to a consumer tool like ThoughtSpot', where: 'tool', clicks: 0 },
      { text: 'Bring tables into ThoughtSpot', where: 'tool', clicks: 0 },
    ],
    note: 'Exactly how warehouses work',
  },
  {
    phase: 'Use',
    workflows: '4',
    steps: [
      { text: 'Run queries against tables', where: 'tool', clicks: 0 },
      { text: 'Query gets logged in AgentDB', where: 'agentdb', clicks: 0 },
    ],
  },
  { phase: 'Watch', workflows: '5 · 6', steps: [{ text: 'Use query log for monitoring and debugging', where: 'agentdb', clicks: 0 }] },
];

const STAGES = [
  { name: 'Apps', eg: 'Salesforce, Postgres, product events, files', jobs: [] as string[] },
  { name: 'ETL', eg: 'SeaTunnel, Airflow, Kafka Connect, Flink', jobs: ['Transforming data', 'Load data'] },
  { name: 'Warehouses / Databases', eg: 'Snowflake, Databricks, AgentDB', jobs: ['Data querying', 'Debugging'], ours: true },
  { name: 'Consumption', eg: 'ThoughtSpot, Tableau, apps, agents', jobs: ['Data and semantic modeling', 'Reporting and agents'] },
];

export const Slides: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [i, setI] = useState(0);
  const slides: { id: string; render: () => React.ReactNode }[] = [
    {
      id: 'cover',
      render: () => (
        <div className={styles.cover}>
          <span className={styles.overline}>ThoughtSpot · AgentDB</span>
          <h1 className={styles.coverTitle}>AgentDB</h1>
          <p className={styles.coverSub}>The data flow in a nutshell, and the workflows at the core of the product.</p>
          <span className={styles.coverMeta}>Onboarding · October 2026</span>
        </div>
      ),
    },
    {
      id: 'flow',
      render: () => (
        <>
          <header className={styles.head}>
            <span className={styles.overline}>01 · The space</span>
            <h2 className={styles.title}>Data flow in a nutshell</h2>
          </header>
          <div className={styles.stages}>
            {STAGES.map((s, k) => (
              <React.Fragment key={s.name}>
                <div className={`${styles.stage} ${s.ours ? styles.stageOurs : ''}`}>
                  {s.ours && <span className={styles.oursTag}>AgentDB lives here</span>}
                  <span className={styles.stageName}>{s.name}</span>
                  <span className={styles.stageEg}>{s.eg}</span>
                  {s.jobs.length > 0 && (
                    <ul className={styles.jobs}>
                      {s.jobs.map((j) => (
                        <li key={j}>{j}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {k < STAGES.length - 1 && <span className={styles.stageArrow} aria-hidden>→</span>}
              </React.Fragment>
            ))}
          </div>
          <div className={styles.across}>
            <span className={styles.acrossLabel}>Across all of it</span>
            <span>Monitor reliability and performance: tool reporting and the reporting pipeline</span>
          </div>
        </>
      ),
    },
    {
      id: 'different',
      render: () => (
        <>
          <header className={styles.head}>
            <span className={styles.overline}>02 · The difference</span>
            <h2 className={styles.title}>How it differs from a normal data warehouse</h2>
            <p className={styles.job}>Snowflake versus AgentDB, which runs on Apache Doris, the engine behind VeloDB.</p>
          </header>
          <div className={styles.diff}>
            <span className={styles.diffHead} />
            <span className={styles.diffHead}>Snowflake · cloud warehouse</span>
            <span className={`${styles.diffHead} ${styles.diffHeadOurs}`}>AgentDB · Apache Doris</span>
            <span className={`${styles.diffHead} ${styles.diffHeadOurs}`}>Value</span>
            {DIFFERENT.map((d) => (
              <React.Fragment key={d.topic}>
                <span className={styles.diffTopic}>{d.topic}</span>
                <span className={styles.diffThem}>{d.warehouse}</span>
                <span className={styles.diffUs}>{d.agentdb}</span>
                <span className={styles.diffValue}>{d.value}</span>
              </React.Fragment>
            ))}
          </div>
        </>
      ),
    },
    {
      id: 'user',
      render: () => (
        <>
          <header className={styles.head}>
            <span className={styles.overline}>03 · The user</span>
            <h2 className={styles.title}>Who it is for, and what they want</h2>
          </header>
          <div className={styles.persona}>
            <div className={styles.personaWho}>
              <span className={styles.personaName}>The data engineer</span>
              <span className={styles.personaLine}>Owns the pipelines that bring company data in, and the tables it lands in. Works in SQL, a terminal and an ETL tool; more and more, with an AI coding agent beside them.</span>
            </div>
            <div className={styles.goals}>
              <span className={styles.acrossLabel}>Their goals</span>
              <ol className={styles.goalList}>
                <li>Get data in fast and trust that it landed</li>
                <li>Give tools, apps and agents a fast place to query</li>
                <li>Find out quickly why a query failed or looks wrong</li>
                <li>Do it from where they already work, in code, not through forms</li>
              </ol>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'journey',
      render: () => (
        <>
          <header className={styles.head}>
            <span className={styles.overline}>04 · The journey</span>
            <h2 className={styles.title}>The happy path, end to end</h2>
          </header>
          <div className={styles.journey}>
            {JOURNEY.map((p, k) => (
              <React.Fragment key={p.phase}>
                <div className={styles.phase}>
                  <div className={styles.phaseHead}>
                    <span className={styles.phaseName}>{p.phase}</span>
                  </div>
                  <div className={styles.phaseSteps}>
                    {p.steps.map((st) => (
                      <span key={st.text} className={`${styles.step} ${styles[st.where]}`} title={WHERE_LABEL[st.where]}>
                        {st.text}
                      </span>
                    ))}
                  </div>
                  {p.note && <span className={styles.phaseNote}>{p.note}</span>}
                </div>
                {k < JOURNEY.length - 1 && <span className={styles.phaseArrow} aria-hidden>→</span>}
              </React.Fragment>
            ))}
          </div>
          <Legend show={['agentdb', 'tool']} />
          <div className={styles.claudeNote}>
            <span className={styles.claudeIcon} aria-hidden>
              <CodeIcon size="l" />
            </span>
            <span className={styles.claudeLabel}>From Claude Code</span>
            <span className={styles.claudeText}>
              Most of these users operate from Claude Code or their coding agent. If we support coding agents, all the steps can be done from there: all logs can be pulled there, and people can watch and debug across the pipeline from there.
            </span>
          </div>
        </>
      ),
    },
    {
      id: 'demo',
      render: () => (
        <div className={styles.cover}>
          <span className={styles.overline}>05 · Demo</span>
          <h1 className={styles.demoTitle}>See it in the prototype</h1>
          <div className={styles.demoActions}>
            <a href={LIVE} target="_blank" rel="noreferrer" className={styles.demoLink}>
              Open the prototype ↗
            </a>
            <a href="/agentdb-mvp/demo-runsheet.html" target="_blank" rel="noreferrer" className={styles.demoLinkSecondary}>
              Demo run sheet ↗
            </a>
            <a href={LOOM} target="_blank" rel="noreferrer" className={styles.demoLinkSecondary}>
              Watch the recording ↗
            </a>
          </div>
          <span className={styles.demoUrl}>{LIVE}</span>
        </div>
      ),
    },
    {
      id: 'appendix',
      render: () => (
        <div className={styles.cover}>
          <h1 className={styles.demoTitle}>Appendix</h1>
        </div>
      ),
    },
    {
      id: 'workflows',
      render: () => (
        <>
          <header className={styles.head}>
            <span className={styles.overline}>Appendix</span>
            <h2 className={styles.title}>The workflows in detail</h2>
            <p className={styles.job}>The happy path, broken into the six workflows behind it.</p>
          </header>
          <div className={styles.cards}>
            {WORKFLOWS.map((w) => (
              <div key={w.n} className={styles.card}>
                <span className={styles.cardN}>{String(w.n).padStart(2, '0')}</span>
                <span className={styles.cardName}>{w.name}</span>
                <span className={styles.cardJob}>{w.job}</span>
              </div>
            ))}
          </div>
          <Legend show={['agentdb', 'tool']} />
        </>
      ),
    },
    ...WORKFLOWS.map((w) => ({
      id: `w${w.n}`,
      render: () => (
        <>
          <header className={styles.head}>
            <span className={styles.overline}>{`Appendix · Workflow ${w.n}`}</span>
            <h2 className={styles.title}>{w.name}</h2>
            <p className={styles.job}>{w.job}</p>
          </header>
          <div className={styles.lanes}>
            {w.lanes.map((l) => (
              <Flow key={l.title} lane={l} />
            ))}
          </div>
          {w.detail && (
            <div className={styles.detail}>
              <span className={styles.acrossLabel}>{w.detail.title}</span>
              <div className={styles.detailGrid}>
                {w.detail.items.map((d) => (
                  <div key={d.label} className={styles.detailItem}>
                    <span className={styles.detailLabel}>{d.label}</span>
                    <span>{d.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {w.claude && (
            <div className={styles.claudeNote}>
              <span className={styles.claudeIcon} aria-hidden>
                <CodeIcon size="l" />
              </span>
              <span className={styles.claudeLabel}>From Claude Code</span>
              <span className={styles.claudeText}>{w.claude}</span>
            </div>
          )}
          <div className={styles.foot}>
            <Legend show={['agentdb', 'tool']} />
            <RouterLink to={w.link.to} className={styles.tryLink}>
              {w.link.label} ↗
            </RouterLink>
          </div>
        </>
      ),
    })),
  ];

  const go = useCallback((d: number) => setI((x) => Math.min(slides.length - 1, Math.max(0, x + d))), [slides.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') go(1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  return (
    <div className={styles.deck} role="dialog" aria-label="AgentDB slides">
      <div className={styles.slide}>{slides[i].render()}</div>
      <div className={styles.controls}>
        <Typography variant="footnote" color="gray-light" noMargin>
          {`${i + 1} / ${slides.length}`}
        </Typography>
        <div className={styles.dots}>
          {slides.map((s, k) => (
            <button key={s.id} type="button" className={`${styles.dot} ${k === i ? styles.dotOn : ''}`} aria-label={`Slide ${k + 1}`} onClick={() => setI(k)} />
          ))}
        </div>
        <div className={styles.ctrlButtons}>
          <Button variant="tertiary" size="small" iconOnly icon="chevron-left" aria-label="Previous slide" onClick={() => go(-1)} disabled={i === 0}>
            Previous
          </Button>
          <Button variant="tertiary" size="small" iconOnly icon="chevron-right" aria-label="Next slide" onClick={() => go(1)} disabled={i === slides.length - 1}>
            Next
          </Button>
          <Button variant="tertiary" size="small" iconOnly icon="cross" aria-label="Close slides" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
