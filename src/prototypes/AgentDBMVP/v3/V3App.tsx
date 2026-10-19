import React, { useCallback, useState } from 'react';
import { CURRENT_USER, PEOPLE } from '../data';
import { Person } from '../types';
import { RoleContext, Variant } from '../variant';
import { FloatingToast } from '../components/primitives';
import { AppState, Column, DbObject, Identity, IdentityType, RecentRun, Role, V3Page } from './types';
import { Sample, sampleFor } from './data';
import { LoginPage } from './components/LoginPage';
import { ProtoMenu, V3Shell } from './components/V3Shell';
import { DataPage } from './components/DataPage';
import { SqlPage } from './components/SqlPage';
import { ActivityPage } from './components/ActivityPage';
import { ConnectPage } from './components/ConnectPage';
import { KeysPage } from './components/KeysPage';
import { AccessPage } from './components/AccessPage';

/** Data lands on the first database; there is no account above the databases (Vivek, 15 Oct). */
const firstDatabase = (s: Sample): string => (s.databases[0] ? `db:${s.databases[0].id}` : '');

/**
 * v3 (14 Oct 2026): v1 as the base plus the design document. Own shell, own data model.
 * Build order agreed with Vivek: version, sign-in, navigation, Data (catalog), SQL, then the rest.
 */
export const V3App: React.FC<{ variant: Variant; onVariantChange: (v: Variant) => void }> = ({ variant, onVariantChange }) => {
  const [appState, setAppState] = useState<AppState>('filled');
  const [role, setRole] = useState<Role>('Admin');
  // Lands signed in (Vivek, 14 Oct). Sign out from the avatar menu to walk the sign-in flow.
  const [signedIn, setSignedIn] = useState(true);
  const [page, setPage] = useState<V3Page>('data');
  const [data, setData] = useState<Sample>(() => sampleFor('filled'));
  const [selection, setSelection] = useState(() => firstDatabase(sampleFor('filled')));
  const [recent, setRecent] = useState<RecentRun[]>([]);
  const [prefill, setPrefill] = useState<{ database: string; sql: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const me = CURRENT_USER[role];
  const email = PEOPLE.find((p) => p.name === me)?.email ?? '';

  /** Switching the workspace state resets the data and lands on Data, still signed in. */
  const changeState = (s: AppState) => {
    const sample = sampleFor(s);
    setAppState(s);
    setData(sample);
    setSelection(firstDatabase(sample));
    setPage('data');
    setRecent([]);
    setPrefill(null);
  };

  const patchObjects = (fn: (o: DbObject[]) => DbObject[]) => setData((d) => ({ ...d, objects: fn(d.objects) }));

  const openSql = (database: string, sql = '') => {
    setPrefill({ database, sql });
    setPage('sql');
  };
  const consumePrefill = useCallback(() => setPrefill(null), []);

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

  const createIdentity = (name: string, type: IdentityType, expires?: string) =>
    setData((d) => ({ ...d, identities: [...d.identities, { id: `i_${Date.now()}`, name, type, createdBy: me, createdOn: 'Today', lastUsed: 'Never', expires }] }));
  const updateIdentity = (id: string, patch: Partial<Identity>) => setData((d) => ({ ...d, identities: d.identities.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const updatePerson = (id: string, patch: Partial<Person>) => setData((d) => ({ ...d, people: d.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const controls = (
    <ProtoMenu variant={variant} onVariantChange={onVariantChange} appState={appState} onAppStateChange={changeState} role={role} onRoleChange={setRole} />
  );

  if (!signedIn) {
    return <LoginPage firstTime={appState === 'empty'} suggestedEmail={email} onSignedIn={() => setSignedIn(true)} controls={controls} />;
  }

  return (
    <RoleContext.Provider value={role}>
      <V3Shell page={page} onNavigate={setPage} me={me} onSignOut={() => setSignedIn(false)} onDocs={() => setToast('Opens the documentation')} controls={controls}>
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
          />
        )}
        {page === 'sql' && (
          <SqlPage
            databases={data.databases}
            objects={data.objects}
            role={role}
            me={me}
            prefill={prefill}
            onConsumePrefill={consumePrefill}
            recentRuns={recent}
            onRecordRun={(r) => setRecent((prev) => [r, ...prev].slice(0, 20))}
            onCreateObject={(o) => patchObjects((os) => [...os, o])}
            onAddColumn={addColumn}
            onDropObject={(id) => patchObjects((os) => os.filter((o) => o.id !== id))}
            onTruncate={(id) => patchObjects((os) => os.map((o) => (o.id === id ? { ...o, rows: 0, sizeGB: 0, lastUpdated: 'Just now' } : o)))}
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
        {page === 'connect' && <ConnectPage databases={data.databases} objects={data.objects} identities={data.identities} onNavigate={setPage} toast={setToast} />}
        {page === 'keys' && (
          <KeysPage
            keys={data.identities.filter((i) => i.type === 'Ingest')}
            role={role}
            me={me}
            onCreate={(name, expires) => createIdentity(name, 'Ingest', expires)}
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
      </V3Shell>
    </RoleContext.Provider>
  );
};
