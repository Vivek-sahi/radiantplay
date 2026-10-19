import React, { useState } from 'react';
import { Button, Horizontal, Select, Tabs, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Database, DbObject, Identity, V3Page } from '../types';
import { ENDPOINT_HOST, SQL_PORT } from '../data';
import { PageHeader } from '../../components/primitives';
import { CodeBlock, CopyBlock, CopyField } from './CopyField';
import { LoadInstructions } from './LoadInstructions';
import styles from '../v4.module.css';

const MCP_URL = `https://${ENDPOINT_HOST}/mcp`;

/** Named alphabetically. ThoughtSpot is one of them. */
const BI_TOOLS = ['DBeaver', 'Looker', 'Power BI', 'Tableau', 'ThoughtSpot'];

const LANGS = [
  { id: 'python', label: 'Python' },
  { id: 'node', label: 'Node.js' },
  { id: 'java', label: 'Java' },
];

const snippet = (lang: string, user: string, database: string): string => {
  if (lang === 'node')
    return `import mysql from "mysql2/promise";

const conn = await mysql.createConnection({
  host: "${ENDPOINT_HOST}",
  port: ${SQL_PORT},
  user: "${user}",
  password: process.env.AGENTDB_PASSWORD,
  database: "${database}",
});
const [rows] = await conn.query("SELECT region, SUM(amount) FROM orders GROUP BY region");`;
  if (lang === 'java')
    return `String url = "jdbc:mysql://${ENDPOINT_HOST}:${SQL_PORT}/${database}";
Connection conn = DriverManager.getConnection(url, "${user}", System.getenv("AGENTDB_PASSWORD"));
ResultSet rs = conn.createStatement().executeQuery("SELECT region, SUM(amount) FROM orders GROUP BY region");`;
  return `import os
import mysql.connector

conn = mysql.connector.connect(
    host="${ENDPOINT_HOST}",
    port=${SQL_PORT},
    user="${user}",
    password=os.environ["AGENTDB_PASSWORD"],
    database="${database}",
)
cur = conn.cursor()
cur.execute("SELECT region, SUM(amount) FROM orders GROUP BY region")`;
};

const mcpConfig = (user: string): string => `{
  "mcpServers": {
    "agentdb": {
      "url": "${MCP_URL}",
      "headers": { "Authorization": "Basic <base64 of ${user}:password>" }
    }
  }
}`;

/**
 * Connect: how a tool gets in, and nothing else. One method picker, four methods. Nobody reads
 * this page; they copy from it and leave (principle 5): the thing to paste comes first, with the
 * page's one primary Copy; its inputs sit above it; its facts sit below, each with its own Copy.
 * Identities are chosen here, never listed; they live in Access and API keys.
 */
export const ConnectPage: React.FC<{
  databases: Database[];
  objects: DbObject[];
  identities: Identity[];
  onNavigate: (p: V3Page) => void;
  toast: (m: string) => void;
}> = ({ databases, objects, identities, onNavigate, toast }) => {
  const [method, setMethod] = useState('bi');
  const [account, setAccount] = useState('');
  const [database, setDatabase] = useState(databases[0]?.id ?? '');
  const [table, setTable] = useState('');
  const [lang, setLang] = useState('python');

  const accounts = identities.filter((i) => i.type === 'Query' && !i.revoked);
  const user = accounts.some((a) => a.name === account) ? account : accounts[0]?.name ?? '<service-account>';
  const tables = objects.filter((o) => o.database === database && o.kind === 'table');
  const tableName = tables.some((t) => t.name === table) ? table : tables[0]?.name ?? '';
  const copied = (l: string) => toast(`${l} copied`);
  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    toast(`${what} copied`);
  };

  const accountPicker = accounts.length ? (
    <Select label="Service account" options={accounts.map((a) => ({ id: a.name, label: a.name }))} value={user} onChange={(v) => setAccount(v)} fullWidth />
  ) : (
    <Horizontal gap={spacing.C} align="center" wrap>
      <Typography variant="body-normal" color="gray-light" noMargin>
        No service account yet.
      </Typography>
      <Button variant="secondary" size="small" onClick={() => onNavigate('access')}>
        Go to Access
      </Button>
    </Horizontal>
  );
  const databasePicker = <Select label="Database" options={databases.map((d) => ({ id: d.id, label: d.name }))} value={database} onChange={(v) => setDatabase(v)} fullWidth />;
  const facts = (
    <div className={styles.factGrid}>
      <CopyField label="Host" value={ENDPOINT_HOST} onCopied={copied} />
      <CopyField label="Port" value={SQL_PORT} onCopied={copied} />
      <CopyField label="Database" value={database} onCopied={copied} />
      <CopyField label="Username" value={user} onCopied={copied} />
    </div>
  );

  return (
    <Vertical gap={spacing.F}>
      <PageHeader title="Connect" />
      <Tabs
        tabs={[
          { id: 'bi', label: 'BI tools' },
          { id: 'apps', label: 'Apps' },
          { id: 'agents', label: 'Agents' },
          { id: 'load', label: 'Load data' },
        ]}
        activeTab={method}
        onTabChange={setMethod}
      />

      {method === 'bi' && (
        <Vertical gap={spacing.E}>
          <div className={styles.twoUp}>
            {accountPicker}
            {databasePicker}
          </div>
          <CopyBlock label="Connection string" value={`mysql://${user}@${ENDPOINT_HOST}:${SQL_PORT}/${database}`} onCopied={copied} />
          {facts}
          <Typography variant="footnote" color="gray-light" noMargin>
            Any MySQL-compatible tool: {BI_TOOLS.join(', ')}.
          </Typography>
        </Vertical>
      )}

      {method === 'apps' && (
        <Vertical gap={spacing.E}>
          <div className={styles.twoUp}>
            {accountPicker}
            {databasePicker}
          </div>
          <Vertical gap={spacing.B}>
            <Horizontal justify="space-between" align="center" className={styles.twoUp}>
              <div className={styles.runIn}>
                <Select size="small" options={LANGS} value={lang} onChange={(v) => setLang(v)} fullWidth aria-label="Language" />
              </div>
              <Button variant="primary" icon="copy" onClick={() => copy(snippet(lang, user, database), 'Sample')}>
                Copy sample
              </Button>
            </Horizontal>
            <CodeBlock>{snippet(lang, user, database)}</CodeBlock>
          </Vertical>
          {facts}
        </Vertical>
      )}

      {method === 'agents' && (
        <Vertical gap={spacing.E}>
          <div className={styles.twoUp}>{accountPicker}</div>
          <CopyBlock label="MCP server URL" value={MCP_URL} onCopied={copied} />
          <Vertical gap={spacing.B}>
            <Horizontal justify="space-between" align="center" className={styles.twoUp}>
              <Typography variant="content-label" color="base" noMargin>
                Agent config
              </Typography>
              <Button variant="secondary" size="small" icon="copy" onClick={() => copy(mcpConfig(user), 'Config')}>
                Copy config
              </Button>
            </Horizontal>
            <CodeBlock>{mcpConfig(user)}</CodeBlock>
          </Vertical>
        </Vertical>
      )}

      {method === 'load' && (
        <Vertical gap={spacing.E}>
          <div className={styles.twoUp}>
            {databasePicker}
            {tables.length ? (
              <Select label="Table" options={tables.map((t) => ({ id: t.name, label: t.name }))} value={tableName} onChange={(v) => setTable(v)} fullWidth />
            ) : (
              <Horizontal gap={spacing.C} align="center" wrap>
                <Typography variant="body-normal" color="gray-light" noMargin>
                  No tables in {database} yet.
                </Typography>
                <Button variant="secondary" size="small" onClick={() => onNavigate('sql')}>
                  Open SQL
                </Button>
              </Horizontal>
            )}
          </div>
          {tableName && <LoadInstructions database={database} table={tableName} identities={identities} toast={toast} onNeedKey={() => onNavigate('keys')} />}
        </Vertical>
      )}
    </Vertical>
  );
};
