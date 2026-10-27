import React, { useState } from 'react';
import { ActionMenu, ActionMenuItem, Button, Icon, SearchBar, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { SqlQuery } from '../types';
import { when } from '../data';
import { titleOf } from '../sqlWorkspace';
import styles from '../v6.module.css';

/**
 * Recent: every query you wrote, saved as you type, kept until you delete it. Yours only, newest
 * first, pinned ones on top. No Save (Vivek, 26 Oct). Deleting a query leaves its runs on Queries.
 */
export const SqlRecent: React.FC<{
  queries: SqlQuery[];
  active: string;
  onOpen: (id: string) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ queries, active, onOpen, onPin, onDelete }) => {
  const [q, setQ] = useState('');
  const [menuKey, setMenuKey] = useState(0);
  const query = q.trim().toLowerCase();
  // An untouched empty query isn't work yet: it stays out of the list.
  const listed = queries
    .filter((x) => x.sql.trim() || x.name)
    .filter((x) => !query || titleOf(x).toLowerCase().includes(query) || x.sql.toLowerCase().includes(query))
    .sort((a, b) => a.age - b.age);
  const pinned = listed.filter((x) => x.pinned);
  const rest = listed.filter((x) => !x.pinned);

  const row = (x: SqlQuery) => (
    <div key={x.id} className={[styles.catRow, x.id === active && styles.catRowActive].filter(Boolean).join(' ')} aria-current={x.id === active || undefined}>
      {x.status === 'failed' ? (
        <Icon name="exclamation-point-circle" size="s" color="var(--rd-sys-color-content-failure)" aria-label="Failed" />
      ) : x.status === 'ok' ? (
        <Icon name="checkmark-circle" size="s" color="var(--rd-sys-color-content-tertiary)" aria-label="Ran" />
      ) : (
        <Icon name="clock" size="s" color="var(--rd-sys-color-content-tertiary)" aria-label="Not run" />
      )}
      <span className={styles.catName} onClick={() => onOpen(x.id)} title={x.sql}>
        <Typography variant="body-normal" color="base" noMargin>
          {titleOf(x)}
        </Typography>
      </span>
      <span className={styles.catType}>
        <Typography variant="footnote" color="gray-light" noMargin>
          {when(x.updated)}
        </Typography>
      </span>
      <span className={styles.catActions}>
        <ActionMenu
          key={`${x.id}-${menuKey}`}
          placement="bottom-end"
          trigger={
            <Button variant="tertiary" size="small" iconOnly icon="more" aria-label={`More for ${titleOf(x)}`}>
              More
            </Button>
          }
        >
          <ActionMenuItem
            label={x.pinned ? 'Unpin' : 'Pin'}
            onClick={() => {
              onPin(x.id);
              setMenuKey((n) => n + 1);
            }}
          />
          <ActionMenuItem
            label="Delete"
            destructive
            onClick={() => {
              onDelete(x.id);
              setMenuKey((n) => n + 1);
            }}
          />
        </ActionMenu>
      </span>
    </div>
  );

  const label = (text: string) => (
    <div className={styles.catSection}>
      <Typography variant="footnote" color="gray-light" noMargin>
        {text}
      </Typography>
    </div>
  );

  return (
    <Vertical gap={spacing.B} className={styles.benchScroll}>
      <SearchBar size="sm" placeholder="Search my queries" value={q} onChange={setQ} onClear={() => setQ('')} />
      <div className={styles.benchScroll}>
        {listed.length === 0 && (
          <Typography variant="body-normal" color="gray-light" noMargin>
            {query ? 'No queries match.' : 'Queries you write show up here.'}
          </Typography>
        )}
        {pinned.length > 0 && (
          <Vertical gap={spacing.A}>
            {label('Pinned')}
            {pinned.map(row)}
          </Vertical>
        )}
        {rest.length > 0 && (
          <Vertical gap={spacing.A}>
            {pinned.length > 0 && label('Recent')}
            {rest.map(row)}
          </Vertical>
        )}
      </div>
    </Vertical>
  );
};
