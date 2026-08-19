/**
 * Data objects — the Data Workspace landing page (POC V2).
 *
 * Layout ported from `surajboro-ts/spotter-readiness-vision`
 * (`OneClickModelGenerationHandoff/DataWorkspaceHome`) on the same
 * patterns-not-product-decisions filter the readiness port used: take the
 * structure — recent-objects strip, segmented filter, table, pagination — and
 * run it on our own data and persona.
 *
 * Clicking a Model routes by its `canvas` field. Multi-source models open our
 * canvas; the rest open the classic modelling UI, which this prototype doesn't
 * have — so that path is explicit rather than silently doing nothing.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Button } from '../../../components/Button';
import { SearchInput } from '../../../components/SearchInput';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { Pagination } from '../../../components/Pagination';
import { Divider } from '../../../components/Divider';
import { Icon } from '../../../components/icons';
import { Horizontal } from '../../../components/Layout';
import { Table } from '../../../components/Table';
import type { TableColumn } from '../../../components/Table';
import { systemColors } from '../../../tokens/colors';
import { spacing } from '../../../tokens/spacing';
import { fontSize, fontWeight, fontFamily } from '../../../tokens/typography';
import { SourceMark, hasBrandMark, CONNECTOR_MARK } from './icons/ConnectorIcons';
import type { DataObject } from '../data/dataObjects';

const SEGMENTS = [
  { id: 'all',      label: 'All' },
  { id: 'models',   label: 'Models' },
  { id: 'tables',   label: 'Tables' },
  { id: 'datasets', label: 'Datasets' },
  { id: 'views',    label: 'Views' },
];

const PAGE_SIZE = 8;

// ── Type glyphs ──────────────────────────────────────────────────────────────

const TypeIcon: React.FC<{ type: DataObject['type']; color?: string }> = ({ type, color }) => (
  <Icon
    name={type === 'Model' ? 'schema' : 'table'}
    size="s"
    color={color ?? systemColors.light['content-tertiary']}
  />
);

/**
 * Real brand mark where we have one, the hand-drawn silhouette otherwise.
 * `SourceMark` covers six vendors and returns null for the rest — BigQuery and dbt
 * both land in that gap, so the silhouette in `CONNECTOR_MARK` has to catch them
 * or those rows show no source at all.
 */
const SourceIcon: React.FC<{ provider: string }> = ({ provider }) => {
  if (hasBrandMark(provider)) return <SourceMark name={provider} size={16} />;
  const Silhouette = CONNECTOR_MARK[provider];
  return Silhouette ? <Silhouette size={16} /> : null;
};

// ── Recent object card ───────────────────────────────────────────────────────

const RecentObjectCard: React.FC<{ obj: DataObject; onOpen: (obj: DataObject) => void }> = ({ obj, onOpen }) => (
  <button
    type="button"
    onClick={() => onOpen(obj)}
    style={{
      width: 204,
      flexShrink: 0,
      borderRadius: 8,
      border: `1px solid ${systemColors.light['border-divider']}`,
      boxShadow: '0px 0px 4px 0px rgba(25,35,49,0.08), 0px 2px 4px 0px rgba(25,35,49,0.04)',
      overflow: 'hidden',
      fontFamily: fontFamily.primary,
      padding: 0,
      background: 'none',
      cursor: 'pointer',
      textAlign: 'left',
    }}
  >
    <div
      style={{
        background: systemColors.light['background-brand'],
        height: 48,
        display: 'flex',
        alignItems: 'center',
        gap: `${spacing.B}px`,
        padding: `0 ${spacing.C}px`,
      }}
    >
      <TypeIcon type={obj.type} color="#FFFFFF" />
      <span style={{ fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: systemColors.light['content-alternate'] }}>{obj.type}</span>
    </div>
    <div
      style={{
        backgroundColor: systemColors.light['background-base'],
        height: 76,
        padding: `${spacing.C}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${spacing.A}px`,
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontSize: fontSize.sm,
          fontWeight: fontWeight.medium,
          color: systemColors.light['content-primary'],
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {obj.name}
      </span>
      <span style={{ fontSize: fontSize.xs, color: systemColors.light['content-secondary'] }}>
        Modified {obj.lastModified}
      </span>
    </div>
  </button>
);

// ── Page ─────────────────────────────────────────────────────────────────────

export interface DataObjectsPageProps {
  objects: DataObject[];
  recent: DataObject[];
  /** A Model — opens its detail page (the view state). */
  onOpenModel: (obj: DataObject) => void;
  /** A Table — no detail page in this prototype. */
  onOpenTable: (obj: DataObject) => void;
}

const DataObjectsPage: React.FC<DataObjectsPageProps> = ({
  objects,
  recent,
  onOpenModel,
  onOpenTable,
}) => {
  const [activeSegment, setActiveSegment] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dx: number) => carouselRef.current?.scrollBy({ left: dx, behavior: 'smooth' });

  // Every model opens its detail page — the view state. Which canvas edits it is
  // decided there, by "Edit model", not here.
  const open = (obj: DataObject) => {
    if (obj.type === 'Model') onOpenModel(obj);
    else onOpenTable(obj);
  };

  const rows = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    return objects.filter(o => {
      if (activeSegment === 'models' && o.type !== 'Model') return false;
      if (activeSegment === 'tables' && o.type !== 'Table') return false;
      // Datasets and Views have no objects in this cut — the segments stay so the
      // filter matches the real product, and they legitimately show empty.
      if (activeSegment === 'datasets' || activeSegment === 'views') return false;
      if (q && !o.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [objects, activeSegment, searchValue]);

  const pagedRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page],
  );

  // What the canvas published about each model's cache, if anything. Absent for models that were
  // never built here, which is most of them.

  const columns: TableColumn<DataObject>[] = [
    {
      key: 'name',
      label: 'Name',
      width: '26%',
      render: (_, row) => (
        <Horizontal align="center" gap={spacing.B} style={{ overflow: 'hidden' }}>
          <TypeIcon type={row.type} />
          <button
            type="button"
            onClick={e => { e.stopPropagation(); open(row); }}
            style={{
              border: 'none',
              background: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: fontSize.sm,
              fontWeight: fontWeight.medium,
              color: systemColors.light['content-primary'],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.name}
          </button>
          {/*
            ⚠️ **No cache marker on this listing.** It appeared here twice — first as a "Query"
            column, then beside the name — and neither is what Near Store ships. Removed
            2026-08-12 at Vivek's call. The model's cache state lives on the model: the Caching
            tab on its detail page, and the topbar pill while you're building it. A listing of
            data objects answers "what exists", not "how is each one stored".
          */}
        </Horizontal>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      width: '10%',
      render: (_, row) => (
        <span style={{ fontSize: fontSize.sm, color: systemColors.light['content-secondary'] }}>{row.type}</span>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      width: '22%',
      render: (_, row) => (
        <Horizontal align="center" gap={spacing.B} style={{ overflow: 'hidden' }}>
          <SourceIcon provider={row.sourceProvider} />
          <span
            style={{
              fontSize: fontSize.sm,
              color: systemColors.light['content-secondary'],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.source}
          </span>
        </Horizontal>
      ),
    },
    {
      key: 'tags',
      label: 'Tags',
      width: '16%',
      render: (_, row) => (
        <Horizontal align="center" gap={spacing.A} style={{ flexWrap: 'wrap' }}>
          {row.tags.map(tag => (
            <span
              key={tag}
              style={{
                fontSize: fontSize.xs,
                color: systemColors.light['content-secondary'],
                background: systemColors.light['background-sunken'],
                border: `1px solid ${systemColors.light['border-divider']}`,
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              {tag}
            </span>
          ))}
        </Horizontal>
      ),
    },
    {
      key: 'author',
      label: 'Author',
      width: '12%',
      render: (_, row) => (
        <span style={{ fontSize: fontSize.sm, color: systemColors.light['content-secondary'] }}>{row.author}</span>
      ),
    },
    {
      key: 'lastModified',
      label: 'Modified',
      render: (_, row) => (
        <span style={{ fontSize: fontSize.sm, color: systemColors.light['content-secondary'] }}>{row.lastModified}</span>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: fontFamily.primary }}>
      {/* Recent objects strip */}
      <div style={{ backgroundColor: systemColors.light['background-sunken'], padding: `${spacing.F}px` }}>
        <Horizontal align="center" gap={spacing.C}>
          <Button variant="secondary" iconOnly icon="arrow-left" onClick={() => scrollBy(-440)}>Left</Button>
          <div
            ref={carouselRef}
            style={{
              flex: 1,
              display: 'flex',
              gap: `${spacing.C}px`,
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none',
              overscrollBehavior: 'none',
            }}
          >
            {recent.map(obj => <RecentObjectCard key={obj.id} obj={obj} onOpen={open} />)}
          </div>
          <Button variant="secondary" iconOnly icon="arrow-right" onClick={() => scrollBy(440)}>Right</Button>
        </Horizontal>
      </div>

      {/* Toolbar + table + pagination */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: `${spacing.F}px` }}>
        <Horizontal align="center" gap={spacing.C} style={{ marginBottom: `${spacing.D}px` }}>
          <SegmentedControl
            options={SEGMENTS}
            value={activeSegment}
            onChange={id => { setActiveSegment(id); setPage(1); }}
          />
          <Divider vertical />
          <SearchInput
            placeholder="Search"
            value={searchValue}
            onChange={e => { setSearchValue(e.target.value); setPage(1); }}
            style={{ width: 200 }}
          />
        </Horizontal>

        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <Table
            columns={columns as unknown as TableColumn[]}
            data={pagedRows as unknown as Record<string, unknown>[]}
            rowKey="id"
            selectable
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            hoverable
            stickyHeader
          />
        </div>

        {rows.length > PAGE_SIZE && (
          <div style={{ paddingTop: `${spacing.D}px` }}>
            {/* Pagination is a compositional namespace — the bare <Pagination /> renders null. */}
            <Pagination.Numbers
              currentPage={page}
              totalPages={Math.ceil(rows.length / PAGE_SIZE)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DataObjectsPage;
