import React, { useState } from 'react';
import {
  UserBubble,
  UserMessage,
  AgentMessage,
  TypingIndicator,
  ReasoningBlock,
  Reasoning,
  SpotterPrompt,
  PromptBar,
  QuickAction,
  QuickActionRow,
  SpotterChatProvider,
} from '@spotter/chat';
import type {
  OpenMenu,
  PromptBarMode,
  ReasoningItem,
  UserMessageFile,
} from '@spotter/chat';
// The chat barrel does not export the Slack logo asset, so the fixture imports
// it from the component's own asset folder.
import slackLogo from '@spotter/chat/assets/slack.png';
import { Horizontal, Vertical } from '@components/Layout';
import { spacing } from '@tokens/spacing';
import { fontSize, fontWeight } from '@tokens/typography';
import {
  TextBlock,
  VizBlock,
  SourcesBlock,
  FollowUpsBlock,
  RefineBlock,
  ErrorBlock,
} from '@spotter/chat/blocks';
import {
  PanelToggleIcon,
  BellIcon,
  ThoughtSpotMark,
  ChartSearchIcon,
  OrbitsIcon,
} from '@spotter/icons';
import { spotterGlow, spotterChartBg, spotterLayout } from '@spotter/tokens';
import type {
  ChatMessage,
  TextBlockData,
  VizBlockData,
  SourcesBlockData,
  FollowUpsBlockData,
  RefineBlockData,
  ErrorBlockData,
} from '@spotter/runtime';
import { PreviewCard } from './PreviewCard';
import styles from './SpotterShowcase.module.css';

// ── Mock messages for static previews ──────────────────────────────────────

const userMessage: ChatMessage = {
  id: 'demo-user-1',
  role: 'user',
  stage: 'done',
  text: 'Show me total sales by month for the last quarter.',
  createdAt: Date.now() - 60_000,
};

const agentStreamingMessage: ChatMessage = {
  id: 'demo-agent-streaming',
  role: 'agent',
  stage: 'streaming',
  reasoning: {
    steps: [
      { id: 's1', label: 'Understanding the question', status: 'done' },
      { id: 's2', label: 'Finding the right tables', status: 'current' },
      { id: 's3', label: 'Generating the answer', status: 'pending' },
    ],
    isDone: false,
  },
  content: {
    blocks: [
      { kind: 'text', id: 'demo-streaming-text', text: 'Looking at your sales data for the last quarter…' },
    ],
  },
  createdAt: Date.now() - 30_000,
};

const agentDoneMessage: ChatMessage = {
  id: 'demo-agent-done',
  role: 'agent',
  stage: 'done',
  reasoning: {
    steps: [
      { id: 's1', label: 'Understanding the question', status: 'done', description: 'You asked for total sales grouped by month.' },
      { id: 's2', label: 'Finding the right tables', status: 'done', description: 'Used the Orders and OrderItems tables.' },
      { id: 's3', label: 'Generating the answer', status: 'done' },
    ],
    isDone: true,
    durationSeconds: 4,
  },
  content: {
    blocks: [
      {
        kind: 'text',
        id: 'demo-done-text',
        text: 'Here are your total sales by month for the last quarter. February had the strongest performance, driven by enterprise renewals.',
      },
    ],
  },
  createdAt: Date.now() - 20_000,
};

const reasoningCollapsed = {
  steps: [
    { id: 's1', label: 'Understanding the question', status: 'done' as const },
    { id: 's2', label: 'Finding the right tables', status: 'done' as const },
    { id: 's3', label: 'Generating the answer', status: 'done' as const },
  ],
  isDone: true,
  durationSeconds: 3,
};

const reasoningExpanded = {
  steps: [
    {
      id: 's1',
      label: 'Understanding the question',
      status: 'done' as const,
      description: 'Parsed the intent: total sales grouped by month over the last 90 days.',
    },
    {
      id: 's2',
      label: 'Finding the right tables',
      status: 'done' as const,
      description: 'Joined Orders with OrderItems on order_id.',
    },
    {
      id: 's3',
      label: 'Generating the answer',
      status: 'done' as const,
      description: 'Aggregated revenue per month and rendered a line chart.',
    },
  ],
  isDone: true,
  durationSeconds: 4,
};

const reasoningStreaming = {
  steps: [
    { id: 's1', label: 'Understanding the question', status: 'done' as const },
    {
      id: 's2',
      label: 'Finding the right tables',
      status: 'current' as const,
      description: 'Scanning the model for tables that contain sales and date columns…',
    },
    { id: 's3', label: 'Generating the answer', status: 'pending' as const },
  ],
  isDone: false,
};

// ── Refresh reasoning fixtures ─────────────────────────────────────────────
//
// `Reasoning` owns a flat timeline of text rows and tool rows, not the runtime's
// step model, so its fixtures are written directly as `ReasoningItem[]`.

const reasoningRunningItems: ReasoningItem[] = [
  {
    kind: 'text',
    id: 'run-intent',
    summaryHeader: 'Reading the question',
    text: 'You want pipeline by stage for last quarter, plus whatever the revenue channel said about the two deals that slipped.',
  },
  {
    kind: 'tool',
    id: 'run-search',
    title: 'Searching the data model',
    doneTitle: 'Searched the data model',
    toolIcon: 'fetch',
    input: "search({ model: 'Sales core', terms: ['pipeline', 'stage'] })",
    output: '3 matching tables — Opportunities, Stages, Accounts',
  },
  {
    kind: 'tool',
    id: 'run-query',
    title: 'Running the query',
    doneTitle: 'Ran the query',
    toolIcon: 'code',
    group: 'parallel-1',
  },
  {
    kind: 'tool',
    id: 'run-slack',
    title: 'Reading #revenue',
    doneTitle: 'Read #revenue',
    connector: 'Slack',
    logo: slackLogo,
    group: 'parallel-1',
  },
];

// Only the first tool has finished; the trailing pair is still loading, which is
// what puts the semi-collapsed view on a parallel step.
const reasoningRunningLoaded = new Set(['run-search']);

const reasoningDoneItems: ReasoningItem[] = [
  {
    kind: 'text',
    id: 'done-intent',
    summaryHeader: 'Reading the question',
    text: 'Total sales grouped by month, over the last quarter.',
  },
  {
    kind: 'tool',
    id: 'done-fetch',
    title: 'Fetching sales by month',
    doneTitle: 'Fetched sales by month',
    toolIcon: 'fetch',
    input: "fetch({ table: 'Orders', measure: 'revenue', groupBy: 'month' })",
    output: '{ "rows": 3, "total": 4200000, "peak": "Feb" }',
  },
  {
    kind: 'text',
    id: 'done-read',
    text: 'February led the quarter at $1.7M, mostly enterprise renewals. March dipped early and recovered in the second half.',
  },
  {
    kind: 'tool',
    id: 'done-error',
    title: 'Posting the summary to #revenue',
    doneTitle: 'Posted the summary to #revenue',
    connector: 'Slack',
    logo: slackLogo,
    error: 'Permission denied. The Slack connector is not authorised to post in #revenue.',
  },
];

// `Reasoning` is controlled, so previews own the expanded flag and stay clickable.
const ReasoningPreview: React.FC<{
  items: ReasoningItem[];
  status: 'running' | 'done';
  initialExpanded: boolean;
  loadedToolIds?: Set<string>;
  doneLabel?: string;
}> = ({ items, status, initialExpanded, loadedToolIds, doneLabel }) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  return (
    <Reasoning
      items={items}
      visibleCount={items.length}
      status={status}
      expanded={expanded}
      onToggleExpanded={() => setExpanded((prev) => !prev)}
      loadedToolIds={loadedToolIds}
      doneLabel={doneLabel}
    />
  );
};

// ── Refresh user-message fixtures ──────────────────────────────────────────

const userMessageFiles: UserMessageFile[] = [
  { name: 'q4-pipeline.csv', type: 'csv', size: '48 KB' },
  { name: 'board-deck.pdf', type: 'pdf', size: '2.1 MB' },
];

// ── PromptBar previews ─────────────────────────────────────────────────────
//
// `PromptBar` is the core bar. `PromptBarPlayground` wraps it with a resizable
// frame and a drag handle, which a doc card does not need, so these previews
// drive the core directly from local state.

const PromptBarPreview: React.FC<{
  mode: PromptBarMode;
  startFocused?: boolean;
}> = ({ mode, startFocused = false }) => {
  const [value, setValue] = useState(startFocused ? 'Pipeline by stage for last quarter' : '');
  const [openMenu, setOpenMenu] = useState<OpenMenu>('none');
  const [focused, setFocused] = useState(startFocused);
  const [deepAnalysis, setDeepAnalysis] = useState(false);
  return (
    <Vertical style={{ width: '100%', maxWidth: 640 }}>
      <PromptBar
        focused={focused}
        openMenu={openMenu}
        onOpenMenuChange={setOpenMenu}
        deepAnalysis={deepAnalysis}
        onDeepAnalysisChange={setDeepAnalysis}
        value={value}
        onValueChange={setValue}
        onFocus={() => setFocused(true)}
        onSend={() => setValue('')}
        minLines={mode === 'landing' ? 2 : 1}
        menuDirection={mode === 'landing' ? 'down' : 'up'}
        modelSelected
        modelName="Sales core"
        skills
        googleDrive
      />
    </Vertical>
  );
};

// ── Response grid spec ─────────────────────────────────────────────────────

const RESPONSE_GRID_ROWS: Array<{ label: string; value: string; note: string }> = [
  { label: 'Page gutter', value: '24px', note: 'Outer band on each side of the page.' },
  { label: 'Inner padding', value: '16px', note: 'Each side of the response, inside the content column.' },
  { label: 'Content column', value: 'max 800px', note: 'Centred. Holds the user message and the response.' },
  { label: 'Text column', value: 'max 768px', note: 'Text inside the response, after the inner padding.' },
];

const ResponseGridSpec: React.FC = () => (
  <Vertical gap={spacing.D} style={{ width: '100%' }}>
    {RESPONSE_GRID_ROWS.map((row) => (
      <Vertical key={row.label} gap={spacing.A}>
        <Horizontal gap={spacing.C} align="baseline" justify="space-between">
          <span style={{ fontSize: fontSize.sm, fontWeight: fontWeight.emphasis, color: 'var(--rd-sys-color-content-primary)' }}>
            {row.label}
          </span>
          <code style={{ fontSize: fontSize.xs, fontFamily: 'var(--font-family-mono)', color: 'var(--rd-sys-color-content-secondary)' }}>
            {row.value}
          </code>
        </Horizontal>
        <span style={{ fontSize: fontSize.xs, color: 'var(--rd-sys-color-content-tertiary)' }}>{row.note}</span>
      </Vertical>
    ))}
    <span style={{ fontSize: fontSize.xs, color: 'var(--rd-sys-color-content-tertiary)' }}>
      The live spec, with a grid overlay you can toggle, is at{' '}
      <a href="/playground/SpotterComponents" style={{ color: 'var(--rd-sys-color-content-brand)', fontWeight: fontWeight.medium }}>
        /playground/SpotterComponents
      </a>
      .
    </span>
  </Vertical>
);

// ── Mock block data ────────────────────────────────────────────────────────

const textBlockShort: TextBlockData = {
  kind: 'text',
  id: 'tb-short',
  text: 'Total sales were $4.2M in Q4, up 12% year over year.',
};

const textBlockLong: TextBlockData = {
  kind: 'text',
  id: 'tb-long',
  text: 'Total sales were $4.2M in Q4, up 12% year over year. February led the quarter with $1.7M, driven by enterprise renewals and a strong push from the EMEA region. The dip in early March was offset by a recovery in the second half, mostly from existing accounts expanding their seat count. Compared to the same period last year, customer count grew 8% while average deal size grew 4%.',
};

const vizLine: VizBlockData = {
  kind: 'viz',
  id: 'viz-line',
  title: 'Sales by month',
  tokens: [
    { id: 't1', label: 'Sales', kind: 'measure' },
    { id: 't2', label: 'Month', kind: 'keyword' },
  ],
  source: {
    type: 'data',
    chartKind: 'line',
    data: {
      xAxis: { categories: ['Jan', 'Feb', 'Mar'] },
      series: [{ id: 's1', label: 'Sales', data: [1.2, 1.7, 1.3] }],
    },
  },
};

const sourcesData: SourcesBlockData = {
  kind: 'sources',
  id: 'src-1',
  items: [
    { id: 'src-orders', label: 'Orders' },
    { id: 'src-items', label: 'OrderItems' },
    { id: 'src-cust', label: 'Customers' },
  ],
};

const followupsData: FollowUpsBlockData = {
  kind: 'followups',
  id: 'fu-1',
  suggestions: [
    'Break this down by region',
    'Compare to the same quarter last year',
    'Show only enterprise accounts',
  ],
};

const refineData: RefineBlockData = {
  kind: 'refine',
  id: 'rf-1',
  questions: [
    'Do you mean fiscal Q4 or calendar Q4?',
    'Should I include refunds?',
    'Group by month or by week?',
  ],
};

const errorData: ErrorBlockData = {
  kind: 'error',
  id: 'err-1',
  message: 'I could not connect to the data model. Check the connection and try again.',
};

// ── Interactive prompt previews ────────────────────────────────────────────

const PromptEmpty: React.FC = () => {
  const [value, setValue] = useState('');
  return (
    <SpotterPrompt
      value={value}
      onChange={setValue}
      onSubmit={() => undefined}
      dataModelLabel="Sales core"
      onDataModelClick={() => undefined}
    />
  );
};

const PromptFilled: React.FC = () => {
  const [value, setValue] = useState('Show me total sales by month');
  return (
    <SpotterPrompt
      value={value}
      onChange={setValue}
      onSubmit={() => undefined}
      dataModelLabel="Sales core"
      onDataModelClick={() => undefined}
    />
  );
};

const PromptDisabled: React.FC = () => (
  <SpotterPrompt
    value=""
    onChange={() => undefined}
    onSubmit={() => undefined}
    dataModelLabel="Sales core"
    onDataModelClick={() => undefined}
    disabled
  />
);

// ── Icons preview helpers ─────────────────────────────────────────────────

const ICON_SIZES = ['xs', 's', 'm', 'l', 'xl'] as const;

type SpotterIconSize = typeof ICON_SIZES[number];

const IconSizeRow: React.FC<{ glyph: React.ReactElement<{ size?: SpotterIconSize }>; importName: string }> = ({ glyph, importName }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', width: '100%' }}>
    <code style={{ fontFamily: 'var(--font-family-mono)', fontSize: 13, color: 'var(--rd-sys-color-content-secondary)', minWidth: 160 }}>
      {importName}
    </code>
    {ICON_SIZES.map((size) => (
      <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 28, color: 'var(--rd-sys-color-content-primary)' }}>
          {React.cloneElement(glyph, { size })}
        </div>
        <span style={{ fontSize: 11, color: 'var(--rd-sys-color-content-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{size}</span>
      </div>
    ))}
  </div>
);

// ── Tokens preview helpers ────────────────────────────────────────────────

const GlowSwatch: React.FC = () => (
  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div
      style={{
        height: 120,
        borderRadius: 8,
        border: '1px solid var(--rd-sys-color-background-subtle)',
        background: `radial-gradient(circle at center, ${spotterGlow.from} 0%, ${spotterGlow.to} 70%)`,
      }}
    />
    <div style={{ fontSize: 12, fontFamily: 'var(--font-family-mono)', color: 'var(--rd-sys-color-content-secondary)' }}>
      from: {spotterGlow.from} · to: {spotterGlow.to}
    </div>
  </div>
);

const ChartBgSwatches: React.FC = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, width: '100%' }}>
    {(Object.entries(spotterChartBg) as Array<[keyof typeof spotterChartBg, string]>).map(([key, color]) => (
      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 64, background: color, borderRadius: 8, border: '1px solid var(--rd-sys-color-background-subtle)' }} />
        <div style={{ fontSize: 13, fontWeight: 'var(--font-weight-emphasis)', color: 'var(--rd-sys-color-content-primary)' }}>{key}</div>
        <code style={{ fontSize: 11, fontFamily: 'var(--font-family-mono)', color: 'var(--rd-sys-color-content-secondary)' }}>{color}</code>
      </div>
    ))}
  </div>
);

const LayoutSwatch: React.FC = () => (
  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 13, fontWeight: 'var(--font-weight-emphasis)', color: 'var(--rd-sys-color-content-primary)' }}>chatMaxWidth</span>
        <code style={{ fontSize: 12, fontFamily: 'var(--font-family-mono)', color: 'var(--rd-sys-color-content-secondary)' }}>{spotterLayout.chatMaxWidth}px</code>
      </div>
      <div style={{ height: 8, background: 'var(--rd-sys-color-content-brand)', borderRadius: 4, width: '100%' }} />
      <div style={{ fontSize: 12, color: 'var(--rd-sys-color-content-tertiary)' }}>
        Right-pane content container — wraps the chat thread and sticky prompt.
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 13, fontWeight: 'var(--font-weight-emphasis)', color: 'var(--rd-sys-color-content-primary)' }}>textMaxWidth</span>
        <code style={{ fontSize: 12, fontFamily: 'var(--font-family-mono)', color: 'var(--rd-sys-color-content-secondary)' }}>{spotterLayout.textMaxWidth}px</code>
      </div>
      <div style={{ height: 8, background: 'var(--rd-sys-color-content-brand)', borderRadius: 4, width: `${(spotterLayout.textMaxWidth / spotterLayout.chatMaxWidth) * 100}%` }} />
      <div style={{ fontSize: 12, color: 'var(--rd-sys-color-content-tertiary)' }}>
        Text content inside the container — narrower for readability.
      </div>
    </div>
  </div>
);

// ── Page ───────────────────────────────────────────────────────────────────

export const SpotterShowcase: React.FC = () => {
  return (
    <SpotterChatProvider mode="canned">
      <SpotterShowcaseInner />
    </SpotterChatProvider>
  );
};

const SpotterShowcaseInner: React.FC = () => {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Spotter showcase</h1>
        <p className={styles.pageSubtitle}>
          Every component in the Spotter design system — chat surface, block renderers, page shell,
          icons, and tokens. Static previews with the common variants.
        </p>
        <nav className={styles.toc} aria-label="Sections">
          <a href="#chat">Chat</a>
          <a href="#blocks">Blocks</a>
          <a href="#shell">Page shell</a>
          <a href="#icons">Spotter icons</a>
          <a href="#tokens">Spotter tokens</a>
        </nav>
      </header>

      {/* ─── Chat section ───────────────────────────────────────────────── */}
      <section id="chat" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Chat</h2>
          <p className={styles.sectionLead}>
            Primitives that compose the agentic conversation surface. Imported from <code>@spotter/chat</code>.
          </p>
        </header>

        <PreviewCard
          name="UserBubble"
          path="@spotter/chat"
          description="Adapter, not a renderer. Takes a runtime ChatMessage and renders UserMessage — a right-aligned squircle bubble with the timestamp below it, no avatar. New code that owns its own strings should render UserMessage directly."
          variants={[
            {
              label: 'Default',
              description: 'Runtime ChatMessage in, Refresh bubble out.',
              node: <UserBubble message={userMessage} />,
            },
          ]}
        />

        <PreviewCard
          name="UserMessage"
          path="@spotter/chat"
          description="The Refresh user bubble. Right-aligned squircle with the timestamp below, hover actions, inline edit, file cards, and a quoted-context pill. Long text clamps with a show-more affordance."
          variants={[
            {
              label: 'Default',
              description: 'Message text plus timestamp.',
              node: (
                <UserMessage
                  message="Show me total sales by month for the last quarter."
                  timestamp="10:24 AM"
                />
              ),
            },
            {
              label: 'With files',
              description: 'Two attached files render as FileCards below the text.',
              node: (
                <UserMessage
                  message="Compare these two against what the model says."
                  files={userMessageFiles}
                  timestamp="10:26 AM"
                />
              ),
            },
            {
              label: 'With highlighted text',
              description: 'Quoted context pill above the message; the text clamps to three lines instead of four.',
              node: (
                <UserMessage
                  message="Why did this happen, and is it likely to repeat next quarter?"
                  highlightedText="February had the strongest performance, driven by enterprise renewals."
                  timestamp="10:31 AM"
                />
              ),
            },
          ]}
        />

        <PreviewCard
          name="AgentMessage"
          path="@spotter/chat"
          description="Avatar + reasoning + response blocks + feedback row. Renders different chrome based on stage (streaming, done)."
          variants={[
            {
              label: 'Streaming',
              description: 'Reasoning auto-expands while the agent is thinking.',
              node: <AgentMessage message={agentStreamingMessage} />,
            },
            {
              label: 'Done',
              description: 'Reasoning auto-collapses 600ms after the message completes.',
              node: <AgentMessage message={agentDoneMessage} />,
            },
            {
              label: 'Done with feedback row',
              description: 'Feedback row appears only when stage === "done".',
              node: <AgentMessage message={agentDoneMessage} />,
            },
          ]}
        />

        <PreviewCard
          name="TypingIndicator"
          path="@spotter/chat"
          description='Spinner + "Analysing…" shown between submit and the first reasoning chunk.'
          variants={[
            {
              label: 'Active',
              node: <TypingIndicator />,
            },
          ]}
        />

        <PreviewCard
          name="ReasoningBlock"
          path="@spotter/chat"
          description='Adapter, not a renderer. Takes a runtime ReasoningTrace and renders Reasoning, turning each step into a text row plus a tool row. It also owns the lifecycle: semi-collapsed while running, a brief expand at done, then "Show work" — and a user click locks the state. "Thought for N seconds" is now the terminal row of the expanded timeline, not a footer. New code that owns its own item list should render Reasoning directly.'
          variants={[
            {
              label: 'Collapsed (done)',
              description: 'Default state after the message completes.',
              node: <ReasoningBlock reasoning={reasoningCollapsed} stage="done" />,
            },
            {
              label: 'Expanded',
              description: 'Steps with descriptions visible.',
              node: <ReasoningBlock reasoning={reasoningExpanded} stage="done" />,
            },
            {
              label: 'Streaming',
              description: 'Semi-collapsed while the agent is thinking — only the latest step shows.',
              node: <ReasoningBlock reasoning={reasoningStreaming} stage="streaming" />,
            },
          ]}
        />

        <PreviewCard
          name="Reasoning"
          path="@spotter/chat"
          description="The Refresh reasoning timeline, and what new chat surfaces should render. A flat list of text rows and tool rows; tool rows expand to input / output code, carry a Radiant icon, a tool glyph or an MCP logo, and can report an error. Controlled — the consumer owns `expanded` and `visibleCount`. Tools sharing a `group` run in parallel and collapse into one step."
          variants={[
            {
              label: 'Running, semi-collapsed',
              description: 'Latest step is a parallel group — one internal tool plus a Slack connector — so the shimmer header reads "Calling tool and using Slack".',
              node: (
                <ReasoningPreview
                  items={reasoningRunningItems}
                  status="running"
                  initialExpanded={false}
                  loadedToolIds={reasoningRunningLoaded}
                />
              ),
            },
            {
              label: 'Done, expanded',
              description: 'Text rows, a tool row with input and output, a failed connector row, and the terminal done row.',
              node: (
                <ReasoningPreview
                  items={reasoningDoneItems}
                  status="done"
                  initialExpanded
                  doneLabel="Thought for 6 seconds"
                />
              ),
            },
            {
              label: 'Done, collapsed',
              description: 'The resting state — "Show work" with an empty mask.',
              node: (
                <ReasoningPreview
                  items={reasoningDoneItems}
                  status="done"
                  initialExpanded={false}
                  doneLabel="Thought for 6 seconds"
                />
              ),
            },
          ]}
        />

        <PreviewCard
          name="SpotterPrompt"
          path="@spotter/chat"
          description="Controlled prompt with auto-resize textarea, mode toggle, data-model picker, and submit. Purple → blue gradient border on :focus-within."
          variants={[
            {
              label: 'Empty',
              description: 'Default placeholder visible.',
              node: <PromptEmpty />,
            },
            {
              label: 'Filled',
              description: 'With user-typed content.',
              node: <PromptFilled />,
            },
            {
              label: 'Disabled',
              description: 'Submit and inputs locked.',
              node: <PromptDisabled />,
            },
          ]}
        />

        <PreviewCard
          name="PromptBar"
          path="@spotter/chat"
          description="The Refresh composer. Ships alongside SpotterPrompt rather than replacing it — SpotterPrompt carries the mode toggle and data-model picker, PromptBar carries model, skills and connectors, plus a deep-analysis chip, attached files and a quoted-context pill. Which one Spotter's composer should be is still open."
          variants={[
            {
              label: 'Landing',
              description: 'Two-line content height, menus open downward. The welcome-state shape.',
              node: <PromptBarPreview mode="landing" />,
            },
            {
              label: 'Asked',
              description: 'One-line content height, menus open upward. The shape once a conversation is running.',
              node: <PromptBarPreview mode="asked" />,
            },
            {
              label: 'Selected',
              description: 'Focused state — purple → cyan → blue gradient ring and the focus glow.',
              node: <PromptBarPreview mode="asked" startFocused />,
            },
          ]}
        />

        <PreviewCard
          name="QuickAction"
          path="@spotter/chat"
          description="Pill button used in the welcome state and refine flows. Accepts an icon and label."
          variants={[
            {
              label: 'Default',
              node: (
                <QuickAction
                  id="demo"
                  label="Quick search"
                  icon="explore"
                  onClick={() => undefined}
                />
              ),
            },
          ]}
        />

        <PreviewCard
          name="QuickActionRow"
          path="@spotter/chat"
          description="Horizontal stack of QuickAction pills. Defaults to three actions when no `actions` prop is passed."
          variants={[
            {
              label: 'Two actions',
              node: (
                <QuickActionRow
                  actions={[
                    { id: 'a1', label: 'Show me total sales by month', icon: 'explore' },
                    { id: 'a2', label: 'What can I ask about this data?', icon: 'bulb' },
                  ]}
                  onAction={() => undefined}
                />
              ),
            },
            {
              label: 'Four actions',
              node: (
                <QuickActionRow
                  actions={[
                    { id: 'a1', label: 'Quick search', icon: 'explore' },
                    { id: 'a2', label: 'Deep analysis', icon: 'r-analysis' },
                    { id: 'a3', label: 'Know your data', icon: 'bulb' },
                    { id: 'a4', label: 'Compare scenarios', icon: 'chart' },
                  ]}
                  onAction={() => undefined}
                />
              ),
            },
          ]}
        />

        <PreviewCard
          name="Response grid"
          path="Layout spec — no component"
          description="The measurements the Refresh response layout is built on. Not a shipped component: ChatThread still sizes itself from --spotter-chat-max-width, and whether it moves to the 800px content column is an open decision."
          variants={[
            { label: 'Measurements', node: <ResponseGridSpec /> },
          ]}
        />

        {/* Planned placeholders */}
        <PreviewCard
          name="SourcePicker"
          path="@spotter/chat (planned)"
          description="Pick which SpotterModel (data source) to query in the current session. Surfaces from the prompt area or model picker."
          variants={[]}
          planned
          plannedHint="Design pending. Will live at src/spotter/chat/SourcePicker.tsx."
        />

        <PreviewCard
          name="ModelPicker"
          path="@spotter/chat (planned)"
          description="Richer model-selection UI than the current inline picker — recently used, search, model metadata."
          variants={[]}
          planned
          plannedHint="Design pending. Will live at src/spotter/chat/ModelPicker.tsx."
        />
      </section>

      {/* ─── Blocks section ─────────────────────────────────────────────── */}
      <section id="blocks" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Blocks</h2>
          <p className={styles.sectionLead}>
            Block renderers — one per <code>AnswerBlock.kind</code>. Imported from <code>@spotter/chat/blocks</code>.
            Wired into <code>AgentResponseBlock</code> via a switch on <code>kind</code>.
          </p>
        </header>

        <PreviewCard
          name="TextBlock"
          path="@spotter/chat/blocks"
          description="Renders a plain text paragraph inside an agent response. The simplest block kind."
          variants={[
            {
              label: 'Short',
              node: <TextBlock block={textBlockShort} />,
            },
            {
              label: 'Long',
              description: 'Wraps across multiple lines; respects max-width for readability.',
              node: <TextBlock block={textBlockLong} />,
            },
          ]}
        />

        <PreviewCard
          name="VizBlock"
          path="@spotter/chat/blocks"
          description="Chart renderer. Slot priority: external React node (passed in) > iframe URL > inline data (renders an SVG sketch) > placeholder. Token chips above the chart describe measures, keywords, filters. Supports line / bar / pie / table chart kinds plus an empty placeholder state."
          variants={[
            {
              label: 'Default',
              description: 'Line chart from inline data — the most common viz answer.',
              node: <VizBlock block={vizLine} />,
            },
          ]}
        />

        <PreviewCard
          name="SourcesBlock"
          path="@spotter/chat/blocks"
          description="Lists the data sources the agent used to compose the answer (tables, columns, datasets)."
          variants={[
            {
              label: 'Default',
              node: <SourcesBlock block={sourcesData} />,
            },
          ]}
        />

        <PreviewCard
          name="FollowUpsBlock"
          path="@spotter/chat/blocks"
          description="Suggested follow-up questions. Each is a clickable chip that calls `send` on the chat provider."
          variants={[
            {
              label: 'Default',
              description: 'Three suggested follow-ups.',
              node: <FollowUpsBlock block={followupsData} />,
            },
          ]}
        />

        <PreviewCard
          name="RefineBlock"
          path="@spotter/chat/blocks"
          description="Clarifying questions the agent asks before fully answering. Each is clickable and calls `send` with the selected refinement."
          variants={[
            {
              label: 'Default',
              description: 'Three clarifying questions.',
              node: <RefineBlock block={refineData} />,
            },
          ]}
        />

        <PreviewCard
          name="ErrorBlock"
          path="@spotter/chat/blocks"
          description="Renders an agent-side error. Used when the runtime emits an error chunk, when the data model is unreachable, or when the model returns an error message."
          variants={[
            {
              label: 'Default',
              node: <ErrorBlock block={errorData} />,
            },
          ]}
        />

        <PreviewCard
          name="AnswerCard"
          path="@spotter/answer (planned)"
          description="The answer view that renders inside a chat thread when Spotter responds with a viz-backed answer. The current VizBlock renderer is the stand-in."
          variants={[]}
          planned
          plannedHint="Figma spec exists at docs/2026-05-07-spotter-answer-card.md (node 122:15399). Will live at src/spotter/answer/AnswerCard.tsx."
        />
      </section>

      <section id="shell" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Page shell</h2>
          <p className={styles.sectionLead}>
            Full-page shell primitives — <code>SpotterShell</code>, <code>SpotterLeftSide</code>, <code>SpotterRail</code>, <code>SpotterPanel</code>, <code>SpotterWelcome</code>, <code>SpotterLeftToggle</code> — live on their own page since they are a sibling to the other shell widgets (GlobalHeader, AppShell).
          </p>
          <p className={styles.sectionLead} style={{ marginTop: 12 }}>
            <a href="/radiant/components/spottershell" style={{ color: 'var(--rd-sys-color-content-brand)', fontWeight: 500 }}>
              Go to SpotterShell →
            </a>
          </p>
        </header>
      </section>

      <section id="icons" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Spotter icons</h2>
          <p className={styles.sectionLead}>
            Glyphs that the Radiant registry does not yet ship. Imported from <code>@spotter/icons</code>.
            All match Radiant's <code>BaseIconProps</code> API so consumers pass <code>size="m"</code> exactly like <code>&lt;Icon name="..." /&gt;</code>.
            The full Radiant icon catalog lives at <a href="/radiant/icons">/radiant/icons</a>.
          </p>
        </header>

        <PreviewCard
          name="PanelToggleIcon"
          path="@spotter/icons"
          description="Rounded rectangle with a vertical divider creating a small left compartment and a larger right compartment. Sourced from the Spotter Left Panel Figma file (node 3529:24539)."
          variants={[
            { label: 'All sizes', node: <IconSizeRow glyph={<PanelToggleIcon />} importName="PanelToggleIcon" /> },
          ]}
        />

        <PreviewCard
          name="BellIcon"
          path="@spotter/icons"
          description="Notifications glyph. Lives here because the standalone Spotter prototype's header uses it, and Radiant does not yet ship this variant."
          variants={[
            { label: 'All sizes', node: <IconSizeRow glyph={<BellIcon />} importName="BellIcon" /> },
          ]}
        />

        <PreviewCard
          name="ThoughtSpotMark"
          path="@spotter/icons"
          description="The ThoughtSpot brand mark. Slightly different prop signature than the others — accepts a colorful prop. Used in the Spotter prototype's avatar slot and welcome state."
          variants={[
            { label: 'All sizes', node: <IconSizeRow glyph={<ThoughtSpotMark />} importName="ThoughtSpotMark" /> },
          ]}
        />

        <PreviewCard
          name="ChartSearchIcon"
          path="@spotter/icons"
          description="Used in the SpotterPrompt mode toggle to indicate the 'ask' mode (data-search). Pairs visually with OrbitsIcon."
          variants={[
            { label: 'All sizes', node: <IconSizeRow glyph={<ChartSearchIcon />} importName="ChartSearchIcon" /> },
          ]}
        />

        <PreviewCard
          name="OrbitsIcon"
          path="@spotter/icons"
          description="Used in the SpotterPrompt mode toggle to indicate the 'explore' mode. Pairs visually with ChartSearchIcon."
          variants={[
            { label: 'All sizes', node: <IconSizeRow glyph={<OrbitsIcon />} importName="OrbitsIcon" /> },
          ]}
        />
      </section>

      <section id="tokens" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Spotter tokens</h2>
          <p className={styles.sectionLead}>
            Local tokens that live in <code>@spotter/tokens</code>. Only defined here when no Radiant equivalent covers the need — prefer importing from <code>@tokens/colors</code> directly when possible.
          </p>
        </header>

        <PreviewCard
          name="spotterGlow"
          path="@spotter/tokens"
          description="Soft radial glow behind the welcome prompt. Derived from the brand colour at low alpha. Radiant's system tokens are opaque, so this lives in Spotter."
          variants={[
            { label: 'Radial gradient', node: <GlowSwatch /> },
          ]}
        />

        <PreviewCard
          name="spotterChartBg"
          path="@spotter/tokens"
          description="Chart-token backgrounds used by answer-card tokens (measure / keyword / filter). Aliases over Radiant system tokens — Spotter components reference these names instead of reaching into the system palette directly."
          variants={[
            { label: 'Three roles', node: <ChartBgSwatches /> },
          ]}
        />

        <PreviewCard
          name="spotterLayout"
          path="@spotter/tokens"
          description="Layout constants shared across Spotter chat surfaces. Exposed as plain numbers so consumers can use them inline or via CSS variables (--spotter-chat-max-width, --spotter-text-max-width)."
          variants={[
            { label: 'Widths', node: <LayoutSwatch /> },
          ]}
        />
      </section>
    </div>
  );
};

export default SpotterShowcase;
