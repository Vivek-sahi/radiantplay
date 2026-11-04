/**
 * Data Cache — prototype scenarios (the gear menu)
 *
 * One scenario per org. The first three come from the PLG reference's frames;
 * "Models cached" is the Pulse data set, so the whole caching workflow and every
 * filled state can be walked. "Caching enabled on cluster" is a separate switch.
 */

export type ScenarioId = 'retail' | 'global' | 'claims' | 'claims-list' | 'cached';

export interface Scenario {
  id: ScenarioId;
  org: string;
  label: string;
  /** Below the org-wide threshold the model list is optional (the reference has both frames). */
  list: boolean;
}

export const SCENARIOS: Scenario[] = [
  { id: 'retail', org: 'retail', label: 'Nothing cached · heavy usage', list: true },
  { id: 'global', org: 'global', label: 'Nothing cached · free hours cover part', list: true },
  { id: 'claims', org: 'claims', label: 'Nothing cached · below threshold', list: false },
  { id: 'claims-list', org: 'claims', label: 'Below threshold · with model list', list: true },
  { id: 'cached', org: 'cached', label: 'Models cached · the Pulse data', list: true },
];

/** Direct jumps to the two Caching-tab hooks (the reference's model frames). */
export const JUMPS: { id: 'heavy' | 'low'; label: string; scenario: ScenarioId; modelId: string }[] = [
  { id: 'heavy', label: 'Heavy model · Caching tab', scenario: 'retail', modelId: 'retail-omnichannel-sales' },
  { id: 'low', label: 'Low-usage model · Caching tab', scenario: 'claims-list', modelId: 'claims-intake-volume' },
];
