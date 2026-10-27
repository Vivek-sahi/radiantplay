import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Button, Horizontal, Link, Table, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import styles from './Home.module.css';
import { DocsShell } from './docs/DocsShell';
import { DemoScript } from './Demo';

/**
 * AgentDB MVP · project home (Vivek, 19 Oct): the landing for the project. What it needs, where
 * each piece lives, and links to all of it. The design pages are published beside the prototype
 * under /agentdb-mvp/; their source of truth is ~/agentdb-data-store/, copied on change.
 */

const PROTOTYPE = '/playground/AgentDBMVP';
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
    { label: 'Sign up / sign in', children: [{ label: 'SOC 2: email, one-time code, password' }] },
    {
      label: 'Data',
      children: [
        { label: 'Metrics' },
        { label: 'Database', children: [{ label: 'Tables' }, { label: 'Views' }, { label: 'Materialised views' }] },
      ],
    },
    { label: 'SQL', children: [{ label: 'Create table' }, { label: 'Query existing table' }, { label: 'Modify table' }] },
    {
      label: 'Queries',
      children: [
        { label: 'Metrics' },
        { label: 'Filter', children: [{ label: 'Status' }, { label: 'Type' }] },
        { label: 'Queries table' },
      ],
    },
    { label: 'Connect', children: [{ label: 'Type of connection', children: [{ label: 'Details' }] }] },
    { label: 'Access', children: [{ label: 'Users' }, { label: 'Service accounts' }] },
    { label: 'API keys', children: [{ label: 'Keys' }] },
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
  { date: '9 Oct', decision: 'No source identification. Query and ingest identities. HTTP stream load with the full address and curl.' },
  { date: '14 Oct', decision: 'Sign-in is email, one-time code, password. No SSO.' },
  { date: '14 Oct', decision: 'No create-table form. The SQL editor is the only way to create or change anything.' },
  { date: '14 Oct', decision: 'Catalog follows Databricks: tree on the left, the object on the right.' },
  { date: '14 Oct', decision: 'Three fixed roles: Viewer, Editor, Admin.' },
  { date: '14 Oct', decision: 'API keys on their own page. Service accounts under Access.' },
  { date: '14 Oct', decision: 'Queries is one list of every type, read, write and load.' },
  { date: '14 Oct', decision: 'Connect is instructions only. ThoughtSpot gets no special treatment.' },
  { date: '15 Oct', decision: 'No header. The product\'s light sidebar, the signed-in person at its foot.' },
  { date: '15 Oct', decision: 'No account above the databases. Data lands on the first one.' },
  { date: '15 Oct', decision: 'Data metrics: storage used, tables, queries. No limit, no loads, no alert.' },
  { date: '15 Oct', decision: 'Plain everywhere; a code font only in the SQL editor.' },
  { date: '19 Oct', decision: 'Clusters hold databases. Customers are given one or more, in the backend, and never create one.' },
  { date: '19 Oct', decision: 'Keep the 14 Oct shape: API keys on their own page, service accounts under Access, Load data inside Connect.' },
  { date: '20 Oct', decision: 'No Delete database in the console. Allocating and removing databases is a backend action.' },
  { date: '20 Oct', decision: 'Connect keeps four tabs: BI tools, Apps, Agents, Load data. Each has its own instructions.' },
];

const CHANGES: { date: string; version: string; what: string }[] = [
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

/** The happy journey, from Vivek's sketch of 19 Oct. Each opens the prototype at the flow's first screen. */
const FLOWS: { id: string; name: string; starts: string; open?: string }[] = [
  { id: 'login', name: 'Sign in for the first time', starts: 'Sign in, empty workspace' },
  { id: 'etl', name: 'Connect an ETL tool: create an API key', starts: 'API keys, empty workspace', open: 'ETL through API keys, consumers through Connect? Today Connect also carries Load data.' },
  { id: 'create-table', name: 'Create a table', starts: 'SQL, empty workspace', open: 'Is running a CREATE TABLE statement enough, or also a Create table button? Today: the statement only (Harviish, 14 Oct).' },
  { id: 'view-table', name: 'See the data land', starts: 'Data, filled workspace' },
  { id: 'query-table', name: 'Query a table', starts: 'SQL, filled workspace' },
  { id: 'bi', name: 'Connect a BI tool', starts: 'Connect, BI tools' },
  { id: 'invite', name: 'Invite a teammate', starts: 'Access, People' },
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

const AgentDBMVPHome: React.FC = () => (
  <DocsShell>
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

        <Section id="flows" title="Key flows" note="The happy journey in the order a new customer takes it. Each opens the prototype at the flow's first screen. The demo script walks the same order.">
          <Table compact hoverable={false} rowKey="id" data={FLOWS.map((f, i) => ({ ...f, n: String(i + 1) })) as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'n', label: '#' },
              { key: 'name', label: 'Flow', render: (v, r) => <Link href={`${PROTOTYPE}?flow=${String(r.id)}`}>{String(v)}</Link> },
              { key: 'starts', label: 'Starts at' },
              { key: 'open', label: 'Open question', render: (v) => (v ? String(v) : '') },
            ]} />
        </Section>

        <Section id="demo" title="Demo script" note="One customer, from the first sign-in to a teammate reading revenue in ThoughtSpot. Seven steps, about ten minutes. Run it in one tab, top to bottom; each step's link reopens the prototype there if you lose your place.">
          <DemoScript />
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

export default AgentDBMVPHome;
