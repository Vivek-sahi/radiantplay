import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../../../components/icons';
import { BrandMark } from '../../../components/BrandMark';
import ModelCanvas, { InitialCanvasJoin } from './ModelCanvas';
import { DraftPlanCardMRD, MOCK_PLAN_BASE } from './AgentPanel';
import TestFixCard, { TestFixItem } from './TestFixCard';
import { c, ff, fw, sp } from '../styles';

type FixPhase = 'idle' | 'reasoning' | 'done';
interface FixFlow { phase: FixPhase; items: TestFixItem[] }

// Animated agent reasoning block — cycles scripted steps, then holds "done".
const REASONING_STEPS = [
  'Reviewing the failed test result',
  "Comparing Spotter's answer with the exact query",
  'Tracing the divergence to the model definition',
];
const ReasoningBlock: React.FC = () => {
  const [step, setStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    REASONING_STEPS.forEach((_, i) => {
      if (i === 0) return;
      timers.current.push(setTimeout(() => setStep(i), i * 720));
    });
    return () => { timers.current.forEach(clearTimeout); };
  }, []);
  return (
    <div style={{ marginTop: sp.E, display: 'flex', flexDirection: 'column', gap: sp.B }}>
      <style>{`@keyframes sx-spin{to{transform:rotate(360deg)}}`}</style>
      {REASONING_STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: sp.B, opacity: i <= step ? 1 : 0.4 }}>
            <span style={{ width: 15, height: 15, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {done ? (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#06BF7F"/><path d="M4.3 7l2 2 3.4-3.6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : active ? (
                <span style={{ width: 12, height: 12, borderRadius: '50%', border: `1.6px solid ${c['border-subtle-hover']}`, borderTopColor: c['content-brand'], animation: 'sx-spin 700ms linear infinite' }} />
              ) : (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c['background-subtle'] }} />
              )}
            </span>
            <span style={{ fontSize: 14, color: done ? c['content-secondary'] : c['content-primary'], lineHeight: 1.4 }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── SpotterX — chat-driven agent shell with an artifact container ─────────────
// Visual copy of the SpotterX design: global top nav, left chat panel on a
// Radiance wash, right artifact card. The artifact hosts the DataStudio
// ModelCanvas unchanged — this shell is strictly presentational.

interface SpotterXShellProps {
  onClose: () => void;
  initialTables?: string[];
  initialJoins?: InitialCanvasJoin[];
}

const CHAT_PANEL_DEFAULT_WIDTH = 460;
const CHAT_PANEL_MIN_WIDTH = 340;
const CHAT_PANEL_MAX_WIDTH = 720;

// Header values from the SpotterX Figma spec (node 2151:49646)
const HEADER_BG = '#F6F8FA';
const UTILITY_BG = '#EAEDF2';
const SEARCH_TEXT = '#777E8B';

// Radiance top-wash, calibrated against the SpotterX Figma frame (Desktop-267):
// a strong warm rose band spans the full width under the header (~#EFE0E4 at
// the top, sampled) and fades out by ~420px, with extra warmth on the left
// and a cooler blue support at the top-right.
const RADIANCE_WASH = [
  'linear-gradient(180deg, rgba(236,199,203,0.50) 0px, rgba(236,199,203,0.22) 140px, rgba(236,199,203,0) 420px)',
  'radial-gradient(900px 500px at 12% 0%, rgba(244,181,178,0.35), transparent 70%)',
  'radial-gradient(700px 480px at 45% 5%, rgba(228,190,214,0.25), transparent 70%)',
  'radial-gradient(640px 420px at 92% 0%, rgba(205,218,246,0.30), transparent 70%)',
].join(', ');

// Film grain — micro noise pass per the Radiance implementation notes.
const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

const BELL_PATH =
  'M14.809 11.7122C13.5183 11.0551 12.7668 9.7408 12.7668 8.28587V6.05578V5.8679C12.7668 3.45093 11.1004 1.69013 8.84765 1.22077V1.19717C8.84765 0.540043 8.30761 0 7.65048 0C6.99335 0 6.45331 0.540043 6.45331 1.19717V1.22077C4.20054 1.69001 2.53415 3.45086 2.53415 5.8679V6.05578V8.30855C2.53415 9.78711 1.73633 11.0315 0.44566 11.7586C0.187883 11.8993 0 12.275 0 12.6272C0 13.1437 0.422052 13.5893 0.962096 13.5893H14.387C14.9034 13.5893 15.3491 13.1672 15.3491 12.6272C15.3019 12.2288 15.0904 11.8529 14.809 11.7122Z';

const IconButton: React.FC<{ children: React.ReactNode; label: string; onClick?: () => void }> = ({ children, label, onClick }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 34, height: 34, border: 'none', background: 'transparent',
      borderRadius: 8, cursor: 'pointer', padding: 0, color: c['content-primary'],
    }}
  >
    {children}
  </button>
);

// 32px round utility button on the header's grey utility background
const UtilityButton: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <button
    type="button"
    aria-label={label}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 32, height: 32, border: 'none', borderRadius: 999,
      backgroundColor: UTILITY_BG, cursor: 'pointer', padding: 0,
      color: c['content-primary'], flexShrink: 0,
    }}
  >
    {children}
  </button>
);

// Figma spec: 60px bar on #F6F8FA with a subtle bottom border; toolbar at
// right-24 with 12px gaps; org pill + avatar form one joined group (2px gap,
// 20px radius on the outer corners, 2px where they meet).
const TopNav: React.FC = () => (
  <div style={{
    height: 60, flexShrink: 0, display: 'flex', alignItems: 'center',
    padding: '0 24px 0 15px', gap: sp.C,
    backgroundColor: HEADER_BG,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
      <IconButton label="Toggle navigation">
        <Icon name="hamburger" size="m" color={c['content-primary']} />
      </IconButton>
      <BrandMark pixelSize={26} aria-hidden />
    </div>

    <div style={{ flex: 1 }} />

    <div style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
      {/* Search pill — 216×32 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: sp.B,
        width: 216, height: 32, padding: '0 12px', boxSizing: 'border-box',
        borderRadius: 140, backgroundColor: UTILITY_BG,
        color: SEARCH_TEXT, fontSize: 14, fontWeight: fw.light, fontFamily: ff.primary,
        cursor: 'text', whiteSpace: 'nowrap', overflow: 'hidden',
      }}>
        <Icon name="magnifying-glass" size="s" color={SEARCH_TEXT} />
        Search in your library
      </div>

      <UtilityButton label="Help">
        <Icon name="question-mark" size="s" color={c['content-primary']} />
      </UtilityButton>

      {/* Bell with unread dot */}
      <UtilityButton label="Notifications">
        <span style={{ position: 'relative', display: 'flex' }}>
          <svg width="16" height="14" viewBox="0 0 16 14" fill={c['content-primary']} aria-hidden>
            <path d={BELL_PATH} />
          </svg>
          <span style={{
            position: 'absolute', top: -4, right: -4, width: 10, height: 10,
            borderRadius: 999, backgroundColor: '#E5484D',
            border: `1.5px solid ${HEADER_BG}`,
          }} />
        </span>
      </UtilityButton>

      {/* Org switcher — joined pill group */}
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
        <button type="button" style={{
          display: 'flex', alignItems: 'center', gap: sp.A,
          padding: '6px 6px 6px 18px', border: 'none',
          borderRadius: '20px 2px 2px 20px', backgroundColor: UTILITY_BG,
          fontFamily: ff.primary, fontSize: 14, fontWeight: fw.medium,
          lineHeight: '20px', color: c['content-primary'], cursor: 'pointer',
        }}>
          Royal Enfield
          <Icon name="chevron-down" size="xs" color={c['content-primary']} />
        </button>
        <div style={{
          width: 32, height: 32, boxSizing: 'border-box', padding: sp.A,
          borderRadius: '2px 20px 20px 2px', backgroundColor: UTILITY_BG,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 999,
            background: 'linear-gradient(135deg, #7C8CF8, #4A5FD0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: fw.semibold, color: c['content-alternate'],
            fontFamily: ff.primary, letterSpacing: 0.2,
          }}>
            KB
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Panel toggle glyph — rounded square outline with a filled left column
const PanelToggleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <rect x="1.5" y="2.5" width="15" height="13" rx="2.5" stroke={c['content-primary']} strokeWidth="1.5" />
    <rect x="3.5" y="4.5" width="4" height="9" rx="1" fill={c['content-primary']} />
  </svg>
);

const ChatPanel: React.FC<{ width: number; onCollapse: () => void; fixFlow: FixFlow }> = ({ width, onCollapse, fixFlow }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (fixFlow.phase !== 'idle' && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [fixFlow.phase]);
  return (
  <div style={{
    width, flexShrink: 0, display: 'flex', flexDirection: 'column',
    padding: '16px 12px 16px 36px', fontFamily: ff.primary, minHeight: 0,
    boxSizing: 'border-box',
  }}>
    {/* Chat header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, flexShrink: 0 }}>
      <span style={{ fontSize: 15, fontWeight: fw.semibold, color: c['content-primary'] }}>
        Campaign performance model
      </span>
      <Icon name="chevron-down" size="s" color={c['content-primary']} />
      <div style={{ flex: 1 }} />
      <IconButton label="Collapse chat panel" onClick={onCollapse}>
        <PanelToggleIcon />
      </IconButton>
    </div>

    {/* Conversation */}
    <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingTop: sp.I, paddingRight: sp.A }}>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: 1.25 }}>
        Campaign Performance
      </h2>
      <p style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.55, color: c['content-primary'] }}>
        I built the model from your requirements doc — orders joined to campaigns
        and users. Both joins are LEFT JOINs so the 27 orders without a campaign
        are preserved as organic traffic instead of being dropped.
      </p>

      {/* MRD plan card — same card the MRD flow narrates, already built */}
      <div style={{ marginTop: sp.F }}>
        <DraftPlanCardMRD plan={{ ...MOCK_PLAN_BASE, version: 1 }} onBuild={() => {}} built />
      </div>

      <p style={{ margin: '28px 0 0', fontSize: 15, lineHeight: 1.55, color: c['content-primary'] }}>
        I hope I was able to set up the model you needed. If you wish to refine
        it further, you may ask -
      </p>
      <ol style={{ margin: '12px 0 0', paddingLeft: sp.F, fontSize: 15, lineHeight: 1.55, color: c['content-primary'], display: 'flex', flexDirection: 'column', gap: sp.C }}>
        <li>Why did you choose LEFT JOINs?</li>
        <li>Run an AI readiness scan on this model</li>
        <li>Publish this model to Spotter</li>
      </ol>

      {/* Fix-with-AI flow — triggered from the Test view */}
      {fixFlow.phase !== 'idle' && (
        <>
          {/* User message */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: sp.G }}>
            <div style={{ maxWidth: '80%', background: c['background-subtle'], borderRadius: 14, padding: '10px 14px', fontSize: 14, lineHeight: 1.5, color: c['content-primary'] }}>
              Fix the issues you found in this test
            </div>
          </div>

          {fixFlow.phase === 'reasoning' ? (
            <ReasoningBlock />
          ) : (
            <>
              <p style={{ margin: '20px 0 0', fontSize: 15, lineHeight: 1.55, color: c['content-primary'] }}>
                I traced the divergence to the model. {fixFlow.items.length === 1 ? 'One change' : `${fixFlow.items.length} changes`} will make
                Spotter answer this question the same way as the exact query:
              </p>
              <div style={{ marginTop: sp.D }}>
                <TestFixCard items={fixFlow.items} />
              </div>
            </>
          )}
        </>
      )}
    </div>

    {/* Input */}
    <div style={{
      flexShrink: 0, marginTop: sp.D, backgroundColor: c['background-base'],
      borderRadius: 14, border: `1px solid ${c['border-default']}`,
      boxShadow: '0 2px 10px rgba(23,31,46,0.06)', padding: '14px 16px 10px',
    }}>
      <div style={{ fontSize: 15, color: c['content-secondary'] }}>
        Press &lsquo;/&rsquo; for skills and &lsquo;@&rsquo; to add context.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: sp.E }}>
        <IconButton label="Add attachment">
          <Icon name="plus" size="m" color={c['content-primary']} />
        </IconButton>
        <div style={{ flex: 1 }} />
        <button type="button" aria-label="Send" style={{
          width: 32, height: 32, borderRadius: 999, border: 'none',
          backgroundColor: c['content-brand'], cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="arrow-up" size="s" color={c['background-base']} />
        </button>
      </div>
    </div>

    <div style={{ flexShrink: 0, marginTop: sp.C, fontSize: 12, color: c['content-secondary'] }}>
      Spotter responses should be reviewed.{' '}
      <span style={{ color: c['content-brand'], cursor: 'pointer' }}>Learn more.</span>
    </div>
  </div>
  );
};

const SpotterXShell: React.FC<SpotterXShellProps> = ({ onClose, initialTables, initialJoins }) => {
  const [chatWidth, setChatWidth] = useState(CHAT_PANEL_DEFAULT_WIDTH);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [fixFlow, setFixFlow] = useState<FixFlow>({ phase: 'idle', items: [] });
  const fixTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (fixTimer.current) clearTimeout(fixTimer.current); }, []);

  const handleTestFixWithAI = (items: TestFixItem[]) => {
    setChatCollapsed(false);
    setFixFlow({ phase: 'reasoning', items });
    if (fixTimer.current) clearTimeout(fixTimer.current);
    fixTimer.current = setTimeout(() => setFixFlow(f => ({ ...f, phase: 'done' })), REASONING_STEPS.length * 720 + 500);
  };
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleDividerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: e.clientX, startWidth: chatWidth };
    setResizing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handleDividerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const next = dragRef.current.startWidth + (e.clientX - dragRef.current.startX);
    setChatWidth(Math.min(CHAT_PANEL_MAX_WIDTH, Math.max(CHAT_PANEL_MIN_WIDTH, next)));
  };
  const handleDividerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    setResizing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
  <div style={{
    position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
    backgroundColor: c['background-base'], fontFamily: ff.primary, overflow: 'hidden',
    userSelect: resizing ? 'none' : undefined,
    cursor: resizing ? 'col-resize' : undefined,
  }}>
    {/* Radiance wash + grain */}
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: RADIANCE_WASH }} />
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: GRAIN_URI, opacity: 0.03 }} />

    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <TopNav />

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {chatCollapsed ? (
          /* Collapsed rail — just the expand toggle */
          <div style={{ width: 56, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: sp.D }}>
            <IconButton label="Expand chat panel" onClick={() => setChatCollapsed(false)}>
              <PanelToggleIcon />
            </IconButton>
          </div>
        ) : (
          <>
            <ChatPanel width={chatWidth} onCollapse={() => setChatCollapsed(true)} fixFlow={fixFlow} />

            {/* Resize handle */}
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize chat panel"
              onPointerDown={handleDividerPointerDown}
              onPointerMove={handleDividerPointerMove}
              onPointerUp={handleDividerPointerUp}
              style={{
                width: 10, flexShrink: 0, cursor: 'col-resize',
                display: 'flex', alignItems: 'stretch', justifyContent: 'center',
                touchAction: 'none',
              }}
            >
              <div style={{
                width: 3, borderRadius: 2, margin: '16px 0',
                backgroundColor: resizing ? c['content-brand'] : 'transparent',
                transition: 'background-color 120ms',
              }} />
            </div>
          </>
        )}

        {/* Artifact container */}
        <div style={{
          flex: 1, minWidth: 0, margin: '16px 16px 16px 0',
          display: 'flex', flexDirection: 'column',
          backgroundColor: c['background-base'], borderRadius: 16,
          border: `1px solid ${c['border-divider']}`,
          boxShadow: '0 6px 24px rgba(23,31,46,0.08)', overflow: 'hidden',
        }}>
          {/* Artifact body — canvas renders the single merged header via slots */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <ModelCanvas
              onBack={onClose}
              initialTables={initialTables}
              initialJoins={initialJoins}
              hideAgentPanel
              hideSemanticModelsTab
              contextualToolbar
              showTestTab
              onTestFixWithAI={handleTestFixWithAI as never}
              embedHeaderLeft={
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, paddingLeft: sp.A }}>
                  <Icon name="schema" size="m" color={c['content-primary']} />
                  <span style={{ fontSize: 15, fontWeight: fw.semibold, color: c['content-primary'], whiteSpace: 'nowrap' }}>{MOCK_PLAN_BASE.modelName}</span>
                </div>
              }
              embedHeaderRight={
                <IconButton label="Close artifact" onClick={onClose}>
                  <Icon name="cross" size="m" color={c['content-primary']} />
                </IconButton>
              }
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default SpotterXShell;
