import React, { useEffect, useRef, useState } from 'react';
import { ActionMenu, ActionMenuItem, Button, Checkbox, Horizontal, Icon, Link, Table, Tabs, Typography, Vertical } from '@/components';
import type { EditorView } from '@codemirror/view';
import { spacing } from '@tokens/spacing';
import { Column, Database, DbObject, Identity, Role, SqlWorkspace } from '../types';
import { executeSql, formatSql, keywordCase, lineAt, LIMIT, splitStatements, SqlResult } from '../sqlEngine';
import { addTab, closeTab, deleteQuery, editQuery, openPreview, openQuery, recordRun, titleOf, togglePin } from '../sqlWorkspace';
import { SqlCatalog } from './SqlCatalog';
import { SqlRecent } from './SqlRecent';
import { AgentPanel } from './AgentPanel';
import { SqlEditor } from './SqlEditor';
import styles from '../v5.module.css';

/** Tabs shown before the rest go into the overflow menu. */
const MAX_TABS = 5;

/**
 * SQL: the workbench (Vivek, 26 Oct; approach A from ~/agentdb-data-store/sql-workbench.html).
 * Left: Catalog | Recent. Middle: query tabs, a toolbar above the editor, the result below.
 * Second pass the same day: the whole screen, CodeMirror, bars and tones (ClickHouse console).
 * Right: the agent. All three open. A tab is a window onto a query: queries save as you type and
 * stay in Recent until deleted; tabs come back next visit. The result shows rows, a done message
 * with next steps, or the error with its line. Reverses 19 Oct (no catalog, no recent runs).
 */
export const SqlPage: React.FC<{
  databases: Database[];
  objects: DbObject[];
  role: Role;
  me: string;
  workspace: SqlWorkspace;
  onWorkspace: React.Dispatch<React.SetStateAction<SqlWorkspace>>;
  runOnOpen: string | null;
  onRunOnOpen: (id: string | null) => void;
  onCreateObject: (o: DbObject) => void;
  onAddColumn: (id: string, col: Column) => void;
  onDropObject: (id: string) => void;
  onTruncate: (id: string) => void;
  identities: Identity[];
  onOpenObject: (id: string) => void;
  onOpenIngestion: (database: string, table: string) => void;
  toast: (m: string) => void;
}> = (props) => {
  const { databases, objects, workspace: ws, onWorkspace, toast } = props;
  // No database picker (Vivek, 27 Oct): the catalog shows every database, names go in qualified.
  const catalogDb = 'all';
  const [railTab, setRailTab] = useState('catalog');
  const [limit, setLimit] = useState(true);
  const [results, setResults] = useState<Record<string, SqlResult>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [menuKey, setMenuKey] = useState(0);
  const [agentOpen, setAgentOpen] = useState(() => {
    try {
      return localStorage.getItem('agentdb-v5-agent') !== 'closed';
    } catch {
      return true;
    }
  });
  const toggleAgent = (open: boolean) => {
    setAgentOpen(open);
    try {
      localStorage.setItem('agentdb-v5-agent', open ? 'open' : 'closed');
    } catch {
      /* storage unavailable */
    }
  };
  const view = useRef<EditorView | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const active = ws.queries.find((q) => q.id === ws.active) ?? ws.queries[0];
  const sql = active?.sql ?? '';
  const result = active ? results[active.id] : undefined;
  const bump = () => setMenuKey((n) => n + 1);

  /** Click or ▸ Insert from the catalog: the text goes in at the cursor. */
  const insert = (text: string) => {
    if (!active) return;
    const v = view.current;
    if (!v) return onWorkspace((w) => editQuery(w, active.id, sql + text));
    v.dispatch(v.state.replaceSelection(text));
    v.focus();
  };

  /**
   * Run: the selection if there is one, else the statement under the cursor (Cmd+Enter). Run all
   * runs every statement and stops at the first failure, naming its line.
   */
  const run = (mode: 'cursor' | 'all', id = active?.id) => {
    const q = ws.queries.find((x) => x.id === id);
    if (!q || running) return;
    const v = view.current;
    const stmts = splitStatements(q.sql);
    let targets = stmts;
    if (mode === 'cursor' && v && id === active?.id) {
      const { from: s, to: e } = v.state.selection.main;
      if (e > s && q.sql.slice(s, e).trim()) targets = [{ text: q.sql.slice(s, e), start: s, end: e }];
      else targets = [stmts.find((x) => s >= x.start && s <= x.end + 1) ?? stmts[stmts.length - 1]].filter(Boolean);
    }
    setRunning(q.id);
    timer.current = window.setTimeout(() => {
      const ctx = { ...props, database: catalogDb === 'all' ? null : catalogDb, limit };
      let r: SqlResult = { kind: 'message', ok: false, text: 'Nothing to run.' };
      for (const t of targets) {
        r = executeSql(t.text, ctx);
        if (r.kind === 'message' && !r.ok) {
          r = { ...r, line: lineAt(q.sql, t.start) };
          break;
        }
      }
      if (targets.length > 1 && (r.kind === 'rows' || r.ok)) {
        r = r.kind === 'rows' ? { ...r, meta: `${targets.length} statements · ${r.meta}` } : { ...r, text: `${targets.length} statements run. ${r.text}` };
      }
      const okRun = r.kind === 'rows' || r.ok;
      setResults((p) => ({ ...p, [q.id]: r }));
      onWorkspace((w) => recordRun(w, q.id, okRun));
      setRunning(null);
    }, 600);
  };

  const stop = () => {
    if (timer.current) window.clearTimeout(timer.current);
    if (running) setResults((p) => ({ ...p, [running]: { kind: 'message', ok: false, text: 'Stopped.' } }));
    setRunning(null);
  };

  // ▶ in the catalog opens its query in the preview tab and runs it at once.
  useEffect(() => {
    if (props.runOnOpen && ws.active === props.runOnOpen) {
      run('all', props.runOnOpen);
      props.onRunOnOpen(null);
    }
  });

  const preview = (o: DbObject) => {
    const [next, id] = openPreview(ws, `SELECT *\nFROM ${o.database}.${o.name}\nLIMIT 100;`);
    onWorkspace(next);
    props.onRunOnOpen(id);
  };

  // Tabs that don't fit go into the overflow menu; the active one always stays in view.
  let shown = ws.open.slice(0, MAX_TABS);
  if (!shown.includes(ws.active) && ws.open.includes(ws.active)) shown = [...shown.slice(0, MAX_TABS - 1), ws.active];
  const hidden = ws.open.filter((id) => !shown.includes(id));
  const byId = (id: string) => ws.queries.find((q) => q.id === id);

  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    toast(`${what} copied`);
  };
  const csv = (r: Extract<SqlResult, { kind: 'rows' }>) => [r.columns.join(','), ...r.rows.map((row) => r.columns.map((c) => row[c]).join(','))].join('\n');

  return (
    <div className={[styles.bench, !agentOpen && styles.benchNoAgent].filter(Boolean).join(' ')}>
      {/* Left: the database, then Catalog | Recent. */}
      <aside className={styles.benchRail} aria-label="Catalog and recent queries">
        <Tabs
          className={styles.railTabs}
          tabs={[
            { id: 'catalog', label: 'Catalog' },
            { id: 'recent', label: 'Recent' },
          ]}
          activeTab={railTab}
          onTabChange={setRailTab}
        />
        <div className={styles.railBody}>
          {railTab === 'catalog' ? (
            <SqlCatalog
              databases={databases}
              objects={objects}
              database={catalogDb}
              onInsert={insert}
              onPreview={preview}
              onInsertSelect={(o) => insert(`SELECT *\nFROM ${catalogDb === 'all' ? `${o.database}.` : ''}${o.name}\nLIMIT 100;`)}
              onOpenObject={props.onOpenObject}
            />
          ) : (
            <SqlRecent
              queries={ws.queries}
              active={ws.active}
              onOpen={(id) => onWorkspace((w) => openQuery(w, id))}
              onPin={(id) => onWorkspace((w) => togglePin(w, id))}
              onDelete={(id) => {
                onWorkspace((w) => deleteQuery(w, id));
                toast('Query deleted');
              }}
            />
          )}
        </div>
      </aside>

      {/* Middle: tabs, the toolbar, the editor, the result. */}
      <section className={styles.benchCenter} aria-label="Query">
        <div className={styles.qtabs} role="tablist">
          {shown.map((id) => {
            const q = byId(id);
            if (!q) return null;
            const isActive = id === ws.active;
            return (
              <div
                key={id}
                role="tab"
                tabIndex={0}
                aria-selected={isActive}
                className={[styles.qtab, isActive && styles.qtabActive, ws.preview === id && styles.qtabPreview].filter(Boolean).join(' ')}
                onClick={() => onWorkspace((w) => ({ ...w, active: id }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onWorkspace((w) => ({ ...w, active: id }));
                }}
                title={q.sql || 'New query'}
              >
                {q.status === 'failed' && <Icon name="exclamation-point-circle" size="s" color="var(--rd-sys-color-content-failure)" aria-label="Failed" />}
                <span className={styles.qtabTitle}>
                  <Typography variant="footnote" color={isActive ? 'base' : 'gray-light'} noMargin>
                    {titleOf(q)}
                  </Typography>
                </span>
                <span className={styles.qtabClose}>
                  <Button
                    variant="tertiary"
                    size="small"
                    iconOnly
                    icon="cross"
                    aria-label={`Close ${titleOf(q)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onWorkspace((w) => closeTab(w, id));
                    }}
                  >
                    Close
                  </Button>
                </span>
              </div>
            );
          })}
          <div className={styles.qtabsEnd}>
            <Button variant="tertiary" size="small" iconOnly icon="plus" aria-label="New query" onClick={() => onWorkspace((w) => addTab(w))}>
              New query
            </Button>
            {hidden.length > 0 && (
              <ActionMenu
                key={`more-tabs-${menuKey}`}
                placement="bottom-end"
                trigger={
                  <Button variant="tertiary" size="small" icon="chevron-down">
                    {`+${hidden.length}`}
                  </Button>
                }
              >
                {hidden.map((id) => (
                  <ActionMenuItem
                    key={id}
                    label={byId(id) ? titleOf(byId(id)!) : id}
                    onClick={() => {
                      onWorkspace((w) => ({ ...w, active: id }));
                      bump();
                    }}
                  />
                ))}
              </ActionMenu>
            )}
          </div>
          {!agentOpen && (
            <div className={styles.qtabsAgent}>
              <Button variant="tertiary" size="small" icon="ai" onClick={() => toggleAgent(true)}>
                Agent
              </Button>
            </div>
          )}
        </div>

        {/* One row: Run first, then the limit and Format; the rest in ⋯ on the right (Vivek, 27 Oct). */}
        <div className={styles.bar}>
          {running === active?.id ? (
            <Button variant="secondary" size="small" icon="pause" onClick={stop}>
              Stop
            </Button>
          ) : (
            <Button variant="primary" size="small" icon="play" onClick={() => run('cursor')} disabled={!sql.trim() || !!running} title="Runs the statement under the cursor, or the selection. Cmd+Enter">
              Run
            </Button>
          )}
          <Checkbox label={`Limit ${LIMIT.toLocaleString()}`} checked={limit} onChange={setLimit} />
          <span className={styles.splitButton}>
            <Button variant="tertiary" size="small" onClick={() => active && onWorkspace((w) => editQuery(w, active.id, formatSql(sql)))} disabled={!sql.trim()}>
              Format
            </Button>
            <ActionMenu
              key={`fmt-${menuKey}`}
              placement="bottom-start"
              trigger={
                <Button variant="tertiary" size="small" iconOnly icon="chevron-down" aria-label="Format options" disabled={!sql.trim()}>
                  Format options
                </Button>
              }
            >
              <ActionMenuItem
                label="Format SQL"
                onClick={() => {
                  if (active) onWorkspace((w) => editQuery(w, active.id, formatSql(sql)));
                  bump();
                }}
              />
              <ActionMenuItem
                label="Uppercase keywords"
                onClick={() => {
                  if (active) onWorkspace((w) => editQuery(w, active.id, keywordCase(sql, true)));
                  bump();
                }}
              />
              <ActionMenuItem
                label="Lowercase keywords"
                onClick={() => {
                  if (active) onWorkspace((w) => editQuery(w, active.id, keywordCase(sql, false)));
                  bump();
                }}
              />
            </ActionMenu>
          </span>
          <span className={styles.grow} />
          <ActionMenu
            key={`tab-${menuKey}`}
            placement="bottom-end"
            trigger={
              <Button variant="tertiary" size="small" iconOnly icon="more" aria-label="More for this query">
                More
              </Button>
            }
          >
            <ActionMenuItem
              label="Run all statements"
              onClick={() => {
                run('all');
                bump();
              }}
            />
            <ActionMenuItem
              label={active?.pinned ? 'Unpin' : 'Pin'}
              onClick={() => {
                if (active) onWorkspace((w) => togglePin(w, active.id));
                bump();
              }}
            />
            <ActionMenuItem
              label="Copy SQL"
              onClick={() => {
                copy(sql, 'SQL');
                bump();
              }}
            />
            <ActionMenuItem
              label="Delete query"
              destructive
              onClick={() => {
                if (active) onWorkspace((w) => deleteQuery(w, active.id));
                toast('Query deleted');
                bump();
              }}
            />
          </ActionMenu>
        </div>

        <div className={styles.benchEditor}>
          <SqlEditor
            key={active?.id}
            value={sql}
            onChange={(v) => active && onWorkspace((w) => editQuery(w, active.id, v))}
            onRun={() => run('cursor')}
            databases={databases}
            objects={objects}
            database={catalogDb}
            onView={(v) => (view.current = v)}
          />
        </div>

        <div className={styles.benchResult}>
          <div className={styles.resultBar}>
            {running === active?.id ? (
              <Typography variant="footnote" color="gray-light" noMargin>
                Running…
              </Typography>
            ) : result?.kind === 'rows' ? (
              <Typography variant="footnote" color="gray-light" noMargin>
                {result.meta}
              </Typography>
            ) : result?.kind === 'message' ? (
              <Typography variant="footnote" color={result.ok ? 'gray-light' : 'failure'} noMargin>
                {result.ok ? 'Done' : 'Failed'}
              </Typography>
            ) : (
              <Typography variant="footnote" color="gray-light" noMargin>
                Result
              </Typography>
            )}
            <span className={styles.grow} />
            {running !== active?.id && result?.kind === 'rows' && result.rows.length > 0 && (
              <>
                <Button variant="tertiary" size="small" iconOnly icon="copy" aria-label="Copy result" title="Copy result" onClick={() => copy(csv(result), 'Result')}>
                  Copy
                </Button>
                <Button variant="tertiary" size="small" iconOnly icon="download" aria-label="Download CSV" title="Download CSV" onClick={() => toast('CSV downloaded')}>
                  CSV
                </Button>
              </>
            )}
          </div>
          <div className={styles.benchResultBody}>
            {running === active?.id ? null : !result ? (
              <div className={styles.resultEmpty}>
                <Typography variant="body-normal" color="gray-light" noMargin>
                  Cmd+Enter runs the statement under the cursor.
                </Typography>
              </div>
            ) : result.kind === 'message' ? (
              <div className={styles.resultMessage}>
                <Icon name={result.ok ? 'checkmark-circle' : 'exclamation-point-circle'} size="s" color={result.ok ? 'var(--rd-sys-color-content-success)' : 'var(--rd-sys-color-content-failure)'} aria-hidden />
                <Vertical gap={spacing.B}>
                  <Typography variant="body-normal" color={result.ok ? 'base' : 'failure'} noMargin>
                    {result.line ? `Line ${result.line}: ${result.text}` : result.text}
                  </Typography>
                  {result.created && (
                    <Horizontal gap={spacing.D} align="center">
                      <Link href="#" onClick={(e) => { e.preventDefault(); props.onOpenObject(result.created!.id); }}>
                        Open {result.created.name}
                      </Link>
                      <Link href="#" onClick={(e) => { e.preventDefault(); props.onOpenIngestion(result.created!.database, result.created!.name); }}>
                        Load instructions
                      </Link>
                    </Horizontal>
                  )}
                </Vertical>
              </div>
            ) : result.rows.length === 0 ? (
              <div className={styles.resultEmpty}>
                <Typography variant="body-normal" color="gray-light" noMargin>
                  No rows.
                </Typography>
              </div>
            ) : (
              <Table
                compact
                rowKey="_i"
                data={result.rows.map((r, i) => ({ ...r, '#': String(i + 1) }))}
                columns={[{ key: '#', label: '#', width: 'var(--spacing-12)' }, ...result.columns.map((c) => ({ key: c, label: c }))]}
              />
            )}
          </div>
          {running !== active?.id && result?.kind === 'rows' && result.rows.length > 0 && (
            <div className={styles.resultFoot}>
              <Typography variant="footnote" color="gray-light" noMargin>
                {`${result.rows.length} ${result.rows.length === 1 ? 'row' : 'rows'} shown`}
              </Typography>
            </div>
          )}
        </div>
      </section>

      {/* Right: the agent, open by default. */}
      {agentOpen && <AgentPanel toast={toast} onCollapse={() => toggleAgent(false)} />}

    </div>
  );
};
