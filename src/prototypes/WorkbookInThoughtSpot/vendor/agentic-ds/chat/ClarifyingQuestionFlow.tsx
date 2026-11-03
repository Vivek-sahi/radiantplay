import React, { useCallback, useEffect, useRef, useState } from 'react';
import { spacing } from '@tokens/spacing';
import { fontSize, fontWeight, lineHeight } from '@tokens/typography';
import { UserMessage } from './UserMessage';
import { Reasoning, ClarifyAnswersCard } from './Reasoning';
import type { ReasoningItem, ClarifyExchange } from '../runtime/schema';
import PromptBarCore, { type OpenMenu } from './PromptBar';
import { ChatThread } from './ChatThread';
import { threadFor } from '../runtime';
import {
  LeftPanel,
  analysts,
  chats as savedChats,
  type AttentionMotion,
} from '../page/LeftPanel';
import {
  ClarifyingQuestion,
  CLARIFY_EXIT_MS,
  type ClarifyStep,
  type ClarifyAnswer,
} from './ClarifyingQuestion';
import { CHAT_GRID } from './grid';
import styles from './ClarifyingQuestionFlow.module.css';

// ── The pattern ───────────────────────────────────────────────────────────────
// The team settled on this shape: the agent pauses mid-run to ask, and the answers
// are then pinned above the reasoning for the rest of the conversation. The row
// inside the reasoning behaves like any other tool call — collapsed.
//
// A second round of questions does NOT get a second pinned box. It appends into
// the existing one, which grows. One place to look for everything the agent asked.

const QUESTION = 'How are sales doing recently? Give me a breakdown';

// The chat this run belongs to. The panel opens on it, and flags it while the agent
// is waiting — so a user who navigated away can find the conversation that needs
// them instead of coming back to a wall of questions with no signal.
//
// Every other chat in the panel opens its saved thread from the runtime's
// fixtures, which is what makes the flag worth having: switch away, watch the dot
// arrive on an unselected row, come back.
const CHAT_ID = 'c1';

// ── Reasoning segments ────────────────────────────────────────────────────────

const ITEMS_OPENING: ReasoningItem[] = [
  {
    kind: 'text',
    id: 'p1',
    summaryHeader: 'Planning the approach',
    text: 'The user wants to know about recent sales. I need to first retrieve the available data models before I can decide how to slice this.',
  },
  {
    kind: 'tool',
    id: 'mem',
    title: 'Recalling memory',
    doneTitle: 'Recalled memory',
    toolIcon: 'memory',
    loadMs: 1400,
    input: 'memory.recall({ scope: "user" })',
    output: '[\n  "Prefers quarter-over-quarter comparisons",\n  "Works mostly in the Retail — Apparel model"\n]',
  },
  {
    kind: 'tool',
    id: 'models',
    title: 'Fetching data models',
    doneTitle: 'Fetched data models',
    toolIcon: 'fetch',
    loadMs: 2200,
    input: 'datamodels.list()',
    output: '[\n  { name: "Retail — Apparel", rows: 4.2M },\n  { name: "Retail — Footwear", rows: 1.1M }\n]',
  },
  {
    kind: 'text',
    id: 'p2',
    summaryHeader: 'Checking what I still need',
    text: 'I have access to a Retail — Apparel sales dataset. To give you the most useful answer I need to pin down two things: the time window you mean by "recent", and which measure you care about.',
  },
];

// Only in the two-set flow: the agent gets going, then hits a second ambiguity that
// the data itself surfaces.
const ITEMS_MIDDLE: ReasoningItem[] = [
  {
    kind: 'tool',
    id: 'query',
    title: 'Querying the model',
    doneTitle: 'Queried the model',
    toolIcon: 'fetch',
    loadMs: 2000,
    input: "sales.aggregate({ measure: 'quantity', grain: 'month', window: 'last_quarter' })",
    output: '{\n  rows: 3,\n  warning: "2 stores renamed mid-quarter",\n  channels: ["in-store", "online"]\n}',
  },
  {
    kind: 'text',
    id: 'p2b',
    summaryHeader: 'Two things the data raises',
    text: 'The numbers are in, but two stores were renamed partway through the quarter, and the model splits in-store from online. Both change the shape of the answer, so I should ask rather than guess.',
  },
];

const ITEMS_CLOSING: ReasoningItem[] = [
  {
    kind: 'tool',
    id: 'viz',
    title: 'Visualizing data',
    doneTitle: 'Visualized data',
    toolIcon: 'answer',
    loadMs: 2600,
    chart: {
      question: 'Quantity purchased by month, last quarter',
      tokens: [
        { kind: 'measure', label: 'Quantity purchased' },
        { kind: 'keyword', label: 'monthly' },
        { kind: 'date', label: 'date = last quarter' },
      ],
      series: [
        { label: 'Jul', value: 412 },
        { label: 'Aug', value: 476 },
        { label: 'Sep', value: 590 },
      ],
    },
  },
  {
    kind: 'text',
    id: 'p3',
    summaryHeader: 'Wrapping up',
    text: 'Quantity purchased climbed through the quarter, finishing 43% above where it started.',
  },
];

// ── Question sets ─────────────────────────────────────────────────────────────

const SET_ONE: ClarifyStep[] = [
  {
    question: "What time period would you like to see for 'recent' sales?",
    options: ['Last quarter', 'Last 30 days', 'Last 12 months', 'Year to date'],
    mode: 'single',
  },
  {
    question: 'Which metric are you most interested in?',
    options: ['Quantity purchased', 'Revenue', 'Average order value', 'Units returned'],
    mode: 'single',
  },
];

const SET_TWO: ClarifyStep[] = [
  {
    question: 'Two stores were renamed mid-quarter — how should I treat them?',
    options: ['Merge under the new name', 'Keep them separate', 'Exclude both'],
    mode: 'single',
  },
  {
    question: 'Which channels should this cover?',
    options: ['In-store', 'Online', 'Marketplace'],
    mode: 'multi',
  },
];

const RESPONSE_PARAGRAPHS = [
  'Across last quarter you moved 1,478 units, and the trend inside the quarter matters more than the total — September alone accounted for 590 units, 43% above July.',
  'The acceleration is concentrated in the back half of the quarter, which lines up with the autumn range landing in stores. Nothing in the data suggests a one-off spike: the weekly curve climbs steadily rather than jumping.',
];

// ── Attention-dot motion, final ───────────────────────────────────────────────
// The row springs 8px past where it lands, settles back, and re-pops every five
// seconds. The dot itself is static: the movement is the signal, and a dot that
// keeps pulsing after it lands competes with the content rather than pointing at
// it.

export const DOT_MOTION: AttentionMotion = {
  arrival: true,
  outMs: 400,
  settleMs: 300,
  overshootPx: 20, // 8px past where it lands
  restPx: 12, // the 8px dot with 2px of slack either side
  outEase: 'ease',
  settleEase: 'cubic-bezier(0.42, 0.00, 0.38, 1.00)',
  loop: true,
  loopMs: 5000,
  dotPx: 8,
};

// ── The run script ────────────────────────────────────────────────────────────
// A flow is a list of segments the runner walks: reveal some reasoning, pause to
// ask, reveal more. Adding a third round of questions is another two entries.

type Segment =
  | { kind: 'steps'; items: ReasoningItem[] }
  | { kind: 'ask'; id: string; steps: ClarifyStep[] };

export type ClarifyFlowVariant = 'one' | 'two';

const FLOWS: Record<ClarifyFlowVariant, Segment[]> = {
  one: [
    { kind: 'steps', items: ITEMS_OPENING },
    { kind: 'ask', id: 'clarify1', steps: SET_ONE },
    { kind: 'steps', items: ITEMS_CLOSING },
  ],
  two: [
    { kind: 'steps', items: ITEMS_OPENING },
    { kind: 'ask', id: 'clarify1', steps: SET_ONE },
    { kind: 'steps', items: ITEMS_MIDDLE },
    { kind: 'ask', id: 'clarify2', steps: SET_TWO },
    { kind: 'steps', items: ITEMS_CLOSING },
  ],
};

// The timeline row a pause leaves behind: shimmering while the card is up, then
// resolving to the Q&A record. Collapsed, like every other tool call.
const askRow = (id: string): ReasoningItem => ({
  kind: 'tool',
  id,
  title: 'Asking a question',
  doneTitle: 'Asked a question',
  icon: 'question-mark',
});

// ── Timings ───────────────────────────────────────────────────────────────────

const INITIAL_MS = 900; // bouncing dots before the first step lands
const RESUME_MS = 300; // beat before a later segment starts revealing
const TEXT_HOLD_MS = 1100; // how long a text step sits before the next step
const ASK_DELAY_MS = 500; // beat between the last text step and the card appearing
const ANSWER_HOLD_MS = 1600; // the answers sit pinned before the agent moves on
const DONE_DELAY_MS = 600;

type Phase = 'thinking' | 'asking' | 'done';

// ── Flow ──────────────────────────────────────────────────────────────────────

export const ClarifyingQuestionFlow: React.FC<{
  /** Bumping this restarts the run. */
  runId: number;
  variant?: ClarifyFlowVariant;
  wiggleTarget?: 'button' | 'options' | 'card';
  pressTarget?: 'row' | 'control' | 'none';
  pressScale?: number;
  attentionMotion?: AttentionMotion;
}> = ({
  runId,
  variant = 'one',
  wiggleTarget = 'card',
  pressTarget = 'row',
  pressScale = 0.99,
  attentionMotion,
}) => {
  const segments = FLOWS[variant];

  const [phase, setPhase] = useState<Phase>('thinking');
  // The reasoning rows revealed so far. Appending as the run goes means
  // visibleCount is simply the length.
  const [timeline, setTimeline] = useState<ReasoningItem[]>([]);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  // Collapsed by default — while the agent works you see the shimmer header and
  // the latest step ticking over, not the whole trace.
  const [expanded, setExpanded] = useState(false);
  // Every exchange from every round, in one growing pinned box.
  const [answers, setAnswers] = useState<ClarifyExchange[]>([]);
  // Which segment's ask is on screen, if any.
  const [askAt, setAskAt] = useState<number | null>(null);
  const [cardLeaving, setCardLeaving] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu>('none');
  const [barValue, setBarValue] = useState('');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  // Where the panel has navigated to. Exactly one of these is ever set — that is
  // the single-selection rule the panel now enforces — and both being null is the
  // New chat zero state.
  const [viewChatId, setViewChatId] = useState<string | null>(CHAT_ID);
  const [viewAnalystId, setViewAnalystId] = useState<string | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  // Walk the script from a given segment. Reasoning segments reveal themselves and
  // hand over to the next; an ask segment stops and waits for the user.
  const runFrom = (segIdx: number) => {
    if (segIdx >= segments.length) {
      after(DONE_DELAY_MS, () => {
        setPhase('done');
        setExpanded(false); // collapse the trace once the answer is ready
      });
      return;
    }
    const seg = segments[segIdx];

    if (seg.kind === 'ask') {
      setTimeline((t) => [...t, askRow(seg.id)]);
      setAskAt(segIdx);
      setPhase('asking');
      return;
    }

    setPhase('thinking');
    let at = segIdx === 0 ? INITIAL_MS : RESUME_MS;
    seg.items.forEach((item) => {
      after(at, () => setTimeline((t) => [...t, item]));
      if (item.kind === 'tool') {
        at += item.loadMs ?? 1500;
        after(at, () => setLoadedIds((prev) => new Set(prev).add(item.id)));
        at += 250;
      } else {
        at += TEXT_HOLD_MS;
      }
    });
    after(at + ASK_DELAY_MS, () => runFrom(segIdx + 1));
  };

  // Restart from the top whenever the run id or the flow shape changes.
  useEffect(() => {
    clearTimers();
    setPhase('thinking');
    setTimeline([]);
    setLoadedIds(new Set());
    setExpanded(false);
    setAnswers([]);
    setAskAt(null);
    setCardLeaving(false);
    setStopped(false);
    setBarValue('');
    runFrom(0);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, variant]);

  // Resolve the ask on screen: record it, then carry on with the next segment.
  const resolveAsk = (exchanges: ClarifyExchange[], carryOn: boolean) => {
    const at = askAt;
    if (at === null) return;
    const { id } = segments[at] as Extract<Segment, { kind: 'ask' }>;

    // The pinned box grows rather than a second one appearing.
    setAnswers((prev) => [...prev, ...exchanges]);
    setTimeline((t) =>
      t.map((it) => (it.kind === 'tool' && it.id === id ? { ...it, clarify: exchanges } : it)),
    );
    setLoadedIds((prev) => new Set(prev).add(id));
    setAskAt(null);
    setCardLeaving(false);

    if (carryOn) after(ANSWER_HOLD_MS, () => runFrom(at + 1));
    else setPhase('done');
  };

  const handleSubmit = (submitted: ClarifyAnswer[]) => {
    // Let the card slide out before the thread changes underneath it.
    setCardLeaving(true);
    after(CLARIFY_EXIT_MS, () =>
      resolveAsk(
        submitted.map((a) => ({
          question: a.question,
          answers: [...a.selected, ...(a.other ? [a.other] : [])],
        })),
        true,
      ),
    );
  };

  // Stop ends the run. The ask still resolves — recorded as unanswered — so the
  // trace shows what was asked and abandoned rather than the row vanishing.
  const handleStop = () => {
    clearTimers();
    setStopped(true);
    if (askAt === null) {
      setPhase('done');
      return;
    }
    const { steps } = segments[askAt] as Extract<Segment, { kind: 'ask' }>;
    setCardLeaving(true);
    after(CLARIFY_EXIT_MS, () =>
      resolveAsk(
        steps.map((st) => ({ question: st.question, answers: [] })),
        false,
      ),
    );
  };

  // Keep the newest content in view as the run progresses.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [timeline.length, phase, answers.length]);

  const asking = phase === 'asking' && askAt !== null;
  const currentAsk = asking ? (segments[askAt] as Extract<Segment, { kind: 'ask' }>) : null;

  // Navigating away never pauses the run — a conversation that needs you keeps
  // needing you while you are reading something else, which is the whole reason
  // the flag on the row has a job to do.
  const onRun = viewChatId === CHAT_ID;
  const openChat = viewChatId ? savedChats.find((c) => c.id === viewChatId) : undefined;
  const savedThread = onRun || !viewChatId ? undefined : threadFor(viewChatId);
  // The analyst named in the header: the open chat's owner, or the analyst whose
  // zero state we are on.
  const headerAnalyst = analysts.find(
    (a) => a.id === (openChat?.analystId ?? viewAnalystId),
  );
  // Default Spotter is never named — a header with no breadcrumb *is* the
  // Spotter case, same as the shipped chat canvas. An analyst's own zero state
  // has no conversation to be under, so the analyst is the title rather than a
  // crumb in front of one.
  const onAnalystZeroState = !viewChatId && !!viewAnalystId;
  const crumbAnalyst =
    headerAnalyst?.isDefault || onAnalystZeroState ? undefined : headerAnalyst;
  const headerTitle = onRun
    ? QUESTION
    : openChat?.title ?? (onAnalystZeroState ? headerAnalyst?.name ?? 'New chat' : 'New chat');

  return (
    <div style={s.shell}>
      {/* The panel is here because the indicator is the point: the dot is what
          brings someone back to a conversation that's waiting on them. */}
      <LeftPanel
        collapsed={panelCollapsed}
        onCollapsedChange={setPanelCollapsed}
        /* Controlled, and never both at once — see the nav state above.
           A null is not a pick: the panel enforces the one-selection rule by
           clearing the other side, and reports that clear through the other
           callback. Acting on it would undo the selection that caused it. */
        activeId={viewAnalystId}
        activeChatId={viewChatId}
        onActiveIdChange={(id) => {
          if (id === null) return;
          setViewAnalystId(id);
          setViewChatId(null);
        }}
        onActiveChatIdChange={(id) => {
          if (id === null) return;
          setViewChatId(id);
          setViewAnalystId(null);
        }}
        onNewChat={() => {
          setViewChatId(null);
          setViewAnalystId(null);
        }}
        /* Only ever on a chat you are not in. Sitting in the conversation with
           the question in front of you needs no pointer to it; the flag is for
           when you have gone somewhere else, and it clears the moment you come
           back. */
        attentionChatIds={asking && viewChatId !== CHAT_ID ? [CHAT_ID] : []}
        attentionMotion={attentionMotion}
      />

      <div style={s.root}>
      {/* Chat header. The analyst rides here rather than in the nav — that is
          where the affordance went when the panel dropped to one selection. */}
      <div key={`h-${viewChatId ?? 'new'}`} className={styles.headerEnter} style={s.header}>
        {/* Text only, like the shipped header: the analyst's face is an affordance
            of its own and it lives on the agent's turns. */}
        {crumbAnalyst && (
          <>
            <span style={s.crumbAnalyst}>{crumbAnalyst.name}</span>
            <span style={s.crumbSeparator} aria-hidden="true">/</span>
          </>
        )}
        <span style={s.headerTitle}>{headerTitle}</span>
      </div>

      {/* Thread */}
      <div style={s.scroll} ref={scrollRef}>
        <div key={viewChatId ?? 'new'} className={styles.chatEnter}>
        {!onRun ? (
          /* Any other conversation: its saved thread, rendered by the shipped
             chat components. A chat with no fixture behind it is a zero state. */
          <div style={s.threadColumn}>
            {savedThread && (
              <ChatThread messages={savedThread} look="refresh" />
            )}
          </div>
        ) : (
        <div style={s.grid}>
          <UserMessage message={QUESTION} state="default" />

          {/* Everything the agent has asked, pinned here for the rest of the
              conversation. A second round appends into this same box. */}
          {answers.length > 0 && (
            <div style={s.answersBlock}>
              <ClarifyAnswersCard exchanges={answers} standalone />
            </div>
          )}

          {timeline.length > 0 && (
            <Reasoning
              items={timeline}
              visibleCount={timeline.length}
              status={phase === 'done' ? 'done' : 'running'}
              expanded={expanded}
              onToggleExpanded={() => setExpanded((e) => !e)}
              loadedToolIds={loadedIds}
            />
          )}

          {phase === 'done' && (
            <div style={s.response}>
              {stopped ? (
                <p style={s.body}>Stopped there. Ask again whenever you want to pick this up.</p>
              ) : (
                RESPONSE_PARAGRAPHS.map((p, i) => (
                  <p key={i} style={s.body}>{p}</p>
                ))
              )}
            </div>
          )}
        </div>
        )}
        </div>
      </div>

      {/* Footer — the card sits 8px above the bar while the agent waits */}
      <div style={s.footer}>
        <div style={s.grid}>
          {/* The card belongs to its own conversation — it is not waiting on you
              from inside somebody else's thread. */}
          {onRun && currentAsk && (
            <>
              <ClarifyingQuestion
                // Remounts per round, so the second set enters fresh.
                key={currentAsk.id}
                leaving={cardLeaving}
                steps={currentAsk.steps}
                wiggleTarget={wiggleTarget}
                pressTarget={pressTarget}
                pressScale={pressScale}
                onSubmit={handleSubmit}
                onCancel={handleStop}
              />
              <div style={{ height: spacing.B }} />
            </>
          )}
          <PromptBarCore
            value={barValue}
            onValueChange={setBarValue}
            minLines={1}
            menuDirection="up"
            modelSelected
            modelName="Retail — Apparel"
            openMenu={openMenu}
            onOpenMenuChange={setOpenMenu}
            /* While the card is up, the bar is the escape hatch from the given
               options — the placeholder says so. */
            placeholder={onRun && asking ? 'or reply directly…' : undefined}
            /* Stop for the whole run, including the clarifying pauses. Only the
               conversation that is actually generating shows it. */
            generating={onRun && phase !== 'done'}
            stopAppearance="secondary"
            onStop={handleStop}
          />
        </div>
      </div>
      </div>
    </div>
  );
};

export default ClarifyingQuestionFlow;

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  // Panel + thread. The panel owns its own width and collapse behaviour.
  shell: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: 'var(--rd-sys-color-background-base)',
  },
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
    backgroundColor: 'var(--rd-sys-color-background-base)',
  },
  scroll: {
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
    paddingTop: spacing.H,
    paddingBottom: spacing.H,
  },
  grid: {
    width: '100%',
    maxWidth: CHAT_GRID.maxWidth,
    margin: '0 auto',
    padding: `0 ${CHAT_GRID.margin}px`,
    boxSizing: 'border-box',
  },
  footer: {
    flexShrink: 0,
    paddingTop: spacing.C,
    paddingBottom: spacing.F,
  },

  // Chat header — the shipped chat canvas's spec: 56px tall including its 8px
  // top and bottom padding, and the same 24px side inset as the thread column so
  // the title lines up with the messages under it.
  header: {
    flexShrink: 0,
    height: 56,
    display: 'flex',
    alignItems: 'center',
    // 6px, not the 8px token — a slash is a thin glyph carrying its own side
    // bearings, so the token gap reads wider between these three than it
    // measures. Same call as the shipped header.
    gap: 6,
    padding: `${spacing.B}px ${spacing.F}px`,
    boxSizing: 'border-box',
  },
  // Regular weight rather than the chat name's semibold, and it shrinks last: a
  // long chat name gives up its width before the analyst does, since the analyst
  // is the shorter and more stable of the two.
  crumbAnalyst: {
    flexShrink: 0,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: `${lineHeight.lg}px`,
    color: 'var(--rd-sys-color-content-secondary)',
    whiteSpace: 'nowrap',
  },
  crumbSeparator: {
    flexShrink: 0,
    fontSize: fontSize.md,
    lineHeight: `${lineHeight.lg}px`,
    color: 'var(--rd-sys-color-content-tertiary)',
  },
  // Radiant's contentLabel — 16px semibold. One line, ellipsised: a thread named
  // after the question that started it can be a whole sentence.
  headerTitle: {
    minWidth: 0,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: `${lineHeight.lg}px`,
    color: 'var(--rd-sys-color-content-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // ChatThread owns the 800px column itself, so this only supplies the side
  // margins that keep the scrollbar at the pane edge.
  threadColumn: {
    padding: `0 ${CHAT_GRID.margin}px`,
  },

  // The pinned Q&A is a response block: the same 16px inset as the reasoning and
  // the response so all three share one left edge, and the 12px block gap below it.
  // The card is `standalone`, so it carries no margins of its own.
  answersBlock: {
    paddingLeft: spacing.D,
    paddingRight: spacing.D,
    paddingBottom: spacing.C,
  },

  // Response blocks follow the response-formatting baseline (formattingConfig
  // BASELINE): one 12px flex gap between blocks, paragraphs carrying no margins of
  // their own, so spacing is additive and predictable rather than collapsing.
  response: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.C,
    paddingLeft: spacing.D,
    paddingRight: spacing.D,
  },

  // BASELINE: bodySize 16, bodyLH 1.5 (= 24px), bodyWeight 400, pMt/pMb 0 — the
  // container's flex gap does the separating.
  body: {
    margin: 0,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: `${lineHeight.lg}px`,
    color: 'var(--rd-sys-color-content-primary)',
  },
};
