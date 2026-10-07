import React from 'react';
import { Button, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { ServiceAccount } from '../types';
import { DATABASE, ENDPOINT_HOST, LOAD_PORT, MCP_URL, SQL_PORT } from '../data';
import { CodeBlock, CopyField, KeyValue, PageHeader, Panel } from './primitives';
import { ServiceAccounts } from './ServiceAccounts';
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
 * Connect, in the order Vivek set on 7 Oct: connection details, agents (MCP), service accounts,
 * then the two set-up blocks for tools that read (consumption) and tools that write (pipelines).
 */
export const ConnectPage: React.FC<{
  accounts: ServiceAccount[];
  onCreate: (a: ServiceAccount) => void;
  onUpdate: (a: ServiceAccount) => void;
  toast: (m: string) => void;
}> = ({ accounts, onCreate, onUpdate, toast }) => {
  const copied = (label: string) => toast(`${label} copied`);

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
