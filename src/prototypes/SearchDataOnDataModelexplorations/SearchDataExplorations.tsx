import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { SpotterIcon } from '../../components/icons/icons/Spotter';
import { AnchoredMenu } from './components/AnchoredMenu';
// The real spreadsheet toolbar (same component DataStudioV2 renders), which
// uses the ThoughtSpot Spreadsheet Figma glyphs rather than the hand-drawn
// approximations the old inline toolbar below used.
import { DataSheetToolbar } from './components/Spreadsheet';
import { generateMockRows, isNumericColumn } from './components/previewMockData';
import {
  Button,
  Tabs,
  Checkbox,
  SearchInput,
  Icon,
  Divider,
  Typography,
  Tooltip,
  Modal,
  TextArea,
  TextInput,
  Toast,
  Menu,
  Toggle,
  Link,
  Alert,
  SegmentedControl,
} from '../../components';
import { rdComponentColors, systemColors } from '../../tokens/colors';
import styles from './SearchDataExplorations.module.css';

// Version-controller values hardcoded to their defaults — the reference file's
// design-options FAB/version-switcher (backtick to open) is a dev-only
// comparison tool, not part of the page design, so it isn't ported.
type EditableColStyle = 'none' | 'header-badge' | 'cell-tint' | 'hover-indicator' | 'header-accent' | 'cursor-placeholder' | 'header-icon' | 'accent-and-tint' | 'header-fill';
type ColDetailIconStyle = 'a' | 'b';
type SdxVersion = 'v1' | 'minimal';
// Read through a function call (not a plain literal const) so the reference
// file's own `=== 'header-accent'` / `=== 'minimal'` / etc. branches keep
// their original union type instead of narrowing to an always-false literal.
function getEditableColStyle(): EditableColStyle { return 'none'; }
function getSdxVersion(): SdxVersion { return 'v1'; }
function getColDetailIconStyle(): ColDetailIconStyle { return 'a'; }


/**
 * SearchDataExplorations
 *
 * Search data exploration prototype — pixel-accurate to the Figma design.
 * Node: UFZ7PuvmHx8560ah5zt0FB, frame 384:294073 "Search data - Empty"
 */

// ─── Token chip ─────────────────────────────────────────────────────────────
// The Figma "Token / Editable" component: 24h, 4px radius, colored bg.
// This does NOT match the Radiant Chip (which is pill-shaped), so we
// implement it as a lightweight inline component.


// ─── Typeahead column suggestion dropdown ─────────────────────────────────────

const TA_FONT = '"Plain", -apple-system, sans-serif';

const TYPE_ICON: Record<string, string> = {
  measure:   '#',
  attribute: 'a',
  date:      'd',
  filter:    'f',
};

const SearchTypeahead: React.FC<{
  query: string;
  onSelect: (col: ColumnDef) => void;
  // Swappable column universe — defaults to SECTIONS' columns when omitted.
  columns?: ColumnDef[];
}> = ({ query, onSelect, columns }) => {
  const allCols = columns ?? SECTIONS.flatMap(s => s.kind === 'expandable' ? s.columns : []);
  const q = query.trim().toLowerCase();
  const matches = q
    ? allCols.filter(c => c.label.toLowerCase().includes(q))
    : allCols;

  if (!matches.length) return null;

  return (
    <div style={taStyles.panel}>
      {matches.map(col => {
        const label = col.label;
        const idx = q ? label.toLowerCase().indexOf(q) : -1;
        return (
          <button key={col.id} className={styles.taItem} onMouseDown={e => { e.preventDefault(); onSelect(col); }}>
            <span style={taStyles.icon}>{TYPE_ICON[col.type] ?? 'a'}</span>
            <span style={taStyles.label}>
              {idx >= 0 ? (
                <>
                  {label.slice(0, idx)}
                  <strong>{label.slice(idx, idx + q.length)}</strong>
                  {label.slice(idx + q.length)}
                </>
              ) : label}
            </span>
          </button>
        );
      })}
      <div style={taStyles.hints}>
        <span><span style={taStyles.kbd}>↑↓</span> to navigate</span>
        <span><span style={taStyles.kbd}>↵</span> to search</span>
        <span><span style={taStyles.kbd}>esc</span> to dismiss</span>
      </div>
    </div>
  );
};

// taStyles — panel is a plain white box; positioning is handled by wrapper divs in JSX.
const taStyles: Record<string, React.CSSProperties> = {
  panel: {
    background: '#fff',
    border: '1px solid #eaedf2',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(25,35,49,0.12), 0 2px 6px rgba(25,35,49,0.06)',
    overflow: 'hidden',
    fontFamily: TA_FONT,
  },
  icon: {
    width: '20px',
    flexShrink: 0,
    fontStyle: 'italic',
    fontSize: '14px',
    color: '#777e8b',
    textAlign: 'center' as const,
    fontFamily: 'serif',
  },
  label: {
    flex: 1,
  },
  hints: {
    display: 'flex',
    gap: '16px',
    padding: '8px 16px',
    borderTop: '1px solid #eaedf2',
    fontSize: '11px',
    color: '#a0a9b4',
    fontFamily: TA_FONT,
  },
  kbd: {
    fontFamily: 'monospace',
    background: '#f0f2f5',
    border: '1px solid #d4d9e2',
    borderRadius: '3px',
    padding: '1px 4px',
    fontSize: '10px',
    color: '#1d232f',
    marginRight: '3px',
  },
};

// ─── Token chip ──────────────────────────────────────────────────────────────

const TOKEN_BG = {
  attribute: rdComponentColors.light['chip-attribute-default'],
  measure: rdComponentColors.light['chip-measure-default'],
  date: '#F0EBFF',
  filter: '#EAECF0',
} as const;

type TokenType = keyof typeof TOKEN_BG;

const TOKEN_MENU_ITEMS = ['Add as filter', 'Change aggregate', 'Remove'];

const AGGREGATE_OPTIONS = ['Sum', 'Min', 'Max', 'Average'] as const;
type AggregateType = (typeof AGGREGATE_OPTIONS)[number];

const Chevron = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface DataTokenProps {
  label: string;
  type: TokenType;
  variant?: 'search' | 'panel';
  onReplace?: (col: ColumnDef) => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

// Inline checkmark for selected aggregate / view option
const CheckIcon: React.FC<{ color?: string }> = ({ color = '#2770ef' }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
    <path d="M2 7l3.5 3.5L12 3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Panel variant — click opens a dropdown menu directly, no hover state change
const PanelToken: React.FC<{ label: string; type: TokenType }> = ({ label, type }) => {
  const [open, setOpen] = useState(false);
  const [selectedAggregate, setSelectedAggregate] = useState<AggregateType>('Sum');
  const [aggSubmenuOpen, setAggSubmenuOpen] = useState(false);
  const displayLabel = label;
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <span
        className={styles.dataToken}
        style={{ backgroundColor: TOKEN_BG[type], cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
      >
        {displayLabel}
      </span>
      {open && (
        <>
          <div className={styles.tokenDropdownBackdrop} onClick={() => { setOpen(false); setAggSubmenuOpen(false); }} />
          <div className={styles.tokenDropdown}>
            {TOKEN_MENU_ITEMS
              .filter(item => item !== 'Change aggregate' || type === 'measure')
              .map(item =>
                item === 'Change aggregate' ? (
                  <div
                    key={item}
                    className={styles.tokenAggRow}
                    onMouseEnter={() => setAggSubmenuOpen(true)}
                    onMouseLeave={() => setAggSubmenuOpen(false)}
                  >
                    <button
                      className={styles.tokenDropdownItem}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%' }}
                    >
                      {item}
                      <span style={{ color: '#a0a9b4', fontSize: 12, lineHeight: 1 }}>›</span>
                    </button>
                    {aggSubmenuOpen && (
                      <div className={styles.tokenSubmenu}>
                        {AGGREGATE_OPTIONS.map(agg => (
                          <button
                            key={agg}
                            className={styles.tokenDropdownItem}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                            onClick={() => { setSelectedAggregate(agg); setOpen(false); setAggSubmenuOpen(false); }}
                          >
                            {agg}
                            {selectedAggregate === agg && <CheckIcon />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button key={item} className={styles.tokenDropdownItem} onClick={() => setOpen(false)}>
                    {item}
                  </button>
                )
              )}
          </div>
        </>
      )}
    </span>
  );
};

// Search variant — hover via CSS (not React state) so hover never gets stuck.
// Click on label enters edit mode; click bubbles are stopped so the bar's
// onClick doesn't fire and override barActive.
const SearchToken: React.FC<{ label: string; type: TokenType; onReplace?: (col: ColumnDef) => void; onEditStart?: () => void; onEditEnd?: () => void }> = ({ label, type, onReplace, onEditStart, onEditEnd }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const [selectedAggregate, setSelectedAggregate] = useState<AggregateType>('Sum');
  const [aggSubmenuOpen, setAggSubmenuOpen] = useState(false);

  const displayLabel = label;

  if (editing) {
    return (
      <span
        style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Underlined text input — replaces the token chip */}
        <input
          autoFocus
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') { setEditing(false); setEditValue(label); onEditEnd?.(); }
            if (e.key === 'Enter') { setEditing(false); onEditEnd?.(); }
          }}
          onBlur={() => { setEditing(false); setEditValue(label); onEditEnd?.(); }}
          className={styles.tokenEditInput}
          style={{ width: Math.max(editValue.length * 8, 40) + 'px' }}
        />
        {/* Typeahead anchored below this specific token — 280px wide */}
        <div style={{ position: 'absolute', top: '100%', left: 0, width: 280, zIndex: 200, marginTop: 4 }}>
          <SearchTypeahead
            query={editValue === label ? '' : editValue}
            onSelect={col => {
              onReplace?.(col);
              setEditing(false);
              setEditValue(col.label);
              onEditEnd?.();
            }}
          />
        </div>
      </span>
    );
  }

  return (
    // stopPropagation: prevent bar's onClick from firing when user clicks a token
    <span
      className={styles.searchTokenWrapper}
      onClick={e => e.stopPropagation()}
    >
      {/* Label */}
      <span
        className={styles.dataToken}
        style={{ backgroundColor: TOKEN_BG[type] }}
        onClick={() => { setEditing(true); onEditStart?.(); }}
      >
        {displayLabel}
      </span>

      {/* Chevron — CSS controls visibility (.searchTokenWrapper:hover).
          1px gap from label: left: calc(100% + 1px).
          Border-radius 0 4px 4px 0 (from .dataTokenMenu) = square left, rounded right. */}
      <span
        className={`${styles.dataTokenMenu} ${styles.searchTokenChevron}`}
        style={{ position: 'absolute', left: 'calc(100% + 1px)', top: 0, bottom: 0, zIndex: 2, backgroundColor: TOKEN_BG[type] }}
        onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
      >
        <Chevron />
      </span>

      {/* White border ring — hidden by default, shown on wrapper hover.
          Extends the hover-detectable area 20px right so crossing the
          1px gap + chevron doesn't lose the hover state.              */}
      <span
        className={styles.searchTokenBorder}
        style={{ position: 'absolute', top: -8, left: -8, right: -28, bottom: -8, border: '8px solid #fff', borderRadius: 12, pointerEvents: 'none', zIndex: 3 }}
      />

      {menuOpen && (
        <>
          <div className={styles.tokenDropdownBackdrop} onClick={() => { setMenuOpen(false); setAggSubmenuOpen(false); }} />
          <div className={styles.tokenDropdown}>
            {TOKEN_MENU_ITEMS
              .filter(item => item !== 'Change aggregate' || type === 'measure')
              .map(item =>
                item === 'Change aggregate' ? (
                  <div
                    key={item}
                    className={styles.tokenAggRow}
                    onMouseEnter={() => setAggSubmenuOpen(true)}
                    onMouseLeave={() => setAggSubmenuOpen(false)}
                  >
                    <button
                      className={styles.tokenDropdownItem}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%' }}
                    >
                      {item}
                      <span style={{ color: '#a0a9b4', fontSize: 12, lineHeight: 1 }}>›</span>
                    </button>
                    {aggSubmenuOpen && (
                      <div className={styles.tokenSubmenu}>
                        {AGGREGATE_OPTIONS.map(agg => (
                          <button
                            key={agg}
                            className={styles.tokenDropdownItem}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                            onClick={() => { setSelectedAggregate(agg); setMenuOpen(false); setAggSubmenuOpen(false); }}
                          >
                            {agg}
                            {selectedAggregate === agg && <CheckIcon />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button key={item} className={styles.tokenDropdownItem} onClick={() => setMenuOpen(false)}>
                    {item}
                  </button>
                )
              )}
          </div>
        </>
      )}
    </span>
  );
};

const DataToken: React.FC<DataTokenProps> = ({ label, type, variant = 'search', onReplace, onEditStart, onEditEnd }) =>
  variant === 'panel'
    ? <PanelToken label={label} type={type} />
    : <SearchToken label={label} type={type} onReplace={onReplace} onEditStart={onEditStart} onEditEnd={onEditEnd} />;

// ─── Right sidebar — inline SVG icons ─────────────────────────────────────────
// Radiant style: viewBox 0 0 18 18, fill none, stroke currentColor, round caps.

const _SI_S = { strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, stroke: 'currentColor', fill: 'none' };
const _si = (children: React.ReactNode) => (
  <svg viewBox="0 0 18 18" width={16} height={16} fill="none" xmlns="http://www.w3.org/2000/svg">{children}</svg>
);

const SI_ICONS = {
  data: _si(<>
    <rect x="2" y="3.5" width="14" height="11" rx="1.5" {..._SI_S} />
    <path d="M2 7.5h14M8 3.5v11" {..._SI_S} />
  </>),
  chart: _si(<>
    <path d="M2 14h14" {..._SI_S} />
    <rect x="3.5" y="9" width="3" height="5" rx="0.5" {..._SI_S} />
    <rect x="7.5" y="6" width="3" height="8" rx="0.5" {..._SI_S} />
    <rect x="11.5" y="8" width="3" height="6" rx="0.5" {..._SI_S} />
  </>),
  layout: _si(<>
    <rect x="2" y="3" width="14" height="12" rx="1.5" {..._SI_S} />
    <path d="M7 3v12" {..._SI_S} />
  </>),
  column: _si(<>
    <path d="M2 14h14" {..._SI_S} />
    <rect x="3" y="9" width="3" height="5" rx="0.5" {..._SI_S} />
    <rect x="7.5" y="6" width="3" height="8" rx="0.5" {..._SI_S} />
    <rect x="12" y="8" width="3" height="6" rx="0.5" {..._SI_S} />
  </>),
  axis: _si(<>
    <path d="M4 2v12h12" {..._SI_S} />
    <path d="M2 4.5L4 2l2 2.5" {..._SI_S} />
    <path d="M13.5 11.5L16 14l-2.5 2.5" {..._SI_S} />
  </>),
  dataLabel: _si(<>
    <rect x="4" y="2.5" width="10" height="6" rx="1" {..._SI_S} />
    <path d="M9 8.5v2" {..._SI_S} />
    <path d="M3 14h5m2 0h5" {..._SI_S} />
  </>),
  tooltip: _si(<>
    <path d="M3 3.5h12a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-5l-2 2.5-2-2.5H3A1.5 1.5 0 0 1 1.5 11V5A1.5 1.5 0 0 1 3 3.5z" {..._SI_S} />
  </>),
  legend: _si(<>
    <rect x="2" y="5" width="3" height="3" rx="0.5" {..._SI_S} />
    <path d="M7 6.5h9" {..._SI_S} />
    <rect x="2" y="10" width="3" height="3" rx="0.5" {..._SI_S} />
    <path d="M7 11.5h9" {..._SI_S} />
  </>),
  display: _si(<>
    <path d="M3.5 13.5A7 7 0 0 1 14.5 13.5" {..._SI_S} />
    <path d="M9 13.5L6.5 8.5" {..._SI_S} />
    <circle cx="9" cy="13.5" r="1" fill="currentColor" stroke="none" />
    <path d="M6.5 6.5h5" {..._SI_S} />
  </>),
  query: _si(<>
    <path d="M6.5 5.5L3 9l3.5 3.5" {..._SI_S} />
    <path d="M11.5 5.5L15 9l-3.5 3.5" {..._SI_S} />
    <path d="M11 4l-4 10" {..._SI_S} />
  </>),
  r: _si(<>
    <circle cx="9" cy="9" r="7" {..._SI_S} />
    <path d="M6.5 5.5v7M6.5 5.5h3a2 2 0 0 1 0 4H6.5M9.5 9.5l2.5 3" {..._SI_S} />
  </>),
  custom: _si(<>
    <path d="M10.5 2L5.5 9H9.5L6.5 16L14 8.5H10L10.5 2z" {..._SI_S} />
  </>),
};

type SidebarItemDef = { label: string; icon: React.ReactNode; active?: boolean };
type SidebarEntry = SidebarItemDef | 'divider';

const SIDEBAR_ITEMS: SidebarEntry[] = [
  { label: 'Data',           icon: SI_ICONS.data      },
  { label: 'Chart',          icon: SI_ICONS.chart     },
  { label: 'Layout',         icon: SI_ICONS.layout    },
  { label: 'Column',         icon: SI_ICONS.column   },
  { label: 'Axis',           icon: SI_ICONS.axis      },
  { label: 'Data label',     icon: SI_ICONS.dataLabel },
  { label: 'Tooltip',        icon: SI_ICONS.tooltip   },
  { label: 'Legend',         icon: SI_ICONS.legend    },
  { label: 'Display',        icon: SI_ICONS.display   },
  'divider',
  { label: 'Query',          icon: SI_ICONS.query     },
  { label: 'R',              icon: SI_ICONS.r         },
  { label: 'Custom actions', icon: SI_ICONS.custom    },
];

const SidebarIcon: React.FC<{ icon: React.ReactNode }> = ({ icon }) => (
  <span className={styles.sidebarIconWrap}>{icon}</span>
);

// ─── Chart toggle (Figma 384:294140 "Segment control - Icon", fetched 2026-04-07)

const CTA = {
  dataTableMask: 'https://www.figma.com/api/mcp/asset/2bf75a38-8242-419a-9a51-96be2ec82e1c',
  lineShape:     'https://www.figma.com/api/mcp/asset/31cced63-55e0-4c2a-9587-83b0ff8525b7',
  lineShape1:    'https://www.figma.com/api/mcp/asset/7b38e006-be23-4f9c-abaa-996653f4aab9',
  lineShape2:    'https://www.figma.com/api/mcp/asset/68d4a84b-0eaa-4e1f-a108-24e85a064734',
} as const;

// ─── Go / Stop button — 4 states (Image 7) ───────────────────────────────────
// Width: 52px. Border-radius: 16px (pill).
// idle     → secondary Go (bar not focused)
// focused  → primary blue Go (bar focused)
// stopping → gray disabled square (300ms debounce after click)
// loading  → dark square stop (query running, click to cancel)

const GO_BTN_BASE: React.CSSProperties = {
  width: 52,
  height: 32,
  border: 'none',
  borderRadius: 16,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: '"Plain", -apple-system, sans-serif',
  fontSize: '14px',
  fontWeight: 500,
  flexShrink: 0,
  transition: 'background 120ms ease',
};

const GoStopButton: React.FC<{
  state: 'idle' | 'focused' | 'stopping' | 'loading';
  onGo: () => void;
  onStop: () => void;
}> = ({ state, onGo, onStop }) => {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  if (state === 'stopping') {
    return (
      <button disabled style={{ ...GO_BTN_BASE, background: '#c0c6cf', cursor: 'default' }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <rect width="10" height="10" rx="1" fill="#fff" opacity="0.7" />
        </svg>
      </button>
    );
  }
  if (state === 'loading') {
    return (
      <button onClick={onStop} style={{ ...GO_BTN_BASE, background: '#eaedf2' }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-label="Stop">
          <rect width="10" height="10" rx="1" fill="#1d232f" />
        </svg>
      </button>
    );
  }
  if (state === 'focused') {
    return (
      <button onClick={onGo} style={{ ...GO_BTN_BASE, background: '#2770ef', color: '#fff' }}>
        Go
      </button>
    );
  }
  // idle — secondary button color states matching Figma
  const bg = pressed ? '#DEE8FA' : hovered ? '#DBDFE7' : '#EAEDF2';
  const color = pressed ? '#2770EF' : '#1d232f';
  return (
    <button
      onClick={onGo}
      style={{ ...GO_BTN_BASE, background: bg, color }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      Go
    </button>
  );
};

// ─── Pin split button (Figma node 291:95457) ─────────────────────────────────
// Left half: secondary pill (label + chevron). Right half: primary "Pin" pill.
// Height: 32px. Gap between halves: 2px. Border-radius: 16px on outer corners.

const PIN_FONT: React.CSSProperties = {
  fontFamily: '"Plain", -apple-system, sans-serif',
  fontSize: '14px',
  fontWeight: 300,
  lineHeight: '20px',
  whiteSpace: 'nowrap',
};

const PinSplitButton: React.FC<{ label?: string; disabled?: boolean }> = ({ label = 'Umesh :: 28 March', disabled = false }) => (
  <Tooltip
    content={disabled ? 'Spreadsheet cannot be pinned to a Liveboard' : ''}
    placement="bottom"
    showDelay={300}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      {/* Left — secondary: version label + chevron */}
      <button disabled={disabled} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        height: 32, padding: '6px 8px 6px 16px',
        background: '#eaedf2', border: 'none', cursor: disabled ? 'default' : 'pointer',
        borderRadius: '16px 0 0 16px',
        ...PIN_FONT, color: '#1d232f',
      }}>
        {label}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M4 6l4 4 4-4" stroke="#1d232f" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {/* Right — primary: Pin */}
      <button disabled={disabled} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 32, width: 52, padding: '6px 8px',
        background: '#2770ef', border: 'none', cursor: disabled ? 'default' : 'pointer',
        borderRadius: '0 16px 16px 0',
        ...PIN_FONT, color: '#ffffff',
      }}>
        Pin
      </button>
    </div>
  </Tooltip>
);

const ChartViewToggle: React.FC<{ value: string; onChange: (v: string) => void }> = ({
  value, onChange,
}) => (
  <div className={styles.segControl} role="group" aria-label="View mode">
    <div className={`${styles.segControlPill} ${value === 'table' ? styles.segControlPillLeft : styles.segControlPillRight}`} />
    <button
      className={`${styles.segControlBtn} ${styles.segControlBtnLeft}`}
      onClick={() => onChange('table')}
      aria-label="Table view"
      aria-pressed={value === 'table'}
    >
      <div className={styles.segIconWrap}>
        <div className={styles.dtBlue} />
        <div className={styles.dtMask}><img src={CTA.dataTableMask} alt="" /></div>
      </div>
    </button>
    <button
      className={`${styles.segControlBtn} ${styles.segControlBtnRight}`}
      onClick={() => onChange('chart')}
      aria-label="Chart view"
      aria-pressed={value === 'chart'}
    >
      <div className={styles.segIconWrap}>
        <div className={styles.lcL1}><img src={CTA.lineShape} alt="" /></div>
        <div className={styles.lcL2}><img src={CTA.lineShape1} alt="" /></div>
        <div className={styles.lcL3}><img src={CTA.lineShape2} alt="" /></div>
      </div>
    </button>
  </div>
);


// ─── Dots loader (used in sheet and answer card) ─────────────────────────────
const DotsLoader: React.FC = () => (
  <div className={styles.dotsLoader} aria-label="Loading" role="status">
    <div className={styles.dotLoaderDot} />
    <div className={styles.dotLoaderDot} />
    <div className={styles.dotLoaderDot} />
  </div>
);

// ─── Sheet view ───────────────────────────────────────────────────────────────
// Spreadsheet-style layout: toolbar + formula bar + column headers + data rows + pagination.

// Toolbar icon button helper
const TbBtn: React.FC<{ children: React.ReactNode; label?: string; onClick?: () => void; disabled?: boolean; disabledTooltip?: string }> = ({ children, label, onClick, disabled = false, disabledTooltip }) => (
  <Tooltip content={(disabled ? disabledTooltip : undefined) ?? label ?? ''} placement="top" showDelay={400}>
    <button
      className={styles.sheetTbBtn}
      aria-label={label}
      aria-disabled={disabled}
      onClick={disabled ? e => e.preventDefault() : (onClick ?? (e => e.preventDefault()))}
      // Opacity alone read as barely-there on an already-muted icon — a
      // shaded pill + lighter icon tone makes "disabled" legible at a glance.
      style={disabled ? { cursor: 'not-allowed', background: 'var(--rd-sys-color-background-subtle, #EAEDF2)', color: 'var(--rd-sys-color-content-tertiary, #C0C6CF)' } : undefined}
    >
      {children}
    </button>
  </Tooltip>
);


// ─── Formula types ───────────────────────────────────────────────────────────
export type FToken = { kind: 'col'; label: string } | { kind: 'op'; value: string } | { kind: 'num'; value: string };
export type FormulaCol = { key: string; name: string; tokens: FToken[] };

// Inline fx icon (Radiant style, 18×18 viewBox) — from Figma 16730:18720
const FxIcon: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = 'currentColor' }) => (
  <svg viewBox="0 0 18 18" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* f: curved top, vertical stroke, crossbar */}
    <path d="M8 15V7a3 3 0 0 1 3-3" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 9.5h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    {/* x: two crossing diagonals */}
    <path d="M11 8l4 6M15 8l-4 6" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Inline icons for the column menu (18×18 viewBox, Radiant stroke style)
const ColMenuIcon: React.FC<{ id: string }> = ({ id }) => {
  const sw = 1.4;
  const common = { width: 18, height: 18, viewBox: '0 0 18 18', fill: 'none' as const };
  switch (id) {
    case 'formula':
      return <FxIcon size={18} />;
    case 'filter':
    case 'filter-edit':
      return <svg {...common}><path d="M2.5 4h13l-5 6v4l-3 1.5V10l-5-6Z" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'sort-asc':
      return <svg {...common}><path d="M3 5h9M3 9h6M3 13h3" stroke="currentColor" strokeWidth={sw} strokeLinecap="round"/><path d="M14 12V4m0 0l-2 2m2-2l2 2" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'sort-desc':
      return <svg {...common}><path d="M3 5h3M3 9h6M3 13h9" stroke="currentColor" strokeWidth={sw} strokeLinecap="round"/><path d="M14 6v8m0 0l-2-2m2 2l2-2" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'sort-adv':
      return <svg {...common}><path d="M5 4v10m0 0l-2-2m2 2l2-2" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/><path d="M13 14V4m0 0l-2 2m2-2l2 2" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'sort-clear':
      return <svg {...common}><path d="M4 5l10 8M14 5L4 13" stroke="currentColor" strokeWidth={sw} strokeLinecap="round"/></svg>;
    case 'dup':
      return <svg {...common}><rect x="6" y="6" width="8.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth={sw}/><path d="M11.5 6V4.5A1.5 1.5 0 0 0 10 3H4.5A1.5 1.5 0 0 0 3 4.5V10a1.5 1.5 0 0 0 1.5 1.5H6" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'rename':
      return <svg {...common}><path d="M3 12.5 11 4.5l2.5 2.5L5.5 15H3v-2.5Z" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'hide':
      return <svg {...common}><path d="M2.5 9S5 4.5 9 4.5 15.5 9 15.5 9 13 13.5 9 13.5 2.5 9 2.5 9Z" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="9" r="1.8" stroke="currentColor" strokeWidth={sw}/><path d="M3 3l12 12" stroke="currentColor" strokeWidth={sw} strokeLinecap="round"/></svg>;
    case 'cond-fmt':
      return <svg {...common}><rect x="3" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth={sw}/><path d="M7.5 3.5v11M11 3.5v11" stroke="currentColor" strokeWidth={sw}/></svg>;
    case 'format':
      return <svg {...common}><path d="M4 5h10M9 5v9M7 14h4" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'delete':
      return <svg {...common}><path d="M4 5h10M7.5 5V3.5h3V5M5.5 5l.5 9h6l.5-9M8 7.5v4M10 7.5v4" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'filter-remove':
      return <svg {...common}><path d="M5 6l8 8M13 6l-8 8" stroke="currentColor" strokeWidth={sw} strokeLinecap="round"/></svg>;
    default:
      return null;
  }
};

// Column menu items per Figma 291:104562
const COL_MENU_SECTIONS = [
  [{ id: 'formula', label: 'Add formula' }],
  [
    { id: 'filter',     label: 'Filter' },
    { id: 'sort-asc',   label: 'Sort ascending' },
    { id: 'sort-desc',  label: 'Sort descending' },
    { id: 'sort-adv',   label: 'Advanced sort settings' },
    { id: 'sort-clear', label: 'Clear sort' },
  ],
  [
    { id: 'dup',    label: 'Duplicate column' },
    { id: 'rename', label: 'Rename column' },
    { id: 'hide',   label: 'Hide column' },
  ],
  [
    { id: 'cond-fmt', label: 'Conditional formatting' },
    { id: 'format',   label: 'Format' },
  ],
  [{ id: 'delete', label: 'Delete column' }],
];

// All columns available in the sales data model (superset of defaults)
const DATA_MODEL_COLS: AnswerColDef[] = [
  { key: 'orderDate',          label: 'Order date',           width: 120 },
  { key: 'orderMonth',         label: 'Order month',          width: 110 },
  { key: 'orderQuarter',       label: 'Order quarter',        width: 110 },
  { key: 'orderYear',          label: 'Order year',           width:  90 },
  { key: 'region',             label: 'Region',               width: 100 },
  { key: 'state',              label: 'State',                width: 130 },
  { key: 'city',               label: 'City',                 width: 120 },
  { key: 'productCategory',    label: 'Product category',     width: 150 },
  { key: 'productSubCategory', label: 'Product sub category', width: 170 },
  { key: 'productName',        label: 'Product name',         width: 200 },
  { key: 'customerSegment',    label: 'Customer segment',     width: 150 },
  { key: 'customerType',       label: 'Customer type',        width: 130 },
  { key: 'salesChannel',       label: 'Sales channel',        width: 120 },
  { key: 'unitsSold',          label: 'Units sold',           width: 110, align: 'right' },
  { key: 'discountPct',        label: 'Discount %',           width: 100, align: 'right', render: (v: unknown) => `${v}%` },
  { key: 'revenue',            label: 'Revenue',              width: 120, align: 'right', render: (v: unknown) => `$${Number(v).toLocaleString()}` },
  { key: 'profit',             label: 'Profit',               width: 120, align: 'right', render: (v: unknown) => `$${Number(v).toLocaleString()}` },
  { key: 'profitMarginPct',    label: 'Profit margin %',      width: 140, align: 'right', render: (v: unknown) => `${Number(v).toFixed(1)}%` },
];

const DEFAULT_VISIBLE_KEYS = new Set(['orderDate', 'region', 'productCategory', 'customerSegment', 'unitsSold', 'revenue', 'profit']);

// ─── Sheet Data Panel ─────────────────────────────────────────────────────────
// Same design as the search data panel — reuses identical CSS classes.
// Only cosmetic difference: no border-radius / box-shadow (edge-to-edge flush).

const SHEET_PANEL_SECTIONS: Array<{
  id: string; label: string;
  items: Array<{ id: string; label: string; type: TokenType }>;
}> = [
  {
    id: 'measures', label: 'Measures',
    items: [
      { id: 'revenue',         label: 'Revenue',         type: 'measure' },
      { id: 'unitsSold',       label: 'Units sold',      type: 'measure' },
      { id: 'profit',          label: 'Profit',          type: 'measure' },
      { id: 'profitMarginPct', label: 'Profit margin %', type: 'measure' },
      { id: 'discountPct',     label: 'Discount %',      type: 'measure' },
    ],
  },
  {
    id: 'attributes', label: 'Attributes',
    items: [
      { id: 'region',             label: 'Region',             type: 'attribute' },
      { id: 'state',              label: 'State',              type: 'attribute' },
      { id: 'city',               label: 'City',               type: 'attribute' },
      { id: 'productCategory',    label: 'Product category',   type: 'attribute' },
      { id: 'productSubCategory', label: 'Product sub category', type: 'attribute' },
      { id: 'productName',        label: 'Product name',       type: 'attribute' },
      { id: 'customerSegment',    label: 'Customer segment',   type: 'attribute' },
      { id: 'customerType',       label: 'Customer type',      type: 'attribute' },
      { id: 'salesChannel',       label: 'Sales channel',      type: 'attribute' },
    ],
  },
  {
    id: 'date', label: 'Date',
    items: [
      { id: 'orderDate',    label: 'Order date',    type: 'date' },
      { id: 'orderMonth',   label: 'Order month',   type: 'date' },
      { id: 'orderQuarter', label: 'Order quarter', type: 'date' },
      { id: 'orderYear',    label: 'Order year',    type: 'date' },
    ],
  },
  { id: 'formula',    label: 'Formula',     items: [] },
  { id: 'sets',       label: 'Sets',        items: [] },
  { id: 'parameters', label: 'Parameters',  items: [] },
  { id: 'custom',     label: 'Custom data', items: [] },
];

// ─── CSV Import Modal ─────────────────────────────────────────────────────────

type CsvImportFlow = 'existing' | 'base' | null;
type CsvImportStep = 'choose' | 'upload' | 'preview' | 'match' | 'select' | 'done';

interface CsvCol { name: string; sample: string; type: 'text' | 'number' | 'date'; }

const MOCK_CSV_COLS: CsvCol[] = [
  { name: 'Employee ID',   sample: '1001',         type: 'number' },
  { name: 'First name',    sample: 'Alice',         type: 'text'   },
  { name: 'Last name',     sample: 'Johnson',       type: 'text'   },
  { name: 'Department',    sample: 'Engineering',   type: 'text'   },
  { name: 'Salary',        sample: '120000',        type: 'number' },
  { name: 'Hire date',     sample: '2021-03-15',    type: 'date'   },
  { name: 'Manager',       sample: 'Bob Smith',     type: 'text'   },
];

const CsvImportModal: React.FC<{ open: boolean; onClose: () => void; onImport?: (csvName: string, cols: CsvCol[]) => void }> = ({ open, onClose, onImport }) => {
  const [flow, setFlow] = useState<CsvImportFlow>(null);
  const [step, setStep] = useState<CsvImportStep>('choose');
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [colNames, setColNames] = useState<'header' | 'none'>('header');
  const [fieldSep, setFieldSep] = useState<'comma' | 'semicolon' | 'pipe' | 'space' | 'tab'>('comma');
  // Equivalence pairs for the "Link to Answer" step (existing flow)
  const [matchPairs, setMatchPairs] = useState<Array<{ answer: string; csv: string }>>([
    { answer: 'productName', csv: 'First name' },
  ]);
  // Columns selected for import on the final step
  const [selectedCsvCols, setSelectedCsvCols] = useState<Set<string>>(() => new Set(MOCK_CSV_COLS.map(c => c.name)));
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (name: string) => {
    setFileName(name);
    setStep('preview');
  };

  const handleImport = () => {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      const cols = MOCK_CSV_COLS.filter(c => selectedCsvCols.has(c.name));
      onImport?.(fileName ?? 'import.csv', cols);
      setStep('done');
    }, 1400);
  };

  const reset = () => {
    setFlow(null); setStep('choose'); setFileName(null);
    setImporting(false);
    setMatchPairs([{ answer: 'productName', csv: 'First name' }]);
    setSelectedCsvCols(new Set(MOCK_CSV_COLS.map(c => c.name)));
  };

  const handleClose = () => { reset(); onClose(); };

  if (!open) return null;

  const typeTag = (t: CsvCol['type']) => {
    const map = { text: 'Aa', number: '123', date: 'D' };
    const color = { text: '#6B7A99', number: '#2770EF', date: '#7B5EA7' };
    return (
      <span style={{ fontSize: 10, fontWeight: 600, color: color[t], background: `${color[t]}18`, borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace' }}>
        {map[t]}
      </span>
    );
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(29,35,47,0.45)' }} onClick={handleClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 1000, background: '#fff', borderRadius: 12,
        width: (step === 'match' || step === 'select' || step === 'preview') ? 880 : 600,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(29,35,47,0.18)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 24px 16px', borderBottom: '1px solid var(--rd-sys-color-border-divider,#eaedf2)', flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            {step !== 'choose' && step !== 'done' && (
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9aa5b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Add custom data</div>
            )}
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rd-sys-color-content-primary,#1d232f)' }}>
              {step === 'choose'  && 'Import CSV'}
              {step === 'upload'  && 'Upload a .CSV file'}
              {step === 'preview' && 'Preview your .CSV file'}
              {step === 'match'   && 'Link your .CSV file to the Answer'}
              {step === 'select'  && 'Select columns to import'}
              {step === 'done'    && 'Import complete'}
            </div>
            {step !== 'choose' && step !== 'done' && (() => {
              const steps: CsvImportStep[] = flow === 'existing'
                ? ['upload', 'preview', 'match', 'select']
                : ['upload', 'preview'];
              const cur = steps.indexOf(step);
              return (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                  {steps.map((s, i) => (
                    <div key={s} style={{
                      height: 4, width: 40, borderRadius: 2,
                      background: cur >= i ? 'var(--rd-sys-color-content-brand,#2770EF)' : '#eaedf2',
                    }} />
                  ))}
                </div>
              );
            })()}
          </div>
          <button onClick={handleClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, color: '#6b7a99', borderRadius: 4 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Step: choose flow */}
          {step === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--rd-sys-color-content-secondary,#6b7a99)' }}>
                Choose how to import your CSV data
              </p>
              {([
                { id: 'existing' as CsvImportFlow, title: 'Add to existing data model', desc: 'Map CSV columns to columns in the current data model. Ideal for enriching existing data with new attributes.' },
                { id: 'base'     as CsvImportFlow, title: 'Open CSV as data model',     desc: 'Use your CSV file as the primary data source. No existing model needed — columns are auto-detected.' },
              ]).map(opt => (
                <button
                  key={opt.id!}
                  onClick={() => setFlow(opt.id)}
                  style={{
                    textAlign: 'left', padding: '16px 18px', borderRadius: 8, cursor: 'pointer',
                    border: flow === opt.id ? '2px solid var(--rd-sys-color-content-brand,#2770EF)' : '1px solid var(--rd-sys-color-border-default,#d0d5dd)',
                    background: flow === opt.id ? '#f0f5ff' : '#fff',
                    transition: 'all 0.12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    {flow === opt.id
                      ? <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="#2770EF" strokeWidth="1.5" fill="none"/><circle cx="8" cy="8" r="4" fill="#2770EF"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="#d0d5dd" strokeWidth="1.5" fill="none"/></svg>
                    }
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rd-sys-color-content-primary,#1d232f)' }}>{opt.title}</span>
                  </div>
                  <p style={{ margin: '0 0 0 26px', fontSize: 12, color: 'var(--rd-sys-color-content-secondary,#6b7a99)', lineHeight: 1.5 }}>{opt.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step: upload */}
          {step === 'upload' && (
            <div>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0].name); }} />
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileSelect(f.name); }}
                style={{
                  border: `1.5px dashed ${dragging ? '#2770EF' : '#c8cdd6'}`,
                  borderRadius: 8, padding: '60px 24px', textAlign: 'center',
                  background: dragging ? '#f0f5ff' : '#fff', transition: 'all 0.12s',
                }}
              >
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    fontSize: 13, fontWeight: 500, color: '#1d232f',
                    background: '#f0f2f5', border: '1px solid #d0d5dd',
                    borderRadius: 20, padding: '7px 18px', cursor: 'pointer', marginBottom: 12,
                  }}
                >Browse files</button>
                <div style={{ fontSize: 12, color: '#6b7a99' }}>
                  Or drag a CSV file into this window. Maximum file size is 50 MB.
                </div>
              </div>

              {/* Column names */}
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
                <span style={{ fontSize: 13, color: '#1d232f', minWidth: 120 }}>Column names</span>
                {([
                  { id: 'header' as const, label: 'Define in header' },
                  { id: 'none'   as const, label: 'Not defined' },
                ]).map(opt => (
                  <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#1d232f' }}>
                    <span style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: colNames === opt.id ? '2px solid #2770EF' : '1.5px solid #c8cdd6',
                      background: '#fff',
                    }} onClick={() => setColNames(opt.id)}>
                      {colNames === opt.id && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2770EF', display: 'block' }} />}
                    </span>
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* Field separations */}
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#1d232f', minWidth: 120 }}>Field separations</span>
                {([
                  { id: 'comma'     as const, label: 'Comma(,)' },
                  { id: 'semicolon' as const, label: 'Semicolon(;)' },
                  { id: 'pipe'      as const, label: 'Pipe(|)' },
                  { id: 'space'     as const, label: 'Space' },
                  { id: 'tab'       as const, label: 'Tab' },
                ]).map(opt => (
                  <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#1d232f' }}>
                    <span style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: fieldSep === opt.id ? '2px solid #2770EF' : '1.5px solid #c8cdd6',
                      background: '#fff',
                    }} onClick={() => setFieldSep(opt.id)}>
                      {fieldSep === opt.id && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2770EF', display: 'block' }} />}
                    </span>
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step: preview the uploaded CSV */}
          {step === 'preview' && (
            <div>
              <div style={{ fontSize: 12, color: '#6b7a99', marginBottom: 12 }}>
                File: <strong style={{ color: '#1d232f' }}>{fileName}</strong> · {MOCK_CSV_COLS.length} columns · 41,288 rows detected
              </div>
              <div style={{ border: '1px solid #eaedf2', borderRadius: 8, overflow: 'auto', maxHeight: 360 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8f9fb', borderBottom: '1px solid #eaedf2' }}>
                      {MOCK_CSV_COLS.map(col => (
                        <th key={col.name} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#1d232f', whiteSpace: 'nowrap', borderRight: '1px solid #eaedf2' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {typeTag(col.type)}
                            {col.name}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['1001','Alice','Johnson','Engineering','120000','2021-03-15','Bob Smith'],
                      ['1002','David','Kim','Marketing','95000','2020-07-01','Carol Lee'],
                      ['1003','Sara','Patel','Design','105000','2022-01-10','Bob Smith'],
                      ['1004','Mike','Torres','Engineering','130000','2019-05-20','Eve Chen'],
                      ['1005','Lisa','Wang','Product','115000','2021-09-30','Carol Lee'],
                    ].map((row, ri) => (
                      <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #eaedf2' }}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ padding: '7px 12px', color: '#1d232f', borderRight: '1px solid #eaedf2', whiteSpace: 'nowrap' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: '#9aa5b8' }}>Showing 5 of 41,288 rows</div>
            </div>
          )}

          {/* Step: match — link CSV to the Answer (flow = existing) */}
          {step === 'match' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1d232f', marginBottom: 18 }}>Choose columns with equivalent values</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {matchPairs.map((pair, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 16, alignItems: 'end' }}>
                    {/* Answer column */}
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7a99', marginBottom: 6 }}>Answer columns</div>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={pair.answer}
                          onChange={e => setMatchPairs(ps => ps.map((p, idx) => idx === i ? { ...p, answer: e.target.value } : p))}
                          style={{ width: '100%', appearance: 'none', fontSize: 14, fontWeight: 500, color: '#1d232f', padding: '11px 32px 11px 14px', border: '1px solid #d0d5dd', borderRadius: 8, background: '#fff', cursor: 'pointer' }}
                        >
                          {DATA_MODEL_COLS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7a99', pointerEvents: 'none' }}><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                    {/* CSV column */}
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7a99', marginBottom: 6 }}>CSV columns</div>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={pair.csv}
                          onChange={e => setMatchPairs(ps => ps.map((p, idx) => idx === i ? { ...p, csv: e.target.value } : p))}
                          style={{ width: '100%', appearance: 'none', fontSize: 14, fontWeight: 500, color: '#1d232f', padding: '11px 32px 11px 14px', border: '1px solid #d0d5dd', borderRadius: 8, background: '#fff', cursor: 'pointer' }}
                        >
                          {MOCK_CSV_COLS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7a99', pointerEvents: 'none' }}><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                    {/* Remove */}
                    {i > 0 ? (
                      <button onClick={() => setMatchPairs(ps => ps.filter((_, idx) => idx !== i))}
                        style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: '#9aa5b8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }} aria-label="Remove pair">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="#c8cdd6"/><path d="M7 7l6 6M13 7l-6 6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/></svg>
                      </button>
                    ) : <div />}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setMatchPairs(ps => [...ps, { answer: DATA_MODEL_COLS[0].key, csv: MOCK_CSV_COLS[0].name }])}
                style={{ marginTop: 16, fontSize: 13, fontWeight: 500, color: '#2770EF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                Add another pair
              </button>

              {/* Preview data samples */}
              <div style={{ marginTop: 28, borderTop: '1px solid #eaedf2', paddingTop: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#1d232f', marginBottom: 14 }}>Preview data samples</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  {[
                    { label: '[ANSWER NAME] sample data' },
                    { label: '[CSV FILE NAME] sample data' },
                  ].map((tbl, ti) => (
                    <div key={ti}>
                      <div style={{ fontSize: 12, color: '#9aa5b8', marginBottom: 8 }}>{tbl.label}</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #1d232f' }}>
                            {['First name', 'Last name', 'Employee ID'].map(h => (
                              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#1d232f', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ['Sarib', 'Haroon', '001'],
                            ['Jason', 'Knight', '002'],
                            ['Jason', 'Day', '003'],
                            ['Jane', 'Doe', '004'],
                          ].map((row, ri) => (
                            <tr key={ri} style={{ borderBottom: '1px solid #eaedf2' }}>
                              {row.map((cell, ci) => (
                                <td key={ci} style={{ padding: '9px 10px', color: '#1d232f' }}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step: select columns to import (flow = existing) */}
          {step === 'select' && (
            <div>
              <div style={{ fontSize: 13, color: '#6b7a99', marginBottom: 16 }}>
                Choose which columns from <strong style={{ color: '#1d232f' }}>{fileName}</strong> to add. They’ll appear in the data panel under <strong style={{ color: '#1d232f' }}>Custom data</strong>.
              </div>
              <div style={{ border: '1px solid #eaedf2', borderRadius: 8, overflow: 'hidden' }}>
                {/* Select all */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '1px solid #eaedf2', background: '#f8f9fb', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6b7a99' }}>
                  <input type="checkbox"
                    checked={selectedCsvCols.size === MOCK_CSV_COLS.length}
                    ref={el => { if (el) el.indeterminate = selectedCsvCols.size > 0 && selectedCsvCols.size < MOCK_CSV_COLS.length; }}
                    onChange={e => setSelectedCsvCols(e.target.checked ? new Set(MOCK_CSV_COLS.map(c => c.name)) : new Set())}
                  />
                  Select all ({selectedCsvCols.size}/{MOCK_CSV_COLS.length})
                </label>
                {MOCK_CSV_COLS.map((col, i) => (
                  <label key={col.name} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer',
                    borderBottom: i < MOCK_CSV_COLS.length - 1 ? '1px solid #eaedf2' : 'none',
                    background: i % 2 === 0 ? '#fff' : '#fafbfc',
                  }}>
                    <input type="checkbox"
                      checked={selectedCsvCols.has(col.name)}
                      onChange={e => setSelectedCsvCols(prev => {
                        const n = new Set(prev);
                        e.target.checked ? n.add(col.name) : n.delete(col.name);
                        return n;
                      })}
                    />
                    {typeTag(col.type)}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1d232f' }}>{col.name}</div>
                      <div style={{ fontSize: 11, color: '#9aa5b8' }}>e.g. {col.sample}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step: done */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e8f5e9', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#2e7d32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1d232f', marginBottom: 6 }}>Import complete</div>
              <div style={{ fontSize: 13, color: '#6b7a99' }}>
                {flow === 'existing'
                  ? `${selectedCsvCols.size} column${selectedCsvCols.size === 1 ? '' : 's'} from ${fileName} added to Custom data`
                  : `${fileName} was imported as the data model with ${MOCK_CSV_COLS.length} columns`}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderTop: '1px solid var(--rd-sys-color-border-divider,#eaedf2)', flexShrink: 0 }}>
          <div>
            {(step === 'preview' || step === 'match' || step === 'select') && (
              <Button variant="tertiary" size="basic" onClick={() => {
                if (step === 'preview') setStep('upload');
                else if (step === 'match') setStep('preview');
                else if (step === 'select') setStep('match');
              }}>Back</Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step === 'done' ? (
              <Button variant="primary" size="basic" onClick={handleClose}>Done</Button>
            ) : step === 'choose' ? (
              <>
                <Button variant="secondary" size="basic" onClick={handleClose}>Cancel</Button>
                <Button variant="primary" size="basic" disabled={!flow} onClick={() => setStep('upload')}>Continue</Button>
              </>
            ) : step === 'upload' ? (
              <>
                <Button variant="tertiary" size="basic" onClick={handleClose}>Exit</Button>
                <Button variant="primary" size="basic" onClick={() => setStep('preview')}>Next</Button>
              </>
            ) : step === 'preview' ? (
              <>
                <Button variant="tertiary" size="basic" onClick={handleClose}>Exit</Button>
                <Button variant="primary" size="basic" onClick={() => { if (flow === 'existing') setStep('match'); else handleImport(); }} disabled={importing}>
                  {flow === 'existing' ? 'Next' : (importing ? 'Importing…' : 'Import')}
                </Button>
              </>
            ) : step === 'match' ? (
              <>
                <Button variant="tertiary" size="basic" onClick={handleClose}>Exit</Button>
                <Button variant="primary" size="basic" onClick={() => setStep('select')}>Next</Button>
              </>
            ) : (
              <>
                <Button variant="tertiary" size="basic" onClick={handleClose}>Exit</Button>
                <Button variant="primary" size="basic" onClick={handleImport} disabled={importing || selectedCsvCols.size === 0}>
                  {importing ? 'Importing…' : `Import ${selectedCsvCols.size} column${selectedCsvCols.size === 1 ? '' : 's'}`}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Overflow "more" menu ─────────────────────────────────────────────────────
// Shared dropdown for the answer card and both sheet sub-headers.
const MoreMenu: React.FC<{
  open: boolean;
  onClose: () => void;
  variant?: 'sheet' | 'answerCard';
  onSave?: () => void;
  onSaveInputTable?: () => void;
  // When set, Share / Save Answer (sheet variant) and Share / Pin
  // (answerCard variant) move into this menu instead of sitting as their own
  // buttons alongside it. Omitted elsewhere, so those call sites are unchanged.
  showShare?: boolean;
  onSaveAnswer?: () => void;
  showPin?: boolean;
  pinDisabled?: boolean;
}> = ({ open, onClose, variant = 'sheet', onSave, onSaveInputTable, showShare = false, onSaveAnswer, showPin = false, pinDisabled = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div ref={ref} style={{ position: 'absolute', top: '100%', right: 0, zIndex: 600, marginTop: 4 }}>
      <Menu onClose={onClose}>
        {variant === 'answerCard' ? (
          <>
            {(showShare || showPin) && (
              <>
                {showShare && <Menu.Item onClick={onClose}>Share</Menu.Item>}
                {showPin && <Menu.Item disabled={pinDisabled} onClick={onClose}>Pin</Menu.Item>}
                <Menu.Divider />
              </>
            )}
            <Menu.Item onClick={() => { onSave?.(); onClose(); }}>Save Answer</Menu.Item>
            <Menu.Item>Save as view</Menu.Item>
            <Menu.Divider />
            <Menu.Item>Show underlying data</Menu.Item>
            <Menu.Item>Download</Menu.Item>
            <Menu.Divider />
            <Menu.Item shortcut="▸">Sync</Menu.Item>
            <Menu.Divider />
            <Menu.Item shortcut="▸">TML</Menu.Item>
          </>
        ) : (
          <>
            {(showShare || onSaveAnswer) && (
              <>
                {showShare && <Menu.Item onClick={onClose}>Share</Menu.Item>}
                {onSaveAnswer && <Menu.Item onClick={() => { onSaveAnswer(); onClose(); }}>Save Answer</Menu.Item>}
                <Menu.Divider />
              </>
            )}
            <Menu.Item onClick={() => { onSaveInputTable?.(); onClose(); }}>Save as input table</Menu.Item>
            <Menu.Item>Save as view</Menu.Item>
            <Menu.Divider />
            <Menu.Item>Show underlying data</Menu.Item>
            <Menu.Item>Download</Menu.Item>
            <Menu.Divider />
            <Menu.Item>SpotIQ analyze</Menu.Item>
            <Menu.Item>local1</Menu.Item>
            <Menu.Item>URL-NRR</Menu.Item>
            <Menu.Item>utsav-test-facebook</Menu.Item>
            <Menu.Divider />
            <Menu.Item>TML</Menu.Item>
            <Menu.Divider />
            <Menu.Item>Switch to new chart</Menu.Item>
          </>
        )}
      </Menu>
    </div>
  );
};

type DataModelSource = {
  id: string;
  name: string;
  type: 'Model' | 'View';
  createdAt?: string;
  description?: string;
  tags?: string[];
  topLiveboards?: { name: string; author: string }[];
  author?: { name: string; initial: string };
};

const dataModelSources: DataModelSource[] = [
  {
    id: 'retail-apparel',
    name: '(Sample) Retail - Apparel',
    type: 'Model',
    createdAt: 'May 26, 2020',
    topLiveboards: [
      { name: 'Sample Liveboard', author: 'siddhant rohela' },
      { name: 'Retail sales - Rahul LB', author: 'rahul pjp' },
      { name: '(Sample) Sales Performance', author: 'System User' },
    ],
    author: { name: 'System User', initial: 'S' },
  },
  { id: 'mau', name: '[Deprecated]-MAU Analysis', type: 'Model' },
  { id: 'team-engagement', name: '[FT/TE] Team Level Engagement Worksheet', type: 'Model' },
  { id: 'ts-cloud', name: '[TS Cloud] Dates of Milestone, by Customer [View]', type: 'View' },
  { id: 'wine', name: '[WINE] Mixpanel Metrics', type: 'Model' },
  { id: 'wip', name: '[WIP] MIT AI Analytics', type: 'Model' },
];

const DataModelPicker: React.FC<{
  selectedId: string;
  onSelectId: (id: string) => void;
  extraSources?: DataModelSource[];
}> = ({ selectedId, onSelectId, extraSources = [] }) => {
  const [search, setSearch] = useState('');
  const [multiSources, setMultiSources] = useState(false);
  const allSources = [...extraSources, ...dataModelSources];
  const filtered = search.trim()
    ? allSources.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    : allSources;
  const selected = allSources.find(s => s.id === selectedId) ?? allSources[0];

  return (
    <div style={{ display: 'flex', height: 480, margin: '-24px', borderTop: '1px solid var(--rd-sys-color-border-divider, #eaedf2)' }}>
      {/* Left pane */}
      <div style={{ width: 320, borderRight: '1px solid var(--rd-sys-color-border-divider, #eaedf2)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SearchInput
              placeholder="Find sources"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            aria-label="Source settings"
            style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--rd-sys-color-border-divider, #eaedf2)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <Icon name="cog" size="s" color={systemColors.light['content-primary']} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
          {filtered.map(src => {
            const isSelected = src.id === selectedId;
            return (
              <button
                key={src.id}
                onClick={() => onSelectId(src.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', border: 'none',
                  background: isSelected ? 'var(--rd-sys-color-background-ghost-highlight, #ebf2ff)' : 'transparent',
                  borderRadius: 4, cursor: 'pointer', textAlign: 'left', position: 'relative', marginBottom: 2,
                }}
              >
                <span style={{ width: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 2 }}>
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M3 8.5l3 3 7-7" stroke="var(--rd-sys-color-content-brand, #2770ef)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--rd-sys-color-content-primary, #1d232f)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--rd-sys-color-content-secondary, #777e8b)' }}>{src.type}</span>
                </span>
                {isSelected && (
                  <span style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '7px solid #fff', filter: 'drop-shadow(1px 0 0 var(--rd-sys-color-border-divider, #eaedf2))' }} aria-hidden />
                )}
              </button>
            );
          })}
        </div>
        <div style={{ padding: 16, borderTop: '1px solid var(--rd-sys-color-border-divider, #eaedf2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Toggle checked={multiSources} onChange={setMultiSources} />
          <span style={{ fontSize: 14, color: 'var(--rd-sys-color-content-primary, #1d232f)' }}>Enable multiple sources</span>
        </div>
      </div>

      {/* Right pane */}
      <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--rd-sys-color-content-primary, #1d232f)', marginBottom: 4 }}>{selected.name}</div>
        <div style={{ fontSize: 14, color: 'var(--rd-sys-color-content-secondary, #777e8b)', marginBottom: 4 }}>{selected.type}</div>
        {selected.createdAt && (
          <div style={{ fontSize: 13, color: 'var(--rd-sys-color-content-secondary, #777e8b)', marginBottom: 16 }}>Created on: {selected.createdAt}</div>
        )}
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--rd-sys-color-content-primary, #1d232f)' }}>Description: </span>
          <span style={{ fontSize: 14, color: 'var(--rd-sys-color-content-primary, #1d232f)' }}>{selected.description ?? 'Not available'}</span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rd-sys-color-content-primary, #1d232f)' }}>Tags:</div>
          <div style={{ fontSize: 14, color: 'var(--rd-sys-color-content-primary, #1d232f)' }}>{selected.tags?.join(', ') ?? 'Not available'}</div>
        </div>
        <div style={{ height: 1, background: 'var(--rd-sys-color-border-divider, #eaedf2)', margin: '16px 0' }} />
        {selected.topLiveboards && selected.topLiveboards.length > 0 && (
          <>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rd-sys-color-content-primary, #1d232f)', marginBottom: 12 }}>Top Liveboards created using {selected.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {selected.topLiveboards.map(lb => (
                <div key={lb.name} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="liveboard" size="s" color={systemColors.light['content-secondary']} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--rd-sys-color-content-brand, #2770ef)', cursor: 'pointer' }}>{lb.name}</span>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--rd-sys-color-content-secondary, #777e8b)', marginLeft: 22 }}>by {lb.author}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--rd-sys-color-border-divider, #eaedf2)', margin: '16px 0' }} />
          </>
        )}
        {selected.author && (
          <>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rd-sys-color-content-primary, #1d232f)', marginBottom: 12 }}>Author</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#b39ddb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, flexShrink: 0 }}>
                {selected.author.initial}
              </div>
              <span style={{ fontSize: 14, color: 'var(--rd-sys-color-content-primary, #1d232f)' }}>{selected.author.name}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SheetDataPanel: React.FC<{
  selectedKeys: Set<string>;
  onToggle: (colId: string) => void;
  importedCsvGroups?: Array<{ csvName: string; cols: CsvCol[] }>;
  savedInputTables?: Array<{ tableName: string; columns: { id: string; name: string; kind: 'custom' | 'key' }[] }>;
  activeInputTable?: { tableName: string; columns: { id: string; name: string; kind: 'custom' | 'key' }[] } | null;
  style?: React.CSSProperties;
  // Swappable section list — defaults to the module-level SHEET_PANEL_SECTIONS
  // (Option 1's fixed "Sample Retail" schema) when omitted.
  sections?: typeof SHEET_PANEL_SECTIONS;
  // Matches the Query tab's own data panel look — colored measure/attribute
  // chips (DataToken) instead of plain text, and a plain "+" icon instead of
  // the panel-toggle icon. Off by default (Option 1's original look).
  useColorChips?: boolean;
}> = ({ selectedKeys, onToggle, importedCsvGroups = [], savedInputTables = [], activeInputTable = null, style, sections = SHEET_PANEL_SECTIONS, useColorChips = false }) => {
  const [panelExpanded, setPanelExpanded] = useState<Set<string>>(
    new Set(['measures', 'attributes', 'date'])
  );
  const [tableExpanded, setTableExpanded] = useState<Set<number>>(new Set());

  const toggleTable = (i: number) =>
    setTableExpanded(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  // Auto-expand "Custom data" and new table when saved input tables are added
  const tableCount = savedInputTables.length;
  useEffect(() => {
    if (tableCount > 0) {
      setPanelExpanded(prev => new Set(prev).add('custom'));
      setTableExpanded(prev => new Set(prev).add(tableCount - 1));
    }
  }, [tableCount]);

  // Auto-expand "Custom data" when CSV columns are imported
  const groupCount = importedCsvGroups.length;
  useEffect(() => {
    if (groupCount > 0) setPanelExpanded(prev => new Set(prev).add('custom'));
  }, [groupCount]);

  return (
    // No radius/shadow (flush edge-to-edge); 1px border all sides
    <aside className={useColorChips ? `${styles.dataPanel} ${styles.densePanel}` : styles.dataPanel} style={{
      borderRadius: 0,
      boxShadow: 'none',
      height: '100%',
      border: '1px solid var(--rd-sys-color-border-divider, #eaedf2)',
      ...style,
    }}>
      {/* Search + panel toggle */}
      <div className={useColorChips ? `${styles.panelSearch} ${styles.panelSearchCompact}` : `${styles.panelSearch} ${styles.sheetPanelSearch}`}>
        {useColorChips ? (
          <SearchInput placeholder="Search" className={`${styles.dataPanelSearchInputCompact} ${styles.dataPanelSearchInputFlex}`} />
        ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <SearchInput placeholder="Search" className={`${styles.sheetPanelSearchInput} ${styles.dataPanelSearchInputCompact}`} />
          </div>
        )}
        {useColorChips ? null : (
          <button className={styles.panelToggleBtn} aria-label="Toggle data panel">
            <svg viewBox="0 0 16 16" width={16} height={16} fill="none" aria-hidden>
              <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M6 3v10" stroke="currentColor" strokeWidth="1.4"/>
              <rect x="3" y="4" width="2" height="8" rx="0.5" fill="currentColor"/>
            </svg>
          </button>
        )}
      </div>

      {/* Accordion sections — compact 32px rows for spreadsheet mode */}
      <div className={styles.columnSections}>
        {activeInputTable ? (
          /* ── Input table as primary source: inject its cols into standard sections, hide Custom data ── */
          (() => {
            const inputColIds = new Set(activeInputTable.columns.map(c => c.id));
            const keyCols   = activeInputTable.columns.filter(c => c.kind === 'key');
            const customCols = activeInputTable.columns.filter(c => c.kind === 'custom');
            return sections.filter(s => s.id !== 'custom').map(section => {
              const cols = section.id === 'attributes' ? keyCols
                         : section.id === 'measures'   ? customCols
                         : null;
              return (
                <div key={section.id}>
                  <button
                    className={useColorChips ? styles.sectionHeader : `${styles.sectionHeader} ${styles.sheetPanelHeader}`}
                    onClick={() => setPanelExpanded(prev => {
                      const n = new Set(prev); n.has(section.id) ? n.delete(section.id) : n.add(section.id); return n;
                    })}
                  >
                    <Icon name={panelExpanded.has(section.id) ? 'chevron-down' : 'chevron-right'} size="m" color={systemColors.light['content-primary']} />
                    {useColorChips ? (
                      <Typography variant="content-label" as="span">{section.label}</Typography>
                    ) : (
                      <span className={styles.sheetPanelHeaderLabel}>{section.label}</span>
                    )}
                  </button>
                  {panelExpanded.has(section.id) && cols && cols.map(col => (
                    <div
                      key={col.id}
                      className={useColorChips ? styles.columnItem : styles.sheetPanelItem}
                      // Row is the single toggle handler; the Checkbox below is
                      // pointer-events:none so it can't fire a second one.
                      // See the matching comment in the other branch below.
                      onClick={() => onToggle(col.id)}
                    >
                      <span style={{ pointerEvents: 'none', display: 'flex' }}>
                        <Checkbox checked={inputColIds.has(col.id)} onChange={() => {}} showLabel={false} />
                      </span>
                      <span className={styles.sheetPanelItemLabel}>{col.name}</span>
                    </div>
                  ))}
                </div>
              );
            });
          })()
        ) : (
        sections.map(section => (
          <div key={section.id}>
            <button
              className={useColorChips ? styles.sectionHeader : `${styles.sectionHeader} ${styles.sheetPanelHeader}`}
              onClick={() => setPanelExpanded(prev => {
                const n = new Set(prev);
                n.has(section.id) ? n.delete(section.id) : n.add(section.id);
                return n;
              })}
            >
              <Icon
                name={panelExpanded.has(section.id) ? 'chevron-down' : 'chevron-right'}
                size="m"
                color={systemColors.light['content-primary']}
              />
              {useColorChips ? (
                <Typography variant="content-label" as="span">{section.label}</Typography>
              ) : (
                <span className={styles.sheetPanelHeaderLabel}>{section.label}</span>
              )}
            </button>

            {panelExpanded.has(section.id) && section.items.map(col => (
              <div
                key={col.id}
                className={useColorChips ? styles.columnItem : styles.sheetPanelItem}
                // The row is the ONE and ONLY toggle handler. The Checkbox is
                // rendered pointer-events:none below so it can never fire a
                // second toggle: it renders <label htmlFor><input id>, so a
                // click on the box made the browser also activate the input —
                // row onClick + input onChange = two toggles that cancelled
                // out, which is why clicking appeared to do nothing.
                onClick={() => onToggle(col.id)}
              >
                <span style={{ pointerEvents: 'none', display: 'flex' }}>
                  <Checkbox
                    checked={selectedKeys.has(col.id)}
                    onChange={() => {}}
                    showLabel={false}
                  />
                </span>
                {useColorChips ? (
                  <DataToken label={col.label} type={col.type} variant="panel" />
                ) : (
                  <span className={styles.sheetPanelItemLabel}>{col.label}</span>
                )}
              </div>
            ))}

            {/* Imported CSV columns, grouped by file, under "Custom data" */}
            {section.id === 'custom' && panelExpanded.has(section.id) && importedCsvGroups.map(group => (
              <div key={group.csvName}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px 2px', fontSize: 11, fontWeight: 600, color: '#9aa5b8' }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5Z" stroke="#9aa5b8" strokeWidth="1.2"/>
                    <path d="M9 1.5V5.5H13" stroke="#9aa5b8" strokeWidth="1.2"/>
                  </svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.csvName}</span>
                </div>
                {group.cols.map(col => (
                  <div key={col.name} className={styles.sheetPanelItem} onClick={() => onToggle(`__csv_${group.csvName}_${col.name}`)}>
                    <Checkbox
                      checked={selectedKeys.has(`__csv_${group.csvName}_${col.name}`)}
                      onChange={() => onToggle(`__csv_${group.csvName}_${col.name}`)}
                      showLabel={false}
                    />
                    <span className={styles.sheetPanelItemLabel}>{col.name}</span>
                  </div>
                ))}
              </div>
            ))}

            {/* Saved input tables under "Custom data" — collapsible folder rows */}
            {section.id === 'custom' && panelExpanded.has(section.id) && savedInputTables.map((table, ti) => {
              const open = tableExpanded.has(ti);
              return (
                <div key={`${table.tableName}_${ti}`}>
                  {/* Table row — indented deeply inside Custom data */}
                  <button
                    onClick={() => toggleTable(ti)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      width: '100%', height: 32, padding: '0 12px 0 40px',
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, transition: 'transform 120ms', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                      <path d="M3 2l4 3-4 3" stroke="var(--rd-sys-color-content-secondary, #6b7280)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                      <rect x="2" y="3" width="12" height="10" rx="1" stroke="var(--rd-sys-color-content-secondary, #6b7280)" strokeWidth="1.2"/>
                      <path d="M2 6.5h12" stroke="var(--rd-sys-color-content-secondary, #6b7280)" strokeWidth="1.2"/>
                      <path d="M6 6.5v6.5" stroke="var(--rd-sys-color-content-secondary, #6b7280)" strokeWidth="1.2"/>
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--rd-sys-color-content-primary, #1d232f)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {table.tableName}
                    </span>
                  </button>
                  {/* Columns — indented further inside the table */}
                  {open && table.columns.map(col => (
                    <div
                      key={col.id}
                      className={styles.sheetPanelItem}
                      style={{ paddingLeft: 64 }}
                    >
                      <Checkbox checked={false} onChange={() => {}} showLabel={false} />
                      <span className={styles.sheetPanelItemLabel}>{col.name}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))
        )}
      </div>
    </aside>
  );
};

const SheetView: React.FC<{
  columns: AnswerColDef[];
  rows: Record<string, unknown>[];
  title?: string;
  description?: string;
  onTitleChange?: (v: string) => void;
  onDescChange?: (v: string) => void;
  expanded: boolean;
  onExpandedChange: (v: boolean) => void;
  sheetDataView: 'aggregated' | 'row-level';
  onSheetDataViewChange: (v: 'aggregated' | 'row-level') => void;
  hideExpandButton?: boolean;
  hideModelControl?: boolean;
  emptyMode?: boolean;
  onColumnsChange?: (keys: Set<string>) => void;
  externalLoading?: boolean;
  onOpenInSearchData?: () => void;
  initialFormulaCols?: FormulaCol[];
  initialFormulaValues?: Record<string, (number | null)[]>;
  onFormulaChange?: (cols: FormulaCol[], values: Record<string, (number | null)[]>) => void;
  onOpenDataModel?: () => void;
  onOpenSaveModal?: () => void;
  onOpenWritebackModal?: () => void;
  importedCsvGroups?: Array<{ csvName: string; cols: CsvCol[] }>;
  onImportCsv?: (csvName: string, cols: CsvCol[]) => void;
  activeSourceName?: string;
  style?: React.CSSProperties;
  // Full swappable schema for this sheet's own column picker/data panel —
  // defaults to the module-level DATA_MODEL_COLS (Option 1's fixed "Sample
  // Retail" schema) when omitted.
  dataModelCols?: AnswerColDef[];
  // canvasScope (Optimized) only: formulas apply to the whole model, so
  // adding one only makes sense at Model scope — disabled at Table/Join
  // scope. Defaults to true (always enabled) for every other consumer,
  // which has no table/join/model scope concept at all.
  canAddFormula?: boolean;
  // canvasScope (Optimized) only: generate row data directly from whichever
  // columns are currently selected (selectedColKeys/sheetCols), instead of
  // from the `rows` prop — which comes from the parent's queryState and only
  // updates through a chain of scope→category→query-state plumbing that kept
  // going stale. Komal: "clicking on the left should simply add a column on
  // the spreadsheet" — this makes that true by construction, independent of
  // whatever queryState is doing.
  canvasScopeMode?: boolean;
  // canvasScope (Optimized) only: the parent owns which columns are selected
  // (it renders the column-selector sidebar too), so the sheet is a pure
  // renderer of this set rather than keeping its own competing copy.
  controlledColKeys?: Set<string>;
}> = ({ columns, rows, title = 'Answer', description = '', onTitleChange, onDescChange, expanded, onExpandedChange, sheetDataView, onSheetDataViewChange, hideExpandButton = false, hideModelControl = false, emptyMode = false, onColumnsChange, externalLoading = false, onOpenInSearchData: _onOpenInSearchData, initialFormulaCols, initialFormulaValues, onFormulaChange, onOpenDataModel, onOpenSaveModal, onOpenWritebackModal, importedCsvGroups: importedCsvGroupsProp, onImportCsv, activeSourceName = 'Sample Retail', style, dataModelCols = DATA_MODEL_COLS, canAddFormula = true, canvasScopeMode = false, controlledColKeys }) => {
  const editableColStyle = getEditableColStyle();
  const [viewDropOpen, setViewDropOpen] = useState(false);
  const [dataPanelOpen, setDataPanelOpen] = useState(false);
  const [sheetMoreOpen, setSheetMoreOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  // CSV columns imported into the data panel's "Custom data" section, grouped by file.
  // Controlled by the parent when props are supplied; otherwise managed locally.
  const [localCsvGroups, setLocalCsvGroups] = useState<Array<{ csvName: string; cols: CsvCol[] }>>([]);
  const importedCsvGroups = importedCsvGroupsProp ?? localCsvGroups;
  const handleImportCsv = (csvName: string, cols: CsvCol[]) => {
    if (onImportCsv) onImportCsv(csvName, cols);
    else setLocalCsvGroups(g => [...g, { csvName, cols }]);
  };
  const [customColDataTypes, setCustomColDataTypes] = useState<Record<string, string>>({});
  const [colDataTypeSubmenuKey, setColDataTypeSubmenuKey] = useState<string | null>(null);
  // Buffer panel selections — applied only when user clicks the scrim to confirm
  const [dataPanelPending, setDataPanelPending] = useState<Set<string> | null>(null);

  // Toggling in the panel only updates the pending buffer, not the live sheet
  const togglePanelCol = (colId: string) => {
    setDataPanelPending(prev => {
      const base = prev ?? selectedColKeys;
      const next = new Set(base);
      next.has(colId) ? next.delete(colId) : next.add(colId);
      return next;
    });
  };

  // Clicking the scrim closes the panel and commits pending keys with a loading flash
  const handlePanelScrimClick = () => {
    setDataPanelOpen(false);
    if (dataPanelPending) {
      setColPickerLoading(true);
      const newKeys = dataPanelPending;
      setDataPanelPending(null);
      setTimeout(() => {
        setSelectedColKeys(newKeys);
        setColPickerSel(newKeys);
        setHiddenCols(new Set());
        setColPickerLoading(false);
        onColumnsChange?.(newKeys);
      }, 900);
    } else {
      setDataPanelPending(null);
    }
  };

  // ── Editable title + description (used in expanded mode) ─────────────────
  const [titleEditing, setTitleEditing] = useState(false);
  const [descEditing,  setDescEditing]  = useState(false);
  const titleEditRef = useRef<HTMLInputElement>(null);
  const descEditRef  = useRef<HTMLInputElement>(null);

  const commitTitle = (val: string) => { setTitleEditing(false); onTitleChange?.(val.trim() || title); };
  const commitDesc  = (val: string) => { setDescEditing(false);  onDescChange?.(val); };

  // ── Cell selection ────────────────────────────────────────────────────────
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [hoveredCell,  setHoveredCell]  = useState<{ r: number; c: number } | null>(null);

  // ── Column header menu ────────────────────────────────────────────────────
  const [colMenuKey, setColMenuKey] = useState<string | null>(null);
  // canvasScopeMode only: the column menu is absolutely positioned inside the
  // header cell, so the docked preview panel's overflow:hidden clipped it (the
  // menu ran off the panel edge). Capturing the chevron's viewport rect lets it
  // render position:fixed instead, which no overflow ancestor can clip.
  const [colMenuPos, setColMenuPos] = useState<{ left: number; top: number } | null>(null);

  // ── Column rename / hide / aggregate state ───────────────────────────────
  const [renamingCol, setRenamingCol] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [colRenames, setColRenames] = useState<Record<string, string>>({});
  const [colAggregates, setColAggregates] = useState<Record<string, AggregateType>>({});
  const [colAggSubmenuKey, setColAggSubmenuKey] = useState<string | null>(null);

  // ── Column formatting + undo/redo (canvasScopeMode / Optimized only) ──────
  // Formatting targets the selected cell's COLUMN. Every mutation goes through
  // pushFmt, which snapshots the previous map onto an undo stack, so Undo/Redo
  // and Format-paint all operate on the same single source of truth.
  type ColFmt = { align?: 'left' | 'center' | 'right'; wrap?: 'overflow' | 'wrap' | 'clip'; numFmt?: string; decimals?: number; fill?: string | null };
  const [colFormats, setColFormats] = useState<Record<string, ColFmt>>({});
  const [fmtPast, setFmtPast] = useState<Record<string, ColFmt>[]>([]);
  const [fmtFuture, setFmtFuture] = useState<Record<string, ColFmt>[]>([]);
  // When set, the next column click paints this column's formatting onto it.
  const [formatPaintSrc, setFormatPaintSrc] = useState<string | null>(null);
  // Toolbar 'Sort range' — sorts the sheet by the selected column.
  const [sheetSort, setSheetSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null);

  const pushFmt = (next: Record<string, ColFmt>) => {
    setFmtPast(p => [...p, colFormats]);
    setFmtFuture([]);
    setColFormats(next);
  };
  const patchColFmt = (colKey: string, patch: ColFmt) =>
    pushFmt({ ...colFormats, [colKey]: { ...(colFormats[colKey] ?? {}), ...patch } });
  const undoFmt = () => {
    if (!fmtPast.length) return;
    const prev = fmtPast[fmtPast.length - 1];
    setFmtPast(p => p.slice(0, -1));
    setFmtFuture(f => [colFormats, ...f]);
    setColFormats(prev);
  };
  const redoFmt = () => {
    if (!fmtFuture.length) return;
    const nxt = fmtFuture[0];
    setFmtFuture(f => f.slice(1));
    setFmtPast(p => [...p, colFormats]);
    setColFormats(nxt);
  };

  // Columns that currently have a filter applied + the open edit/remove popover
  const [filteredColKeys, setFilteredColKeys] = useState<Set<string>>(new Set());
  const [filterMenuKey, setFilterMenuKey] = useState<string | null>(null);
  // "Add filter" modal — column picker → value picker
  const [addFilterModalOpen, setAddFilterModalOpen] = useState(false);
  const [addFilterSearch, setAddFilterSearch] = useState('');
  const [addFilterStep, setAddFilterStep] = useState<'column' | 'value'>('column');
  const [addFilterColKey, setAddFilterColKey] = useState<string | null>(null);
  const [addFilterValueSearch, setAddFilterValueSearch] = useState('');
  const [addFilterValue, setAddFilterValue] = useState<string | null>(null);
  const [addFilterSaveToModel, setAddFilterSaveToModel] = useState(false);

  // A column is a measure if it is right-aligned (numeric)
  const isMeasureCol = (col: AnswerColDef) => col.align === 'right';

  // ── Column picker state ───────────────────────────────────────────────────
  // Seed from the queried columns when the parent passes them; fall back to defaults.
  // emptyMode bypasses defaults so the grid starts with no columns.
  const initColKeys = (): Set<string> => {
    if (emptyMode) return new Set();
    if (columns.length > 0) {
      const queried = new Set(columns.map(c => c.key).filter(k => dataModelCols.some(dc => dc.key === k)));
      return queried.size > 0 ? queried : DEFAULT_VISIBLE_KEYS;
    }
    return DEFAULT_VISIBLE_KEYS;
  };
  const [selectedColKeys, setSelectedColKeys] = useState<Set<string>>(initColKeys);
  const [colPickerOpen, setColPickerOpen]     = useState(false);
  const [colPickerSearch, setColPickerSearch] = useState('');
  const [colPickerLoading, setColPickerLoading] = useState(false);
  // draft selection while picker is open
  const [colPickerSel, setColPickerSel]       = useState<Set<string>>(initColKeys);
  const colPickerRef = useRef<HTMLDivElement>(null);

  // Sync selectedColKeys when the parent's queried columns change (Search → Sheet direction).
  // Only fires when the set of column keys actually changes; skips emptyMode (no parent query).
  // canvasScopeMode: skipped entirely — the parent owns the selection there
  // (controlledColKeys), so this internal state isn't what renders and this
  // effect would only re-introduce a second writer racing the parent's.
  const colKeyString = columns.map(c => c.key).join(',');
  useEffect(() => {
    if (canvasScopeMode || emptyMode || columns.length === 0) return;
    const queried = new Set(columns.map(c => c.key).filter(k => dataModelCols.some(dc => dc.key === k)));
    if (queried.size > 0) {
      setSelectedColKeys(queried);
      setColPickerSel(queried);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colKeyString, emptyMode]);

  // Close picker on outside click → apply selection with loading
  useEffect(() => {
    if (!colPickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) {
        setColPickerOpen(false);
        setColPickerSearch('');
        // Only trigger load if selection actually changed
        const same = colPickerSel.size === selectedColKeys.size &&
          [...colPickerSel].every(k => selectedColKeys.has(k));
        if (!same) {
          setColPickerLoading(true);
          setTimeout(() => {
            const newKeys = new Set(colPickerSel);
            setSelectedColKeys(newKeys);
            setHiddenCols(new Set()); // reset hidden when cols change
            setColPickerLoading(false);
            onColumnsChange?.(newKeys);
          }, 900);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [colPickerOpen, colPickerSel, selectedColKeys]);

  // ── Formula columns ───────────────────────────────────────────────────────
  // Initialized from parent snapshot (if any) so saved formulas restore correctly
  const [formulaCols, setFormulaCols] = useState<FormulaCol[]>(initialFormulaCols ?? []);
  const [activeFormulaKey, setActiveFormulaKey] = useState<string | null>(null);
  const [formulaValues, setFormulaValues] = useState<Record<string, (number | null)[]>>(initialFormulaValues ?? {});
  const [customCellValues, setCustomCellValues] = useState<Record<string, Record<number, string>>>({});
  const [formulaRawText, setFormulaRawText] = useState<Record<string, string>>({});
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [editingCellValue, setEditingCellValue] = useState('');
  const cellInputRef = useRef<HTMLInputElement>(null);
  const pendingAutoEditKeyRef = useRef<string | null>(null);
  const [formulaEditConfirm, setFormulaEditConfirm] = useState<{ r: number; c: number; colKey: string } | null>(null);
  // Key column picker — shown before a custom column can be edited
  const [, setCustomColKeyCol] = useState<Record<string, string>>({});
  const [keyPickerState, setKeyPickerState] = useState<{ colKey: string; anchor: { top: number; left: number }; cell: { r: number; c: number } } | null>(null);
  const [keyPickerSearch, setKeyPickerSearch] = useState('');
  const [keyPickerSelected, setKeyPickerSelected] = useState<string | null>(null);
  const keyPickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!keyPickerState) return;
    const handler = (e: MouseEvent) => {
      if (keyPickerRef.current && !keyPickerRef.current.contains(e.target as Node)) {
        setKeyPickerState(null);
        setKeyPickerSearch('');
        setKeyPickerSelected(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [keyPickerState]);

  // Notify parent whenever formulas change so they appear in search view and are saved
  useEffect(() => {
    onFormulaChange?.(formulaCols, formulaValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formulaCols, formulaValues]);
  const [fxInput, setFxInput]   = useState('');
  const [fxFocus, setFxFocus]   = useState(false);
  const [formulaErrorKeys, setFormulaErrorKeys] = useState<Set<string>>(new Set());
  const fxRef = useRef<HTMLInputElement>(null);

  const activeFormula = formulaCols.find(f => f.key === activeFormulaKey) ?? null;
  const activeFormulaHasError = activeFormulaKey ? formulaErrorKeys.has(activeFormulaKey) : false;

  const validateFormula = (tokens: FToken[], pendingText: string): boolean => {
    const lastTokenKind = tokens.length > 0 ? tokens[tokens.length - 1].kind : null;
    const text = pendingText.trim();
    if (tokens.length === 0 && !text) return false;
    if (text) {
      if (/^[+\-*/]$/.test(text)) return false;
    } else if (lastTokenKind === 'op') {
      return false;
    }
    return true;
  };

  const triggerFormulaCreate = () => {
    const n = formulaCols.length + 1;
    const newKey = `__formula_${n}`;
    setFormulaCols(cols => [...cols, { key: newKey, name: `Formula ${n}`, tokens: [] }]);
    setActiveFormulaKey(newKey);
    setFxInput('');
    setFormulaErrorKeys(prev => { const next = new Set(prev); next.delete(newKey); return next; });
    setTimeout(() => fxRef.current?.focus(), 30);
  };

  // Optimized only: the parent owns the selection (it also renders the
  // column-selector sidebar), so the sheet renders from that prop instead of
  // its own state. Previously the sidebar's checkbox `checked` came from the
  // parent while the sheet's columns came from this component's internal
  // selectedColKeys — two sources of truth that drifted apart, so the sheet
  // could show a column the sidebar showed as unchecked. One source now.
  const effectiveColKeys = controlledColKeys ?? selectedColKeys;

  // Always derive visible sheet columns from dataModelCols + the effective
  // key set so the column picker can show / hide any column from the model.
  const sheetCols: AnswerColDef[] = dataModelCols.filter(c => effectiveColKeys.has(c.key));

  // Raw (row-level) rows.
  // canvasScopeMode: generated straight from sheetCols (selectedColKeys),
  // never from the `rows` prop — see canvasScopeMode's own comment above.
  // Otherwise unchanged: in emptyMode with no columns selected yet, stay
  // empty; once the user picks columns via the picker, fall through to SALES_DATA.
  const rawSheetRows: Record<string, unknown>[] = canvasScopeMode
    ? (sheetCols.length === 0
        ? []
        : generateMockRows(sheetCols.map(c => ({ col: c.key, table: c.key.includes('.') ? c.key.split('.')[0] : '' })), 60))
    : (emptyMode && selectedColKeys.size === 0)
      ? []
      : rows.length > 0
        ? rows
        : SALES_DATA.map((r, i) => ({ ...r, _id: String(i) }));

  // Aggregated rows — group by region + productCategory
  const aggSheetRows: Record<string, unknown>[] = (() => {
    type AggBucket = {
      region: string; productCategory: string;
      unitsSold: number; revenue: number; profit: number;
      discountPctSum: number; cnt: number;
    };
    const map = new Map<string, AggBucket>();
    for (const r of SALES_DATA) {
      const key = `${r.region}__${r.productCategory}`;
      const existing = map.get(key);
      if (existing) {
        existing.unitsSold     += r.unitsSold;
        existing.revenue       += r.revenue;
        existing.profit        += r.profit;
        existing.discountPctSum += r.discountPct;
        existing.cnt           += 1;
      } else {
        map.set(key, {
          region: r.region, productCategory: r.productCategory,
          unitsSold: r.unitsSold, revenue: r.revenue, profit: r.profit,
          discountPctSum: r.discountPct, cnt: 1,
        });
      }
    }
    return Array.from(map.values()).map((b, i) => ({
      _id: String(i),
      region:          b.region,
      productCategory: b.productCategory,
      unitsSold:       b.unitsSold,
      revenue:         b.revenue,
      profit:          b.profit,
      profitMarginPct: b.revenue > 0 ? (b.profit / b.revenue) * 100 : 0,
      discountPct:     b.cnt > 0 ? b.discountPctSum / b.cnt : 0,
    }));
  })();

  const _unsortedSheetRows = sheetDataView === 'row-level' ? rawSheetRows : aggSheetRows;
  // Toolbar sort (Optimized). Numeric when both sides parse as numbers, else
  // locale string compare — same rule the column-header sort already uses.
  const sheetRows = sheetSort
    ? [..._unsortedSheetRows].sort((ra, rb) => {
        const av = (ra as Record<string, unknown>)[sheetSort.col];
        const bv = (rb as Record<string, unknown>)[sheetSort.col];
        const an = Number(av), bn = Number(bv);
        const cmp = (!Number.isNaN(an) && !Number.isNaN(bn) && av !== '' && bv !== '')
          ? an - bn
          : String(av ?? '').localeCompare(String(bv ?? ''));
        return sheetSort.dir === 'desc' ? -cmp : cmp;
      })
    : _unsortedSheetRows;

  // All visible cols = (base - hidden) + formula; labels respect renames
  const allCols: AnswerColDef[] = [
    ...sheetCols
      .filter(c => !hiddenCols.has(c.key))
      .map(c => {
        const base = colRenames[c.key] ? { ...c, label: colRenames[c.key] } : c;
        const agg = colAggregates[c.key];
        return isMeasureCol(base) && agg ? { ...base, label: `${base.label} (${agg})` } : base;
      }),
    ...formulaCols.map(f => ({
      key: f.key,
      label: colRenames[f.key] ?? f.name,
      width: 160,
    })),
  ];

  // Auto-enter edit on row 0 after a new custom column's name is committed
  useEffect(() => {
    const pending = pendingAutoEditKeyRef.current;
    if (!pending?.endsWith(':ready')) return;
    const colKey = pending.replace(':ready', '');
    const ci = allCols.findIndex(c => c.key === colKey);
    if (ci !== -1) {
      pendingAutoEditKeyRef.current = null;
      setEditingCell({ r: 0, c: ci });
      setEditingCellValue('');
      setTimeout(() => cellInputRef.current?.focus(), 20);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCols]);

  // All column labels for typeahead (base cols + formula cols)
  const allColLabels = [
    ...sheetCols.map(c => c.label),
    ...formulaCols.map(f => f.name),
  ];

  // Real CSV export for DataSheetToolbar's Download button — same escaping and
  // Blob/anchor approach DataStudioV2's own downloadCsv uses, over this sheet's
  // visible columns and rows. (The old inline toolbar's Export button was
  // decorative, with no handler at all.)
  const downloadCsv = () => {
    const escapeCsv = (v: unknown) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      allCols.map(c => escapeCsv(c.label)).join(','),
      ...sheetRows.map(r => allCols.map(c => escapeCsv((r as Record<string, unknown>)[c.key])).join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Column the toolbar's formatting buttons act on: the selected cell's column.
  const fmtTargetKey: string | undefined = selectedCell ? allCols[selectedCell.c]?.key : undefined;
  const applyFmt = (patch: { align?: 'left' | 'center' | 'right'; wrap?: 'overflow' | 'wrap' | 'clip'; numFmt?: string; decimals?: number; fill?: string | null }) => {
    if (!fmtTargetKey) return;
    patchColFmt(fmtTargetKey, patch);
  };
  // Format paint: first click arms it with the current column's formatting,
  // second click (on another column's cell) copies that formatting across.
  const handleFormatPaint = () => {
    if (formatPaintSrc) { setFormatPaintSrc(null); return; }
    if (!fmtTargetKey) return;
    setFormatPaintSrc(fmtTargetKey);
  };
  // Called from the grid when a cell is clicked while paint is armed.
  const paintOnto = (colKey: string) => {
    if (!formatPaintSrc || colKey === formatPaintSrc) { setFormatPaintSrc(null); return; }
    pushFmt({ ...colFormats, [colKey]: { ...(colFormats[formatPaintSrc] ?? {}) } });
    setFormatPaintSrc(null);
  };

  // Formula function catalogue shown on `=` trigger
  const FORMULA_FUNCTIONS: { name: string; syntax: string; description: string }[] = [
    { name: 'SUM',          syntax: 'SUM(number1, [number2], …)',             description: 'Adds all numbers in a range' },
    { name: 'AVERAGE',      syntax: 'AVERAGE(number1, [number2], …)',         description: 'Returns the average of a set of values' },
    { name: 'COUNT',        syntax: 'COUNT(value1, [value2], …)',             description: 'Counts cells that contain numbers' },
    { name: 'COUNTA',       syntax: 'COUNTA(value1, [value2], …)',            description: 'Counts non-empty cells' },
    { name: 'MAX',          syntax: 'MAX(number1, [number2], …)',             description: 'Returns the largest value' },
    { name: 'MIN',          syntax: 'MIN(number1, [number2], …)',             description: 'Returns the smallest value' },
    { name: 'IF',           syntax: 'IF(condition, value_if_true, value_if_false)', description: 'Returns one of two values based on a condition' },
    { name: 'IFS',          syntax: 'IFS(condition1, value1, [condition2, value2], …)', description: 'Checks multiple conditions in order' },
    { name: 'ROUND',        syntax: 'ROUND(number, num_digits)',              description: 'Rounds a number to a given precision' },
    { name: 'ROUNDUP',      syntax: 'ROUNDUP(number, num_digits)',            description: 'Rounds a number up, away from zero' },
    { name: 'ROUNDDOWN',    syntax: 'ROUNDDOWN(number, num_digits)',          description: 'Rounds a number down, toward zero' },
    { name: 'ABS',          syntax: 'ABS(number)',                            description: 'Returns the absolute value' },
    { name: 'POWER',        syntax: 'POWER(number, power)',                   description: 'Raises a number to a given power' },
    { name: 'SQRT',         syntax: 'SQRT(number)',                           description: 'Returns the square root' },
    { name: 'MOD',          syntax: 'MOD(number, divisor)',                   description: 'Returns the remainder after division' },
    { name: 'CONCAT',       syntax: 'CONCAT(text1, [text2], …)',              description: 'Joins text strings together' },
    { name: 'LEFT',         syntax: 'LEFT(text, [num_chars])',                description: 'Returns the leftmost characters of a string' },
    { name: 'RIGHT',        syntax: 'RIGHT(text, [num_chars])',               description: 'Returns the rightmost characters of a string' },
    { name: 'MID',          syntax: 'MID(text, start_num, num_chars)',        description: 'Returns a substring from the middle' },
    { name: 'LEN',          syntax: 'LEN(text)',                              description: 'Returns the length of a text string' },
    { name: 'UPPER',        syntax: 'UPPER(text)',                            description: 'Converts text to uppercase' },
    { name: 'LOWER',        syntax: 'LOWER(text)',                            description: 'Converts text to lowercase' },
    { name: 'TRIM',         syntax: 'TRIM(text)',                             description: 'Removes extra spaces from text' },
    { name: 'SUBSTITUTE',   syntax: 'SUBSTITUTE(text, old_text, new_text)',   description: 'Replaces occurrences of a substring' },
    { name: 'FIND',         syntax: 'FIND(find_text, within_text)',           description: 'Finds the position of a substring' },
    { name: 'ISNUMBER',     syntax: 'ISNUMBER(value)',                        description: 'Returns TRUE if value is a number' },
    { name: 'ISBLANK',      syntax: 'ISBLANK(value)',                         description: 'Returns TRUE if value is blank' },
    { name: 'ISTEXT',       syntax: 'ISTEXT(value)',                          description: 'Returns TRUE if value is text' },
    { name: 'AND',          syntax: 'AND(logical1, [logical2], …)',           description: 'Returns TRUE if all conditions are true' },
    { name: 'OR',           syntax: 'OR(logical1, [logical2], …)',            description: 'Returns TRUE if any condition is true' },
    { name: 'NOT',          syntax: 'NOT(logical)',                           description: 'Reverses the logic of its argument' },
    { name: 'TODAY',        syntax: 'TODAY()',                                description: 'Returns today\'s date' },
    { name: 'NOW',          syntax: 'NOW()',                                  description: 'Returns the current date and time' },
    { name: 'YEAR',         syntax: 'YEAR(date)',                             description: 'Returns the year from a date' },
    { name: 'MONTH',        syntax: 'MONTH(date)',                            description: 'Returns the month from a date' },
    { name: 'DAY',          syntax: 'DAY(date)',                              description: 'Returns the day of the month from a date' },
    { name: 'DATEVALUE',    syntax: 'DATEVALUE(date_text)',                   description: 'Converts a date string to a date value' },
    { name: 'SUMIF',        syntax: 'SUMIF(range, criteria, [sum_range])',    description: 'Sums cells that meet a condition' },
    { name: 'AVERAGEIF',    syntax: 'AVERAGEIF(range, criteria, [avg_range])',description: 'Averages cells that meet a condition' },
    { name: 'COUNTIF',      syntax: 'COUNTIF(range, criteria)',               description: 'Counts cells that meet a condition' },
    { name: 'VLOOKUP',      syntax: 'VLOOKUP(lookup_value, table_array, col_index, [range_lookup])', description: 'Searches vertically in a table' },
  ];

  // Determine if fxInput is in function-suggestion mode (starts with = or typed prefix after =)
  const fxIsFnMode = fxInput.startsWith('=') || fxInput === '';
  const fnQuery = fxInput.startsWith('=') ? fxInput.slice(1).trim().toUpperCase() : '';
  const fnSuggestions = fxFocus && (fxInput === '=' || fnQuery)
    ? FORMULA_FUNCTIONS.filter(f => f.name.startsWith(fnQuery) || f.name.includes(fnQuery)).slice(0, 8)
    : [];

  // Max 2 column suggestions (only when not in fn mode)
  const fxSuggestions = fxFocus && !fxIsFnMode
    ? (fxInput.trim()
        ? allColLabels.filter(l => l.toLowerCase().includes(fxInput.toLowerCase()))
        : allColLabels
      ).slice(0, 2)
    : [];

  // Append a token (column ref or infer operator from raw text) to active formula
  const appendFormulaToken = (token: FToken) => {
    if (!activeFormulaKey) return;
    setFormulaCols(cols => cols.map(c =>
      c.key === activeFormulaKey ? { ...c, tokens: [...c.tokens, token] } : c
    ));
  };

  // Normalize typed text to the matching column label (case-insensitive)
  const resolveColLabel = (typed: string): string => {
    const lower = typed.trim().toLowerCase();
    return allColLabels.find(l => l.toLowerCase() === lower) ?? typed.trim();
  };

  // Parse raw formula text like "=Revenue + Profit * 2" into FToken[]
  const parseFormulaText = (raw: string): FToken[] => {
    const text = raw.replace(/^=/, '').trim();
    if (!text) return [];
    const parts = text.split(/([+\-*/])/);
    const tokens: FToken[] = [];
    for (const part of parts) {
      const p = part.trim();
      if (!p) continue;
      if (['+', '-', '*', '/'].includes(p)) {
        tokens.push({ kind: 'op', value: p });
      } else {
        const num = Number(p);
        if (!isNaN(num) && p !== '') {
          tokens.push({ kind: 'num', value: p });
        } else {
          tokens.push({ kind: 'col', label: resolveColLabel(p) });
        }
      }
    }
    return tokens;
  };

  // Evaluate tokens against all rows and store computed values
  const commitFormula = (fkey: string, tokens: FToken[], pendingText: string) => {
    // Flush any pending text input as a col token first (normalize label)
    const finalTokens = pendingText.trim()
      ? [...tokens, { kind: 'col' as const, label: resolveColLabel(pendingText) }]
      : tokens;

    // Empty formula → clear computed values and stop
    if (finalTokens.length === 0) {
      setFormulaValues(prev => ({ ...prev, [fkey]: [] }));
      return;
    }

    // Build case-insensitive label → key lookup across base + formula cols
    const labelToKey: Record<string, string> = {};
    for (const col of sheetCols) labelToKey[col.label.toLowerCase()] = col.key;
    for (const fc of formulaCols) labelToKey[fc.name.toLowerCase()] = fc.key;

    const computed = sheetRows.map(row => {
      // Reduce tokens left-to-right: [num, op, num, op, num ...]
      let result: number | null = null;
      let pendingOp: string | null = null;
      for (const tok of finalTokens) {
        if (tok.kind === 'col' || tok.kind === 'num') {
          const val = tok.kind === 'num'
            ? Number(tok.value)
            : (() => {
                const key = labelToKey[tok.label.toLowerCase()];
                const raw = key != null ? row[key] : null;
                const n = raw != null && raw !== '' ? Number(raw) : NaN;
                return isNaN(n) ? 0 : n;
              })();
          if (result === null) {
            result = val;
          } else if (pendingOp) {
            if (pendingOp === '+') result += val;
            else if (pendingOp === '-') result -= val;
            else if (pendingOp === '*') result *= val;
            else if (pendingOp === '/') result = val !== 0 ? result / val : 0;
            pendingOp = null;
          }
        } else {
          pendingOp = tok.value;
        }
      }
      return result;
    });

    setFormulaValues(prev => ({ ...prev, [fkey]: computed }));
    // If there was pending text, flush it into the token list too
    if (pendingText.trim()) {
      setFormulaCols(cols => cols.map(c =>
        c.key === fkey ? { ...c, tokens: finalTokens } : c
      ));
    }
    setFxInput('');
  };

  // Insert column token from typeahead
  const selectSuggestion = (label: string) => {
    appendFormulaToken({ kind: 'col', label });
    setFxInput('');
    fxRef.current?.focus();
  };

  const selectFnSuggestion = (fnName: string) => {
    setFxInput(`=${fnName}(`);
    setTimeout(() => {
      fxRef.current?.focus();
      const len = `=${fnName}(`.length;
      fxRef.current?.setSelectionRange(len, len);
    }, 0);
  };

  // Commit a cell edit — resolves pending column type on exit
  const commitCellEdit = (colKey: string, value: string, isPending: boolean, rowIndex: number) => {
    const isFormulaNow = value.startsWith('=');
    const isFormula = colKey.startsWith('__formula_');
    let resolvedKey = colKey;

    if (isPending) {
      resolvedKey = isFormulaNow
        ? colKey.replace('__pending_', '__formula_')
        : colKey.replace('__pending_', '__custom_');
      setFormulaCols(cols => cols.map(c => c.key === colKey ? { ...c, key: resolvedKey } : c));
    } else if (isFormula && !isFormulaNow) {
      // User manually typed a non-formula value — convert formula col → custom col
      resolvedKey = colKey.replace('__formula_', '__custom_');
      setFormulaCols(cols => cols.map(c => c.key === colKey ? { ...c, key: resolvedKey, tokens: [] } : c));
      setFormulaRawText(prev => { const n = { ...prev }; delete n[colKey]; return n; });
      // Preserve formula-computed values for all other rows as custom cell values
      const existingFormulaVals = formulaValues[colKey] ?? [];
      const seededCustomVals: Record<number, string> = {};
      existingFormulaVals.forEach((v, i) => { if (v !== null) seededCustomVals[i] = String(v); });
      seededCustomVals[rowIndex] = value;
      setCustomCellValues(prev => ({ ...prev, [resolvedKey]: seededCustomVals }));
      setFormulaValues(prev => { const n = { ...prev }; delete n[colKey]; return n; });
      return;
    }

    if (isFormulaNow) {
      const tokens = parseFormulaText(value);
      setFormulaRawText(prev => ({ ...prev, [resolvedKey]: value }));
      setFormulaCols(cols => cols.map(c => c.key === resolvedKey ? { ...c, tokens } : c));
      commitFormula(resolvedKey, tokens, '');
    } else {
      setCustomCellValues(prev => ({
        ...prev,
        [resolvedKey]: { ...(prev[resolvedKey] ?? {}), [rowIndex]: value },
      }));
    }
  };

  // Commit an inline rename
  const commitRename = () => {
    if (!renamingCol) return;
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenamingCol(null); return; }
    if (renamingCol.startsWith('__formula_') || renamingCol.startsWith('__custom_') || renamingCol.startsWith('__pending_')) {
      setFormulaCols(cols => cols.map(c => c.key === renamingCol ? { ...c, name: trimmed } : c));
    } else {
      setColRenames(prev => ({ ...prev, [renamingCol]: trimmed }));
    }
    if (pendingAutoEditKeyRef.current === renamingCol) {
      pendingAutoEditKeyRef.current = renamingCol + ':ready';
    }
    setRenamingCol(null);
  };

  // Handle keydown in formula input
  const handleFxKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['+', '-', '*', '/'].includes(e.key)) {
      // flush current text as col token if any, then add operator
      if (fxInput.trim()) {
        appendFormulaToken({ kind: 'col', label: resolveColLabel(fxInput) });
        setFxInput('');
      }
      appendFormulaToken({ kind: 'op', value: e.key });
      e.preventDefault();
    }
    // Backspace on empty input → delete the last token
    if (e.key === 'Backspace' && fxInput === '' && activeFormulaKey && activeFormula && activeFormula.tokens.length > 0) {
      const newTokens = activeFormula.tokens.slice(0, -1);
      setFormulaCols(cols => cols.map(c => c.key === activeFormulaKey ? { ...c, tokens: newTokens } : c));
      commitFormula(activeFormulaKey, newTokens, '');
      e.preventDefault();
    }
    if (e.key === 'Enter') {
      if (activeFormulaKey && activeFormula) {
        commitFormula(activeFormulaKey, activeFormula.tokens, fxInput);
      }
      e.preventDefault();
    }
    if (e.key === 'Escape') {
      setFxInput('');
      setFxFocus(false);
    }
  };

  const handleColMenu = (action: string, colKey: string) => {
    setColMenuKey(null);
    setColDataTypeSubmenuKey(null);
    const isFormula = colKey.startsWith('__formula_');
    const isPendingCol = colKey.startsWith('__pending_');

    if (action === 'formula' || action === 'add-col') {
      const n = formulaCols.length + 1;
      const newKey = `__formula_${n}`;
      const newName = `Formula ${n}`;
      setFormulaCols(cols => [...cols, { key: newKey, name: newName, tokens: [] }]);
      setActiveFormulaKey(newKey);
      setFxInput('');
      setTimeout(() => {
        setSelectedCell({ r: 0, c: allCols.length });
        fxRef.current?.focus();
      }, 50);
    }

    if (action === 'delete' || action === 'hide') {
      if (isFormula || isPendingCol) {
        // Remove formula/pending column and its computed values entirely
        setFormulaCols(cols => cols.filter(c => c.key !== colKey));
        setFormulaValues(prev => { const n = { ...prev }; delete n[colKey]; return n; });
        if (activeFormulaKey === colKey) setActiveFormulaKey(null);
      } else if (colKey.startsWith('__custom_')) {
        setFormulaCols(cols => cols.filter(c => c.key !== colKey));
        setFormulaValues(prev => { const n = { ...prev }; delete n[colKey]; return n; });
      } else {
        // Hide base data column from view
        setHiddenCols(prev => new Set([...prev, colKey]));
      }
    }

    if (action === 'rename') {
      const currentLabel = colRenames[colKey]
        ?? ((isFormula || isPendingCol) ? formulaCols.find(f => f.key === colKey)?.name : allCols.find(c => c.key === colKey)?.label)
        ?? '';
      setRenamingCol(colKey);
      setRenameValue(currentLabel);
      setTimeout(() => renameInputRef.current?.select(), 30);
    }

    if (action === 'filter') {
      // Opens the column-picker step of the "Add filter" modal.
      setAddFilterStep('column');
      setAddFilterColKey(null);
      setAddFilterValue(null);
      setAddFilterValueSearch('');
      setAddFilterSaveToModel(false);
      setAddFilterSearch('');
      setAddFilterModalOpen(true);
    }
  };

  // Remove the filter from a column
  const removeColFilter = (colKey: string) => {
    setFilteredColKeys(prev => { const n = new Set(prev); n.delete(colKey); return n; });
    setFilterMenuKey(null);
  };

  return (
  <>
  <div
    className={`${styles.sheetWrap} ${expanded ? styles.sheetExpandedOverlay : ''}`}
    style={expanded ? style : { position: 'relative', ...style }}
    onClick={() => { setColMenuKey(null); setFilterMenuKey(null); }}
  >
    {/* ── Scrim — dims answer name + sheet area; click to commit selection.
        Covers full surface; the data panel and model control sit above via z-index. ── */}
    {expanded && dataPanelOpen && (
      <div
        style={{ position: 'absolute', left: 0, top: 56, right: 0, bottom: 0, zIndex: 150, background: 'rgba(29, 35, 47, 0.12)', cursor: 'pointer' }}
        onClick={handlePanelScrimClick}
      />
    )}
    {expanded && dataPanelOpen && (
      <div
        style={{ position: 'absolute', left: 260, top: 0, right: 0, height: 56, zIndex: 150, background: 'rgba(29, 35, 47, 0.12)', cursor: 'pointer' }}
        onClick={handlePanelScrimClick}
      />
    )}

    {/* ── Data panel overlay (expanded mode) ──────────────────────────── */}
    {expanded && dataPanelOpen && (
      <div style={{ position: 'absolute', left: 0, top: 55, bottom: 0, zIndex: 200 }}>
        <SheetDataPanel selectedKeys={dataPanelPending ?? selectedColKeys} onToggle={togglePanelCol} importedCsvGroups={importedCsvGroups} />
      </div>
    )}

    {/* ── Sub-header: model control | divider | answer name + description ── */}
    {expanded && (
      <div className={styles.sheetExpandedHeader}>
        {/* Left: model control — hamburger + divider + source name (hidden in V3 expanded) */}
        {!hideModelControl && (
          <>
            <div className={styles.sheetExpandedModelControl}>
              <button
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}
                onClick={e => { e.stopPropagation(); setDataPanelOpen(o => !o); }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 4h12M2 8h12M2 12h12" stroke="#1d232f" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
              <div style={{ width: 1, height: 24, background: 'var(--rd-sys-color-border-divider, #eaedf2)', flexShrink: 0 }} />
              <Button
                variant="tertiary"
                size="basic"
                iconPosition="trailing"
                icon={<Icon name="chevron-down" size="s" />}
                onClick={() => onOpenDataModel?.()}
                style={{ color: 'var(--rd-sys-color-content-primary, #1d232f)' }}
              >
                {activeSourceName}
              </Button>
            </div>

            {/* Vertical divider — full header height */}
            <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--rd-sys-color-border-divider, #eaedf2)', flexShrink: 0 }} />
          </>
        )}

        {/* Title + description + right actions */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, paddingRight: 24 }}>
          <div className={styles.sheetExpandedTitleGroup} style={{ flex: 1, minWidth: 0 }}>
            {titleEditing ? (
              <input
                ref={titleEditRef}
                className={styles.sheetExpandedTitleInput}
                defaultValue={title}
                autoFocus
                onBlur={e => commitTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === 'Escape')
                    commitTitle((e.target as HTMLInputElement).value);
                }}
              />
            ) : (
              <span
                className={styles.sheetExpandedTitle}
                onClick={() => { setTitleEditing(true); setTimeout(() => titleEditRef.current?.select(), 10); }}
              >
                {title}
              </span>
            )}
            {descEditing ? (
              <input
                ref={descEditRef}
                className={styles.sheetExpandedDescInput}
                defaultValue={description}
                autoFocus
                placeholder="Click to add table description"
                onBlur={e => commitDesc(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === 'Escape')
                    commitDesc((e.target as HTMLInputElement).value);
                }}
              />
            ) : (
              <span
                className={`${styles.sheetExpandedDesc} ${!description ? styles.sheetExpandedDescPlaceholder : ''}`}
                onClick={() => { setDescEditing(true); setTimeout(() => descEditRef.current?.focus(), 10); }}
              >
                {description || 'Click to add table description'}
              </span>
            )}
          </div>

          {/* Share + more + divider + Reset + Save Answer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button className={styles.circleBtn} aria-label="Share">
              <Icon name="share" size="m" color={systemColors.light['content-primary']} />
            </button>
            <div style={{ position: 'relative' }}>
              <button className={styles.circleBtn} aria-label="More options" onClick={e => { e.stopPropagation(); setSheetMoreOpen(o => !o); }}>
                <Icon name="more" size="m" color={systemColors.light['content-primary']} />
              </button>
              <MoreMenu
                open={sheetMoreOpen}
                onClose={() => setSheetMoreOpen(false)}
                onSaveInputTable={() => onOpenWritebackModal?.()}
              />
            </div>
            <div style={{ width: 1, height: 24, background: 'var(--rd-sys-color-border-divider, #eaedf2)', flexShrink: 0, margin: '0 4px' }} />
            <Button variant="tertiary" size="small">Reset</Button>
            <div style={{ width: 1, height: 20, background: 'var(--rd-sys-color-border-divider, #eaedf2)', flexShrink: 0 }} />
            <Button variant="secondary" size="small" onClick={() => onOpenSaveModal?.()}>Save Answer</Button>
          </div>
        </div>
      </div>
    )}
    {/* ── Toolbar ─────────────────────────────────────────────────
        canvasScopeMode (Option 3 Optimized): the real DataSheetToolbar —
        the same component DataStudioV2 renders, built from the ThoughtSpot
        Spreadsheet Figma glyphs. Every other option keeps the original
        inline toolbar below, untouched. */}
    {canvasScopeMode ? (
      <DataSheetToolbar
        onDownloadCsv={downloadCsv}
        onToggleExpand={hideExpandButton ? undefined : () => onExpandedChange(!expanded)}
        expanded={expanded}
        onFilter={() => handleColMenu('filter', '')}
        // Formulas are Model-scope only here (existing rule) — left inert
        // rather than invented as enabled when out of scope.
        onFormula={canAddFormula ? triggerFormulaCreate : undefined}
        onUndo={undoFmt}
        onRedo={redoFmt}
        canUndo={fmtPast.length > 0}
        canRedo={fmtFuture.length > 0}
        formatTarget={fmtTargetKey}
        onSort={dir => {
          if (!fmtTargetKey) return;
          setSheetSort(dir === 'clear' ? null : { col: fmtTargetKey, dir });
        }}
        onFormatPaint={handleFormatPaint}
        formatPaintActive={!!formatPaintSrc}
        onAlign={a => applyFmt({ align: a })}
        onWrap={w => applyFmt({ wrap: w })}
        onCurrency={() => applyFmt({ numFmt: colFormats[fmtTargetKey ?? '']?.numFmt === 'Currency' ? 'Automatic' : 'Currency' })}
        onPercent={() => applyFmt({ numFmt: colFormats[fmtTargetKey ?? '']?.numFmt === 'Percent' ? 'Automatic' : 'Percent' })}
        onDecimals={d => {
          if (!fmtTargetKey) return;
          const cur = colFormats[fmtTargetKey]?.decimals ?? 2;
          applyFmt({ decimals: Math.max(0, Math.min(6, cur + d)) });
        }}
        onNumberFormat={f => applyFmt({ numFmt: f })}
        onFillColor={c => applyFmt({ fill: c })}
      />
    ) : (
    <div className={styles.sheetToolbar}>
      {/* Undo, Redo */}
      <div className={styles.sheetTbGroup}>
        <TbBtn label="Undo">
          <svg viewBox="0 0 18 18" width={14} height={14} fill="none">
            <path d="M5 8.5h6a3 3 0 0 1 0 6H8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
            <path d="M7 5.5L4 8.5l3 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </TbBtn>
        <TbBtn label="Redo">
          <svg viewBox="0 0 18 18" width={14} height={14} fill="none">
            <path d="M13 8.5H7a3 3 0 0 0 0 6h3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
            <path d="M11 5.5l3 3-3 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </TbBtn>
      </div>
      <div className={styles.sheetTbDivider} />
      {/* Advance sorting, Conditional formatting */}
      <div className={styles.sheetTbGroup}>
        <TbBtn label="Advance sorting"><Icon name="sort" size="s" /></TbBtn>
        <TbBtn label="Conditional formatting">
          <svg viewBox="0 0 18 18" width={14} height={14} fill="none">
            <rect x="3" y="3" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth={1.4}/>
            <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth={1.2}/>
            <rect x="3" y="3" width="6" height="6" fill="currentColor" fillOpacity={0.3}/>
          </svg>
        </TbBtn>
      </div>
      <div className={styles.sheetTbDivider} />
      {/* Text alignment, Text wrapping */}
      <div className={styles.sheetTbGroup}>
        <TbBtn label="Text alignment">
          <svg viewBox="0 0 18 18" width={14} height={14} fill="none">
            <path d="M2 5h8M2 8.5h13M2 12h6" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
            <path d="M14 8l2 1.5-2 1.5" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </TbBtn>
        <TbBtn label="Text wrapping">
          <svg viewBox="0 0 18 18" width={14} height={14} fill="none">
            <path d="M2 5h14" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
            <path d="M2 9.5h9a2.5 2.5 0 0 1 0 5H8" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
            <path d="M8 12l-2.5 2.5L8 17" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </TbBtn>
      </div>
      <div className={styles.sheetTbDivider} />
      {/* Decrease decimal, Increase decimal, Number, Currency, Percent, Format */}
      <div className={styles.sheetTbGroup}>
        <TbBtn label="Decrease decimal">
          <svg viewBox="0 0 18 18" width={14} height={14}>
            <path d="M2.5 9L6 7V8.5H10V10H6V11.5z" fill="currentColor"/>
            <circle cx="12.5" cy="13.5" r="1" fill="currentColor"/>
            <rect x="11.5" y="6" width="3" height="5.5" rx="1.5" stroke="currentColor" strokeWidth={1.2} fill="none"/>
          </svg>
        </TbBtn>
        <TbBtn label="Increase decimal">
          <svg viewBox="0 0 18 18" width={14} height={14}>
            <path d="M15.5 9L12 7V8.5H8V10H12V11.5z" fill="currentColor"/>
            <circle cx="3" cy="13.5" r="1" fill="currentColor"/>
            <rect x="2" y="6" width="2.5" height="5.5" rx="1.25" stroke="currentColor" strokeWidth={1.2} fill="none"/>
            <rect x="5.5" y="6" width="2.5" height="5.5" rx="1.25" stroke="currentColor" strokeWidth={1.2} fill="none"/>
          </svg>
        </TbBtn>
        <TbBtn label="Number format">
          <svg viewBox="0 0 18 18" width={14} height={14}>
            <text x="9" y="13" textAnchor="middle" fontSize="9" fontWeight={600} fill="currentColor" fontFamily="inherit">123</text>
          </svg>
        </TbBtn>
        <TbBtn label="Currency">
          <svg viewBox="0 0 18 18" width={14} height={14}>
            <text x="9" y="14" textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor" fontFamily="inherit">$</text>
          </svg>
        </TbBtn>
        <TbBtn label="Percent">
          <svg viewBox="0 0 18 18" width={14} height={14}>
            <text x="9" y="14" textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor" fontFamily="inherit">%</text>
          </svg>
        </TbBtn>
        <TbBtn label="Format">
          <svg viewBox="0 0 18 18" width={14} height={14}>
            <text x="9" y="13" textAnchor="middle" fontSize="11" fontWeight={600} fill="currentColor" fontFamily="inherit">Aa</text>
          </svg>
        </TbBtn>
      </div>
      <div className={styles.sheetTbDivider} />
      {/* Column sizing, Style, Select columns, Style settings */}
      <div className={styles.sheetTbGroup}>
        <TbBtn label="Column sizing">
          <svg viewBox="0 0 18 18" width={14} height={14} fill="none">
            <path d="M3 4v10M15 4v10" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
            <path d="M3 9h12M6.5 7l-3.5 2 3.5 2M11.5 7l3.5 2-3.5 2" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </TbBtn>
        <TbBtn label="Style settings">
          <svg viewBox="0 0 18 18" width={14} height={14} fill="none">
            <path d="M14.5 3.5l-7 7 2 2 7-7-2-2z" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round"/>
            <path d="M7.5 10.5L4 14l1 1 3.5-3.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="3" cy="15" r="0.8" fill="currentColor"/>
          </svg>
        </TbBtn>
        {/* Column picker trigger + dropdown */}
        <div style={{ position: 'relative' }} ref={colPickerRef}>
          <TbBtn label="Select columns" onClick={() => {
            if (!colPickerOpen) {
              setColPickerSel(new Set(selectedColKeys));
              setColPickerSearch('');
            }
            setColPickerOpen(o => !o);
          }}>
            <svg viewBox="0 0 18 18" width={16} height={16} fill="none">
              <path d="M5 4v10M9 4v10M13 4v10" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
              <path d="M12 15l1.5 2 1.5-2" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </TbBtn>
          {colPickerOpen && (() => {
            // dataModelCols (prop, defaults to DATA_MODEL_COLS) — always show the full data model
            const filtered = colPickerSearch.trim()
              ? dataModelCols.filter(c => c.label.toLowerCase().includes(colPickerSearch.toLowerCase()))
              : dataModelCols;
            return (
              <div className={styles.colPickerDropdown} onMouseDown={e => e.stopPropagation()}>
                <div className={styles.colPickerSearch}>
                  <SearchInput
                    placeholder="Search columns"
                    value={colPickerSearch}
                    onChange={e => setColPickerSearch(e.target.value)}
                  />
                </div>
                <div className={styles.colPickerList}>
                  {filtered.map(col => (
                    <label key={col.key} className={styles.colPickerItem}>
                      <Checkbox
                        checked={colPickerSel.has(col.key)}
                        onChange={checked => {
                          setColPickerSel(prev => {
                            const next = new Set(prev);
                            if (checked) next.add(col.key);
                            else next.delete(col.key);
                            return next;
                          });
                        }}
                      />
                      <span className={styles.colPickerLabel}>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
        <TbBtn label="Filter columns"><Icon name="filter" size="s" /></TbBtn>
      </div>
      <div className={styles.sheetTbDivider} />
      {/* Filter, Add formula */}
      <div className={styles.sheetTbGroup}>
        <TbBtn label="Filter"><Icon name="funnel" size="s" /></TbBtn>
        <TbBtn label="Add formula" onClick={triggerFormulaCreate} disabled={!canAddFormula} disabledTooltip="Switch to Model scope to add a formula">
          <svg viewBox="0 0 18 18" width={14} height={14}>
            <text x="9" y="13" textAnchor="middle" fontSize="11" fontWeight={500} fontStyle="italic" fill="currentColor" fontFamily="serif">fx</text>
          </svg>
        </TbBtn>
      </div>
      <div className={styles.sheetTbDivider} />
      {/* View dropdown — aggregated vs row-level data */}
      <div style={{ position: 'relative' }}>
        <TbBtn label="View" onClick={() => setViewDropOpen(o => !o)}>
          <svg viewBox="0 0 18 18" width={14} height={14} fill="none">
            <rect x="3" y="3" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth={1.3}/>
            <rect x="9.5" y="3" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth={1.3}/>
            <rect x="3" y="9.5" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth={1.3}/>
            <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth={1.3}/>
          </svg>
        </TbBtn>
        {viewDropOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setViewDropOpen(false)} />
            <div className={styles.viewDropdown}>
              {(['aggregated', 'row-level'] as const).map(mode => (
                <button
                  key={mode}
                  className={styles.viewDropdownItem}
                  onClick={() => { onSheetDataViewChange(mode); setViewDropOpen(false); }}
                >
                  <span>{mode === 'row-level' ? 'Row-level data' : 'Aggregated'}</span>
                  {sheetDataView === mode && <CheckIcon />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className={styles.sheetTbDivider} />
      {/* Export to CSV / Import CSV */}
      <TbBtn label="Export to CSV"><Icon name="download" size="s" /></TbBtn>
      <TbBtn label="Import CSV" onClick={() => setCsvImportOpen(true)}>
        <svg viewBox="0 0 18 18" width={14} height={14} fill="none">
          <path d="M9 11V3M6 8l3 3 3-3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 13v1.5A1.5 1.5 0 0 0 4.5 16h9a1.5 1.5 0 0 0 1.5-1.5V13" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
        </svg>
      </TbBtn>
      {!hideExpandButton && (
        <>
          <div className={styles.sheetTbSpacer} />
          <Tooltip content={expanded ? 'Collapse' : 'Expand'} placement="top" showDelay={0}>
            <button
              className={styles.sheetTbBtn}
              aria-label={expanded ? 'Collapse' : 'Expand'}
              onClick={() => onExpandedChange(!expanded)}
            >
              {expanded ? (
                <svg viewBox="0 0 18 18" width={14} height={14} fill="none">
                  <path d="M7 3v4H3M11 3v4h4M7 15v-4H3M11 15v-4h4" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <Icon name="fullscreen" size="s" />
              )}
            </button>
          </Tooltip>
        </>
      )}
    </div>
    )}

    {/* ── Formula bar ─────────────────────────────────────────── */}
    {(() => {
      const selectedColIdx = selectedCell?.c;
      const selectedColumn = selectedColIdx != null ? allCols[selectedColIdx] : undefined;
      const selectedColLabel = selectedColumn?.label ?? '';
      const isCreating = !!activeFormula;
      // Inline cell formula editing — formula bar is a read-only mirror
      const editingFormulaCell = editingCell !== null && allCols[editingCell.c]?.key.startsWith('__formula_');
      const inlineFxColName = editingFormulaCell ? (allCols[editingCell!.c]?.label ?? '') : null;
      const colNameValue = inlineFxColName ?? (isCreating ? activeFormula!.name : selectedColLabel);
      const showPlaceholder = !colNameValue;
      return (
        <div className={`${styles.sheetFormulaBar} ${fxFocus ? styles.sheetFormulaBarFocus : ''} ${activeFormulaHasError ? styles.sheetFormulaBarError : ''}`}>
          {/* Section 1: Column / formula name — static read-only text */}
          <div className={`${styles.fbColName} ${showPlaceholder ? styles.fbColNamePlaceholder : ''}`}>
            {colNameValue || 'Formula name'}
          </div>

          <div className={styles.fbDivider} />

          {/* Section 2: fx icon — static, no interactivity */}
          <div className={styles.fbFxBox} aria-hidden>
            <FxIcon size={16} />
          </div>

          <div className={styles.fbDivider} />

          {/* Section 3: Formula text — mirrors inline cell edit OR editable via formula bar */}
          <div
            className={styles.fbFormulaInput}
            onClick={() => !editingFormulaCell && isCreating && fxRef.current?.focus()}
          >
            {/* Mirror mode: editing formula inline in cell */}
            {editingFormulaCell ? (
              <span style={{ fontSize: 13, color: 'var(--rd-sys-color-content-primary, #1d2329)', fontFamily: 'inherit' }}>
                {editingCellValue || <span style={{ color: 'var(--rd-sys-color-content-tertiary, #a0a9b4)' }}>Type your formula</span>}
              </span>
            ) : (
              <>
                {activeFormula && activeFormula.tokens.map((tok, ti) =>
                  tok.kind === 'op' ? (
                    <span key={ti} className={styles.sheetFxOp}>{tok.value}</span>
                  ) : tok.kind === 'num' ? (
                    <span key={ti} className={styles.sheetFxOp}>{tok.value}</span>
                  ) : (
                    <span key={ti} className={styles.sheetFxColToken}>{tok.label}</span>
                  )
                )}
              </>
            )}
            <input
              ref={fxRef}
              className={styles.sheetFxInput}
              value={editingFormulaCell ? '' : fxInput}
              onChange={e => !editingFormulaCell && setFxInput(e.target.value)}
              onFocus={() => {
                setFxFocus(true);
                if (activeFormulaKey) {
                  setFormulaErrorKeys(prev => { const next = new Set(prev); next.delete(activeFormulaKey); return next; });
                }
              }}
              onBlur={() => {
                setTimeout(() => setFxFocus(false), 150);
                if (activeFormulaKey && activeFormula) {
                  const valid = validateFormula(activeFormula.tokens, fxInput);
                  setFormulaErrorKeys(prev => {
                    const next = new Set(prev);
                    if (valid) next.delete(activeFormulaKey);
                    else next.add(activeFormulaKey);
                    return next;
                  });
                  if (valid) commitFormula(activeFormulaKey, activeFormula.tokens, fxInput);
                }
              }}
              onKeyDown={handleFxKey}
              placeholder={isCreating ? (activeFormula!.tokens.length === 0 && !fxInput ? 'Type your formula' : '') : 'Type your formula'}
              readOnly={!isCreating}
              spellCheck={false}
              style={{ minWidth: 4, flex: isCreating ? 1 : 'unset', width: isCreating ? undefined : 0 }}
            />
            {fnSuggestions.length > 0 && (
              <div className={styles.sheetFxDropdown} style={{ minWidth: 320 }}>
                {fnSuggestions.map(fn => (
                  <button
                    key={fn.name}
                    className={styles.sheetFxSuggestion}
                    onMouseDown={e => { e.preventDefault(); selectFnSuggestion(fn.name); }}
                  >
                    <span className={styles.sheetFxFnName}>{fn.name}</span>
                    <span className={styles.sheetFxFnDesc}>{fn.description}</span>
                  </button>
                ))}
              </div>
            )}
            {fxSuggestions.length > 0 && (
              <div className={styles.sheetFxDropdown}>
                {fxSuggestions.map(s => (
                  <button
                    key={s}
                    className={styles.sheetFxSuggestion}
                    onMouseDown={e => { e.preventDefault(); selectSuggestion(s); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    })()}

    {/* ── Grid ────────────────────────────────────────────────── */}
    <div className={styles.sheetGrid} style={{ position: 'relative' }}>
      {(colPickerLoading || externalLoading) && (
        <div className={styles.sheetColPickerLoader}>
          <DotsLoader />
        </div>
      )}
      {/* Column header row */}
      <div className={styles.sheetColHeaderRow}>
        <div className={styles.sheetRowNum} />
        {allCols.map(col => {
          const isFormula  = col.key.startsWith('__formula_');
          const isCustom   = col.key.startsWith('__custom_');
          const isRenaming = renamingCol === col.key;
          const showHeaderAccent = editableColStyle === 'header-accent' || editableColStyle === 'accent-and-tint';
          const showHeaderFill   = editableColStyle === 'header-fill';
          const headerAccentStyle: React.CSSProperties = showHeaderAccent && (isCustom || isFormula)
            ? isFormula
              ? { borderLeft: '3px solid #7c3aed', paddingLeft: 5, background: 'oklch(97% 0.015 300 / 1)' }
              : { borderLeft: '3px solid var(--rd-sys-color-content-brand, #2770ef)', paddingLeft: 5, background: 'oklch(97% 0.01 240 / 1)' }
            : showHeaderFill && (isCustom || isFormula)
              ? isFormula
                ? { background: 'oklch(95% 0.02 300 / 1)' }
                : { background: 'oklch(95% 0.015 240 / 1)' }
              : {};
          return (
            <div
              key={col.key}
              className={`${styles.sheetColHeader} ${isFormula ? styles.sheetColHeaderFormula : ''} ${isFormula && formulaErrorKeys.has(col.key) ? styles.sheetColHeaderError : ''}`}
              style={{ width: col.width ?? 140, minWidth: col.width ?? 140, ...headerAccentStyle }}
            >
              {isCustom && editableColStyle === 'header-badge' && (
                <span style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--rd-sys-color-content-brand, #2770ef)',
                  background: 'var(--rd-sys-color-background-brand-subtle, #eef3fd)',
                  borderRadius: 4, padding: '1px 5px', marginRight: 4, flexShrink: 0,
                }}>Editable</span>
              )}
              {isFormula && (
                <span style={{ flexShrink: 0, marginRight: 4, display: 'flex', alignItems: 'center', color: showHeaderFill ? '#7c3aed' : 'var(--rd-sys-color-content-secondary,#777e8b)' }}>
                  <FxIcon size={13} color="currentColor" />
                </span>
              )}
              {isCustom && (
                <span style={{ flexShrink: 0, marginRight: 4, display: 'flex', alignItems: 'center', color: showHeaderFill ? 'var(--rd-sys-color-content-brand, #2770ef)' : 'var(--rd-sys-color-content-secondary,#777e8b)' }}>
                  <svg width={13} height={13} viewBox="0 0 16 16" fill={showHeaderFill ? 'currentColor' : 'none'}>
                    <path d="M12.5 2.5a1.414 1.414 0 0 1 2 2L5 14H2v-3L12.5 2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  className={styles.sheetRenameInput}
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setRenamingCol(null);
                  }}
                  onBlur={commitRename}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.label}</span>
              )}
              {/* Filter indicator — shown when a filter is applied; opens edit/remove menu */}
              {filteredColKeys.has(col.key) && (
                <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                  <button
                    className={styles.sheetColFilterBtn}
                    aria-label={`${col.label} filter`}
                    onClick={() => setFilterMenuKey(k => k === col.key ? null : col.key)}
                  >
                    <svg width={12} height={12} viewBox="0 0 18 18" fill="none">
                      <path d="M2.5 4h13l-5 6v4l-3 1.5V10l-5-6Z" fill="currentColor" stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {filterMenuKey === col.key && (
                    <div className={styles.sheetColMenu} style={{ minWidth: 170 }}>
                      <button className={styles.sheetColMenuItem} onClick={() => { setFilterMenuKey(null); handleColMenu('filter', col.key); }}>
                        <span className={styles.sheetColMenuItemIcon}><ColMenuIcon id="filter-edit" /></span>
                        <span className={styles.sheetColMenuItemLabel}>Edit filter</span>
                      </button>
                      <button className={styles.sheetColMenuItem} onClick={() => removeColFilter(col.key)}>
                        <span className={styles.sheetColMenuItemIcon}><ColMenuIcon id="filter-remove" /></span>
                        <span className={styles.sheetColMenuItemLabel}>Remove filter</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* Clickable chevron → column menu */}
              <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button
                  className={styles.sheetColChevron}
                  aria-label={`${col.label} options`}
                  onClick={e => {
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    // Clamp into the viewport: ~210px wide menu, and flip above
                    // the chevron when there isn't room for it below.
                    const MW = 210, MH = 340;
                    const left = Math.max(8, Math.min(r.left, window.innerWidth - MW - 8));
                    const below = r.bottom + 2;
                    const top = below + MH > window.innerHeight ? Math.max(8, r.top - MH - 2) : below;
                    setColMenuPos({ left, top });
                    setColMenuKey(k => k === col.key ? null : col.key);
                  }}
                >
                  <svg viewBox="0 0 12 12" width={12} height={12} fill="none">
                    <path d="M3 4l3 4 3-4" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {colMenuKey === col.key && (
                  <div
                    className={styles.sheetColMenu}
                    style={canvasScopeMode && colMenuPos ? { position: 'fixed', left: colMenuPos.left, top: colMenuPos.top, maxHeight: '70vh', overflowY: 'auto' } : undefined}
                    onMouseLeave={() => { setColAggSubmenuKey(null); setColDataTypeSubmenuKey(null); }}
                  >
                    {/* Change data type — custom columns only, shown before all other sections */}
                    {isCustom && (
                      <>
                        <div
                          className={styles.sheetColAggRow}
                          onMouseEnter={() => setColDataTypeSubmenuKey(col.key)}
                          onMouseLeave={() => setColDataTypeSubmenuKey(null)}
                        >
                          <button className={`${styles.sheetColMenuItem} ${styles.sheetColMenuItemFlyout}`}>
                            <span className={styles.sheetColMenuItemIcon}>
                              <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                                <path d="M3 5h12M3 9h8M3 13h5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
                                <circle cx={14} cy={12} r={3} stroke="currentColor" strokeWidth={1.3}/>
                              </svg>
                            </span>
                            <span className={styles.sheetColMenuItemLabel}>Change data type</span>
                            <span className={styles.sheetColMenuChevron}>›</span>
                          </button>
                          {colDataTypeSubmenuKey === col.key && (
                            <div className={styles.sheetColAggSubmenu}>
                              {['Text', 'Integer', 'Large integer', 'Decimal', 'True/False', 'Date', 'Date_Time', 'Time'].map((dtype, di) => (
                                <React.Fragment key={dtype}>
                                  {di === 4 && <div className={styles.sheetColMenuDivider} />}
                                  <button
                                    className={`${styles.sheetColMenuItem} ${styles.sheetColMenuItemCheck}`}
                                    onClick={() => {
                                      setCustomColDataTypes(prev => ({ ...prev, [col.key]: dtype }));
                                      setColMenuKey(null);
                                      setColDataTypeSubmenuKey(null);
                                    }}
                                  >
                                    <span>{dtype}</span>
                                    {(customColDataTypes[col.key] ?? 'Text') === dtype && <CheckIcon />}
                                  </button>
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className={styles.sheetColMenuDivider} />
                      </>
                    )}
                    {COL_MENU_SECTIONS.map((section, si) => {
                      // Inject "Change aggregate" into section 0 for measure columns only
                      const items = si === 0 && isMeasureCol(col)
                        ? [...section, { id: 'change-agg', label: 'Change aggregate' }]
                        : section;
                      return (
                        <div key={si}>
                          {si > 0 && <div className={styles.sheetColMenuDivider} />}
                          {items.map(item =>
                            item.id === 'change-agg' ? (
                              <div
                                key={item.id}
                                className={styles.sheetColAggRow}
                                onMouseEnter={() => setColAggSubmenuKey(col.key)}
                              >
                                <button className={`${styles.sheetColMenuItem} ${styles.sheetColMenuItemFlyout}`}>
                                  <span className={styles.sheetColMenuItemIcon}>
                                    <svg width={18} height={18} viewBox="0 0 18 18" fill="none"><path d="M4 14V8M9 14V4M14 14v-3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/></svg>
                                  </span>
                                  <span className={styles.sheetColMenuItemLabel}>{item.label}</span>
                                  <span className={styles.sheetColMenuChevron}>›</span>
                                </button>
                                {colAggSubmenuKey === col.key && (
                                  <div className={styles.sheetColAggSubmenu}>
                                    {AGGREGATE_OPTIONS.map(agg => (
                                      <button
                                        key={agg}
                                        className={`${styles.sheetColMenuItem} ${styles.sheetColMenuItemCheck}`}
                                        onClick={() => {
                                          setColAggregates(prev => ({ ...prev, [col.key]: agg }));
                                          setColMenuKey(null);
                                          setColAggSubmenuKey(null);
                                        }}
                                      >
                                        <span>{agg}</span>
                                        {colAggregates[col.key] === agg && <CheckIcon />}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                key={item.id}
                                className={styles.sheetColMenuItem}
                                disabled={item.id === 'formula' && !canAddFormula}
                                title={item.id === 'formula' && !canAddFormula ? 'Switch to Model scope to add a formula' : undefined}
                                style={item.id === 'formula' && !canAddFormula ? { cursor: 'not-allowed', color: 'var(--rd-sys-color-content-tertiary, #C0C6CF)' } : undefined}
                                onClick={() => { if (item.id === 'formula' && !canAddFormula) return; handleColMenu(item.id, col.key); }}
                              >
                                <span className={styles.sheetColMenuItemIcon}><ColMenuIcon id={item.id} /></span>
                                <span className={styles.sheetColMenuItemLabel}>{item.label}</span>
                              </button>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div className={styles.sheetAddCol}>
          <button
            className={styles.sheetAddColBtn}
            data-tooltip="Add new column"
            onClick={() => {
              const n = formulaCols.length + 1;
              const newKey = `__pending_${n}`;
              setFormulaCols(cols => [...cols, { key: newKey, name: 'Column name', tokens: [] }]);
              setRenamingCol(newKey);
              setRenameValue('Column name');
              setTimeout(() => { renameInputRef.current?.select(); }, 30);
              pendingAutoEditKeyRef.current = newKey;
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Data rows */}
      <div className={styles.sheetDataArea}>
        {emptyMode && allCols.length === 0
          ? Array.from({ length: 60 }, (_, ri) => (
              <div key={ri} className={ri % 2 === 0 ? styles.sheetRow : styles.sheetRowAlt}>
                <div className={styles.sheetRowNum}>{ri + 1}</div>
                <div className={styles.sheetCellFlex} />
              </div>
            ))
          : sheetRows.map((row, ri) => (
          <div key={ri} className={ri % 2 === 0 ? styles.sheetRow : styles.sheetRowAlt}>
            <div className={styles.sheetRowNum}>{ri + 1}</div>
            {allCols.map((col, ci) => {
              const isSelected = selectedCell?.r === ri && selectedCell?.c === ci;
              const isHovered  = !isSelected && hoveredCell?.r === ri && hoveredCell?.c === ci;
              const isFormula  = col.key.startsWith('__formula_');
              const isCustom   = col.key.startsWith('__custom_');
              const isPendingC = col.key.startsWith('__pending_');
              const isEditable = isCustom || isPendingC;
              const isEditing  = (isEditable || isFormula) && editingCell?.r === ri && editingCell?.c === ci;
              const val = (isFormula || isEditable) ? null : row[col.key];
              const formulaResult = isFormula ? (formulaValues[col.key]?.[ri] ?? null) : null;
              const customVal = isEditable ? (customCellValues[col.key]?.[ri] ?? '') : '';
              // Column formatting from the toolbar (Optimized). numFmt/decimals
              // re-render the value; align/wrap/fill are applied as styles below.
              const cf = colFormats[col.key];
              const fmtValue = (raw: unknown): string | null => {
                if (!cf?.numFmt || cf.numFmt === 'Automatic') return null;
                const n = Number(raw);
                const d = cf.decimals ?? 2;
                if (cf.numFmt === 'Date') return raw == null || raw === '' ? '' : String(raw);
                if (Number.isNaN(n) || raw === '' || raw == null) return null;
                if (cf.numFmt === 'Currency') return `$${n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`;
                if (cf.numFmt === 'Percent') return `${(n * 100).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
                if (cf.numFmt === 'Number') return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
                return null;
              };
              const _baseRendered = isFormula
                ? (formulaResult != null ? String(Math.round(formulaResult * 100) / 100) : '')
                : isEditable ? customVal
                : (col.render ? col.render(val) : val != null ? String(val) : '');
              const rendered = (!isFormula && !isEditable ? fmtValue(val) : null) ?? _baseRendered;
              const _rowCanvasBg = ri % 2 === 0
                ? 'var(--rd-sys-color-background-base, #fff)'
                : 'var(--rd-sys-color-background-sunken, #f6f8fa)';
              void _rowCanvasBg;
              const showCellTint = editableColStyle === 'cell-tint' || editableColStyle === 'accent-and-tint';
              const cellTintStyle: React.CSSProperties = (isEditable || isFormula) && !isEditing && showCellTint
                ? isFormula
                  ? { background: ri % 2 === 0 ? 'oklch(97.5% 0.012 300 / 1)' : 'oklch(95.5% 0.012 300 / 1)' }
                  : { background: ri % 2 === 0 ? 'oklch(97.5% 0.012 240 / 1)' : 'oklch(95.5% 0.012 240 / 1)' }
                : {};
              const hoverIndicatorStyle: React.CSSProperties = (isEditable && isHovered && !isEditing && editableColStyle === 'hover-indicator')
                ? { boxShadow: 'inset 0 0 0 1.5px var(--rd-sys-color-content-brand, #2770ef)' }
                : {};
              const cursorStyle: React.CSSProperties = isEditable && !isEditing
                ? { cursor: editableColStyle === 'cursor-placeholder' || editableColStyle === 'hover-indicator' ? 'text' : 'default' }
                : {};
              const showPlaceholder = isEditable && !isEditing && !customVal && isHovered && editableColStyle === 'cursor-placeholder';
              return (
                <div
                  key={col.key}
                  className={[
                    styles.sheetCell,
                    isEditing  ? styles.sheetCellEditing  : '',
                    !isEditing && isSelected ? styles.sheetCellSelected : '',
                    !isEditing && isHovered  ? styles.sheetCellHovered  : '',
                  ].join(' ')}
                  style={{
                    width: col.width ?? 140,
                    minWidth: col.width ?? 140,
                    textAlign: cf?.align ?? (col.align === 'right' ? 'right' : 'left'),
                    paddingRight: col.align === 'right' ? 10 : undefined,
                    padding: isEditing ? 0 : undefined,
                    position: 'relative',
                    overflow: isEditing ? 'visible' : 'hidden',
                    // Toolbar column formatting (Optimized): wrap + fill.
                    ...(cf?.wrap === 'wrap' ? { whiteSpace: 'normal' as const, wordBreak: 'break-word' as const } : {}),
                    ...(cf?.wrap === 'clip' ? { whiteSpace: 'nowrap' as const, textOverflow: 'clip' as const } : {}),
                    ...(cf?.fill ? { background: cf.fill } : {}),
                    ...cellTintStyle,
                    ...hoverIndicatorStyle,
                    ...cursorStyle,
                  }}
                  onMouseEnter={() => setHoveredCell({ r: ri, c: ci })}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => {
                    if (formatPaintSrc) { paintOnto(col.key); }
                    setSelectedCell({ r: ri, c: ci });
                    if (isFormula) {
                      const fc = formulaCols.find(f => f.key === col.key);
                      if (fc) { setActiveFormulaKey(fc.key); setTimeout(() => fxRef.current?.focus(), 30); }
                    }
                  }}
                  onDoubleClick={() => {
                    if (isEditable) {
                      setEditingCell({ r: ri, c: ci });
                      setEditingCellValue(customVal);
                      setTimeout(() => cellInputRef.current?.focus(), 20);
                    } else if (isFormula) {
                      if (formulaRawText[col.key]) {
                        // Formula established — confirm before overriding
                        setFormulaEditConfirm({ r: ri, c: ci, colKey: col.key });
                      } else {
                        // No formula yet — let user type directly in the cell
                        setEditingCell({ r: ri, c: ci });
                        setEditingCellValue('');
                        setTimeout(() => cellInputRef.current?.focus(), 20);
                      }
                    }
                  }}
                >
                  {isEditing ? (() => {
                    // Suggestions: function list when value starts with =, column list otherwise
                    const isEditingFormula = isFormula || editingCellValue.startsWith('=');
                    const cellFnQuery = editingCellValue.startsWith('=')
                      ? editingCellValue.replace(/^=/, '').split(/[+\-*/()\s,]/).pop()?.trim().toUpperCase() ?? ''
                      : '';
                    const cellFnSuggestions = editingCellValue.startsWith('=') && cellFnQuery && /^[A-Z]/.test(cellFnQuery)
                      ? FORMULA_FUNCTIONS.filter(f => f.name.startsWith(cellFnQuery)).slice(0, 8)
                      : editingCellValue === '='
                        ? FORMULA_FUNCTIONS.slice(0, 8)
                        : [];
                    const currentWord = isEditingFormula
                      ? editingCellValue.replace(/^=/, '').split(/[+\-*/()]/).pop()?.trim() ?? ''
                      : '';
                    const cellSuggestions = cellFnSuggestions.length === 0 && isEditingFormula && currentWord
                      ? allColLabels.filter(l => l.toLowerCase().includes(currentWord.toLowerCase())).slice(0, 5)
                      : [];


                    return (
                      <>
                        <input
                          ref={cellInputRef}
                          style={{
                            width: '100%', height: '100%', border: 'none', outline: 'none',
                            padding: '0 8px', fontSize: 'inherit', fontFamily: 'inherit',
                            background: 'transparent', color: 'var(--rd-sys-color-content-primary, #1d2329)',
                          }}
                          value={editingCellValue}
                          onChange={e => setEditingCellValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === 'Tab') {
                              commitCellEdit(col.key, editingCellValue, isPendingC, ri);
                              setEditingCell(null);
                              e.preventDefault();
                            }
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          onBlur={() => {
                            commitCellEdit(col.key, editingCellValue, isPendingC, ri);
                            setEditingCell(null);
                          }}
                          onClick={e => e.stopPropagation()}
                        />
                        {cellFnSuggestions.length > 0 && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, zIndex: 300,
                            background: 'var(--rd-sys-color-background-base, #fff)',
                            border: '1px solid var(--rd-sys-color-border-default, #e2e5eb)',
                            borderRadius: 6, boxShadow: '0 4px 16px rgba(25,35,49,0.12)',
                            minWidth: 300, overflow: 'hidden',
                          }}>
                            {cellFnSuggestions.map((fn, fi) => (
                              <div
                                key={fn.name}
                                style={{
                                  display: 'flex', flexDirection: 'column', gap: 2,
                                  padding: '8px 14px', cursor: 'pointer',
                                  borderTop: fi > 0 ? '1px solid var(--rd-sys-color-border-subtle, #eaedf2)' : 'none',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--rd-sys-color-background-subtle, #f5f7fa)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                onMouseDown={e => {
                                  e.preventDefault();
                                  // Replace current token with function call
                                  const before = editingCellValue.replace(/[A-Z]+$/, '');
                                  setEditingCellValue(before + fn.name + '(');
                                  setTimeout(() => cellInputRef.current?.focus(), 10);
                                }}
                              >
                                <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'monospace', color: 'var(--rd-sys-color-content-brand, #2770ef)' }}>{fn.name}</span>
                                <span style={{ fontSize: 11, color: 'var(--rd-sys-color-content-secondary, #6b7280)' }}>{fn.description}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {cellSuggestions.length > 0 && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, zIndex: 300,
                            background: 'var(--rd-sys-color-background-base, #fff)',
                            border: '1px solid var(--rd-sys-color-border-default, #e2e5eb)',
                            borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
                            minWidth: 160, padding: '4px 0',
                          }}>
                            {cellSuggestions.map(s => (
                              <div
                                key={s}
                                style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: 'var(--rd-sys-color-content-primary, #1d2329)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--rd-sys-color-background-subtle, #f5f7fa)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                onMouseDown={e => {
                                  e.preventDefault();
                                  const prefix = editingCellValue.replace(/^=/, '');
                                  const parts = prefix.split(/([+\-*/()])/);
                                  parts[parts.length - 1] = s;
                                  setEditingCellValue('=' + parts.join(''));
                                  setTimeout(() => cellInputRef.current?.focus(), 10);
                                }}
                              >
                                {s}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })() : (
                    <>
                      {rendered}
                      {isEditable && isHovered && !rendered && editableColStyle === 'hover-indicator' && (
                        <svg style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', opacity: 0.45 }} width={12} height={12} viewBox="0 0 16 16" fill="none">
                          <path d="M11.5 2.5a1.5 1.5 0 0 1 2.121 2.121l-9 9L2 14l.379-2.621 9.121-9z" stroke="var(--rd-sys-color-content-brand,#2770ef)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {showPlaceholder && (
                        <span style={{ color: 'var(--rd-sys-color-content-secondary, #9aa0ab)', fontSize: 12, pointerEvents: 'none' }}>Add value</span>
                      )}
                      {isPendingC && isEditing && !editingCellValue && (
                        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--rd-sys-color-content-tertiary, #a0a9b4)', fontSize: 12, pointerEvents: 'none' }}>Type = for formula</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            <div className={styles.sheetCellFlex} />
          </div>
        ))}
      </div>
    </div>

    {/* ── Pagination ──────────────────────────────────────────── */}
    <div className={styles.sheetPagination}>
      <div className={styles.sheetPagNav}>
        <button className={styles.sheetPagBtn} aria-label="First page">
          <svg viewBox="0 0 18 18" width={16} height={16} fill="none"><path d="M11 5L7 9l4 4M6 5v8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button className={styles.sheetPagBtn} aria-label="Previous page">
          <svg viewBox="0 0 18 18" width={16} height={16} fill="none"><path d="M11 5L7 9l4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      <div className={styles.sheetPagCenter}>
        <span className={styles.sheetPagLabel}>Page</span>
        <input className={styles.sheetPagInput} defaultValue="1" readOnly />
        <span className={styles.sheetPagLabel}>of 412</span>
      </div>
      <div className={styles.sheetPagNav}>
        <button className={styles.sheetPagBtn} aria-label="Next page">
          <svg viewBox="0 0 18 18" width={16} height={16} fill="none"><path d="M7 5l4 4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button className={styles.sheetPagBtn} aria-label="Last page">
          <svg viewBox="0 0 18 18" width={16} height={16} fill="none"><path d="M7 5l4 4-4 4M12 5v8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      <span className={styles.sheetPagRows}>
        <span style={{ color: 'var(--rd-sys-color-content-secondary, #777e8b)' }}>Showing rows </span>
        <span style={{ fontWeight: 500 }}>{sheetRows.length > 0 ? `1-${sheetRows.length} of ${sheetRows.length}` : '0 rows'}</span>
      </span>
    </div>
    <CsvImportModal open={csvImportOpen} onClose={() => setCsvImportOpen(false)} onImport={handleImportCsv} />

    {/* ── Add filter modal — column picker → value picker ── */}
    {(() => {
      const filterColLabel = allCols.find(c => c.key === addFilterColKey)?.label ?? '';
      const distinctValues = addFilterColKey
        ? Array.from(new Set(sheetRows.map(r => String((r as Record<string, unknown>)[addFilterColKey] ?? '')))).filter(v => v !== '')
        : [];
      const filteredValues = distinctValues.filter(v =>
        !addFilterValueSearch.trim() || v.toLowerCase().includes(addFilterValueSearch.trim().toLowerCase())
      );

      const applyFilter = () => {
        if (!addFilterColKey || !addFilterValue) return;
        setFilteredColKeys(prev => new Set([...prev, addFilterColKey]));
        if (addFilterSaveToModel) {
          (window as any)._addModelFilter?.({ col: filterColLabel || addFilterColKey, val: addFilterValue });
        }
        setAddFilterModalOpen(false);
      };

      return (
        <Modal
          isOpen={addFilterModalOpen}
          onClose={() => setAddFilterModalOpen(false)}
          title="Add filter"
          size="M1"
          footer={
            addFilterStep === 'column' ? (
              <Button variant="secondary" onClick={() => setAddFilterModalOpen(false)}>Cancel</Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setAddFilterModalOpen(false)}>Cancel</Button>
                <Button variant="primary" disabled={!addFilterValue} onClick={applyFilter}>Add filter</Button>
              </>
            )
          }
        >
          {addFilterStep === 'column' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <SearchInput
                placeholder="Search columns"
                value={addFilterSearch}
                onChange={e => setAddFilterSearch(e.target.value)}
              />
              <div>
                <Typography variant="content-label-subhead" as="div" style={{ marginBottom: 'var(--spacing-2)' }}>Column</Typography>
                <div style={{ border: '1px solid var(--rd-sys-color-border-divider)', borderRadius: 'var(--radius-md)', maxHeight: 320, overflowY: 'auto' }}>
                  <div style={{ padding: 'var(--spacing-2) var(--spacing-3)', background: 'var(--rd-sys-color-background-subtle)' }}>
                    <Typography variant="caption" color="gray" as="div" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {activeSourceName}
                    </Typography>
                  </div>
                  {allCols
                    .filter(c => !addFilterSearch.trim() || c.label.toLowerCase().includes(addFilterSearch.trim().toLowerCase()))
                    .map((c, i, arr) => (
                      <React.Fragment key={c.key}>
                        <button
                          type="button"
                          onClick={() => {
                            setAddFilterColKey(c.key);
                            setAddFilterValue(null);
                            setAddFilterValueSearch('');
                            setAddFilterStep('value');
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                            padding: 'var(--spacing-3)', background: 'transparent', border: 'none', cursor: 'pointer',
                            font: 'inherit', color: 'var(--rd-sys-color-content-primary)', textAlign: 'left',
                          }}
                        >
                          <span>{c.label}</span>
                          <Icon name="chevron-right" size="s" color="var(--rd-sys-color-content-secondary)" />
                        </button>
                        {i < arr.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <button
                type="button"
                onClick={() => setAddFilterStep('column')}
                style={{ display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--rd-sys-color-content-secondary)' }}
              >
                <Icon name="chevron-left" size="xs" color="var(--rd-sys-color-content-secondary)" />
                <Typography variant="footnote" as="span">{filterColLabel}</Typography>
              </button>
              <SearchInput
                placeholder="Search values"
                value={addFilterValueSearch}
                onChange={e => setAddFilterValueSearch(e.target.value)}
              />
              <div>
                <Typography variant="content-label-subhead" as="div" style={{ marginBottom: 'var(--spacing-2)' }}>Value</Typography>
                <div style={{ border: '1px solid var(--rd-sys-color-border-divider)', borderRadius: 'var(--radius-md)', maxHeight: 320, overflowY: 'auto' }}>
                  {filteredValues.length === 0 ? (
                    <div style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
                      <Typography variant="footnote" color="gray" as="div">No values found</Typography>
                    </div>
                  ) : filteredValues.map((v, i, arr) => (
                    <React.Fragment key={v}>
                      <button
                        type="button"
                        onClick={() => setAddFilterValue(v)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                          padding: 'var(--spacing-3)', background: 'transparent', border: 'none', cursor: 'pointer',
                          font: 'inherit', color: 'var(--rd-sys-color-content-primary)', textAlign: 'left',
                        }}
                      >
                        <span>{v}</span>
                        {addFilterValue === v && <Icon name="checkmark" size="s" color="var(--rd-sys-color-content-brand)" />}
                      </button>
                      {i < arr.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <Checkbox checked={addFilterSaveToModel} onChange={setAddFilterSaveToModel} showLabel={false} />
                <Typography variant="footnote" as="span" onClick={() => setAddFilterSaveToModel(v => !v)} style={{ cursor: 'pointer' }}>
                  Add this filter to this model
                </Typography>
              </div>
            </div>
          )}
        </Modal>
      );
    })()}

    {/* ── Key column picker popover ── */}
    {keyPickerState && (() => {
      const candidateCols = SHEET_PANEL_SECTIONS
        .filter(s => s.id === 'attributes' || s.id === 'date')
        .flatMap(s => s.items.map(item => ({ key: item.id, label: item.label, type: item.type })));
      const filtered = keyPickerSearch.trim()
        ? candidateCols.filter(c => c.label.toLowerCase().includes(keyPickerSearch.toLowerCase()))
        : candidateCols;
      return (
        <div
          ref={keyPickerRef}
          style={{
            position: 'fixed',
            top: Math.min(keyPickerState.anchor.top, window.innerHeight - 420),
            left: Math.min(keyPickerState.anchor.left, window.innerWidth - 320),
            zIndex: 500,
            width: 300,
            background: 'var(--rd-sys-color-background-base, #fff)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(25,35,49,0.18)',
            padding: 16,
            fontFamily: 'inherit',
          }}
        >
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--rd-sys-color-content-primary, #1d2329)', lineHeight: 1.5 }}>
            You need to select a "Key column" to add custom data.{' '}
            <span style={{ color: 'var(--rd-sys-color-content-brand, #2770ef)', cursor: 'pointer' }}>Learn more</span>
          </p>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--rd-sys-color-background-subtle, #f5f7fa)', borderRadius: 8, padding: '6px 10px', marginBottom: 8 }}>
            <svg width={14} height={14} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.45 }}>
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              autoFocus
              value={keyPickerSearch}
              onChange={e => setKeyPickerSearch(e.target.value)}
              placeholder="Search"
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--rd-sys-color-content-primary, #1d2329)', width: '100%', fontFamily: 'inherit' }}
            />
          </div>
          {/* Column list */}
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map(c => {
              const checked = keyPickerSelected === c.key;
              return (
                <div
                  key={c.key}
                  onClick={() => setKeyPickerSelected(checked ? null : c.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 4px', borderRadius: 6, cursor: 'pointer', background: checked ? 'var(--rd-sys-color-background-brand-subtle, #eef3fd)' : 'transparent' }}
                  onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'var(--rd-sys-color-background-subtle, #f5f7fa)'; }}
                  onMouseLeave={e => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {/* Checkbox */}
                  <span style={{ width: 16, height: 16, borderRadius: 4, border: checked ? 'none' : '1.5px solid #c8cdd6', background: checked ? 'var(--rd-sys-color-content-brand, #2770ef)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {checked && <svg width={10} height={10} viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--rd-sys-color-content-primary, #1d2329)' }}>{c.label}</span>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--rd-sys-color-content-secondary, #777e8b)', textAlign: 'center', padding: '12px 0', margin: 0 }}>No columns found</p>
            )}
          </div>
          {/* Confirm */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => { setKeyPickerState(null); setKeyPickerSearch(''); setKeyPickerSelected(null); }}
              style={{ fontSize: 13, padding: '6px 14px', borderRadius: 7, border: '1px solid var(--rd-sys-color-border-default, #e2e5eb)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
            >Cancel</button>
            <button
              disabled={!keyPickerSelected}
              onClick={() => {
                if (!keyPickerSelected) return;
                setCustomColKeyCol(prev => ({ ...prev, [keyPickerState.colKey]: keyPickerSelected }));
                const targetCell = keyPickerState.cell;
                setKeyPickerState(null);
                setKeyPickerSearch('');
                setKeyPickerSelected(null);
                setEditingCell(targetCell);
                setEditingCellValue('');
                setTimeout(() => cellInputRef.current?.focus(), 30);
              }}
              style={{ fontSize: 13, padding: '6px 14px', borderRadius: 7, border: 'none', background: keyPickerSelected ? 'var(--rd-sys-color-content-brand, #2770ef)' : '#c8cdd6', color: '#fff', cursor: keyPickerSelected ? 'pointer' : 'default', fontFamily: 'inherit' }}
            >Confirm</button>
          </div>
        </div>
      );
    })()}
  </div>

  {/* ── Formula-to-custom conversion confirmation modal ── */}
  <Modal
    key="formula-edit-confirm"
    isOpen={formulaEditConfirm !== null}
    onClose={() => setFormulaEditConfirm(null)}
    title="Edit cell manually?"
    size="M1"
    footer={
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="secondary" size="basic" onClick={() => setFormulaEditConfirm(null)}>Cancel</Button>
        <Button variant="primary" size="basic" onClick={() => {
          if (!formulaEditConfirm) return;
          const { r, c, colKey } = formulaEditConfirm;
          setFormulaEditConfirm(null);
          setEditingCell({ r, c });
          setEditingCellValue(formulaRawText[colKey] ?? '');
          setTimeout(() => cellInputRef.current?.focus(), 20);
        }}>Edit cell</Button>
      </div>
    }
  >
    <p style={{ margin: 0, fontSize: 14, color: 'var(--rd-sys-color-content-primary, #1d232f)', lineHeight: 1.5 }}>
      Manually editing a cell will convert this into a custom column.
    </p>
    <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--rd-sys-color-content-secondary, #777e8b)', lineHeight: 1.5 }}>
      A custom column can only be saved in an input table.
    </p>
  </Modal>
  </>
  );
};

// ─── Types ───────────────────────────────────────────────────────────────────

type ColumnDef = { id: string; label: string; type: TokenType };
type SectionDef =
  | { id: string; label: string; kind: 'expandable'; columns: ColumnDef[] }
  | { id: string; label: string; kind: 'leaf' };

// ─── Data panel sections ──────────────────────────────────────────────────────

const SECTIONS: SectionDef[] = [
  {
    id: 'measures', label: 'Measures', kind: 'expandable',
    columns: [
      { id: 'revenue',         label: 'Revenue',          type: 'measure' },
      { id: 'unitsSold',       label: 'Units sold',       type: 'measure' },
      { id: 'profit',          label: 'Profit',           type: 'measure' },
      { id: 'profitMarginPct', label: 'Profit margin %',  type: 'measure' },
      { id: 'discountPct',     label: 'Discount %',       type: 'measure' },
    ],
  },
  {
    id: 'attributes', label: 'Attributes', kind: 'expandable',
    columns: [
      { id: 'region',             label: 'Region',               type: 'attribute' },
      { id: 'state',              label: 'State',                type: 'attribute' },
      { id: 'city',               label: 'City',                 type: 'attribute' },
      { id: 'productCategory',    label: 'Product category',     type: 'attribute' },
      { id: 'productSubCategory', label: 'Product sub category', type: 'attribute' },
      { id: 'productName',        label: 'Product name',         type: 'attribute' },
      { id: 'customerSegment',    label: 'Customer segment',     type: 'attribute' },
      { id: 'customerType',       label: 'Customer type',        type: 'attribute' },
      { id: 'salesChannel',       label: 'Sales channel',        type: 'attribute' },
    ],
  },
  {
    id: 'date', label: 'Date', kind: 'expandable',
    columns: [
      { id: 'orderDate',    label: 'Order date',    type: 'date' },
      { id: 'orderMonth',   label: 'Order month',   type: 'date' },
      { id: 'orderQuarter', label: 'Order quarter', type: 'date' },
      { id: 'orderYear',    label: 'Order year',    type: 'date' },
    ],
  },
  { id: 'formulas',    label: 'Formulas',    kind: 'leaf' },
  { id: 'set',         label: 'Set',         kind: 'leaf' },
  { id: 'parameters',  label: 'Parameters',  kind: 'leaf' },
  { id: 'customData',  label: 'Custom data', kind: 'leaf' },
];

// ─── Currency ──────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', AUD: 'A$', CAD: 'C$',
};

function formatCurrency(value: number, currency: string): string {
  if (!currency) return Number(value).toLocaleString();
  const sym = CURRENCY_SYMBOLS[currency] ?? '$';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  // JPY has no decimals
  if (currency === 'JPY') return `${sign}${sym}${Math.round(abs).toLocaleString()}`;
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${sign}${sym}${(abs / 1_000).toFixed(0)}K`;
  return `${sign}${sym}${abs.toFixed(0)}`;
}

function currencyCodeFromSymbol(symbol?: string): string {
  if (symbol === '₹') return 'INR';
  if (symbol === '€') return 'EUR';
  if (symbol === '£') return 'GBP';
  if (symbol === '¥') return 'JPY';
  if (symbol === 'A$') return 'AUD';
  if (symbol === 'C$') return 'CAD';
  if (symbol === '') return '';
  return 'USD';
}

// ─── Query state ──────────────────────────────────────────────────────────────

type QMetric = 'revenue' | 'unitsSold' | 'profit' | 'profitMarginPct' | 'discountPct';
type QDim = 'orderDate' | 'orderMonth' | 'orderQuarter' | 'orderYear' | 'region' | 'state' | 'city' | 'productCategory' | 'productSubCategory' | 'productName' | 'customerSegment' | 'customerType' | 'salesChannel';

interface QFilter { col: string; val: string }
interface QSort  { col: string; dir: 'asc' | 'desc' }

interface QueryState {
  metrics:     QMetric[];
  groupBy:     QDim[];
  filters:     QFilter[];
  sorts:       QSort[];
  derivedCols: string[];   // e.g. 'profit'
  currency:    string;     // 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' ...
  viewMode:    'chart' | 'table' | 'sheet';
}

export interface AnswerSnapshot {
  name: string;
  description: string;
  queryState: QueryState;
  customTitle: string | null;
  sheetExpanded: boolean;
  sheetDataView: 'aggregated' | 'row-level';
  sheetTab?: 'query' | 'sheet';
  savedAt: string;
  /** The surface the answer was last saved from — drives which view reopens it */
  mode?: 'search' | 'spreadsheet';
  /** User-created formula columns — persisted so they survive save/reload */
  formulaCols?: FormulaCol[];
  formulaValues?: Record<string, (number | null)[]>;
  /** Active chart color palette at the time of save */
  chartColors?: string[];
}

const EMPTY_QUERY: QueryState = {
  metrics: [], groupBy: [], filters: [], sorts: [],
  derivedCols: [], currency: 'USD', viewMode: 'table',
};

// ─── Canvas blocks ─────────────────────────────────────────────────────────────

type CanvasBlockKind = 'query' | 'filter' | 'sort' | 'group' | 'formula';
interface CanvasBlock { id: string; kind: CanvasBlockKind; label: string; detail: string }

// ─── RetailHub — Retail Sales Performance dataset (60 rows) ──────────────────

type SalesDatum = {
  orderDate:          string;
  orderMonth:         string;
  orderQuarter:       string;
  orderYear:          string;
  region:             string;
  state:              string;
  city:               string;
  productCategory:    string;
  productSubCategory: string;
  productName:        string;
  customerSegment:    string;
  customerType:       string;
  salesChannel:       string;
  unitsSold:          number;
  discountPct:        number;
  revenue:            number;
  profit:             number;
  profitMarginPct:    number;
  [key: string]: unknown;
};

const SALES_DATA: SalesDatum[] = [
  // ── 2024 Q1 ───────────────────────────────────────────────────────────────────
  { orderDate: '2024-01-06', orderMonth: 'Jan 2024', orderQuarter: 'Q1 2024', orderYear: '2024', region: 'West',  state: 'Maharashtra',  city: 'Mumbai',     productCategory: 'Electronics',   productSubCategory: 'Smartphones',        productName: 'Samsung Galaxy S24',     customerSegment: 'Enterprise', customerType: 'Premium',   salesChannel: 'Online',   unitsSold: 42, discountPct:  5, revenue: 12600, profit: 2646, profitMarginPct: 21.0 },
  { orderDate: '2024-01-12', orderMonth: 'Jan 2024', orderQuarter: 'Q1 2024', orderYear: '2024', region: 'East',  state: 'West Bengal',  city: 'Kolkata',    productCategory: 'Electronics',   productSubCategory: 'Smartphones',        productName: 'Samsung Galaxy S24',     customerSegment: 'SMB',        customerType: 'New',       salesChannel: 'Online',   unitsSold: 28, discountPct:  5, revenue:  8400, profit: 1596, profitMarginPct: 19.0 },
  { orderDate: '2024-01-18', orderMonth: 'Jan 2024', orderQuarter: 'Q1 2024', orderYear: '2024', region: 'North', state: 'Delhi',        city: 'New Delhi',  productCategory: 'Furniture',     productSubCategory: 'Sofas',              productName: 'Royal Oak L-Shape Sofa', customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'In-Store', unitsSold: 14, discountPct: 10, revenue:  7980, profit: 2074, profitMarginPct: 26.0 },
  { orderDate: '2024-01-25', orderMonth: 'Jan 2024', orderQuarter: 'Q1 2024', orderYear: '2024', region: 'South', state: 'Karnataka',    city: 'Bangalore',  productCategory: 'Home Products', productSubCategory: 'Kitchen Appliances', productName: 'Prestige Induction Pro',  customerSegment: 'Consumer',   customerType: 'Returning', salesChannel: 'Online',   unitsSold: 55, discountPct:  0, revenue:  4950, profit: 1238, profitMarginPct: 25.0 },
  { orderDate: '2024-02-03', orderMonth: 'Feb 2024', orderQuarter: 'Q1 2024', orderYear: '2024', region: 'West',  state: 'Gujarat',      city: 'Ahmedabad',  productCategory: 'Furniture',     productSubCategory: 'Office Chairs',      productName: 'Ergofit Executive Chair',customerSegment: 'Enterprise', customerType: 'Returning', salesChannel: 'Online',   unitsSold: 36, discountPct:  8, revenue:  9936, profit: 2682, profitMarginPct: 27.0 },
  { orderDate: '2024-02-10', orderMonth: 'Feb 2024', orderQuarter: 'Q1 2024', orderYear: '2024', region: 'East',  state: 'Odisha',       city: 'Bhubaneswar',productCategory: 'Electronics',   productSubCategory: 'Televisions',        productName: 'LG 55" Smart TV',        customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'In-Store', unitsSold: 18, discountPct: 12, revenue:  9504, profit: 1710, profitMarginPct: 18.0 },
  { orderDate: '2024-02-18', orderMonth: 'Feb 2024', orderQuarter: 'Q1 2024', orderYear: '2024', region: 'North', state: 'Rajasthan',    city: 'Jaipur',     productCategory: 'Home Products', productSubCategory: 'Bedding',            productName: 'Raymond King Bedsheet',  customerSegment: 'Consumer',   customerType: 'Returning', salesChannel: 'Online',   unitsSold: 80, discountPct:  5, revenue:  3800, profit:  912, profitMarginPct: 24.0 },
  { orderDate: '2024-02-25', orderMonth: 'Feb 2024', orderQuarter: 'Q1 2024', orderYear: '2024', region: 'South', state: 'Tamil Nadu',   city: 'Chennai',    productCategory: 'Electronics',   productSubCategory: 'Laptops',            productName: 'Apple MacBook Pro 14"',  customerSegment: 'Enterprise', customerType: 'New',       salesChannel: 'Online',   unitsSold: 22, discountPct:  0, revenue: 15400, profit: 2772, profitMarginPct: 18.0 },
  { orderDate: '2024-03-04', orderMonth: 'Mar 2024', orderQuarter: 'Q1 2024', orderYear: '2024', region: 'West',  state: 'Maharashtra',  city: 'Pune',       productCategory: 'Electronics',   productSubCategory: 'Laptops',            productName: 'Apple MacBook Pro 14"',  customerSegment: 'Enterprise', customerType: 'Premium',   salesChannel: 'Online',   unitsSold: 35, discountPct:  0, revenue: 24500, profit: 4410, profitMarginPct: 18.0 },
  { orderDate: '2024-03-11', orderMonth: 'Mar 2024', orderQuarter: 'Q1 2024', orderYear: '2024', region: 'East',  state: 'West Bengal',  city: 'Kolkata',    productCategory: 'Furniture',     productSubCategory: 'Beds',               productName: 'King Comfort King Bed',  customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'In-Store', unitsSold: 12, discountPct: 10, revenue:  6480, profit: 1685, profitMarginPct: 26.0 },
  { orderDate: '2024-03-18', orderMonth: 'Mar 2024', orderQuarter: 'Q1 2024', orderYear: '2024', region: 'North', state: 'Delhi',        city: 'New Delhi',  productCategory: 'Electronics',   productSubCategory: 'Tablets',            productName: 'iPad Pro 11"',           customerSegment: 'SMB',        customerType: 'Returning', salesChannel: 'Online',   unitsSold: 30, discountPct:  5, revenue: 11400, profit: 2166, profitMarginPct: 19.0 },
  { orderDate: '2024-03-25', orderMonth: 'Mar 2024', orderQuarter: 'Q1 2024', orderYear: '2024', region: 'South', state: 'Karnataka',    city: 'Bangalore',  productCategory: 'Home Products', productSubCategory: 'Cookware',           productName: 'Hawkins Pressure Cooker',customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'In-Store', unitsSold: 65, discountPct:  0, revenue:  3250, profit:  878, profitMarginPct: 27.0 },
  // ── 2024 Q2 ───────────────────────────────────────────────────────────────────
  { orderDate: '2024-04-06', orderMonth: 'Apr 2024', orderQuarter: 'Q2 2024', orderYear: '2024', region: 'West',  state: 'Maharashtra',  city: 'Mumbai',     productCategory: 'Electronics',   productSubCategory: 'Cameras',            productName: 'Canon EOS R6 Mark II',   customerSegment: 'SMB',        customerType: 'New',       salesChannel: 'Online',   unitsSold: 15, discountPct:  5, revenue: 11400, profit: 2166, profitMarginPct: 19.0 },
  { orderDate: '2024-04-13', orderMonth: 'Apr 2024', orderQuarter: 'Q2 2024', orderYear: '2024', region: 'East',  state: 'West Bengal',  city: 'Kolkata',    productCategory: 'Electronics',   productSubCategory: 'Televisions',        productName: 'LG 55" Smart TV',        customerSegment: 'Consumer',   customerType: 'Returning', salesChannel: 'Online',   unitsSold: 14, discountPct: 15, revenue:  7140, profit: 1000, profitMarginPct: 14.0 },
  { orderDate: '2024-04-20', orderMonth: 'Apr 2024', orderQuarter: 'Q2 2024', orderYear: '2024', region: 'North', state: 'Rajasthan',    city: 'Jaipur',     productCategory: 'Furniture',     productSubCategory: 'Wardrobes',          productName: 'Nilkamal 3-Door Wardrobe',customerSegment: 'Consumer',  customerType: 'New',       salesChannel: 'In-Store', unitsSold: 20, discountPct:  0, revenue:  9200, profit: 2576, profitMarginPct: 28.0 },
  { orderDate: '2024-04-27', orderMonth: 'Apr 2024', orderQuarter: 'Q2 2024', orderYear: '2024', region: 'South', state: 'Tamil Nadu',   city: 'Chennai',    productCategory: 'Home Products', productSubCategory: 'Storage',            productName: 'Godrej Metal Shelf',     customerSegment: 'SMB',        customerType: 'Returning', salesChannel: 'Online',   unitsSold: 45, discountPct:  0, revenue:  4500, profit: 1215, profitMarginPct: 27.0 },
  { orderDate: '2024-05-05', orderMonth: 'May 2024', orderQuarter: 'Q2 2024', orderYear: '2024', region: 'West',  state: 'Gujarat',      city: 'Ahmedabad',  productCategory: 'Furniture',     productSubCategory: 'Dining Tables',      productName: 'Durian 6-Seater Table',  customerSegment: 'Consumer',   customerType: 'Premium',   salesChannel: 'In-Store', unitsSold: 18, discountPct:  5, revenue: 10260, profit: 2873, profitMarginPct: 28.0 },
  { orderDate: '2024-05-12', orderMonth: 'May 2024', orderQuarter: 'Q2 2024', orderYear: '2024', region: 'East',  state: 'Odisha',       city: 'Bhubaneswar',productCategory: 'Home Products', productSubCategory: 'Curtains',           productName: 'Deco Window Curtain Set', customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'Online',   unitsSold: 90, discountPct:  0, revenue:  2700, profit:  594, profitMarginPct: 22.0 },
  { orderDate: '2024-05-19', orderMonth: 'May 2024', orderQuarter: 'Q2 2024', orderYear: '2024', region: 'North', state: 'Delhi',        city: 'New Delhi',  productCategory: 'Electronics',   productSubCategory: 'Smartphones',        productName: 'Samsung Galaxy S24',     customerSegment: 'Enterprise', customerType: 'Premium',   salesChannel: 'Online',   unitsSold: 38, discountPct:  0, revenue: 11400, profit: 2394, profitMarginPct: 21.0 },
  { orderDate: '2024-05-26', orderMonth: 'May 2024', orderQuarter: 'Q2 2024', orderYear: '2024', region: 'South', state: 'Karnataka',    city: 'Bangalore',  productCategory: 'Electronics',   productSubCategory: 'Laptops',            productName: 'Apple MacBook Pro 14"',  customerSegment: 'Enterprise', customerType: 'Returning', salesChannel: 'Online',   unitsSold: 25, discountPct:  0, revenue: 17500, profit: 3150, profitMarginPct: 18.0 },
  { orderDate: '2024-06-02', orderMonth: 'Jun 2024', orderQuarter: 'Q2 2024', orderYear: '2024', region: 'West',  state: 'Maharashtra',  city: 'Mumbai',     productCategory: 'Electronics',   productSubCategory: 'Laptops',            productName: 'Apple MacBook Pro 14"',  customerSegment: 'Enterprise', customerType: 'Premium',   salesChannel: 'Online',   unitsSold: 40, discountPct:  0, revenue: 28000, profit: 5040, profitMarginPct: 18.0 },
  { orderDate: '2024-06-09', orderMonth: 'Jun 2024', orderQuarter: 'Q2 2024', orderYear: '2024', region: 'East',  state: 'West Bengal',  city: 'Kolkata',    productCategory: 'Electronics',   productSubCategory: 'Smartphones',        productName: 'Samsung Galaxy S24',     customerSegment: 'SMB',        customerType: 'New',       salesChannel: 'In-Store', unitsSold: 20, discountPct: 10, revenue:  5400, profit:  864, profitMarginPct: 16.0 },
  { orderDate: '2024-06-16', orderMonth: 'Jun 2024', orderQuarter: 'Q2 2024', orderYear: '2024', region: 'North', state: 'Delhi',        city: 'New Delhi',  productCategory: 'Home Products', productSubCategory: 'Kitchen Appliances', productName: 'Prestige Induction Pro',  customerSegment: 'Consumer',   customerType: 'Returning', salesChannel: 'In-Store', unitsSold: 60, discountPct:  5, revenue:  5130, profit: 1283, profitMarginPct: 25.0 },
  { orderDate: '2024-06-23', orderMonth: 'Jun 2024', orderQuarter: 'Q2 2024', orderYear: '2024', region: 'South', state: 'Tamil Nadu',   city: 'Chennai',    productCategory: 'Furniture',     productSubCategory: 'Office Chairs',      productName: 'Ergofit Executive Chair',customerSegment: 'SMB',        customerType: 'New',       salesChannel: 'Online',   unitsSold: 28, discountPct:  0, revenue:  7700, profit: 2079, profitMarginPct: 27.0 },
  // ── 2024 Q3 ───────────────────────────────────────────────────────────────────
  { orderDate: '2024-07-07', orderMonth: 'Jul 2024', orderQuarter: 'Q3 2024', orderYear: '2024', region: 'West',  state: 'Maharashtra',  city: 'Pune',       productCategory: 'Electronics',   productSubCategory: 'Laptops',            productName: 'Apple MacBook Pro 14"',  customerSegment: 'Enterprise', customerType: 'Premium',   salesChannel: 'Online',   unitsSold: 48, discountPct:  0, revenue: 33600, profit: 6048, profitMarginPct: 18.0 },
  { orderDate: '2024-07-14', orderMonth: 'Jul 2024', orderQuarter: 'Q3 2024', orderYear: '2024', region: 'East',  state: 'West Bengal',  city: 'Kolkata',    productCategory: 'Electronics',   productSubCategory: 'Laptops',            productName: 'Apple MacBook Pro 14"',  customerSegment: 'Enterprise', customerType: 'Returning', salesChannel: 'Online',   unitsSold: 15, discountPct:  5, revenue:  9975, profit: 1496, profitMarginPct: 15.0 },
  { orderDate: '2024-07-21', orderMonth: 'Jul 2024', orderQuarter: 'Q3 2024', orderYear: '2024', region: 'North', state: 'Rajasthan',    city: 'Jaipur',     productCategory: 'Furniture',     productSubCategory: 'Sofas',              productName: 'Royal Oak L-Shape Sofa', customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'In-Store', unitsSold: 16, discountPct:  0, revenue:  9920, profit: 2579, profitMarginPct: 26.0 },
  { orderDate: '2024-07-28', orderMonth: 'Jul 2024', orderQuarter: 'Q3 2024', orderYear: '2024', region: 'South', state: 'Karnataka',    city: 'Bangalore',  productCategory: 'Electronics',   productSubCategory: 'Tablets',            productName: 'iPad Pro 11"',           customerSegment: 'SMB',        customerType: 'Returning', salesChannel: 'Online',   unitsSold: 35, discountPct:  5, revenue: 12600, profit: 2394, profitMarginPct: 19.0 },
  { orderDate: '2024-08-04', orderMonth: 'Aug 2024', orderQuarter: 'Q3 2024', orderYear: '2024', region: 'West',  state: 'Gujarat',      city: 'Ahmedabad',  productCategory: 'Home Products', productSubCategory: 'Bedding',            productName: 'Raymond King Bedsheet',  customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'Online',  unitsSold: 100, discountPct:  0, revenue:  4800, profit: 1152, profitMarginPct: 24.0 },
  { orderDate: '2024-08-11', orderMonth: 'Aug 2024', orderQuarter: 'Q3 2024', orderYear: '2024', region: 'East',  state: 'Odisha',       city: 'Bhubaneswar',productCategory: 'Home Products', productSubCategory: 'Cookware',           productName: 'Hawkins Pressure Cooker',customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'In-Store', unitsSold: 50, discountPct:  0, revenue:  2500, profit:  675, profitMarginPct: 27.0 },
  { orderDate: '2024-08-18', orderMonth: 'Aug 2024', orderQuarter: 'Q3 2024', orderYear: '2024', region: 'North', state: 'Delhi',        city: 'New Delhi',  productCategory: 'Electronics',   productSubCategory: 'Smartphones',        productName: 'Samsung Galaxy S24',     customerSegment: 'Enterprise', customerType: 'Premium',   salesChannel: 'Online',   unitsSold: 45, discountPct:  0, revenue: 13500, profit: 2835, profitMarginPct: 21.0 },
  { orderDate: '2024-08-25', orderMonth: 'Aug 2024', orderQuarter: 'Q3 2024', orderYear: '2024', region: 'South', state: 'Tamil Nadu',   city: 'Chennai',    productCategory: 'Furniture',     productSubCategory: 'Dining Tables',      productName: 'Durian 6-Seater Table',  customerSegment: 'Consumer',   customerType: 'Returning', salesChannel: 'In-Store', unitsSold: 22, discountPct:  5, revenue: 11990, profit: 3357, profitMarginPct: 28.0 },
  { orderDate: '2024-09-01', orderMonth: 'Sep 2024', orderQuarter: 'Q3 2024', orderYear: '2024', region: 'West',  state: 'Maharashtra',  city: 'Mumbai',     productCategory: 'Electronics',   productSubCategory: 'Televisions',        productName: 'LG 55" Smart TV',        customerSegment: 'Consumer',   customerType: 'Returning', salesChannel: 'In-Store', unitsSold: 30, discountPct:  5, revenue: 15300, profit: 2754, profitMarginPct: 18.0 },
  { orderDate: '2024-09-08', orderMonth: 'Sep 2024', orderQuarter: 'Q3 2024', orderYear: '2024', region: 'East',  state: 'West Bengal',  city: 'Kolkata',    productCategory: 'Electronics',   productSubCategory: 'Televisions',        productName: 'LG 55" Smart TV',        customerSegment: 'Consumer',   customerType: 'Returning', salesChannel: 'Online',   unitsSold: 12, discountPct: 15, revenue:  6120, profit:  857, profitMarginPct: 14.0 },
  { orderDate: '2024-09-15', orderMonth: 'Sep 2024', orderQuarter: 'Q3 2024', orderYear: '2024', region: 'North', state: 'Rajasthan',    city: 'Jaipur',     productCategory: 'Home Products', productSubCategory: 'Storage',            productName: 'Godrej Metal Shelf',     customerSegment: 'SMB',        customerType: 'New',       salesChannel: 'Online',   unitsSold: 55, discountPct:  0, revenue:  5500, profit: 1485, profitMarginPct: 27.0 },
  { orderDate: '2024-09-22', orderMonth: 'Sep 2024', orderQuarter: 'Q3 2024', orderYear: '2024', region: 'South', state: 'Karnataka',    city: 'Bangalore',  productCategory: 'Home Products', productSubCategory: 'Kitchen Appliances', productName: 'Prestige Induction Pro',  customerSegment: 'Consumer',   customerType: 'Returning', salesChannel: 'Online',   unitsSold: 70, discountPct:  5, revenue:  5985, profit: 1497, profitMarginPct: 25.0 },
  // ── 2024 Q4 ───────────────────────────────────────────────────────────────────
  { orderDate: '2024-10-06', orderMonth: 'Oct 2024', orderQuarter: 'Q4 2024', orderYear: '2024', region: 'West',  state: 'Maharashtra',  city: 'Pune',       productCategory: 'Electronics',   productSubCategory: 'Smartphones',        productName: 'Samsung Galaxy S24',     customerSegment: 'Enterprise', customerType: 'Premium',   salesChannel: 'Online',   unitsSold: 55, discountPct:  0, revenue: 16500, profit: 3465, profitMarginPct: 21.0 },
  { orderDate: '2024-10-13', orderMonth: 'Oct 2024', orderQuarter: 'Q4 2024', orderYear: '2024', region: 'East',  state: 'West Bengal',  city: 'Kolkata',    productCategory: 'Electronics',   productSubCategory: 'Smartphones',        productName: 'Samsung Galaxy S24',     customerSegment: 'SMB',        customerType: 'Returning', salesChannel: 'Online',   unitsSold: 22, discountPct: 10, revenue:  5940, profit:  951, profitMarginPct: 16.0 },
  { orderDate: '2024-10-20', orderMonth: 'Oct 2024', orderQuarter: 'Q4 2024', orderYear: '2024', region: 'North', state: 'Delhi',        city: 'New Delhi',  productCategory: 'Furniture',     productSubCategory: 'Beds',               productName: 'King Comfort King Bed',  customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'In-Store', unitsSold: 18, discountPct:  0, revenue:  9900, profit: 2574, profitMarginPct: 26.0 },
  { orderDate: '2024-10-27', orderMonth: 'Oct 2024', orderQuarter: 'Q4 2024', orderYear: '2024', region: 'South', state: 'Tamil Nadu',   city: 'Chennai',    productCategory: 'Electronics',   productSubCategory: 'Laptops',            productName: 'Apple MacBook Pro 14"',  customerSegment: 'Enterprise', customerType: 'Premium',   salesChannel: 'Online',   unitsSold: 28, discountPct:  0, revenue: 19600, profit: 3528, profitMarginPct: 18.0 },
  { orderDate: '2024-11-03', orderMonth: 'Nov 2024', orderQuarter: 'Q4 2024', orderYear: '2024', region: 'West',  state: 'Maharashtra',  city: 'Mumbai',     productCategory: 'Electronics',   productSubCategory: 'Laptops',            productName: 'Apple MacBook Pro 14"',  customerSegment: 'Enterprise', customerType: 'Premium',   salesChannel: 'Online',   unitsSold: 60, discountPct:  0, revenue: 42000, profit: 7560, profitMarginPct: 18.0 },
  { orderDate: '2024-11-10', orderMonth: 'Nov 2024', orderQuarter: 'Q4 2024', orderYear: '2024', region: 'East',  state: 'Odisha',       city: 'Bhubaneswar',productCategory: 'Electronics',   productSubCategory: 'Televisions',        productName: 'LG 55" Smart TV',        customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'In-Store', unitsSold: 10, discountPct: 20, revenue:  5100, profit:  612, profitMarginPct: 12.0 },
  { orderDate: '2024-11-17', orderMonth: 'Nov 2024', orderQuarter: 'Q4 2024', orderYear: '2024', region: 'North', state: 'Delhi',        city: 'New Delhi',  productCategory: 'Electronics',   productSubCategory: 'Tablets',            productName: 'iPad Pro 11"',           customerSegment: 'Enterprise', customerType: 'Returning', salesChannel: 'Online',   unitsSold: 40, discountPct:  5, revenue: 15200, profit: 2888, profitMarginPct: 19.0 },
  { orderDate: '2024-11-24', orderMonth: 'Nov 2024', orderQuarter: 'Q4 2024', orderYear: '2024', region: 'South', state: 'Karnataka',    city: 'Bangalore',  productCategory: 'Home Products', productSubCategory: 'Bedding',            productName: 'Raymond King Bedsheet',  customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'Online',   unitsSold: 90, discountPct:  0, revenue:  4500, profit: 1080, profitMarginPct: 24.0 },
  { orderDate: '2024-12-01', orderMonth: 'Dec 2024', orderQuarter: 'Q4 2024', orderYear: '2024', region: 'West',  state: 'Gujarat',      city: 'Ahmedabad',  productCategory: 'Furniture',     productSubCategory: 'Office Chairs',      productName: 'Ergofit Executive Chair',customerSegment: 'SMB',        customerType: 'Returning', salesChannel: 'Online',   unitsSold: 45, discountPct:  5, revenue: 12150, profit: 3281, profitMarginPct: 27.0 },
  { orderDate: '2024-12-08', orderMonth: 'Dec 2024', orderQuarter: 'Q4 2024', orderYear: '2024', region: 'East',  state: 'West Bengal',  city: 'Kolkata',    productCategory: 'Furniture',     productSubCategory: 'Wardrobes',          productName: 'Nilkamal 3-Door Wardrobe',customerSegment: 'Consumer',  customerType: 'New',       salesChannel: 'In-Store', unitsSold: 11, discountPct: 10, revenue:  4950, profit: 1386, profitMarginPct: 28.0 },
  { orderDate: '2024-12-15', orderMonth: 'Dec 2024', orderQuarter: 'Q4 2024', orderYear: '2024', region: 'North', state: 'Delhi',        city: 'New Delhi',  productCategory: 'Home Products', productSubCategory: 'Cookware',           productName: 'Hawkins Pressure Cooker',customerSegment: 'Consumer',   customerType: 'Returning', salesChannel: 'In-Store', unitsSold: 75, discountPct:  0, revenue:  3750, profit: 1013, profitMarginPct: 27.0 },
  { orderDate: '2024-12-22', orderMonth: 'Dec 2024', orderQuarter: 'Q4 2024', orderYear: '2024', region: 'South', state: 'Tamil Nadu',   city: 'Chennai',    productCategory: 'Furniture',     productSubCategory: 'Sofas',              productName: 'Royal Oak L-Shape Sofa', customerSegment: 'Consumer',   customerType: 'Premium',   salesChannel: 'In-Store', unitsSold: 20, discountPct:  5, revenue: 11400, profit: 2964, profitMarginPct: 26.0 },
  // ── 2025 Q1 ───────────────────────────────────────────────────────────────────
  { orderDate: '2025-01-05', orderMonth: 'Jan 2025', orderQuarter: 'Q1 2025', orderYear: '2025', region: 'West',  state: 'Maharashtra',  city: 'Mumbai',     productCategory: 'Electronics',   productSubCategory: 'Smartphones',        productName: 'Samsung Galaxy S24',     customerSegment: 'Enterprise', customerType: 'Premium',   salesChannel: 'Online',   unitsSold: 50, discountPct:  0, revenue: 15000, profit: 3150, profitMarginPct: 21.0 },
  { orderDate: '2025-01-12', orderMonth: 'Jan 2025', orderQuarter: 'Q1 2025', orderYear: '2025', region: 'East',  state: 'West Bengal',  city: 'Kolkata',    productCategory: 'Electronics',   productSubCategory: 'Smartphones',        productName: 'Samsung Galaxy S24',     customerSegment: 'SMB',        customerType: 'New',       salesChannel: 'Online',   unitsSold: 18, discountPct: 10, revenue:  4860, profit:  778, profitMarginPct: 16.0 },
  { orderDate: '2025-01-19', orderMonth: 'Jan 2025', orderQuarter: 'Q1 2025', orderYear: '2025', region: 'North', state: 'Delhi',        city: 'New Delhi',  productCategory: 'Electronics',   productSubCategory: 'Laptops',            productName: 'Apple MacBook Pro 14"',  customerSegment: 'Enterprise', customerType: 'Returning', salesChannel: 'Online',   unitsSold: 32, discountPct:  0, revenue: 22400, profit: 4032, profitMarginPct: 18.0 },
  { orderDate: '2025-01-26', orderMonth: 'Jan 2025', orderQuarter: 'Q1 2025', orderYear: '2025', region: 'South', state: 'Karnataka',    city: 'Bangalore',  productCategory: 'Furniture',     productSubCategory: 'Office Chairs',      productName: 'Ergofit Executive Chair',customerSegment: 'Enterprise', customerType: 'Returning', salesChannel: 'Online',   unitsSold: 40, discountPct:  5, revenue: 10800, profit: 2916, profitMarginPct: 27.0 },
  { orderDate: '2025-02-02', orderMonth: 'Feb 2025', orderQuarter: 'Q1 2025', orderYear: '2025', region: 'West',  state: 'Maharashtra',  city: 'Pune',       productCategory: 'Electronics',   productSubCategory: 'Laptops',            productName: 'Apple MacBook Pro 14"',  customerSegment: 'Enterprise', customerType: 'Premium',   salesChannel: 'Online',   unitsSold: 58, discountPct:  0, revenue: 40600, profit: 7308, profitMarginPct: 18.0 },
  { orderDate: '2025-02-09', orderMonth: 'Feb 2025', orderQuarter: 'Q1 2025', orderYear: '2025', region: 'East',  state: 'West Bengal',  city: 'Kolkata',    productCategory: 'Electronics',   productSubCategory: 'Laptops',            productName: 'Apple MacBook Pro 14"',  customerSegment: 'Enterprise', customerType: 'Returning', salesChannel: 'Online',   unitsSold: 10, discountPct: 15, revenue:  5950, profit:  714, profitMarginPct: 12.0 },
  { orderDate: '2025-02-16', orderMonth: 'Feb 2025', orderQuarter: 'Q1 2025', orderYear: '2025', region: 'North', state: 'Rajasthan',    city: 'Jaipur',     productCategory: 'Home Products', productSubCategory: 'Kitchen Appliances', productName: 'Prestige Induction Pro',  customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'In-Store', unitsSold: 65, discountPct:  0, revenue:  5850, profit: 1463, profitMarginPct: 25.0 },
  { orderDate: '2025-02-23', orderMonth: 'Feb 2025', orderQuarter: 'Q1 2025', orderYear: '2025', region: 'South', state: 'Tamil Nadu',   city: 'Chennai',    productCategory: 'Electronics',   productSubCategory: 'Televisions',        productName: 'LG 55" Smart TV',        customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'In-Store', unitsSold: 22, discountPct:  5, revenue: 11220, profit: 2020, profitMarginPct: 18.0 },
  { orderDate: '2025-03-02', orderMonth: 'Mar 2025', orderQuarter: 'Q1 2025', orderYear: '2025', region: 'West',  state: 'Gujarat',      city: 'Ahmedabad',  productCategory: 'Furniture',     productSubCategory: 'Dining Tables',      productName: 'Durian 6-Seater Table',  customerSegment: 'Consumer',   customerType: 'Premium',   salesChannel: 'In-Store', unitsSold: 22, discountPct:  0, revenue: 12760, profit: 3573, profitMarginPct: 28.0 },
  { orderDate: '2025-03-09', orderMonth: 'Mar 2025', orderQuarter: 'Q1 2025', orderYear: '2025', region: 'East',  state: 'Odisha',       city: 'Bhubaneswar',productCategory: 'Electronics',   productSubCategory: 'Televisions',        productName: 'LG 55" Smart TV',        customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'Online',   unitsSold:  9, discountPct: 20, revenue:  4320, profit:  432, profitMarginPct: 10.0 },
  { orderDate: '2025-03-16', orderMonth: 'Mar 2025', orderQuarter: 'Q1 2025', orderYear: '2025', region: 'North', state: 'Delhi',        city: 'New Delhi',  productCategory: 'Furniture',     productSubCategory: 'Sofas',              productName: 'Royal Oak L-Shape Sofa', customerSegment: 'Consumer',   customerType: 'Returning', salesChannel: 'In-Store', unitsSold: 18, discountPct:  0, revenue: 10260, profit: 2668, profitMarginPct: 26.0 },
  { orderDate: '2025-03-23', orderMonth: 'Mar 2025', orderQuarter: 'Q1 2025', orderYear: '2025', region: 'South', state: 'Karnataka',    city: 'Bangalore',  productCategory: 'Home Products', productSubCategory: 'Storage',            productName: 'Godrej Metal Shelf',     customerSegment: 'SMB',        customerType: 'New',       salesChannel: 'Online',   unitsSold: 50, discountPct:  0, revenue:  5000, profit: 1350, profitMarginPct: 27.0 },
  // ── 2025 Q2 ───────────────────────────────────────────────────────────────────
  { orderDate: '2025-04-06', orderMonth: 'Apr 2025', orderQuarter: 'Q2 2025', orderYear: '2025', region: 'West',  state: 'Maharashtra',  city: 'Mumbai',     productCategory: 'Electronics',   productSubCategory: 'Laptops',            productName: 'Apple MacBook Pro 14"',  customerSegment: 'Enterprise', customerType: 'Premium',   salesChannel: 'Online',   unitsSold: 65, discountPct:  0, revenue: 45500, profit: 8190, profitMarginPct: 18.0 },
  { orderDate: '2025-04-13', orderMonth: 'Apr 2025', orderQuarter: 'Q2 2025', orderYear: '2025', region: 'East',  state: 'West Bengal',  city: 'Kolkata',    productCategory: 'Electronics',   productSubCategory: 'Smartphones',        productName: 'Samsung Galaxy S24',     customerSegment: 'SMB',        customerType: 'Returning', salesChannel: 'Online',   unitsSold: 14, discountPct: 15, revenue:  3570, profit:  500, profitMarginPct: 14.0 },
  { orderDate: '2025-04-20', orderMonth: 'Apr 2025', orderQuarter: 'Q2 2025', orderYear: '2025', region: 'North', state: 'Rajasthan',    city: 'Jaipur',     productCategory: 'Electronics',   productSubCategory: 'Tablets',            productName: 'iPad Pro 11"',           customerSegment: 'SMB',        customerType: 'New',       salesChannel: 'Online',   unitsSold: 38, discountPct:  5, revenue: 13680, profit: 2599, profitMarginPct: 19.0 },
  { orderDate: '2025-04-27', orderMonth: 'Apr 2025', orderQuarter: 'Q2 2025', orderYear: '2025', region: 'South', state: 'Tamil Nadu',   city: 'Chennai',    productCategory: 'Electronics',   productSubCategory: 'Laptops',            productName: 'Apple MacBook Pro 14"',  customerSegment: 'Enterprise', customerType: 'Premium',   salesChannel: 'Online',   unitsSold: 32, discountPct:  0, revenue: 22400, profit: 4032, profitMarginPct: 18.0 },
  { orderDate: '2025-05-04', orderMonth: 'May 2025', orderQuarter: 'Q2 2025', orderYear: '2025', region: 'West',  state: 'Maharashtra',  city: 'Pune',       productCategory: 'Electronics',   productSubCategory: 'Smartphones',        productName: 'Samsung Galaxy S24',     customerSegment: 'Enterprise', customerType: 'Premium',   salesChannel: 'Online',   unitsSold: 62, discountPct:  0, revenue: 18600, profit: 3906, profitMarginPct: 21.0 },
  { orderDate: '2025-05-11', orderMonth: 'May 2025', orderQuarter: 'Q2 2025', orderYear: '2025', region: 'East',  state: 'Odisha',       city: 'Bhubaneswar',productCategory: 'Home Products', productSubCategory: 'Cookware',           productName: 'Hawkins Pressure Cooker',customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'In-Store', unitsSold: 40, discountPct:  0, revenue:  2000, profit:  540, profitMarginPct: 27.0 },
  { orderDate: '2025-05-18', orderMonth: 'May 2025', orderQuarter: 'Q2 2025', orderYear: '2025', region: 'North', state: 'Delhi',        city: 'New Delhi',  productCategory: 'Furniture',     productSubCategory: 'Wardrobes',          productName: 'Nilkamal 3-Door Wardrobe',customerSegment: 'Consumer',  customerType: 'Returning', salesChannel: 'In-Store', unitsSold: 24, discountPct:  0, revenue: 11040, profit: 3091, profitMarginPct: 28.0 },
  { orderDate: '2025-05-25', orderMonth: 'May 2025', orderQuarter: 'Q2 2025', orderYear: '2025', region: 'South', state: 'Karnataka',    city: 'Bangalore',  productCategory: 'Home Products', productSubCategory: 'Kitchen Appliances', productName: 'Prestige Induction Pro',  customerSegment: 'Consumer',   customerType: 'Returning', salesChannel: 'Online',   unitsSold: 75, discountPct:  5, revenue:  6413, profit: 1603, profitMarginPct: 25.0 },
  { orderDate: '2025-06-01', orderMonth: 'Jun 2025', orderQuarter: 'Q2 2025', orderYear: '2025', region: 'West',  state: 'Gujarat',      city: 'Ahmedabad',  productCategory: 'Home Products', productSubCategory: 'Bedding',            productName: 'Raymond King Bedsheet',  customerSegment: 'Consumer',   customerType: 'New',       salesChannel: 'Online',  unitsSold: 110, discountPct:  0, revenue:  5280, profit: 1267, profitMarginPct: 24.0 },
  { orderDate: '2025-06-08', orderMonth: 'Jun 2025', orderQuarter: 'Q2 2025', orderYear: '2025', region: 'East',  state: 'West Bengal',  city: 'Kolkata',    productCategory: 'Furniture',     productSubCategory: 'Beds',               productName: 'King Comfort King Bed',  customerSegment: 'Consumer',   customerType: 'Returning', salesChannel: 'In-Store', unitsSold:  8, discountPct: 10, revenue:  4320, profit: 1123, profitMarginPct: 26.0 },
];

// ─── Labels ────────────────────────────────────────────────────────────────────

const METRIC_LABELS: Record<QMetric, string> = {
  revenue: 'Revenue', unitsSold: 'Units sold', profit: 'Profit',
  profitMarginPct: 'Profit margin %', discountPct: 'Discount %',
};
const DIM_LABELS: Record<QDim, string> = {
  orderDate: 'Order date', orderMonth: 'Order month', orderQuarter: 'Order quarter', orderYear: 'Order year',
  region: 'Region', state: 'State', city: 'City',
  productCategory: 'Product category', productSubCategory: 'Product sub category', productName: 'Product name',
  customerSegment: 'Customer segment', customerType: 'Customer type', salesChannel: 'Sales channel',
};
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ─── Aggregation ───────────────────────────────────────────────────────────────

interface AggRow {
  label: string;
  revenue: number; unitsSold: number; profit: number;
  profitMarginPct: number; discountPct: number;
  [key: string]: unknown;
}

// ─── Smart filter matcher ──────────────────────────────────────────────────────
// Handles exact string matches AND relative date range expressions like
// "last 12 months", "last 1 year", "this year", "last year", "last 6 months", etc.
const DATA_LATEST_DATE = new Date('2025-06-08'); // last orderDate in SALES_DATA

function matchesFilter(r: SalesDatum, col: string, val: string): boolean {
  const rowRaw = String((r as unknown as Record<string, unknown>)[col] ?? '');
  const filterVal = val.trim();

  // Exact match first (handles 'region = East', 'orderYear = 2024', etc.)
  if (rowRaw.toLowerCase() === filterVal.toLowerCase()) return true;

  // Only apply relative-range logic on date columns
  const isDateCol = ['orderDate', 'orderMonth', 'orderQuarter', 'orderYear'].includes(col);
  if (!isDateCol) return false;

  const lower = filterVal.toLowerCase();

  // Helper: parse "last N months/years" → cutoff Date
  const mMonths = lower.match(/last\s+(\d+)\s*months?/);
  const mYears  = lower.match(/last\s+(\d+)\s*years?/) || lower.match(/(\d+)\s*years?/);
  const isThisYear = /\bthis\s+year\b/.test(lower);
  const isLastYear = /\blast\s+year\b/.test(lower);
  const isLastQuarter = /\blast\s+quarter\b/.test(lower);

  const getOrderDate = (): Date | null => {
    const d = new Date(r.orderDate);
    return isNaN(d.getTime()) ? null : d;
  };

  if (mMonths) {
    const n = parseInt(mMonths[1]);
    const cutoff = new Date(DATA_LATEST_DATE);
    cutoff.setMonth(cutoff.getMonth() - n);
    const d = getOrderDate();
    return d !== null ? d >= cutoff && d <= DATA_LATEST_DATE : Number(r.orderYear) >= cutoff.getFullYear();
  }

  if (mYears && !mMonths) {
    const n = parseInt((mYears as RegExpMatchArray)[1]);
    const cutoff = new Date(DATA_LATEST_DATE);
    cutoff.setFullYear(cutoff.getFullYear() - n);
    const d = getOrderDate();
    return d !== null ? d >= cutoff && d <= DATA_LATEST_DATE : Number(r.orderYear) >= cutoff.getFullYear();
  }

  if (isThisYear)  return r.orderYear === '2025';
  if (isLastYear)  return r.orderYear === '2024';
  if (isLastQuarter) {
    // DATA_LATEST_DATE is 2025-06-08 → current quarter is Q2 2025, last quarter is Q1 2025
    return r.orderQuarter === 'Q1 2025';
  }

  // Year-only value against a date column: "2024" → rows where orderYear === '2024'
  if (/^\d{4}$/.test(filterVal)) return r.orderYear === filterVal;

  return false;
}

// sourceRows: only passed when canvasScope is active (dynamic columns) — a
// generic sum-per-metric aggregator, since the metric ids aren't known in
// advance. Omitted, this keeps the exact original "Sample Retail" behavior.
function aggregate(state: QueryState, sourceRows?: Record<string, unknown>[]): AggRow[] {
  if (sourceRows) {
    let dynRows = sourceRows;
    for (const f of state.filters) {
      dynRows = dynRows.filter(r => String(r[f.col] ?? '') === f.val);
    }
    const pd = state.groupBy[0];
    const sd = state.groupBy[1];
    const map = new Map<string, Record<string, number>>();
    for (const r of dynRows) {
      const key = sd ? `${r[pd!]} / ${r[sd]}` : pd ? String(r[pd]) : 'Total';
      const sums = map.get(key) ?? {};
      state.metrics.forEach(m => { sums[m] = (sums[m] ?? 0) + (Number(r[m]) || 0); });
      map.set(key, sums);
    }
    let dynResult: AggRow[] = Array.from(map.entries()).map(([label, sums]) => {
      const row = { label, revenue: 0, unitsSold: 0, profit: 0, profitMarginPct: 0, discountPct: 0 } as AggRow;
      state.metrics.forEach(m => { row[m] = sums[m] ?? 0; });
      return row;
    });
    for (const sort of state.sorts) {
      dynResult.sort((a, b) => {
        const av = Number(a[sort.col] ?? 0), bv = Number(b[sort.col] ?? 0);
        return sort.dir === 'desc' ? bv - av : av - bv;
      });
    }
    return dynResult;
  }

  let rows = SALES_DATA;
  for (const f of state.filters) {
    rows = rows.filter(r => matchesFilter(r, f.col, f.val));
  }
  const pd = state.groupBy[0] as keyof SalesDatum | undefined;
  const sd = state.groupBy[1] as keyof SalesDatum | undefined;
  const map = new Map<string, { revenue: number; unitsSold: number; profit: number; discountPctSum: number; count: number }>();
  for (const r of rows) {
    const key = sd ? `${r[pd!]} / ${r[sd]}` : pd ? String(r[pd]) : 'Total';
    const p = map.get(key) ?? { revenue: 0, unitsSold: 0, profit: 0, discountPctSum: 0, count: 0 };
    map.set(key, {
      revenue:        p.revenue        + r.revenue,
      unitsSold:      p.unitsSold      + r.unitsSold,
      profit:         p.profit         + r.profit,
      discountPctSum: p.discountPctSum + r.discountPct,
      count:          p.count + 1,
    });
  }
  let result: AggRow[] = Array.from(map.entries()).map(([label, v]) => ({
    label,
    revenue:         v.revenue,
    unitsSold:       v.unitsSold,
    profit:          v.profit,
    profitMarginPct: v.revenue > 0 ? (v.profit / v.revenue) * 100 : 0,
    discountPct:     v.count > 0 ? v.discountPctSum / v.count : 0,
  }));
  for (const sort of state.sorts) {
    result.sort((a, b) => {
      const av = Number(a[sort.col] ?? 0), bv = Number(b[sort.col] ?? 0);
      return sort.dir === 'desc' ? bv - av : av - bv;
    });
  }
  return result;
}

// ─── Formula string → FToken[] parser ─────────────────────────────────────────

function parseFormulaToTokens(expr: string): FToken[] {
  const tokens: FToken[] = [];
  const cleaned = expr.replace(/[()]/g, '');
  const parts = cleaned.split(/\s*([+\-*/])\s*/);
  for (const part of parts) {
    const t = part.trim();
    if (!t) continue;
    if (t === '+' || t === '-' || t === '*' || t === '/') {
      tokens.push({ kind: 'op', value: t });
    } else if (/^-?\d+(\.\d+)?$/.test(t)) {
      tokens.push({ kind: 'num', value: t });
    } else {
      tokens.push({ kind: 'col', label: t });
    }
  }
  return tokens;
}

function computeYoYRevenue(rows: Record<string, unknown>[], groupBy: string[]): (number | null)[] {
  const groupYearRev = new Map<string, { r2024: number; r2025: number }>();
  for (const row of rows) {
    const gKey = groupBy.map(k => String(row[k] ?? '')).join('|||') || '__all__';
    const year = String(row.orderYear ?? '');
    const rev = Number(row.revenue ?? 0);
    const entry = groupYearRev.get(gKey) ?? { r2024: 0, r2025: 0 };
    if (year === '2024') entry.r2024 += rev;
    else if (year === '2025') entry.r2025 += rev;
    groupYearRev.set(gKey, entry);
  }
  return rows.map(row => {
    const year = String(row.orderYear ?? '');
    if (year !== '2025') return null;
    const gKey = groupBy.map(k => String(row[k] ?? '')).join('|||') || '__all__';
    const { r2024, r2025 } = groupYearRev.get(gKey) ?? { r2024: 0, r2025: 0 };
    if (r2024 === 0) return null;
    return Math.round((r2025 - r2024) / r2024 * 10000) / 100;
  });
}

function stablePercentFromSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const values = [-18.4, -12.7, -8.9, -4.6, 3.8, 7.2, 11.5, 15.9, 21.3, 26.8];
  return values[hash % values.length];
}

function makeRevenueYoYPercentValues(rows: Record<string, unknown>[], groupBy: string[]): (number | null)[] {
  const exact = computeYoYRevenue(rows, groupBy);
  if (exact.some(v => v !== null)) {
    const fallbackByGroup = new Map<string, number>();
    return exact.map((v, i) => {
      if (v !== null) return v;
      const row = rows[i] ?? {};
      const gKey = groupBy.map(k => String(row[k] ?? '')).join('|||') || String(row.label ?? i);
      if (!fallbackByGroup.has(gKey)) fallbackByGroup.set(gKey, stablePercentFromSeed(gKey));
      return fallbackByGroup.get(gKey) ?? 0;
    });
  }

  return rows.map((row, i) => {
    const parts = groupBy.map(k => String(row[k] ?? '')).filter(Boolean);
    const seed = parts.length ? parts.join('|||') : String(row.label ?? `row-${i}`);
    return stablePercentFromSeed(seed);
  });
}

// ─── Display column builder (only selected tokens) ─────────────────────────────
// Returns ONLY the columns that correspond to the tokens in the search query.

function buildDisplayColumns(state: QueryState) {
  const fmtC = (v: unknown) => formatCurrency(Number(v), state.currency);
  const fmtN = (v: unknown) => Number(v).toLocaleString();
  const fmtPct = (v: unknown) => `${Number(v).toFixed(1)}%`;

  const cols: AnswerColDef[] = [];

  // Dimension columns — fixed 140px, left-aligned
  state.groupBy.forEach(d =>
    cols.push({ key: d, label: DIM_LABELS[d as QDim] ?? d, sortable: true, width: 140, render: String })
  );

  // Metric columns — fixed 160px, right-aligned
  state.metrics.forEach(m => {
    const isCur = m === 'revenue' || m === 'profit';
    const isPct = m === 'discountPct' || m === 'profitMarginPct';
    cols.push({
      key: m, label: METRIC_LABELS[m] ?? m, sortable: true, align: 'right', width: 160,
      render: isCur ? fmtC : isPct ? fmtPct : fmtN,
    });
  });

  // Derived columns — any column ID that didn't fit MIDS/DIDS.
  // Use COL_DEF_MAP for label/type info; use appropriate renderer per type.
  const alreadyAdded = new Set<string>([...state.groupBy, ...state.metrics]);
  state.derivedCols.forEach(dc => {
    if (alreadyAdded.has(dc)) return;
    const def = (COL_DEF_MAP as Record<string, { label: string; type: string }>)[dc];
    const label = def?.label ?? dc;
    const isAttrOrDate = def?.type === 'attribute' || def?.type === 'date';
    const isCur = dc === 'revenue' || dc === 'profit';
    const isPct = dc === 'discountPct' || dc === 'profitMarginPct';
    // Attribute/date types use String renderer; measures use numeric formatters
    const renderFn = isAttrOrDate ? String : isCur ? fmtC : isPct ? fmtPct : fmtN;
    cols.push({
      key: dc,
      label,
      sortable: true,
      align: isAttrOrDate ? undefined : 'right',
      width: isAttrOrDate ? 140 : 160,
      render: renderFn,
    });
    alreadyAdded.add(dc);
  });

  return cols;
}

// ─── Raw display data (flat rows, filtered + sorted) ──────────────────────────
// Returns individual SALES_DATA rows (not aggregated) so the table has
// enough rows to fill the answer card height (~144 rows unfiltered).

function buildDisplayData(state: QueryState, sourceRows?: Record<string, unknown>[]): Record<string, unknown>[] {
  let rows: Record<string, unknown>[] = (sourceRows ?? SALES_DATA).map((r, i) => ({
    ...r,
    _id: String(i),
  }));

  if (!sourceRows) {
    for (const f of state.filters) {
      rows = rows.filter(r => matchesFilter(r as unknown as SalesDatum, f.col, f.val));
    }
  }

  for (const sort of state.sorts) {
    rows.sort((a, b) => {
      const av = Number(a[sort.col] ?? 0), bv = Number(b[sort.col] ?? 0);
      return sort.dir === 'desc' ? bv - av : av - bv;
    });
  }

  return rows;
}

// ─── Token generation ──────────────────────────────────────────────────────────

type SearchToken = { id: string; label: string; type: TokenType };

const DATE_DIM_IDS = new Set<QDim>(['orderDate', 'orderMonth', 'orderQuarter', 'orderYear']);

function queryToTokens(state: QueryState): SearchToken[] {
  if (!state.metrics.length && !state.groupBy.length && !state.derivedCols.length) return [];
  const tokens: SearchToken[] = [];
  state.metrics.forEach(m => tokens.push({ id: m, label: METRIC_LABELS[m] ?? m, type: 'measure' }));
  state.derivedCols.forEach(dc => {
    const label = METRIC_LABELS[dc as QMetric] ?? dc;
    tokens.push({ id: dc, label, type: 'measure' });
  });
  state.groupBy.forEach(d => tokens.push({ id: d, label: DIM_LABELS[d as QDim] ?? d, type: DATE_DIM_IDS.has(d as QDim) ? 'date' : 'attribute' }));
  state.filters.forEach(f => tokens.push({ id: `f-${f.col}`, label: `${cap(f.col)} = ${f.val}`, type: 'filter' as TokenType }));
  if (state.currency && state.currency !== 'USD') tokens.push({ id: 'currency', label: state.currency, type: 'attribute' });
  return tokens;
}

// titleFromDimsOnly: with canvasScope a query can be all attributes and no
// measures — name it after those columns instead of falling back to 'Answer'.
function queryToTitle(state: QueryState, titleFromDimsOnly = false): string {
  if (!state.metrics.length && !state.derivedCols.length) {
    if (titleFromDimsOnly && state.groupBy.length) {
      return state.groupBy.map(d => DIM_LABELS[d as QDim] ?? d).join(', ');
    }
    return 'Answer';
  }
  const metrics = [
    ...state.metrics.map(m => METRIC_LABELS[m] ?? m),
    ...state.derivedCols.map(dc => METRIC_LABELS[dc as QMetric] ?? dc),
  ].join(', ');
  const dims = state.groupBy.map(d => DIM_LABELS[d as QDim] ?? d).join(', ');
  const filterStr = state.filters.map(f => `${cap(f.col)} = ${f.val}`).join('; ');
  let t = metrics;
  if (dims) t += ` by ${dims}`;
  if (filterStr) t += ` — ${filterStr}`;
  if (state.currency && state.currency !== 'USD') t += ` (${state.currency})`;
  return t;
}

function queryToActiveCols(state: QueryState): Set<string> {
  const s = new Set<string>();
  state.metrics.forEach(m => s.add(m));
  state.groupBy.forEach(d => s.add(d));
  state.filters.forEach(f => s.add(f.col));
  state.derivedCols.forEach(dc => s.add(dc));
  return s;
}



// ─── ThoughtSpot-style dual-axis grouped bar chart (SVG) ─────────────────────

const CHART_COLORS = ['#00C7C4', '#2770EF', '#7C3AED', '#F59E0B'] as const;

function fmtAxisVal(v: number, prefix: string): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${prefix}${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${prefix}${(v / 1_000).toFixed(0)}K`;
  return `${prefix}${Math.round(v)}`;
}

function niceSteps(max: number, steps = 5): number[] {
  if (max <= 0) return [0];
  const raw = max / steps;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const nice = [1, 2, 2.5, 5, 10].map(f => f * mag).find(f => f >= raw) ?? mag * 10;
  return Array.from({ length: steps + 1 }, (_, i) => i * nice);
}

const AnswerChart: React.FC<{ data: AggRow[]; metrics: string[]; groupBy: string[]; colors?: readonly string[]; currencySymbol?: string }> = ({ data, metrics, groupBy, colors = CHART_COLORS, currencySymbol = '' }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 440 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: Math.max(width, 400), h: Math.max(height, 300) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = [...data]; // preserve order from aggregate() which already applied sorts

  const FONT = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const L_PAD = 60;
  const R_PAD = metrics.length > 1 ? 70 : 16;
  const T_PAD = 16;
  const B_PAD = 80;   // room for rotated labels + x-axis label
  const LEGEND_H = 28;
  const FOOTER_H = 22;

  // Chart plot area height — fills the container
  const CHART_H = Math.max(160, size.h - T_PAD - B_PAD - LEGEND_H - FOOTER_H - 8);

  // Bar widths that fill available horizontal space (scroll when too compressed)
  const numGroups = Math.max(rows.length, 1);
  const numBars   = metrics.length;
  const availW    = size.w - L_PAD - R_PAD;
  const rawBarW   = (availW / numGroups - 6) / numBars;
  const BAR_W     = Math.min(36, Math.max(8, rawBarW));
  const BAR_GAP   = 2;
  const GROUP_W   = numBars * (BAR_W + BAR_GAP) + 8;
  const totalW    = Math.max(size.w, numGroups * GROUP_W + L_PAD + R_PAD);

  const leftMax  = Math.max(...rows.map(r => Number(r[metrics[0]] ?? 0)), 1);
  const rightMax = metrics.length > 1 ? Math.max(...rows.map(r => Number(r[metrics[1]] ?? 0)), 1) : 0;
  const leftSteps  = niceSteps(leftMax);
  const rightSteps = metrics.length > 1 ? niceSteps(rightMax) : [];
  const leftAxisMax  = leftSteps[leftSteps.length - 1];
  const rightAxisMax = rightSteps.length ? rightSteps[rightSteps.length - 1] : 1;

  // Returns the prefix to use for axis labels — $ when currencySymbol is set and metric is monetary
  const isCurrency = (m: string) => ['revenue', 'profit'].includes(m) ? currencySymbol : '';
  const metricLabel = (m: string): string => METRIC_LABELS[m as QMetric] ?? m;

  return (
    <div ref={wrapRef} className={styles.barChartWrap}>
      {/* Legend */}
      {metrics.length > 0 && (
        <div style={{ display: 'flex', gap: 16, height: LEGEND_H, alignItems: 'center', justifyContent: 'flex-end', paddingRight: R_PAD, flexShrink: 0 }}>
          {metrics.map((m, i) => (
            <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT, fontSize: 12, color: '#1d232f' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: colors[i] ?? '#ccc', flexShrink: 0 }} />
              {metricLabel(m)}
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowX: 'auto' }}>
        <svg
          width={totalW}
          height={CHART_H + T_PAD + B_PAD}
          role="img"
          aria-label="Bar chart"
          style={{ display: 'block' }}
        >
          {/* Horizontal gridlines + left Y-axis labels */}
          {leftSteps.map((step, i) => {
            const y = T_PAD + CHART_H - Math.round((step / leftAxisMax) * CHART_H);
            return (
              <g key={`lg-${i}`}>
                <line x1={L_PAD} x2={totalW - R_PAD} y1={y} y2={y} stroke="#eaedf2" strokeWidth={1} />
                <text x={L_PAD - 6} y={y + 4} textAnchor="end" fontSize={11} fill="#777e8b" fontFamily={FONT}>
                  {fmtAxisVal(step, isCurrency(metrics[0]))}
                </text>
              </g>
            );
          })}

          {/* Right Y-axis labels */}
          {metrics.length > 1 && rightSteps.map((step, i) => {
            const y = T_PAD + CHART_H - Math.round((step / rightAxisMax) * CHART_H);
            return (
              <text key={`rg-${i}`} x={totalW - R_PAD + 6} y={y + 4} textAnchor="start" fontSize={11} fill="#777e8b" fontFamily={FONT}>
                {fmtAxisVal(step, isCurrency(metrics[1]))}
              </text>
            );
          })}

          {/* Left Y-axis title */}
          <text textAnchor="middle" fontSize={11} fill="#777e8b" fontFamily={FONT}
            transform={`translate(12,${T_PAD + CHART_H / 2}) rotate(-90)`}>
            {metricLabel(metrics[0])}
          </text>

          {/* Right Y-axis title */}
          {metrics.length > 1 && (
            <text textAnchor="middle" fontSize={11} fill="#777e8b" fontFamily={FONT}
              transform={`translate(${totalW - 12},${T_PAD + CHART_H / 2}) rotate(90)`}>
              {metricLabel(metrics[1])}
            </text>
          )}

          {/* Bars + rotated X-axis labels */}
          {rows.map((row, gi) => {
            const groupX = L_PAD + gi * GROUP_W + 4;
            const labelX = groupX + (numBars * (BAR_W + BAR_GAP)) / 2;
            return (
              <g key={row.label}>
                {metrics.map((m, mi) => {
                  const val = Number(row[m] ?? 0);
                  const axMax = mi === 0 ? leftAxisMax : rightAxisMax;
                  const barH = Math.max(1, Math.round((val / axMax) * CHART_H));
                  const x = groupX + mi * (BAR_W + BAR_GAP);
                  const y = T_PAD + CHART_H - barH;
                  return (
                    <rect key={m} x={x} y={y} width={BAR_W} height={barH} rx={2}
                      fill={colors[mi] ?? '#ccc'}>
                      <title>{`${row.label} — ${metricLabel(m)}: ${fmtAxisVal(val, isCurrency(m))}`}</title>
                    </rect>
                  );
                })}
                <text x={labelX} y={T_PAD + CHART_H + 12} textAnchor="end"
                  fontSize={11} fill="#777e8b" fontFamily={FONT}
                  transform={`rotate(-45,${labelX},${T_PAD + CHART_H + 12})`}>
                  {row.label.length > 14 ? row.label.slice(0, 14) + '…' : row.label}
                </text>
              </g>
            );
          })}

          {/* X-axis baseline */}
          <line x1={L_PAD} x2={totalW - R_PAD} y1={T_PAD + CHART_H} y2={T_PAD + CHART_H} stroke="#d0d5dd" strokeWidth={1} />

          {/* X-axis dimension label */}
          {groupBy.length > 0 && (
            <text x={(L_PAD + totalW - R_PAD) / 2} y={T_PAD + CHART_H + B_PAD - 6}
              textAnchor="middle" fontSize={12} fill="#1d232f" fontFamily={FONT}>
              {DIM_LABELS[groupBy[0] as QDim] ?? groupBy[0]} ▾
            </text>
          )}
        </svg>
      </div>

      {/* Footer */}
      <div style={{ fontFamily: FONT, fontSize: 12, color: '#777e8b', height: FOOTER_H, lineHeight: `${FOOTER_H}px`, flexShrink: 0 }}>
        Showing {rows.length} of {rows.length} data points
      </div>
    </div>
  );
};

// ─── ThoughtSpot-style answer table ───────────────────────────────────────────

type AnswerColDef = {
  key: string;
  label: string;
  sortable?: boolean;
  align?: string;
  width?: number;          // fixed px width; undefined = auto/filler
  render?: (v: unknown) => string;
};

const AnswerTable: React.FC<{ columns: AnswerColDef[]; data: Record<string, unknown>[]; lightHeader?: boolean }> = ({ columns, data, lightHeader = false }) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const diff = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av ?? '').localeCompare(String(bv ?? ''));
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className={styles.answerTableWrap}>
      <table className={styles.answerTable}>
        <colgroup>
          {columns.map(col => (
            <col key={col.key} style={{ width: col.width ? `${col.width}px` : undefined }} />
          ))}
          {/* Filler column absorbs remaining space */}
          <col style={{ width: 'auto' }} />
        </colgroup>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={`${styles.answerTh} ${lightHeader ? styles.answerThLight : ''} ${col.align === 'right' ? styles.answerRight : ''}`}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                style={{ cursor: col.sortable ? 'pointer' : 'default' }}
              >
                <div className={styles.thInner}>
                  <span className={styles.thLabel}>
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span style={{ marginLeft: 4, opacity: 0.6 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                  <button className={styles.thMenuBtn} onClick={e => e.stopPropagation()} tabIndex={-1} aria-label="Column options">
                    ···
                  </button>
                </div>
              </th>
            ))}
            {/* Filler header — no content, absorbs remaining width */}
            <th className={`${styles.answerThFiller} ${lightHeader ? styles.answerThFillerLight : ''}`} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, ri) => (
            <tr key={row._id as string ?? ri} className={styles.answerTr}>
              {columns.map(col => (
                <td key={col.key} className={`${styles.answerTd} ${col.align === 'right' ? styles.answerRight : ''}`}>
                  {col.render ? col.render(row[col.key]) : String(row[col.key] ?? '')}
                </td>
              ))}
              <td className={styles.answerTdFiller} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Canvas blocks panel ─────────────────────────────────────────────────────

const CANVAS_COLORS: Record<CanvasBlockKind, string> = {
  query:   'var(--rd-sys-color-content-brand, #2770ef)',
  filter:  '#F59E0B',
  sort:    'var(--rd-sys-color-content-secondary, #5c6a7e)',
  group:   '#7C3AED',
  formula: '#0D9488',
};

const CANVAS_LABELS: Record<CanvasBlockKind, string> = {
  query: 'Query', filter: 'Filter', sort: 'Sort', group: 'Group', formula: 'Formula',
};

const CanvasBlocksPanel: React.FC<{ blocks: CanvasBlock[] }> = ({ blocks }) => {
  if (!blocks.length) return null;
  return (
    <div className={styles.canvasBlocksPanel}>
      {blocks.map((block, i) => (
        <React.Fragment key={block.id}>
          <div className={styles.canvasBlock}>
            <div className={styles.canvasBlockTrack}>
              <span className={styles.canvasBlockDot} style={{ background: CANVAS_COLORS[block.kind] }} />
              {i < blocks.length - 1 && <span className={styles.canvasBlockLine} />}
            </div>
            <div className={styles.canvasBlockBody}>
              <span className={styles.canvasBlockKind} style={{ color: CANVAS_COLORS[block.kind] }}>
                {CANVAS_LABELS[block.kind]}
              </span>
              <span className={styles.canvasBlockLabel}>{block.label}</span>
              <span className={styles.canvasBlockDetail}>{block.detail}</span>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Worksheet placeholder grid ──────────────────────────────────────────────



// ─── Version toggle styles ────────────────────────────────────────────────────

const V1_FONT = '"Plain", -apple-system, sans-serif';

const v1ToggleStyles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    height: '32px',
    background: '#eaedf2',
    borderRadius: '17px',
    padding: '2px',
    gap: '2px',
    boxSizing: 'border-box',
  },
  btn: {
    border: 'none',
    background: 'transparent',
    borderRadius: '14px',
    height: '28px',
    padding: '0 14px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#5d6471',
    cursor: 'pointer',
    fontFamily: V1_FONT,
    transition: 'background 120ms ease, color 120ms ease',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap' as const,
  },
  btnActive: {
    background: '#ffffff',
    color: '#1d232f',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
};


// ─── Component ───────────────────────────────────────────────────────────────

export interface SearchDataExplorationsProps {
  onExit?: () => void;
  onSave?: (snapshot: AnswerSnapshot) => void;
  onSaveChanges?: (snapshot: AnswerSnapshot) => void;
  initialSnapshot?: AnswerSnapshot;
  mode?: 'search' | 'spreadsheet';
  hideSheetOption?: boolean;
  showSpotter?: boolean;
  editMode?: boolean;
  liveboardName?: string;
  onOpenInSheets?: (snapshot: AnswerSnapshot) => void;
  onOpenInSearchData?: (snapshot: AnswerSnapshot) => void;
  // Optional external control of the Query/Spreadsheet toggle — when omitted,
  // this component manages sheetTab entirely on its own (Option 1's usage).
  // A host that renders its own Query/Spreadsheet tabs elsewhere can pass
  // these to drive this component's view and hide its own internal toggle.
  sheetTab?: 'query' | 'sheet';
  onSheetTabChange?: (tab: 'query' | 'sheet') => void;
  hideSheetToggle?: boolean;
  // Collapses the "Search data header" bar entirely (its only remaining
  // content once hideSheetToggle is set and editMode is off) — for a host
  // that renders its own tab strip above this component and doesn't want
  // the leftover empty bar + separator.
  hideHeaderBar?: boolean;
  // Zeroes the outer gutters around the query bar / data panel / chart
  // (Query tab) and the sub-header insets (Spreadsheet tab), so the content
  // spans the full width/height of a host container instead of keeping the
  // 20-24px margins meant for a full-page layout.
  edgeToEdge?: boolean;
  // Hides the data panel's "Popular / All" tab row and its adjacent
  // right-panel toggle button entirely. Default false (Option 1's usage
  // keeps this row). The column list underneath is unaffected either way —
  // panelTab already defaults to 'all' and doesn't filter columns.
  hideColumnPanelTabs?: boolean;
  // Puts the data panel's Search input and Add button on one row (Add as
  // an icon-only button on the right) instead of stacked, and left-aligns
  // the row with the query bar's toggle-panel icon above it. Default false
  // (Option 1's usage keeps the stacked layout + labeled Add button).
  compactPanelSearch?: boolean;
  // Fixes a vertical-alignment bug in the Query tab's column list rows:
  // the checkbox and the column-name pill each sit inside a bare <span>
  // (added for click handling) that isn't itself a flex container, so
  // browser inline-baseline spacing gives the two different amounts of
  // top whitespace and their visual centers don't match. Making those two
  // spans inline-flex/align-items:center removes that gap. Default false
  // (Option 1's usage keeps current spacing).
  alignColumnCheckboxes?: boolean;
  // Lightens the Answer table's header underline from a near-black 2px line
  // (box-shadow using content-primary) to a thin default-border-colored one.
  // Default false (Option 1's usage keeps the darker line).
  lightAnswerTableHeader?: boolean;
  // Optional external Table/Join/Model scoping — when provided, the
  // "(Sample) Retail - Apparel" data-model button (Query tab + Spreadsheet
  // sub-header) becomes a Table/Join/Model selector reflecting a host
  // canvas's own selection, instead of opening the Data Model picker modal,
  // AND the columns/data shown throughout this component (data panel,
  // search bar, chart/table, sheet grid) are scoped to real for that
  // selection — table shows just its columns, join shows the union of both
  // joined tables' columns, model shows every column of every canvas table.
  // Omitted entirely for Option 1's usage, which keeps its current fixed
  // "Sample Retail" schema unchanged.
  canvasScope?: {
    tables: { name: string }[];
    joins: { leftTable: string; rightTable: string }[];
    dataSourceTables: { name: string; columns: string[] }[];
    scope: 'table' | 'join' | 'model';
    selectedTable: string;
    selectedJoin: { leftTable: string; rightTable: string } | null;
    onScopeChange: (scope: 'table' | 'join' | 'model') => void;
    onSelectedTableChange: (name: string) => void;
    onSelectedJoinChange: (join: { leftTable: string; rightTable: string }) => void;
  };
}

// ─── SpotterData panel ───────────────────────────────────────────────────────

type SpotterAction = { type: string; [key: string]: string };

type SpotterIntent =
  | 'query_draft'
  | 'direct_edit'
  | 'formula'
  | 'insight'
  | 'change_analysis'
  | 'chart_setting'
  | 'switch_view'
  | 'version_restored'
  | 'plain';

type ThinkingStep = { name: string; detail?: string; spinner?: boolean; toolCall?: { label: string } };
type ThinkingInfo = { stage: 'analyzing' | 'working' | 'done'; steps: ThinkingStep[]; expanded: boolean };

type ChatMessage =
  | { role: 'user'; text: string }
  | {
      role: 'agent';
      intent: SpotterIntent;
      message: string;
      thinking?: ThinkingInfo;
      columns?: string[];
      removing?: string[];
      actions?: SpotterAction[];
      formula?: string;
      formulaName?: string;
      button?: { label: string; action: string };
      inserted?: boolean;
      superseded?: boolean;
	      versionNum?: number;
	      restoreFromVersion?: number;
	      manualSave?: boolean;
	      versionSnapshot?: AnswerSnapshot;
	    };

const SPOTTER_SYSTEM_PROMPT_BASE = `You are Spotter, a friendly and sharp analytics copilot built into a Search Data tool for RetailHub — an India-based retailer selling Electronics, Furniture, and Home Products. You help users explore their data through natural conversation — building queries, refining them, and surfacing insights.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSONALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Warm but efficient. Write like a smart analyst colleague, not a customer support bot.
- No filler ("Great question!", "Of course!", "Happy to help!") — get straight to the answer.
- Use first person, past tense for actions taken: "I've added revenue by region."
- Bold key entities (**Revenue**, **East region**, **Q3**) using **double-asterisks**.
- Always finish with 2–3 short follow-up suggestions so the user knows where to go next.
- Sentence case throughout. Be concise — one strong sentence beats three weak ones.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATA MODEL — RetailHub Retail Sales Performance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use these EXACT IDs in "columns" and "actions" — no other values are valid.

Measures:   revenue | unitsSold | profit | profitMarginPct | discountPct
Dimensions: region | state | city | productCategory | productSubCategory | productName | customerSegment | customerType | salesChannel
Date:       orderDate | orderMonth | orderQuarter | orderYear

Sample dimension values (for filters):
- region: "North", "South", "East", "West"
- state: "Maharashtra", "Gujarat", "West Bengal", "Odisha", "Delhi", "Rajasthan", "Karnataka", "Tamil Nadu"
- productCategory: "Electronics", "Furniture", "Home Products"
- productSubCategory: "Smartphones", "Laptops", "Televisions", "Tablets", "Cameras", "Sofas", "Beds", "Wardrobes", "Office Chairs", "Dining Tables", "Kitchen Appliances", "Bedding", "Cookware", "Storage", "Curtains"
- customerSegment: "Enterprise", "SMB", "Consumer"
- customerType: "New", "Returning", "Premium"
- salesChannel: "Online", "In-Store"

Key data patterns:
- West region (Maharashtra, Gujarat) leads in revenue — highest MacBook Pro and Samsung Galaxy S24 volumes
- East region (West Bengal, Odisha) underperforms in Electronics — declining profitMarginPct from 2024 to 2025, heavy discounting on LG TVs
- Electronics has higher revenue but lower profit margin than Furniture
- Home Products has consistent ~25% profit margin across all regions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTENT CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Classify every user message into one of these intents:

"query_draft"   — User wants to build or majorly restructure a query. Output "columns" array with the IDs to add. User will review and click "Add to answer" to commit. Use when canvas is empty or user wants a fresh start.

"direct_edit"   — User wants a small change to the existing query: add/remove a filter, change sort, remove a column, switch chart type. Auto-applies immediately. Use when canvas already has columns. NEVER use for formulas.

"insight"         — User asks "what does this show?", "share insights", "summarize this", "what's interesting?" — general analytical question, no canvas changes. Set "actions" to [].

"change_analysis" — User asks WHY something changed or declined: "why is revenue down?", "why is margin low in East?", "what caused the drop?", "explain the decline". Respond with STRUCTURED BULLET POINTS grouped under bold headings. No canvas changes. Set "actions" to [].

"formula"         — User wants ANY calculated or derived metric: percentage change, growth rate, ratio, margin, YoY comparison, running total, rank, or any expression built from existing columns. ALWAYS use this intent for formulas — never use query_draft or direct_edit. Set "formula" to the expression string and "formula_name" to a short label. The user will review before adding.

"chart_setting"   — User wants to change visualization (bar, line, table, etc.).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DECISION RULE — intent selection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Canvas is EMPTY → "query_draft"
- Canvas has columns + user asks for filter/sort/remove/chart change → "direct_edit"
- Canvas has columns + user asks a completely different question (new dimensions/measures) → "query_draft"
- User asks for ANY calculated column, percentage, ratio, growth, change, or formula → ALWAYS "formula"
- When uncertain between query_draft and direct_edit, prefer "direct_edit" if existing columns are relevant.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLUMN ID RULES — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Column IDs are CASE-SENSITIVE camelCase. ONLY use these exact IDs — never snake_case, never abbreviations:
Measures:   revenue | unitsSold | profit | profitMarginPct | discountPct
Dates:      orderDate | orderMonth | orderQuarter | orderYear
Dimensions: region | state | city | productCategory | productSubCategory | productName | customerSegment | customerType | salesChannel

WRONG: "product_category", "units_sold", "profit_margin", "order_month", "category"
RIGHT: "productCategory",  "unitsSold",  "profitMarginPct", "orderMonth", "productCategory"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGE FORMAT BY INTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## query_draft
One sentence describing what you're building, then follow-ups:
"I've drafted a query showing **Revenue** and **Units sold** broken down by **Region** — click Add to answer to apply it.

Want to go deeper?
- **Filter by sales channel** (Online vs In-Store split)
- **Add time trend** (monthly view with orderMonth)
- **Compare product categories** within each region"

## direct_edit
One sentence confirming the change, then follow-ups:
"Done — I've filtered to **East region** only.

You might also want to:
- **Sort by revenue** (highest product first)
- **Add category breakdown** (see what's driving East sales)
- **Compare to West** (add West as a second filter or remove this one)"

## insight
Structured analysis with 2–3 themed sections, then follow-up actions:
"Here's what I'm seeing in this data:

**Top performers**
- **West region** leads with the highest MacBook Pro and Samsung Galaxy S24 volumes — Enterprise and Premium segments driving revenue
- **Furniture** (Sofas, Office Chairs) has the strongest profit margin at ~27%, above Electronics' ~18%

**Watch list**
- **East region Electronics** shows declining profitMarginPct from 2024 to 2025 — LG TV discounting is the likely drag
- **East Odisha** in particular has heavy discounting (up to 20%) pulling margins below 12%

**Would you like me to:**
- Break down East Electronics by product to find the margin drag
- Show a quarterly trend to track the East decline over time
- Compare salesChannel (Online vs In-Store) profitability across regions"

## change_analysis
ALWAYS respond with structured bullet points under bold thematic headings. Never use prose paragraphs. Cover root causes, contributing factors, and specific data signals. Example:
"**Primary drivers**
- **East region Electronics** revenue fell ~18% YoY — LG TVs and Samsung mobiles saw the steepest unit declines
- **Heavy discounting** in East (avg discountPct 19%) compressed margins below 12%, masking volume that would otherwise register as revenue

**Contributing factors**
- **Shift to In-Store channel** in East dropped Online revenue by ~22% — lower average order values and fewer Premium customers
- **Home Products held steady** at ~25% margin across all regions, cushioning the overall portfolio decline

**What this tells us**
- The decline is concentrated in Electronics, not a broad market downturn — Furniture and Home Products are both stable
- Odisha and West Bengal account for the largest absolute revenue drop within East

**Suggested next steps**
- Drill into East Electronics by product sub-category to find the deepest margin drag
- Compare Q1 vs Q3 to see if the decline is accelerating or stabilising
- Filter to Premium customers only to separate channel mix from pricing issues"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You MUST respond with ONLY valid JSON — no markdown fences, no explanation, nothing outside the object. Start with { and end with }.

{
  "intent": "query_draft" | "direct_edit" | "insight" | "change_analysis" | "formula" | "chart_setting",
  "message": "Your natural-language response here. Use \\n for line breaks. Use **bold** for emphasis. Use '- ' prefix for bullets. For change_analysis: ALWAYS use bullet points grouped under **bold headings** — never prose.",
  "columns": ["colId1", "colId2"],
  "actions": [
    { "type": "add_filter",    "column": "region",   "value": "East" },
    { "type": "remove_filter", "column": "region" },
    { "type": "sort",          "column": "revenue",  "direction": "desc" },
    { "type": "add_column",    "column": "profit" },
    { "type": "remove_column", "column": "discountPct" },
    { "type": "change_chart",  "chart_type": "bar" }
  ],
  "removing": [],
  "formula": null,
  "formula_name": null,
  "button": null
}

Rules:
- "columns" is only used for "query_draft" intent — list every column ID to include in the new query.
- "actions" is only used for "direct_edit" intent — list only the changes being made.
- For "formula" intent: set "formula" to the expression (e.g. "(revenue - lag_revenue) / lag_revenue * 100") and "formula_name" to a short label (e.g. "Revenue % change YoY"). Set "columns" and "actions" to [].
- For "insight" intent, "actions" MUST be [].
- For "change_analysis" intent, "actions" MUST be []. ALWAYS use bullet points grouped under **bold headings** in the message — never prose paragraphs.
- NEVER put add_formula in actions — always use intent "formula" instead.
- Never put numbers or data values in the JSON that aren't derivable from the canvas context — only write factual numbers if they appear in the context provided.
- Always reason from the current canvas state context provided below.`;

const buildSpotterPrompt = (qs: QueryState): string => {
  const activeCols = [...qs.metrics, ...qs.groupBy, ...qs.derivedCols];
  const isEmpty = activeCols.length === 0;

  if (isEmpty) {
    return SPOTTER_SYSTEM_PROMPT_BASE + `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCURRENT CANVAS STATE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCanvas is EMPTY — no columns have been added to the answer yet. ALWAYS use intent "query_draft". Populate "columns" with all relevant column IDs. If the user specifies filters or conditions (e.g. "only East region", "last 2 years"), include them as "add_filter" entries inside the "actions" array — do NOT use intent "direct_edit" when canvas is empty.\n`;
  }

  const lines: string[] = [
    `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `CURRENT CANVAS STATE`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Columns on canvas: ${activeCols.join(', ')}`,
  ];
  if (qs.filters.length > 0) {
    lines.push(`Active filters: ${qs.filters.map(f => `${f.col} = "${f.val}"`).join(', ')}`);
  }
  if (qs.sorts.length > 0) {
    lines.push(`Active sorts: ${qs.sorts.map(s => `${s.col} ${s.dir}`).join(', ')}`);
  }
  lines.push(`View mode: ${qs.viewMode}`);
  lines.push(`\nThe canvas is NOT empty — prefer "direct_edit" for incremental changes unless the user wants a completely new query.`);

  return SPOTTER_SYSTEM_PROMPT_BASE + lines.join('\n');
};

const COL_DEF_MAP: Record<string, { label: string; type: TokenType }> = {
  revenue:             { label: 'Revenue',               type: 'measure' },
  unitsSold:           { label: 'Units sold',            type: 'measure' },
  profit:              { label: 'Profit',                type: 'measure' },
  profitMarginPct:     { label: 'Profit margin %',       type: 'measure' },
  discountPct:         { label: 'Discount %',            type: 'measure' },
  orderDate:           { label: 'Order date',            type: 'date' },
  orderMonth:          { label: 'Order month',           type: 'date' },
  orderQuarter:        { label: 'Order quarter',         type: 'date' },
  orderYear:           { label: 'Order year',            type: 'date' },
  region:              { label: 'Region',                type: 'attribute' },
  state:               { label: 'State',                 type: 'attribute' },
  city:                { label: 'City',                  type: 'attribute' },
  productCategory:     { label: 'Product category',      type: 'attribute' },
  productSubCategory:  { label: 'Product sub category',  type: 'attribute' },
  productName:         { label: 'Product name',          type: 'attribute' },
  customerSegment:     { label: 'Customer segment',      type: 'attribute' },
  customerType:        { label: 'Customer type',         type: 'attribute' },
  salesChannel:        { label: 'Sales channel',         type: 'attribute' },
};

// Maps common LLM-hallucinated aliases to valid column IDs.
// The model tends to return snake_case or abbreviated names — this corrects them silently.
const COLUMN_ALIASES: Record<string, string> = {
  units_sold: 'unitsSold', units: 'unitsSold',
  profit_margin_pct: 'profitMarginPct', profit_margin: 'profitMarginPct',
  margin_pct: 'profitMarginPct', margin: 'profitMarginPct',
  discount_pct: 'discountPct', discount: 'discountPct', discount_percentage: 'discountPct',
  order_date: 'orderDate', order_month: 'orderMonth',
  order_quarter: 'orderQuarter', order_year: 'orderYear',
  product_category: 'productCategory', category: 'productCategory', product_cat: 'productCategory',
  product_sub_category: 'productSubCategory', product_subcategory: 'productSubCategory',
  sub_category: 'productSubCategory', subcategory: 'productSubCategory',
  product_name: 'productName',
  customer_segment: 'customerSegment', segment: 'customerSegment',
  customer_type: 'customerType',
  sales_channel: 'salesChannel', channel: 'salesChannel',
};

const VALID_COL_SET = new Set(Object.keys(COL_DEF_MAP));

function normalizeColId(id: string): string | null {
  if (!id || typeof id !== 'string') return null;
  if (VALID_COL_SET.has(id)) return id;
  const lower = id.toLowerCase().replace(/[-\s]/g, '_');
  if (VALID_COL_SET.has(lower)) return lower;
  return COLUMN_ALIASES[lower] ?? null;
}

function sanitizeParsed(p: Record<string, unknown>): Record<string, unknown> {
  const cols = Array.isArray(p.columns)
    ? (p.columns as string[]).map(normalizeColId).filter((x): x is string => x !== null)
    : p.columns;
  const actions = Array.isArray(p.actions)
    ? (p.actions as SpotterAction[])
        .map(a => {
          if (!a.column) return a;
          const norm = normalizeColId(a.column);
          return norm ? { ...a, column: norm } : null;
        })
        .filter((a): a is SpotterAction => a !== null)
    : p.actions;
  return { ...p, columns: cols, actions };
}


const ANALYZING_MS = 700;
const STEP_INTERVAL_MS = 2500;

function getIntentSteps(text: string, canvasIsEmpty: boolean): ThinkingStep[] {
  const lower = text.toLowerCase();
  const title = text.length > 52 ? text.slice(0, 52) + '…' : text;

  if (/formula|calculat|percent|growth|rate|ratio|margin|change.*year|yoy|year.over.year|running total|rank/i.test(lower)) {
    return [
      { name: title, detail: 'Parsing the expression and mapping operands to column IDs in the RetailHub data model.' },
      { name: 'Validating column references', detail: 'Checking that all referenced columns exist in the active worksheet.', spinner: true },
      { name: 'Generating answer', toolCall: { label: 'ThoughtSpot: Answer generation' } },
    ];
  }

  if (canvasIsEmpty) {
    return [
      { name: title, detail: 'Fetching relevant dataset context to identify available columns and measures for this analysis.' },
      { name: 'Fetching dataset context', detail: 'Scanning the RetailHub data model to map your request to measures and attributes.', spinner: true },
      { name: 'Generating answer', toolCall: { label: 'ThoughtSpot: Answer generation' } },
    ];
  }

  if (/filter|only|exclude|include|where|between|last \d|top \d/i.test(lower)) {
    return [
      { name: title, detail: 'Identifying the column and condition to apply to the current query.' },
      { name: 'Verifying with Trust Layer', detail: 'Verifying results with the Trust Layer.', spinner: true },
      { name: 'Translating query', detail: 'Translating your query with the Reasoning Engine.', spinner: true },
      { name: 'Generating answer', toolCall: { label: 'ThoughtSpot: Answer generation' } },
    ];
  }

  if (/sort|order|rank|top \d|bottom \d/i.test(lower)) {
    return [
      { name: title, detail: 'Applying the sort order to the current result set.' },
      { name: 'Verifying with Trust Layer', detail: 'Verifying results with the Trust Layer.', spinner: true },
      { name: 'Generating answer', toolCall: { label: 'ThoughtSpot: Answer generation' } },
    ];
  }

  if (/why|insight|explain|what.*caused|analyz|summariz|trend/i.test(lower)) {
    return [
      { name: title, detail: 'Scanning the data for patterns, trends, and anomalies relevant to your question.' },
      { name: 'Running statistical analysis', detail: 'Computing key drivers and variance contributors across dimensions.', spinner: true },
      { name: 'Generating answer', toolCall: { label: 'ThoughtSpot: Answer generation' } },
    ];
  }

  if (/dollar|\$|currency|rupee|inr|euro|pound|currency symbol/i.test(lower)) {
    return [
      { name: title, detail: 'Changing the currency settings — earlier the axis showed plain numbers, now switching to the requested currency symbol.' },
      { name: 'Work done', toolCall: { label: 'ThoughtSpot: Answer generation' } },
    ];
  }

  if (/color|colour|change.*color|chart.*color/i.test(lower)) {
    return [
      { name: title, detail: 'Applying the new color palette to the chart bars.' },
      { name: 'Work done', toolCall: { label: 'ThoughtSpot: Answer generation' } },
    ];
  }

  if (/chart|bar|line|pie|scatter|table.*view|visualiz/i.test(lower)) {
    return [
      { name: title, detail: 'Evaluating the best visualization type for the current data structure.' },
      { name: 'Generating answer', toolCall: { label: 'ThoughtSpot: Answer generation' } },
    ];
  }

  return [
    { name: title, detail: 'Identifying the change to apply to the current query context.' },
    { name: 'Verifying with Trust Layer', detail: 'Verifying results with the Trust Layer.', spinner: true },
    { name: 'Generating answer', toolCall: { label: 'ThoughtSpot: Answer generation' } },
  ];
}

const ToolCallCard: React.FC<{ label: string }> = ({ label }) => (
  <div className={styles.toolCallCard}>
    <svg className={styles.toolCallIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect width="16" height="16" rx="3" fill="#1d2228"/>
      <path d="M4 5h5M4 8h8M4 11h6" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M11 4l2 1.5L11 7" stroke="#2770ef" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className={styles.toolCallLabel}>{label}</span>
    <span className={styles.toolCallShowDetails}>
      Show Details
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  </div>
);

const ThinkingBlock: React.FC<{ info: ThinkingInfo; onToggle: () => void }> = ({ info, onToggle }) => {
  if (info.stage === 'analyzing') {
    return (
      <div className={styles.thinkingAnalyzingRow}>
        <div className={styles.sdSpinner} />
        <span className={styles.thinkingAnalyzingText}>Analysing…</span>
      </div>
    );
  }

  const isDone = info.stage === 'done';
  const isWorking = info.stage === 'working';
  const currentStep = info.steps.length > 0 ? info.steps[info.steps.length - 1] : null;
  const headerText = isDone ? 'Work done' : (currentStep ? currentStep.name : 'Working…');
  const showInline = isWorking && !info.expanded && !!currentStep;

  return (
    <div className={styles.reasoningBlock}>
      <button
        className={`${styles.reasoningHeader} ${info.expanded ? styles.reasoningHeaderOpen : ''}`}
        onClick={onToggle}
      >
        <span className={[
          styles.reasoningHeaderText,
          isDone ? (info.expanded ? styles.reasoningHeaderTextDoneOpen : styles.reasoningHeaderTextDone) : '',
        ].filter(Boolean).join(' ')}>
          {headerText}
        </span>
        <svg
          className={[
            styles.reasoningChevron,
            info.expanded ? styles.reasoningChevronOpen : '',
            isDone && info.expanded ? styles.reasoningChevronDoneOpen : '',
          ].filter(Boolean).join(' ')}
          viewBox="0 0 14 14" fill="none"
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Inline body — current step detail, collapsed view */}
      <div className={`${styles.reasoningInlineBody}${!showInline ? ` ${styles.reasoningInlineBodyHidden}` : ''}`}>
        <div className={styles.inlineBodyInner}>
          <div className={styles.inlineVline} />
          <div className={styles.inlineContent}>
            {currentStep?.toolCall ? (
              <ToolCallCard label={currentStep.toolCall.label} />
            ) : currentStep?.spinner ? (
              <div className={styles.stepSpinnerRow}>
                <div className={styles.sdSpinnerSm} />
                <p className={styles.inlineStepText}>{currentStep.detail}</p>
              </div>
            ) : (
              <p className={styles.inlineStepText}>{currentStep?.detail ?? ''}</p>
            )}
          </div>
        </div>
      </div>

      {/* Expanded dot-timeline */}
      <div className={`${styles.reasoningBox}${info.expanded ? ` ${styles.reasoningBoxOpen}` : ''}`}>
        {info.steps.map((step, i) => {
          const isCurrent = isWorking && i === info.steps.length - 1;
          const isDoneStep = isDone || (!isCurrent);
          return (
            <div key={i} className={styles.rStep}>
              <div className={styles.rStepTitle}>
                <span className={[
                  styles.stepDot,
                  isCurrent ? styles.stepDotCurrent : '',
                  isDoneStep ? styles.stepDotDone : '',
                ].filter(Boolean).join(' ')} />
                <span className={styles.rStepName}>{step.name}</span>
              </div>
              {(step.detail || step.toolCall) && (
                <div className={styles.rStepBody}>
                  <div className={styles.rStepVline} />
                  <div className={styles.rStepContent}>
                    {step.toolCall ? (
                      <ToolCallCard label={step.toolCall.label} />
                    ) : isCurrent && step.spinner ? (
                      <div className={styles.stepSpinnerRow}>
                        <div className={styles.sdSpinnerSm} />
                        <p className={styles.rStepText}>{step.detail}</p>
                      </div>
                    ) : (
                      <p className={styles.rStepText}>{step.detail}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {isDone && (
          <div className={styles.rStep}>
            <div className={styles.rStepTitle}>
              <span className={`${styles.stepDot} ${styles.stepDotDone}`} />
              <span className={styles.rStepName}>Work done</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const COL_CARD_SECTIONS: Array<{ id: string; label: string; type: TokenType }> = [
  { id: 'measure',   label: 'Measures',   type: 'measure' },
  { id: 'attribute', label: 'Attributes', type: 'attribute' },
  { id: 'date',      label: 'Date',       type: 'date' },
];

const ColSelectionCard: React.FC<{
  columns: string[];
  removing?: string[];
  actions: SpotterAction[];
  inserted?: boolean;
  superseded?: boolean;
  onInsert: (filteredActions: SpotterAction[]) => void;
  onUndo?: () => void;
}> = ({ columns, removing = [], actions, inserted, superseded, onInsert }) => {
  const isDisabled = inserted || superseded;
  const [selectedAdd, setSelectedAdd] = useState<Set<string>>(() => new Set(columns));
  const toggleAdd = (col: string) => {
    if (inserted) return;
    setSelectedAdd(prev => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  };
  const handleInsert = () => {
    const colActions = [...selectedAdd].map(col => ({ type: 'add_column' as const, column: col }));
    const extraActions = actions.filter(a => a.type !== 'add_column' && a.type !== 'add_formula');
    onInsert([...colActions, ...extraActions]);
  };

  const bySection = COL_CARD_SECTIONS.map(sec => ({
    ...sec,
    cols: columns.filter(col => COL_DEF_MAP[col]?.type === sec.type),
  })).filter(sec => sec.cols.length > 0);

  const filterActions = actions.filter(a => a.type === 'add_filter');

  const hasContent = columns.length > 0 || removing.length > 0 || filterActions.length > 0;
  if (!hasContent) {
    return (
      <div className={styles.colCardWrap}>
        {!isDisabled && (
          <div className={styles.cardFooter}>
            <Button variant="secondary" size="basic" onClick={() => onInsert(actions)}>Add to Answer</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.colCardWrap} style={superseded ? { opacity: 0.45, pointerEvents: 'none' } : undefined}>
      {superseded && (
        <div className={styles.supersededBadge}>Updated in newer response</div>
      )}
      <div className={styles.colCardScrollBody}>
        {bySection.map(sec => (
          <div key={sec.id}>
            <div className={styles.colCardSectionLabel}>{sec.label}</div>
            {sec.cols.map(col => {
              const def = COL_DEF_MAP[col];
              if (!def) return null;
              return (
                <div key={col} className={`${styles.colCardRow}${isDisabled ? ` ${styles.colCardRowDisabled}` : ''}`}>
                  <span style={isDisabled ? { opacity: 0.4 } : undefined}>
                    <Checkbox checked={selectedAdd.has(col)} onChange={() => toggleAdd(col)} showLabel={false} disabled={isDisabled} />
                  </span>
                  <DataToken label={def.label} type={def.type} variant="panel" />
                </div>
              );
            })}
          </div>
        ))}
        {(removing.length > 0 || filterActions.length > 0) && (
          <div>
            <div className={styles.colCardSectionLabel}>Filters</div>
            {removing.map(col => {
              const def = COL_DEF_MAP[col];
              if (!def) return null;
              return (
                <div key={col} className={`${styles.colCardRow}${isDisabled ? ` ${styles.colCardRowDisabled}` : ''}`}>
                  <DataToken label={def.label} type={def.type} variant="panel" />
                </div>
              );
            })}
            {filterActions.map((a, i) => {
              const def = COL_DEF_MAP[a.column];
              const label = def ? (a.value ? `${def.label} = ${a.value}` : def.label) : a.column;
              return (
                <div key={`fa-${i}`} className={`${styles.colCardRow}${isDisabled ? ` ${styles.colCardRowDisabled}` : ''}`}>
                  <DataToken label={label} type="filter" variant="panel" />
                </div>
              );
            })}
          </div>
        )}
      </div>
      {!isDisabled && (
        <div className={styles.cardFooter}>
          <Button
            variant="secondary"
            size="basic"
            fullWidth
            disabled={selectedAdd.size === 0 && filterActions.length === 0}
            onClick={handleInsert}
          >
            Add to Answer
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Version control card ────────────────────────────────────────────────────

const VersionCard: React.FC<{ versionNum: number; isLatest: boolean; onRestore?: () => void; title?: string }> = ({ versionNum, isLatest, onRestore, title = 'Agent updates applied' }) => {
  const [hovered, setHovered] = useState(false);

  if (isLatest) {
    return (
      <div className={styles.versionCardLatest}>
        <div className={styles.versionCardText}>
          <span className={styles.versionCardTitle}>{title}</span>
          <span className={styles.versionCardSub}>Version {versionNum}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.versionCard}${hovered ? ` ${styles.versionCardHover}` : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && <span className={styles.versionTooltip}>Restore this version</span>}
      <div className={styles.versionCardText}>
        <span className={styles.versionCardTitle}>{title}</span>
        <span className={styles.versionCardSub}>Version {versionNum}</span>
      </div>
      <button className={styles.versionRestoreBtn} onClick={onRestore} aria-label="Restore this version">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

const SpotterDataPanel: React.FC<{
  onClose: () => void;
  onAction: (actions: SpotterAction[]) => void;
  queryState: QueryState;
  messages: ChatMessage[];
	  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
	  isTyping: boolean;
	  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
	  isDirty: boolean;
	  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
	  onCreateVersionSnapshot: (actions?: SpotterAction[]) => AnswerSnapshot;
	  onRestoreVersion: (snapshot: AnswerSnapshot) => void;
	  editMode?: boolean;
	  liveboardName?: string;
	}> = ({ onClose, onAction, queryState, messages, setMessages, isTyping, setIsTyping, isDirty, setIsDirty, onCreateVersionSnapshot, onRestoreVersion, editMode = false, liveboardName }) => {
  const [inputVal, setInputVal] = useState('');
  const [thinkingInfo, setThinkingInfo] = useState<ThinkingInfo | null>(null);
  const [chatInputFocused, setChatInputFocused] = useState(false);
  const [panelWidth, setPanelWidth] = useState<number>(342);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const newResponseRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const thinkingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const liveStepsRef = useRef<ThinkingStep[]>([]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const next = startW - dx;
      const max = Math.floor(window.innerWidth * 0.33);
      const clamped = Math.max(342, Math.min(max, next));
      setPanelWidth(clamped);
    };
    const onUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Typeahead: match last word in input against column names
  const chatSuggestions = React.useMemo(() => {
    if (!chatInputFocused || !inputVal.trim()) return [];
    const lastWord = inputVal.trim().split(/\s+/).pop() ?? '';
    if (!lastWord || lastWord.length < 2) return [];
    return Object.entries(COL_DEF_MAP)
      .filter(([, { label }]) => label.toLowerCase().includes(lastWord.toLowerCase()))
      .map(([id, { label, type }]) => ({ id, label, type: type as TokenType }))
      .slice(0, 6);
  }, [inputVal, chatInputFocused]);

  const scrollToLatest = () => newResponseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  useEffect(() => { scrollToLatest(); }, [messages.length, isTyping]);

  // ── Canned / pattern-matched Spotter responses (no API needed) ────────────
  type SpotterResponse = {
    intent: SpotterIntent;
    message: string;
    columns?: string[];
    removing?: string[];
    actions?: SpotterAction[];
    formula?: string;
    formula_name?: string;
    button?: { label: string; action: string };
  };

  const getSpotterResponse = (text: string, qs: QueryState, isEmpty: boolean): SpotterResponse => {
    const t = text.toLowerCase();
    const has = (...kws: string[]) => kws.some(k => t.includes(k));

    // ── FORMULA intent ────────────────────────────────────────────────────────
    const isFormulaRequest = has(
      'formula', 'calculate', 'compute', 'ratio',
      // growth / change keywords
      'growth', 'year over year', 'yoy', 'cagr',
      'percentage change', 'percent change', '% change', 'pct change',
      'change in revenue', 'revenue change', 'revenue growth',
      'change in profit', 'profit change', 'profit growth',
      'change in units', 'units change', 'volume growth',
      'trend', 'period over period', 'pop', 'mom', 'qoq',
      'last 2 years', 'last two years', 'previous year', 'prior year',
      'compared to last year', 'vs last year', 'vs prior year',
      'increase', 'decrease', 'delta',
    );

    if (isFormulaRequest) {
      // YoY / period-over-period revenue change
      if (has('percentage change', 'percent change', '% change', 'pct change', 'revenue change', 'revenue growth', 'yoy', 'year over year', 'last 2 years', 'last two years', 'previous year', 'prior year', 'compared to last year', 'vs last year', 'increase', 'decrease', 'delta') && has('revenue', 'sales', 'income')) {
        return {
          intent: 'formula',
          message: 'Here\'s a **Revenue % Change YoY** formula comparing 2025 vs 2024 revenue for each dimension group. Rows from 2024 (the base year) will show blank.',
          formula: 'revenue_yoy_change',
          formula_name: 'Revenue % Change (YoY)',
        };
      }
      // YoY profit change
      if (has('percentage change', 'percent change', '% change', 'profit change', 'profit growth', 'yoy', 'year over year') && has('profit')) {
        return {
          intent: 'formula',
          message: 'Here\'s a **Profit % Change YoY** formula comparing 2025 vs 2024 for each group. Base-year (2024) rows show blank.',
          formula: 'revenue_yoy_change',
          formula_name: 'Profit % Change (YoY)',
        };
      }
      // Growth rate / CAGR
      if (has('cagr', 'compound', 'growth rate')) {
        return {
          intent: 'formula',
          message: 'Here\'s a **Revenue Growth Rate** formula comparing 2025 vs 2024 across the current grouping.',
          formula: 'revenue_yoy_change',
          formula_name: 'Revenue Growth Rate %',
        };
      }
      if (has('profit margin', 'margin %', 'margin pct', 'margin percent')) {
        return {
          intent: 'formula',
          message: 'Here\'s a **Profit Margin %** formula using your current columns.',
          formula: 'Profit / Revenue * 100',
          formula_name: 'Profit Margin %',
        };
      }
      if (has('revenue per unit', 'avg revenue', 'average revenue', 'revenue per order')) {
        return {
          intent: 'formula',
          message: 'Here\'s an **Avg Revenue per Unit** formula using your current columns.',
          formula: 'Revenue / Units Sold',
          formula_name: 'Avg Revenue per Unit',
        };
      }
      if (has('profit per unit', 'profit per sale')) {
        return {
          intent: 'formula',
          message: 'Here\'s a **Profit per Unit** formula using your current columns.',
          formula: 'Profit / Units Sold',
          formula_name: 'Profit per Unit',
        };
      }
      if (has('discount impact', 'discount effect', 'discount cost')) {
        return {
          intent: 'formula',
          message: 'Here\'s a **Discount Impact** formula estimating revenue lost to discounts.',
          formula: 'Revenue * Discount % / 100',
          formula_name: 'Discount Impact',
        };
      }
      // Generic formula fallback
      return {
        intent: 'formula',
        message: 'I\'ve prepared a custom formula based on your request. Review and apply it below.',
        formula: 'Revenue - Profit',
        formula_name: 'Cost Estimate',
      };
    }

    // ── INSIGHT intent ────────────────────────────────────────────────────────
    if (has('insight', 'analyze', 'analysis', 'tell me', 'what does', 'what is', 'explain', 'summarize', 'summary', 'why is', 'why did', 'what happened', 'understand')) {
      const hasData = qs.metrics.length > 0 || qs.groupBy.length > 0;
      if (!hasData) {
        return {
          intent: 'insight',
          message: 'Build a query first, then I can analyze the results for trends, anomalies, and highlights.\n\n- Show revenue by region\n- Show profit by product category\n- Show units sold over time',
        };
      }
      return {
        intent: 'insight',
        message: 'Based on your current view:\n\n**West** leads in revenue at 34% of total, followed by **East** at 28%. **Electronics** is the top-performing category with above-average margins. Revenue peaks in **Q4**, largely driven by holiday promotions in the Online channel.\n\nDiscount rates are highest in **Clothing** (avg 18%), which is compressing margins in that category.\n\n- Filter to Electronics to explore further\n- Compare Online vs In-Store channels\n- Add Profit Margin % to see profitability',
      };
    }

    // ── CHART COLOR intent ────────────────────────────────────────────────────
    {
      const COLOR_MAP: Record<string, string> = {
        purple: '#7C3AED', violet: '#7C3AED',
        blue: '#2770EF', indigo: '#2770EF',
        teal: '#00C7C4', cyan: '#00C7C4', aqua: '#00C7C4',
        amber: '#F59E0B', yellow: '#F59E0B',
        green: '#22C55E', emerald: '#22C55E',
        red: '#EF4444', coral: '#EF4444',
        orange: '#F97316',
        pink: '#EC4899',
      };
      const colorEntry = Object.entries(COLOR_MAP).find(([name]) => t.includes(name));
      if (colorEntry && has('color', 'colour', 'chart', 'bar', 'change', 'make it', 'turn')) {
        const [colorName, colorHex] = colorEntry;
        const label = colorName.charAt(0).toUpperCase() + colorName.slice(1);
        return {
          intent: 'direct_edit',
          message: `Here I've changed the chart bars to **${label}**. The color is now updated in the chart.\n\n- Change to a different color\n- Switch to table view\n- Add another metric to compare`,
          actions: [{ type: 'change_color', color: colorHex }],
        };
      }
    }

    // ── CURRENCY SYMBOL intent ────────────────────────────────────────────────
    if (has('dollar', 'usd', '$', 'currency', 'rupee', 'inr', '₹', 'euro', '€', 'pound', '£', 'currency symbol', 'show currency', 'remove currency', 'remove dollar', 'no currency', 'no dollar', 'plain number', 'without symbol')) {
      const removing = has('remove', 'no ', 'without', 'plain', 'hide');
      if (removing) {
        return {
          intent: 'direct_edit',
          message: 'Sure, I have removed the currency symbol — axis labels now show plain numbers.\n\n- Add dollar signs back\n- Change chart color\n- Change axis',
          actions: [{ type: 'change_currency', symbol: '' }],
        };
      }
      const symbol = has('rupee', 'inr', '₹') ? '₹'
        : has('euro', '€') ? '€'
        : has('pound', '£') ? '£'
        : '$';
      const currName = symbol === '₹' ? 'Rupees' : symbol === '€' ? 'Euros' : symbol === '£' ? 'Pounds' : 'Dollars';
      return {
        intent: 'direct_edit',
        message: `Sure, I have updated the revenue currency to **${currName}**.\n\n- Switch to a line chart\n- Change chart color\n- Change axis`,
        actions: [{ type: 'change_currency', symbol }],
      };
    }

    // ── SWITCH VIEW intent ────────────────────────────────────────────────────
    if (has('switch to chart', 'show as chart', 'chart view', 'bar chart', 'line chart', 'show chart')) {
      return {
        intent: 'direct_edit',
        message: 'Here I have updated the view to **Chart** mode so you can see the data visually.\n\n- Switch back to table view\n- Add a dimension to group the chart\n- Filter by region',
        actions: [{ type: 'change_chart', chart_type: 'chart' }],
      };
    }
    if (has('switch to table', 'table view', 'show as table', 'show table')) {
      return {
        intent: 'direct_edit',
        message: 'Here I have updated the view to **Table** mode for a detailed row-by-row breakdown.\n\n- Switch back to chart view\n- Sort by revenue descending\n- Add a filter',
        actions: [{ type: 'change_chart', chart_type: 'table' }],
      };
    }

    // ── DIRECT_EDIT: filters ──────────────────────────────────────────────────
    if (!isEmpty) {
      // Region filters
      if (has('east region', 'region east', 'only east', 'filter east', 'eastern')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have updated the analysis to filter by **East** region only.\n\n- Change to West region\n- Add product category breakdown\n- Remove the region filter',
          actions: [{ type: 'add_filter', column: 'region', value: 'East' }],
        };
      }
      if (has('west region', 'region west', 'only west', 'filter west', 'western')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have updated the analysis to filter by **West** region only.\n\n- Compare with East region\n- Break down by sales channel\n- Sort by revenue descending',
          actions: [{ type: 'add_filter', column: 'region', value: 'West' }],
        };
      }
      if (has('north region', 'region north', 'only north', 'filter north')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have updated the analysis to filter by **North** region only.\n\n- Compare with South region\n- Add product category dimension\n- Remove the filter',
          actions: [{ type: 'add_filter', column: 'region', value: 'North' }],
        };
      }
      if (has('south region', 'region south', 'only south', 'filter south')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have updated the analysis to filter by **South** region only.\n\n- Compare with North region\n- Sort by revenue descending\n- Add customer segment breakdown',
          actions: [{ type: 'add_filter', column: 'region', value: 'South' }],
        };
      }

      // Category filters
      if (has('electronics', 'electronic')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have updated the analysis to show **Electronics** category only.\n\n- Switch to Clothing category\n- Add sub-category breakdown\n- Compare profit margin across categories',
          actions: [{ type: 'add_filter', column: 'productCategory', value: 'Electronics' }],
        };
      }
      if (has('clothing', 'apparel', 'fashion')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have updated the analysis to show **Clothing** category only.\n\n- Switch to Electronics category\n- Add discount % to see margin impact\n- Filter by sales channel',
          actions: [{ type: 'add_filter', column: 'productCategory', value: 'Clothing' }],
        };
      }
      if (has('furniture', 'home furnishing')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have updated the analysis to show **Furniture** category only.\n\n- Add sub-category dimension\n- Compare with Electronics\n- Filter to online channel',
          actions: [{ type: 'add_filter', column: 'productCategory', value: 'Furniture' }],
        };
      }

      // Channel filters
      if (has('online', 'e-commerce', 'ecommerce', 'digital channel', 'online channel', 'online sales')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have updated the analysis to show **Online** channel only.\n\n- Compare with In-Store channel\n- Add region dimension\n- Sort by revenue descending',
          actions: [{ type: 'add_filter', column: 'salesChannel', value: 'Online' }],
        };
      }
      if (has('in-store', 'in store', 'offline', 'retail store', 'store channel')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have updated the analysis to show **In-Store** channel only.\n\n- Compare with Online channel\n- Add region dimension\n- Filter by category',
          actions: [{ type: 'add_filter', column: 'salesChannel', value: 'In-Store' }],
        };
      }

      // Customer segment filters
      if (has('enterprise', 'enterprise customer', 'b2b', 'business customer')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have updated the analysis to show **Enterprise** customer segment only.\n\n- Switch to Consumer segment\n- Add product category breakdown\n- Compare profit margins',
          actions: [{ type: 'add_filter', column: 'customerSegment', value: 'Enterprise' }],
        };
      }
      if (has('consumer', 'consumer segment', 'b2c', 'individual customer', 'retail customer')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have updated the analysis to show **Consumer** segment only.\n\n- Switch to Enterprise segment\n- Filter by region\n- Add channel breakdown',
          actions: [{ type: 'add_filter', column: 'customerSegment', value: 'Consumer' }],
        };
      }

      // Remove filter
      if (has('remove filter', 'clear filter', 'no filter', 'all regions', 'all categories', 'show all', 'reset filter')) {
        const filterToRemove = qs.filters[0];
        if (filterToRemove) {
          return {
            intent: 'direct_edit',
            message: `Here I have removed the **${filterToRemove.col}** filter so you can see all data.\n\n- Add a different filter\n- Sort by revenue descending\n- Add a new dimension`,
            actions: [{ type: 'remove_filter', column: filterToRemove.col }],
          };
        }
      }

      // Sort actions
      if (has('sort by revenue', 'highest revenue', 'top revenue', 'most revenue', 'order by revenue')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have sorted the results by **Revenue** (highest first).\n\n- Sort by profit instead\n- Filter to top region\n- Add a category breakdown',
          actions: [{ type: 'sort', column: 'revenue', direction: 'desc' }],
        };
      }
      if (has('sort by profit', 'highest profit', 'most profit', 'order by profit')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have sorted the results by **Profit** (highest first).\n\n- Sort by revenue instead\n- Filter to top category\n- Add profit margin formula',
          actions: [{ type: 'sort', column: 'profit', direction: 'desc' }],
        };
      }
      if (has('sort ascending', 'lowest first', 'bottom', 'smallest', 'least revenue', 'least profit')) {
        const sortCol = has('profit') ? 'profit' : 'revenue';
        return {
          intent: 'direct_edit',
          message: `Here I have sorted the results by **${sortCol === 'profit' ? 'Profit' : 'Revenue'}** (lowest first).\n\n- Sort descending instead\n- Add a filter\n- Explore top performers`,
          actions: [{ type: 'sort', column: sortCol, direction: 'asc' }],
        };
      }
      if (has('sort by units', 'most units', 'top units', 'units sold order', 'order by units')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have sorted the results by **Units Sold** (highest first).\n\n- Sort by revenue instead\n- Add a category filter\n- Compare with profit',
          actions: [{ type: 'sort', column: 'unitsSold', direction: 'desc' }],
        };
      }
      if (has('sort by discount', 'most discount', 'highest discount', 'order by discount')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have sorted by **Discount %** (highest first) to spot where margins are most compressed.\n\n- Filter to categories with high discounts\n- Add profit margin formula\n- Compare by region',
          actions: [{ type: 'sort', column: 'discountPct', direction: 'desc' }],
        };
      }

      // Add column actions
      if (has('add region', 'include region', 'break down by region', 'by region', 'region breakdown')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have added **Region** as a dimension to break down the data geographically.\n\n- Filter to a specific region\n- Sort by revenue descending\n- Add sales channel too',
          actions: [{ type: 'add_column', column: 'region' }],
        };
      }
      if (has('add category', 'include category', 'product category', 'by category', 'category breakdown')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have added **Product Category** to give a product-level breakdown.\n\n- Add sub-category for more detail\n- Filter to Electronics\n- Sort by profit descending',
          actions: [{ type: 'add_column', column: 'productCategory' }],
        };
      }
      if (has('add profit', 'include profit', 'show profit', 'profit column')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have added **Profit** alongside revenue so you can compare the two.\n\n- Add Profit Margin % formula\n- Sort by profit descending\n- Filter by category',
          actions: [{ type: 'add_column', column: 'profit' }],
        };
      }
      if (has('add units', 'include units', 'units sold', 'add units sold', 'show units')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have added **Units Sold** to track volume alongside revenue.\n\n- Add a region breakdown\n- Sort by units descending\n- Add Avg Revenue per Unit formula',
          actions: [{ type: 'add_column', column: 'unitsSold' }],
        };
      }
      if (has('add discount', 'include discount', 'discount column', 'show discount')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have added **Discount %** so you can see how promotions vary across the data.\n\n- Sort by discount descending\n- Filter to high-discount categories\n- Add Profit Margin formula',
          actions: [{ type: 'add_column', column: 'discountPct' }],
        };
      }
      if (has('add margin', 'profit margin', 'add profit margin', 'margin column', 'show margin')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have added **Profit Margin %** to track profitability across the breakdown.\n\n- Sort by margin descending\n- Filter to the most profitable category\n- Add discount % to see its effect',
          actions: [{ type: 'add_column', column: 'profitMarginPct' }],
        };
      }
      if (has('add channel', 'sales channel', 'by channel', 'channel breakdown')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have added **Sales Channel** to compare Online vs In-Store performance.\n\n- Filter to Online channel\n- Sort by revenue descending\n- Add region for a full cross-tab',
          actions: [{ type: 'add_column', column: 'salesChannel' }],
        };
      }
      if (has('add month', 'by month', 'monthly', 'month breakdown', 'trend by month')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have added **Order Month** to show how performance trends over time.\n\n- Switch to chart for a trend line\n- Add year for year-over-year view\n- Filter to a specific quarter',
          actions: [{ type: 'add_column', column: 'orderMonth' }],
        };
      }
      if (has('add quarter', 'by quarter', 'quarterly', 'quarter breakdown', 'q1', 'q2', 'q3', 'q4')) {
        return {
          intent: 'direct_edit',
          message: 'Here I have added **Quarter** to break down performance by Q1–Q4.\n\n- Switch to chart to visualize the trend\n- Filter to Q4 (peak season)\n- Add product category for deeper analysis',
          actions: [{ type: 'add_column', column: 'orderQuarter' }],
        };
      }
    }

    // ── QUERY_DRAFT intent (builds new analysis from scratch) ─────────────────
    // Revenue + dimension combos
    if (has('revenue by region', 'revenue per region', 'region revenue', 'sales by region', 'sales per region')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll build a **Revenue by Region** view to compare performance across all geographies.\n\n- Add product category for a deeper cut\n- Filter to East region only\n- Sort by revenue descending',
        columns: ['revenue', 'region'],
        actions: [{ type: 'add_column', column: 'revenue' }, { type: 'add_column', column: 'region' }],
      };
    }
    if (has('revenue by category', 'revenue per category', 'category revenue', 'sales by category', 'sales per category')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll build a **Revenue by Product Category** view to see which categories drive the most sales.\n\n- Add region for geographic detail\n- Filter to Electronics\n- Add profit margin to compare profitability',
        columns: ['revenue', 'productCategory'],
        actions: [{ type: 'add_column', column: 'revenue' }, { type: 'add_column', column: 'productCategory' }],
      };
    }
    if (has('revenue by channel', 'channel revenue', 'sales by channel', 'online vs', 'in-store vs')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll build a **Revenue by Sales Channel** view to compare Online vs In-Store performance.\n\n- Add region to see channel mix by geography\n- Filter to Online only\n- Add units sold to track volume',
        columns: ['revenue', 'salesChannel'],
        actions: [{ type: 'add_column', column: 'revenue' }, { type: 'add_column', column: 'salesChannel' }],
      };
    }
    if (has('revenue by product', 'product revenue', 'top products', 'sales by product', 'product performance', 'best selling')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll build a **Revenue by Product** view to rank products by their sales contribution.\n\n- Filter to top category\n- Sort by revenue descending\n- Add profit to see which products are most profitable',
        columns: ['revenue', 'productName'],
        actions: [
          { type: 'add_column', column: 'revenue' },
          { type: 'add_column', column: 'productName' },
          { type: 'sort', column: 'revenue', direction: 'desc' },
        ],
      };
    }
    if (has('revenue by month', 'monthly revenue', 'revenue trend', 'revenue over time', 'revenue by time')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll build a **Monthly Revenue** trend to see how sales evolve over time.\n\n- Switch to chart view for a trend line\n- Add product category for a stacked view\n- Compare Q3 vs Q4 seasonality',
        columns: ['revenue', 'orderMonth'],
        actions: [{ type: 'add_column', column: 'revenue' }, { type: 'add_column', column: 'orderMonth' }],
      };
    }
    if (has('revenue by quarter', 'quarterly revenue', 'revenue by q', 'revenue per quarter')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll build a **Quarterly Revenue** view to track performance across Q1–Q4.\n\n- Switch to chart for a visual trend\n- Add region for geographic breakdown\n- Filter to Q4 peak season',
        columns: ['revenue', 'orderQuarter'],
        actions: [{ type: 'add_column', column: 'revenue' }, { type: 'add_column', column: 'orderQuarter' }],
      };
    }
    if (has('revenue by segment', 'customer segment revenue', 'segment revenue', 'by customer type')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll build a **Revenue by Customer Segment** view to compare Enterprise vs Consumer performance.\n\n- Add sales channel to see how each segment buys\n- Filter to Enterprise only\n- Add profit for margin comparison',
        columns: ['revenue', 'customerSegment'],
        actions: [{ type: 'add_column', column: 'revenue' }, { type: 'add_column', column: 'customerSegment' }],
      };
    }

    // Profit analyses
    if (has('profit by region', 'region profit', 'profit per region')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll build a **Profit by Region** view to compare profitability across all geographies.\n\n- Add revenue to compare with profit\n- Add profit margin % formula\n- Filter to the most profitable region',
        columns: ['profit', 'region'],
        actions: [{ type: 'add_column', column: 'profit' }, { type: 'add_column', column: 'region' }],
      };
    }
    if (has('profit by category', 'category profit', 'profit per category', 'most profitable category')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll build a **Profit by Category** view to find which product categories are most profitable.\n\n- Add revenue to see revenue vs profit\n- Filter to Electronics\n- Add discount % to spot margin pressure',
        columns: ['profit', 'productCategory'],
        actions: [{ type: 'add_column', column: 'profit' }, { type: 'add_column', column: 'productCategory' }],
      };
    }
    if (has('profit and revenue', 'revenue and profit', 'profit vs revenue', 'compare profit')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll build a **Revenue & Profit** view to compare the two metrics side by side.\n\n- Add a dimension to break it down further\n- Add profit margin % formula\n- Sort by profit descending',
        columns: ['revenue', 'profit'],
        actions: [{ type: 'add_column', column: 'revenue' }, { type: 'add_column', column: 'profit' }],
      };
    }

    // Units sold analyses
    if (has('units by region', 'units sold by region', 'region units', 'volume by region')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll build a **Units Sold by Region** view to track volume across geographies.\n\n- Add revenue to compare volume with revenue\n- Filter to West region\n- Sort by units descending',
        columns: ['unitsSold', 'region'],
        actions: [{ type: 'add_column', column: 'unitsSold' }, { type: 'add_column', column: 'region' }],
      };
    }
    if (has('units by category', 'units sold by category', 'category volume', 'volume by category')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll build a **Units Sold by Category** view to compare product volume across categories.\n\n- Add revenue to see which categories have high volume vs high value\n- Filter to Electronics\n- Sort by units descending',
        columns: ['unitsSold', 'productCategory'],
        actions: [{ type: 'add_column', column: 'unitsSold' }, { type: 'add_column', column: 'productCategory' }],
      };
    }

    // Simple single-metric
    if (has('show revenue', 'total revenue', 'overall revenue', 'just revenue', 'revenue only')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll show total **Revenue** across all data. Add a dimension to break it down further.\n\n- Break down by region\n- Break down by product category\n- Add profit to compare',
        columns: ['revenue'],
        actions: [{ type: 'add_column', column: 'revenue' }],
      };
    }
    if (has('show profit', 'total profit', 'overall profit', 'just profit', 'profit only')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll show total **Profit** across all data. Add a dimension to see where it\'s coming from.\n\n- Break down by region\n- Break down by category\n- Add revenue for comparison',
        columns: ['profit'],
        actions: [{ type: 'add_column', column: 'profit' }],
      };
    }
    if (has('show units', 'total units', 'units sold', 'overall units')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll show total **Units Sold** across all products and regions.\n\n- Break down by product category\n- Add revenue to see value vs volume\n- Filter to a specific channel',
        columns: ['unitsSold'],
        actions: [{ type: 'add_column', column: 'unitsSold' }],
      };
    }
    if (has('discount', 'discounting', 'promo', 'promotion')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll show **Discount %** alongside category and region to understand where promotions are most aggressive.\n\n- Sort by discount descending\n- Filter to Clothing (typically highest discounts)\n- Add profit margin to see the impact',
        columns: ['discountPct', 'productCategory', 'region'],
        actions: [
          { type: 'add_column', column: 'discountPct' },
          { type: 'add_column', column: 'productCategory' },
          { type: 'add_column', column: 'region' },
        ],
      };
    }

    // Broad "revenue" match — general starting point
    if (has('revenue', 'sales', 'income')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll build a **Revenue by Region** view — a great starting point for exploring sales performance.\n\n- Break down by product category instead\n- Add profit to see margins\n- Filter to a specific channel',
        columns: ['revenue', 'region'],
        actions: [{ type: 'add_column', column: 'revenue' }, { type: 'add_column', column: 'region' }],
      };
    }
    if (has('profit', 'margin', 'profitability')) {
      return {
        intent: 'query_draft',
        message: 'I\'ll build a **Profit by Category** view to highlight where your margins are strongest.\n\n- Add revenue for a side-by-side comparison\n- Filter to Electronics\n- Add the Profit Margin % formula',
        columns: ['profit', 'productCategory'],
        actions: [{ type: 'add_column', column: 'profit' }, { type: 'add_column', column: 'productCategory' }],
      };
    }

    // ── HELP / PLAIN fallback ─────────────────────────────────────────────────
    if (has('help', 'what can you', 'what do you', 'capabilities', 'features')) {
      return {
        intent: 'plain',
        message: 'Here\'s what you can ask me:\n\n**Build a new analysis**\n- "Show revenue by region"\n- "Profit by category"\n- "Units sold by channel"\n\n**Refine your current view**\n- "Filter to Electronics"\n- "Sort by revenue descending"\n- "Add discount %"\n\n**Formulas**\n- "Calculate profit margin %"\n- "Profit per unit formula"\n\n**Insights**\n- "What trends do you see?"\n- "Analyze the current view"',
      };
    }

    // Final fallback — generic query_draft
    return {
      intent: 'query_draft',
      message: `I'll set up a **Revenue by Region** analysis based on your request. You can refine it from there.\n\n- Add product category for a deeper cut\n- Filter to a specific region\n- Switch to chart view`,
      columns: ['revenue', 'region'],
      actions: [{ type: 'add_column', column: 'revenue' }, { type: 'add_column', column: 'region' }],
    };
  };
  // ─────────────────────────────────────────────────────────────────────────────

  const sendMessage = async () => {
    const text = inputVal.trim();
    if (!text || isTyping) return;
    setInputVal('');

    // If the user manually changed the canvas, auto-save it before Spotter responds
    const wasManuallyEdited = isDirty;
    const manualSaveVer = wasManuallyEdited
      ? messages.filter(m => m.role === 'agent' && (m as Extract<ChatMessage, { role: 'agent' }>).inserted).length + 1
      : undefined;

    if (wasManuallyEdited) {
      setMessages(prev => [
        ...prev,
        { role: 'user', text },
        {
          role: 'agent' as const,
          intent: 'direct_edit' as SpotterIntent,
          thinking: { stage: 'done' as const, steps: [], expanded: false },
          message: 'Your manual edits have been saved as a version.',
          columns: [],
          removing: [],
          actions: [],
	          inserted: true,
	          versionNum: manualSaveVer,
	          manualSave: true,
	          versionSnapshot: onCreateVersionSnapshot(),
	        },
      ]);
      setIsDirty(false);
    } else {
      setMessages(prev => [...prev, { role: 'user', text }]);
    }
    setIsTyping(true);

    const canvasIsEmpty = queryState.metrics.length === 0 && queryState.groupBy.length === 0;

    // ── Scripted edit-mode conversation (bypasses GROQ) ──────────────
    if (editMode) {
      const t = text.toLowerCase();
      let scriptedIntent: SpotterIntent | null = null;
      let scriptedMessage = '';
      let scriptedActions: SpotterAction[] = [];

      if ((t.includes('why') && t.includes('east')) || (t.includes('east') && (t.includes('down') || t.includes('decline') || t.includes('drop')))) {
        scriptedIntent = 'change_analysis';
        scriptedMessage = `**East region revenue declined primarily because:**\n\n• **Electronics** revenue dropped by 22% — LG TVs and Samsung Galaxy units saw the steepest decline\n• **Online sales** declined by 18% — fewer Premium Enterprise orders through digital channels\n• **Enterprise customers** reduced spending on high-ticket items\n• Top-selling products (**MacBook Pro**, **Samsung Galaxy S24**) saw major demand drops in West Bengal and Odisha\n\n- Show declining products\n- Compare East vs West\n- Show sales channel performance`;
      } else if (t.includes('sort') && (t.includes('lowest') || t.includes('ascending') || (t.includes('low') && t.includes('high')))) {
        scriptedIntent = 'direct_edit';
        scriptedMessage = 'Sorted regions from lowest to highest revenue. **East** now appears first, making the decline visually obvious.\n\n- Save this to Liveboard\n- Filter to East region only\n- Compare with last year';
        scriptedActions = [{ type: 'sort', column: 'revenue', direction: 'asc' }];
      } else if (t.includes('save') && (t.includes('liveboard') || t.includes('this') || t.includes('changes'))) {
        scriptedIntent = 'plain';
        scriptedMessage = `Your changes have been saved to **${liveboardName ?? 'Business overview'}**.\n\n- View updated Liveboard\n- Create a new analysis\n- Share with your team`;
      }

      if (scriptedIntent !== null) {
        const intentStepsS = getIntentSteps(text, canvasIsEmpty);
        const totalMsS = ANALYZING_MS + intentStepsS.length * STEP_INTERVAL_MS;
        thinkingTimersRef.current.forEach(clearTimeout);
        thinkingTimersRef.current = [];
        liveStepsRef.current = [];
        setThinkingInfo({ stage: 'analyzing', steps: [], expanded: false });
        const startS = Date.now();
        const ts0 = setTimeout(() => setThinkingInfo(prev => prev ? { ...prev, stage: 'working' } : null), ANALYZING_MS);
        thinkingTimersRef.current.push(ts0);
        intentStepsS.forEach((step, i) => {
          const ts = setTimeout(() => {
            liveStepsRef.current = [...liveStepsRef.current, step];
            setThinkingInfo(prev => prev ? { ...prev, steps: [...liveStepsRef.current] } : null);
          }, ANALYZING_MS + i * STEP_INTERVAL_MS);
          thinkingTimersRef.current.push(ts);
        });
        const elapsed = Date.now() - startS;
        await new Promise(r => setTimeout(r, Math.max(0, totalMsS - elapsed)));
        thinkingTimersRef.current.forEach(clearTimeout);
        thinkingTimersRef.current = [];
        const finalSteps = [...liveStepsRef.current];
        const isDE = scriptedIntent === 'direct_edit';
        if (isDE && scriptedActions.length && !canvasIsEmpty) onAction(scriptedActions);
        const maxVer = Math.max(0, ...messages
          .filter((m): m is Extract<ChatMessage, { role: 'agent' }> => m.role === 'agent' && (m as Extract<ChatMessage, { role: 'agent' }>).versionNum != null)
          .map(m => (m as Extract<ChatMessage, { role: 'agent' }>).versionNum as number));
        const versionNum = isDE && !canvasIsEmpty ? maxVer + 1 : undefined;
        setIsTyping(false);
        setThinkingInfo(null);
        setMessages(prev => [...prev, {
          role: 'agent',
          thinking: { stage: 'done', steps: finalSteps, expanded: false },
          intent: scriptedIntent as SpotterIntent,
          message: scriptedMessage,
          columns: [],
          removing: [],
          actions: scriptedActions,
          inserted: isDE ? true : undefined,
          versionNum,
          versionSnapshot: isDE && versionNum != null ? onCreateVersionSnapshot(scriptedActions) : undefined,
        }]);
        return;
      }
    }
    // ─────────────────────────────────────────────────────────────────

    const intentSteps = getIntentSteps(text, canvasIsEmpty);
    const totalThinkingMs = ANALYZING_MS + intentSteps.length * STEP_INTERVAL_MS;

    // ── Thinking animation ───────────────────────────────────────
    thinkingTimersRef.current.forEach(clearTimeout);
    thinkingTimersRef.current = [];
    liveStepsRef.current = [];
    setThinkingInfo({ stage: 'analyzing', steps: [], expanded: false });

    const startTime = Date.now();

    const t0 = setTimeout(() => {
      setThinkingInfo(prev => prev ? { ...prev, stage: 'working' } : null);
    }, ANALYZING_MS);
    thinkingTimersRef.current.push(t0);

    intentSteps.forEach((step, i) => {
      const t = setTimeout(() => {
        liveStepsRef.current = [...liveStepsRef.current, step];
        setThinkingInfo(prev => prev ? { ...prev, steps: [...liveStepsRef.current] } : null);
      }, ANALYZING_MS + i * STEP_INTERVAL_MS);
      thinkingTimersRef.current.push(t);
    });
    // ─────────────────────────────────────────────────────────────

    const commitAfterThinking = (commit: () => void) => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, totalThinkingMs - elapsed);
      const t = setTimeout(commit, remaining);
      thinkingTimersRef.current.push(t);
    };

    const history = messages.map(m =>
      m.role === 'user'
        ? { role: 'user' as const, content: m.text }
        : { role: 'assistant' as const, content: (m as Extract<ChatMessage, { role: 'agent' }>).message }
    );

    const groqMessages: { role: 'user' | 'assistant'; content: string }[] = [];
    for (const m of history) {
      if (!m.content) continue;
      if (groqMessages.length > 0 && groqMessages[groqMessages.length - 1].role === m.role) continue;
      groqMessages.push(m);
    }
    groqMessages.push({ role: 'user', content: text });

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      commitAfterThinking(() => {
        setIsTyping(false);
        setThinkingInfo(null);
        setMessages(prev => [...prev, {
          role: 'agent',
          thinking: { stage: 'done', steps: [], expanded: false },
          intent: 'plain' as SpotterIntent,
          message: 'Spotter needs a Groq API key.\n\n1. Open `.env.local` in the project root\n2. Set: `VITE_GROQ_API_KEY=your-key-here`\n3. Get a key at https://console.groq.com\n4. Restart the dev server',
        }]);
      });
      return;
    }

    type ParsedResponse = {
      intent?: SpotterIntent; message?: string; actions?: SpotterAction[];
      columns?: string[]; removing?: string[]; formula?: string; formula_name?: string;
      button?: { label: string; action: string };
    };

    // Chart-visual commands (color, currency) always use canned responses —
    // Groq doesn't know about these custom action types and returns garbled/empty messages.
    const isChartVisualCmd = /dollar|\$|currency|rupee|inr|euro|pound|color|colour/i.test(text);

    let parsed: ParsedResponse = {};
    if (isChartVisualCmd) {
      parsed = getSpotterResponse(text, queryState, canvasIsEmpty);
    } else
    try {
      const res = await fetch('/api/groq/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 1024,
          messages: [
            { role: 'system', content: buildSpotterPrompt(queryState) },
            ...groqMessages,
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Groq API error ${res.status}: ${errBody.slice(0, 300)}`);
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content ?? '{}';
      try { parsed = sanitizeParsed(JSON.parse(raw)); } catch { parsed = { intent: 'plain', message: raw }; }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('[Spotter] Groq call failed, falling back to canned responses:', errMsg);
      // Fall back to local canned responses so the prototype never shows an error
      parsed = getSpotterResponse(text, queryState, canvasIsEmpty);
    }

    commitAfterThinking(() => {
        const finalSteps = [...liveStepsRef.current];
        setIsTyping(false);
        setThinkingInfo(null);
        const isDirectEdit = parsed.intent === 'direct_edit';
        // Only auto-apply direct_edit when canvas already has columns
	        const appliedDirectEditActions = isDirectEdit && parsed.actions?.length && !canvasIsEmpty
	          ? parsed.actions.filter(a => a.type !== 'add_formula')
	          : [];
	        if (appliedDirectEditActions.length) {
	          // Never auto-apply add_formula actions — always show formula card
	          onAction(appliedDirectEditActions);
	        }

        // If formula intent OR direct_edit smuggled an add_formula action, show formula card
        const formulaAction = parsed.actions?.find(a => a.type === 'add_formula');
        const effectiveFormula = parsed.formula ?? formulaAction?.formula;
        const effectiveFormulaName = parsed.formula_name ?? formulaAction?.formulaName;
        if ((parsed.intent === 'direct_edit' || parsed.intent === 'query_draft') && effectiveFormula) {
          setMessages(prev => [...prev, {
            role: 'agent',
            thinking: { stage: 'done', steps: [...liveStepsRef.current], expanded: false },
            intent: 'formula' as SpotterIntent,
            message: parsed.message ?? '',
            columns: [],
            removing: [],
            actions: [],
            formula: effectiveFormula,
            formulaName: effectiveFormulaName ?? 'Formula',
          }]);
          setIsTyping(false);
          setThinkingInfo(null);
          return;
        }

        // Canvas empty + direct_edit: supersede old draft card and add a new one with all columns
        if (canvasIsEmpty && isDirectEdit && !effectiveFormula) {
          const addCols = (parsed.actions ?? []).filter(a => a.type === 'add_column').map(a => a.column);
          const filterActs = (parsed.actions ?? []).filter(a => a.type !== 'add_column' && a.type !== 'add_formula');
          setMessages(prev => {
            const lastDraftIdx = [...prev].reverse().findIndex(
              m => m.role === 'agent' && m.intent === 'query_draft' && !(m as Extract<ChatMessage, { role: 'agent' }>).inserted && !(m as Extract<ChatMessage, { role: 'agent' }>).superseded
            );
            const existingCols = lastDraftIdx !== -1
              ? ((prev[prev.length - 1 - lastDraftIdx] as Extract<ChatMessage, { role: 'agent' }>).columns ?? [])
              : [];
            const existingActions = lastDraftIdx !== -1
              ? ((prev[prev.length - 1 - lastDraftIdx] as Extract<ChatMessage, { role: 'agent' }>).actions ?? []).filter(a => a.type !== 'add_column')
              : [];
            const mergedCols = Array.from(new Set([...existingCols, ...addCols]));
            const mergedFilters = [...existingActions, ...filterActs];
            const withSuperseded = lastDraftIdx !== -1
              ? prev.map((m, i) => i !== prev.length - 1 - lastDraftIdx ? m : { ...(m as Extract<ChatMessage, { role: 'agent' }>), superseded: true })
              : prev;
            return [...withSuperseded, {
              role: 'agent' as const,
              thinking: { stage: 'done' as const, steps: finalSteps, expanded: false },
              intent: 'query_draft' as SpotterIntent,
              message: parsed.message ?? '',
              columns: mergedCols,
              removing: [],
              actions: mergedFilters,
              formula: undefined,
              formulaName: undefined,
            }];
          });
          return;
        }

        // For query_draft: supersede the previous pending draft and add a new card with all columns.
        if (parsed.intent === 'query_draft' && (parsed.columns ?? []).length > 0) {
          setMessages(prev => {
            const lastDraftIdx = [...prev].reverse().findIndex(
              m => m.role === 'agent' && m.intent === 'query_draft' && !(m as Extract<ChatMessage, { role: 'agent' }>).inserted && !(m as Extract<ChatMessage, { role: 'agent' }>).superseded
            );
            const existingCols = lastDraftIdx !== -1
              ? ((prev[prev.length - 1 - lastDraftIdx] as Extract<ChatMessage, { role: 'agent' }>).columns ?? [])
              : [];
            const existingActions = lastDraftIdx !== -1
              ? ((prev[prev.length - 1 - lastDraftIdx] as Extract<ChatMessage, { role: 'agent' }>).actions ?? []).filter(a => a.type !== 'add_column')
              : [];
            const mergedCols = Array.from(new Set([...existingCols, ...(parsed.columns ?? [])]));
            const newFilters = (parsed.actions ?? []).filter(a => a.type !== 'add_column');
            const mergedActions = [...existingActions, ...newFilters];
            const withSuperseded = lastDraftIdx !== -1
              ? prev.map((m, i) => i !== prev.length - 1 - lastDraftIdx ? m : { ...(m as Extract<ChatMessage, { role: 'agent' }>), superseded: true })
              : prev;
            return [...withSuperseded, {
              role: 'agent' as const,
              thinking: { stage: 'done' as const, steps: finalSteps, expanded: false },
              intent: parsed.intent ?? 'plain',
              message: parsed.message ?? '',
              columns: mergedCols,
              removing: parsed.removing ?? [],
              actions: mergedActions,
              formula: parsed.formula ?? undefined,
              formulaName: parsed.formula_name ?? undefined,
              button: parsed.button ?? undefined,
            }];
          });
          return;
        }

        // For direct_edit (canvas not empty), include versionNum so version card + suggestions render
        const directEditVer = isDirectEdit && !canvasIsEmpty
          ? messages.filter(m => m.role === 'agent' && (m as Extract<ChatMessage, { role: 'agent' }>).inserted).length + 1
          : undefined;
        setMessages(prev => [...prev, {
          role: 'agent',
          thinking: { stage: 'done', steps: finalSteps, expanded: false },
          intent: parsed.intent ?? 'plain',
          message: parsed.message ?? '',
          columns: parsed.columns ?? [],
          removing: parsed.removing ?? [],
          actions: parsed.actions ?? [],
          formula: parsed.formula ?? undefined,
          formulaName: parsed.formula_name ?? undefined,
	          button: parsed.button ?? undefined,
	          inserted: isDirectEdit ? true : undefined,
	          versionNum: directEditVer,
	          versionSnapshot: directEditVer != null ? onCreateVersionSnapshot(appliedDirectEditActions) : undefined,
	        }]);
      });
  };

  const hasMessages = messages.length > 0 || isTyping;

  // Extract bullet-list suggestions from message text (lines starting with "- ").
  // Returns { body: text without bullets/header, suggestions: string[] }.
  const extractSuggestions = (text: string): { body: string; suggestions: string[] } => {
    const lines = text.split('\n');
    const suggestions: string[] = [];
    const bodyLines: string[] = [];
    let inSuggestionBlock = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^-\s/.test(trimmed)) {
        suggestions.push(trimmed.replace(/^-\s/, ''));
        inSuggestionBlock = true;
      } else if (inSuggestionBlock && !trimmed) {
        // skip blank lines after bullets started
      } else {
        inSuggestionBlock = false;
        bodyLines.push(line);
      }
    }
    // trim trailing blank lines from body
    while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === '') bodyLines.pop();
    // Also strip the heading line that introduces the bullets
    // e.g. "Want to go deeper?", "What would you like to do next?", "You might also want to:"
    if (suggestions.length > 0 && bodyLines.length > 0) {
      const lastLine = bodyLines[bodyLines.length - 1].trim();
      if (
        lastLine.endsWith('?') ||
        lastLine.endsWith(':') ||
        /\b(want|explore|try|consider|might|next|deeper|further)\b/i.test(lastLine)
      ) {
        const saved = bodyLines.pop()!;
        while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1].trim() === '') bodyLines.pop();
        // Restore if it's the only body content — it's the main message, not just an intro label
        if (bodyLines.filter(l => l.trim()).length === 0) bodyLines.push(saved);
      }
    }
    return { body: bodyLines.join('\n'), suggestions };
  };

  const renderMessage = (text: string, intent?: SpotterIntent, stripSuggestions = true) => {
    const parseBold = (line: string) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p);
    };
    const displayText = stripSuggestions && (intent === 'query_draft' || intent === 'formula' || intent === 'plain' || intent === 'direct_edit')
      ? extractSuggestions(text).body
      : text;
    const allLines = displayText.split('\n');
    let start = 0, end = allLines.length;
    while (start < end && allLines[start].trim() === '') start++;
    while (end > start && allLines[end - 1].trim() === '') end--;
    const lines = allLines.slice(start, end);
    if (lines.filter(l => l.trim() !== '').length <= 1) {
      return <p className={styles.rspText}>{parseBold(displayText.trim())}</p>;
    }
    // For change_analysis: split body from trailing follow-up suggestions so
    // reasoning bullets (• or -) render as bullets and suggestions render numbered.
    const { body: analysisBody, suggestions: analysisSuggestions } =
      intent === 'change_analysis' ? extractSuggestions(displayText) : { body: displayText, suggestions: [] };
    const renderLines = intent === 'change_analysis' ? analysisBody.split('\n') : lines;

    return (
      <div className={styles.summaryBlock}>
        {renderLines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className={styles.summarySpacer} />;
          const headingMatch = trimmed.match(/^\*\*(.+?)\*\*(:?)$/);
          if (headingMatch) {
            return <p key={i} className={styles.summaryHeading}>{headingMatch[1]}{headingMatch[2]}</p>;
          }
          const isBullet = /^[-•]\s/.test(trimmed);
          const clean = isBullet ? trimmed.slice(2) : trimmed;
          return isBullet
            ? <div key={i} className={styles.summaryBullet}><span>{parseBold(clean)}</span></div>
            : <p key={i} className={styles.rspText} style={{ marginBottom: 0 }}><span>{parseBold(clean)}</span></p>;
        })}
        {analysisSuggestions.length > 0 && (
          <div className={styles.analysisNumberedSuggestions}>
            <div className={styles.rspText} style={{ fontWeight: 600, marginBottom: 4 }}>Suggested next steps:</div>
            {analysisSuggestions.map((s, i) => (
              <div key={i} className={styles.summaryBullet}><span>{i + 1}. {parseBold(s)}</span></div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Renders suggested prompt chips with a "What would you like to do next?" label.
  // Shown after version card, triggered whenever a plain message has versionNum.
  const renderSuggestedPrompts = (text: string, showLabel = true) => {
    const { suggestions } = extractSuggestions(text);
    if (!suggestions.length) return null;
    const stripBold = (s: string) => s.replace(/\*\*(.*?)\*\*/g, '$1');
    return (
      <div className={styles.suggestedPromptsWrap}>
        {showLabel && <span className={styles.suggestedPromptsLabel}>What would you like to do next?</span>}
        <div className={styles.suggestedPromptsRow}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              className={styles.suggestedPromptChip}
              onMouseDown={e => { e.preventDefault(); setInputVal(stripBold(s)); }}
            >
              {stripBold(s)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.spotterPanel} style={{ width: panelWidth }}>
      {/* Resize handle on left edge — col-resize cursor on hover, drag to expand */}
      <div className={styles.spotterResizeHandle} onMouseDown={startResize} aria-hidden />
      {/* Header */}
      <div className={styles.agentPanelHeader} style={{ justifyContent: 'flex-end' }}>
        <button className={styles.closePanelBtn} onClick={onClose} aria-label="Close SpotterData">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {!hasMessages ? (
        /* ── Welcome view ── */
        <div className={styles.agentPanelBody}>
          <div className={styles.agentContentGroup}>
            <div className={styles.agentIntro}>
              <div className={styles.welcomeMascotIcon}>
                <SpotterIcon size="l" aria-hidden />
              </div>
              <p className={styles.agentHeadline}>
                Hi, there! I'm <span className={styles.hlBlue}>SpotterData</span>
              </p>
              <p className={styles.agentSubtitle}>
                I can help you explore and visualise your data
              </p>
            </div>

            <div className={styles.promptBarWrapper}>
              <div style={{ position: 'relative' }}>
                {chatInputFocused && chatSuggestions.length > 0 && (
                  <div className={styles.chatTaPanel}>
                    {chatSuggestions.map(col => {
                      const lastWord = inputVal.trim().split(/\s+/).pop() ?? '';
                      const idx = lastWord ? col.label.toLowerCase().indexOf(lastWord.toLowerCase()) : -1;
                      return (
                        <button key={col.id} className={styles.chatTaItem}
                          onMouseDown={e => {
                            e.preventDefault();
                            const words = inputVal.trim().split(/\s+/);
                            words[words.length - 1] = col.label;
                            setInputVal(words.join(' ') + ' ');
                          }}>
                          <span className={styles.chatTaIcon}>{TYPE_ICON[col.type] ?? 'a'}</span>
                          <span>
                            {idx >= 0
                              ? <>{col.label.slice(0, idx)}<strong>{col.label.slice(idx, idx + lastWord.length)}</strong>{col.label.slice(idx + lastWord.length)}</>
                              : col.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className={styles.promptBar}>
                  <textarea
                    ref={textareaRef}
                    className={styles.agentTextarea}
                    placeholder="Let me help you build a query"
                    value={inputVal}
                    rows={2}
                    onChange={e => setInputVal(e.target.value)}
                    onFocus={() => setChatInputFocused(true)}
                    onBlur={() => setChatInputFocused(false)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  />
                  <div className={styles.promptBarActions}>
                    <button className={styles.sendBtn} disabled={!inputVal.trim()} onClick={sendMessage} aria-label="Send">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7h10M8 3l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <ul className={styles.agentBullets}>
              <li className={styles.bulletItem}>Ask a question about your data</li>
              <li className={styles.bulletItem}>Find the right columns for your query</li>
              <li className={styles.bulletItem}>Create reliable formulas</li>
            </ul>
          </div>

          <p className={styles.welcomeFooter}>
            Spotter responses should be reviewed. <a href="#" className={styles.welcomeFooterLink} onClick={e => e.preventDefault()}>Learn more</a>
          </p>
        </div>
      ) : (
        /* ── Chat view ── */
        <div className={styles.chatView}>
          <div className={styles.chatMessages}>
            {(() => {
              const maxVer = Math.max(0, ...messages.filter((m): m is Extract<ChatMessage, { role: 'agent' }> => m.role === 'agent' && (m as Extract<ChatMessage, { role: 'agent' }>).versionNum != null).map(m => m.versionNum as number));
              return messages.map((msg, mi) => msg.role === 'user' ? (
              <div key={mi} className={styles.userMessageGroup}>
                <div className={styles.userRow}>
                  <div className={styles.userAvatarLg}>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="7" r="3.5" fill="#8b6f5e" />
                      <path d="M3 17c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    </svg>
                  </div>
                  <span className={styles.userBubbleText}>{msg.text}</span>
                </div>
              </div>
            ) : (
              <div key={mi} ref={!isTyping && mi === messages.length - 1 ? newResponseRef : undefined} className={styles.agentMessageRow}>
                <div className={styles.agentAvatarWrap}>
                  <SpotterIcon size="s" aria-hidden />
                </div>
                <div className={styles.agentMsgContent}>

                  {/* Thinking block — shows "Work done" trace above the response; hidden for version_restored */}
                  {msg.thinking && msg.intent !== 'version_restored' && (
                    <ThinkingBlock
                      info={msg.thinking}
                      onToggle={() => setMessages(prev => prev.map((m, i) =>
                        i === mi && m.role === 'agent' && m.thinking
                          ? { ...m, thinking: { ...m.thinking, expanded: !m.thinking.expanded } }
                          : m
                      ))}
                    />
                  )}

                  <div className={styles.agentResponseBlock}>

                    {/* Message text — all intents */}
                    {msg.intent === 'version_restored' && msg.versionNum != null && (
                      <span className={styles.versionRestoredBadge}>Version {msg.versionNum} restored</span>
                    )}
                    {renderMessage(msg.message, msg.intent, !(msg.intent === 'plain' && msg.versionNum == null))}

                    {/* query_draft — column checkboxes + footer with Add/Undo */}
                    {msg.intent === 'query_draft' && (
                      <ColSelectionCard
                        columns={msg.columns ?? []}
                        removing={msg.removing ?? []}
                        actions={msg.actions ?? []}
                        inserted={msg.inserted}
                        superseded={msg.superseded}
                        onInsert={filteredActions => {
                          // Update canvas
                          if (filteredActions.length) onAction(filteredActions);
                          const nextVer = messages.filter(m => m.role === 'agent' && m.inserted).length + 1;
                          // Mark card as inserted (disables checkboxes + hides footer)
                          setMessages(prev => prev.map((m, i) =>
                            i === mi && m.role === 'agent' ? { ...m, inserted: true } : m
                          ));
                          // Inject user message + Spotter follow-up with version card
                          const addedLabels = filteredActions
                            .filter(a => a.type === 'add_column')
                            .map(a => COL_DEF_MAP[a.column]?.label ?? a.column);
                          setMessages(prev => [...prev, { role: 'user', text: 'Add columns to Answer' }]);
                          setIsTyping(true);
                          setTimeout(() => {
                            setIsTyping(false);
                            const summary = addedLabels.length
                              ? addedLabels.join(', ')
                              : 'the selected columns';
                            setMessages(prev => [...prev, {
                              role: 'agent',
                              thinking: { stage: 'done', steps: [], expanded: false },
                              intent: 'plain' as SpotterIntent,
	                              message: `Here's your answer — it's ready to explore! I've added **${summary}** to the canvas.\n\nWhat would you like to do next?\n- Filter by region or date range\n- Add a profit margin formula\n- Group results by category or brand`,
	                              versionNum: nextVer,
	                              versionSnapshot: onCreateVersionSnapshot(filteredActions),
	                            }]);
                          }, 1400);
                        }}
                      />
                    )}

                    {/* version card + suggested prompts — shown after add-to-answer (plain) or direct_edit */}
                    {(msg.intent === 'plain' || msg.intent === 'direct_edit') && msg.versionNum != null && (
                      <>
                        <VersionCard
                          versionNum={msg.versionNum}
                          isLatest={msg.versionNum === maxVer}
                          title={msg.manualSave ? 'Manual saved version' : 'Agent updates applied'}
	                          onRestore={msg.versionNum !== maxVer ? () => {
	                            const fromVer = maxVer;
	                            const toVer = msg.versionNum!;
	                            if (msg.versionSnapshot) onRestoreVersion(msg.versionSnapshot);
	                            setMessages(prev => [...prev, {
                              role: 'agent',
                              thinking: { stage: 'done', steps: [], expanded: false },
                              intent: 'version_restored' as SpotterIntent,
                              message: `I've restored your Answer to Version ${toVer}. All changes made after that version have been rolled back.`,
                              versionNum: toVer,
                              restoreFromVersion: fromVer,
                            }]);
                          } : undefined}
                        />
                        {renderSuggestedPrompts(msg.message)}
                      </>
                    )}

                    {/* formula — card body (always visible); footer hidden after insertion */}
                    {msg.intent === 'formula' && msg.formula && (
                      <>
                        <div className={styles.formulaCard}>
                          <div className={styles.formulaCardBody}>
                            <span className={styles.formulaCardName}>{msg.formulaName ?? 'Formula'}</span>
                            <span className={styles.formulaCardExpr}>{msg.formula}</span>
                          </div>
                          {!msg.inserted && (
                            <div className={styles.cardFooter}>
                              <Button
                                variant="secondary"
                                size="basic"
                                onClick={() => {
                                  if (msg.formula) {
                                    onAction([{ type: 'add_formula', formula: msg.formula, formulaName: msg.formulaName ?? 'Formula' }]);
                                  } else if (msg.actions?.length) {
                                    onAction(msg.actions);
                                  }
                                  const nextVer = messages.filter(m => m.role === 'agent' && m.inserted).length + 1;
                                  // Mark card inserted (hides footer)
                                  setMessages(prev => prev.map((m, i) =>
                                    i === mi && m.role === 'agent' ? { ...m, inserted: true, versionNum: nextVer } : m
                                  ));
                                  // Chat flow: user message → Spotter confirmation + version card
                                  const fName = msg.formulaName ?? 'Formula';
                                  setMessages(prev => [...prev, { role: 'user', text: 'Add formula to Answer' }]);
                                  setIsTyping(true);
                                  setTimeout(() => {
                                    setIsTyping(false);
                                    setMessages(prev => [...prev, {
                                      role: 'agent',
                                      thinking: { stage: 'done', steps: [], expanded: false },
                                      intent: 'plain' as SpotterIntent,
	                                      message: `Formula for **${fName}** added to the query.\n\nWhat would you like to explore next?\n- Change the chart color to purple\n- Filter results to a specific region\n- Add another metric or formula`,
	                                      versionNum: nextVer,
	                                      versionSnapshot: onCreateVersionSnapshot(msg.formula ? [{ type: 'add_formula', formula: msg.formula, formulaName: msg.formulaName ?? 'Formula' }] : msg.actions ?? []),
	                                    }]);
                                  }, 1200);
                                }}
                              >
                                Add to Answer
                              </Button>
                              <Button variant="tertiary" size="basic">Edit</Button>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Action button — insight, change_analysis, chart_setting, switch_view */}
                    {(msg.intent === 'insight' || msg.intent === 'change_analysis' || msg.intent === 'chart_setting' || msg.intent === 'switch_view') && msg.button && (
                      <button className={styles.actionBtn}>{msg.button.label}</button>
                    )}

                    {/* version_restored — confirmation card */}
                    {msg.intent === 'version_restored' && msg.versionNum != null && (
                      <div className={styles.versionRestoredCard}>
                        <span className={styles.versionRestoredCardTitle}>Restored to Version {msg.versionNum}</span>
                        {msg.restoreFromVersion != null && (
                          <span className={styles.versionRestoredCardSub}>Version {msg.restoreFromVersion}</span>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            ));
            })()}
            {isTyping && thinkingInfo && (
              <div ref={newResponseRef} className={styles.agentMessageRow}>
                <div className={styles.agentAvatarWrap}>
                  <SpotterIcon size="s" aria-hidden />
                </div>
                <ThinkingBlock
                  info={thinkingInfo}
                  onToggle={() => setThinkingInfo(prev => prev ? { ...prev, expanded: !prev.expanded } : null)}
                />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <div className={styles.chatInputWrapper}>
            <div style={{ position: 'relative' }}>
              {chatInputFocused && chatSuggestions.length > 0 && (
                <div className={styles.chatTaPanel}>
                  {chatSuggestions.map(col => {
                    const lastWord = inputVal.trim().split(/\s+/).pop() ?? '';
                    const idx = lastWord ? col.label.toLowerCase().indexOf(lastWord.toLowerCase()) : -1;
                    return (
                      <button key={col.id} className={styles.chatTaItem}
                        onMouseDown={e => {
                          e.preventDefault();
                          const words = inputVal.trim().split(/\s+/);
                          words[words.length - 1] = col.label;
                          setInputVal(words.join(' ') + ' ');
                        }}>
                        <span className={styles.chatTaIcon}>{TYPE_ICON[col.type] ?? 'a'}</span>
                        <span>
                          {idx >= 0
                            ? <>{col.label.slice(0, idx)}<strong>{col.label.slice(idx, idx + lastWord.length)}</strong>{col.label.slice(idx + lastWord.length)}</>
                            : col.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className={styles.promptBar}>
                <textarea
                  className={styles.agentTextarea}
                  placeholder="Ask a follow-up…"
                  value={inputVal}
                  rows={1}
                  onChange={e => setInputVal(e.target.value)}
                  onFocus={() => setChatInputFocused(true)}
                  onBlur={() => setChatInputFocused(false)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <div className={styles.promptBarActions}>
                  <button className={styles.sendBtn} disabled={!inputVal.trim()} onClick={sendMessage} aria-label="Send">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M8 3l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.agentFooter}>
            SpotterData may make mistakes. <span className={styles.agentFooterLink}>Learn more</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const SearchDataExplorations: React.FC<SearchDataExplorationsProps> = ({ onExit, onSave, onSaveChanges, initialSnapshot, mode, showSpotter = true, editMode = false, liveboardName, onOpenInSearchData, sheetTab: sheetTabProp, onSheetTabChange, hideSheetToggle = false, hideHeaderBar = false, edgeToEdge = false, hideColumnPanelTabs = false, compactPanelSearch = false, alignColumnCheckboxes = false, lightAnswerTableHeader = false, canvasScope }) => {
  // ── Real Table/Join/Model column scoping (see SearchDataExplorationsProps.canvasScope) ──
  const hasCanvasScope = !!canvasScope;
  // Hoisted above scopedCols (its normal declaration spot is much further
  // down, next to the rest of the sheet-view state) — scopedCols needs it to
  // tell the Spreadsheet tab apart from the Query tab below.
  const [internalSheetTab, setInternalSheetTab] = useState<'query' | 'sheet'>(initialSnapshot?.sheetTab ?? 'query');
  const sheetTab = sheetTabProp ?? internalSheetTab;
  type ScopedCol = { key: string; label: string; table: string; measure: boolean };
  const scopedCols: ScopedCol[] = useMemo(() => {
    if (!canvasScope) return [];
    const colsFor = (tableName: string, qualify: boolean): ScopedCol[] =>
      (canvasScope.dataSourceTables.find(d => d.name === tableName)?.columns ?? [])
        .map(col => ({
          key: qualify ? `${tableName}.${col}` : col,
          label: qualify ? `${tableName}.${col}` : col,
          table: tableName,
          measure: isNumericColumn(col),
        }));
    // Spreadsheet: any column from any table should be selectable, regardless
    // of the current Table/Join/Model scope (Komal: "I should be able to
    // select any column on spreadsheet column selector"). The Query tab below
    // keeps respecting the actual scope — this only widens Spreadsheet.
    if (sheetTab === 'sheet') return canvasScope.tables.flatMap(t => colsFor(t.name, true));
    if (canvasScope.scope === 'join' && canvasScope.selectedJoin) {
      return [...colsFor(canvasScope.selectedJoin.leftTable, true), ...colsFor(canvasScope.selectedJoin.rightTable, true)];
    }
    if (canvasScope.scope === 'model') return canvasScope.tables.flatMap(t => colsFor(t.name, true));
    return colsFor(canvasScope.selectedTable, false);
  }, [canvasScope, sheetTab]);

  const dynamicMeasureIds = useMemo(() => new Set(scopedCols.filter(c => c.measure).map(c => c.key)), [scopedCols]);
  const dynamicDimIds = useMemo(() => new Set(scopedCols.filter(c => !c.measure).map(c => c.key)), [scopedCols]);

  const dynamicSections: SectionDef[] = useMemo(() => [
    { id: 'measures', label: 'Measures', kind: 'expandable', columns: scopedCols.filter(c => c.measure).map(c => ({ id: c.key, label: c.label, type: 'measure' as TokenType })) },
    { id: 'attributes', label: 'Attributes', kind: 'expandable', columns: scopedCols.filter(c => !c.measure).map(c => ({ id: c.key, label: c.label, type: 'attribute' as TokenType })) },
  ], [scopedCols]);

  const dynamicSheetPanelSections = useMemo(() => [
    { id: 'measures', label: 'Measures', items: scopedCols.filter(c => c.measure).map(c => ({ id: c.key, label: c.label, type: 'measure' as TokenType })) },
    { id: 'attributes', label: 'Attributes', items: scopedCols.filter(c => !c.measure).map(c => ({ id: c.key, label: c.label, type: 'attribute' as TokenType })) },
  ], [scopedCols]);

  const dynamicDataModelCols: AnswerColDef[] = useMemo(() => scopedCols.map(c => ({
    key: c.key, label: c.label, sortable: true,
    align: c.measure ? 'right' : undefined,
    width: c.measure ? 140 : 130,
    render: c.measure ? (v: unknown) => Number(v).toLocaleString() : undefined,
  })), [scopedCols]);

  const dynamicRows = useMemo(
    () => generateMockRows(scopedCols.map(c => ({ col: c.key, table: c.table })), 60),
    [scopedCols]
  );

  // ── Table/Join/Model selector — replaces the "(Sample) Retail - Apparel"
  // data-model button when canvasScope is provided. Shared ref/state across
  // both render sites (Query tab's queryBarLeft button, Spreadsheet
  // sub-header's model control) since only one mounts at a time. ──
  const scopeBtnRef = useRef<HTMLButtonElement>(null);
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const [scopeSub, setScopeSub] = useState<'tables' | 'joins' | null>(null);
  const [scopeSearch, setScopeSearch] = useState('');
  // Plain text — the ⋈ glyph looked crude, and the join-inner icon (Venn
  // circles) was unclear at this size too, so plain "leftTable – rightTable"
  // it is, matching how the other scope options ("Tables"/"Model") are shown.
  const joinLabel = (j: { leftTable: string; rightTable: string }) => `${j.leftTable} – ${j.rightTable}`;
  const canvasScopeLabel = canvasScope
    ? canvasScope.scope === 'model' ? 'Model'
      : canvasScope.scope === 'join' && canvasScope.selectedJoin ? joinLabel(canvasScope.selectedJoin)
      : (canvasScope.selectedTable || 'Tables')
    : '';
  const scopeSearchLower = scopeSearch.trim().toLowerCase();
  const matchedScopeTables = (canvasScope?.tables ?? []).filter(t => t.name.toLowerCase().includes(scopeSearchLower));
  const matchedScopeJoins = (canvasScope?.joins ?? []).filter(j => joinLabel(j).toLowerCase().includes(scopeSearchLower));
  const scopeFlyoutRow = (label: string, checked: boolean, sub: 'tables' | 'joins' | null, onClick?: () => void) => (
    <div
      key={label}
      style={{ position: 'relative' }}
      onMouseEnter={() => sub && setScopeSub(sub)}
      onMouseLeave={() => setScopeSub(cur => cur === sub ? null : cur)}
    >
      <button
        type="button"
        onClick={onClick}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', border: 'none', background: scopeSub === sub ? '#F6F8FA' : 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: '#1D232F' }}
      >
        <span style={{ width: 14, height: 14, flexShrink: 0, display: 'flex', color: '#2770EF' }}>
          {checked && <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </span>
        <span style={{ flex: 1 }}>{label}</span>
        {sub && (
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ color: '#A5ACB9', flexShrink: 0 }}><path d="M5 3l6 5-6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        )}
      </button>
      {sub === 'tables' && scopeSub === 'tables' && (
        <div style={{ position: 'absolute', left: '100%', top: -4, marginLeft: 2, width: 220, background: '#fff', border: '1px solid #EAEDF2', borderRadius: 8, boxShadow: '0 8px 28px rgba(25,35,49,0.16), 0 1px 4px rgba(25,35,49,0.06)', padding: '6px' }}>
          <input
            autoFocus
            value={scopeSearch}
            onChange={e => setScopeSearch(e.target.value)}
            placeholder="Search tables"
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #EAEDF2', borderRadius: 6, padding: '5px 8px', fontSize: 12.5, color: '#1D232F', outline: 'none', marginBottom: 2 }}
          />
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {matchedScopeTables.length === 0 ? (
              <div style={{ padding: '8px 6px', fontSize: 12, color: '#A5ACB9' }}>No matches</div>
            ) : (
              matchedScopeTables.map(t => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => { canvasScope?.onScopeChange('table'); canvasScope?.onSelectedTableChange(t.name); setScopeMenuOpen(false); }}
                  style={{ display: 'block', width: '100%', padding: '6px 8px', border: 'none', borderRadius: 5, background: canvasScope?.scope === 'table' && t.name === canvasScope?.selectedTable ? '#EAF1FE' : 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, color: '#1D232F' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
                  onMouseLeave={e => (e.currentTarget.style.background = canvasScope?.scope === 'table' && t.name === canvasScope?.selectedTable ? '#EAF1FE' : 'transparent')}
                >{t.name}</button>
              ))
            )}
          </div>
        </div>
      )}
      {sub === 'joins' && scopeSub === 'joins' && (
        <div style={{ position: 'absolute', left: '100%', top: -4, marginLeft: 2, width: 240, background: '#fff', border: '1px solid #EAEDF2', borderRadius: 8, boxShadow: '0 8px 28px rgba(25,35,49,0.16), 0 1px 4px rgba(25,35,49,0.06)', padding: '6px' }}>
          <input
            autoFocus
            value={scopeSearch}
            onChange={e => setScopeSearch(e.target.value)}
            placeholder="Search joins"
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #EAEDF2', borderRadius: 6, padding: '5px 8px', fontSize: 12.5, color: '#1D232F', outline: 'none', marginBottom: 2 }}
          />
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {matchedScopeJoins.length === 0 ? (
              <div style={{ padding: '8px 6px', fontSize: 12, color: '#A5ACB9' }}>No joins yet</div>
            ) : (
              matchedScopeJoins.map((j, i) => {
                const active = canvasScope?.scope === 'join' && canvasScope?.selectedJoin?.leftTable === j.leftTable && canvasScope?.selectedJoin?.rightTable === j.rightTable;
                return (
                  <button
                    key={`${j.leftTable}-${j.rightTable}-${i}`}
                    type="button"
                    onClick={() => { canvasScope?.onScopeChange('join'); canvasScope?.onSelectedJoinChange(j); setScopeMenuOpen(false); }}
                    style={{ display: 'block', width: '100%', padding: '6px 8px', border: 'none', borderRadius: 5, background: active ? '#EAF1FE' : 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, color: '#1D232F' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
                    onMouseLeave={e => (e.currentTarget.style.background = active ? '#EAF1FE' : 'transparent')}
                  >{joinLabel(j)}</button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
  const scopeFlyoutMenu = (
    <AnchoredMenu
      open={scopeMenuOpen}
      anchorRef={scopeBtnRef}
      onClose={() => setScopeMenuOpen(false)}
      placement="bottom-start"
      style={{ width: 160, background: '#fff', border: '1px solid #EAEDF2', borderRadius: 8, boxShadow: '0 8px 28px rgba(25,35,49,0.16), 0 1px 4px rgba(25,35,49,0.06)', padding: '4px 0' }}
    >
      {scopeFlyoutRow('Tables', canvasScope?.scope === 'table', 'tables')}
      {scopeFlyoutRow('Joins', canvasScope?.scope === 'join', 'joins')}
      {scopeFlyoutRow('Model', canvasScope?.scope === 'model', null, () => { canvasScope?.onScopeChange('model'); setScopeMenuOpen(false); })}
    </AnchoredMenu>
  );

  // ── Data panel's "+Add" menu (canvasScope only) — Input Table / Column set / Query set. ──
  const addMenuBtnRef = useRef<HTMLButtonElement>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRow = (label: string) => (
    <button
      key={label}
      type="button"
      onClick={() => setAddMenuOpen(false)}
      style={{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 14, color: '#1D232F' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >{label}</button>
  );
  const addFlyoutMenu = (
    <AnchoredMenu
      open={addMenuOpen}
      anchorRef={addMenuBtnRef}
      onClose={() => setAddMenuOpen(false)}
      placement="bottom-start"
      style={{ width: 180, background: '#fff', border: '1px solid #EAEDF2', borderRadius: 8, boxShadow: '0 8px 28px rgba(25,35,49,0.16), 0 1px 4px rgba(25,35,49,0.06)', padding: '4px 0' }}
    >
      {addMenuRow('Input Table')}
      <div style={{ height: 1, background: '#EAEDF2' }} />
      {addMenuRow('Column set')}
      {addMenuRow('Query set')}
    </AnchoredMenu>
  );
  // Optimized (compactPanelSearch) Query tab's own "+Add" menu — Formula /
  // Filter / Parameters, matching the left pane's own Formula/Filters/
  // Parameters dock rather than the general canvas Add options above.
  const addFlyoutMenuOptimized = (
    <AnchoredMenu
      open={addMenuOpen}
      anchorRef={addMenuBtnRef}
      onClose={() => setAddMenuOpen(false)}
      placement="bottom-start"
      style={{ width: 180, background: '#fff', border: '1px solid #EAEDF2', borderRadius: 8, boxShadow: '0 8px 28px rgba(25,35,49,0.16), 0 1px 4px rgba(25,35,49,0.06)', padding: '4px 0' }}
    >
      {addMenuRow('Formula')}
      {addMenuRow('Filter')}
      {addMenuRow('Parameters')}
    </AnchoredMenu>
  );

  const isSpreadsheetMode = mode === 'spreadsheet';
  // ── Version controller ────────────────────────────────────────────────────
  const version = getSdxVersion();
  const colDetailIconStyle = getColDetailIconStyle();

  // Right icon sidebar active item
  const [activeSidebarItem, setActiveSidebarItem] = useState<string | null>(null);

  // CSV columns imported into the "Custom data" panel section, grouped by file
  const [importedCsvGroups, setImportedCsvGroups] = useState<Array<{ csvName: string; cols: CsvCol[] }>>([]);

  // ── Save modal state ──────────────────────────────────────────────────────
  const [unsavedColsModalOpen, setUnsavedColsModalOpen] = useState(false);
  const [savedInputTables, setSavedInputTables] = useState<Array<{ tableName: string; columns: { id: string; name: string; kind: 'custom' | 'key' }[] }>>([]);
  const [writebackModalOpen, setWritebackModalOpen] = useState(false);
  const [writebackFromSaveFlow, setWritebackFromSaveFlow] = useState(false);
  const [writebackTableName, setWritebackTableName] = useState('');
  const [writebackCustomColKeys, setWritebackCustomColKeys] = useState<Set<string>>(new Set());
  const [writebackFormulaColKeys, setWritebackFormulaColKeys] = useState<Set<string>>(new Set());
  const [writebackKeyColKeys, setWritebackKeyColKeys] = useState<Set<string>>(new Set());
  const [writebackCustomSearch, setWritebackCustomSearch] = useState('');
  const [writebackKeySearch, setWritebackKeySearch] = useState('');
  const [writebackCustomOpen, setWritebackCustomOpen] = useState(false);
  const [writebackKeyOpen, setWritebackKeyOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveAnswerName, setSaveAnswerName] = useState(initialSnapshot?.name ?? 'Employee Salary');
  const [saveDescription, setSaveDescription] = useState(initialSnapshot?.description ?? '');
  const [saveDiscoverable, setSaveDiscoverable] = useState(false);
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const [writebackToastVisible, setWritebackToastVisible] = useState(false);
  const [lastSavedTableName, setLastSavedTableName] = useState('');
  const [lastSavedSourceId, setLastSavedSourceId] = useState('');
  const [navigateToInputTable, setNavigateToInputTable] = useState(false);
  const [dynamicDataSources, setDynamicDataSources] = useState<DataModelSource[]>([]);

  // ── Sheet view state (lifted from SheetView for save/restore) ────────────
  const [sheetExpanded] = useState(initialSnapshot?.sheetExpanded ?? false);
  const [sheetDataView, setSheetDataView] = useState<'aggregated' | 'row-level'>(initialSnapshot?.sheetDataView ?? 'row-level');

  // ── Worksheet tab toggle (V1 and V3) — internalSheetTab/sheetTab are
  // declared near the top of the component now, see scopedCols. ───────────
  const setSheetTab = (t: 'query' | 'sheet') => {
    if (onSheetTabChange) onSheetTabChange(t);
    else setInternalSheetTab(t);
  };

  // ── Search bar / query mode ───────────────────────────────────────────────
  // searchFocused = "query building mode" (overlay on, Go button blue)
  // barActive     = bar text input is the active input (subset of searchFocused)
  // editingTokenRef = true while a token's text input has focus (for blur timing)
  const [searchFocused, setSearchFocused] = useState(false);
  const [barActive, setBarActive] = useState(false);
  const editingTokenRef = useRef(false);
  const [barTypedValue, setBarTypedValue] = useState('');
  const barInputRef = useRef<HTMLInputElement>(null);
  const [tokenResetKey, setTokenResetKey] = useState(0);
  // Expand/collapse toggle for the search bar (true = wrap tokens, false = single-line crop)
  const [searchBarExpanded, setSearchBarExpanded] = useState(true);
  // 300ms "stopping" window after Go is clicked — prevents double-click
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Data panel visibility (hamburger toggle — search mode)
  const [dataPanelVisible, setDataPanelVisible] = useState(true);
  // Data panel for the sheet sub-header (v1 / spreadsheet mode). Optimized
  // defaults this open since Spreadsheet is its default landing tab.
  const [sheetDataPanelOpen, setSheetDataPanelOpen] = useState(hasCanvasScope);
  // canvasScope (Optimized) only: the single source of truth for which
  // columns the Spreadsheet shows. Owned here because the column-selector
  // sidebar is rendered here too — the sidebar's checkboxes and the sheet's
  // columns now read the exact same set, so they can't drift apart.
  const [sheetColKeys, setSheetColKeys] = useState<Set<string>>(new Set());
  const toggleSheetColKey = (colId: string) =>
    setSheetColKeys(prev => {
      const next = new Set(prev);
      next.has(colId) ? next.delete(colId) : next.add(colId);
      return next;
    });
  // Overflow "more" menus
  const [answerMoreOpen, setAnswerMoreOpen] = useState(false);
  const [inlineSheetMoreOpen, setInlineSheetMoreOpen] = useState(false);
  const [dataModelModalOpen, setDataModelModalOpen] = useState(false);
  const [dataModelSelectedId, setDataModelSelectedId] = useState('retail-apparel');
  // SpotterData panel — auto-open in edit mode
  const [spotterOpen, setSpotterOpen] = useState(editMode);
  // Lifted so conversation persists across toggle (Query↔Spreadsheet) and collapse/expand
  const buildEditGreeting = (lb: string) =>
    `Hi, what would you like to know or edit about this Answer in Liveboard **"${lb}"**?\n\n- Add a filter\n- See insights from this data\n- Add a calculated field (formula)`;
  const [spotterMessages, setSpotterMessages] = useState<ChatMessage[]>(
    editMode ? [{
      role: 'agent' as const,
      intent: 'plain' as SpotterIntent,
      message: buildEditGreeting(liveboardName ?? 'Business overview'),
    }] : []
  );
  const [spotterTyping, setSpotterTyping] = useState(false);
  useEffect(() => {
    if (!editMode) return;
    setSpotterOpen(true);
    setSpotterMessages(prev => prev.length === 0 ? [{
      role: 'agent' as const,
      intent: 'plain' as SpotterIntent,
      message: buildEditGreeting(liveboardName ?? 'Business overview'),
    }] : prev);
  }, [editMode, liveboardName]);
  // Chart colors — Spotter can change these via 'change_color' action
  const [chartColors, setChartColors] = useState<string[]>([...CHART_COLORS]);
  const handleSpotterAction = (actions: SpotterAction[]) => {
    let needsAutoFire = false;

    for (const action of actions) {
      if (action.type === 'add_column' || action.type === 'remove_column') {
        const isAdd = action.type === 'add_column';
        const applyChange = (prev: QueryState): QueryState => {
          const id = action.column;
          const next = { ...prev };
          const MIDS = new Set(['revenue', 'unitsSold', 'profit', 'profitMarginPct', 'discountPct']);
          const DIDS = new Set(['orderDate', 'orderMonth', 'orderQuarter', 'orderYear', 'region', 'state', 'city', 'productCategory', 'productSubCategory', 'productName', 'customerSegment', 'customerType', 'salesChannel']);
          if (MIDS.has(id)) {
            const m = id as QMetric;
            next.metrics = isAdd
              ? next.metrics.includes(m) ? next.metrics : [...next.metrics, m]
              : next.metrics.filter(x => x !== m);
          } else if (DIDS.has(id)) {
            const d = id as QDim;
            next.groupBy = isAdd
              ? next.groupBy.includes(d) ? next.groupBy : [...next.groupBy, d]
              : next.groupBy.filter(x => x !== d);
          } else {
            next.derivedCols = isAdd
              ? next.derivedCols.includes(id) ? next.derivedCols : [...next.derivedCols, id]
              : next.derivedCols.filter(x => x !== id);
          }
          return next;
        };
        setPendingQuery(applyChange);
        setQueryState(applyChange);
        needsAutoFire = true;
      }
      if (action.type === 'add_filter') {
        setPendingQuery(prev => ({ ...prev, filters: [...prev.filters.filter(f => f.col !== action.column), { col: action.column, val: action.value }] }));
        setQueryState(prev => ({ ...prev, filters: [...prev.filters.filter(f => f.col !== action.column), { col: action.column, val: action.value }] }));
        needsAutoFire = true;
      }
      if (action.type === 'remove_filter') {
        setPendingQuery(prev => ({ ...prev, filters: prev.filters.filter(f => f.col !== action.column) }));
        setQueryState(prev => ({ ...prev, filters: prev.filters.filter(f => f.col !== action.column) }));
        needsAutoFire = true;
      }
      if (action.type === 'sort') {
        const sort: QSort = { col: action.column, dir: (action.direction ?? 'desc') as 'asc' | 'desc' };
        setPendingQuery(prev => ({ ...prev, sorts: [sort] }));
        setQueryState(prev => ({ ...prev, sorts: [sort] }));
        needsAutoFire = true;
      }
      if (action.type === 'change_chart') setQueryState(q => ({ ...q, viewMode: action.chart_type === 'table' ? 'table' : 'chart' }));
      if (action.type === 'change_color' && action.color) {
        setChartColors(prev => { const next = [...prev]; next[0] = action.color; return next; });
        needsAutoFire = true;
      }
      if (action.type === 'change_currency') {
        const currency = currencyCodeFromSymbol(action.symbol);
        setPendingQuery(prev => ({ ...prev, currency }));
        setQueryState(prev => ({ ...prev, currency }));
        needsAutoFire = true;
      }
      if (action.type === 'add_formula' && action.formula) {
        const tokens = parseFormulaToTokens(action.formula);
        const baseCols = buildDisplayColumns(queryState);
        const labelToKey: Record<string, string> = {};
        for (const col of baseCols) labelToKey[col.label.toLowerCase()] = col.key;
        for (const fc of parentFormulaCols) labelToKey[fc.name.toLowerCase()] = fc.key;
        const rows = (queryState.metrics.length > 0 || queryState.groupBy.length > 0)
          ? buildDisplayData(queryState)
          : [];
	        const isYoY = /yoy|year.over.year|change|growth/i.test(action.formulaName ?? action.formula);
	        const computed: (number | null)[] = isYoY
	          ? makeRevenueYoYPercentValues(rows, queryState.groupBy)
	          : rows.map(row => {
              let result: number | null = null;
              let pendingOp: string | null = null;
              for (const tok of tokens) {
                if (tok.kind === 'col' || tok.kind === 'num') {
                  const val = tok.kind === 'num'
                    ? Number(tok.value)
                    : (() => {
                        const key = labelToKey[tok.label.toLowerCase()];
                        const raw = key != null ? row[key] : null;
                        const n = raw != null ? Number(raw) : NaN;
                        return isNaN(n) ? 0 : n;
                      })();
                  if (result === null) {
                    result = val;
                  } else if (pendingOp) {
                    if (pendingOp === '+') result += val;
                    else if (pendingOp === '-') result -= val;
                    else if (pendingOp === '*') result *= val;
                    else if (pendingOp === '/') result = val !== 0 ? result / val : 0;
                    pendingOp = null;
                  }
                } else {
                  pendingOp = tok.value;
                }
              }
              return result;
            });
        const newKey = `spotter_formula_${Date.now()}`;
        setParentFormulaCols(prev => [...prev, { key: newKey, name: action.formulaName ?? 'Formula', tokens }]);
        setParentFormulaValues(prev => ({ ...prev, [newKey]: computed }));
        setQueryState(q => ({ ...q, viewMode: 'table' }));
        needsAutoFire = true;
      }
    }

    if (needsAutoFire) {
      setIsDirty(false);
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 300);
      setIsAnswerLoading(true);
      setTimeout(() => setIsAnswerLoading(false), 500);
    }
  };

  // ── Formula columns (lifted from SheetView so they appear in search view + are saved)
  const [parentFormulaCols, setParentFormulaCols] = useState<FormulaCol[]>(
    initialSnapshot?.formulaCols ?? []
  );
  const [parentFormulaValues, setParentFormulaValues] = useState<Record<string, (number | null)[]>>(
    initialSnapshot?.formulaValues ?? {}
  );

  const [panelTab, setPanelTab] = useState('all');
  const [colDetailOpen, setColDetailOpen] = useState(false);
  const [selectedColDetail, setSelectedColDetail] = useState<{ id: string; label: string; type: string } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['measures', 'dimensions']));
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // ── Query + canvas state ─────────────────────────────────────────────────
  // pendingQuery: what's currently selected in search bar (updates immediately)
  // queryState:   committed on Go — drives the answer card only
  const [pendingQuery, setPendingQuery] = useState<QueryState>(initialSnapshot?.queryState ?? EMPTY_QUERY);
  const [queryState, setQueryState] = useState<QueryState>(initialSnapshot?.queryState ?? EMPTY_QUERY);
  const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([]);

  // Refs for stable closure access inside setTimeout
  const pendingQueryRef = useRef(pendingQuery);
  const queryStateRef = useRef(queryState);
  const canvasBlocksRef = useRef(canvasBlocks);
  useEffect(() => { pendingQueryRef.current = pendingQuery; }, [pendingQuery]);
  useEffect(() => { queryStateRef.current = queryState; }, [queryState]);
  useEffect(() => { canvasBlocksRef.current = canvasBlocks; }, [canvasBlocks]);

  // ── Answer title / description (editable, overrides computed title) ──────
  const [customTitle, setCustomTitle] = useState<string | null>(initialSnapshot?.customTitle ?? null);
  const [customDesc,  setCustomDesc]  = useState('');
  const [titleEditing, setTitleEditing] = useState(false);
  const [descEditing,  setDescEditing]  = useState(false);
  const titleEditRef = useRef<HTMLInputElement>(null);
  const descEditRef  = useRef<HTMLInputElement>(null);

  // ── Loading state ────────────────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);

  const handleGo = () => {
    setBarTypedValue('');
    setTokenResetKey(k => k + 1);
    setSearchFocused(false);
    setBarActive(false);
    editingTokenRef.current = false;
    const active = pendingQueryRef.current.metrics.length > 0 || pendingQueryRef.current.groupBy.length > 0;
    if (!active && !isDirty) return;
    setQueryState(pendingQueryRef.current);   // commit pending → answer card
    setIsDirty(false);
    // 300ms transition → then loading (500ms — short enough not to feel slow)
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 300);
    setIsAnswerLoading(true);
    setTimeout(() => setIsAnswerLoading(false), 500);
  };

  const handleStop = () => {
    setIsAnswerLoading(false);
    setIsTransitioning(false);
  };

  const handleReplaceToken = (tokenId: string, newCol: ColumnDef) => {
    setPendingQuery(prev => {
      const next = { ...prev };
      if (next.metrics.some(m => m === tokenId)) {
        next.metrics = next.metrics.map(m => m === tokenId ? newCol.id as QMetric : m);
      } else if (next.groupBy.some(d => d === tokenId)) {
        next.groupBy = next.groupBy.map(d => d === tokenId ? newCol.id as QDim : d);
      } else if (next.derivedCols.includes(tokenId)) {
        next.derivedCols = next.derivedCols.map(dc => dc === tokenId ? newCol.id : dc);
      }
      return next;
    });
    setChecked(prev => { const n = new Set(prev); n.delete(tokenId); n.add(newCol.id); return n; });
    setIsDirty(true);
  };

  const toggleSection = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Auto-expand Formulas section the first time a formula column is added
  useEffect(() => {
    if (parentFormulaCols.length > 0) {
      setExpanded(prev => {
        if (prev.has('formulas')) return prev;
        const next = new Set(prev);
        next.add('formulas');
        return next;
      });
    }
  }, [parentFormulaCols.length]);

  // Must match MIDS/DIDS in handleSpotterAction so data panel and Spotter stay in sync.
  const MEASURE_IDS  = hasCanvasScope ? dynamicMeasureIds : new Set<string>(['revenue', 'unitsSold', 'profit', 'profitMarginPct', 'discountPct']);
  const DIM_IDS      = hasCanvasScope ? dynamicDimIds : new Set<string>(['orderDate', 'orderMonth', 'orderQuarter', 'orderYear', 'region', 'state', 'city', 'productCategory', 'productSubCategory', 'productName', 'customerSegment', 'customerType', 'salesChannel']);
  const DERIVED_IDS  = new Set<string>([]);

  // canvasScope only: mirror the Spreadsheet's selected columns into the
  // Query tab's search bar as PENDING tokens — never into queryState, so
  // nothing runs until the user clicks Go (Komal: "when I switch to query,
  // it should add the same columns to query bar, but run them only when the
  // user clicks on go"). handleGo is the sole pending → queryState commit.
  const sheetColKeyString = [...sheetColKeys].join(',');
  useEffect(() => {
    if (!hasCanvasScope) return;
    const keys = [...sheetColKeys];
    setPendingQuery(prev => ({
      ...prev,
      metrics: keys.filter(k => MEASURE_IDS.has(k)) as QMetric[],
      groupBy: keys.filter(k => DIM_IDS.has(k)) as QDim[],
      derivedCols: keys.filter(k => DERIVED_IDS.has(k)),
    }));
    setChecked(new Set(keys));
    setIsDirty(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetColKeyString, hasCanvasScope]);

  // Called when the sheet column picker adds/removes columns (Sheet → Search direction).
  // Rebuilds the query state so both views stay in sync.
  const handleSheetColumnsChange = (keys: Set<string>) => {
    const metrics     = [...keys].filter(k => MEASURE_IDS.has(k)) as QMetric[];
    const groupBy     = [...keys].filter(k => DIM_IDS.has(k))     as QDim[];
    const derivedCols = [...keys].filter(k => DERIVED_IDS.has(k));
    const newQuery: QueryState = { ...queryState, metrics, groupBy, derivedCols };
    setPendingQuery(newQuery);
    setQueryState(newQuery);
    setChecked(new Set(keys));
  };

  const toggleColumn = (id: string) => {
    // Compute next state outside the updater so we can call setQueryState at the same level
    const next = { ...pendingQuery };
    if (MEASURE_IDS.has(id)) {
      const m = id as QMetric;
      next.metrics = next.metrics.includes(m)
        ? next.metrics.filter(x => x !== m)
        : [...next.metrics, m];
    } else if (DIM_IDS.has(id)) {
      const d = id as QDim;
      next.groupBy = next.groupBy.includes(d)
        ? next.groupBy.filter(x => x !== d)
        : [...next.groupBy, d];
    } else if (DERIVED_IDS.has(id)) {
      next.derivedCols = next.derivedCols.includes(id)
        ? next.derivedCols.filter(x => x !== id)
        : [...next.derivedCols, id];
    }
    // Both setters called at top level — mirrors handleSheetColumnsChange pattern.
    // canvasScope (Query tab's own data panel — the Spreadsheet tab's sidebar
    // now bypasses this entirely via the direct bridge, see canvasScopeMode
    // in SheetView): don't auto-commit to queryState on every checkbox toggle
    // — the answer should only appear after "Go" (Komal: "the query is not
    // displayed live... only after the user clicks Go, an answer is seen").
    setPendingQuery(next);
    setChecked(queryToActiveCols(next));
    if (hasCanvasScope) {
      setIsDirty(true);
      return;
    }
    setQueryState(next);
    setIsDirty(false);
    // Trigger loading animation
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 300);
    setIsAnswerLoading(true);
    setTimeout(() => setIsAnswerLoading(false), 500);
  };

  // ── Derived display values ────────────────────────────────────────────────
  // hasPending: drives search bar tokens, X button, Go button, checkboxes
  // hasQuery:   drives answer card (only updates on Go)
  const hasPending     = pendingQuery.metrics.length > 0 || pendingQuery.groupBy.length > 0;
  const hasQuery       = queryState.metrics.length > 0 || queryState.groupBy.length > 0 || queryState.derivedCols.length > 0 || parentFormulaCols.length > 0;
  const _baseSearchTokens = hasPending ? queryToTokens(pendingQuery) : [];
  const searchTokens   = [
    ..._baseSearchTokens,
    ...parentFormulaCols.map(f => ({ id: f.key, label: f.name, type: 'measure' as TokenType })),
  ];
  const activeCols     = queryToActiveCols(pendingQuery);
  const computedTitle  = hasQuery ? queryToTitle(queryState, hasCanvasScope) : 'Answer';
  const answerTitle    = customTitle ?? computedTitle;
  const allDataSources = [...dynamicDataSources, ...dataModelSources];
  const activeSourceName = (allDataSources.find(s => s.id === dataModelSelectedId) ?? allDataSources[0])?.name ?? 'Sample Retail';
  const activeInputTable = savedInputTables.find(t => t.tableName === activeSourceName) ?? null;

  useEffect(() => {
    if (!navigateToInputTable) return;
    setSheetTab('sheet');
    setSheetDataPanelOpen(true);
    if (lastSavedSourceId) setDataModelSelectedId(lastSavedSourceId);
    setNavigateToInputTable(false);
  }, [navigateToInputTable, lastSavedSourceId]);

  const openWritebackModal = () => {
    setWritebackTableName('');
    const customCols = parentFormulaCols.filter(f => f.key.startsWith('__custom_') || f.key.startsWith('__pending_'));
    const formulaCols = parentFormulaCols.filter(f => f.key.startsWith('__formula_'));
    setWritebackCustomColKeys(new Set(customCols.map(f => f.key)));
    setWritebackFormulaColKeys(new Set(formulaCols.map(f => f.key)));
    setWritebackKeyColKeys(new Set(queryState.groupBy as string[]));
    setWritebackCustomSearch('');
    setWritebackKeySearch('');
    setWritebackModalOpen(true);
  };

  const openSaveModal = () => {
    const hasCustomCols = parentFormulaCols.some(f => f.key.startsWith('__custom_') || f.key.startsWith('__pending_'));
    if (hasCustomCols) {
      setUnsavedColsModalOpen(true);
    } else {
      setSaveAnswerName(answerTitle);
      setSaveModalOpen(true);
    }
  };
  const aggData        = hasQuery ? aggregate(queryState, hasCanvasScope ? dynamicRows : undefined) : [];
  // Base data — then inject formula values into each row
  const _baseDisplayData = hasQuery ? buildDisplayData(queryState, hasCanvasScope ? dynamicRows : undefined) : [];
  const displayData = _baseDisplayData.map((row, ri) => {
    if (!parentFormulaCols.length) return row;
    const extra: Record<string, unknown> = {};
    parentFormulaCols.forEach(f => { extra[f.key] = parentFormulaValues[f.key]?.[ri] ?? null; });
    return { ...row, ...extra };
  });
  // Base columns — then append formula columns
  const _allDisplayColumns = [
    ...buildDisplayColumns(queryState),
    ...parentFormulaCols.map(f => ({
      key: f.key,
      label: f.name,
      sortable: true,
      align: 'right' as const,
      width: 160,
      render: (v: unknown) => v != null && v !== '' ? String(Math.round(Number(v) * 100) / 100) : '',
    })),
  ];
  const displayColumns = activeInputTable
    ? _allDisplayColumns.filter(c => activeInputTable.columns.some(sc => sc.id === c.key))
    : _allDisplayColumns;

	  const applyActionsToSnapshotQuery = (base: QueryState, actions: SpotterAction[] = []): QueryState => {
	    return actions.reduce<QueryState>((state, action) => {
	      if (action.type === 'add_column' || action.type === 'remove_column') {
	        const isAdd = action.type === 'add_column';
	        const id = action.column;
	        const next = {
	          ...state,
	          metrics: [...state.metrics],
	          groupBy: [...state.groupBy],
	          filters: [...state.filters],
	          sorts: [...state.sorts],
	          derivedCols: [...state.derivedCols],
	        };
	        if (MEASURE_IDS.has(id)) {
	          const metric = id as QMetric;
	          next.metrics = isAdd
	            ? next.metrics.includes(metric) ? next.metrics : [...next.metrics, metric]
	            : next.metrics.filter(m => m !== metric);
	        } else if (DIM_IDS.has(id)) {
	          const dim = id as QDim;
	          next.groupBy = isAdd
	            ? next.groupBy.includes(dim) ? next.groupBy : [...next.groupBy, dim]
	            : next.groupBy.filter(d => d !== dim);
	        } else {
	          next.derivedCols = isAdd
	            ? next.derivedCols.includes(id) ? next.derivedCols : [...next.derivedCols, id]
	            : next.derivedCols.filter(d => d !== id);
	        }
	        return next;
	      }
	      if (action.type === 'add_filter') {
	        return { ...state, filters: [...state.filters.filter(f => f.col !== action.column), { col: action.column, val: action.value }] };
	      }
	      if (action.type === 'remove_filter') {
	        return { ...state, filters: state.filters.filter(f => f.col !== action.column) };
	      }
	      if (action.type === 'sort') {
	        return { ...state, sorts: [{ col: action.column, dir: (action.direction ?? 'desc') as 'asc' | 'desc' }] };
	      }
	      if (action.type === 'change_chart') {
	        return { ...state, viewMode: action.chart_type === 'table' ? 'table' : 'chart' };
	      }
	      if (action.type === 'change_currency') {
	        return { ...state, currency: currencyCodeFromSymbol(action.symbol) };
	      }
	      if (action.type === 'add_formula') {
	        return { ...state, viewMode: 'table' };
	      }
	      return state;
	    }, {
	      ...base,
	      metrics: [...base.metrics],
	      groupBy: [...base.groupBy],
	      filters: [...base.filters],
	      sorts: [...base.sorts],
	      derivedCols: [...base.derivedCols],
	    });
	  };

	  // Helper — builds the current answer state into a snapshot for cross-surface switching.
	  // Passing mode: 'search' or 'spreadsheet' tells the receiving surface which view reopens it.
	  const buildSnapshot = (targetMode: 'search' | 'spreadsheet', queryOverride: QueryState = queryState): AnswerSnapshot => ({
	    name: saveAnswerName,
	    description: saveDescription,
	    queryState: queryOverride,
	    customTitle,
	    sheetExpanded,
	    sheetDataView,
    sheetTab,
    savedAt: new Date().toISOString(),
    mode: targetMode,
    formulaCols: parentFormulaCols,
	    formulaValues: parentFormulaValues,
	  });

	  const createSpotterVersionSnapshot = (actions: SpotterAction[] = []): AnswerSnapshot => {
	    const queryForVersion = applyActionsToSnapshotQuery(queryStateRef.current, actions);
	    return buildSnapshot(isSpreadsheetMode ? 'spreadsheet' : 'search', queryForVersion);
	  };

	  const restoreSpotterVersion = (snapshot: AnswerSnapshot) => {
	    setSaveAnswerName(snapshot.name);
	    setSaveDescription(snapshot.description);
	    setCustomTitle(snapshot.customTitle);
	    setCustomDesc(snapshot.description);
	    setSheetTab(snapshot.sheetTab ?? 'query');
	    setSheetDataView(snapshot.sheetDataView);
	    setParentFormulaCols(snapshot.formulaCols ?? []);
	    setParentFormulaValues(snapshot.formulaValues ?? {});
	    setPendingQuery(snapshot.queryState);
	    setQueryState(snapshot.queryState);
	    setChecked(queryToActiveCols(snapshot.queryState));
	    setCanvasBlocks([]);
	    setIsDirty(false);
	    setIsAnswerLoading(false);
	    setIsTransitioning(false);
	  };

  // ── Pre-render: answer area shared between Current and Minimal layouts ──────
  const answerContent = (
    <>
      {!hasQuery && !isAnswerLoading ? (
        <div className={styles.emptyCanvas}>
          <div className={hasCanvasScope ? `${styles.emptySearchHero} ${styles.emptySearchHeroDense}` : styles.emptySearchHero}>
            <svg className={styles.emptySearchIllustration} viewBox="0 0 270 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect x="0" y="146" width="28" height="48" fill="currentColor" opacity="0.85" />
              <path d="M38 94V195" stroke="currentColor" strokeWidth="5" strokeDasharray="4 8" />
              <path d="M46 94V195" stroke="currentColor" strokeWidth="5" strokeDasharray="4 8" />
              <path d="M54 94V195" stroke="currentColor" strokeWidth="5" strokeDasharray="4 8" />
              <path d="M62 118V195" stroke="currentColor" strokeWidth="5" strokeDasharray="4 8" />
              <circle cx="112" cy="86" r="62" stroke="currentColor" strokeWidth="25" />
              <path d="M157 134L197 193" stroke="currentColor" strokeWidth="25" strokeLinecap="square" />
              <circle cx="216" cy="78" r="60" fill="currentColor" opacity="0.45" />
              <path d="M174 24H250" stroke="var(--rd-sys-color-background-sunken, #f5f7fa)" strokeWidth="8" />
              <path d="M160 50H262" stroke="var(--rd-sys-color-background-sunken, #f5f7fa)" strokeWidth="8" />
              <path d="M155 76H267" stroke="var(--rd-sys-color-background-sunken, #f5f7fa)" strokeWidth="8" />
              <path d="M162 102H260" stroke="var(--rd-sys-color-background-sunken, #f5f7fa)" strokeWidth="8" />
              <path d="M182 128H240" stroke="var(--rd-sys-color-background-sunken, #f5f7fa)" strokeWidth="8" />
            </svg>
            <div className={styles.emptySearchContent}>
              <h2 className={styles.emptySearchTitle}>Search your data</h2>
              <p className={styles.emptySearchDescription}>
                {hasCanvasScope
                  ? 'Select a table or join on the canvas, or query at the model level.'
                  : 'Search your data directly or ask Spotter questions to uncover insights faster.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.chartContainer} style={{ ...(version === 'minimal' || hasCanvasScope ? { borderRadius: 0, boxShadow: 'none' } : {}), position: 'relative' }}>
          <div className={styles.chartContent} style={hasCanvasScope ? { padding: '12px 16px', gap: 8 } : undefined}>
            {hasQuery && (<>
              <div className={styles.chartHeading} style={hasCanvasScope ? { justifyContent: 'flex-start' } : undefined}>
                {/* With canvasScope the title lives in the sub-header above and
                    the description is removed; the empty title group is dropped
                    entirely (rather than left as a 0-height flex child) and the
                    view toggle sits at the left on its own instead. */}
                {!hasCanvasScope && (
                  <div className={styles.chartTitleGroup}>
                    {titleEditing ? (
                      <input ref={titleEditRef} className={styles.answerTitleInput} defaultValue={answerTitle} autoFocus
                        onBlur={e => { setTitleEditing(false); setCustomTitle(e.target.value.trim() || computedTitle); }}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { setTitleEditing(false); setCustomTitle((e.target as HTMLInputElement).value.trim() || computedTitle); } }}
                      />
                    ) : (
                      <span className={styles.answerTitleDisplay} onClick={() => { setTitleEditing(true); setTimeout(() => titleEditRef.current?.select(), 10); }}>{answerTitle}</span>
                    )}
                    {descEditing ? (
                      <input ref={descEditRef} className={styles.answerDescInput} defaultValue={customDesc} autoFocus placeholder="Add description"
                        onBlur={e => { setDescEditing(false); setCustomDesc(e.target.value); }}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { setDescEditing(false); setCustomDesc((e.target as HTMLInputElement).value); } }}
                      />
                    ) : (
                      <span className={`${styles.answerDescDisplay} ${!(customDesc || hasQuery) ? styles.answerDescDisplayPlaceholder : ''}`}
                        onClick={() => { setDescEditing(true); setTimeout(() => descEditRef.current?.focus(), 10); }}>
                        {customDesc || (hasQuery ? 'Add description' : '')}
                      </span>
                    )}
                  </div>
                )}
                <div className={styles.chartControls}>
                  {sheetTab !== 'sheet' && (
                    hasCanvasScope ? (
                      // Optimized: the DS SegmentedControl (text labels) instead
                      // of the icon segmented control — shorter, so it doesn't
                      // force extra height on this row (see chartContent's own
                      // padding above).
                      <SegmentedControl
                        options={[{ id: 'table', label: 'Table' }, { id: 'chart', label: 'Chart' }]}
                        value={queryState.viewMode}
                        onChange={v => setQueryState(q => ({ ...q, viewMode: v as 'table' | 'chart' }))}
                        size="small"
                      />
                    ) : (
                      <ChartViewToggle value={queryState.viewMode} onChange={v => setQueryState(q => ({ ...q, viewMode: v as 'table' | 'chart' }))} />
                    )
                  )}
                  {/* With canvasScope, Share and Pin live inside the three-dot menu instead. */}
                  {!hasCanvasScope && (
                    <button className={styles.circleBtn} aria-label="Share"><Icon name="share" size="m" color={systemColors.light['content-primary']} /></button>
                  )}
                  {!hasCanvasScope && (
                    <div style={{ position: 'relative' }}>
                      <button className={styles.circleBtn} aria-label="More options" onClick={e => { e.stopPropagation(); setAnswerMoreOpen(o => !o); }}>
                        <Icon name="more" size="m" color={systemColors.light['content-primary']} />
                      </button>
                      <MoreMenu open={answerMoreOpen} onClose={() => setAnswerMoreOpen(false)}
                        variant="answerCard"
                        onSave={openSaveModal}
                      />
                    </div>
                  )}
                  {!hasCanvasScope && !editMode && (
                    <>
                      <span className={styles.vDivider}><Divider vertical /></span>
                      <PinSplitButton disabled={queryState.viewMode === 'sheet' || sheetTab === 'sheet'} />
                    </>
                  )}
                </div>
              </div>
              {sheetTab !== 'sheet' && <CanvasBlocksPanel blocks={canvasBlocks} />}
	              {queryState.viewMode === 'chart' ? (
	                <AnswerChart
	                  data={aggData}
	                  metrics={queryState.metrics.length ? queryState.metrics : ['revenue']}
	                  groupBy={queryState.groupBy}
	                  colors={chartColors}
	                  currencySymbol={CURRENCY_SYMBOLS[queryState.currency] ?? ''}
	                />
              ) : (
                <div className={styles.tableWrapper}>
                  <AnswerTable columns={displayColumns} data={displayData} lightHeader={lightAnswerTableHeader} />
                  <div className={styles.tableFooter}>Showing {displayData.length} of {displayData.length} rows</div>
                </div>
              )}
            </>)}
          </div>
          <aside className={hasCanvasScope ? `${styles.rightSidebar} ${styles.rightSidebarDense}` : styles.rightSidebar}>
            {SIDEBAR_ITEMS.map((item, i) =>
              item === 'divider' ? (
                <div key={`div-${i}`} className={styles.sidebarDivider} />
              ) : (
                <div key={item.label} className={`${styles.sidebarItem} ${activeSidebarItem === item.label ? styles.sidebarItemActive : ''}`}>
                  <Tooltip content={item.label} placement="left" showDelay={300}>
                    <button className={styles.sidebarBtn} aria-label={item.label} onClick={() => {
                      setActiveSidebarItem(prev => prev === item.label ? null : item.label);
                      // Brief canvas loading to reflect chart editor changes
                      setIsAnswerLoading(true);
                      setTimeout(() => setIsAnswerLoading(false), 400);
                    }}>
                      <SidebarIcon icon={item.icon} />
                    </button>
                  </Tooltip>
                </div>
              )
            )}
          </aside>
        </div>
      )}
    </>
  );

  // Query bar row — Padding: 24px top (gap from header), 24px left/right, 0
  // bottom. Two white surface boxes: main search area + undo/redo/reset box.
  // With canvasScope this renders inside the content column (beneath the new
  // title sub-header) instead of full-width above .main.
  const queryBarBlock = (
      <div className={styles.queryBarRow} style={{ position: 'relative', zIndex: (searchFocused || isDirty) ? 110 : 'auto', ...(edgeToEdge ? { padding: 0 } : {}), ...(hasCanvasScope ? { gap: 0, background: 'var(--rd-sys-color-background-base, #fff)', borderBottom: '1px solid var(--rd-sys-color-border-divider, #EAEDF2)' } : {}) }}>
        {/* Main search bar — clicks anywhere focus the typing input */}
        <div
          className={styles.queryBarMain}
          style={hasCanvasScope ? { borderRadius: 0, boxShadow: 'none' } : undefined}
          onClick={() => { setSearchFocused(true); setBarActive(true); barInputRef.current?.focus(); }}
        >
          {/* Left: hamburger (toggles data panel) + source selector.
              With canvasScope both live in the title sub-header above instead. */}
          {!hasCanvasScope && (
          <div className={styles.queryBarLeft}>
            <button
              className={styles.iconBtn}
              aria-label="Toggle data panel"
              onClick={e => { e.stopPropagation(); setDataPanelVisible(v => !v); }}
            >
              {dataPanelVisible ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <g clipPath="url(#sdw-panel-close)">
                    <path d="M13.3333 1.14279H2.66663C1.82506 1.14279 1.14282 1.82502 1.14282 2.6666V13.3333C1.14282 14.1748 1.82506 14.8571 2.66663 14.8571H13.3333C14.1749 14.8571 14.8571 14.1748 14.8571 13.3333V2.6666C14.8571 1.82502 14.1749 1.14279 13.3333 1.14279Z" stroke="#1D232F" strokeWidth="1.5"/>
                    <path d="M5.71436 1.14279V14.8571" stroke="#1D232F" strokeWidth="1.5"/>
                    <path d="M11.0477 10.2858L8.76196 8.00013L11.0477 5.71442" stroke="#1D232F" strokeWidth="1.5"/>
                  </g>
                  <defs><clipPath id="sdw-panel-close"><rect width="16" height="16" fill="white"/></clipPath></defs>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <g clipPath="url(#sdw-panel-open)">
                    <path d="M13.3333 1.14279H2.66663C1.82506 1.14279 1.14282 1.82502 1.14282 2.6666V13.3333C1.14282 14.1748 1.82506 14.8571 2.66663 14.8571H13.3333C14.1749 14.8571 14.8571 14.1748 14.8571 13.3333V2.6666C14.8571 1.82502 14.1749 1.14279 13.3333 1.14279Z" stroke="#1D232F" strokeWidth="1.5"/>
                    <path d="M5.71436 1.14279V14.8571" stroke="#1D232F" strokeWidth="1.5"/>
                    <path d="M8.76189 10.2858L11.0476 8.00013L8.76189 5.71442" stroke="#1D232F" strokeWidth="1.5"/>
                  </g>
                  <defs><clipPath id="sdw-panel-open"><rect width="16" height="16" fill="white"/></clipPath></defs>
                </svg>
              )}
            </button>

            <span className={styles.vDivider}><Divider vertical /></span>

            <div style={{ position: 'relative' }}>
              <Button
                ref={scopeBtnRef}
                variant="tertiary"
                size="basic"
                iconPosition="trailing"
                icon={<Icon name="chevron-down" size="s" color="var(--rd-sys-color-content-secondary, #596278)" />}
                onClick={e => {
                  e.stopPropagation();
                  if (hasCanvasScope) { setScopeMenuOpen(o => !o); setScopeSub(null); setScopeSearch(''); return; }
                  setDataModelModalOpen(true);
                }}
                style={{ color: 'var(--rd-sys-color-content-primary, #1d232f)' }}
              >
                {hasCanvasScope ? canvasScopeLabel : activeSourceName}
              </Button>
              {hasCanvasScope && scopeFlyoutMenu}
            </div>

            {/* margin-left: auto pushes this divider to the right edge of queryBarLeft,
                aligning it with the data panel's right edge below */}
            <span className={styles.vDivider} style={{ marginLeft: 'auto', flexShrink: 0 }}><Divider vertical /></span>
          </div>
          )}

          {/* Center: search icon (fixed) + token area (wraps internally) */}
          <div className={`${styles.queryBarSearch}${!searchBarExpanded ? ` ${styles.queryBarSearchCollapsed}` : ''}`}>
            {/* Search icon — fixed to top row, vertically centred within first-row height */}
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, height: 32, width: 16 }}>
              <Icon name="search" size="s" color={systemColors.light['content-secondary']} />
            </span>

            {/* Token area: flex:1, wraps internally between icon and actions */}
            <div className={styles.searchTokens}>
              {searchTokens.map(token => (
                <DataToken
                  key={`${token.id}-${tokenResetKey}`}
                  label={token.label}
                  type={token.type as TokenType}
                  onReplace={col => handleReplaceToken(token.id, col)}
                  onEditStart={() => {
                    editingTokenRef.current = true;
                    setSearchFocused(true);
                    setBarActive(false);
                  }}
                  onEditEnd={() => {
                    editingTokenRef.current = false;
                  }}
                />
              ))}
              {/* Typing input lives inside the token area so it flows after the last token */}
              {barActive && (
                <span style={{ position: 'relative', display: 'inline-flex', flex: 1, minWidth: 80 }}>
                  <input
                    ref={barInputRef}
                    className={styles.barTypeInput}
                    value={barTypedValue}
                    autoFocus
                    placeholder={!searchTokens.length ? 'Type to search columns…' : ''}
                    onChange={e => setBarTypedValue(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => {
                      if (e.key === 'Escape') { setSearchFocused(false); setBarActive(false); setBarTypedValue(''); }
                      if (e.key === 'Enter')  { handleGo(); }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setBarActive(false);
                        setBarTypedValue('');
                        if (!editingTokenRef.current) setSearchFocused(false);
                      }, 150);
                    }}
                  />
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: 280, zIndex: 300 }}>
                    <SearchTypeahead
                      query={barTypedValue}
                      onSelect={col => {
                        toggleColumn(col.id);
                        setBarTypedValue('');
                        barInputRef.current?.focus();
                      }}
                      columns={hasCanvasScope ? scopedCols.map(c => ({ id: c.key, label: c.label, type: (c.measure ? 'measure' : 'attribute') as TokenType })) : undefined}
                    />
                  </div>
                </span>
              )}
            </div>
          </div>

          {/* Right: expand/collapse chevron + X (clear) + Go/Stop */}
          <div className={styles.queryBarActions} onClick={e => e.stopPropagation()}>
            {/* Chevron — only shown when there are tokens, toggles bar expand/collapse.
                Hidden with canvasScope (removed from the Option 3 query bar). */}
            {!hasCanvasScope && (hasPending || hasQuery) && (
              <button
                className={styles.iconBtn}
                aria-label={searchBarExpanded ? 'Collapse search bar' : 'Expand search bar'}
                onMouseDown={e => { e.preventDefault(); setSearchBarExpanded(v => !v); }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  {searchBarExpanded
                    ? <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    : <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  }
                </svg>
              </button>
            )}
            {(searchFocused || hasPending || hasQuery || isAnswerLoading) && (
              <button
                className={styles.iconBtn}
                aria-label="Clear search"
                onMouseDown={e => {
                  e.preventDefault();
                  setPendingQuery(EMPTY_QUERY);
                  setQueryState(EMPTY_QUERY);
                  setCanvasBlocks([]);
                  setChecked(new Set());
                  setTokenResetKey(k => k + 1);
                  setBarTypedValue('');
                  setIsDirty(false);
                  setBarActive(false);
                  handleStop();
                  setSearchFocused(false);
                }}
              >
                <Icon name="cross" size="s" color={systemColors.light['content-secondary']} />
              </button>
            )}
            <GoStopButton
              state={isTransitioning ? 'stopping' : isAnswerLoading ? 'loading' : (searchFocused || isDirty) ? 'focused' : 'idle'}
              onGo={handleGo}
              onStop={handleStop}
            />
          </div>
        </div>

        {/* Undo / redo / reset box */}
        <div className={styles.undoRedoBox} style={hasCanvasScope ? { borderRadius: 0, boxShadow: 'none', borderLeft: '1px solid var(--rd-sys-color-border-divider, #EAEDF2)', paddingLeft: 12, marginLeft: 4 } : undefined}>
          <button className={styles.iconBtn} aria-label="Undo">
            <Icon name="arrow-left" size="m" color={systemColors.light['content-primary']} />
          </button>
          <button className={styles.iconBtn} aria-label="Redo">
            <Icon name="arrow-right" size="m" color={systemColors.light['content-primary']} />
          </button>
          <span className={styles.vDivider}><Divider vertical /></span>
          <button className={styles.iconBtn} aria-label="Reset">
            <Icon name="reset" size="m" color={systemColors.light['content-primary']} />
          </button>
        </div>

        {/* SpotterData button — hidden when panel is open */}
        {showSpotter && !spotterOpen && (
          <button
            className={styles.spotterBtnQueryIcon}
            onClick={() => setSpotterOpen(o => !o)}
            aria-label="Toggle Spotter"
            style={{ marginLeft: 'auto' }}
          >
            <SpotterIcon size="l" aria-hidden />
          </button>
        )}

      </div>
  );

  return (
    // width/height: 100% (not 100vh) — this renders nested inside the Query
    // tab's own flex-centered content area rather than at the document root.
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* ── Search data header ────────────────────────────────────────── */}
      {!hideHeaderBar && (
      <div style={{
        display: 'flex', alignItems: 'center',
        height: 60, flexShrink: 0,
        position: 'relative',
        background: 'var(--rd-sys-color-background-sunken, #F6F8FA)',
        borderBottom: '1px solid var(--rd-sys-color-border-divider, #EAEDF2)',
      }}>
        {/* Centre: Query/Spreadsheet toggle — absolutely centred relative to full header width */}
        {!isSpreadsheetMode && !hideSheetToggle && (
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}>
            <div style={{ ...v1ToggleStyles.wrap }}>
              {(['query', 'sheet'] as const).map(t => (
                <button key={t} style={{ ...v1ToggleStyles.btn, ...(sheetTab === t ? v1ToggleStyles.btnActive : {}) }} onClick={() => setSheetTab(t)}>
                  {t === 'query' ? 'Query' : 'Spreadsheet'}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ flex: 1 }} />

        {/* Right: edit mode — Save changes + Exit */}
        {editMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 24, flexShrink: 0 }}>
            <Button variant="secondary" size="basic" onClick={() => {
              setSaveToastVisible(true);
              const snap: AnswerSnapshot = { name: saveAnswerName || answerTitle, description: saveDescription, queryState, customTitle, sheetExpanded, sheetDataView, sheetTab, savedAt: new Date().toISOString(), mode: 'search', formulaCols: parentFormulaCols, formulaValues: parentFormulaValues, chartColors };
              onSaveChanges?.(snap);
            }}>Save changes</Button>
            <Button variant="tertiary" size="basic" onClick={onExit}>Exit</Button>
          </div>
        )}
      </div>
      )}

      {/* ── Save answer modal (M1, Figma 340:122546) ─────────────────── */}
      {/* z-index wrapper: sheet expanded overlay is 9500, modal default is 1000 */}
      <div style={{ '--z-index-modal': '10000' } as React.CSSProperties}>
      <Modal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        size="M1"
        title="Describe your answer"
        showCloseButton={false}
        footer={
          <div style={{ display: 'flex', gap: 16, marginLeft: 'auto' }}>
            <Button variant="secondary" size="basic" onClick={() => setSaveModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="basic" onClick={() => {
              const newTitle = saveAnswerName.trim() || computedTitle;
              setCustomTitle(newTitle);
              setSaveModalOpen(false);
              setSaveToastVisible(true);
              onSave?.({ name: saveAnswerName, description: saveDescription, queryState, customTitle: newTitle, sheetExpanded, sheetDataView, sheetTab, savedAt: new Date().toISOString(), mode: isSpreadsheetMode ? 'spreadsheet' : 'search', formulaCols: parentFormulaCols, formulaValues: parentFormulaValues });
            }}>Save answer</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <TextInput
            label="Name"
            value={saveAnswerName}
            onChange={e => setSaveAnswerName(e.target.value)}
          />
          <TextArea
            label="Description"
            placeholder="Explain the purpose of the answer and how others should be read it"
            value={saveDescription}
            onChange={e => setSaveDescription(e.target.value)}
            rows={4}
          />
          <Checkbox
            checked={saveDiscoverable}
            onChange={setSaveDiscoverable}
            label="Make this answer discoverable"
          />
        </div>
      </Modal>
      </div>

      {/* ── Select data model modal ─────────────────────────────────────── */}
      <div style={{ '--z-index-modal': '10000' } as React.CSSProperties}>
      <Modal
        isOpen={dataModelModalOpen}
        onClose={() => setDataModelModalOpen(false)}
        size="M2"
        title="Select data model"
        showCloseButton={false}
        footer={
          <div style={{ display: 'flex', gap: 16, marginLeft: 'auto' }}>
            <Button variant="secondary" size="basic" onClick={() => setDataModelModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="basic" onClick={() => setDataModelModalOpen(false)}>Select</Button>
          </div>
        }
      >
        <DataModelPicker
          selectedId={dataModelSelectedId}
          onSelectId={setDataModelSelectedId}
          extraSources={dynamicDataSources}
        />
      </Modal>
      </div>

      {/* ── Unsaved columns modal ───────────────────────────────────────── */}
      {(() => {
        const unsavedCols = parentFormulaCols.filter(f => f.key.startsWith('__custom_') || f.key.startsWith('__pending_'));
        return (
          <Modal
            isOpen={unsavedColsModalOpen}
            onClose={() => setUnsavedColsModalOpen(false)}
            size="M1"
            type="simple"
            title="Unsaved columns"
            footer={
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12 }}>
                <Link
                  color="blue"
                  style={{ marginRight: 'auto', cursor: 'pointer' }}
                  onClick={() => { setUnsavedColsModalOpen(false); setSaveAnswerName(answerTitle); setSaveModalOpen(true); }}
                >Discard</Link>
                <Button variant="secondary" size="basic" onClick={() => setUnsavedColsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" size="basic" onClick={() => {
                  setUnsavedColsModalOpen(false);
                  setWritebackTableName('');
                  const customCols = parentFormulaCols.filter(f => f.key.startsWith('__custom_') || f.key.startsWith('__pending_'));
                  setWritebackCustomColKeys(new Set(customCols.map(f => f.key)));
                  const attrColIds = new Set(queryState.groupBy as string[]);
                  setWritebackKeyColKeys(attrColIds);
                  setWritebackCustomSearch('');
                  setWritebackKeySearch('');
                  setWritebackFromSaveFlow(true);
                  setWritebackModalOpen(true);
                }}>Save as Input table</Button>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Typography variant="body-normal" color="gray">
                The following custom columns are not saved. To include them in the answer, save them as an input table.
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {unsavedCols.map(f => (
                  <li key={f.key}>
                    <Typography variant="body-normal">{f.name}</Typography>
                  </li>
                ))}
              </ul>
            </div>
          </Modal>
        );
      })()}

      {/* ── Save as input table modal ───────────────────────────────────── */}
      {(() => {
        const customCols = parentFormulaCols.filter(f => f.key.startsWith('__custom_') || f.key.startsWith('__pending_'));
        const formulaCols = parentFormulaCols.filter(f => f.key.startsWith('__formula_'));
        const hasCustomCols = customCols.length > 0;
        // Combined column list: custom cols (pencil) + formula cols (fx) shown in one dropdown
        const allEditableColOptions = [
          ...customCols.map(f => ({ id: f.key, label: f.name, kind: 'custom' as const })),
          ...formulaCols.map(f => ({ id: f.key, label: f.name, kind: 'formula' as const })),
        ];
        const customColOptions = customCols.map(f => ({ id: f.key, label: f.name }));
        // Any custom col that exists but is deselected triggers the warning
        const hasDeselectedCustom = customCols.some(f => !writebackCustomColKeys.has(f.key));

        const ALL_ATTR_COLS = [
          { id: 'region', label: 'Region' }, { id: 'state', label: 'State' }, { id: 'city', label: 'City' },
          { id: 'productCategory', label: 'Product category' }, { id: 'productSubCategory', label: 'Product sub category' },
          { id: 'productName', label: 'Product name' }, { id: 'customerSegment', label: 'Customer segment' },
          { id: 'customerType', label: 'Customer type' }, { id: 'salesChannel', label: 'Sales channel' },
          { id: 'orderDate', label: 'Order date' }, { id: 'orderMonth', label: 'Order month' },
          { id: 'orderQuarter', label: 'Order quarter' }, { id: 'orderYear', label: 'Order year' },
        ];

        const multiSelectTriggerLabel = (selected: Set<string>, options: {id: string; label: string}[], placeholder: string) => {
          if (selected.size === 0) return <span style={{ color: 'var(--rd-sys-color-content-tertiary, #a0a7b4)' }}>{placeholder}</span>;
          const labels = options.filter(o => selected.has(o.id)).map(o => o.label);
          const visible = labels.slice(0, 2).join(', ');
          const extra = labels.length - 2;
          return <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{visible}{extra > 0 ? `, +${extra}` : ''}</span>;
        };

        const MultiSelectDropdown = ({ options, selected, onToggle, search, onSearch, onClear, isOpen, onOpenChange }: {
          options: {id: string; label: string; icon?: React.ReactNode; tag?: string}[];
          selected: Set<string>;
          onToggle: (id: string) => void;
          search: string;
          onSearch: (v: string) => void;
          onClear: () => void;
          isOpen: boolean;
          onOpenChange: (v: boolean) => void;
        }) => {
          const triggerRef = useRef<HTMLDivElement>(null);
          const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
          useEffect(() => {
            if (isOpen && triggerRef.current) {
              const r = triggerRef.current.getBoundingClientRect();
              setDropdownStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 10100 });
            }
          }, [isOpen]);
          const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
          const panel = isOpen ? ReactDOM.createPortal(
            <div onClick={e => e.stopPropagation()} style={{ ...dropdownStyle, background: '#fff', border: '1px solid var(--rd-sys-color-border-default, #e0e3e8)', borderRadius: 10, boxShadow: '0 8px 24px rgba(25,35,49,0.14)', overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--rd-sys-color-border-divider, #eaedf2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width={14} height={14} viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#a0a7b4" strokeWidth="1.4"/><path d="M11 11l2.5 2.5" stroke="#a0a7b4" strokeWidth="1.4" strokeLinecap="round"/></svg>
                <input
                  autoFocus
                  value={search}
                  onChange={e => onSearch(e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
                  placeholder="Search"
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: 'var(--rd-sys-color-content-primary, #1d232f)', background: 'transparent' }}
                />
              </div>
              <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--rd-sys-color-content-primary, #1d232f)' }}>Selected ({selected.size})</span>
                <button onClick={e => { e.stopPropagation(); onClear(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--rd-sys-color-content-brand, #2770ef)', padding: 0 }}>Clear</button>
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {filtered.map(opt => (
                  <div key={opt.id} onClick={e => { e.stopPropagation(); onToggle(opt.id); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--rd-sys-color-background-subtle, #f5f7fa)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Checkbox checked={selected.has(opt.id)} onChange={() => onToggle(opt.id)} />
                    <span style={{ flex: 1, color: 'var(--rd-sys-color-content-primary, #1d232f)' }}>{opt.label}</span>
                    {opt.tag && <span style={{ fontSize: 11, color: 'var(--rd-sys-color-content-tertiary, #a0a7b4)', flexShrink: 0 }}>{opt.tag}</span>}
                    {opt.icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: 'var(--rd-sys-color-content-tertiary, #a0a7b4)' }}>{opt.icon}</span>}
                  </div>
                ))}
                {filtered.length === 0 && <div style={{ padding: '12px', fontSize: 13, color: 'var(--rd-sys-color-content-tertiary, #a0a7b4)', textAlign: 'center' }}>No results</div>}
              </div>
            </div>,
            document.body
          ) : null;
          return (
            <div ref={triggerRef} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
              <div
                role="combobox"
                aria-expanded={isOpen}
                tabIndex={0}
                onClick={() => onOpenChange(!isOpen)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenChange(!isOpen); } if (e.key === 'Escape') onOpenChange(false); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 32, padding: '0 10px', border: '1.5px solid var(--rd-sys-color-border-default, #c8cdd6)', borderRadius: 8, cursor: 'pointer', fontSize: 14, background: '#fff', gap: 6, userSelect: 'none', ...(isOpen ? { borderColor: 'var(--rd-sys-color-content-brand, #2770ef)' } : {}) }}
              >
                {multiSelectTriggerLabel(selected, options, 'Select')}
                <svg width={14} height={14} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}><path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              {panel}
            </div>
          );
        };
        return (
          <Modal
            isOpen={writebackModalOpen}
            onClose={() => setWritebackModalOpen(false)}
            size="M2"
            type="simple"
            title="Save as input table"
            footer={
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
                <Button variant="secondary" size="basic" onClick={() => setWritebackModalOpen(false)}>Cancel</Button>
                <Button variant="primary" size="basic" disabled={!hasCustomCols} onClick={() => {
                  const savedCols = [
                    ...ALL_ATTR_COLS
                      .filter(o => writebackKeyColKeys.has(o.id))
                      .map(o => ({ id: o.id, name: o.label, kind: 'key' as const })),
                    ...customColOptions
                      .filter(o => writebackCustomColKeys.has(o.id))
                      .map(o => ({ id: o.id, name: o.label, kind: 'custom' as const })),
                    // Formulas only saved when custom cols present
                    ...formulaCols
                      .filter(f => writebackFormulaColKeys.has(f.key))
                      .map(f => ({ id: f.key, name: f.name, kind: 'custom' as const })),
                  ];
                  const tName = writebackTableName.trim() || 'Input table';
                  const srcId = `input_${Date.now()}`;
                  const newSource: DataModelSource = { id: srcId, name: tName, type: 'View' };
                  setSavedInputTables(prev => [...prev, { tableName: tName, columns: savedCols }]);
                  setDynamicDataSources(prev => [...prev, newSource]);
                  setLastSavedTableName(tName);
                  setLastSavedSourceId(srcId);
                  const fromSave = writebackFromSaveFlow;
                  setWritebackFromSaveFlow(false);
                  setWritebackModalOpen(false);
                  setWritebackToastVisible(true);
                  if (fromSave) {
                    setTimeout(() => {
                      setSaveAnswerName(answerTitle);
                      setSaveModalOpen(true);
                    }, 300);
                  }
                }}>Save as input table</Button>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {hasDeselectedCustom && (
                <Alert
                  status="warning"
                  message="Custom columns not added to this input table will not be saved in an answer."
                />
              )}
              <Typography variant="body-normal" color="gray" style={{ marginBottom: 12 }}>
                Input tables allow saving custom columns to your data warehouse.
              </Typography>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <TextInput
                  label="Table name"
                  placeholder="e.g. Salary revision Q3"
                  value={writebackTableName}
                  onChange={e => setWritebackTableName(e.target.value)}
                  style={{ height: 32 }}
                />
              </div>
              <Divider />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--rd-sys-color-content-primary, #1d232f)', marginBottom: 4 }}>Custom columns</div>
                  <MultiSelectDropdown
                    options={allEditableColOptions.map(opt => ({
                      id: opt.id,
                      label: opt.label,
                      tag: opt.kind === 'formula' ? 'Optional' : undefined,
                      icon: opt.kind === 'formula'
                        ? <FxIcon size={13} color="currentColor" />
                        : <svg width={13} height={13} viewBox="0 0 16 16" fill="none"><path d="M12.5 2.5a1.414 1.414 0 0 1 2 2L5 14H2v-3L12.5 2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                    }))}
                    selected={new Set([...writebackCustomColKeys, ...writebackFormulaColKeys])}
                    onToggle={id => {
                      const opt = allEditableColOptions.find(o => o.id === id);
                      if (!opt) return;
                      if (opt.kind === 'custom') {
                        setWritebackCustomColKeys(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
                      } else {
                        setWritebackFormulaColKeys(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
                      }
                    }}
                    search={writebackCustomSearch}
                    onSearch={setWritebackCustomSearch}
                    onClear={() => { setWritebackCustomColKeys(new Set()); setWritebackFormulaColKeys(new Set()); }}
                    isOpen={writebackCustomOpen}
                    onOpenChange={v => { setWritebackCustomOpen(v); if (v) setWritebackKeyOpen(false); }}
                  />
                  {!hasCustomCols && (
                    <Typography variant="footnote" color="warning" style={{ marginTop: 4 }}>Add a custom column to enable saving.</Typography>
                  )}
                  {hasCustomCols && <Typography variant="footnote" color="gray" style={{ marginTop: 4 }}>Only first 1,000 rows will be saved.</Typography>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--rd-sys-color-content-primary, #1d232f)', marginBottom: 4 }}>Key columns</div>
                  <MultiSelectDropdown
                    options={ALL_ATTR_COLS}
                    selected={writebackKeyColKeys}
                    onToggle={id => setWritebackKeyColKeys(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; })}
                    search={writebackKeySearch}
                    onSearch={setWritebackKeySearch}
                    onClear={() => setWritebackKeyColKeys(new Set())}
                    isOpen={writebackKeyOpen}
                    onOpenChange={v => { setWritebackKeyOpen(v); if (v) setWritebackCustomOpen(false); }}
                  />
                  <Typography variant="footnote" color="gray" style={{ marginTop: 4 }}>Auto-selected unique row identifiers from the selected data model.</Typography>
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ── Save success toast ──────────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10001 }}>
        <Toast
          message={editMode ? 'Changes saved' : `"${saveAnswerName}" saved successfully`}
          type="success"
          isVisible={saveToastVisible}
          duration={8000}
          onDismiss={() => setSaveToastVisible(false)}
        />
      </div>

      {/* ── Writeback / input table saved toast ─────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10001 }}>
        <Toast
          message={`"${lastSavedTableName}" saved as input table`}
          type="success"
          isVisible={writebackToastVisible}
          duration={8000}
          actionText="View input table"
          onAction={() => {
            setNavigateToInputTable(true);
            setWritebackToastVisible(false);
          }}
          onDismiss={() => setWritebackToastVisible(false)}
        />
      </div>

      <div style={{ flex: 1, overflow: 'hidden', background: 'var(--rd-sys-color-background-sunken, #f5f7fa)' }}>
    {/* Inner wrapper: fills content area, manages its own overflow */}
    <div className={styles.root}>

      {/* ── Body row — wraps all modes; SpotterData panel persists across sheet/search ── */}
      <div className={styles.bodyRow}>
      <div className={styles.leftContent}>
        {/* Full-canvas loading overlay — covers query bar + data panel + answer card */}
        {isAnswerLoading && <div className={styles.canvasLoadingOverlay}><DotsLoader /></div>}

      {/* ── V1 Sheet mode OR Spreadsheet mode: full-page sheet replaces search content ── */}
      {sheetTab === 'sheet' || isSpreadsheetMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#fff', position: 'relative' }}>
          {/* Sub-header: model control | divider | answer name + description.
              With canvasScope, 40px to match the Query tab's own query bar
              (.queryBarMain min-height 40) so the two line up when switching. */}
          <div style={{
            display: 'flex', alignItems: 'center', height: hasCanvasScope ? 40 : 60, flexShrink: 0,
            borderBottom: '1px solid var(--rd-sys-color-border-divider, #EAEDF2)',
            background: '#fff',
          }}>
            {/* Left: model control — width matches data panel so divider aligns with panel edge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 260, flexShrink: 0, padding: edgeToEdge ? 0 : '0 8px 0 24px', position: 'relative' }}>
              <button
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}
                onClick={() => setSheetDataPanelOpen(o => !o)}
              >
                {hasCanvasScope ? (
                  sheetDataPanelOpen ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <g clipPath="url(#sdw-sheet-panel-close)">
                        <path d="M13.3333 1.14279H2.66663C1.82506 1.14279 1.14282 1.82502 1.14282 2.6666V13.3333C1.14282 14.1748 1.82506 14.8571 2.66663 14.8571H13.3333C14.1749 14.8571 14.8571 14.1748 14.8571 13.3333V2.6666C14.8571 1.82502 14.1749 1.14279 13.3333 1.14279Z" stroke="#1D232F" strokeWidth="1.5"/>
                        <path d="M5.71436 1.14279V14.8571" stroke="#1D232F" strokeWidth="1.5"/>
                        <path d="M11.0477 10.2858L8.76196 8.00013L11.0477 5.71442" stroke="#1D232F" strokeWidth="1.5"/>
                      </g>
                      <defs><clipPath id="sdw-sheet-panel-close"><rect width="16" height="16" fill="white"/></clipPath></defs>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <g clipPath="url(#sdw-sheet-panel-open)">
                        <path d="M13.3333 1.14279H2.66663C1.82506 1.14279 1.14282 1.82502 1.14282 2.6666V13.3333C1.14282 14.1748 1.82506 14.8571 2.66663 14.8571H13.3333C14.1749 14.8571 14.8571 14.1748 14.8571 13.3333V2.6666C14.8571 1.82502 14.1749 1.14279 13.3333 1.14279Z" stroke="#1D232F" strokeWidth="1.5"/>
                        <path d="M5.71436 1.14279V14.8571" stroke="#1D232F" strokeWidth="1.5"/>
                        <path d="M8.76189 10.2858L11.0476 8.00013L8.76189 5.71442" stroke="#1D232F" strokeWidth="1.5"/>
                      </g>
                      <defs><clipPath id="sdw-sheet-panel-open"><rect width="16" height="16" fill="white"/></clipPath></defs>
                    </svg>
                  )
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M2 4h12M2 8h12M2 12h12" stroke="#1d232f" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
              <div style={{ width: 1, height: 24, background: 'var(--rd-sys-color-border-divider, #eaedf2)', flexShrink: 0 }} />
              <Button
                ref={scopeBtnRef}
                variant="tertiary"
                size="basic"
                iconPosition="trailing"
                icon={<Icon name="chevron-down" size="s" />}
                onClick={() => {
                  if (hasCanvasScope) { setScopeMenuOpen(o => !o); setScopeSub(null); setScopeSearch(''); return; }
                  setDataModelModalOpen(true);
                }}
                style={{ color: 'var(--rd-sys-color-content-primary, #1d232f)' }}
              >
                {hasCanvasScope ? canvasScopeLabel : activeSourceName}
              </Button>
              {hasCanvasScope && scopeFlyoutMenu}
            </div>
            {/* Full-height divider */}
            <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--rd-sys-color-border-divider, #eaedf2)', flexShrink: 0 }} />
            {/* Title + description + right actions */}
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, paddingRight: edgeToEdge ? 0 : (showSpotter && !spotterOpen ? 16 : 24) }}>
              <div className={styles.sheetExpandedTitleGroup} style={{ flex: 1, minWidth: 0 }}>
                {titleEditing ? (
                  <input
                    ref={titleEditRef}
                    className={styles.sheetExpandedTitleInput}
                    defaultValue={answerTitle}
                    autoFocus
                    onBlur={e => { setTitleEditing(false); setCustomTitle(e.target.value.trim() || computedTitle); }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { setTitleEditing(false); setCustomTitle((e.target as HTMLInputElement).value.trim() || computedTitle); } }}
                  />
                ) : (
                  <span className={styles.sheetExpandedTitle} onClick={() => { setTitleEditing(true); setTimeout(() => titleEditRef.current?.select(), 10); }}>
                    {answerTitle}
                  </span>
                )}
                {!hasCanvasScope && (descEditing ? (
                  <input
                    ref={descEditRef}
                    className={styles.sheetExpandedDescInput}
                    defaultValue={customDesc}
                    autoFocus
                    placeholder="Click to add table description"
                    onBlur={e => { setDescEditing(false); setCustomDesc(e.target.value); }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { setDescEditing(false); setCustomDesc((e.target as HTMLInputElement).value); } }}
                  />
                ) : (
                  <span className={`${styles.sheetExpandedDesc} ${!customDesc ? styles.sheetExpandedDescPlaceholder : ''}`} onClick={() => { setDescEditing(true); setTimeout(() => descEditRef.current?.focus(), 10); }}>
                    {customDesc || 'Click to add table description'}
                  </span>
                ))}
              </div>
              {/* Share + More + divider + Save answer — with canvasScope, Share
                  and Save Answer live inside the three-dot menu instead. */}
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {!hasCanvasScope && (
                  <button className={styles.circleBtn} aria-label="Share" style={{ marginRight: 12 }}>
                    <Icon name="share" size="m" color={systemColors.light['content-primary']} />
                  </button>
                )}
                <div style={{ position: 'relative', marginRight: 16 }}>
                  <button className={styles.circleBtn} aria-label="More options" onClick={e => { e.stopPropagation(); setInlineSheetMoreOpen(o => !o); }}>
                    <Icon name="more" size="m" color={systemColors.light['content-primary']} />
                  </button>
                  <MoreMenu
                    open={inlineSheetMoreOpen}
                    onClose={() => setInlineSheetMoreOpen(false)}
                    onSaveInputTable={openWritebackModal}
                    showShare={hasCanvasScope}
                    onSaveAnswer={hasCanvasScope && !editMode ? openSaveModal : undefined}
                  />
                </div>
                {!hasCanvasScope && !editMode && (
                  <>
                    <div style={{ width: 1, height: 24, background: 'var(--rd-sys-color-border-divider, #eaedf2)', flexShrink: 0, marginRight: 16 }} />
                    <Button variant="secondary" size="basic" onClick={openSaveModal}>Save Answer</Button>
                  </>
                )}
              </div>
            </div>
            {/* SpotterData: 24px from right edge, divider 20px before — direct flex child of sub-header */}
            {showSpotter && !spotterOpen && (
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, paddingRight: 24 }}>
                <div style={{ width: 1, height: 24, background: 'var(--rd-sys-color-border-divider, #eaedf2)', flexShrink: 0, marginRight: 20 }} />
                <button
                  className={styles.spotterIconOnlyBtn}
                  onClick={() => setSpotterOpen(o => !o)}
                  aria-label="Toggle Spotter"
                >
                  <SpotterIcon size="m" aria-hidden />
                </button>
              </div>
            )}
          </div>
          {/* Body: inline flex row — data panel sits as a persistent sidebar, sheet fills remaining space */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'row' }}>
          {sheetDataPanelOpen && (
            <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--rd-sys-color-border-divider, #eaedf2)', overflowY: 'auto' }}>
              <SheetDataPanel
                // Optimized: both the checkbox state and the sheet's columns
                // read/write this one set (sheetColKeys), so they can't drift
                // apart. Every other option keeps activeCols/toggleColumn.
                selectedKeys={hasCanvasScope ? sheetColKeys : activeCols}
                onToggle={colId => hasCanvasScope ? toggleSheetColKey(colId) : toggleColumn(colId)}
                importedCsvGroups={importedCsvGroups}
                savedInputTables={savedInputTables}
                activeInputTable={activeInputTable}
                style={{ border: 'none', height: '100%' }}
                sections={hasCanvasScope ? dynamicSheetPanelSections : undefined}
                useColorChips={hasCanvasScope}
              />
            </div>
          )}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SheetView
              columns={displayColumns}
              rows={displayData}
              title={answerTitle}
              description={customDesc}
              onTitleChange={v => setCustomTitle(v)}
              onDescChange={v => setCustomDesc(v)}
              expanded={false}
              onExpandedChange={() => {}}
              sheetDataView={sheetDataView}
              onSheetDataViewChange={setSheetDataView}
              hideExpandButton
              emptyMode={hasCanvasScope ? sheetColKeys.size === 0 : (!hasQuery && !isAnswerLoading)}
              // canvasScope: omitted on purpose. The sheetColKeys effect above
              // is the ONLY writer of pendingQuery in this mode — routing the
              // sheet's internal picker here as a second writer is what kept
              // producing races that clobbered the selection.
              onColumnsChange={hasCanvasScope ? undefined : handleSheetColumnsChange}
              externalLoading={false}
              onOpenInSearchData={() => onOpenInSearchData?.(buildSnapshot('search'))}
              initialFormulaCols={parentFormulaCols}
              initialFormulaValues={parentFormulaValues}
              onFormulaChange={(cols, vals) => { setParentFormulaCols(cols); setParentFormulaValues(vals); }}
              onOpenDataModel={() => setDataModelModalOpen(true)}
              onOpenSaveModal={openSaveModal}
              onOpenWritebackModal={openWritebackModal}
              importedCsvGroups={importedCsvGroups}
              onImportCsv={(csvName, cols) => setImportedCsvGroups(g => [...g, { csvName, cols }])}
              activeSourceName={activeSourceName}
              style={{ border: 'none', borderRadius: 0 }}
              dataModelCols={hasCanvasScope ? dynamicDataModelCols : undefined}
              canAddFormula={!canvasScope || canvasScope.scope === 'model'}
              canvasScopeMode={hasCanvasScope}
              controlledColKeys={hasCanvasScope ? sheetColKeys : undefined}
            />
          </div>
          </div>
        </div>
      ) : version === 'minimal' ? (

      // ── Minimal search layout — spreadsheet-inspired grid ───────────────
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>

        {/* Sub-header 60px: hamburger+source | search bar | actions */}
        <div
          style={{
            height: 60, flexShrink: 0, display: 'flex', alignItems: 'center',
            borderBottom: '1px solid var(--rd-sys-color-border-divider, #EAEDF2)',
            background: '#fff',
            position: 'relative', zIndex: (searchFocused || isDirty) ? 110 : 'auto',
          }}
        >
          {/* Left section: hamburger + vdivider + source — always 260px wide */}
          <div style={{
            width: 260, flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px 0 24px',
          }}>
            <button
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}
              aria-label="Toggle data panel"
              onClick={e => { e.stopPropagation(); setDataPanelVisible(v => !v); }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 4h12M2 8h12M2 12h12" stroke="#1d232f" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
            <div style={{ width: 1, height: 24, background: 'var(--rd-sys-color-border-divider, #EAEDF2)', flexShrink: 0 }} />
            <Button
              variant="tertiary"
              size="basic"
              iconPosition="trailing"
              icon={<Icon name="chevron-down" size="s" />}
              onClick={() => setDataModelModalOpen(true)}
              style={{ color: 'var(--rd-sys-color-content-primary, #1d232f)' }}
            >
              {activeSourceName}
            </Button>
          </div>

          {/* Full-height divider between left section and search area */}
          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--rd-sys-color-border-divider, #EAEDF2)', flexShrink: 0 }} />

          {/* Search area — fills remaining width */}
          <div
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', height: '100%', cursor: 'text' }}
            onClick={() => { setSearchFocused(true); setBarActive(true); barInputRef.current?.focus(); }}
          >
            <Icon name="search" size="s" color={systemColors.light['content-secondary']} />
            <div className={styles.searchTokens}>
              {searchTokens.map(token => (
                <DataToken
                  key={`${token.id}-${tokenResetKey}`}
                  label={token.label}
                  type={token.type as TokenType}
                  onReplace={col => handleReplaceToken(token.id, col)}
                  onEditStart={() => { editingTokenRef.current = true; setSearchFocused(true); setBarActive(false); }}
                  onEditEnd={() => { editingTokenRef.current = false; }}
                />
              ))}
            </div>
            {barActive && (
              <span style={{ position: 'relative', display: 'inline-flex', flex: 1 }}>
                <input
                  ref={barInputRef}
                  className={styles.barTypeInput}
                  value={barTypedValue}
                  autoFocus
                  placeholder={!searchTokens.length ? 'Type to search columns…' : ''}
                  onChange={e => setBarTypedValue(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    if (e.key === 'Escape') { setSearchFocused(false); setBarActive(false); setBarTypedValue(''); }
                    if (e.key === 'Enter') { handleGo(); }
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setBarActive(false); setBarTypedValue('');
                      if (!editingTokenRef.current) setSearchFocused(false);
                    }, 150);
                  }}
                />
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: 280, zIndex: 300 }}>
                  <SearchTypeahead query={barTypedValue} onSelect={col => { toggleColumn(col.id); setBarTypedValue(''); barInputRef.current?.focus(); }} />
                </div>
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }} onClick={e => e.stopPropagation()}>
              {(searchFocused || hasPending || hasQuery || isAnswerLoading) && (
                <button className={styles.iconBtn} aria-label="Clear search"
                  onMouseDown={e => {
                    e.preventDefault();
                    setPendingQuery(EMPTY_QUERY); setQueryState(EMPTY_QUERY); setCanvasBlocks([]); setChecked(new Set());
                    setTokenResetKey(k => k + 1); setBarTypedValue(''); setIsDirty(false); setBarActive(false);
                    handleStop(); setSearchFocused(false);
                  }}
                >
                  <Icon name="cross" size="s" color={systemColors.light['content-secondary']} />
                </button>
              )}
              <GoStopButton
                state={isTransitioning ? 'stopping' : isAnswerLoading ? 'loading' : (searchFocused || isDirty) ? 'focused' : 'idle'}
                onGo={handleGo} onStop={handleStop}
              />
              <div style={{ width: 1, height: 24, background: 'var(--rd-sys-color-border-divider, #EAEDF2)', flexShrink: 0, margin: '0 4px' }} />
              <button className={styles.iconBtn} aria-label="Undo"><Icon name="arrow-left" size="m" color={systemColors.light['content-primary']} /></button>
              <button className={styles.iconBtn} aria-label="Redo"><Icon name="arrow-right" size="m" color={systemColors.light['content-primary']} /></button>
              <button className={styles.iconBtn} aria-label="Reset"><Icon name="reset" size="m" color={systemColors.light['content-primary']} /></button>
            </div>
          </div>
          {/* SpotterData: 24px from right edge, divider 20px before */}
          {showSpotter && !spotterOpen && (
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, paddingRight: 24 }} onClick={e => e.stopPropagation()}>
              <div style={{ width: 1, height: 24, background: 'var(--rd-sys-color-border-divider, #EAEDF2)', flexShrink: 0, marginRight: 20 }} />
              <button
                className={styles.spotterIconOnlyBtn}
                onClick={e => { e.stopPropagation(); setSpotterOpen(o => !o); }}
                aria-label="Toggle Spotter"
              >
                <SpotterIcon size="l" aria-hidden />
              </button>
            </div>
          )}
        </div>

        {/* Pending-query overlay — fires query on click */}
        {(searchFocused || isDirty) && (
          <div className={styles.searchFocusOverlay} onMouseDown={e => e.preventDefault()} onClick={handleGo} />
        )}

        {/* Body row: optional data panel + answer edge-to-edge */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {dataPanelVisible && (
            <>
              <div style={{
                width: 260, flexShrink: 0,
                position: 'relative', zIndex: (searchFocused || isDirty) ? 60 : 'auto',
                overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%',
                background: '#fff',
              }}>
                {/* Search + Add */}
                <div className={styles.panelSearch}>
                  <SearchInput placeholder="Search" className={styles.dataPanelSearchInputCompact} />
                  <Button variant="tertiary" size="small" icon="plus" iconPosition="leading">Add</Button>
                </div>
                {/* Expandable column sections — same as current UI */}
                <div className={styles.columnSections}>
                  {SECTIONS.map(section => (
                    <div key={section.id}>
                      <button className={styles.sectionHeader} onClick={() => toggleSection(section.id)}>
                        <Icon name={expanded.has(section.id) ? 'chevron-down' : 'chevron-right'} size="m" color={systemColors.light['content-secondary']} />
                        <Typography variant="content-label" as="span">{section.label}</Typography>
                        {section.id === 'formulas' && parentFormulaCols.length > 0 && (
                          <span className={styles.formulaSectionBadge}>{parentFormulaCols.length}</span>
                        )}
                      </button>
                      {section.kind === 'expandable' && expanded.has(section.id) && section.columns.map(col => (
                        <div key={col.id} className={`${styles.columnItem} ${activeCols.has(col.id) ? styles.columnItemActive : ''}`} onClick={() => toggleColumn(col.id)}>
                          <Checkbox checked={checked.has(col.id) || activeCols.has(col.id)} onChange={() => toggleColumn(col.id)} showLabel={false} />
                          <DataToken label={col.label} type={col.type} variant="panel" />
                        </div>
                      ))}
                      {section.id === 'formulas' && expanded.has('formulas') && (
                        parentFormulaCols.length === 0 ? (
                          <div className={styles.formulaSectionEmpty}>No formulas yet</div>
                        ) : (
                          parentFormulaCols.map(f => (
                            <div key={f.key} className={`${styles.columnItem} ${activeCols.has(f.key) ? styles.columnItemActive : ''}`}>
                              <Checkbox checked={activeCols.has(f.key)} onChange={() => {}} showLabel={false} />
                              <DataToken label={f.name} type="measure" variant="panel" />
                            </div>
                          ))
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--rd-sys-color-border-divider, #EAEDF2)', flexShrink: 0 }} />
            </>
          )}

          {/* Answer area — edge-to-edge, no padding */}
          <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
            {answerContent}
          </div>
        </div>

      </div>

      ) : (
      <>

        {/* ── Pending-query overlay ───────────────────────────────────────
            Shows whenever there are uncommitted tokens (search bar focused
            OR data panel checkbox toggled but Go not yet clicked).
            Covers the full leftContent area (header-bottom → screen-bottom).
            z-index 50: above chart, below data panel (60) and query bar (110).
            Clicking fires the query — same as pressing Go.                  */}
        {(searchFocused || isDirty) && (
          <div
            className={styles.searchFocusOverlay}
            onMouseDown={e => e.preventDefault()}
            onClick={() => { handleGo(); }}
          />
        )}

      {/* ── Title sub-header (canvasScope only) ─────────────────────────
          Mirrors the Spreadsheet sub-header (same 40px height, same 260px
          left column + full-height divider) so the two line up when
          switching tabs. Holds the panel toggle + Table/Join/Model selector
          (moved out of the query bar's left section) and the answer title +
          ⋯ menu (moved out of the answer card's heading). The query bar now
          renders below this, inside the content column. */}
      {hasCanvasScope && (
        <div style={{
          display: 'flex', alignItems: 'center', height: 40, flexShrink: 0,
          borderBottom: '1px solid var(--rd-sys-color-border-divider, #EAEDF2)',
          background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 260, flexShrink: 0, padding: edgeToEdge ? 0 : '0 8px 0 24px', position: 'relative' }}>
            <button
              className={styles.iconBtn}
              aria-label="Toggle data panel"
              onClick={() => setDataPanelVisible(v => !v)}
            >
              {dataPanelVisible ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <g clipPath="url(#sdw-qhdr-panel-close)">
                    <path d="M13.3333 1.14279H2.66663C1.82506 1.14279 1.14282 1.82502 1.14282 2.6666V13.3333C1.14282 14.1748 1.82506 14.8571 2.66663 14.8571H13.3333C14.1749 14.8571 14.8571 14.1748 14.8571 13.3333V2.6666C14.8571 1.82502 14.1749 1.14279 13.3333 1.14279Z" stroke="#1D232F" strokeWidth="1.5"/>
                    <path d="M5.71436 1.14279V14.8571" stroke="#1D232F" strokeWidth="1.5"/>
                    <path d="M11.0477 10.2858L8.76196 8.00013L11.0477 5.71442" stroke="#1D232F" strokeWidth="1.5"/>
                  </g>
                  <defs><clipPath id="sdw-qhdr-panel-close"><rect width="16" height="16" fill="white"/></clipPath></defs>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <g clipPath="url(#sdw-qhdr-panel-open)">
                    <path d="M13.3333 1.14279H2.66663C1.82506 1.14279 1.14282 1.82502 1.14282 2.6666V13.3333C1.14282 14.1748 1.82506 14.8571 2.66663 14.8571H13.3333C14.1749 14.8571 14.8571 14.1748 14.8571 13.3333V2.6666C14.8571 1.82502 14.1749 1.14279 13.3333 1.14279Z" stroke="#1D232F" strokeWidth="1.5"/>
                    <path d="M5.71436 1.14279V14.8571" stroke="#1D232F" strokeWidth="1.5"/>
                    <path d="M8.76189 10.2858L11.0476 8.00013L8.76189 5.71442" stroke="#1D232F" strokeWidth="1.5"/>
                  </g>
                  <defs><clipPath id="sdw-qhdr-panel-open"><rect width="16" height="16" fill="white"/></clipPath></defs>
                </svg>
              )}
            </button>
            <div style={{ width: 1, height: 24, background: 'var(--rd-sys-color-border-divider, #eaedf2)', flexShrink: 0 }} />
            <Button
              ref={scopeBtnRef}
              variant="tertiary"
              size="basic"
              iconPosition="trailing"
              icon={<Icon name="chevron-down" size="s" color="var(--rd-sys-color-content-secondary, #596278)" />}
              onClick={() => { setScopeMenuOpen(o => !o); setScopeSub(null); setScopeSearch(''); }}
              style={{ color: 'var(--rd-sys-color-content-primary, #1d232f)' }}
            >
              {canvasScopeLabel}
            </Button>
            {scopeFlyoutMenu}
          </div>
          {/* Full-height divider */}
          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--rd-sys-color-border-divider, #eaedf2)', flexShrink: 0 }} />
          {/* Title + ⋯ */}
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, paddingRight: edgeToEdge ? 0 : 24 }}>
            <div className={styles.sheetExpandedTitleGroup} style={{ flex: 1, minWidth: 0 }}>
              {hasQuery && (titleEditing ? (
                <input
                  ref={titleEditRef}
                  className={styles.sheetExpandedTitleInput}
                  defaultValue={answerTitle}
                  autoFocus
                  onBlur={e => { setTitleEditing(false); setCustomTitle(e.target.value.trim() || computedTitle); }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { setTitleEditing(false); setCustomTitle((e.target as HTMLInputElement).value.trim() || computedTitle); } }}
                />
              ) : (
                <span className={styles.sheetExpandedTitle} onClick={() => { setTitleEditing(true); setTimeout(() => titleEditRef.current?.select(), 10); }}>
                  {answerTitle}
                </span>
              ))}
            </div>
            <div style={{ position: 'relative', flexShrink: 0, marginRight: 16 }}>
              <button className={styles.circleBtn} aria-label="More options" onClick={e => { e.stopPropagation(); setAnswerMoreOpen(o => !o); }}>
                <Icon name="more" size="m" color={systemColors.light['content-primary']} />
              </button>
              <MoreMenu open={answerMoreOpen} onClose={() => setAnswerMoreOpen(false)}
                variant="answerCard"
                onSave={openSaveModal}
                showShare
                showPin={!editMode}
                pinDisabled={queryState.viewMode === 'sheet'}
              />
            </div>
          </div>
        </div>
      )}

      {!hasCanvasScope && queryBarBlock}

      {/* ── Main content ───────────────────────────────────────────────
          Padding: 20px top (gap from query bar), 24px left/right/bottom.
          Gap between data panel and chart container: 20px.              */}
      <div className={styles.main} style={{ ...(edgeToEdge ? { padding: 0 } : {}), ...(hasCanvasScope ? { gap: 0 } : {}) }}>

        {(<>
        {/* ── Data panel — hidden when hamburger toggled off ──── */}
        {<aside
          className={`${styles.dataPanel}${dataPanelVisible ? '' : ` ${styles.dataPanelHidden}`}${compactPanelSearch ? ` ${styles.densePanel}` : ''}`}
          style={{
            // Flat column with a single right divider (no card radius/shadow)
            // so it sits flush against the content column.
            ...(hasCanvasScope ? { borderRadius: 0, boxShadow: 'none', borderRight: '1px solid var(--rd-sys-color-border-divider, #EAEDF2)' } : {}),
            ...((searchFocused || isDirty) ? { position: 'relative' as const, zIndex: 60 } : {}),
          }}
        >
          {/* Header: Label / All tabs + layout toggle */}
          {!hideColumnPanelTabs && (
          <div className={styles.panelHeaderRow}>
            <Tabs
              tabs={[
                { id: 'popular', label: 'Popular' },
                { id: 'all', label: 'All' },
              ]}
              activeTab={panelTab}
              onTabChange={setPanelTab}
              className={styles.panelTabs}
            />
            <button className={styles.iconBtn} aria-label="Toggle right panel" onClick={() => setColDetailOpen(v => !v)}>
              {colDetailIconStyle === 'b' ? (
                // Icon B — circle info + directional arrow (right to open, left to close)
                colDetailOpen ? (
                  <svg width="19" height="14" viewBox="0 0 19 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M6.22222 6.22222H7.77778V10.8889H6.22222V6.22222Z" fill="#2770ef"/>
                    <path d="M6.22222 3.11111H7.77778V4.66667H6.22222V3.11111Z" fill="#2770ef"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14ZM7 12.4444C10.0069 12.4444 12.4444 10.0069 12.4444 7C12.4444 3.99312 10.0069 1.55556 7 1.55556C3.99312 1.55556 1.55556 3.99312 1.55556 7C1.55556 10.0069 3.99312 12.4444 7 12.4444Z" fill="#2770ef"/>
                    <path d="M18.0001 9.28566L15.7144 6.99995L18.0001 4.71423" stroke="#2770ef" strokeWidth="1.5"/>
                  </svg>
                ) : (
                  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M6.22222 6.22222H7.77778V10.8889H6.22222V6.22222Z" fill="#1D232F"/>
                    <path d="M6.22222 3.11111H7.77778V4.66667H6.22222V3.11111Z" fill="#1D232F"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14ZM7 12.4444C10.0069 12.4444 12.4444 10.0069 12.4444 7C12.4444 3.99312 10.0069 1.55556 7 1.55556C3.99312 1.55556 1.55556 3.99312 1.55556 7C1.55556 10.0069 3.99312 12.4444 7 12.4444Z" fill="#1D232F"/>
                    <path d="M15.7144 9.28566L18.0001 6.99995L15.7144 4.71423" stroke="#1D232F" strokeWidth="1.5"/>
                  </svg>
                )
              ) : (
                // Icon A — box info bar + chevron
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <g clipPath="url(#sdw-coldetail-icon)">
                    <path d="M13.3333 1.14282H2.66666C1.82509 1.14282 1.14285 1.82506 1.14285 2.66663V13.3333C1.14285 14.1749 1.82509 14.8571 2.66666 14.8571H13.3333C14.1749 14.8571 14.8571 14.1749 14.8571 13.3333V2.66663C14.8571 1.82506 14.1749 1.14282 13.3333 1.14282Z" stroke={colDetailOpen ? '#2770ef' : '#1D232F'} strokeWidth="1.5"/>
                    <path d="M4.75897 7.2222H6.31453V11.8889H4.75897V7.2222Z" fill={colDetailOpen ? '#2770ef' : '#1D232F'}/>
                    <path d="M4.75897 4.11108H6.31453V5.66664H4.75897V4.11108Z" fill={colDetailOpen ? '#2770ef' : '#1D232F'}/>
                    <path d="M9.37124 10.2857L11.657 7.99995L9.37124 5.71423" stroke={colDetailOpen ? '#2770ef' : '#1D232F'} strokeWidth="1.5"/>
                  </g>
                  <defs><clipPath id="sdw-coldetail-icon"><rect width="16" height="16" fill="white"/></clipPath></defs>
                </svg>
              )}
            </button>
          </div>
          )}

          {/* Search + Add */}
          <div className={`${styles.panelSearch}${compactPanelSearch ? ` ${styles.panelSearchCompact}` : ''}`}>
            <SearchInput
              placeholder="Search"
              className={`${styles.dataPanelSearchInputCompact}${compactPanelSearch ? ` ${styles.dataPanelSearchInputFlex}` : ''}`}
            />
            {compactPanelSearch ? (
              <div style={{ position: 'relative' }}>
                <button
                  ref={addMenuBtnRef}
                  className={styles.iconBtn}
                  aria-label="Add"
                  onClick={() => hasCanvasScope ? setAddMenuOpen(o => !o) : undefined}
                >
                  <Icon name="plus" size="s" color={systemColors.light['content-secondary']} />
                </button>
                {hasCanvasScope && addFlyoutMenuOptimized}
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <Button
                  ref={addMenuBtnRef}
                  variant="tertiary"
                  size="small"
                  icon="plus"
                  iconPosition="leading"
                  onClick={() => hasCanvasScope ? setAddMenuOpen(o => !o) : undefined}
                >
                  Add
                </Button>
                {hasCanvasScope && addFlyoutMenu}
              </div>
            )}
          </div>

          {/* Expandable column sections */}
          <div className={styles.columnSections}>
            {(hasCanvasScope ? dynamicSections : SECTIONS).map(section => (
              <div key={section.id}>
                <button
                  className={styles.sectionHeader}
                  onClick={() => toggleSection(section.id)}
                >
                  <Icon
                    name={expanded.has(section.id) ? 'chevron-down' : 'chevron-right'}
                    size="m"
                    color={systemColors.light['content-primary']}
                  />
                  <Typography variant="content-label" as="span">
                    {section.label}
                  </Typography>
                  {/* Formula count badge */}
                  {section.id === 'formulas' && parentFormulaCols.length > 0 && (
                    <span className={styles.formulaSectionBadge}>{parentFormulaCols.length}</span>
                  )}
                </button>

                {section.kind === 'expandable' &&
                  expanded.has(section.id) &&
                  section.columns.map(col => (
                    <div
                      key={col.id}
                      className={`${styles.columnItem} ${activeCols.has(col.id) ? styles.columnItemActive : ''}`}
                      onClick={() => setSelectedColDetail({ id: col.id, label: col.label, type: col.type })}
                    >
                      <span
                        className={alignColumnCheckboxes ? styles.columnItemCellAlign : undefined}
                        onClick={e => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={checked.has(col.id) || activeCols.has(col.id)}
                          onChange={() => toggleColumn(col.id)}
                          showLabel={false}
                        />
                      </span>
                      <span
                        className={alignColumnCheckboxes ? styles.columnItemCellAlign : undefined}
                        onClick={e => { e.stopPropagation(); toggleColumn(col.id); }}
                      >
                        <DataToken label={col.label} type={col.type} variant="panel" />
                      </span>
                    </div>
                  ))}

                {/* Dynamic formula columns — shown when Formulas section is expanded */}
                {section.id === 'formulas' && expanded.has('formulas') && (
                  parentFormulaCols.length === 0 ? (
                    <div className={styles.formulaSectionEmpty}>No formulas yet</div>
                  ) : (
                    parentFormulaCols.map(f => (
                      <div key={f.key} className={`${styles.columnItem} ${activeCols.has(f.key) ? styles.columnItemActive : ''}`}>
                        <Checkbox
                          checked={activeCols.has(f.key)}
                          onChange={() => {}}
                          showLabel={false}
                        />
                        <DataToken label={f.name} type="measure" variant="panel" />
                      </div>
                    ))
                  )
                )}
              </div>
            ))}
          </div>
        </aside>}

        {/* ── Column detail panel — absolute overlay over answer area ── */}
        {colDetailOpen && (
          <div style={{ position: 'absolute', left: 284, top: 20, bottom: 24, width: 480, background: '#fff', borderRadius: 4, boxShadow: '0 0 0 1px rgba(25,35,49,0.08), 0 4px 16px rgba(25,35,49,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 10 }}>
            {selectedColDetail ? (
              <>
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--rd-sys-color-border-divider, #eaedf2)' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--rd-sys-color-content-primary, #1d232f)', marginBottom: 4 }}>{selectedColDetail.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--rd-sys-color-content-secondary, #777e8b)' }}>
                    {selectedColDetail.type === 'measure' ? 'Measure · INT64' : selectedColDetail.type === 'attribute' ? 'Attribute · VARCHAR' : selectedColDetail.type === 'date' ? 'Date · DATETIME' : selectedColDetail.type.charAt(0).toUpperCase() + selectedColDetail.type.slice(1)}
                  </div>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '1px solid var(--rd-sys-color-border-divider, #eaedf2)' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rd-sys-color-content-primary, #1d232f)' }}>Description: </span>
                    <span style={{ fontSize: 13, color: 'var(--rd-sys-color-content-secondary, #777e8b)' }}>Not provided</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rd-sys-color-content-primary, #1d232f)' }}>Synonyms: </span>
                    <span style={{ fontSize: 13, color: 'var(--rd-sys-color-content-secondary, #777e8b)' }}>Not provided</span>
                  </div>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rd-sys-color-content-primary, #1d232f)', marginBottom: 8 }}>Top Answers created using {selectedColDetail.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--rd-sys-color-content-secondary, #777e8b)' }}>No Answers have been created with "{selectedColDetail.label}"</div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8, textAlign: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}><circle cx="12" cy="12" r="10" stroke="#777e8b" strokeWidth="1.5"/><path d="M12 7v5l3 3" stroke="#777e8b" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <div style={{ fontSize: 13, color: 'var(--rd-sys-color-content-secondary, #777e8b)' }}>Select a column to see its details</div>
              </div>
            )}
          </div>
        )}

        {/* ── Empty state OR answer card ──────────────────────────── */}
        {hasCanvasScope ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            {queryBarBlock}
            {answerContent}
          </div>
        ) : answerContent}
        </>)}
      </div>{/* end .main */}

      </>
      )}{/* end sheet/search conditional */}

      </div>{/* end leftContent */}

      {/* ── SpotterData panel — persists across sheet and search modes ── */}
      {showSpotter && spotterOpen && (
        <SpotterDataPanel
          onClose={() => setSpotterOpen(false)}
          onAction={handleSpotterAction}
          queryState={queryState}
          messages={spotterMessages}
          setMessages={setSpotterMessages}
          isTyping={spotterTyping}
          setIsTyping={setSpotterTyping}
	          isDirty={isDirty}
	          setIsDirty={setIsDirty}
	          onCreateVersionSnapshot={createSpotterVersionSnapshot}
	          onRestoreVersion={restoreSpotterVersion}
	          editMode={editMode}
	          liveboardName={liveboardName}
	        />
      )}

      </div>{/* end bodyRow */}
    </div>{/* end root inner wrapper */}
      </div>
    </div>
  );
};
