import React, { useRef } from 'react';
import styles from './TableCard.module.css';

export interface TableCardProps {
  name: string;
  totalColumns: number;
  addedColumns: number;
  x: number;
  y: number;
  onDrag: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onMenuClick?: () => void;
}

const MORE_SVG = (
  <svg width="14" height="4" viewBox="0 0 14 4" fill="none" aria-hidden="true">
    <circle cx="2" cy="2" r="1.5" fill="currentColor" />
    <circle cx="7" cy="2" r="1.5" fill="currentColor" />
    <circle cx="12" cy="2" r="1.5" fill="currentColor" />
  </svg>
);

const TableCard = React.forwardRef<HTMLDivElement, TableCardProps>(
  ({ name, totalColumns, addedColumns, x, y, onDrag, onDragEnd, onMenuClick }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const currentPos = useRef({ x, y });

    const handleMouseDown = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-menu]')) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = x;
      const startTop = y;
      currentPos.current = { x, y };
      setIsDragging(true);
      e.preventDefault();

      const onMove = (ev: MouseEvent) => {
        const nx = startLeft + ev.clientX - startX;
        const ny = startTop + ev.clientY - startY;
        currentPos.current = { x: nx, y: ny };
        onDrag(nx, ny);
      };
      const onUp = () => {
        setIsDragging(false);
        onDragEnd(currentPos.current.x, currentPos.current.y);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    return (
      <div
        ref={ref}
        className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
        style={{ left: x, top: y }}
        data-table={name}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.header}>
          <span className={styles.label}>Table</span>
          <button className={styles.menu} data-menu="" onClick={onMenuClick} title="More options">
            {MORE_SVG}
          </button>
        </div>
        <div className={styles.name}>{name}</div>
        <div className={styles.colCount}>{addedColumns}/{totalColumns} Columns</div>
      </div>
    );
  }
);

TableCard.displayName = 'TableCard';
export default TableCard;
