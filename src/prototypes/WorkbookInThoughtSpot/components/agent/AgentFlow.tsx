import React, { useEffect, useRef, useState } from 'react';
import { RadianceBackground, useRadianceState } from '@/app-chrome/RadianceBackground/RadianceBackground';
import { Vertical } from '@components/Layout';
import { PromptBar, type OpenMenu } from '@spotter/chat';
import { Reasoning } from '../../vendor/agentic-ds/chat/Reasoning';
import { UserMessage } from '../../vendor/agentic-ds/chat/UserMessage';
import { QuickActionRow } from '../../vendor/agentic-ds/chat/QuickActionRow';
import type { ReasoningItem } from '../../vendor/agentic-ds/runtime/schema';
import { ActionRow, ShowWork, StreamingText, WorkingChecklist, agentTextStyle, streamMs } from '../ChatTurns';
import { PlanCard, type BuildState } from './PlanCard';
import { WorkbookLoading } from '../WorkbookLoading';
import { WorkbookLive } from '../WorkbookLive';
import { fy26Workbook } from '../../data/fy26';
import { ASK_MODEL, BLANK, BLANK_NEXT, BUILD_STEPS, BUILT, NEXT, PLAN, PLAN_INTRO, THINK_GOAL, isGoal, thinkModel } from '../../data/agentScript';
import { blankWorkbook } from '../../data/finance';
import { SpotterDock } from '../SpotterDock';
import styles from '../CreateFlow.module.css';

// The agent-led workbook (Vivek, 3 Nov 2026). The user gives every command to Spotter; the work they
// do with their own hands on the grid (select, sum, scroll) stays on the grid. Step 1: a goal prompt
// from Home → Spotter reads the goal and searches models (Reasoning) → asks which model, answered in
// the chat → opens it and plans (Reasoning) → plan card (View plan / Build workbook) → the Apps
// "Working" checklist → the workbook opens on the right and the built turn offers next prompts.
//
// Pattern: Faris's Apps creation flow (prompt → questions → plan card → Working → ✅ Built → Next).
// Components: the Agentic DS (vendor/agentic-ds: Reasoning, UserMessage, QuickActionRow) where one
// exists; Faris's plan card and thread furniture (ChatTurns) where the DS one is still pending.

type Turn =
  | { kind: 'user'; text: string }
  | { kind: 'think'; items: ReasoningItem[] }
  | { kind: 'agent'; text: string }
  | { kind: 'plan' }
  | { kind: 'working' }
  | { kind: 'built' };

const STEP_MS = 900;

/** The DS Reasoning timeline, streamed one item at a time, then collapsed when done. */
export const Thinking: React.FC<{ items: ReasoningItem[]; onDone: () => void }> = ({ items, onDone }) => {
  const [visible, setVisible] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });
  const done = visible > items.length;
  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => {
      setVisible((v) => v + 1);
      if (visible === items.length) onDoneRef.current();
    }, visible === 0 ? 300 : STEP_MS);
    return () => clearTimeout(t);
  }, [visible, items.length, done]);
  const shown = Math.min(visible, items.length);
  // Tools finish one step after they appear, so each shows its running title first.
  const loaded = new Set(items.slice(0, done ? items.length : Math.max(0, shown - 1)).filter((i) => i.kind === 'tool').map((i) => i.id));
  return (
    <Reasoning
      items={items}
      visibleCount={shown}
      status={done ? 'done' : 'running'}
      expanded={expanded}
      onToggleExpanded={() => setExpanded((e) => !e)}
      loadedToolIds={loaded}
    />
  );
};

/** An agent line, Apps style: Show work, streamed text, the copy and feedback row. Calls onDone when streamed. */
export const AgentLine: React.FC<{ text: string; onDone?: () => void; afterThinking?: boolean }> = ({ text, onDone, afterThinking }) => {
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });
  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current?.(), streamMs(text));
    return () => clearTimeout(t);
  }, [text]);
  return (
    <div>
      {/* After a reasoning block, that block is the turn's "Show work"; don't repeat it. */}
      {!afterThinking && <ShowWork />}
      <p style={agentTextStyle}><StreamingText text={text} /></p>
      <ActionRow />
    </div>
  );
};

export interface AgentFlowProps {
  /** The goal the user typed on Home. */
  seedPrompt: string;
  runId: number;
  onDeleted?: () => void;
}

export const AgentFlow: React.FC<AgentFlowProps> = ({ seedPrompt, runId, onDeleted }) => {
  // The response follows the input (Vivek, 3 Nov): a goal gets reasoning, the model question and a
  // plan; a plain "create a workbook" gets a blank workbook straight away.
  const [goal] = useState(() => isGoal(seedPrompt));
  const [turns, setTurns] = useState<Turn[]>(() =>
    goal
      ? [{ kind: 'user', text: seedPrompt }, { kind: 'think', items: THINK_GOAL }]
      : [{ kind: 'user', text: seedPrompt }, { kind: 'agent', text: BLANK.intro }, { kind: 'plan' }]);
  // What the composer is waiting for: the model name, or (once built) the next prompt.
  const [awaiting, setAwaiting] = useState<'none' | 'model' | 'next'>('none');
  const [model, setModel] = useState('Finance');
  const [buildState, setBuildState] = useState<BuildState>('idle');
  const [reply, setReply] = useState('');
  const [openMenu, setOpenMenu] = useState<OpenMenu>('none');
  const [focused, setFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const push = (...t: Turn[]) => setTurns((prev) => [...prev, ...t]);
  // Keep the newest turn in view while it streams and grows (a card's footer included), not just
  // when a turn is added.
  useEffect(() => {
    const box = scrollRef.current, content = contentRef.current;
    if (!box || !content) return;
    // Smooth while it grows, then a final settle once it stops, so nothing is left below the fold.
    let settle = 0;
    const ro = new ResizeObserver(() => {
      box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
      window.clearTimeout(settle);
      settle = window.setTimeout(() => box.scrollTo({ top: box.scrollHeight }), 450);
    });
    ro.observe(content);
    return () => { ro.disconnect(); window.clearTimeout(settle); };
  }, []);

  const send = (text = reply.trim()) => {
    if (!text) return;
    setReply('');
    if (awaiting === 'model') {
      const name = text.replace(/\bmodel\b/i, '').trim();
      const m = name.charAt(0).toUpperCase() + name.slice(1);
      setModel(m);
      setAwaiting('none');
      push({ kind: 'user', text }, { kind: 'think', items: thinkModel(m) });
    } else if (awaiting === 'next') {
      // Later demo steps (margin, growth, variance, pivot, publish + pin, data app) land here one by one.
      push({ kind: 'user', text }, { kind: 'agent', text: 'That step of the demo isn’t built yet. It comes next.' });
    }
  };

  const building = buildState !== 'idle';
  const radiance = useRadianceState(runId, buildState === 'building' || turns[turns.length - 1].kind === 'think');

  const thread = (
    <div ref={scrollRef} className={styles.thread}>
    <Vertical gap={20} ref={contentRef}>
      {turns.map((t, i) => {
        const last = i === turns.length - 1;
        switch (t.kind) {
          case 'user':
            return <div key={i} className={styles.userRow}><UserMessage message={t.text} /></div>;
          case 'think':
            return (
              <Thinking
                key={i}
                items={t.items}
                onDone={() => {
                  if (!last) return;
                  if (i === 1) { push({ kind: 'agent', text: ASK_MODEL }); setAwaiting('model'); }
                  else push({ kind: 'agent', text: PLAN_INTRO }, { kind: 'plan' });
                }}
              />
            );
          case 'agent':
            return <AgentLine key={i} text={t.text} afterThinking={turns[i - 1]?.kind === 'think'} />;
          case 'plan':
            return (
              <PlanCard
                key={i}
                title={goal ? PLAN.title : BLANK.title}
                description={goal ? PLAN.description.replace('Finance', model) : BLANK.description}
                rows={goal ? PLAN.rows : []}
                actionLabel={goal ? undefined : BLANK.action}
                busyLabel={goal ? undefined : BLANK.busy}
                buildState={buildState}
                onBuild={() => { setBuildState('building'); push({ kind: 'working' }); }}
                onOpen={() => undefined}
              />
            );
          case 'working':
            return <WorkingChecklist key={i} steps={goal ? BUILD_STEPS : BLANK.steps} onDone={() => { setBuildState('built'); push({ kind: 'built' }); setAwaiting('next'); }} />;
          case 'built':
            if (!goal) return (
              <div key={i}>
                <p style={agentTextStyle}>✅ {BLANK.built} <strong>{BLANK.title}</strong>. It’s open on the right.</p>
                <p style={{ ...agentTextStyle, marginTop: 12 }}>Next:</p>
                <QuickActionRow actions={BLANK_NEXT} onAction={(id) => send(BLANK_NEXT.find((n) => n.id === id)!.label)} />
              </div>
            );
            return (
              <div key={i}>
                <p style={agentTextStyle}>✅ Built <strong>{BUILT.name}</strong> and saved it as a draft in your Workbooks.</p>
                <ul style={{ ...agentTextStyle, margin: '8px 0 0', paddingLeft: 20 }}>
                  {BUILT.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
                <p style={{ ...agentTextStyle, marginTop: 12 }}>Next:</p>
                <QuickActionRow actions={NEXT} onAction={(id) => send(NEXT.find((n) => n.id === id)!.label)} />
              </div>
            );
        }
      })}
    </Vertical>
    </div>
  );

  const composer = (
    <Vertical gap={0} className={styles.composer}>
      <PromptBar
        value={reply}
        onValueChange={setReply}
        onSend={() => send()}
        placeholder={awaiting === 'model' ? 'Name a data model' : undefined}
        minLines={1}
        menuDirection="up"
        focused={focused}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        openMenu={openMenu}
        onOpenMenuChange={setOpenMenu}
      />
    </Vertical>
  );

  return (
    <div className={styles.root}>
      <RadianceBackground pattern="spotterx" state={radiance} />
      {!building ? (
        <div className={styles.centered}>
          <div className={styles.column}>
            {thread}
            {composer}
          </div>
        </div>
      ) : (
        <div className={styles.split}>
          <SpotterDock>
            {thread}
            {composer}
          </SpotterDock>
          <div className={styles.canvas}>
            {buildState === 'built'
              ? <WorkbookLive initial={goal ? fy26Workbook() : blankWorkbook(BLANK.title)} onDeleted={onDeleted} />
              : <WorkbookLoading name={goal ? PLAN.title : BLANK.title} status={goal ? 'Building tabs' : 'Opening Sheet 1'} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentFlow;
