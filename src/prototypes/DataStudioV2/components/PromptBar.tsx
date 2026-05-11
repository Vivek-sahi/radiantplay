import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import { Icon } from '../../../components/icons';
import { WAREHOUSE_TREE, WarehouseTableType } from '../data/mockData';

// Re-export so existing importers (Workspace + tests) continue to resolve here.
export { WAREHOUSE_TREE };

interface FlatTable { id: string; name: string; path: string; connectionName: string; type: WarehouseTableType; }
const ALL_TABLES: FlatTable[] = WAREHOUSE_TREE.flatMap(conn =>
  conn.databases.flatMap(db =>
    db.schemas.flatMap(schema =>
      schema.tables.map(t => ({
        id: t.id,
        name: t.name,
        path: `${conn.name} · ${db.name} · ${schema.name}`,
        connectionName: conn.name,
        type: t.type ?? 'table',
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

function typeIcon(type: WarehouseTableType): string {
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
  setColumns: (cols: string[]) => void;
  startTypewriter: (base: string, suffixes: string[]) => void;
}

export interface PromptBarProps {
  onSubmit: (text: string, tables: string[]) => void;
  disabled?: boolean;
  isProcessing?: boolean;
  onStop?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** 'up' opens dropdowns above the bar (use in panels); 'down' opens below (landing page) */
  dropDirection?: 'up' | 'down';
  /** landingPage: single-row textarea, cleaner toolbar styling */
  landingPage?: boolean;
  onColumnRemove?: (name: string) => void;
  /** Rendered at the far left of the toolbar — use for mode toggles or custom actions */
  leftSlot?: React.ReactNode;
}

// ── Component ──────────────────────────────────────────────────────────────────

const PromptBar = forwardRef<PromptBarRef, PromptBarProps>(({
  onSubmit,
  disabled = false,
  isProcessing = false,
  onStop,
  placeholder = "Give me a task. Use '@' to mention tables.",
  autoFocus = false,
  dropDirection = 'down',
  landingPage = false,
  onColumnRemove,
  leftSlot,
}, ref) => {

  const [value, setValue]                     = useState('');
  const [attachedTables, setAttached]         = useState<string[]>([]);
  const [attachedColumns, setAttachedColumns] = useState<string[]>([]);
  const [focused, setFocused]           = useState(false);
  const [mentionActive, setMention]     = useState(false);
  const [mentionQuery, setQuery]        = useState('');
  const [mentionIndex, setMentionIdx]   = useState(0);
  const [uploadOpen, setUpload]         = useState(false);

  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ghostSuffix, setGhostSuffix] = useState('');

  useImperativeHandle(ref, () => ({
    setValue:   (v: string)    => { setValue(v); textareaRef.current?.focus(); },
    focus:      ()             => textareaRef.current?.focus(),
    setColumns: (cols: string[]) => setAttachedColumns(cols),
    startTypewriter: (base: string, suffixes: string[]) => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      setValue(base);
      setGhostSuffix('');
      textareaRef.current?.focus();

      let suffixIdx = 0;
      let charCount = 0;
      let phase: 'gap' | 'typing' | 'pausing' | 'deleting' = 'gap';

      const tick = () => {
        const suffix = suffixes[suffixIdx];
        if (phase === 'gap') {
          phase = 'typing';
          animTimerRef.current = setTimeout(tick, 40);
        } else if (phase === 'typing') {
          charCount++;
          setGhostSuffix(suffix.slice(0, charCount));
          if (charCount >= suffix.length) {
            phase = 'pausing';
            animTimerRef.current = setTimeout(tick, 1600);
          } else {
            animTimerRef.current = setTimeout(tick, 65);
          }
        } else if (phase === 'pausing') {
          phase = 'deleting';
          animTimerRef.current = setTimeout(tick, 35);
        } else if (phase === 'deleting') {
          charCount--;
          setGhostSuffix(suffix.slice(0, charCount));
          if (charCount <= 0) {
            suffixIdx++;
            if (suffixIdx >= suffixes.length) { setGhostSuffix(''); animTimerRef.current = null; return; }
            charCount = 0;
            phase = 'gap';
            animTimerRef.current = setTimeout(tick, 400);
          } else {
            animTimerRef.current = setTimeout(tick, 35);
          }
        }
      };

      animTimerRef.current = setTimeout(tick, 400);
    },
  }));

  const canSubmit = value.trim().length > 0 && !disabled;

  const filtered = ALL_TABLES.filter(t => t.name.toLowerCase().includes(mentionQuery.toLowerCase()));
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMention(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => () => { if (animTimerRef.current) clearTimeout(animTimerRef.current); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (animTimerRef.current) { clearTimeout(animTimerRef.current); animTimerRef.current = null; }
    setGhostSuffix('');
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

  const addTable = (id: string) => {
    setAttached(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const removeTable = (id: string) => setAttached(prev => prev.filter(x => x !== id));

  const handleSubmit = () => {
    if (!canSubmit) return;
    const colPrefix = attachedColumns.map(c => `@${c}`).join(' ');
    const text = colPrefix ? `${colPrefix} ${value.trim()}` : value.trim();
    setValue('');
    setAttached([]);
    setAttachedColumns([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSubmit(text, attachedTables);
  };

  const isUp = dropDirection === 'up';
  const dropPos = isUp ? { bottom: 'calc(100% + 6px)' as const } : { top: 'calc(100% + 6px)' as const };

  const border = focused || mentionActive
    ? `1.5px solid ${c['content-brand']}`
    : landingPage
      ? '1.5px solid #E2E6ED'
      : `1px solid ${c['border-default']}`;

  const textPadding = landingPage ? `${sp.D}px ${sp.D}px ${sp.B}px` : `${sp.C}px ${sp.C}px ${sp.A}px`;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <style>{`
        @keyframes pb-spin { to { transform: rotate(360deg); } }
        .pb-textarea::placeholder { color: #B0B8C4; }
      `}</style>

      <div style={{ backgroundColor: c['background-base'], borderRadius: landingPage ? 14 : 12, border, boxShadow: landingPage ? '0 2px 12px rgba(25,35,49,0.07)' : '0px 0px 4px rgba(25,35,49,0.06), 0px 2px 4px rgba(25,35,49,0.04)', transition: 'border-color 0.15s' }}>

        {/* ── Textarea + @mention mirror ── */}
        <div style={{ position: 'relative' }}>
          <div
            aria-hidden
            style={{ position: 'absolute', inset: 0, padding: textPadding, fontSize: landingPage ? fs.md : fs.sm, fontFamily: ff.primary, lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word', pointerEvents: 'none', boxSizing: 'border-box', color: c['content-primary'] }}
            dangerouslySetInnerHTML={{ __html: mirrorText(value) + (ghostSuffix ? `<span style="color:#B0B8C4">${ghostSuffix.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>` : '') }}
          />
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKey}
            placeholder={placeholder}
            rows={landingPage ? 2 : 2}
            autoFocus={autoFocus}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="pb-textarea"
            style={{ position: 'relative', width: '100%', border: 'none', outline: 'none', resize: 'none', padding: textPadding, fontSize: landingPage ? fs.md : fs.sm, color: 'transparent', caretColor: c['content-primary'], fontFamily: ff.primary, lineHeight: '1.6', backgroundColor: 'transparent', boxSizing: 'border-box', borderRadius: landingPage ? '14px 14px 0 0' : '12px 12px 0 0', opacity: disabled ? 0.5 : 1 }}
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

        {/* ── Attached column chips ── */}
        {attachedColumns.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.A, padding: `0 ${sp.C}px ${sp.A}px` }}>
            {attachedColumns.map(name => (
              <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: fs.xs, backgroundColor: '#F3F0FF', color: '#6D28D9', padding: `2px ${sp.B}px`, borderRadius: 6, fontFamily: ff.mono }}>
                ✦ {name}
                <span onClick={() => { setAttachedColumns(prev => prev.filter(c => c !== name)); onColumnRemove?.(name); }} style={{ cursor: 'pointer', opacity: 0.6, fontSize: 12, lineHeight: 1 }}>×</span>
              </span>
            ))}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.A}px ${sp.B}px` }}>
          <div style={{ display: 'flex', gap: sp.A, alignItems: 'center', position: 'relative' }}>
            {leftSlot}

            <button
              onClick={() => setUpload(true)}
              title="Upload a file"
              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 6, backgroundColor: 'transparent', color: c['content-secondary'], cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Icon name="upload" size="s" color={c['content-secondary']} />
            </button>
          </div>

          {/* Send / Stop */}
          <button
            onClick={isProcessing ? onStop : handleSubmit}
            disabled={!isProcessing && !canSubmit}
            title={isProcessing ? 'Stop' : 'Send'}
            style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', backgroundColor: isProcessing ? c['border-default'] : '#2770ef', color: isProcessing ? c['content-secondary'] : '#fff', opacity: (!isProcessing && !canSubmit) ? 0.4 : 1, cursor: (isProcessing || canSubmit) ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isProcessing ? 10 : 14, transition: 'opacity 0.15s', flexShrink: 0, fontFamily: ff.primary }}
          >
            {isProcessing ? '■' : '↑'}
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
          <button onClick={onClose} disabled={!file} style={{ padding: `${sp.B}px ${sp.D}px`, borderRadius: 8, border: 'none', backgroundColor: file ? c['content-brand'] : c['border-default'], color: file ? '#fff' : c['content-secondary'], fontSize: fs.sm, cursor: file ? 'pointer' : 'default', fontFamily: ff.primary, fontWeight: fw.medium }}>Add to model</button>
        </div>
      </div>
    </div>
  );
};
