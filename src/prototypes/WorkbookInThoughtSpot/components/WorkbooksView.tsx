import React from 'react';
import { Typography } from '@components/Typography';
import { Table } from '@components/Table';
import type { TableColumn } from '@components/Table';
import { Vertical } from '@components/Layout';
import { WORKBOOKS } from '../data/workbooks';
import styles from '../WorkbookInThoughtSpot.module.css';

const COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'model', label: 'Data model' },
  { key: 'author', label: 'Author' },
  { key: 'modified', label: 'Last modified', sortable: true },
];

// Library > Workbooks (Vivek, 3 Nov): the second entry point. A list like Liveboards and Answers.
export const WorkbooksView: React.FC = () => (
  <Vertical gap={16} className={styles.page}>
    <Typography variant="page-title">Workbooks</Typography>
    <Table columns={COLUMNS} data={WORKBOOKS as unknown as Record<string, unknown>[]} rowKey="id" />
  </Vertical>
);

export default WorkbooksView;
