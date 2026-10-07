import React, { useMemo, useState } from 'react';
import { Accordion, Button, Horizontal, Modal, ModalFooter, Select, Stepper, TextArea, TextInput, Toggle, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { buildCreateSql, columnsToSql, DraftColumn, isDateType, parseSql, PLAIN_TYPES, PlainType } from '../tableSchema';
import { DATABASE } from '../data';
import { CodeBlock, KeyValue } from './primitives';
import styles from './wizard.module.css';

export interface NewTableInput {
  name: string;
  columns: DraftColumn[];
  splitBy: string | null;
}

/**
 * 7 Oct: two steps. V1 has no incremental load — every load replaces the table — so the old
 * "Row handling" step (replace the old row vs add a new one) has nothing to decide. Split by date
 * stays, as Advanced on the Define step. One database, so the table is just its name.
 */
const STEPS = [
  { title: 'Define table', description: 'Name and columns' },
  { title: 'Review', description: 'Check and create' },
];
const NAME_RE = /^[a-z][a-z0-9_]*$/;
const TYPE_OPTIONS = PLAIN_TYPES.map((t) => ({ id: t.id, label: t.id }));

const EXAMPLE_SQL = `CREATE TABLE returns (
  return_id BIGINT,
  order_id BIGINT,
  return_date DATE,
  reason VARCHAR(64),
  amount DECIMAL(12,2)
)
UNIQUE KEY (return_id)
DISTRIBUTED BY HASH(return_id) BUCKETS 10;`;

export const CreateTableWizard: React.FC<{
  existingNames: string[];
  onCancel: () => void;
  onCreate: (t: NewTableInput) => void;
}> = ({ existingNames, onCancel, onCreate }) => {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'form' | 'sql'>('form');
  const [name, setName] = useState('');
  const [columns, setColumns] = useState<DraftColumn[]>([{ name: '', type: 'Text' }]);
  const [sql, setSql] = useState('');
  const [sqlNotice, setSqlNotice] = useState<string | null>(null);
  // The starter statement written when switching to SQL; if it's untouched, going back changes nothing.
  const [scaffold, setScaffold] = useState<string | null>(null);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [splitOn, setSplitOn] = useState(false);
  const [splitCol, setSplitCol] = useState<string | null>(null);

  const cleanCols = columns.filter((c) => c.name.trim());
  const nameError =
    name && !NAME_RE.test(name)
      ? 'Use lowercase letters, numbers and underscores, starting with a letter'
      : existingNames.includes(name)
        ? `${name} already exists`
        : '';
  const dupCol = cleanCols.find((c, i) => cleanCols.findIndex((x) => x.name === c.name) !== i);
  const badCol = cleanCols.find((c) => !NAME_RE.test(c.name));

  /** SQL mode: read the statement live, so the user sees what will be created as they type. */
  const parsed = useMemo(() => {
    if (!sql.trim()) return null;
    const res = parseSql(sql);
    const errors = [...res.errors];
    if (!res.tableName) errors.unshift('Start with CREATE TABLE table_name ( … )');
    else if (res.database && res.database !== DATABASE) errors.unshift(`There's one database here, ${DATABASE}. Write CREATE TABLE ${res.tableName} or CREATE TABLE ${DATABASE}.${res.tableName}`);
    else if (!NAME_RE.test(res.tableName)) errors.unshift(`${res.tableName}: use lowercase letters, numbers and underscores`);
    else if (existingNames.includes(res.tableName)) errors.unshift(`${res.tableName} already exists`);
    return { ...res, errors };
  }, [sql, existingNames]);

  /** Copy what the SQL says into the shared fields, including a split by date if it states one. */
  const applyParsed = () => {
    if (!parsed || parsed.errors.length) return false;
    setName(parsed.tableName!);
    setColumns(parsed.columns);
    setIgnored(parsed.ignored);
    if (parsed.splitBy) {
      setSplitOn(true);
      setSplitCol(parsed.splitBy);
    }
    return true;
  };

  const toSql = () => {
    const body = cleanCols.length ? columnsToSql(cleanCols).split('\n').map((l) => `  ${l}`).join('\n') : '  column_name BIGINT';
    const statement = `CREATE TABLE ${name || 'table_name'} (\n${body}\n);`;
    setSql(statement);
    setScaffold(statement);
    setSqlNotice(null);
    setMode('sql');
  };

  /** Going back to the form always works. If the SQL can't be read, the form keeps what it had. */
  const toForm = () => {
    if (sql === scaffold) {
      setSqlNotice(null);
    } else if (sql.trim() && !applyParsed()) {
      setSqlNotice("Your SQL couldn't be read, so the form shows what you had before.");
    } else {
      setSqlNotice(null);
    }
    setMode('form');
  };

  const splitOptions = cleanCols.filter((c) => isDateType(c.type));
  const effectiveSplit = splitOn && splitCol && splitOptions.some((c) => c.name === splitCol) ? splitCol : null;

  const step1Valid =
    mode === 'sql'
      ? !!parsed && parsed.errors.length === 0
      : NAME_RE.test(name) && !existingNames.includes(name) && cleanCols.length > 0 && !dupCol && !badCol && (!splitOn || !!effectiveSplit);

  const next = () => {
    if (mode === 'sql') {
      if (!applyParsed()) return;
    } else {
      setIgnored([]);
    }
    setStep(1);
  };

  const built = useMemo(() => buildCreateSql(DATABASE, name, cleanCols, effectiveSplit), [name, cleanCols, effectiveSplit]);

  const footer = (
    <ModalFooter
      tertiaryAction={
        <Button variant="tertiary" onClick={onCancel}>
          Cancel
        </Button>
      }
      secondaryAction={
        step > 0 ? (
          <Button variant="secondary" onClick={() => setStep(0)}>
            Back
          </Button>
        ) : undefined
      }
      primaryAction={
        step === 0 ? (
          <Button variant="primary" disabled={!step1Valid} onClick={next}>
            Next
          </Button>
        ) : (
          <Button variant="primary" onClick={() => onCreate({ name, columns: cleanCols, splitBy: effectiveSplit })}>
            Create table
          </Button>
        )
      }
    />
  );

  const advanced = (
    <Accordion variant="bordered" defaultExpanded={splitOn ? 0 : undefined}>
      <Accordion.Item title="Advanced" subtitle={effectiveSplit ? `Split by date on ${effectiveSplit}` : 'Split by date: off'}>
        <Vertical gap={spacing.C}>
          <Toggle
            label="Split this table by date"
            checked={splitOn}
            onChange={(on) => {
              setSplitOn(on);
              if (on && !splitCol && splitOptions[0]) setSplitCol(splitOptions[0].name);
            }}
          />
          <Typography variant="footnote" color="gray-light" noMargin>
            Queries on recent data only read the months they need. Worth it for large tables that grow over time. Can&apos;t be changed
            later.
          </Typography>
          {splitOn &&
            (splitOptions.length ? (
              <div className={styles.dbField}>
                <Select
                  label="Date column"
                  options={splitOptions.map((c) => ({ id: c.name, label: c.name }))}
                  value={effectiveSplit ?? undefined}
                  onChange={setSplitCol}
                  fullWidth
                />
              </div>
            ) : (
              <Typography variant="footnote" color="failure" noMargin>
                This table has no date column to split by.
              </Typography>
            ))}
        </Vertical>
      </Accordion.Item>
    </Accordion>
  );

  return (
    <Modal isOpen onClose={onCancel} title="Create table" size="large" footer={footer}>
      <Vertical gap={spacing.F}>
        <Stepper steps={STEPS} currentStep={step} sequential onStepClick={(i) => i < step && setStep(i)} />

        {/* ---------- Step 1: define ---------- */}
        {step === 0 && mode === 'form' && (
          <Vertical gap={spacing.F}>
            <Horizontal justify="space-between" align="center">
              <Typography variant="body-normal" color="gray-light" noMargin>
                Name the table and list its columns.
              </Typography>
              <Button variant="tertiary" size="small" icon="formula" onClick={toSql}>
                Write SQL instead
              </Button>
            </Horizontal>

            {sqlNotice && (
              <div className={styles.notice}>
                <Typography variant="body-normal" color="base" noMargin>
                  {sqlNotice}
                </Typography>
              </div>
            )}

            <TextInput
              label="Table name"
              placeholder="e.g. returns"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              error={!!nameError}
              errorMessage={nameError}
            />

            <Vertical gap={spacing.B}>
              <Horizontal gap={spacing.C} className={styles.colHead}>
                <Typography variant="footnote" color="gray-light" noMargin className={styles.grow}>
                  Column name
                </Typography>
                <Typography variant="footnote" color="gray-light" noMargin className={styles.typeField}>
                  Type
                </Typography>
                <span className={styles.iconSpacer} />
              </Horizontal>
              {columns.map((c, i) => (
                <Horizontal key={i} gap={spacing.C} align="start">
                  <div className={styles.grow}>
                    <TextInput
                      label={`Column ${i + 1} name`}
                      showLabel={false}
                      placeholder="e.g. order_id"
                      value={c.name}
                      onChange={(e) =>
                        setColumns((cols) => cols.map((x, j) => (j === i ? { ...x, name: e.target.value.toLowerCase() } : x)))
                      }
                      error={!!c.name && (!NAME_RE.test(c.name) || dupCol?.name === c.name)}
                    />
                  </div>
                  <div className={styles.typeField}>
                    <Select
                      options={TYPE_OPTIONS}
                      value={c.type}
                      onChange={(v) => setColumns((cols) => cols.map((x, j) => (j === i ? { ...x, type: v as PlainType } : x)))}
                      fullWidth
                    />
                  </div>
                  <Button
                    variant="tertiary"
                    icon="trash-can"
                    iconOnly
                    aria-label={`Remove column ${i + 1}`}
                    disabled={columns.length === 1}
                    onClick={() => setColumns((cols) => cols.filter((_, j) => j !== i))}
                  >
                    Remove
                  </Button>
                </Horizontal>
              ))}
              {(dupCol || badCol) && (
                <Typography variant="footnote" color="failure" noMargin>
                  {dupCol ? `Two columns are called ${dupCol.name}` : `${badCol!.name}: use lowercase letters, numbers and underscores`}
                </Typography>
              )}
              <div>
                <Button variant="secondary" size="small" icon="plus" onClick={() => setColumns((cols) => [...cols, { name: '', type: 'Text' }])}>
                  Add column
                </Button>
              </div>
            </Vertical>

            {advanced}
          </Vertical>
        )}

        {step === 0 && mode === 'sql' && (
          <Vertical gap={spacing.D}>
            <Horizontal justify="space-between" align="center">
              <Typography variant="body-normal" color="gray-light" noMargin>
                Write or paste a CREATE TABLE statement.
              </Typography>
              <Button variant="tertiary" size="small" icon="arrow-left" onClick={toForm}>
                Use the form instead
              </Button>
            </Horizontal>
            <TextArea
              label="CREATE TABLE statement"
              showLabel={false}
              rows={12}
              resize="vertical"
              placeholder={'CREATE TABLE returns (\n  return_id BIGINT,\n  return_date DATE,\n  amount DECIMAL(12,2)\n);'}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className={styles.sqlInput}
            />
            {!parsed ? (
              <Horizontal gap={spacing.B} align="center" wrap>
                <Typography variant="footnote" color="gray-light" noMargin>
                  If it splits the table by a date column, we&apos;ll keep that. Other table settings are set for you.
                </Typography>
                <Button variant="tertiary" size="small" onClick={() => setSql(EXAMPLE_SQL)}>
                  Paste an example
                </Button>
              </Horizontal>
            ) : parsed.errors.length > 0 ? (
              <div className={styles.errorBox}>
                <Vertical gap={spacing.A}>
                  {parsed.errors.map((e) => (
                    <Typography key={e} variant="footnote" color="failure" noMargin>
                      {e}
                    </Typography>
                  ))}
                </Vertical>
              </div>
            ) : (
              <div className={styles.readBack}>
                <Typography variant="body-normal" color="base" noMargin>
                  Will create <b>{parsed.tableName}</b> with {parsed.columns.length} {parsed.columns.length === 1 ? 'column' : 'columns'}
                  {parsed.splitBy ? `, split by date on ${parsed.splitBy}.` : '.'}
                </Typography>
              </div>
            )}
          </Vertical>
        )}

        {/* ---------- Step 2: review ---------- */}
        {step === 1 && (
          <Vertical gap={spacing.E}>
            <div className={styles.summary}>
              <Vertical gap={spacing.C}>
                <KeyValue label="Table">{name}</KeyValue>
                <KeyValue label="Columns">
                  {cleanCols.length} · {cleanCols.map((c) => c.name).join(', ')}
                </KeyValue>
                <KeyValue label="Split by date">{effectiveSplit ? `By month, on ${effectiveSplit}` : 'No'}</KeyValue>
                <KeyValue label="After it's created">Empty until your pipeline sends its first load. Each load replaces what&apos;s in the table.</KeyValue>
              </Vertical>
            </div>
            <Accordion variant="bordered">
              <Accordion.Item title="SQL that will run" subtitle="For data engineers">
                <Vertical gap={spacing.B}>
                  <CodeBlock>{built}</CodeBlock>
                  {ignored.length > 0 && (
                    <Typography variant="footnote" color="gray-light" noMargin>
                      Not used from your SQL: {ignored.join(', ')}. AgentDB sets these for you.
                    </Typography>
                  )}
                </Vertical>
              </Accordion.Item>
            </Accordion>
          </Vertical>
        )}
      </Vertical>
    </Modal>
  );
};
