import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Button, Horizontal, Link, Table, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import styles from './Home.module.css';
import { DocsShell } from './docs/DocsShell';
import { Slides } from './Slides';

/**
 * AgentDB MVP · project home (Vivek, 19 Oct): the landing for the project. What it needs, where
 * each piece lives, and links to all of it. The design pages are published beside the prototype
 * under /agentdb-mvp/; their source of truth is ~/agentdb-data-store/, copied on change.
 */

const PROTOTYPE = '/playground/AgentDBMVP';
/** Loom recording of the workflow (Vivek, 29 Oct). */
const LOOM = 'https://www.loom.com/share/8508c6d8fedd4b0bbcd940192b588381';
const REPO = 'https://github.com/Vivek-sahi/radiantplay/tree/prototype/data-studio/src/prototypes/AgentDBMVP';

/**
 * The IA as a left-to-right mind map (Vivek, 19 Oct). One tree: add detail by adding a child.
 * From Vivek's sketch of 19 Oct.
 */
interface MapNode {
  label: string;
  children?: MapNode[];
}
const IA: MapNode = {
  label: 'AgentDB',
  children: [
    { label: 'Sign in', children: [{ label: 'First time by invitation' }, { label: 'SOC 2: email, one-time code, password' }] },
    {
      label: 'Overview',
      children: [
        { label: 'Metrics', children: [{ label: 'Storage' }, { label: 'Tables' }, { label: 'Queries → View queries' }] },
        { label: 'Data objects', children: [{ label: 'Filter by database' }, { label: 'Search by name' }] },
        { label: 'Table page', children: [{ label: 'Columns' }, { label: 'Sample data' }, { label: 'Details' }, { label: 'Load instructions ↗' }] },
      ],
    },
    {
      label: 'SQL',
      children: [
        { label: 'Catalog', children: [{ label: 'Databases › tables › columns' }, { label: '▶ 100 rows' }] },
        { label: 'Recent', children: [{ label: 'Pinned' }, { label: 'Delete' }] },
        { label: 'Query tabs', children: [{ label: 'Run · Limit · Format' }, { label: 'Results' }] },
        { label: 'Agent' },
      ],
    },
    {
      label: 'Queries',
      children: [{ label: 'Metrics' }, { label: 'Filter', children: [{ label: 'Status' }, { label: 'Type' }] }, { label: 'Query log details' }],
    },
    {
      label: 'Connect',
      children: [
        { label: 'Ingestion', children: [{ label: 'One table or many' }, { label: 'Settings per ETL tool' }] },
        { label: 'Consumption', children: [{ label: 'BI tools, apps' }] },
        { label: 'Agents', children: [{ label: 'MCP' }] },
      ],
    },
    { label: 'API keys', children: [{ label: 'Query' }, { label: 'Query and load' }] },
    { label: 'Members', children: [{ label: 'Invite' }, { label: 'Role' }, { label: 'Remove' }] },
  ],
};

/** A node, then its children in a column to its right, joined by lines. Collapses to a count. */
const MapBranch: React.FC<{ node: MapNode; depth: number }> = ({ node, depth }) => {
  const [open, setOpen] = useState(true);
  const kids = node.children ?? [];
  const tone = depth === 0 ? styles.mmRoot : depth === 1 ? styles.mmPage : '';
  return (
    <div className={styles.mmNode}>
      <div className={`${styles.mmBox} ${tone}`}>
        <Typography variant={depth < 2 ? 'content-label-subhead' : 'body-normal'} color="base" noMargin>
          {node.label}
        </Typography>
        {kids.length > 0 && (
          <Button
            variant="tertiary"
            size="small"
            icon={open ? 'chevron-left' : 'chevron-right'}
            iconOnly
            aria-label={`${open ? 'Collapse' : 'Expand'} ${node.label}`}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Collapse' : 'Expand'}
          </Button>
        )}
        {!open && kids.length > 0 && (
          <Typography variant="footnote" color="gray-light" noMargin>
            {kids.length}
          </Typography>
        )}
      </div>
      {open && kids.length > 0 && (
        <div className={styles.mmKids}>
          {kids.map((k) => (
            <div key={k.label} className={styles.mmKid}>
              <MapBranch node={k} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** Each decision can point at its source (a Slack post, a doc). Hidden until sources are added. */
const DECISIONS: { date: string; decision: string; source?: string }[] = [
  { date: '7 Oct', decision: 'Minimum observability: the console shows only what the database knows.' },
  { date: '9 Oct', decision: 'No source identification. HTTP stream load with the full address.' },
  { date: '14 Oct', decision: 'Sign-in is email, one-time code, password. No SSO.' },
  { date: '14 Oct', decision: 'No create-table form. Tables are created and changed in SQL.' },
  { date: '14 Oct', decision: 'Three fixed roles: Viewer, Editor, Admin.' },
  { date: '14 Oct', decision: 'Queries is one list of every query, with status and type filters.' },
  { date: '14 Oct', decision: 'Connect is instructions only. ThoughtSpot gets no special treatment.' },
  { date: '15 Oct', decision: 'No account above the databases.' },
  { date: '19 Oct', decision: 'Clusters hold databases. Customers are given one or more, in the backend, and never create one.' },
  { date: '20 Oct', decision: 'No Delete database in the console. Allocating and removing databases is a backend action.' },
  { date: '26 Oct', decision: 'Data becomes Overview: one list of data objects, filtered by database and searched by name. The catalog moves to SQL.' },
  { date: '26 Oct', decision: 'Access becomes Members, people only. Service accounts merge into API keys: account level, Query or Query and load.' },
  { date: '26 Oct', decision: 'SQL is a workbench: catalog and Recent on the left, query tabs in the middle, the agent on the right. Queries save as you type; no Save.' },
  { date: '26 Oct', decision: 'Metrics as thin tiles; the Queries tile links to Queries.' },
  { date: '27 Oct', decision: 'Precision instrument is the look. Navigation is an icon rail that widens to show names.' },
  { date: '27 Oct', decision: 'Connect is Ingestion, Consumption, Agents. Load instructions live only in Ingestion, for one table or many; tables link there.' },
  { date: '29 Oct', decision: 'AgentDB has no observability of load runs: the ETL tool owns it.' },
];

const CHANGES: { date: string; version: string; what: string }[] = [
  { date: '29 Oct', version: 'Home', what: 'Onboarding slides (Slides button): data flow, how AgentDB differs from a warehouse, the user, the happy path, a demo slide, and the six workflows in an appendix. Watch the demo (Loom) and the demo run sheet at the top. Home brought up to date: IA, key flows as the six workflows, design decisions; Demo script removed.' },
  { date: '27 Oct', version: 'v6', what: 'Copy of v5 for the demo and the agent-first additions. Live mode (gear › Demo, or ?live=1): the console reads the demo state file through agentdb serve and writes its own changes back, so Claude Code in the terminal and the browser see one database. Keys made in the console carry their secret so the terminal can sign in with them.' },
  { date: '27 Oct', version: 'v5', what: 'Precision instrument is the look (UI style picker hidden). Icon navigation only. SQL opens on one empty query.' },
  { date: '27 Oct', version: 'v5', what: 'Connect: Ingestion, Consumption, Agents (Apps removed), Ingestion first. Ingestion loads one table or many: key and tables dropdowns, ready settings for curl, shell, Python, SeaTunnel, Flink CDC, Kafka Connect and DataX, values for form-based tools. Table pages and create-table results link to it (Load instructions ↗). CREATE TABLE uses the only database when there is one.' },
  { date: '27 Oct', version: 'v5', what: 'Built from the team review: Overview (was Data) as one list of every table with database filter and search; Members (was Access), people only; service accounts merged into API keys with Query or Query and load access; the SQL workbench (catalog and Recent, query tabs that save as you type, code editor with autocomplete, results, agent panel); thin metric tiles; UI styles and the theme generator (brush button); navigation option 2, icons only.' },
  { date: '26 Oct', version: 'All', what: 'Shared with the team for review.' },
  { date: '20 Oct', version: 'Home', what: 'IA mind map follows Vivek\'s 20 Oct structure. Demo script and key flows put the API key before the table. Design document link and Resources removed.' },
  { date: '20 Oct', version: 'v4', what: 'Create-table result offers Open <table> and Load instructions. No Delete database. The grid icon for every object kind for now. Dialogs ending in a dropdown leave room for the list. The ETL flow starts in the empty workspace.' },
  { date: '19 Oct', version: 'All', what: 'Action menus were see-through: a missing colour in the shared token file. Added. This project home.' },
  { date: '15 Oct', version: 'v4', what: 'Data metrics trimmed to storage used, tables, queries. Status sentence removed.' },
  { date: '15 Oct', version: 'v4', what: 'Built: v3 with the visual design pass. White canvas, metrics in one line, status before type on Queries, the editor owns SQL, the thing to paste first on Connect.' },
  { date: '15 Oct', version: 'v3', what: 'Review: no header, the product\'s sidebar, no account level, Access as tabs, Plain type, one gear menu for prototype controls.' },
  { date: '14 Oct', version: 'v3', what: 'Built on v1: sign-in, catalog, one SQL editor, Queries, Connect, API keys, Access, empty and filled states.' },
  { date: '14 Oct', version: 'v2', what: 'The December list applied as written. Discarded the same day; parts reused in v3.' },
  { date: '7 Oct', version: 'v1', what: 'Reviewed with engineering and deployed. Frozen.' },
];

/** The workflows (Vivek, 29 Oct), in the order of the happy path. Each opens the prototype at its first screen. */
const FLOWS: { id: string; name: string; starts: string }[] = [
  { id: 'etl', name: 'Connect with the ETL tool', starts: 'API keys, empty workspace' },
  { id: 'create-table', name: 'Load data: create the table', starts: 'SQL, empty workspace' },
  { id: 'ingest', name: 'Load data: copy load instructions into the ETL tool', starts: 'Connect › Ingestion' },
  { id: 'bi', name: 'Connect a target tool', starts: 'Connect › Consumption' },
  { id: 'queries', name: 'Query runs on data', starts: 'Queries' },
  { id: 'queries', name: 'Monitoring: see stats of queries', starts: 'Queries' },
  { id: 'queries', name: 'Debugging: check query log details', starts: 'Queries' },
];


const ROW = [styles.r1, styles.r2, styles.r3, styles.r4];

const ext = { target: '_blank', rel: 'noreferrer' } as const;

const Section: React.FC<{ id: string; title: string; note?: React.ReactNode; children: React.ReactNode }> = ({ id, title, note, children }) => (
  <section id={id} className={styles.section}>
    <Vertical gap={spacing.D}>
      <Vertical gap={spacing.A}>
        <Typography variant="modal-title" color="base" noMargin>
          {title}
        </Typography>
        {note && (
          <Typography variant="body-normal" color="gray-light" noMargin>
            {note}
          </Typography>
        )}
      </Vertical>
      {children}
    </Vertical>
  </section>
);

const AgentDBMVPHome: React.FC = () => {
  // Onboarding slides open over the home (Vivek, 29 Oct).
  const [slides, setSlides] = useState(false);
  return (
  <DocsShell>
        {slides && <Slides onClose={() => setSlides(false)} />}
        <Vertical gap={spacing.D}>
          <Typography variant="overline" color="gray-light" noMargin>
            ThoughtSpot · AgentDB
          </Typography>
          <Typography variant="page-title" color="base" noMargin>
            AgentDB MVP
          </Typography>
          <Typography variant="body-large" color="gray-light" noMargin>
            The console for AgentDB, a managed analytical database. A customer is given one or more databases; their people load data in, create tables in SQL, connect tools, and see what ran. December scope.
          </Typography>
          <Horizontal gap={spacing.B} wrap>
            <RouterLink to={PROTOTYPE}>
              <Button variant="primary" icon="play">
                Open the prototype
              </Button>
            </RouterLink>
            <Button variant="secondary" icon="present" onClick={() => setSlides(true)}>
              Slides
            </Button>
            <a href={LOOM} {...ext}>
              <Button variant="secondary" icon="video">
                Watch the demo
              </Button>
            </a>
            <a href="/agentdb-mvp/demo-runsheet.html" {...ext}>
              <Button variant="secondary" icon="note">
                Demo run sheet
              </Button>
            </a>
            <a href={REPO} {...ext}>
              <Button variant="secondary" icon="folder">
                Repo
              </Button>
            </a>
          </Horizontal>
        </Vertical>

        <Section id="architecture" title="Architecture" note="AgentDB runs as clusters. A cluster holds many databases. Each customer is given one or more, allocated by us in the backend. A customer never creates a database and never sees the cluster or other customers.">
          <div className={styles.arch} role="img" aria-label="A cluster branches to its databases. One database goes to Customer 1. Two databases go to Customer 2. More databases are not yet given to anyone.">
            <div className={styles.cluster}>
              <div className={styles.box}>
                <Typography variant="content-label-subhead" color="base" noMargin>Cluster</Typography>
              </div>
            </div>
            {[
              { spine: styles.spineFirst, given: true, link: styles.straight },
              { spine: styles.spineMid, given: true, link: styles.bracketTop },
              { spine: styles.spineMid, given: true, link: styles.bracketBottom },
              { spine: styles.spineLast, given: false, link: '' },
            ].map((r, i) => (
              <React.Fragment key={i}>
                <div className={`${styles.link} ${styles.spine} ${r.spine} ${styles.c2} ${ROW[i]}`} />
                <div className={`${styles.box} ${styles.db} ${ROW[i]} ${r.given ? styles.boxGiven : styles.boxFree}`}>
                  <Typography variant="body-normal" color={r.given ? 'base' : 'gray-light'} noMargin>{r.given ? 'Database' : 'More databases'}</Typography>
                </div>
                {r.link && <div className={`${styles.link} ${r.link} ${styles.c4} ${ROW[i]}`} />}
              </React.Fragment>
            ))}
            <div className={`${styles.box} ${styles.cust1}`}>
              <Typography variant="content-label-subhead" color="base" noMargin>Customer 1</Typography>
            </div>
            <div className={`${styles.box} ${styles.cust2}`}>
              <Typography variant="content-label-subhead" color="base" noMargin>Customer 2</Typography>
            </div>
            <div className={styles.note}>
              <Typography variant="footnote" color="gray-light" noMargin>Not yet given. Allocation is backend only.</Typography>
            </div>
          </div>
        </Section>

        <Section id="ia" title="Information architecture" note="Vivek's IA of 20 Oct. Each node collapses; add detail by adding a child.">
          <div className={styles.map} role="tree" aria-label="Information architecture">
            <MapBranch node={IA} depth={0} />
          </div>
        </Section>

        <Section id="flows" title="Key flows" note="The workflows, in the order of the happy path. Each opens the prototype at its first screen.">
          <Table compact hoverable={false} rowKey="n" data={FLOWS.map((f, i) => ({ ...f, n: String(i + 1) })) as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'n', label: '#' },
              { key: 'name', label: 'Flow', render: (v, r) => <Link href={`${PROTOTYPE}?flow=${String(r.id)}`}>{String(v)}</Link> },
              { key: 'starts', label: 'Starts at' },
            ]} />
        </Section>


        <Section id="decisions" title="Design decisions" note="The rulings the build stands on. Oldest first.">
          <Table compact hoverable={false} rowKey="decision" data={DECISIONS as unknown as Record<string, unknown>[]}
            columns={[
              {
                key: 'decision',
                label: 'Decision',
                render: (v, r) => {
                  const src = (r as unknown as (typeof DECISIONS)[number]).source;
                  return src ? <Link href={src} {...ext}>{String(v)}</Link> : String(v);
                },
              },
              { key: 'date', label: 'Date', width: 'var(--spacing-24)', render: (v) => <span className={styles.nowrap}>{String(v)}</span> },
            ]} />
        </Section>

        <Section id="changes" title="Change log" note="Newest first.">
          <Table compact hoverable={false} rowKey="what" data={CHANGES as unknown as Record<string, unknown>[]}
            columns={[{ key: 'date', label: 'Date', render: (v) => <span className={styles.nowrap}>{String(v)}</span> }, { key: 'version', label: 'Version' }, { key: 'what', label: 'What changed' }]} />
        </Section>

  </DocsShell>
  );
};

export default AgentDBMVPHome;
