import React, { useState } from 'react';
import { Page, Person, QueryRecord, Role, ServiceAccount, StoreTable } from './types';
import { API_KEYS, CURRENT_USER, PEOPLE, QUERIES, SERVICE_ACCOUNTS, TABLES } from './data';
import { Shell } from './components/Shell';
import { OverviewPage } from './components/OverviewPage';
import { DataPage } from './components/DataPage';
import { TableDetailPage } from './components/TableDetailPage';
import { QueriesPage } from './components/QueriesPage';
import { SqlPage } from './components/SqlPage';
import { AccessPage } from './components/AccessPage';
import { ConnectPage } from './components/ConnectPage';
import { FloatingToast } from './components/primitives';
import { DEFAULT_VARIANT, RoleContext, tablesFor, Variant, VariantContext } from './variant';
import { CreateTableWizard, NewTableInput } from './components/CreateTableWizard';
import { V3App } from './v3/V3App';
import { V4App } from './v4/V4App';
import { V5App } from './v5/V5App';
import { V6App } from './v6/V6App';

/**
 * AgentDB MVP — a standalone SaaS console concept (28 Sep 2026; V1 scope cut 7 Oct 2026).
 * Deliberately separate from AgentDBStore and NearStore: no imports from either.
 * Two versions behind the header dropdown: v1 (7 Oct review, frozen) and v2 (the PM's plan).
 */
const AgentDBMVP: React.FC = () => {
  const [page, setPage] = useState<Page>('overview');
  const [tables, setTables] = useState<StoreTable[]>(TABLES);
  const [accounts, setAccounts] = useState<ServiceAccount[]>(SERVICE_ACCOUNTS);
  const [keys, setKeys] = useState<ServiceAccount[]>(API_KEYS);
  const [people, setPeople] = useState<Person[]>(PEOPLE);
  const [queries, setQueries] = useState<QueryRecord[]>(QUERIES);
  const [openTable, setOpenTable] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [variant, setVariant] = useState<Variant>(DEFAULT_VARIANT);
  const [role, setRole] = useState<Role>('Admin');
  const [creatingTable, setCreatingTable] = useState(false);

  // v1 is always the Admin; the role switch only exists in v2.
  const effectiveRole: Role = variant === 'v1' ? 'Admin' : role;
  const me = CURRENT_USER[effectiveRole];
  const v2 = variant === 'v2';

  const createTable = (input: NewTableInput) => {
    const id = `t_${Date.now()}`;
    setTables((prev) => [
      ...prev,
      {
        id,
        name: input.name,
        writer: { kind: 'pipeline', label: 'Not loaded yet', detail: `Created by ${me}` },
        rows: 0,
        sizeGB: 0,
        lastUpdated: '—',
        queries24h: 0,
        empty: true,
        splitBy: input.splitBy ?? undefined,
        columns: input.columns.map((c) => ({ name: c.name, type: c.type })),
      },
    ]);
    setCreatingTable(false);
    setToast(`${input.name} created`);
    openTablePage(id);
  };


  const stopQuery = (id: string) => {
    setQueries((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              status: 'Stopped',
              endedAt: '10:43:40',
              durationMs: q.profile?.reduce((s, p) => s + p.ms, 0) || 30_000,
              note: `Stopped by ${me}`,
            }
          : q,
      ),
    );
    setToast('Query stopped');
  };

  const viewTables = tablesFor(variant, tables);
  const active = viewTables.find((t) => t.id === openTable);
  const openTablePage = (id: string) => {
    setPage('data');
    setOpenTable(id);
  };
  const navigate = (p: Page) => {
    setPage(p);
    setOpenTable(null);
  };

  // v3 has its own shell, pages and data; nothing below is shared with it except the version dropdown.
  if (variant === 'v3') return <V3App variant={variant} onVariantChange={setVariant} />;
  // v4 is v3 with the visual design pass (15 Oct): same scope, different look.
  if (variant === 'v4') return <V4App variant={variant} onVariantChange={setVariant} />;
  // v5 starts as a copy of v4 (26 Oct); the team review feedback goes here.
  if (variant === 'v5') return <V5App variant={variant} onVariantChange={setVariant} />;
  // v6 is v5 as shipped plus Live mode for the demo and the agent-first additions (27 Oct).
  if (variant === 'v6') return <V6App variant={variant} onVariantChange={setVariant} />;

  return (
    <VariantContext.Provider value={variant}>
    <RoleContext.Provider value={effectiveRole}>
    <Shell
      page={page}
      onNavigate={navigate}
      variant={variant}
      onVariantChange={(v) => {
        setVariant(v);
        // Each version has its own landing page and its own set of pages.
        if (v === 'v1' && page === 'sql') navigate('overview');
        if (v === 'v2' && page === 'overview') navigate('data');
      }}
      role={effectiveRole}
      onRoleChange={setRole}
    >
      {page === 'overview' && !v2 && <OverviewPage tables={viewTables} />}
      {page === 'data' && !active && <DataPage tables={viewTables} onOpenTable={openTablePage} onCreateTable={() => setCreatingTable(true)} />}
      {page === 'data' && active && (
        <TableDetailPage
          table={active}
          onBack={() => setOpenTable(null)}
          onUpdate={(updated, message) => {
            setTables((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated, writer: x.writer } : x)));
            setToast(message);
          }}
          onDelete={(t) => {
            setTables((prev) => prev.filter((x) => x.id !== t.id));
            setOpenTable(null);
            setToast(`${t.name} deleted`);
          }}
        />
      )}
      {page === 'queries' && <QueriesPage tables={viewTables} queries={queries} onStop={stopQuery} />}
      {page === 'sql' && v2 && <SqlPage tables={viewTables} />}
      {page === 'connect' && (
        <ConnectPage
          accounts={v2 ? keys : accounts}
          people={people}
          onCreate={(a) => (v2 ? setKeys((prev) => [...prev, a]) : setAccounts((prev) => [...prev, a]))}
          onUpdate={(a) => {
            const patch = (prev: ServiceAccount[]) => prev.map((x) => (x.id === a.id ? { ...x, revoked: a.revoked, passwordSetAt: a.passwordSetAt } : x));
            if (v2) setKeys(patch);
            else setAccounts(patch);
          }}
          toast={setToast}
        />
      )}
      {page === 'access' && <AccessPage people={people} onAddPerson={(p) => setPeople((prev) => [...prev, p])} toast={setToast} />}

      {creatingTable && (
        <CreateTableWizard
          existingNames={tables.map((t) => t.name)}
          onCancel={() => setCreatingTable(false)}
          onCreate={createTable}
        />
      )}
      {toast && <FloatingToast message={toast} onDismiss={() => setToast(null)} />}
    </Shell>
    </RoleContext.Provider>
    </VariantContext.Provider>
  );
};

export default AgentDBMVP;
