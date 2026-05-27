---
description: How a Spotter agent answer should be structured — voice, block usage, when to use which block kind. Loads on Spotter chat / runtime files.
globs: ["src/spotter/chat/**/*", "src/spotter/runtime/**/*", "src/prototypes/Spotter*/**/*"]
alwaysApply: false
---

# Spotter — Answer response style

How a Spotter response is composed and presented. Use this when
authoring system prompts, canned fixtures, or any agent output that
flows through `<AgentResponseBlock>`.

## Voice

- **Lead with the answer.** No preamble. ("Total Q4 revenue across…")
- **Sentence case.** All UI strings, all narrative text.
- **Imperative for actions.** "Pin", "Save", "Download", "Edit",
  "Add to coaching" — verbs, no "Click here to…" framing.
- **Concise, grounded, neutral.** No hype words ("amazing",
  "fascinating"). Cite what's in the data, not opinions.
- **Spotter doesn't apologize** for not knowing. It asks a clarifying
  question instead — see `RefineBlock`.

## Composition — the block model

A Spotter response is an `AnswerContent`:

```ts
{
  title?: string;          // optional bold heading above the first block
  blocks: AnswerBlock[];   // ordered, rendered top-to-bottom
}
```

A response is a **stack of blocks**, not a flat string. Each block has
a single concern. Don't cram a chart and a paragraph and follow-ups
into one text block — emit them as separate blocks so the renderer can
style each correctly.

### Block kinds and when to use each

| Block | When to emit |
|---|---|
| `text` | Plain narrative. Summary, observation, drill-down question. |
| `viz` | Data answer that's chart-shaped. **Always preferred** when the question maps to a metric / breakdown / time series. |
| `sources` | Citations to liveboards / worksheets / saved answers that back up the answer. Always last after the main content. |
| `followups` | 2–3 suggested next questions. Always emit when the answer is complete (gives the user momentum). |
| `refine` | When the question is ambiguous. **Emit only this block — no other content.** |
| `error` | Typed error. Don't combine with other blocks. |

### Canonical orderings

- **Viz answer**: `viz` → `followups`
- **Text answer**: `text` → `followups` (or `text` → `sources` → `followups`)
- **Refine**: `refine` (alone)
- **Error**: `error` (alone)

When in doubt, mirror the screen-reference orderings in
`docs/2026-05-07-spotter-chat-extraction.md`.

## Reasoning steps — what to emit

Each reasoning step has:

```ts
{
  label: string;           // bold heading on the row
  status: 'current' | 'done' | 'pending';
  description?: string;    // 1–2 sentences explaining what the step found
  toolcall?: {             // optional embedded card
    title;                 // e.g. "Data model search"
    icon?;                 // brand glyph (default: spotter)
    input?;                // input/payload as text
    output?;               // result summary
  };
}
```

### Authoring guidance

- **Step labels** are imperative phrases: "Understand the question",
  "Resolve the data model", "Generate the answer". Not gerunds, not
  questions.
- **Descriptions** are 1–2 sentences. Past tense, factual.
  ✓ "Located 3 candidate tables: orders, products, calendar."
  ✗ "I'm searching for tables…"
- **Toolcalls** appear when a step did something a user can inspect:
  data lookup, intent classification, source resolution.
  Don't add them to every step — only where the input/output is
  meaningful.
- **3–4 steps** is the sweet spot. Less than 3 feels thin; more than 5
  becomes noise.

## Title field

`AnswerContent.title` (the message-level title) is rendered above the
first block in bold 18px. Use it when the response is about a single
thing the user can name: "Total sales by monthly date and item type".

For multi-block responses without a single subject, omit the title.
Each `viz` block also has its own `title` field which shows above the
chart card — they can differ.

## Follow-ups guidance

- **2–3 suggestions**, not more.
- Each is a **complete prompt the user could send next**, not a topic.
  ✓ "Compare against the same period last year"
  ✗ "Year-over-year"
- Each suggestion should branch the conversation — drill, compare,
  switch view, switch dimension. Avoid trivial rephrases.

## Refine guidance

When the question is ambiguous:

- Lead with **one short label** ("I want to make sure I answer the
  right thing — quick check:") rendered inside the refine card.
- **3 options max.** Each is a complete restatement of the user's
  intent. Prefer two distinct interpretations + a "both" option when
  applicable.
- The user's click on an option **becomes a new prompt**.

## VizBlock rules

- **Tokens** match the search interpretation: green for measures, blue
  for keywords, gray + funnel icon for filters.
- **Tokens wrap** to multiple rows when there are many.
- **Title** above the card explains what's being shown ("Total sales
  by monthly date and item type").
- **Slot priority**: a consumer-supplied chart wins, then iframe, then
  inline data sketch, then placeholder. See
  `docs/2026-05-07-spotter-viz-block-behaviour.md`.
- **Footer** has the canonical 5 actions: Pin, Save, Download, Edit
  (left) + Add to coaching (right). Don't add other actions without
  approval — the set is product-canonical.
- **Chart/Table toggle** lets the user flip view. When you provide
  `tableData`, the toggle becomes functional. Otherwise it's visual.

## Things to avoid

- **Markdown mixed inside other block kinds.** Markdown rendering is
  scoped to text blocks (and currently deferred). Don't pack markdown
  tables inside follow-ups labels or token strings.
- **Multiple `viz` blocks in a row.** If you need more than one chart
  for a single answer, use a single viz with side-by-side or
  small-multiple data inside the slot.
- **Tool calls without input or output.** A toolcall card without
  body text is just visual noise — drop it and keep the step as
  description-only.
- **Long-form descriptions.** Keep step descriptions to 1–2 sentences.
  Detailed analysis goes in the `text` block, not the reasoning trace.
- **Greeting padding.** No "Sure, I'd be happy to help with that!" —
  go straight to the answer.

## Examples (from the canned fixtures)

### Viz answer (data-shaped question)

```
content: {
  blocks: [
    { kind: 'viz',
      title: 'Total sales by monthly date and item type',
      tokens: [...measures, keywords, filters],
      source: { type: 'data', chartKind: 'line', data: {...} },
      tableData: { columns, rows } },
    { kind: 'followups',
      suggestions: [
        'Compare against the same period last year',
        'Break this down by region',
        'Show me top 5 items only',
      ] }
  ]
}
```

### Text answer (narrative question)

```
content: {
  blocks: [
    { kind: 'text', text: 'Total Q4 revenue across all regions came in
      at $12.4M, up 8% versus the same period last year. The largest
      contributor was North America at $5.6M, followed by EMEA at $3.8M
      and APAC at $3.0M.' },
    { kind: 'followups', suggestions: [...] }
  ]
}
```

### Refine (ambiguous)

```
content: {
  blocks: [
    { kind: 'refine',
      questions: [
        'Sales by item type, summed for the next 3 months',
        'Sales forecast trend by month for Fall and Winter',
        'Both — first the breakdown, then the forecast',
      ] }
  ]
}
```
