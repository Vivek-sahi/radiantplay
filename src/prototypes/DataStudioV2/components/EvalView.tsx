import React, { useEffect, useRef, useState } from 'react';
import { ff } from '../styles';

// ── EvalView — system-wide structural + semantic evaluation ───────────────────
// Scripted: Run → scan animation → grouped findings (Structure / Semantics) with
// per-finding Fix + section Fix all → earned health summary. Shares the fix
// vocabulary with TestFixCard.

const BORDER = '1px solid #EAEDF2';
const FONT = ff.primary;

type FindingState = 'pending' | 'fixing' | 'done';
type Phase = 'idle' | 'scanning' | 'results';

interface Finding {
  id: string;
  title: string;
  detail: string;
  fix: string;
  severity: 'high' | 'medium';
}
interface Section {
  key: 'structure' | 'semantics';
  label: string;
  desc: string;
  findings: Finding[];
}

const SECTIONS: Section[] = [
  {
    key: 'structure',
    label: 'Structure',
    desc: 'Joins, cardinality, and row integrity',
    findings: [
      {
        id: 'fanout',
        title: 'Fan-out on orders × campaigns',
        detail: 'The join inflates rows 150 → 312. SUM(amount) would double-count revenue.',
        fix: 'Set cardinality to many-to-one and deduplicate on order_id.',
        severity: 'high',
      },
      {
        id: 'cardinality',
        title: 'Undeclared cardinality on orders × users',
        detail: 'Relationship has no declared cardinality — Spotter may guess wrong on aggregation.',
        fix: 'Declared many-to-one (100% match, zero orphans).',
        severity: 'medium',
      },
    ],
  },
  {
    key: 'semantics',
    label: 'Semantics',
    desc: 'Column meaning, synonyms, and aggregation rules',
    findings: [
      {
        id: 'descriptions',
        title: '8 of 16 columns undescribed',
        detail: 'Agents infer meaning from column names — opaque names like seg_cd guess wrong.',
        fix: 'Generated descriptions for all 8 columns from usage and context.',
        severity: 'high',
      },
      {
        id: 'aggregation',
        title: 'conversion_rate has no aggregation rule',
        detail: 'It is summable by default — SUM of a ratio returns meaningless numbers.',
        fix: 'Marked non-additive; recomputed at query time instead of summed.',
        severity: 'high',
      },
      {
        id: 'synonyms',
        title: 'No synonyms on key columns',
        detail: "Users say 'revenue' and 'customers'; the model uses amount and users.",
        fix: "Added synonyms: revenue → amount, customers → users, period → order_date.",
        severity: 'medium',
      },
    ],
  },
];

const SEV_COLOR: Record<string, { fg: string; bg: string; label: string }> = {
  high: { fg: '#E22B3D', bg: 'rgba(226,43,61,0.08)', label: 'High' },
  medium: { fg: '#B8860B', bg: 'rgba(252,200,56,0.12)', label: 'Medium' },
};

const SCAN_STEPS = [
  'Reading table relationships',
  'Checking join match rates and cardinality',
  'Detecting row-inflation (fan-out)',
  'Scanning column descriptions and synonyms',
  'Validating aggregation rules',
];

const ALL_FINDINGS = SECTIONS.flatMap(s => s.findings);

const EvalView: React.FC<{ onEvaluated?: () => void }> = ({ onEvaluated }) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [scanStep, setScanStep] = useState(0);
  const [states, setStates] = useState<Record<string, FindingState>>(
    () => Object.fromEntries(ALL_FINDINGS.map(f => [f.id, 'pending' as FindingState]))
  );
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const push = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };

  const runScan = () => {
    setPhase('scanning');
    setScanStep(0);
    SCAN_STEPS.forEach((_, i) => { if (i > 0) push(() => setScanStep(i), i * 480); });
    push(() => { setPhase('results'); onEvaluated?.(); }, SCAN_STEPS.length * 480 + 400);
  };

  const fixOne = (id: string, delay = 0) => {
    setStates(prev => (prev[id] === 'pending' ? { ...prev, [id]: 'fixing' } : prev));
    push(() => setStates(prev => (prev[id] === 'fixing' ? { ...prev, [id]: 'done' } : prev)), 900 + delay);
  };
  const fixSection = (sec: Section) => {
    sec.findings.filter(f => states[f.id] === 'pending').forEach((f, i) => push(() => fixOne(f.id), i * 240));
  };

  const totalFindings = ALL_FINDINGS.length;
  const fixedCount = ALL_FINDINGS.filter(f => states[f.id] === 'done').length;
  const allFixed = fixedCount === totalFindings;

  // ── Idle / intro ────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '56px 24px', fontFamily: FONT, background: '#EEF1F5' }}>
        <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: BORDER, boxShadow: '0 2px 12px rgba(25,35,49,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2770EF', margin: '0 auto 14px' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 13l3.5-4.5 3 3L17 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><rect x="2.5" y="2.5" width="15" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.4"/></svg>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1D232F', letterSpacing: '-0.3px' }}>Evaluate the model</div>
          <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.55, marginTop: 6, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
            A system-wide check of the model&rsquo;s structure — joins, cardinality, row integrity — and the semantics Spotter relies on: column descriptions, synonyms, and aggregation rules.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, marginBottom: 20 }}>
            {SECTIONS.map(s => (
              <div key={s.key} style={{ flex: 1, maxWidth: 220, border: BORDER, borderRadius: 10, background: '#fff', padding: '12px 14px', textAlign: 'left' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1D232F' }}>{s.label}</div>
                <div style={{ fontSize: 11, color: '#8B96A5', lineHeight: 1.5, marginTop: 3 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <button
            onClick={runScan}
            style={{ height: 38, padding: '0 20px', borderRadius: 8, border: 'none', background: '#2770EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2359B6'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2770EF'; }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 13l3.5-4.5 3 3L14 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Run evaluation
          </button>
        </div>
      </div>
    );
  }

  // ── Scanning ──────────────────────────────────────────────────────────────
  if (phase === 'scanning') {
    return (
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '56px 24px', fontFamily: FONT, background: '#EEF1F5' }}>
        <style>{`@keyframes ev-spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: '100%', maxWidth: 460, background: '#fff', border: BORDER, borderRadius: 12, boxShadow: '0 1px 4px rgba(25,35,49,0.05)', padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1D232F', marginBottom: 14 }}>Evaluating model…</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {SCAN_STEPS.map((label, i) => {
              const done = i < scanStep;
              const active = i === scanStep;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: i <= scanStep ? 1 : 0.4 }}>
                  <span style={{ width: 15, height: 15, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {done ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#06BF7F"/><path d="M4.3 7l2 2 3.4-3.6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : active ? (
                      <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.6px solid #D5DAE1', borderTopColor: '#2770EF', animation: 'ev-spin 700ms linear infinite' }} />
                    ) : (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D5DAE1' }} />
                    )}
                  </span>
                  <span style={{ fontSize: 12.5, color: done ? '#8B96A5' : '#1D232F' }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px 28px', fontFamily: FONT, background: '#EEF1F5' }}>
      <style>{`@keyframes ev-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Health summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: BORDER, borderRadius: 12, background: allFixed ? 'rgba(6,191,127,0.06)' : '#fff', boxShadow: '0 1px 4px rgba(25,35,49,0.05)', marginBottom: 16, transition: 'background 300ms' }}>
          <span style={{ flexShrink: 0, display: 'flex' }}>
            {allFixed ? (
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="#06BF7F"/><path d="M6 10l2.6 2.6L14 7.2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="#B8860B" fillOpacity="0.14"/><path d="M10 6v4.5" stroke="#B8860B" strokeWidth="1.7" strokeLinecap="round"/><circle cx="10" cy="13.5" r="1" fill="#B8860B"/></svg>
            )}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1D232F', letterSpacing: '-0.2px' }}>
              {allFixed ? 'Structure checked · model is sound' : `${totalFindings - fixedCount} issue${totalFindings - fixedCount === 1 ? '' : 's'} found`}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              {allFixed ? 'Structure and semantics look good. Tune answers next to verify Spotter.' : `${fixedCount} of ${totalFindings} resolved · across structure and semantics`}
            </div>
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map(sec => {
          const pending = sec.findings.filter(f => states[f.id] === 'pending').length;
          return (
            <div key={sec.key} style={{ border: BORDER, borderRadius: 12, background: '#fff', overflow: 'hidden', marginBottom: 14, boxShadow: '0 1px 4px rgba(25,35,49,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 15px', borderBottom: BORDER }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1D232F' }}>{sec.label}</div>
                  <div style={{ fontSize: 11, color: '#8B96A5', marginTop: 1 }}>{sec.desc}</div>
                </div>
                {pending > 0 ? (
                  <button
                    onClick={() => fixSection(sec)}
                    style={{ height: 28, padding: '0 12px', borderRadius: 6, border: 'none', background: '#2770EF', color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#2359B6'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#2770EF'; }}
                  >
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.9 4.4L14 6l-3 3 .8 4.8L8 11.6 4.2 13.8 5 9 2 6l4.1-.6L8 1z" fill="currentColor"/></svg>
                    Fix all
                  </button>
                ) : (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#06BF7F', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#06BF7F"/><path d="M4.3 7l2 2 3.4-3.6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Resolved
                  </span>
                )}
              </div>
              {sec.findings.map(f => {
                const st = states[f.id];
                const sev = SEV_COLOR[f.severity];
                return (
                  <div key={f.id} style={{ padding: '11px 15px', borderBottom: '1px solid #F6F8FA', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1, border: st === 'done' ? 'none' : `1.5px solid ${st === 'fixing' ? '#2770EF' : '#D5DAE1'}`, background: st === 'done' ? '#06BF7F' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: st === 'fixing' ? 'ev-spin 700ms linear infinite' : 'none' }}>
                      {st === 'done' && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {st === 'fixing' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2770EF' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1D232F' }}>{f.title}</span>
                        {st !== 'done' && <span style={{ fontSize: 8.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4, color: sev.fg, background: sev.bg, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{sev.label}</span>}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#8B96A5', lineHeight: 1.5 }}>{st === 'done' ? f.fix : f.detail}</div>
                    </div>
                    {st === 'pending' && (
                      <button
                        onClick={() => fixOne(f.id)}
                        style={{ flexShrink: 0, height: 26, padding: '0 11px', borderRadius: 6, border: '1px solid #E2E6EC', background: '#fff', color: '#2770EF', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.background = '#F5F8FF'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E6EC'; e.currentTarget.style.background = '#fff'; }}
                      >
                        Fix
                      </button>
                    )}
                    {st === 'fixing' && <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#2770EF', paddingTop: 5 }}>Fixing…</span>}
                  </div>
                );
              })}
            </div>
          );
        })}

        <button
          onClick={() => { setPhase('idle'); setStates(Object.fromEntries(ALL_FINDINGS.map(f => [f.id, 'pending']))); }}
          style={{ height: 30, padding: '0 12px', borderRadius: 6, border: BORDER, background: '#fff', color: '#64748B', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: FONT }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#C0C6CF'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEDF2'; }}
        >
          Re-run evaluation
        </button>
      </div>
    </div>
  );
};

export default EvalView;
