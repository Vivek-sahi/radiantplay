import React, { useState } from 'react';
import { c, ff, fw } from './styles';
import { SCENARIOS, type ScenarioId } from './agentScript';
import { HexKeyframes } from './components/ui';

interface HomeProps {
  // scenarioId null → open a free-form / manual notebook (no scripted build)
  onLaunch: (scenarioId: ScenarioId | null, prompt: string) => void;
}

const SourceDot: React.FC<{ kind: 'snowflake' | 'spotstore' | 'csv' | 'pendo' }> = ({ kind }) => {
  const color = kind === 'snowflake' ? '#29B5E8' : kind === 'spotstore' ? '#7C3AED' : kind === 'csv' ? '#16a34a' : '#F25C2A';
  return <span style={{ width: 7, height: 7, borderRadius: 2, background: color, flexShrink: 0 }} />;
};

const sourceKinds = (sources: string): ('snowflake' | 'spotstore' | 'csv' | 'pendo')[] => {
  const k: ('snowflake' | 'spotstore' | 'csv' | 'pendo')[] = [];
  if (/snowflake/i.test(sources)) k.push('snowflake');
  if (/spotstore/i.test(sources)) k.push('spotstore');
  if (/pendo/i.test(sources)) k.push('pendo');
  if (/csv/i.test(sources)) k.push('csv');
  return k;
};

const Home: React.FC<HomeProps> = ({ onLaunch }) => {
  const [text, setText] = useState('');

  const submitPrompt = () => {
    const t = text.trim();
    if (!t) return;
    const lc = t.toLowerCase();
    // Route to a scripted scenario only when the prompt clearly matches one;
    // otherwise open a real, free-form notebook to work in.
    if (/\bcsv\b/.test(lc) && !/scorecard|health score/.test(lc)) onLaunch(null, t);
    else if (/pendo|no connector|\bapi\b/.test(lc)) onLaunch('s4', t);
    else if (/spotstore/.test(lc)) onLaunch('s2', t);
    else if (/scorecard|health|\bnps\b/.test(lc)) onLaunch('s1', t);
    else onLaunch(null, t);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: c['background-base'], display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: ff.primary, padding: 24, overflowY: 'auto' }}>
      <HexKeyframes />
      <div style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        {/* mark + title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, #2770EF, #6E56CF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 8L3 12L6 16" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18 8L21 12L18 16" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 5L10 19" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.4px' }}>Data Notebook</h1>
          <p style={{ margin: 0, fontSize: 14, color: c['content-secondary'], textAlign: 'center', lineHeight: 1.5, maxWidth: 460 }}>
            Ask the notebook agent to build from your data — wherever it lives. Real SQL and Python, reactive cells.
          </p>
        </div>

        {/* prompt bar */}
        <div style={{ width: '100%', border: `1px solid ${c['border-default']}`, borderRadius: 14, padding: 14, background: c['background-base'], boxShadow: '0 2px 14px rgba(0,0,0,0.05)' }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitPrompt(); } }}
            placeholder="Describe what you want to analyze — e.g. “analyze a CSV”, or “build a customer health scorecard from our warehouse and NPS data”"
            rows={2}
            style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: ff.primary, fontSize: 14, color: c['content-primary'], lineHeight: 1.5, background: 'transparent' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontSize: 11.5, color: '#aeb6c2' }}>Opens a notebook · pick a setup below for a guided build</span>
            <button
              onClick={submitPrompt}
              disabled={!text.trim()}
              style={{ marginLeft: 'auto', width: 34, height: 34, borderRadius: 9, border: 'none', background: text.trim() ? c['content-brand'] : 'rgba(0,0,0,0.08)', color: text.trim() ? '#fff' : '#aeb6c2', cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Launch notebook"
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        {/* scenario chips */}
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: 11.5, fontWeight: fw.semibold, color: '#aeb6c2', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, textAlign: 'center' }}>Or start from a data setup</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {SCENARIOS.map(s => (
              <button
                key={s.id}
                onClick={() => onLaunch(s.id, s.prompt)}
                style={{ textAlign: 'left', border: `1px solid ${c['border-default']}`, borderRadius: 12, padding: '12px 14px', background: c['background-base'], cursor: 'pointer', fontFamily: ff.primary, transition: 'border-color 0.12s, box-shadow 0.12s', display: 'flex', flexDirection: 'column', gap: 5 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c['content-brand']; e.currentTarget.style.boxShadow = '0 2px 12px rgba(39,112,239,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c['border-default']; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ display: 'flex', gap: 3 }}>{sourceKinds(s.sources).map((k, i) => <SourceDot key={i} kind={k} />)}</div>
                  <span style={{ fontSize: 13.5, fontWeight: fw.semibold, color: c['content-primary'] }}>{s.name}</span>
                </div>
                <span style={{ fontSize: 12, color: c['content-secondary'], lineHeight: 1.45 }}>{s.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
