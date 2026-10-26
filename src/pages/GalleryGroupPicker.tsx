import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '../components/icons';
import type { ProjectMeta } from '../prototypes/registry';
import styles from './GalleryGroupPicker.module.css';

interface GalleryGroupPickerProps {
  project: ProjectMeta;
  /** Groups to offer: the ones already used by prototypes in the same registry */
  knownGroups: string[];
  /** True when a choice writes registry-mine.ts; false when it copies a prompt for Claude */
  savesLocally: boolean;
  /** Where the click that opened it happened; the panel opens next to it */
  anchor: { x: number; y: number } | null;
  /** null takes the prototype out of its group */
  onSave: (group: string | null) => void;
  onClose: () => void;
}

const PANEL_WIDTH = 280;

/**
 * A small panel in the gallery's own style, like the Help menu: pick a group and
 * the card moves at once, or type a new one. Escape or a click outside closes it.
 */
export const GalleryGroupPicker: React.FC<GalleryGroupPickerProps> = ({
  project,
  knownGroups,
  savesLocally,
  anchor,
  onSave,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const current = project.group?.trim().toLowerCase() || '';

  // Open beside the click, kept inside the window
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const h = el.offsetHeight;
    const x = anchor?.x ?? window.innerWidth / 2 - PANEL_WIDTH / 2;
    const y = anchor?.y ?? window.innerHeight / 3;
    setPos({
      left: Math.max(8, Math.min(x - PANEL_WIDTH + 24, window.innerWidth - PANEL_WIDTH - 8)),
      top: Math.max(8, Math.min(y + 8, window.innerHeight - h - 8)),
    });
  }, [anchor, adding]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  const submitNew = () => {
    const name = draft.trim().slice(0, 60);
    if (!name) return;
    // A typed name that matches an existing group joins it, keeping its spelling
    onSave(knownGroups.find((g) => g.toLowerCase() === name.toLowerCase()) ?? name);
  };

  const row = (label: string, value: string | null, active: boolean) => (
    <button
      key={label}
      type="button"
      role="menuitemradio"
      aria-checked={active}
      className={`${styles.item} ${active ? styles.itemActive : ''}`}
      onClick={() => (active ? onClose() : onSave(value))}
    >
      <span className={styles.check}>{active && <Icon name="checkmark" size="s" />}</span>
      <span className={styles.label}>{label}</span>
    </button>
  );

  return (
    <div
      ref={panelRef}
      className={styles.panel}
      role="menu"
      aria-label={`Move ${project.name} to a group`}
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, width: PANEL_WIDTH }}
    >
      <div className={styles.heading}>Move to group</div>
      <div className={styles.list}>
        {knownGroups.map((g) => row(g, g, g.toLowerCase() === current))}
        {row('No group', null, current === '')}
      </div>
      <div className={styles.divider} role="separator" />
      {adding ? (
        <div className={styles.newRow}>
          <input
            className={styles.input}
            placeholder="Group name"
            aria-label="New group name"
            value={draft}
            maxLength={60}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); submitNew(); }
              if (e.key === 'Escape') { e.stopPropagation(); setAdding(false); setDraft(''); }
            }}
          />
          <span className={styles.hint}>Enter to create</span>
        </div>
      ) : (
        <button type="button" role="menuitem" className={styles.item} onClick={() => setAdding(true)}>
          <span className={styles.check}><Icon name="plus" size="s" /></span>
          <span className={styles.label}>New group</span>
        </button>
      )}
      {!savesLocally && (
        <p className={styles.note}>This site can't save on its own, so your choice copies a prompt to paste into Claude.</p>
      )}
    </div>
  );
};
