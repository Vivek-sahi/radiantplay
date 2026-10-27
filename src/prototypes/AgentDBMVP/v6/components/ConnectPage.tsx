import React, { useState } from 'react';
import { Button, Horizontal, Select, Tabs, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Database, DbObject, Identity, V3Page } from '../types';
import { ENDPOINT_HOST, SQL_PORT } from '../data';
import { PageHeader } from '../../components/primitives';
import { CodeBlock, CopyBlock, CopyField } from './CopyField';
import { LoadInstructions } from './LoadInstructions';
import styles from '../v6.module.css';

const MCP_URL = `https://${ENDPOINT_HOST}/mcp`;

/** Named alphabetically. ThoughtSpot is one of them. */
const BI_TOOLS = ['DBeaver', 'Looker', 'Power BI', 'Tableau', 'ThoughtSpot'];

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
  /** Arriving from a table or a create-table result: Ingestion opens with that table ticked (Vivek, 27 Oct). */
  ingestFor?: { database: string; table: string } | null;
  /** The tab to open on (the BI key flow opens Consumption). */
  initialTab?: string;
}> = ({ databases, objects, identities, onNavigate, toast, ingestFor, initialTab }) => {
  // Ingestion first, and open first (Vivek, 27 Oct).
  const [method, setMethod] = useState(initialTab ?? 'load');
  const [account, setAccount] = useState('');
  const [database, setDatabase] = useState(ingestFor?.database ?? databases[0]?.id ?? '');

  // Any API key can query: Query keys and Query and load keys alike (Vivek, 26 Oct).
  const accounts = identities.filter((i) => !i.revoked);
  const user = accounts.some((a) => a.name === account) ? account : accounts[0]?.name ?? '<api-key>';
  const tables = objects.filter((o) => o.database === database && o.kind === 'table');
  const copied = (l: string) => toast(`${l} copied`);
  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    toast(`${what} copied`);
  };

  const accountPicker = accounts.length ? (
    <Select label="API key" options={accounts.map((a) => ({ id: a.name, label: a.name }))} value={user} onChange={(v) => setAccount(v)} fullWidth />
  ) : (
    <Horizontal gap={spacing.C} align="center" wrap>
      <Typography variant="body-normal" color="gray-light" noMargin>
        No API key yet.
      </Typography>
      <Button variant="secondary" size="small" onClick={() => onNavigate('keys')}>
        Go to API keys
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
          // Named for the job, in the order data flows (Vivek, 27 Oct): ingestion, consumption, agents. Apps removed.
          { id: 'load', label: 'Ingestion' },
          { id: 'bi', label: 'Consumption' },
          { id: 'agents', label: 'Agents' },
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
          <div className={styles.twoUp}>{databasePicker}</div>
          {tables.length ? (
            <LoadInstructions key={database} database={database} tables={tables.map((t) => t.name)} initial={ingestFor?.database === database ? [ingestFor.table] : undefined} identities={identities} toast={toast} onNeedKey={() => onNavigate('keys')} />
          ) : (
            <Horizontal gap={spacing.C} align="center" wrap>
              <Typography variant="body-normal" color="gray-light" noMargin>
                No tables in {database} yet. Tables come first: loads go into a table that exists.
              </Typography>
              <Button variant="secondary" size="small" onClick={() => onNavigate('sql')}>
                Open SQL
              </Button>
            </Horizontal>
          )}
        </Vertical>
      )}
    </Vertical>
  );
};
