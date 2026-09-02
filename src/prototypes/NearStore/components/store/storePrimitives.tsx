/**
 * Small shared pieces. Kept deliberately thin — anything Radiant already has
 * (Table, Pagination, SearchInput, Button, Chip, Avatar) is used directly.
 */
import React from 'react';
import { Typography, Avatar, Chip } from '@/components';
import type { SyncStatus } from './storeTypes';
import styles from './store.module.css';

/** Status vocabulary matches Pulse's, which the team already agreed:
 *  In progress / Success / Error. `Paused` is added here because a sync can be
 *  stopped while its data stays — a distinction Pulse doesn't have. */
const STATUS_COLOR: Record<SyncStatus, 'success' | 'info' | 'failure' | 'gray-light'> = {
  Success: 'success',
  'In progress': 'info',
  Error: 'failure',
  Paused: 'gray-light',
};

export const StatusText: React.FC<{ status: SyncStatus }> = ({ status }) => (
  <Typography variant="body-normal" color={STATUS_COLOR[status]} noMargin>
    {status}
  </Typography>
);

export const AuthorCell: React.FC<{ name: string }> = ({ name }) => (
  <span className={styles.author}>
    <Avatar name={name} size="s" />
    <Typography variant="body-normal" color="gray-light" noMargin>{name}</Typography>
  </span>
);

export const TagCell: React.FC<{ tags: string[] }> = ({ tags }) =>
  tags.length === 0 ? null : (
    <span className={styles.tags}>
      {tags.map((t) => <Chip key={t} label={t} />)}
    </span>
  );

/** 41984 → "41.0 GB"; 512 → "512 MB" */
export const formatSize = (mb: number): string =>
  mb < 1024 ? `${Math.round(mb)} MB` : `${(mb / 1024).toFixed(1)} GB`;

/** 383920114 → "383.9M" */
export const formatRows = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};
