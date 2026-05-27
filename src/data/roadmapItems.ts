/**
 * Roadmap Items
 *
 * Tracks documentation updates, AI instruction sets, and guidelines work.
 * Used by the RoadmapPage to display a checklist of pending work.
 */

export type RoadmapStatus = 'not-started' | 'in-progress' | 'done';

export interface RoadmapItem {
  id: string;
  label: string;
  status: RoadmapStatus;
  description?: string;
}

export interface RoadmapSection {
  id: string;
  title: string;
  description: string;
  items: RoadmapItem[];
}

export interface RoadmapCategory {
  id: string;
  title: string;
  icon: string;
  sections: RoadmapSection[];
}

/**
 * All roadmap categories, sections, and items.
 * Edit status values here to update the checklist across the app.
 */
export const roadmapCategories: RoadmapCategory[] = [
  {
    id: 'documentation',
    title: 'Documentation Updates',
    icon: '📄',
    sections: [
      {
        id: 'docs-general',
        title: 'General Documentation',
        description: 'Core project docs that need review and updates',
        items: [
          {
            id: 'docs-readme',
            label: 'Update README and getting-started guide',
            status: 'not-started',
            description: 'Ensure README reflects current component count, setup steps, and project structure',
          },
          {
            id: 'docs-setup-guide',
            label: 'Consolidate onboarding into GETTING_STARTED.md',
            status: 'done',
            description: 'SETUP-GUIDE.md merged into GETTING_STARTED.md and archived',
          },
          {
            id: 'docs-claude-md',
            label: 'Update CLAUDE.md with current component list',
            status: 'not-started',
            description: 'Sync CLAUDE.md with the component registry as single source of truth',
          },
        ],
      },
    ],
  },
  {
    id: 'ai-instructions',
    title: 'AI Instructions',
    icon: '🤖',
    sections: [
      {
        id: 'ai-core',
        title: 'Core Cursor Guidelines',
        description: 'Foundational rules for how AI generates code in this project',
        items: [
          {
            id: 'ai-core-orchestration',
            label: 'Orchestrating between guidelines',
            status: 'not-started',
            description: 'Define how AI should prioritize and combine multiple guideline files',
          },
        ],
      },
      {
        id: 'ai-design-system',
        title: 'Design System Guidelines',
        description: 'Rules ensuring AI-generated code follows Radiant patterns',
        items: [
          {
            id: 'ai-ds-notion',
            label: 'Check through Notion guidelines',
            status: 'not-started',
            description: 'Audit Notion design docs and port relevant rules into .cursor/rules/',
          },
          {
            id: 'ai-ds-importing',
            label: 'Component importing guidelines',
            status: 'not-started',
            description: 'Standardize import paths, barrel exports, and alias usage rules',
          },
          {
            id: 'ai-ds-modal-behaviour',
            label: 'Prototyping modal behaviour guidelines',
            status: 'not-started',
            description: 'Document modal stacking, dismiss patterns, and wizard flows for AI',
          },
          {
            id: 'ai-ds-usage',
            label: 'Component usage guidelines',
            status: 'not-started',
            description: 'When to use which component, common combinations, anti-patterns',
          },
        ],
      },
      {
        id: 'ai-product',
        title: 'Product Knowledge Guidelines',
        description: 'Domain context so AI generates product-aware prototypes',
        items: [
          {
            id: 'ai-pk-ts',
            label: 'TS product knowledge',
            status: 'in-progress',
            description: 'ThoughtSpot platform overview, features, terminology',
          },
          {
            id: 'ai-pk-track',
            label: 'Track-level knowledge',
            status: 'not-started',
            description: 'Specific track/team context for targeted prototype generation',
          },
          {
            id: 'ai-pk-fluency',
            label: 'AI product fluency',
            status: 'not-started',
            description: 'Teach AI about Spotter, Answers, Liveboards, and user journeys',
          },
        ],
      },
    ],
  },
];

/**
 * Helpers
 */
export const getTotalItems = (): number => {
  return roadmapCategories.reduce(
    (total, cat) => total + cat.sections.reduce(
      (sTotal, section) => sTotal + section.items.length, 0
    ), 0
  );
};

export const getCompletedItems = (): number => {
  return roadmapCategories.reduce(
    (total, cat) => total + cat.sections.reduce(
      (sTotal, section) => sTotal + section.items.filter(i => i.status === 'done').length, 0
    ), 0
  );
};

export const getInProgressItems = (): number => {
  return roadmapCategories.reduce(
    (total, cat) => total + cat.sections.reduce(
      (sTotal, section) => sTotal + section.items.filter(i => i.status === 'in-progress').length, 0
    ), 0
  );
};
