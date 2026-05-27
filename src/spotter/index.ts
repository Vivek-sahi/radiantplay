// Spotter DS — domain building blocks for agentic chat, answers,
// Spotter pages, and runtime-generated UIs.
//
// Sits on top of Radiant DS (@components) and shared tokens (@tokens).
// Consumers: src/prototypes, src/pages, runtime renderer.
//
// Subdomains:
//   chat/    — agentic chat blocks (thread, bubble, reasoning, suggestions)
//   answer/  — answer surfaces (card, sources, follow-ups, confidence)
//   viz/     — Spotter-flavored data display (answer viz, drill panel)
//   page/    — full-page shells (Spotter shell, header)
//   runtime/ — dynamic UI generation (renderer, block registry, schema)

export * from './chat';
export * from './answer';
export * from './viz';
export * from './page';
export * from './runtime';
