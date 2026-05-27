import React from 'react';
import { componentRegistry } from '@/data/componentRegistry';
import { systemColors } from '@tokens/colors';
import { spacing } from '@tokens/spacing';

export interface LastUpdatedProps {
  /** Component id from componentRegistry. If omitted, falls back to `date`. */
  componentId?: string;
  /** Manual date override (ISO string). Used when no registry id is available. */
  date?: string;
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const LastUpdated: React.FC<LastUpdatedProps> = ({ componentId, date }) => {
  const entry = componentId ? componentRegistry.find(c => c.id === componentId) : undefined;
  const value = entry?.lastModified ?? date;
  if (!value) return null;

  return (
    <div
      style={{
        fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 12,
        color: systemColors.light['content-secondary'],
        marginBottom: spacing.B,
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.A,
      }}
    >
      Last updated {formatDate(value)}
    </div>
  );
};

export default LastUpdated;
