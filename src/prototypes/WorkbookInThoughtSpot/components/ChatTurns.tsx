import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sysVar } from '@tokens/colors';

// Chat-thread furniture copied verbatim from the Apps prototype's creation flow
// (AppsInTS_convoDrafts/apps/CreationFlow.tsx, faris branch, 3 Nov 2026), so the workbook's
// creation chat reads exactly like an App's: "Show work", streaming agent text, the copy and
// feedback row, the "Asked a question" trace under answered questions, the user bubble, and
// the streamed "Working" checklist. Only the exports and BUILD_TOTAL_MS are ours.

const FONT = 'var(--font-family-primary)';
const TEXT_PRIMARY = sysVar('content-primary') as string;
const TEXT_SECONDARY = sysVar('content-secondary') as string;

/** Apps builds in 10 s. A workbook's checklist is shorter, so it gets less. */
const BUILD_TOTAL_MS = 4_000;

/** The tool trace under a collapsed answer: what the agent just did. */
const AskedAQuestion: React.FC = () => (
  <div style={{ marginTop: 10, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontFamily: FONT, fontSize: 'var(--font-size-sm)', lineHeight: '20px', color: TEXT_SECONDARY,
    }}>
      Calling tool
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2.5 4.5L6 8l3.5-3.5" stroke={TEXT_SECONDARY} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
    <span style={{
      display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 6,
      fontFamily: FONT, fontSize: 13, lineHeight: '18px', color: TEXT_SECONDARY,
    }}>
      <span aria-hidden style={{ opacity: 0.7 }}>?</span>
      Asked a question
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M4.5 2.5L8 6l-3.5 3.5" stroke={TEXT_SECONDARY} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  </div>
);

const ShowWork: React.FC = () => (
  <button style={{
    display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginBottom: 8,
    border: 'none', background: 'none', cursor: 'pointer',
    fontFamily: FONT, fontSize: 'var(--font-size-sm)', lineHeight: '20px', color: TEXT_SECONDARY,
  }}>
    Show work
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4.5 2.5L8 6l-3.5 3.5" stroke={TEXT_SECONDARY} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </button>
);


const ActionRow: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 10 }}>
    {[
      // copy
      <svg key="c" width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="1.5" width="8" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.2" /><path d="M2.5 4.5H2C1.45 4.5 1 4.95 1 5.5V12C1 12.55 1.45 13 2 13H8.5C9.05 13 9.5 12.55 9.5 12V11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>,
      // thumb up
      <svg key="u" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 6.5l2.5-4.6c.8 0 1.5.7 1.5 1.5V5h3.2c.8 0 1.4.8 1.2 1.6l-.9 4.2c-.1.7-.7 1.2-1.4 1.2H4M4 6.5V12M4 6.5H1.5V12H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
      // thumb down
      <svg key="d" width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: 'rotate(180deg)' }}><path d="M4 6.5l2.5-4.6c.8 0 1.5.7 1.5 1.5V5h3.2c.8 0 1.4.8 1.2 1.6l-.9 4.2c-.1.7-.7 1.2-1.4 1.2H4M4 6.5V12M4 6.5H1.5V12H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    ].map((icon, i) => (
      <button key={i} style={{
        width: 26, height: 26, border: 'none', background: 'none', cursor: 'pointer',
        borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: sysVar('content-secondary'),
      }}
      onMouseEnter={e => (e.currentTarget.style.background = sysVar('background-sunken'))}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        {icon}
      </button>
    ))}
  </div>
);

/** Word cadence for agent turns — ~20 words/sec. `streamMs` below reads the
 *  same constant so the collector still docks exactly as the turn finishes. */
const WORD_MS = 50;

// Agent turns stream in word-by-word (mounted once per thread item).
const StreamingText: React.FC<{ text: string }> = ({ text }) => {
  const words = useMemo(() => text.split(' '), [text]);
  const [n, setN] = useState(0);
  const endRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (n >= words.length) return;
    const t = setTimeout(() => {
      setN(v => v + 1);
      endRef.current?.scrollIntoView({ block: 'nearest' });
    }, WORD_MS);
    return () => clearTimeout(t);
  }, [n, words.length]);
  return <>{words.slice(0, n).join(' ')}<span ref={endRef} /></>;
};

// The streamed "Working" checklist — steps reveal one by one; the newest is
// the in-progress (grey, shimmering) one, completed steps darken and gain a
// chevron. Used for the build (six-to-eight steps, with narration) and for the
// follow-up edit's two-step beat (no narration); the cadence is the same.
const WorkingChecklist: React.FC<{ steps: string[]; onDone: () => void; narration?: string }> = ({ steps, onDone, narration }) => {
  const [visible, setVisible] = useState(1);
  const doneRef = useRef(false);
  // onDone is a fresh closure on every parent render. Held in a ref and kept
  // out of the effect's deps: with it in, any re-render during the final wait
  // re-ran the effect, the cleanup cleared the finish timer, and the guard
  // below stopped it being rescheduled — the build hung on "Building".
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  // The build takes the same time whatever it has to do: the checklist paces
  // itself to fill BUILD_TOTAL_MS, so six steps and eight steps both land on
  // the same beat instead of the longer one dragging.
  const stepCount = steps.length;
  const stepMs = BUILD_TOTAL_MS / (stepCount + 1);
  useEffect(() => {
    if (visible < stepCount) {
      const t = setTimeout(() => setVisible(v => v + 1), stepMs);
      return () => clearTimeout(t);
    }
    if (doneRef.current) return;
    doneRef.current = true;
    const t = setTimeout(() => onDoneRef.current(), stepMs);
    return () => clearTimeout(t);
  }, [visible, stepCount, stepMs]);

  return (
    <div>
      {/* Per-step entrance + the in-progress label's shimmer sweep. */}
      <style>{`
        @keyframes aits-step-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes aits-shimmer { from { background-position: 190% 0; } to { background-position: -140% 0; } }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
        <span style={{ fontFamily: FONT, fontSize: 'var(--font-size-sm)', color: TEXT_SECONDARY }}>Working</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke={TEXT_SECONDARY} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {/* Narration bullet */}
      {narration && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: sysVar('background-inset'), marginTop: 8, flexShrink: 0 }} />
          <p style={{ margin: 0, fontFamily: FONT, fontSize: 14.5, lineHeight: '22px', color: TEXT_PRIMARY }}>
            {narration}
          </p>
        </div>
      )}
      {/* Tool steps with the connector line */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {steps.slice(0, visible).map((label, i) => {
          const inProgress = i === visible - 1 && visible < steps.length;
          return (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0 5px 1px', position: 'relative',
              animation: 'aits-step-in 180ms cubic-bezier(0.4, 0, 0.2, 1) both',
            }}>
              {i > 0 && <span style={{ position: 'absolute', left: 7, top: -8, width: 1, height: 14, background: sysVar('border-subtle') }} />}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="7" cy="7" r="5.5" stroke={inProgress ? sysVar('content-tertiary') : sysVar('content-secondary')} strokeWidth="1.2" />
                <path d="M7 4v3l2 1.4" stroke={inProgress ? sysVar('content-tertiary') : sysVar('content-secondary')} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span style={{
                fontFamily: FONT, fontSize: 14.5, lineHeight: '22px',
                color: inProgress ? 'transparent' : TEXT_PRIMARY,
                ...(inProgress ? {
                  background: 'linear-gradient(90deg, var(--rd-sys-color-content-tertiary) 0%, var(--rd-sys-color-content-tertiary) 35%, var(--rd-sys-color-content-secondary) 50%, var(--rd-sys-color-content-tertiary) 65%, var(--rd-sys-color-content-tertiary) 100%)',
                  backgroundSize: '240% 100%',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  animation: 'aits-shimmer 3.1s ease-in-out infinite',
                } : null),
              }}>
                {label}
              </span>
              {!inProgress && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6l-3.5 3.5" stroke={sysVar('content-secondary')} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** How long an agent turn takes to stream, so the question card docks as it finishes (Apps). */
export const streamMs = (text: string) => text.split(' ').length * WORD_MS + 700;

export const userBubbleStyle: React.CSSProperties = {
  maxWidth: 640, background: sysVar('background-sunken'), borderRadius: '16px 16px 4px 16px',
  padding: '10px 16px', fontFamily: FONT, fontSize: 15, lineHeight: '23px',
  color: TEXT_PRIMARY, overflowWrap: 'anywhere',
};

export const agentTextStyle: React.CSSProperties = { margin: 0, fontFamily: FONT, fontSize: 15, lineHeight: '23px', color: TEXT_PRIMARY };

export { AskedAQuestion, ShowWork, ActionRow, StreamingText, WorkingChecklist };
