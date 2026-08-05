import React, { useRef, useState } from 'react';
import {
  Table,
  Icon,
  Avatar,
  Tooltip,
  Typography,
  Horizontal,
  Vertical,
  Select,
  SearchInput,
  Button,
  Card,
  Link,
} from '@/components';
import type { TableColumn } from '@/components';
import { DatabaseZapIcon } from './DatabaseZapIcon';
import { c, spacing } from '../styles';
import { formatRowsShort } from '../utils';
import styles from './DataObjectsView.module.css';
import type { DataModel } from '../types';

// Recently-opened models shown in the top carousel (static — visual only).
const RECENT = [
  { title: 'GTM Campaigns', modified: 'Jul 13, 2026', opened: 'a few seconds ago' },
  { title: 'OTT Clean Model', modified: 'Jul 08, 2026', opened: '17 seconds ago' },
  { title: 'Github engineering', modified: 'May 28, 2026', opened: '2 months ago' },
  { title: 'GTM RevOps', modified: 'Jul 13, 2026', opened: '2 months ago' },
  { title: 'JIRA PDM', modified: 'May 14, 2026', opened: '2 months ago' },
  { title: 'GTM Community', modified: 'Apr 29, 2026', opened: '3 months ago' },
];

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'models', label: 'Models' },
  { id: 'tables', label: 'Tables' },
  { id: 'datasets', label: 'Datasets' },
  { id: 'views', label: 'Views' },
];

const TAG_OPTIONS = [
  { id: 'all-tags', label: 'All Tags' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'marketing', label: 'Marketing' },
];
const AUTHOR_OPTIONS = [
  { id: 'all-authors', label: 'All Authors' },
  { id: 'vivek', label: 'Vivek Sahi' },
  { id: 'aastha', label: 'Aastha Sharma' },
];

// Recently-opened card: solid-blue "Model" header strip + body meta (static).
const RecentCard: React.FC<{ title: string; modified: string; opened: string }> = ({
  title,
  modified,
  opened,
}) => (
  <Card className={styles.recentCard}>
    <Vertical>
      <Horizontal gap={spacing.A} align="center" className={styles.recentCardHeader}>
        <Icon name="table" size="s" color={c['content-primary-inverse']} />
        <Typography variant="content-label-subhead" color="white" as="span" noMargin>
          Model
        </Typography>
      </Horizontal>
      <Vertical gap={spacing.A} className={styles.recentCardBody}>
        <Typography variant="footnote" color="gray-light" noMargin>
          Modified {modified}
        </Typography>
        <Typography variant="content-label" color="base" noMargin>
          {title}
        </Typography>
        <Typography variant="footnote" color="gray-light" noMargin>
          Opened {opened}
        </Typography>
      </Vertical>
    </Vertical>
  </Card>
);

// Product-style pill tabs for the object-type filter.
const FilterTabs: React.FC<{ value: string; onChange: (id: string) => void }> = ({ value, onChange }) => (
  <Horizontal gap={spacing.A} align="center">
    {TYPE_FILTERS.map((f) => {
      const active = value === f.id;
      return (
        <div
          key={f.id}
          role="button"
          tabIndex={0}
          onClick={() => onChange(f.id)}
          className={`${styles.filterTab} ${active ? styles.filterTabActive : ''}`}
        >
          <Typography variant="content-label-subhead" color={active ? 'base' : 'gray-light'} as="span" noMargin>
            {f.label}
          </Typography>
        </div>
      );
    })}
  </Horizontal>
);

export const DataObjectsView: React.FC<{
  models: DataModel[];
  onOpenModel: (modelId: string) => void;
}> = ({ models, onOpenModel }) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState('models');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dx: number) => scrollerRef.current?.scrollBy({ left: dx, behavior: 'smooth' });

  const isCached = (row: DataModel) =>
    row.cache?.status === 'cached' || row.cache?.status === 'paused' || row.cache?.status === 'refreshing';

  const columns: TableColumn<DataModel>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (_v, row) => (
        <Horizontal gap={spacing.C} align="center">
          <Icon name="table" size="l" color={c['content-secondary']} />
          <Typography variant="content-label-subhead" color="accent" as="span" noMargin>
            {row.name}
          </Typography>
          {isCached(row) && (
            <Tooltip content="This model is cached in AgentDB">
              <span className={styles.zapWrap}>
                <DatabaseZapIcon size={15} color={c['content-brand']} />
              </span>
            </Tooltip>
          )}
        </Horizontal>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      render: (_v, row) => (
        <Typography variant="body-normal" color="gray-light" noMargin>{row.source}</Typography>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: () => 'Model',
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (_v, row) =>
        row.tags?.length
          ? <Typography variant="body-normal" color="gray-light" noMargin>{row.tags.join(', ')}</Typography>
          : <Typography variant="body-normal" color="gray-light" noMargin>—</Typography>,
    },
    {
      key: 'author',
      label: 'Author',
      render: (_v, row) =>
        row.author ? (
          <Avatar
            name={row.author.name}
            src={row.author.imageUrl}
            size="s"
            showName
            namePosition="right"
          />
        ) : (
          '—'
        ),
    },
    {
      key: 'lastModified',
      label: 'Last modified',
      render: (_v, row) => row.lastModified ?? '—',
    },
    // Tables and Rows columns hidden to match product design — easy to restore:
    // { key: 'tables', label: 'Tables', render: (_v, row) => row.tables.length },
    // { key: 'rows', label: 'Rows', render: (_v, row) => formatRowsShort(row.tables.reduce((s, t) => s + t.rowCount, 0)) },
  ];

  // formatRowsShort kept in scope so the commented-out columns above compile when restored
  void formatRowsShort;

  return (
    <Vertical gap={0}>
      {/* Full-bleed recently-opened carousel band (slightly darker to separate) */}
      <div className={styles.carouselBand}>
        <Horizontal gap={spacing.B} align="center" className={styles.carouselInner}>
          <Button variant="tertiary" size="small" icon="chevron-left" iconOnly aria-label="Scroll left" onClick={() => scrollBy(-480)}>Scroll left</Button>
          <div ref={scrollerRef} className={styles.scroller}>
            {RECENT.map((r) => (
              <RecentCard key={r.title} {...r} />
            ))}
          </div>
          <Button variant="tertiary" size="small" icon="chevron-right" iconOnly aria-label="Scroll right" onClick={() => scrollBy(480)}>Scroll right</Button>
        </Horizontal>
      </div>

      {/* Padded content: filter bar + table + pagination */}
      <Vertical gap={spacing.F} className={styles.content}>
        <Horizontal justify="space-between" align="center" wrap>
          <Horizontal gap={spacing.C} align="center" wrap>
            <FilterTabs value={typeFilter} onChange={setTypeFilter} />
            <Select options={TAG_OPTIONS} value="all-tags" onChange={() => {}} size="small" aria-label="Filter by tag" />
            <Select options={AUTHOR_OPTIONS} value="all-authors" onChange={() => {}} size="small" aria-label="Filter by author" />
          </Horizontal>
          <div className={styles.searchBox}>
            <SearchInput placeholder="Search" value="" onChange={() => {}} />
          </div>
        </Horizontal>

        <Table
          columns={columns as unknown as TableColumn[]}
          data={models as unknown as Record<string, unknown>[]}
          rowKey="id"
          hoverable
          bordered
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          onRowClick={(row) => onOpenModel((row as unknown as DataModel).id)}
        />

        {/* Pagination (static) */}
        <Horizontal justify="center" align="center" gap={spacing.C}>
          <Typography variant="body-normal" color="gray-light" as="span" noMargin>
            Showing 1–20
          </Typography>
          <Link href="#" onClick={(e) => e.preventDefault()}>
            Next →
          </Link>
        </Horizontal>
      </Vertical>
    </Vertical>
  );
};
