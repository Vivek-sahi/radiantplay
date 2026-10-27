import { SqlQuery, SqlWorkspace } from './types';
import { newQuery } from './data';

/**
 * What happens to tabs and queries over time (Vivek, 26 Oct). A tab is a window onto a query:
 * closing it loses nothing, the query stays in Recent until deleted. ▶ and Open in SQL reuse one
 * preview tab until it is edited or run, so browsing doesn't pile up tabs.
 */

const touch = (q: SqlQuery): SqlQuery => ({ ...q, updated: 'Just now', age: 0 });

/** A new empty query in its own tab. */
export const addTab = (ws: SqlWorkspace, sql = ''): SqlWorkspace => {
  const q = { ...newQuery(), sql };
  return { ...ws, queries: [q, ...ws.queries], open: [...ws.open, q.id], active: q.id };
};

/** Open SQL in the preview tab, replacing what the preview showed. Returns the query's id too. */
export const openPreview = (ws: SqlWorkspace, sql: string): [SqlWorkspace, string] => {
  const q = { ...newQuery(), sql };
  const prev = ws.preview;
  // The old preview was never edited or run: it goes, rather than cluttering Recent.
  const queries = [q, ...ws.queries.filter((x) => x.id !== prev)];
  const open = prev && ws.open.includes(prev) ? ws.open.map((id) => (id === prev ? q.id : id)) : [...ws.open, q.id];
  return [{ queries, open, active: q.id, preview: q.id }, q.id];
};

/** Open a query from Recent as a normal tab, or bring its tab forward. */
export const openQuery = (ws: SqlWorkspace, id: string): SqlWorkspace =>
  ws.open.includes(id) ? { ...ws, active: id } : { ...ws, open: [...ws.open, id], active: id };

/** Closing never asks: the query is in Recent. Closing the last tab leaves one empty query. */
export const closeTab = (ws: SqlWorkspace, id: string): SqlWorkspace => {
  const i = ws.open.indexOf(id);
  const open = ws.open.filter((x) => x !== id);
  const wasPreview = ws.preview === id;
  // A preview that was never touched isn't work: it doesn't stay in Recent.
  const queries = wasPreview ? ws.queries.filter((q) => q.id !== id) : ws.queries;
  const next = { ...ws, queries, open, preview: wasPreview ? null : ws.preview };
  if (!open.length) return addTab({ ...next, open: [] });
  return { ...next, active: ws.active === id ? open[Math.max(0, i - 1)] : ws.active };
};

/** Typing saves. Editing the preview makes it a normal tab. */
export const editQuery = (ws: SqlWorkspace, id: string, sql: string): SqlWorkspace => ({
  ...ws,
  queries: ws.queries.map((q) => (q.id === id ? touch({ ...q, sql }) : q)),
  preview: ws.preview === id ? null : ws.preview,
});

/** Running keeps the preview too, and records how it went for Recent. */
export const recordRun = (ws: SqlWorkspace, id: string, ok: boolean): SqlWorkspace => ({
  ...ws,
  queries: ws.queries.map((q) => (q.id === id ? touch({ ...q, status: ok ? 'ok' : 'failed' }) : q)),
  preview: ws.preview === id ? null : ws.preview,
});

export const togglePin = (ws: SqlWorkspace, id: string): SqlWorkspace => ({
  ...ws,
  queries: ws.queries.map((q) => (q.id === id ? { ...q, pinned: !q.pinned } : q)),
});

/** Deleting removes it from Recent and closes its tab. Its runs stay on the Queries page. */
export const deleteQuery = (ws: SqlWorkspace, id: string): SqlWorkspace => {
  const closed = ws.open.includes(id) ? closeTab(ws, id) : ws;
  return { ...closed, queries: closed.queries.filter((q) => q.id !== id), preview: closed.preview === id ? null : closed.preview };
};

/** What a query is called in a tab and in Recent: its pin name, else its first line. */
export const titleOf = (q: SqlQuery): string => {
  if (q.name) return q.name;
  const line = q.sql.split('\n').map((l) => l.trim()).find(Boolean);
  if (!line) return 'New query';
  return line.length > 40 ? `${line.slice(0, 40)}…` : line;
};
