import type { ProjectState } from '../index';
import { getWarehousePromptContext, tableMetadata } from '../data/mockData';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Skills registry ───────────────────────────────────────────────────────────
// Single source of truth for what the agent can do.
// availableWhen gates which skills appear in Claude's routing prompt.
// Adding a new workflow = add here + add to SCRIPTS in AgentPanel.

export interface Skill {
  key: string;
  description: string;
  availableWhen: (project: ProjectState) => boolean;
}

export const SKILLS: Skill[] = [
  {
    key: 'find_tables',
    description: 'Search the warehouse and propose tables to add to the project',
    availableWhen: p => p.buildStep === 'empty',
  },
  {
    key: 'create_joins',
    description: 'Identify shared keys and propose joins between tables',
    availableWhen: p => p.addedTables.length >= 2,
  },
  {
    key: 'select_columns',
    description: 'Choose which columns from each table to include',
    availableWhen: p => p.addedTables.length > 0,
  },
  {
    key: 'create_metric',
    description: 'Add a calculated column or business metric using SQL',
    availableWhen: p => p.buildStep === 'joined' || p.buildStep === 'transformed' || p.buildStep === 'healthy',
  },
  {
    key: 'profile_data',
    description: 'Scan all columns for nulls, duplicates, anomalies, and format issues',
    availableWhen: p => p.addedTables.length > 0,
  },
  {
    key: 'fix_health',
    description: 'Fix data quality issues found during profiling',
    availableWhen: p => p.addedTables.length > 0,
  },
  {
    key: 'test_model',
    description: 'Ask questions against the current model to validate it (EDA)',
    availableWhen: p => p.buildStep !== 'empty',
  },
  {
    key: 'coach',
    description: 'Fix a gap or incorrect answer found during testing',
    availableWhen: p => p.buildStep !== 'empty',
  },
  {
    key: 'publish',
    description: 'Publish the model so business users can query it via Spotter',
    availableWhen: p => p.buildStep === 'healthy',
  },
  {
    key: 'share',
    description: 'Invite team members and set their access level',
    availableWhen: p => p.buildStep === 'healthy',
  },
];

// ── Route a user message to an action or CHAT response ────────────────────────
// Claude receives the message + current project context + available skills.
// It returns either an action key (to run a scripted flow) or CHAT:[text].

export async function routeMessage(
  text: string,
  project: ProjectState,
  pendingActionKey: string | null,
): Promise<{ action: string } | { chat: string }> {
  const available = SKILLS.filter(s => s.availableWhen(project));

  const stepLabel =
    project.buildStep === 'empty'       ? 'No tables added yet — blank project' :
    project.buildStep === 'tables'      ? 'Tables added, no joins defined yet' :
    project.buildStep === 'joined'      ? 'Tables joined' :
    project.buildStep === 'transformed' ? 'Calculated columns added' :
                                          'AI-ready';

  const memoryBlock = [
    project.context.purpose          && `Purpose: ${project.context.purpose}`,
    project.context.persona          && `Audience: ${project.context.persona}`,
    project.context.sampleQuestions  && `Sample questions:\n${project.context.sampleQuestions}`,
  ].filter(Boolean).join('\n');

  const tableList = project.addedTables.length > 0
    ? project.addedTables.join(', ')
    : 'none';

  const actionList = [
    ...available.map(s => `- ${s.key}: ${s.description}`),
    ...(pendingActionKey ? ['- confirm: user is agreeing to the pending proposal'] : []),
  ].join('\n');

  const systemPrompt = `You are a routing agent for Data Studio, a data modeling tool by ThoughtSpot.

## Current project
Name: "${project.name}"
State: ${stepLabel}
Tables: ${tableList}
Pending proposal: ${pendingActionKey ? `"${pendingActionKey}" is awaiting user confirmation` : 'none'}
${memoryBlock ? `\n## Project memory\n${memoryBlock}` : ''}

## Available actions right now
${actionList}

## Response format
Return ONLY one of:
- An action key exactly as listed above (e.g. "create_joins")
${pendingActionKey ? '- "confirm" if the user is agreeing to the pending proposal\n' : ''}- "CHAT: [your response]" for questions, explanations, or conversation

## Rules
- If user intent maps to an available action, return the action key. Never describe what you are about to do — just return the key.
- When the project has no tables yet, ANY description of a business goal, use case, or data analysis intent maps to find_tables. Examples: "I want to analyse campaign performance" → find_tables, "help me with sales data" → find_tables, "set up a revenue dashboard" → find_tables.
- If the user wants to add calculated columns, formulas, metrics, or business measures — with or without naming specifics — and create_metric is available, return create_metric. The workflow itself will determine appropriate metrics from the project. Examples: "add calculated columns" → create_metric, "create metrics" → create_metric, "add formulas" → create_metric, "Order Value by Campaign" → create_metric, "Revenue per Channel" → create_metric.
- When a pending proposal exists, be aggressive about routing to 'confirm'. ANY phrase indicating agreement, approval, or intent to apply the pending changes maps to 'confirm' — even if the wording is indirect. Examples with a pending select_columns proposal: "add the above columns" → confirm, "add those" → confirm, "make sense" → confirm, "looks good" → confirm, "apply this" → confirm, "that works" → confirm, "those look right" → confirm.
- Return CHAT only when the user is asking a factual question or having a conversation that has no matching action — not when they are describing what they want to build or analyse.
- Keep CHAT responses concise, under 150 words, grounded in the project context.
- Do not return action keys for workflows that are not listed above.`;

  const response = await callAgent(
    [{ role: 'user', content: text }],
    systemPrompt,
  );

  const trimmed = response.trim();

  if (trimmed.startsWith('CHAT:')) {
    return { chat: trimmed.slice(5).trim() };
  }

  const validKeys = [
    ...available.map(s => s.key),
    ...(pendingActionKey ? ['confirm'] : []),
  ];

  if (validKeys.includes(trimmed)) {
    return { action: trimmed };
  }

  // Claude returned something unexpected — treat as chat
  return { chat: trimmed };
}

// ── Skill execution — find_tables ────────────────────────────────────────────
// Called in parallel with the working-steps animation after routing returns 'find_tables'.
// Returns which tables to add + the proposal text Claude generated.
// Caller falls back to hardcoded script content if this throws or returns null.

export interface FindTablesResult {
  tables: string[];   // validated against tableMetadata
  proposal: string;   // formatted proposal text to display
}

export async function executeFindTables(
  userMessage: string,
): Promise<FindTablesResult | null> {
  const system = `You are a data agent in ThoughtSpot Data Studio helping a user start a data modeling project.

The user has described their use case. Your job: identify the best-matching tables from the warehouse and write a concise proposal.

${getWarehousePromptContext()}

## Response format — return EXACTLY this, no other text:

TABLES: table1, table2, table3

[One sentence: what you found and why it matches the use case — no question here]

**table_name**
~connection · database · schema · Updated [date] · [N] rows~
col1 (type), col2 (type), col3 (type) +N more columns

(repeat for each table)

Would you like me to add these to your project?

## Rules
- Only include tables that exist in the warehouse above.
- List 2–4 tables maximum.
- In the ~metadata line~ use the exact path from the warehouse listing.
- Keep column lists to 5 columns max, then "+N more columns".
- The intro sentence must come before the first table card, never after.`;

  const response = await callAgent(
    [{ role: 'user', content: userMessage }],
    system,
    500,
  );

  // Parse TABLES: line
  const tablesMatch = response.match(/^TABLES:\s*(.+)$/m);
  if (!tablesMatch) return null;

  const rawNames = tablesMatch[1].split(',').map(t => t.trim().toLowerCase());
  const tables = rawNames.filter(name => tableMetadata[name]);
  if (tables.length === 0) return null;

  // Everything after the TABLES: line is the proposal
  const proposalStart = response.indexOf('\n', response.indexOf('TABLES:'));
  const proposal = response.slice(proposalStart).trim();
  if (!proposal) return null;

  return { tables, proposal };
}

// ── Skills (system prompts per workflow context) ───────────────────────────────

export function buildSkill(project: ProjectState): string {
  const stepContext =
    project.buildStep === 'empty'       ? 'No tables have been added yet. The project is blank.' :
    project.buildStep === 'tables'      ? 'Tables have been added but no joins are defined yet.' :
    project.buildStep === 'joined'      ? 'Tables are joined. The structure is in place.' :
    project.buildStep === 'transformed' ? 'Calculated columns exist. Data health needs attention.' :
                                          'The project is AI-ready and can be published.';

  const contextBlock = [
    project.context.persona        && `Audience: ${project.context.persona}`,
    project.context.sampleQuestions && `Sample questions this project should answer:\n${project.context.sampleQuestions}`,
    project.context.businessLogic   && `Business logic to respect:\n${project.context.businessLogic}`,
  ].filter(Boolean).join('\n\n');

  return `You are a data modeling agent inside ThoughtSpot Data Studio.

## Current project
Name: "${project.name}"
State: ${stepContext}
${contextBlock ? `\n## Project context\n${contextBlock}` : ''}

${getWarehousePromptContext()}

## How to respond
- Be concise and direct. One proposal per response.
- Use markdown for structure: **bold** for key terms, \`backticks\` for column/table names.
- When proposing a change, describe exactly what you will do and ask the user to confirm.
- Don't explain concepts unless asked. Skip the preamble.`;
}

// ── Skill execution — create_joins ───────────────────────────────────────────
// Called in parallel with the working-steps animation after routing returns 'create_joins'.
// Receives the project's current table schemas, analyzes key overlaps, returns a join proposal.

export async function executeCreateJoins(
  project: ProjectState,
): Promise<{ proposal: string } | null> {
  const schema = buildProjectSchema(project.addedTables);
  if (!schema) return null;

  const system = `You are a data modeling agent in ThoughtSpot Data Studio.

The user's project contains these tables:

${schema}

Analyze the columns. Identify foreign key relationships and propose joins.

## Rules
- Only propose joins between the tables listed above.
- For each join: bold the table pair, state the key columns, and justify LEFT vs INNER (LEFT when the foreign key is nullable or has unmatched rows; INNER only when 100% match is guaranteed).
- Include match rate estimate where relevant.
- End with "Shall I create [N] join(s)?"
- Under 120 words total. No preamble.`;

  const response = await callAgent(
    [{ role: 'user', content: 'Analyze my tables and propose joins.' }],
    system,
    400,
  );

  const proposal = response.trim();
  return proposal ? { proposal } : null;
}

// ── Skill execution — create_metric ──────────────────────────────────────────
// Called in parallel with the working-steps animation after routing returns 'create_metric'.
// Receives user's formula request + project schema, returns metric proposals with SQL.

export async function executeCreateMetric(
  userMessage: string,
  project: ProjectState,
): Promise<{ proposal: string } | null> {
  const schema = buildProjectSchema(project.addedTables);
  if (!schema) return null;

  const contextBlock = [
    project.context.purpose          && `Purpose: ${project.context.purpose}`,
    project.context.sampleQuestions  && `Sample questions:\n${project.context.sampleQuestions}`,
    project.context.businessLogic    && `Business logic:\n${project.context.businessLogic}`,
  ].filter(Boolean).join('\n');

  const system = `You are a data modeling agent in ThoughtSpot Data Studio.

The user's project contains these joined tables:

${schema}
${contextBlock ? `\n## Project context\n${contextBlock}` : ''}

## Rules
- Only propose metrics using columns from the tables listed above.
- For each metric: **bold name**, then the SQL expression on one line, then 3–5 sample computed values.
- Use NULLIF to guard against division-by-zero on ratio metrics.
- Propose 1–3 metrics aligned with the user's intent unless they asked for a specific formula.
- End with "Shall I add [these metrics / this metric]?"
- Under 150 words total. No preamble.`;

  const response = await callAgent(
    [{ role: 'user', content: userMessage }],
    system,
    500,
  );

  const proposal = response.trim();
  return proposal ? { proposal } : null;
}

// ── Skill execution — select_columns ─────────────────────────────────────────
// Called in parallel with the working-steps animation after routing returns 'select_columns'.
// Analyses all columns in the project's joined tables, applies criteria (PII, system fields,
// duplicates, relevance), and returns which columns to include + an Option B proposal.

export interface SelectColumnsResult {
  includedColumns: Record<string, string[]>; // tableId → [colName, ...]
  proposal: string;
}

export async function executeSelectColumns(
  project: ProjectState,
): Promise<SelectColumnsResult | null> {
  const tables = project.addedTables;

  // Build column inventory with semantic flags
  const inventory = tables.map(tableId => {
    const t = tableMetadata[tableId];
    if (!t) return '';
    const cols = t.columns.map(c => {
      const flags: string[] = [];
      if (c.isPII)         flags.push('PII');
      if (c.isSystemField) flags.push('system-field');
      if (c.classification) flags.push(c.classification);
      if (c.nullRate && c.nullRate > 0) flags.push(`${c.nullRate}% null`);
      return `  ${c.name} (${c.type})${flags.length ? ` [${flags.join(', ')}]` : ''}`;
    }).join('\n');
    return `**${t.name}** — ${t.columns.length} columns:\n${cols}`;
  }).filter(Boolean).join('\n\n');

  // Join key hints (inferred from schema overlap)
  const joinKeyHints: string[] = [];
  if (tables.includes('orders') && tables.includes('campaigns')) joinKeyHints.push('orders.campaign_id ↔ campaigns.campaign_id');
  if (tables.includes('orders') && tables.includes('users'))     joinKeyHints.push('orders.user_id ↔ users.user_id');

  const contextBlock = [
    project.context.purpose         && `Purpose: ${project.context.purpose}`,
    project.context.persona         && `Audience: ${project.context.persona}`,
    project.context.sampleQuestions && `Sample questions:\n${project.context.sampleQuestions}`,
  ].filter(Boolean).join('\n');

  const includePlaceholders = tables.map(t => `INCLUDE_${t.toUpperCase()}: col1, col2, col3`).join('\n');

  const system = `You are a data modeling agent in ThoughtSpot Data Studio.

The user has defined joins between their tables. Recommend which columns to include in the model.

## Column inventory
${inventory}

## Join keys — always include these
${joinKeyHints.length ? joinKeyHints.join('\n') : 'none identified'}
${contextBlock ? `\n## Project context\n${contextBlock}` : ''}

## Response format — return EXACTLY this structure, no other text:

${includePlaceholders}

[Option B proposal text]

## Rules for INCLUDE_ lines
- Always include join key columns
- Use exact column names from the inventory above (no asterisks or backticks)
- Only list column names separated by commas

## Rules for proposal text (Option B format)
1. "Your [N] tables have **[total]** columns total. Before recommending, I applied [N] criteria:"
2. Each criterion as: **Criterion** ([N] columns): \`col1\`, \`col2\` — reason
   Common criteria: Removed PII · Removed system fields · Removed duplicate dimensions · Removed low-signal for [goal]
3. "That leaves **[N] columns** for your [goal]:"
4. Per table: **Table** ([included] of [total]): \`col1\`*, \`col2\`, ... (mark join keys with *)
5. End: "Want me to apply this? You can adjust: \\"include [example]\\" or \\"skip [example]\\"."

## Column selection rules
- Include join keys
- Include measures relevant to the stated goal (revenue, spend, conversion metrics)
- Include dimensions for slicing (channel, region, segment, date)
- Exclude PII (isPII) by default
- Exclude system-generated IDs (isSystemField) unless they are join keys
- When a dimension appears in multiple tables, keep only the most natural source
- Exclude columns unlikely to be queried for this specific use case`;

  const response = await callAgent(
    [{ role: 'user', content: 'Recommend columns for my model.' }],
    system,
    650,
  );

  // Parse INCLUDE_{TABLE}: lines
  const includedColumns: Record<string, string[]> = {};
  for (const tableId of tables) {
    const pattern = new RegExp(`^INCLUDE_${tableId.toUpperCase()}:\\s*(.+)$`, 'mi');
    const match = response.match(pattern);
    if (match) {
      const cols = match[1].split(',').map(s => s.trim().replace(/[*`]/g, '').toLowerCase());
      const validCols = cols.filter(col => tableMetadata[tableId]?.columns.some(c => c.name === col));
      if (validCols.length > 0) includedColumns[tableId] = validCols;
    }
  }

  if (Object.keys(includedColumns).length === 0) return null;

  // Proposal = everything after the INCLUDE_ block (first non-INCLUDE_ non-empty line onward)
  const lines = response.split('\n');
  let proposalStart = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed && !trimmed.startsWith('INCLUDE_')) { proposalStart = i; break; }
  }
  const proposal = lines.slice(proposalStart).join('\n').trim();

  return proposal ? { includedColumns, proposal } : null;
}

// ── Shared schema builder ─────────────────────────────────────────────────────
// Builds a concise schema block for only the tables currently in the project.
// Used by execute functions that need structural context but not row data.

function buildProjectSchema(tableIds: string[]): string {
  return tableIds
    .map(id => {
      const t = tableMetadata[id];
      if (!t) return '';
      const cols = t.columns
        .map(c => `${c.name} (${c.type}${c.nullable ? '?' : ''})`)
        .join(', ');
      return `**${t.name}** (${t.rowCount} rows)\nColumns: ${cols}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

// ── API call ──────────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

export const agentEnabled = (): boolean =>
  Boolean(API_KEY && API_KEY !== 'your_key_here');

export async function callAgent(
  history: ChatMessage[],
  skill: string,
  maxTokens = 300,
): Promise<string> {
  if (!agentEnabled()) {
    throw new Error('API key not configured');
  }

  const res = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: skill,
      messages: history,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `API error ${res.status}`);
  }

  const data = await res.json() as { content: { type: string; text: string }[] };
  return data.content[0]?.text ?? '(no response)';
}
