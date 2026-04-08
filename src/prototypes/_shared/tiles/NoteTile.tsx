import React, { forwardRef } from 'react';
import styles from './NoteTile.module.css';
import type { NoteContent, NoteBlock, InlineNode } from './noteContent';
import type { TileMode } from './AnswerTile';

// ─── Props ─────────────────────────────────────────────────────────────────

export interface NoteTileProps {
  /** Rich text content — see NoteContent schema in noteContent.ts */
  content: NoteContent;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  mode?: TileMode;
  selected?: boolean;
  onSelect?: () => void;
  /** Called on mousedown of a resize handle — direction: nw|n|ne|e|se|s|sw|w */
  onResizeHandleMouseDown?: (direction: string, e: React.MouseEvent) => void;
  /** Called when the user clicks the Duplicate toolbar button. */
  onDuplicate?: () => void;
  /** Called when the user clicks the Delete toolbar button. */
  onDelete?: () => void;
  /** Density-variable inner padding (px). Default: 4 */
  densityPadding?: number;
}

// ─── Inline renderer ───────────────────────────────────────────────────────

function renderInline(nodes: InlineNode[]): React.ReactNode {
  return nodes.map((node, i) => {
    if (node.type === 'link') {
      return (
        <a key={i} href={node.href} className={styles.inlineLink}
          target="_blank" rel="noopener noreferrer">
          {node.text}
        </a>
      );
    }
    const cls = [
      node.bold   ? styles.inlineBold   : '',
      node.italic ? styles.inlineItalic : '',
    ].filter(Boolean).join(' ') || undefined;

    return (
      <span key={i} className={cls} style={node.color ? { color: node.color } : undefined}>
        {node.text}
      </span>
    );
  });
}

// ─── Block renderer ────────────────────────────────────────────────────────

function renderBlock(block: NoteBlock, i: number): React.ReactNode {
  switch (block.type) {
    case 'title':
      return <p key={i} className={styles.blockTitle}>{renderInline(block.children)}</p>;

    case 'heading':
      return <p key={i} className={styles.blockHeading}>{renderInline(block.children)}</p>;

    case 'body':
      return <p key={i} className={styles.blockParagraph}>{renderInline(block.children)}</p>;

    case 'bullet-list':
      return (
        <ul key={i} className={styles.blockBulletList}>
          {block.items.map((item, j) => (
            <li key={j} className={styles.listItem}>{renderInline(item)}</li>
          ))}
        </ul>
      );

    case 'numbered-list':
      return (
        <ol key={i} className={styles.blockNumberedList}>
          {block.items.map((item, j) => (
            <li key={j} className={styles.listItem}>{renderInline(item)}</li>
          ))}
        </ol>
      );

    case 'divider':
      return <hr key={i} className={styles.blockDivider} />;

    case 'image':
      return <img key={i} src={block.src} alt={block.alt ?? ''} className={styles.blockImage} />;

    case 'table':
      return (
        <table key={i} className={styles.blockTable}>
          <thead>
            <tr>{block.headers.map((h, j) => <th key={j}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {block.rows.map((row, j) => (
              <tr key={j}>{row.map((cell, k) => <td key={k}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      );

    default:
      return null;
  }
}

// ─── Toolbar icons ─────────────────────────────────────────────────────────

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconCopy = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M3 11V3H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconDelete = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 4H13M6 4V3H10V4M5 4L5.5 13H10.5L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Component ─────────────────────────────────────────────────────────────

export const NoteTile = forwardRef<HTMLDivElement, NoteTileProps>(
  (
    {
      content,
      mode = 'view',
      selected = false,
      onSelect,
      onResizeHandleMouseDown,
      onDuplicate,
      onDelete,
      densityPadding = 4,
      className,
      style,
      onClick,
      ...rest
    },
    ref
  ) => {
    const isEdit = mode === 'edit';
    const isSelected = isEdit && selected;

    const mouseDownPos = React.useRef<{ x: number; y: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isEdit) return;
      mouseDownPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isEdit) return;
      const pos = mouseDownPos.current;
      if (pos && (Math.abs(e.clientX - pos.x) > 4 || Math.abs(e.clientY - pos.y) > 4)) return;
      onSelect?.();
      onClick?.(e);
    };

    const tileClass = [
      styles.tile,
      isEdit && styles.tileEdit,
      isSelected && styles.tileSelected,
      className,
    ].filter(Boolean).join(' ');

    // Shared resize handle renderer
    const h = (dir: string, cls: string, cursor: string) => (
      <div
        key={dir} className={`${cls} tile-resize-handle`} style={{ cursor }}
        onMouseDown={(e) => { e.stopPropagation(); onResizeHandleMouseDown?.(dir, e); }}
      />
    );

    return (
      <div
        ref={ref}
        className={tileClass}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        style={{ '--tile-content-padding': `${densityPadding}px`, ...style } as React.CSSProperties}
        {...rest}
      >
        {/* ── Selected: resize handles ── */}
        {isSelected && (
          <div className={styles.selectionOverlay}>
            {h('nw', `${styles.handle} ${styles.handleTopLeft}`,    'nw-resize')}
            {h('ne', `${styles.handle} ${styles.handleTopRight}`,   'ne-resize')}
            {h('sw', `${styles.handle} ${styles.handleBottomLeft}`, 'sw-resize')}
            {h('se', `${styles.handle} ${styles.handleBottomRight}`,'se-resize')}
            {h('w',  `${styles.handlePill}  ${styles.handleMidLeft}`,   'w-resize')}
            {h('e',  `${styles.handlePill}  ${styles.handleMidRight}`,  'e-resize')}
            {h('n',  `${styles.handlePillH} ${styles.handleMidTop}`,    'n-resize')}
            {h('s',  `${styles.handlePillH} ${styles.handleMidBottom}`, 's-resize')}
          </div>
        )}

        {/* ── Selected: toolbar ── */}
        {isSelected && (
          <div className={styles.toolbar} onMouseDown={(e) => e.stopPropagation()}>
            <button className={styles.toolbarBtn} title="Edit note">
              <IconEdit />
            </button>
            <div className={styles.toolbarDivider} />
            <button className={styles.toolbarBtn} title="Duplicate" onClick={onDuplicate}>
              <IconCopy />
            </button>
            <div className={styles.toolbarDivider} />
            <button className={styles.toolbarBtn} title="Delete" onClick={onDelete}>
              <IconDelete />
            </button>
          </div>
        )}

        {/* ── Content ── */}
        <div className={styles.inner}>
          <div className={isEdit ? `${styles.content} tile-drag-handle` : styles.content}>
            {content.map((block, i) => renderBlock(block, i))}
          </div>
        </div>
      </div>
    );
  }
);

NoteTile.displayName = 'NoteTile';
