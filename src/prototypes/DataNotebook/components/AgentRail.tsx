import React, { useEffect, useRef } from 'react';
import { c, ff, fw } from '../styles';
import type { AgentMessage } from '../types';
import { CellGlyph, Spinner, IconButton, PlusIcon } from './ui';

interface AgentRailProps {
  messages: AgentMessage[];
  busy: boolean;
  bootHint?: string | null;
  draft: string;
  onDraftChange: (s: string) => void;
  onSend: (text: string) => void;
  onNewThread: () => void;
  model: string;
  onModelChange: (m: string) => void;
  effort: string;
  onEffortChange: (e: string) => void;
  onCellRefClick?: (cellId: string) => void;
}

const MODELS = ['Claude Sonnet 4', 'Claude Opus 4.8'];
const EFFORTS = ['Auto', 'Fast', 'Extended'];

const SearchBlock: React.FC<{ hits: NonNullable<AgentMessage['searchHits']>; done: boolean }> = ({ hits, done }) => (
  <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, overflow: 'hidden', marginTop: 6 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', background: 'rgba(0,0,0,0.025)', fontSize: 11.5, fontWeight: fw.semibold, color: c['content-secondary'] }}>
      {done ? <SearchIcon /> : <Spinner size={12} />}
      {done ? `Searched data sources · ${hits.length} tables` : 'Searching data sources…'}
    </div>
    {done && (
      <div style={{ padding: '4px 0' }}>
        {hits.map(h => (
          <div key={h.table} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 10px', fontSize: 12 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: h.connection.includes('CDW') ? '#7C3AED' : '#2EB67D' }} />
            <span style={{ fontFamily: 'ui-monospace, monospace', color: c['content-primary'] }}>{h.table}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#aeb6c2' }}>{h.rows.toLocaleString()} rows</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const PlanBlock: React.FC<{ plan: NonNullable<AgentMessage['plan']> }> = ({ plan }) => (
  <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, padding: '9px 11px', marginTop: 6 }}>
    <div style={{ fontSize: 11.5, fontWeight: fw.semibold, color: c['content-secondary'], marginBottom: 6 }}>Plan</div>
    {plan.map((p, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '3px 0', fontSize: 12.5, color: p.done ? c['content-primary'] : c['content-secondary'] }}>
        <span style={{ flexShrink: 0, marginTop: 1 }}>
          {p.done
            ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#16a34a"/><path d="M5 8.2L7 10.2L11 6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #cbd2dd' }} />}
        </span>
        {p.label}
      </div>
    ))}
  </div>
);

const AgentRail: React.FC<AgentRailProps> = ({ messages, busy, bootHint, draft, onDraftChange, onSend, onNewThread, model, onModelChange, effort, onEffortChange, onCellRefClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);

  const submit = () => { if (draft.trim() && !busy) onSend(draft.trim()); };

  return (
    <div style={{ width: 360, flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', background: c['background-base'], display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* header */}
      <div style={{ height: 46, flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px 0 14px' }}>
        <SparkIcon />
        <span style={{ fontSize: 13, fontWeight: fw.semibold, color: c['content-primary'] }}>Notebook agent</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          <IconButton onClick={onNewThread} title="New thread"><PlusIcon size={14} /></IconButton>
          <IconButton title="History"><HistoryIcon /></IconButton>
        </div>
      </div>

      {/* thread */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 14, fontFamily: ff.primary }}>
        {messages.length === 0 && (
          <div style={{ color: c['content-secondary'], fontSize: 12.5, lineHeight: 1.6, padding: '8px 2px' }}>
            Ask me to build, explore, or chart your data. I can search your sources, write SQL and Python, and assemble a notebook.
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ marginBottom: 14 }}>
            {m.role === 'user' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ background: '#eef4ff', color: c['content-primary'], borderRadius: '12px 12px 4px 12px', padding: '8px 12px', fontSize: 12.5, lineHeight: 1.5, maxWidth: '88%' }}>{m.text}</div>
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: c['content-primary'], lineHeight: 1.55 }}>
                {m.text && <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}{m.streaming && <Caret />}</div>}
                {m.searchHits && <SearchBlock hits={m.searchHits} done={!m.streaming} />}
                {m.plan && <PlanBlock plan={m.plan} />}
                {m.cellRef && (
                  <button onClick={() => onCellRefClick?.(m.cellRef!.cellId)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '5px 9px', borderRadius: 7, border: '1px solid rgba(0,0,0,0.1)', background: c['background-base'], cursor: 'pointer', fontFamily: ff.primary, fontSize: 12 }}>
                    <CellGlyph type={m.cellRef.cellType} size={13} />
                    <span style={{ color: c['content-secondary'] }}>Created</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: fw.semibold, color: c['content-primary'] }}>{m.cellRef.cellName}</span>
                  </button>
                )}
                {m.summary && (
                  <div style={{ marginTop: 6, padding: '10px 12px', background: 'linear-gradient(180deg, #f6f9ff, #f0f5ff)', border: '1px solid #dbe7ff', borderRadius: 9, fontSize: 12.5, lineHeight: 1.55, color: c['content-primary'] }}>{m.summary}</div>
                )}
              </div>
            )}
          </div>
        ))}
        {busy && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: c['content-secondary'], fontSize: 12 }}><Spinner size={13} />{bootHint || 'Working…'}</div>}
      </div>

      {/* composer */}
      <div style={{ flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.07)', padding: 10 }}>
        <div style={{ border: `1px solid ${c['border-default']}`, borderRadius: 10, padding: 8, background: c['background-base'] }}>
          <textarea
            value={draft}
            onChange={e => onDraftChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Ask a question…  use @ to reference a cell or table"
            rows={2}
            style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: ff.primary, fontSize: 12.5, color: c['content-primary'], lineHeight: 1.5, background: 'transparent' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <PickerChip value={model} options={MODELS} onChange={onModelChange} />
            <PickerChip value={effort} options={EFFORTS} onChange={onEffortChange} small />
            <button
              onClick={submit}
              disabled={!draft.trim() || busy}
              style={{
                marginLeft: 'auto', width: 30, height: 30, borderRadius: 8, border: 'none',
                background: draft.trim() && !busy ? c['content-brand'] : 'rgba(0,0,0,0.08)',
                color: draft.trim() && !busy ? '#fff' : '#aeb6c2', cursor: draft.trim() && !busy ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="Send"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PickerChip: React.FC<{ value: string; options: string[]; onChange: (v: string) => void; small?: boolean }> = ({ value, options, onChange, small }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{ fontFamily: ff.primary, fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], border: '1px solid rgba(0,0,0,0.1)', borderRadius: 7, padding: '3px 6px', background: 'rgba(0,0,0,0.02)', cursor: 'pointer', maxWidth: small ? 90 : 150, outline: 'none' }}>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const Caret = () => <span style={{ display: 'inline-block', width: 7, height: 14, background: '#2770EF', marginLeft: 2, verticalAlign: 'middle', animation: 'hexpulse 1s steps(2) infinite' }} />;
const SparkIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C8.4 4.8 11.2 7.6 14.5 8C11.2 8.4 8.4 11.2 8 14.5C7.6 11.2 4.8 8.4 1.5 8C4.8 7.6 7.6 4.8 8 1.5Z" fill="#2770EF"/></svg>;
const SearchIcon = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const HistoryIcon = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 4V8L10.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/></svg>;

export default AgentRail;
