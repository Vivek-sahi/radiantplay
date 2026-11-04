import React from 'react';
import { Alert } from '@/components';
import styles from './LimitBanner.module.css';
import { formatRowsFull } from '../utils';
import type { Plan } from '../types';

/**
 * A plan limit reached (Vivek, 4 Nov): the query hours used up for the month, or the
 * cache storage full. One warning banner, the same on the Data Cache page and on a
 * model's Caching tab, with the action that lifts the limit.
 *
 * Query hours: the PM's frame "Hours used up" (compute → query). Storage: not in the
 * PM's doc; the rule is Vivek's (existing caches keep running, no new model can be
 * cached), the words are placeholders for his copy pass.
 */
export type Limit = 'none' | 'hours' | 'storage';
export const LIMIT_OPTIONS: { id: Limit; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'hours', label: 'Compute hours' },
  { id: 'storage', label: 'Storage' },
];

const message = (limit: Exclude<Limit, 'none'>, plan: Plan) =>
  limit === 'hours'
    ? `Caching is paused for November. You used your ${formatRowsFull(plan.freeHours)} free compute hours on 22 Nov. Queries are running on your warehouse again and nothing is charged. Caching resumes 1 Dec, or now if you add hours.`
    : `Your ${plan.freeGB} GB of cache storage is full. Cached models keep refreshing, but no new model can be cached. Add storage, or purge a cache to free up space.`;

// No button (Vivek, 4 Nov): customers contact sales for more. Section multi-line so the
// message wraps inside the page instead of running off it.
export const LimitBanner: React.FC<{ limit: Limit; plan: Plan }> = ({ limit, plan }) => {
  if (limit === 'none') return null;
  return <Alert status="warning" variant="section-multiline" dismissible={false} message={message(limit, plan)} className={styles.banner} />;
};
