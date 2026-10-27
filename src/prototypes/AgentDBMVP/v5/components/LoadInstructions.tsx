import React, { useState } from 'react';
import { Accordion, Button, Checkbox, Horizontal, Icon, Link, Popover, SearchBar, Select, Tabs, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Identity } from '../types';
import { DORIS_STREAM_LOAD_DOCS, LOAD_HEADERS, SQL_PORT } from '../data';
import { httpContract, LOAD_HOST, LOAD_WAYS, LoadWay, snippet } from '../loadSnippets';
import { CodeBlock, CopyField } from './CopyField';
import styles from '../v5.module.css';

/**
 * Load instructions (Vivek, 27 Oct): one table or many, for whichever way the team loads. The
 * key is the only thing that sits above the table; it defaults to the one most recently used.
 * Connect › Ingestion lets you tick tables for a bulk load; a table's own page fixes the table.
 * Every tab is filled in: address, key, database and table names, so nothing is remembered.
 */
export const LoadInstructions: React.FC<{
  database: string;
  /** Tables you can tick. With one entry and `fixed`, the table can't be changed (table page). */
  tables: string[];
  fixed?: boolean;
  /** Tables ticked when it opens (arriving from a table page). */
  initial?: string[];
  identities: Identity[];
  toast: (m: string) => void;
  onNeedKey?: () => void;
}> = ({ database, tables, fixed, initial, identities, toast, onNeedKey }) => {
  const keys = identities.filter((i) => i.type === 'Ingest' && !i.revoked);
  // Most recently used first: the key already loading somewhere is the likely one.
  const usedFirst = [...keys].sort((a, b) => Number(b.lastUsed !== 'Never') - Number(a.lastUsed !== 'Never'));
  const [key, setKey] = useState('');
  const chosen = keys.some((k) => k.name === key) ? key : usedFirst[0]?.name ?? '<api-key>';
  const [picked, setPicked] = useState<string[]>(() => initial ?? tables.slice(0, 1));
  const selected = fixed ? tables : picked.filter((t) => tables.includes(t));
  const many = selected.length > 1;
  const [way, setWay] = useState<LoadWay>(fixed || initial?.length === 1 ? 'curl' : 'shell');
  const wayInfo = LOAD_WAYS.find((w) => w.id === way)!;
  const code = snippet(way, chosen, database, selected);
  const [q, setQ] = useState('');
  const shown = tables.filter((t) => t.toLowerCase().includes(q.trim().toLowerCase()));
  const summary = !selected.length ? 'Choose tables' : selected.length === 1 ? selected[0] : selected.length === tables.length ? `All ${tables.length} tables` : `${selected.length} tables`;
  const toggle = (t: string, on: boolean) => setPicked((p) => (on ? [...p, t] : p.filter((x) => x !== t)));
  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    toast(`${what} copied`);
  };

  return (
    <Vertical gap={spacing.E}>
      {/* The only thing above the table: which key loads. */}
      <div className={styles.twoUp}>
        {keys.length ? (
          <Select label="API key" options={usedFirst.map((k) => ({ id: k.name, label: k.lastUsed !== 'Never' ? `${k.name} · last used ${k.lastUsed.toLowerCase()}` : k.name }))} value={chosen} onChange={(v) => setKey(v)} fullWidth />
        ) : (
          <Horizontal gap={spacing.C} align="center" wrap>
            <Typography variant="body-normal" color="gray-light" noMargin>
              No key that can load yet.
            </Typography>
            {onNeedKey && (
              <Button variant="secondary" size="small" onClick={onNeedKey}>
                Create an API key
              </Button>
            )}
          </Horizontal>
        )}
        {/* Tables in a dropdown with checkboxes: one for a single table, many for a bulk load (Vivek, 27 Oct). */}
        {!fixed && (
          <Vertical gap={0}>
            <span className={styles.fieldLabel}>Tables</span>
            <Popover
              placement="bottom-start"
              trigger="click"
              content={
                <div className={styles.pickMenu}>
                  <SearchBar size="sm" placeholder="Search tables" value={q} onChange={setQ} onClear={() => setQ('')} />
                  <Horizontal justify="space-between" align="center">
                    <Typography variant="footnote" color="gray-light" noMargin>
                      {`${selected.length} of ${tables.length}`}
                    </Typography>
                    <Horizontal gap={spacing.A}>
                      <Button variant="tertiary" size="small" onClick={() => setPicked(tables)} disabled={selected.length === tables.length}>
                        Select all
                      </Button>
                      <Button variant="tertiary" size="small" onClick={() => setPicked([])} disabled={!selected.length}>
                        Clear
                      </Button>
                    </Horizontal>
                  </Horizontal>
                  <div className={styles.pickList}>
                    {shown.map((t) => (
                      <Checkbox key={t} label={t} checked={selected.includes(t)} onChange={(on) => toggle(t, on)} />
                    ))}
                    {!shown.length && (
                      <Typography variant="footnote" color="gray-light" noMargin>
                        No tables match.
                      </Typography>
                    )}
                  </div>
                </div>
              }
            >
              <Button variant="secondary" fullWidth className={styles.pickTrigger}>
                <span className={styles.pickValue}>{summary}</span>
                <Icon name="chevron-down" size="s" aria-hidden />
              </Button>
            </Popover>
          </Vertical>
        )}
      </div>

      {/* One copy per way of loading: the snippet carries every value (Vivek, 27 Oct). Field-by-field
          copying is its own tab, for tools that are set up through a form. */}
      {/* Tools set up through a form need the values one by one; collapsed, above the tabs (Vivek, 27 Oct). */}
      {selected.length > 0 && (
        <div className={styles.fieldsSection}>
          <Accordion variant="minimal">
            <Accordion.Item title="Values for tools set up through a form" subtitle="Host, ports, database, username, tables">
              <div className={styles.fieldList}>
                <CopyField label="Load host" value={LOAD_HOST.split(':')[0]} onCopied={(l) => toast(`${l} copied`)} />
                <CopyField label="Load port" value={LOAD_HOST.split(':')[1]} onCopied={(l) => toast(`${l} copied`)} />
                <CopyField label="SQL port" value={SQL_PORT} onCopied={(l) => toast(`${l} copied`)} />
                <CopyField label="Database" value={database} onCopied={(l) => toast(`${l} copied`)} />
                <CopyField label="Username" value={chosen} onCopied={(l) => toast(`${l} copied`)} />
                <CopyField label={selected.length > 1 ? 'Tables' : 'Table'} value={selected.join(', ')} onCopied={(l) => toast(`${l} copied`)} />
                <Typography variant="footnote" color="gray-light" noMargin>
                  Password: the key's secret, shown once when the key was created.
                </Typography>
              </div>
            </Accordion.Item>
          </Accordion>
        </div>
      )}

      <Vertical gap={spacing.C}>
        <Tabs tabs={LOAD_WAYS.map((w) => ({ id: w.id, label: w.label }))} activeTab={way} onTabChange={(v) => setWay(v as LoadWay)} />
        <Typography variant="footnote" color="gray-light" noMargin>
          {many && !wayInfo.many ? `${wayInfo.hint} For ${selected.length} tables at once, the script and tool tabs fit better.` : wayInfo.hint}
        </Typography>
        {!selected.length ? (
          <Typography variant="body-normal" color="gray-light" noMargin>
            Choose the tables to load.
          </Typography>
        ) : way === 'any' ? (
          <Vertical gap={spacing.D}>
            <ol className={styles.anySteps}>
              <li>
                <Typography variant="body-normal" color="base" noMargin>
                  In your tool, add a destination. Choose <b>Apache Doris</b> if it has one; if not, <b>MySQL</b> (it loads over the SQL port: fine for small volumes); if neither, a custom HTTP destination using the contract below.
                </Typography>
              </li>
              <li>
                <Typography variant="body-normal" color="base" noMargin>
                  Fill in the values from <b>Values for tools set up through a form</b>, above. The password is the key's secret.
                </Typography>
              </li>
              <li>
                <Typography variant="body-normal" color="base" noMargin>
                  {`Point each source at its table in ${database}: ${selected.join(', ')}. Tables must exist before the first load.`}
                </Typography>
              </li>
              <li>
                <Typography variant="body-normal" color="base" noMargin>
                  Give each run a unique label or label prefix, so a retried run is never loaded twice. Pick CSV or JSON.
                </Typography>
              </li>
              <li>
                <Typography variant="body-normal" color="base" noMargin>
                  Run it once for one table, check the rows in Overview, then schedule it.
                </Typography>
              </li>
            </ol>
            <Vertical gap={spacing.B}>
              <Typography variant="content-label" color="base" noMargin>
                The HTTP contract, for tools with no Doris option and your own code
              </Typography>
              <div className={styles.codeCard}>
                <div className={styles.codeCardCopy}>
                  <Button variant="tertiary" size="small" icon="copy" onClick={() => copy(httpContract(chosen, database, selected[0]), 'Contract')}>
                    Copy
                  </Button>
                </div>
                <CodeBlock>{httpContract(chosen, database, selected[0])}</CodeBlock>
              </div>
            </Vertical>
          </Vertical>
        ) : (
          <div className={styles.codeCard}>
            <div className={styles.codeCardCopy}>
              <Button variant="tertiary" size="small" icon="copy" onClick={() => copy(code, wayInfo.label)}>
                Copy
              </Button>
            </div>
            <CodeBlock>{code}</CodeBlock>
          </div>
        )}
        {selected.length > 0 && way !== 'any' && (
          <Typography variant="footnote" color="gray-light" noMargin>
            Set AGENTDB_KEY to the key's secret. Each run's label is new, so a retried run never loads twice.
          </Typography>
        )}
      </Vertical>

      {way === 'curl' && (
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
      )}
    </Vertical>
  );
};
