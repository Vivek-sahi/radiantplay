import React, { forwardRef, useState, useEffect, useRef, Suspense } from 'react';
import styles from './AnswerTile.module.css';

// Lazy-load the entire chart bundle — ECharts (~700 kB) only downloads
// when an AnswerTile actually mounts, not on app startup.
const ChartRenderer = React.lazy(() =>
  import('./charts').then(m => ({ default: m.ChartRenderer }))
);

// ─── Types ─────────────────────────────────────────────────────────────────

export type ChartType =
  | 'bar'
  | 'column'
  | 'stacked-column'
  | 'line'
  | 'area'
  | 'donut'
  | 'kpi'
  | 'kpi-simple'
  | 'table'
  | 'heatmap'
  | 'treemap'
  | 'map';

export type TileMode = 'view' | 'edit';

export interface AnswerTileProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Chart type to render. Fixed per instance. */
  chartType: ChartType;

  /**
   * Tile title. Optional — omit to hide the title entirely.
   */
  title?: string;

  /**
   * Tile description. Optional — omit to hide.
   */
  description?: string;

  /**
   * 'view' — read-only.
   * 'edit' — tile is selectable, draggable, and resizable.
   * @default 'view'
   */
  mode?: TileMode;

  /**
   * Whether the tile is currently selected.
   * Shows selection handles + toolbar above the tile.
   * @default false
   */
  selected?: boolean;

  /**
   * Called when the tile is clicked in edit mode (not dragged).
   */
  onSelect?: () => void;

  /**
   * Called on mousedown of a resize handle. Direction is one of:
   * 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se'
   */
  onResizeHandleMouseDown?: (direction: string, e: React.MouseEvent) => void;

  /**
   * Called on mousedown of the tile body in edit mode (for drag).
   */
  onDragStart?: (e: React.MouseEvent) => void;

  /**
   * Called when the user selects a new chart type from the toolbar dropdown.
   */
  onChartTypeChange?: (chartType: ChartType) => void;

  /** Called when the user clicks the Duplicate toolbar button. */
  onDuplicate?: () => void;

  /** Called when the user clicks the Delete toolbar button. */
  onDelete?: () => void;

  /** Whether to render the title section. @default true */
  showTitle?: boolean;

  /** Whether to render the description section. @default true */
  showDescription?: boolean;

  /** Called when the user commits an inline title edit. */
  onTitleChange?: (title: string) => void;

  /** Called when the user commits an inline description edit. */
  onDescriptionChange?: (description: string) => void;

  /**
   * Content density inner padding (px).
   * compact=2, comfortable=4 (default), spacious=8
   * @default 4
   */
  densityPadding?: number;
}

// ─── Toolbar icons — inline SVG from Figma node 29:57904 ─────────────────────
// Paths are exact Figma exports with fill/stroke replaced by currentColor
// so they automatically pick up the toolbar's white text color.

// Chart type (bar chart — custom, not in Figma toolbar)
const IconChartType = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="9"  width="3" height="5" rx="0.5" fill="currentColor"/>
    <rect x="6" y="6"  width="3" height="8" rx="0.5" fill="currentColor"/>
    <rect x="11" y="3" width="3" height="11" rx="0.5" fill="currentColor"/>
  </svg>
);

// Edit (pencil) — Figma viewBox 0 0 14.6017 14.7436
const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 14.6017 14.7436" fill="none">
    <path d="M1.35166 10.7197L11.2301 0.732767C11.406 0.554895 11.6933 0.554895 11.8692 0.732767L13.8724 2.75794C14.0456 2.93308 14.0456 3.21503 13.8724 3.39018L3.98709 13.3841L0.784184 14.1397C0.6761 14.1652 0.578805 14.0683 0.603779 13.9601L1.35166 10.7197Z" stroke="currentColor" strokeWidth="1.19873"/>
    <line x1="9.06479" y1="3.13251" x2="11.6121" y2="5.6798" stroke="currentColor" strokeWidth="1.19873"/>
  </svg>
);

// Scale (expand arrows) — Figma viewBox 0 0 16 16
const IconScale = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M14.2092 2.52075L2.52174 14.2082L1.67408 13.3606L13.3616 1.67309L14.2092 2.52075Z" fill="currentColor"/>
    <path d="M1.34435 2.9471C1.34435 2.06379 2.06066 1.34749 2.94396 1.34749H6.51622V2.54671H2.94396C2.72269 2.54671 2.54357 2.72583 2.54357 2.9471V6.60237H1.34435V2.9471Z" fill="currentColor"/>
    <path d="M6.51622 14.6837V13.4845H2.54357V9.4288H1.34435V14.6837H6.51622Z" fill="currentColor"/>
    <path d="M9.59193 1.34749V2.54671H13.5646V6.60237H14.7638V1.34749H9.59193Z" fill="currentColor"/>
    <path d="M14.7638 13.0841C14.7638 13.9674 14.0475 14.6837 13.1642 14.6837H9.59194V13.4845H13.1642C13.3855 13.4845 13.5646 13.3053 13.5646 13.0841V9.4288H14.7638V13.0841Z" fill="currentColor"/>
  </svg>
);

// Sort (bidirectional arrows) — Figma viewBox 0 0 15.3536 13.1348
const IconSort = () => (
  <svg width="16" height="16" viewBox="0 0 15.3536 13.1348" fill="none">
    <path d="M4.64844 0.199219V10.8525L7.25488 8.26855L7.67676 8.69434L8.09863 9.11914L4.0498 13.1348L3.62695 12.7168L0 9.11914L0.421875 8.69434L0.84375 8.26855L3.4502 10.8525V0.199219H4.64844Z" fill="currentColor"/>
    <path d="M11.9034 12.9357V2.28237L14.5098 4.86635L14.9317 4.44057L15.3536 4.01576L11.3048 0.000139236L10.8819 0.418108L7.25495 4.01576L7.67683 4.44057L8.0987 4.86635L10.7051 2.28237V12.9357H11.9034Z" fill="currentColor"/>
  </svg>
);

// Copy (duplicate with + badge) — Figma: two composited layers in one SVG
const IconCopy = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    {/* copy-bg: overlapping squares (offset 0.9,0.9 in 16×16 space) */}
    <g transform="translate(0.9,0.9)">
      <rect x="4.046" y="0.599" width="9.44" height="9.44" rx="0.6" stroke="currentColor" strokeWidth="1.199"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M3.545 4.126H1.198C0.537 4.126 0 4.662 0 5.324V12.886C0 13.507 0.472 14.017 1.076 14.079L1.198 14.086H8.761L8.884 14.079C9.448 14.021 9.896 13.573 9.953 13.009L9.96 12.886V10.54H8.761V12.886H1.198V5.324H3.545V4.126Z" fill="currentColor"/>
    </g>
    {/* copy-fg: + badge at top-right (7.49,4.05) */}
    <g transform="translate(7.49,4.05)">
      <line x1="2.173" y1="0" x2="2.173" y2="4.345" stroke="currentColor" strokeWidth="1.199"/>
      <line x1="0" y1="2.173" x2="4.345" y2="2.173" stroke="currentColor" strokeWidth="1.199"/>
    </g>
  </svg>
);

// Delete (trash can) — Figma viewBox 0 0 13.7854 14.8342
const IconDelete = () => (
  <svg width="16" height="16" viewBox="0 0 13.7854 14.8342" fill="none">
    <path d="M4.94492 11.2364V5.99197H6.14364V11.2364H4.94492Z" fill="currentColor"/>
    <path d="M7.64205 5.99197V11.2364H8.84078V5.99197H7.64205Z" fill="currentColor"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M3.74615 1.79809V2.39745L0 2.39819V3.59692H1.10149L2.99694 14.8342H11.0883L12.713 3.59692H13.7854V2.39819L10.1893 2.39745V1.79809C10.1893 0.805033 9.38427 0 8.39121 0H5.54423C4.55118 0 3.74615 0.805032 3.74615 1.79809ZM5.54423 1.19873C5.21322 1.19873 4.94487 1.46707 4.94487 1.79809V2.39745H8.99057V1.79809C8.99057 1.46707 8.72223 1.19873 8.39121 1.19873H5.54423ZM2.31715 3.59692H11.5018L10.0505 13.6355H4.01041L2.31715 3.59692Z" fill="currentColor"/>
  </svg>
);

// Chevron (down arrow) — Figma viewBox 0 0 7.60948 4.74755
const IconChevron = () => (
  <svg width="8" height="6" viewBox="0 0 7.60948 4.74755" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M0 0.942809L0.942809 0L3.80474 2.86193L6.66667 0L7.60948 0.942809L3.80474 4.74755L0 0.942809Z" fill="currentColor"/>
  </svg>
);

// Chart type options shown in the dropdown
const CHART_TYPES: { type: ChartType; label: string }[] = [
  { type: 'bar',            label: 'Bar'            },
  { type: 'column',         label: 'Column'         },
  { type: 'stacked-column', label: 'Stacked column' },
  { type: 'line',           label: 'Line'           },
  { type: 'area',           label: 'Area'           },
  { type: 'donut',          label: 'Donut'          },
  { type: 'kpi',            label: 'KPI'            },
  { type: 'kpi-simple',    label: 'KPI (no chart)' },
  { type: 'table',          label: 'Table'          },
  { type: 'heatmap',        label: 'Heatmap'        },
  { type: 'treemap',        label: 'Treemap'        },
  { type: 'map',            label: 'Map'            },
];

// ─── Component ──────────────────────────────────────────────────────────────

export const AnswerTile = forwardRef<HTMLDivElement, AnswerTileProps>(
  (
    {
      chartType,
      title,
      description,
      mode = 'view',
      selected = false,
      onSelect,
      onResizeHandleMouseDown,
      onDragStart,
      onChartTypeChange,
      onDuplicate,
      onDelete,
      showTitle = true,
      showDescription = true,
      onTitleChange,
      onDescriptionChange,
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

    // Inline editing state
    const [localTitle, setLocalTitle] = useState(title ?? '');
    const [localDesc,  setLocalDesc]  = useState(description ?? '');
    useEffect(() => { setLocalTitle(title ?? ''); }, [title]);
    useEffect(() => { setLocalDesc(description ?? ''); }, [description]);

    const commitTitle = (val: string) => onTitleChange?.(val);
    const commitDesc  = (val: string) => onDescriptionChange?.(val);

    // Hover / focus state — on the wrapper div (larger target, avoids input-specific issues)
    const [titleHovered, setTitleHovered] = useState(false);
    const [titleFocused, setTitleFocused] = useState(false);
    const [descHovered,  setDescHovered]  = useState(false);
    const [descFocused,  setDescFocused]  = useState(false);

    // Refs to programmatically focus the inputs (wrapper click → focus input)
    const titleInputRef = useRef<HTMLInputElement>(null);
    const descInputRef  = useRef<HTMLInputElement>(null);

    const titleBorder = titleFocused ? '1px solid #2770EF' : titleHovered ? '1px solid #C0C6CF' : '1px solid transparent';
    const descBorder  = descFocused  ? '1px solid #2770EF' : descHovered  ? '1px solid #C0C6CF' : '1px solid transparent';

    // Chart type dropdown
    const [chartDropdownOpen, setChartDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside the toolbar area
    useEffect(() => {
      if (!chartDropdownOpen) return;
      const onOutsideClick = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setChartDropdownOpen(false);
        }
      };
      document.addEventListener('mousedown', onOutsideClick);
      return () => document.removeEventListener('mousedown', onOutsideClick);
    }, [chartDropdownOpen]);

    // Distinguish click vs drag: only call onSelect if mouse didn't move
    const mouseDownPos = React.useRef<{ x: number; y: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isEdit) return;
      mouseDownPos.current = { x: e.clientX, y: e.clientY };
      onDragStart?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isEdit) return;
      const pos = mouseDownPos.current;
      if (pos) {
        const moved = Math.abs(e.clientX - pos.x) > 4 || Math.abs(e.clientY - pos.y) > 4;
        if (moved) return;
      }
      onSelect?.();
      onClick?.(e);
    };

    const tileClass = [
      styles.tile,
      isEdit && styles.tileEdit,
      isSelected && styles.tileSelected,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={tileClass}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        style={
          {
            '--tile-content-padding': `${densityPadding}px`,
            ...style,
          } as React.CSSProperties
        }
        {...rest}
      >

        {/* ── Selected: resize handles ── */}
        {isSelected && (() => {
          const h = (dir: string, cls: string, cursor: string) => (
            <div
              key={dir}
              className={`${cls} tile-resize-handle`}
              style={{ cursor }}
              onMouseDown={(e) => { e.stopPropagation(); onResizeHandleMouseDown?.(dir, e); }}
            />
          );
          return (
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
          );
        })()}

        {/* ── Selected: toolbar above tile ── */}
        {isSelected && (
          <div className={styles.toolbar} onMouseDown={(e) => e.stopPropagation()}>
            {/* Edit */}
            <button className={styles.toolbarBtn} title="Edit">
              <IconEdit />
            </button>
            <div className={styles.toolbarDivider} />
            {/* Scale + chevron — gap 4px (Figma spec) */}
            <button className={styles.toolbarBtnWithChevron} style={{ gap: 4 }} title="Scale">
              <IconScale />
              <IconChevron />
            </button>
            {/* Sort + chevron — gap 2px (Figma spec) */}
            <button className={styles.toolbarBtnWithChevron} style={{ gap: 2 }} title="Sort">
              <IconSort />
              <IconChevron />
            </button>
            <div className={styles.toolbarDivider} />
            {/* Chart type picker */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                className={styles.toolbarBtnWithChevron}
                style={{ gap: 4 }}
                title="Change chart type"
                onClick={() => setChartDropdownOpen(p => !p)}
              >
                <IconChartType />
                <IconChevron />
              </button>
              {chartDropdownOpen && (
                <div className={styles.chartDropdown} onMouseDown={e => e.stopPropagation()}>
                  {CHART_TYPES.map(({ type, label }) => (
                    <button
                      key={type}
                      className={`${styles.chartDropdownItem} ${chartType === type ? styles.chartDropdownItemActive : ''}`}
                      onClick={() => { onChartTypeChange?.(type); setChartDropdownOpen(false); }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.toolbarDivider} />
            {/* Duplicate */}
            <button className={styles.toolbarBtn} title="Duplicate" onClick={onDuplicate}>
              <IconCopy />
            </button>
            <div className={styles.toolbarDivider} />
            {/* Delete */}
            <button className={styles.toolbarBtn} title="Delete" onClick={onDelete}>
              <IconDelete />
            </button>
          </div>
        )}


        {/* ── Density-variable inner content area ── */}
        {/* inner is never a drag-handle — prevents the drag system from owning the title/desc inputs */}
        <div className={styles.inner}>

          {/* Header — conditionally rendered based on showTitle / showDescription */}
          {(showTitle || showDescription) && (localTitle || localDesc) && (
            <div className={styles.header}>
              {showTitle && localTitle && (
                /* Wrapper carries the border + hover detection — larger/more reliable hit area */
                <div
                  className={styles.titleWrapper}
                  style={isEdit ? { border: titleBorder, borderRadius: 4, cursor: 'text' } : undefined}
                  onPointerEnter={isEdit ? () => { setTitleHovered(true);  console.log('HOVER-IN'); } : undefined}
                  onPointerLeave={isEdit ? () => { setTitleHovered(false); console.log('HOVER-OUT'); } : undefined}
                  onMouseDown={isEdit ? e => e.stopPropagation()        : undefined}
                  onClick={isEdit ? e => {
                    e.stopPropagation();
                    onSelect?.();
                    titleInputRef.current?.focus();
                  } : undefined}
                >
                  {isEdit ? (
                    <input
                      ref={titleInputRef}
                      className={styles.titleEditInput}
                      style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', padding: 0 }}
                      value={localTitle}
                      onChange={e => setLocalTitle(e.target.value)}
                      onFocus={() => { setTitleFocused(true); setTitleHovered(false); }}
                      onBlur={() => { setTitleFocused(false); commitTitle(localTitle); }}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  { commitTitle(localTitle); e.currentTarget.blur(); }
                        if (e.key === 'Escape') { setLocalTitle(title ?? ''); e.currentTarget.blur(); }
                      }}
                    />
                  ) : (
                    <span className={styles.title}>{localTitle}</span>
                  )}
                </div>
              )}
              {showDescription && localDesc && (
                <div
                  className={styles.descriptionWrapper}
                  style={isEdit ? { border: descBorder, borderRadius: 4, cursor: 'text' } : undefined}
                  onPointerEnter={isEdit ? () => setDescHovered(true)  : undefined}
                  onPointerLeave={isEdit ? () => setDescHovered(false) : undefined}
                  onMouseDown={isEdit ? e => e.stopPropagation()       : undefined}
                  onClick={isEdit ? e => {
                    e.stopPropagation();
                    onSelect?.();
                    descInputRef.current?.focus();
                  } : undefined}
                >
                  {isEdit ? (
                    <input
                      ref={descInputRef}
                      className={styles.descEditInput}
                      style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', padding: 0 }}
                      value={localDesc}
                      onChange={e => setLocalDesc(e.target.value)}
                      onFocus={() => { setDescFocused(true); setDescHovered(false); }}
                      onBlur={() => { setDescFocused(false); commitDesc(localDesc); }}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  { commitDesc(localDesc); e.currentTarget.blur(); }
                        if (e.key === 'Escape') { setLocalDesc(description ?? ''); e.currentTarget.blur(); }
                      }}
                    />
                  ) : (
                    <span className={styles.description}>{localDesc}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chart area */}
          {/* chart area is the drag handle — large, safe to drag from */}
          <div className={isEdit ? `${styles.chartArea} tile-drag-handle` : styles.chartArea}>
            <Suspense fallback={<div style={{ width: '100%', height: '100%' }} />}>
              <ChartRenderer type={chartType} />
            </Suspense>
          </div>
        </div>

      </div>
    );
  }
);

AnswerTile.displayName = 'AnswerTile';
