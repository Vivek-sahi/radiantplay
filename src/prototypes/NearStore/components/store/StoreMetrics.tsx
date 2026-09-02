/**
 * The metrics strip. One component so a unified page and the split pages can't
 * drift apart in how they present the same numbers.
 *
 * ⚠️ On the split pages each half reports only its own consumption. That is
 * correct if the two halves sit on separate instances with separate quotas; if
 * they share one physical store, neither page tells the truth about the whole
 * and nobody sees one half eating the other's headroom. Open question.
 */
import React from 'react';
import { Typography, Card, ProgressBar, Icon, Horizontal, Vertical } from '@/components';
import { c, spacing } from '../../styles';
import { formatGB } from '../../utils';
import styles from './store.module.css';

export interface MetricSplit {
  label: string;
  gb: number;
}

export const StoreMetrics: React.FC<{
  usedGB: number;
  totalGB: number;
  /** Shown under the bar. Omit on a single-purpose page. */
  splits?: MetricSplit[];
  countLabel: string;
  countValue: string;
  countSub?: string;
  rows: string;
}> = ({ usedGB, totalGB, splits, countLabel, countValue, countSub, rows }) => (
  <Horizontal gap={spacing.D} align="stretch" wrap>
    <Card className={styles.meterTile}>
      <Vertical gap={spacing.C} className={styles.tileBody}>
        <Horizontal gap={spacing.B} align="center">
          <Icon name="database" size="m" color={c['content-secondary']} />
          <Typography variant="content-label" color="base" noMargin>Storage</Typography>
        </Horizontal>
        <Typography variant="page-title" color="base" noMargin>
          {formatGB(usedGB)} of {formatGB(totalGB)} used
        </Typography>
        <div className={styles.bar2}>
          <ProgressBar value={Math.min(100, (usedGB / totalGB) * 100)} size="default" />
        </div>
        <Horizontal gap={spacing.D} wrap>
          {(splits ?? []).map((sp) => (
            <Typography key={sp.label} variant="footnote" color="gray-light" noMargin>
              {sp.label} {formatGB(sp.gb)}
            </Typography>
          ))}
          <Typography variant="footnote" color="gray-light" noMargin>
            {formatGB(Math.max(0, totalGB - usedGB))} left
          </Typography>
        </Horizontal>
      </Vertical>
    </Card>
    <Card className={styles.countTile}>
      <Vertical gap={spacing.C} className={styles.tileBody}>
        <Horizontal gap={spacing.B} align="center">
          <Icon name="table" size="m" color={c['content-secondary']} />
          <Typography variant="content-label" color="base" noMargin>{countLabel}</Typography>
        </Horizontal>
        <Typography variant="page-title" color="base" noMargin>{countValue}</Typography>
        {countSub ? (
          <Typography variant="footnote" color="gray-light" noMargin>{countSub}</Typography>
        ) : null}
      </Vertical>
    </Card>
    <Card className={styles.countTile}>
      <Vertical gap={spacing.C} className={styles.tileBody}>
        <Horizontal gap={spacing.B} align="center">
          <Icon name="chart" size="m" color={c['content-secondary']} />
          <Typography variant="content-label" color="base" noMargin>Rows</Typography>
        </Horizontal>
        <Typography variant="page-title" color="base" noMargin>{rows}</Typography>
      </Vertical>
    </Card>
  </Horizontal>
);
