import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RadianceBackground, useRadianceState } from '@/app-chrome/RadianceBackground/RadianceBackground';
import { PromptBar, type OpenMenu } from '@spotter/chat';
import { Vertical } from '@components/Layout';
import { WorkbookLive, type WorkbookAgent } from './WorkbookLive';
import { UserMessage } from '../vendor/agentic-ds/chat/UserMessage';
import { QuickActionRow } from '../vendor/agentic-ds/chat/QuickActionRow';
import { ClarifyingQuestion, CLARIFY_EXIT_MS, type ClarifyAnswer, type ClarifyStep } from '../vendor/agentic-ds/chat/ClarifyingQuestion';
import type { ReasoningItem } from '../vendor/agentic-ds/runtime/schema';
import { AgentLine, Thinking } from './agent/AgentFlow';
import { PlanCard, type BuildState } from './agent/PlanCard';
import { WorkingChecklist, agentTextStyle } from './ChatTurns';
import {
  AFTER_APP, AFTER_GROWTH, AFTER_MARGIN, APP_BULLETS, AFTER_ONPLAN, AFTER_PIN, AFTER_PIVOT, APP_ASK, APP_BUILT, APP_INTRO, APP_STEPS, OPEN_NEXT,
  PIN_ASK, PIN_DRAFT, PIN_INTRO, THINK_APP, THINK_GROWTH, THINK_MARGIN, THINK_ONPLAN, THINK_PIVOT,
  appPlan, styleFor, growthAnswer, isApp, isGrowth, isMargin, isOnPlan, isPin, isQuarter, marginAnswer, marginFacts,
  onPlanAnswer, pinAnswer, isShareApp, THINK_SHARE_APP, SHARE_APP_ANSWER, pivotAnswer, quarterFacts, thinkPin,
} from '../data/agentScript';
import type { Workbook } from '../engine/workbook';
import styles from './CreateFlow.module.css';

// Opening an existing workbook (the edit scenario, Vivek 3 Nov): like opening a saved App in Faris's
// Apps prototype, Spotter sits on the left beside the object, already in context, and the workbook
// opens on the right where it was left.
//
// The agent-led workflow (Vivek, 3 Nov: "do the full workflow for Spotter"). The user asks, Spotter
// changes the grid through the same engine as a hand edit (WorkbookAgent: each action is one undo
// step and makes the draft dirty), shows where it worked, and answers with numbers read from the
// sheet. The user still works the grid by hand. Prompts mix commands and goals:
//   margin (command) · growth to 10% (command) · are we on plan? (goal) · revenue by quarter
//   (command) · publish and pin (command, two questions first) · regional leads update their plan
//   (goal → Faris's Apps flow: questions, plan card, Working, an App tab).
// Questions use the Agentic DS clarifying question, docked above the composer as in Apps.

type Next = { id: string; label: string }[];
type Turn =
  | { kind: 'user'; text: string }
  | { kind: 'agent'; text: string; afterThinking?: boolean; next?: Next }
  | { kind: 'think'; items: ReasoningItem[]; then: () => void }
  | { kind: 'plan'; plan: ReturnType<typeof appPlan> }
  | { kind: 'working'; steps: string[]; then: () => void }
  | { kind: 'built'; name: string; text: string; bullets: string[]; next: Next };

interface Ask { steps: ClarifyStep[]; onAnswer: (a: ClarifyAnswer[]) => void }

const BOARD = 'Finance weekly';

export const OpenWorkbook: React.FC<{ build: () => Workbook; onDeleted?: () => void }> = ({ build, onDeleted }) => {
  const initial = useMemo(build, [build]);
  const agent = useRef<WorkbookAgent>(null);
  const [reply, setReply] = useState('');
  const [openMenu, setOpenMenu] = useState<OpenMenu>('none');
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [asking, setAsking] = useState<'in' | 'leaving'>('in');
  const [appBuild, setAppBuild] = useState<BuildState>('idle');
  const intro = `Opened ${initial.name}. It’s on the ${initial.model} model, which refreshed 2 hours ago. Ask me to change it, or work in the sheet.`;
  const [turns, setTurns] = useState<Turn[]>([{ kind: 'agent', text: intro, next: OPEN_NEXT }]);
  const push = (...t: Turn[]) => setTurns((prev) => [...prev, ...t]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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

  const finance = initial.sheets.find((s) => s.name === 'Finance');
  const a = () => agent.current!;
  const num = (v: number | string | null) => (typeof v === 'number' ? v : Number(v) || 0);
  const done = (text: string, next?: Next) => { push({ kind: 'agent', text, afterThinking: true, next }); setBusy(false); };
  // Spotter asks with the docked question card; the answer comes back as the user's turn.
  const askThen = (steps: ClarifyStep[], onAnswer: (a: ClarifyAnswer[]) => void) => { setAsking('in'); setAsk({ steps, onAnswer }); };
  const answerAsk = (answers: ClarifyAnswer[]) => {
    const current = ask;
    setAsking('leaving');
    setTimeout(() => {
      setAsk(null);
      push({ kind: 'user', text: answers.map((x) => x.other || x.selected[0]).filter(Boolean).join(' · ') });
      current?.onAnswer(answers);
    }, CLARIFY_EXIT_MS);
  };

  const run = (text: string) => {
    if (isMargin(text)) {
      return push({ kind: 'think', items: THINK_MARGIN, then: () => {
        a().addColumnFormula('Finance', 'Gross margin %', '=F2/D2');
        done(marginAnswer(marginFacts(finance?.rows ?? [])), AFTER_MARGIN);
      } });
    }
    if (isGrowth(text)) {
      return push({ kind: 'think', items: THINK_GROWTH, then: () => {
        a().setValue('Assumptions', 1, 2, '10%');
        // Show the result where it lands: Summary's Next year column.
        setTimeout(() => a().show('Summary', 7, 7, 2, 6), 700);
        done(growthAnswer(num(a().value('Summary', 1, 6)), num(a().value('Summary', 1, 3))), AFTER_GROWTH);
      } });
    }
    if (isOnPlan(text)) {
      return push({ kind: 'think', items: THINK_ONPLAN, then: () => {
        a().colourScale('Summary', 4, 2, 5);
        const regions = [2, 3, 4, 5].map((r) => ({ name: String(a().value('Summary', 0, r)), variance: num(a().value('Summary', 3, r)) }));
        done(onPlanAnswer(regions, num(a().value('Summary', 3, 6)), num(a().value('Summary', 2, 6))), AFTER_ONPLAN);
      } });
    }
    if (isQuarter(text)) {
      return push({ kind: 'think', items: THINK_PIVOT, then: () => {
        const tab = a().pivot('Finance', 'Region', 'Quarter', 'Total revenue') ?? 'Pivot table 1';
        done(pivotAnswer(tab, quarterFacts(finance?.rows ?? [])), AFTER_PIVOT);
      } });
    }
    if (isShareApp(text)) {
      return push({ kind: 'think', items: THINK_SHARE_APP, then: () => { a().publish(); done(SHARE_APP_ANSWER); } });
    }
    if (isPin(text)) {
      push({ kind: 'agent', text: PIN_INTRO });
      return setTimeout(() => askThen(PIN_ASK.map((q) => ({ ...q, mode: 'single' as const })), (ans) => {
        if (ans[0]?.selected[0] === PIN_ASK[0].options[1]) return done(PIN_DRAFT);
        const live = ans[1]?.selected[0] === PIN_ASK[1].options[1];
        push({ kind: 'think', items: thinkPin(live, BOARD), then: () => {
          // Input table first, so what gets published (and pinned) already includes it.
          if (live) a().makeInput('Assumptions', 'Saves to FINANCE.PLANNING.ASSUMPTIONS in your warehouse');
          setTimeout(() => { a().publish(); a().pin('Summary', BOARD); }, 60);
          done(pinAnswer(live, BOARD), AFTER_PIN);
        } });
      }), 1400);
    }
    if (isApp(text)) {
      return push({ kind: 'think', items: THINK_APP, then: () => {
        push({ kind: 'agent', text: APP_INTRO, afterThinking: true });
        setTimeout(() => askThen(APP_ASK.map((q) => ({ ...q, mode: 'single' as const })), (ans) => {
          const plan = appPlan(ans[0]?.other || ans[0]?.selected[0] || APP_ASK[0].options[0], styleFor(ans[1]?.selected[0] ?? ''));
          push({ kind: 'agent', text: 'Here’s the app I’ll build.' }, { kind: 'plan', plan });
          setBusy(false);
        }), 1400);
      } });
    }
    push({ kind: 'agent', text: 'I can add margin, change the growth rate, check plan against actual, break revenue down by quarter, publish and pin, or build an app for regional leads. Which would help?' });
    setBusy(false);
  };

  const send = (text = reply.trim()) => {
    if (!text || busy || ask) return;
    setReply('');
    setBusy(true);
    push({ kind: 'user', text });
    run(text);
  };

  const radiance = useRadianceState(1, busy);

  return (
    <div className={styles.root}>
      <RadianceBackground pattern="spotterx" state={busy ? radiance : 'answered'} />
      <div className={styles.split}>
        <div className={styles.chat}>
          <div ref={scrollRef} className={styles.thread}>
            <Vertical gap={20} ref={contentRef}>
              {turns.map((t, i) => {
                const last = i === turns.length - 1;
                switch (t.kind) {
                  case 'user':
                    return <div key={i} className={styles.userRow}><UserMessage message={t.text} /></div>;
                  case 'think':
                    return <Thinking key={i} items={t.items} onDone={t.then} />;
                  case 'plan':
                    return (
                      <PlanCard
                        key={i}
                        title={t.plan.title}
                        description={t.plan.description}
                        rows={t.plan.rows}
                        buildState={appBuild}
                        actionLabel="Build app"
                        builtLabel="Built — open app"
                        onBuild={() => {
                          setAppBuild('building');
                          setBusy(true);
                          push({ kind: 'working', steps: APP_STEPS, then: () => {
                            a().addApp({ title: t.plan.title, audience: t.plan.rows[0].value.toLowerCase(), writesTo: 'FINANCE.PLANNING.PLAN_BY_REGION', style: t.plan.style });
                            setAppBuild('built');
                            push({ kind: 'built', name: t.plan.title, text: APP_BUILT, bullets: APP_BULLETS, next: AFTER_APP });
                            setBusy(false);
                          } });
                        }}
                        onOpen={() => a().show(t.plan.title, 0, 0, 2, 2)}
                      />
                    );
                  case 'working':
                    return <WorkingChecklist key={i} steps={t.steps} onDone={t.then} />;
                  case 'built':
                    return (
                      <div key={i}>
                        {/* Faris's built turn: ✅ Built <name>, bullets, then Next. */}
                        <p style={agentTextStyle}>✅ Built <strong>{t.name}</strong> as an App tab in this workbook.</p>
                        <ul style={{ ...agentTextStyle, margin: '8px 0 0', paddingLeft: 20 }}>
                          {t.bullets.map((b) => <li key={b}>{b}</li>)}
                        </ul>
                        <p style={{ ...agentTextStyle, marginTop: 8 }}>{t.text}</p>
                        {last && !busy && (
                          <>
                            <p style={{ ...agentTextStyle, marginTop: 12 }}>Next:</p>
                            <QuickActionRow actions={t.next} onAction={(id) => send(t.next.find((n) => n.id === id)!.label)} />
                          </>
                        )}
                      </div>
                    );
                  default:
                    return (
                      <div key={i}>
                        <AgentLine text={t.text} afterThinking={t.afterThinking} />
                        {/* Next prompts only under the latest answer, so old ones don't linger. */}
                        {t.next && last && !busy && (
                          <div style={{ marginTop: 12 }}>
                            <QuickActionRow actions={t.next} onAction={(id) => send(t.next!.find((n) => n.id === id)!.label)} />
                          </div>
                        )}
                      </div>
                    );
                }
              })}
            </Vertical>
          </div>
          <Vertical gap={0} className={styles.composer}>
            {ask && (
              <div className={styles.dock}>
                <ClarifyingQuestion steps={ask.steps} mode="single" onSubmit={answerAsk} leaving={asking === 'leaving'} />
              </div>
            )}
            <PromptBar
              value={reply}
              onValueChange={setReply}
              onSend={() => send()}
              placeholder={ask ? 'or reply directly…' : undefined}
              minLines={1}
              menuDirection="up"
              focused={focused}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              openMenu={openMenu}
              onOpenMenuChange={setOpenMenu}
            />
          </Vertical>
        </div>
        <div className={styles.canvas}>
          <WorkbookLive initial={initial} publishedAlready onDeleted={onDeleted} agent={agent} />
        </div>
      </div>
    </div>
  );
};

export default OpenWorkbook;
