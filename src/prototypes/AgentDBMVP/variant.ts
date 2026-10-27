import { createContext, useContext } from 'react';
import { Permission, Role, StoreTable } from './types';
import { V2_SOURCE } from './data';

/**
 * v1 — 7 Oct review: the build Vivek reviewed and deployed on 7 Oct. Must not change.
 * v3 — 14 Oct: v1 plus the design document (~/agentdb-data-store/how-agentdb-works.html). Own folder: ./v3.
 * v4 — 15 Oct: v3 with the visual design pass (eight principles in the design document, section 13). Own folder: ./v4.
 *      Same scope, same data, same flows; only the visual design differs.
 * v5 — 26 Oct: starts as a copy of v4; the team review feedback goes here. Own folder: ./v5.
 * v2 — PM plan (discarded 14 Oct; parts reused in v3): the PM's December build list applied as written (API keys inherit the creator's
 *      role, SQL editor, stop and profile on queries, source labels, add person, no rate limits,
 *      no per-table hits, no Empty table, ThoughtSpot connects like any BI tool).
 */
export type Variant = 'v1' | 'v2' | 'v3' | 'v4' | 'v5';

export const VARIANT_OPTIONS = [
  { id: 'v1', label: 'v1 · 7 Oct' },
  { id: 'v2', label: 'v2 · 14 Oct' },
  { id: 'v3', label: 'v3 · 14 Oct' },
  { id: 'v4', label: 'v4 · 15 Oct' },
  { id: 'v5', label: 'v5 · 26 Oct' },
];

export const SHOW_VARIANT_SWITCHER = true;
export const DEFAULT_VARIANT: Variant = 'v5';

export const VariantContext = createContext<Variant>(DEFAULT_VARIANT);
export const useVariant = () => useContext(VariantContext);

/** v2 only: who is signed in. v1 is always the Admin. */
export const ROLE_OPTIONS: { id: Role; label: string }[] = [
  { id: 'Admin', label: 'Admin · Priya Nair' },
  { id: 'Editor', label: 'Editor · Arjun Mehta' },
  { id: 'Viewer', label: 'Viewer · Sara Lee' },
];
export const RoleContext = createContext<Role>('Admin');
export const useRole = () => useContext(RoleContext);

/** PM plan item 5: a key can do what its creator can. Assumed: Editors can write (DDL and loads). */
export const keyPermission = (role: Role): Permission => (role === 'Viewer' ? 'Read' : 'Read & write');

/** Assumed from the PM's open question "DDL for editors or admins only": Editors can. */
export const canEditTables = (variant: Variant, role: Role) => variant === 'v1' || role !== 'Viewer';
export const canManagePeople = (variant: Variant, role: Role) => variant === 'v1' || role === 'Admin';
export const canStopQueries = (variant: Variant, role: Role) => variant === 'v2' && role !== 'Viewer';

/** v2: tables carry the source label of the key that wrote them, not the ETL tool. */
export const tablesFor = (variant: Variant, tables: StoreTable[]): StoreTable[] =>
  variant !== 'v2' ? tables : tables.map((t) => (V2_SOURCE[t.id] ? { ...t, writer: { kind: 'pipeline', ...V2_SOURCE[t.id] } } : t));
