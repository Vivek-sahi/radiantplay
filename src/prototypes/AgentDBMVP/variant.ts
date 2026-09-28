import { createContext, useContext } from 'react';
import { QueryRecord, ServiceAccount, StoreTable } from './types';

/**
 * v1 — Pulse-aware: AgentDB knows which tables Pulse manages and treats them specially.
 * v2 — Neutral: ThoughtSpot is just another connection. AgentDB sees a service account
 *      named `thoughtspot` writing and reading tables, and nothing more.
 */
export type Variant = 'v1' | 'v2';

export const VARIANT_OPTIONS = [
  { id: 'v1', label: 'v1 · Pulse-aware' },
  { id: 'v2', label: 'v2 · ThoughtSpot is just a connection' },
];

/** Ruled 28 Sep (Vivek): "Pulse is just another connection" → v2. v1 kept for reference, switcher hidden. */
export const SHOW_VARIANT_SWITCHER = false;
export const DEFAULT_VARIANT: Variant = 'v2';

export const VariantContext = createContext<Variant>(DEFAULT_VARIANT);
export const useVariant = () => useContext(VariantContext);

/** v2: Pulse-written tables become ordinary tables written by the `thoughtspot` service account. */
export const tablesFor = (variant: Variant, tables: StoreTable[]): StoreTable[] =>
  variant === 'v1'
    ? tables
    : tables.map((t) =>
        t.writer.kind === 'pulse'
          ? { ...t, writer: { kind: 'pipeline' as const, label: 'ThoughtSpot', detail: 'thoughtspot' }, nextRefresh: undefined }
          : t,
      );

/** v2: the two ThoughtSpot system accounts collapse into one ordinary account an admin created. */
export const accountsFor = (variant: Variant, accounts: ServiceAccount[]): ServiceAccount[] => {
  if (variant === 'v1') return accounts;
  const ts = accounts.filter((a) => a.name === 'thoughtspot' || a.name === 'pulse');
  const rest = accounts.filter((a) => a.name !== 'thoughtspot' && a.name !== 'pulse');
  const base = ts.find((a) => a.id === 's1');
  const merged: ServiceAccount = {
    id: 's1',
    name: 'thoughtspot',
    kind: 'app',
    permission: 'Read & write',
    budget: null,
    spent: ts.reduce((s, a) => s + a.spent, 0),
    rateLimit: null,
    lastUsed: 'Just now',
    createdBy: 'Priya Nair',
    passwordSetAt: base?.passwordSetAt ?? '12 Sep',
    revoked: base?.revoked,
  };
  return [merged, ...rest];
};

/** v2: AgentDB only sees SQL from the `thoughtspot` account — it can't know it came from a Liveboard or Spotter. */
const NEUTRAL_SUMMARY: Record<string, string> = {
  q2: 'SELECT region, SUM(amount) FROM retail_sales.orders WHERE order_date >= … GROUP BY region',
  q7: '6 queries on retail_sales.orders, retail_sales.customers in 1.5 s',
  q10: 'SELECT priority, COUNT(*) FROM support_ops.tickets WHERE opened_at >= … GROUP BY priority',
};

export const queriesFor = (variant: Variant, queries: QueryRecord[]): QueryRecord[] =>
  variant === 'v1'
    ? queries
    : queries.map((q) => (q.kind === 'system' ? { ...q, kind: 'app' as const, summary: NEUTRAL_SUMMARY[q.id] ?? q.summary } : q));
