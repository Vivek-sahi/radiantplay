import React, { useRef, useState } from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import PromptBar, { PromptBarRef } from './PromptBar';

// ── Suggestion chips ──────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { text: 'Analyze campaign performance by channel and region',  dbt: false },
  { text: 'Measure campaign ROI across channels and segments',   dbt: true  },
  { text: 'Track P&L by department using finance data',          dbt: false },
];

// ── AI icon (brain/circuit style) ─────────────────────────────────────────────

const AIIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="1.5" strokeOpacity="0.9" />
    <circle cx="10" cy="10" r="2.5" fill="white" fillOpacity="0.9" />
    <line x1="10" y1="3" x2="10" y2="6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="10" y1="13.5" x2="10" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="3" y1="10" x2="6.5" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="13.5" y1="10" x2="17" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ── Props ──────────────────────────────────────────────────────────────────────

interface NewProjectPromptProps {
  onSubmit: (prompt: string, tables: string[]) => void;
  onStartManually: () => void;
  onStartDbt?: () => void;
  onBack?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

const NewProjectPrompt: React.FC<NewProjectPromptProps> = ({ onSubmit, onStartManually, onStartDbt, onBack }) => {
  const [submitting, setSubmitting] = useState(false);
  const promptBarRef = useRef<PromptBarRef>(null);

  const handleSubmit = (text: string, tables: string[]) => {
    setSubmitting(true);
    setTimeout(() => onSubmit(text, tables), 400);
  };

  const handleSuggestion = (text: string) => {
    promptBarRef.current?.setValue(text);
    promptBarRef.current?.focus();
  };

  return (
    <div style={{ height: '100%', backgroundColor: c['background-base'], display: 'flex', flexDirection: 'column', fontFamily: ff.primary }}>

      <style>{`@keyframes ds-shimmer { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      {/* Back button */}
      {onBack && (
        <div style={{ padding: `${sp.C}px ${sp.D}px`, flexShrink: 0 }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: fs.xs, color: c['content-secondary'], fontFamily: ff.primary, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])}
            onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}
          >
            ← Back
          </button>
        </div>
      )}

      {/* Centered content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          className={submitting ? 'ds-submitting' : ''}
          style={{ width: '100%', maxWidth: 680, padding: `0 ${sp.D}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.E }}
        >

          {/* Heading */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.B }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #2770ef 0%, #5b9ef4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AIIcon />
              </div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                What would you like to build?
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: fs.sm, color: c['content-secondary'] }}>
              Describe your goal and the agent will connect, model, and prep your data.
            </p>
          </div>

          {/* Prompt bar */}
          <div style={{ width: '100%' }}>
            <PromptBar
              ref={promptBarRef}
              onSubmit={handleSubmit}
              disabled={submitting}
              placeholder="Describe your use case and the questions you'd like to answer…"
              autoFocus
              dropDirection="down"
              landingPage
            />
          </div>

          {/* Suggestion chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.B, justifyContent: 'center' }}>
            {SUGGESTIONS.map(s => (
              <SuggestionChip
                key={s.text}
                text={s.text}
                onClick={s.dbt && onStartDbt
                  ? () => { onStartDbt(); handleSuggestion(s.text); }
                  : () => handleSuggestion(s.text)}
              />
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
    </div>
  );
};

const SuggestionChip: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: `${sp.A + 1}px ${sp.C}px`,
      borderRadius: 20,
      border: `1px solid ${c['border-default']}`,
      backgroundColor: 'transparent',
      color: c['content-secondary'],
      fontSize: fs.xs,
      cursor: 'pointer',
      fontFamily: ff.primary,
      lineHeight: '1.4',
      transition: 'all 0.12s',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = c['content-brand'];
      e.currentTarget.style.color = c['content-brand'];
      e.currentTarget.style.backgroundColor = c['background-information'];
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = c['border-default'];
      e.currentTarget.style.color = c['content-secondary'];
      e.currentTarget.style.backgroundColor = 'transparent';
    }}
  >
    {text}
  </button>
);

export default NewProjectPrompt;
