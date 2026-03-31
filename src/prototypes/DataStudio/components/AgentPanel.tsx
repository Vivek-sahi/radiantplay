import React, { useState, useRef, useEffect } from 'react';
import { c, sp, ff, fs, fw, ts } from '../styles';
import { Button } from '../../../components/Button';
import { ProjectState, ProjectContext } from '../index';

export interface AgentMessage {
  id: string;
  type: 'user' | 'working' | 'proposal' | 'execution';
  content: string;
  steps?: WorkingStep[];
  stepsCollapsed?: boolean;
  duration?: string;
  pendingAction?: PendingAction;
}

interface WorkingStep {
  label: string;
  detail?: string;
  collapsible?: string;
  collapsibleOpen?: boolean;
  status: 'pending' | 'running' | 'done';
}

interface PendingAction {
  key: string;
  nextStep: ProjectState['buildStep'];
}

// ── Step definitions ──────────────────────────────────────────────────────────

interface StepDef {
  label: string;
  detail?: string;
  collapsible?: string;
}

// ── Scripted agent flows ──────────────────────────────────────────────────────

const SCRIPTS: Record<string, {
  steps: StepDef[];
  duration: string;
  proposal: string;
  execution: string;
  nextStep: ProjectState['buildStep'];
  contextUpdate?: Partial<ProjectContext>;
  newName?: string;
  setsProfileComplete?: boolean;
  lineDelay?: number;
}> = {

  find_tables: {
    steps: [
      {
        label: 'Understanding your request',
        detail: 'User is solving for a new use case. Looking for tables that can support campaign performance analysis across orders, users, and marketing data.',
      },
      {
        label: 'Identifying relevant skill: find_tables',
        detail: 'Routing to find_tables — searches connected data sources using semantic similarity against your stated goal and industry context.',
      },
      {
        label: 'Searching Snowflake connection',
        detail: '120 tables scanned. Found 3 matches based on column names, table descriptions, and data overlap — orders, campaigns, users.',
      },
      {
        label: 'Searching Databricks connection',
        detail: '43 tables scanned. No matching tables found for this use case in Databricks.',
      },
      {
        label: 'Summarizing findings',
        detail: 'Preparing 3 table recommendations with row counts, column previews, and join key candidates.',
      },
    ],
    duration: '28 seconds',
    proposal: `Based on your intent to analyze campaign performance, I found **3 tables** in your Snowflake connection:

📊 **Orders** — 150 rows · 8 columns
📊 **Campaigns** — 45 rows · 9 columns
📊 **Users** — 90 rows · 8 columns

These cover order transactions, campaign attribution, and user demographics.

Would you like me to add these to your project?`,
    execution: `Added **3 tables** to your project:
✓ Orders (150 rows · 8 columns)
✓ Campaigns (45 rows · 9 columns)
✓ Users (90 rows · 8 columns)

Tables are now visible in the left panel. Would you like me to figure out the right joins between these tables?`,
    nextStep: 'tables',
    contextUpdate: {
      persona: 'Marketing analyst at an e-commerce company focused on campaign attribution, ROI, and regional performance.',
      sampleQuestions: 'Which campaigns drove the most orders last month?\nWhat is the return on spend per campaign channel?\nHow do campaigns perform across regions and user segments?',
    },
    newName: 'Marketing Campaign Attribution',
  },

  create_joins: {
    steps: [
      {
        label: 'Reading table schemas',
        detail: 'Loaded schemas for orders (8 cols), campaigns (9 cols), users (8 cols). Total 25 columns across 3 tables.',
      },
      {
        label: 'Scanning for shared keys',
        detail: 'Found campaign_id in orders and campaigns. Found user_id in orders and users. No other key overlap detected.',
      },
      {
        label: 'Scoring join confidence',
        detail: 'orders.campaign_id → campaigns.campaign_id: 82% match rate (27 nulls indicate organic orders — LEFT JOIN recommended).\norders.user_id → users.user_id: 100% match rate — INNER JOIN safe.',
      },
      {
        label: 'Generating join SQL',
        detail: 'Two JOIN clauses written and validated against live schema. No ambiguous column names detected.',
        collapsible: `SELECT
  o.*,
  c.campaign_name,
  c.channel,
  c.spend,
  c.impressions,
  u.segment,
  u.region
FROM orders o
LEFT JOIN campaigns c
  ON o.campaign_id = c.campaign_id
INNER JOIN users u
  ON o.user_id = u.user_id`,
      },
    ],
    duration: '15 seconds',
    proposal: `I found **2 joins** that connect your tables:

🔗 **Orders × Campaigns** — \`orders.campaign_id\` → \`campaigns.campaign_id\`
   Many-to-one · 82% match rate · **LEFT JOIN** (preserves 27 organic orders with no campaign)

🔗 **Orders × Users** — \`orders.user_id\` → \`users.user_id\`
   Many-to-one · 100% match rate · **INNER JOIN**

Shall I create both?`,
    execution: `Created **2 joins**:
✓ Orders × Campaigns (LEFT JOIN on campaign_id)
✓ Orders × Users (INNER JOIN on user_id)

Visualizer and Data Preview updated. Would you like to create any new metrics or calculated fields?`,
    nextStep: 'joined',
  },

  create_metric: {
    steps: [
      {
        label: 'Scanning schema for opportunities',
        detail: 'Reviewed 25 columns across the joined dataset. Identified 3 metric candidates aligned with campaign performance analysis.',
      },
      {
        label: 'Validating Return on Spend',
        detail: 'NULLIF prevents division-by-zero on zero-spend campaigns. Sample values against top 10 rows: 2.41, 1.87, 3.12, 0.94…',
        collapsible: `SUM(orders.amount) / NULLIF(campaigns.spend, 0)

-- Output type: FLOAT
-- Handles zero-spend rows with NULLIF
-- Sample (top 10): 2.41, 1.87, 3.12, 0.94, 2.78`,
      },
      {
        label: 'Validating Conversion Rate',
        detail: 'Impression data available in campaigns table. Expressed as percentage. Sample values: 3.2%, 1.8%, 4.7%…',
        collapsible: `COUNT(orders.order_id) / NULLIF(campaigns.impressions, 0) * 100

-- Output type: FLOAT (percentage)
-- Sample (top 10): 3.2, 1.8, 4.7, 2.1, 5.3`,
      },
      {
        label: 'Validating Days to Convert',
        detail: 'Measures lag between campaign start and order date. Date formats normalized before diff. Sample values: 3, 7, 1, 14…',
        collapsible: `DATEDIFF(
  orders.order_date,
  campaigns.start_date
)

-- Output type: INTEGER (days)
-- Note: date formats normalized to ISO before diff
-- Sample (top 10): 3, 7, 1, 14, 2`,
      },
      {
        label: 'Computing sample values',
        detail: 'Ran all 3 formulas against top 10 rows. All returning expected value ranges. Ready to populate full dataset.',
      },
    ],
    duration: '22 seconds',
    proposal: `Based on your campaign performance goal, I can add **3 calculated columns**:

**1. Return on Spend**
\`SUM(orders.amount) / NULLIF(campaigns.spend, 0)\`
Sample: 2.41, 1.87, 3.12, 0.94…

**2. Conversion Rate**
\`COUNT(orders.order_id) / NULLIF(campaigns.impressions, 0) * 100\`
Sample: 3.2%, 1.8%, 4.7%…

**3. Days to Convert**
\`DATEDIFF(orders.order_date, campaigns.start_date)\`
Sample: 3, 7, 1, 14…

These will appear as new columns in Data Preview and SQL cells in Notebook. Shall I add them?`,
    execution: `Added **3 calculated columns**:
✓ Return on Spend — formula validated, column populated
✓ Conversion Rate — formula validated, column populated
✓ Days to Convert — formula validated, column populated

SQL cells added to Notebook. Would you like to work on data health for AI readiness?`,
    nextStep: 'transformed',
  },

  profile_data: {
    steps: [
      {
        label: 'Scanning 24 columns across 3 tables',
        detail: '285 total rows. orders: 150 rows · 8 cols. campaigns: 45 rows · 9 cols. users: 90 rows · 8 cols.',
      },
      {
        label: 'Computing null rates',
        detail: 'orders.campaign_id: 18% null (27 rows). users.segment: 15% null (14 rows). campaigns.end_date: 13% null (6 rows). All other columns: 0% null.',
      },
      {
        label: 'Detecting duplicate rows',
        detail: 'orders: 7 duplicate order_ids found. campaigns: 2 duplicate campaign_ids found. users: 0 duplicates.',
      },
      {
        label: 'Checking value distributions',
        detail: 'orders.amount: avg $1,240, min $12, max $55,900 — outlier flagged. users.age: 4 anomalous values found (0, −3, 142, 199).',
      },
      {
        label: 'Checking date formats',
        detail: 'orders.order_date: MM/DD/YYYY. campaigns.start_date: YYYY-MM-DD. users.signup_date: YYYY/MM/DD. 3-way format mismatch — date joins may return incorrect results.',
      },
      {
        label: 'Computing health score',
        detail: '24 issues identified: 9 data issues (nulls, duplicates, anomalies) and 15 semantic issues (missing column descriptions). Health score: Poor (34/100).',
      },
    ],
    duration: '41 seconds',
    proposal: `Here's your **data profile** across 3 tables (285 rows total):

**Orders** (150 rows)
• \`amount\`: avg $1,240 · min $12 · max $55,900 ⚠ outlier
• \`campaign_id\`: 18% null — 27 likely organic orders
• \`order_date\`: MM/DD/YYYY · mismatch with other tables ⚠

**Campaigns** (45 rows)
• \`spend\`: avg $8,400 · range $1,200–$42,000
• \`campaign_id\`: 2 duplicate IDs ⚠
• \`start_date\`: YYYY-MM-DD ⚠ format mismatch

**Users** (90 rows)
• \`age\`: 4 anomalous values (0, −3, 142, 199) ⚠
• \`segment\`: 15% null — 14 unclassified users
• \`signup_date\`: YYYY/MM/DD ⚠ format mismatch

Found **24 issues** across 3 tables. Data health score: **Poor (34/100)**. Want me to fix these step by step?`,
    execution: `Profile saved to project:
✓ Column statistics computed for all 24 columns
✓ 4 anomalies flagged in orders.amount
✓ 3 date format mismatches identified
✓ Null rate report attached to each column

Data health score: **Poor (34/100)**. Ready to fix issues.`,
    nextStep: 'transformed',
    setsProfileComplete: true,
  },

  fix_health: {
    steps: [
      {
        label: 'Loading data profile',
        detail: 'Read 24 issues from the profile generated in the previous step. 9 data issues, 15 semantic issues.',
      },
      {
        label: 'Prioritizing issues by severity',
        detail: 'Semantic issues ranked first — missing column descriptions have the highest impact on AI-readiness and query accuracy. Data issues ranked next by row coverage.',
      },
      {
        label: 'Building 5-step fix plan',
        detail: 'Step 1: add descriptions (20 cols). Step 2: remove duplicates (9 rows). Step 3: fill nulls (27 rows). Step 4: normalize dates (3 tables). Step 5: flag anomalies (4 values).',
      },
    ],
    duration: '12 seconds',
    proposal: `I'll fix all **24 issues** in 5 steps:

☐ Step 1 — Add column descriptions (20 columns missing metadata)
☐ Step 2 — Remove duplicate rows (Orders: 7, Campaigns: 2)
☐ Step 3 — Fill null campaign_ids → 'organic' (27 rows)
☐ Step 4 — Normalize date formats across all 3 tables
☐ Step 5 — Flag anomalous amounts with \`is_anomaly\` column

Shall I proceed?`,
    execution: `Fixing 24 issues step by step...
✓ Step 1 — Added descriptions to all 20 columns
✓ Step 2 — Removed 9 duplicate rows (Orders: 7, Campaigns: 2)
✓ Step 3 — Filled 27 null campaign_ids → 'organic'
✓ Step 4 — Standardized all dates to YYYY-MM-DD
✓ Step 5 — Flagged 4 anomalous values with is_anomaly column

**Data health is now Good (82/100).** Your model is AI-ready. Share it with your team.`,
    nextStep: 'healthy',
    lineDelay: 600,
    contextUpdate: {
      businessLogic: "Orders with null campaign_id are organic — keep them in revenue totals with LEFT JOIN.\nDuplicate order_ids removed; keep latest row per order_id.\nDate formats normalized to YYYY-MM-DD across all tables.",
      spotterInstructions: 'For "top campaigns" sort by return_on_spend descending. "Latest" means last 30 days unless otherwise specified. "Organic" orders have no campaign attribution.',
    },
  },
};

// ── Script matching ───────────────────────────────────────────────────────────

function matchScript(input: string): string {
  const lower = input.toLowerCase();
  if (lower.match(/\b(yes|yeah|yep|yup|ya|yea|sure|ok|okay|cool|great|perfect|sounds good|let'?s go|go ahead|proceed|do it|add it|add them|please|definitely|absolutely|go for it|make it so)\b/)) return '__confirm__';
  if (lower.match(/help|what can you|what do you|capabilities|skills|how do you|what should|^h+i+$|^hey|^hello|^howdy|^sup|^yo\b|^greetings|^good (morning|afternoon|evening)/)) return '__help__';
  if (lower.match(/profile|profil|stat|distribution|quality check|scan|inspect|describe|overview|summary of (the )?data/)) return 'profile_data';
  if (lower.match(/join|connect|relationship|link/)) return 'create_joins';
  if (lower.match(/roi|return on spend|metric|formula|calculat|column|field|transform/)) return 'create_metric';
  if (lower.match(/health|fix|improve|clean|issue|null|duplicate|description|anomal/)) return 'fix_health';
  if (lower.match(/campaign|performance|table|data|analyze|analysis|order|user/)) return 'find_tables';
  return '__unknown__';
}

// ── Shared flow runner ────────────────────────────────────────────────────────

function runFlow(
  key: string,
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>,
  setPendingAction: (a: PendingAction) => void,
  setIsProcessing: (v: boolean) => void,
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>,
) {
  const script = SCRIPTS[key];
  const workingId = `w-${Date.now()}`;

  setMessages(prev => [...prev, {
    id: workingId,
    type: 'working',
    content: '',
    duration: script.duration,
    steps: script.steps.map(s => ({ label: s.label, detail: s.detail, collapsible: s.collapsible, collapsibleOpen: false, status: 'pending' as const })),
    stepsCollapsed: false,
  }]);

  script.steps.forEach((_, idx) => {
    setTimeout(() => {
      setMessages(prev => prev.map(m => {
        if (m.id !== workingId || !m.steps) return m;
        const steps = m.steps.map((s, i) =>
          i === idx ? { ...s, status: 'done' as const } :
          i === idx + 1 ? { ...s, status: 'running' as const } : s
        );
        return { ...m, steps };
      }));

      if (idx === script.steps.length - 1) {
        setTimeout(() => {
          setMessages(prev => prev.map(m =>
            m.id === workingId ? { ...m, stepsCollapsed: true } : m
          ));
          const action: PendingAction = { key, nextStep: script.nextStep };
          setPendingAction(action);
          setMessages(prev => [...prev, {
            id: `p-${Date.now()}`,
            type: 'proposal',
            content: script.proposal,
            pendingAction: action,
          }]);
          setIsProcessing(false);
          if (script.contextUpdate) {
            setProject(p => ({ ...p, context: { ...p.context, ...script.contextUpdate } }));
          }
        }, 400);
      }
    }, 600 + idx * 800);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface AgentPanelProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
  messages: AgentMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ project, setProject, messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleCollapsible = (msgId: string, stepIdx: number) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.steps) return m;
      const steps = m.steps.map((s, i) =>
        i === stepIdx ? { ...s, collapsibleOpen: !s.collapsibleOpen } : s
      );
      return { ...m, steps };
    }));
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || isProcessing) return;
    setInput('');
    setIsProcessing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);

    const scriptKey = matchScript(text);
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: text }]);

    // Help / greeting
    if (scriptKey === '__help__') {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `help-${Date.now()}`,
          type: 'proposal',
          content: `Hey! Here's what I can do in this project:

**1. Bring tables** — Describe what you want to analyze. I'll search your warehouse and add the right tables.

**2. Create joins** — I'll find shared keys, score the match confidence, and propose the right join type.

**3. Add calculated columns** — Describe a metric in plain language. I'll write the SQL, validate it, and add it as a transformation.

**4. Profile data** — I'll scan all columns, compute distributions, and surface nulls, anomalies, and format issues.

**5. Fix data health step by step** — I'll prioritize issues from the profile and fix them one by one with your approval at each step.

Try: *"I want to analyze campaign performance"*`,
        }]);
        setIsProcessing(false);
      }, 300);
      return;
    }

    // Unknown input
    if (scriptKey === '__unknown__') {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `unk-${Date.now()}`,
          type: 'proposal',
          content: `I'm not sure I understood that. Try describing what you want to analyze, or ask me *"what can you do?"* to see my capabilities.`,
        }]);
        setIsProcessing(false);
      }, 300);
      return;
    }

    // Confirmation with no pending action — infer from buildStep
    if (scriptKey === '__confirm__' && !pendingAction) {
      const inferredKey =
        project.buildStep === 'tables' ? 'create_joins' :
        project.buildStep === 'joined' ? 'create_metric' :
        project.buildStep === 'transformed' ? 'fix_health' :
        null;

      if (inferredKey) {
        runFlow(inferredKey, setMessages, setPendingAction, setIsProcessing, setProject);
        return;
      }
      setMessages(prev => [...prev, {
        id: `done-${Date.now()}`,
        type: 'proposal',
        content: `Your model is already AI-ready. You can share it with your team using the **Share** button above.`,
      }]);
      setIsProcessing(false);
      return;
    }

    // Confirmation of pending action → execute
    if (scriptKey === '__confirm__' && pendingAction) {
      const script = SCRIPTS[pendingAction.key];
      const captured = pendingAction;
      setPendingAction(null);

      const execId = `exec-${Date.now()}`;
      setMessages(prev => [...prev, { id: execId, type: 'execution', content: '' }]);

      const lines = script.execution.split('\n');
      let i = 0;
      const interval = setInterval(() => {
        if (i >= lines.length) {
          clearInterval(interval);
          setIsProcessing(false);
          setProject(p => ({
            ...p,
            buildStep: captured.nextStep,
            name: script.newName && p.name === 'Untitled Project' ? script.newName : p.name,
            ...(script.setsProfileComplete ? { profileComplete: true } : {}),
            ...(script.contextUpdate ? { context: { ...p.context, ...script.contextUpdate } } : {}),
          }));
          return;
        }
        const line = lines[i];
        setMessages(prev => prev.map(m =>
          m.id === execId ? { ...m, content: m.content + (i === 0 ? '' : '\n') + line } : m
        ));
        i++;
      }, script.lineDelay ?? 280);
      return;
    }

    // New intent — run the matched flow
    runFlow(scriptKey, setMessages, setPendingAction, setIsProcessing, setProject);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (collapsed) {
    return (
      <div style={{ width: 40, borderLeft: `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'], display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: sp.D, flexShrink: 0 }}>
        <Button variant="tertiary" size="small" onClick={() => setCollapsed(false)}>«</Button>
        <span style={{ marginTop: sp.F, fontSize: fs.xs, color: c['content-secondary'], writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: 1 }}>DATA AGENT</span>
      </div>
    );
  }

  return (
    <div style={{ width: 320, flexShrink: 0, borderLeft: `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'], display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
          <span style={{ fontSize: fs.sm }}>💡</span>
          <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>Data Agent</span>
        </div>
        <Button variant="tertiary" size="small" onClick={() => setCollapsed(true)}>»</Button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.D, display: 'flex', flexDirection: 'column', gap: sp.D }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: `${sp.H}px ${sp.D}px` }}>
            <div style={{ fontSize: fs['2xl'], marginBottom: sp.C }}>💡</div>
            <p style={{ ...ts.bodyNormal, color: c['content-secondary'], margin: `0 0 ${sp.F}px` }}>
              Describe what you want to build. I'll find the right data and set everything up.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
              {[
                'I want to analyze campaign performance',
                'Help me understand how campaigns drive orders',
                'How can I improve my data health score?',
              ].map(hint => (
                <Button key={hint} variant="secondary" size="small" fullWidth onClick={() => setInput(hint)}>{hint}</Button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            onToggleSteps={id => setMessages(prev => prev.map(m => m.id === id ? { ...m, stepsCollapsed: !m.stepsCollapsed } : m))}
            onToggleCollapsible={toggleCollapsible}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: sp.C, borderTop: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
        <div style={{ border: `1px solid ${c['border-default']}`, borderRadius: 10, backgroundColor: c['background-base'], overflow: 'hidden' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Give me a task. Use '@' to mention table or column."
            rows={2}
            autoFocus
            disabled={isProcessing}
            style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', padding: `${sp.C}px ${sp.C}px ${sp.A}px`, fontSize: fs.sm, color: c['content-primary'],  boxSizing: 'border-box', opacity: isProcessing ? 0.5 : 1 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: `${sp.A}px ${sp.C}px ${sp.B}px` }}>
            <Button variant="primary" size="small" onClick={sendMessage} disabled={!input.trim() || isProcessing}>↑</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Message bubble ────────────────────────────────────────────────────────────

const MessageBubble: React.FC<{
  msg: AgentMessage;
  onToggleSteps: (id: string) => void;
  onToggleCollapsible: (msgId: string, stepIdx: number) => void;
}> = ({ msg, onToggleSteps, onToggleCollapsible }) => {

  if (msg.type === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ maxWidth: '85%', backgroundColor: c['background-subtle'], borderRadius: 10, padding: `${sp.B}px ${sp.C}px`, fontSize: fs.sm, color: c['content-primary'] }}>
          {msg.content}
        </div>
      </div>
    );
  }

  if (msg.type === 'working') {
    const allDone = msg.steps?.every(s => s.status === 'done');
    const doneCount = msg.steps?.filter(s => s.status === 'done').length ?? 0;

    return (
      <div style={{ display: 'flex', gap: sp.B }}>
        <AgentAvatar />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Toggle header */}
          <Button
            variant="tertiary"
            size="small"
            onClick={() => onToggleSteps(msg.id)}
            style={{ marginBottom: msg.stepsCollapsed ? 0 : sp.B, justifyContent: 'flex-start', width: '100%' }}
          >
            <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{msg.stepsCollapsed ? '▶' : '▾'}</span>
            <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontStyle: 'italic', marginLeft: sp.B }}>
              {allDone
                ? `Worked through ${doneCount} steps · ${msg.duration}`
                : `Working…`}
            </span>
          </Button>

          {/* Expanded steps */}
          {!msg.stepsCollapsed && msg.steps && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.C, paddingLeft: sp.C, borderLeft: `2px solid ${c['border-divider']}` }}>
              {msg.steps.map((step, i) => (
                <div key={i}>
                  {/* Step title row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp.B }}>
                    <span style={{ fontSize: fs.xs, width: 14, textAlign: 'center', flexShrink: 0, marginTop: 2, color: step.status === 'done' ? c['content-success'] : c['content-secondary'] }}>
                      {step.status === 'done' ? '✓' : step.status === 'running' ? <SpinnerDot /> : '○'}
                    </span>
                    <span style={{ fontSize: fs.xs, color: step.status === 'pending' ? c['content-secondary'] : c['content-primary'], fontWeight: step.status === 'done' ? 500 : 400 }}>
                      {step.label}
                    </span>
                  </div>

                  {/* Detail text */}
                  {step.status === 'done' && step.detail && (
                    <div style={{ marginLeft: 22, marginTop: 3 }}>
                      <p style={{ margin: 0, fontSize: fs.xs, color: c['content-secondary'], whiteSpace: 'pre-line' }}>
                        {step.detail}
                      </p>
                    </div>
                  )}

                  {/* Collapsible code block */}
                  {step.status === 'done' && step.collapsible && (
                    <div style={{ marginLeft: 22, marginTop: 4 }}>
                      <Button variant="tertiary" size="small" onClick={() => onToggleCollapsible(msg.id, i)}>
                        {step.collapsibleOpen ? '▾ Hide SQL' : '▶ View SQL'}
                      </Button>
                      {step.collapsibleOpen && (
                        <pre style={{ margin: '4px 0 0', padding: `${sp.B}px ${sp.C}px`, backgroundColor: c['background-subtle'], border: `1px solid ${c['border-divider']}`, borderRadius: 6, fontSize: fs.xs, fontFamily: ff.mono, color: c['content-primary'], overflowX: 'auto', whiteSpace: 'pre' }}>
                          {step.collapsible}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (msg.type === 'proposal') {
    return (
      <div style={{ display: 'flex', gap: sp.B }}>
        <AgentAvatar />
        <div style={{ flex: 1, backgroundColor: c['background-information'], border: `1px solid ${c['border-default']}`, borderRadius: 10, padding: `${sp.C}px ${sp.D}px` }}>
          <div style={{ fontSize: fs.sm, color: c['content-primary'] }}>
            <FormattedMessage content={msg.content} />
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === 'execution') {
    return (
      <div style={{ display: 'flex', gap: sp.B }}>
        <AgentAvatar />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: fs.sm, color: c['content-primary'], whiteSpace: 'pre-line' }}>
            <FormattedMessage content={msg.content} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const AgentAvatar: React.FC = () => (
  <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: c['background-information'], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
    <span style={{ fontSize: fs.xs }}>💡</span>
  </div>
);

const SpinnerDot: React.FC = () => {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 4), 250);
    return () => clearInterval(id);
  }, []);
  return <span>{['⠋', '⠙', '⠹', '⠸'][frame]}</span>;
};

const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ backgroundColor: c['background-subtle'], padding: '1px 4px', borderRadius: 3, fontSize: fs.xs, fontFamily: ff.mono }}>{part.slice(1, -1)}</code>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export default AgentPanel;
