import React from 'react';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Typography } from '@components/Typography';
import { Horizontal, Vertical } from '@components/Layout';
import { Icon } from '@components/icons';
import { RECENTS, WATCHLIST } from '../data/home';
import styles from '../WorkbookInThoughtSpot.module.css';

// Recents and Watchlist under the home prompt, as on the product home.
export const HomeWidgets: React.FC = () => (
  <div className={styles.homeWidgets}>
    <Card>
      <Card.Header title="Recents" />
      <Card.Body>
        <Vertical gap={16}>
          {RECENTS.map((r) => (
            <Horizontal key={r.id} gap={12} align="center">
              <Icon name={r.icon} size="l" />
              <Vertical gap={0}>
                <Typography variant="body-normal">{r.name}</Typography>
                <Typography variant="footnote" color="gray">{r.when}</Typography>
              </Vertical>
            </Horizontal>
          ))}
        </Vertical>
      </Card.Body>
    </Card>
    <Card>
      <Card.Header title="Watchlist" actions={<Button variant="tertiary" icon="plus" iconPosition="leading" size="small">Add KPI</Button>} />
      <Card.Body>
        <Vertical gap={16}>
          {WATCHLIST.map((w) => (
            <Horizontal key={w.id} justify="space-between" align="start">
              <Vertical gap={0}>
                <Typography variant="body-normal">{w.name}</Typography>
                <Typography variant="footnote" color="gray">{w.comparison}</Typography>
              </Vertical>
              <Vertical gap={0} align="end">
                <Typography variant="content-label">{w.value}</Typography>
                {w.change && (
                  <Horizontal gap={2} align="center">
                    <Icon name="arrow-down" size="xs" color="var(--rd-sys-color-content-failure)" />
                    <Typography variant="footnote" color="failure">{w.change}</Typography>
                  </Horizontal>
                )}
              </Vertical>
            </Horizontal>
          ))}
        </Vertical>
      </Card.Body>
    </Card>
  </div>
);

export default HomeWidgets;
