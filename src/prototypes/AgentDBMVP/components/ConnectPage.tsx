import React from 'react';
import { Button, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Person, ServiceAccount } from '../types';
import { DATABASE, ENDPOINT_HOST, LOAD_PORT, MCP_URL, SQL_PORT } from '../data';
import { useVariant } from '../variant';
import { CodeBlock, CopyField, KeyValue, PageHeader, Panel } from './primitives';
import { ServiceAccounts } from './ServiceAccounts';
import { ApiKeys } from './ApiKeys';
import styles from './pages.module.css';

const MCP_CONFIG = `{
  "mcpServers": {
    "agentdb": {
      "url": "${MCP_URL}",
      "headers": { "Authorization": "Bearer <service-account-token>" }
    }
  }
}`;

/**
 * Connect. v1, in the order Vivek set on 7 Oct: connection details, agents (MCP), service accounts,
 * then the two set-up blocks for tools that read (consumption) and tools that write (pipelines).
 * v2 (PM plan, sharpened 7 Oct): two blocks. API keys, because the key is what you connect with;
 * then Endpoints, the facts every tool asks for, once, copyable.
 */
export const ConnectPage: React.FC<{
  accounts: ServiceAccount[];
  people: Person[];
  onCreate: (a: ServiceAccount) => void;
  onUpdate: (a: ServiceAccount) => void;
  toast: (m: string) => void;
}> = ({ accounts, people, onCreate, onUpdate, toast }) => {
  const copied = (label: string) => toast(`${label} copied`);
  const v2 = useVariant() === 'v2';

  if (v2) {
    return (
      <Vertical gap={spacing.F}>
        <PageHeader title="Connect" />
        <ApiKeys keys={accounts} people={people} onCreate={onCreate} onUpdate={onUpdate} toast={toast} />
        <Panel title="Endpoints">
          <Vertical gap={spacing.D}>
            <Vertical gap={spacing.C}>
              <CopyField label="Host" value={ENDPOINT_HOST} onCopied={copied} />
              <CopyField label="SQL port" value={SQL_PORT} onCopied={copied} />
              <CopyField label="Bulk load port (HTTP)" value={LOAD_PORT} onCopied={copied} />
              <CopyField label="Database" value={DATABASE} onCopied={copied} />
              <CopyField label="MCP server URL" value={MCP_URL} onCopied={copied} />
            </Vertical>
            <Vertical gap={spacing.B}>
              <KeyValue label="BI tools">MySQL driver. The key as username, its secret as password. ThoughtSpot connects the same way.</KeyValue>
              <KeyValue label="Pipelines">Doris connector with the key in the request header. Full refresh (overwrite). Fivetran, Airbyte, dbt, Airflow.</KeyValue>
              <KeyValue label="Agents">MCP, with the key&apos;s secret as the bearer token. Reads and writes within what the key can do.</KeyValue>
            </Vertical>
            <Typography variant="footnote" color="gray-light" noMargin>
              Schedules, retries and run history stay in the pipeline tool. AgentDB shows what arrived.
            </Typography>
          </Vertical>
        </Panel>
      </Vertical>
    );
  }

  return (
    <Vertical gap={spacing.F}>
      <PageHeader title="Connect" />

      <Panel title="Connection details">
        <Vertical gap={spacing.C}>
          <Typography variant="body-normal" color="gray-light" noMargin>
            AgentDB is MySQL-compatible. Any tool, driver or pipeline that can connect to MySQL can connect here, signed in with a
            service account.
          </Typography>
          <CopyField label="Host" value={ENDPOINT_HOST} onCopied={copied} />
          <CopyField label="SQL port" value={SQL_PORT} onCopied={copied} />
          <CopyField label="Bulk load port (HTTP)" value={LOAD_PORT} onCopied={copied} />
          <CopyField label="Database" value={DATABASE} onCopied={copied} />
        </Vertical>
      </Panel>

      <Panel title="Agents (MCP)">
        <Vertical gap={spacing.C}>
          <Typography variant="body-normal" color="base" noMargin>
            Give an AI agent access through the Model Context Protocol. It can list tables, read their descriptions, and run
            read-only SQL, within its service account&apos;s rate limit.
          </Typography>
          <CopyField label="MCP server URL" value={MCP_URL} onCopied={copied} />
          <CodeBlock>{MCP_CONFIG}</CodeBlock>
        </Vertical>
      </Panel>

      <ServiceAccounts accounts={accounts} onCreate={onCreate} onUpdate={onUpdate} toast={toast} />

      <div className={styles.twoCol}>
        <Panel title="Consumption">
          <Vertical gap={spacing.C}>
            <Typography variant="body-normal" color="base" noMargin>
              BI tools and apps that read from AgentDB. What the tool asks for:
            </Typography>
            <KeyValue label="Driver">MySQL</KeyValue>
            <KeyValue label="Host and port">
              {ENDPOINT_HOST} · {SQL_PORT}
            </KeyValue>
            <KeyValue label="Database">{DATABASE}</KeyValue>
            <KeyValue label="Username and password">A service account that can read</KeyValue>
            <Typography variant="footnote" color="gray-light" noMargin>
              ThoughtSpot is already connected: every table here is available through its default AgentDB connection.
            </Typography>
            <div>
              <Button variant="secondary" size="small" icon="documentation" onClick={() => toast('Opens setup guides')}>
                Setup guides
              </Button>
            </div>
          </Vertical>
        </Panel>

        <Panel title="Pipelines">
          <Vertical gap={spacing.C}>
            <Typography variant="body-normal" color="base" noMargin>
              ETL tools that write into AgentDB. What the tool asks for:
            </Typography>
            <KeyValue label="Destination type">MySQL</KeyValue>
            <KeyValue label="Sync mode">Full refresh (overwrite). Incremental and CDC syncs aren&apos;t available yet.</KeyValue>
            <KeyValue label="Host and port">
              {ENDPOINT_HOST} · {SQL_PORT} for SQL, {LOAD_PORT} for bulk loads
            </KeyValue>
            <KeyValue label="Database">{DATABASE}</KeyValue>
            <KeyValue label="Username and password">A service account that can write</KeyValue>
            <Typography variant="footnote" color="gray-light" noMargin>
              Schedules, retries and run history stay in the pipeline tool. AgentDB shows what arrived.
            </Typography>
            <div>
              <Button variant="secondary" size="small" icon="documentation" onClick={() => toast('Opens setup guides')}>
                Setup guides
              </Button>
            </div>
          </Vertical>
        </Panel>
      </div>
    </Vertical>
  );
};
