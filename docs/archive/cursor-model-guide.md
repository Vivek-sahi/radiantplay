# Cursor model guide for designers

You have **500 credits/month** on the Cursor Pro plan. Each request costs 1 or 2 credits depending on the model. Picking the right model for the task saves credits, avoids rate limits, and gets faster results.

## What our usage actually looks like

Based on real team data (Feb 4 – Mar 5, 2026), here's how we've been spending credits:

| Model | Requests | Credits used | % of total |
|-------|----------|-------------|------------|
| Opus high | 109 | 109 | 25% |
| Opus high (thinking) | 132 | 264 | 30% |
| Sonnet medium | 5 | 5 | 1% |
| Sonnet medium (thinking) | 32 | 64 | 7% |
| GPT Codex | 22 | 44 | 5% |
| Other (Sonnet 4.5, Composer) | 134 | ~160 | 31% |

**The problem:** We used thinking models heavily (37% of requests = 2 credits each), and barely used Sonnet medium (1% of requests). Thinking mode is great for hard problems but costs 2x — and most tasks don't need it.

## The models

| Model | Credits | Speed | Best for |
|-------|---------|-------|----------|
| **claude-4.6-sonnet-medium** | 1 | Fastest | Quick questions, small edits, explanations |
| **claude-4.6-opus-high** | 1 | Fast | Complex tasks, large refactors, architecture |
| **claude-4.6-sonnet-medium** (thinking) | 2 | Medium | Multi-step reasoning, debugging |
| **claude-4.6-opus-high** (thinking) | 2 | Slow | Hardest problems, multi-file changes |
| **gpt-5.3-codex-high-fast** | 2 | Fast | Code generation, boilerplate |

> The brain icon next to a model name means "thinking mode" — the model reasons step-by-step before answering. It costs 2 credits instead of 1.

## Which model to use when

### Sonnet medium (1 credit) — your default for most work

Fast and handles the majority of prototyping tasks:

- "Change this button label from Cancel to Dismiss"
- "Add a new card to this grid"
- "What does this component do?"
- "Fix this TypeScript error"
- "Update the mock data with 5 more rows"
- Small copy changes, color tweaks, spacing adjustments
- Asking questions about the codebase

### Opus high (1 credit) — when you need deeper understanding

Same cost as Sonnet but slower and more thorough:

- Building a full new prototype page from scratch
- Refactoring a component with many dependencies
- Complex state management or data flow changes
- "Redesign the entire sidebar navigation"
- When Sonnet gives a shallow or wrong answer

### Sonnet medium thinking (2 credits) — tricky problems

When the non-thinking version gives an incomplete answer:

- Debugging something that isn't obvious
- "Why is this layout breaking on smaller widths?"
- Multi-step edits across 2-3 related files
- Writing a new component with specific interaction logic

### Opus high thinking (2 credits) — sparingly

Only for the hardest problems:

- Architecting a new feature across many files
- Debugging a deeply nested issue nothing else can solve
- Complex multi-file refactors with tricky logic

## How to switch models

1. Click the **model name** next to "Agent" in the chat input area
2. Select the model you want from the dropdown
3. That's it — your next message uses the new model

You can switch models mid-conversation. Start with Sonnet, and only escalate if needed.

## Credit math

With 500 credits/month:
- **500 requests** if you only use regular models (1 credit each)
- **250 requests** if you only use thinking models (2 credits each)

**Recommended mix:**

- ~300 requests on Sonnet medium = 300 credits
- ~100 requests on Opus high = 100 credits
- ~35 requests on thinking models = 70 credits
- ~15 requests on GPT Codex = 30 credits
- **Total: ~500 credits**

## Tips to save credits

1. **Avoid thinking mode by default.** Only turn it on when the regular model gives a bad answer. This alone saves the most credits.
2. **Start with Sonnet for speed.** It's faster than Opus and costs the same — only switch to Opus for complex tasks.
3. **Be specific in your prompts.** Vague prompts waste credits on back-and-forth. Instead of "make this look better", say "increase the padding to 16px and change the background to background-subtle".
4. **Batch your changes.** "Change the title to sentence case, add 8px gap between cards, and remove the border" is one request instead of three.
5. **Give context up front.** Mention the file name, component name, or paste the relevant code.

## MAX mode

The "MAX Mode" toggle removes rate limits but charges more credits per request. **Leave it off** unless you're hitting rate limits during intensive work.

## Quick decision flowchart

```
Is it a simple edit, question, or small change?
  --> Sonnet medium (1 credit, fastest)

Need deeper understanding for a complex task?
  --> Opus high (1 credit, slower but thorough)

Did the regular model give a bad answer?
  --> Try the thinking version (2 credits)

Still stuck?
  --> Opus high thinking (2 credits, last resort)
```
