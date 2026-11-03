import type React from 'react';

/**
 * A component spec for engineering handoff, written as data.
 *
 * Every field is optional except id and name. The spec sheet renders a section
 * only when its data is there, so a spec can start with two rows and grow.
 * Prototypes put theirs in `src/prototypes/<Name>/spec.tsx` (export `specs`);
 * shared components get one built from componentRegistry + their doc entry.
 */
export interface ComponentSpec {
  /** Used for the ?spec=<id> deep link. */
  id: string;
  name: string;
  /** Set from the approval on prototype pages (see SpecApproval) */
  status?: 'draft' | 'in-review' | 'ready' | 'changed';
  summary?: string;
  /** Short facts shown as chips under the title, such as "Light and dark". */
  tags?: string[];
  /** Live specimen for the anatomy section. */
  preview?: () => React.ReactNode;
  /** Numbered parts, matching the preview top to bottom. */
  anatomy?: { name: string; description: string }[];
  /** Live specimens, one per state or variant. */
  states?: { label: string; note?: string; render: () => React.ReactNode }[];
  props?: { name: string; type: string; default?: string; description: string }[];
  /**
   * Sizes and spacing. Give `px` and the sheet adds the spacing letter and the
   * scaligent SCSS token when the value is on the grid; give `value` for anything else.
   */
  measurements?: { element: string; px?: number; value?: string }[];
  behaviour?: { trigger: string; result: string }[];
  keyboard?: { key: string; does: string }[];
  motion?: { what: string; property: string; timing: string }[];
  /** Where the code lives, so engineering can open it. */
  files?: { path: string; holds: string }[];
  /**
   * Source shown with a copy button, usually imported with `?raw`. CSS sources
   * are also scanned for the tokens table and for hardcoded values.
   */
  sources?: { title: string; code: string }[];
  /** Usage rules, the same shape the component doc pages use. */
  usage?: { use?: string[]; avoid?: string[] };
  notes?: string[];
}

/**
 * The designer's sign-off on a prototype's spec, exported as `approval` from its
 * spec.tsx. /rp-spec writes it; only the designer approves.
 *
 * - draft: written but not approved. Shown only under npm run dev.
 * - approved: shown to everyone, as Ready for build, while `sourceHash` matches
 *   the prototype's code (scripts/spec/prototype-hash.mjs). After a code change
 *   it reads Changed since approval until the designer approves again.
 */
export interface SpecApproval {
  status: 'draft' | 'approved';
  /** Who approved it */
  by?: string;
  /** ISO date of the approval */
  on?: string;
  /** The prototype's code fingerprint when it was approved */
  sourceHash?: string;
}

/** What a prototype's spec is right now, after checking the fingerprint */
export type SpecState = 'none' | 'draft' | 'ready' | 'changed';

