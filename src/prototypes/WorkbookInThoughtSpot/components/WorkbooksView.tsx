import React, { useMemo, useState } from 'react';
import { Typography } from '@components/Typography';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Table } from '@components/Table';
import type { TableColumn } from '@components/Table';
import { SegmentedControl } from '@components/SegmentedControl';
import { Horizontal, Vertical } from '@components/Layout';
import { Icon } from '@components/icons';
import { START_OPTIONS, TEMPLATES, WORKBOOKS, type WorkbookRow } from '../data/workbooks';
import styles from '../WorkbookInThoughtSpot.module.css';

// Library > Workbooks. Layout and copy from the PM's vision prototype, screen 1 (16 Oct):
// header with New Workbook, four ways to start, templates, and recent workbooks.

const STATUS_RENDER = (value: unknown) =>
  value === 'Verified' ? (
    <Horizontal gap={4} align="center">
      <Icon name="verified" size="s" />
      <Typography variant="body-normal">Verified</Typography>
    </Horizontal>
  ) : (
    <Typography variant="body-normal" color="gray">Draft</Typography>
  );

const COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'model', label: 'Model' },
  { key: 'sheets', label: 'Sheets' },
  { key: 'owner', label: 'Owner' },
  { key: 'edited', label: 'Edited' },
  { key: 'status', label: 'Status', render: STATUS_RENDER },
];

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Mine' },
  { id: 'shared', label: 'Shared with me' },
];

export const WorkbooksView: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const rows = useMemo<WorkbookRow[]>(
    () => WORKBOOKS.filter((w) => (filter === 'all' ? true : filter === 'mine' ? w.mine : !w.mine)),
    [filter],
  );

  return (
    <Vertical gap={32} className={styles.page}>
      <Horizontal justify="space-between" align="center">
        <Vertical gap={4}>
          <Typography variant="page-title">Workbooks</Typography>
          <Typography variant="body-normal" color="gray">Excel-style work on governed, live data</Typography>
        </Vertical>
        <Button variant="primary" icon="plus" iconPosition="leading">New Workbook</Button>
      </Horizontal>

      <div className={styles.cardGrid}>
        {START_OPTIONS.map((o) => (
          <Card key={o.id} interactive>
            <Card.Body>
              <Vertical gap={8}>
                <Icon name={o.icon} size="l" />
                <Typography variant="content-label">{o.title}</Typography>
                <Typography variant="footnote" color="gray">{o.description}</Typography>
              </Vertical>
            </Card.Body>
          </Card>
        ))}
      </div>

      <Vertical gap={12}>
        <Typography variant="section-label">Templates</Typography>
        <div className={styles.cardGrid}>
          {TEMPLATES.map((t) => (
            <Card key={t.id} interactive>
              <Card.Body>
                <Vertical gap={4}>
                  <Typography variant="content-label">{t.title}</Typography>
                  <Typography variant="footnote" color="gray">{t.description}</Typography>
                </Vertical>
              </Card.Body>
            </Card>
          ))}
        </div>
      </Vertical>

      <Vertical gap={12}>
        <Horizontal justify="space-between" align="center">
          <Typography variant="section-label">Recent</Typography>
          <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} size="small" />
        </Horizontal>
        <Table columns={COLUMNS} data={rows as unknown as Record<string, unknown>[]} rowKey="id" />
      </Vertical>
    </Vertical>
  );
};

export default WorkbooksView;
