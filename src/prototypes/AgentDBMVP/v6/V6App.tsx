import React, { useEffect, useRef, useState } from 'react';
import { CURRENT_USER, PEOPLE } from '../data';
import { Person } from '../types';
import { RoleContext, Variant } from '../variant';
import { FloatingToast } from '../components/primitives';
import { AppState, Column, DbObject, Identity, IdentityType, Role, SqlWorkspace, V3Page } from './types';
import { Sample, sampleFor, sqlWorkspaceFor } from './data';
import { addTab, openPreview } from './sqlWorkspace';
import { applyStyle, loadStyle, saveStyle, UI_STYLES, UiStyle } from './uiStyle';

/** Show the UI style brush and generator. Off: v5 uses Precision instrument (Vivek, 27 Oct). */
const STYLE_PICKER = false;
import { StylePanel } from './components/StylePanel';
import { LoginPage } from './components/LoginPage';
import { NavStyle, ProtoMenu, V6Shell } from './components/V6Shell';
import { DataPage } from './components/DataPage';
import { SqlPage } from './components/SqlPage';
import { ActivityPage } from './components/ActivityPage';
import { ConnectPage } from './components/ConnectPage';
import { KeysPage } from './components/KeysPage';
import { AccessPage } from './components/AccessPage';

/**
 * Live mode (27 Oct, the demo): the console reads its data from the demo's state file through
 * `agentdb serve`, and writes local changes back, so the terminal and the browser see one database.
 * On with ?live=1 or the gear menu. Nothing else changes.
 */
const LIVE_URL = 'http://localhost:7781/state';

/** Data lands on the first database; there is no account above the databases (Vivek, 15 Oct). */
const firstDatabase = (s: Sample): string => (s.databases[0] ? `db:${s.databases[0].id}` : '');

/**
 * The seven key flows of the happy journey (Vivek, 19 Oct), each opened from the project home at
 * its first screen: /playground/AgentDBMVP?flow=<id>.
 */
type Start = { appState: AppState; signedIn: boolean; page: V3Page; selection?: string; connectTab?: string };
const flowStart = (flow: string | null): Start => {
  const base: Start = { appState: 'filled', signedIn: true, page: 'data' };
  switch (flow) {
    case 'login':
      return { ...base, appState: 'empty', signedIn: false };
    case 'create-table':
      return { ...base, appState: 'empty', page: 'sql' };
    case 'view-table':
      return { ...base, selection: 'db:acme_retail' };
    case 'query-table':
      return { ...base, page: 'sql' };
    case 'etl':
      return { ...base, appState: 'empty', page: 'keys' };
    case 'bi':
      return { ...base, page: 'connect', connectTab: 'bi' };
    case 'invite':
      return { ...base, page: 'access' };
    default:
      return base;
  }
};

/**
 * v6 (27 Oct 2026): v5 as shipped, plus the demo's Live mode and, next, the agent-first additions
 * (empty state for agents and humans, connected agents, envelopes on keys, tasks in Queries, usage on Data).
 * v3 (14 Oct 2026): v1 as the base plus the design document. Own shell, own data model.
 */
export const V6App: React.FC<{ variant: Variant; onVariantChange: (v: Variant) => void }> = ({ variant, onVariantChange }) => {
  // A key flow from the project home starts here (?flow=…); otherwise the filled workspace on Data.
  const [start] = useState(() => flowStart(new URLSearchParams(window.location.search).get('flow')));
  const [appState, setAppState] = useState<AppState>(start.appState);
  const [role, setRole] = useState<Role>('Admin');
  // Lands signed in (Vivek, 14 Oct). Sign out from the avatar menu to walk the sign-in flow.
  const [signedIn, setSignedIn] = useState(start.signedIn);
  const [page, setPage] = useState<V3Page>(start.page);
  const [data, setData] = useState<Sample>(() => sampleFor(start.appState));
  const [selection, setSelection] = useState(() => start.selection ?? firstDatabase(sampleFor(start.appState)));
  // SQL tabs and Recent live here so they come back when you return to SQL (Vivek, 26 Oct).
  const [sqlWs, setSqlWs] = useState<SqlWorkspace>(() => sqlWorkspaceFor(start.appState));
  // ▶ in the catalog opens a query that runs at once.
  const [runOnOpen, setRunOnOpen] = useState<string | null>(null);
  // A table's Load data opens Connect › Ingestion with it ticked.
  const [ingestFor, setIngestFor] = useState<{ database: string; table: string } | null>(null);
  const openIngestion = (database: string, table: string) => {
    setIngestFor({ database, table });
    setPage('connect');
  };
  const [toast, setToast] = useState<string | null>(null);
  const [live, setLive] = useState(() => new URLSearchParams(window.location.search).get('live') === '1');
  const lastRemote = useRef('');
  // Bumped on every local change, so a poll that was in flight when the console changed something
  // cannot overwrite that change with a stale answer.
  const localVersion = useRef(0);
  useEffect(() => {
    if (!live) return;
    let stopped = false;
    const tick = async () => {
      const started = localVersion.current;
      try {
        const r = await fetch(`${LIVE_URL}?t=${Date.now()}`);
        if (!r.ok) return;
        const txt = await r.text();
        if (stopped || started !== localVersion.current || txt === lastRemote.current) return;
        lastRemote.current = txt;
        setData(JSON.parse(txt));
      } catch {
        // The demo server isn't running: keep what is on screen.
      }
    };
    tick();
    const h = window.setInterval(tick, 1000);
    return () => {
      stopped = true;
      window.clearInterval(h);
    };
  }, [live]);
  // A change made in the console (a key, a deleted table) goes back to the file, so the terminal sees it.
  useEffect(() => {
    if (!live || !lastRemote.current) return;
    const txt = JSON.stringify(data, null, 2);
    if (txt === lastRemote.current) return;
    lastRemote.current = txt;
    localVersion.current += 1;
    fetch(LIVE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: txt }).catch(() => undefined);
  }, [live, data]);
  // The UI style restyles Radiant while v5 is open (Vivek, 26 Oct). Locked to Precision instrument and the
  // brush button hidden (Vivek, 27 Oct); STYLE_PICKER brings the generator back.
  const [uiStyle, setUiStyle] = useState<UiStyle>(() => (STYLE_PICKER ? loadStyle() : UI_STYLES.find((u) => u.id === 'instrument')!));
  // Icons only (Vivek, 27 Oct): the gear's Navigation setting is gone. V6Shell keeps option 1 ('labels').
  const navStyle: NavStyle = 'icons';

  useEffect(() => {
    if (STYLE_PICKER) saveStyle(uiStyle);
    return applyStyle(uiStyle);
  }, [uiStyle]);

  const me = CURRENT_USER[role];
  const email = PEOPLE.find((p) => p.name === me)?.email ?? '';

  /** Switching the workspace state resets the data and lands on Data, still signed in. */
  const changeState = (s: AppState) => {
    setLive(false);
    lastRemote.current = '';
    const sample = sampleFor(s);
    setAppState(s);
    setData(sample);
    setSelection(firstDatabase(sample));
    setPage('data');
    setSqlWs(sqlWorkspaceFor(s));
  };

  const patchObjects = (fn: (o: DbObject[]) => DbObject[]) => setData((d) => ({ ...d, objects: fn(d.objects) }));

  /** From another page: a query to look at opens in the preview tab; none opens a new empty query. */
  const openSql = (_database: string, sql = '') => {
    setSqlWs((ws) => (sql ? openPreview(ws, sql)[0] : addTab(ws)));
    setPage('sql');
  };

  const addColumn = (id: string, col: Column) => patchObjects((os) => os.map((o) => (o.id === id ? { ...o, columns: [...o.columns, col] } : o)));
  const emptyObject = (id: string) => {
    patchObjects((os) => os.map((o) => (o.id === id ? { ...o, rows: 0, sizeGB: 0, lastUpdated: 'Just now' } : o)));
    setToast('Table emptied');
  };
  const deleteObject = (id: string) => {
    const name = data.objects.find((o) => o.id === id)?.name;
    patchObjects((os) => os.filter((o) => o.id !== id));
    if (name) setToast(`${name} deleted`);
  };

  const createIdentity = (name: string, type: IdentityType, expires?: string, secret?: string) =>
    setData((d) => ({ ...d, identities: [...d.identities, { id: `i_${Date.now()}`, name, type, createdBy: me, createdOn: 'Today', lastUsed: 'Never', expires, secret }] }));
  const updateIdentity = (id: string, patch: Partial<Identity>) => setData((d) => ({ ...d, identities: d.identities.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const updatePerson = (id: string, patch: Partial<Person>) => setData((d) => ({ ...d, people: d.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const controls = (
    <>
      {STYLE_PICKER && <StylePanel value={uiStyle} onChange={setUiStyle} />}
      <ProtoMenu variant={variant} onVariantChange={onVariantChange} appState={appState} onAppStateChange={changeState} role={role} onRoleChange={setRole} live={live} onLiveChange={setLive} />
    </>
  );

  if (!signedIn) {
    return <LoginPage firstTime={appState === 'empty'} suggestedEmail={email} onSignedIn={() => setSignedIn(true)} controls={controls} />;
  }

  return (
    <RoleContext.Provider value={role}>
      <V6Shell page={page} onNavigate={(p) => { setIngestFor(null); setPage(p); }} me={me} onSignOut={() => setSignedIn(false)} onDocs={() => setToast('Opens the documentation')} controls={controls} navStyle={navStyle}>
        {page === 'data' && (
          <DataPage
            databases={data.databases}
            objects={data.objects}
            loads={data.loads}
            identities={data.identities}
            queries24h={data.queries24h}
            selection={selection}
            onSelect={setSelection}
            role={role}
            onOpenSql={openSql}
            onDeleteDatabase={(id) => {
              const rest = data.databases.filter((x) => x.id !== id);
              setData((d) => ({ ...d, databases: d.databases.filter((x) => x.id !== id) }));
              setSelection(rest[0] ? `db:${rest[0].id}` : '');
              setToast(`${id} deleted`);
            }}
            onEmptyObject={emptyObject}
            onDeleteObject={deleteObject}
            toast={setToast}
            onNavigate={setPage}
            onOpenIngestion={openIngestion}
          />
        )}
        {page === 'sql' && (
          <SqlPage
            databases={data.databases}
            objects={data.objects}
            role={role}
            me={me}
            workspace={sqlWs}
            onWorkspace={setSqlWs}
            runOnOpen={runOnOpen}
            onRunOnOpen={setRunOnOpen}
            onCreateObject={(o) => patchObjects((os) => [...os, o])}
            onAddColumn={addColumn}
            onDropObject={(id) => patchObjects((os) => os.filter((o) => o.id !== id))}
            onTruncate={(id) => patchObjects((os) => os.map((o) => (o.id === id ? { ...o, rows: 0, sizeGB: 0, lastUpdated: 'Just now' } : o)))}
            identities={data.identities}
            onOpenObject={(id) => {
              setSelection(`obj:${id}`);
              setPage('data');
            }}
            onOpenIngestion={openIngestion}
            toast={setToast}
          />
        )}
        {page === 'activity' && (
          <ActivityPage
            queries={data.queries}
            loads={data.loads}
            objects={data.objects}
            role={role}
            queries24h={data.queries24h}
            onStop={(id) => {
              setData((d) => ({
                ...d,
                queries: d.queries.map((q) =>
                  q.id === id ? { ...q, status: 'Stopped', endedAt: 'Just now', durationMs: q.profile?.reduce((s, p) => s + p.ms, 0) || 30_000, note: `Cancelled by ${me}` } : q,
                ),
              }));
              setToast('Query cancelled');
            }}
            onOpenSql={openSql}
          />
        )}
        {page === 'connect' && <ConnectPage key={ingestFor ? `${ingestFor.database}.${ingestFor.table}` : 'connect'} databases={data.databases} objects={data.objects} identities={data.identities} onNavigate={(p) => { setIngestFor(null); setPage(p); }} toast={setToast} ingestFor={ingestFor} initialTab={ingestFor ? 'load' : start.connectTab} />}
        {page === 'keys' && (
          <KeysPage
            keys={data.identities}
            role={role}
            me={me}
            onCreate={(name, type, expires, secret) => createIdentity(name, type, expires, secret)}
            onUpdate={updateIdentity}
            onNavigate={setPage}
            toast={setToast}
          />
        )}
        {page === 'access' && (
          <AccessPage
            people={data.people}
            accounts={data.identities.filter((i) => i.type === 'Query')}
            role={role}
            me={me}
            onAddPerson={(p) => setData((d) => ({ ...d, people: [...d.people, p] }))}
            onUpdatePerson={updatePerson}
            onRemovePerson={(id) => setData((d) => ({ ...d, people: d.people.filter((p) => p.id !== id) }))}
            onCreateAccount={(name) => createIdentity(name, 'Query')}
            onUpdateAccount={updateIdentity}
            toast={setToast}
          />
        )}
        {toast && <FloatingToast message={toast} onDismiss={() => setToast(null)} />}
      </V6Shell>
    </RoleContext.Provider>
  );
};
