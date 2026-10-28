import { useEffect, useState } from 'react';
import hashes from 'virtual:prototype-hashes';
import type { ComponentSpec, SpecApproval, SpecState } from './types';

type SpecModule = { specs?: ComponentSpec[]; default?: ComponentSpec[]; approval?: SpecApproval };

// Lazy, so a prototype's spec loads only when that prototype opens
const SPEC_MODULES = import.meta.glob<SpecModule>('/src/prototypes/*/spec.tsx');

export const hasSpec = (projectId: string) => `/src/prototypes/${projectId}/spec.tsx` in SPEC_MODULES;

export interface SpecInfo {
  state: SpecState;
  specs: ComponentSpec[];
  approval?: SpecApproval;
  loading: boolean;
}

/**
 * Loads a prototype's spec.tsx and works out its state: none, draft, ready
 * (approved and the code still matches) or changed (approved, then edited).
 */
export function useSpecState(projectId: string): SpecInfo {
  const [info, setInfo] = useState<SpecInfo>({ state: 'none', specs: [], loading: hasSpec(projectId) });

  useEffect(() => {
    const load = SPEC_MODULES[`/src/prototypes/${projectId}/spec.tsx`];
    if (!load) {
      setInfo({ state: 'none', specs: [], loading: false });
      return;
    }
    let live = true;
    load().then((m) => {
      if (!live) return;
      const approval = m.approval;
      const approved = approval?.status === 'approved';
      const matches = approved && !!approval?.sourceHash && approval.sourceHash === hashes[projectId];
      setInfo({
        state: !approved ? 'draft' : matches ? 'ready' : 'changed',
        specs: m.specs ?? m.default ?? [],
        approval,
        loading: false,
      });
    });
    return () => { live = false; };
  }, [projectId]);

  return info;
}

/** Whether the Spec switch shows: drafts only while the designer runs npm run dev */
export const specVisible = (state: SpecState) =>
  state === 'ready' || state === 'changed' || (state === 'draft' && import.meta.env.DEV);
