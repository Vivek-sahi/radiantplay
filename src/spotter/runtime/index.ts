// Spotter — runtime surface. Schema, service, and prompts that drive the
// agent loop. Components in `chat/` consume what's exported here.

export * from './schema';

export { askSpotter } from './chatService';
export type { AskSpotterParams, ChatServiceMode } from './chatService';

export { SPOTTER_SYSTEM_PROMPT } from './systemPrompt';

export { pickCannedResponse } from './cannedResponses';
export type { CannedEvent } from './cannedResponses';
