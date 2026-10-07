import React, { useState } from 'react';
import { Page, ServiceAccount, StoreTable } from './types';
import { SERVICE_ACCOUNTS, TABLES } from './data';
import { Shell } from './components/Shell';
import { DataPage } from './components/DataPage';
import { TableDetailPage } from './components/TableDetailPage';
import { QueriesPage } from './components/QueriesPage';
import { OverviewPage } from './components/OverviewPage';
import { AccessPage } from './components/AccessPage';
import { ConnectPage } from './components/ConnectPage';
import { FloatingToast } from './components/primitives';
import { DEFAULT_VARIANT, Variant, VariantContext } from './variant';
import { CreateTableWizard, NewTableInput } from './components/CreateTableWizard';

/**
 * AgentDB MVP — a standalone SaaS console concept (28 Sep 2026; V1 scope cut 7 Oct 2026).
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
    setTables((prev) => [
      ...prev,
      {
        id,
        name: input.name,
        writer: { kind: 'pipeline', label: 'Not loaded yet', detail: 'Created by Priya Nair' },
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

  const active = tables.find((t) => t.id === openTable);
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
      {page === 'data' && !active && <DataPage tables={tables} onOpenTable={openTablePage} onCreateTable={() => setCreatingTable(true)} />}
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
      {page === 'queries' && <QueriesPage tables={tables} />}
      {page === 'connect' && (
        <ConnectPage
          accounts={accounts}
          onCreate={(a) => setAccounts((prev) => [...prev, a])}
          onUpdate={(a) => setAccounts((prev) => prev.map((x) => (x.id === a.id ? { ...x, revoked: a.revoked, passwordSetAt: a.passwordSetAt } : x)))}
          toast={setToast}
        />
      )}
      {page === 'access' && <AccessPage toast={setToast} />}
      {page === 'overview' && <OverviewPage tables={tables} />}

      {creatingTable && (
        <CreateTableWizard
          existingNames={tables.map((t) => t.name)}
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
