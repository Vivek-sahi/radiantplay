import React, { useRef } from 'react';
import { Link } from '@components/Link';
import { Icon } from '@components/icons';
import styles from './TableCard.module.css';

export interface TableCardProps {
  name: string;
  totalColumns: number;
  addedColumns: number;
  x: number;
  y: number;
  onDrag: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  // Receives the click so a consumer can anchor a menu to the button.
  onMenuClick?: (e: React.MouseEvent) => void;
  selected?: boolean;
  onSelect?: (name: string) => void;
  // Additive, opt-in: on hover, give the card a brand-blue border and a join
  // handle on its right edge. Off by default so the other prototypes sharing
  // this component (DataModelEditor, the explorations copy, CoachingScreen)
  // keep their current hover-less cards.
  hoverAffordance?: boolean;
  /**
   * Click-primary cursor treatment (additive, 2026-09-24, SearchDataOnDataModelFinal
   * Split only): pointer at rest instead of grab — click (preview) is the
   * primary action; drag still works from the whole body via the movement
   * threshold, and the grabbing cursor still shows during an actual drag.
   * Omitted everywhere else, so every other consumer keeps grab-at-rest.
   */
  clickPrimary?: boolean;
  /** Product-reference visual skin (2026-09-25) — see TableCard.module.css. */
  skin?: 'product';
  // Mousedown on the join handle. TableCanvas owns the click-vs-drag decision
  // and the dotted line, since only it knows the canvas coordinate space.
  onJoinHandleMouseDown?: (name: string, e: React.MouseEvent) => void;
  // Additive, opt-in: when the table is on the canvas with no columns picked
  // yet, swap the "0/n Columns" count for an "Add columns" link that calls
  // this. Omit to keep the plain count every existing consumer shows.
  onAddColumns?: (name: string) => void;
  // Additive, opt-in: renders an explicit preview (eye) button in the card
  // header. SearchDataOnDataModelFinal's explicit-preview direction only
  // (2026-09-23); omit to keep every other consumer's header unchanged.
  onPreview?: (name: string) => void;
}

const MORE_SVG = (
  <svg width="14" height="4" viewBox="0 0 14 4" fill="none" aria-hidden="true">
    <circle cx="2" cy="2" r="1.5" fill="currentColor" />
    <circle cx="7" cy="2" r="1.5" fill="currentColor" />
    <circle cx="12" cy="2" r="1.5" fill="currentColor" />
  </svg>
);

const PLUS_SVG = (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
    <path d="M4 0.75v6.5M0.75 4h6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Radiant's Eye icon (2026-09-25, was a hand-drawn approximation) at 16px —
// matching the more-options dots' optical weight.
const EYE_SVG = <Icon name="eye" size="m" color="currentColor" aria-hidden />;

const TableCard = React.forwardRef<HTMLDivElement, TableCardProps>(
  ({ name, totalColumns, addedColumns, x, y, onDrag, onDragEnd, onMenuClick, selected, onSelect, hoverAffordance = false, clickPrimary = false, skin, onJoinHandleMouseDown, onAddColumns, onPreview }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const currentPos = useRef({ x, y });

    const handleMouseDown = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-menu]')) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = x;
      const startTop = y;
      currentPos.current = { x, y };
      let moved = false;
      e.preventDefault();

      const onMove = (ev: MouseEvent) => {
        if (!moved && (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3)) {
          moved = true;
          setIsDragging(true);
        }
        if (!moved) return;
        const nx = startLeft + ev.clientX - startX;
        const ny = startTop + ev.clientY - startY;
        currentPos.current = { x: nx, y: ny };
        onDrag(nx, ny);
      };
      const onUp = () => {
        setIsDragging(false);
        if (moved) onDragEnd(currentPos.current.x, currentPos.current.y);
        else onSelect?.(name);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    return (
      <div
        ref={ref}
        className={`${styles.card} ${isDragging ? styles.dragging : ''} ${selected ? styles.selected : ''} ${hoverAffordance ? styles.hoverable : ''} ${clickPrimary ? styles.clickPrimary : ''} ${skin === 'product' ? styles.skinProduct : ''}`}
        style={{ left: x, top: y }}
        data-table={name}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.header}>
          <span className={styles.label}>Table</span>
          {/* data-menu keeps the card's own mousedown-to-drag handler off it,
              same as the more-options button; stopPropagation keeps the card's
              click-to-select from also firing (preview selects on its own). */}
          {onPreview && (
            <button
              className={styles.menu}
              data-menu=""
              onClick={e => { e.stopPropagation(); onPreview(name); }}
              title="Preview data"
              // .header is space-between; the auto margin groups this with the
              // more-options button on the right instead of floating centred.
              style={{ marginLeft: 'auto', marginRight: 4 }}
            >
              {EYE_SVG}
            </button>
          )}
          <button className={styles.menu} data-menu="" onClick={onMenuClick} title="More options">
            {MORE_SVG}
          </button>
        </div>
        <div className={styles.name}>{name}</div>
        {onAddColumns && addedColumns === 0 ? (
          <div className={styles.colCount}>
            {/* data-menu keeps the card's own mousedown-to-drag handler off it. */}
            <Link
              href="#"
              size="small"
              data-menu=""
              onClick={e => { e.preventDefault(); e.stopPropagation(); onAddColumns(name); }}
            >
              Add columns
            </Link>
          </div>
        ) : (
          <div className={styles.colCount}>{addedColumns}/{totalColumns} Columns</div>
        )}
        {hoverAffordance && (
          <span
            className={styles.joinHandle}
            data-menu=""
            data-join-handle=""
            aria-hidden="true"
            onMouseDown={e => { e.stopPropagation(); onJoinHandleMouseDown?.(name, e); }}
          >
            {PLUS_SVG}
          </span>
        )}
      </div>
    );
  }
);

TableCard.displayName = 'TableCard';
export default TableCard;
