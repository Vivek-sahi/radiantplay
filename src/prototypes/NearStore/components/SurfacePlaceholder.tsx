import React from 'react';
import { NoData } from '@/components';
import styles from './SurfacePlaceholder.module.css';

/**
 * Empty-state stand-in for the business-user surfaces that aren't built yet.
 * Each Near Store touchpoint gets its own slot behind the header switcher; the
 * real flow replaces this placeholder.
 */
type PlaceholderSurface = 'search';

const COPY: Record<PlaceholderSurface, { title: string; description: string }> = {
  search: {
    title: 'Search data',
    description: 'How a cached vs live result appears in Search data. Flow coming soon.',
  },
};

export const SurfacePlaceholder: React.FC<{ surface: PlaceholderSurface }> = ({ surface }) => {
  const copy = COPY[surface];
  return (
    <div className={styles.wrap}>
      <NoData title={copy.title} description={copy.description} />
    </div>
  );
};
