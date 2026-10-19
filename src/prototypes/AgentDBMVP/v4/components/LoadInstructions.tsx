import React, { useState } from 'react';
import { Button, Horizontal, Link, Select, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Identity } from '../types';
import { curlFor, DORIS_STREAM_LOAD_DOCS, LOAD_HEADERS, loadUrl } from '../data';
import { CodeBlock, CopyBlock } from './CopyField';
import styles from '../v4.module.css';

/**
 * How to load a file into one table: the address, the command, the headers. Written once,
 * shown from the table page (Load data) and from Connect (Load data method).
 */
export const LoadInstructions: React.FC<{
  database: string;
  table: string;
  identities: Identity[];
  toast: (m: string) => void;
  onNeedKey?: () => void;
}> = ({ database, table, identities, toast, onNeedKey }) => {
  const [key, setKey] = useState('');
  const keys = identities.filter((i) => i.type === 'Ingest' && !i.revoked);
  const chosen = keys.some((k) => k.name === key) ? key : keys[0]?.name ?? '<api-key>';
  const curl = curlFor(chosen, database, table);
  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    toast(`${what} copied`);
  };

  return (
    <Vertical gap={spacing.E}>
      <div className={styles.twoUp}>
      {keys.length ? (
        <Select label="API key" options={keys.map((k) => ({ id: k.name, label: k.name }))} value={chosen} onChange={(v) => setKey(v)} fullWidth />
      ) : (
        <Horizontal gap={spacing.C} align="center" wrap>
          <Typography variant="body-normal" color="gray-light" noMargin>
            No API key yet.
          </Typography>
          {onNeedKey && (
            <Button variant="secondary" size="small" onClick={onNeedKey}>
              Create an API key
            </Button>
          )}
        </Horizontal>
      )}
      </div>
      <CopyBlock label="Load address" value={loadUrl(database, table)} onCopied={(l) => toast(`${l} copied`)} />
      <Vertical gap={spacing.B}>
        <Horizontal justify="space-between" align="center">
          <Typography variant="content-label" color="base" noMargin>
            The command
          </Typography>
          <Button variant="secondary" size="small" icon="copy" onClick={() => copy(curl, 'Command')}>
            Copy command
          </Button>
        </Horizontal>
        <CodeBlock>{curl}</CodeBlock>
      </Vertical>
      <Vertical gap={spacing.B}>
        <Typography variant="content-label" color="base" noMargin>
          The headers
        </Typography>
        <div className={styles.headers}>
          {LOAD_HEADERS.map((h) => (
            <React.Fragment key={h.name}>
              <Typography variant="body-normal" color="base" noMargin>
                {h.name}
              </Typography>
              <Typography variant="footnote" color="gray-light" noMargin>
                {h.means}
              </Typography>
            </React.Fragment>
          ))}
        </div>
        <Typography variant="footnote" color="gray-light" noMargin>
          <Link href={DORIS_STREAM_LOAD_DOCS} external>
            All header options, in the Doris documentation
          </Link>
        </Typography>
      </Vertical>
    </Vertical>
  );
};
