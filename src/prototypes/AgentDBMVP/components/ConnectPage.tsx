import React from 'react';
import { Button, Horizontal, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Page } from '../types';
import { ENDPOINT_HOST, LOAD_PORT, MCP_URL, SQL_PORT } from '../data';
import { CodeBlock, CopyField, KeyValue, PageHeader, Panel, StatusPill } from './primitives';
import { useVariant } from '../variant';
import styles from './pages.module.css';

const MCP_CONFIG = `{
  "mcpServers": {
    "agentdb": {
      "url": "${MCP_URL}",
      "headers": { "Authorization": "Bearer <service-account-token>" }
    }
  }
}`;

export const ConnectPage: React.FC<{ onNavigate: (p: Page) => void; toast: (m: string) => void }> = ({ onNavigate, toast }) => {
  const copied = (label: string) => toast(`${label} copied`);
  const variant = useVariant();

  return (
    <Vertical gap={spacing.F}>
      <PageHeader title="Connect" subtitle="Ways to write data into AgentDB and read it back out." />

      <Panel title="Connection details">
        <Vertical gap={spacing.C}>
          <Typography variant="body-normal" color="gray-light" noMargin>
            AgentDB is MySQL-compatible: any tool, driver or pipeline that can connect to MySQL can connect here. Sign in with
            a service account.
          </Typography>
          <CopyField label="Host" value={ENDPOINT_HOST} onCopied={copied} />
          <CopyField label="SQL port" value={SQL_PORT} onCopied={copied} />
          <CopyField label="Bulk load port (HTTP)" value={LOAD_PORT} onCopied={copied} />
          <KeyValue label="Credentials">
            <Button variant="tertiary" size="small" icon="key" onClick={() => onNavigate('access')}>
              Create a service account
            </Button>
          </KeyValue>
        </Vertical>
      </Panel>

      <div className={styles.twoCol}>
        {variant === 'v2' ? (
          <Panel title="BI tools">
            <Vertical gap={spacing.C}>
              <Typography variant="body-normal" color="base" noMargin>
                Connect ThoughtSpot, Tableau, Power BI or any MySQL-compatible BI tool, using a service account.
              </Typography>
              <Horizontal gap={spacing.B} wrap>
                <StatusPill kind="neutral" label="thoughtspot · active" />
                <StatusPill kind="neutral" label="seller-portal · active" />
              </Horizontal>
              <div>
                <Button variant="secondary" size="small" icon="documentation" onClick={() => toast('Opens setup guides')}>
                  Setup guides
                </Button>
              </div>
            </Vertical>
          </Panel>
        ) : (
        <Panel title="ThoughtSpot">
          <Vertical gap={spacing.C}>
            <Horizontal gap={spacing.B}>
              <StatusPill kind="success" label="Connected" />
              <Typography variant="body-normal" color="gray-light" noMargin>
                Default connection, set up automatically
              </Typography>
            </Horizontal>
            <Typography variant="body-normal" color="base" noMargin>
              Every table here can be used in ThoughtSpot models. Pulse writes cached models through the same connection.
            </Typography>
            <div>
              <Button variant="secondary" size="small" icon="navigate" onClick={() => toast('Opens Data workspace in ThoughtSpot')}>
                Open in ThoughtSpot
              </Button>
            </div>
          </Vertical>
        </Panel>
        )}

        <Panel title="Pipelines">
          <Vertical gap={spacing.C}>
            <Typography variant="body-normal" color="base" noMargin>
              Point Fivetran, Airbyte, dbt or Airflow at AgentDB as a MySQL destination, using a service account with write access.
            </Typography>
            <Horizontal gap={spacing.B} wrap>
              <StatusPill kind="neutral" label="fivetran-prod · active" />
              <StatusPill kind="neutral" label="airflow-events · active" />
              <StatusPill kind="neutral" label="dbt-cloud · active" />
            </Horizontal>
            <div>
              <Button variant="secondary" size="small" icon="documentation" onClick={() => toast('Opens setup guides')}>
                Setup guides
              </Button>
            </div>
          </Vertical>
        </Panel>
      </div>

      <Panel title="Agents (MCP)">
        <Vertical gap={spacing.C}>
          <Typography variant="body-normal" color="base" noMargin>
            Give an AI agent access through the Model Context Protocol. It can list tables, read their descriptions, and run
            read-only SQL, within its service account&apos;s budget and rate limit.
          </Typography>
          <CopyField label="MCP server URL" value={MCP_URL} onCopied={copied} />
          <CodeBlock>{MCP_CONFIG}</CodeBlock>
        </Vertical>
      </Panel>
    </Vertical>
  );
};
