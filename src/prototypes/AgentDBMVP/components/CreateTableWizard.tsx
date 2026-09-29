import React, { useMemo, useState } from 'react';
import {
  Accordion,
  Button,
  Checkbox,
  Horizontal,
  Modal,
  ModalFooter,
  Radio,
  Select,
  Stepper,
  TextArea,
  TextInput,
  Toggle,
  Typography,
  Vertical,
} from '@/components';
import { spacing } from '@tokens/spacing';
import { buildCreateSql, columnsToSql, DraftColumn, isDateType, parseSql, PLAIN_TYPES, PlainType, RowMode } from '../tableSchema';
import { CodeBlock, KeyValue } from './primitives';
import styles from './wizard.module.css';

export interface NewTableInput {
  database: string;
  name: string;
  columns: DraftColumn[];
  mode: RowMode;
  keys: string[];
  splitBy: string | null;
}

const STEPS = [
  { title: 'Define table', description: 'Name and columns' },
  { title: 'Row handling', description: 'Updates and splitting' },
  { title: 'Review', description: 'Check and create' },
];
const NAME_RE = /^[a-z][a-z0-9_]*$/;
const TYPE_OPTIONS = PLAIN_TYPES.map((t) => ({ id: t.id, label: t.id }));

const EXAMPLE_SQL = `CREATE TABLE retail_sales.returns (
  return_date DATE,
  reason VARCHAR(64),
  return_id BIGINT,
  order_id BIGINT,
  amount DECIMAL(12,2)
)
UNIQUE KEY (return_id)
DISTRIBUTED BY HASH(return_id) BUCKETS 10;`;

export const CreateTableWizard: React.FC<{
  databases: string[];
  existingNames: string[];
  onCancel: () => void;
  onCreate: (t: NewTableInput) => void;
}> = ({ databases, existingNames, onCancel, onCreate }) => {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'form' | 'sql'>('form');
  const [database, setDatabase] = useState(databases[0]);
  const [name, setName] = useState('');
  const [columns, setColumns] = useState<DraftColumn[]>([
    { name: '', type: 'Big whole number' },
    { name: '', type: 'Text' },
  ]);
  const [sql, setSql] = useState('');
  const [sqlNotice, setSqlNotice] = useState<string | null>(null);
  // The starter statement written when switching to SQL; if it's untouched, going back changes nothing.
  const [scaffold, setScaffold] = useState<string | null>(null);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [rowMode, setRowMode] = useState<RowMode | null>(null);
  const [keys, setKeys] = useState<string[]>([]);
  const [prefilledFrom, setPrefilledFrom] = useState<string | null>(null);
  const [splitOn, setSplitOn] = useState(false);
  const [splitCol, setSplitCol] = useState<string | null>(null);

  const cleanCols = columns.filter((c) => c.name.trim());
  const fullName = `${database}.${name}`;
  const nameError =
    name && !NAME_RE.test(name)
      ? 'Use lowercase letters, numbers and underscores, starting with a letter'
      : existingNames.includes(fullName)
        ? `${fullName} already exists`
        : '';
  const dupCol = cleanCols.find((c, i) => cleanCols.findIndex((x) => x.name === c.name) !== i);
  const badCol = cleanCols.find((c) => !NAME_RE.test(c.name));

  /** SQL mode: read the statement live, so the user sees what will be created as they type. */
  const parsed = useMemo(() => {
    if (!sql.trim()) return null;
    const res = parseSql(sql);
    const errors = [...res.errors];
    if (!res.tableName) errors.unshift('Start with CREATE TABLE database.table ( … )');
    else if (!res.database) errors.unshift(`Add the database, e.g. CREATE TABLE ${databases[0]}.${res.tableName}`);
    else if (!databases.includes(res.database)) errors.unshift(`There's no database called ${res.database}`);
    else if (!NAME_RE.test(res.tableName)) errors.unshift(`${res.tableName}: use lowercase letters, numbers and underscores`);
    else if (existingNames.includes(`${res.database}.${res.tableName}`)) errors.unshift(`${res.database}.${res.tableName} already exists`);
    return { ...res, errors };
  }, [sql, databases, existingNames]);

  /** Copy what the SQL says into the shared fields, and pre-fill step 2 if it states row handling or a split. */
  const applyParsed = () => {
    if (!parsed || parsed.errors.length) return false;
    setDatabase(parsed.database!);
    setName(parsed.tableName!);
    setColumns(parsed.columns);
    setIgnored(parsed.ignored);
    if (parsed.rowMode) {
      setRowMode(parsed.rowMode);
      setKeys((parsed.keyColumns ?? []).filter((k) => parsed.columns.some((c) => c.name === k)));
      setPrefilledFrom(parsed.keyClause ?? null);
    }
    if (parsed.splitBy) {
      setSplitOn(true);
      setSplitCol(parsed.splitBy);
    }
    return true;
  };

  const toSql = () => {
    const body = cleanCols.length ? columnsToSql(cleanCols).split('\n').map((l) => `  ${l}`).join('\n') : '  column_name BIGINT';
    const statement = `CREATE TABLE ${database}.${name || 'table_name'} (\n${body}\n);`;
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

  // Doris: a table whose rows get replaced can only be split by one of its identifying columns.
  const splitOptions = cleanCols.filter((c) => isDateType(c.type) && (rowMode !== 'replace' || keys.includes(c.name)));
  const effectiveSplit = splitOn && splitCol && splitOptions.some((c) => c.name === splitCol) ? splitCol : null;

  const step1Valid =
    mode === 'sql'
      ? !!parsed && parsed.errors.length === 0
      : NAME_RE.test(name) && !existingNames.includes(fullName) && cleanCols.length > 0 && !dupCol && !badCol;
  const step2Valid = (rowMode === 'add' || (rowMode === 'replace' && keys.length > 0)) && (!splitOn || !!effectiveSplit);

  const next = () => {
    if (step === 0) {
      if (mode === 'sql') {
        if (!applyParsed()) return;
      } else {
        setIgnored([]);
        setKeys((k) => k.filter((x) => cleanCols.some((c) => c.name === x)));
      }
    }
    setStep((s) => s + 1);
  };

  const built = useMemo(
    () => (rowMode ? buildCreateSql(database, name, cleanCols, rowMode, keys, effectiveSplit) : null),
    [database, name, cleanCols, rowMode, keys, effectiveSplit],
  );

  const footer = (
    <ModalFooter
      tertiaryAction={
        <Button variant="tertiary" onClick={onCancel}>
          Cancel
        </Button>
      }
      secondaryAction={
        step > 0 ? (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : undefined
      }
      primaryAction={
        step < 2 ? (
          <Button variant="primary" disabled={step === 0 ? !step1Valid : !step2Valid} onClick={next}>
            Next: {STEPS[step + 1].title}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() =>
              onCreate({ database, name, columns: cleanCols, mode: rowMode!, keys: rowMode === 'replace' ? keys : [], splitBy: effectiveSplit })
            }
          >
            Create table
          </Button>
        )
      }
    />
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

            <Horizontal gap={spacing.D} align="start">
              <div className={styles.dbField}>
                <Select label="Database" options={databases.map((d) => ({ id: d, label: d }))} value={database} onChange={setDatabase} fullWidth />
              </div>
              <div className={styles.grow}>
                <TextInput
                  label="Table name"
                  placeholder="e.g. returns"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase())}
                  error={!!nameError}
                  errorMessage={nameError}
                />
              </div>
            </Horizontal>

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
          </Vertical>
        )}

        {step === 0 && mode === 'sql' && (
          <Vertical gap={spacing.D}>
            <Horizontal justify="space-between" align="center">
              <Typography variant="body-normal" color="gray-light" noMargin>
                Write or paste a CREATE TABLE statement, including the database.
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
              placeholder={'CREATE TABLE retail_sales.returns (\n  return_id BIGINT,\n  return_date DATE,\n  amount DECIMAL(12,2)\n);'}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className={styles.sqlInput}
            />
            {!parsed ? (
              <Horizontal gap={spacing.B} align="center" wrap>
                <Typography variant="footnote" color="gray-light" noMargin>
                  If it says how rows are handled or how the table is split, we&apos;ll fill that in for the next step.
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
                  Will create <b>{parsed.database}.{parsed.tableName}</b> with {parsed.columns.length}{' '}
                  {parsed.columns.length === 1 ? 'column' : 'columns'}
                  {parsed.rowMode ? '. Row handling found, so the next step is pre-filled.' : '.'}
                </Typography>
              </div>
            )}
          </Vertical>
        )}

        {/* ---------- Step 2: row handling ---------- */}
        {step === 1 && (
          <Vertical gap={spacing.E}>
            {prefilledFrom && (
              <div className={styles.notice}>
                <Typography variant="body-normal" color="base" noMargin>
                  Filled in from your SQL: <code className={styles.inlineCode}>{prefilledFrom}</code>. Check it before you continue.
                </Typography>
              </div>
            )}

            <Vertical gap={spacing.A}>
              <Typography variant="content-label" color="base" noMargin>
                When your tool sends a row that&apos;s already in the table
              </Typography>
              <Typography variant="footnote" color="gray-light" noMargin>
                Required. This is set when the table is created and can&apos;t be changed later.
              </Typography>
            </Vertical>

            <Vertical gap={spacing.C}>
              <div className={`${styles.choice} ${rowMode === 'replace' ? styles.choiceOn : ''}`} onClick={() => setRowMode('replace')}>
                <Radio name="rowMode" value="replace" checked={rowMode === 'replace'} onChange={() => setRowMode('replace')} label="Replace the old row" />
                <Typography variant="footnote" color="gray-light" noMargin className={styles.choiceNote}>
                  For records that change, like customers, orders or accounts. The table keeps one row per record.
                </Typography>
                {rowMode === 'replace' && (
                  <div className={styles.nested} onClick={(e) => e.stopPropagation()}>
                    <Typography variant="content-label-subhead" color="base" noMargin>
                      Which column(s) identify a record?
                    </Typography>
                    <Typography variant="footnote" color="gray-light" noMargin>
                      Rows with the same value here count as the same record. Usually an ID.
                    </Typography>
                    <div className={styles.keyGrid}>
                      {cleanCols.map((c) => (
                        <Checkbox
                          key={c.name}
                          label={`${c.name} · ${c.type}`}
                          checked={keys.includes(c.name)}
                          onChange={(on) => setKeys((k) => (on ? [...k, c.name] : k.filter((x) => x !== c.name)))}
                        />
                      ))}
                    </div>
                    {keys.length === 0 && (
                      <Typography variant="footnote" color="failure" noMargin>
                        Pick at least one column.
                      </Typography>
                    )}
                  </div>
                )}
              </div>
              <div className={`${styles.choice} ${rowMode === 'add' ? styles.choiceOn : ''}`} onClick={() => setRowMode('add')}>
                <Radio name="rowMode" value="add" checked={rowMode === 'add'} onChange={() => setRowMode('add')} label="Add it as a new row" />
                <Typography variant="footnote" color="gray-light" noMargin className={styles.choiceNote}>
                  For things that happen once, like events, clicks or log lines. Every row is kept.
                </Typography>
              </div>
            </Vertical>

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
                    Queries on recent data only read the months they need. Worth it for large tables that grow over time. Can&apos;t be
                    changed later.
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
                        {rowMode === 'replace'
                          ? 'To split a table whose rows get replaced, the date column must also identify a record.'
                          : 'This table has no date column to split by.'}
                      </Typography>
                    ))}
                </Vertical>
              </Accordion.Item>
            </Accordion>
          </Vertical>
        )}

        {/* ---------- Step 3: review ---------- */}
        {step === 2 && built && (
          <Vertical gap={spacing.E}>
            <div className={styles.summary}>
              <Vertical gap={spacing.C}>
                <KeyValue label="Table">{fullName}</KeyValue>
                <KeyValue label="Columns">
                  {cleanCols.length} · {cleanCols.map((c) => c.name).join(', ')}
                </KeyValue>
                <KeyValue label="Row handling">
                  {rowMode === 'replace' ? `Replace the old row when ${keys.join(' + ')} matches` : 'Add every row'}
                </KeyValue>
                <KeyValue label="Split by date">{effectiveSplit ? `By month, on ${effectiveSplit}` : 'No'}</KeyValue>
                <KeyValue label="After it's created">Empty until your pipeline sends its first load</KeyValue>
              </Vertical>
            </div>
            {built.reordered.length > 0 && (
              <Typography variant="footnote" color="gray-light" noMargin>
                {built.reordered.join(', ')} will be moved to the start of the table. Identifying columns have to come first.
              </Typography>
            )}
            <Accordion variant="bordered">
              <Accordion.Item title="SQL that will run" subtitle="For data engineers">
                <Vertical gap={spacing.B}>
                  <CodeBlock>{built.sql}</CodeBlock>
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
