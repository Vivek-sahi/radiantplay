import React, { useState } from 'react';
import { Button, Horizontal, Link, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import styles from './Home.module.css';

/**
 * AgentDB MVP · demo script (Vivek, 19 Oct), shown as a section of the project home. The story, what to click, and every SQL statement,
 * in the order a new customer goes. Each step opens the prototype at its first screen; for a live
 * demo, walk it in one tab and use the step links only to recover.
 */

const PROTOTYPE = '/playground/AgentDBMVP';

interface Step {
  flow: string;
  title: string;
  say: string;
  doSteps: string[];
  sql?: { label: string; code: string }[];
}

const STEPS: Step[] = [
  {
    flow: 'login',
    title: 'Sign in for the first time',
    say: 'Acme Retail sells online and in stores. Priya runs their data team. ThoughtSpot has just given them AgentDB: one database, acme_retail, empty. She opens the invitation.',
    doSteps: [
      'Email is filled in. Continue.',
      'Enter any six digits as the code, for example 123456. Continue.',
      'Create a password of eight characters or more with a number, for example agentdb2026. Sign in.',
      'She lands on Data: one database, nothing in it, and the next step named.',
    ],
  },
  {
    flow: 'create-table',
    title: 'Create a table',
    say: 'The first job is somewhere for the orders to land. In AgentDB you create things the way every database does, by writing SQL. There is no form to learn.',
    doSteps: ['Open SQL. Paste the statement. Run.', 'The result confirms the table. Open Data: orders is in the tree, with its columns and no rows yet.'],
    sql: [
      {
        label: 'Create the orders table',
        code: `CREATE TABLE orders (
  order_id BIGINT,
  customer_id BIGINT,
  order_date DATE,
  region VARCHAR(64),
  channel VARCHAR(32),
  amount DECIMAL(12,2)
)
DUPLICATE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 8;`,
      },
    ],
  },
  {
    flow: 'etl',
    title: 'Connect the ETL tool: create an API key',
    say: "Acme's orders come out of Shopify through their own pipeline. The pipeline needs a key, and an address to send files to.",
    doSteps: [
      'Open API keys. Create API key, name it shopify-sync. The secret is shown once: copy it.',
      'Open Connect, Load data. Pick acme_retail and orders. The load address and the command are filled in for this table and this key.',
      'That command goes into the pipeline. Every night it sends the day\'s orders to that address.',
    ],
  },
  {
    flow: 'view-table',
    title: 'See the data land',
    say: 'Six weeks later. The pipelines run every night, and acme_retail holds orders, customers, tickets and app events. Priya checks the orders arrived.',
    doSteps: [
      'Open the gear at the bottom right. Workspace: Filled workspace.',
      'Data. The line on top: storage used, tables, queries in the last day.',
      'Open orders in the tree. Rows, size, last updated. Sample data shows the rows. History shows each night\'s load.',
    ],
  },
  {
    flow: 'query-table',
    title: 'Query it',
    say: 'Now the question the business asks: where did the revenue come from this month? The same editor that created the table answers it.',
    doSteps: ['Open in SQL from the orders page, or open SQL. Paste the query. Run.', 'Then save it as a view, so anyone can read it like a table.'],
    sql: [
      {
        label: 'Revenue by region, this month',
        code: `SELECT region, SUM(amount) AS revenue, COUNT(*) AS orders
FROM orders
WHERE order_date >= '2026-10-01'
GROUP BY region
ORDER BY revenue DESC;`,
      },
      {
        label: 'Save it as a view',
        code: `CREATE VIEW revenue_by_region AS
SELECT region, SUM(amount) AS revenue
FROM orders
GROUP BY region;`,
      },
    ],
  },
  {
    flow: 'bi',
    title: 'Connect a BI tool',
    say: 'Analysts live in ThoughtSpot. AgentDB speaks MySQL, so ThoughtSpot, or Tableau, or Power BI, connects the same way: five facts.',
    doSteps: [
      'Open Connect, BI tools. Service account thoughtspot, database acme_retail.',
      'Copy the connection string. Host, port, database and username sit below it. The password was shown once when the account was created.',
      'In ThoughtSpot, add a MySQL connection and paste them. The data stays in AgentDB; ThoughtSpot queries it live.',
    ],
  },
  {
    flow: 'invite',
    title: 'Invite a teammate',
    say: 'Sara on the analytics team needs to read the data, not change it.',
    doSteps: ['Open Access, People. Add person: Sara Lee, her email, role Viewer. Send invitation.', 'She gets the same sign-in email Priya did.'],
  },
];

const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => undefined);

const Code: React.FC<{ label: string; code: string }> = ({ label, code }) => {
  const [done, setDone] = useState(false);
  return (
    <Vertical gap={spacing.B}>
      <Horizontal justify="space-between" align="center">
        <Typography variant="content-label-subhead" color="base" noMargin>
          {label}
        </Typography>
        <Button
          variant="secondary"
          size="small"
          icon="copy"
          onClick={() => {
            copy(code);
            setDone(true);
            window.setTimeout(() => setDone(false), 1500);
          }}
        >
          {done ? 'Copied' : 'Copy SQL'}
        </Button>
      </Horizontal>
      <pre className={styles.code}>{code}</pre>
    </Vertical>
  );
};

/** The demo script as a section of the project home (Vivek, 19 Oct: on the same page). */
export const DemoScript: React.FC = () => (
  <Vertical gap={spacing.F}>
    <Horizontal gap={spacing.B} wrap>
      <a href={`${PROTOTYPE}?flow=login`}>
        <Button variant="primary" icon="play">
          Start the demo
        </Button>
      </a>
    </Horizontal>
    {STEPS.map((s, i) => (
      <div key={s.flow} id={`demo-${s.flow}`} className={styles.step}>
        <Typography variant="modal-title" color="gray-light" noMargin>
          {String(i + 1)}
        </Typography>
        <Vertical gap={spacing.D}>
          <Horizontal justify="space-between" align="center" gap={spacing.D} wrap>
            <Typography variant="content-label" color="base" noMargin>
              {s.title}
            </Typography>
            <Link href={`${PROTOTYPE}?flow=${s.flow}`}>Open at this step</Link>
          </Horizontal>
          <Typography variant="body-normal" color="base" noMargin>
            {s.say}
          </Typography>
          <Vertical gap={spacing.A}>
            {s.doSteps.map((x) => (
              <Typography key={x} variant="body-normal" color="gray-light" noMargin>
                {x}
              </Typography>
            ))}
          </Vertical>
          {s.sql?.map((q) => <Code key={q.label} label={q.label} code={q.code} />)}
        </Vertical>
      </div>
    ))}
  </Vertical>
);
