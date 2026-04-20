import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { c, sp, ff, fs, fw } from '../styles';

// ── Warehouse tree ─────────────────────────────────────────────────────────────

type TableType = 'table' | 'dbt_model' | 'semantic_view';

interface TableNode   { id: string; name: string; type?: TableType; }
interface SchemaNode  { id: string; name: string; tables: TableNode[]; }
interface DatabaseNode { id: string; name: string; schemas: SchemaNode[]; }
type ConnectionType = 'snowflake' | 'dbt';
interface ConnectionNode { id: string; name: string; type: ConnectionType; databases: DatabaseNode[]; }

export const WAREHOUSE_TREE: ConnectionNode[] = [
  {
    id: 'snowflake-1', name: 'Sarah-Snowflake', type: 'snowflake',
    databases: [
      {
        id: 'marketing_db', name: 'marketing_db',
        schemas: [{ id: 'mkt_public', name: 'public', tables: [
          { id: 'orders',      name: 'orders',      type: 'table' },
          { id: 'order_items', name: 'order_items', type: 'table' },
          { id: 'campaigns',   name: 'campaigns',   type: 'table' },
          { id: 'users',       name: 'users',       type: 'table' },
        ]}],
      },
      {
        id: 'finance_db', name: 'finance_db',
        schemas: [{ id: 'fin_reporting', name: 'reporting', tables: [
          { id: 'transactions',   name: 'transactions',   type: 'table' },
          { id: 'expenses',       name: 'expenses',       type: 'table' },
          { id: 'budget_targets', name: 'budget_targets', type: 'table' },
        ]}],
      },
      {
        id: 'sales_db', name: 'sales_db',
        schemas: [{ id: 'sales_schema', name: 'sales_schema', tables: [
          { id: 'accounts',       name: 'accounts',       type: 'table' },
          { id: 'reps',           name: 'reps',           type: 'table' },
          { id: 'deals',          name: 'deals',          type: 'table' },
          { id: 'sales_overview', name: 'sales_overview', type: 'semantic_view' },
        ]}],
      },
    ],
  },
  {
    id: 'dbt-1', name: 'dbt Analytics', type: 'dbt',
    databases: [{
      id: 'analytics', name: 'analytics',
      schemas: [{ id: 'dbt_models', name: 'models', tables: [
        { id: 'fct_pnl', name: 'fct_pnl', type: 'dbt_model' },
      ]}],
    }],
  },
];

interface FlatTable { id: string; name: string; path: string; connectionName: string; type: TableType; }
const ALL_TABLES: FlatTable[] = WAREHOUSE_TREE.flatMap(conn =>
  conn.databases.flatMap(db =>
    db.schemas.flatMap(schema =>
      schema.tables.map(t => ({
        id: t.id,
        name: t.name,
        path: `${conn.name} · ${db.name} · ${schema.name}`,
        connectionName: conn.name,
        type: t.type ?? 'table' as TableType,
      }))
    )
  )
);

// ── Helpers ────────────────────────────────────────────────────────────────────

function mirrorText(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/@(\w*)/g, '<span style="color:#7C3AED;font-weight:500">@$1</span>');
}

function typeIcon(type: TableType): string {
  if (type === 'dbt_model')     return 'd';
  if (type === 'semantic_view') return '◎';
  return '⊞';
}

const MatchText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ color: c['content-primary'], fontWeight: 600 }}>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
};

// ── Props ──────────────────────────────────────────────────────────────────────

export interface PromptBarRef {
  setValue: (v: string) => void;
  focus: () => void;
}

export interface PromptBarProps {
  onSubmit: (text: string, tables: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  /** 'up' opens dropdowns above the bar (use in panels); 'down' opens below (landing page) */
  dropDirection?: 'up' | 'down';
  /** compact hides the Upload button and uses an icon-only table button */
  compact?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────

const PromptBar = forwardRef<PromptBarRef, PromptBarProps>(({
  onSubmit,
  disabled = false,
  placeholder = "Give me a task. Use '@' to mention tables.",
  autoFocus = false,
  dropDirection = 'down',
  compact = false,
}, ref) => {

  const [value, setValue]               = useState('');
  const [attachedTables, setAttached]   = useState<string[]>([]);
  const [focused, setFocused]           = useState(false);
  const [mentionActive, setMention]     = useState(false);
  const [mentionQuery, setQuery]        = useState('');
  const [mentionIndex, setMentionIdx]   = useState(0);
  const [browserOpen, setBrowser]       = useState(false);
  const [tableSearch, setSearch]        = useState('');
  const [uploadOpen, setUpload]         = useState(false);

  const [expConns,   setExpConns]   = useState<Set<string>>(new Set(['snowflake-1']));
  const [expDBs,     setExpDBs]     = useState<Set<string>>(new Set(['marketing_db']));
  const [expSchemas, setExpSchemas] = useState<Set<string>>(new Set(['mkt_public']));

  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    setValue: (v: string) => { setValue(v); textareaRef.current?.focus(); },
    focus:    ()          => textareaRef.current?.focus(),
  }));

  const canSubmit = value.trim().length > 0 && !disabled;

  const filtered = ALL_TABLES.filter(t => t.name.toLowerCase().includes(mentionQuery.toLowerCase()));
  const searchResults = tableSearch.trim()
    ? ALL_TABLES.filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase()))
    : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setBrowser(false); setMention(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (browserOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [browserOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setValue(val);
    const cursor = e.target.selectionStart ?? 0;
    const before = val.slice(0, cursor);
    const match  = before.match(/@(\w*)$/);
    if (match) { setQuery(match[1]); setMention(true); setMentionIdx(0); setBrowser(false); }
    else         setMention(false);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px';
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const open = mentionActive && mentionQuery.length > 0 && filtered.length > 0;
    if (e.key === 'Escape') { setMention(false); return; }
    if (open) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx(i => Math.min(i + 1, filtered.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); selectMention(filtered[mentionIndex] ?? filtered[0]); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const selectMention = (t: FlatTable) => {
    const el = textareaRef.current;
    if (!el) return;
    const cursor = el.selectionStart ?? value.length;
    const before = value.slice(0, cursor).replace(/@\w*$/, `@${t.name} `);
    const after  = value.slice(cursor);
    setValue(before + after);
    setMention(false);
    addTable(t.id);
    setTimeout(() => { el.focus(); el.setSelectionRange(before.length, before.length); }, 0);
  };

  const addTable = (id: string, closeMenu = false) => {
    setAttached(prev => prev.includes(id) ? prev : [...prev, id]);
    if (closeMenu) setBrowser(false);
  };

  const removeTable = (id: string) => setAttached(prev => prev.filter(x => x !== id));

  const tog = (set: Set<string>, id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const text = value.trim();
    setValue('');
    setAttached([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSubmit(text, attachedTables);
  };

  const isUp = dropDirection === 'up';
  const dropPos = isUp ? { bottom: 'calc(100% + 6px)' as const } : { top: 'calc(100% + 6px)' as const };

  const border = focused || mentionActive
    ? `1px solid ${c['content-brand']}`
    : `1px solid ${c['border-default']}`;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <style>{`@keyframes pb-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ backgroundColor: c['background-base'], borderRadius: 12, border, boxShadow: '0px 0px 4px rgba(25,35,49,0.06), 0px 2px 4px rgba(25,35,49,0.04)', transition: 'border-color 0.15s' }}>

        {/* ── Textarea + @mention mirror ── */}
        <div style={{ position: 'relative' }}>
          <div
            aria-hidden
            style={{ position: 'absolute', inset: 0, padding: `${sp.C}px ${sp.C}px ${sp.A}px`, fontSize: fs.sm, fontFamily: ff.primary, lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word', pointerEvents: 'none', boxSizing: 'border-box', color: c['content-primary'] }}
            dangerouslySetInnerHTML={{ __html: mirrorText(value) }}
          />
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKey}
            placeholder={placeholder}
            rows={2}
            autoFocus={autoFocus}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ position: 'relative', width: '100%', border: 'none', outline: 'none', resize: 'none', padding: `${sp.C}px ${sp.C}px ${sp.A}px`, fontSize: fs.sm, color: 'transparent', caretColor: c['content-primary'], fontFamily: ff.primary, lineHeight: '1.5', backgroundColor: 'transparent', boxSizing: 'border-box', borderRadius: '12px 12px 0 0', opacity: disabled ? 0.5 : 1 }}
          />
        </div>

        {/* ── @mention dropdown ── */}
        {mentionActive && mentionQuery.length > 0 && filtered.length > 0 && (
          <div style={{ position: 'absolute', ...dropPos, left: 0, right: 0, backgroundColor: c['background-base'], border: `1px solid ${c['border-default']}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 200, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: `${sp.B}px ${sp.C}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
              <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>Tables in your connections</span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 200 }}>
              {filtered.map((t, idx) => (
                <div key={t.id} onMouseDown={e => { e.preventDefault(); selectMention(t); }} onMouseEnter={() => setMentionIdx(idx)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.B}px ${sp.D}px`, cursor: 'pointer', gap: sp.C, backgroundColor: idx === mentionIndex ? c['background-information'] : 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                    <span style={{ fontSize: 10, color: c['content-secondary'], width: 12, textAlign: 'center' }}>{typeIcon(t.type)}</span>
                    <span style={{ fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.mono }}>
                      <MatchText text={t.name} query={mentionQuery} />
                    </span>
                  </div>
                  <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{t.path}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Attached table chips ── */}
        {attachedTables.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.A, padding: `0 ${sp.C}px ${sp.A}px` }}>
            {attachedTables.map(id => (
              <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: fs.xs, backgroundColor: c['background-information'], color: c['content-brand'], padding: `2px ${sp.B}px`, borderRadius: 6, fontFamily: ff.mono }}>
                ⊞ {id}
                <span onClick={() => removeTable(id)} style={{ cursor: 'pointer', opacity: 0.6, fontSize: 12, lineHeight: 1 }}>×</span>
              </span>
            ))}
          </div>
        )}

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.A}px ${sp.B}px`, borderTop: `1px solid ${c['border-divider']}` }}>
          <div style={{ display: 'flex', gap: sp.A, position: 'relative' }}>

            {/* Table browser button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setMention(false); setBrowser(v => !v); setSearch(''); }}
                title="Add tables"
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: compact ? `${sp.A}px ${sp.B}px` : `${sp.A}px ${sp.B}px`, border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: 'transparent', color: c['content-secondary'], fontSize: fs.xs, cursor: 'pointer', fontFamily: ff.primary, lineHeight: '1.4' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: 12 }}>+</span>
                {!compact && <span>Tables</span>}
              </button>

              {browserOpen && (
                <div style={{ position: 'absolute', ...dropPos, left: 0, width: 300, backgroundColor: c['background-base'], border: `1px solid ${c['border-default']}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 300, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 280 }}>
                  <div style={{ padding: `${sp.B}px ${sp.C}px`, borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
                    <input
                      ref={searchRef}
                      value={tableSearch}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search tables…"
                      style={{ width: '100%', border: `1px solid ${c['border-default']}`, borderRadius: 6, padding: `${sp.A}px ${sp.B}px`, fontSize: fs.xs, fontFamily: ff.primary, color: c['content-primary'], backgroundColor: c['background-subtle'], outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {searchResults ? (
                      searchResults.length === 0 ? (
                        <div style={{ padding: sp.D, fontSize: fs.xs, color: c['content-secondary'], textAlign: 'center' }}>No tables found</div>
                      ) : searchResults.map(t => (
                        <BrowserRow key={t.id} name={t.name} sub={t.path} type={t.type} depth={0} added={attachedTables.includes(t.id)} onAdd={() => addTable(t.id, true)} />
                      ))
                    ) : (
                      WAREHOUSE_TREE.map(conn => (
                        <div key={conn.id}>
                          <TreeNode icon={conn.type === 'snowflake' ? '❄' : '⬡'} label={conn.name} depth={0} open={expConns.has(conn.id)} onToggle={() => setExpConns(s => tog(s, conn.id))} bold />
                          {expConns.has(conn.id) && conn.databases.map(db => (
                            <div key={db.id}>
                              <TreeNode icon="▤" label={db.name} depth={1} open={expDBs.has(db.id)} onToggle={() => setExpDBs(s => tog(s, db.id))} />
                              {expDBs.has(db.id) && db.schemas.map(sc => (
                                <div key={sc.id}>
                                  <TreeNode icon="⊡" label={sc.name} depth={2} open={expSchemas.has(sc.id)} onToggle={() => setExpSchemas(s => tog(s, sc.id))} />
                                  {expSchemas.has(sc.id) && sc.tables.map(t => (
                                    <BrowserRow key={t.id} name={t.name} depth={3} type={t.type ?? 'table'} added={attachedTables.includes(t.id)} onAdd={() => addTable(t.id, true)} />
                                  ))}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {!compact && (
              <button onClick={() => setUpload(true)}
                style={{ padding: `${sp.A}px ${sp.B}px`, border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: 'transparent', color: c['content-secondary'], fontSize: fs.xs, cursor: 'pointer', fontFamily: ff.primary, lineHeight: '1.4' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                ↑ Upload
              </button>
            )}
          </div>

          {/* Send */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            title="Send"
            style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', backgroundColor: canSubmit ? '#2770ef' : c['border-default'], color: canSubmit ? '#fff' : c['content-secondary'], cursor: canSubmit ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'background-color 0.15s', flexShrink: 0, fontFamily: ff.primary }}
          >
            ↑
          </button>
        </div>
      </div>

      {/* Upload modal */}
      {uploadOpen && <UploadModal onClose={() => setUpload(false)} />}
    </div>
  );
});

PromptBar.displayName = 'PromptBar';
export default PromptBar;

// ── Sub-components ─────────────────────────────────────────────────────────────

const TreeNode: React.FC<{ icon: string; label: string; depth: number; open: boolean; onToggle: () => void; bold?: boolean }> = ({ icon, label, depth, open, onToggle, bold }) => (
  <div
    onClick={onToggle}
    style={{ display: 'flex', alignItems: 'center', gap: sp.A, padding: `5px ${sp.C}px`, paddingLeft: 12 + depth * 14, cursor: 'pointer', userSelect: 'none' }}
    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    <span style={{ fontSize: 9, color: c['content-secondary'], width: 10, flexShrink: 0 }}>{open ? '▼' : '▶'}</span>
    <span style={{ fontSize: fs.xs, color: c['content-secondary'], width: 14, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
    <span style={{ fontSize: fs.xs, color: c['content-primary'], fontWeight: bold ? fw.semibold : fw.regular }}>{label}</span>
  </div>
);

const BrowserRow: React.FC<{ name: string; sub?: string; depth?: number; type: TableType; added: boolean; onAdd: () => void }> = ({ name, sub, depth = 0, type, added, onAdd }) => (
  <div
    onClick={!added ? onAdd : undefined}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `5px ${sp.C}px`, paddingLeft: 12 + depth * 14, cursor: added ? 'default' : 'pointer', opacity: added ? 0.5 : 1 }}
    onMouseEnter={e => { if (!added) e.currentTarget.style.backgroundColor = c['background-subtle']; }}
    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
      <span style={{ fontSize: 9, color: 'transparent', width: 10, flexShrink: 0 }}>·</span>
      <span style={{ fontSize: 10, color: c['content-secondary'], width: 14, textAlign: 'center', flexShrink: 0 }}>{typeIcon(type)}</span>
      <div>
        <span style={{ fontSize: fs.xs, color: c['content-primary'], fontFamily: ff.mono }}>{name}</span>
        {sub && <div style={{ fontSize: 10, color: c['content-secondary'] }}>{sub}</div>}
      </div>
    </div>
    {added
      ? <span style={{ fontSize: fs.xs, color: c['content-success'] }}>✓</span>
      : <span style={{ fontSize: fs.xs, color: c['content-brand'] }}>+ Add</span>
    }
  </div>
);

const UploadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ backgroundColor: c['background-base'], borderRadius: 12, width: 480, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.D}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
          <span style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>Upload a file</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c['content-secondary'], lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ padding: sp.F }}>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
            onClick={() => inputRef.current?.click()}
            style={{ border: `2px dashed ${dragOver ? c['content-brand'] : c['border-default']}`, borderRadius: 10, padding: `${sp.H}px ${sp.D}px`, textAlign: 'center', cursor: 'pointer', backgroundColor: dragOver ? c['background-information'] : c['background-subtle'], transition: 'all 0.15s' }}
          >
            <div style={{ fontSize: 28, marginBottom: sp.B }}>↑</div>
            {file ? (
              <div>
                <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>{file.name}</div>
                <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: sp.A }}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: fs.sm, color: c['content-primary'], fontWeight: fw.medium }}>Drag and drop a file, or click to browse</div>
                <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: sp.A }}>CSV, Excel, JSON — up to 100 MB</div>
              </div>
            )}
          </div>
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.json" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: sp.B, padding: `${sp.C}px ${sp.F}px`, borderTop: `1px solid ${c['border-divider']}` }}>
          <button onClick={onClose} style={{ padding: `${sp.B}px ${sp.D}px`, borderRadius: 8, border: `1px solid ${c['border-default']}`, backgroundColor: 'transparent', color: c['content-secondary'], fontSize: fs.sm, cursor: 'pointer', fontFamily: ff.primary }}>Cancel</button>
          <button onClick={onClose} disabled={!file} style={{ padding: `${sp.B}px ${sp.D}px`, borderRadius: 8, border: 'none', backgroundColor: file ? c['content-brand'] : c['border-default'], color: file ? '#fff' : c['content-secondary'], fontSize: fs.sm, cursor: file ? 'pointer' : 'default', fontFamily: ff.primary, fontWeight: fw.medium }}>Add to project</button>
        </div>
      </div>
    </div>
  );
};
