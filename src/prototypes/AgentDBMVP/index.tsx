import React, { useState } from 'react';
import { Page, ServiceAccount, StoreTable } from './types';
import { SERVICE_ACCOUNTS, TABLES } from './data';
import { Shell } from './components/Shell';
import { OverviewPage } from './components/OverviewPage';
import { DataPage } from './components/DataPage';
import { TableDetailPage } from './components/TableDetailPage';
import { ActivityPage } from './components/ActivityPage';
import { UsagePage } from './components/UsagePage';
import { AccessPage } from './components/AccessPage';
import { ConnectPage } from './components/ConnectPage';
import { FloatingToast } from './components/primitives';
import { accountsFor, DEFAULT_VARIANT, tablesFor, Variant, VariantContext } from './variant';
import { CreateTableWizard, NewTableInput } from './components/CreateTableWizard';

/**
 * AgentDB MVP — a standalone SaaS console concept (28 Sep 2026).
 * Deliberately separate from AgentDBStore and NearStore: no imports from either.
 */
const AgentDBMVP: React.FC = () => {
  const [page, setPage] = useState<Page>('overview');
  const [tables, setTables] = useState<StoreTable[]>(TABLES);
  const [accounts, setAccounts] = useState<ServiceAccount[]>(SERVICE_ACCOUNTS);
  const [openTable, setOpenTable] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [variant, setVariant] = useState<Variant>(DEFAULT_VARIANT);
  const [creatingTable, setCreatingTable] = useState(false);

  const createTable = (input: NewTableInput) => {
    const id = `t_${Date.now()}`;
    // Identifying columns go first, matching the SQL the wizard showed.
    const ordered =
      input.mode === 'replace'
        ? [...input.keys.map((k) => input.columns.find((c) => c.name === k)!), ...input.columns.filter((c) => !input.keys.includes(c.name))]
        : input.columns;
    setTables((prev) => [
      ...prev,
      {
        id,
        database: input.database,
        name: input.name,
        writer: { kind: 'pipeline', label: 'Not loaded yet', detail: 'Created by Priya Nair' },
        rows: 0,
        sizeGB: 0,
        lastArrived: '—',
        empty: true,
        splitBy: input.splitBy ?? undefined,
        columns: ordered.map((c) => ({ name: c.name, type: c.type, isKey: input.keys.includes(c.name) })),
      },
    ]);
    setCreatingTable(false);
    setToast(`${input.database}.${input.name} created`);
    openTablePage(id);
  };

  const viewTables = tablesFor(variant, tables);
  const viewAccounts = accountsFor(variant, accounts);
  const active = viewTables.find((t) => t.id === openTable);
  const openTablePage = (id: string) => {
    setPage('data');
    setOpenTable(id);
  };

  return (
    <VariantContext.Provider value={variant}>
    <Shell
      page={page}
      onNavigate={(p) => {
        setPage(p);
        setOpenTable(null);
      }}
      variant={variant}
      onVariantChange={setVariant}
    >
      {page === 'overview' && <OverviewPage onNavigate={setPage} onOpenTable={openTablePage} />}
      {page === 'data' && !active && (
        <DataPage
          tables={viewTables}
          onOpenTable={openTablePage}
          onUpload={() => setToast('File upload: pick a CSV or Parquet file')}
          onCreateTable={() => setCreatingTable(true)}
        />
      )}
      {page === 'data' && active && (
        <TableDetailPage
          table={active}
          onBack={() => setOpenTable(null)}
          toast={setToast}
          onUpdate={(updated, message) => {
            setTables((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated, writer: x.writer } : x)));
            setToast(message);
          }}
          onDelete={(t) => {
            setTables((prev) => prev.filter((x) => x.id !== t.id));
            setOpenTable(null);
            setToast(`${t.database}.${t.name} deleted`);
          }}
        />
      )}
      {page === 'activity' && <ActivityPage />}
      {page === 'connect' && <ConnectPage onNavigate={setPage} toast={setToast} />}
      {page === 'access' && (
        <AccessPage
          accounts={viewAccounts}
          onCreate={(a) => setAccounts((prev) => [...prev, a])}
          onUpdate={(a) => setAccounts((prev) => prev.map((x) => (x.id === a.id ? { ...x, revoked: a.revoked, passwordSetAt: a.passwordSetAt } : x)))}
          toast={setToast}
        />
      )}
      {page === 'usage' && <UsagePage toast={setToast} />}

      {creatingTable && (
        <CreateTableWizard
          databases={[...new Set(tables.map((t) => t.database))]}
          existingNames={tables.map((t) => `${t.database}.${t.name}`)}
          onCancel={() => setCreatingTable(false)}
          onCreate={createTable}
        />
      )}
      {toast && <FloatingToast message={toast} onDismiss={() => setToast(null)} />}
    </Shell>
    </VariantContext.Provider>
  );
};

export default AgentDBMVP;
