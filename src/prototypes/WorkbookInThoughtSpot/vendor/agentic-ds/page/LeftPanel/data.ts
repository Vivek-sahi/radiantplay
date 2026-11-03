/**
 * Mock content for the Spotter left panel.
 */

export type AnalystAvatar =
  | { kind: 'spotter' }
  | { kind: 'monogram'; letter: string; tone: 'purple' | 'blue' };

export interface Analyst {
  id: string;
  name: string;
  avatar: AnalystAvatar;
  /** The built-in analyst — cannot be copied or deleted, so it has no menu. */
  isDefault?: boolean;
  /**
   * What this analyst is for, shown on its landing page.
   *
   * An analyst is a subagent with a deliberately narrowed context, so this is
   * where a user learns what is in scope before spending a question finding
   * out. It lives on the roster rather than in a separate table so the nav row
   * and the landing page can't describe different things.
   */
  description?: string;
  /** Starter questions on the landing page — the shape of what it can take. */
  starterPrompts?: string[];
}

export const analysts: Analyst[] = [
  // Default Spotter has no narrowed scope and no starters of its own: it gets
  // SpotterLanding, not the analyst page.
  { id: 'spotter', name: 'Spotter', avatar: { kind: 'spotter' }, isDefault: true },
  {
    id: 'customer-prep',
    name: 'Customer prep',
    avatar: { kind: 'monogram', letter: 'C', tone: 'blue' },
    description:
      'Prepares you for customer meetings by pulling the latest account details, performance stats, and key insights.',
    starterPrompts: [
      'What was total revenue last month?',
      'Show me top 10 products by sales this quarter.',
      'How do sales this year compare to last year?',
      'Which region had the highest growth last quarter?',
    ],
  },
  {
    id: 'revops',
    name: 'RevOps Analyst',
    avatar: { kind: 'monogram', letter: 'R', tone: 'purple' },
    description:
      'Tracks pipeline health, forecast accuracy, and quota attainment across the revenue org.',
    starterPrompts: [
      'How is pipeline coverage tracking this quarter?',
      'Which deals slipped out of the forecast last week?',
      'Show me quota attainment by rep.',
      'Where is the forecast least accurate?',
    ],
  },
  {
    id: 'sales',
    name: 'Sales Analyst',
    avatar: { kind: 'monogram', letter: 'S', tone: 'blue' },
    description:
      'Answers questions about bookings, win rates, and rep performance across regions and segments.',
    starterPrompts: [
      'What were bookings last month by region?',
      'Show me win rate by segment this year.',
      'Which accounts grew the most this quarter?',
      'How long is the average sales cycle?',
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing Analyst',
    avatar: { kind: 'monogram', letter: 'M', tone: 'purple' },
    description:
      'Covers campaign performance, channel spend, and how leads move from first touch to pipeline.',
    starterPrompts: [
      'Which campaigns drove the most pipeline last quarter?',
      'Show me cost per lead by channel.',
      'How is MQL to SQL conversion trending?',
      'Which channel has the best return on spend?',
    ],
  },
  {
    id: 'finance',
    name: 'Finance Analyst',
    avatar: { kind: 'monogram', letter: 'F', tone: 'blue' },
    description:
      'Covers revenue recognition, margin, and spend against plan across the business.',
    starterPrompts: [
      'How did margin trend across the last four quarters?',
      'Where are we over budget this quarter?',
      'Show me revenue against plan by segment.',
      'What is driving the change in gross margin?',
    ],
  },
  {
    id: 'supply',
    name: 'Supply Chain Analyst',
    avatar: { kind: 'monogram', letter: 'S', tone: 'purple' },
    description:
      'Tracks inventory, supplier performance, and fulfilment across warehouses.',
    starterPrompts: [
      'Which items are at risk of stocking out?',
      'Show me on-time delivery by supplier.',
      'How has inventory turnover changed this year?',
      'Where is fulfilment slowest?',
    ],
  },
];

/**
 * An analyst's landing content, with a fallback. A newly created analyst has a
 * name before it has written content, and its page still has to render.
 */
export const landingFor = (
  analyst: Analyst
): { description: string; starterPrompts: string[] } => ({
  description: analyst.description ?? 'Ask a question to get started.',
  starterPrompts: analyst.starterPrompts ?? [],
});

export interface Chat {
  id: string;
  title: string;
  /**
   * Every chat is held with exactly one analyst. Opening the chat does NOT
   * highlight that analyst — only one row in the panel is ever selected — so
   * this is what a host reads to name the analyst in the canvas header.
   */
  analystId: string;
}

/**
 * Six saved conversations, each with a thread behind it in
 * `@spotter/runtime/savedThreads`. Titles are the question that started them,
 * which is how an unsaved thread names itself too.
 */
export const chats: Chat[] = [
  { id: 'c1', title: 'Total sales by month', analystId: 'spotter' },
  { id: 'c2', title: 'Which regions are underperforming?', analystId: 'spotter' },
  { id: 'c3', title: 'Jacket sales last year', analystId: 'spotter' },
  { id: 'c4', title: 'Prep me for the Acme renewal', analystId: 'customer-prep' },
  { id: 'c5', title: 'Product margin trend across quarters', analystId: 'customer-prep' },
  { id: 'c6', title: 'Churn risk by account segment', analystId: 'revops' },
];

/** The chat a given analyst opens to — its most recent conversation. */
export const firstChatFor = (analystId: string): Chat | undefined =>
  chats.find((chat) => chat.analystId === analystId);
