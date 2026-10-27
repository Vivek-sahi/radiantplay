import React, { useState } from 'react';
import { ActionMenu, ActionMenuItem, Button, Horizontal, Icon, SearchBar, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Database, DbObject } from '../types';
import { sqlTypeOf } from '../data';
import { KIND_ICON } from './DataPage';
import styles from '../v5.module.css';

/**
 * The catalog on the SQL page (Vivek, 26 Oct; moved here from Data). Databases, then tables, views
 * and materialised views, then columns with their type as text, in the tree, not a bottom panel.
 * Get a name into the query by clicking it or dragging it into the editor. ▶ on hover runs 100 rows.
 * Search matches column names too; Collapse all for wide tables. The database picked here is
 * where unqualified names run; with all databases, names go in with their database. The
 * database picker sits in the rail's top bar (SqlPage).
 */
export const SqlCatalog: React.FC<{
  databases: Database[];
  objects: DbObject[];
  database: string;
  onInsert: (text: string) => void;
  onPreview: (o: DbObject) => void;
  onInsertSelect: (o: DbObject) => void;
  onOpenObject: (id: string) => void;
}> = ({ databases, objects, database, onInsert, onPreview, onInsertSelect, onOpenObject }) => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string[]>([]);
  const [closedDbs, setClosedDbs] = useState<string[]>([]);
  const [menuKey, setMenuKey] = useState(0);
  const query = q.trim().toLowerCase();
  const all = database === 'all';
  const ref = (o: DbObject) => (all ? `${o.database}.${o.name}` : o.name);
  const toggle = (id: string) => setOpen((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const matchCols = (o: DbObject) => (query ? o.columns.filter((c) => c.name.toLowerCase().includes(query)) : o.columns);
  const visible = (o: DbObject) => !query || o.name.includes(query) || matchCols(o).length > 0;
  const dbs = databases.filter((d) => all || d.id === database);

  const drag = (text: string) => (e: React.DragEvent) => e.dataTransfer.setData('text/plain', text);

  const objectRow = (o: DbObject, indent: string) => {
    // A search that hits a column opens its table and shows only the matching columns.
    const byColumn = query && !o.name.includes(query);
    const expanded = open.includes(o.id) || !!byColumn;
    const cols = byColumn ? matchCols(o) : o.columns;
    return (
      <React.Fragment key={o.id}>
        <div className={`${styles.catRow} ${indent}`}>
          <Button variant="tertiary" size="small" iconOnly icon={expanded ? 'chevron-down' : 'chevron-right'} aria-label={expanded ? `Collapse ${o.name}` : `Show columns of ${o.name}`} onClick={() => toggle(o.id)}>
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
          <Icon name={KIND_ICON[o.kind]} size="s" aria-hidden />
          <span className={styles.catName} draggable onDragStart={drag(ref(o))} onClick={() => onInsert(ref(o))} title="Click or drag into the editor">
            <Typography variant="body-normal" color="base" noMargin>
              {o.name}
            </Typography>
          </span>
          <span className={styles.catActions}>
            <Button variant="tertiary" size="small" iconOnly icon="play" aria-label={`Show 100 rows of ${o.name}`} title="Show 100 rows" onClick={() => onPreview(o)}>
              Show 100 rows
            </Button>
            <ActionMenu
              key={`${o.id}-${menuKey}`}
              placement="bottom-end"
              trigger={
                <Button variant="tertiary" size="small" iconOnly icon="more" aria-label={`More for ${o.name}`}>
                  More
                </Button>
              }
            >
              <ActionMenuItem
                label="Insert SELECT *"
                onClick={() => {
                  onInsertSelect(o);
                  setMenuKey((n) => n + 1);
                }}
              />
              <ActionMenuItem
                label="Open in Overview"
                onClick={() => {
                  onOpenObject(o.id);
                  setMenuKey((n) => n + 1);
                }}
              />
            </ActionMenu>
          </span>
        </div>
        {expanded &&
          cols.map((c) => (
            <div key={`${o.id}.${c.name}`} className={`${styles.catRow} ${indent === styles.catIndent1 ? styles.catIndent2 : styles.catIndent1}`}>
              <span className={styles.catName} draggable onDragStart={drag(c.name)} onClick={() => onInsert(c.name)} title="Click or drag into the editor">
                <Typography variant="footnote" color="base" noMargin>
                  {c.name}
                </Typography>
              </span>
              <span className={styles.catType}>
                <Typography variant="footnote" color="gray-light" noMargin>
                  {sqlTypeOf(c.type)}
                </Typography>
              </span>
            </div>
          ))}
      </React.Fragment>
    );
  };

  return (
    <Vertical gap={spacing.B} className={styles.benchScroll}>
      <Horizontal gap={spacing.A} align="center">
        <div className={styles.grow}>
          <SearchBar size="sm" placeholder="Search tables and columns" value={q} onChange={setQ} onClear={() => setQ('')} />
        </div>
        <Button
          variant="tertiary"
          size="small"
          iconOnly
          icon="chevron-up"
          aria-label="Collapse all"
          title="Collapse all"
          onClick={() => {
            setOpen([]);
            setClosedDbs(dbs.map((d) => d.id));
          }}
        >
          Collapse all
        </Button>
      </Horizontal>
      <div className={styles.benchScroll}>
        {objects.length === 0 && (
          <Typography variant="body-normal" color="gray-light" noMargin>
            No tables yet.
          </Typography>
        )}
        {dbs.map((d) => {
          const objs = objects.filter((o) => o.database === d.id && visible(o));
          if (!all) return objs.map((o) => objectRow(o, ''));
          const dbOpen = !closedDbs.includes(d.id) || !!query;
          return (
            <React.Fragment key={d.id}>
              <div className={styles.catRow}>
                <Button
                  variant="tertiary"
                  size="small"
                  iconOnly
                  icon={dbOpen ? 'chevron-down' : 'chevron-right'}
                  aria-label={dbOpen ? `Collapse ${d.name}` : `Expand ${d.name}`}
                  onClick={() => setClosedDbs((p) => (p.includes(d.id) ? p.filter((x) => x !== d.id) : [...p, d.id]))}
                >
                  {dbOpen ? 'Collapse' : 'Expand'}
                </Button>
                <Icon name="database" size="s" aria-hidden />
                <span className={styles.catName} draggable onDragStart={drag(d.name)} onClick={() => onInsert(d.name)}>
                  <Typography variant="body-normal" color="base" noMargin>
                    {d.name}
                  </Typography>
                </span>
              </div>
              {dbOpen && objs.map((o) => objectRow(o, styles.catIndent1))}
            </React.Fragment>
          );
        })}
      </div>
    </Vertical>
  );
};
