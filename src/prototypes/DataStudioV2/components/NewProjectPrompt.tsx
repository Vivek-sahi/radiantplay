import React, { useRef, useState } from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import PromptBar, { PromptBarRef } from './PromptBar';

// ── Suggestion tiles ──────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { line1: 'Analyze campaign performance', line2: 'by channel and region' },
  { line1: 'Build a sales model',          line2: 'from deals and accounts' },
  { line1: 'Track P&L by department',      line2: 'using finance data' },
];

// ── Props ──────────────────────────────────────────────────────────────────────

interface NewProjectPromptProps {
  onSubmit: (prompt: string, tables: string[]) => void;
  onStartManually: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

const NewProjectPrompt: React.FC<NewProjectPromptProps> = ({ onSubmit, onStartManually }) => {
  const [submitting, setSubmitting] = useState(false);
  const promptBarRef = useRef<PromptBarRef>(null);

  const handleSubmit = (text: string, tables: string[]) => {
    setSubmitting(true);
    setTimeout(() => onSubmit(text, tables), 400);
  };

  const handleSuggestion = (text: string) => {
    promptBarRef.current?.setValue(text);
  };

  return (
    <div style={{ height: '100%', backgroundColor: c['background-sunken'], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff.primary }}>

      <style>{`@keyframes ds-shimmer { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      <div
        className={submitting ? 'ds-submitting' : ''}
        style={{ width: '100%', maxWidth: 660, padding: `0 ${sp.D}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.F }}
      >

        {/* Heading */}
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.3px', lineHeight: 1.2, textAlign: 'center' }}>
          What would you like to build?
        </h1>

        {/* Prompt bar */}
        <div style={{ width: '100%' }}>
          <PromptBar
            ref={promptBarRef}
            onSubmit={handleSubmit}
            disabled={submitting}
            placeholder="Describe your use case and the questions you'd like to answer using data."
            autoFocus
            dropDirection="down"
            compact={false}
          />
        </div>

        {/* Suggestion tiles */}
        <div style={{ display: 'flex', gap: sp.C, width: '100%' }}>
          {SUGGESTIONS.map(s => (
            <SuggestionTile key={s.line1} line1={s.line1} line2={s.line2} onClick={() => handleSuggestion(`${s.line1} ${s.line2}`)} />
          ))}
        </div>

        {/* Start manually */}
        <button
          onClick={onStartManually}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: fs.xs, color: c['content-secondary'], fontFamily: ff.primary, padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])}
          onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}
        >
          Start manually →
        </button>
      </div>
    </div>
  );
};

const SuggestionTile: React.FC<{ line1: string; line2: string; onClick: () => void }> = ({ line1, line2, onClick }) => (
  <button
    onClick={onClick}
    style={{ flex: 1, padding: sp.C, borderRadius: 10, border: `1px solid ${c['border-default']}`, backgroundColor: c['background-base'], color: c['content-secondary'], fontSize: fs.xs, cursor: 'pointer', fontFamily: ff.primary, transition: 'all 0.12s', textAlign: 'left', lineHeight: '1.5' }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = c['content-brand']; e.currentTarget.style.color = c['content-brand']; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = c['border-default']; e.currentTarget.style.color = c['content-secondary']; }}
  >
    <div style={{ fontWeight: fw.medium, color: 'inherit' }}>{line1}</div>
    <div style={{ opacity: 0.8 }}>{line2}</div>
  </button>
);

export default NewProjectPrompt;
