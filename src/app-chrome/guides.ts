/**
 * Radiant Play's guides: static pages served from public/. Both left panes (the playground's and the design
 * system's) list them, so they're defined once here.
 */
export interface Guide {
  id: string;
  label: string;
  href: string;
  /** Radiant icon name */
  icon: 'rocket' | 'bulb' | 'book';
}

export const GUIDES: Guide[] = [
  { id: 'guide-getting-started', label: 'Getting started', href: '/guide.html', icon: 'rocket' },
  { id: 'guide-how-it-works', label: 'How it works', href: '/how-it-works.html', icon: 'bulb' },
  { id: 'guide-claude-setup', label: 'Claude setup and skills', href: '/cursor-to-claude-setup.html', icon: 'book' },
];

export const guideById = (id: string): Guide | undefined => GUIDES.find((g) => g.id === id);
