import React from 'react';
import { fontFamily as ff } from '@tokens/typography';
import { AnchoredMenu } from './AnchoredMenu';
// Real ThoughtSpot glyphs from the Spreadsheet Figma, rather than hand-drawn
// approximations. Radiant has no cell-formatting icon set yet.
import {
  AdvancedSortingIcon, AlignLeftIcon, CurrencyIcon, IncreaseDecimalIcon,
  PercentIcon, ReduceDecimalIcon, StyleIcon, TextWrapIcon,
} from './SpreadsheetIcons';

// Copied from SearchDataOnDataModelFinal/components/Spreadsheet.tsx (Komal Bains, 3 Nov 2026):
// the Google-Sheets-style action toolbar of ThoughtSpot's spreadsheet. Sits between the
// workbook's title and its formula bar. Hardcoded colours swapped for Radiant tokens so it
// follows dark mode; the fill swatches stay as the colours a user picks.

const BORDER = '1px solid var(--rd-sys-color-border-subtle)';

// ── Data-tab toolbar — Google-Sheets-style chrome for the full "Data" tab ──────
// Sort/Filter/Formula/Download/Expand are real (Download builds a CSV; Expand
// toggles the browser-panel width). Undo/Redo/format-paint/Align/Wrap/$/%/
// decimals/number-format/Fill-color are present and clickable for visual parity
// with a real spreadsheet toolbar, but don't persist any formatting state —
// this is a data-modeling prototype, not a spreadsheet engine.
export interface DataSheetToolbarProps {
  onDownloadCsv: () => void;
  // Omitted where a full-screen toggle already lives at the Preview panel's own
  // title level (MVP) — showing both there and here duplicated the control.
  onToggleExpand?: () => void;
  expanded: boolean;
  // Filter/Formula open the shared properties panel (via a "which table?" picker
  // in the parent, since the Data sheet merges every table).
  onFilter?: () => void;
  onFormula?: () => void;
  // Row limit — omitted (as today) unless the caller passes a value; MVP moves its
  // Limit selector down from the Preview panel's title row into this toolbar.
  limit?: number;
  onLimitChange?: (n: number) => void;

  // ── Optimized (SearchDataOnDataModelFinal) only ──────────────────
  // All optional: omitted by DataStudioV2's call site, so its toolbar keeps
  // the original visual-only behaviour. When supplied, these make the
  // formatting chrome real. Formatting targets the selected cell's COLUMN.
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSort?: (dir: 'asc' | 'desc' | 'clear') => void;
  onFormatPaint?: () => void;
  formatPaintActive?: boolean;
  onAlign?: (a: 'left' | 'center' | 'right') => void;
  onWrap?: (w: 'overflow' | 'wrap' | 'clip') => void;
  onCurrency?: () => void;
  onPercent?: () => void;
  onDecimals?: (delta: 1 | -1) => void;
  onNumberFormat?: (fmt: string) => void;
  onFillColor?: (color: string | null) => void;
  /** Column the formatting buttons will act on; undefined = nothing selected. */
  formatTarget?: string;
  /**
   * What kind of column formatTarget is. Drives which formatting controls are
   * live: numbers get currency/percent/decimals and the format menu, dates get
   * the format menu only, text gets neither. Alignment and wrap ignore it —
   * they stay enabled regardless of selection.
   */
  formatTargetType?: 'numeric' | 'date' | 'text';
  /** Trailing slot, pinned to the toolbar's right edge. */
  right?: React.ReactNode;
}

const NUMBER_FORMATS = ['Automatic', 'Number', 'Currency', 'Percent', 'Date'];
// Fill-colour swatches for the Optimized toolbar's Fill button.
const FILL_COLORS = ['#FFFFFF', '#F6F8FA', '#EAF1FE', '#E6F6EC', '#FEF6E0', '#FDECEA'];

export function DataSheetToolbar({
  onDownloadCsv, onToggleExpand, expanded, onFilter, onFormula, limit, onLimitChange,
  onUndo, onRedo, canUndo, canRedo, onSort, onFormatPaint, formatPaintActive,
  onAlign, onWrap, onCurrency, onPercent, onDecimals, onNumberFormat, onFillColor,
  formatTarget, formatTargetType, right,
}: DataSheetToolbarProps) {
  const [formatOpen, setFormatOpen] = React.useState(false);
  const formatBtnRef = React.useRef<HTMLDivElement>(null);
  // Caret dropdowns for Sort / Align / Wrap / Fill. Only rendered when the
  // matching handler is supplied, so DataStudioV2's call site is unaffected.
  const [openMenu, setOpenMenu] = React.useState<null | 'sort' | 'align' | 'wrap' | 'fill'>(null);
  const sortRef = React.useRef<HTMLDivElement>(null);
  const alignRef = React.useRef<HTMLDivElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const fillRef = React.useRef<HTMLDivElement>(null);
  // Formatting acts on the selected cell's column — with nothing selected the
  // format buttons are inert and dimmed rather than silently doing nothing.
  const noTarget = onAlign != null && !formatTarget;
  // Number formatting is type-dependent; alignment and wrap are not.
  const typeAware  = onAlign != null && formatTargetType != null;
  const noNumberFmt = onAlign != null && (!typeAware || formatTargetType !== 'numeric');
  const noFormatMenu = onAlign != null && (!typeAware || (formatTargetType !== 'numeric' && formatTargetType !== 'date'));

  const iconBtn = (title: string, svg: React.ReactNode, onClick?: () => void, opts?: { disabled?: boolean; active?: boolean }) => {
    const disabled = opts?.disabled ?? false;
    return (
      <button onClick={disabled ? undefined : onClick} title={title} aria-disabled={disabled}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 24, padding: 0, borderRadius: 5, border: 'none', background: opts?.active ? 'var(--rd-sys-color-background-information)' : 'transparent', color: disabled ? 'var(--rd-sys-color-border-default)' : opts?.active ? 'var(--rd-sys-color-content-brand)' : 'var(--rd-sys-color-content-secondary)', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: ff.primary }}
        onMouseEnter={e => { if (disabled) return; (e.currentTarget as HTMLElement).style.background = opts?.active ? 'var(--rd-sys-color-background-information)' : 'var(--rd-sys-color-background-sunken)'; (e.currentTarget as HTMLElement).style.color = opts?.active ? 'var(--rd-sys-color-content-brand)' : 'var(--rd-sys-color-content-primary)'; }}
        onMouseLeave={e => { if (disabled) return; (e.currentTarget as HTMLElement).style.background = opts?.active ? 'var(--rd-sys-color-background-information)' : 'transparent'; (e.currentTarget as HTMLElement).style.color = opts?.active ? 'var(--rd-sys-color-content-brand)' : 'var(--rd-sys-color-content-secondary)'; }}
      >{svg}</button>
    );
  };
  // Same icon-button shape, plus a small trailing dropdown caret — matches the
  // reference toolbar's Sort/Align/Wrap/Download buttons, which each show one.
  const iconCaretBtn = (title: string, svg: React.ReactNode, onClick?: () => void, opts?: { disabled?: boolean }) => {
    const disabled = opts?.disabled ?? false;
    return (
      <button onClick={disabled ? undefined : onClick} title={title} aria-disabled={disabled}
        style={{ display: 'flex', alignItems: 'center', gap: 1, height: 24, padding: '0 3px 0 6px', borderRadius: 5, border: 'none', background: 'transparent', color: disabled ? 'var(--rd-sys-color-border-default)' : 'var(--rd-sys-color-content-secondary)', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: ff.primary }}
        onMouseEnter={e => { if (disabled) return; (e.currentTarget as HTMLElement).style.background = 'var(--rd-sys-color-background-sunken)'; (e.currentTarget as HTMLElement).style.color = 'var(--rd-sys-color-content-primary)'; }}
        onMouseLeave={e => { if (disabled) return; (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--rd-sys-color-content-secondary)'; }}
      >{svg}<svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
    );
  };
  const menuItem = (label: string, onPick: () => void) => (
    <button key={label} onClick={() => { onPick(); setOpenMenu(null); }}
      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary, fontSize: 12, fontWeight: 500, color: 'var(--rd-sys-color-content-primary)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--rd-sys-color-background-sunken)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >{label}</button>
  );
  const MENU_STYLE: React.CSSProperties = { background: 'var(--rd-sys-color-background-base)', border: '1px solid var(--rd-sys-color-border-subtle)', borderRadius: 8, boxShadow: 'var(--rd-sys-color-shadow-menu)', width: 150, padding: '4px 0' };
  const divider = <div style={{ width: 1, height: 16, background: 'var(--rd-sys-color-border-subtle)', margin: '0 3px', flexShrink: 0 }} />;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '4px 10px', borderBottom: BORDER, background: 'var(--rd-sys-color-background-base)', flexShrink: 0, overflowX: 'auto' }}>
      {iconBtn('Undo', <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 14 4 9l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>, onUndo, { disabled: onUndo != null && !canUndo })}
      {iconBtn('Redo', <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M15 14l5-5-5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>, onRedo, { disabled: onRedo != null && !canRedo })}
      {divider}
      <div ref={sortRef} style={{ position: 'relative' }}>
        {iconCaretBtn('Sort range', <AdvancedSortingIcon size={14} />, onSort ? () => setOpenMenu(m => m === 'sort' ? null : 'sort') : undefined, { disabled: noTarget })}
        {openMenu === 'sort' && onSort && (
          <AnchoredMenu open anchorRef={sortRef} onClose={() => setOpenMenu(null)} placement="bottom-start" style={MENU_STYLE}>
            {menuItem('Sort A \u2192 Z', () => onSort('asc'))}
            {menuItem('Sort Z \u2192 A', () => onSort('desc'))}
            {menuItem('Clear sort', () => onSort('clear'))}
          </AnchoredMenu>
        )}
      </div>
      {divider}
      {iconBtn(formatPaintActive ? 'Format paint — pick a column to paint onto' : 'Format paint', <StyleIcon size={14} />, onFormatPaint, { disabled: noTarget && !formatPaintActive, active: formatPaintActive })}
      {divider}
      <div ref={alignRef} style={{ position: 'relative' }}>
        {iconCaretBtn('Align', <AlignLeftIcon size={14} />, onAlign ? () => setOpenMenu(m => m === 'align' ? null : 'align') : undefined)}
        {openMenu === 'align' && onAlign && (
          <AnchoredMenu open anchorRef={alignRef} onClose={() => setOpenMenu(null)} placement="bottom-start" style={MENU_STYLE}>
            {menuItem('Left', () => onAlign('left'))}
            {menuItem('Center', () => onAlign('center'))}
            {menuItem('Right', () => onAlign('right'))}
          </AnchoredMenu>
        )}
      </div>
      <div ref={wrapRef} style={{ position: 'relative' }}>
        {iconCaretBtn('Wrap text', <TextWrapIcon size={14} />, onWrap ? () => setOpenMenu(m => m === 'wrap' ? null : 'wrap') : undefined)}
        {openMenu === 'wrap' && onWrap && (
          <AnchoredMenu open anchorRef={wrapRef} onClose={() => setOpenMenu(null)} placement="bottom-start" style={MENU_STYLE}>
            {menuItem('Overflow', () => onWrap('overflow'))}
            {menuItem('Wrap', () => onWrap('wrap'))}
            {menuItem('Clip', () => onWrap('clip'))}
          </AnchoredMenu>
        )}
      </div>
      {divider}
      {iconBtn('Format as currency', <CurrencyIcon size={14} />, onCurrency, { disabled: noNumberFmt })}
      {iconBtn('Format as percent', <PercentIcon size={14} />, onPercent, { disabled: noNumberFmt })}
      {iconBtn('Decrease decimal places', <ReduceDecimalIcon size={14} />, () => onDecimals?.(-1), { disabled: noNumberFmt })}
      {iconBtn('Increase decimal places', <IncreaseDecimalIcon size={14} />, () => onDecimals?.(1), { disabled: noNumberFmt })}
      <div ref={formatBtnRef} style={{ position: 'relative' }}>
        <button onClick={() => { if (noFormatMenu) return; setFormatOpen(o => !o); }} title="Number format"
          aria-disabled={noFormatMenu}
          style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24, padding: '0 6px', borderRadius: 5, border: 'none', background: formatOpen ? 'var(--rd-sys-color-background-sunken)' : 'transparent', color: noFormatMenu ? 'var(--rd-sys-color-border-default)' : (formatOpen ? 'var(--rd-sys-color-content-primary)' : 'var(--rd-sys-color-content-secondary)'), fontSize: 11, fontWeight: 600, cursor: noFormatMenu ? 'not-allowed' : 'pointer', fontFamily: ff.primary }}
          onMouseEnter={e => { if (!noFormatMenu) (e.currentTarget as HTMLElement).style.background = 'var(--rd-sys-color-background-sunken)'; }}
          onMouseLeave={e => { if (!formatOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >123<svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        {formatOpen && (
          <AnchoredMenu open={formatOpen} anchorRef={formatBtnRef} onClose={() => setFormatOpen(false)} placement="bottom-start" style={{ background: 'var(--rd-sys-color-background-base)', border: '1px solid var(--rd-sys-color-border-subtle)', borderRadius: 8, boxShadow: 'var(--rd-sys-color-shadow-menu)', width: 150, padding: '4px 0' }}>
            {NUMBER_FORMATS.map(f => (
              <button key={f} onClick={() => { onNumberFormat?.(f); setFormatOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary, fontSize: 12, fontWeight: 500, color: 'var(--rd-sys-color-content-primary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--rd-sys-color-background-sunken)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >{f}</button>
            ))}
          </AnchoredMenu>
        )}
      </div>
      {divider}
      <div ref={fillRef} style={{ position: 'relative' }}>
        {iconBtn('Fill color', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 8.5 8.5 4l4.5 4.5-4.5 4.5L4 8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M3 11c-.6.6-1 1.2-1 1.8C2 13.7 2.9 14 3.5 14s1.5-.3 1.5-1.2c0-.6-.4-1.2-1-1.8" fill="currentColor"/></svg>, onFillColor ? () => setOpenMenu(m => m === 'fill' ? null : 'fill') : undefined, { disabled: noTarget })}
        {openMenu === 'fill' && onFillColor && (
          <AnchoredMenu open anchorRef={fillRef} onClose={() => setOpenMenu(null)} placement="bottom-start" style={{ ...MENU_STYLE, width: 'auto', padding: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 20px)', gap: 6 }}>
              {FILL_COLORS.map(c => (
                <button key={c} title={c} onClick={() => { onFillColor(c); setOpenMenu(null); }}
                  style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--rd-sys-color-border-subtle)', background: c, cursor: 'pointer', padding: 0 }} />
              ))}
            </div>
            <button onClick={() => { onFillColor(null); setOpenMenu(null); }}
              style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: 8, padding: '5px 4px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary, fontSize: 12, fontWeight: 500, color: 'var(--rd-sys-color-content-primary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--rd-sys-color-background-sunken)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >Reset</button>
          </AnchoredMenu>
        )}
      </div>
      {iconBtn('Filter', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12l-4.5 5.5v3.5l-3-1.5v-2L2 4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>, onFilter)}
      {iconBtn('Formula', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, onFormula)}
      {divider}
      {iconCaretBtn('Download', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 12.5v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>, onDownloadCsv)}
      <div style={{ flex: 1 }} />
      {onLimitChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, marginRight: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--rd-sys-color-content-tertiary)', whiteSpace: 'nowrap' }}>Limit</span>
          <div style={{ position: 'relative' }}>
            <select value={limit} onChange={e => onLimitChange(Number(e.target.value))}
              style={{ appearance: 'none', WebkitAppearance: 'none', border: BORDER, borderRadius: 5, padding: '3px 22px 3px 8px', fontSize: 11, fontFamily: ff.primary, fontWeight: 500, color: 'var(--rd-sys-color-content-primary)', background: 'var(--rd-sys-color-background-base)', cursor: 'pointer', outline: 'none' }}>
              {[100, 500, 1000].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--rd-sys-color-content-tertiary)' }}>
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>
      )}
      {onToggleExpand && iconBtn(expanded ? 'Exit full width' : 'Full width', expanded ? (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6 2v2.5a1.5 1.5 0 0 1-1.5 1.5H2M14 6h-2.5A1.5 1.5 0 0 1 10 4.5V2M10 14v-2.5a1.5 1.5 0 0 1 1.5-1.5H14M2 10h2.5A1.5 1.5 0 0 1 6 11.5V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 6V3.5A1.5 1.5 0 0 1 3.5 2H6M14 6V3.5A1.5 1.5 0 0 0 12.5 2H10M2 10v2.5A1.5 1.5 0 0 0 3.5 14H6M14 10v2.5a1.5 1.5 0 0 1-1.5 1.5H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      ), onToggleExpand)}
      {right}
    </div>
  );
}
